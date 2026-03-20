import type { RawEnemyDefinition } from "./types";

// Anansi overview:
// - Raw stats, rotation and weights live here.
// - Current boss-only phase and ability hooks live in:
//   - src/game/engine/boss-mechanics/african.ts
//   - src/game/engine/enemy-intent-preview.ts
// - Current regression coverage lives in:
//   - src/game/__tests__/engine.test.ts
export const anansiWeaverBossEnemyDefinitions: RawEnemyDefinition[] = [
  // Anansi the Weaver: traps, curses, hand disruption, multi-debuff.
  {
    id: "anansi_weaver",
    name: "Anansi the Weaver",
    maxHp: 162,
    speed: 6,
    abilities: [
      {
        name: "Web Trap",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 9 },
          { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "shrouded_omen" },
        ],
        conditionalWeights: [
          { condition: { type: "TURN_MULTIPLE", n: 3 }, weightMultiplier: 2.5 },
        ],
      },
      {
        name: "Silk Snare",
        weight: 1,
        target: "PLAYER",
        isDisruption: true,
        effects: [
          { type: "DAMAGE", value: 11 },
          { type: "FREEZE_HAND_CARDS", value: 1 },
        ],
        conditionalWeights: [
          {
            condition: { type: "ENEMY_HP_BELOW_PCT", threshold: 50 },
            weightMultiplier: 2,
          },
        ],
      },
      {
        name: "Trickster's Bite",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 14 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HP_BELOW_PCT", threshold: 40 },
            weightMultiplier: 2,
          },
        ],
      },
      {
        name: "Ancestral Weave",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 12 },
          { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
          { type: "DRAIN_INK", value: 3 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_INK_ABOVE", value: 3 },
            weightMultiplier: 3,
          },
        ],
      },
      {
        name: "Story's End",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 20 }],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HP_BELOW_PCT", threshold: 35 },
            weightMultiplier: 3,
          },
          { condition: { type: "NO_OTHER_ENEMIES" }, weightMultiplier: 2 },
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "VULNERABLE" },
            weightMultiplier: 2.5,
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
