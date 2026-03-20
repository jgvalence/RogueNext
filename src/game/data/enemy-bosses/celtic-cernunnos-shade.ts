import type { RawEnemyDefinition } from "./types";

// Cernunnos Shade overview:
// - Raw stats, rotation and weights live here.
// - Current boss-only phase and ability hooks live in:
//   - src/game/engine/boss-mechanics/celtic.ts
//   - src/game/engine/enemy-intent-preview.ts
// - Current regression coverage lives in:
//   - src/game/__tests__/engine.test.ts
export const cernunnosShadeBossEnemyDefinitions: RawEnemyDefinition[] = [
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
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "BLEED" },
            weightMultiplier: 2.5,
          },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 2,
    biome: "CELTIC",
  },
];
