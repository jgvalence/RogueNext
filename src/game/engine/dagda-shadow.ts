import { nanoid } from "nanoid";

import type { CombatState } from "../schemas/combat-state";
import type { EnemyDefinition, EnemyState } from "../schemas/entities";
import {
  addCardsToDiscardPile,
  applyBuffToPlayer,
  grantEnemyStrength,
  healEnemy,
} from "./boss-mechanics/shared";

const DAGDA_ID = "dagda_shadow";
export const DAGDA_CAULDRON_ID = "dagda_cauldron";

const BOSS_FLAG_PREFIX = "dagda_shadow";
const BOSS_BREW_TYPE_KEY = `${BOSS_FLAG_PREFIX}_brew_type`;
const BOSS_BREW_PROGRESS_KEY = `${BOSS_FLAG_PREFIX}_brew_progress`;
const BOSS_CAULDRON_PRESENT_KEY = `${BOSS_FLAG_PREFIX}_cauldron_present`;

const CAULDRON_FLAG_PREFIX = "dagda_cauldron";
const CAULDRON_BREW_TYPE_KEY = `${CAULDRON_FLAG_PREFIX}_brew_type`;
const CAULDRON_BREW_PROGRESS_KEY = `${CAULDRON_FLAG_PREFIX}_brew_progress`;

const BREW_FEAST = 0;
const BREW_FAMINE = 1;
const BREW_LENGTH = 2;
const BREW_PROGRESS_MIN = 0;
const BREW_PROGRESS_MAX = BREW_LENGTH - 1;

const FEAST_HEAL_PHASE_ONE = 14;
const FEAST_HEAL_PHASE_TWO = 18;
const FEAST_STRENGTH_PHASE_ONE = 2;
const FEAST_STRENGTH_PHASE_TWO = 3;

const FAMINE_WEAK_PHASE_ONE = 1;
const FAMINE_WEAK_PHASE_TWO = 2;
const FAMINE_WEAK_DURATION = 2;
const FAMINE_PHASE_ONE_CARD_IDS = ["dazed", "hexed_parchment"] as const;
const FAMINE_PHASE_TWO_CARD_IDS = ["dazed", "binding_curse"] as const;

type DagdaBrewType = typeof BREW_FEAST | typeof BREW_FAMINE;

export interface DagdaUiState {
  phaseTwo: boolean;
  cauldronPresent: boolean;
  brewType: "FEAST" | "FAMINE";
  progress: number;
  length: number;
  feastHeal: number;
  feastStrength: number;
  famineWeak: number;
  famineWeakDuration: number;
  famineCardIds: string[];
}

export interface DagdaCauldronUiState {
  brewType: "FEAST" | "FAMINE";
  progress: number;
  length: number;
}

export interface DagdaAbilityPreviewState {
  summonsCauldron: boolean;
  resolvesBrew: boolean;
  brewType: "FEAST" | "FAMINE" | null;
  feastHeal: number;
  feastStrength: number;
  famineWeak: number;
  famineWeakDuration: number;
  famineCardIds: string[];
}

function sanitizeFlag(value: number | undefined, fallback: number): number {
  return Math.max(0, Math.floor(value ?? fallback));
}

function clampBrewType(value: number): DagdaBrewType {
  return value === BREW_FAMINE ? BREW_FAMINE : BREW_FEAST;
}

function clampProgress(value: number): number {
  return Math.max(
    BREW_PROGRESS_MIN,
    Math.min(BREW_PROGRESS_MAX, Math.floor(value))
  );
}

function isDagdaEnemy(
  enemy: Pick<EnemyState, "definitionId"> | null | undefined
): enemy is EnemyState {
  return Boolean(enemy && enemy.definitionId === DAGDA_ID);
}

function isDagdaCauldronEnemy(
  enemy: Pick<EnemyState, "definitionId"> | null | undefined
): enemy is EnemyState {
  return Boolean(enemy && enemy.definitionId === DAGDA_CAULDRON_ID);
}

