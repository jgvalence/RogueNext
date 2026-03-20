import type { CombatState } from "../schemas/combat-state";
import type { EnemyState } from "../schemas/entities";
import { applyBuff } from "./buffs";
import {
  applyNextTurnCardCostIncrease,
  freezePlayerHandCards,
  summonEnemyIfPossible,
} from "./boss-mechanics/shared";

const FLAG_PREFIX = "baba_yaga_hut";
const FACE_KEY = `${FLAG_PREFIX}_face`;
const TURNS_UNTIL_ROTATE_KEY = `${FLAG_PREFIX}_turns_until_rotate`;
const TURN_ATTACKS_KEY = `${FLAG_PREFIX}_turn_attacks`;
const TURN_BLOCK_GAINED_KEY = `${FLAG_PREFIX}_turn_block_gained`;
const TURN_INK_SPENT_KEY = `${FLAG_PREFIX}_turn_ink_spent`;

const TEETH_ATTACK_THRESHOLD = 2;
const BONES_BLOCK_THRESHOLD = 8;
const HEARTH_INK_THRESHOLD = 2;
const CURSE_ATTACK_THRESHOLD = 1;
const CURSE_BLOCK_THRESHOLD = 6;
const CURSE_INK_THRESHOLD = 1;

export type BabaYagaFace = "TEETH" | "BONES" | "HEARTH" | "CURSE";

export interface BabaYagaUiState {
  phaseTwo: boolean;
  face: BabaYagaFace;
  nextFace: BabaYagaFace;
  turnsUntilRotate: number;
  appeased: boolean;
  attackProgress: number;
  attackThreshold: number;
  blockProgress: number;
  blockThreshold: number;
  inkProgress: number;
  inkThreshold: number;
  curseSatisfiedCount: number;
  curseRequirementCount: number;
}

function isBabaYagaEnemy(
  enemy: Pick<EnemyState, "definitionId" | "currentHp"> | null | undefined
): enemy is Pick<EnemyState, "definitionId" | "currentHp"> {
  return Boolean(
    enemy &&
    enemy.definitionId === "baba_yaga_hut" &&
    Math.max(0, enemy.currentHp) > 0
  );
}

function sanitizeFlag(value: number | undefined, fallback: number): number {
  return Math.max(0, Math.floor(value ?? fallback));
}

function clampFaceIndex(value: number, phaseTwo: boolean): number {
  if (phaseTwo) {
    return Math.min(3, Math.max(0, value));
  }
  return Math.min(2, Math.max(0, value));
}

function withDefaultMechanicFlags(
  flags: Record<string, number> | undefined
): Record<string, number> {
  const phaseTwo = sanitizeFlag(flags?.[`${FLAG_PREFIX}_phase2`], 0) > 0;
  const turnsPerFace = phaseTwo ? 1 : 2;

  return {
    ...(flags ?? {}),
    [FACE_KEY]: clampFaceIndex(sanitizeFlag(flags?.[FACE_KEY], 0), phaseTwo),
    [TURNS_UNTIL_ROTATE_KEY]: Math.max(
      1,
      sanitizeFlag(flags?.[TURNS_UNTIL_ROTATE_KEY], turnsPerFace)
    ),
    [TURN_ATTACKS_KEY]: sanitizeFlag(flags?.[TURN_ATTACKS_KEY], 0),
    [TURN_BLOCK_GAINED_KEY]: sanitizeFlag(flags?.[TURN_BLOCK_GAINED_KEY], 0),
    [TURN_INK_SPENT_KEY]: sanitizeFlag(flags?.[TURN_INK_SPENT_KEY], 0),
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

function updateBabaYaga(
  state: CombatState,
  updater: (enemy: EnemyState) => EnemyState
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) => {
      if (!isBabaYagaEnemy(enemy)) return enemy;
      return updater({
        ...enemy,
        mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
      });
    }),
  };
}

function getBabaYagaEnemy(state: CombatState): EnemyState | null {
  const babaYaga = state.enemies.find(isBabaYagaEnemy);
  if (!babaYaga) return null;
  return {
    ...babaYaga,
    mechanicFlags: withDefaultMechanicFlags(babaYaga.mechanicFlags),
  };
}

function getTurnsPerFace(enemy: EnemyState): number {
  return isBabaYagaPhaseTwo(enemy) ? 1 : 2;
}

