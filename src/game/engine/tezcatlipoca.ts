import type { CardDefinition } from "../schemas/cards";
import type { CombatState } from "../schemas/combat-state";
import type { EnemyState } from "../schemas/entities";
import type { Effect } from "../schemas/effects";
import type { RNG } from "./rng";
import {
  addCardsToDrawPile,
  applyFlatBonusDamage,
  applyNextTurnCardCostIncrease,
} from "./boss-mechanics/shared";

const FLAG_PREFIX = "tezcatlipoca_echo";
const SLOT_ONE_FAMILY_KEY = `${FLAG_PREFIX}_slot_1_family`;
const SLOT_ONE_VALUE_KEY = `${FLAG_PREFIX}_slot_1_value`;
const SLOT_TWO_FAMILY_KEY = `${FLAG_PREFIX}_slot_2_family`;
const SLOT_TWO_VALUE_KEY = `${FLAG_PREFIX}_slot_2_value`;

const MIRROR_FAMILY_NONE = 0;
const MIRROR_FAMILY_ATTACK = 1;
const MIRROR_FAMILY_BLOCK = 2;
const MIRROR_FAMILY_INK = 3;
const MIRROR_FAMILY_HEX = 4;

type MirrorFamily =
  | typeof MIRROR_FAMILY_NONE
  | typeof MIRROR_FAMILY_ATTACK
  | typeof MIRROR_FAMILY_BLOCK
  | typeof MIRROR_FAMILY_INK
  | typeof MIRROR_FAMILY_HEX;

interface MirrorEcho {
  family: MirrorFamily;
  value: number;
}

export interface TezcatlipocaMirrorUiState {
  family: "ATTACK" | "BLOCK" | "INK" | "HEX";
  value: number;
}

export interface TezcatlipocaUiState {
  phaseTwo: boolean;
  slots: TezcatlipocaMirrorUiState[];
}

function isTezcatlipocaEnemy(
  enemy: Pick<EnemyState, "definitionId"> | null | undefined
): enemy is Pick<EnemyState, "definitionId"> {
  return Boolean(enemy && enemy.definitionId === "tezcatlipoca_echo");
}

function sanitizeFlag(value: number | undefined, fallback: number): number {
  return Math.max(0, Math.floor(value ?? fallback));
}

function clampMirrorFamily(value: number): MirrorFamily {
  if (value === MIRROR_FAMILY_ATTACK) return MIRROR_FAMILY_ATTACK;
  if (value === MIRROR_FAMILY_BLOCK) return MIRROR_FAMILY_BLOCK;
  if (value === MIRROR_FAMILY_INK) return MIRROR_FAMILY_INK;
  if (value === MIRROR_FAMILY_HEX) return MIRROR_FAMILY_HEX;
  return MIRROR_FAMILY_NONE;
}

function withDefaultMechanicFlags(
  flags: Record<string, number> | undefined
): Record<string, number> {
  return {
    ...(flags ?? {}),
    [SLOT_ONE_FAMILY_KEY]: clampMirrorFamily(
      sanitizeFlag(flags?.[SLOT_ONE_FAMILY_KEY], MIRROR_FAMILY_NONE)
    ),
    [SLOT_ONE_VALUE_KEY]: sanitizeFlag(flags?.[SLOT_ONE_VALUE_KEY], 0),
    [SLOT_TWO_FAMILY_KEY]: clampMirrorFamily(
      sanitizeFlag(flags?.[SLOT_TWO_FAMILY_KEY], MIRROR_FAMILY_NONE)
    ),
    [SLOT_TWO_VALUE_KEY]: sanitizeFlag(flags?.[SLOT_TWO_VALUE_KEY], 0),
  };
}

function setFlag(enemy: EnemyState, key: string, value: number): EnemyState {
  return {
    ...enemy,
    mechanicFlags: {
      ...withDefaultMechanicFlags(enemy.mechanicFlags),
      [key]:
        key === SLOT_ONE_FAMILY_KEY || key === SLOT_TWO_FAMILY_KEY
          ? clampMirrorFamily(value)
          : sanitizeFlag(value, 0),
    },
  };
}

function updateTezcatlipoca(
  state: CombatState,
  updater: (enemy: EnemyState) => EnemyState
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) => {
      if (!isTezcatlipocaEnemy(enemy)) return enemy;
      return updater({
        ...enemy,
        mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
      });
    }),
  };
}

