import type { RawEnemyDefinition } from "./types";

// Corrupted Archivist overview:
// - Raw stats, base actions and scripted adds live here.
// - Inkwell summon/restore flow and cost/text redactions live in:
//   - src/game/engine/archivist.ts
//   - src/game/engine/boss-mechanics/library.ts
//   - src/game/engine/combat.ts
//   - src/game/engine/enemy-intent-preview.ts
// - UI surfaces for those rules live in:
//   - src/app/game/_components/combat/combat-overlays.tsx
//   - src/app/game/_components/combat/HandArea.tsx
// - Canonical behavior coverage lives in:
//   - src/game/__tests__/archivist.test.ts
//   - src/app/game/_components/combat/combat-view-helpers.test.ts
export const archivistLibraryBossEnemyDefinitions: RawEnemyDefinition[] = [
  // The Corrupted Archivist: fast, ink-draining, hand-disruption specialist.
  {
    id: "the_archivist",
    name: "The Corrupted Archivist",
    maxHp: 140,
    speed: 7,
    abilities: [
      {
        name: "Spectral Strike",
        weight: 1,
        target: "PLAYER",
        effects: [{ type: "DAMAGE", value: 15 }],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_HP_BELOW_PCT", threshold: 40 },
            weightMultiplier: 2,
          },
        ],
      },
      {
        name: "Ink Erasure",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 10 },
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
        name: "Corrupted Index",
        weight: 1,
        target: "PLAYER",
        effects: [
          { type: "DAMAGE", value: 8 },
          { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
        ],
        conditionalWeights: [
          { condition: { type: "TURN_MULTIPLE", n: 3 }, weightMultiplier: 2.5 },
        ],
      },
      {
        name: "Void Library",
        weight: 1,
        target: "PLAYER",
        isDisruption: true,
        effects: [
          { type: "DAMAGE", value: 7 },
          { type: "NEXT_DRAW_TO_DISCARD_THIS_TURN", value: 1 },
        ],
        conditionalWeights: [
          {
            condition: { type: "PLAYER_INK_BELOW", value: 2 },
            weightMultiplier: 3,
          },
        ],
      },
    ],
    isBoss: true,
    isElite: false,
    tier: 1,
    biome: "LIBRARY",
  },
  {
    id: "archivist_black_inkwell",
    name: "Black Inkwell",
    maxHp: 22,
    speed: 1,
    abilities: [
      {
        name: "Seal Reservoir",
        weight: 1,
        target: "SELF",
        effects: [{ type: "BLOCK", value: 7 }],
      },
    ],
    isBoss: false,
    isElite: false,
    isScriptedOnly: true,
    tier: 1,
    biome: "LIBRARY",
  },
  {
    id: "archivist_pale_inkwell",
    name: "Pale Inkwell",
    maxHp: 18,
    speed: 1,
    abilities: [
      {
        name: "Blank Reservoir",
        weight: 1,
        target: "SELF",
        effects: [{ type: "BLOCK", value: 5 }],
      },
    ],
    isBoss: false,
    isElite: false,
    isScriptedOnly: true,
    tier: 1,
    biome: "LIBRARY",
  },
];
