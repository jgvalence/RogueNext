import type { CombatState } from "../schemas/combat-state";
import type { EnemyAbility, EnemyState } from "../schemas/entities";
import type { EffectTarget, EffectSource } from "./effects";
import type { RNG } from "./rng";
import {
  applyBuffToPlayer,
  applyFlatBonusDamage,
} from "./boss-mechanics/shared";

const FLAG_PREFIX = "osiris_judgment";
const TURN_DAMAGE_KEY = `${FLAG_PREFIX}_turn_damage`;
const TURN_BLOCK_KEY = `${FLAG_PREFIX}_turn_block`;

type OsirisVerdict = "BALANCED" | "ATTACK" | "BLOCK";

export interface OsirisUiState {
  phaseTwo: boolean;
  damageDealt: number;
  blockGained: number;
  threshold: number;
  verdict: OsirisVerdict;
  damageBonus: number;
  blockBonus: number;
  weakValue: number;
  vulnerableValue: number;
}

function isOsirisEnemy(
  enemy: Pick<EnemyState, "definitionId"> | null | undefined
): enemy is Pick<EnemyState, "definitionId"> {
  return Boolean(enemy && enemy.definitionId === "osiris_judgment");
}

function sanitizeFlag(value: number | undefined, fallback: number): number {
  return Math.max(0, Math.floor(value ?? fallback));
}

function withDefaultMechanicFlags(
  flags: Record<string, number> | undefined
): Record<string, number> {
  return {
    ...(flags ?? {}),
    [TURN_DAMAGE_KEY]: sanitizeFlag(flags?.[TURN_DAMAGE_KEY], 0),
    [TURN_BLOCK_KEY]: sanitizeFlag(flags?.[TURN_BLOCK_KEY], 0),
  };
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

function updateOsiris(
  state: CombatState,
  updater: (enemy: EnemyState) => EnemyState
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) => {
      if (!isOsirisEnemy(enemy)) return enemy;
      return updater({
        ...enemy,
        mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
      });
    }),
  };
}

function getOsirisEnemy(state: CombatState): EnemyState | null {
  const osiris = state.enemies.find(isOsirisEnemy);
  if (!osiris) return null;
  return {
    ...osiris,
    mechanicFlags: withDefaultMechanicFlags(osiris.mechanicFlags),
  };
}

export function isOsirisPhaseTwo(enemy: EnemyState): boolean {
  return (enemy.mechanicFlags?.osiris_judgment_phase2 ?? 0) > 0;
}

export function getOsirisThreshold(enemy: EnemyState): number {
  return isOsirisPhaseTwo(enemy) ? 5 : 8;
}

export function getOsirisDamageBonus(enemy: EnemyState): number {
  return isOsirisPhaseTwo(enemy) ? 12 : 8;
}

export function getOsirisBlockBonus(enemy: EnemyState): number {
  return isOsirisPhaseTwo(enemy) ? 18 : 12;
}

export function getOsirisWeakValue(enemy: EnemyState): number {
  return isOsirisPhaseTwo(enemy) ? 3 : 2;
}

export function getOsirisVulnerableValue(enemy: EnemyState): number {
  return isOsirisPhaseTwo(enemy) ? 3 : 2;
}

export function getOsirisVerdict(
  enemy: EnemyState | null | undefined
): OsirisVerdict {
  if (!enemy || !isOsirisEnemy(enemy)) return "BALANCED";
  const flags = withDefaultMechanicFlags(enemy.mechanicFlags);
  const damage = flags[TURN_DAMAGE_KEY] ?? 0;
  const block = flags[TURN_BLOCK_KEY] ?? 0;
  const threshold = getOsirisThreshold(enemy);

  if (damage - block >= threshold) return "ATTACK";
  if (block - damage >= threshold) return "BLOCK";
  return "BALANCED";
}

function isFriendlySource(source: EffectSource): boolean {
  return source === "player" || source.type === "ally";
}

function abilityHasDamageEffect(ability: EnemyAbility): boolean {
  return ability.effects.some(
    (effect) =>
      effect.type === "DAMAGE" || effect.type === "DAMAGE_PER_TARGET_BLOCK"
  );
}

function grantEnemyBlock(
  state: CombatState,
  enemyInstanceId: string,
  amount: number
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) =>
      enemy.instanceId === enemyInstanceId
        ? { ...enemy, block: enemy.block + amount }
        : enemy
    ),
  };
}

