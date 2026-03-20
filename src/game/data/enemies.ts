import type { EnemyAbility, EnemyDefinition } from "../schemas/entities";
import type { EnemyRole } from "../schemas/enums";
import { bossEnemyDefinitions } from "./enemy-bosses";
import type { RawEnemyDefinition } from "./enemy-bosses/types";

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
          { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "shrouded_omen" },
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
        name: "Armor Shatter",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 2 },
          { type: "DAMAGE_PER_TARGET_BLOCK", value: 2 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_BLOCK_ABOVE", value: 12 },
            weightMultiplier: 4,
          },
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
    id: "apep_scion",
    name: "Apep Scion",
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
        name: "Chaos Coil",
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
    id: "wadjet_guardian",
    name: "Wadjet Guardian",
    maxHp: 30,
    speed: 3,
    abilities: [
      {
        name: "Uraeus Ward",
        weight: 2,
        effects: [{ type: "BLOCK", value: 9 }],
      },
      {
        name: "Cobra Retaliation",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 7 },
          { type: "APPLY_BUFF", value: 2, buff: "THORNS" },
        ],
      },
      {
        name: "Royal Coil",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 5 },
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
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
          { type: "DAMAGE", value: 2 },
          { type: "DAMAGE_PER_TARGET_BLOCK", value: 2 },
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_BLOCK_ABOVE", value: 10 },
            weightMultiplier: 4,
          },
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
    id: "flayed_cultist",
    name: "Flayed Cultist",
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
    id: "snow_maiden",
    name: "Snow Maiden",
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
  ...bossEnemyDefinitions,
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

const builtEnemyDefinitions = assignEnemyRoles(
  ensureMinimumEnemyAbilityVariety(
    applyAllyCounterplayAbilities(
      applyBiomeCombatSignatures(baseEnemyDefinitions)
    )
  )
);

export const enemyDefinitions: EnemyDefinition[] = builtEnemyDefinitions;
