import { nanoid } from "nanoid";

import type { CombatState } from "../schemas/combat-state";
import type { EnemyState } from "../schemas/entities";
import {
  applyBonusDamageIfPlayerDebuffed,
  applyNextTurnCardCostIncrease,
  healEnemy,
  summonEnemyIfPossible,
} from "./boss-mechanics/shared";
import type { EffectTarget } from "./effects";
import type { RNG } from "./rng";

const FLAG_PREFIX = "koschei_deathless";
const STAGE_KEY = `${FLAG_PREFIX}_stage`;
const RESEAL_PENDING_KEY = `${FLAG_PREFIX}_reseal_pending`;
const RESEAL_USED_KEY = `${FLAG_PREFIX}_reseal_used`;

export type KoscheiStage = "CHEST" | "EGG" | "NEEDLE" | "BROKEN";

export interface KoscheiUiState {
  phaseTwo: boolean;
  mortal: boolean;
  stage: KoscheiStage;
  currentVesselId: string | null;
  resealPending: boolean;
  resealUsed: boolean;
}

interface VesselConfig {
  definitionId: string;
  name: string;
  maxHp: number;
  speed: number;
  resealHp: number;
}

const VESSEL_CONFIG_BY_STAGE: Record<
  Exclude<KoscheiStage, "BROKEN">,
  VesselConfig
> = {
  CHEST: {
    definitionId: "koschei_bone_chest",
    name: "Bone Chest",
    maxHp: 24,
    speed: 1,
    resealHp: 16,
  },
  EGG: {
    definitionId: "koschei_black_egg",
    name: "Black Egg",
    maxHp: 18,
    speed: 3,
    resealHp: 12,
  },
  NEEDLE: {
    definitionId: "koschei_hidden_needle",
    name: "Hidden Needle",
    maxHp: 12,
    speed: 7,
    resealHp: 12,
  },
};

function isKoscheiEnemy(
  enemy: Pick<EnemyState, "definitionId" | "currentHp"> | null | undefined
): enemy is Pick<EnemyState, "definitionId" | "currentHp"> {
  return Boolean(enemy && enemy.definitionId === "koschei_deathless");
}

function sanitizeFlag(value: number | undefined, fallback: number): number {
  return Math.max(0, Math.floor(value ?? fallback));
}

function clampStageIndex(value: number): number {
  return Math.min(3, Math.max(0, value));
}

function withDefaultMechanicFlags(
  flags: Record<string, number> | undefined
): Record<string, number> {
  return {
    ...(flags ?? {}),
    [STAGE_KEY]: clampStageIndex(sanitizeFlag(flags?.[STAGE_KEY], 0)),
    [RESEAL_PENDING_KEY]: sanitizeFlag(flags?.[RESEAL_PENDING_KEY], 0),
    [RESEAL_USED_KEY]: sanitizeFlag(flags?.[RESEAL_USED_KEY], 0),
  };
}

function getFlag(enemy: EnemyState, key: string): number {
  return sanitizeFlag(withDefaultMechanicFlags(enemy.mechanicFlags)[key], 0);
}

function setFlag(enemy: EnemyState, key: string, value: number): EnemyState {
  return {
    ...enemy,
    mechanicFlags: {
      ...withDefaultMechanicFlags(enemy.mechanicFlags),
      [key]: sanitizeFlag(value, 0),
    },
  };
}

function updateKoschei(
  state: CombatState,
  updater: (enemy: EnemyState) => EnemyState
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) => {
      if (!isKoscheiEnemy(enemy)) return enemy;
      return updater({
        ...enemy,
        mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
      });
    }),
  };
}

function getKoscheiEnemy(state: CombatState): EnemyState | null {
  const koschei = state.enemies.find(isKoscheiEnemy);
  if (!koschei) return null;
  return {
    ...koschei,
    mechanicFlags: withDefaultMechanicFlags(koschei.mechanicFlags),
  };
}

function getStageByIndex(index: number): KoscheiStage {
  switch (index) {
    case 1:
      return "EGG";
    case 2:
      return "NEEDLE";
    case 3:
      return "BROKEN";
    default:
      return "CHEST";
  }
}

function getStageIndex(stage: KoscheiStage): number {
  switch (stage) {
    case "EGG":
      return 1;
    case "NEEDLE":
      return 2;
    case "BROKEN":
      return 3;
    default:
      return 0;
  }
}

