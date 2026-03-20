import type { RawEnemyDefinition } from "./types";

// Nyarlathotep Shard overview:
// - Raw stats, rotation and weights live here.
// - Current boss-only phase and ability hooks live in:
//   - src/game/engine/boss-mechanics/lovecraftian.ts
//   - src/game/engine/enemy-intent-preview.ts
// - Current regression coverage lives in:
//   - src/game/__tests__/engine.test.ts
export const nyarlathotepShardBossEnemyDefinitions: RawEnemyDefinition[] = [
  {
    id: "nyarlathotep_shard",
    name: "Nyarlathotep Shard",
    maxHp: 168,
    speed: 5,
    abilities: [
      {
        name: "Black Flame",
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
        name: "Mad Prophecy",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 13 },
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
          { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
        ],
        conditionalWeights: [
          { condition: { type: "TURN_MULTIPLE", n: 3 }, weightMultiplier: 2.5 },
        ],
      },
      {
        name: "Cosmic Drain",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 16 },
          { type: "DRAIN_INK", value: 6 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_INK_ABOVE", value: 3 },
            weightMultiplier: 4,
          },
        ],
      },
      {
        name: "Void Mantle",
        weight: 1,
        effects: [{ type: "BLOCK", value: 20 }],
        conditionalWeights: [
          { condition: { type: "NO_OTHER_ENEMIES" }, weightMultiplier: 3 },
          { condition: { type: "ENEMY_HAS_NO_BLOCK" }, weightMultiplier: 2 },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 2,
    biome: "LOVECRAFTIAN",
  },
];
