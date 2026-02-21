import type { AllyDefinition } from "../schemas/entities";

export const allyDefinitions: AllyDefinition[] = [
  {
    id: "scribe_apprentice",
    name: "Scribe Apprentice",
    maxHp: 24,
    speed: 7,
    abilities: [
      {
        name: "Paper Volley",
        weight: 1,
        target: "ALL_ENEMIES",
        effects: [{ type: "DAMAGE", value: 5 }],
      },
      {
        name: "Ink Advice",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "HEAL", value: 4 },
          { type: "GAIN_INK", value: 1 },
        ],
      },
    ],
  },
  {
    id: "ward_knight",
    name: "Ward Knight",
    maxHp: 34,
    speed: 3,
    abilities: [
      {
        name: "Shielded Slash",
        weight: 1,
        target: "LOWEST_HP_ENEMY",
        effects: [{ type: "DAMAGE", value: 9 }],
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
    maxHp: 18,
    speed: 9,
    abilities: [
      {
        name: "Nibble",
        weight: 1,
        target: "LOWEST_HP_ENEMY",
        effects: [{ type: "DAMAGE", value: 6 }],
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
