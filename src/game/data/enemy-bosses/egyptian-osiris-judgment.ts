import type { RawEnemyDefinition } from "./types";

// Osiris Judgment overview:
// - Raw stats, rotation and weights live here.
// - Current boss-only phase and ability hooks live in:
//   - src/game/engine/boss-mechanics/egyptian.ts
//   - src/game/engine/enemy-intent-preview.ts
// - Current regression coverage lives in:
//   - src/game/__tests__/engine.test.ts
export const osirisJudgmentBossEnemyDefinitions: RawEnemyDefinition[] = [
  // Judgment of Osiris: block-heavy judgment, ink punishment.
  {
    id: "osiris_judgment",
    name: "Judgment of Osiris",
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
          {
            condition: { type: "PLAYER_INK_BELOW", value: 3 },
            weightMultiplier: 2.5,
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
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "VULNERABLE" },
            weightMultiplier: 2,
          },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 2,
    biome: "EGYPTIAN",
  },
];
