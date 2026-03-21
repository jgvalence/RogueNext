import type { CardDefinition } from "../schemas/cards";
import type { EnemyDefinition } from "../schemas/entities";
import type { BiomeType } from "../schemas/enums";
import { enemyDefinitions } from "./enemies";
import { ENEMIES_WITHOUT_BESTIARY_CARDS_SET } from "./enemy-mastery";

/**
 * Lootable cards — obtainable via rewards or merchant.
 * Cards tagged biome: "LIBRARY" appear on all floors.
 * Biome-specific cards only appear on their matching floor.
 */
const baseLootableCardDefinitions: CardDefinition[] = [
  // =========================================================
  // LIBRARY biome — attacks
  // =========================================================
  {
    id: "heavy_strike",
    name: "Inkstone Blow",
    type: "ATTACK",
    energyCost: 2,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description: "Deal 12 damage.",
    effects: [{ type: "DAMAGE", value: 12 }],
    inkedVariant: {
      description: "Deal 18 damage.",
      effects: [{ type: "DAMAGE", value: 18 }],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Deal 18 damage.",
      effects: [{ type: "DAMAGE", value: 18 }],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "scribe",
  },
  {
    id: "cleave",
    name: "Page Rend",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "COMMON",
    description: "Deal 4 damage to ALL enemies.",
    effects: [{ type: "DAMAGE", value: 4 }],
    inkedVariant: {
      description: "Deal 6 damage to ALL enemies.",
      effects: [{ type: "DAMAGE", value: 6 }],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Deal 6 damage to ALL enemies.",
      effects: [{ type: "DAMAGE", value: 6 }],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "scribe",
    isCollectible: false,
  },
  {
    id: "piercing_word",
    name: "Piercing Word",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description: "Deal 8 damage. Apply 1 Vulnerable.",
    effects: [
      { type: "DAMAGE", value: 8 },
      { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
    ],
    inkedVariant: {
      description: "Deal 12 damage. Apply 2 Vulnerable.",
      effects: [
        { type: "DAMAGE", value: 12 },
        { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
      ],
      inkMarkCost: 3,
    },
    upgrade: {
      description: "Deal 12 damage. Apply 2 Vulnerable.",
      effects: [
        { type: "DAMAGE", value: 12 },
        { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
      ],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "bibliothecaire",
    isCollectible: false,
  },
  {
    id: "poison_quill",
    name: "Poison Quill",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description: "Deal 3 damage. Apply 4 Poison.",
    effects: [
      { type: "DAMAGE", value: 3 },
      { type: "APPLY_DEBUFF", value: 4, buff: "POISON" },
    ],
    inkedVariant: {
      description: "Deal 5 damage. Apply 6 Poison.",
      effects: [
        { type: "DAMAGE", value: 5 },
        { type: "APPLY_DEBUFF", value: 6, buff: "POISON" },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Deal 4 damage. Apply 6 Poison.",
      effects: [
        { type: "DAMAGE", value: 4 },
        { type: "APPLY_DEBUFF", value: 6, buff: "POISON" },
      ],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "scribe",
    isCollectible: false,
  },
  {
    id: "mythic_blow",
    name: "Legendary Chapter",
    type: "ATTACK",
    energyCost: 3,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "RARE",
    description: "Deal 24 damage.",
    effects: [{ type: "DAMAGE", value: 24 }],
    inkedVariant: {
      description: "Deal 36 damage.",
      effects: [{ type: "DAMAGE", value: 36 }],
      inkMarkCost: 4,
    },
    upgrade: {
      description: "Deal 36 damage.",
      effects: [{ type: "DAMAGE", value: 36 }],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "scribe",
  },
  {
    id: "swift_slash",
    name: "Tome Slash",
    type: "ATTACK",
    energyCost: 0,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description: "Deal 3 damage.",
    effects: [{ type: "DAMAGE", value: 3 }],
    inkedVariant: {
      description: "Deal 5 damage.",
      effects: [{ type: "DAMAGE", value: 5 }],
      inkMarkCost: 1,
    },
    upgrade: {
      description: "Deal 4 damage. Draw 1 card.",
      effects: [
        { type: "DAMAGE", value: 4 },
        { type: "DRAW_CARDS", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "bibliothecaire",
    isCollectible: false,
  },

  // =========================================================
  // LIBRARY biome — skills
  // =========================================================
  {
    id: "quick_feint",
    name: "Scripted Feint",
    type: "ATTACK",
    energyCost: 0,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description: "Deal 2 damage. Draw 1 card.",
    effects: [
      { type: "DAMAGE", value: 2 },
      { type: "DRAW_CARDS", value: 1 },
    ],
    inkedVariant: {
      description: "Deal 4 damage. Draw 1 card.",
      effects: [
        { type: "DAMAGE", value: 4 },
        { type: "DRAW_CARDS", value: 1 },
      ],
      inkMarkCost: 1,
    },
    upgrade: {
      description: "Deal 4 damage. Draw 1 card.",
      effects: [
        { type: "DAMAGE", value: 4 },
        { type: "DRAW_CARDS", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "scribe",
    isCollectible: false,
  },
  {
    id: "bastion_crash",
    name: "Shelf Collapse",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description: "Deal damage equal to your Block.",
    effects: [{ type: "DAMAGE_EQUAL_BLOCK", value: 1 }],
    inkedVariant: {
      description: "Deal 1.5x your Block as damage.",
      effects: [{ type: "DAMAGE_EQUAL_BLOCK", value: 2 }],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Deal 1.5x your Block as damage.",
      effects: [{ type: "DAMAGE_EQUAL_BLOCK", value: 2 }],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "bibliothecaire",
    isCollectible: false,
  },
  {
    id: "venom_echo",
    name: "Venom Echo",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "RARE",
    description: "Double Poison on target.",
    effects: [{ type: "DOUBLE_POISON", value: 2 }],
    inkedVariant: null,
    upgrade: {
      description: "Triple Poison on target.",
      effects: [{ type: "DOUBLE_POISON", value: 3 }],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "scribe",
    isCollectible: false,
  },
  {
    id: "fortify",
    name: "Archive Seal",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "COMMON",
    description: "Gain 8 block.",
    archetypeTags: ["BLOCK"],
    effects: [{ type: "BLOCK", value: 8 }],
    inkedVariant: {
      description: "Gain 14 block.",
      effects: [{ type: "BLOCK", value: 14 }],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Gain 12 block.",
      effects: [{ type: "BLOCK", value: 12 }],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "bibliothecaire",
  },
  {
    id: "scholars_focus",
    name: "Scholar's Focus",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "UNCOMMON",
    description: "Draw 2 cards. Gain 1 ink.",
    effects: [
      { type: "DRAW_CARDS", value: 2 },
      { type: "GAIN_INK", value: 1 },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Draw 3 cards. Gain 1 ink.",
      effects: [
        { type: "DRAW_CARDS", value: 3 },
        { type: "GAIN_INK", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "bibliothecaire",
    isCollectible: false,
  },
  {
    id: "healing_script",
    name: "Healing Script",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "UNCOMMON",
    description: "Heal 6 HP.",
    archetypeTags: ["HEAL"],
    effects: [{ type: "HEAL", value: 6 }],
    inkedVariant: {
      description: "Heal 12 HP.",
      effects: [{ type: "HEAL", value: 12 }],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Heal 9 HP.",
      effects: [{ type: "HEAL", value: 9 }],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "bibliothecaire",
  },
  {
    id: "ink_flow",
    name: "Ink Flow",
    type: "SKILL",
    energyCost: 0,
    inkCost: 0,
    targeting: "SELF",
    rarity: "COMMON",
    description: "Gain 2 ink.",
    effects: [{ type: "GAIN_INK", value: 2 }],
    inkedVariant: {
      description: "Gain 4 ink.",
      effects: [{ type: "GAIN_INK", value: 4 }],
      inkMarkCost: 1,
    },
    upgrade: {
      description: "Gain 3 ink.",
      effects: [{ type: "GAIN_INK", value: 3 }],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "scribe",
  },
  {
    id: "adrenaline",
    name: "Ink Rush",
    type: "SKILL",
    energyCost: 0,
    inkCost: 0,
    targeting: "SELF",
    rarity: "RARE",
    description: "Gain 1 energy. Draw 1 card.",
    effects: [
      { type: "GAIN_ENERGY", value: 1 },
      { type: "DRAW_CARDS", value: 1 },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Gain 2 energy. Draw 1 card.",
      effects: [
        { type: "GAIN_ENERGY", value: 2 },
        { type: "DRAW_CARDS", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "scribe",
    isCollectible: false,
  },

  // =========================================================
  // LIBRARY biome — powers
  // =========================================================
  {
    id: "rage_of_ages",
    name: "Rage of Ages",
    type: "POWER",
    energyCost: 2,
    inkCost: 0,
    targeting: "SELF",
    rarity: "RARE",
    description: "Gain 2 Strength.",
    effects: [{ type: "GAIN_STRENGTH", value: 2 }],
    inkedVariant: {
      description: "Gain 3 Strength.",
      effects: [{ type: "GAIN_STRENGTH", value: 3 }],
      inkMarkCost: 2,
      upgradedDescription: "Gain 3 Strength.",
      upgradedEffects: [{ type: "GAIN_STRENGTH", value: 3 }],
    },
    upgrade: {
      energyCost: 1,
      description: "Gain 2 Strength.",
      effects: [{ type: "GAIN_STRENGTH", value: 2 }],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "scribe",
  },

  // =========================================================
  // LIBRARY biome — new cards
  // =========================================================
  {
    id: "tome_strike",
    name: "Tome Strike",
    type: "ATTACK",
    energyCost: 0,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description: "Deal 3 damage. Gain 1 ink.",
    effects: [
      { type: "DAMAGE", value: 3 },
      { type: "GAIN_INK", value: 1 },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Deal 4 damage. Gain 2 ink.",
      effects: [
        { type: "DAMAGE", value: 4 },
        { type: "GAIN_INK", value: 2 },
      ],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "scribe",
  },
  {
    id: "double_strike",
    name: "Dual Script",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description: "Deal 4 damage twice.",
    effects: [
      { type: "DAMAGE", value: 4 },
      { type: "DAMAGE", value: 4 },
    ],
    inkedVariant: {
      description: "Deal 6 damage twice.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "DAMAGE", value: 6 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Deal 6 damage twice.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "DAMAGE", value: 6 },
      ],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "scribe",
  },
  {
    id: "curse_word",
    name: "Curse Word",
    type: "ATTACK",
    energyCost: 2,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description: "Deal 8 damage. Apply 4 Poison.",
    effects: [
      { type: "DAMAGE", value: 8 },
      { type: "APPLY_DEBUFF", value: 4, buff: "POISON" },
    ],
    inkedVariant: null,
    upgrade: {
      energyCost: 1,
      description: "Deal 8 damage. Apply 4 Poison.",
      effects: [
        { type: "DAMAGE", value: 8 },
        { type: "APPLY_DEBUFF", value: 4, buff: "POISON" },
      ],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "scribe",
  },
  {
    id: "final_chapter",
    name: "Final Chapter",
    type: "ATTACK",
    energyCost: 2,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "RARE",
    description: "Deal 10 damage. Deal 4 damage per Bleed on target. Exhaust.",
    archetypeTags: ["BLEED", "EXHAUST"],
    effects: [
      { type: "DAMAGE", value: 10 },
      { type: "DAMAGE_PER_DEBUFF", value: 4, buff: "BLEED" },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: {
      description:
        "Deal 14 damage. Deal 5 damage per Bleed on target. Exhaust.",
      effects: [
        { type: "DAMAGE", value: 14 },
        { type: "DAMAGE_PER_DEBUFF", value: 5, buff: "BLEED" },
        { type: "EXHAUST", value: 0 },
      ],
      inkMarkCost: 4,
    },
    upgrade: {
      description:
        "Deal 12 damage. Deal 4 damage per Bleed on target. Exhaust.",
      effects: [
        { type: "DAMAGE", value: 12 },
        { type: "DAMAGE_PER_DEBUFF", value: 4, buff: "BLEED" },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "scribe",
  },
  {
    id: "vulnerability_hex",
    name: "Vulnerability Hex",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "UNCOMMON",
    description: "Apply 2 Vulnerable to ALL enemies.",
    effects: [
      { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
    ],
    inkedVariant: {
      description: "Apply 3 Vulnerable to ALL enemies. Draw 1 card.",
      effects: [
        { type: "APPLY_DEBUFF", value: 3, buff: "VULNERABLE", duration: 2 },
        { type: "DRAW_CARDS", value: 1 },
      ],
      inkMarkCost: 2,
      upgradedDescription:
        "Apply 3 Vulnerable and 1 Weak to ALL enemies. Draw 1 card.",
      upgradedEffects: [
        { type: "APPLY_DEBUFF", value: 3, buff: "VULNERABLE", duration: 2 },
        { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        { type: "DRAW_CARDS", value: 1 },
      ],
    },
    upgrade: {
      description: "Apply 3 Vulnerable and 1 Weak to ALL enemies.",
      effects: [
        { type: "APPLY_DEBUFF", value: 3, buff: "VULNERABLE", duration: 2 },
        { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
      ],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "bibliothecaire",
  },
  {
    id: "meditation",
    name: "Silent Study",
    type: "POWER",
    energyCost: 2,
    inkCost: 0,
    targeting: "SELF",
    rarity: "RARE",
    description: "Heal 8 HP. Draw 2 cards. Exhaust.",
    effects: [
      { type: "HEAL", value: 8 },
      { type: "DRAW_CARDS", value: 2 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Heal 12 HP. Draw 2 cards. Exhaust.",
      effects: [
        { type: "HEAL", value: 12 },
        { type: "DRAW_CARDS", value: 2 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "bibliothecaire",
  },

  // =========================================================
  // LIBRARY biome — new ALWAYS cards
  // =========================================================
  {
    id: "quick_recovery",
    name: "Index Recovery",
    type: "SKILL",
    energyCost: 0,
    inkCost: 0,
    targeting: "SELF",
    rarity: "COMMON",
    description: "Gain 4 block. Heal 2 HP. Exhaust.",
    effects: [
      { type: "BLOCK", value: 4 },
      { type: "HEAL", value: 2 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: {
      description: "Gain 7 block. Heal 4 HP. Exhaust.",
      effects: [
        { type: "BLOCK", value: 7 },
        { type: "HEAL", value: 4 },
        { type: "EXHAUST", value: 0 },
      ],
      inkMarkCost: 1,
    },
    upgrade: {
      description: "Gain 7 block. Heal 2 HP. Exhaust.",
      effects: [
        { type: "BLOCK", value: 7 },
        { type: "HEAL", value: 2 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "bibliothecaire",
  },
  {
    id: "inked_sweep",
    name: "Inked Sweep",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "COMMON",
    description: "Deal 3 damage to ALL enemies. Gain 1 Ink.",
    effects: [
      { type: "DAMAGE", value: 3 },
      { type: "GAIN_INK", value: 1 },
    ],
    inkedVariant: {
      description: "Deal 5 damage to ALL enemies. Gain 2 Ink.",
      effects: [
        { type: "DAMAGE", value: 5 },
        { type: "GAIN_INK", value: 2 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Deal 5 damage to ALL enemies. Gain 1 Ink.",
      effects: [
        { type: "DAMAGE", value: 5 },
        { type: "GAIN_INK", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "bibliothecaire",
    isCollectible: false,
  },
  {
    id: "brace",
    name: "Stacked Volumes",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "COMMON",
    description: "Gain 6 block. Draw 1 card.",
    effects: [
      { type: "BLOCK", value: 6 },
      { type: "DRAW_CARDS", value: 1 },
    ],
    inkedVariant: {
      description: "Gain 9 block. Draw 2 cards.",
      effects: [
        { type: "BLOCK", value: 9 },
        { type: "DRAW_CARDS", value: 2 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Gain 8 block. Draw 1 card.",
      effects: [
        { type: "BLOCK", value: 8 },
        { type: "DRAW_CARDS", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "bibliothecaire",
  },
  {
    id: "ink_surge",
    name: "Ink Surge",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "UNCOMMON",
    description: "Gain 2 Ink. Upgrade 1 random card in hand. Draw 1 card.",
    archetypeTags: ["INK"],
    effects: [
      { type: "GAIN_INK", value: 2 },
      { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 1 },
      { type: "DRAW_CARDS", value: 1 },
    ],
    inkedVariant: {
      description: "Gain 3 Ink. Upgrade 1 random card in hand. Draw 2 cards.",
      effects: [
        { type: "GAIN_INK", value: 3 },
        { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 1 },
        { type: "DRAW_CARDS", value: 2 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Gain 2 Ink. Upgrade 1 random card in hand. Draw 2 cards.",
      effects: [
        { type: "GAIN_INK", value: 2 },
        { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 1 },
        { type: "DRAW_CARDS", value: 2 },
      ],
    },
    isStarterCard: false,
    biome: "LIBRARY",
  },
  {
    id: "exploit_weakness",
    name: "Exposed Margin",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description: "Deal 5 damage. Apply 2 Weak. Apply 1 Vulnerable.",
    effects: [
      { type: "DAMAGE", value: 5 },
      { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
      { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
    ],
    inkedVariant: {
      description: "Deal 8 damage. Apply 2 Weak. Apply 2 Vulnerable.",
      effects: [
        { type: "DAMAGE", value: 8 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
      ],
      inkMarkCost: 3,
    },
    upgrade: {
      description: "Deal 8 damage. Apply 2 Weak. Apply 2 Vulnerable.",
      effects: [
        { type: "DAMAGE", value: 8 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
      ],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "scribe",
  },
  {
    id: "iron_will",
    name: "Scribal Resolve",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "UNCOMMON",
    description: "Gain 10 block. Exhaust.",
    effects: [
      { type: "BLOCK", value: 10 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: {
      description: "Gain 15 block. Exhaust.",
      effects: [
        { type: "BLOCK", value: 15 },
        { type: "EXHAUST", value: 0 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Gain 15 block. Exhaust.",
      effects: [
        { type: "BLOCK", value: 15 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "scribe",
  },

  // =========================================================
  // VIKING biome — cards
  // =========================================================
  {
    id: "berserker_charge",
    name: "Berserker Charge",
    type: "ATTACK",
    energyCost: 2,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description: "Deal 14 damage. Gain 1 Strength.",
    effects: [
      { type: "DAMAGE", value: 14 },
      { type: "GAIN_STRENGTH", value: 1 },
    ],
    inkedVariant: {
      description: "Deal 20 damage. Gain 2 Strength.",
      effects: [
        { type: "DAMAGE", value: 20 },
        { type: "GAIN_STRENGTH", value: 2 },
      ],
      inkMarkCost: 3,
    },
    upgrade: {
      description: "Deal 20 damage. Gain 2 Strength.",
      effects: [
        { type: "DAMAGE", value: 20 },
        { type: "GAIN_STRENGTH", value: 2 },
      ],
    },
    isStarterCard: false,
    biome: "VIKING",
  },
  {
    id: "shield_wall",
    name: "Shield Wall",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "COMMON",
    description: "Gain 8 block. Gain 2 block per Weak on enemies.",
    effects: [
      { type: "BLOCK", value: 8 },
      { type: "BLOCK_PER_DEBUFF", value: 2, buff: "WEAK" },
    ],
    inkedVariant: {
      description: "Gain 10 block. Gain 3 block per Weak on enemies.",
      effects: [
        { type: "BLOCK", value: 10 },
        { type: "BLOCK_PER_DEBUFF", value: 3, buff: "WEAK" },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Gain 10 block. Gain 2 block per Weak on enemies.",
      effects: [
        { type: "BLOCK", value: 10 },
        { type: "BLOCK_PER_DEBUFF", value: 2, buff: "WEAK" },
      ],
    },
    isStarterCard: false,
    biome: "VIKING",
  },
  {
    id: "rune_strike",
    name: "Rune Strike",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description: "Deal 7 damage. Apply 1 Weak.",
    effects: [
      { type: "DAMAGE", value: 7 },
      { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
    ],
    inkedVariant: {
      description: "Deal 11 damage. Apply 2 Weak.",
      effects: [
        { type: "DAMAGE", value: 11 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Deal 10 damage. Apply 2 Weak.",
      effects: [
        { type: "DAMAGE", value: 10 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
      ],
    },
    isStarterCard: false,
    biome: "VIKING",
  },
  {
    id: "mjolnir_echo",
    name: "Mjolnir's Echo",
    type: "ATTACK",
    energyCost: 2,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "RARE",
    description: "Deal 10 damage to ALL enemies.",
    effects: [{ type: "DAMAGE", value: 10 }],
    inkedVariant: {
      description: "Deal 15 damage to ALL enemies.",
      effects: [{ type: "DAMAGE", value: 15 }],
      inkMarkCost: 3,
    },
    upgrade: {
      description: "Deal 14 damage to ALL enemies. Apply 1 Vulnerable to ALL.",
      effects: [
        { type: "DAMAGE", value: 14 },
        { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
      ],
    },
    isStarterCard: false,
    biome: "VIKING",
  },
  {
    id: "saga_of_blood",
    name: "Saga of Blood",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "RARE",
    description: "Draw 3 cards. Gain 1 energy.",
    effects: [
      { type: "DRAW_CARDS", value: 3 },
      { type: "GAIN_ENERGY", value: 1 },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Draw 3 cards. Gain 2 energy.",
      effects: [
        { type: "DRAW_CARDS", value: 3 },
        { type: "GAIN_ENERGY", value: 2 },
      ],
    },
    isStarterCard: false,
    biome: "VIKING",
    characterId: "scribe",
  },

  {
    id: "valkyries_dive",
    name: "Valkyrie's Dive",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description: "Deal 10 damage. Apply 2 Bleed.",
    effects: [
      { type: "DAMAGE", value: 10 },
      { type: "APPLY_DEBUFF", value: 2, buff: "BLEED", duration: 3 },
    ],
    inkedVariant: {
      description: "Deal 14 damage. Apply 3 Bleed.",
      effects: [
        { type: "DAMAGE", value: 14 },
        { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 3 },
      ],
      inkMarkCost: 3,
    },
    upgrade: {
      description: "Deal 14 damage. Apply 3 Bleed.",
      effects: [
        { type: "DAMAGE", value: 14 },
        { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 3 },
      ],
    },
    isStarterCard: false,
    biome: "VIKING",
  },

  // =========================================================
  // GREEK biome — cards
  // =========================================================
  {
    id: "olympian_guard",
    name: "Olympian Guard",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "COMMON",
    description: "Gain 6 block. Draw 1 card. Gain 1 Strength.",
    effects: [
      { type: "BLOCK", value: 6 },
      { type: "DRAW_CARDS", value: 1 },
      { type: "GAIN_STRENGTH", value: 1 },
    ],
    inkedVariant: {
      description: "Gain 8 block. Draw 2 cards. Gain 1 Strength.",
      effects: [
        { type: "BLOCK", value: 8 },
        { type: "DRAW_CARDS", value: 2 },
        { type: "GAIN_STRENGTH", value: 1 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Gain 8 block. Draw 1 card. Gain 1 Strength.",
      effects: [
        { type: "BLOCK", value: 8 },
        { type: "DRAW_CARDS", value: 1 },
        { type: "GAIN_STRENGTH", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "GREEK",
  },
  {
    id: "gorgons_gaze",
    name: "Gorgon's Gaze",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "UNCOMMON",
    description:
      "Deal 3 damage to ALL enemies. Apply 1 Vulnerable to ALL. Draw 1 card.",
    effects: [
      { type: "DAMAGE", value: 3 },
      { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
      { type: "DRAW_CARDS", value: 1 },
    ],
    inkedVariant: {
      description:
        "Deal 5 damage to ALL. Apply 2 Vulnerable to ALL. Draw 1 card.",
      effects: [
        { type: "DAMAGE", value: 5 },
        { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        { type: "DRAW_CARDS", value: 1 },
      ],
      inkMarkCost: 3,
    },
    upgrade: {
      description:
        "Deal 5 damage to ALL. Apply 2 Vulnerable to ALL. Draw 1 card.",
      effects: [
        { type: "DAMAGE", value: 5 },
        { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        { type: "DRAW_CARDS", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "GREEK",
  },
  {
    id: "labyrinth",
    name: "Labyrinth",
    type: "POWER",
    energyCost: 2,
    inkCost: 0,
    targeting: "SELF",
    rarity: "RARE",
    description: "Gain 3 Focus.",
    effects: [{ type: "GAIN_FOCUS", value: 3 }],
    inkedVariant: {
      description: "Gain 4 Focus.",
      effects: [{ type: "GAIN_FOCUS", value: 4 }],
      inkMarkCost: 3,
      upgradedDescription: "Gain 4 Focus.",
      upgradedEffects: [{ type: "GAIN_FOCUS", value: 4 }],
    },
    upgrade: {
      energyCost: 1,
      description: "Gain 3 Focus.",
      effects: [{ type: "GAIN_FOCUS", value: 3 }],
    },
    isStarterCard: false,
    biome: "GREEK",
  },

  {
    id: "heros_challenge",
    name: "Hero's Challenge",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description: "Deal 6 damage. Gain 4 block.",
    effects: [
      { type: "DAMAGE", value: 6 },
      { type: "BLOCK", value: 4 },
    ],
    inkedVariant: {
      description: "Deal 8 damage. Gain 6 block.",
      effects: [
        { type: "DAMAGE", value: 8 },
        { type: "BLOCK", value: 6 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Deal 8 damage. Gain 6 block.",
      effects: [
        { type: "DAMAGE", value: 8 },
        { type: "BLOCK", value: 6 },
      ],
    },
    isStarterCard: false,
    biome: "GREEK",
  },
  {
    id: "olympian_cleave",
    name: "Olympian Cleave",
    type: "ATTACK",
    energyCost: 2,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "UNCOMMON",
    description:
      "Deal 7 damage to ALL enemies. Apply 1 Weak to ALL. Draw 1 card.",
    effects: [
      { type: "DAMAGE", value: 7 },
      { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
      { type: "DRAW_CARDS", value: 1 },
    ],
    inkedVariant: {
      description: "Deal 10 damage to ALL. Apply 2 Weak to ALL. Draw 1 card.",
      effects: [
        { type: "DAMAGE", value: 10 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        { type: "DRAW_CARDS", value: 1 },
      ],
      inkMarkCost: 3,
    },
    upgrade: {
      description: "Deal 10 damage to ALL. Apply 1 Weak to ALL. Draw 1 card.",
      effects: [
        { type: "DAMAGE", value: 10 },
        { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        { type: "DRAW_CARDS", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "GREEK",
  },

  // =========================================================
  // EGYPTIAN biome — cards
  // =========================================================
  {
    id: "anubis_strike",
    name: "Anubis Strike",
    type: "ATTACK",
    energyCost: 2,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description: "Deal 12 damage. Apply 2 Vulnerable. Gain 2 ink.",
    effects: [
      { type: "DAMAGE", value: 12 },
      { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
      { type: "GAIN_INK", value: 2 },
    ],
    inkedVariant: {
      description: "Deal 18 damage. Apply 3 Vulnerable. Gain 3 ink.",
      effects: [
        { type: "DAMAGE", value: 18 },
        { type: "APPLY_DEBUFF", value: 3, buff: "VULNERABLE", duration: 2 },
        { type: "GAIN_INK", value: 3 },
      ],
      inkMarkCost: 3,
    },
    upgrade: {
      description: "Deal 18 damage. Apply 3 Vulnerable. Gain 2 ink.",
      effects: [
        { type: "DAMAGE", value: 18 },
        { type: "APPLY_DEBUFF", value: 3, buff: "VULNERABLE", duration: 2 },
        { type: "GAIN_INK", value: 2 },
      ],
    },
    isStarterCard: false,
    biome: "EGYPTIAN",
  },
  {
    id: "canopic_ward",
    name: "Canopic Ward",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "COMMON",
    description: "Gain 7 block. Gain 1 ink. Add 1 Dazed to your discard.",
    effects: [
      { type: "BLOCK", value: 7 },
      { type: "GAIN_INK", value: 1 },
      { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Gain 10 block. Gain 2 ink. Add 1 Dazed to your discard.",
      effects: [
        { type: "BLOCK", value: 10 },
        { type: "GAIN_INK", value: 2 },
        { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
      ],
    },
    isStarterCard: false,
    biome: "EGYPTIAN",
  },
  {
    id: "pharaohs_curse",
    name: "Pharaoh's Curse",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "UNCOMMON",
    description: "Deal 4 damage to ALL enemies. Apply 2 Poison to ALL.",
    effects: [
      { type: "DAMAGE", value: 4 },
      { type: "APPLY_DEBUFF", value: 2, buff: "POISON" },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Deal 6 damage to ALL enemies. Apply 3 Poison to ALL.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "APPLY_DEBUFF", value: 3, buff: "POISON" },
      ],
    },
    isStarterCard: false,
    biome: "EGYPTIAN",
  },
  {
    id: "eye_of_ra",
    name: "Eye of Ra",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "RARE",
    description:
      "Draw 2 cards. Gain 2 ink. Upgrade 1 random card in hand. Apply 2 Vulnerable.",
    effects: [
      { type: "DRAW_CARDS", value: 2 },
      { type: "GAIN_INK", value: 2 },
      { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 1 },
      { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
    ],
    inkedVariant: {
      description:
        "Draw 3 cards. Gain 4 ink. Upgrade 1 random card in hand. Apply 2 Vulnerable.",
      effects: [
        { type: "DRAW_CARDS", value: 3 },
        { type: "GAIN_INK", value: 4 },
        { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 1 },
        { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
      ],
      inkMarkCost: 3,
    },
    upgrade: {
      description:
        "Draw 3 cards. Gain 2 ink. Upgrade 1 random card in hand. Apply 2 Vulnerable.",
      effects: [
        { type: "DRAW_CARDS", value: 3 },
        { type: "GAIN_INK", value: 2 },
        { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 1 },
        { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
      ],
    },
    isStarterCard: false,
    biome: "EGYPTIAN",
  },

  {
    id: "sand_whip",
    name: "Sand Whip",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "COMMON",
    description: "Deal 5 damage to ALL enemies.",
    effects: [{ type: "DAMAGE", value: 5 }],
    inkedVariant: {
      description: "Deal 8 damage to ALL enemies.",
      effects: [{ type: "DAMAGE", value: 8 }],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Deal 8 damage to ALL enemies.",
      effects: [{ type: "DAMAGE", value: 8 }],
    },
    isStarterCard: false,
    biome: "EGYPTIAN",
  },
  {
    id: "solar_hymn",
    name: "Solar Hymn",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "UNCOMMON",
    description: "Heal 4. Gain 3 Ink. Draw 1 card.",
    effects: [
      { type: "HEAL", value: 4 },
      { type: "GAIN_INK", value: 3 },
      { type: "DRAW_CARDS", value: 1 },
    ],
    inkedVariant: {
      description: "Heal 6. Gain 5 Ink. Draw 1 card.",
      effects: [
        { type: "HEAL", value: 6 },
        { type: "GAIN_INK", value: 5 },
        { type: "DRAW_CARDS", value: 1 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Heal 6. Gain 3 Ink. Draw 1 card.",
      effects: [
        { type: "HEAL", value: 6 },
        { type: "GAIN_INK", value: 3 },
        { type: "DRAW_CARDS", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "EGYPTIAN",
    characterId: "bibliothecaire",
  },

  // =========================================================
  // LOVECRAFTIAN biome — cards
  // =========================================================
  {
    id: "forbidden_whisper",
    name: "Forbidden Whisper",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description:
      "Deal 4 damage. Apply 4 Vulnerable to target. Add 1 Dazed to your discard pile.",
    effects: [
      { type: "DAMAGE", value: 4 },
      { type: "APPLY_DEBUFF", value: 4, buff: "VULNERABLE", duration: 2 },
      { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
    ],
    inkedVariant: {
      description:
        "Deal 6 damage. Apply 5 Vulnerable to target. Add 1 Dazed to your discard pile.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "APPLY_DEBUFF", value: 5, buff: "VULNERABLE", duration: 2 },
        { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description:
        "Deal 6 damage. Apply 4 Vulnerable to target. Add 1 Dazed to your discard pile.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "APPLY_DEBUFF", value: 4, buff: "VULNERABLE", duration: 2 },
        { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
      ],
    },
    isStarterCard: false,
    biome: "LOVECRAFTIAN",
  },
  {
    id: "madness_spike",
    name: "Madness Spike",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description: "Deal 3 damage. Apply 4 Poison. Gain 1 ink.",
    effects: [
      { type: "DAMAGE", value: 3 },
      { type: "APPLY_DEBUFF", value: 4, buff: "POISON" },
      { type: "GAIN_INK", value: 1 },
    ],
    inkedVariant: {
      description: "Deal 5 damage. Apply 6 Poison. Gain 2 ink.",
      effects: [
        { type: "DAMAGE", value: 5 },
        { type: "APPLY_DEBUFF", value: 6, buff: "POISON" },
        { type: "GAIN_INK", value: 2 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Deal 5 damage. Apply 6 Poison. Gain 1 ink.",
      effects: [
        { type: "DAMAGE", value: 5 },
        { type: "APPLY_DEBUFF", value: 6, buff: "POISON" },
        { type: "GAIN_INK", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "LOVECRAFTIAN",
  },
  {
    id: "void_shield",
    name: "Void Shield",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "COMMON",
    description: "Gain 11 block. Add 1 Dazed to your discard pile.",
    effects: [
      { type: "BLOCK", value: 11 },
      { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
    ],
    inkedVariant: {
      description: "Gain 15 block. Add 1 Dazed to your discard pile.",
      effects: [
        { type: "BLOCK", value: 15 },
        { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Gain 15 block. Add 1 Dazed to your discard pile.",
      effects: [
        { type: "BLOCK", value: 15 },
        { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
      ],
    },
    isStarterCard: false,
    biome: "LOVECRAFTIAN",
  },
  {
    id: "starborn_omen",
    name: "Starborn Omen",
    type: "POWER",
    energyCost: 2,
    inkCost: 0,
    targeting: "SELF",
    rarity: "RARE",
    description: "Gain 2 Focus. Gain 1 ink.",
    effects: [
      { type: "GAIN_FOCUS", value: 2 },
      { type: "GAIN_INK", value: 1 },
    ],
    inkedVariant: null,
    upgrade: {
      energyCost: 1,
      description: "Gain 2 Focus. Gain 2 ink.",
      effects: [
        { type: "GAIN_FOCUS", value: 2 },
        { type: "GAIN_INK", value: 2 },
      ],
    },
    isStarterCard: false,
    biome: "LOVECRAFTIAN",
  },

  {
    id: "void_touch",
    name: "Void Touch",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description:
      "Deal 4 damage. Deal 2 more damage per Vulnerable on target. Apply 1 Vulnerable.",
    effects: [
      { type: "DAMAGE", value: 4 },
      { type: "DAMAGE_PER_DEBUFF", value: 2, buff: "VULNERABLE" },
      { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
    ],
    inkedVariant: {
      description:
        "Deal 6 damage. Deal 3 more damage per Vulnerable on target. Apply 2 Vulnerable.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "DAMAGE_PER_DEBUFF", value: 3, buff: "VULNERABLE" },
        { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description:
        "Deal 6 damage. Deal 2 more damage per Vulnerable on target. Apply 2 Vulnerable.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "DAMAGE_PER_DEBUFF", value: 2, buff: "VULNERABLE" },
        { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
      ],
    },
    isStarterCard: false,
    biome: "LOVECRAFTIAN",
  },
  {
    id: "eldritch_pact",
    name: "Eldritch Pact",
    type: "SKILL",
    energyCost: 0,
    inkCost: 0,
    targeting: "SELF",
    rarity: "UNCOMMON",
    description: "Gain 2 Ink. Draw 1 card. Exhaust.",
    effects: [
      { type: "GAIN_INK", value: 2 },
      { type: "DRAW_CARDS", value: 1 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: {
      description: "Gain 3 Ink. Draw 2 cards. Exhaust.",
      effects: [
        { type: "GAIN_INK", value: 3 },
        { type: "DRAW_CARDS", value: 2 },
        { type: "EXHAUST", value: 0 },
      ],
      inkMarkCost: 1,
    },
    upgrade: {
      description: "Gain 3 Ink. Draw 2 cards. Exhaust.",
      effects: [
        { type: "GAIN_INK", value: 3 },
        { type: "DRAW_CARDS", value: 2 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "LOVECRAFTIAN",
    characterId: "scribe",
  },
  {
    id: "recursive_scratch",
    name: "Recursive Scratch",
    type: "ATTACK",
    energyCost: 0,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "RARE",
    description:
      "Deal 3 damage. Add a copy of this card to your draw pile. Exhaust.",
    effects: [
      { type: "DAMAGE", value: 3 },
      { type: "ADD_CARD_TO_DRAW", value: 1, copySourceCard: true },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: {
      description:
        "Deal 3 damage. Add 2 copies of this card to your draw pile. Exhaust.",
      effects: [
        { type: "DAMAGE", value: 3 },
        { type: "ADD_CARD_TO_DRAW", value: 2, copySourceCard: true },
        { type: "EXHAUST", value: 0 },
      ],
      inkMarkCost: 1,
      upgradedDescription:
        "Deal 3 damage. Draw 1 card. Add 2 copies of this card to your draw pile. Exhaust.",
      upgradedEffects: [
        { type: "DAMAGE", value: 3 },
        { type: "DRAW_CARDS", value: 1 },
        { type: "ADD_CARD_TO_DRAW", value: 2, copySourceCard: true },
        { type: "EXHAUST", value: 0 },
      ],
    },
    upgrade: {
      description:
        "Deal 3 damage. Draw 1 card. Add a copy of this card to your draw pile. Exhaust.",
      effects: [
        { type: "DAMAGE", value: 3 },
        { type: "DRAW_CARDS", value: 1 },
        { type: "ADD_CARD_TO_DRAW", value: 1, copySourceCard: true },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "LOVECRAFTIAN",
  },

  // =========================================================
  // AZTEC biome — cards
  // =========================================================
  {
    id: "obsidian_jab",
    name: "Obsidian Jab",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description: "Deal 9 damage.",
    effects: [{ type: "DAMAGE", value: 9 }],
    inkedVariant: {
      description: "Deal 13 damage.",
      effects: [{ type: "DAMAGE", value: 13 }],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Deal 13 damage. Apply 1 Vulnerable.",
      effects: [
        { type: "DAMAGE", value: 13 },
        { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
      ],
    },
    isStarterCard: false,
    biome: "AZTEC",
  },
  {
    id: "sun_ritual",
    name: "Sun Ritual",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "UNCOMMON",
    description: "Gain 7 block. Gain 1 Strength.",
    effects: [
      { type: "BLOCK", value: 7 },
      { type: "GAIN_STRENGTH", value: 1 },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Gain 10 block. Gain 2 Strength.",
      effects: [
        { type: "BLOCK", value: 10 },
        { type: "GAIN_STRENGTH", value: 2 },
      ],
    },
    isStarterCard: false,
    biome: "AZTEC",
  },
  {
    id: "blood_offering",
    name: "Blood Offering",
    type: "SKILL",
    energyCost: 0,
    inkCost: 0,
    targeting: "SELF",
    rarity: "UNCOMMON",
    description: "Lose 4 HP. Gain 2 energy.",
    effects: [
      { type: "DAMAGE", value: 4 },
      { type: "GAIN_ENERGY", value: 2 },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Lose 3 HP. Gain 3 energy.",
      effects: [
        { type: "DAMAGE", value: 3 },
        { type: "GAIN_ENERGY", value: 3 },
      ],
    },
    isStarterCard: false,
    biome: "AZTEC",
  },
  {
    id: "jaguar_pounce",
    name: "Jaguar Pounce",
    type: "ATTACK",
    energyCost: 2,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description: "Deal 14 damage. Apply 1 Weak. Apply 3 Bleed.",
    effects: [
      { type: "DAMAGE", value: 14 },
      { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
      { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 4 },
    ],
    inkedVariant: {
      description: "Deal 20 damage. Apply 2 Weak. Apply 4 Bleed.",
      effects: [
        { type: "DAMAGE", value: 20 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        { type: "APPLY_DEBUFF", value: 4, buff: "BLEED", duration: 4 },
      ],
      inkMarkCost: 3,
    },
    upgrade: {
      description: "Deal 18 damage. Apply 1 Weak. Apply 4 Bleed.",
      effects: [
        { type: "DAMAGE", value: 18 },
        { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        { type: "APPLY_DEBUFF", value: 4, buff: "BLEED", duration: 4 },
      ],
    },
    isStarterCard: false,
    biome: "AZTEC",
  },
  {
    id: "eclipse_vow",
    name: "Eclipse Vow",
    type: "POWER",
    energyCost: 2,
    inkCost: 0,
    targeting: "SELF",
    rarity: "RARE",
    description: "Gain 2 Strength. Gain 2 block.",
    effects: [
      { type: "GAIN_STRENGTH", value: 2 },
      { type: "BLOCK", value: 2 },
    ],
    inkedVariant: null,
    upgrade: {
      energyCost: 1,
      description: "Gain 2 Strength. Gain 2 block.",
      effects: [
        { type: "GAIN_STRENGTH", value: 2 },
        { type: "BLOCK", value: 2 },
      ],
    },
    isStarterCard: false,
    biome: "AZTEC",
  },

  {
    id: "jaguars_blood",
    name: "Jaguar's Blood",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description: "Deal 5 damage. Apply 3 Bleed. Gain 1 Strength.",
    effects: [
      { type: "DAMAGE", value: 5 },
      { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 4 },
      { type: "GAIN_STRENGTH", value: 1 },
    ],
    inkedVariant: {
      description: "Deal 8 damage. Apply 4 Bleed. Gain 2 Strength.",
      effects: [
        { type: "DAMAGE", value: 8 },
        { type: "APPLY_DEBUFF", value: 4, buff: "BLEED", duration: 4 },
        { type: "GAIN_STRENGTH", value: 2 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Deal 8 damage. Apply 4 Bleed. Gain 1 Strength.",
      effects: [
        { type: "DAMAGE", value: 8 },
        { type: "APPLY_DEBUFF", value: 4, buff: "BLEED", duration: 4 },
        { type: "GAIN_STRENGTH", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "AZTEC",
    characterId: "scribe",
  },

  // =========================================================
  // CELTIC biome — cards
  // =========================================================
  {
    id: "thorn_slash",
    name: "Thorn Slash",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description: "Deal 5 damage. Apply 2 Poison. Heal 2.",
    effects: [
      { type: "DAMAGE", value: 5 },
      { type: "APPLY_DEBUFF", value: 2, buff: "POISON" },
      { type: "HEAL", value: 2 },
    ],
    inkedVariant: {
      description: "Deal 7 damage. Apply 4 Poison. Heal 4.",
      effects: [
        { type: "DAMAGE", value: 7 },
        { type: "APPLY_DEBUFF", value: 4, buff: "POISON" },
        { type: "HEAL", value: 4 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Deal 7 damage. Apply 3 Poison. Heal 2.",
      effects: [
        { type: "DAMAGE", value: 7 },
        { type: "APPLY_DEBUFF", value: 3, buff: "POISON" },
        { type: "HEAL", value: 2 },
      ],
    },
    isStarterCard: false,
    biome: "CELTIC",
  },
  {
    id: "druids_breath",
    name: "Druid's Breath",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "UNCOMMON",
    description: "Heal 5 HP. Draw 1 card.",
    effects: [
      { type: "HEAL", value: 5 },
      { type: "DRAW_CARDS", value: 1 },
    ],
    inkedVariant: {
      description: "Heal 8 HP. Draw 2 cards.",
      effects: [
        { type: "HEAL", value: 8 },
        { type: "DRAW_CARDS", value: 2 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Heal 8 HP. Draw 1 card.",
      effects: [
        { type: "HEAL", value: 8 },
        { type: "DRAW_CARDS", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "CELTIC",
  },
  {
    id: "ancient_grove",
    name: "Ancient Grove",
    type: "POWER",
    energyCost: 2,
    inkCost: 0,
    targeting: "SELF",
    rarity: "RARE",
    description: "Gain 1 Strength and 1 Focus.",
    effects: [
      { type: "GAIN_STRENGTH", value: 1 },
      { type: "GAIN_FOCUS", value: 1 },
    ],
    inkedVariant: {
      description: "Gain 2 Strength and 1 Focus.",
      effects: [
        { type: "GAIN_STRENGTH", value: 2 },
        { type: "GAIN_FOCUS", value: 1 },
      ],
      inkMarkCost: 3,
      upgradedDescription: "Gain 3 Strength and 2 Focus.",
      upgradedEffects: [
        { type: "GAIN_STRENGTH", value: 3 },
        { type: "GAIN_FOCUS", value: 2 },
      ],
    },
    upgrade: {
      description: "Gain 2 Strength and 2 Focus.",
      effects: [
        { type: "GAIN_STRENGTH", value: 2 },
        { type: "GAIN_FOCUS", value: 2 },
      ],
    },
    isStarterCard: false,
    biome: "CELTIC",
  },

  {
    id: "faerie_fire",
    name: "Faerie Fire",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "COMMON",
    description: "Apply 2 Poison to ALL enemies.",
    effects: [{ type: "APPLY_DEBUFF", value: 2, buff: "POISON" }],
    inkedVariant: {
      description: "Apply 4 Poison to ALL enemies.",
      effects: [{ type: "APPLY_DEBUFF", value: 4, buff: "POISON" }],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Apply 3 Poison to ALL enemies.",
      effects: [{ type: "APPLY_DEBUFF", value: 3, buff: "POISON" }],
    },
    isStarterCard: false,
    biome: "CELTIC",
  },
  {
    id: "wild_gale",
    name: "Wild Gale",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "UNCOMMON",
    description: "Draw 1 card. Gain 1 Thorns per Weak on enemies.",
    effects: [
      { type: "DRAW_CARDS", value: 1 },
      {
        type: "APPLY_BUFF_PER_DEBUFF",
        value: 1,
        buff: "THORNS",
        scalingBuff: "WEAK",
      },
    ],
    inkedVariant: {
      description: "Draw 2 cards. Gain 1 Thorns per Weak on enemies.",
      effects: [
        { type: "DRAW_CARDS", value: 2 },
        {
          type: "APPLY_BUFF_PER_DEBUFF",
          value: 1,
          buff: "THORNS",
          scalingBuff: "WEAK",
        },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Draw 2 cards. Gain 1 Thorns per Weak on enemies.",
      effects: [
        { type: "DRAW_CARDS", value: 2 },
        {
          type: "APPLY_BUFF_PER_DEBUFF",
          value: 1,
          buff: "THORNS",
          scalingBuff: "WEAK",
        },
      ],
    },
    isStarterCard: false,
    biome: "CELTIC",
  },

  // =========================================================
  // RUSSIAN biome — cards
  // =========================================================
  {
    id: "frost_nail",
    name: "Frost Nail",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description: "Deal 4 damage. Deal 3 damage per Weak on target.",
    effects: [
      { type: "DAMAGE", value: 4 },
      { type: "DAMAGE_PER_DEBUFF", value: 3, buff: "WEAK" },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Deal 6 damage. Deal 3 damage per Weak on target.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "DAMAGE_PER_DEBUFF", value: 3, buff: "WEAK" },
      ],
    },
    isStarterCard: false,
    biome: "RUSSIAN",
  },
  {
    id: "iron_samovar",
    name: "Iron Samovar",
    type: "SKILL",
    energyCost: 2,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "COMMON",
    description: "Gain 8 block. Apply 1 Poison to ALL enemies.",
    effects: [
      { type: "BLOCK", value: 8 },
      { type: "APPLY_DEBUFF", value: 1, buff: "POISON" },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Gain 12 block. Apply 2 Poison to ALL enemies.",
      effects: [
        { type: "BLOCK", value: 12 },
        { type: "APPLY_DEBUFF", value: 2, buff: "POISON" },
      ],
    },
    isStarterCard: false,
    biome: "RUSSIAN",
  },
  {
    id: "bear_claw",
    name: "Bear Claw",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description: "Deal 8 damage. Gain 1 Strength.",
    effects: [
      { type: "DAMAGE", value: 8 },
      { type: "GAIN_STRENGTH", value: 1 },
    ],
    inkedVariant: {
      description: "Deal 12 damage. Gain 2 Strength.",
      effects: [
        { type: "DAMAGE", value: 12 },
        { type: "GAIN_STRENGTH", value: 2 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Deal 11 damage. Gain 2 Strength.",
      effects: [
        { type: "DAMAGE", value: 11 },
        { type: "GAIN_STRENGTH", value: 2 },
      ],
    },
    isStarterCard: false,
    biome: "RUSSIAN",
  },
  {
    id: "permafrost_ward",
    name: "Permafrost Ward",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description: "Gain 12 block. Apply 1 Weak.",
    effects: [
      { type: "BLOCK", value: 12 },
      { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
    ],
    inkedVariant: {
      description: "Gain 16 block. Apply 2 Weak.",
      effects: [
        { type: "BLOCK", value: 16 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Gain 16 block. Apply 2 Weak.",
      effects: [
        { type: "BLOCK", value: 16 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
      ],
    },
    isStarterCard: false,
    biome: "RUSSIAN",
  },

  // =========================================================
  // AFRICAN biome — cards
  // =========================================================
  {
    id: "ancestral_drum",
    name: "Ancestral Drum",
    type: "SKILL",
    energyCost: 2,
    inkCost: 0,
    targeting: "SELF",
    rarity: "COMMON",
    description: "Gain 8 block. Gain 1 Focus. Exhaust.",
    effects: [
      { type: "BLOCK", value: 8 },
      { type: "GAIN_FOCUS", value: 1 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Gain 12 block. Gain 2 Focus. Exhaust.",
      effects: [
        { type: "BLOCK", value: 12 },
        { type: "GAIN_FOCUS", value: 2 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "AFRICAN",
  },
  {
    id: "trickster_snare",
    name: "Trickster Snare",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "UNCOMMON",
    description:
      "Deal 3 damage to ALL enemies. Apply 1 Vulnerable and 1 Poison to ALL enemies.",
    effects: [
      { type: "DAMAGE", value: 3 },
      { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
      { type: "APPLY_DEBUFF", value: 1, buff: "POISON" },
    ],
    inkedVariant: {
      description:
        "Deal 5 damage to ALL enemies. Apply 2 Vulnerable and 2 Poison to ALL enemies.",
      effects: [
        { type: "DAMAGE", value: 5 },
        { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        { type: "APPLY_DEBUFF", value: 2, buff: "POISON" },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description:
        "Deal 5 damage to ALL enemies. Apply 2 Vulnerable and 1 Poison to ALL enemies.",
      effects: [
        { type: "DAMAGE", value: 5 },
        { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        { type: "APPLY_DEBUFF", value: 1, buff: "POISON" },
      ],
    },
    isStarterCard: false,
    biome: "AFRICAN",
  },
  {
    id: "griot_legacy",
    name: "Griot Legacy",
    type: "POWER",
    energyCost: 2,
    inkCost: 0,
    targeting: "SELF",
    rarity: "RARE",
    description: "Gain 1 Strength. Draw 1 card.",
    effects: [
      { type: "GAIN_STRENGTH", value: 1 },
      { type: "DRAW_CARDS", value: 1 },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Gain 2 Strength. Draw 2 cards.",
      effects: [
        { type: "GAIN_STRENGTH", value: 2 },
        { type: "DRAW_CARDS", value: 2 },
      ],
    },
    isStarterCard: false,
    biome: "AFRICAN",
  },
  {
    id: "spirit_drum",
    name: "Spirit Drum",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "COMMON",
    description: "Draw 2 cards. Gain 2 block.",
    effects: [
      { type: "DRAW_CARDS", value: 2 },
      { type: "BLOCK", value: 2 },
    ],
    inkedVariant: {
      description: "Draw 2 cards. Gain 5 block.",
      effects: [
        { type: "DRAW_CARDS", value: 2 },
        { type: "BLOCK", value: 5 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Draw 2 cards. Gain 4 block.",
      effects: [
        { type: "DRAW_CARDS", value: 2 },
        { type: "BLOCK", value: 4 },
      ],
    },
    isStarterCard: false,
    biome: "AFRICAN",
  },
  {
    id: "anansis_web",
    name: "Anansi's Web",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "UNCOMMON",
    description:
      "Apply 2 Vulnerable to ALL enemies. Draw 1 card. Gain 1 Strength.",
    effects: [
      { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
      { type: "DRAW_CARDS", value: 1 },
      { type: "GAIN_STRENGTH", value: 1 },
    ],
    inkedVariant: {
      description:
        "Apply 3 Vulnerable to ALL enemies. Draw 2 cards. Gain 1 Strength.",
      effects: [
        { type: "APPLY_DEBUFF", value: 3, buff: "VULNERABLE", duration: 2 },
        { type: "DRAW_CARDS", value: 2 },
        { type: "GAIN_STRENGTH", value: 1 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description:
        "Apply 3 Vulnerable to ALL enemies. Draw 1 card. Gain 1 Strength.",
      effects: [
        { type: "APPLY_DEBUFF", value: 3, buff: "VULNERABLE", duration: 2 },
        { type: "DRAW_CARDS", value: 1 },
        { type: "GAIN_STRENGTH", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "AFRICAN",
  },
  {
    id: "annotated_thesis",
    name: "Annotated Thesis",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "UNCOMMON",
    description: "Gain 6 block. Draw 1 card. Upgrade 1 random card in hand.",
    effects: [
      { type: "BLOCK", value: 6 },
      { type: "DRAW_CARDS", value: 1 },
      { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 1 },
    ],
    inkedVariant: {
      description: "Gain 8 block. Draw 2 cards. Upgrade 1 random card in hand.",
      effects: [
        { type: "BLOCK", value: 8 },
        { type: "DRAW_CARDS", value: 2 },
        { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 1 },
      ],
      inkMarkCost: 2,
      upgradedDescription:
        "Gain 11 block. Draw 2 cards. Upgrade 1 random card in hand.",
      upgradedEffects: [
        { type: "BLOCK", value: 11 },
        { type: "DRAW_CARDS", value: 2 },
        { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 1 },
      ],
    },
    upgrade: {
      description: "Gain 9 block. Draw 1 card. Upgrade 1 random card in hand.",
      effects: [
        { type: "BLOCK", value: 9 },
        { type: "DRAW_CARDS", value: 1 },
        { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "bibliothecaire",
  },
  {
    id: "forbidden_appendix",
    name: "Forbidden Appendix",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "RARE",
    description: "Draw 3 cards. Exhaust.",
    effects: [
      { type: "DRAW_CARDS", value: 3 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: {
      description: "Draw 4 cards. Exhaust.",
      effects: [
        { type: "DRAW_CARDS", value: 4 },
        { type: "EXHAUST", value: 0 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Draw 4 cards. Exhaust.",
      effects: [
        { type: "DRAW_CARDS", value: 4 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "bibliothecaire",
  },
  {
    id: "index_of_echoes",
    name: "Index of Echoes",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "RARE",
    description: "Gain 1 energy. Draw 2 cards.",
    effects: [
      { type: "GAIN_ENERGY", value: 1 },
      { type: "DRAW_CARDS", value: 2 },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Gain 1 energy. Draw 3 cards.",
      effects: [
        { type: "GAIN_ENERGY", value: 1 },
        { type: "DRAW_CARDS", value: 3 },
      ],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "bibliothecaire",
  },
  {
    id: "redacted_blast",
    name: "Redacted Blast",
    type: "ATTACK",
    energyCost: 2,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "RARE",
    description: "Deal 10 damage to ALL enemies. Apply 1 Weak to ALL enemies.",
    effects: [
      { type: "DAMAGE", value: 10 },
      { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
    ],
    inkedVariant: {
      description:
        "Deal 14 damage to ALL enemies. Apply 2 Weak to ALL enemies.",
      effects: [
        { type: "DAMAGE", value: 14 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
      ],
      inkMarkCost: 3,
    },
    upgrade: {
      description:
        "Deal 14 damage to ALL enemies. Apply 2 Weak to ALL enemies.",
      effects: [
        { type: "DAMAGE", value: 14 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
      ],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "scribe",
    isCollectible: false,
  },
  {
    id: "curator_pact",
    name: "Curator Pact",
    type: "SKILL",
    energyCost: 0,
    inkCost: 0,
    targeting: "SELF",
    rarity: "UNCOMMON",
    description:
      "Gain 1 energy. Return 1 random non-Status/Curse card from your discard to your hand. Add 1 Hexed Parchment to your discard. Exhaust.",
    effects: [
      { type: "GAIN_ENERGY", value: 1 },
      { type: "MOVE_RANDOM_NON_CLOG_DISCARD_TO_HAND", value: 1 },
      { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "hexed_parchment" },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: null,
    upgrade: {
      description:
        "Gain 2 energy. Return 1 random non-Status/Curse card from your discard to your hand. Add 1 Hexed Parchment to your discard. Exhaust.",
      effects: [
        { type: "GAIN_ENERGY", value: 2 },
        { type: "MOVE_RANDOM_NON_CLOG_DISCARD_TO_HAND", value: 1 },
        { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "hexed_parchment" },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "LIBRARY",
    characterId: "bibliothecaire",
  },

  // =========================================================
  // VIKING — Scribe
  // =========================================================
  {
    id: "iron_verse",
    name: "Iron Verse",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description: "Apply 2 Bleed. Deal 2 damage per Bleed on target.",
    effects: [
      { type: "APPLY_DEBUFF", value: 2, buff: "BLEED", duration: 4 },
      { type: "DAMAGE_PER_DEBUFF", value: 2, buff: "BLEED" },
    ],
    inkedVariant: {
      description: "Apply 3 Bleed. Deal 3 damage per Bleed on target.",
      effects: [
        { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 4 },
        { type: "DAMAGE_PER_DEBUFF", value: 3, buff: "BLEED" },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Apply 2 Bleed. Deal 3 damage per Bleed on target.",
      effects: [
        { type: "APPLY_DEBUFF", value: 2, buff: "BLEED", duration: 4 },
        { type: "DAMAGE_PER_DEBUFF", value: 3, buff: "BLEED" },
      ],
    },
    isStarterCard: false,
    biome: "VIKING",
    characterId: "scribe",
  },
  {
    id: "frost_rune_shield",
    name: "Frost Rune Shield",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "COMMON",
    description: "Gain 5 block. Gain 2 block per Bleed on enemies.",
    effects: [
      { type: "BLOCK", value: 5 },
      { type: "BLOCK_PER_DEBUFF", value: 2, buff: "BLEED" },
    ],
    inkedVariant: {
      description: "Gain 7 block. Gain 3 block per Bleed on enemies.",
      effects: [
        { type: "BLOCK", value: 7 },
        { type: "BLOCK_PER_DEBUFF", value: 3, buff: "BLEED" },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Gain 7 block. Gain 2 block per Bleed on enemies.",
      effects: [
        { type: "BLOCK", value: 7 },
        { type: "BLOCK_PER_DEBUFF", value: 2, buff: "BLEED" },
      ],
    },
    isStarterCard: false,
    biome: "VIKING",
    characterId: "scribe",
  },
  {
    id: "scald_cry",
    name: "Scald Cry",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description: "Draw 1 card. Gain 1 Strength. Apply 2 Bleed.",
    effects: [
      { type: "DRAW_CARDS", value: 1 },
      { type: "GAIN_STRENGTH", value: 1 },
      { type: "APPLY_DEBUFF", value: 2, buff: "BLEED", duration: 4 },
    ],
    inkedVariant: {
      description: "Draw 1 card. Gain 2 Strength. Apply 3 Bleed.",
      effects: [
        { type: "DRAW_CARDS", value: 1 },
        { type: "GAIN_STRENGTH", value: 2 },
        { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 4 },
      ],
      inkMarkCost: 2,
      upgradedDescription: "Draw 1 card. Gain 2 Strength. Apply 4 Bleed.",
      upgradedEffects: [
        { type: "DRAW_CARDS", value: 1 },
        { type: "GAIN_STRENGTH", value: 2 },
        { type: "APPLY_DEBUFF", value: 4, buff: "BLEED", duration: 4 },
      ],
    },
    upgrade: {
      description: "Draw 1 card. Gain 1 Strength. Apply 3 Bleed.",
      effects: [
        { type: "DRAW_CARDS", value: 1 },
        { type: "GAIN_STRENGTH", value: 1 },
        { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 4 },
      ],
    },
    isStarterCard: false,
    biome: "VIKING",
    characterId: "scribe",
  },
  {
    id: "rune_storm",
    name: "Rune Storm",
    type: "ATTACK",
    energyCost: 2,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "UNCOMMON",
    description: "Deal 10 damage to ALL enemies. Apply 2 Bleed to ALL enemies.",
    effects: [
      { type: "DAMAGE", value: 10 },
      { type: "APPLY_DEBUFF", value: 2, buff: "BLEED", duration: 4 },
    ],
    inkedVariant: {
      description:
        "Deal 14 damage to ALL enemies. Apply 3 Bleed to ALL enemies.",
      effects: [
        { type: "DAMAGE", value: 14 },
        { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 4 },
      ],
      inkMarkCost: 3,
    },
    upgrade: {
      description:
        "Deal 14 damage to ALL enemies. Apply 2 Bleed to ALL enemies.",
      effects: [
        { type: "DAMAGE", value: 14 },
        { type: "APPLY_DEBUFF", value: 2, buff: "BLEED", duration: 4 },
      ],
    },
    isStarterCard: false,
    biome: "VIKING",
    characterId: "scribe",
  },
  {
    id: "battle_inscription",
    name: "Battle Inscription",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "UNCOMMON",
    description:
      "Gain 5 block. Gain 3 block per current Ink. Upgrade 1 random card in hand. Drain all Ink.",
    effects: [
      { type: "BLOCK", value: 5 },
      { type: "BLOCK_PER_CURRENT_INK", value: 3 },
      { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 0 },
    ],
    inkedVariant: null,
    upgrade: {
      description:
        "Gain 7 block. Gain 3 block per current Ink. Upgrade 1 random card in hand. Drain all Ink.",
      effects: [
        { type: "BLOCK", value: 7 },
        { type: "BLOCK_PER_CURRENT_INK", value: 3 },
        { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "VIKING",
    characterId: "scribe",
  },
  {
    id: "odin_script",
    name: "Odin's Script",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "RARE",
    description:
      "Deal 8 damage. Deal 3 damage per card in your Exhaust pile. Add 1 Dazed to your discard.",
    effects: [
      { type: "DAMAGE", value: 8 },
      { type: "DAMAGE_PER_EXHAUSTED_CARD", value: 3 },
      { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
    ],
    inkedVariant: null,
    upgrade: {
      description:
        "Deal 10 damage. Deal 4 damage per card in your Exhaust pile. Add 1 Dazed to your discard.",
      effects: [
        { type: "DAMAGE", value: 10 },
        { type: "DAMAGE_PER_EXHAUSTED_CARD", value: 4 },
        { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
      ],
    },
    isStarterCard: false,
    biome: "VIKING",
    characterId: "scribe",
  },
  {
    id: "epic_saga",
    name: "Epic Saga",
    type: "POWER",
    energyCost: 2,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "RARE",
    description:
      "Deal 4 damage to ALL enemies. Deal 2 damage per Bleed on enemies. Exhaust.",
    effects: [
      { type: "DAMAGE", value: 4 },
      { type: "DAMAGE_PER_DEBUFF", value: 2, buff: "BLEED" },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: null,
    upgrade: {
      description:
        "Deal 6 damage to ALL enemies. Deal 2 damage per Bleed on enemies. Exhaust.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "DAMAGE_PER_DEBUFF", value: 2, buff: "BLEED" },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "VIKING",
    characterId: "scribe",
  },
  // =========================================================
  // GREEK — Scribe
  // =========================================================
  {
    id: "logos_strike",
    name: "Logos Strike",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description: "Deal 5 damage. Apply 1 Vulnerable. Draw 1 card.",
    effects: [
      { type: "DAMAGE", value: 5 },
      { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
      { type: "DRAW_CARDS", value: 1 },
    ],
    inkedVariant: {
      description: "Deal 8 damage. Apply 2 Vulnerable. Draw 1 card.",
      effects: [
        { type: "DAMAGE", value: 8 },
        { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        { type: "DRAW_CARDS", value: 1 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Deal 8 damage. Apply 1 Vulnerable. Draw 1 card.",
      effects: [
        { type: "DAMAGE", value: 8 },
        { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
        { type: "DRAW_CARDS", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "GREEK",
    characterId: "scribe",
  },
  {
    id: "philosophers_quill",
    name: "Philosopher's Quill",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description: "Gain 1 ink. Apply 2 Poison. Draw 1 card.",
    effects: [
      { type: "GAIN_INK", value: 1 },
      { type: "APPLY_DEBUFF", value: 2, buff: "POISON" },
      { type: "DRAW_CARDS", value: 1 },
    ],
    inkedVariant: {
      description: "Gain 2 ink. Apply 3 Poison. Draw 1 card.",
      effects: [
        { type: "GAIN_INK", value: 2 },
        { type: "APPLY_DEBUFF", value: 3, buff: "POISON" },
        { type: "DRAW_CARDS", value: 1 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Gain 1 ink. Apply 3 Poison. Draw 1 card.",
      effects: [
        { type: "GAIN_INK", value: 1 },
        { type: "APPLY_DEBUFF", value: 3, buff: "POISON" },
        { type: "DRAW_CARDS", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "GREEK",
    characterId: "scribe",
  },
  {
    id: "epic_simile",
    name: "Epic Simile",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "COMMON",
    description:
      "Deal 4 damage to ALL enemies. Apply 1 Weak to ALL enemies. Gain 1 ink.",
    effects: [
      { type: "DAMAGE", value: 4 },
      { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
      { type: "GAIN_INK", value: 1 },
    ],
    inkedVariant: {
      description:
        "Deal 6 damage to ALL enemies. Apply 2 Weak to ALL enemies. Gain 2 ink.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        { type: "GAIN_INK", value: 2 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description:
        "Deal 6 damage to ALL enemies. Apply 1 Weak to ALL enemies. Gain 1 ink.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        { type: "GAIN_INK", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "GREEK",
    characterId: "scribe",
  },
  {
    id: "hermes_dash",
    name: "Hermes Dash",
    type: "ATTACK",
    energyCost: 0,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description: "Deal 4 damage. Apply 2 Bleed. Gain 1 ink. Exhaust.",
    effects: [
      { type: "DAMAGE", value: 4 },
      { type: "APPLY_DEBUFF", value: 2, buff: "BLEED", duration: 4 },
      { type: "GAIN_INK", value: 1 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: {
      description: "Deal 6 damage. Apply 3 Bleed. Gain 2 ink. Exhaust.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 4 },
        { type: "GAIN_INK", value: 2 },
        { type: "EXHAUST", value: 0 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Deal 6 damage. Apply 2 Bleed. Gain 1 ink. Exhaust.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "APPLY_DEBUFF", value: 2, buff: "BLEED", duration: 4 },
        { type: "GAIN_INK", value: 1 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "GREEK",
    characterId: "scribe",
  },
  {
    id: "written_prophecy",
    name: "Written Prophecy",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description:
      "Draw 2 cards. Deal 2 damage. Deal 2 damage per card drawn this turn. Your next draw goes to discard this turn. Exhaust.",
    effects: [
      { type: "DRAW_CARDS", value: 2 },
      { type: "DAMAGE", value: 2 },
      { type: "DAMAGE_PER_DRAWN_THIS_TURN", value: 2 },
      { type: "NEXT_DRAW_TO_DISCARD_THIS_TURN", value: 1 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: {
      description:
        "Draw 3 cards. Deal 3 damage. Deal 3 damage per card drawn this turn. Your next draw goes to discard this turn. Exhaust.",
      effects: [
        { type: "DRAW_CARDS", value: 3 },
        { type: "DAMAGE", value: 3 },
        { type: "DAMAGE_PER_DRAWN_THIS_TURN", value: 3 },
        { type: "NEXT_DRAW_TO_DISCARD_THIS_TURN", value: 1 },
        { type: "EXHAUST", value: 0 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description:
        "Draw 3 cards. Deal 2 damage. Deal 2 damage per card drawn this turn. Your next draw goes to discard this turn. Exhaust.",
      effects: [
        { type: "DRAW_CARDS", value: 3 },
        { type: "DAMAGE", value: 2 },
        { type: "DAMAGE_PER_DRAWN_THIS_TURN", value: 2 },
        { type: "NEXT_DRAW_TO_DISCARD_THIS_TURN", value: 1 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "GREEK",
    characterId: "scribe",
  },
  {
    id: "titans_wrath",
    name: "Titan's Wrath",
    type: "ATTACK",
    energyCost: 2,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description:
      "Deal 6 damage. Deal 2 damage per Vulnerable on target. Apply 1 Vulnerable.",
    effects: [
      { type: "DAMAGE", value: 6 },
      { type: "DAMAGE_PER_DEBUFF", value: 2, buff: "VULNERABLE" },
      { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
    ],
    inkedVariant: {
      description:
        "Deal 9 damage. Deal 3 damage per Vulnerable on target. Apply 2 Vulnerable.",
      effects: [
        { type: "DAMAGE", value: 9 },
        { type: "DAMAGE_PER_DEBUFF", value: 3, buff: "VULNERABLE" },
        { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
      ],
      inkMarkCost: 3,
    },
    upgrade: {
      description:
        "Deal 8 damage. Deal 2 damage per Vulnerable on target. Apply 1 Vulnerable.",
      effects: [
        { type: "DAMAGE", value: 8 },
        { type: "DAMAGE_PER_DEBUFF", value: 2, buff: "VULNERABLE" },
        { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
      ],
    },
    isStarterCard: false,
    biome: "GREEK",
    characterId: "scribe",
  },
  {
    id: "ares_verse",
    name: "Ares Verse",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "UNCOMMON",
    description: "Gain 6 block. Gain 2 Strength.",
    effects: [
      { type: "BLOCK", value: 6 },
      { type: "GAIN_STRENGTH", value: 2 },
    ],
    inkedVariant: {
      description: "Gain 8 block. Gain 3 Strength.",
      effects: [
        { type: "BLOCK", value: 8 },
        { type: "GAIN_STRENGTH", value: 3 },
      ],
      inkMarkCost: 2,
      upgradedDescription: "Gain 10 block. Gain 3 Strength.",
      upgradedEffects: [
        { type: "BLOCK", value: 10 },
        { type: "GAIN_STRENGTH", value: 3 },
      ],
    },
    upgrade: {
      description: "Gain 8 block. Gain 2 Strength.",
      effects: [
        { type: "BLOCK", value: 8 },
        { type: "GAIN_STRENGTH", value: 2 },
      ],
    },
    isStarterCard: false,
    biome: "GREEK",
    characterId: "scribe",
  },
  {
    id: "olympian_scripture",
    name: "Olympian Scripture",
    type: "SKILL",
    energyCost: 2,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "RARE",
    description:
      "Draw 3 cards. Upgrade 1 random card in hand. Gain 1 energy. Deal 4 damage. If you have an upgraded card in hand, deal 8 more damage. Exhaust.",
    effects: [
      { type: "DRAW_CARDS", value: 3 },
      { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 1 },
      { type: "GAIN_ENERGY", value: 1 },
      { type: "DAMAGE", value: 4 },
      { type: "DAMAGE_BONUS_IF_UPGRADED_IN_HAND", value: 8 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: null,
    upgrade: {
      description:
        "Draw 4 cards. Upgrade 1 random card in hand. Gain 1 energy. Deal 5 damage. If you have an upgraded card in hand, deal 10 more damage. Exhaust.",
      effects: [
        { type: "DRAW_CARDS", value: 4 },
        { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 1 },
        { type: "GAIN_ENERGY", value: 1 },
        { type: "DAMAGE", value: 5 },
        { type: "DAMAGE_BONUS_IF_UPGRADED_IN_HAND", value: 10 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "GREEK",
    characterId: "scribe",
  },
  // =========================================================
  // EGYPTIAN — Scribe
  // =========================================================
  {
    id: "hieroglyph_strike",
    name: "Hieroglyph Strike",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description: "Deal 8 damage. Gain 1 ink.",
    effects: [
      { type: "DAMAGE", value: 8 },
      { type: "GAIN_INK", value: 1 },
    ],
    inkedVariant: {
      description: "Deal 12 damage. Gain 2 ink.",
      effects: [
        { type: "DAMAGE", value: 12 },
        { type: "GAIN_INK", value: 2 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Deal 11 damage. Gain 1 ink.",
      effects: [
        { type: "DAMAGE", value: 11 },
        { type: "GAIN_INK", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "EGYPTIAN",
    characterId: "scribe",
  },
  {
    id: "sacred_papyrus",
    name: "Sacred Papyrus",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "COMMON",
    description: "Gain 5 block. Gain 2 block per Poison on enemies.",
    effects: [
      { type: "BLOCK", value: 5 },
      { type: "BLOCK_PER_DEBUFF", value: 2, buff: "POISON" },
    ],
    inkedVariant: {
      description: "Gain 7 block. Gain 3 block per Poison on enemies.",
      effects: [
        { type: "BLOCK", value: 7 },
        { type: "BLOCK_PER_DEBUFF", value: 3, buff: "POISON" },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Gain 7 block. Gain 2 block per Poison on enemies.",
      effects: [
        { type: "BLOCK", value: 7 },
        { type: "BLOCK_PER_DEBUFF", value: 2, buff: "POISON" },
      ],
    },
    isStarterCard: false,
    biome: "EGYPTIAN",
    characterId: "scribe",
  },
  {
    id: "spell_inscription",
    name: "Spell Inscription",
    type: "ATTACK",
    energyCost: 2,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description: "Deal 9 damage. Apply 3 Poison. Gain 2 ink.",
    effects: [
      { type: "DAMAGE", value: 9 },
      { type: "APPLY_DEBUFF", value: 3, buff: "POISON" },
      { type: "GAIN_INK", value: 2 },
    ],
    inkedVariant: {
      description: "Deal 13 damage. Apply 4 Poison. Gain 3 ink.",
      effects: [
        { type: "DAMAGE", value: 13 },
        { type: "APPLY_DEBUFF", value: 4, buff: "POISON" },
        { type: "GAIN_INK", value: 3 },
      ],
      inkMarkCost: 3,
    },
    upgrade: {
      description: "Deal 13 damage. Apply 3 Poison. Gain 2 ink.",
      effects: [
        { type: "DAMAGE", value: 13 },
        { type: "APPLY_DEBUFF", value: 3, buff: "POISON" },
        { type: "GAIN_INK", value: 2 },
      ],
    },
    isStarterCard: false,
    biome: "EGYPTIAN",
    characterId: "scribe",
  },
  {
    id: "book_of_ra",
    name: "Book of Ra",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description:
      "Gain 2 ink. Draw 1 card. Apply 2 Vulnerable. Gain 1 Strength.",
    effects: [
      { type: "GAIN_INK", value: 2 },
      { type: "DRAW_CARDS", value: 1 },
      { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
      { type: "GAIN_STRENGTH", value: 1 },
    ],
    inkedVariant: null,
    upgrade: {
      description:
        "Gain 2 ink. Draw 2 cards. Apply 2 Vulnerable. Gain 1 Strength.",
      effects: [
        { type: "GAIN_INK", value: 2 },
        { type: "DRAW_CARDS", value: 2 },
        { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        { type: "GAIN_STRENGTH", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "EGYPTIAN",
    characterId: "scribe",
  },
  {
    id: "sacred_ink_burst",
    name: "Sacred Ink Burst",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description:
      "Gain 3 ink. Gain 6 block. Deal 2 damage per Poison on target.",
    effects: [
      { type: "GAIN_INK", value: 3 },
      { type: "BLOCK", value: 6 },
      { type: "DAMAGE_PER_DEBUFF", value: 2, buff: "POISON" },
    ],
    inkedVariant: {
      description:
        "Gain 4 ink. Gain 9 block. Deal 3 damage per Poison on target.",
      effects: [
        { type: "GAIN_INK", value: 4 },
        { type: "BLOCK", value: 9 },
        { type: "DAMAGE_PER_DEBUFF", value: 3, buff: "POISON" },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description:
        "Gain 3 ink. Gain 8 block. Deal 2 damage per Poison on target.",
      effects: [
        { type: "GAIN_INK", value: 3 },
        { type: "BLOCK", value: 8 },
        { type: "DAMAGE_PER_DEBUFF", value: 2, buff: "POISON" },
      ],
    },
    isStarterCard: false,
    biome: "EGYPTIAN",
    characterId: "scribe",
  },
  {
    id: "scribes_judgment",
    name: "Scribe's Judgment",
    type: "ATTACK",
    energyCost: 2,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "RARE",
    description: "Deal 8 damage. Deal 3 damage per Bleed on target. Exhaust.",
    effects: [
      { type: "DAMAGE", value: 8 },
      { type: "DAMAGE_PER_DEBUFF", value: 3, buff: "BLEED" },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: {
      description:
        "Deal 12 damage. Deal 4 damage per Bleed on target. Exhaust.",
      effects: [
        { type: "DAMAGE", value: 12 },
        { type: "DAMAGE_PER_DEBUFF", value: 4, buff: "BLEED" },
        { type: "EXHAUST", value: 0 },
      ],
      inkMarkCost: 3,
    },
    upgrade: {
      description:
        "Deal 10 damage. Deal 3 damage per Bleed on target. Exhaust.",
      effects: [
        { type: "DAMAGE", value: 10 },
        { type: "DAMAGE_PER_DEBUFF", value: 3, buff: "BLEED" },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "EGYPTIAN",
    characterId: "scribe",
  },
  // =========================================================
  // LOVECRAFTIAN — Scribe
  // =========================================================
  {
    id: "void_quill",
    name: "Void Quill",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description: "Deal 10 damage. Add 1 Dazed to discard.",
    effects: [
      { type: "DAMAGE", value: 10 },
      { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Deal 13 damage. Add 1 Dazed to discard.",
      effects: [
        { type: "DAMAGE", value: 13 },
        { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
      ],
    },
    isStarterCard: false,
    biome: "LOVECRAFTIAN",
    characterId: "scribe",
  },
  {
    id: "cursed_inscription",
    name: "Cursed Inscription",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description:
      "Deal 5 damage. Apply 3 Poison. Add 1 Dazed to your discard pile.",
    effects: [
      { type: "DAMAGE", value: 5 },
      { type: "APPLY_DEBUFF", value: 3, buff: "POISON" },
      { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
    ],
    inkedVariant: {
      description:
        "Deal 7 damage. Apply 4 Poison. Add 1 Dazed to your discard pile.",
      effects: [
        { type: "DAMAGE", value: 7 },
        { type: "APPLY_DEBUFF", value: 4, buff: "POISON" },
        { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description:
        "Deal 7 damage. Apply 3 Poison. Add 1 Dazed to your discard pile.",
      effects: [
        { type: "DAMAGE", value: 7 },
        { type: "APPLY_DEBUFF", value: 3, buff: "POISON" },
        { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
      ],
    },
    isStarterCard: false,
    biome: "LOVECRAFTIAN",
    characterId: "scribe",
  },
  {
    id: "black_page",
    name: "Black Page",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "COMMON",
    description: "Gain 2 ink. Apply 1 Weak to ALL enemies.",
    effects: [
      { type: "GAIN_INK", value: 2 },
      { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
    ],
    inkedVariant: {
      description: "Gain 3 ink. Apply 2 Weak to ALL enemies.",
      effects: [
        { type: "GAIN_INK", value: 3 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Gain 3 ink. Apply 1 Weak to ALL enemies.",
      effects: [
        { type: "GAIN_INK", value: 3 },
        { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
      ],
    },
    isStarterCard: false,
    biome: "LOVECRAFTIAN",
    characterId: "scribe",
  },
  {
    id: "forbidden_verse",
    name: "Forbidden Verse",
    type: "ATTACK",
    energyCost: 2,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description: "Deal 12 damage. Apply 2 Bleed. Apply 1 Weak.",
    effects: [
      { type: "DAMAGE", value: 12 },
      { type: "APPLY_DEBUFF", value: 2, buff: "BLEED", duration: 4 },
      { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
    ],
    inkedVariant: {
      description: "Deal 16 damage. Apply 3 Bleed. Apply 2 Weak.",
      effects: [
        { type: "DAMAGE", value: 16 },
        { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 4 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
      ],
      inkMarkCost: 3,
    },
    upgrade: {
      description: "Deal 16 damage. Apply 2 Bleed. Apply 1 Weak.",
      effects: [
        { type: "DAMAGE", value: 16 },
        { type: "APPLY_DEBUFF", value: 2, buff: "BLEED", duration: 4 },
        { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
      ],
    },
    isStarterCard: false,
    biome: "LOVECRAFTIAN",
    characterId: "scribe",
  },
  {
    id: "eldritch_script",
    name: "Eldritch Script",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "UNCOMMON",
    description: "Gain 3 ink. Apply 1 Vulnerable to ALL enemies. Draw 1 card.",
    effects: [
      { type: "GAIN_INK", value: 3 },
      { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
      { type: "DRAW_CARDS", value: 1 },
    ],
    inkedVariant: null,
    upgrade: {
      description:
        "Gain 3 ink. Apply 2 Vulnerable to ALL enemies. Draw 1 card.",
      effects: [
        { type: "GAIN_INK", value: 3 },
        { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        { type: "DRAW_CARDS", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "LOVECRAFTIAN",
    characterId: "scribe",
  },
  {
    id: "necrotic_words",
    name: "Necrotic Words",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "UNCOMMON",
    description: "Deal 5 damage to ALL enemies. Apply 2 Bleed to ALL enemies.",
    effects: [
      { type: "DAMAGE", value: 5 },
      { type: "APPLY_DEBUFF", value: 2, buff: "BLEED", duration: 4 },
    ],
    inkedVariant: {
      description:
        "Deal 7 damage to ALL enemies. Apply 3 Bleed to ALL enemies.",
      effects: [
        { type: "DAMAGE", value: 7 },
        { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 4 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description:
        "Deal 7 damage to ALL enemies. Apply 2 Bleed to ALL enemies.",
      effects: [
        { type: "DAMAGE", value: 7 },
        { type: "APPLY_DEBUFF", value: 2, buff: "BLEED", duration: 4 },
      ],
    },
    isStarterCard: false,
    biome: "LOVECRAFTIAN",
    characterId: "scribe",
  },
  {
    id: "void_scripture",
    name: "Void Scripture",
    type: "SKILL",
    energyCost: 2,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "RARE",
    description:
      "Add 1 Haunting Regret to your discard. Draw 2 cards. Deal 5 damage. Deal 5 damage per Status/Curse in your discard. Exhaust.",
    effects: [
      { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "haunting_regret" },
      { type: "DRAW_CARDS", value: 2 },
      { type: "DAMAGE", value: 5 },
      { type: "DAMAGE_PER_CLOG_IN_DISCARD", value: 5 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: null,
    upgrade: {
      description:
        "Add 1 Haunting Regret to your discard. Draw 3 cards. Deal 5 damage. Deal 6 damage per Status/Curse in your discard. Exhaust.",
      effects: [
        { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "haunting_regret" },
        { type: "DRAW_CARDS", value: 3 },
        { type: "DAMAGE", value: 5 },
        { type: "DAMAGE_PER_CLOG_IN_DISCARD", value: 6 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "LOVECRAFTIAN",
    characterId: "scribe",
  },
  // =========================================================
  // AZTEC — Scribe
  // =========================================================
  {
    id: "obsidian_quill",
    name: "Obsidian Quill",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description: "Gain 2 ink. Deal 4 damage to target.",
    effects: [
      { type: "GAIN_INK", value: 2 },
      { type: "DAMAGE", value: 4 },
    ],
    inkedVariant: {
      description: "Gain 3 ink. Deal 7 damage to target.",
      effects: [
        { type: "GAIN_INK", value: 3 },
        { type: "DAMAGE", value: 7 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Gain 3 ink. Deal 4 damage to target.",
      effects: [
        { type: "GAIN_INK", value: 3 },
        { type: "DAMAGE", value: 4 },
      ],
    },
    isStarterCard: false,
    biome: "AZTEC",
    characterId: "scribe",
  },
  {
    id: "codex_strike",
    name: "Codex Strike",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description: "Deal 8 damage. Apply 2 Bleed.",
    effects: [
      { type: "DAMAGE", value: 8 },
      { type: "APPLY_DEBUFF", value: 2, buff: "BLEED", duration: 4 },
    ],
    inkedVariant: {
      description: "Deal 11 damage. Apply 3 Bleed.",
      effects: [
        { type: "DAMAGE", value: 11 },
        { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 4 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Deal 11 damage. Apply 2 Bleed.",
      effects: [
        { type: "DAMAGE", value: 11 },
        { type: "APPLY_DEBUFF", value: 2, buff: "BLEED", duration: 4 },
      ],
    },
    isStarterCard: false,
    biome: "AZTEC",
    characterId: "scribe",
  },
  {
    id: "sacrificial_word",
    name: "Sacrificial Word",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "UNCOMMON",
    description:
      "Deal 4 damage to ALL enemies. Apply 1 Vulnerable to ALL enemies. Gain 2 ink.",
    effects: [
      { type: "DAMAGE", value: 4 },
      { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
      { type: "GAIN_INK", value: 2 },
    ],
    inkedVariant: null,
    upgrade: {
      description:
        "Deal 6 damage to ALL enemies. Apply 1 Vulnerable to ALL enemies. Gain 2 ink.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
        { type: "GAIN_INK", value: 2 },
      ],
    },
    isStarterCard: false,
    biome: "AZTEC",
    characterId: "scribe",
  },
  {
    id: "xipe_shield",
    name: "Xipe Shield",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "UNCOMMON",
    description:
      "Gain 8 block. Gain 2 ink. Your next draw goes to discard this turn.",
    effects: [
      { type: "BLOCK", value: 8 },
      { type: "GAIN_INK", value: 2 },
      { type: "NEXT_DRAW_TO_DISCARD_THIS_TURN", value: 1 },
    ],
    inkedVariant: null,
    upgrade: {
      description:
        "Gain 11 block. Gain 2 ink. Your next draw goes to discard this turn.",
      effects: [
        { type: "BLOCK", value: 11 },
        { type: "GAIN_INK", value: 2 },
        { type: "NEXT_DRAW_TO_DISCARD_THIS_TURN", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "AZTEC",
    characterId: "scribe",
  },
  {
    id: "sun_codex",
    name: "Sun Codex",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "UNCOMMON",
    description: "Gain 3 ink. Draw 1 card. Gain 1 Strength.",
    effects: [
      { type: "GAIN_INK", value: 3 },
      { type: "DRAW_CARDS", value: 1 },
      { type: "GAIN_STRENGTH", value: 1 },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Gain 3 ink. Draw 2 cards. Gain 1 Strength.",
      effects: [
        { type: "GAIN_INK", value: 3 },
        { type: "DRAW_CARDS", value: 2 },
        { type: "GAIN_STRENGTH", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "AZTEC",
    characterId: "scribe",
  },
  {
    id: "hummingbird_strike",
    name: "Hummingbird Strike",
    type: "ATTACK",
    energyCost: 2,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "RARE",
    description: "Deal 15 damage. Gain 2 Strength. Apply 3 Bleed.",
    effects: [
      { type: "DAMAGE", value: 15 },
      { type: "GAIN_STRENGTH", value: 2 },
      { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 4 },
    ],
    inkedVariant: {
      description: "Deal 20 damage. Gain 3 Strength. Apply 3 Bleed.",
      effects: [
        { type: "DAMAGE", value: 20 },
        { type: "GAIN_STRENGTH", value: 3 },
        { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 4 },
      ],
      inkMarkCost: 3,
    },
    upgrade: {
      description: "Deal 20 damage. Gain 2 Strength. Apply 3 Bleed.",
      effects: [
        { type: "DAMAGE", value: 20 },
        { type: "GAIN_STRENGTH", value: 2 },
        { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 4 },
      ],
    },
    isStarterCard: false,
    biome: "AZTEC",
    characterId: "scribe",
  },
  {
    id: "blood_codex",
    name: "Blood Codex",
    type: "POWER",
    energyCost: 2,
    inkCost: 0,
    targeting: "SELF",
    rarity: "RARE",
    description: "Gain 3 Strength. Gain 3 ink. Lose 8 HP. Exhaust.",
    effects: [
      { type: "GAIN_STRENGTH", value: 3 },
      { type: "GAIN_INK", value: 3 },
      { type: "DAMAGE", value: 8 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Gain 3 Strength. Gain 4 ink. Lose 8 HP. Exhaust.",
      effects: [
        { type: "GAIN_STRENGTH", value: 3 },
        { type: "GAIN_INK", value: 4 },
        { type: "DAMAGE", value: 8 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "AZTEC",
    characterId: "scribe",
  },
  // =========================================================
  // CELTIC — Scribe
  // =========================================================
  {
    id: "kells_strike",
    name: "Kells Strike",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description: "Deal 5 damage. Apply 2 Poison. Draw 1 card.",
    effects: [
      { type: "DAMAGE", value: 5 },
      { type: "APPLY_DEBUFF", value: 2, buff: "POISON" },
      { type: "DRAW_CARDS", value: 1 },
    ],
    inkedVariant: {
      description: "Deal 8 damage. Apply 3 Poison. Draw 1 card.",
      effects: [
        { type: "DAMAGE", value: 8 },
        { type: "APPLY_DEBUFF", value: 3, buff: "POISON" },
        { type: "DRAW_CARDS", value: 1 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Deal 8 damage. Apply 2 Poison. Draw 1 card.",
      effects: [
        { type: "DAMAGE", value: 8 },
        { type: "APPLY_DEBUFF", value: 2, buff: "POISON" },
        { type: "DRAW_CARDS", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "CELTIC",
    characterId: "scribe",
  },
  {
    id: "bardic_verse",
    name: "Bardic Verse",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description: "Gain 2 ink. Draw 1 card. Apply 2 Poison.",
    effects: [
      { type: "GAIN_INK", value: 2 },
      { type: "DRAW_CARDS", value: 1 },
      { type: "APPLY_DEBUFF", value: 2, buff: "POISON" },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Gain 3 ink. Draw 1 card. Apply 2 Poison.",
      effects: [
        { type: "GAIN_INK", value: 3 },
        { type: "DRAW_CARDS", value: 1 },
        { type: "APPLY_DEBUFF", value: 2, buff: "POISON" },
      ],
    },
    isStarterCard: false,
    biome: "CELTIC",
    characterId: "scribe",
  },
  {
    id: "illuminated_shield",
    name: "Illuminated Shield",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "COMMON",
    description: "Gain 8 block. Gain 1 ink. Gain 2 Thorns.",
    effects: [
      { type: "BLOCK", value: 8 },
      { type: "GAIN_INK", value: 1 },
      { type: "APPLY_BUFF", value: 2, buff: "THORNS" },
    ],
    inkedVariant: {
      description: "Gain 11 block. Gain 2 ink. Gain 3 Thorns.",
      effects: [
        { type: "BLOCK", value: 11 },
        { type: "GAIN_INK", value: 2 },
        { type: "APPLY_BUFF", value: 3, buff: "THORNS" },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Gain 11 block. Gain 1 ink. Gain 2 Thorns.",
      effects: [
        { type: "BLOCK", value: 11 },
        { type: "GAIN_INK", value: 1 },
        { type: "APPLY_BUFF", value: 2, buff: "THORNS" },
      ],
    },
    isStarterCard: false,
    biome: "CELTIC",
    characterId: "scribe",
  },
  {
    id: "iron_bard",
    name: "Iron Bard",
    type: "ATTACK",
    energyCost: 2,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description: "Deal 10 damage. Apply 3 Bleed. Draw 1 card.",
    effects: [
      { type: "DAMAGE", value: 10 },
      { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 4 },
      { type: "DRAW_CARDS", value: 1 },
    ],
    inkedVariant: {
      description: "Deal 13 damage. Apply 4 Bleed. Draw 1 card.",
      effects: [
        { type: "DAMAGE", value: 13 },
        { type: "APPLY_DEBUFF", value: 4, buff: "BLEED", duration: 4 },
        { type: "DRAW_CARDS", value: 1 },
      ],
      inkMarkCost: 3,
    },
    upgrade: {
      description: "Deal 13 damage. Apply 3 Bleed. Draw 1 card.",
      effects: [
        { type: "DAMAGE", value: 13 },
        { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 4 },
        { type: "DRAW_CARDS", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "CELTIC",
    characterId: "scribe",
  },
  {
    id: "triquetra_mark",
    name: "Triquetra Mark",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description:
      "Apply 2 Vulnerable to target. Apply 2 Weak to target. Draw 1 card.",
    effects: [
      { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
      { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
      { type: "DRAW_CARDS", value: 1 },
    ],
    inkedVariant: {
      description:
        "Apply 3 Vulnerable to target. Apply 3 Weak to target. Draw 1 card.",
      effects: [
        { type: "APPLY_DEBUFF", value: 3, buff: "VULNERABLE", duration: 2 },
        { type: "APPLY_DEBUFF", value: 3, buff: "WEAK", duration: 2 },
        { type: "DRAW_CARDS", value: 1 },
      ],
      inkMarkCost: 2,
      upgradedDescription:
        "Apply 4 Vulnerable to target. Apply 3 Weak to target. Draw 1 card.",
      upgradedEffects: [
        { type: "APPLY_DEBUFF", value: 4, buff: "VULNERABLE", duration: 2 },
        { type: "APPLY_DEBUFF", value: 3, buff: "WEAK", duration: 2 },
        { type: "DRAW_CARDS", value: 1 },
      ],
    },
    upgrade: {
      description:
        "Apply 3 Vulnerable to target. Apply 2 Weak to target. Draw 1 card.",
      effects: [
        { type: "APPLY_DEBUFF", value: 3, buff: "VULNERABLE", duration: 2 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        { type: "DRAW_CARDS", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "CELTIC",
    characterId: "scribe",
  },
  {
    id: "ogham_inscription",
    name: "Ogham Inscription",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "UNCOMMON",
    description: "Gain 2 ink. Draw 2 cards. Discard 1 random card.",
    effects: [
      { type: "GAIN_INK", value: 2 },
      { type: "DRAW_CARDS", value: 2 },
      { type: "FORCE_DISCARD_RANDOM", value: 1 },
    ],
    inkedVariant: {
      description: "Gain 3 ink. Draw 3 cards. Discard 1 random card.",
      effects: [
        { type: "GAIN_INK", value: 3 },
        { type: "DRAW_CARDS", value: 3 },
        { type: "FORCE_DISCARD_RANDOM", value: 1 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Gain 2 ink. Draw 3 cards. Discard 1 random card.",
      effects: [
        { type: "GAIN_INK", value: 2 },
        { type: "DRAW_CARDS", value: 3 },
        { type: "FORCE_DISCARD_RANDOM", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "CELTIC",
    characterId: "scribe",
  },
  {
    id: "celtic_illumination",
    name: "Celtic Illumination",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "RARE",
    description: "Gain 4 ink. Draw 2 cards. Apply 2 Poison. Exhaust.",
    effects: [
      { type: "GAIN_INK", value: 4 },
      { type: "DRAW_CARDS", value: 2 },
      { type: "APPLY_DEBUFF", value: 2, buff: "POISON" },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: {
      description: "Gain 5 ink. Draw 3 cards. Apply 3 Poison. Exhaust.",
      effects: [
        { type: "GAIN_INK", value: 5 },
        { type: "DRAW_CARDS", value: 3 },
        { type: "APPLY_DEBUFF", value: 3, buff: "POISON" },
        { type: "EXHAUST", value: 0 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Gain 4 ink. Draw 3 cards. Apply 2 Poison. Exhaust.",
      effects: [
        { type: "GAIN_INK", value: 4 },
        { type: "DRAW_CARDS", value: 3 },
        { type: "APPLY_DEBUFF", value: 2, buff: "POISON" },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "CELTIC",
    characterId: "scribe",
  },
  {
    id: "green_man_verse",
    name: "Green Man Verse",
    type: "POWER",
    energyCost: 2,
    inkCost: 0,
    targeting: "SELF",
    rarity: "RARE",
    description: "Gain 2 Strength. Gain 2 ink. Heal 4. Exhaust.",
    effects: [
      { type: "GAIN_STRENGTH", value: 2 },
      { type: "GAIN_INK", value: 2 },
      { type: "HEAL", value: 4 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Gain 3 Strength. Gain 2 ink. Heal 4. Exhaust.",
      effects: [
        { type: "GAIN_STRENGTH", value: 3 },
        { type: "GAIN_INK", value: 2 },
        { type: "HEAL", value: 4 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "CELTIC",
    characterId: "scribe",
  },
  // =========================================================
  // RUSSIAN — Scribe
  // =========================================================
  {
    id: "byliny_verse",
    name: "Byliny Verse",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "COMMON",
    description: "Gain 2 ink. Draw 1 card. Apply 1 Weak to ALL enemies.",
    effects: [
      { type: "GAIN_INK", value: 2 },
      { type: "DRAW_CARDS", value: 1 },
      { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Gain 3 ink. Draw 1 card. Apply 1 Weak to ALL enemies.",
      effects: [
        { type: "GAIN_INK", value: 3 },
        { type: "DRAW_CARDS", value: 1 },
        { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
      ],
    },
    isStarterCard: false,
    biome: "RUSSIAN",
    characterId: "scribe",
  },
  {
    id: "bogatyr_strike",
    name: "Bogatyr Strike",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description: "Deal 7 damage. Apply 1 Weak. Gain 4 block.",
    effects: [
      { type: "DAMAGE", value: 7 },
      { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
      { type: "BLOCK", value: 4 },
    ],
    inkedVariant: {
      description: "Deal 10 damage. Apply 2 Weak. Gain 7 block.",
      effects: [
        { type: "DAMAGE", value: 10 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        { type: "BLOCK", value: 7 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Deal 10 damage. Apply 1 Weak. Gain 6 block.",
      effects: [
        { type: "DAMAGE", value: 10 },
        { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        { type: "BLOCK", value: 6 },
      ],
    },
    isStarterCard: false,
    biome: "RUSSIAN",
    characterId: "scribe",
  },
  {
    id: "winter_inscription",
    name: "Winter Inscription",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "COMMON",
    description: "Gain 5 block. Gain 1 Thorns per Weak on enemies.",
    effects: [
      { type: "BLOCK", value: 5 },
      {
        type: "APPLY_BUFF_PER_DEBUFF",
        value: 1,
        buff: "THORNS",
        scalingBuff: "WEAK",
      },
    ],
    inkedVariant: {
      description: "Gain 7 block. Gain 2 Thorns per Weak on enemies.",
      effects: [
        { type: "BLOCK", value: 7 },
        {
          type: "APPLY_BUFF_PER_DEBUFF",
          value: 2,
          buff: "THORNS",
          scalingBuff: "WEAK",
        },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Gain 7 block. Gain 1 Thorns per Weak on enemies.",
      effects: [
        { type: "BLOCK", value: 7 },
        {
          type: "APPLY_BUFF_PER_DEBUFF",
          value: 1,
          buff: "THORNS",
          scalingBuff: "WEAK",
        },
      ],
    },
    isStarterCard: false,
    biome: "RUSSIAN",
    characterId: "scribe",
  },
  {
    id: "blizzard_verse",
    name: "Blizzard Verse",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "UNCOMMON",
    description:
      "Deal 4 damage to ALL enemies. Apply 2 Weak to ALL enemies. Gain 5 block.",
    effects: [
      { type: "DAMAGE", value: 4 },
      { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
      { type: "BLOCK", value: 5 },
    ],
    inkedVariant: {
      description:
        "Deal 6 damage to ALL enemies. Apply 3 Weak to ALL enemies. Gain 8 block.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "APPLY_DEBUFF", value: 3, buff: "WEAK", duration: 2 },
        { type: "BLOCK", value: 8 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description:
        "Deal 6 damage to ALL enemies. Apply 2 Weak to ALL enemies. Gain 5 block.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        { type: "BLOCK", value: 5 },
      ],
    },
    isStarterCard: false,
    biome: "RUSSIAN",
    characterId: "scribe",
  },
  {
    id: "firebird_script",
    name: "Firebird Script",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "UNCOMMON",
    description: "Gain 3 ink. Gain 6 block. Gain 1 Strength.",
    effects: [
      { type: "GAIN_INK", value: 3 },
      { type: "BLOCK", value: 6 },
      { type: "GAIN_STRENGTH", value: 1 },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Gain 3 ink. Gain 8 block. Gain 1 Strength.",
      effects: [
        { type: "GAIN_INK", value: 3 },
        { type: "BLOCK", value: 8 },
        { type: "GAIN_STRENGTH", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "RUSSIAN",
    characterId: "scribe",
  },
  {
    id: "baba_yaga_deal",
    name: "Baba Yaga's Deal",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "UNCOMMON",
    description: "Lose 4 HP. Gain 3 ink. Draw 2 cards.",
    effects: [
      { type: "DAMAGE", value: 4 },
      { type: "GAIN_INK", value: 3 },
      { type: "DRAW_CARDS", value: 2 },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Lose 4 HP. Gain 4 ink. Draw 2 cards.",
      effects: [
        { type: "DAMAGE", value: 4 },
        { type: "GAIN_INK", value: 4 },
        { type: "DRAW_CARDS", value: 2 },
      ],
    },
    isStarterCard: false,
    biome: "RUSSIAN",
    characterId: "scribe",
  },
  {
    id: "koschei_strike",
    name: "Koschei Strike",
    type: "ATTACK",
    energyCost: 2,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "RARE",
    description:
      "Deal 8 damage. Apply 3 Bleed. Deal 2 damage per Bleed on target.",
    effects: [
      { type: "DAMAGE", value: 8 },
      { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 4 },
      { type: "DAMAGE_PER_DEBUFF", value: 2, buff: "BLEED" },
    ],
    inkedVariant: {
      description:
        "Deal 10 damage. Apply 4 Bleed. Deal 3 damage per Bleed on target.",
      effects: [
        { type: "DAMAGE", value: 10 },
        { type: "APPLY_DEBUFF", value: 4, buff: "BLEED", duration: 4 },
        { type: "DAMAGE_PER_DEBUFF", value: 3, buff: "BLEED" },
      ],
      inkMarkCost: 3,
    },
    upgrade: {
      description:
        "Deal 10 damage. Apply 3 Bleed. Deal 3 damage per Bleed on target.",
      effects: [
        { type: "DAMAGE", value: 10 },
        { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 4 },
        { type: "DAMAGE_PER_DEBUFF", value: 3, buff: "BLEED" },
      ],
    },
    isStarterCard: false,
    biome: "RUSSIAN",
    characterId: "scribe",
  },
  {
    id: "folk_epic",
    name: "Folk Epic",
    type: "POWER",
    energyCost: 2,
    inkCost: 0,
    targeting: "SELF",
    rarity: "RARE",
    description:
      "Gain 6 block. Gain 2 Thorns. Weak attackers trigger your Thorns 1 extra time this combat. Exhaust.",
    effects: [
      { type: "BLOCK", value: 6 },
      { type: "APPLY_BUFF", value: 2, buff: "THORNS" },
      { type: "RETRIGGER_THORNS_ON_WEAK_ATTACK", value: 1 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: null,
    upgrade: {
      description:
        "Gain 8 block. Gain 3 Thorns. Weak attackers trigger your Thorns 1 extra time this combat. Exhaust.",
      effects: [
        { type: "BLOCK", value: 8 },
        { type: "APPLY_BUFF", value: 3, buff: "THORNS" },
        { type: "RETRIGGER_THORNS_ON_WEAK_ATTACK", value: 1 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "RUSSIAN",
    characterId: "scribe",
  },
  // =========================================================
  // AFRICAN — Scribe
  // =========================================================
  {
    id: "drum_strike",
    name: "Griot's Beat",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description: "Deal 4 damage. Apply 2 Bleed. Draw 1 card.",
    effects: [
      { type: "DAMAGE", value: 4 },
      { type: "APPLY_DEBUFF", value: 2, buff: "BLEED", duration: 4 },
      { type: "DRAW_CARDS", value: 1 },
    ],
    inkedVariant: {
      description: "Deal 6 damage. Apply 3 Bleed. Draw 1 card.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 4 },
        { type: "DRAW_CARDS", value: 1 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Deal 6 damage. Apply 2 Bleed. Draw 1 card.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "APPLY_DEBUFF", value: 2, buff: "BLEED", duration: 4 },
        { type: "DRAW_CARDS", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "AFRICAN",
    characterId: "scribe",
  },
  {
    id: "war_dance",
    name: "Battle Chant",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "COMMON",
    description: "Deal 5 damage to ALL enemies. Gain 1 Strength.",
    effects: [
      { type: "DAMAGE", value: 5 },
      { type: "GAIN_STRENGTH", value: 1 },
    ],
    inkedVariant: {
      description: "Deal 7 damage to ALL enemies. Gain 2 Strength.",
      effects: [
        { type: "DAMAGE", value: 7 },
        { type: "GAIN_STRENGTH", value: 2 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Deal 7 damage to ALL enemies. Gain 1 Strength.",
      effects: [
        { type: "DAMAGE", value: 7 },
        { type: "GAIN_STRENGTH", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "AFRICAN",
    characterId: "scribe",
  },
  {
    id: "ink_of_ancestors",
    name: "Ink of Ancestors",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "COMMON",
    description:
      "Gain 2 ink. Draw 1 card. Discard 1 random card. Gain 1 Strength.",
    effects: [
      { type: "GAIN_INK", value: 2 },
      { type: "DRAW_CARDS", value: 1 },
      { type: "FORCE_DISCARD_RANDOM", value: 1 },
      { type: "GAIN_STRENGTH", value: 1 },
    ],
    inkedVariant: {
      description:
        "Gain 3 ink. Draw 2 cards. Discard 1 random card. Gain 2 Strength.",
      effects: [
        { type: "GAIN_INK", value: 3 },
        { type: "DRAW_CARDS", value: 2 },
        { type: "FORCE_DISCARD_RANDOM", value: 1 },
        { type: "GAIN_STRENGTH", value: 2 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description:
        "Gain 2 ink. Draw 2 cards. Discard 1 random card. Gain 1 Strength.",
      effects: [
        { type: "GAIN_INK", value: 2 },
        { type: "DRAW_CARDS", value: 2 },
        { type: "FORCE_DISCARD_RANDOM", value: 1 },
        { type: "GAIN_STRENGTH", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "AFRICAN",
    characterId: "scribe",
  },
  {
    id: "griot_strike",
    name: "Griot Strike",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description: "Deal 8 damage. Apply 2 Vulnerable. Draw 1 card.",
    effects: [
      { type: "DAMAGE", value: 8 },
      { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
      { type: "DRAW_CARDS", value: 1 },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Deal 11 damage. Apply 2 Vulnerable. Draw 1 card.",
      effects: [
        { type: "DAMAGE", value: 11 },
        { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        { type: "DRAW_CARDS", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "AFRICAN",
    characterId: "scribe",
  },
  {
    id: "anansi_tale",
    name: "Anansi's Tale",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "UNCOMMON",
    description: "Gain 2 ink. Apply 2 Weak to ALL enemies. Draw 1 card.",
    effects: [
      { type: "GAIN_INK", value: 2 },
      { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
      { type: "DRAW_CARDS", value: 1 },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Gain 2 ink. Apply 3 Weak to ALL enemies. Draw 1 card.",
      effects: [
        { type: "GAIN_INK", value: 2 },
        { type: "APPLY_DEBUFF", value: 3, buff: "WEAK", duration: 2 },
        { type: "DRAW_CARDS", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "AFRICAN",
    characterId: "scribe",
  },
  {
    id: "buffalo_charge",
    name: "Griot's Epic",
    type: "ATTACK",
    energyCost: 2,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description: "Deal 11 damage. Apply 2 Bleed. Gain 1 Strength.",
    effects: [
      { type: "DAMAGE", value: 11 },
      { type: "APPLY_DEBUFF", value: 2, buff: "BLEED", duration: 4 },
      { type: "GAIN_STRENGTH", value: 1 },
    ],
    inkedVariant: {
      description: "Deal 15 damage. Apply 3 Bleed. Gain 2 Strength.",
      effects: [
        { type: "DAMAGE", value: 15 },
        { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 4 },
        { type: "GAIN_STRENGTH", value: 2 },
      ],
      inkMarkCost: 3,
    },
    upgrade: {
      description: "Deal 15 damage. Apply 2 Bleed. Gain 1 Strength.",
      effects: [
        { type: "DAMAGE", value: 15 },
        { type: "APPLY_DEBUFF", value: 2, buff: "BLEED", duration: 4 },
        { type: "GAIN_STRENGTH", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "AFRICAN",
    characterId: "scribe",
  },
  {
    id: "ancestral_verse",
    name: "Ancestral Verse",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "RARE",
    description:
      "Draw 2 cards. Gain 3 ink. Apply 1 Vulnerable to ALL enemies. Exhaust.",
    effects: [
      { type: "DRAW_CARDS", value: 2 },
      { type: "GAIN_INK", value: 3 },
      { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: {
      description:
        "Draw 3 cards. Gain 4 ink. Apply 2 Vulnerable to ALL enemies. Exhaust.",
      effects: [
        { type: "DRAW_CARDS", value: 3 },
        { type: "GAIN_INK", value: 4 },
        { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        { type: "EXHAUST", value: 0 },
      ],
      inkMarkCost: 3,
    },
    upgrade: {
      description:
        "Draw 3 cards. Gain 3 ink. Apply 1 Vulnerable to ALL enemies. Exhaust.",
      effects: [
        { type: "DRAW_CARDS", value: 3 },
        { type: "GAIN_INK", value: 3 },
        { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "AFRICAN",
    characterId: "scribe",
  },
  {
    id: "sunbird_power",
    name: "Sunbird's Script",
    type: "POWER",
    energyCost: 2,
    inkCost: 0,
    targeting: "SELF",
    rarity: "RARE",
    description: "Gain 2 Strength. Gain 2 ink. Draw 1 card. Exhaust.",
    effects: [
      { type: "GAIN_STRENGTH", value: 2 },
      { type: "GAIN_INK", value: 2 },
      { type: "DRAW_CARDS", value: 1 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Gain 3 Strength. Gain 2 ink. Draw 1 card. Exhaust.",
      effects: [
        { type: "GAIN_STRENGTH", value: 3 },
        { type: "GAIN_INK", value: 2 },
        { type: "DRAW_CARDS", value: 1 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "AFRICAN",
    characterId: "scribe",
  },
  // =========================================================
  // AFRICAN — Bibliothécaire
  // =========================================================
  {
    id: "spider_web",
    name: "Web of Lore",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "COMMON",
    description:
      "Deal 3 damage to ALL enemies. Apply 1 Weak to ALL. Gain 1 Thorns per Weak on enemies.",
    effects: [
      { type: "DAMAGE", value: 3 },
      { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
      {
        type: "APPLY_BUFF_PER_DEBUFF",
        value: 1,
        buff: "THORNS",
        scalingBuff: "WEAK",
      },
    ],
    inkedVariant: {
      description:
        "Deal 5 damage to ALL. Apply 2 Weak to ALL. Gain 1 Thorns per Weak on enemies.",
      effects: [
        { type: "DAMAGE", value: 5 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        {
          type: "APPLY_BUFF_PER_DEBUFF",
          value: 1,
          buff: "THORNS",
          scalingBuff: "WEAK",
        },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description:
        "Deal 5 damage to ALL. Apply 1 Weak to ALL. Gain 1 Thorns per Weak on enemies.",
      effects: [
        { type: "DAMAGE", value: 5 },
        { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        {
          type: "APPLY_BUFF_PER_DEBUFF",
          value: 1,
          buff: "THORNS",
          scalingBuff: "WEAK",
        },
      ],
    },
    isStarterCard: false,
    biome: "AFRICAN",
    characterId: "bibliothecaire",
  },
  {
    id: "baobab_shield",
    name: "Baobab Codex",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "COMMON",
    description: "Gain 7 block. Heal 2. Gain 1 Thorns.",
    effects: [
      { type: "BLOCK", value: 7 },
      { type: "HEAL", value: 2 },
      { type: "APPLY_BUFF", value: 1, buff: "THORNS" },
    ],
    inkedVariant: {
      description: "Gain 10 block. Heal 4. Gain 2 Thorns.",
      effects: [
        { type: "BLOCK", value: 10 },
        { type: "HEAL", value: 4 },
        { type: "APPLY_BUFF", value: 2, buff: "THORNS" },
      ],
      inkMarkCost: 3,
    },
    upgrade: {
      description: "Gain 10 block. Heal 3. Gain 1 Thorns.",
      effects: [
        { type: "BLOCK", value: 10 },
        { type: "HEAL", value: 3 },
        { type: "APPLY_BUFF", value: 1, buff: "THORNS" },
      ],
    },
    isStarterCard: false,
    biome: "AFRICAN",
    characterId: "bibliothecaire",
  },
  {
    id: "healing_rhythm",
    name: "Keeper's Song",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "UNCOMMON",
    description: "Heal 5. Draw 1 card. Gain 1 ink. Gain 1 Strength.",
    effects: [
      { type: "HEAL", value: 5 },
      { type: "DRAW_CARDS", value: 1 },
      { type: "GAIN_INK", value: 1 },
      { type: "GAIN_STRENGTH", value: 1 },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Heal 7. Draw 1 card. Gain 1 ink. Gain 1 Strength.",
      effects: [
        { type: "HEAL", value: 7 },
        { type: "DRAW_CARDS", value: 1 },
        { type: "GAIN_INK", value: 1 },
        { type: "GAIN_STRENGTH", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "AFRICAN",
    characterId: "bibliothecaire",
  },
  {
    id: "oral_history",
    name: "Oral History",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "UNCOMMON",
    description:
      "Deal 5 damage to ALL enemies. Apply 2 Vulnerable to ALL. Draw 1 card.",
    effects: [
      { type: "DAMAGE", value: 5 },
      { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
      { type: "DRAW_CARDS", value: 1 },
    ],
    inkedVariant: null,
    upgrade: {
      description:
        "Deal 7 damage to ALL. Apply 2 Vulnerable to ALL. Draw 1 card.",
      effects: [
        { type: "DAMAGE", value: 7 },
        { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        { type: "DRAW_CARDS", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "AFRICAN",
    characterId: "bibliothecaire",
  },
  {
    id: "trickster_lore",
    name: "Trickster Lore",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description: "Gain 3 ink. Apply 3 Vulnerable to target.",
    effects: [
      { type: "GAIN_INK", value: 3 },
      { type: "APPLY_DEBUFF", value: 3, buff: "VULNERABLE", duration: 2 },
    ],
    inkedVariant: {
      description: "Gain 4 ink. Apply 4 Vulnerable to target.",
      effects: [
        { type: "GAIN_INK", value: 4 },
        { type: "APPLY_DEBUFF", value: 4, buff: "VULNERABLE", duration: 2 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Gain 3 ink. Apply 4 Vulnerable to target.",
      effects: [
        { type: "GAIN_INK", value: 3 },
        { type: "APPLY_DEBUFF", value: 4, buff: "VULNERABLE", duration: 2 },
      ],
    },
    isStarterCard: false,
    biome: "AFRICAN",
    characterId: "bibliothecaire",
  },
  {
    id: "ancestor_archive",
    name: "Ancestor Archive",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "UNCOMMON",
    description:
      "Draw 2 cards. Gain 1 energy. Apply 1 Vulnerable to ALL enemies. Exhaust.",
    effects: [
      { type: "DRAW_CARDS", value: 2 },
      { type: "GAIN_ENERGY", value: 1 },
      { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: {
      description:
        "Draw 3 cards. Gain 1 energy. Apply 2 Vulnerable to ALL enemies. Exhaust.",
      effects: [
        { type: "DRAW_CARDS", value: 3 },
        { type: "GAIN_ENERGY", value: 1 },
        { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        { type: "EXHAUST", value: 0 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description:
        "Draw 3 cards. Gain 1 energy. Apply 1 Vulnerable to ALL enemies. Exhaust.",
      effects: [
        { type: "DRAW_CARDS", value: 3 },
        { type: "GAIN_ENERGY", value: 1 },
        { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "AFRICAN",
    characterId: "bibliothecaire",
  },
  {
    id: "cosmic_spider",
    name: "Anansi Codex",
    type: "POWER",
    energyCost: 2,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "RARE",
    description:
      "Gain 2 Strength. Apply 3 Vulnerable to ALL enemies. Gain 2 ink. Exhaust.",
    effects: [
      { type: "GAIN_STRENGTH", value: 2 },
      { type: "APPLY_DEBUFF", value: 3, buff: "VULNERABLE", duration: 2 },
      { type: "GAIN_INK", value: 2 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: null,
    upgrade: {
      description:
        "Gain 2 Strength. Apply 4 Vulnerable to ALL enemies. Gain 2 ink. Exhaust.",
      effects: [
        { type: "GAIN_STRENGTH", value: 2 },
        { type: "APPLY_DEBUFF", value: 4, buff: "VULNERABLE", duration: 2 },
        { type: "GAIN_INK", value: 2 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "AFRICAN",
    characterId: "bibliothecaire",
  },

  // =========================================================
  // RUSSIAN — Bibliothécaire
  // =========================================================
  {
    id: "fur_binding",
    name: "Fur Binding",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "COMMON",
    description: "Gain 12 block. Discard 1 random card.",
    effects: [
      { type: "BLOCK", value: 12 },
      { type: "FORCE_DISCARD_RANDOM", value: 1 },
    ],
    inkedVariant: {
      description: "Gain 16 block. Discard 1 random card.",
      effects: [
        { type: "BLOCK", value: 16 },
        { type: "FORCE_DISCARD_RANDOM", value: 1 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Gain 15 block. Discard 1 random card.",
      effects: [
        { type: "BLOCK", value: 15 },
        { type: "FORCE_DISCARD_RANDOM", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "RUSSIAN",
    characterId: "bibliothecaire",
  },
  {
    id: "folk_curse",
    name: "Folk Curse",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "COMMON",
    description:
      "Apply 2 Weak to ALL enemies. Draw 2 cards. Discard 1 random card.",
    effects: [
      { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
      { type: "DRAW_CARDS", value: 2 },
      { type: "FORCE_DISCARD_RANDOM", value: 1 },
    ],
    inkedVariant: {
      description:
        "Apply 3 Weak to ALL enemies. Draw 3 cards. Discard 1 random card.",
      effects: [
        { type: "APPLY_DEBUFF", value: 3, buff: "WEAK", duration: 2 },
        { type: "DRAW_CARDS", value: 3 },
        { type: "FORCE_DISCARD_RANDOM", value: 1 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description:
        "Apply 2 Weak to ALL enemies. Draw 3 cards. Discard 1 random card.",
      effects: [
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        { type: "DRAW_CARDS", value: 3 },
        { type: "FORCE_DISCARD_RANDOM", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "RUSSIAN",
    characterId: "bibliothecaire",
  },
  {
    id: "matryoshka_lore",
    name: "Matryoshka Lore",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "UNCOMMON",
    description:
      "Draw 2 cards. Gain 1 ink. Discard 1 random card. If this card is randomly discarded, gain 1 energy and draw 1 card.",
    effects: [
      { type: "DRAW_CARDS", value: 2 },
      { type: "GAIN_INK", value: 1 },
      { type: "FORCE_DISCARD_RANDOM", value: 1 },
    ],
    onRandomDiscardEffects: [
      { type: "GAIN_ENERGY", value: 1 },
      { type: "DRAW_CARDS", value: 1 },
    ],
    inkedVariant: null,
    upgrade: {
      description:
        "Draw 3 cards. Gain 1 ink. Discard 1 random card. If this card is randomly discarded, gain 1 energy and draw 2 cards.",
      effects: [
        { type: "DRAW_CARDS", value: 3 },
        { type: "GAIN_INK", value: 1 },
        { type: "FORCE_DISCARD_RANDOM", value: 1 },
      ],
      onRandomDiscardEffects: [
        { type: "GAIN_ENERGY", value: 1 },
        { type: "DRAW_CARDS", value: 2 },
      ],
    },
    isStarterCard: false,
    biome: "RUSSIAN",
    characterId: "bibliothecaire",
  },
  {
    id: "snowstorm_trap",
    name: "Snowstorm Trap",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "UNCOMMON",
    description:
      "Deal 4 damage to ALL enemies. Apply 2 Vulnerable to ALL. Gain 1 Focus. Exhaust.",
    effects: [
      { type: "DAMAGE", value: 4 },
      { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
      { type: "GAIN_FOCUS", value: 1 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: {
      description:
        "Deal 6 damage to ALL. Apply 3 Vulnerable to ALL. Gain 2 Focus. Exhaust.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "APPLY_DEBUFF", value: 3, buff: "VULNERABLE", duration: 2 },
        { type: "GAIN_FOCUS", value: 2 },
        { type: "EXHAUST", value: 0 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description:
        "Deal 6 damage to ALL. Apply 2 Vulnerable to ALL. Gain 1 Focus. Exhaust.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        { type: "GAIN_FOCUS", value: 1 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "RUSSIAN",
    characterId: "bibliothecaire",
  },
  {
    id: "leshy_ward",
    name: "Leshy Ward",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "UNCOMMON",
    description: "Gain 8 block. Heal 3. Gain 2 block per Weak on enemies.",
    effects: [
      { type: "BLOCK", value: 8 },
      { type: "HEAL", value: 3 },
      { type: "BLOCK_PER_DEBUFF", value: 2, buff: "WEAK" },
    ],
    inkedVariant: {
      description: "Gain 10 block. Heal 5. Gain 3 block per Weak on enemies.",
      effects: [
        { type: "BLOCK", value: 10 },
        { type: "HEAL", value: 5 },
        { type: "BLOCK_PER_DEBUFF", value: 3, buff: "WEAK" },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Gain 10 block. Heal 3. Gain 2 block per Weak on enemies.",
      effects: [
        { type: "BLOCK", value: 10 },
        { type: "HEAL", value: 3 },
        { type: "BLOCK_PER_DEBUFF", value: 2, buff: "WEAK" },
      ],
    },
    isStarterCard: false,
    biome: "RUSSIAN",
    characterId: "bibliothecaire",
  },
  {
    id: "zhar_ptitsa",
    name: "Zhar-Ptitsa",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "UNCOMMON",
    description: "Gain 3 ink. Apply 2 Vulnerable to ALL enemies.",
    effects: [
      { type: "GAIN_INK", value: 3 },
      { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Gain 3 ink. Apply 3 Vulnerable to ALL enemies.",
      effects: [
        { type: "GAIN_INK", value: 3 },
        { type: "APPLY_DEBUFF", value: 3, buff: "VULNERABLE", duration: 2 },
      ],
    },
    isStarterCard: false,
    biome: "RUSSIAN",
    characterId: "bibliothecaire",
  },
  {
    id: "folklore_archive",
    name: "Folklore Archive",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "RARE",
    description: "Draw 2 cards. Gain 1 energy. Gain 2 Focus. Exhaust.",
    effects: [
      { type: "DRAW_CARDS", value: 2 },
      { type: "GAIN_ENERGY", value: 1 },
      { type: "GAIN_FOCUS", value: 2 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: {
      description: "Draw 3 cards. Gain 1 energy. Gain 3 Focus. Exhaust.",
      effects: [
        { type: "DRAW_CARDS", value: 3 },
        { type: "GAIN_ENERGY", value: 1 },
        { type: "GAIN_FOCUS", value: 3 },
        { type: "EXHAUST", value: 0 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Draw 3 cards. Gain 1 energy. Gain 2 Focus. Exhaust.",
      effects: [
        { type: "DRAW_CARDS", value: 3 },
        { type: "GAIN_ENERGY", value: 1 },
        { type: "GAIN_FOCUS", value: 2 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "RUSSIAN",
    characterId: "bibliothecaire",
  },
  {
    id: "frost_witch",
    name: "Frost Witch",
    type: "POWER",
    energyCost: 2,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "RARE",
    description:
      "Apply 2 Weak to ALL enemies. Gain 1 Thorns per Weak on enemies. Exhaust.",
    effects: [
      { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
      {
        type: "APPLY_BUFF_PER_DEBUFF",
        value: 1,
        buff: "THORNS",
        scalingBuff: "WEAK",
      },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: null,
    upgrade: {
      description:
        "Apply 3 Weak to ALL enemies. Gain 1 Thorns per Weak on enemies. Exhaust.",
      effects: [
        { type: "APPLY_DEBUFF", value: 3, buff: "WEAK", duration: 2 },
        {
          type: "APPLY_BUFF_PER_DEBUFF",
          value: 1,
          buff: "THORNS",
          scalingBuff: "WEAK",
        },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "RUSSIAN",
    characterId: "bibliothecaire",
  },

  // =========================================================
  // CELTIC — Bibliothécaire
  // =========================================================
  {
    id: "herb_lore",
    name: "Herb Lore",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description: "Heal 6. Apply 1 Weak to target. Draw 1 card.",
    effects: [
      { type: "HEAL", value: 6 },
      { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
      { type: "DRAW_CARDS", value: 1 },
    ],
    inkedVariant: {
      description: "Heal 9. Apply 2 Weak to target. Draw 2 cards.",
      effects: [
        { type: "HEAL", value: 9 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        { type: "DRAW_CARDS", value: 2 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Heal 8. Apply 2 Weak to target. Draw 1 card.",
      effects: [
        { type: "HEAL", value: 8 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        { type: "DRAW_CARDS", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "CELTIC",
    characterId: "bibliothecaire",
  },
  {
    id: "fairy_veil",
    name: "Fairy Veil",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "COMMON",
    description: "Gain 6 block. Gain 2 Thorns.",
    effects: [
      { type: "BLOCK", value: 6 },
      { type: "APPLY_BUFF", value: 2, buff: "THORNS" },
    ],
    inkedVariant: {
      description: "Gain 9 block. Gain 3 Thorns.",
      effects: [
        { type: "BLOCK", value: 9 },
        { type: "APPLY_BUFF", value: 3, buff: "THORNS" },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Gain 9 block. Gain 2 Thorns.",
      effects: [
        { type: "BLOCK", value: 9 },
        { type: "APPLY_BUFF", value: 2, buff: "THORNS" },
      ],
    },
    isStarterCard: false,
    biome: "CELTIC",
    characterId: "bibliothecaire",
  },
  {
    id: "morrigan_curse",
    name: "Morrigan Curse",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "UNCOMMON",
    description:
      "Deal 4 damage to ALL enemies. Apply 2 Vulnerable to ALL. Heal 3.",
    effects: [
      { type: "DAMAGE", value: 4 },
      { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
      { type: "HEAL", value: 3 },
    ],
    inkedVariant: {
      description: "Deal 6 damage to ALL. Apply 3 Vulnerable to ALL. Heal 5.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "APPLY_DEBUFF", value: 3, buff: "VULNERABLE", duration: 2 },
        { type: "HEAL", value: 5 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Deal 6 damage to ALL. Apply 2 Vulnerable to ALL. Heal 3.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        { type: "HEAL", value: 3 },
      ],
    },
    isStarterCard: false,
    biome: "CELTIC",
    characterId: "bibliothecaire",
  },
  {
    id: "cauldron_lore",
    name: "Cauldron Lore",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description: "Heal 3. Gain 1 ink. Apply 2 Poison to target. Draw 1 card.",
    effects: [
      { type: "HEAL", value: 3 },
      { type: "GAIN_INK", value: 1 },
      { type: "APPLY_DEBUFF", value: 2, buff: "POISON" },
      { type: "DRAW_CARDS", value: 1 },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Heal 4. Gain 1 ink. Apply 3 Poison to target. Draw 1 card.",
      effects: [
        { type: "HEAL", value: 4 },
        { type: "GAIN_INK", value: 1 },
        { type: "APPLY_DEBUFF", value: 3, buff: "POISON" },
        { type: "DRAW_CARDS", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "CELTIC",
    characterId: "bibliothecaire",
  },
  {
    id: "selkie_song",
    name: "Selkie Song",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "UNCOMMON",
    description: "Heal 4. Draw 2 cards. Gain 2 Thorns.",
    effects: [
      { type: "HEAL", value: 4 },
      { type: "DRAW_CARDS", value: 2 },
      { type: "APPLY_BUFF", value: 2, buff: "THORNS" },
    ],
    inkedVariant: {
      description: "Heal 6. Draw 3 cards. Gain 3 Thorns.",
      effects: [
        { type: "HEAL", value: 6 },
        { type: "DRAW_CARDS", value: 3 },
        { type: "APPLY_BUFF", value: 3, buff: "THORNS" },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Heal 6. Draw 2 cards. Gain 2 Thorns.",
      effects: [
        { type: "HEAL", value: 6 },
        { type: "DRAW_CARDS", value: 2 },
        { type: "APPLY_BUFF", value: 2, buff: "THORNS" },
      ],
    },
    isStarterCard: false,
    biome: "CELTIC",
    characterId: "bibliothecaire",
  },
  {
    id: "ancient_manuscript",
    name: "Ancient Manuscript",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "UNCOMMON",
    description:
      "Deal 4 damage to ALL enemies. Apply 2 Vulnerable to ALL. Gain 1 ink.",
    effects: [
      { type: "DAMAGE", value: 4 },
      { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
      { type: "GAIN_INK", value: 1 },
    ],
    inkedVariant: null,
    upgrade: {
      description:
        "Deal 6 damage to ALL. Apply 2 Vulnerable to ALL. Gain 1 ink.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        { type: "GAIN_INK", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "CELTIC",
    characterId: "bibliothecaire",
  },
  {
    id: "world_tree",
    name: "World Tree",
    type: "POWER",
    energyCost: 2,
    inkCost: 0,
    targeting: "SELF",
    rarity: "RARE",
    description: "Gain 2 Strength. Heal 6. Gain 2 ink. Exhaust.",
    effects: [
      { type: "GAIN_STRENGTH", value: 2 },
      { type: "HEAL", value: 6 },
      { type: "GAIN_INK", value: 2 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Gain 3 Strength. Heal 6. Gain 2 ink. Exhaust.",
      effects: [
        { type: "GAIN_STRENGTH", value: 3 },
        { type: "HEAL", value: 6 },
        { type: "GAIN_INK", value: 2 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "CELTIC",
    characterId: "bibliothecaire",
  },

  // =========================================================
  // AZTEC — Bibliothécaire
  // =========================================================
  {
    id: "calendric_ward",
    name: "Calendric Ward",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "COMMON",
    description:
      "Gain 6 block. Draw 1 card. Gain 2 block per Vulnerable on enemies.",
    effects: [
      { type: "BLOCK", value: 6 },
      { type: "DRAW_CARDS", value: 1 },
      { type: "BLOCK_PER_DEBUFF", value: 2, buff: "VULNERABLE" },
    ],
    inkedVariant: {
      description:
        "Gain 8 block. Draw 2 cards. Gain 3 block per Vulnerable on enemies.",
      effects: [
        { type: "BLOCK", value: 8 },
        { type: "DRAW_CARDS", value: 2 },
        { type: "BLOCK_PER_DEBUFF", value: 3, buff: "VULNERABLE" },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description:
        "Gain 8 block. Draw 1 card. Gain 2 block per Vulnerable on enemies.",
      effects: [
        { type: "BLOCK", value: 8 },
        { type: "DRAW_CARDS", value: 1 },
        { type: "BLOCK_PER_DEBUFF", value: 2, buff: "VULNERABLE" },
      ],
    },
    isStarterCard: false,
    biome: "AZTEC",
    characterId: "bibliothecaire",
  },
  {
    id: "poison_herb",
    name: "Sacred Herb",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description: "Apply 3 Poison to target.",
    effects: [{ type: "APPLY_DEBUFF", value: 3, buff: "POISON" }],
    inkedVariant: {
      description: "Apply 5 Poison to target.",
      effects: [{ type: "APPLY_DEBUFF", value: 5, buff: "POISON" }],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Apply 4 Poison to target.",
      effects: [{ type: "APPLY_DEBUFF", value: 4, buff: "POISON" }],
    },
    isStarterCard: false,
    biome: "AZTEC",
    characterId: "bibliothecaire",
  },
  {
    id: "star_chart",
    name: "Star Chart",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "UNCOMMON",
    description: "Gain 2 ink. Apply 2 Weak to ALL enemies.",
    effects: [
      { type: "GAIN_INK", value: 2 },
      { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Gain 2 ink. Apply 3 Weak to ALL enemies.",
      effects: [
        { type: "GAIN_INK", value: 2 },
        { type: "APPLY_DEBUFF", value: 3, buff: "WEAK", duration: 2 },
      ],
    },
    isStarterCard: false,
    biome: "AZTEC",
    characterId: "bibliothecaire",
  },
  {
    id: "quetzal_shield",
    name: "Quetzal Shield",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "UNCOMMON",
    description: "Gain 7 block. Gain 2 ink. Apply 2 Weak to ALL enemies.",
    effects: [
      { type: "BLOCK", value: 7 },
      { type: "GAIN_INK", value: 2 },
      { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
    ],
    inkedVariant: {
      description: "Gain 10 block. Gain 3 ink. Apply 3 Weak to ALL enemies.",
      effects: [
        { type: "BLOCK", value: 10 },
        { type: "GAIN_INK", value: 3 },
        { type: "APPLY_DEBUFF", value: 3, buff: "WEAK", duration: 2 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Gain 10 block. Gain 2 ink. Apply 2 Weak to ALL enemies.",
      effects: [
        { type: "BLOCK", value: 10 },
        { type: "GAIN_INK", value: 2 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
      ],
    },
    isStarterCard: false,
    biome: "AZTEC",
    characterId: "bibliothecaire",
  },
  {
    id: "temple_archive",
    name: "Temple Archive",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "UNCOMMON",
    description: "Draw 2 cards. Heal 4. Upgrade 1 random card in hand.",
    effects: [
      { type: "DRAW_CARDS", value: 2 },
      { type: "HEAL", value: 4 },
      { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 1 },
    ],
    inkedVariant: {
      description: "Draw 3 cards. Heal 5. Upgrade 1 random card in hand.",
      effects: [
        { type: "DRAW_CARDS", value: 3 },
        { type: "HEAL", value: 5 },
        { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 1 },
      ],
      inkMarkCost: 2,
      upgradedDescription:
        "Draw 3 cards. Heal 6. Upgrade 1 random card in hand.",
      upgradedEffects: [
        { type: "DRAW_CARDS", value: 3 },
        { type: "HEAL", value: 6 },
        { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 1 },
      ],
    },
    upgrade: {
      description: "Draw 3 cards. Heal 4. Upgrade 1 random card in hand.",
      effects: [
        { type: "DRAW_CARDS", value: 3 },
        { type: "HEAL", value: 4 },
        { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "AZTEC",
    characterId: "bibliothecaire",
  },
  {
    id: "obsidian_ward",
    name: "Obsidian Curse",
    type: "ATTACK",
    energyCost: 2,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "RARE",
    description:
      "Deal 10 damage to ALL enemies. Apply 2 Poison to ALL enemies.",
    effects: [
      { type: "DAMAGE", value: 10 },
      { type: "APPLY_DEBUFF", value: 2, buff: "POISON" },
    ],
    inkedVariant: {
      description:
        "Deal 14 damage to ALL enemies. Apply 3 Poison to ALL enemies.",
      effects: [
        { type: "DAMAGE", value: 14 },
        { type: "APPLY_DEBUFF", value: 3, buff: "POISON" },
      ],
      inkMarkCost: 3,
    },
    upgrade: {
      description:
        "Deal 14 damage to ALL enemies. Apply 2 Poison to ALL enemies.",
      effects: [
        { type: "DAMAGE", value: 14 },
        { type: "APPLY_DEBUFF", value: 2, buff: "POISON" },
      ],
    },
    isStarterCard: false,
    biome: "AZTEC",
    characterId: "bibliothecaire",
  },
  {
    id: "feathered_serpent",
    name: "Feathered Serpent",
    type: "POWER",
    energyCost: 2,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "RARE",
    description: "Apply 2 Vulnerable to ALL enemies. Gain 3 ink. Exhaust.",
    effects: [
      { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
      { type: "GAIN_INK", value: 3 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Apply 3 Vulnerable to ALL enemies. Gain 3 ink. Exhaust.",
      effects: [
        { type: "APPLY_DEBUFF", value: 3, buff: "VULNERABLE", duration: 2 },
        { type: "GAIN_INK", value: 3 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "AZTEC",
    characterId: "bibliothecaire",
  },

  // =========================================================
  // LOVECRAFTIAN — Bibliothécaire
  // =========================================================
  {
    id: "sealed_tome",
    name: "Sealed Tome",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "COMMON",
    description:
      "Gain 7 block. Gain 1 Focus. Add 1 Dazed to your discard pile. Exhaust.",
    effects: [
      { type: "BLOCK", value: 7 },
      { type: "GAIN_FOCUS", value: 1 },
      { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: {
      description:
        "Gain 10 block. Gain 2 Focus. Add 1 Dazed to your discard pile. Exhaust.",
      effects: [
        { type: "BLOCK", value: 10 },
        { type: "GAIN_FOCUS", value: 2 },
        { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
        { type: "EXHAUST", value: 0 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description:
        "Gain 10 block. Gain 1 Focus. Add 1 Dazed to your discard pile. Exhaust.",
      effects: [
        { type: "BLOCK", value: 10 },
        { type: "GAIN_FOCUS", value: 1 },
        { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "LOVECRAFTIAN",
    characterId: "bibliothecaire",
  },
  {
    id: "library_horror",
    name: "Library Horror",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "COMMON",
    description:
      "Deal 4 damage to ALL enemies. Apply 2 Weak to ALL. Add 1 Dazed to your discard pile.",
    effects: [
      { type: "DAMAGE", value: 4 },
      { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
      { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
    ],
    inkedVariant: {
      description:
        "Deal 6 damage to ALL. Apply 2 Weak to ALL. Add 1 Dazed to your discard pile.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description:
        "Deal 6 damage to ALL. Apply 2 Weak to ALL. Add 1 Dazed to your discard pile.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
      ],
    },
    isStarterCard: false,
    biome: "LOVECRAFTIAN",
    characterId: "bibliothecaire",
  },
  {
    id: "readers_pact",
    name: "Reader's Pact",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "UNCOMMON",
    description: "Gain 3 ink. Gain 1 energy. Exhaust.",
    effects: [
      { type: "GAIN_INK", value: 3 },
      { type: "GAIN_ENERGY", value: 1 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: {
      description: "Gain 4 ink. Gain 2 energy. Exhaust.",
      effects: [
        { type: "GAIN_INK", value: 4 },
        { type: "GAIN_ENERGY", value: 2 },
        { type: "EXHAUST", value: 0 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Gain 4 ink. Gain 1 energy. Exhaust.",
      effects: [
        { type: "GAIN_INK", value: 4 },
        { type: "GAIN_ENERGY", value: 1 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "LOVECRAFTIAN",
    characterId: "bibliothecaire",
  },
  {
    id: "forbidden_index",
    name: "Forbidden Index",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "UNCOMMON",
    description:
      "Draw 2 cards. Apply 1 Vulnerable to ALL enemies. Add 1 Dazed to your discard pile.",
    effects: [
      { type: "DRAW_CARDS", value: 2 },
      { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
      { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
    ],
    inkedVariant: null,
    upgrade: {
      description:
        "Draw 2 cards. Apply 2 Vulnerable to ALL enemies. Add 1 Dazed to your discard pile.",
      effects: [
        { type: "DRAW_CARDS", value: 2 },
        { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
      ],
    },
    isStarterCard: false,
    biome: "LOVECRAFTIAN",
    characterId: "bibliothecaire",
  },
  {
    id: "void_librarian",
    name: "Void Librarian",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description:
      "Gain 2 ink. Apply 2 Vulnerable to target. Gain 1 Focus. Add 1 Dazed to your discard pile. Exhaust.",
    effects: [
      { type: "GAIN_INK", value: 2 },
      { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
      { type: "GAIN_FOCUS", value: 1 },
      { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: null,
    upgrade: {
      description:
        "Gain 2 ink. Apply 3 Vulnerable to target. Gain 1 Focus. Add 1 Dazed to your discard pile. Exhaust.",
      effects: [
        { type: "GAIN_INK", value: 2 },
        { type: "APPLY_DEBUFF", value: 3, buff: "VULNERABLE", duration: 2 },
        { type: "GAIN_FOCUS", value: 1 },
        { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "LOVECRAFTIAN",
    characterId: "bibliothecaire",
  },
  {
    id: "necronomicon_page",
    name: "Necronomicon Page",
    type: "ATTACK",
    energyCost: 2,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "RARE",
    description:
      "Deal 12 damage to ALL enemies. Apply 3 Vulnerable to ALL enemies.",
    effects: [
      { type: "DAMAGE", value: 12 },
      { type: "APPLY_DEBUFF", value: 3, buff: "VULNERABLE", duration: 2 },
    ],
    inkedVariant: {
      description:
        "Deal 16 damage to ALL enemies. Apply 4 Vulnerable to ALL enemies.",
      effects: [
        { type: "DAMAGE", value: 16 },
        { type: "APPLY_DEBUFF", value: 4, buff: "VULNERABLE", duration: 2 },
      ],
      inkMarkCost: 3,
    },
    upgrade: {
      description:
        "Deal 16 damage to ALL enemies. Apply 3 Vulnerable to ALL enemies.",
      effects: [
        { type: "DAMAGE", value: 16 },
        { type: "APPLY_DEBUFF", value: 3, buff: "VULNERABLE", duration: 2 },
      ],
    },
    isStarterCard: false,
    biome: "LOVECRAFTIAN",
    characterId: "bibliothecaire",
  },
  {
    id: "cosmic_archive",
    name: "Cosmic Archive",
    type: "POWER",
    energyCost: 2,
    inkCost: 0,
    targeting: "SELF",
    rarity: "RARE",
    description:
      "Gain 6 block. Gain 3 block per card in your Exhaust pile. Gain 1 Focus. Add 1 Dazed to your discard. Exhaust.",
    effects: [
      { type: "BLOCK", value: 6 },
      { type: "BLOCK_PER_EXHAUSTED_CARD", value: 3 },
      { type: "GAIN_FOCUS", value: 1 },
      { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: null,
    upgrade: {
      description:
        "Gain 8 block. Gain 4 block per card in your Exhaust pile. Gain 1 Focus. Add 1 Dazed to your discard. Exhaust.",
      effects: [
        { type: "BLOCK", value: 8 },
        { type: "BLOCK_PER_EXHAUSTED_CARD", value: 4 },
        { type: "GAIN_FOCUS", value: 1 },
        { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "LOVECRAFTIAN",
    characterId: "bibliothecaire",
  },

  // =========================================================
  // EGYPTIAN — Bibliothécaire
  // =========================================================
  {
    id: "death_scroll",
    name: "Death Scroll",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description:
      "Deal 3 damage. Apply 2 Poison. Deal 1 damage per Poison on target.",
    effects: [
      { type: "DAMAGE", value: 3 },
      { type: "APPLY_DEBUFF", value: 2, buff: "POISON" },
      { type: "DAMAGE_PER_DEBUFF", value: 1, buff: "POISON" },
    ],
    inkedVariant: {
      description:
        "Deal 5 damage. Apply 3 Poison. Deal 2 damage per Poison on target.",
      effects: [
        { type: "DAMAGE", value: 5 },
        { type: "APPLY_DEBUFF", value: 3, buff: "POISON" },
        { type: "DAMAGE_PER_DEBUFF", value: 2, buff: "POISON" },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description:
        "Deal 5 damage. Apply 2 Poison. Deal 2 damage per Poison on target.",
      effects: [
        { type: "DAMAGE", value: 5 },
        { type: "APPLY_DEBUFF", value: 2, buff: "POISON" },
        { type: "DAMAGE_PER_DEBUFF", value: 2, buff: "POISON" },
      ],
    },
    isStarterCard: false,
    biome: "EGYPTIAN",
    characterId: "bibliothecaire",
  },
  {
    id: "mummy_ward",
    name: "Mummy Ward",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "COMMON",
    description:
      "Apply 2 Weak to ALL enemies. Apply 1 Vulnerable to ALL enemies.",
    effects: [
      { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
      { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
    ],
    inkedVariant: {
      description:
        "Apply 2 Weak to ALL enemies. Apply 2 Vulnerable to ALL enemies.",
      effects: [
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description:
        "Apply 3 Weak to ALL enemies. Apply 1 Vulnerable to ALL enemies.",
      effects: [
        { type: "APPLY_DEBUFF", value: 3, buff: "WEAK", duration: 2 },
        { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
      ],
    },
    isStarterCard: false,
    biome: "EGYPTIAN",
    characterId: "bibliothecaire",
  },
  {
    id: "plague_of_words",
    name: "Plague of Words",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "UNCOMMON",
    description: "Deal 4 damage to ALL enemies. Apply 3 Poison to ALL enemies.",
    effects: [
      { type: "DAMAGE", value: 4 },
      { type: "APPLY_DEBUFF", value: 3, buff: "POISON" },
    ],
    inkedVariant: {
      description:
        "Deal 6 damage to ALL enemies. Apply 4 Poison to ALL enemies.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "APPLY_DEBUFF", value: 4, buff: "POISON" },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description:
        "Deal 6 damage to ALL enemies. Apply 3 Poison to ALL enemies.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "APPLY_DEBUFF", value: 3, buff: "POISON" },
      ],
    },
    isStarterCard: false,
    biome: "EGYPTIAN",
    characterId: "bibliothecaire",
  },
  {
    id: "osiris_archive",
    name: "Osiris Archive",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "COMMON",
    description: "Draw 2 cards. Heal 3. Gain 1 ink. Exhaust.",
    effects: [
      { type: "DRAW_CARDS", value: 2 },
      { type: "HEAL", value: 3 },
      { type: "GAIN_INK", value: 1 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Draw 3 cards. Heal 3. Gain 1 ink. Exhaust.",
      effects: [
        { type: "DRAW_CARDS", value: 3 },
        { type: "HEAL", value: 3 },
        { type: "GAIN_INK", value: 1 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "EGYPTIAN",
    characterId: "bibliothecaire",
  },
  {
    id: "funerary_rite",
    name: "Funerary Rite",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description: "Heal 5. Apply 2 Vulnerable to target. Draw 1 card.",
    effects: [
      { type: "HEAL", value: 5 },
      { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
      { type: "DRAW_CARDS", value: 1 },
    ],
    inkedVariant: null,
    upgrade: {
      description: "Heal 7. Apply 3 Vulnerable to target. Draw 1 card.",
      effects: [
        { type: "HEAL", value: 7 },
        { type: "APPLY_DEBUFF", value: 3, buff: "VULNERABLE", duration: 2 },
        { type: "DRAW_CARDS", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "EGYPTIAN",
    characterId: "bibliothecaire",
  },
  {
    id: "desert_wisdom",
    name: "Desert Papyrus",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "UNCOMMON",
    description:
      "Gain 7 block. Heal 3. Gain 2 block per Vulnerable on enemies.",
    effects: [
      { type: "BLOCK", value: 7 },
      { type: "HEAL", value: 3 },
      { type: "BLOCK_PER_DEBUFF", value: 2, buff: "VULNERABLE" },
    ],
    inkedVariant: {
      description:
        "Gain 9 block. Heal 5. Gain 3 block per Vulnerable on enemies.",
      effects: [
        { type: "BLOCK", value: 9 },
        { type: "HEAL", value: 5 },
        { type: "BLOCK_PER_DEBUFF", value: 3, buff: "VULNERABLE" },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description:
        "Gain 9 block. Heal 3. Gain 2 block per Vulnerable on enemies.",
      effects: [
        { type: "BLOCK", value: 9 },
        { type: "HEAL", value: 3 },
        { type: "BLOCK_PER_DEBUFF", value: 2, buff: "VULNERABLE" },
      ],
    },
    isStarterCard: false,
    biome: "EGYPTIAN",
    characterId: "bibliothecaire",
  },
  {
    id: "embalmed_tome",
    name: "Embalmed Tome",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "RARE",
    description:
      "Gain 4 ink. Draw 2 cards. Apply 1 Weak to ALL enemies. Exhaust.",
    effects: [
      { type: "GAIN_INK", value: 4 },
      { type: "DRAW_CARDS", value: 2 },
      { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: {
      description:
        "Gain 5 ink. Draw 3 cards. Apply 2 Weak to ALL enemies. Exhaust.",
      effects: [
        { type: "GAIN_INK", value: 5 },
        { type: "DRAW_CARDS", value: 3 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        { type: "EXHAUST", value: 0 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description:
        "Gain 4 ink. Draw 3 cards. Apply 1 Weak to ALL enemies. Exhaust.",
      effects: [
        { type: "GAIN_INK", value: 4 },
        { type: "DRAW_CARDS", value: 3 },
        { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "EGYPTIAN",
    characterId: "bibliothecaire",
  },
  {
    id: "book_of_the_dead",
    name: "Book of the Dead",
    type: "SKILL",
    energyCost: 0,
    inkCost: 2,
    targeting: "ALL_ENEMIES",
    rarity: "RARE",
    description:
      "Draw 1 card. Gain 2 Strength. Apply 2 Vulnerable to ALL enemies. Exhaust.",
    effects: [
      { type: "DRAW_CARDS", value: 1 },
      { type: "GAIN_STRENGTH", value: 2 },
      { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: null,
    upgrade: {
      description:
        "Draw 2 cards. Gain 2 Strength. Apply 3 Vulnerable to ALL enemies. Exhaust.",
      effects: [
        { type: "DRAW_CARDS", value: 2 },
        { type: "GAIN_STRENGTH", value: 2 },
        { type: "APPLY_DEBUFF", value: 3, buff: "VULNERABLE", duration: 2 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "EGYPTIAN",
    characterId: "bibliothecaire",
  },

  // =========================================================
  // GREEK — Bibliothécaire
  // =========================================================
  {
    id: "oracle_scroll",
    name: "Oracle Scroll",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description: "Draw 2 cards. Apply 1 Weak to target.",
    effects: [
      { type: "DRAW_CARDS", value: 2 },
      { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
    ],
    inkedVariant: {
      description: "Draw 3 cards. Apply 2 Weak to target.",
      effects: [
        { type: "DRAW_CARDS", value: 3 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Draw 2 cards. Apply 2 Weak to target.",
      effects: [
        { type: "DRAW_CARDS", value: 2 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
      ],
    },
    isStarterCard: false,
    biome: "GREEK",
    characterId: "bibliothecaire",
  },
  {
    id: "shield_of_athena",
    name: "Shield of Athena",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "COMMON",
    description: "Gain 5 block. Gain 2 block per Vulnerable on enemies.",
    effects: [
      { type: "BLOCK", value: 5 },
      { type: "BLOCK_PER_DEBUFF", value: 2, buff: "VULNERABLE" },
    ],
    inkedVariant: {
      description: "Gain 7 block. Gain 3 block per Vulnerable on enemies.",
      effects: [
        { type: "BLOCK", value: 7 },
        { type: "BLOCK_PER_DEBUFF", value: 3, buff: "VULNERABLE" },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Gain 7 block. Gain 2 block per Vulnerable on enemies.",
      effects: [
        { type: "BLOCK", value: 7 },
        { type: "BLOCK_PER_DEBUFF", value: 2, buff: "VULNERABLE" },
      ],
    },
    isStarterCard: false,
    biome: "GREEK",
    characterId: "bibliothecaire",
  },
  {
    id: "sphinx_riddle",
    name: "Sphinx Riddle",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "UNCOMMON",
    description:
      "Apply 2 Vulnerable to ALL enemies. Draw 1 card. Gain 1 Focus.",
    effects: [
      { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
      { type: "DRAW_CARDS", value: 1 },
      { type: "GAIN_FOCUS", value: 1 },
    ],
    inkedVariant: null,
    upgrade: {
      description:
        "Apply 3 Vulnerable to ALL enemies. Draw 1 card. Gain 1 Focus.",
      effects: [
        { type: "APPLY_DEBUFF", value: 3, buff: "VULNERABLE", duration: 2 },
        { type: "DRAW_CARDS", value: 1 },
        { type: "GAIN_FOCUS", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "GREEK",
    characterId: "bibliothecaire",
  },
  {
    id: "apollos_archive",
    name: "Apollo's Archive",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description: "Deal 6 damage. Gain 1 energy. Gain 1 ink.",
    effects: [
      { type: "DAMAGE", value: 6 },
      { type: "GAIN_ENERGY", value: 1 },
      { type: "GAIN_INK", value: 1 },
    ],
    inkedVariant: {
      description: "Deal 8 damage. Gain 1 energy. Gain 2 ink.",
      effects: [
        { type: "DAMAGE", value: 8 },
        { type: "GAIN_ENERGY", value: 1 },
        { type: "GAIN_INK", value: 2 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Deal 8 damage. Gain 1 energy. Gain 1 ink.",
      effects: [
        { type: "DAMAGE", value: 8 },
        { type: "GAIN_ENERGY", value: 1 },
        { type: "GAIN_INK", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "GREEK",
    characterId: "bibliothecaire",
  },
  {
    id: "labyrinth_trap",
    name: "Labyrinth Trap",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "UNCOMMON",
    description:
      "Deal 4 damage to ALL enemies. Apply 2 Weak to ALL. Gain 5 Block.",
    effects: [
      { type: "DAMAGE", value: 4 },
      { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
      { type: "BLOCK", value: 5 },
    ],
    inkedVariant: {
      description: "Deal 6 damage to ALL. Apply 2 Weak to ALL. Gain 8 Block.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        { type: "BLOCK", value: 8 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Deal 6 damage to ALL. Apply 2 Weak to ALL. Gain 5 Block.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        { type: "BLOCK", value: 5 },
      ],
    },
    isStarterCard: false,
    biome: "GREEK",
    characterId: "bibliothecaire",
  },
  {
    id: "pythian_codex",
    name: "Pythian Codex",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "RARE",
    description:
      "Deal 4 damage per current Ink to target. Upgrade 1 random card in hand. Drain all Ink. Exhaust.",
    effects: [
      { type: "DAMAGE_PER_CURRENT_INK", value: 4 },
      { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 1 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: null,
    upgrade: {
      description:
        "Deal 5 damage per current Ink to target. Upgrade 1 random card in hand. Drain all Ink. Exhaust.",
      effects: [
        { type: "DAMAGE_PER_CURRENT_INK", value: 5 },
        { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 1 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "GREEK",
    characterId: "bibliothecaire",
  },
  {
    id: "fates_decree",
    name: "Fate's Decree",
    type: "ATTACK",
    energyCost: 2,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "RARE",
    description:
      "Deal 3 damage to ALL enemies. Deal 3 damage per Vulnerable on enemies. Exhaust.",
    effects: [
      { type: "DAMAGE", value: 3 },
      { type: "DAMAGE_PER_DEBUFF", value: 3, buff: "VULNERABLE" },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: null,
    upgrade: {
      description:
        "Deal 5 damage to ALL enemies. Deal 3 damage per Vulnerable on enemies. Exhaust.",
      effects: [
        { type: "DAMAGE", value: 5 },
        { type: "DAMAGE_PER_DEBUFF", value: 3, buff: "VULNERABLE" },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "GREEK",
    characterId: "bibliothecaire",
  },

  // =========================================================
  // VIKING — Bibliothécaire
  // =========================================================
  {
    id: "nordic_treatise",
    name: "Nordic Treatise",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "COMMON",
    description: "Gain 5 block. Draw 1 card. Gain 1 Focus. Exhaust.",
    effects: [
      { type: "BLOCK", value: 5 },
      { type: "DRAW_CARDS", value: 1 },
      { type: "GAIN_FOCUS", value: 1 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: {
      description: "Gain 7 block. Draw 2 cards. Gain 1 Focus. Exhaust.",
      effects: [
        { type: "BLOCK", value: 7 },
        { type: "DRAW_CARDS", value: 2 },
        { type: "GAIN_FOCUS", value: 1 },
        { type: "EXHAUST", value: 0 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Gain 8 block. Draw 1 card. Gain 1 Focus. Exhaust.",
      effects: [
        { type: "BLOCK", value: 8 },
        { type: "DRAW_CARDS", value: 1 },
        { type: "GAIN_FOCUS", value: 1 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "VIKING",
    characterId: "bibliothecaire",
  },
  {
    id: "rune_curse",
    name: "Rune Curse",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "UNCOMMON",
    description: "Apply 2 Weak to ALL enemies. Apply 2 Poison to ALL enemies.",
    effects: [
      { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
      { type: "APPLY_DEBUFF", value: 2, buff: "POISON" },
    ],
    inkedVariant: {
      description:
        "Apply 3 Weak to ALL enemies. Apply 3 Poison to ALL enemies.",
      effects: [
        { type: "APPLY_DEBUFF", value: 3, buff: "WEAK", duration: 2 },
        { type: "APPLY_DEBUFF", value: 3, buff: "POISON" },
      ],
      inkMarkCost: 2,
      upgradedDescription:
        "Apply 3 Weak to ALL enemies. Apply 4 Poison to ALL enemies.",
      upgradedEffects: [
        { type: "APPLY_DEBUFF", value: 3, buff: "WEAK", duration: 2 },
        { type: "APPLY_DEBUFF", value: 4, buff: "POISON" },
      ],
    },
    upgrade: {
      description:
        "Apply 2 Weak to ALL enemies. Apply 3 Poison to ALL enemies.",
      effects: [
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        { type: "APPLY_DEBUFF", value: 3, buff: "POISON" },
      ],
    },
    isStarterCard: false,
    biome: "VIKING",
    characterId: "bibliothecaire",
  },
  {
    id: "saga_archive",
    name: "Saga Archive",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SELF",
    rarity: "UNCOMMON",
    description: "Draw 2 cards. Gain 1 energy. Gain 1 Strength. Exhaust.",
    effects: [
      { type: "DRAW_CARDS", value: 2 },
      { type: "GAIN_ENERGY", value: 1 },
      { type: "GAIN_STRENGTH", value: 1 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: {
      description: "Draw 3 cards. Gain 2 energy. Gain 1 Strength. Exhaust.",
      effects: [
        { type: "DRAW_CARDS", value: 3 },
        { type: "GAIN_ENERGY", value: 2 },
        { type: "GAIN_STRENGTH", value: 1 },
        { type: "EXHAUST", value: 0 },
      ],
      inkMarkCost: 2,
    },
    upgrade: {
      description: "Draw 3 cards. Gain 1 energy. Gain 1 Strength. Exhaust.",
      effects: [
        { type: "DRAW_CARDS", value: 3 },
        { type: "GAIN_ENERGY", value: 1 },
        { type: "GAIN_STRENGTH", value: 1 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "VIKING",
    characterId: "bibliothecaire",
  },
  {
    id: "norn_prophecy",
    name: "Norn Prophecy",
    type: "SKILL",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description:
      "Gain 2 ink. Apply 2 Vulnerable to target. Draw 1 card. Gain 1 Focus.",
    effects: [
      { type: "GAIN_INK", value: 2 },
      { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
      { type: "DRAW_CARDS", value: 1 },
      { type: "GAIN_FOCUS", value: 1 },
    ],
    inkedVariant: null,
    upgrade: {
      description:
        "Gain 2 ink. Apply 3 Vulnerable to target. Draw 1 card. Gain 1 Focus.",
      effects: [
        { type: "GAIN_INK", value: 2 },
        { type: "APPLY_DEBUFF", value: 3, buff: "VULNERABLE", duration: 2 },
        { type: "DRAW_CARDS", value: 1 },
        { type: "GAIN_FOCUS", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "VIKING",
    characterId: "bibliothecaire",
  },
  {
    id: "ancient_ward",
    name: "Ancient Ward",
    type: "SKILL",
    energyCost: 2,
    inkCost: 0,
    targeting: "SELF",
    rarity: "UNCOMMON",
    description: "Gain 14 block. Draw 1 card.",
    effects: [
      { type: "BLOCK", value: 14 },
      { type: "DRAW_CARDS", value: 1 },
    ],
    inkedVariant: {
      description: "Gain 18 block. Draw 2 cards.",
      effects: [
        { type: "BLOCK", value: 18 },
        { type: "DRAW_CARDS", value: 2 },
      ],
      inkMarkCost: 3,
    },
    upgrade: {
      description: "Gain 18 block. Draw 1 card.",
      effects: [
        { type: "BLOCK", value: 18 },
        { type: "DRAW_CARDS", value: 1 },
      ],
    },
    isStarterCard: false,
    biome: "VIKING",
    characterId: "bibliothecaire",
  },
  {
    id: "saga_keeper",
    name: "Saga Keeper",
    type: "POWER",
    energyCost: 2,
    inkCost: 0,
    targeting: "SELF",
    rarity: "RARE",
    description:
      "Gain 1 Focus. Gain 1 Strength per card in your Exhaust pile. Draw 1 card. Exhaust.",
    effects: [
      { type: "GAIN_FOCUS", value: 1 },
      { type: "APPLY_BUFF_PER_EXHAUSTED_CARD", value: 1, buff: "STRENGTH" },
      { type: "DRAW_CARDS", value: 1 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: null,
    upgrade: {
      description:
        "Gain 1 Focus. Gain 1 Strength per card in your Exhaust pile. Draw 2 cards. Exhaust.",
      effects: [
        { type: "GAIN_FOCUS", value: 1 },
        { type: "APPLY_BUFF_PER_EXHAUSTED_CARD", value: 1, buff: "STRENGTH" },
        { type: "DRAW_CARDS", value: 2 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "VIKING",
    characterId: "bibliothecaire",
  },
  {
    id: "valhalla_codex",
    name: "Valhalla Codex",
    type: "POWER",
    energyCost: 2,
    inkCost: 0,
    targeting: "ALL_ENEMIES",
    rarity: "RARE",
    description:
      "Gain 2 Strength. Apply 2 Weak to ALL enemies. Gain 2 ink. Exhaust.",
    effects: [
      { type: "GAIN_STRENGTH", value: 2 },
      { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
      { type: "GAIN_INK", value: 2 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: null,
    upgrade: {
      description:
        "Gain 2 Strength. Apply 3 Weak to ALL enemies. Gain 2 ink. Exhaust.",
      effects: [
        { type: "GAIN_STRENGTH", value: 2 },
        { type: "APPLY_DEBUFF", value: 3, buff: "WEAK", duration: 2 },
        { type: "GAIN_INK", value: 2 },
        { type: "EXHAUST", value: 0 },
      ],
    },
    isStarterCard: false,
    biome: "VIKING",
    characterId: "bibliothecaire",
  },
  {
    id: "eagle_knight_sun_dive",
    name: "Sun Dive",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description:
      "Deal 8 damage. Add Solar Ascent to your discard pile. Exhaust.",
    effects: [
      { type: "DAMAGE", value: 8 },
      {
        type: "ADD_CARD_TO_DISCARD",
        value: 1,
        cardId: "eagle_knight_solar_ascent",
      },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: null,
    upgrade: null,
    isStarterCard: false,
    isCollectible: false,
    biome: "AZTEC",
  },
  {
    id: "eagle_knight_solar_ascent",
    name: "Solar Ascent",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "UNCOMMON",
    description:
      "Deal 11 damage. Add Solar Verdict to your discard pile. Exhaust.",
    effects: [
      { type: "DAMAGE", value: 11 },
      {
        type: "ADD_CARD_TO_DISCARD",
        value: 1,
        cardId: "eagle_knight_solar_verdict",
      },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: null,
    upgrade: null,
    isStarterCard: false,
    isCollectible: false,
    biome: "AZTEC",
  },
  {
    id: "eagle_knight_solar_verdict",
    name: "Solar Verdict",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "RARE",
    description: "Deal 14 damage. Apply 5 Bleed. Exhaust.",
    effects: [
      { type: "DAMAGE", value: 14 },
      { type: "APPLY_DEBUFF", value: 5, buff: "BLEED", duration: 5 },
      { type: "EXHAUST", value: 0 },
    ],
    inkedVariant: null,
    upgrade: null,
    isStarterCard: false,
    isCollectible: false,
    biome: "AZTEC",
  },

  // =========================================================
  // Status / Curse cards (non-collectible, non-upgradeable)
  // =========================================================
  {
    id: "dazed",
    name: "Dazed",
    type: "STATUS",
    energyCost: 0,
    inkCost: 0,
    targeting: "SELF",
    rarity: "STARTER",
    description: "Unplayable. Exhaust at end of turn.",
    effects: [],
    inkedVariant: null,
    upgrade: null,
    isStarterCard: false,
    isCollectible: false,
    isStatusCard: true,
    biome: "LIBRARY",
  },
  {
    id: "ink_burn",
    name: "Ink Burn",
    type: "STATUS",
    energyCost: 0,
    inkCost: 0,
    targeting: "SELF",
    rarity: "STARTER",
    description: "Unplayable. When drawn, lose 1 Ink.",
    effects: [],
    inkedVariant: null,
    upgrade: null,
    isStarterCard: false,
    isCollectible: false,
    isStatusCard: true,
    biome: "LIBRARY",
  },
  {
    id: "torn_index",
    name: "Torn Index",
    type: "STATUS",
    energyCost: 0,
    inkCost: 0,
    targeting: "SELF",
    rarity: "STARTER",
    description:
      "Unplayable. When drawn, freeze the next card you draw this turn.",
    effects: [],
    inkedVariant: null,
    upgrade: null,
    isStarterCard: false,
    isCollectible: false,
    isStatusCard: true,
    biome: "LIBRARY",
  },
  {
    id: "smudged_lens",
    name: "Smudged Lens",
    type: "STATUS",
    energyCost: 0,
    inkCost: 0,
    targeting: "SELF",
    rarity: "STARTER",
    description: "Unplayable. When drawn, draw 1 fewer card next turn.",
    effects: [],
    inkedVariant: null,
    upgrade: null,
    isStarterCard: false,
    isCollectible: false,
    isStatusCard: true,
    biome: "LIBRARY",
  },
  {
    id: "hexed_parchment",
    name: "Hexed Parchment",
    type: "CURSE",
    energyCost: 0,
    inkCost: 0,
    targeting: "SELF",
    rarity: "STARTER",
    description: "Unplayable. When drawn, your cards cost 1 more this turn.",
    effects: [],
    inkedVariant: null,
    upgrade: null,
    isStarterCard: false,
    isCollectible: false,
    isCurseCard: true,
    biome: "LIBRARY",
  },
  {
    id: "haunting_regret",
    name: "Haunting Regret",
    type: "CURSE",
    energyCost: 0,
    inkCost: 0,
    targeting: "SELF",
    rarity: "STARTER",
    description:
      "Unplayable. When drawn, the next card you draw this turn goes to discard.",
    effects: [],
    inkedVariant: null,
    upgrade: null,
    isStarterCard: false,
    isCollectible: false,
    isCurseCard: true,
    biome: "LIBRARY",
  },
  {
    id: "binding_curse",
    name: "Binding Curse",
    type: "CURSE",
    energyCost: 0,
    inkCost: 0,
    targeting: "SELF",
    rarity: "STARTER",
    description: "Unplayable. When drawn, freeze 1 random card in your hand.",
    effects: [],
    inkedVariant: null,
    upgrade: null,
    isStarterCard: false,
    isCollectible: false,
    isCurseCard: true,
    biome: "LIBRARY",
  },
  {
    id: "echo_curse",
    name: "Echo Curse",
    type: "CURSE",
    energyCost: 0,
    inkCost: 0,
    targeting: "SELF",
    rarity: "STARTER",
    description: "Unplayable. When drawn, add 1 Dazed to your discard pile.",
    effects: [],
    inkedVariant: null,
    upgrade: null,
    isStarterCard: false,
    isCollectible: false,
    isCurseCard: true,
    biome: "LIBRARY",
  },
  {
    id: "shrouded_omen",
    name: "Shrouded Omen",
    type: "CURSE",
    energyCost: 0,
    inkCost: 0,
    targeting: "SELF",
    rarity: "STARTER",
    description:
      "Unplayable. While this is in your hand, enemy intents are hidden.",
    effects: [],
    inkedVariant: null,
    upgrade: null,
    isStarterCard: false,
    isCollectible: false,
    isCurseCard: true,
    biome: "LIBRARY",
  },
];

function buildEnemyCardName(enemy: EnemyDefinition, suffix: string): string {
  return `${enemy.name} ${suffix}`;
}

const BESTIARY_CHARACTER_OVERRIDES: Record<
  string,
  "scribe" | "bibliothecaire"
> = {
  deep_one: "scribe",
};

function getBestiaryCharacterId(enemy: EnemyDefinition): string | undefined {
  // Keep exactly one Russian bestiary card neutral to hit the target of 5 neutral cards in that biome.
  if (enemy.id === "winter_wolf") return undefined;

  const override = BESTIARY_CHARACTER_OVERRIDES[enemy.id];
  if (override) return override;

  // Deterministic split between characters for generated bestiary cards.
  let checksum = 0;
  for (const ch of enemy.id) checksum += ch.charCodeAt(0);
  return checksum % 2 === 0 ? "scribe" : "bibliothecaire";
}

type BestiaryCardTemplate = Omit<
  CardDefinition,
  "id" | "name" | "rarity" | "biome"
>;

function makeBestiaryCardTemplate(
  template: Pick<
    CardDefinition,
    | "type"
    | "energyCost"
    | "targeting"
    | "description"
    | "effects"
    | "onRandomDiscardEffects"
  > & {
    inkCost?: number;
    upgrade?: CardDefinition["upgrade"];
  }
): BestiaryCardTemplate {
  return {
    type: template.type,
    energyCost: template.energyCost,
    inkCost: template.inkCost ?? 0,
    targeting: template.targeting,
    description: template.description,
    effects: template.effects,
    onRandomDiscardEffects: template.onRandomDiscardEffects ?? [],
    inkedVariant: null,
    upgrade: template.upgrade ?? null,
    isStarterCard: false,
  };
}

const BESTIARY_NORMAL_CARD_OVERRIDES: Record<string, BestiaryCardTemplate> = {
  // VIKING
  draugr: makeBestiaryCardTemplate({
    type: "ATTACK",
    energyCost: 1,
    targeting: "SINGLE_ENEMY",
    description:
      "Deal 5 damage. Apply 2 Bleed. Add 1 Dazed to your discard pile.",
    effects: [
      { type: "DAMAGE", value: 5 },
      { type: "APPLY_DEBUFF", value: 2, buff: "BLEED", duration: 2 },
      { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
    ],
    upgrade: {
      description:
        "Deal 7 damage. Apply 3 Bleed. Add 1 Dazed to your discard pile.",
      effects: [
        { type: "DAMAGE", value: 7 },
        { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 3 },
        { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
      ],
    },
  }),
  frost_troll: makeBestiaryCardTemplate({
    type: "SKILL",
    energyCost: 1,
    targeting: "SELF",
    description: "Gain 4 block. Gain 2 block per Bleed on enemies.",
    effects: [
      { type: "BLOCK", value: 4 },
      { type: "BLOCK_PER_DEBUFF", value: 2, buff: "BLEED" },
    ],
    upgrade: {
      description: "Gain 6 block. Gain 3 block per Bleed on enemies.",
      effects: [
        { type: "BLOCK", value: 6 },
        { type: "BLOCK_PER_DEBUFF", value: 3, buff: "BLEED" },
      ],
    },
  }),
  shield_maiden: makeBestiaryCardTemplate({
    type: "ATTACK",
    energyCost: 1,
    targeting: "SINGLE_ENEMY",
    description: "Gain 5 block. Deal damage equal to your Block.",
    effects: [
      { type: "BLOCK", value: 5 },
      { type: "DAMAGE_EQUAL_BLOCK", value: 1 },
    ],
    upgrade: {
      description: "Gain 7 block. Deal double your Block as damage.",
      effects: [
        { type: "BLOCK", value: 7 },
        { type: "DAMAGE_EQUAL_BLOCK", value: 2 },
      ],
    },
  }),

  // GREEK
  satyr: makeBestiaryCardTemplate({
    type: "SKILL",
    energyCost: 1,
    targeting: "SINGLE_ENEMY",
    description: "Draw 1 card. Apply 3 Poison.",
    effects: [
      { type: "DRAW_CARDS", value: 1 },
      { type: "APPLY_DEBUFF", value: 3, buff: "POISON" },
    ],
    upgrade: {
      description: "Draw 1 card. Apply 5 Poison.",
      effects: [
        { type: "DRAW_CARDS", value: 1 },
        { type: "APPLY_DEBUFF", value: 5, buff: "POISON" },
      ],
    },
  }),
  harpy: makeBestiaryCardTemplate({
    type: "ATTACK",
    energyCost: 1,
    targeting: "SINGLE_ENEMY",
    description: "Deal 3 damage twice. Apply 1 Weak.",
    effects: [
      { type: "DAMAGE", value: 3 },
      { type: "DAMAGE", value: 3 },
      { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
    ],
    upgrade: {
      description: "Deal 4 damage twice. Apply 1 Weak.",
      effects: [
        { type: "DAMAGE", value: 4 },
        { type: "DAMAGE", value: 4 },
        { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
      ],
    },
  }),
  cyclops: makeBestiaryCardTemplate({
    type: "ATTACK",
    energyCost: 1,
    targeting: "SINGLE_ENEMY",
    description:
      "Deal 6 damage. If you have an upgraded card in hand, deal 6 more damage.",
    effects: [
      { type: "DAMAGE", value: 6 },
      { type: "DAMAGE_BONUS_IF_UPGRADED_IN_HAND", value: 6 },
    ],
    upgrade: {
      description:
        "Deal 8 damage. If you have an upgraded card in hand, deal 8 more damage.",
      effects: [
        { type: "DAMAGE", value: 8 },
        { type: "DAMAGE_BONUS_IF_UPGRADED_IN_HAND", value: 8 },
      ],
    },
  }),
  gorgon: makeBestiaryCardTemplate({
    type: "SKILL",
    energyCost: 1,
    targeting: "ALL_ENEMIES",
    description: "Apply 1 Weak and 1 Vulnerable to ALL enemies. Exhaust.",
    effects: [
      { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
      { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
      { type: "EXHAUST", value: 0 },
    ],
    upgrade: {
      description: "Apply 2 Weak and 1 Vulnerable to ALL enemies. Exhaust.",
      effects: [
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
        { type: "EXHAUST", value: 0 },
      ],
    },
  }),

  // EGYPTIAN
  scarab_swarm: makeBestiaryCardTemplate({
    type: "ATTACK",
    energyCost: 1,
    targeting: "ALL_ENEMIES",
    description:
      "Deal 1 damage to ALL enemies. Apply 2 Poison to ALL enemies. Add 1 Dazed to your discard pile.",
    effects: [
      { type: "DAMAGE", value: 1 },
      { type: "APPLY_DEBUFF", value: 2, buff: "POISON" },
      { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
    ],
    upgrade: {
      description:
        "Deal 2 damage to ALL enemies. Apply 2 Poison to ALL enemies. Add 1 Dazed to your discard pile.",
      effects: [
        { type: "DAMAGE", value: 2 },
        { type: "APPLY_DEBUFF", value: 2, buff: "POISON" },
        { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
      ],
    },
  }),
  tomb_priest: makeBestiaryCardTemplate({
    type: "SKILL",
    energyCost: 1,
    targeting: "SINGLE_ENEMY",
    description: "Gain 2 ink. Apply 1 Vulnerable.",
    effects: [
      { type: "GAIN_INK", value: 2 },
      { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
    ],
    upgrade: {
      description: "Gain 3 ink. Apply 2 Vulnerable.",
      effects: [
        { type: "GAIN_INK", value: 3 },
        { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
      ],
    },
  }),
  ushabti_servant: makeBestiaryCardTemplate({
    type: "SKILL",
    energyCost: 1,
    targeting: "SELF",
    description: "Gain 6 block. Upgrade a random card in your hand.",
    effects: [
      { type: "BLOCK", value: 6 },
      { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 1 },
    ],
    upgrade: {
      description: "Gain 8 block. Upgrade a random card in your hand.",
      effects: [
        { type: "BLOCK", value: 8 },
        { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 1 },
      ],
    },
  }),

  // LOVECRAFTIAN
  cultist_scribe: makeBestiaryCardTemplate({
    type: "SKILL",
    energyCost: 1,
    targeting: "SELF",
    description: "Draw 2 cards. Discard 1 random card. Gain 1 ink.",
    effects: [
      { type: "DRAW_CARDS", value: 2 },
      { type: "FORCE_DISCARD_RANDOM", value: 1 },
      { type: "GAIN_INK", value: 1 },
    ],
    upgrade: {
      description: "Draw 3 cards. Discard 1 random card. Gain 1 ink.",
      effects: [
        { type: "DRAW_CARDS", value: 3 },
        { type: "FORCE_DISCARD_RANDOM", value: 1 },
        { type: "GAIN_INK", value: 1 },
      ],
    },
  }),
  deep_one: makeBestiaryCardTemplate({
    type: "ATTACK",
    energyCost: 1,
    targeting: "SINGLE_ENEMY",
    description:
      "Deal 4 damage. Deal 3 more damage for each time Deep One Dossier was played this combat.",
    effects: [
      { type: "DAMAGE", value: 4 },
      { type: "DAMAGE_PER_THIS_CARD_PLAYED", value: 3 },
    ],
    upgrade: {
      description:
        "Deal 5 damage. Deal 4 more damage for each time Deep One Dossier was played this combat.",
      effects: [
        { type: "DAMAGE", value: 5 },
        { type: "DAMAGE_PER_THIS_CARD_PLAYED", value: 4 },
      ],
    },
  }),
  star_spawn: makeBestiaryCardTemplate({
    type: "ATTACK",
    energyCost: 1,
    targeting: "SINGLE_ENEMY",
    description:
      "Deal 4 damage. Deal 2 more per card in your Exhaust pile. Add 1 Dazed to your discard pile.",
    effects: [
      { type: "DAMAGE", value: 4 },
      { type: "DAMAGE_PER_EXHAUSTED_CARD", value: 2 },
      { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
    ],
    upgrade: {
      description:
        "Deal 6 damage. Deal 3 more per card in your Exhaust pile. Add 1 Dazed to your discard pile.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "DAMAGE_PER_EXHAUSTED_CARD", value: 3 },
        { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
      ],
    },
  }),
  byakhee: makeBestiaryCardTemplate({
    type: "ATTACK",
    energyCost: 0,
    targeting: "SINGLE_ENEMY",
    description:
      "Deal 2 damage. Add a copy of this card to your discard pile. Exhaust.",
    effects: [
      { type: "DAMAGE", value: 2 },
      { type: "ADD_CARD_TO_DISCARD", value: 1, copySourceCard: true },
      { type: "EXHAUST", value: 0 },
    ],
    upgrade: {
      description:
        "Deal 4 damage. Add a copy of this card to your discard pile. Exhaust.",
      effects: [
        { type: "DAMAGE", value: 4 },
        { type: "ADD_CARD_TO_DISCARD", value: 1, copySourceCard: true },
        { type: "EXHAUST", value: 0 },
      ],
    },
  }),

  // AZTEC
  jaguar_warrior: makeBestiaryCardTemplate({
    type: "ATTACK",
    energyCost: 1,
    targeting: "SINGLE_ENEMY",
    description: "Deal 5 damage. Deal 2 more per Bleed on target.",
    effects: [
      { type: "DAMAGE", value: 5 },
      { type: "DAMAGE_PER_DEBUFF", value: 2, buff: "BLEED" },
    ],
    upgrade: {
      description: "Deal 7 damage. Deal 3 more per Bleed on target.",
      effects: [
        { type: "DAMAGE", value: 7 },
        { type: "DAMAGE_PER_DEBUFF", value: 3, buff: "BLEED" },
      ],
    },
  }),
  eagle_knight: makeBestiaryCardTemplate({
    type: "ATTACK",
    energyCost: 1,
    targeting: "SINGLE_ENEMY",
    description: "Deal 4 damage. Add Sun Dive to your discard pile. Exhaust.",
    effects: [
      { type: "DAMAGE", value: 4 },
      {
        type: "ADD_CARD_TO_DISCARD",
        value: 1,
        cardId: "eagle_knight_sun_dive",
      },
      { type: "EXHAUST", value: 0 },
    ],
    upgrade: {
      description: "Deal 6 damage. Add Sun Dive to your discard pile. Exhaust.",
      effects: [
        { type: "DAMAGE", value: 6 },
        {
          type: "ADD_CARD_TO_DISCARD",
          value: 1,
          cardId: "eagle_knight_sun_dive",
        },
        { type: "EXHAUST", value: 0 },
      ],
    },
  }),
  tzitzimitl: makeBestiaryCardTemplate({
    type: "SKILL",
    energyCost: 1,
    targeting: "ALL_ENEMIES",
    description:
      "Gain 1 ink. Apply 1 Weak to ALL enemies. Add 1 Dazed to your discard pile.",
    effects: [
      { type: "GAIN_INK", value: 1 },
      { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
      { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
    ],
    upgrade: {
      description:
        "Gain 2 ink. Apply 1 Weak to ALL enemies. Add 1 Dazed to your discard pile.",
      effects: [
        { type: "GAIN_INK", value: 2 },
        { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
      ],
    },
  }),

  // CELTIC
  sidhe_raider: makeBestiaryCardTemplate({
    type: "ATTACK",
    energyCost: 1,
    targeting: "SINGLE_ENEMY",
    description:
      "Deal 5 damage. Return 1 random non-Clog card from discard to hand.",
    effects: [
      { type: "DAMAGE", value: 5 },
      { type: "MOVE_RANDOM_NON_CLOG_DISCARD_TO_HAND", value: 1 },
    ],
    upgrade: {
      description:
        "Deal 7 damage. Return 1 random non-Clog card from discard to hand.",
      effects: [
        { type: "DAMAGE", value: 7 },
        { type: "MOVE_RANDOM_NON_CLOG_DISCARD_TO_HAND", value: 1 },
      ],
    },
  }),
  morrigan_wisp: makeBestiaryCardTemplate({
    type: "SKILL",
    energyCost: 1,
    targeting: "ALL_ENEMIES",
    description:
      "Apply 1 Weak to ALL enemies. Gain 1 Thorns per Weak on enemies.",
    effects: [
      { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
      {
        type: "APPLY_BUFF_PER_DEBUFF",
        value: 1,
        buff: "THORNS",
        scalingBuff: "WEAK",
      },
    ],
    upgrade: {
      description:
        "Apply 2 Weak to ALL enemies. Gain 1 Thorns per Weak on enemies.",
      effects: [
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        {
          type: "APPLY_BUFF_PER_DEBUFF",
          value: 1,
          buff: "THORNS",
          scalingBuff: "WEAK",
        },
      ],
    },
  }),
  briar_beast: makeBestiaryCardTemplate({
    type: "SKILL",
    energyCost: 1,
    targeting: "SELF",
    description: "Gain 5 block. Apply 2 Poison to ALL enemies. Gain 1 Thorns.",
    effects: [
      { type: "BLOCK", value: 5 },
      { type: "APPLY_DEBUFF", value: 2, buff: "POISON" },
      { type: "APPLY_BUFF", value: 1, buff: "THORNS" },
    ],
    upgrade: {
      description:
        "Gain 7 block. Apply 3 Poison to ALL enemies. Gain 1 Thorns.",
      effects: [
        { type: "BLOCK", value: 7 },
        { type: "APPLY_DEBUFF", value: 3, buff: "POISON" },
        { type: "APPLY_BUFF", value: 1, buff: "THORNS" },
      ],
    },
  }),

  // RUSSIAN
  winter_wolf: makeBestiaryCardTemplate({
    type: "ATTACK",
    energyCost: 1,
    targeting: "SINGLE_ENEMY",
    description: "Deal 5 damage. Deal 3 more per Weak on target.",
    effects: [
      { type: "DAMAGE", value: 5 },
      { type: "DAMAGE_PER_DEBUFF", value: 3, buff: "WEAK" },
    ],
    upgrade: {
      description: "Deal 7 damage. Deal 4 more per Weak on target.",
      effects: [
        { type: "DAMAGE", value: 7 },
        { type: "DAMAGE_PER_DEBUFF", value: 4, buff: "WEAK" },
      ],
    },
  }),
  snow_maiden: makeBestiaryCardTemplate({
    type: "SKILL",
    energyCost: 1,
    targeting: "SELF",
    description:
      "Gain 1 Ward. Freeze 1 card in your hand. Draw 1 card. Exhaust.",
    effects: [
      { type: "APPLY_BUFF", value: 1, buff: "WARD" },
      { type: "FREEZE_HAND_CARDS", value: 1 },
      { type: "DRAW_CARDS", value: 1 },
      { type: "EXHAUST", value: 0 },
    ],
    upgrade: {
      description:
        "Gain 1 Ward. Freeze 1 card in your hand. Draw 2 cards. Exhaust.",
      effects: [
        { type: "APPLY_BUFF", value: 1, buff: "WARD" },
        { type: "FREEZE_HAND_CARDS", value: 1 },
        { type: "DRAW_CARDS", value: 2 },
        { type: "EXHAUST", value: 0 },
      ],
    },
  }),
  rusalka: makeBestiaryCardTemplate({
    type: "SKILL",
    energyCost: 1,
    targeting: "SELF",
    description:
      "Gain 4 block. Return 1 random non-Clog card from discard to hand. If this card is randomly discarded, return 2 random non-Clog cards from discard to hand.",
    effects: [
      { type: "BLOCK", value: 4 },
      { type: "MOVE_RANDOM_NON_CLOG_DISCARD_TO_HAND", value: 1 },
    ],
    onRandomDiscardEffects: [
      { type: "MOVE_RANDOM_NON_CLOG_DISCARD_TO_HAND", value: 2 },
    ],
    upgrade: {
      description:
        "Gain 6 block. Return 1 random non-Clog card from discard to hand. If this card is randomly discarded, return 2 random non-Clog cards from discard to hand.",
      effects: [
        { type: "BLOCK", value: 6 },
        { type: "MOVE_RANDOM_NON_CLOG_DISCARD_TO_HAND", value: 1 },
      ],
      onRandomDiscardEffects: [
        { type: "MOVE_RANDOM_NON_CLOG_DISCARD_TO_HAND", value: 2 },
      ],
    },
  }),

  // AFRICAN
  hyena_pack: makeBestiaryCardTemplate({
    type: "ATTACK",
    energyCost: 1,
    targeting: "SINGLE_ENEMY",
    description:
      "Deal 4 damage. Discard 1 random card. If this card is randomly discarded, draw 2 cards.",
    effects: [
      { type: "DAMAGE", value: 4 },
      { type: "FORCE_DISCARD_RANDOM", value: 1 },
    ],
    onRandomDiscardEffects: [{ type: "DRAW_CARDS", value: 2 }],
    upgrade: {
      description:
        "Deal 6 damage. Discard 1 random card. If this card is randomly discarded, draw 2 cards.",
      effects: [
        { type: "DAMAGE", value: 6 },
        { type: "FORCE_DISCARD_RANDOM", value: 1 },
      ],
      onRandomDiscardEffects: [{ type: "DRAW_CARDS", value: 2 }],
    },
  }),
  mask_hunter: makeBestiaryCardTemplate({
    type: "ATTACK",
    energyCost: 1,
    targeting: "SINGLE_ENEMY",
    description: "Deal 7 damage. Apply 1 Vulnerable. Gain 1 ink.",
    effects: [
      { type: "DAMAGE", value: 7 },
      { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
      { type: "GAIN_INK", value: 1 },
    ],
    upgrade: {
      description: "Deal 9 damage. Apply 2 Vulnerable. Gain 1 ink.",
      effects: [
        { type: "DAMAGE", value: 9 },
        { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        { type: "GAIN_INK", value: 1 },
      ],
    },
  }),
  serpent_oracle: makeBestiaryCardTemplate({
    type: "ATTACK",
    energyCost: 1,
    targeting: "SINGLE_ENEMY",
    description:
      "Deal 4 damage. If target already has Poison, deal 4 damage again. Apply 2 Poison.",
    effects: [
      { type: "DAMAGE", value: 4 },
      { type: "DAMAGE_IF_TARGET_HAS_DEBUFF", value: 4, buff: "POISON" },
      { type: "APPLY_DEBUFF", value: 2, buff: "POISON" },
    ],
    upgrade: {
      description:
        "Deal 5 damage. If target already has Poison, deal 5 damage again. Apply 3 Poison.",
      effects: [
        { type: "DAMAGE", value: 5 },
        { type: "DAMAGE_IF_TARGET_HAS_DEBUFF", value: 5, buff: "POISON" },
        { type: "APPLY_DEBUFF", value: 3, buff: "POISON" },
      ],
    },
  }),
  tokoloshe: makeBestiaryCardTemplate({
    type: "SKILL",
    energyCost: 1,
    targeting: "SELF",
    description:
      "Draw 1 card. Add 1 Dazed to your discard pile. If this card is randomly discarded, gain 1 energy and 1 ink.",
    effects: [
      { type: "DRAW_CARDS", value: 1 },
      { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
    ],
    onRandomDiscardEffects: [
      { type: "GAIN_ENERGY", value: 1 },
      { type: "GAIN_INK", value: 1 },
    ],
    upgrade: {
      description:
        "Draw 2 cards. Add 1 Dazed to your discard pile. If this card is randomly discarded, gain 1 energy and 1 ink.",
      effects: [
        { type: "DRAW_CARDS", value: 2 },
        { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
      ],
      onRandomDiscardEffects: [
        { type: "GAIN_ENERGY", value: 1 },
        { type: "GAIN_INK", value: 1 },
      ],
    },
  }),
};

const BESTIARY_ELITE_CARD_OVERRIDES: Record<string, BestiaryCardTemplate> = {
  // VIKING
  valkyrie: makeBestiaryCardTemplate({
    type: "SKILL",
    energyCost: 2,
    targeting: "SELF",
    description: "Gain 1 Strength. Gain 6 block. Exhaust.",
    effects: [
      { type: "GAIN_STRENGTH", value: 1 },
      { type: "BLOCK", value: 6 },
      { type: "EXHAUST", value: 0 },
    ],
    upgrade: {
      description: "Gain 2 Strength. Gain 8 block. Exhaust.",
      effects: [
        { type: "GAIN_STRENGTH", value: 2 },
        { type: "BLOCK", value: 8 },
        { type: "EXHAUST", value: 0 },
      ],
    },
  }),
  jormungandr_spawn: makeBestiaryCardTemplate({
    type: "SKILL",
    energyCost: 2,
    targeting: "SINGLE_ENEMY",
    description:
      "Double Poison on target. Apply 1 Weak. Gain 6 block. Exhaust.",
    effects: [
      { type: "DOUBLE_POISON", value: 0 },
      { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
      { type: "BLOCK", value: 6 },
      { type: "EXHAUST", value: 0 },
    ],
    upgrade: {
      description:
        "Double Poison on target. Apply 2 Weak. Gain 8 block. Exhaust.",
      effects: [
        { type: "DOUBLE_POISON", value: 0 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        { type: "BLOCK", value: 8 },
        { type: "EXHAUST", value: 0 },
      ],
    },
  }),

  // GREEK
  minotaur: makeBestiaryCardTemplate({
    type: "ATTACK",
    energyCost: 2,
    targeting: "SINGLE_ENEMY",
    description:
      "Deal 8 damage. Deal 2 more per Vulnerable on target. Gain 8 block. Exhaust.",
    effects: [
      { type: "DAMAGE", value: 8 },
      { type: "DAMAGE_PER_DEBUFF", value: 2, buff: "VULNERABLE" },
      { type: "BLOCK", value: 8 },
      { type: "EXHAUST", value: 0 },
    ],
    upgrade: {
      description:
        "Deal 10 damage. Deal 3 more per Vulnerable on target. Gain 10 block. Exhaust.",
      effects: [
        { type: "DAMAGE", value: 10 },
        { type: "DAMAGE_PER_DEBUFF", value: 3, buff: "VULNERABLE" },
        { type: "BLOCK", value: 10 },
        { type: "EXHAUST", value: 0 },
      ],
    },
  }),

  // EGYPTIAN
  anubis_champion: makeBestiaryCardTemplate({
    type: "POWER",
    energyCost: 2,
    targeting: "SELF",
    description:
      "Gain Venom Rite. Venom Rite: Every time your cards apply 6 Poison, deal 5 damage to ALL enemies.",
    effects: [{ type: "APPLY_BUFF", value: 1, buff: "POISON_BURST" }],
    upgrade: {
      energyCost: 1,
      description:
        "Gain Venom Rite. Venom Rite: Every time your cards apply 6 Poison, deal 5 damage to ALL enemies.",
      effects: [{ type: "APPLY_BUFF", value: 1, buff: "POISON_BURST" }],
    },
  }),
  sekhmet_chosen: makeBestiaryCardTemplate({
    type: "ATTACK",
    energyCost: 2,
    targeting: "SINGLE_ENEMY",
    description: "Deal 12 damage. Apply 2 Weak. Gain 1 Strength. Exhaust.",
    effects: [
      { type: "DAMAGE", value: 12 },
      { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
      { type: "GAIN_STRENGTH", value: 1 },
      { type: "EXHAUST", value: 0 },
    ],
    upgrade: {
      description: "Deal 15 damage. Apply 2 Weak. Gain 2 Strength. Exhaust.",
      effects: [
        { type: "DAMAGE", value: 15 },
        { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        { type: "GAIN_STRENGTH", value: 2 },
        { type: "EXHAUST", value: 0 },
      ],
    },
  }),

  // LOVECRAFTIAN
  elder_hybrid: makeBestiaryCardTemplate({
    type: "ATTACK",
    energyCost: 2,
    targeting: "SINGLE_ENEMY",
    description:
      "Add 1 Haunting Regret to your discard pile. Deal 5 damage. Deal 5 more damage per Status/Curse in your discard. Exhaust.",
    effects: [
      { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "haunting_regret" },
      { type: "DAMAGE", value: 5 },
      { type: "DAMAGE_PER_CLOG_IN_DISCARD", value: 5 },
      { type: "EXHAUST", value: 0 },
    ],
    upgrade: {
      description:
        "Add 1 Haunting Regret to your discard pile. Deal 7 damage. Deal 6 more damage per Status/Curse in your discard. Exhaust.",
      effects: [
        { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "haunting_regret" },
        { type: "DAMAGE", value: 7 },
        { type: "DAMAGE_PER_CLOG_IN_DISCARD", value: 6 },
        { type: "EXHAUST", value: 0 },
      ],
    },
  }),

  // AZTEC
  quetzal_harbinger: makeBestiaryCardTemplate({
    type: "SKILL",
    energyCost: 2,
    targeting: "SELF",
    description:
      "Gain 1 energy. Apply 3 Bleed to ALL enemies. Upgrade a random card in your hand. Exhaust.",
    effects: [
      { type: "GAIN_ENERGY", value: 1 },
      { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 3 },
      { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 1 },
      { type: "EXHAUST", value: 0 },
    ],
    upgrade: {
      description:
        "Gain 1 energy. Apply 5 Bleed to ALL enemies. Upgrade a random card in your hand. Exhaust.",
      effects: [
        { type: "GAIN_ENERGY", value: 1 },
        { type: "APPLY_DEBUFF", value: 5, buff: "BLEED", duration: 5 },
        { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 1 },
        { type: "EXHAUST", value: 0 },
      ],
    },
  }),
  huitzilopochtli_enforcer: makeBestiaryCardTemplate({
    type: "ATTACK",
    energyCost: 2,
    targeting: "SINGLE_ENEMY",
    description:
      "Deal 10 damage. Apply 5 Bleed. Upgrade a random card in your hand. Exhaust.",
    effects: [
      { type: "DAMAGE", value: 10 },
      { type: "APPLY_DEBUFF", value: 5, buff: "BLEED", duration: 5 },
      { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 1 },
      { type: "EXHAUST", value: 0 },
    ],
    upgrade: {
      description:
        "Deal 13 damage. Apply 6 Bleed. Upgrade a random card in your hand. Exhaust.",
      effects: [
        { type: "DAMAGE", value: 13 },
        { type: "APPLY_DEBUFF", value: 6, buff: "BLEED", duration: 6 },
        { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 1 },
        { type: "EXHAUST", value: 0 },
      ],
    },
  }),

  // CELTIC
  morrigan_chosen: makeBestiaryCardTemplate({
    type: "SKILL",
    energyCost: 2,
    targeting: "SELF",
    description:
      "Apply 2 Weak to ALL enemies. Gain 1 Thorns per Weak on enemies. Weak attackers trigger your Thorns 1 extra time this combat. Exhaust.",
    effects: [
      { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
      {
        type: "APPLY_BUFF_PER_DEBUFF",
        value: 1,
        buff: "THORNS",
        scalingBuff: "WEAK",
      },
      { type: "RETRIGGER_THORNS_ON_WEAK_ATTACK", value: 1 },
      { type: "EXHAUST", value: 0 },
    ],
    upgrade: {
      description:
        "Apply 3 Weak to ALL enemies. Gain 1 Thorns per Weak on enemies. Weak attackers trigger your Thorns 1 extra time this combat. Exhaust.",
      effects: [
        { type: "APPLY_DEBUFF", value: 3, buff: "WEAK", duration: 2 },
        {
          type: "APPLY_BUFF_PER_DEBUFF",
          value: 1,
          buff: "THORNS",
          scalingBuff: "WEAK",
        },
        { type: "RETRIGGER_THORNS_ON_WEAK_ATTACK", value: 1 },
        { type: "EXHAUST", value: 0 },
      ],
    },
  }),
  wild_hunt_hound: makeBestiaryCardTemplate({
    type: "ATTACK",
    energyCost: 2,
    targeting: "SINGLE_ENEMY",
    description:
      "Deal 8 damage. Apply 3 Bleed. Deal 3 more damage per Weak on target. Exhaust.",
    effects: [
      { type: "DAMAGE", value: 8 },
      { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 3 },
      { type: "DAMAGE_PER_DEBUFF", value: 3, buff: "WEAK" },
      { type: "EXHAUST", value: 0 },
    ],
    upgrade: {
      description:
        "Deal 10 damage. Apply 4 Bleed. Deal 4 more damage per Weak on target. Exhaust.",
      effects: [
        { type: "DAMAGE", value: 10 },
        { type: "APPLY_DEBUFF", value: 4, buff: "BLEED", duration: 4 },
        { type: "DAMAGE_PER_DEBUFF", value: 4, buff: "WEAK" },
        { type: "EXHAUST", value: 0 },
      ],
    },
  }),

  // RUSSIAN
  koschei_herald: makeBestiaryCardTemplate({
    type: "SKILL",
    energyCost: 2,
    targeting: "SELF",
    description:
      "Gain 6 block. Return 2 random non-Clog cards from discard to hand. Exhaust.",
    effects: [
      { type: "BLOCK", value: 6 },
      { type: "MOVE_RANDOM_NON_CLOG_DISCARD_TO_HAND", value: 2 },
      { type: "EXHAUST", value: 0 },
    ],
    upgrade: {
      description:
        "Gain 8 block. Return 2 random non-Clog cards from discard to hand. Exhaust.",
      effects: [
        { type: "BLOCK", value: 8 },
        { type: "MOVE_RANDOM_NON_CLOG_DISCARD_TO_HAND", value: 2 },
        { type: "EXHAUST", value: 0 },
      ],
    },
  }),
  domovoi_titan: makeBestiaryCardTemplate({
    type: "SKILL",
    energyCost: 2,
    targeting: "SELF",
    description:
      "Gain 30 block. Gain Stonebound for 3 turns. Stonebound: you cannot gain block. Exhaust.",
    effects: [
      { type: "BLOCK", value: 30 },
      { type: "APPLY_BUFF", value: 1, buff: "STONEBOUND", duration: 3 },
      { type: "EXHAUST", value: 0 },
    ],
    upgrade: {
      description:
        "Gain 36 block. Gain Stonebound for 3 turns. Stonebound: you cannot gain block. Exhaust.",
      effects: [
        { type: "BLOCK", value: 36 },
        { type: "APPLY_BUFF", value: 1, buff: "STONEBOUND", duration: 3 },
        { type: "EXHAUST", value: 0 },
      ],
    },
  }),

  // AFRICAN
  legba_emissary: makeBestiaryCardTemplate({
    type: "POWER",
    energyCost: 2,
    targeting: "SELF",
    description:
      "Gain Ember Flow. Ember Flow: Whenever one of your cards Exhausts, gain 1 energy.",
    effects: [{ type: "APPLY_BUFF", value: 1, buff: "EXHAUST_ENERGY" }],
    upgrade: {
      energyCost: 1,
      description:
        "Gain Ember Flow. Ember Flow: Whenever one of your cards Exhausts, gain 1 energy.",
      effects: [{ type: "APPLY_BUFF", value: 1, buff: "EXHAUST_ENERGY" }],
    },
  }),
};

function getBiomeNormalCardTemplate(
  biome: BiomeType
): Omit<CardDefinition, "id" | "name" | "rarity" | "biome"> {
  switch (biome) {
    case "LIBRARY":
      return {
        type: "SKILL",
        energyCost: 1,
        inkCost: 0,
        targeting: "SELF",
        description: "Gain 5 block. Gain 1 ink.",
        effects: [
          { type: "BLOCK", value: 5 },
          { type: "GAIN_INK", value: 1 },
        ],
        inkedVariant: null,
        upgrade: {
          description: "Gain 8 block. Gain 1 ink. Draw 1 card.",
          effects: [
            { type: "BLOCK", value: 8 },
            { type: "GAIN_INK", value: 1 },
            { type: "DRAW_CARDS", value: 1 },
          ],
        },
        isStarterCard: false,
      };
    case "VIKING":
      return {
        type: "ATTACK",
        energyCost: 1,
        inkCost: 0,
        targeting: "SINGLE_ENEMY",
        description: "Deal 7 damage. Apply 1 Vulnerable.",
        effects: [
          { type: "DAMAGE", value: 7 },
          { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
        ],
        inkedVariant: null,
        upgrade: {
          description: "Deal 10 damage. Apply 2 Vulnerable.",
          effects: [
            { type: "DAMAGE", value: 10 },
            { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
          ],
        },
        isStarterCard: false,
      };
    case "GREEK":
      return {
        type: "ATTACK",
        energyCost: 1,
        inkCost: 0,
        targeting: "SINGLE_ENEMY",
        description: "Deal 5 damage. Apply 2 Vulnerable.",
        effects: [
          { type: "DAMAGE", value: 5 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
        inkedVariant: null,
        upgrade: {
          description: "Deal 7 damage. Apply 2 Vulnerable. Draw 1 card.",
          effects: [
            { type: "DAMAGE", value: 7 },
            { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
            { type: "DRAW_CARDS", value: 1 },
          ],
        },
        isStarterCard: false,
      };
    case "EGYPTIAN":
      return {
        type: "ATTACK",
        energyCost: 1,
        inkCost: 0,
        targeting: "SINGLE_ENEMY",
        description: "Deal 6 damage. Drain 2 ink from the target.",
        effects: [
          { type: "DAMAGE", value: 6 },
          { type: "DRAIN_INK", value: 2 },
        ],
        inkedVariant: null,
        upgrade: {
          description: "Deal 9 damage. Drain 3 ink from the target.",
          effects: [
            { type: "DAMAGE", value: 9 },
            { type: "DRAIN_INK", value: 3 },
          ],
        },
        isStarterCard: false,
      };
    case "LOVECRAFTIAN":
      return {
        type: "SKILL",
        energyCost: 1,
        inkCost: 0,
        targeting: "SINGLE_ENEMY",
        description: "Deal 5 damage. Apply 1 Weak.",
        effects: [
          { type: "DAMAGE", value: 5 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        ],
        inkedVariant: null,
        upgrade: {
          description: "Deal 8 damage. Apply 2 Weak.",
          effects: [
            { type: "DAMAGE", value: 8 },
            { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
          ],
        },
        isStarterCard: false,
      };
    case "AZTEC":
      return {
        type: "ATTACK",
        energyCost: 1,
        inkCost: 0,
        targeting: "SINGLE_ENEMY",
        description: "Deal 8 damage. Apply 3 Bleed.",
        effects: [
          { type: "DAMAGE", value: 8 },
          { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 3 },
        ],
        inkedVariant: null,
        upgrade: {
          description: "Deal 11 damage. Apply 4 Bleed.",
          effects: [
            { type: "DAMAGE", value: 11 },
            { type: "APPLY_DEBUFF", value: 4, buff: "BLEED", duration: 4 },
          ],
        },
        isStarterCard: false,
      };
    case "CELTIC":
      return {
        type: "SKILL",
        energyCost: 1,
        inkCost: 0,
        targeting: "SELF",
        description: "Gain 6 block. Gain 1 Thorns.",
        effects: [
          { type: "BLOCK", value: 6 },
          { type: "APPLY_BUFF", value: 1, buff: "THORNS" },
        ],
        inkedVariant: null,
        upgrade: {
          description: "Gain 9 block. Gain 2 Thorns.",
          effects: [
            { type: "BLOCK", value: 9 },
            { type: "APPLY_BUFF", value: 2, buff: "THORNS" },
          ],
        },
        isStarterCard: false,
      };
    case "RUSSIAN":
      return {
        type: "ATTACK",
        energyCost: 1,
        inkCost: 0,
        targeting: "ALL_ENEMIES",
        description:
          "Deal 4 damage to all enemies. Apply 1 Weak to all enemies.",
        effects: [
          { type: "DAMAGE", value: 4 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 1 },
        ],
        inkedVariant: null,
        upgrade: {
          description:
            "Deal 6 damage to all enemies. Apply 1 Weak to all enemies.",
          effects: [
            { type: "DAMAGE", value: 6 },
            { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
          ],
        },
        isStarterCard: false,
      };
    case "AFRICAN":
      return {
        type: "SKILL",
        energyCost: 1,
        inkCost: 0,
        targeting: "SELF",
        description: "Draw 1 card. Gain 1 ink.",
        effects: [
          { type: "DRAW_CARDS", value: 1 },
          { type: "GAIN_INK", value: 1 },
        ],
        inkedVariant: null,
        upgrade: {
          description: "Draw 2 cards. Gain 1 ink.",
          effects: [
            { type: "DRAW_CARDS", value: 2 },
            { type: "GAIN_INK", value: 1 },
          ],
        },
        isStarterCard: false,
      };
  }
}

function getBiomeEliteCardTemplate(
  biome: BiomeType
): Omit<CardDefinition, "id" | "name" | "rarity" | "biome"> {
  switch (biome) {
    case "LIBRARY":
      return {
        type: "ATTACK",
        energyCost: 2,
        inkCost: 0,
        targeting: "SINGLE_ENEMY",
        description: "Deal 14 damage. Drain 4 ink from the target.",
        effects: [
          { type: "DAMAGE", value: 14 },
          { type: "DRAIN_INK", value: 4 },
        ],
        inkedVariant: null,
        upgrade: {
          description: "Deal 20 damage. Drain 6 ink from the target.",
          effects: [
            { type: "DAMAGE", value: 20 },
            { type: "DRAIN_INK", value: 6 },
          ],
        },
        isStarterCard: false,
      };
    case "VIKING":
      return {
        type: "SKILL",
        energyCost: 2,
        inkCost: 0,
        targeting: "SELF",
        description: "Gain 2 Strength. Exhaust.",
        effects: [
          { type: "GAIN_STRENGTH", value: 2 },
          { type: "EXHAUST", value: 0 },
        ],
        inkedVariant: null,
        upgrade: {
          description: "Gain 3 Strength. Exhaust.",
          effects: [
            { type: "GAIN_STRENGTH", value: 3 },
            { type: "EXHAUST", value: 0 },
          ],
        },
        isStarterCard: false,
      };
    case "GREEK":
      return {
        type: "ATTACK",
        energyCost: 2,
        inkCost: 0,
        targeting: "SINGLE_ENEMY",
        description:
          "Deal 10 damage. Deal 2 more per Vulnerable on target. Exhaust.",
        effects: [
          { type: "DAMAGE", value: 10 },
          { type: "DAMAGE_PER_DEBUFF", value: 2, buff: "VULNERABLE" },
          { type: "EXHAUST", value: 0 },
        ],
        inkedVariant: null,
        upgrade: {
          description:
            "Deal 14 damage. Deal 3 more per Vulnerable on target. Exhaust.",
          effects: [
            { type: "DAMAGE", value: 14 },
            { type: "DAMAGE_PER_DEBUFF", value: 3, buff: "VULNERABLE" },
            { type: "EXHAUST", value: 0 },
          ],
        },
        isStarterCard: false,
      };
    case "EGYPTIAN":
      return {
        type: "ATTACK",
        energyCost: 2,
        inkCost: 0,
        targeting: "ALL_ENEMIES",
        description:
          "Deal 8 damage to all enemies. Apply 1 Weak to all enemies.",
        effects: [
          { type: "DAMAGE", value: 8 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        ],
        inkedVariant: null,
        upgrade: {
          description:
            "Deal 12 damage to all enemies. Apply 1 Weak to all enemies.",
          effects: [
            { type: "DAMAGE", value: 12 },
            { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
          ],
        },
        isStarterCard: false,
      };
    case "LOVECRAFTIAN":
      return {
        type: "SKILL",
        energyCost: 2,
        inkCost: 0,
        targeting: "SINGLE_ENEMY",
        description: "Deal 10 damage. Apply 2 Vulnerable. Draw 1 card.",
        effects: [
          { type: "DAMAGE", value: 10 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
          { type: "DRAW_CARDS", value: 1 },
        ],
        inkedVariant: null,
        upgrade: {
          description: "Deal 14 damage. Apply 2 Vulnerable. Draw 2 cards.",
          effects: [
            { type: "DAMAGE", value: 14 },
            { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
            { type: "DRAW_CARDS", value: 2 },
          ],
        },
        isStarterCard: false,
      };
    case "AZTEC":
      return {
        type: "ATTACK",
        energyCost: 2,
        inkCost: 0,
        targeting: "SINGLE_ENEMY",
        description: "Deal 16 damage. Apply 6 Bleed.",
        effects: [
          { type: "DAMAGE", value: 16 },
          { type: "APPLY_DEBUFF", value: 6, buff: "BLEED", duration: 4 },
        ],
        inkedVariant: null,
        upgrade: {
          description: "Deal 22 damage. Apply 8 Bleed.",
          effects: [
            { type: "DAMAGE", value: 22 },
            { type: "APPLY_DEBUFF", value: 8, buff: "BLEED", duration: 4 },
          ],
        },
        isStarterCard: false,
      };
    case "CELTIC":
      return {
        type: "SKILL",
        energyCost: 2,
        inkCost: 0,
        targeting: "SELF",
        description: "Gain 10 block. Gain 3 Thorns. Exhaust.",
        effects: [
          { type: "BLOCK", value: 10 },
          { type: "APPLY_BUFF", value: 3, buff: "THORNS" },
          { type: "EXHAUST", value: 0 },
        ],
        inkedVariant: null,
        upgrade: {
          description: "Gain 14 block. Gain 4 Thorns. Exhaust.",
          effects: [
            { type: "BLOCK", value: 14 },
            { type: "APPLY_BUFF", value: 4, buff: "THORNS" },
            { type: "EXHAUST", value: 0 },
          ],
        },
        isStarterCard: false,
      };
    case "RUSSIAN":
      return {
        type: "ATTACK",
        energyCost: 2,
        inkCost: 0,
        targeting: "ALL_ENEMIES",
        description:
          "Deal 10 damage to all enemies. Apply 1 Weak to all enemies.",
        effects: [
          { type: "DAMAGE", value: 10 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        ],
        inkedVariant: null,
        upgrade: {
          description:
            "Deal 14 damage to all enemies. Apply 2 Weak to all enemies.",
          effects: [
            { type: "DAMAGE", value: 14 },
            { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
          ],
        },
        isStarterCard: false,
      };
    case "AFRICAN":
      return {
        type: "SKILL",
        energyCost: 2,
        inkCost: 0,
        targeting: "SELF",
        description: "Gain 1 energy. Draw 2 cards.",
        effects: [
          { type: "GAIN_ENERGY", value: 1 },
          { type: "DRAW_CARDS", value: 2 },
        ],
        inkedVariant: null,
        upgrade: {
          description: "Gain 1 energy. Draw 3 cards.",
          effects: [
            { type: "GAIN_ENERGY", value: 1 },
            { type: "DRAW_CARDS", value: 3 },
          ],
        },
        isStarterCard: false,
      };
  }
}

function buildNormalEnemyMasteryCard(enemy: EnemyDefinition): CardDefinition {
  const characterId = getBestiaryCharacterId(enemy);
  return {
    id: `bestiary_normal_${enemy.id}`,
    name: buildEnemyCardName(enemy, "Dossier"),
    rarity: "UNCOMMON",
    biome: enemy.biome,
    ...(characterId ? { characterId } : {}),
    ...(BESTIARY_NORMAL_CARD_OVERRIDES[enemy.id] ??
      getBiomeNormalCardTemplate(enemy.biome)),
  };
}

function buildEliteEnemyMasteryCard(enemy: EnemyDefinition): CardDefinition {
  const characterId = getBestiaryCharacterId(enemy);
  return {
    id: `bestiary_elite_${enemy.id}`,
    name: buildEnemyCardName(enemy, "Trophy"),
    rarity: "RARE",
    biome: enemy.biome,
    ...(characterId ? { characterId } : {}),
    ...(BESTIARY_ELITE_CARD_OVERRIDES[enemy.id] ??
      getBiomeEliteCardTemplate(enemy.biome)),
  };
}

const generatedEnemyMasteryCards: CardDefinition[] = enemyDefinitions
  .filter(
    (enemy) =>
      !enemy.isBoss &&
      !enemy.isScriptedOnly &&
      !ENEMIES_WITHOUT_BESTIARY_CARDS_SET.has(enemy.id)
  )
  .map((enemy) =>
    enemy.isElite
      ? buildEliteEnemyMasteryCard(enemy)
      : buildNormalEnemyMasteryCard(enemy)
  );

export const lootableCardDefinitions: CardDefinition[] = [
  ...baseLootableCardDefinitions,
  ...generatedEnemyMasteryCards,
];
