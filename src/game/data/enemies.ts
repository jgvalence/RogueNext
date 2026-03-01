import type { EnemyAbility, EnemyDefinition } from "../schemas/entities";
import type { EnemyRole } from "../schemas/enums";

type RawEnemyDefinition = Omit<EnemyDefinition, "role">;

const baseEnemyDefinitions: RawEnemyDefinition[] = [
  // =========================================================
  // LIBRARY biome — normal enemies
  // =========================================================
  {
    id: "ink_slime",
    name: "Ink Slime",
    maxHp: 18,
    speed: 2,
    abilities: [
      {
        name: "Splatter",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 7 }],
      },
      {
        name: "Ink Drain",
        weight: 1,
        target: "ALLY_PRIORITY",
        effects: [
          { type: "DAMAGE", value: 3 },
          { type: "DRAIN_INK", value: 3 },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "LIBRARY",
  },
  {
    id: "paper_golem",
    name: "Paper Golem",
    maxHp: 38,
    speed: 1,
    abilities: [
      {
        name: "Crush",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 11 }],
      },
      {
        name: "Paper Shield",
        weight: 1,
        effects: [{ type: "BLOCK", value: 8 }],
      },
      {
        name: "Pulverize",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 7 },
          { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "LIBRARY",
  },
  {
    id: "quill_sprite",
    name: "Quill Sprite",
    maxHp: 14,
    speed: 8,
    abilities: [
      {
        name: "Quick Stab",
        weight: 2,
        target: "LOWEST_HP_ENEMY",
        effects: [{ type: "DAMAGE", value: 5 }],
      },
      {
        name: "Poison Tip",
        weight: 1,
        target: "ALLY_PRIORITY",
        effects: [
          { type: "DAMAGE", value: 3 },
          { type: "APPLY_DEBUFF", value: 4, buff: "POISON" },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "LIBRARY",
  },
  {
    id: "tome_wraith",
    name: "Tome Wraith",
    maxHp: 28,
    speed: 4,
    abilities: [
      {
        name: "Shadow Strike",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 10 }],
      },
      {
        name: "Weaken",
        weight: 1,
        target: "ALLY_PRIORITY",
        effects: [
          { type: "DAMAGE", value: 4 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        ],
      },
      {
        name: "Drain",
        weight: 1,
        target: "ALLY_PRIORITY",
        effects: [
          { type: "DAMAGE", value: 6 },
          { type: "DRAIN_INK", value: 4 },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "LIBRARY",
  },
  {
    id: "scroll_serpent",
    name: "Scroll Serpent",
    maxHp: 24,
    speed: 6,
    abilities: [
      {
        name: "Coil Strike",
        weight: 2,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 8 }],
      },
      {
        name: "Venomous Bite",
        weight: 1,
        target: "ALLY_PRIORITY",
        effects: [
          { type: "DAMAGE", value: 5 },
          { type: "APPLY_DEBUFF", value: 6, buff: "POISON" },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "LIBRARY",
  },

  // =========================================================
  // LIBRARY biome — elites
  // =========================================================
  {
    id: "ink_archon",
    name: "Ink Archon",
    maxHp: 52,
    speed: 3,
    abilities: [
      {
        name: "Ink Storm",
        weight: 1,
        target: "ALLY_PRIORITY",
        effects: [
          { type: "DAMAGE", value: 10 },
          { type: "DRAIN_INK", value: 5 },
        ],
      },
      {
        name: "Ink Flood",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 16 }],
      },
      {
        name: "Corrupt",
        weight: 1,
        target: "ALLY_PRIORITY",
        effects: [
          { type: "DAMAGE", value: 7 },
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
          { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
          { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "hexed_parchment" },
        ],
      },
    ],
    isBoss: false,
    isElite: true,
    tier: 2,
    biome: "LIBRARY",
  },
  {
    id: "tome_colossus",
    name: "Tome Colossus",
    maxHp: 78,
    speed: 1,
    abilities: [
      {
        name: "Titan Crush",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 17 }],
      },
      {
        name: "Iron Pages",
        weight: 1,
        effects: [{ type: "BLOCK", value: 14 }],
      },
      {
        name: "Shatter",
        weight: 1,
        target: "LOWEST_HP_ENEMY",
        effects: [
          { type: "DAMAGE", value: 12 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
      },
      {
        name: "Grind",
        weight: 1,
        target: "ALLY_PRIORITY",
        effects: [
          { type: "DAMAGE", value: 10 },
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        ],
      },
    ],
    isBoss: false,
    isElite: true,
    tier: 2,
    biome: "LIBRARY",
  },
  {
    id: "venom_wyrm",
    name: "Venom Wyrm",
    maxHp: 58,
    speed: 5,
    abilities: [
      {
        name: "Serpent Strike",
        weight: 2,
        target: "LOWEST_HP_ENEMY",
        effects: [{ type: "DAMAGE", value: 13 }],
      },
      {
        name: "Toxic Cloud",
        weight: 1,
        target: "ALLY_PRIORITY",
        effects: [
          { type: "DAMAGE", value: 8 },
          { type: "APPLY_DEBUFF", value: 8, buff: "POISON" },
        ],
      },
      {
        name: "Ensnare",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 6 },
          { type: "APPLY_DEBUFF", value: 3, buff: "WEAK", duration: 2 },
        ],
      },
    ],
    isBoss: false,
    isElite: true,
    tier: 2,
    biome: "LIBRARY",
  },

  // =========================================================
  // LIBRARY biome — boss
  // =========================================================
  // Cycle (6 turns): 18 + 10 + 14 + 16 + 18 + 12 = 88 raw damage.
  {
    id: "chapter_guardian",
    name: "Chapter Guardian",
    maxHp: 145,
    speed: 5,
    abilities: [
      {
        name: "Heavy Slam",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 18 }],
      },
      {
        name: "Page Storm",
        weight: 1,
        target: "LOWEST_HP_ENEMY",
        effects: [
          { type: "DAMAGE", value: 10 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
      },
      {
        name: "Fortify Binding",
        weight: 1,
        effects: [
          { type: "BLOCK", value: 14 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        ],
        conditionalWeights: [
          {
            condition: { type: "ENEMY_HP_BELOW_PCT", threshold: 60 },
            weightMultiplier: 2.5,
          },
        ],
      },
      {
        name: "Ink Devour",
        weight: 1,
        target: "ALLY_PRIORITY",
        effects: [
          { type: "DAMAGE", value: 16 },
          { type: "DRAIN_INK", value: 6 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_INK_ABOVE", value: 3 },
            weightMultiplier: 4,
          },
        ],
      },
      {
        name: "Crushing Verdict",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 18 }],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HP_BELOW_PCT", threshold: 40 },
            weightMultiplier: 2,
          },
        ],
      },
      {
        name: "Binding Curse",
        weight: 1,
        target: "ALLY_PRIORITY",
        effects: [
          { type: "DAMAGE", value: 12 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
          { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
          { type: "ADD_CARD_TO_DRAW", value: 1, cardId: "haunting_regret" },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 1,
    biome: "LIBRARY",
  },

  // =========================================================
  // LIBRARY biome — alternate boss
  // =========================================================
  // The Corrupted Archivist: fast, ink-draining, hand-disruption specialist.
  {
    id: "the_archivist",
    name: "The Corrupted Archivist",
    maxHp: 140,
    speed: 7,
    abilities: [
      {
        name: "Spectral Strike",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 15 }],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HP_BELOW_PCT", threshold: 40 },
            weightMultiplier: 2,
          },
        ],
      },
      {
        name: "Ink Erasure",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 10 },
          { type: "DRAIN_INK", value: 5 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_INK_ABOVE", value: 3 },
            weightMultiplier: 4,
          },
        ],
      },
      {
        name: "Corrupted Index",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 8 },
          { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
        ],
        conditionalWeights: [
          { condition: { type: "TURN_MULTIPLE", n: 3 }, weightMultiplier: 2.5 },
        ],
      },
      {
        name: "Void Library",
        weight: 1,
        target: "PLAYER",
        isDisruption: true,
        effects: [
          { type: "DAMAGE", value: 7 },
          { type: "NEXT_DRAW_TO_DISCARD_THIS_TURN", value: 1 },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 1,
    biome: "LIBRARY",
  },

  // =========================================================
  // VIKING biome — normal enemies
  // =========================================================
  {
    id: "draugr",
    name: "Draugr",
    maxHp: 22,
    speed: 3,
    abilities: [
      {
        name: "Grave Blow",
        weight: 2,
        effects: [{ type: "DAMAGE", value: 9 }],
      },
      {
        name: "Cursed Touch",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 5 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "VIKING",
  },
  {
    id: "rune_berserker",
    name: "Rune Berserker",
    maxHp: 20,
    speed: 7,
    abilities: [
      {
        name: "Frenzied Strike",
        weight: 2,
        effects: [{ type: "DAMAGE", value: 6 }],
      },
      {
        name: "Double Swing",
        weight: 2,
        effects: [
          { type: "DAMAGE", value: 5 },
          { type: "DAMAGE", value: 5 },
        ],
      },
      {
        name: "Runic Slash",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 8 },
          { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 1 },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "VIKING",
  },
  {
    id: "frost_troll",
    name: "Frost Troll",
    maxHp: 36,
    speed: 1,
    abilities: [
      {
        name: "Frost Smash",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 13 }],
      },
      {
        name: "Ice Hide",
        weight: 1,
        effects: [{ type: "BLOCK", value: 10 }],
      },
      {
        name: "Frozen Fist",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 10 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "VIKING",
  },
  {
    id: "shield_maiden",
    name: "Shield Maiden",
    maxHp: 28,
    speed: 4,
    abilities: [
      {
        name: "Shield Bash",
        weight: 1,
        effects: [
          { type: "BLOCK", value: 8 },
          { type: "DAMAGE", value: 5 },
        ],
      },
      {
        name: "Spear Thrust",
        weight: 2,
        effects: [{ type: "DAMAGE", value: 10 }],
      },
      {
        name: "Warrior's Cry",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 7 },
          { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "VIKING",
  },

  // =========================================================
  // VIKING biome — new normal enemies
  // =========================================================
  {
    id: "rune_shaman",
    name: "Rune Shaman",
    maxHp: 22,
    speed: 4,
    abilities: [
      {
        name: "Frost Hex",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 5 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        ],
      },
      {
        name: "Runic Mark",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 7 },
          { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 1 },
        ],
      },
      {
        name: "Ice Chant",
        weight: 1,
        effects: [{ type: "BLOCK", value: 8 }],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "VIKING",
  },
  {
    id: "einherjar",
    name: "Einherjar",
    maxHp: 32,
    speed: 3,
    abilities: [
      {
        name: "Chosen Strike",
        weight: 2,
        effects: [{ type: "DAMAGE", value: 9 }],
      },
      {
        name: "Shield Hold",
        weight: 1,
        effects: [{ type: "BLOCK", value: 9 }],
      },
      {
        name: "War Oath",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 7 },
          { type: "BLOCK", value: 5 },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "VIKING",
  },

  // =========================================================
  // VIKING biome — elite
  // =========================================================
  {
    id: "valkyrie",
    name: "Valkyrie",
    maxHp: 58,
    speed: 5,
    abilities: [
      {
        name: "Divine Spear",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 18 }],
      },
      {
        name: "Disarm",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 10 },
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        ],
      },
      {
        name: "Valhalla's Wrath",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 14 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
      },
      {
        name: "Wing Shield",
        weight: 1,
        effects: [{ type: "BLOCK", value: 12 }],
      },
    ],
    isBoss: false,
    isElite: true,
    tier: 2,
    biome: "VIKING",
  },

  {
    id: "jormungandr_spawn",
    name: "Jormungandr Spawn",
    maxHp: 66,
    speed: 3,
    abilities: [
      {
        name: "Serpent Crush",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 15 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
      },
      {
        name: "Venom Fang",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 10 },
          { type: "APPLY_DEBUFF", value: 2, buff: "BLEED", duration: 4 },
        ],
      },
      {
        name: "Coil Squeeze",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 12 },
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        ],
      },
      {
        name: "Scale Guard",
        weight: 1,
        effects: [{ type: "BLOCK", value: 12 }],
      },
    ],
    isBoss: false,
    isElite: true,
    tier: 2,
    biome: "VIKING",
  },

  // =========================================================
  // VIKING biome — boss
  // =========================================================
  // Fenrir's 6-turn cycle: total ~103 raw damage, escalating threat.
  {
    id: "fenrir",
    name: "Fenrir",
    maxHp: 170,
    speed: 4,
    abilities: [
      {
        name: "Snap",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 14 }],
      },
      {
        name: "Pack Howl",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 10 },
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        ],
        conditionalWeights: [
          { condition: { type: "NO_OTHER_ENEMIES" }, weightMultiplier: 3 },
        ],
      },
      {
        name: "Lunge",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 18 }],
      },
      {
        name: "Chain Break",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 16 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "VULNERABLE" },
            weightMultiplier: 0.3,
          },
        ],
      },
      {
        name: "Ragnarok Bite",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 24 }],
        conditionalWeights: [
          {
            condition: { type: "ENEMY_HP_BELOW_PCT", threshold: 40 },
            weightMultiplier: 3,
          },
        ],
      },
      {
        name: "World's End",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 21 },
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 3 },
          { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 3 },
        ],
        conditionalWeights: [
          {
            condition: { type: "ENEMY_HP_BELOW_PCT", threshold: 50 },
            weightMultiplier: 2,
          },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 1,
    biome: "VIKING",
  },

  // =========================================================
  // VIKING biome — alternate boss
  // =========================================================
  // Hel, Queen of Niflheim: BLEED master, death domain.
  {
    id: "hel_queen",
    name: "Hel, Queen of Niflheim",
    maxHp: 175,
    speed: 3,
    abilities: [
      {
        name: "Half-World Strike",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 16 }],
      },
      {
        name: "Death's Grasp",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 12 },
          { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 5 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "BLEED" },
            weightMultiplier: 0.3,
          },
        ],
      },
      {
        name: "Niflheim Surge",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 14 },
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "BLEED" },
            weightMultiplier: 3,
          },
        ],
      },
      {
        name: "Realm Wall",
        weight: 1,
        target: "SELF",
        effects: [{ type: "BLOCK", value: 18 }],
        conditionalWeights: [
          { condition: { type: "ENEMY_HAS_NO_BLOCK" }, weightMultiplier: 2 },
          {
            condition: { type: "ENEMY_HP_BELOW_PCT", threshold: 50 },
            weightMultiplier: 2,
          },
        ],
      },
      {
        name: "Death's Reckoning",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 24 }],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HP_BELOW_PCT", threshold: 35 },
            weightMultiplier: 3,
          },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 1,
    biome: "VIKING",
  },

  // =========================================================
  // GREEK biome — normal enemies
  // =========================================================
  {
    id: "satyr",
    name: "Satyr",
    maxHp: 16,
    speed: 7,
    abilities: [
      {
        name: "Reed Stab",
        weight: 2,
        effects: [{ type: "DAMAGE", value: 5 }],
      },
      {
        name: "Toxic Flute",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 3 },
          { type: "APPLY_DEBUFF", value: 5, buff: "POISON" },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "GREEK",
  },
  {
    id: "harpy",
    name: "Harpy",
    maxHp: 18,
    speed: 9,
    abilities: [
      {
        name: "Talon Slash",
        weight: 2,
        effects: [{ type: "DAMAGE", value: 6 }],
      },
      {
        name: "Wing Buffet",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 4 },
          { type: "DAMAGE", value: 4 },
        ],
      },
      {
        name: "Screech",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 5 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "GREEK",
  },
  {
    id: "cyclops",
    name: "Cyclops",
    maxHp: 40,
    speed: 1,
    abilities: [
      {
        name: "Boulder Throw",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 14 }],
      },
      {
        name: "Eye Glare",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 8 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
      },
      {
        name: "Stomp",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 11 }],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "GREEK",
  },
  {
    id: "gorgon",
    name: "Gorgon",
    maxHp: 26,
    speed: 3,
    abilities: [
      {
        name: "Serpent Hair",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 6 },
          { type: "APPLY_DEBUFF", value: 4, buff: "POISON" },
        ],
      },
      {
        name: "Stone Gaze",
        weight: 1,
        effects: [
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
          { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
        ],
      },
      {
        name: "Petrify",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 9 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 3 },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "GREEK",
  },

  // =========================================================
  // GREEK biome — new normal enemies
  // =========================================================
  {
    id: "lamia",
    name: "Lamia",
    maxHp: 20,
    speed: 6,
    abilities: [
      {
        name: "Constrict",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 7 },
          { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
        ],
      },
      {
        name: "Serpent Kiss",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 5 },
          { type: "APPLY_DEBUFF", value: 3, buff: "POISON", duration: 0 },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "GREEK",
  },
  {
    id: "bronze_automaton",
    name: "Bronze Automaton",
    maxHp: 38,
    speed: 1,
    abilities: [
      {
        name: "Bronze Fist",
        weight: 2,
        effects: [{ type: "DAMAGE", value: 12 }],
      },
      {
        name: "Talos Shield",
        weight: 1,
        effects: [{ type: "BLOCK", value: 11 }],
      },
      {
        name: "Rivet Barrage",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 6 },
          { type: "DAMAGE", value: 6 },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "GREEK",
  },

  // =========================================================
  // GREEK biome — elite
  // =========================================================
  {
    id: "minotaur",
    name: "Minotaur",
    maxHp: 65,
    speed: 2,
    abilities: [
      {
        name: "Charge",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 20 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
      },
      {
        name: "Axe Swing",
        weight: 2,
        effects: [{ type: "DAMAGE", value: 15 }],
      },
      {
        name: "Labyrinth Roar",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 12 },
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        ],
      },
    ],
    isBoss: false,
    isElite: true,
    tier: 2,
    biome: "GREEK",
  },

  {
    id: "lernaean_broodling",
    name: "Lernaean Broodling",
    maxHp: 68,
    speed: 3,
    abilities: [
      {
        name: "Acid Spew",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 11 },
          { type: "APPLY_DEBUFF", value: 6, buff: "POISON", duration: 0 },
        ],
      },
      {
        name: "Multi-Head Strike",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 7 },
          { type: "DAMAGE", value: 7 },
        ],
      },
      {
        name: "Regenerate",
        weight: 1,
        effects: [{ type: "BLOCK", value: 14 }],
      },
      {
        name: "Venomous Overwhelm",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 13 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
          { type: "APPLY_DEBUFF", value: 3, buff: "POISON", duration: 0 },
        ],
      },
    ],
    isBoss: false,
    isElite: true,
    tier: 2,
    biome: "GREEK",
  },

  // =========================================================
  // GREEK biome — boss
  // =========================================================
  // Medusa's 5-turn cycle: petrification + heavy damage.
  {
    id: "medusa",
    name: "Medusa",
    maxHp: 155,
    speed: 2,
    abilities: [
      {
        name: "Petrifying Gaze",
        weight: 1,
        effects: [
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "VULNERABLE" },
            weightMultiplier: 0.3,
          },
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "WEAK" },
            weightMultiplier: 0.3,
          },
        ],
      },
      {
        name: "Serpent Bite",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 16 },
          { type: "APPLY_DEBUFF", value: 6, buff: "POISON" },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "POISON" },
            weightMultiplier: 0.5,
          },
        ],
      },
      {
        name: "Stone Crush",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 22 }],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "VULNERABLE" },
            weightMultiplier: 4,
          },
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "WEAK" },
            weightMultiplier: 3,
          },
        ],
      },
      {
        name: "Viper Lash",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 13 },
          { type: "APPLY_DEBUFF", value: 4, buff: "POISON" },
        ],
      },
      {
        name: "Full Petrification",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 18 },
          { type: "APPLY_DEBUFF", value: 3, buff: "WEAK", duration: 3 },
          { type: "APPLY_DEBUFF", value: 3, buff: "VULNERABLE", duration: 3 },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 1,
    biome: "GREEK",
  },

  // =========================================================
  // GREEK biome — alternate boss
  // =========================================================
  // Aspect of the Hydra: multi-hit, POISON accumulation.
  {
    id: "hydra_aspect",
    name: "Aspect of the Hydra",
    maxHp: 155,
    speed: 4,
    abilities: [
      {
        name: "Triple Fang",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 7 },
          { type: "DAMAGE", value: 7 },
          { type: "DAMAGE", value: 7 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "VULNERABLE" },
            weightMultiplier: 2,
          },
        ],
      },
      {
        name: "Venom Surge",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 10 },
          { type: "APPLY_DEBUFF", value: 6, buff: "POISON" },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "POISON" },
            weightMultiplier: 0.5,
          },
        ],
      },
      {
        name: "Hydra's Wrath",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 20 }],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HP_BELOW_PCT", threshold: 40 },
            weightMultiplier: 2,
          },
        ],
      },
      {
        name: "Regeneration",
        weight: 1,
        target: "SELF",
        effects: [{ type: "BLOCK", value: 15 }],
        conditionalWeights: [
          {
            condition: { type: "ENEMY_HP_BELOW_PCT", threshold: 40 },
            weightMultiplier: 3,
          },
          { condition: { type: "ENEMY_HAS_NO_BLOCK" }, weightMultiplier: 2 },
        ],
      },
      {
        name: "Necrotic Snap",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 12 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
        conditionalWeights: [
          { condition: { type: "TURN_MULTIPLE", n: 3 }, weightMultiplier: 2 },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 1,
    biome: "GREEK",
  },

  // =========================================================
  // EGYPTIAN biome — normal enemies
  // =========================================================
  {
    id: "scarab_swarm",
    name: "Scarab Swarm",
    maxHp: 20,
    speed: 8,
    abilities: [
      { name: "Gnaw", weight: 2, effects: [{ type: "DAMAGE", value: 6 }] },
      {
        name: "Infest",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 3 },
          { type: "APPLY_DEBUFF", value: 4, buff: "POISON" },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "EGYPTIAN",
  },
  {
    id: "sand_guardian",
    name: "Sand Guardian",
    maxHp: 34,
    speed: 2,
    abilities: [
      {
        name: "Sand Crush",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 11 }],
      },
      { name: "Dune Wall", weight: 1, effects: [{ type: "BLOCK", value: 10 }] },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "EGYPTIAN",
  },
  {
    id: "tomb_priest",
    name: "Tomb Priest",
    maxHp: 24,
    speed: 4,
    abilities: [
      {
        name: "Hex",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 5 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        ],
      },
      {
        name: "Solar Lash",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 9 }],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "EGYPTIAN",
  },
  {
    id: "mummy_knight",
    name: "Mummy Knight",
    maxHp: 30,
    speed: 3,
    abilities: [
      {
        name: "Bandage Bind",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 8 },
          { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
        ],
      },
      {
        name: "Ancient Blade",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 10 }],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "EGYPTIAN",
  },
  {
    id: "desert_cobra",
    name: "Desert Cobra",
    maxHp: 22,
    speed: 7,
    abilities: [
      {
        name: "Venom Strike",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 6 },
          { type: "APPLY_DEBUFF", value: 5, buff: "POISON", duration: 0 },
        ],
      },
      {
        name: "Sand Spit",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 4 },
          { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "EGYPTIAN",
  },
  {
    id: "ushabti_servant",
    name: "Ushabti Servant",
    maxHp: 32,
    speed: 2,
    abilities: [
      {
        name: "Stone Fist",
        weight: 2,
        effects: [{ type: "DAMAGE", value: 10 }],
      },
      {
        name: "Funerary Ward",
        weight: 1,
        effects: [{ type: "BLOCK", value: 9 }],
      },
      {
        name: "Servant's Burden",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 7 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "EGYPTIAN",
  },
  {
    id: "anubis_champion",
    name: "Anubis Champion",
    maxHp: 72,
    speed: 4,
    abilities: [
      { name: "Judgment", weight: 1, effects: [{ type: "DAMAGE", value: 18 }] },
      {
        name: "Soul Weighing",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 12 },
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        ],
      },
      {
        name: "Desert Bulwark",
        weight: 1,
        effects: [{ type: "BLOCK", value: 14 }],
      },
    ],
    isBoss: false,
    isElite: true,
    tier: 2,
    biome: "EGYPTIAN",
  },
  {
    id: "sekhmet_chosen",
    name: "Sekhmet's Chosen",
    maxHp: 72,
    speed: 4,
    abilities: [
      {
        name: "Lioness Charge",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 18 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
      },
      {
        name: "Solar Fury",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 12 },
          { type: "DRAIN_INK", value: 4 },
        ],
      },
      {
        name: "Sun's Wrath",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 14 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        ],
      },
      {
        name: "Bloodlust",
        weight: 1,
        effects: [{ type: "BLOCK", value: 13 }],
      },
    ],
    isBoss: false,
    isElite: true,
    tier: 2,
    biome: "EGYPTIAN",
  },
  {
    id: "ra_avatar",
    name: "Avatar of Ra",
    maxHp: 165,
    speed: 4,
    abilities: [
      {
        name: "Sun Spear",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 18 }],
      },
      {
        name: "Blazing Decree",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 14 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
      },
      {
        name: "Solar Barrier",
        weight: 1,
        effects: [{ type: "BLOCK", value: 18 }],
        conditionalWeights: [
          {
            condition: { type: "ENEMY_HP_BELOW_PCT", threshold: 50 },
            weightMultiplier: 3,
          },
          { condition: { type: "ENEMY_HAS_NO_BLOCK" }, weightMultiplier: 2 },
        ],
      },
      {
        name: "Divine Scorch",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 22 },
          { type: "DRAIN_INK", value: 4 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_INK_ABOVE", value: 3 },
            weightMultiplier: 4,
          },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 2,
    biome: "EGYPTIAN",
  },

  // =========================================================
  // EGYPTIAN biome — alternate boss
  // =========================================================
  // Eye of Osiris: block-heavy judgment, ink punishment.
  {
    id: "osiris_eye",
    name: "Eye of Osiris",
    maxHp: 170,
    speed: 2,
    abilities: [
      {
        name: "Feather Judgment",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 15 },
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_INK_ABOVE", value: 3 },
            weightMultiplier: 2,
          },
        ],
      },
      {
        name: "Maat's Decree",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 12 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "WEAK" },
            weightMultiplier: 3,
          },
        ],
      },
      {
        name: "Anubis Seal",
        weight: 1,
        target: "SELF",
        effects: [{ type: "BLOCK", value: 20 }],
        conditionalWeights: [
          { condition: { type: "ENEMY_HAS_NO_BLOCK" }, weightMultiplier: 3 },
          {
            condition: { type: "ENEMY_HP_BELOW_PCT", threshold: 50 },
            weightMultiplier: 2,
          },
        ],
      },
      {
        name: "Soul Drain",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 18 },
          { type: "DRAIN_INK", value: 4 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_INK_ABOVE", value: 3 },
            weightMultiplier: 4,
          },
        ],
      },
      {
        name: "Weighing Strike",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 22 }],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HP_BELOW_PCT", threshold: 40 },
            weightMultiplier: 3,
          },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 2,
    biome: "EGYPTIAN",
  },

  // =========================================================
  // LOVECRAFTIAN biome — normal enemies
  // =========================================================
  {
    id: "cultist_scribe",
    name: "Cultist Scribe",
    maxHp: 22,
    speed: 5,
    abilities: [
      {
        name: "Ritual Cut",
        weight: 2,
        effects: [{ type: "DAMAGE", value: 7 }],
      },
      {
        name: "Mind Fray",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 4 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "LOVECRAFTIAN",
  },
  {
    id: "deep_one",
    name: "Deep One",
    maxHp: 32,
    speed: 3,
    abilities: [
      { name: "Rake", weight: 1, effects: [{ type: "DAMAGE", value: 11 }] },
      {
        name: "Brine Venom",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 5 },
          { type: "APPLY_DEBUFF", value: 5, buff: "POISON" },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "LOVECRAFTIAN",
  },
  {
    id: "shoggoth_spawn",
    name: "Shoggoth Spawn",
    maxHp: 36,
    speed: 2,
    abilities: [
      {
        name: "Amorphous Slam",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 12 }],
      },
      { name: "Absorb", weight: 1, effects: [{ type: "BLOCK", value: 9 }] },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "LOVECRAFTIAN",
  },
  {
    id: "void_tendril",
    name: "Void Tendril",
    maxHp: 26,
    speed: 7,
    abilities: [
      {
        name: "Lash",
        weight: 2,
        effects: [
          { type: "DAMAGE", value: 6 },
          { type: "DRAIN_INK", value: 2 },
        ],
      },
      { name: "Pierce", weight: 1, effects: [{ type: "DAMAGE", value: 9 }] },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "LOVECRAFTIAN",
  },
  {
    id: "star_spawn",
    name: "Star Spawn",
    maxHp: 28,
    speed: 4,
    abilities: [
      {
        name: "Alien Claw",
        weight: 2,
        effects: [{ type: "DAMAGE", value: 9 }],
      },
      {
        name: "Mind Fracture",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 5 },
          { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "LOVECRAFTIAN",
  },
  {
    id: "byakhee",
    name: "Byakhee",
    maxHp: 22,
    speed: 7,
    abilities: [
      {
        name: "Wing Buffet",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 7 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        ],
      },
      {
        name: "Piercing Dive",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 10 }],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "LOVECRAFTIAN",
  },
  {
    id: "elder_hybrid",
    name: "Elder Hybrid",
    maxHp: 74,
    speed: 4,
    abilities: [
      {
        name: "Rend Reality",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 19 }],
      },
      {
        name: "Mind Rot",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 11 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
          { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
        ],
      },
      {
        name: "Abyss Ward",
        weight: 1,
        effects: [{ type: "BLOCK", value: 15 }],
      },
    ],
    isBoss: false,
    isElite: true,
    tier: 2,
    biome: "LOVECRAFTIAN",
  },
  {
    id: "mi_go_surgeon",
    name: "Mi-Go Surgeon",
    maxHp: 72,
    speed: 3,
    abilities: [
      {
        name: "Brain Extract",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 12 },
          { type: "DRAIN_INK", value: 5 },
        ],
      },
      {
        name: "Fungal Spores",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 9 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
          { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
        ],
      },
      {
        name: "Alien Carapace",
        weight: 1,
        effects: [{ type: "BLOCK", value: 16 }],
      },
      {
        name: "Psychic Scalpel",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 14 },
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        ],
      },
    ],
    isBoss: false,
    isElite: true,
    tier: 2,
    biome: "LOVECRAFTIAN",
  },
  {
    id: "nyarlathotep_shard",
    name: "Nyarlathotep Shard",
    maxHp: 168,
    speed: 5,
    abilities: [
      {
        name: "Black Flame",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 20 }],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HP_BELOW_PCT", threshold: 40 },
            weightMultiplier: 2.5,
          },
        ],
      },
      {
        name: "Mad Prophecy",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 13 },
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
          { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
        ],
        conditionalWeights: [
          { condition: { type: "TURN_MULTIPLE", n: 3 }, weightMultiplier: 2.5 },
        ],
      },
      {
        name: "Cosmic Drain",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 16 },
          { type: "DRAIN_INK", value: 6 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_INK_ABOVE", value: 3 },
            weightMultiplier: 4,
          },
        ],
      },
      {
        name: "Void Mantle",
        weight: 1,
        effects: [{ type: "BLOCK", value: 20 }],
        conditionalWeights: [
          { condition: { type: "NO_OTHER_ENEMIES" }, weightMultiplier: 3 },
          { condition: { type: "ENEMY_HAS_NO_BLOCK" }, weightMultiplier: 2 },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 2,
    biome: "LOVECRAFTIAN",
  },

  // =========================================================
  // LOVECRAFTIAN biome — alternate boss
  // =========================================================
  // Shub-Niggurath's Spawn: POISON + summoning + attrition.
  {
    id: "shub_spawn",
    name: "Shub-Niggurath's Spawn",
    maxHp: 175,
    speed: 4,
    abilities: [
      {
        name: "Dark Young Stomp",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 18 }],
        conditionalWeights: [
          { condition: { type: "NO_OTHER_ENEMIES" }, weightMultiplier: 2 },
        ],
      },
      {
        name: "Spore Cloud",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 10 },
          { type: "APPLY_DEBUFF", value: 8, buff: "POISON" },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "POISON" },
            weightMultiplier: 0.3,
          },
        ],
      },
      {
        name: "Spawn Eruption",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 14 },
          { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
        ],
        conditionalWeights: [
          { condition: { type: "TURN_MULTIPLE", n: 4 }, weightMultiplier: 2.5 },
        ],
      },
      {
        name: "Eldritch Veil",
        weight: 1,
        target: "SELF",
        effects: [{ type: "BLOCK", value: 18 }],
        conditionalWeights: [
          { condition: { type: "ENEMY_HAS_NO_BLOCK" }, weightMultiplier: 2 },
          {
            condition: { type: "ENEMY_HP_BELOW_PCT", threshold: 50 },
            weightMultiplier: 3,
          },
        ],
      },
      {
        name: "Festering Touch",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 12 },
          { type: "APPLY_DEBUFF", value: 5, buff: "POISON" },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "POISON" },
            weightMultiplier: 0.3,
          },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 2,
    biome: "LOVECRAFTIAN",
  },

  // =========================================================
  // AZTEC biome — normal enemies
  // =========================================================
  {
    id: "jaguar_warrior",
    name: "Jaguar Warrior",
    maxHp: 24,
    speed: 6,
    abilities: [
      { name: "Claw Rush", weight: 2, effects: [{ type: "DAMAGE", value: 8 }] },
      {
        name: "Pounce",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 6 },
          { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "AZTEC",
  },
  {
    id: "obsidian_priest",
    name: "Obsidian Priest",
    maxHp: 28,
    speed: 4,
    abilities: [
      {
        name: "Blood Rite",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 9 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        ],
      },
      { name: "Sun Guard", weight: 1, effects: [{ type: "BLOCK", value: 10 }] },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "AZTEC",
  },
  {
    id: "eagle_knight",
    name: "Eagle Knight",
    maxHp: 26,
    speed: 7,
    abilities: [
      { name: "Sky Dive", weight: 1, effects: [{ type: "DAMAGE", value: 10 }] },
      {
        name: "Wing Slash",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 6 },
          { type: "DAMAGE", value: 6 },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "AZTEC",
  },
  {
    id: "stone_idol",
    name: "Stone Idol",
    maxHp: 40,
    speed: 1,
    abilities: [
      {
        name: "Temple Slam",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 13 }],
      },
      {
        name: "Obsidian Carapace",
        weight: 1,
        effects: [{ type: "BLOCK", value: 12 }],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "AZTEC",
  },
  {
    id: "blood_cultist",
    name: "Blood Cultist",
    maxHp: 22,
    speed: 5,
    abilities: [
      {
        name: "Sacrificial Slash",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 7 },
          { type: "APPLY_DEBUFF", value: 2, buff: "BLEED", duration: 3 },
        ],
      },
      {
        name: "Ritual Dagger",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 9 }],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "AZTEC",
  },
  {
    id: "tzitzimitl",
    name: "Tzitzimitl",
    maxHp: 28,
    speed: 3,
    abilities: [
      {
        name: "Star Blade",
        weight: 2,
        effects: [{ type: "DAMAGE", value: 10 }],
      },
      {
        name: "Eclipse Cover",
        weight: 1,
        effects: [{ type: "BLOCK", value: 9 }],
      },
      {
        name: "Stellar Crash",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 8 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "AZTEC",
  },
  {
    id: "quetzal_harbinger",
    name: "Quetzal Harbinger",
    maxHp: 76,
    speed: 5,
    abilities: [
      {
        name: "Solar Talon",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 18 }],
      },
      {
        name: "Rite of Fear",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 10 },
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        ],
      },
      {
        name: "Golden Feathers",
        weight: 1,
        effects: [{ type: "BLOCK", value: 15 }],
      },
    ],
    isBoss: false,
    isElite: true,
    tier: 2,
    biome: "AZTEC",
  },
  {
    id: "huitzilopochtli_enforcer",
    name: "Huitzilopochtli's Enforcer",
    maxHp: 74,
    speed: 4,
    abilities: [
      {
        name: "Sun Cleave",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 18 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
      },
      {
        name: "Blood Offering",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 12 },
          { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 4 },
        ],
      },
      {
        name: "War God's Favor",
        weight: 1,
        effects: [{ type: "BLOCK", value: 14 }],
      },
      {
        name: "Sacrificial Rush",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 14 },
          { type: "APPLY_DEBUFF", value: 2, buff: "BLEED", duration: 3 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        ],
      },
    ],
    isBoss: false,
    isElite: true,
    tier: 2,
    biome: "AZTEC",
  },
  {
    id: "tezcatlipoca_echo",
    name: "Tezcatlipoca Echo",
    maxHp: 172,
    speed: 4,
    abilities: [
      {
        name: "Mirror Slash",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 19 }],
        conditionalWeights: [
          { condition: { type: "ENEMY_HAS_NO_BLOCK" }, weightMultiplier: 2 },
        ],
      },
      {
        name: "Dark Sun",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 15 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
          { type: "ADD_CARD_TO_DRAW", value: 1, cardId: "ink_burn" },
        ],
        conditionalWeights: [
          { condition: { type: "TURN_MULTIPLE", n: 3 }, weightMultiplier: 2 },
        ],
      },
      {
        name: "Obsidian Hunger",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 17 },
          { type: "DRAIN_INK", value: 5 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_INK_ABOVE", value: 3 },
            weightMultiplier: 4,
          },
        ],
      },
      {
        name: "Night Mantle",
        weight: 1,
        effects: [{ type: "BLOCK", value: 20 }],
        conditionalWeights: [
          {
            condition: { type: "ENEMY_HP_BELOW_PCT", threshold: 50 },
            weightMultiplier: 3,
          },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 2,
    biome: "AZTEC",
  },

  // =========================================================
  // AZTEC biome — alternate boss
  // =========================================================
  // Quetzalcoatl's Wrath: fast, BLEED, punishes low HP.
  {
    id: "quetzalcoatl_wrath",
    name: "Quetzalcoatl's Wrath",
    maxHp: 162,
    speed: 6,
    abilities: [
      {
        name: "Sky Strike",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 16 }],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HP_BELOW_PCT", threshold: 40 },
            weightMultiplier: 2,
          },
        ],
      },
      {
        name: "Feathered Slash",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 12 },
          { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 4 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "BLEED" },
            weightMultiplier: 0.3,
          },
        ],
      },
      {
        name: "Wind Scorch",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 14 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "BLEED" },
            weightMultiplier: 2,
          },
        ],
      },
      {
        name: "Serpent Coil",
        weight: 1,
        target: "SELF",
        effects: [{ type: "BLOCK", value: 16 }],
        conditionalWeights: [
          {
            condition: { type: "ENEMY_HP_BELOW_PCT", threshold: 50 },
            weightMultiplier: 3,
          },
          { condition: { type: "ENEMY_HAS_NO_BLOCK" }, weightMultiplier: 2 },
        ],
      },
      {
        name: "Solar Dive",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 22 }],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HP_BELOW_PCT", threshold: 30 },
            weightMultiplier: 3,
          },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 2,
    biome: "AZTEC",
  },

  // =========================================================
  // CELTIC biome — normal enemies
  // =========================================================
  {
    id: "sidhe_raider",
    name: "Sidhe Raider",
    maxHp: 22,
    speed: 7,
    abilities: [
      {
        name: "Glamour Cut",
        weight: 2,
        effects: [{ type: "DAMAGE", value: 7 }],
      },
      {
        name: "Hexed Dart",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 4 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "CELTIC",
  },
  {
    id: "bog_beast",
    name: "Bog Beast",
    maxHp: 38,
    speed: 2,
    abilities: [
      {
        name: "Mire Slam",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 12 }],
      },
      {
        name: "Toxic Mud",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 6 },
          { type: "APPLY_DEBUFF", value: 4, buff: "POISON" },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "CELTIC",
  },
  {
    id: "druid_apprentice",
    name: "Druid Apprentice",
    maxHp: 26,
    speed: 4,
    abilities: [
      { name: "Root Bind", weight: 1, effects: [{ type: "DAMAGE", value: 8 }] },
      { name: "Barkskin", weight: 1, effects: [{ type: "BLOCK", value: 10 }] },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "CELTIC",
  },
  {
    id: "amber_hound",
    name: "Amber Hound",
    maxHp: 24,
    speed: 8,
    abilities: [
      {
        name: "Razor Fang",
        weight: 2,
        effects: [{ type: "DAMAGE", value: 8 }],
      },
      {
        name: "Howl",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 5 },
          { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "CELTIC",
  },
  {
    id: "morrigan_wisp",
    name: "Morrigan's Wisp",
    maxHp: 18,
    speed: 8,
    abilities: [
      {
        name: "Cursed Flicker",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 5 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        ],
      },
      {
        name: "Soul Drain",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 6 },
          { type: "DRAIN_INK", value: 2 },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "CELTIC",
  },
  {
    id: "briar_beast",
    name: "Briar Beast",
    maxHp: 34,
    speed: 2,
    abilities: [
      {
        name: "Thorned Slam",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 10 },
          { type: "APPLY_BUFF", value: 2, buff: "THORNS" },
        ],
      },
      {
        name: "Root Cage",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 8 },
          { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
        ],
      },
      {
        name: "Bark Armor",
        weight: 1,
        effects: [{ type: "BLOCK", value: 10 }],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "CELTIC",
  },
  {
    id: "morrigan_chosen",
    name: "Morrigan's Chosen",
    maxHp: 74,
    speed: 5,
    abilities: [
      { name: "War Crow", weight: 1, effects: [{ type: "DAMAGE", value: 17 }] },
      {
        name: "Battle Omen",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 11 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
      },
      {
        name: "Feather Guard",
        weight: 1,
        effects: [{ type: "BLOCK", value: 14 }],
      },
    ],
    isBoss: false,
    isElite: true,
    tier: 2,
    biome: "CELTIC",
  },
  {
    id: "wild_hunt_hound",
    name: "Wild Hunt Hound",
    maxHp: 70,
    speed: 6,
    abilities: [
      {
        name: "Hunt Strike",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 17 },
          { type: "APPLY_DEBUFF", value: 2, buff: "BLEED", duration: 4 },
        ],
      },
      {
        name: "Fae Howl",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 11 },
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        ],
      },
      {
        name: "Phantom Dash",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 13 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
      },
      {
        name: "Ethereal Fur",
        weight: 1,
        effects: [{ type: "BLOCK", value: 13 }],
      },
    ],
    isBoss: false,
    isElite: true,
    tier: 2,
    biome: "CELTIC",
  },
  {
    id: "dagda_shadow",
    name: "Dagda's Shadow",
    maxHp: 166,
    speed: 3,
    abilities: [
      {
        name: "Club of Ruin",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 21 }],
      },
      {
        name: "Cauldron Steam",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 13 },
          { type: "APPLY_DEBUFF", value: 5, buff: "POISON" },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "POISON" },
            weightMultiplier: 0.4,
          },
        ],
      },
      {
        name: "Ancient Feast",
        weight: 1,
        target: "SELF",
        effects: [
          { type: "BLOCK", value: 20 },
          { type: "HEAL", value: 12 },
        ],
        conditionalWeights: [
          {
            condition: { type: "ENEMY_HP_BELOW_PCT", threshold: 50 },
            weightMultiplier: 3,
          },
          { condition: { type: "ENEMY_HAS_NO_BLOCK" }, weightMultiplier: 2 },
        ],
      },
      {
        name: "Famine Curse",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 16 },
          { type: "DRAIN_INK", value: 4 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_INK_ABOVE", value: 3 },
            weightMultiplier: 4,
          },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 2,
    biome: "CELTIC",
  },

  // =========================================================
  // CELTIC biome — alternate boss
  // =========================================================
  // Cernunnos's Shade: THORNS + BLEED, nature fury.
  {
    id: "cernunnos_shade",
    name: "Cernunnos's Shade",
    maxHp: 168,
    speed: 4,
    abilities: [
      {
        name: "Antler Gore",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 17 }],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HP_BELOW_PCT", threshold: 40 },
            weightMultiplier: 2,
          },
        ],
      },
      {
        name: "Wild Thorns",
        weight: 1,
        target: "SELF",
        effects: [
          { type: "APPLY_BUFF", value: 5, buff: "THORNS" },
          { type: "BLOCK", value: 10 },
        ],
        conditionalWeights: [
          { condition: { type: "ENEMY_HAS_NO_BLOCK" }, weightMultiplier: 2.5 },
        ],
      },
      {
        name: "Primal Roar",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 13 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
        conditionalWeights: [
          { condition: { type: "TURN_MULTIPLE", n: 3 }, weightMultiplier: 2 },
        ],
      },
      {
        name: "Forest Mist",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 11 },
          { type: "APPLY_DEBUFF", value: 2, buff: "BLEED", duration: 4 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "BLEED" },
            weightMultiplier: 0.4,
          },
        ],
      },
      {
        name: "Ancient Wrath",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 21 }],
        conditionalWeights: [
          {
            condition: { type: "ENEMY_HP_BELOW_PCT", threshold: 50 },
            weightMultiplier: 2,
          },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 2,
    biome: "CELTIC",
  },

  // =========================================================
  // RUSSIAN biome — normal enemies
  // =========================================================
  {
    id: "winter_wolf",
    name: "Winter Wolf",
    maxHp: 24,
    speed: 7,
    abilities: [
      { name: "Ice Bite", weight: 2, effects: [{ type: "DAMAGE", value: 8 }] },
      {
        name: "Chill Fang",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 5 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "RUSSIAN",
  },
  {
    id: "czar_guard",
    name: "Czar Guard",
    maxHp: 34,
    speed: 3,
    abilities: [
      {
        name: "Saber Slash",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 11 }],
      },
      { name: "Parry", weight: 1, effects: [{ type: "BLOCK", value: 10 }] },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "RUSSIAN",
  },
  {
    id: "frost_witch",
    name: "Frost Witch",
    maxHp: 26,
    speed: 5,
    abilities: [
      {
        name: "Ice Hex",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 7 },
          { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
        ],
      },
      {
        name: "Snow Spike",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 10 }],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "RUSSIAN",
  },
  {
    id: "iron_cossack",
    name: "Iron Cossack",
    maxHp: 30,
    speed: 4,
    abilities: [
      {
        name: "Lance Thrust",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 10 }],
      },
      {
        name: "War Cry",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 6 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "RUSSIAN",
  },
  {
    id: "kikimora",
    name: "Kikimora",
    maxHp: 24,
    speed: 5,
    abilities: [
      {
        name: "Nightmare Scratch",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 7 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        ],
      },
      {
        name: "Bad Omen",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 5 },
          { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "RUSSIAN",
  },
  {
    id: "rusalka",
    name: "Rusalka",
    maxHp: 20,
    speed: 6,
    abilities: [
      {
        name: "Drowning Grasp",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 8 },
          { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
        ],
      },
      {
        name: "Siren Song",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 5 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "RUSSIAN",
  },
  {
    id: "koschei_herald",
    name: "Koschei Herald",
    maxHp: 76,
    speed: 4,
    abilities: [
      {
        name: "Bone Lance",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 18 }],
      },
      {
        name: "Death Whisper",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 10 },
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        ],
      },
      {
        name: "Undying Guard",
        weight: 1,
        effects: [{ type: "BLOCK", value: 15 }],
      },
    ],
    isBoss: false,
    isElite: true,
    tier: 2,
    biome: "RUSSIAN",
  },
  {
    id: "domovoi_titan",
    name: "Domovoi Titan",
    maxHp: 78,
    speed: 2,
    abilities: [
      {
        name: "Hearth Smash",
        weight: 2,
        effects: [{ type: "DAMAGE", value: 18 }],
      },
      {
        name: "Frost Stomp",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 12 },
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
          { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
        ],
      },
      {
        name: "Guardian's Wall",
        weight: 1,
        effects: [{ type: "BLOCK", value: 16 }],
      },
      {
        name: "Winter's Grasp",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 14 },
          { type: "DRAIN_INK", value: 4 },
        ],
      },
    ],
    isBoss: false,
    isElite: true,
    tier: 2,
    biome: "RUSSIAN",
  },
  {
    id: "baba_yaga_hut",
    name: "Baba Yaga's Hut",
    maxHp: 170,
    speed: 3,
    abilities: [
      {
        name: "Stomping Legs",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 20 }],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HP_BELOW_PCT", threshold: 40 },
            weightMultiplier: 2.5,
          },
        ],
      },
      {
        name: "Witchfire",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 14 },
          { type: "APPLY_DEBUFF", value: 5, buff: "POISON" },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "POISON" },
            weightMultiplier: 0.4,
          },
        ],
      },
      {
        name: "Bone Fence",
        weight: 1,
        effects: [{ type: "BLOCK", value: 19 }],
        conditionalWeights: [
          { condition: { type: "ENEMY_HAS_NO_BLOCK" }, weightMultiplier: 3 },
        ],
      },
      {
        name: "Soul Stew",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 17 },
          { type: "DRAIN_INK", value: 5 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_INK_ABOVE", value: 3 },
            weightMultiplier: 4,
          },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 2,
    biome: "RUSSIAN",
  },

  // =========================================================
  // RUSSIAN biome — alternate boss
  // =========================================================
  // Koschei the Deathless: hard to kill, heavy hits, bone army.
  {
    id: "koschei_deathless",
    name: "Koschei the Deathless",
    maxHp: 180,
    speed: 2,
    abilities: [
      {
        name: "Deathless Blow",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 22 }],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HP_BELOW_PCT", threshold: 40 },
            weightMultiplier: 2.5,
          },
        ],
      },
      {
        name: "Bone Chain",
        weight: 1,
        target: "PLAYER",
        isDisruption: true,
        effects: [
          { type: "DAMAGE", value: 14 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
          { type: "INCREASE_CARD_COST_NEXT_TURN", value: 1 },
        ],
        conditionalWeights: [
          { condition: { type: "TURN_MULTIPLE", n: 3 }, weightMultiplier: 2 },
        ],
      },
      {
        name: "Immortal Ward",
        weight: 1,
        target: "SELF",
        effects: [{ type: "BLOCK", value: 22 }],
        conditionalWeights: [
          {
            condition: { type: "ENEMY_HP_BELOW_PCT", threshold: 50 },
            weightMultiplier: 4,
          },
          { condition: { type: "ENEMY_HAS_NO_BLOCK" }, weightMultiplier: 2 },
        ],
      },
      {
        name: "Frozen Soul",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 16 },
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
          { type: "DRAIN_INK", value: 4 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_INK_ABOVE", value: 3 },
            weightMultiplier: 3,
          },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 2,
    biome: "RUSSIAN",
  },

  // =========================================================
  // AFRICAN biome — normal enemies
  // =========================================================
  {
    id: "hyena_pack",
    name: "Hyena Pack",
    maxHp: 22,
    speed: 8,
    abilities: [
      { name: "Pack Bite", weight: 2, effects: [{ type: "DAMAGE", value: 7 }] },
      {
        name: "Hamstring",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 5 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "AFRICAN",
  },
  {
    id: "mask_hunter",
    name: "Mask Hunter",
    maxHp: 28,
    speed: 5,
    abilities: [
      {
        name: "Spear Jab",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 10 }],
      },
      {
        name: "Ancestral Fear",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 6 },
          { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "AFRICAN",
  },
  {
    id: "baobab_giant",
    name: "Baobab Giant",
    maxHp: 40,
    speed: 1,
    abilities: [
      {
        name: "Trunk Slam",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 13 }],
      },
      {
        name: "Root Armor",
        weight: 1,
        effects: [{ type: "BLOCK", value: 12 }],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "AFRICAN",
  },
  {
    id: "serpent_oracle",
    name: "Serpent Oracle",
    maxHp: 26,
    speed: 6,
    abilities: [
      {
        name: "Venom Read",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 6 },
          { type: "APPLY_DEBUFF", value: 5, buff: "POISON" },
        ],
      },
      {
        name: "Oracle Lash",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 9 }],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "AFRICAN",
  },
  {
    id: "impundulu",
    name: "Impundulu",
    maxHp: 20,
    speed: 8,
    abilities: [
      {
        name: "Lightning Dive",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 8 },
          { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
        ],
      },
      {
        name: "Storm Talon",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 6 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 1 },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "AFRICAN",
  },
  {
    id: "tokoloshe",
    name: "Tokoloshe",
    maxHp: 26,
    speed: 5,
    abilities: [
      {
        name: "Night Terror",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 7 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        ],
      },
      {
        name: "Creeping Dread",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 5 },
          { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    tier: 1,
    biome: "AFRICAN",
  },
  {
    id: "legba_emissary",
    name: "Legba Emissary",
    maxHp: 75,
    speed: 5,
    abilities: [
      {
        name: "Crossroad Spear",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 18 }],
      },
      {
        name: "Gate Curse",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 10 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
      },
      {
        name: "Mask Barrier",
        weight: 1,
        effects: [{ type: "BLOCK", value: 15 }],
      },
    ],
    isBoss: false,
    isElite: true,
    tier: 2,
    biome: "AFRICAN",
  },
  {
    id: "oya_harbinger",
    name: "Oya's Harbinger",
    maxHp: 76,
    speed: 5,
    abilities: [
      {
        name: "Storm Spear",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 17 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
      },
      {
        name: "Winds of Change",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 12 },
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        ],
      },
      {
        name: "Tempest Shield",
        weight: 1,
        effects: [{ type: "BLOCK", value: 15 }],
      },
      {
        name: "Lightning Surge",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 14 },
          { type: "DRAIN_INK", value: 4 },
        ],
      },
    ],
    isBoss: false,
    isElite: true,
    tier: 2,
    biome: "AFRICAN",
  },
  {
    id: "soundiata_spirit",
    name: "Soundiata Spirit",
    maxHp: 169,
    speed: 4,
    abilities: [
      {
        name: "Lion King's Blow",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 20 }],
        conditionalWeights: [
          { condition: { type: "NO_OTHER_ENEMIES" }, weightMultiplier: 2.5 },
        ],
      },
      {
        name: "Epic Command",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 14 },
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        ],
        conditionalWeights: [
          { condition: { type: "ALLY_ALIVE" }, weightMultiplier: 4 },
        ],
      },
      {
        name: "Griot's Shield",
        weight: 1,
        effects: [{ type: "BLOCK", value: 20 }],
        conditionalWeights: [
          { condition: { type: "ALLY_ALIVE" }, weightMultiplier: 3 },
          { condition: { type: "ENEMY_HAS_NO_BLOCK" }, weightMultiplier: 2 },
        ],
      },
      {
        name: "Royal Tribute",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 16 },
          { type: "DRAIN_INK", value: 5 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_INK_ABOVE", value: 3 },
            weightMultiplier: 3.5,
          },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 2,
    biome: "AFRICAN",
  },
  // =========================================================
  // AFRICAN biome — alternate boss
  // =========================================================
  // Anansi the Weaver: traps, curses, hand disruption, multi-debuff.
  {
    id: "anansi_weaver",
    name: "Anansi the Weaver",
    maxHp: 162,
    speed: 6,
    abilities: [
      {
        name: "Web Trap",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 9 },
          { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "hexed_parchment" },
        ],
        conditionalWeights: [
          { condition: { type: "TURN_MULTIPLE", n: 3 }, weightMultiplier: 2.5 },
        ],
      },
      {
        name: "Silk Snare",
        weight: 1,
        target: "PLAYER",
        isDisruption: true,
        effects: [
          { type: "DAMAGE", value: 11 },
          { type: "FREEZE_HAND_CARDS", value: 1 },
        ],
        conditionalWeights: [
          {
            condition: { type: "ENEMY_HP_BELOW_PCT", threshold: 50 },
            weightMultiplier: 2,
          },
        ],
      },
      {
        name: "Trickster's Bite",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 14 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HP_BELOW_PCT", threshold: 40 },
            weightMultiplier: 2,
          },
        ],
      },
      {
        name: "Ancestral Weave",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 12 },
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
          { type: "DRAIN_INK", value: 3 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_INK_ABOVE", value: 3 },
            weightMultiplier: 3,
          },
        ],
      },
      {
        name: "Story's End",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 20 }],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HP_BELOW_PCT", threshold: 35 },
            weightMultiplier: 3,
          },
          { condition: { type: "NO_OTHER_ENEMIES" }, weightMultiplier: 2 },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 2,
    biome: "AFRICAN",
  },
];