function getFaceByIndex(index: number): BabaYagaFace {
  switch (index) {
    case 1:
      return "BONES";
    case 2:
      return "HEARTH";
    case 3:
      return "CURSE";
    default:
      return "TEETH";
  }
}

function getFaceIndex(face: BabaYagaFace): number {
  switch (face) {
    case "BONES":
      return 1;
    case "HEARTH":
      return 2;
    case "CURSE":
      return 3;
    default:
      return 0;
  }
}

function getNextFace(face: BabaYagaFace, phaseTwo: boolean): BabaYagaFace {
  if (!phaseTwo) {
    switch (face) {
      case "TEETH":
        return "BONES";
      case "BONES":
        return "HEARTH";
      default:
        return "TEETH";
    }
  }

  switch (face) {
    case "TEETH":
      return "BONES";
    case "BONES":
      return "HEARTH";
    case "HEARTH":
      return "CURSE";
    default:
      return "TEETH";
  }
}

export function isBabaYagaPhaseTwo(enemy: EnemyState): boolean {
  return getFlag(enemy, `${FLAG_PREFIX}_phase2`) > 0;
}

export function getBabaYagaFace(enemy: EnemyState): BabaYagaFace {
  return getFaceByIndex(getFlag(enemy, FACE_KEY));
}

export function getBabaYagaTurnsUntilRotate(enemy: EnemyState): number {
  return Math.max(1, getFlag(enemy, TURNS_UNTIL_ROTATE_KEY));
}

function getCurseSatisfiedCount(enemy: EnemyState): number {
  let satisfied = 0;

  if (getFlag(enemy, TURN_ATTACKS_KEY) >= CURSE_ATTACK_THRESHOLD) {
    satisfied += 1;
  }
  if (getFlag(enemy, TURN_BLOCK_GAINED_KEY) >= CURSE_BLOCK_THRESHOLD) {
    satisfied += 1;
  }
  if (getFlag(enemy, TURN_INK_SPENT_KEY) >= CURSE_INK_THRESHOLD) {
    satisfied += 1;
  }

  return satisfied;
}

export function isBabaYagaFaceAppeased(enemy: EnemyState): boolean {
  switch (getBabaYagaFace(enemy)) {
    case "TEETH":
      return getFlag(enemy, TURN_ATTACKS_KEY) >= TEETH_ATTACK_THRESHOLD;
    case "BONES":
      return getFlag(enemy, TURN_BLOCK_GAINED_KEY) >= BONES_BLOCK_THRESHOLD;
    case "HEARTH":
      return getFlag(enemy, TURN_INK_SPENT_KEY) >= HEARTH_INK_THRESHOLD;
    case "CURSE":
      return getCurseSatisfiedCount(enemy) >= 3;
    default:
      return false;
  }
}

export function getBabaYagaUiState(
  enemy: EnemyState | null | undefined
): BabaYagaUiState | null {
  if (!enemy) return null;
  const babaYaga = {
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  };
  if (!isBabaYagaEnemy(babaYaga)) return null;

  const face = getBabaYagaFace(babaYaga);
  const phaseTwo = isBabaYagaPhaseTwo(babaYaga);

  return {
    phaseTwo,
    face,
    nextFace: getNextFace(face, phaseTwo),
    turnsUntilRotate: getBabaYagaTurnsUntilRotate(babaYaga),
    appeased: isBabaYagaFaceAppeased(babaYaga),
    attackProgress: getFlag(babaYaga, TURN_ATTACKS_KEY),
    attackThreshold: TEETH_ATTACK_THRESHOLD,
    blockProgress: getFlag(babaYaga, TURN_BLOCK_GAINED_KEY),
    blockThreshold: BONES_BLOCK_THRESHOLD,
    inkProgress: getFlag(babaYaga, TURN_INK_SPENT_KEY),
    inkThreshold: HEARTH_INK_THRESHOLD,
    curseSatisfiedCount: getCurseSatisfiedCount(babaYaga),
    curseRequirementCount: 3,
  };
}

export function initializeBabaYagaCombat(state: CombatState): CombatState {
  return updateBabaYaga(state, (enemy) => ({
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  }));
}

export function resetBabaYagaTurnState(state: CombatState): CombatState {
  return updateBabaYaga(state, (enemy) =>
    setFlag(
      setFlag(setFlag(enemy, TURN_ATTACKS_KEY, 0), TURN_BLOCK_GAINED_KEY, 0),
      TURN_INK_SPENT_KEY,
      0
    )
  );
}

