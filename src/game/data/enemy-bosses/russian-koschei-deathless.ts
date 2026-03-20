import type { RawEnemyDefinition } from "./types";

// Koschei overview:
// - Raw stats, rotation and weights live here.
// - Current boss-only phase and ability hooks live in:
//   - src/game/engine/boss-mechanics/russian.ts
//   - src/game/engine/enemy-intent-preview.ts
// - Current regression coverage lives in:
//   - src/game/__tests__/engine.test.ts
export const koscheiDeathlessBossEnemyDefinitions: RawEnemyDefinition[] = [
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
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "VULNERABLE" },
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
  {
    id: "koschei_bone_chest",
    name: "Bone Chest",
    maxHp: 24,
    speed: 1,
    abilities: [
      {
        name: "Locked Lid",
        weight: 1,
        target: "SELF",
        effects: [{ type: "BLOCK", value: 8 }],
      },
      {
        name: "Soul Rattle",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 4 }],
      },
      {
        name: "Bone Latch",
        weight: 1,
        target: "SELF",
        effects: [{ type: "BLOCK", value: 6 }],
      },
    ],
    isBoss: false,
    isElite: false,
    isScriptedOnly: true,
    tier: 2,
    biome: "RUSSIAN",
  },
  {
    id: "koschei_black_egg",
    name: "Black Egg",
    maxHp: 18,
    speed: 3,
    abilities: [
      {
        name: "Shell Pulse",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 5 }],
      },
      {
        name: "Crackling Shell",
        weight: 1,
        target: "SELF",
        effects: [{ type: "BLOCK", value: 6 }],
      },
      {
        name: "Veiled Core",
        weight: 1,
        target: "SELF",
        effects: [{ type: "BLOCK", value: 5 }],
      },
    ],
    isBoss: false,
    isElite: false,
    isScriptedOnly: true,
    tier: 2,
    biome: "RUSSIAN",
  },
  {
    id: "koschei_hidden_needle",
    name: "Hidden Needle",
    maxHp: 12,
    speed: 7,
    abilities: [
      {
        name: "Soul Prick",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 4 },
          { type: "INCREASE_CARD_COST_NEXT_TURN", value: 1 },
        ],
      },
      {
        name: "Needle Quiver",
        weight: 1,
        target: "SELF",
        effects: [{ type: "BLOCK", value: 4 }],
      },
      {
        name: "Death Thread",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 3 }],
      },
    ],
    isBoss: false,
    isElite: false,
    isScriptedOnly: true,
    tier: 2,
    biome: "RUSSIAN",
  },
];