function withDefaultBossFlags(
  flags: Record<string, number> | undefined
): Record<string, number> {
  return {
    ...(flags ?? {}),
    [BOSS_BREW_TYPE_KEY]: clampBrewType(
      sanitizeFlag(flags?.[BOSS_BREW_TYPE_KEY], BREW_FEAST)
    ),
    [BOSS_BREW_PROGRESS_KEY]: clampProgress(
      sanitizeFlag(flags?.[BOSS_BREW_PROGRESS_KEY], BREW_PROGRESS_MIN)
    ),
    [BOSS_CAULDRON_PRESENT_KEY]: sanitizeFlag(
      flags?.[BOSS_CAULDRON_PRESENT_KEY],
      0
    )
      ? 1
      : 0,
  };
}

function withDefaultCauldronFlags(
  flags: Record<string, number> | undefined
): Record<string, number> {
  return {
    ...(flags ?? {}),
    [CAULDRON_BREW_TYPE_KEY]: clampBrewType(
      sanitizeFlag(flags?.[CAULDRON_BREW_TYPE_KEY], BREW_FEAST)
    ),
    [CAULDRON_BREW_PROGRESS_KEY]: clampProgress(
      sanitizeFlag(flags?.[CAULDRON_BREW_PROGRESS_KEY], BREW_PROGRESS_MIN)
    ),
  };
}

function setBossFlag(
  enemy: EnemyState,
  key: string,
  value: number
): EnemyState {
  return {
    ...enemy,
    mechanicFlags: {
      ...withDefaultBossFlags(enemy.mechanicFlags),
      [key]:
        key === BOSS_BREW_TYPE_KEY
          ? clampBrewType(value)
          : key === BOSS_BREW_PROGRESS_KEY
            ? clampProgress(value)
            : sanitizeFlag(value, 0)
              ? 1
              : 0,
    },
  };
}

function setCauldronFlag(
  enemy: EnemyState,
  key: string,
  value: number
): EnemyState {
  return {
    ...enemy,
    mechanicFlags: {
      ...withDefaultCauldronFlags(enemy.mechanicFlags),
      [key]:
        key === CAULDRON_BREW_TYPE_KEY
          ? clampBrewType(value)
          : clampProgress(value),
    },
  };
}

function getBossEnemy(state: CombatState): EnemyState | null {
  const enemy = state.enemies.find(isDagdaEnemy);
  if (!enemy) return null;
  return {
    ...enemy,
    mechanicFlags: withDefaultBossFlags(enemy.mechanicFlags),
  };
}

function getLivingCauldron(state: CombatState): EnemyState | null {
  const cauldron = state.enemies.find(
    (enemy) => isDagdaCauldronEnemy(enemy) && enemy.currentHp > 0
  );
  if (!cauldron) return null;
  return {
    ...cauldron,
    mechanicFlags: withDefaultCauldronFlags(cauldron.mechanicFlags),
  };
}

function getLivingEnemyCount(state: CombatState): number {
  return state.enemies.filter((enemy) => enemy.currentHp > 0).length;
}

function getBrewTypeFromBoss(enemy: EnemyState): DagdaBrewType {
  return clampBrewType(
    withDefaultBossFlags(enemy.mechanicFlags)[BOSS_BREW_TYPE_KEY] ?? BREW_FEAST
  );
}

function getBrewTypeFromCauldron(enemy: EnemyState): DagdaBrewType {
  return clampBrewType(
    withDefaultCauldronFlags(enemy.mechanicFlags)[CAULDRON_BREW_TYPE_KEY] ??
      BREW_FEAST
  );
}

function getBrewProgressFromCauldron(enemy: EnemyState): number {
  return clampProgress(
    withDefaultCauldronFlags(enemy.mechanicFlags)[CAULDRON_BREW_PROGRESS_KEY] ??
      BREW_PROGRESS_MIN
  );
}

function isPhaseTwo(enemy: EnemyState): boolean {
  return (enemy.mechanicFlags?.dagda_shadow_phase2 ?? 0) > 0;
}

function getResetProgress(enemy: EnemyState): number {
  return isPhaseTwo(enemy) ? 1 : 0;
}

function getFeastHeal(enemy: EnemyState): number {
  return isPhaseTwo(enemy) ? FEAST_HEAL_PHASE_TWO : FEAST_HEAL_PHASE_ONE;
}

function getFeastStrength(enemy: EnemyState): number {
  return isPhaseTwo(enemy)
    ? FEAST_STRENGTH_PHASE_TWO
    : FEAST_STRENGTH_PHASE_ONE;
}