function makeFallbackAbilityByBiome(
  biome: RawEnemyDefinition["biome"]
): EnemyAbility {
  switch (biome) {
    case "LIBRARY":
      return {
        name: "Shredding Volley",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 6 }],
      };
    case "VIKING":
      return {
        name: "War Cry",
        weight: 1,
        target: "SELF",
        effects: [{ type: "APPLY_BUFF", value: 1, buff: "STRENGTH" }],
      };
    case "GREEK":
      return {
        name: "Aegis Guard",
        weight: 1,
        target: "SELF",
        effects: [{ type: "BLOCK", value: 8 }],
      };
    case "EGYPTIAN":
      return {
        name: "Sand Hex",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        ],
      };
    case "LOVECRAFTIAN":
      return {
        name: "Mind Fray",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 4 },
          { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
        ],
      };
    case "AZTEC":
      return {
        name: "Blood Rite",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 6 }],
      };
    case "CELTIC":
      return {
        name: "Thorn Guard",
        weight: 1,
        target: "SELF",
        effects: [{ type: "BLOCK", value: 8 }],
      };
    case "RUSSIAN":
      return {
        name: "Cold Snap",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 5 },
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 1 },
        ],
      };
    case "AFRICAN":
      return {
        name: "Rallying Beat",
        weight: 1,
        target: "SELF",
        effects: [{ type: "APPLY_BUFF", value: 1, buff: "STRENGTH" }],
      };
  }
}

