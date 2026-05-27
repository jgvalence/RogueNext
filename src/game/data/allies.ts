import type { AllyDefinition } from "../schemas/entities";

export const allyDefinitions: AllyDefinition[] = [
  {
    id: "scribe_apprentice",
    name: "Scribe Apprentice",
    maxHp: 20,
    speed: 7,
    abilities: [
      {
        name: "Paper Volley",
        weight: 1,
        target: "ALL_ENEMIES",
        effects: [{ type: "DAMAGE", value: 4 }],
      },
      {
        name: "Ink Advice",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "HEAL", value: 2 },
          { type: "GAIN_INK", value: 1 },
        ],
      },
    ],
  },
  {
    id: "ward_knight",
    name: "Ward Knight",
    maxHp: 28,
    speed: 3,
    abilities: [
      {
        name: "Shielded Slash",
        weight: 1,
        target: "LOWEST_HP_ENEMY",
        effects: [{ type: "DAMAGE", value: 6 }],
      },
      {
        name: "Battle Lesson",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "GAIN_FOCUS", value: 1 }],
      },
    ],
  },
  {
    id: "ink_familiar",
    name: "Ink Familiar",
    maxHp: 14,
    speed: 9,
    abilities: [
      {
        name: "Nibble",
        weight: 1,
        target: "LOWEST_HP_ENEMY",
        effects: [{ type: "DAMAGE", value: 4 }],
      },
      {
        name: "Quick Notes",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DRAW_CARDS", value: 1 }],
      },
    ],
  },
  {
    id: "margin_oracle",
    name: "Margin Oracle",
    maxHp: 16,
    speed: 6,
    abilities: [
      {
        name: "Omen",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DRAW_CARDS", value: 1 }],
      },
      {
        name: "Clear Sight",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "GAIN_FOCUS", value: 1 }],
      },
    ],
  },
  {
    id: "index_raven",
    name: "Index Raven",
    maxHp: 15,
    speed: 8,
    abilities: [
      {
        name: "Annotated Beak",
        weight: 1,
        target: "LOWEST_HP_ENEMY",
        effects: [
          { type: "DAMAGE", value: 3 },
          { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE" },
        ],
      },
      {
        name: "Troubling Cry",
        weight: 1,
        target: "LOWEST_HP_ENEMY",
        effects: [{ type: "APPLY_DEBUFF", value: 1, buff: "WEAK" }],
      },
    ],
  },
  {
    id: "copyist_mummy",
    name: "Copyist Mummy",
    maxHp: 24,
    speed: 4,
    abilities: [
      {
        name: "Dry Bandage",
        weight: 1,
        target: "LOWEST_HP_ENEMY",
        effects: [{ type: "APPLY_DEBUFF", value: 4, buff: "BLEED" }],
      },
      {
        name: "Slow Rite",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "HEAL", value: 3 }],
      },
    ],
  },
  {
    id: "venom_familiar",
    name: "Venom Familiar",
    maxHp: 14,
    speed: 9,
    abilities: [
      {
        name: "Black Bite",
        weight: 1,
        target: "LOWEST_HP_ENEMY",
        effects: [
          { type: "DAMAGE", value: 4 },
          { type: "APPLY_DEBUFF", value: 2, buff: "POISON" },
        ],
      },
      {
        name: "Restless Twitch",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "GAIN_ENERGY", value: 1 }],
      },
    ],
  },
  {
    id: "forbidden_archivist",
    name: "Forbidden Archivist",
    maxHp: 12,
    speed: 5,
    abilities: [
      {
        name: "Forbidden Page",
        weight: 1,
        target: "ALL_ENEMIES",
        effects: [{ type: "DAMAGE", value: 6 }],
      },
      {
        name: "Risky Note",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "GAIN_INK", value: 2 }],
      },
    ],
  },
];
