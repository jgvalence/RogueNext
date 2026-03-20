import type { RawEnemyDefinition } from "./types";

// Chapter Guardian overview:
// - Raw stats, rotation and intent weights live here.
// - Binding puzzle, damage cap, Open Chapter and Rebind Chapter live in:
//   - src/game/engine/chapter-guardian.ts
//   - src/game/engine/boss-mechanics/library.ts
//   - src/game/engine/enemy-intent-preview.ts
// - Canonical behavior coverage lives in:
//   - src/game/__tests__/chapter-guardian.test.ts
//   - src/app/game/_components/combat/combat-view-helpers.test.ts
export const chapterGuardianLibraryBossEnemyDefinitions: RawEnemyDefinition[] =
  [
    // Core cycle (6 turns): 18 + 10 + 14 + 16 + 18 + 12 = 88 raw damage.
    // Rebind Chapter is a forced mechanic turn, not part of the normal rotation.
    {
      id: "chapter_guardian",
      name: "Chapter Guardian",
      maxHp: 145,
      speed: 5,
      abilities: [
        {
          name: "Heavy Slam",
          weight: 1,
          target: "PLAYER",
          effects: [{ type: "DAMAGE", value: 18 }],
        },
        {
          name: "Page Storm",
          weight: 1,
          target: "LOWEST_HP_ENEMY",
          effects: [
            { type: "DAMAGE", value: 10 },
            { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
          ],
          conditionalWeights: [
            { condition: { type: "NO_OTHER_ENEMIES" }, weightMultiplier: 3 },
          ],
        },
        {
          name: "Fortify Binding",
          weight: 1,
          effects: [
            { type: "BLOCK", value: 14 },
            { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
          ],
          conditionalWeights: [
            {
              condition: { type: "ENEMY_HP_BELOW_PCT", threshold: 60 },
              weightMultiplier: 2.5,
            },
          ],
        },
        {
          name: "Ink Devour",
          weight: 1,
          target: "ALLY_PRIORITY",
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
          name: "Crushing Verdict",
          weight: 1,
          target: "PLAYER",
          effects: [{ type: "DAMAGE", value: 18 }],
          conditionalWeights: [
            {
              condition: { type: "PLAYER_HP_BELOW_PCT", threshold: 40 },
              weightMultiplier: 2,
            },
          ],
        },
        {
          name: "Binding Curse",
          weight: 1,
          target: "ALLY_PRIORITY",
          effects: [
            { type: "DAMAGE", value: 12 },
            { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 2 },
            { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
            { type: "ADD_CARD_TO_DRAW", value: 1, cardId: "haunting_regret" },
          ],
          conditionalWeights: [
            { condition: { type: "TURN_MULTIPLE", n: 3 }, weightMultiplier: 2 },
          ],
        },
        {
          name: "Rebind Chapter",
          weight: 1,
          target: "SELF",
          effects: [{ type: "BLOCK", value: 12 }],
        },
      ],
      isBoss: true,
      isElite: false,
      tier: 1,
      biome: "LIBRARY",
    },
  ];