function getNextStage(stage: Exclude<KoscheiStage, "BROKEN">): KoscheiStage {
  switch (stage) {
    case "CHEST":
      return "EGG";
    case "EGG":
      return "NEEDLE";
    case "NEEDLE":
      return "BROKEN";
    default:
      return "BROKEN";
  }
}

export function isKoscheiPhaseTwo(enemy: EnemyState): boolean {
  return getFlag(enemy, `${FLAG_PREFIX}_phase2`) > 0;
}

export function getKoscheiStage(enemy: EnemyState): KoscheiStage {
  return getStageByIndex(getFlag(enemy, STAGE_KEY));
}

function getCurrentVesselConfig(enemy: EnemyState): VesselConfig | null {
  const stage = getKoscheiStage(enemy);
  if (stage === "BROKEN") return null;
  return VESSEL_CONFIG_BY_STAGE[stage];
}

function findLivingEnemyByDefinitionId(
  state: CombatState,
  definitionId: string
): EnemyState | null {
  return (
    state.enemies.find(
      (enemy) => enemy.definitionId === definitionId && enemy.currentHp > 0
    ) ?? null
  );
}

function hasAnyKnownVessel(state: CombatState): boolean {
  return state.enemies.some(
    (enemy) =>
      enemy.definitionId === VESSEL_CONFIG_BY_STAGE.CHEST.definitionId ||
      enemy.definitionId === VESSEL_CONFIG_BY_STAGE.EGG.definitionId ||
      enemy.definitionId === VESSEL_CONFIG_BY_STAGE.NEEDLE.definitionId
  );
}

function pruneDeadKoscheiVessels(state: CombatState): CombatState {
  return {
    ...state,
    enemies: state.enemies.filter(
      (enemy) =>
        enemy.currentHp > 0 ||
        !(
          enemy.definitionId === VESSEL_CONFIG_BY_STAGE.CHEST.definitionId ||
          enemy.definitionId === VESSEL_CONFIG_BY_STAGE.EGG.definitionId ||
          enemy.definitionId === VESSEL_CONFIG_BY_STAGE.NEEDLE.definitionId
        )
    ),
  };
}

function spawnVessel(
  state: CombatState,
  stage: Exclude<KoscheiStage, "BROKEN">,
  hpOverride?: number
): CombatState {
  const current = pruneDeadKoscheiVessels(state);
  const config = VESSEL_CONFIG_BY_STAGE[stage];
  if (findLivingEnemyByDefinitionId(current, config.definitionId)) {
    return current;
  }
  if (current.enemies.length >= 4) return current;

  return {
    ...current,
    enemies: [
      ...current.enemies,
      {
        instanceId: nanoid(),
        definitionId: config.definitionId,
        name: config.name,
        currentHp: Math.min(config.maxHp, hpOverride ?? config.maxHp),
        maxHp: config.maxHp,
        block: 0,
        mechanicFlags: {},
        speed: config.speed,
        buffs: [],
        intentIndex: 0,
      },
    ],
  };
}

function enforceKoscheiImmortality(state: CombatState): CombatState {
  const koschei = getKoscheiEnemy(state);
  if (!koschei) return state;
  if (getKoscheiStage(koschei) === "BROKEN" || koschei.currentHp > 0) {
    return state;
  }

  return updateKoschei(state, (enemy) => ({
    ...enemy,
    currentHp: 1,
    block: 0,
  }));
}

function hasCurrentVessel(state: CombatState, enemy: EnemyState): boolean {
  const config = getCurrentVesselConfig(enemy);
  if (!config) return false;
  return findLivingEnemyByDefinitionId(state, config.definitionId) != null;
}

function resealCurrentVessel(state: CombatState): CombatState {
  const koschei = getKoscheiEnemy(state);
  if (!koschei) return state;
  const stage = getKoscheiStage(koschei);
  if (stage === "BROKEN") return state;

  let current = spawnVessel(
    state,
    stage,
    VESSEL_CONFIG_BY_STAGE[stage].resealHp
  );
  current = updateKoschei(current, (enemy) => {
    let next = setFlag(enemy, RESEAL_PENDING_KEY, 0);
    next = setFlag(next, RESEAL_USED_KEY, 1);
    return next;
  });
  return current;
}

