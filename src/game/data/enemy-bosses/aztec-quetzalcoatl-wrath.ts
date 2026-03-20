import type { RawEnemyDefinition } from "./types";

// Quetzalcoatl Wrath overview:
// - Raw stats, rotation and weights live here.
// - Current boss-only phase and ability hooks live in:
//   - src/game/engine/boss-mechanics/aztec.ts
//   - src/game/engine/enemy-intent-preview.ts
// - Current regression coverage lives in:
//   - src/game/__tests__/engine.test.ts
export const quetzalcoatlWrathBossEnemyDefinitions: RawEnemyDefinition[] = [
  // Quetzalcoatl's Wrath: fast, BLEED, punishes low HP.
  {
    id: "quetzalcoatl_wrath",
    name: "Quetzalcoatl's Wrath",
    maxHp: 162,
    speed: 6,
    abilities: [
      {
        name: "Sky Strike",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 16 }],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HP_BELOW_PCT", threshold: 40 },
            weightMultiplier: 2,
          },
        ],
      },
      {
        name: "Feathered Slash",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 12 },
          { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 4 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "BLEED" },
            weightMultiplier: 0.3,
          },
        ],
      },
      {
        name: "Wind Scorch",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 14 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "BLEED" },
            weightMultiplier: 2,
          },
        ],
      },
      {
        name: "Serpent Coil",
        weight: 1,
        target: "SELF",
        effects: [{ type: "BLOCK", value: 16 }],
        conditionalWeights: [
          {
            condition: { type: "ENEMY_HP_BELOW_PCT", threshold: 50 },
            weightMultiplier: 3,
          },
          { condition: { type: "ENEMY_HAS_NO_BLOCK" }, weightMultiplier: 2 },
        ],
      },
      {
        name: "Solar Dive",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 22 }],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HP_BELOW_PCT", threshold: 30 },
            weightMultiplier: 3,
          },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 2,
    biome: "AZTEC",
  },
];