function ensureMinimumEnemyAbilityVariety(
  defs: RawEnemyDefinition[]
): RawEnemyDefinition[] {
  return defs.map((def) => {
    if (def.abilities.length >= 3) return def;
    return {
      ...def,
      abilities: [...def.abilities, makeFallbackAbilityByBiome(def.biome)],
    };
  });
}

const DISRUPTION_EFFECT_TYPES = new Set([
  "FREEZE_HAND_CARDS",
  "NEXT_DRAW_TO_DISCARD_THIS_TURN",
  "DISABLE_INK_POWER_THIS_TURN",
  "INCREASE_CARD_COST_THIS_TURN",
  "INCREASE_CARD_COST_NEXT_TURN",
  "REDUCE_DRAW_THIS_TURN",
  "REDUCE_DRAW_NEXT_TURN",
  "FORCE_DISCARD_RANDOM",
]);

function hasOffensivePressure(ability: EnemyAbility): boolean {
  return ability.effects.some(
    (e) =>
      e.type === "DAMAGE" || e.type === "DRAIN_INK" || e.type === "APPLY_DEBUFF"
  );
}

function inferRole(def: RawEnemyDefinition): EnemyRole {
  if (def.isBoss) return "HYBRID";

  const offensiveCount = def.abilities.filter(hasOffensivePressure).length;
  const controlCount = def.abilities.filter((a) =>
    a.effects.some((e) => DISRUPTION_EFFECT_TYPES.has(e.type))
  ).length;
  const supportCount = def.abilities.filter((a) =>
    a.effects.some(
      (e) => e.type === "BLOCK" || e.type === "HEAL" || e.type === "APPLY_BUFF"
    )
  ).length;

  if (controlCount >= 1 && offensiveCount >= 1) return "CONTROL";
  if (supportCount >= 2 && offensiveCount <= 2) return "SUPPORT";
  if (supportCount >= 1 && offensiveCount <= 1) return "TANK";
  if (offensiveCount >= 3) return "ASSAULT";
  return "HYBRID";
}

