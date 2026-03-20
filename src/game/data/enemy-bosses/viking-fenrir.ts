import type { RawEnemyDefinition } from "./types";

// Fenrir overview:
// - Raw stats, rotation and weights live here.
// - Hunt state, hit tracking and phase escalation live in:
//   - src/game/engine/fenrir.ts
// - Boss-only ability orchestration and preview hooks live in:
//   - src/game/engine/boss-mechanics/viking.ts
//   - src/game/engine/enemy-intent-preview.ts
// - Current regression coverage lives in:
//   - src/game/__tests__/viking-bosses.test.ts
//   - src/app/game/_components/combat/combat-view-helpers.test.ts
export const fenrirBossEnemyDefinitions: RawEnemyDefinition[] = [
  // Fenrir's 6-turn cycle: total ~103 raw damage, escalating threat.
  {
    id: "fenrir",
    name: "Fenrir",
    maxHp: 170,
    speed: 4,
    abilities: [
      {
        name: "Snap",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 14 }],
      },
      {
        name: "Pack Howl",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 10 },
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
        ],
        conditionalWeights: [
          { condition: { type: "NO_OTHER_ENEMIES" }, weightMultiplier: 3 },
        ],
      },
      {
        name: "Lunge",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 18 }],
      },
      {
        name: "Chain Break",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 16 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "VULNERABLE" },
            weightMultiplier: 0.3,
          },
        ],
      },
      {
        name: "Ragnarok Bite",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 24 }],
        conditionalWeights: [
          {
            condition: { type: "ENEMY_HP_BELOW_PCT", threshold: 40 },
            weightMultiplier: 3,
          },
        ],
      },
      {
        name: "World's End",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 21 },
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 3 },
          { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 3 },
        ],
        conditionalWeights: [
          {
            condition: { type: "ENEMY_HP_BELOW_PCT", threshold: 50 },
            weightMultiplier: 2,
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
