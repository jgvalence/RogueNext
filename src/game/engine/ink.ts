import type { CombatState } from "../schemas/combat-state";
import type { InkPowerType } from "../schemas/enums";
import type { CardDefinition } from "../schemas/cards";
import { GAME_CONSTANTS } from "../constants";
import { moveFromDiscardToHand, drawCards } from "./deck";
import type { RNG } from "./rng";

export function gainInk(state: CombatState, amount: number): CombatState {
  return {
    ...state,
    player: {
      ...state.player,
      inkCurrent: Math.min(
        state.player.inkMax,
        state.player.inkCurrent + amount
      ),
    },
  };
}

export function spendInk(
  state: CombatState,
  amount: number
): CombatState | null {
  if (state.player.inkCurrent < amount) return null;

  return {
    ...state,
    player: {
      ...state.player,
      inkCurrent: state.player.inkCurrent - amount,
    },
  };
}

export function canUseInkPower(
  state: CombatState,
  power: InkPowerType
): boolean {
  const disabled = state.playerDisruption?.disabledInkPowers ?? [];
  if (disabled.includes("ALL") || disabled.includes(power)) return false;

  // Only one ink power per turn
  if (state.inkPowerUsedThisTurn) return false;

  const cost = GAME_CONSTANTS.INK_POWER_COSTS[power];
  if (state.player.inkCurrent < cost) return false;

  switch (power) {
    case "REWRITE":
      return state.discardPile.length > 0;
    case "LOST_CHAPTER":
      return state.drawPile.length > 0 || state.discardPile.length > 0;
    case "SEAL":
      return true;
  }
}

/**
 * Use an ink power.
 * - REWRITE: move a card from discard to hand (targetInstanceId = card instance)
 * - LOST_CHAPTER: draw 2 extra cards
 * - SEAL: grant block to player
 */
export function applyInkPower(
  state: CombatState,
  power: InkPowerType,
  targetInstanceId: string | null,
  _cardDefs: Map<string, CardDefinition>,
  rng: RNG
): CombatState {
  if (!canUseInkPower(state, power)) return state;

  const cost = GAME_CONSTANTS.INK_POWER_COSTS[power];
  const afterSpend = spendInk(state, cost);
  if (!afterSpend) return state;

  const marked: CombatState = { ...afterSpend, inkPowerUsedThisTurn: true };

  switch (power) {
    case "REWRITE": {
      if (!targetInstanceId) return state;
      return moveFromDiscardToHand(marked, targetInstanceId);
    }

    case "LOST_CHAPTER": {
      return drawCards(marked, GAME_CONSTANTS.LOST_CHAPTER_DRAW, rng);
    }

    case "SEAL": {
      return {
        ...marked,
        player: {
          ...marked.player,
          block: marked.player.block + GAME_CONSTANTS.SEAL_BLOCK_AMOUNT,
        },
      };
    }
  }
}