function makeBiomeSignatureAbility(
  def: RawEnemyDefinition
): EnemyAbility | null {
  const role = inferRole(def);
  switch (def.biome) {
    case "LIBRARY":
      return role === "CONTROL" || role === "SUPPORT"
        ? {
            name: "Binding Footnote",
            weight: 1,
            target: "PLAYER",
            isDisruption: true,
            effects: [
              { type: "DAMAGE", value: 4 },
              { type: "NEXT_DRAW_TO_DISCARD_THIS_TURN", value: 1 },
            ],
          }
        : null;
    case "VIKING":
      return role === "ASSAULT"
        ? {
            name: "Berserk Tempo",
            weight: 1,
            target: "PLAYER",
            isDisruption: true,
            effects: [
              { type: "DAMAGE", value: 7 },
              { type: "INCREASE_CARD_COST_THIS_TURN", value: 1 },
            ],
          }
        : null;
    case "GREEK":
      return role === "TANK" || role === "HYBRID"
        ? {
            name: "Aegis Oath",
            weight: 1,
            target: "SELF",
            isDisruption: true,
            effects: [
              { type: "BLOCK", value: 8 },
              { type: "INCREASE_CARD_COST_THIS_TURN", value: 1 },
            ],
          }
        : null;
    case "EGYPTIAN":
      return role === "CONTROL" || role === "SUPPORT"
        ? {
            name: "Burden of Sand",
            weight: 1,
            target: "PLAYER",
            isDisruption: true,
            effects: [
              { type: "DAMAGE", value: 5 },
              { type: "REDUCE_DRAW_THIS_TURN", value: 1 },
            ],
          }
        : null;
    case "LOVECRAFTIAN":
      return {
        name: "Mind Freeze",
        weight: 1,
        target: "PLAYER",
        isDisruption: true,
        effects: [
          { type: "DAMAGE", value: 4 },
          { type: "FREEZE_HAND_CARDS", value: 2 },
        ],
      };
    case "AZTEC":
      return role === "ASSAULT" || role === "HYBRID"
        ? {
            name: "Ritual Tax",
            weight: 1,
            target: "PLAYER",
            isDisruption: true,
            effects: [
              { type: "DAMAGE", value: 6 },
              { type: "INCREASE_CARD_COST_THIS_TURN", value: 1 },
            ],
          }
        : null;
    case "CELTIC":
      return role === "SUPPORT" || role === "TANK"
        ? {
            name: "Bramble Ward",
            weight: 1,
            target: "SELF",
            effects: [
              { type: "BLOCK", value: 9 },
              { type: "APPLY_BUFF", value: 1, buff: "THORNS" },
            ],
          }
        : null;
    case "RUSSIAN":
      return {
        name: "Whiteout",
        weight: 1,
        target: "PLAYER",
        isDisruption: true,
        effects: [
          { type: "DAMAGE", value: 5 },
          { type: "REDUCE_DRAW_THIS_TURN", value: 1 },
        ],
      };
    case "AFRICAN":
      return {
        name: "War Chorus",
        weight: role === "SUPPORT" || role === "CONTROL" ? 2 : 1,
        target: "PLAYER",
        isDisruption: true,
        effects: [
          { type: "DAMAGE", value: 5 },
          {
            type: "DISABLE_INK_POWER_THIS_TURN",
            value: 1,
            inkPower: "REWRITE",
          },
        ],
      };
  }
}