function getTezcatlipocaEnemy(state: CombatState): EnemyState | null {
  const enemy = state.enemies.find(isTezcatlipocaEnemy);
  if (!enemy) return null;
  return {
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  };
}

function isPhaseTwo(enemy: EnemyState): boolean {
  return (enemy.mechanicFlags?.tezcatlipoca_echo_phase2 ?? 0) > 0;
}

function getActiveSlotCount(enemy: EnemyState): number {
  return isPhaseTwo(enemy) ? 2 : 1;
}

function clampMirrorValue(rawValue: number): number {
  return Math.min(12, Math.max(1, Math.ceil(rawValue)));
}

function sumAttackScore(effects: readonly Effect[]): number {
  return effects.reduce((total, effect) => {
    switch (effect.type) {
      case "DAMAGE":
      case "DAMAGE_PER_TARGET_BLOCK":
      case "DAMAGE_EQUAL_BLOCK":
      case "DAMAGE_PER_DEBUFF":
      case "DAMAGE_IF_TARGET_HAS_DEBUFF":
      case "DAMAGE_PER_THIS_CARD_PLAYED":
      case "DAMAGE_PER_CURRENT_INK":
      case "DAMAGE_PER_CLOG_IN_DISCARD":
      case "DAMAGE_PER_EXHAUSTED_CARD":
      case "DAMAGE_PER_DRAWN_THIS_TURN":
      case "DAMAGE_BONUS_IF_UPGRADED_IN_HAND":
        return total + Math.max(0, effect.value);
      default:
        return total;
    }
  }, 0);
}

function sumBlockScore(effects: readonly Effect[]): number {
  return effects.reduce((total, effect) => {
    switch (effect.type) {
      case "BLOCK":
      case "BLOCK_PER_CURRENT_INK":
      case "BLOCK_PER_DEBUFF":
      case "BLOCK_PER_EXHAUSTED_CARD":
      case "HEAL":
        return total + Math.max(0, effect.value);
      default:
        return total;
    }
  }, 0);
}

function sumInkScore(
  definition: CardDefinition,
  effects: readonly Effect[],
  inkCost: number
): number {
  const effectScore = effects.reduce((total, effect) => {
    switch (effect.type) {
      case "GAIN_INK":
        return total + Math.max(0, effect.value * 2);
      case "DRAIN_INK":
        return total + Math.max(0, effect.value);
      case "BLOCK_PER_CURRENT_INK":
      case "DAMAGE_PER_CURRENT_INK":
      case "DISABLE_INK_POWER_THIS_TURN":
        return total + Math.max(0, effect.value + 2);
      default:
        return total;
    }
  }, 0);

  const cardInkBias = inkCost > 0 ? inkCost * 3 : 0;
  const starterInkBias = definition.id === "ink_surge" ? 3 : 0;
  return effectScore + cardInkBias + starterInkBias;
}

function sumHexScore(
  definition: CardDefinition,
  effects: readonly Effect[],
  energyCost: number
): number {
  const effectScore = effects.reduce((total, effect) => {
    switch (effect.type) {
      case "APPLY_DEBUFF":
      case "ADD_CARD_TO_DRAW":
      case "ADD_CARD_TO_DISCARD":
      case "FREEZE_HAND_CARDS":
      case "NEXT_DRAW_TO_DISCARD_THIS_TURN":
      case "INCREASE_CARD_COST_THIS_TURN":
      case "INCREASE_CARD_COST_NEXT_TURN":
      case "REDUCE_DRAW_THIS_TURN":
      case "REDUCE_DRAW_NEXT_TURN":
      case "FORCE_DISCARD_RANDOM":
      case "DRAW_CARDS":
      case "MOVE_RANDOM_NON_CLOG_DISCARD_TO_HAND":
      case "EXHAUST":
      case "UPGRADE_RANDOM_CARD_IN_HAND":
        return total + Math.max(0, effect.value + 1);
      case "APPLY_BUFF":
      case "APPLY_BUFF_PER_DEBUFF":
      case "APPLY_BUFF_PER_EXHAUSTED_CARD":
      case "GAIN_ENERGY":
      case "GAIN_STRENGTH":
      case "GAIN_FOCUS":
      case "DOUBLE_POISON":
      case "RETRIGGER_THORNS_ON_WEAK_ATTACK":
        return total + Math.max(0, effect.value);
      default:
        return total;
    }
  }, 0);

  if (effectScore > 0) return effectScore;
  if (definition.type === "POWER") return Math.max(3, energyCost + 2);
  if (definition.type === "STATUS" || definition.type === "CURSE") return 1;
  return 0;
}