export function initializeOsirisCombat(state: CombatState): CombatState {
  const osiris = getOsirisEnemy(state);
  if (!osiris) return state;
  return synchronizeOsirisCombatState(state);
}

export function resetOsirisTurnState(state: CombatState): CombatState {
  const osiris = getOsirisEnemy(state);
  if (!osiris) return state;

  return updateOsiris(state, (enemy) => {
    let nextEnemy = setFlag(enemy, TURN_DAMAGE_KEY, 0);
    nextEnemy = setFlag(nextEnemy, TURN_BLOCK_KEY, 0);
    return nextEnemy;
  });
}

export function synchronizeOsirisCombatState(state: CombatState): CombatState {
  const osiris = getOsirisEnemy(state);
  if (!osiris) return state;

  return updateOsiris(state, (enemy) => ({
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  }));
}

export function registerOsirisDamageDealt(
  state: CombatState,
  amount: number,
  source: EffectSource
): CombatState {
  if (!isFriendlySource(source) || amount <= 0) return state;
  const osiris = getOsirisEnemy(state);
  if (!osiris || state.phase !== "PLAYER_TURN") return state;

  return synchronizeOsirisCombatState(
    updateOsiris(state, (enemy) =>
      setFlag(
        enemy,
        TURN_DAMAGE_KEY,
        (withDefaultMechanicFlags(enemy.mechanicFlags)[TURN_DAMAGE_KEY] ?? 0) +
          amount
      )
    )
  );
}

export function registerOsirisBlockGain(
  state: CombatState,
  amount: number
): CombatState {
  if (amount <= 0) return state;
  const osiris = getOsirisEnemy(state);
  if (!osiris || state.phase !== "PLAYER_TURN") return state;

  return synchronizeOsirisCombatState(
    updateOsiris(state, (enemy) =>
      setFlag(
        enemy,
        TURN_BLOCK_KEY,
        (withDefaultMechanicFlags(enemy.mechanicFlags)[TURN_BLOCK_KEY] ?? 0) +
          amount
      )
    )
  );
}

export function applyOsirisVerdict(
  state: CombatState,
  enemyInstanceId: string,
  ability: EnemyAbility,
  target: EffectTarget,
  rng: RNG
): CombatState {
  const osiris = state.enemies.find(
    (enemy) => enemy.instanceId === enemyInstanceId
  );
  if (!osiris || !isOsirisEnemy(osiris)) {
    return synchronizeOsirisCombatState(state);
  }

  const verdict = getOsirisVerdict(osiris);
  if (verdict === "BALANCED") {
    return synchronizeOsirisCombatState(state);
  }

  let current = state;
  if (verdict === "ATTACK") {
    current = applyBuffToPlayer(current, "WEAK", getOsirisWeakValue(osiris), 2);
    if (abilityHasDamageEffect(ability)) {
      current = applyFlatBonusDamage(
        current,
        enemyInstanceId,
        target,
        rng,
        getOsirisDamageBonus(osiris)
      );
    }
    return synchronizeOsirisCombatState(current);
  }

  current = grantEnemyBlock(
    current,
    enemyInstanceId,
    getOsirisBlockBonus(osiris)
  );
  current = applyBuffToPlayer(
    current,
    "VULNERABLE",
    getOsirisVulnerableValue(osiris),
    2
  );
  return synchronizeOsirisCombatState(current);
}

export function getOsirisUiState(
  enemy: EnemyState | null | undefined
): OsirisUiState | null {
  if (!enemy || !isOsirisEnemy(enemy)) return null;

  const normalizedEnemy = {
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  };

  return {
    phaseTwo: isOsirisPhaseTwo(normalizedEnemy),
    damageDealt: normalizedEnemy.mechanicFlags?.[TURN_DAMAGE_KEY] ?? 0,
    blockGained: normalizedEnemy.mechanicFlags?.[TURN_BLOCK_KEY] ?? 0,
    threshold: getOsirisThreshold(normalizedEnemy),
    verdict: getOsirisVerdict(normalizedEnemy),
    damageBonus: getOsirisDamageBonus(normalizedEnemy),
    blockBonus: getOsirisBlockBonus(normalizedEnemy),
    weakValue: getOsirisWeakValue(normalizedEnemy),
    vulnerableValue: getOsirisVulnerableValue(normalizedEnemy),
  };
}
