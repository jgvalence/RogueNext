import type { CardDefinition } from "../schemas/cards";
import type { CombatState } from "../schemas/combat-state";
import type { EnemyDefinition, EnemyState } from "../schemas/entities";
import {
  addCardsToDrawPile,
  summonEnemyIfPossible,
} from "./boss-mechanics/shared";
import type { DrawSource } from "./deck";
import type { RNG } from "./rng";

const FLAG_PREFIX = "nyarlathotep_shard";
const SLOT_ONE_OMEN_KEY = `${FLAG_PREFIX}_slot_1_omen`;
const SLOT_ONE_CONSUMED_KEY = `${FLAG_PREFIX}_slot_1_consumed`;
const SLOT_TWO_OMEN_KEY = `${FLAG_PREFIX}_slot_2_omen`;
const SLOT_TWO_CONSUMED_KEY = `${FLAG_PREFIX}_slot_2_consumed`;

const OMEN_DRAW = 0;
const OMEN_INK = 1;
const OMEN_ATTACK = 2;
const OMEN_SKILL = 3;

type OmenValue =
  | typeof OMEN_DRAW
  | typeof OMEN_INK
  | typeof OMEN_ATTACK
  | typeof OMEN_SKILL;
type OmenLabel = "DRAW" | "INK" | "ATTACK" | "SKILL";

interface OmenSlot {
  slotIndex: 0 | 1;
  omen: OmenValue;
  consumed: boolean;
}

export interface NyarlathotepProphecyUiState {
  omen: OmenLabel;
  compactLabel: string;
  cardId: string;
  consumed: boolean;
}

export interface NyarlathotepUiState {
  phaseTwo: boolean;
  prophecies: NyarlathotepProphecyUiState[];
}

function isNyarlathotepEnemy(
  enemy: Pick<EnemyState, "definitionId"> | null | undefined
): enemy is Pick<EnemyState, "definitionId"> {
  return Boolean(enemy && enemy.definitionId === "nyarlathotep_shard");
}

function sanitizeFlag(value: number | undefined, fallback: number): number {
  return Math.max(0, Math.floor(value ?? fallback));
}

function clampOmen(value: number): OmenValue {
  if (value === OMEN_INK) return OMEN_INK;
  if (value === OMEN_ATTACK) return OMEN_ATTACK;
  if (value === OMEN_SKILL) return OMEN_SKILL;
  return OMEN_DRAW;
}

function withDefaultMechanicFlags(
  flags: Record<string, number> | undefined
): Record<string, number> {
  return {
    ...(flags ?? {}),
    [SLOT_ONE_OMEN_KEY]: clampOmen(sanitizeFlag(flags?.[SLOT_ONE_OMEN_KEY], 0)),
    [SLOT_ONE_CONSUMED_KEY]:
      sanitizeFlag(flags?.[SLOT_ONE_CONSUMED_KEY], 0) > 0 ? 1 : 0,
    [SLOT_TWO_OMEN_KEY]: clampOmen(sanitizeFlag(flags?.[SLOT_TWO_OMEN_KEY], 1)),
    [SLOT_TWO_CONSUMED_KEY]:
      sanitizeFlag(flags?.[SLOT_TWO_CONSUMED_KEY], 0) > 0 ? 1 : 0,
  };
}

function setFlag(enemy: EnemyState, key: string, value: number): EnemyState {
  return {
    ...enemy,
    mechanicFlags: {
      ...withDefaultMechanicFlags(enemy.mechanicFlags),
      [key]:
        key === SLOT_ONE_OMEN_KEY || key === SLOT_TWO_OMEN_KEY
          ? clampOmen(value)
          : sanitizeFlag(value, 0) > 0
            ? 1
            : 0,
    },
  };
}

function updateNyarlathotep(
  state: CombatState,
  updater: (enemy: EnemyState) => EnemyState
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) => {
      if (!isNyarlathotepEnemy(enemy)) return enemy;
      return updater({
        ...enemy,
        mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
      });
    }),
  };
}

