import { nanoid } from "nanoid";

import type { CombatState } from "../schemas/combat-state";
import type { EnemyState } from "../schemas/entities";
import type { EffectSource } from "./effects";

const FLAG_PREFIX = "hydra_heads";
const BODY_HIT_KEY = `${FLAG_PREFIX}_body_hit_this_turn`;
const LEFT_HEAD_KEY = `${FLAG_PREFIX}_left`;
const RIGHT_HEAD_KEY = `${FLAG_PREFIX}_right`;
const CENTER_HEAD_KEY = `${FLAG_PREFIX}_center`;

const HEAD_STATE_ALIVE = 0;
const HEAD_STATE_PENDING = 1;
const HEAD_STATE_CAUTERIZED = 2;
const HEAD_STATE_DORMANT = 3;

type HydraHeadState =
  | typeof HEAD_STATE_ALIVE
  | typeof HEAD_STATE_PENDING
  | typeof HEAD_STATE_CAUTERIZED
  | typeof HEAD_STATE_DORMANT;

type HydraHeadKey = "LEFT" | "RIGHT" | "CENTER";

interface HydraHeadConfig {
  key: HydraHeadKey;
  stateFlag: string;
  definitionId: string;
  name: string;
  maxHp: number;
  speed: number;
}

interface HydraHeadUiState {
  key: HydraHeadKey;
  definitionId: string;
  state: "ALIVE" | "PENDING" | "CAUTERIZED" | "DORMANT";
}

export interface HydraUiState {
  phaseTwo: boolean;
  totalHeads: number;
  aliveHeads: number;
  pendingHeads: number;
  cauterizedHeads: number;
  heads: HydraHeadUiState[];
}

const HYDRA_HEADS: readonly HydraHeadConfig[] = [
  {
    key: "LEFT",
    stateFlag: LEFT_HEAD_KEY,
    definitionId: "hydra_head_left",
    name: "Hydra Head",
    maxHp: 20,
    speed: 5,
  },
  {
    key: "RIGHT",
    stateFlag: RIGHT_HEAD_KEY,
    definitionId: "hydra_head_right",
    name: "Hydra Head",
    maxHp: 20,
    speed: 5,
  },
  {
    key: "CENTER",
    stateFlag: CENTER_HEAD_KEY,
    definitionId: "hydra_head_center",
    name: "Hydra Head",
    maxHp: 24,
    speed: 6,
  },
] as const;

function isHydraEnemy(
  enemy: Pick<EnemyState, "definitionId"> | null | undefined
): enemy is Pick<EnemyState, "definitionId"> {
  return Boolean(enemy && enemy.definitionId === "hydra_aspect");
}

function isHydraHeadDefinitionId(definitionId: string): boolean {
  return HYDRA_HEADS.some((head) => head.definitionId === definitionId);
}

function sanitizeFlag(value: number | undefined, fallback: number): number {
  return Math.max(0, Math.floor(value ?? fallback));
}

function clampHeadState(value: number): HydraHeadState {
  if (value === HEAD_STATE_PENDING) return HEAD_STATE_PENDING;
  if (value === HEAD_STATE_CAUTERIZED) return HEAD_STATE_CAUTERIZED;
  if (value === HEAD_STATE_DORMANT) return HEAD_STATE_DORMANT;
  return HEAD_STATE_ALIVE;
}

function withDefaultMechanicFlags(
  flags: Record<string, number> | undefined
): Record<string, number> {
  return {
    ...(flags ?? {}),
    [BODY_HIT_KEY]: sanitizeFlag(flags?.[BODY_HIT_KEY], 0),
    [LEFT_HEAD_KEY]: clampHeadState(
      sanitizeFlag(flags?.[LEFT_HEAD_KEY], HEAD_STATE_ALIVE)
    ),
    [RIGHT_HEAD_KEY]: clampHeadState(
      sanitizeFlag(flags?.[RIGHT_HEAD_KEY], HEAD_STATE_ALIVE)
    ),
    [CENTER_HEAD_KEY]: clampHeadState(
      sanitizeFlag(flags?.[CENTER_HEAD_KEY], HEAD_STATE_DORMANT)
    ),
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
      [key]:
        key === LEFT_HEAD_KEY ||
        key === RIGHT_HEAD_KEY ||
        key === CENTER_HEAD_KEY
          ? clampHeadState(value)
          : sanitizeFlag(value, 0),
    },
  };
}

