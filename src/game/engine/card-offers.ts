import type { CardDefinition } from "../schemas/cards";
import type { BiomeType } from "../schemas/enums";
import { getLootRarityWeight } from "./loot";
import type { RNG } from "./rng";

export type CardOfferSource =
  | "NORMAL_REWARD"
  | "ELITE_REWARD"
  | "MERCHANT";

const NORMAL_REWARD_SIGNATURE_WEIGHT: Partial<Record<string, number>> = {
  written_prophecy: 1.5,
  saga_keeper: 2.5,
  book_of_the_dead: 3,
  fates_decree: 3,
};

const MERCHANT_SIGNATURE_WEIGHT: Partial<Record<string, number>> = {
  curator_pact: 1.75,
  written_prophecy: 2.25,
  saga_keeper: 4,
  book_of_the_dead: 5,
  fates_decree: 4,
};

function getCardOfferMultiplier(
  card: CardDefinition,
  source: CardOfferSource,
  currentBiome?: BiomeType
): number {
  if (source === "NORMAL_REWARD") {
    if (!currentBiome || card.biome !== currentBiome) return 1;
    return NORMAL_REWARD_SIGNATURE_WEIGHT[card.id] ?? 1;
  }

  if (source === "MERCHANT") {
    return MERCHANT_SIGNATURE_WEIGHT[card.id] ?? 1;
  }

  return 1;
}

export function getCardOfferWeight(
  card: CardDefinition,
  lootLuck: number,
  source: CardOfferSource,
  currentBiome?: BiomeType
): number {
  const baseWeight = getLootRarityWeight(card.rarity, lootLuck);
  if (baseWeight <= 0) return 0;
  return baseWeight * getCardOfferMultiplier(card, source, currentBiome);
}

function weightedPickByOfferWeight(
  cards: readonly CardDefinition[],
  lootLuck: number,
  source: CardOfferSource,
  rng: RNG,
  currentBiome?: BiomeType
): CardDefinition {
  const weights = cards.map((card) =>
    Math.max(0, getCardOfferWeight(card, lootLuck, source, currentBiome))
  );
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) return rng.pick(cards);

  let roll = rng.next() * total;
  for (let i = 0; i < cards.length; i += 1) {
    roll -= weights[i]!;
    if (roll <= 0) return cards[i]!;
  }

  return cards[cards.length - 1]!;
}

export function weightedSampleCardsForOffers(
  cards: readonly CardDefinition[],
  count: number,
  rng: RNG,
  lootLuck: number,
  source: CardOfferSource,
  currentBiome?: BiomeType
): CardDefinition[] {
  if (count <= 0 || cards.length === 0) return [];

  const pool = [...cards].filter(
    (card) => getCardOfferWeight(card, lootLuck, source, currentBiome) > 0
  );
  if (pool.length === 0) return [];

  const picks: CardDefinition[] = [];
  while (pool.length > 0 && picks.length < count) {
    const picked = weightedPickByOfferWeight(
      pool,
      lootLuck,
      source,
      rng,
      currentBiome
    );
    picks.push(picked);
    const index = pool.indexOf(picked);
    if (index >= 0) pool.splice(index, 1);
  }

  return picks;
}
