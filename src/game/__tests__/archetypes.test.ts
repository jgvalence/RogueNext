import { describe, expect, it } from "vitest";
import { buildCardDefsMap } from "../data";
import { buildArchetypeEventCardChoices } from "../engine/archetype-offers";
import {
  getCardArchetypeTags,
  getDeckArchetypeCounts,
} from "../engine/card-archetypes";
import { getCardOfferWeight } from "../engine/card-offers";
import { createRNG } from "../engine/rng";

const cardDefs = buildCardDefsMap();
const allCards = [...cardDefs.values()];

describe("Card archetypes", () => {
  it("infers archetype tags from card effects and explicit tags", () => {
    const fortify = cardDefs.get("fortify");
    const healingScript = cardDefs.get("healing_script");
    const inkSurge = cardDefs.get("ink_surge");
    const finalChapter = cardDefs.get("final_chapter");

    expect(fortify).toBeDefined();
    expect(healingScript).toBeDefined();
    expect(inkSurge).toBeDefined();
    expect(finalChapter).toBeDefined();
    if (!fortify || !healingScript || !inkSurge || !finalChapter) return;

    expect(getCardArchetypeTags(fortify)).toContain("BLOCK");
    expect(getCardArchetypeTags(healingScript)).toContain("HEAL");
    expect(getCardArchetypeTags(inkSurge)).toContain("INK");
    expect(getCardArchetypeTags(finalChapter)).toEqual(
      expect.arrayContaining(["BLEED", "EXHAUST"])
    );
  });

  it("counts deck archetypes from card definitions", () => {
    const counts = getDeckArchetypeCounts(
      [
        { instanceId: "c1", definitionId: "final_chapter", upgraded: false },
        { instanceId: "c2", definitionId: "final_chapter", upgraded: false },
        { instanceId: "c3", definitionId: "fortify", upgraded: false },
      ],
      cardDefs
    );

    expect(counts.BLEED).toBe(2);
    expect(counts.EXHAUST).toBe(2);
    expect(counts.BLOCK).toBe(1);
  });

  it("builds archetype event card choices from unlocked cards only", () => {
    const choices = buildArchetypeEventCardChoices(
      allCards,
      {
        deck: [],
        relicIds: [],
        metaBonuses: undefined,
        unlockedCardIds: [
          "healing_script",
          "quick_recovery",
          "temple_archive",
          "ink_surge",
        ],
        currentBiome: "LIBRARY",
        characterId: "bibliothecaire",
        playerCurrentHp: 60,
        playerMaxHp: 60,
      },
      "HEAL",
      createRNG("archetype-event-heal")
    );

    expect(choices.length).toBeGreaterThan(0);
    expect(choices.length).toBeLessThanOrEqual(3);
    expect(
      choices.every((card) => getCardArchetypeTags(card).includes("HEAL"))
    ).toBe(true);
    expect(
      choices.every((card) =>
        [
          "healing_script",
          "quick_recovery",
          "temple_archive",
          "ink_surge",
        ].includes(card.id)
      )
    ).toBe(true);
  });

  it("can require a minimum number of archetype event choices", () => {
    const choices = buildArchetypeEventCardChoices(
      allCards,
      {
        deck: [],
        relicIds: [],
        metaBonuses: undefined,
        unlockedCardIds: ["healing_script", "temple_archive"],
        currentBiome: "LIBRARY",
        characterId: "bibliothecaire",
        playerCurrentHp: 60,
        playerMaxHp: 60,
      },
      "HEAL",
      createRNG("archetype-event-heal-minimum"),
      3,
      3
    );

    expect(choices).toEqual([]);
  });

  it("boosts healing cards in rewards when HP is low", () => {
    const healingScript = cardDefs.get("healing_script");
    const inkSurge = cardDefs.get("ink_surge");
    expect(healingScript).toBeDefined();
    expect(inkSurge).toBeDefined();
    if (!healingScript || !inkSurge) return;

    const lowHpHealingWeight = getCardOfferWeight(
      healingScript,
      0,
      "NORMAL_REWARD",
      "LIBRARY",
      {
        playerCurrentHp: 18,
        playerMaxHp: 60,
      }
    );
    const lowHpInkWeight = getCardOfferWeight(
      inkSurge,
      0,
      "NORMAL_REWARD",
      "LIBRARY",
      {
        playerCurrentHp: 18,
        playerMaxHp: 60,
      }
    );

    expect(lowHpHealingWeight).toBeGreaterThan(lowHpInkWeight);
  });

  it("boosts reward cards matching the current deck archetype", () => {
    const finalChapter = cardDefs.get("final_chapter");
    const mythicBlow = cardDefs.get("mythic_blow");
    expect(finalChapter).toBeDefined();
    expect(mythicBlow).toBeDefined();
    if (!finalChapter || !mythicBlow) return;

    const archetypeCounts = getDeckArchetypeCounts(
      [
        { instanceId: "c1", definitionId: "final_chapter", upgraded: false },
        { instanceId: "c2", definitionId: "final_chapter", upgraded: false },
        { instanceId: "c3", definitionId: "final_chapter", upgraded: false },
      ],
      cardDefs
    );

    const bleedWeight = getCardOfferWeight(
      finalChapter,
      0,
      "NORMAL_REWARD",
      "LIBRARY",
      {
        archetypeCounts,
      }
    );
    const controlWeight = getCardOfferWeight(
      mythicBlow,
      0,
      "NORMAL_REWARD",
      "LIBRARY",
      {
        archetypeCounts,
      }
    );

    expect(bleedWeight).toBeGreaterThan(controlWeight);
  });
});
