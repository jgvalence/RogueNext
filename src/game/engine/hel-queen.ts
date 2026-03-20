import type { CombatState } from "../schemas/combat-state";
import type { EnemyState } from "../schemas/entities";
import { applyBuff, getBuffStacks, removeBuff } from "./buffs";
import { resolveEffects } from "./effects";
import type { RNG } from "./rng";

const FLAG_PREFIX = "hel_queen";
const STANCE_KEY = `${FLAG_PREFIX}_stance`;
const TURNS_UNTIL_SWAP_KEY = `${FLAG_PREFIX}_turns_until_swap`;
const DRAUGR_REANIMATE_HP = 12;

export type HelQueenStance = "LIFE" | "DEATH";

export interface HelQueenUiState {
  phaseTwo: boolean;
  stance: HelQueenStance;
  nextStance: HelQueenStance;
  turnsUntilSwap: number;
}

function isHelQueenEnemy(
  enemy: Pick<EnemyState, "definitionId" | "currentHp"> | null | undefined
): enemy is Pick<EnemyState, "definitionId" | "currentHp"> {
  return Boolean(
    enemy &&
    enemy.definitionId === "hel_queen" &&
    Math.max(0, enemy.currentHp) > 0
  );
}

function sanitizeFlag(value: number | undefined, fallback: number): number {
  return Math.max(0, Math.floor(value ?? fallback));
}

function withDefaultMechanicFlags(
  flags: Record<string, number> | undefined
): Record<string, number> {
  const phaseTwo = sanitizeFlag(flags?.[`${FLAG_PREFIX}_phase2`], 0) > 0;
  const stance = sanitizeFlag(flags?.[STANCE_KEY], 0) > 0 ? 1 : 0;
  const turnsPerStance = phaseTwo ? 1 : 2;
  const turnsUntilSwap = Math.max(
    1,
    sanitizeFlag(flags?.[TURNS_UNTIL_SWAP_KEY], turnsPerStance)
  );

  return {
    ...(flags ?? {}),
    [STANCE_KEY]: stance,
    [TURNS_UNTIL_SWAP_KEY]: turnsUntilSwap,
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

function updateHelQueen(
  state: CombatState,
  updater: (enemy: EnemyState) => EnemyState
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) => {
      if (!isHelQueenEnemy(enemy)) return enemy;
      return updater({
        ...enemy,
        mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
      });
    }),
  };
}

function getHelQueenEnemy(state: CombatState): EnemyState | null {
  const hel = state.enemies.find(isHelQueenEnemy);
  if (!hel) return null;
  return {
    ...hel,
    mechanicFlags: withDefaultMechanicFlags(hel.mechanicFlags),
  };
}

function getTurnsPerStance(enemy: EnemyState): number {
  return isHelQueenPhaseTwo(enemy) ? 1 : 2;
}

function getOpposingStance(stance: HelQueenStance): HelQueenStance {
  return stance === "LIFE" ? "DEATH" : "LIFE";
}

export function isHelQueenPhaseTwo(enemy: EnemyState): boolean {
  return getFlag(enemy, `${FLAG_PREFIX}_phase2`) > 0;
}

export function getHelQueenStance(enemy: EnemyState): HelQueenStance {
  return getFlag(enemy, STANCE_KEY) > 0 ? "DEATH" : "LIFE";
}

export function getHelQueenTurnsUntilSwap(enemy: EnemyState): number {
  return Math.max(1, getFlag(enemy, TURNS_UNTIL_SWAP_KEY));
}

export function getHelQueenLifeBleed(enemy: EnemyState): {
  stacks: number;
  duration: number;
} {
  return isHelQueenPhaseTwo(enemy)
    ? { stacks: 3, duration: 5 }
    : { stacks: 2, duration: 4 };
}

export function getHelQueenDeathCashoutPerBleed(_enemy: EnemyState): number {
  return 3;
}

export function getHelQueenDeathWeak(enemy: EnemyState): {
  stacks: number;
  duration: number;
} {
  return isHelQueenPhaseTwo(enemy)
    ? { stacks: 1, duration: 2 }
    : { stacks: 0, duration: 0 };
}

export function getHelQueenDeathCashoutDamage(
  state: CombatState,
  enemy: EnemyState
): number {
  return (
    getBuffStacks(state.player.buffs, "BLEED") *
    getHelQueenDeathCashoutPerBleed(enemy)
  );
}

