import type { CardDefinition } from "../schemas/cards";

/**
 * Starter deck: 5x Strike, 4x Defend, 2x Ink Surge
 * These are the definitions — actual deck has multiple instances.
 */

export const starterCardDefinitions: CardDefinition[] = [
  // ─── Cartes de base (communes aux deux personnages) ───────────────────────
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

  // ─── Cartes uniques du Scribe ─────────────────────────────────────────────
  {
    id: "trace_tranchant",
    name: "Tracé Tranchant",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "STARTER",
    description:
      "Inflige 8 dégâts. Si une carte améliorée est en main, inflige 4 de plus.",
    effects: [
      { type: "DAMAGE", value: 8 },
      { type: "DAMAGE_BONUS_IF_UPGRADED_IN_HAND", value: 4 },
    ],
    inkedVariant: null,
    upgrade: {
      description:
        "Inflige 10 dégâts. Si une carte améliorée est en main, inflige 6 de plus.",
      effects: [
        { type: "DAMAGE", value: 10 },
        { type: "DAMAGE_BONUS_IF_UPGRADED_IN_HAND", value: 6 },
      ],
    },
    isStarterCard: true,
    biome: "LIBRARY",
    characterId: "scribe",
  },
  {
    id: "parchemin_de_soin",
    name: "Parchemin de Soin",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "STARTER",
    description: "Gagnez 4 bouclier. Gagnez 1 encre.",
    effects: [
      { type: "BLOCK", value: 4 },
      { type: "GAIN_INK", value: 1 },
    ],
    inkedVariant: {
      description: "Gagnez 6 bouclier. Gagnez 3 encre.",
      effects: [
        { type: "BLOCK", value: 6 },
        { type: "GAIN_INK", value: 3 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Gagnez 6 bouclier. Gagnez 1 encre.",
      effects: [
        { type: "BLOCK", value: 6 },
        { type: "GAIN_INK", value: 1 },
      ],
    },
    isStarterCard: true,
    biome: "LIBRARY",
    characterId: "scribe",
  },
  {
    id: "annotation",
    name: "Annotation",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "STARTER",
    description:
      "Exhaust. Améliorez une carte aléatoire en main jusqu'à la fin du combat.",
    effects: [
      { type: "EXHAUST", value: 0 },
      { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 0 },
    ],
    inkedVariant: null,
    upgrade: {
      energyCost: 0,
      description:
        "Exhaust. Améliorez une carte aléatoire en main jusqu'à la fin du combat.",
      effects: [
        { type: "EXHAUST", value: 0 },
        { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 0 },
      ],
    },
    isStarterCard: true,
    biome: "LIBRARY",
    characterId: "scribe",
  },

  // ─── Cartes uniques de la Bibliothécaire ──────────────────────────────────
  {
    id: "catalogue",
    name: "Catalogue",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "STARTER",
    description:
      "Piochez 3 cartes. Défaussez 2 cartes aléatoires de votre main.",
    effects: [
      { type: "DRAW_CARDS", value: 3 },
      { type: "FORCE_DISCARD_RANDOM", value: 2 },
    ],
    inkedVariant: null,
    upgrade: {
      description:
        "Piochez 3 cartes. Défaussez 1 carte aléatoire de votre main.",
      effects: [
        { type: "DRAW_CARDS", value: 3 },
        { type: "FORCE_DISCARD_RANDOM", value: 1 },
      ],
    },
    isStarterCard: true,
    biome: "LIBRARY",
    characterId: "bibliothecaire",
  },
  {
    id: "chuchotement",
    name: "Chuchotement",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "STARTER",
    description: "Appliquez WEAK 2 à tous les ennemis.",
    effects: [{ type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 }],
    inkedVariant: {
      description: "Appliquez WEAK 3 et VULNERABLE 1 à tous les ennemis.",
      effects: [
        { type: "APPLY_DEBUFF", value: 3, buff: "WEAK", duration: 2 },
        { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Appliquez WEAK 3 à tous les ennemis.",
      effects: [{ type: "APPLY_DEBUFF", value: 3, buff: "WEAK", duration: 2 }],
    },
    isStarterCard: true,
    biome: "LIBRARY",
    characterId: "bibliothecaire",
  },
  {
    id: "marque_page",
    name: "Marque-Page",
    type: "SKILL",
    energyCost: 0,
    inkCost: 0,
    targeting: "SELF",
    rarity: "STARTER",
    description: "Exhaust. Piochez 1 carte.",
    effects: [
      { type: "EXHAUST", value: 0 },
      { type: "DRAW_CARDS", value: 1 },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Exhaust. Piochez 2 cartes.",
      effects: [
        { type: "EXHAUST", value: 0 },
        { type: "DRAW_CARDS", value: 2 },
      ],
    },
    isStarterCard: true,
    biome: "LIBRARY",
    characterId: "bibliothecaire",
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
