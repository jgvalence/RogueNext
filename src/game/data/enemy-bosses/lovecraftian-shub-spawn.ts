import type { RawEnemyDefinition } from "./types";

// Shub Spawn overview:
// - Raw stats, rotation and weights live here.
// - Current boss-only phase and ability hooks live in:
//   - src/game/engine/boss-mechanics/lovecraftian.ts
//   - src/game/engine/enemy-intent-preview.ts
// - Current regression coverage lives in:
//   - src/game/__tests__/engine.test.ts
export const shubSpawnBossEnemyDefinitions: RawEnemyDefinition[] = [
  // Shub-Niggurath's Spawn: POISON + summoning + attrition.
  {
    id: "shub_spawn",
    name: "Shub-Niggurath's Spawn",
    maxHp: 175,
    speed: 4,
    abilities: [
      {
        name: "Dark Young Stomp",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 18 }],
        conditionalWeights: [
          { condition: { type: "NO_OTHER_ENEMIES" }, weightMultiplier: 2 },
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "POISON" },
            weightMultiplier: 3,
          },
        ],
      },
      {
        name: "Spore Cloud",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 10 },
          { type: "APPLY_DEBUFF", value: 8, buff: "POISON" },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "POISON" },
            weightMultiplier: 0.3,
          },
        ],
      },
      {
        name: "Spawn Eruption",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 14 },
          { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
        ],
        conditionalWeights: [
          { condition: { type: "TURN_MULTIPLE", n: 4 }, weightMultiplier: 2.5 },
          { condition: { type: "NO_OTHER_ENEMIES" }, weightMultiplier: 3 },
        ],
      },
      {
        name: "Eldritch Veil",
        weight: 1,
        target: "SELF",
        effects: [{ type: "BLOCK", value: 18 }],
        conditionalWeights: [
          { condition: { type: "ENEMY_HAS_NO_BLOCK" }, weightMultiplier: 2 },
          {
            condition: { type: "ENEMY_HP_BELOW_PCT", threshold: 50 },
            weightMultiplier: 3,
          },
        ],
      },
      {
        name: "Festering Touch",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 12 },
          { type: "APPLY_DEBUFF", value: 5, buff: "POISON" },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "POISON" },
            weightMultiplier: 0.3,
          },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 2,
    biome: "LOVECRAFTIAN",
  },
  {
    id: "shub_brood_nest",
    name: "Brood Nest",
    maxHp: 18,
    speed: 0,
    abilities: [],
    isBoss: false,
    isElite: false,
    isScriptedOnly: true,
    tier: 2,
    biome: "LOVECRAFTIAN",
  },
];
