import type { CardDefinition, CardInstance } from "../schemas/cards";
import type { RunState } from "../schemas/run-state";
import { GAME_CONSTANTS } from "../constants";
import type { RNG } from "./rng";
import { nanoid } from "nanoid";

export interface CombatRewards {
  gold: number;
  cardChoices: CardDefinition[];
}

/**
 * Generate rewards after winning a combat.
 */
export function generateCombatRewards(
  floor: number,
  room: number,
  isBoss: boolean,
  allCards: CardDefinition[],
  rng: RNG
): CombatRewards {
  // Gold reward
  const baseGold = GAME_CONSTANTS.GOLD_REWARD_BASE;
  const variance = rng.nextInt(0, GAME_CONSTANTS.GOLD_REWARD_VARIANCE);
  const floorBonus = (floor - 1) * 5;
  let gold = baseGold + variance + floorBonus + room;
  if (isBoss) {
    gold *= GAME_CONSTANTS.BOSS_GOLD_MULTIPLIER;
  }

  // Card reward: pick N random non-starter cards
  const lootableCards = allCards.filter((c) => !c.isStarterCard);
  const shuffled = rng.shuffle(lootableCards);
  const cardChoices = shuffled.slice(0, GAME_CONSTANTS.CARD_REWARD_CHOICES);

  return { gold, cardChoices };
}

/**
 * Add a card to the run's master deck.
 */
export function addCardToRunDeck(
  runState: RunState,
  definitionId: string
): RunState {
  const newCard: CardInstance = {
    instanceId: nanoid(),
    definitionId,
    upgraded: false,
  };

  return {
    ...runState,
    deck: [...runState.deck, newCard],
  };
}
