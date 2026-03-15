import { beforeEach, describe, expect, it } from "vitest";
import type { CardDefinition } from "@/game/schemas/cards";
import { getCardDefinitionById } from "@/game/data";
import { buildUpgradedCardDefinition } from "@/game/engine/card-upgrades";
import { i18n } from "@/lib/i18n";
import {
  applyAttackBonusToCardDefinition,
  localizeCardDescription,
  localizeInkedDescription,
} from "./card-text";

const makeAttackCard = (): CardDefinition => ({
  id: "test_strike",
  name: "Test Strike",
  type: "ATTACK",
  energyCost: 1,
  inkCost: 0,
  targeting: "SINGLE_ENEMY",
  rarity: "COMMON",
  description: "Deal 6 damage.",
  effects: [{ type: "DAMAGE", value: 6 }],
  onRandomDiscardEffects: [],
  inkedVariant: {
    description: "Deal 9 damage.",
    effects: [{ type: "DAMAGE", value: 9 }],
    inkMarkCost: 1,
  },
  upgrade: null,
  isStarterCard: false,
  isCollectible: true,
  isStatusCard: false,
  isCurseCard: false,
  biome: "LIBRARY",
});

describe("applyAttackBonusToCardDefinition", () => {
  it("updates normal and inked damage values for attack cards", () => {
    const boosted = applyAttackBonusToCardDefinition(makeAttackCard(), 2);

    expect(boosted.effects[0]).toEqual({ type: "DAMAGE", value: 8 });
    expect(boosted.inkedVariant?.effects[0]).toEqual({
      type: "DAMAGE",
      value: 11,
    });
  });

  it("leaves non-damage attack cards unchanged", () => {
    const scalingAttack: CardDefinition = {
      ...makeAttackCard(),
      effects: [{ type: "DAMAGE_PER_DEBUFF", value: 2, buff: "WEAK" }],
      inkedVariant: null,
    };

    const boosted = applyAttackBonusToCardDefinition(scalingAttack, 3);

    expect(boosted).toBe(scalingAttack);
  });
});

describe("localized card descriptions", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("describes recursive_scratch normal, upgraded, and inked variants distinctly", () => {
    const base = getCardDefinitionById("recursive_scratch");

    expect(base).toBeDefined();

    const upgraded = buildUpgradedCardDefinition(base!);
    const baseDescription = localizeCardDescription(base!, i18n.t.bind(i18n));
    const upgradedDescription = localizeCardDescription(
      upgraded,
      i18n.t.bind(i18n)
    );
    const inkedDescription = localizeInkedDescription(base!, i18n.t.bind(i18n));
    const upgradedInkedDescription = localizeInkedDescription(
      upgraded,
      i18n.t.bind(i18n)
    );

    expect(baseDescription).toBe(
      "Deal 3 damage. Add 1 copy of this card to your draw pile. Exhaust."
    );
    expect(upgradedDescription).toContain("Draw 1");
    expect(upgradedDescription).toContain(
      "Add 1 copy of this card to your draw pile"
    );
    expect(inkedDescription).toBe(
      "Deal 3 damage. Add 2 copies of this card to your draw pile. Exhaust."
    );
    expect(upgradedInkedDescription).toContain("Draw 1");
    expect(upgradedInkedDescription).toContain(
      "Add 2 copies of this card to your draw pile"
    );
  });
});