function advanceKoscheiVesselState(state: CombatState): CombatState {
  const koschei = getKoscheiEnemy(state);
  if (!koschei) return state;

  const stage = getKoscheiStage(koschei);
  if (stage === "BROKEN") return state;
  if (hasCurrentVessel(state, koschei)) return state;
  if (getFlag(koschei, RESEAL_PENDING_KEY) > 0) return state;

  if (
    stage !== "NEEDLE" &&
    isKoscheiPhaseTwo(koschei) &&
    getFlag(koschei, RESEAL_USED_KEY) <= 0
  ) {
    return updateKoschei(state, (enemy) => {
      let next = setFlag(enemy, RESEAL_PENDING_KEY, 1);
      next = setFlag(next, RESEAL_USED_KEY, 1);
      return next;
    });
  }

  if (stage === "NEEDLE") {
    return updateKoschei(state, (enemy) =>
      setFlag(
        setFlag(enemy, STAGE_KEY, getStageIndex("BROKEN")),
        RESEAL_PENDING_KEY,
        0
      )
    );
  }

  const nextStage = getNextStage(stage);
  if (nextStage === "BROKEN") {
    return updateKoschei(state, (enemy) =>
      setFlag(enemy, STAGE_KEY, getStageIndex(nextStage))
    );
  }

  const current = spawnVessel(state, nextStage);
  if (
    !findLivingEnemyByDefinitionId(
      current,
      VESSEL_CONFIG_BY_STAGE[nextStage].definitionId
    )
  ) {
    return state;
  }

  return updateKoschei(current, (enemy) =>
    setFlag(enemy, STAGE_KEY, getStageIndex(nextStage))
  );
}

export function getKoscheiUiState(
  enemy: EnemyState | null | undefined
): KoscheiUiState | null {
  if (!enemy) return null;
  const koschei = {
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  };
  if (!isKoscheiEnemy(koschei)) return null;

  const stage = getKoscheiStage(koschei);
  const config = getCurrentVesselConfig(koschei);

  return {
    phaseTwo: isKoscheiPhaseTwo(koschei),
    mortal: stage === "BROKEN",
    stage,
    currentVesselId: config?.definitionId ?? null,
    resealPending: getFlag(koschei, RESEAL_PENDING_KEY) > 0,
    resealUsed: getFlag(koschei, RESEAL_USED_KEY) > 0,
  };
}

export function initializeKoscheiCombat(state: CombatState): CombatState {
  const koschei = getKoscheiEnemy(state);
  if (!koschei) return state;

  let current = updateKoschei(state, (enemy) => ({
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  }));

  if (
    getKoscheiStage(koschei) === "CHEST" &&
    !hasAnyKnownVessel(current) &&
    !hasCurrentVessel(current, koschei)
  ) {
    current = spawnVessel(current, "CHEST");
  }

  return current;
}

export function synchronizeKoscheiCombatState(state: CombatState): CombatState {
  let current = initializeKoscheiCombat(state);
  current = pruneDeadKoscheiVessels(current);
  current = enforceKoscheiImmortality(current);
  current = advanceKoscheiVesselState(current);
  current = pruneDeadKoscheiVessels(current);
  return enforceKoscheiImmortality(current);
}

export function triggerKoscheiPhaseShift(
  state: CombatState,
  enemyDefs?: Parameters<typeof summonEnemyIfPossible>[2]
): CombatState {
  let current = synchronizeKoscheiCombatState(state);
  current = summonEnemyIfPossible(current, "koschei_herald", enemyDefs);
  return applyNextTurnCardCostIncrease(current, 1);
}

export function applyKoscheiAbilityMechanics(
  state: CombatState,
  enemyInstanceId: string,
  abilityName: string,
  target: EffectTarget,
  rng: RNG
): CombatState {
  let current = synchronizeKoscheiCombatState(state);
  const koschei = getKoscheiEnemy(current);
  if (!koschei || koschei.instanceId !== enemyInstanceId) return current;

  if (getFlag(koschei, RESEAL_PENDING_KEY) > 0) {
    current = resealCurrentVessel(current);
  }

  if (abilityName === "Deathless Blow") {
    current = applyBonusDamageIfPlayerDebuffed(
      current,
      enemyInstanceId,
      target,
      rng,
      10
    );
  }
  if (abilityName === "Immortal Ward") {
    current = healEnemy(current, enemyInstanceId, 12);
  }

  return synchronizeKoscheiCombatState(current);
}
