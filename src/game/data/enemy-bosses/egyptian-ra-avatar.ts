import type { RawEnemyDefinition } from "./types";

// Avatar of Ra overview:
// - Raw stats, rotation and weights live here.
// - Current boss-only phase and ability hooks live in:
//   - src/game/engine/boss-mechanics/egyptian.ts
//   - src/game/engine/enemy-intent-preview.ts
// - Current regression coverage lives in:
//   - src/game/__tests__/engine.test.ts
export const raAvatarBossEnemyDefinitions: RawEnemyDefinition[] = [
  {
    id: "ra_avatar",
    name: "Avatar of Ra",
    maxHp: 165,
    speed: 4,
    abilities: [
      {
        name: "Sun Spear",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 18 }],
      },
      {
        name: "Blazing Decree",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 14 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
      },
      {
        name: "Solar Barrier",
        weight: 1,
        effects: [{ type: "BLOCK", value: 18 }],
        conditionalWeights: [
          {
            condition: { type: "ENEMY_HP_BELOW_PCT", threshold: 50 },
            weightMultiplier: 3,
          },
          { condition: { type: "ENEMY_HAS_NO_BLOCK" }, weightMultiplier: 2 },
        ],
      },
      {
        name: "Divine Scorch",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 22 },
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
    ],
    isBoss: true,
    isElite: false,
    tier: 2,
    biome: "EGYPTIAN",
  },
];