function applyBiomeCombatSignatures(
  defs: RawEnemyDefinition[]
): RawEnemyDefinition[] {
  return defs.map((def) => {
    const hasDisruption = def.abilities.some((ability) =>
      ability.effects.some((e) => DISRUPTION_EFFECT_TYPES.has(e.type))
    );
    if (hasDisruption) return def;

    const signature = makeBiomeSignatureAbility(def);
    if (!signature) return def;

    return {
      ...def,
      abilities: [...def.abilities, signature],
    };
  });
}

const SPLIT_ASSAULT_NAME = "Split Assault";
const PREDATOR_FORMATION_NAME = "Predator Formation";
const DOMINION_SWEEP_NAME = "Dominion Sweep";
const ALLY_RECKONING_NAME = "Ally Reckoning";

function hasAbilityNamed(def: RawEnemyDefinition, name: string): boolean {
  return def.abilities.some((a) => a.name === name);
}

function makeSplitAssaultAbility(): EnemyAbility {
  return {
    name: SPLIT_ASSAULT_NAME,
    weight: 1,
    target: "PLAYER",
    effects: [{ type: "DAMAGE", value: 7 }],
  };
}

function makePredatorFormationAbility(): EnemyAbility {
  return {
    name: PREDATOR_FORMATION_NAME,
    weight: 1,
    target: "PLAYER",
    effects: [
      { type: "DAMAGE", value: 11 },
      { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 1 },
    ],
  };
}