function updateHydra(
  state: CombatState,
  updater: (enemy: EnemyState) => EnemyState
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) => {
      if (!isHydraEnemy(enemy)) return enemy;
      return updater({
        ...enemy,
        mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
      });
    }),
  };
}

function getHydraEnemy(state: CombatState): EnemyState | null {
  const hydra = state.enemies.find(isHydraEnemy);
  if (!hydra) return null;
  return {
    ...hydra,
    mechanicFlags: withDefaultMechanicFlags(hydra.mechanicFlags),
  };
}

function getHeadConfigByDefinitionId(
  definitionId: string
): HydraHeadConfig | null {
  return HYDRA_HEADS.find((head) => head.definitionId === definitionId) ?? null;
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

function getHeadState(
  enemy: EnemyState,
  config: HydraHeadConfig
): HydraHeadState {
  return clampHeadState(getFlag(enemy, config.stateFlag));
}

function setHeadState(
  enemy: EnemyState,
  config: HydraHeadConfig,
  state: HydraHeadState
): EnemyState {
  return setFlag(enemy, config.stateFlag, state);
}

function pruneDeadHydraHeads(state: CombatState): CombatState {
  return {
    ...state,
    enemies: state.enemies.filter(
      (enemy) =>
        enemy.currentHp > 0 || !isHydraHeadDefinitionId(enemy.definitionId)
    ),
  };
}

function reconcileMissingHydraHeads(state: CombatState): CombatState {
  const hydra = getHydraEnemy(state);
  if (!hydra) return state;

  return updateHydra(state, (enemy) => {
    let next = enemy;
    const bodyHitThisTurn = getFlag(next, BODY_HIT_KEY) > 0;

    for (const head of HYDRA_HEADS) {
      if (getHeadState(next, head) !== HEAD_STATE_ALIVE) continue;
      if (findLivingEnemyByDefinitionId(state, head.definitionId)) continue;

      next = setHeadState(
        next,
        head,
        bodyHitThisTurn ? HEAD_STATE_CAUTERIZED : HEAD_STATE_PENDING
      );
    }

    return next;
  });
}

function spawnHydraHead(
  state: CombatState,
  config: HydraHeadConfig
): CombatState {
  const current = pruneDeadHydraHeads(state);
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
        currentHp: config.maxHp,
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

function ensureHydraHeads(state: CombatState): CombatState {
  const hydra = getHydraEnemy(state);
  if (!hydra) return state;

  let current = pruneDeadHydraHeads(state);
  for (const head of HYDRA_HEADS) {
    if (getHeadState(hydra, head) !== HEAD_STATE_ALIVE) continue;
    current = spawnHydraHead(current, head);
  }

  return current;
}

export function isHydraPhaseTwo(enemy: EnemyState): boolean {
  return (enemy.mechanicFlags?.hydra_aspect_phase2 ?? 0) > 0;
}

function isFriendlySource(source: EffectSource): boolean {
  return source === "player" || source.type === "ally";
}

export function initializeHydraCombat(state: CombatState): CombatState {
  const hydra = getHydraEnemy(state);
  if (!hydra) return state;

  const current = updateHydra(state, (enemy) => ({
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  }));

  return ensureHydraHeads(current);
}

export function resetHydraTurnState(state: CombatState): CombatState {
  const hydra = getHydraEnemy(state);
  if (!hydra) return state;

  const current = updateHydra(state, (enemy) =>
    setFlag(enemy, BODY_HIT_KEY, 0)
  );
  return ensureHydraHeads(current);
}

export function finalizeHydraPlayerTurn(state: CombatState): CombatState {
  const hydra = getHydraEnemy(state);
  if (!hydra) return state;

  let current = updateHydra(state, (enemy) => {
    let next = setFlag(enemy, BODY_HIT_KEY, 0);

    for (const head of HYDRA_HEADS) {
      if (getHeadState(next, head) !== HEAD_STATE_PENDING) continue;
      next = setHeadState(next, head, HEAD_STATE_ALIVE);
    }

    return next;
  });

  current = pruneDeadHydraHeads(current);
  return ensureHydraHeads(current);
}

export function synchronizeHydraCombatState(state: CombatState): CombatState {
  const hydra = getHydraEnemy(state);
  if (!hydra) return state;

  let current = updateHydra(state, (enemy) => ({
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  }));
  current = reconcileMissingHydraHeads(current);
  current = pruneDeadHydraHeads(current);

  return ensureHydraHeads(current);
}

export function triggerHydraPhaseShift(state: CombatState): CombatState {
  const hydra = getHydraEnemy(state);
  if (!hydra) return state;

  let current = updateHydra(state, (enemy) => {
    if (getHeadState(enemy, HYDRA_HEADS[2]!) !== HEAD_STATE_DORMANT) {
      return enemy;
    }

    return setHeadState(enemy, HYDRA_HEADS[2]!, HEAD_STATE_ALIVE);
  });

  current = pruneDeadHydraHeads(current);
  return ensureHydraHeads(current);
}

export function registerHydraDamage(
  state: CombatState,
  targetInstanceId: string,
  source: EffectSource
): CombatState {
  if (!isFriendlySource(source)) return state;

  const targetEnemy = state.enemies.find(
    (enemy) => enemy.instanceId === targetInstanceId
  );
  if (!targetEnemy) return state;

  const hydra = getHydraEnemy(state);
  if (!hydra) return state;

  if (targetEnemy.definitionId === "hydra_aspect") {
    let current = updateHydra(state, (enemy) => {
      let next = setFlag(enemy, BODY_HIT_KEY, 1);

      for (const head of HYDRA_HEADS) {
        if (getHeadState(next, head) !== HEAD_STATE_PENDING) continue;
        next = setHeadState(next, head, HEAD_STATE_CAUTERIZED);
      }

      return next;
    });

    current = pruneDeadHydraHeads(current);
    return ensureHydraHeads(current);
  }

  const headConfig = getHeadConfigByDefinitionId(targetEnemy.definitionId);
  if (!headConfig || targetEnemy.currentHp > 0) return state;

  let current = updateHydra(state, (enemy) =>
    setHeadState(
      enemy,
      headConfig,
      getFlag(enemy, BODY_HIT_KEY) > 0
        ? HEAD_STATE_CAUTERIZED
        : HEAD_STATE_PENDING
    )
  );

  current = pruneDeadHydraHeads(current);
  return ensureHydraHeads(current);
}

export function getHydraPendingHeadDefinitionIds(
  enemy: EnemyState | null | undefined
): string[] {
  if (!enemy) return [];
  const hydra = {
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  };
  if (!isHydraEnemy(hydra)) return [];

  return HYDRA_HEADS.filter(
    (head) => getHeadState(hydra, head) === HEAD_STATE_PENDING
  ).map((head) => head.definitionId);
}

export function getHydraUiState(
  enemy: EnemyState | null | undefined
): HydraUiState | null {
  if (!enemy) return null;
  const hydra = {
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  };
  if (!isHydraEnemy(hydra)) return null;

  const totalHeads = isHydraPhaseTwo(hydra) ? 3 : 2;
  const heads = HYDRA_HEADS.map((head) => {
    const state = getHeadState(hydra, head);
    return {
      key: head.key,
      definitionId: head.definitionId,
      state:
        state === HEAD_STATE_PENDING
          ? "PENDING"
          : state === HEAD_STATE_CAUTERIZED
            ? "CAUTERIZED"
            : state === HEAD_STATE_DORMANT
              ? "DORMANT"
              : "ALIVE",
    } as HydraHeadUiState;
  }).filter((head) => !(head.key === "CENTER" && !isHydraPhaseTwo(hydra)));

  return {
    phaseTwo: isHydraPhaseTwo(hydra),
    totalHeads,
    aliveHeads: heads.filter((head) => head.state === "ALIVE").length,
    pendingHeads: heads.filter((head) => head.state === "PENDING").length,
    cauterizedHeads: heads.filter((head) => head.state === "CAUTERIZED").length,
    heads,
  };
}
