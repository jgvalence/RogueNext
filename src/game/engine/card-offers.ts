import type { CardDefinition } from "../schemas/cards";
import type { BiomeType, CardArchetypeTag } from "../schemas/enums";
import { getLootRarityWeight } from "./loot";
import type { RNG } from "./rng";
import { getCardArchetypeTags } from "./card-archetypes";

export type CardOfferSource = "NORMAL_REWARD" | "ELITE_REWARD" | "MERCHANT";

export interface CardOfferContext {
  archetypeCounts?: Partial<Record<CardArchetypeTag, number>>;
  playerCurrentHp?: number;
  playerMaxHp?: number;
}

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
  currentBiome?: BiomeType,
  context?: CardOfferContext
): number {
  let multiplier = 1;

  if (source === "NORMAL_REWARD") {
    if (currentBiome && card.biome === currentBiome) {
      multiplier *= NORMAL_REWARD_SIGNATURE_WEIGHT[card.id] ?? 1;
    }
  }

  if (source === "MERCHANT") {
    multiplier *= MERCHANT_SIGNATURE_WEIGHT[card.id] ?? 1;
  }

  if (source !== "MERCHANT" && context) {
    const tags = getCardArchetypeTags(card);
    const strongestArchetypeCount = tags.reduce(
      (best, tag) => Math.max(best, context.archetypeCounts?.[tag] ?? 0),
      0
    );

    if (strongestArchetypeCount >= 2) {
      multiplier *= 1 + Math.min(0.45, strongestArchetypeCount * 0.08);
    }

    if (
      context.playerCurrentHp != null &&
      context.playerMaxHp != null &&
      context.playerMaxHp > 0
    ) {
      const currentHp = Math.max(0, Math.floor(context.playerCurrentHp));
      const maxHp = Math.max(1, Math.floor(context.playerMaxHp));
      if (currentHp / maxHp <= 0.45 && tags.includes("HEAL")) {
        multiplier *= 1.75;
      }
    }
  }

  return multiplier;
}

export function getCardOfferWeight(
  card: CardDefinition,
  lootLuck: number,
  source: CardOfferSource,
  currentBiome?: BiomeType,
  context?: CardOfferContext
): number {
  const baseWeight = getLootRarityWeight(card.rarity, lootLuck);
  if (baseWeight <= 0) return 0;
  return (
    baseWeight * getCardOfferMultiplier(card, source, currentBiome, context)
  );
}

function weightedPickByOfferWeight(
  cards: readonly CardDefinition[],
  lootLuck: number,
  source: CardOfferSource,
  rng: RNG,
  currentBiome?: BiomeType,
  context?: CardOfferContext
): CardDefinition {
  const weights = cards.map((card) =>
    Math.max(
      0,
      getCardOfferWeight(card, lootLuck, source, currentBiome, context)
    )
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
  currentBiome?: BiomeType,
  context?: CardOfferContext
): CardDefinition[] {
  if (count <= 0 || cards.length === 0) return [];

  const pool = [...cards].filter(
    (card) =>
      getCardOfferWeight(card, lootLuck, source, currentBiome, context) > 0
  );
  if (pool.length === 0) return [];

  const picks: CardDefinition[] = [];
  while (pool.length > 0 && picks.length < count) {
    const picked = weightedPickByOfferWeight(
      pool,
      lootLuck,
      source,
      rng,
      currentBiome,
      context
    );
    picks.push(picked);
    const index = pool.indexOf(picked);
    if (index >= 0) pool.splice(index, 1);
  }

  return picks;
}
