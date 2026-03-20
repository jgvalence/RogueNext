import type { CombatState } from "../schemas/combat-state";
import type {
  EnemyAbility,
  EnemyDefinition,
  EnemyState,
} from "../schemas/entities";
import type { EffectTarget } from "./effects";
import type { RNG } from "./rng";
import {
  applyBuffToPlayer,
  applyFlatBonusDamage,
  summonEnemyIfPossible,
} from "./boss-mechanics/shared";

const FLAG_PREFIX = "fenrir";
const HUNT_REMAINING_KEY = `${FLAG_PREFIX}_hunt_remaining`;
const HUNT_DAMAGE_PER_PIP = 2;

export interface FenrirUiState {
  phaseTwo: boolean;
  huntRemaining: number;
  huntMax: number;
  damageBonus: number;
  packHowlPrimed: boolean;
}

function isFenrirEnemy(
  enemy: Pick<EnemyState, "definitionId" | "currentHp"> | null | undefined
): enemy is Pick<EnemyState, "definitionId" | "currentHp"> {
  return Boolean(
    enemy && enemy.definitionId === "fenrir" && Math.max(0, enemy.currentHp) > 0
  );
}

function isFenrirPhaseTwoFlag(
  flags: Record<string, number> | undefined
): boolean {
  return Math.max(0, Math.floor(flags?.[`${FLAG_PREFIX}_phase2`] ?? 0)) > 0;
}

function getFenrirHuntMaxFromFlags(
  flags: Record<string, number> | undefined
): number {
  return isFenrirPhaseTwoFlag(flags) ? 4 : 3;
}

function withDefaultMechanicFlags(
  flags: Record<string, number> | undefined
): Record<string, number> {
  const huntMax = getFenrirHuntMaxFromFlags(flags);
  return {
    [HUNT_REMAINING_KEY]: huntMax,
    ...(flags ?? {}),
  };
}

function getFlag(enemy: EnemyState, key: string): number {
  return Math.max(
    0,
    Math.floor(withDefaultMechanicFlags(enemy.mechanicFlags)[key] ?? 0)
  );
}

function setFlag(enemy: EnemyState, key: string, value: number): EnemyState {
  return {
    ...enemy,
    mechanicFlags: {
      ...withDefaultMechanicFlags(enemy.mechanicFlags),
      [key]: Math.max(0, Math.floor(value)),
    },
  };
}

function updateFenrir(
  state: CombatState,
  updater: (enemy: EnemyState) => EnemyState
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) => {
      if (!isFenrirEnemy(enemy)) return enemy;
      return updater({
        ...enemy,
        mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
      });
    }),
  };
}

function getFenrirEnemy(state: CombatState): EnemyState | null {
  const fenrir = state.enemies.find(isFenrirEnemy);
  if (!fenrir) return null;
  return {
    ...fenrir,
    mechanicFlags: withDefaultMechanicFlags(fenrir.mechanicFlags),
  };
}

export function isFenrirPhaseTwo(enemy: EnemyState): boolean {
  return getFlag(enemy, `${FLAG_PREFIX}_phase2`) > 0;
}

export function getFenrirHuntMax(enemy: EnemyState): number {
  return getFenrirHuntMaxFromFlags(
    withDefaultMechanicFlags(enemy.mechanicFlags)
  );
}

export function getFenrirHuntRemaining(enemy: EnemyState): number {
  return Math.min(getFenrirHuntMax(enemy), getFlag(enemy, HUNT_REMAINING_KEY));
}

export function getFenrirHuntDamageBonus(enemy: EnemyState): number {
  return getFenrirHuntRemaining(enemy) * HUNT_DAMAGE_PER_PIP;
}

export function hasFenrirUnbrokenHunt(enemy: EnemyState): boolean {
  return getFenrirHuntRemaining(enemy) > 0;
}

export function getFenrirUiState(
  enemy: EnemyState | null | undefined
): FenrirUiState | null {
  if (!enemy) return null;
  const fenrir = {
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  };
  if (!isFenrirEnemy(fenrir)) return null;

  const huntMax = getFenrirHuntMax(fenrir);
  const huntRemaining = getFenrirHuntRemaining(fenrir);

  return {
    phaseTwo: isFenrirPhaseTwo(fenrir),
    huntRemaining,
    huntMax,
    damageBonus: getFenrirHuntDamageBonus(fenrir),
    packHowlPrimed: huntRemaining > 0,
  };
}

export function initializeFenrirCombat(state: CombatState): CombatState {
  return updateFenrir(state, (enemy) =>
    setFlag(enemy, HUNT_REMAINING_KEY, getFenrirHuntMax(enemy))
  );
}

export function resetFenrirHuntForPlayerTurn(state: CombatState): CombatState {
  return initializeFenrirCombat(state);
}

export function registerFenrirHuntHit(
  state: CombatState,
  enemyInstanceId: string,
  source: "player" | "ally" | "other"
): CombatState {
  if (source === "other") return state;

  return {
    ...state,
    enemies: state.enemies.map((enemy) => {
      if (enemy.instanceId !== enemyInstanceId || !isFenrirEnemy(enemy)) {
        return enemy;
      }
      const current = {
        ...enemy,
        mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
      };
      const remaining = getFenrirHuntRemaining(current);
      if (remaining <= 0) return current;
      return setFlag(current, HUNT_REMAINING_KEY, remaining - 1);
    }),
  };
}

export function applyFenrirAbilityMechanics(
  state: CombatState,
  enemyInstanceId: string,
  ability: EnemyAbility,
  target: EffectTarget,
  enemyDefs: Map<string, EnemyDefinition> | undefined,
  rng: RNG
): CombatState {
  const fenrir = getFenrirEnemy(state);
  if (!fenrir || fenrir.instanceId !== enemyInstanceId) return state;

  let current = state;
  const huntBonus = getFenrirHuntDamageBonus(fenrir);
  const hasDamageEffect = ability.effects.some(
    (effect) =>
      effect.type === "DAMAGE" || effect.type === "DAMAGE_PER_TARGET_BLOCK"
  );

  if (huntBonus > 0 && hasDamageEffect) {
    current = applyFlatBonusDamage(
      current,
      enemyInstanceId,
      target,
      rng,
      huntBonus
    );
  }

  if (ability.name !== "Pack Howl" || !hasFenrirUnbrokenHunt(fenrir)) {
    return current;
  }

  const beforeCount = current.enemies.length;
  const withSummon = summonEnemyIfPossible(current, "draugr", enemyDefs);
  if (withSummon.enemies.length > beforeCount) {
    return withSummon;
  }

  if (!isFenrirPhaseTwo(fenrir)) {
    return current;
  }

  return applyBuffToPlayer(current, "BLEED", 2, 4);
}

export function getFenrirHuntDamagePerPip(): number {
  return HUNT_DAMAGE_PER_PIP;
}
