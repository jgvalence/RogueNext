import type { RawEnemyDefinition } from "./types";

// Hydra Aspect overview:
// - Raw stats, rotation and weights live here.
// - Current boss-only phase and ability hooks live in:
//   - src/game/engine/boss-mechanics/greek.ts
//   - src/game/engine/enemy-intent-preview.ts
// - Current regression coverage lives in:
//   - src/game/__tests__/engine.test.ts
export const hydraAspectBossEnemyDefinitions: RawEnemyDefinition[] = [
  // Aspect of the Hydra: multi-hit, POISON accumulation.
  {
    id: "hydra_aspect",
    name: "Aspect of the Hydra",
    maxHp: 155,
    speed: 4,
    abilities: [
      {
        name: "Triple Fang",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 7 },
          { type: "DAMAGE", value: 7 },
          { type: "DAMAGE", value: 7 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "VULNERABLE" },
            weightMultiplier: 2,
          },
        ],
      },
      {
        name: "Venom Surge",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 10 },
          { type: "APPLY_DEBUFF", value: 6, buff: "POISON" },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HAS_DEBUFF", buff: "POISON" },
            weightMultiplier: 0.5,
          },
        ],
      },
      {
        name: "Hydra's Wrath",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 20 }],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HP_BELOW_PCT", threshold: 40 },
            weightMultiplier: 2,
          },
        ],
      },
      {
        name: "Regeneration",
        weight: 1,
        target: "SELF",
        effects: [{ type: "BLOCK", value: 15 }],
        conditionalWeights: [
          {
            condition: { type: "ENEMY_HP_BELOW_PCT", threshold: 40 },
            weightMultiplier: 3,
          },
          { condition: { type: "ENEMY_HAS_NO_BLOCK" }, weightMultiplier: 2 },
        ],
      },
      {
        name: "Necrotic Snap",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 12 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
        conditionalWeights: [
          { condition: { type: "TURN_MULTIPLE", n: 3 }, weightMultiplier: 2 },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 1,
    biome: "GREEK",
  },
  {
    id: "hydra_head_left",
    name: "Hydra Head",
    maxHp: 20,
    speed: 5,
    abilities: [
      {
        name: "Fang Jab",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 6 }],
      },
      {
        name: "Venom Spit",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 4 },
          { type: "APPLY_DEBUFF", value: 3, buff: "POISON" },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    isScriptedOnly: true,
    tier: 1,
    biome: "GREEK",
  },
  {
    id: "hydra_head_right",
    name: "Hydra Head",
    maxHp: 20,
    speed: 5,
    abilities: [
      {
        name: "Fang Jab",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 6 }],
      },
      {
        name: "Venom Spit",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 4 },
          { type: "APPLY_DEBUFF", value: 3, buff: "POISON" },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    isScriptedOnly: true,
    tier: 1,
    biome: "GREEK",
  },
  {
    id: "hydra_head_center",
    name: "Hydra Head",
    maxHp: 24,
    speed: 6,
    abilities: [
      {
        name: "Center Lash",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 7 },
          { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
        ],
      },
      {
        name: "Toxic Regrow",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 5 },
          { type: "APPLY_DEBUFF", value: 4, buff: "POISON" },
        ],
      },
    ],
    isBoss: false,
    isElite: false,
    isScriptedOnly: true,
    tier: 1,
    biome: "GREEK",
  },
];