function getNyarlathotepEnemy(state: CombatState): EnemyState | null {
  const enemy = state.enemies.find(isNyarlathotepEnemy);
  if (!enemy) return null;
  return {
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  };
}

function isPhaseTwo(enemy: EnemyState): boolean {
  return (enemy.mechanicFlags?.nyarlathotep_shard_phase2 ?? 0) > 0;
}

function getActiveProphecyCount(enemy: EnemyState): number {
  return isPhaseTwo(enemy) ? 2 : 1;
}

function getOmenLabel(omen: OmenValue): OmenLabel {
  switch (omen) {
    case OMEN_INK:
      return "INK";
    case OMEN_ATTACK:
      return "ATTACK";
    case OMEN_SKILL:
      return "SKILL";
    default:
      return "DRAW";
  }
}

function getOmenCompactLabel(omen: OmenValue): string {
  switch (omen) {
    case OMEN_INK:
      return "INK";
    case OMEN_ATTACK:
      return "ATK";
    case OMEN_SKILL:
      return "SKL";
    default:
      return "DRW";
  }
}

function getOmenPunishmentCardId(omen: OmenValue): string {
  switch (omen) {
    case OMEN_INK:
      return "ink_burn";
    case OMEN_ATTACK:
      return "echo_curse";
    case OMEN_SKILL:
      return "hexed_parchment";
    default:
      return "haunting_regret";
  }
}

function pickDistinctOmens(enemy: EnemyState, rng: RNG): OmenValue[] {
  return rng
    .shuffle([OMEN_DRAW, OMEN_INK, OMEN_ATTACK, OMEN_SKILL])
    .slice(0, getActiveProphecyCount(enemy)) as OmenValue[];
}

function setProphecies(state: CombatState, rng: RNG): CombatState {
  const nyarl = getNyarlathotepEnemy(state);
  if (!nyarl) return state;

  const picked = pickDistinctOmens(nyarl, rng);
  return updateNyarlathotep(state, (enemy) => {
    let nextEnemy = setFlag(enemy, SLOT_ONE_OMEN_KEY, picked[0] ?? OMEN_DRAW);
    nextEnemy = setFlag(nextEnemy, SLOT_ONE_CONSUMED_KEY, 0);
    nextEnemy = setFlag(nextEnemy, SLOT_TWO_OMEN_KEY, picked[1] ?? OMEN_INK);
    nextEnemy = setFlag(nextEnemy, SLOT_TWO_CONSUMED_KEY, 0);
    return nextEnemy;
  });
}

function readProphecySlots(enemy: EnemyState): OmenSlot[] {
  const flags = withDefaultMechanicFlags(enemy.mechanicFlags);
  const slots: [OmenSlot, OmenSlot] = [
    {
      slotIndex: 0,
      omen: clampOmen(flags[SLOT_ONE_OMEN_KEY] ?? OMEN_DRAW),
      consumed: sanitizeFlag(flags[SLOT_ONE_CONSUMED_KEY], 0) > 0,
    },
    {
      slotIndex: 1,
      omen: clampOmen(flags[SLOT_TWO_OMEN_KEY] ?? OMEN_INK),
      consumed: sanitizeFlag(flags[SLOT_TWO_CONSUMED_KEY], 0) > 0,
    },
  ];
  return slots.slice(0, getActiveProphecyCount(enemy));
}

function getConsumedKey(slotIndex: 0 | 1): string {
  return slotIndex === 0 ? SLOT_ONE_CONSUMED_KEY : SLOT_TWO_CONSUMED_KEY;
}

function triggerMatchingOmen(state: CombatState, omen: OmenValue): CombatState {
  const nyarl = getNyarlathotepEnemy(state);
  if (!nyarl || state.phase !== "PLAYER_TURN") return state;

  const slot = readProphecySlots(nyarl).find(
    (entry) => entry.omen === omen && !entry.consumed
  );
  if (!slot) return state;

  let current = updateNyarlathotep(state, (enemy) =>
    setFlag(enemy, getConsumedKey(slot.slotIndex), 1)
  );
  current = addCardsToDrawPile(current, getOmenPunishmentCardId(omen), 1);
  return synchronizeNyarlathotepCombatState(current);
}