export function canHelQueenReinvokeDraugr(state: CombatState): boolean {
  return state.enemies.some(
    (enemy) => enemy.definitionId === "draugr" && enemy.currentHp <= 0
  );
}

export function getHelQueenUiState(
  enemy: EnemyState | null | undefined
): HelQueenUiState | null {
  if (!enemy) return null;
  const hel = {
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  };
  if (!isHelQueenEnemy(hel)) return null;

  const stance = getHelQueenStance(hel);
  return {
    phaseTwo: isHelQueenPhaseTwo(hel),
    stance,
    nextStance: getOpposingStance(stance),
    turnsUntilSwap: getHelQueenTurnsUntilSwap(hel),
  };
}

export function initializeHelQueenCombat(state: CombatState): CombatState {
  return updateHelQueen(state, (enemy) => {
    let current = setFlag(enemy, STANCE_KEY, 0);
    current = setFlag(current, TURNS_UNTIL_SWAP_KEY, getTurnsPerStance(enemy));
    return current;
  });
}

export function triggerHelQueenPhaseShift(
  state: CombatState,
  enemyInstanceId: string
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) => {
      if (enemy.instanceId !== enemyInstanceId || !isHelQueenEnemy(enemy)) {
        return enemy;
      }
      const current = {
        ...enemy,
        mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
      };
      return setFlag(current, TURNS_UNTIL_SWAP_KEY, 1);
    }),
  };
}

function advanceHelQueenCycle(
  state: CombatState,
  enemyInstanceId: string
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) => {
      if (enemy.instanceId !== enemyInstanceId || !isHelQueenEnemy(enemy)) {
        return enemy;
      }

      let current: EnemyState = {
        ...enemy,
        mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
      };
      const turnsLeft = getHelQueenTurnsUntilSwap(current);
      if (turnsLeft > 1) {
        return setFlag(current, TURNS_UNTIL_SWAP_KEY, turnsLeft - 1);
      }

      const nextStance = getOpposingStance(getHelQueenStance(current));
      current = setFlag(current, STANCE_KEY, nextStance === "DEATH" ? 1 : 0);
      return setFlag(current, TURNS_UNTIL_SWAP_KEY, getTurnsPerStance(current));
    }),
  };
}

function reanimateDraugrIfPossible(state: CombatState): CombatState {
  let revived = false;

  return {
    ...state,
    enemies: state.enemies.map((enemy) => {
      if (revived || enemy.definitionId !== "draugr" || enemy.currentHp > 0) {
        return enemy;
      }
      revived = true;
      return {
        ...enemy,
        currentHp: Math.min(enemy.maxHp, DRAUGR_REANIMATE_HP),
        block: 0,
        buffs: [],
        intentIndex: 0,
      };
    }),
  };
}

export function applyHelQueenAbilityMechanics(
  state: CombatState,
  enemyInstanceId: string,
  rng: RNG
): CombatState {
  const hel = getHelQueenEnemy(state);
  if (!hel || hel.instanceId !== enemyInstanceId) return state;

  let current = state;

  if (getHelQueenStance(hel) === "LIFE") {
    const bleed = getHelQueenLifeBleed(hel);
    current = {
      ...current,
      player: {
        ...current.player,
        buffs: applyBuff(
          current.player.buffs,
          "BLEED",
          bleed.stacks,
          bleed.duration
        ),
      },
    };
    return advanceHelQueenCycle(current, enemyInstanceId);
  }

  const cashoutDamage = getHelQueenDeathCashoutDamage(current, hel);
  if (cashoutDamage > 0) {
    current = resolveEffects(
      current,
      [{ type: "DAMAGE", value: cashoutDamage }],
      {
        source: { type: "enemy", instanceId: enemyInstanceId },
        target: "player",
      },
      rng
    );
    current = {
      ...current,
      player: {
        ...current.player,
        buffs: removeBuff(current.player.buffs, "BLEED"),
      },
    };
  }

  current = reanimateDraugrIfPossible(current);

  const deathWeak = getHelQueenDeathWeak(hel);
  if (deathWeak.stacks > 0) {
    current = {
      ...current,
      player: {
        ...current.player,
        buffs: applyBuff(
          current.player.buffs,
          "WEAK",
          deathWeak.stacks,
          deathWeak.duration
        ),
      },
    };
  }

  return advanceHelQueenCycle(current, enemyInstanceId);
}
