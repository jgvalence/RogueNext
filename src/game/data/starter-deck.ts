import type { CardDefinition } from "../schemas/cards";

/**
 * Starter deck: 5x Strike, 4x Defend, 2x Ink Surge
 * These are the definitions — actual deck has multiple instances.
 */

export const starterCardDefinitions: CardDefinition[] = [
  {
    id: "strike",
    name: "Strike",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "STARTER",
    description: "Deal 6 damage.",
    effects: [{ type: "DAMAGE", value: 6 }],
    inkedVariant: null,
    upgrade: {
      description: "Deal 9 damage.",
      effects: [{ type: "DAMAGE", value: 9 }],
    },
    isStarterCard: true,
    biome: "LIBRARY",
  },
  {
    id: "defend",
    name: "Defend",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "STARTER",
    description: "Gain 5 block.",
    effects: [{ type: "BLOCK", value: 5 }],
    inkedVariant: null,
    upgrade: {
      description: "Gain 8 block.",
      effects: [{ type: "BLOCK", value: 8 }],
    },
    isStarterCard: true,
    biome: "LIBRARY",
  },
  {
    id: "ink_surge",
    name: "Ink Surge",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "STARTER",
    description: "Gain 3 ink.",
    effects: [{ type: "GAIN_INK", value: 3 }],
    inkedVariant: null,
    upgrade: {
      energyCost: 0,
      description: "Gain 3 ink.",
      effects: [{ type: "GAIN_INK", value: 3 }],
    },
    isStarterCard: true,
    biome: "LIBRARY",
  },
];

/**
 * Build the starter deck instances list: 5 Strike, 4 Defend, 2 Ink Surge.
 * Returns an array of definitionIds to be turned into CardInstances.
 */
export const starterDeckComposition: string[] = [
  "strike",
  "strike",
  "strike",
  "strike",
  "strike",
  "defend",
  "defend",
  "defend",
  "defend",
  "ink_surge",
  "ink_surge",
];