function classifyMirrorEcho(
  definition: CardDefinition,
  effects: readonly Effect[],
  energyCost: number,
  inkCost: number
): MirrorEcho {
  const attackScore = sumAttackScore(effects);
  const blockScore = sumBlockScore(effects);
  const inkScore = sumInkScore(definition, effects, inkCost);
  const hexScore = sumHexScore(definition, effects, energyCost);

  const ranked = [
    { family: MIRROR_FAMILY_ATTACK, score: attackScore },
    { family: MIRROR_FAMILY_BLOCK, score: blockScore },
    { family: MIRROR_FAMILY_INK, score: inkScore },
    { family: MIRROR_FAMILY_HEX, score: hexScore },
  ].sort((left, right) => right.score - left.score);

  const best = ranked[0];
  if (!best || best.score <= 0) {
    if (definition.type === "ATTACK") {
      return {
        family: MIRROR_FAMILY_ATTACK,
        value: clampMirrorValue(energyCost + 4),
      };
    }
    if (definition.type === "SKILL") {
      return {
        family: MIRROR_FAMILY_HEX,
        value: clampMirrorValue(energyCost + 2),
      };
    }
    return { family: MIRROR_FAMILY_HEX, value: 1 };
  }

  return {
    family: best.family as MirrorFamily,
    value: clampMirrorValue(best.score),
  };
}

function readMirrorSlots(enemy: EnemyState): MirrorEcho[] {
  const flags = withDefaultMechanicFlags(enemy.mechanicFlags);
  return [
    {
      family: clampMirrorFamily(
        flags[SLOT_ONE_FAMILY_KEY] ?? MIRROR_FAMILY_NONE
      ),
      value: sanitizeFlag(flags[SLOT_ONE_VALUE_KEY], 0),
    },
    {
      family: clampMirrorFamily(
        flags[SLOT_TWO_FAMILY_KEY] ?? MIRROR_FAMILY_NONE
      ),
      value: sanitizeFlag(flags[SLOT_TWO_VALUE_KEY], 0),
    },
  ].filter((slot) => slot.family !== MIRROR_FAMILY_NONE && slot.value > 0);
}

function writeMirrorSlots(enemy: EnemyState, slots: MirrorEcho[]): EnemyState {
  const slotOne = slots[0] ?? { family: MIRROR_FAMILY_NONE, value: 0 };
  const slotTwo = slots[1] ?? { family: MIRROR_FAMILY_NONE, value: 0 };
  let next = setFlag(enemy, SLOT_ONE_FAMILY_KEY, slotOne.family);
  next = setFlag(next, SLOT_ONE_VALUE_KEY, slotOne.value);
  next = setFlag(next, SLOT_TWO_FAMILY_KEY, slotTwo.family);
  next = setFlag(next, SLOT_TWO_VALUE_KEY, slotTwo.value);
  return next;
}

function getMirrorEchoes(enemy: EnemyState): MirrorEcho[] {
  const activeSlots = getActiveSlotCount(enemy);
  return readMirrorSlots(enemy).slice(0, activeSlots);
}

function getFamilyUiLabel(
  family: MirrorFamily
): TezcatlipocaMirrorUiState["family"] | null {
  switch (family) {
    case MIRROR_FAMILY_ATTACK:
      return "ATTACK";
    case MIRROR_FAMILY_BLOCK:
      return "BLOCK";
    case MIRROR_FAMILY_INK:
      return "INK";
    case MIRROR_FAMILY_HEX:
      return "HEX";
    default:
      return null;
  }
}

