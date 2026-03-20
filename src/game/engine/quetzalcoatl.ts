import type { CombatState } from "../schemas/combat-state";
import type { EnemyState } from "../schemas/entities";
import type { EffectSource } from "./effects";
import { applyBuff } from "./buffs";

const FLAG_PREFIX = "quetzalcoatl_wrath";
const STANCE_KEY = `${FLAG_PREFIX}_stance`;
const HIT_COUNT_KEY = `${FLAG_PREFIX}_hit_count`;

const STANCE_AIRBORNE = 0;
const STANCE_GROUNDED = 1;
const SOLAR_DIVE_INTENT_INDEX = 4;
const AIRBORNE_DAMAGE_CAP = 8;
const GROUNDED_DAMAGE_MULTIPLIER = 1.5;
const PHASE_ONE_KNOCKDOWN_THRESHOLD = 3;
const PHASE_TWO_KNOCKDOWN_THRESHOLD = 2;
const PHASE_TWO_MISS_BLEED = 2;

type QuetzalcoatlStance = typeof STANCE_AIRBORNE | typeof STANCE_GROUNDED;

export interface QuetzalcoatlUiState {
  phaseTwo: boolean;
  stance: "AIRBORNE" | "GROUNDED";
  hits: number;
  knockdownThreshold: number;
  airborneDamageCap: number;
  groundedDamageMultiplier: number;
  missBleed: number;
}

function isQuetzalcoatlEnemy(
  enemy: Pick<EnemyState, "definitionId"> | null | undefined
): enemy is Pick<EnemyState, "definitionId"> {
  return Boolean(enemy && enemy.definitionId === "quetzalcoatl_wrath");
}

function sanitizeFlag(value: number | undefined, fallback: number): number {
  return Math.max(0, Math.floor(value ?? fallback));
}

function clampStance(value: number): QuetzalcoatlStance {
  return value === STANCE_GROUNDED ? STANCE_GROUNDED : STANCE_AIRBORNE;
}

function withDefaultMechanicFlags(
  flags: Record<string, number> | undefined
): Record<string, number> {
  return {
    ...(flags ?? {}),
    [STANCE_KEY]: clampStance(
      sanitizeFlag(flags?.[STANCE_KEY], STANCE_AIRBORNE)
    ),
    [HIT_COUNT_KEY]: sanitizeFlag(flags?.[HIT_COUNT_KEY], 0),
  };
}

function setFlag(enemy: EnemyState, key: string, value: number): EnemyState {
  return {
    ...enemy,
    mechanicFlags: {
      ...withDefaultMechanicFlags(enemy.mechanicFlags),
      [key]: key === STANCE_KEY ? clampStance(value) : sanitizeFlag(value, 0),
    },
  };
}

function updateQuetzalcoatl(
  state: CombatState,
  updater: (enemy: EnemyState) => EnemyState
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) => {
      if (!isQuetzalcoatlEnemy(enemy)) return enemy;
      return updater({
        ...enemy,
        mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
      });
    }),
  };
}

function getQuetzalcoatlEnemy(state: CombatState): EnemyState | null {
  const enemy = state.enemies.find(isQuetzalcoatlEnemy);
  if (!enemy) return null;
  return {
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  };
}

function isPhaseTwo(enemy: EnemyState): boolean {
  return (enemy.mechanicFlags?.quetzalcoatl_wrath_phase2 ?? 0) > 0;
}

function getKnockdownThreshold(enemy: EnemyState): number {
  return isPhaseTwo(enemy)
    ? PHASE_TWO_KNOCKDOWN_THRESHOLD
    : PHASE_ONE_KNOCKDOWN_THRESHOLD;
}

function getStance(enemy: EnemyState): QuetzalcoatlStance {
  return clampStance(
    withDefaultMechanicFlags(enemy.mechanicFlags)[STANCE_KEY] ?? STANCE_AIRBORNE
  );
}

function getHitCount(enemy: EnemyState): number {
  return sanitizeFlag(
    withDefaultMechanicFlags(enemy.mechanicFlags)[HIT_COUNT_KEY],
    0
  );
}

function isFriendlySource(source: EffectSource): boolean {
  return source === "player" || source.type === "ally";
}

function setIntentIndex(
  state: CombatState,
  enemyInstanceId: string,
  intentIndex: number
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) =>
      enemy.instanceId === enemyInstanceId ? { ...enemy, intentIndex } : enemy
    ),
  };
}

export function getQuetzalcoatlAirborneDamageCap(): number {
  return AIRBORNE_DAMAGE_CAP;
}

export function getQuetzalcoatlPhaseTwoMissBleed(): number {
  return PHASE_TWO_MISS_BLEED;
}

export function initializeQuetzalcoatlCombat(state: CombatState): CombatState {
  const enemy = getQuetzalcoatlEnemy(state);
  if (!enemy) return state;
  return synchronizeQuetzalcoatlCombatState(state);
}

export function startQuetzalcoatlPlayerTurn(state: CombatState): CombatState {
  const enemy = getQuetzalcoatlEnemy(state);
  if (!enemy) return state;

  return updateQuetzalcoatl(state, (currentEnemy) =>
    setFlag(currentEnemy, HIT_COUNT_KEY, 0)
  );
}

