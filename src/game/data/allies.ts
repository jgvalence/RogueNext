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
];