export function registerBabaYagaAttackCardPlayed(
  state: CombatState
): CombatState {
  const babaYaga = getBabaYagaEnemy(state);
  if (!babaYaga) return state;

  return updateBabaYaga(state, (enemy) =>
    setFlag(enemy, TURN_ATTACKS_KEY, getFlag(enemy, TURN_ATTACKS_KEY) + 1)
  );
}

export function registerBabaYagaBlockGain(
  state: CombatState,
  gainedBlock: number
): CombatState {
  if (gainedBlock <= 0) return state;
  const babaYaga = getBabaYagaEnemy(state);
  if (!babaYaga) return state;

  return updateBabaYaga(state, (enemy) =>
    setFlag(
      enemy,
      TURN_BLOCK_GAINED_KEY,
      getFlag(enemy, TURN_BLOCK_GAINED_KEY) + gainedBlock
    )
  );
}

export function registerBabaYagaInkSpent(
  state: CombatState,
  spentInk: number
): CombatState {
  if (spentInk <= 0) return state;
  const babaYaga = getBabaYagaEnemy(state);
  if (!babaYaga) return state;

  return updateBabaYaga(state, (enemy) =>
    setFlag(
      enemy,
      TURN_INK_SPENT_KEY,
      getFlag(enemy, TURN_INK_SPENT_KEY) + spentInk
    )
  );
}

function grantEnemyStrength(
  state: CombatState,
  enemyInstanceId: string,
  amount: number
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) =>
      enemy.instanceId === enemyInstanceId
        ? {
            ...enemy,
            buffs: applyBuff(enemy.buffs, "STRENGTH", amount),
          }
        : enemy
    ),
  };
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

function applyBabaYagaFacePunishment(
  state: CombatState,
  enemy: EnemyState
): CombatState {
  const phaseTwo = isBabaYagaPhaseTwo(enemy);

  switch (getBabaYagaFace(enemy)) {
    case "TEETH":
      return grantEnemyStrength(state, enemy.instanceId, phaseTwo ? 2 : 1);
    case "BONES":
      return grantEnemyBlock(state, enemy.instanceId, phaseTwo ? 12 : 8);
    case "HEARTH":
      return freezePlayerHandCards(state, phaseTwo ? 2 : 1);
    case "CURSE": {
      let current = freezePlayerHandCards(state, 2);
      current = applyNextTurnCardCostIncrease(current, 1);
      return current;
    }
    default:
      return state;
  }
}

function advanceBabaYagaCycle(
  state: CombatState,
  enemyInstanceId: string
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) => {
      if (enemy.instanceId !== enemyInstanceId || !isBabaYagaEnemy(enemy)) {
        return enemy;
      }

      let current: EnemyState = {
        ...enemy,
        mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
      };
      const turnsLeft = getBabaYagaTurnsUntilRotate(current);
      if (turnsLeft > 1) {
        return setFlag(current, TURNS_UNTIL_ROTATE_KEY, turnsLeft - 1);
      }

      const nextFace = getNextFace(
        getBabaYagaFace(current),
        isBabaYagaPhaseTwo(current)
      );
      current = setFlag(current, FACE_KEY, getFaceIndex(nextFace));
      return setFlag(current, TURNS_UNTIL_ROTATE_KEY, getTurnsPerFace(current));
    }),
  };
}

export function triggerBabaYagaPhaseShift(
  state: CombatState,
  enemyInstanceId: string,
  enemyDefs?: Parameters<typeof summonEnemyIfPossible>[2]
): CombatState {
  const current = {
    ...state,
    enemies: state.enemies.map((enemy) => {
      if (enemy.instanceId !== enemyInstanceId || !isBabaYagaEnemy(enemy)) {
        return enemy;
      }
      return setFlag(
        {
          ...enemy,
          mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
        },
        TURNS_UNTIL_ROTATE_KEY,
        1
      );
    }),
  };

  return summonEnemyIfPossible(current, "snow_maiden", enemyDefs);
}

export function applyBabaYagaAbilityMechanics(
  state: CombatState,
  enemyInstanceId: string
): CombatState {
  const babaYaga = getBabaYagaEnemy(state);
  if (!babaYaga || babaYaga.instanceId !== enemyInstanceId) return state;

  let current = state;

  if (!isBabaYagaFaceAppeased(babaYaga)) {
    current = applyBabaYagaFacePunishment(current, babaYaga);
  }

  return advanceBabaYagaCycle(current, enemyInstanceId);
}