function getFamineWeak(enemy: EnemyState): number {
  return isPhaseTwo(enemy) ? FAMINE_WEAK_PHASE_TWO : FAMINE_WEAK_PHASE_ONE;
}

function getFamineCardIds(enemy: EnemyState): string[] {
  return isPhaseTwo(enemy)
    ? [...FAMINE_PHASE_TWO_CARD_IDS]
    : [...FAMINE_PHASE_ONE_CARD_IDS];
}

function toUiBrewType(brewType: DagdaBrewType): "FEAST" | "FAMINE" {
  return brewType === BREW_FAMINE ? "FAMINE" : "FEAST";
}

function nextBrewType(brewType: DagdaBrewType): DagdaBrewType {
  return brewType === BREW_FEAST ? BREW_FAMINE : BREW_FEAST;
}

function updateDagdaState(
  state: CombatState,
  updater: (enemy: EnemyState) => EnemyState
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) => {
      if (enemy.definitionId === DAGDA_ID) {
        return updater({
          ...enemy,
          mechanicFlags: withDefaultBossFlags(enemy.mechanicFlags),
        });
      }
      if (enemy.definitionId === DAGDA_CAULDRON_ID) {
        return updater({
          ...enemy,
          mechanicFlags: withDefaultCauldronFlags(enemy.mechanicFlags),
        });
      }
      return enemy;
    }),
  };
}

function pruneDagdaEntities(state: CombatState): CombatState {
  const dagda = state.enemies.find(isDagdaEnemy);
  const bossAlive = Boolean(dagda && dagda.currentHp > 0);
  let keptLivingCauldronId: string | null = null;

  return {
    ...state,
    enemies: state.enemies.filter((enemy) => {
      if (isDagdaCauldronEnemy(enemy)) {
        if (!bossAlive || enemy.currentHp <= 0) return false;
        if (keptLivingCauldronId) return false;
        keptLivingCauldronId = enemy.instanceId;
        return true;
      }
      return true;
    }),
  };
}

function spawnCauldron(
  state: CombatState,
  boss: EnemyState,
  enemyDefs?: Map<string, EnemyDefinition>
): CombatState {
  if (!enemyDefs || getLivingEnemyCount(state) >= 4) return state;
  if (getLivingCauldron(state)) return state;

  const definition = enemyDefs.get(DAGDA_CAULDRON_ID);
  if (!definition) return state;

  return {
    ...state,
    enemies: [
      ...state.enemies,
      {
        instanceId: nanoid(),
        definitionId: definition.id,
        name: definition.name,
        currentHp: definition.maxHp,
        maxHp: definition.maxHp,
        block: 0,
        mechanicFlags: {
          [CAULDRON_BREW_TYPE_KEY]: getBrewTypeFromBoss(boss),
          [CAULDRON_BREW_PROGRESS_KEY]: getResetProgress(boss),
        },
        speed: definition.speed,
        buffs: [],
        intentIndex: 0,
      },
    ],
  };
}

function resolveFeast(
  state: CombatState,
  bossInstanceId: string,
  boss: EnemyState
): CombatState {
  let current = healEnemy(state, bossInstanceId, getFeastHeal(boss));
  current = grantEnemyStrength(current, bossInstanceId, getFeastStrength(boss));
  return current;
}

function resolveFamine(state: CombatState, boss: EnemyState): CombatState {
  let current = state;
  for (const cardId of getFamineCardIds(boss)) {
    current = addCardsToDiscardPile(current, cardId, 1);
  }
  return applyBuffToPlayer(
    current,
    "WEAK",
    getFamineWeak(boss),
    FAMINE_WEAK_DURATION
  );
}

function syncBossFromCauldron(
  state: CombatState,
  cauldron: EnemyState | null
): CombatState {
  return updateDagdaState(state, (enemy) => {
    if (!isDagdaEnemy(enemy)) return enemy;

    if (!cauldron) {
      let nextEnemy = setBossFlag(enemy, BOSS_CAULDRON_PRESENT_KEY, 0);
      nextEnemy = setBossFlag(nextEnemy, BOSS_BREW_PROGRESS_KEY, 0);
      return nextEnemy;
    }

    let nextEnemy = setBossFlag(enemy, BOSS_CAULDRON_PRESENT_KEY, 1);
    nextEnemy = setBossFlag(
      nextEnemy,
      BOSS_BREW_TYPE_KEY,
      getBrewTypeFromCauldron(cauldron)
    );
    nextEnemy = setBossFlag(
      nextEnemy,
      BOSS_BREW_PROGRESS_KEY,
      getBrewProgressFromCauldron(cauldron)
    );
    return nextEnemy;
  });
}

