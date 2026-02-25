import type { RNG } from "./rng";

type LootRarity = "COMMON" | "UNCOMMON" | "RARE" | "BOSS" | "STARTER";

const BASE_RARITY_WEIGHT: Record<LootRarity, number> = {
  STARTER: 0,
  COMMON: 60,
  UNCOMMON: 30,
  RARE: 10,
  BOSS: 0,
};

const RELIC_LOOT_LUCK_BONUS: Record<string, number> = {
  lucky_charm: 2,
};

function weightedPick<T>(
  items: readonly T[],
  getWeight: (item: T) => number,
  rng: RNG
): T {
  const weights = items.map((item) => Math.max(0, getWeight(item)));
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return rng.pick(items);

  let roll = rng.next() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i]!;
    if (roll <= 0) return items[i]!;
  }
  return items[items.length - 1]!;
}

export function getLootLuckBonusFromRelics(relicIds: string[]): number {
  return relicIds.reduce(
    (sum, relicId) => sum + (RELIC_LOOT_LUCK_BONUS[relicId] ?? 0),
    0
  );
}

export function getTotalLootLuck(
  relicIds: string[],
  metaLootLuck: number = 0
): number {
  return (
    Math.max(0, Math.floor(metaLootLuck)) + getLootLuckBonusFromRelics(relicIds)
  );
}

export function getLootRarityWeight(rarity: LootRarity, luck: number): number {
  const base = BASE_RARITY_WEIGHT[rarity] ?? 1;
  if (base <= 0) return 0;
  if (luck <= 0) return base;

  if (rarity === "COMMON")
    return Math.max(1, Math.round(base * (1 - 0.1 * luck)));
  if (rarity === "UNCOMMON")
    return Math.max(1, Math.round(base * (1 + 0.15 * luck)));
  if (rarity === "RARE")
    return Math.max(1, Math.round(base * (1 + 0.3 * luck)));
  if (rarity === "BOSS")
    return Math.max(1, Math.round(base * (1 + 0.1 * luck)));
  return base;
}

export function weightedSampleByRarity<T extends { rarity: LootRarity }>(
  items: readonly T[],
  count: number,
  rng: RNG,
  luck: number
): T[] {
  if (count <= 0 || items.length === 0) return [];
  const pool = [...items].filter(
    (item) => getLootRarityWeight(item.rarity, luck) > 0
  );
  if (pool.length === 0) return [];
  const picks: T[] = [];
  while (pool.length > 0 && picks.length < count) {
    const picked = weightedPick(
      pool,
      (item) => getLootRarityWeight(item.rarity, luck),
      rng
    );
    picks.push(picked);
    const idx = pool.indexOf(picked);
    if (idx >= 0) pool.splice(idx, 1);
  }
  return picks;
}