export function finalizeQuetzalcoatlPlayerTurn(
  state: CombatState
): CombatState {
  const enemy = getQuetzalcoatlEnemy(state);
  if (!enemy) return state;
  if (!isPhaseTwo(enemy) || getStance(enemy) !== STANCE_AIRBORNE) return state;

  return {
    ...state,
    player: {
      ...state.player,
      buffs: applyBuff(state.player.buffs, "BLEED", PHASE_TWO_MISS_BLEED, 3),
    },
  };
}

export function synchronizeQuetzalcoatlCombatState(
  state: CombatState
): CombatState {
  const enemy = getQuetzalcoatlEnemy(state);
  if (!enemy) return state;

  let current = updateQuetzalcoatl(state, (currentEnemy) => {
    let nextEnemy: EnemyState = {
      ...currentEnemy,
      mechanicFlags: withDefaultMechanicFlags(currentEnemy.mechanicFlags),
    };
    const stance = getStance(nextEnemy);
    const cappedHits =
      stance === STANCE_GROUNDED
        ? getKnockdownThreshold(nextEnemy)
        : Math.min(getHitCount(nextEnemy), getKnockdownThreshold(nextEnemy));
    nextEnemy = setFlag(nextEnemy, HIT_COUNT_KEY, cappedHits);
    return nextEnemy;
  });

  const refreshedEnemy = getQuetzalcoatlEnemy(current);
  if (!refreshedEnemy) return current;
  if (getStance(refreshedEnemy) === STANCE_GROUNDED) {
    current = setIntentIndex(
      current,
      refreshedEnemy.instanceId,
      SOLAR_DIVE_INTENT_INDEX
    );
  }

  return current;
}

export function modifyQuetzalcoatlIncomingDamage(
  state: CombatState,
  targetInstanceId: string,
  source: EffectSource,
  damage: number
): number {
  if (!isFriendlySource(source) || damage <= 0) return damage;

  const enemy = state.enemies.find(
    (entry) => entry.instanceId === targetInstanceId
  );
  if (!enemy || !isQuetzalcoatlEnemy(enemy) || enemy.currentHp <= 0) {
    return damage;
  }

  if (getStance(enemy) === STANCE_GROUNDED) {
    return Math.max(1, Math.floor(damage * GROUNDED_DAMAGE_MULTIPLIER));
  }

  return Math.min(damage, AIRBORNE_DAMAGE_CAP);
}

export function registerQuetzalcoatlDamage(
  state: CombatState,
  targetInstanceId: string,
  source: EffectSource
): CombatState {
  if (!isFriendlySource(source)) return state;

  const enemy = state.enemies.find(
    (entry) => entry.instanceId === targetInstanceId
  );
  if (!enemy || !isQuetzalcoatlEnemy(enemy) || enemy.currentHp <= 0) {
    return state;
  }
  if (getStance(enemy) !== STANCE_AIRBORNE) return state;

  const nextHitCount = getHitCount(enemy) + 1;
  const threshold = getKnockdownThreshold(enemy);
  const knockedDown = nextHitCount >= threshold;

  let current = updateQuetzalcoatl(state, (currentEnemy) => {
    let nextEnemy = setFlag(
      currentEnemy,
      HIT_COUNT_KEY,
      Math.min(nextHitCount, threshold)
    );

    if (knockedDown) {
      nextEnemy = setFlag(nextEnemy, STANCE_KEY, STANCE_GROUNDED);
    }

    return nextEnemy;
  });

  if (knockedDown) {
    current = setIntentIndex(
      current,
      targetInstanceId,
      SOLAR_DIVE_INTENT_INDEX
    );
  }

  return synchronizeQuetzalcoatlCombatState(current);
}

export function resolveQuetzalcoatlPostAbility(
  state: CombatState,
  enemyInstanceId: string
): CombatState {
  const enemy = state.enemies.find(
    (entry) => entry.instanceId === enemyInstanceId
  );
  if (!enemy || !isQuetzalcoatlEnemy(enemy)) return state;
  if (getStance(enemy) !== STANCE_GROUNDED) {
    return synchronizeQuetzalcoatlCombatState(state);
  }

  return synchronizeQuetzalcoatlCombatState(
    updateQuetzalcoatl(state, (currentEnemy) => {
      let nextEnemy = setFlag(currentEnemy, STANCE_KEY, STANCE_AIRBORNE);
      nextEnemy = setFlag(nextEnemy, HIT_COUNT_KEY, 0);
      return nextEnemy;
    })
  );
}

export function getQuetzalcoatlUiState(
  enemy: EnemyState | null | undefined
): QuetzalcoatlUiState | null {
  if (!enemy || !isQuetzalcoatlEnemy(enemy)) return null;

  const normalizedEnemy = {
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  };

  return {
    phaseTwo: isPhaseTwo(normalizedEnemy),
    stance:
      getStance(normalizedEnemy) === STANCE_GROUNDED ? "GROUNDED" : "AIRBORNE",
    hits: getHitCount(normalizedEnemy),
    knockdownThreshold: getKnockdownThreshold(normalizedEnemy),
    airborneDamageCap: AIRBORNE_DAMAGE_CAP,
    groundedDamageMultiplier: GROUNDED_DAMAGE_MULTIPLIER,
    missBleed: PHASE_TWO_MISS_BLEED,
  };
}