export function initializeDagdaCombat(
  state: CombatState,
  enemyDefs?: Map<string, EnemyDefinition>
): CombatState {
  const dagda = getBossEnemy(state);
  if (!dagda || dagda.currentHp <= 0) return pruneDagdaEntities(state);

  let current = pruneDagdaEntities(state);
  current = syncBossFromCauldron(current, getLivingCauldron(current));
  if (!getLivingCauldron(current)) {
    const freshDagda = getBossEnemy(current);
    if (!freshDagda) return current;
    current = spawnCauldron(current, freshDagda, enemyDefs);
  }
  return synchronizeDagdaCombatState(current);
}

export function synchronizeDagdaCombatState(state: CombatState): CombatState {
  const dagda = getBossEnemy(state);
  if (!dagda || dagda.currentHp <= 0) {
    return pruneDagdaEntities(state);
  }

  let current = updateDagdaState(pruneDagdaEntities(state), (enemy) => {
    if (enemy.definitionId === DAGDA_ID) {
      return {
        ...enemy,
        mechanicFlags: withDefaultBossFlags(enemy.mechanicFlags),
      };
    }
    if (enemy.definitionId === DAGDA_CAULDRON_ID) {
      return {
        ...enemy,
        mechanicFlags: withDefaultCauldronFlags(enemy.mechanicFlags),
      };
    }
    return enemy;
  });

  current = syncBossFromCauldron(current, getLivingCauldron(current));
  return current;
}

export function triggerDagdaPhaseTwo(
  state: CombatState,
  enemyInstanceId: string,
  enemyDefs?: Map<string, EnemyDefinition>
): CombatState {
  const dagda = state.enemies.find(
    (enemy) => enemy.instanceId === enemyInstanceId
  );
  if (!dagda || !isDagdaEnemy(dagda) || dagda.currentHp <= 0) {
    return synchronizeDagdaCombatState(state);
  }

  let current = pruneDagdaEntities(state);
  const freshDagda = getBossEnemy(current) ?? dagda;
  const livingCauldron = getLivingCauldron(current);

  if (!livingCauldron) {
    current = spawnCauldron(current, freshDagda, enemyDefs);
    return synchronizeDagdaCombatState(current);
  }

  current = updateDagdaState(current, (enemy) => {
    if (!isDagdaCauldronEnemy(enemy)) return enemy;
    return setCauldronFlag(
      enemy,
      CAULDRON_BREW_PROGRESS_KEY,
      Math.max(getBrewProgressFromCauldron(enemy), getResetProgress(freshDagda))
    );
  });

  return synchronizeDagdaCombatState(current);
}

export function resolveDagdaPostAbility(
  state: CombatState,
  enemyInstanceId: string,
  abilityName: string,
  enemyDefs?: Map<string, EnemyDefinition>
): CombatState {
  const dagda = state.enemies.find(
    (enemy) => enemy.instanceId === enemyInstanceId
  );
  if (!dagda || !isDagdaEnemy(dagda) || dagda.currentHp <= 0) {
    return synchronizeDagdaCombatState(state);
  }

  let current = pruneDagdaEntities(state);
  let freshDagda = getBossEnemy(current) ?? dagda;

  if (!getLivingCauldron(current) && abilityName === "Cauldron Steam") {
    current = spawnCauldron(current, freshDagda, enemyDefs);
    return synchronizeDagdaCombatState(current);
  }

  const cauldron = getLivingCauldron(current);
  if (!cauldron) return synchronizeDagdaCombatState(current);

  const progress = getBrewProgressFromCauldron(cauldron);
  if (progress + 1 < BREW_LENGTH) {
    current = updateDagdaState(current, (enemy) => {
      if (!isDagdaCauldronEnemy(enemy)) return enemy;
      return setCauldronFlag(enemy, CAULDRON_BREW_PROGRESS_KEY, progress + 1);
    });
    return synchronizeDagdaCombatState(current);
  }

  const brewType = getBrewTypeFromCauldron(cauldron);
  current =
    brewType === BREW_FEAST
      ? resolveFeast(current, enemyInstanceId, freshDagda)
      : resolveFamine(current, freshDagda);

  freshDagda = getBossEnemy(current) ?? freshDagda;
  const nextType = nextBrewType(brewType);
  current = updateDagdaState(current, (enemy) => {
    if (isDagdaCauldronEnemy(enemy)) {
      let nextEnemy = setCauldronFlag(enemy, CAULDRON_BREW_TYPE_KEY, nextType);
      nextEnemy = setCauldronFlag(
        nextEnemy,
        CAULDRON_BREW_PROGRESS_KEY,
        getResetProgress(freshDagda)
      );
      return nextEnemy;
    }
    if (isDagdaEnemy(enemy)) {
      let nextEnemy = setBossFlag(enemy, BOSS_BREW_TYPE_KEY, nextType);
      nextEnemy = setBossFlag(
        nextEnemy,
        BOSS_BREW_PROGRESS_KEY,
        getResetProgress(freshDagda)
      );
      nextEnemy = setBossFlag(nextEnemy, BOSS_CAULDRON_PRESENT_KEY, 1);
      return nextEnemy;
    }
    return enemy;
  });

  return synchronizeDagdaCombatState(current);
}

