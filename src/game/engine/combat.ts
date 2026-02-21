import type { CombatState } from "../schemas/combat-state";
import type { RunState } from "../schemas/run-state";
import type {
  EnemyDefinition,
  EnemyState,
  AllyDefinition,
  AllyState,
} from "../schemas/entities";
import type { CardDefinition } from "../schemas/cards";
import type { ComputedMetaBonuses } from "../schemas/meta";
import { GAME_CONSTANTS } from "../constants";
import { drawCards, discardHand, shuffleDeck } from "./deck";
import { executeAlliesTurn, executeEnemiesTurn } from "./enemies";
import { applyMetaBonusesToCombat } from "./meta";
import { applyRelicsOnTurnStart } from "./relics";
import type { RNG } from "./rng";
import { nanoid } from "nanoid";

/**
 * Initialize a new combat encounter.
 */
export function initCombat(
  runState: RunState,
  enemyIds: string[],
  enemyDefs: Map<string, EnemyDefinition>,
  allyDefs: Map<string, AllyDefinition>,
  _cardDefs: Map<string, CardDefinition>,
  rng: RNG,
  metaBonuses?: ComputedMetaBonuses
): CombatState {
  const floorEnemyHpMultiplier = 1 + (runState.floor - 1) * 0.15;
  const enemyDamageScale = 1 + (runState.floor - 1) * 0.18;

  // Create enemy instances
  const enemies: EnemyState[] = enemyIds.map((id) => {
    const def = enemyDefs.get(id);
    if (!def) throw new Error(`Unknown enemy definition: ${id}`);
    const scaledHp = Math.max(
      1,
      Math.round(def.maxHp * floorEnemyHpMultiplier)
    );
    return {
      instanceId: nanoid(),
      definitionId: id,
      name: def.name,
      currentHp: scaledHp,
      maxHp: scaledHp,
      block: 0,
      mechanicFlags: {},
      speed: def.speed,
      buffs: [],
      intentIndex: 0,
    };
  });

  // Create allied instances from run recruits (capped by unlocked slots)
  const maxAllies = Math.min(
    GAME_CONSTANTS.MAX_ALLIES,
    Math.max(0, runState.metaBonuses?.allySlots ?? 0)
  );
  const allyIds = (runState.allyIds ?? []).slice(0, maxAllies);
  const allies: AllyState[] = allyIds
    .map((id) => allyDefs.get(id))
    .filter((a): a is AllyDefinition => a != null)
    .map((def) => ({
      instanceId: nanoid(),
      definitionId: def.id,
      name: def.name,
      currentHp: def.maxHp,
      maxHp: def.maxHp,
      block: 0,
      speed: def.speed,
      buffs: [],
      intentIndex: 0,
    }));

  // Build draw pile from run deck
  const drawPile = shuffleDeck([...runState.deck], rng);

  const combat: CombatState = {
    floor: runState.floor,
    enemyDamageScale,
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
      inkPerCardChance: GAME_CONSTANTS.STARTING_INK_PER_CARD_CHANCE,
      inkPerCardValue: GAME_CONSTANTS.STARTING_INK_PER_CARD_VALUE,
      regenPerTurn: 0,
      firstHitDamageReductionPercent: 0,
      drawCount: GAME_CONSTANTS.STARTING_DRAW_COUNT,
      speed: 0,
      strength: 0,
      focus: 0,
      buffs: [],
    },
    allies,
    enemies,
    drawPile,
    hand: [],
    discardPile: [],
    exhaustPile: [],
    inkPowerUsedThisTurn: false,
    firstHitReductionUsed: false,
  };

  // Apply meta-progression bonuses if any
  const bonuses = metaBonuses ?? runState.metaBonuses;
  const combatWithMeta = bonuses
    ? applyMetaBonusesToCombat(combat, bonuses)
    : combat;

  // Draw initial hand (extraHandAtStart included via drawCount bonus)
  const extraHand = bonuses?.extraHandAtStart ?? 0;
  return drawCards(
    combatWithMeta,
    combatWithMeta.player.drawCount + extraHand,
    rng
  );
}

/**
 * Start a new player turn: reset block, restore energy, draw cards.
 */
export function startPlayerTurn(
  state: CombatState,
  rng: RNG,
  relicIds: string[] = []
): CombatState {
  const regenAmount = Math.max(0, state.player.regenPerTurn);
  let current: CombatState = {
    ...state,
    phase: "PLAYER_TURN",
    turnNumber: state.turnNumber + 1,
    inkPowerUsedThisTurn: false,
    player: {
      ...state.player,
      currentHp: Math.min(
        state.player.maxHp,
        state.player.currentHp + regenAmount
      ),
    },
  };

  current = applyRelicsOnTurnStart(current, relicIds);
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
  allyDefs: Map<string, AllyDefinition>,
  rng: RNG
): CombatState {
  // Reset enemy blocks at start of their turn
  let current: CombatState = {
    ...state,
    enemies: state.enemies.map((e) => ({ ...e, block: 0 })),
  };

  current = executeAlliesTurn(current, allyDefs, rng);
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