function makeDominionSweepAbility(): EnemyAbility {
  return {
    name: DOMINION_SWEEP_NAME,
    weight: 1,
    target: "PLAYER",
    effects: [
      { type: "DAMAGE", value: 16 },
      { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
    ],
  };
}

function makeAllyReckoningAbility(): EnemyAbility {
  return {
    name: ALLY_RECKONING_NAME,
    weight: 1,
    target: "PLAYER",
    effects: [
      { type: "DAMAGE", value: 12 },
      { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
    ],
  };
}

function applyAllyCounterplayAbilities(
  defs: RawEnemyDefinition[]
): RawEnemyDefinition[] {
  const normalByBiome = new Set<RawEnemyDefinition["biome"]>();
  const eliteByBiome = new Set<RawEnemyDefinition["biome"]>();

  return defs.map((def) => {
    const role = inferRole(def);
    const nextAbilities = [...def.abilities];

    if (
      !def.isBoss &&
      !def.isElite &&
      !normalByBiome.has(def.biome) &&
      role !== "SUPPORT" &&
      !hasAbilityNamed(def, SPLIT_ASSAULT_NAME)
    ) {
      nextAbilities.push(makeSplitAssaultAbility());
      normalByBiome.add(def.biome);
    }

    if (
      def.isElite &&
      !eliteByBiome.has(def.biome) &&
      role !== "SUPPORT" &&
      !hasAbilityNamed(def, PREDATOR_FORMATION_NAME)
    ) {
      nextAbilities.push(makePredatorFormationAbility());
      eliteByBiome.add(def.biome);
    }

    if (def.isBoss) {
      if (!hasAbilityNamed(def, DOMINION_SWEEP_NAME)) {
        nextAbilities.push(makeDominionSweepAbility());
      }
      if (!hasAbilityNamed(def, ALLY_RECKONING_NAME)) {
        nextAbilities.push(makeAllyReckoningAbility());
      }
    }

    return { ...def, abilities: nextAbilities };
  });
}

function assignEnemyRoles(defs: RawEnemyDefinition[]): EnemyDefinition[] {
  return defs.map((def) => ({ ...def, role: inferRole(def) }));
}

export const enemyDefinitions: EnemyDefinition[] = assignEnemyRoles(
  ensureMinimumEnemyAbilityVariety(
    applyAllyCounterplayAbilities(
      applyBiomeCombatSignatures(baseEnemyDefinitions)
    )
  )
);
