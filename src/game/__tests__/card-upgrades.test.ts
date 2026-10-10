import { describe, expect, it } from "vitest";
import { lootableCardDefinitions } from "../data/cards";
import { buildEffectPatternSignature } from "../engine/card-audit";
import {
  buildUpgradedCardDefinition,
  getCardUpgradeBranches,
} from "../engine/card-upgrades";

const collectibleCards = lootableCardDefinitions.filter(
  (card) =>
    card.isCollectible !== false &&
    card.type !== "STATUS" &&
    card.type !== "CURSE" &&
    !card.id.startsWith("bestiary_")
);

describe("divergent card upgrades", () => {
  it("offers two mechanically distinct branches for every collectible card", () => {
    for (const card of collectibleCards) {
      const [branchA, branchB] = getCardUpgradeBranches(card);
      const sameEffects =
        buildEffectPatternSignature(branchA.effects) ===
        buildEffectPatternSignature(branchB.effects);
      const sameCost =
        (branchA.energyCost ?? card.energyCost) ===
        (branchB.energyCost ?? card.energyCost);
      expect(sameEffects && sameCost, card.id).toBe(false);
    }
  });

  it("makes both upgrade branches mechanically transformative", () => {
    for (const card of collectibleCards) {
      const [branchA, branchB] = getCardUpgradeBranches(card);
      const basePattern = buildEffectPatternSignature(card.effects);
      expect(
        buildEffectPatternSignature(branchA.effects),
        `${card.id}:A`
      ).not.toBe(basePattern);
      expect(
        buildEffectPatternSignature(branchB.effects),
        `${card.id}:B`
      ).not.toBe(basePattern);
    }
  });

  it("preserves the branch choice in the upgraded definition", () => {
    const card = collectibleCards.find(
      (candidate) => candidate.id === "heavy_strike"
    )!;
    const branchA = buildUpgradedCardDefinition(card, "A");
    const branchB = buildUpgradedCardDefinition(card, "B");
    expect(branchA.effects).not.toEqual(branchB.effects);
  });

  it("keeps exactly 39 owned cards per character", () => {
    for (const characterId of ["scribe", "bibliothecaire", "griot", "fou"]) {
      expect(
        collectibleCards.filter((card) => card.characterId === characterId),
        characterId
      ).toHaveLength(39);
    }
  });
});