export function initializeNyarlathotepCombat(
  state: CombatState,
  rng: RNG
): CombatState {
  const nyarl = getNyarlathotepEnemy(state);
  if (!nyarl) return state;
  return synchronizeNyarlathotepCombatState(setProphecies(state, rng));
}

export function startNyarlathotepPlayerTurn(
  state: CombatState,
  rng: RNG
): CombatState {
  const nyarl = getNyarlathotepEnemy(state);
  if (!nyarl) return state;
  return synchronizeNyarlathotepCombatState(setProphecies(state, rng));
}

export function triggerNyarlathotepPhaseTwo(
  state: CombatState,
  enemyInstanceId: string,
  enemyDefs?: Map<string, EnemyDefinition>
): CombatState {
  const nyarl = state.enemies.find(
    (enemy) => enemy.instanceId === enemyInstanceId
  );
  if (!nyarl || !isNyarlathotepEnemy(nyarl)) {
    return synchronizeNyarlathotepCombatState(state);
  }

  const phased = updateNyarlathotep(state, (enemy) =>
    setFlag(enemy, "nyarlathotep_shard_phase2", 1)
  );
  return synchronizeNyarlathotepCombatState(
    summonEnemyIfPossible(phased, "void_tendril", enemyDefs)
  );
}

export function registerNyarlathotepCardPlayed(
  state: CombatState,
  definition: CardDefinition,
  inkCost: number
): CombatState {
  if (definition.type === "STATUS" || definition.type === "CURSE") {
    return state;
  }

  let current = state;
  if (definition.type === "ATTACK") {
    current = triggerMatchingOmen(current, OMEN_ATTACK);
  } else if (definition.type === "SKILL") {
    current = triggerMatchingOmen(current, OMEN_SKILL);
  }
  if (inkCost > 0) {
    current = triggerMatchingOmen(current, OMEN_INK);
  }
  return synchronizeNyarlathotepCombatState(current);
}

export function registerNyarlathotepInkSpent(
  state: CombatState,
  amount: number
): CombatState {
  if (amount <= 0) return state;
  return synchronizeNyarlathotepCombatState(
    triggerMatchingOmen(state, OMEN_INK)
  );
}

export function registerNyarlathotepDrawAction(
  state: CombatState,
  source: DrawSource,
  reason: string,
  movedToHand: number
): CombatState {
  if (
    movedToHand <= 0 ||
    source !== "PLAYER" ||
    reason === "TURN_START_BASE_DRAW"
  ) {
    return state;
  }
  return synchronizeNyarlathotepCombatState(
    triggerMatchingOmen(state, OMEN_DRAW)
  );
}

export function synchronizeNyarlathotepCombatState(
  state: CombatState
): CombatState {
  const nyarl = getNyarlathotepEnemy(state);
  if (!nyarl) return state;

  return updateNyarlathotep(state, (enemy) => {
    let nextEnemy: EnemyState = {
      ...enemy,
      mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
    };
    if (!isPhaseTwo(nextEnemy)) {
      nextEnemy = setFlag(nextEnemy, SLOT_TWO_CONSUMED_KEY, 0);
    }
    return nextEnemy;
  });
}

export function getNyarlathotepUiState(
  enemy: EnemyState | null | undefined
): NyarlathotepUiState | null {
  if (!enemy || !isNyarlathotepEnemy(enemy)) return null;

  const normalizedEnemy = {
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  };

  return {
    phaseTwo: isPhaseTwo(normalizedEnemy),
    prophecies: readProphecySlots(normalizedEnemy).map((slot) => ({
      omen: getOmenLabel(slot.omen),
      compactLabel: getOmenCompactLabel(slot.omen),
      cardId: getOmenPunishmentCardId(slot.omen),
      consumed: slot.consumed,
    })),
  };
}