export function getDagdaAbilityPreviewState(
  state: CombatState,
  enemy: EnemyState,
  abilityName: string
): DagdaAbilityPreviewState | null {
  if (!isDagdaEnemy(enemy)) return null;

  const normalizedEnemy: EnemyState = {
    ...enemy,
    mechanicFlags: withDefaultBossFlags(enemy.mechanicFlags),
  };
  const cauldron = getLivingCauldron(state);
  const summonsCauldron = !cauldron && abilityName === "Cauldron Steam";
  const resolvesBrew = cauldron
    ? getBrewProgressFromCauldron(cauldron) + 1 >= BREW_LENGTH
    : false;

  return {
    summonsCauldron,
    resolvesBrew,
    brewType: cauldron ? toUiBrewType(getBrewTypeFromCauldron(cauldron)) : null,
    feastHeal: getFeastHeal(normalizedEnemy),
    feastStrength: getFeastStrength(normalizedEnemy),
    famineWeak: getFamineWeak(normalizedEnemy),
    famineWeakDuration: FAMINE_WEAK_DURATION,
    famineCardIds: getFamineCardIds(normalizedEnemy),
  };
}

export function getDagdaUiState(
  enemy: EnemyState | null | undefined
): DagdaUiState | null {
  if (!enemy || !isDagdaEnemy(enemy)) return null;

  const normalizedEnemy: EnemyState = {
    ...enemy,
    mechanicFlags: withDefaultBossFlags(enemy.mechanicFlags),
  };
  const flags = withDefaultBossFlags(normalizedEnemy.mechanicFlags);

  return {
    phaseTwo: isPhaseTwo(normalizedEnemy),
    cauldronPresent: sanitizeFlag(flags[BOSS_CAULDRON_PRESENT_KEY], 0) > 0,
    brewType: toUiBrewType(getBrewTypeFromBoss(normalizedEnemy)),
    progress: clampProgress(flags[BOSS_BREW_PROGRESS_KEY] ?? BREW_PROGRESS_MIN),
    length: BREW_LENGTH,
    feastHeal: getFeastHeal(normalizedEnemy),
    feastStrength: getFeastStrength(normalizedEnemy),
    famineWeak: getFamineWeak(normalizedEnemy),
    famineWeakDuration: FAMINE_WEAK_DURATION,
    famineCardIds: getFamineCardIds(normalizedEnemy),
  };
}

export function getDagdaCauldronUiState(
  enemy: EnemyState | null | undefined
): DagdaCauldronUiState | null {
  if (!enemy || !isDagdaCauldronEnemy(enemy)) return null;

  const normalizedEnemy: EnemyState = {
    ...enemy,
    mechanicFlags: withDefaultCauldronFlags(enemy.mechanicFlags),
  };

  return {
    brewType: toUiBrewType(getBrewTypeFromCauldron(normalizedEnemy)),
    progress: getBrewProgressFromCauldron(normalizedEnemy),
    length: BREW_LENGTH,
  };
}
