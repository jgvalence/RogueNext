import type { RawEnemyDefinition } from "./types";

// Dagda Shadow overview:
// - Raw stats, rotation and weights live here.
// - Current boss-only phase and ability hooks live in:
//   - src/game/engine/boss-mechanics/celtic.ts
//   - src/game/engine/enemy-intent-preview.ts
// - Current regression coverage lives in:
//   - src/game/__tests__/engine.test.ts
export const dagdaShadowBossEnemyDefinitions: RawEnemyDefinition[] = [
  {
    id: "dagda_shadow",
    name: "Dagda's Shadow",
    maxHp: 166,
    speed: 3,
    abilities: [
      {
        name: "Club of Ruin",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 21 }],
      },
      {
        name: "Cauldron Steam",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 13 },
          { type: "APPLY_DEBUFF", value: 5, buff: "POISON" },
        ],
        conditionalWeights: [
          { condition: { type: "NO_OTHER_ENEMIES" }, weightMultiplier: 3 },
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "POISON" },
            weightMultiplier: 0.4,
          },
        ],
      },
      {
        name: "Ancient Feast",
        weight: 1,
        target: "SELF",
        effects: [
          { type: "BLOCK", value: 20 },
          { type: "HEAL", value: 12 },
        ],
        conditionalWeights: [
          {
            condition: { type: "ENEMY_HP_BELOW_PCT", threshold: 50 },
            weightMultiplier: 3,
          },
          { condition: { type: "ENEMY_HAS_NO_BLOCK" }, weightMultiplier: 2 },
        ],
      },
      {
        name: "Famine Curse",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 16 },
          { type: "DRAIN_INK", value: 4 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_INK_ABOVE", value: 3 },
            weightMultiplier: 4,
          },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 2,
    biome: "CELTIC",
  },
  {
    id: "dagda_cauldron",
    name: "Dagda's Cauldron",
    maxHp: 20,
    speed: 0,
    abilities: [],
    isBoss: false,
    isElite: false,
    isScriptedOnly: true,
    tier: 2,
    biome: "CELTIC",
  },
];
