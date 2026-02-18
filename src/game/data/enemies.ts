import type { EnemyDefinition } from "../schemas/entities";

export const enemyDefinitions: EnemyDefinition[] = [
  {
    id: "ink_slime",
    name: "Ink Slime",
    maxHp: 14,
    speed: 2,
    abilities: [
      {
        name: "Splatter",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 5 }],
      },
      {
        name: "Ink Drain",
        weight: 1,
        effects: [{ type: "DRAIN_INK", value: 2 }],
      },
    ],
    isBoss: false,
    tier: 1,
  },
  {
    id: "paper_golem",
    name: "Paper Golem",
    maxHp: 28,
    speed: 1,
    abilities: [
      {
        name: "Crush",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 8 }],
      },
      {
        name: "Paper Shield",
        weight: 1,
        effects: [{ type: "BLOCK", value: 6 }],
      },
    ],
    isBoss: false,
    tier: 1,
  },
  {
    id: "quill_sprite",
    name: "Quill Sprite",
    maxHp: 10,
    speed: 8,
    abilities: [
      {
        name: "Quick Stab",
        weight: 2,
        effects: [{ type: "DAMAGE", value: 3 }],
      },
      {
        name: "Poison Tip",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 2 },
          { type: "APPLY_DEBUFF", value: 3, buff: "POISON" },
        ],
      },
    ],
    isBoss: false,
    tier: 1,
  },
  {
    id: "tome_wraith",
    name: "Tome Wraith",
    maxHp: 22,
    speed: 4,
    abilities: [
      {
        name: "Shadow Strike",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 7 }],
      },
      {
        name: "Weaken",
        weight: 1,
        effects: [
          { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
        ],
      },
      {
        name: "Drain",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 4 },
          { type: "DRAIN_INK", value: 3 },
        ],
      },
    ],
    isBoss: false,
    tier: 1,
  },
  {
    id: "scroll_serpent",
    name: "Scroll Serpent",
    maxHp: 18,
    speed: 6,
    abilities: [
      {
        name: "Coil Strike",
        weight: 2,
        effects: [{ type: "DAMAGE", value: 6 }],
      },
      {
        name: "Venomous Bite",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 4 },
          { type: "APPLY_DEBUFF", value: 5, buff: "POISON" },
        ],
      },
    ],
    isBoss: false,
    tier: 1,
  },

  // === BOSS ===
  {
    id: "chapter_guardian",
    name: "Chapter Guardian",
    maxHp: 80,
    speed: 5,
    abilities: [
      {
        name: "Heavy Slam",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 12 }],
      },
      {
        name: "Page Storm",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 6 },
          { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
        ],
      },
      {
        name: "Fortify Binding",
        weight: 1,
        effects: [{ type: "BLOCK", value: 12 }],
      },
      {
        name: "Ink Devour",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 8 },
          { type: "DRAIN_INK", value: 5 },
        ],
      },
    ],
    isBoss: true,
    tier: 1,
  },
];
