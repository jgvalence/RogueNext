import type { RawEnemyDefinition } from "./types";

// Hel overview:
// - Raw stats, rotation and weights live here.
// - Stance state, bleed cash-out and draugr revival live in:
//   - src/game/engine/hel-queen.ts
// - Boss-only ability orchestration and preview hooks live in:
//   - src/game/engine/boss-mechanics/viking.ts
//   - src/game/engine/enemy-intent-preview.ts
// - Current regression coverage lives in:
//   - src/game/__tests__/viking-bosses.test.ts
//   - src/app/game/_components/combat/combat-view-helpers.test.ts
export const helQueenBossEnemyDefinitions: RawEnemyDefinition[] = [
  // Hel, Queen of Niflheim: BLEED master, death domain.
  {
    id: "hel_queen",
    name: "Hel, Queen of Niflheim",
    maxHp: 175,
    speed: 3,
    abilities: [
      {
        name: "Half-World Strike",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 16 }],
      },
      {
        name: "Death's Grasp",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 12 },
          { type: "APPLY_DEBUFF", value: 3, buff: "BLEED", duration: 5 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "BLEED" },
            weightMultiplier: 0.3,
          },
        ],
      },
      {
        name: "Niflheim Surge",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 14 },
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "BLEED" },
            weightMultiplier: 3,
          },
        ],
      },
      {
        name: "Realm Wall",
        weight: 1,
        target: "SELF",
        effects: [{ type: "BLOCK", value: 18 }],
        conditionalWeights: [
          { condition: { type: "ENEMY_HAS_NO_BLOCK" }, weightMultiplier: 2 },
          {
            condition: { type: "ENEMY_HP_BELOW_PCT", threshold: 50 },
            weightMultiplier: 2,
          },
        ],
      },
      {
        name: "Death's Reckoning",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 24 }],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HP_BELOW_PCT", threshold: 35 },
            weightMultiplier: 3,
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
    tier: 1,
    biome: "VIKING",
  },
];
