import type { CardDefinition } from "../schemas/cards";
import type { CardArchetypeTag } from "../schemas/enums";
import type { RunState } from "../schemas/run-state";
import type { RNG } from "./rng";
import { matchesCardCharacter } from "./card-filters";
import {
  getDeckArchetypeCounts,
  getCardArchetypeTags,
} from "./card-archetypes";
import {
  weightedSampleCardsForOffers,
  type CardOfferContext,
} from "./card-offers";
import { getTotalLootLuck } from "./loot";

export function buildArchetypeEventCardChoices(
  allCards: CardDefinition[],
  runState: Pick<
    RunState,
    | "deck"
    | "relicIds"
    | "metaBonuses"
    | "unlockedCardIds"
    | "currentBiome"
    | "characterId"
    | "playerCurrentHp"
    | "playerMaxHp"
  >,
  archetypeTag: CardArchetypeTag,
  rng: RNG,
  count = 3,
  minimumChoices = 1
): CardDefinition[] {
  const unlockedCardIds = new Set(runState.unlockedCardIds ?? []);
  const cardDefs = new Map(allCards.map((card) => [card.id, card]));
  const offerContext: CardOfferContext = {
    archetypeCounts: getDeckArchetypeCounts(runState.deck, cardDefs),
    playerCurrentHp: runState.playerCurrentHp,
    playerMaxHp: runState.playerMaxHp,
  };

  const eligible = allCards.filter(
    (card) =>
      !card.isStarterCard &&
      card.isCollectible !== false &&
      matchesCardCharacter(card, runState.characterId) &&
      (unlockedCardIds.size === 0 || unlockedCardIds.has(card.id)) &&
      getCardArchetypeTags(card).includes(archetypeTag)
  );

  if (eligible.length < minimumChoices) return [];

  const lootLuck = getTotalLootLuck(
    runState.relicIds,
    runState.metaBonuses?.lootLuck ?? 0
  );

  return weightedSampleCardsForOffers(
    eligible,
    count,
    rng,
    lootLuck,
    "NORMAL_REWARD",
    runState.currentBiome,
    offerContext
  );
}
