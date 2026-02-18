import type { CombatState } from "../schemas/combat-state";
import type { RunState } from "../schemas/run-state";
import type { EnemyDefinition, EnemyState } from "../schemas/entities";
import type { CardDefinition } from "../schemas/cards";
import { GAME_CONSTANTS } from "../constants";
import { drawCards, discardHand, shuffleDeck } from "./deck";
import { executeEnemiesTurn } from "./enemies";
import type { RNG } from "./rng";
import { nanoid } from "nanoid";

/**
 * Initialize a new combat encounter.
 */
export function initCombat(
  runState: RunState,
  enemyIds: string[],
  enemyDefs: Map<string, EnemyDefinition>,
  _cardDefs: Map<string, CardDefinition>,
  rng: RNG
): CombatState {
  // Create enemy instances
  const enemies: EnemyState[] = enemyIds.map((id) => {
    const def = enemyDefs.get(id);
    if (!def) throw new Error(`Unknown enemy definition: ${id}`);
    return {
      instanceId: nanoid(),
      definitionId: id,
      name: def.name,
      currentHp: def.maxHp,
      maxHp: def.maxHp,
      block: 0,
      speed: def.speed,
      buffs: [],
      intentIndex: 0,
    };
  });

  // Build draw pile from run deck
  const drawPile = shuffleDeck([...runState.deck], rng);

  const combat: CombatState = {
    turnNumber: 1,
    phase: "PLAYER_TURN",
    player: {
      currentHp: runState.playerCurrentHp,
      maxHp: runState.playerMaxHp,
      block: 0,
      energyCurrent: GAME_CONSTANTS.STARTING_ENERGY,
      energyMax: GAME_CONSTANTS.STARTING_ENERGY,
      inkCurrent: 0,
      inkMax: GAME_CONSTANTS.STARTING_INK_MAX,
      inkPerCardPlayed: GAME_CONSTANTS.STARTING_INK_PER_CARD,
      drawCount: GAME_CONSTANTS.STARTING_DRAW_COUNT,
      speed: 0,
      strength: 0,
      focus: 0,
      buffs: [],
    },
    allies: [],
    enemies,
    drawPile,
    hand: [],
    discardPile: [],
    exhaustPile: [],
    inkPowerUsedThisTurn: false,
  };

  // Draw initial hand
  return drawCards(combat, combat.player.drawCount, rng);
}

/**
 * Start a new player turn: reset block, restore energy, draw cards.
 */
export function startPlayerTurn(state: CombatState, rng: RNG): CombatState {
  let current: CombatState = {
    ...state,
    phase: "PLAYER_TURN",
    turnNumber: state.turnNumber + 1,
    inkPowerUsedThisTurn: false,
    player: {
      ...state.player,
      block: 0,
      energyCurrent: state.player.energyMax,
    },
  };

  current = drawCards(current, current.player.drawCount, rng);
  return current;
}

/**
 * End the player's turn: discard hand, transition to enemy phase.
 */
export function endPlayerTurn(state: CombatState): CombatState {
  const afterDiscard = discardHand(state);
  return {
    ...afterDiscard,
    phase: "ALLIES_ENEMIES_TURN",
  };
}

/**
 * Execute the allies + enemies phase, then check for combat end.
 */
export function executeAlliesEnemiesTurn(
  state: CombatState,
  enemyDefs: Map<string, EnemyDefinition>,
  rng: RNG
): CombatState {
  // Reset enemy blocks at start of their turn
  let current: CombatState = {
    ...state,
    enemies: state.enemies.map((e) => ({ ...e, block: 0 })),
  };

  current = executeEnemiesTurn(current, enemyDefs, rng);
  return checkCombatEnd(current);
}

/**
 * Check win/loss conditions and update phase accordingly.
 */
export function checkCombatEnd(state: CombatState): CombatState {
  if (state.player.currentHp <= 0) {
    return { ...state, phase: "COMBAT_LOST" };
  }

  const allEnemiesDead = state.enemies.every((e) => e.currentHp <= 0);
  if (allEnemiesDead) {
    return { ...state, phase: "COMBAT_WON" };
  }

  return state;
}
