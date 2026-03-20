import type { RawEnemyDefinition } from "./types";

// Baba Yaga Hut overview:
// - Raw stats, rotation and weights live here.
// - Current boss-only phase and ability hooks live in:
//   - src/game/engine/boss-mechanics/russian.ts
//   - src/game/engine/enemy-intent-preview.ts
// - Current regression coverage lives in:
//   - src/game/__tests__/engine.test.ts
export const babaYagaHutBossEnemyDefinitions: RawEnemyDefinition[] = [
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
          {
            condition: { type: "ENEMY_HP_BELOW_PCT", threshold: 60 },
            weightMultiplier: 2,
          },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 2,
    biome: "RUSSIAN",
  },
];
