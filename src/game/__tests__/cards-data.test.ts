import { describe, expect, it } from "vitest";
import { lootableCardDefinitions } from "../data/cards";
import { ENEMIES_WITHOUT_BESTIARY_CARDS_SET } from "../data/enemy-mastery";
import { enemyDefinitions } from "../data/enemies";
import {
  buildCardExactMechanicSignature,
  buildCardPatternSignature,
} from "../engine/card-audit";

describe("bestiary card data", () => {
  it("covers every active non-boss enemy and keeps every bestiary card mechanically unique", () => {
    const expectedIds = enemyDefinitions
      .filter(
        (enemy) =>
          !enemy.isBoss && !ENEMIES_WITHOUT_BESTIARY_CARDS_SET.has(enemy.id)
      )
      .map((enemy) =>
        enemy.isElite ? `bestiary_elite_${enemy.id}` : `bestiary_normal_${enemy.id}`
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
});
