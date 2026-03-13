import { describe, expect, it } from "vitest";
import type { CardDefinition } from "@/game/schemas/cards";
import { applyAttackBonusToCardDefinition } from "./card-text";

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
