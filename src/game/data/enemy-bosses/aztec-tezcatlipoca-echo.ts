import type { RawEnemyDefinition } from "./types";

// Tezcatlipoca Echo overview:
// - Raw stats, rotation and weights live here.
// - Current boss-only phase and ability hooks live in:
//   - src/game/engine/boss-mechanics/aztec.ts
//   - src/game/engine/enemy-intent-preview.ts
// - Current regression coverage lives in:
//   - src/game/__tests__/engine.test.ts
export const tezcatlipocaEchoBossEnemyDefinitions: RawEnemyDefinition[] = [
  {
    id: "tezcatlipoca_echo",
    name: "Tezcatlipoca Echo",
    maxHp: 172,
    speed: 4,
    abilities: [
      {
        name: "Mirror Slash",
        weight: 1,
        effects: [{ type: "DAMAGE", value: 19 }],
        conditionalWeights: [
          { condition: { type: "ENEMY_HAS_NO_BLOCK" }, weightMultiplier: 2 },
          {
            condition: { type: "PLAYER_HP_BELOW_PCT", threshold: 45 },
            weightMultiplier: 2,
          },
        ],
      },
      {
        name: "Dark Sun",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 15 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
          { type: "ADD_CARD_TO_DRAW", value: 1, cardId: "ink_burn" },
        ],
        conditionalWeights: [
          { condition: { type: "TURN_MULTIPLE", n: 3 }, weightMultiplier: 2 },
        ],
      },
      {
        name: "Obsidian Hunger",
        weight: 1,
        effects: [
          { type: "DAMAGE", value: 17 },
          { type: "DRAIN_INK", value: 5 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_INK_ABOVE", value: 3 },
            weightMultiplier: 4,
          },
        ],
      },
      {
        name: "Night Mantle",
        weight: 1,
        effects: [{ type: "BLOCK", value: 20 }],
        conditionalWeights: [
          {
            condition: { type: "ENEMY_HP_BELOW_PCT", threshold: 50 },
            weightMultiplier: 3,
          },
          { condition: { type: "ENEMY_HAS_NO_BLOCK" }, weightMultiplier: 2 },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 2,
    biome: "AZTEC",
  },
];
