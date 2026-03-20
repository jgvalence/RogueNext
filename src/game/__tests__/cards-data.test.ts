import { describe, expect, it } from "vitest";
import { lootableCardDefinitions } from "../data/cards";
import { ENEMIES_WITHOUT_BESTIARY_CARDS_SET } from "../data/enemy-mastery";
import { enemyDefinitions } from "../data/enemies";
import {
  buildCardExactMechanicSignature,
  buildCardPatternSignature,
} from "../engine/card-audit";
import type { BiomeType } from "../schemas/enums";

describe("bestiary card data", () => {
  it("covers every active non-boss enemy and keeps every bestiary card mechanically unique", () => {
    const expectedIds = enemyDefinitions
      .filter(
        (enemy) =>
          !enemy.isBoss &&
          !enemy.isScriptedOnly &&
          !ENEMIES_WITHOUT_BESTIARY_CARDS_SET.has(enemy.id)
      )
      .map((enemy) =>
        enemy.isElite
          ? `bestiary_elite_${enemy.id}`
          : `bestiary_normal_${enemy.id}`
      )
      .sort();

    const bestiaryCards = lootableCardDefinitions.filter((card) =>
      card.id.startsWith("bestiary_")
    );

    expect(bestiaryCards.map((card) => card.id).sort()).toEqual(expectedIds);

    const duplicateProfiles: string[] = [];
    const groups = new Map<string, string>();

    for (const card of bestiaryCards) {
      const signature = buildCardExactMechanicSignature(card);
      const existing = groups.get(signature);
      if (existing) {
        duplicateProfiles.push(`${existing} <-> ${card.id}`);
      }
      groups.set(signature, card.id);
    }

    expect(duplicateProfiles).toEqual([]);
  });

  it("keeps every bestiary card pattern-distinct, not just numerically different", () => {
    const bestiaryCards = lootableCardDefinitions.filter((card) =>
      card.id.startsWith("bestiary_")
    );

    const duplicatePatterns: string[] = [];
    const groups = new Map<string, string>();

    for (const card of bestiaryCards) {
      const signature = buildCardPatternSignature(card);
      const existing = groups.get(signature);
      if (existing) {
        duplicatePatterns.push(`${existing} <-> ${card.id}`);
      }
      groups.set(signature, card.id);
    }

    expect(duplicatePatterns).toEqual([]);
  });

  it("keeps a tier spread for normal enemies inside each biome", () => {
    const expectedTierCountsByBiome: Record<
      BiomeType,
      { tier1: number; tier2: number; tier3: number }
    > = {
      LIBRARY: { tier1: 3, tier2: 2, tier3: 0 },
      VIKING: { tier1: 2, tier2: 3, tier3: 1 },
      GREEK: { tier1: 2, tier2: 2, tier3: 2 },
      EGYPTIAN: { tier1: 3, tier2: 3, tier3: 1 },
      LOVECRAFTIAN: { tier1: 2, tier2: 2, tier3: 2 },
      AZTEC: { tier1: 2, tier2: 3, tier3: 1 },
      CELTIC: { tier1: 3, tier2: 2, tier3: 1 },
      RUSSIAN: { tier1: 3, tier2: 2, tier3: 1 },
      AFRICAN: { tier1: 2, tier2: 3, tier3: 1 },
    };

    for (const [biome, expectedCounts] of Object.entries(
      expectedTierCountsByBiome
    )) {
      const normalEnemies = enemyDefinitions.filter(
        (enemy) =>
          enemy.biome === biome &&
          !enemy.isBoss &&
          !enemy.isElite &&
          !enemy.isScriptedOnly
      );

      const actualCounts = {
        tier1: normalEnemies.filter((enemy) => enemy.tier === 1).length,
        tier2: normalEnemies.filter((enemy) => enemy.tier === 2).length,
        tier3: normalEnemies.filter((enemy) => enemy.tier === 3).length,
      };

      expect(actualCounts).toEqual(expectedCounts);
    }
  });
});
