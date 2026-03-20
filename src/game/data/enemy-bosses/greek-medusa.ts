import type { RawEnemyDefinition } from "./types";

// Medusa overview:
// - Raw stats, rotation and weights live here.
// - Current boss-only phase and ability hooks live in:
//   - src/game/engine/boss-mechanics/greek.ts
//   - src/game/engine/enemy-intent-preview.ts
// - Current regression coverage lives in:
//   - src/game/__tests__/engine.test.ts
export const medusaBossEnemyDefinitions: RawEnemyDefinition[] = [
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
        conditionalWeights: [
          {
            condition: { type: "ENEMY_HP_BELOW_PCT", threshold: 60 },
            weightMultiplier: 2.5,
          },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 1,
    biome: "GREEK",
  },
];
