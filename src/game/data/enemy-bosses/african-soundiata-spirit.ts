import type { RawEnemyDefinition } from "./types";

// Soundiata overview:
// - Raw stats, rotation and weights live here.
// - Current boss-only phase and ability hooks live in:
//   - src/game/engine/boss-mechanics/african.ts
//   - src/game/engine/enemy-intent-preview.ts
// - Current regression coverage lives in:
//   - src/game/__tests__/engine.test.ts
export const soundiataSpiritBossEnemyDefinitions: RawEnemyDefinition[] = [
  {
    id: "soundiata_spirit",
    name: "Soundiata Spirit",
    maxHp: 169,
    speed: 4,
    abilities: [
      {
        name: "Lion King's Blow",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 20 }],
        conditionalWeights: [
          { condition: { type: "NO_OTHER_ENEMIES" }, weightMultiplier: 2.5 },
        ],
      },
      {
        name: "Epic Command",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 14 },
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        ],
        conditionalWeights: [
          { condition: { type: "ALLY_ALIVE" }, weightMultiplier: 4 },
        ],
      },
      {
        name: "Griot's Shield",
        weight: 1,
        effects: [{ type: "BLOCK", value: 20 }],
        conditionalWeights: [
          { condition: { type: "ALLY_ALIVE" }, weightMultiplier: 3 },
          { condition: { type: "ENEMY_HAS_NO_BLOCK" }, weightMultiplier: 2 },
        ],
      },
      {
        name: "Royal Tribute",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 16 },
          { type: "DRAIN_INK", value: 5 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_INK_ABOVE", value: 3 },
            weightMultiplier: 3.5,
          },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 2,
    biome: "AFRICAN",
  },
];