function applyBlockToEnemy(
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

function getInkBurnCountFromMirrorValue(value: number): number {
  return Math.min(3, Math.max(1, Math.ceil(value / 4)));
}

function getCardCostTaxFromMirrorValue(value: number): number {
  return value >= 10 ? 2 : 1;
}

export function initializeTezcatlipocaCombat(state: CombatState): CombatState {
  const enemy = getTezcatlipocaEnemy(state);
  if (!enemy) return state;

  return synchronizeTezcatlipocaCombatState(state);
}

export function startTezcatlipocaPlayerTurn(state: CombatState): CombatState {
  const enemy = getTezcatlipocaEnemy(state);
  if (!enemy) return state;

  return updateTezcatlipoca(state, (currentEnemy) =>
    writeMirrorSlots(currentEnemy, [])
  );
}

export function synchronizeTezcatlipocaCombatState(
  state: CombatState
): CombatState {
  const enemy = getTezcatlipocaEnemy(state);
  if (!enemy) return state;

  return updateTezcatlipoca(state, (currentEnemy) => {
    const activeSlots = getActiveSlotCount(currentEnemy);
    const normalizedSlots = readMirrorSlots(currentEnemy)
      .sort((left, right) => right.value - left.value)
      .slice(0, activeSlots);
    return writeMirrorSlots(
      {
        ...currentEnemy,
        mechanicFlags: withDefaultMechanicFlags(currentEnemy.mechanicFlags),
      },
      normalizedSlots
    );
  });
}

export function registerTezcatlipocaCardPlayed(
  state: CombatState,
  definition: CardDefinition,
  effects: readonly Effect[],
  energyCost: number,
  inkCost: number
): CombatState {
  const enemy = getTezcatlipocaEnemy(state);
  if (!enemy || state.phase !== "PLAYER_TURN") return state;

  const candidate = classifyMirrorEcho(
    definition,
    effects,
    energyCost,
    inkCost
  );
  if (candidate.family === MIRROR_FAMILY_NONE || candidate.value <= 0) {
    return state;
  }

  return synchronizeTezcatlipocaCombatState(
    updateTezcatlipoca(state, (currentEnemy) => {
      const activeSlots = getActiveSlotCount(currentEnemy);
      const currentSlots = readMirrorSlots(currentEnemy);
      const merged = [...currentSlots, candidate]
        .sort((left, right) => right.value - left.value)
        .slice(0, activeSlots);
      return writeMirrorSlots(currentEnemy, merged);
    })
  );
}

export function applyTezcatlipocaMirrorEchoes(
  state: CombatState,
  enemyInstanceId: string,
  rng: RNG
): CombatState {
  const enemy = getTezcatlipocaEnemy(state);
  if (!enemy || enemy.instanceId !== enemyInstanceId) return state;

  const echoes = getMirrorEchoes(enemy);
  if (echoes.length === 0) return state;

  let current = state;
  for (const echo of echoes) {
    switch (echo.family) {
      case MIRROR_FAMILY_ATTACK:
        current = applyFlatBonusDamage(
          current,
          enemyInstanceId,
          "player",
          rng,
          echo.value
        );
        break;
      case MIRROR_FAMILY_BLOCK:
        current = applyBlockToEnemy(current, enemyInstanceId, echo.value);
        break;
      case MIRROR_FAMILY_INK:
        current = addCardsToDrawPile(
          current,
          "ink_burn",
          getInkBurnCountFromMirrorValue(echo.value)
        );
        break;
      case MIRROR_FAMILY_HEX:
        current = applyNextTurnCardCostIncrease(
          current,
          getCardCostTaxFromMirrorValue(echo.value)
        );
        break;
      default:
        break;
    }
  }

  return synchronizeTezcatlipocaCombatState(
    updateTezcatlipoca(current, (currentEnemy) =>
      writeMirrorSlots(currentEnemy, [])
    )
  );
}

export function getTezcatlipocaUiState(
  enemy: EnemyState | null | undefined
): TezcatlipocaUiState | null {
  if (!enemy || !isTezcatlipocaEnemy(enemy)) return null;

  const normalizedEnemy = {
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  };
  const slots = getMirrorEchoes(normalizedEnemy)
    .map((slot) => {
      const family = getFamilyUiLabel(slot.family);
      if (!family) return null;
      return {
        family,
        value: slot.value,
      };
    })
    .filter((slot): slot is TezcatlipocaMirrorUiState => slot != null);

  return {
    phaseTwo: isPhaseTwo(normalizedEnemy),
    slots,
  };
}
