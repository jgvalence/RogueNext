import { describe, expect, it } from "vitest";
import { buildAllyDefsMap, buildCardDefsMap, buildEnemyDefsMap } from "../data";
import { initCombat } from "../engine/combat";
import {
  getDifficultyFloorRamp,
  getOpeningDamageMultiplier,
} from "../engine/difficulty";
import { executeOneEnemyTurn } from "../engine/enemies";
import { computeIncomingDamage } from "../engine/incoming-damage";
import { createRNG } from "../engine/rng";
import { makeTestRunState } from "@/test/factories/game-state";

describe("D0 opening forgiveness", () => {
  it("preserves the shared floor scaling and confines the opening allowance to D0 floor one", () => {
    for (const floor of [1, 2, 3, 4]) {
      const oldHp = floor === 1 ? 0.56 : floor === 2 ? 0.68 : 0.8;
      const oldDamage = floor === 1 ? 0.65 : floor === 2 ? 0.72 : 0.82;
      for (let difficulty = 0; difficulty <= 5; difficulty++) {
        const ramp = getDifficultyFloorRamp(difficulty, floor);
        expect(ramp.enemyHpMultiplier).toBeCloseTo(
          Math.min(1, oldHp + [0, 0.1, 0.16, 0.18, 0.2, 0.22][difficulty]!)
        );
        expect(ramp.enemyDamageMultiplier).toBeCloseTo(
          Math.min(
            1,
            oldDamage + [0, 0.09, 0.12, 0.13, 0.14, 0.15][difficulty]!
          )
        );
        if (difficulty !== 0 || floor !== 1) {
          for (const room of [0, 7, 15]) {
            expect(
              getOpeningDamageMultiplier(difficulty, floor, room, 16)
            ).toBe(1);
          }
        }
      }
    }
  });

  it("tapers by half a percentage point per room, preserving the boss endpoint on different map lengths", () => {
    for (let room = 0; room < 16; room++) {
      expect(getOpeningDamageMultiplier(0, 1, room, 16)).toBeCloseTo(
        0.875 + 0.005 * room
      );
    }
    for (const length of [8, 16, 20]) {
      expect(getOpeningDamageMultiplier(0, 1, 0, length)).toBeCloseTo(0.875);
      expect(getOpeningDamageMultiplier(0, 1, length - 1, length)).toBeCloseTo(
        0.95
      );
      expect(getOpeningDamageMultiplier(0, 1, length + 10, length)).toBeCloseTo(
        0.95
      );
      expect(getOpeningDamageMultiplier(0, 1, -1, length)).toBeCloseTo(0.875);
    }
    expect(getOpeningDamageMultiplier(0, 1, 0, 1)).toBeCloseTo(0.95);
  });

  it("uses actual map progress when initializing normal, elite and boss combat", () => {
    const enemies = buildEnemyDefsMap();
    const cards = buildCardDefsMap();
    const allies = buildAllyDefsMap();
    const run = makeTestRunState({ floor: 1, selectedDifficultyLevel: 0 });
    for (const length of [8, 16, 20]) {
      const map = Array.from({ length }, (_, index) => [
        { index, type: "COMBAT" as const, isElite: false, completed: false },
      ]);
      for (const room of [0, length - 2, length - 1]) {
        for (const id of ["ink_slime", "tome_colossus", "the_archivist"]) {
          const combat = initCombat(
            { ...run, map, currentRoom: room },
            [id],
            enemies,
            allies,
            cards,
            createRNG("d0-progress")
          );
          expect(combat.enemyDamageScale).toBeCloseTo(
            0.65 * (0.875 + (0.075 * room) / (length - 1))
          );
          expect(combat.enemies[0]!.maxHp).toBe(
            Math.round(enemies.get(id)!.maxHp * 0.56)
          );
        }
      }
    }
  });

  it("uses the gentler damage for both the visible intent and actual enemy hit", () => {
    const enemies = buildEnemyDefsMap();
    const definition = {
      ...enemies.get("ink_slime")!,
      abilities: [
        {
          name: "Test attack",
          weight: 1,
          effects: [{ type: "DAMAGE" as const, value: 7 }],
        },
      ],
    };
    enemies.set(definition.id, definition);
    const combat = initCombat(
      makeTestRunState({ floor: 1, selectedDifficultyLevel: 0 }),
      [definition.id],
      enemies,
      buildAllyDefsMap(),
      buildCardDefsMap(),
      createRNG("d0-opening")
    );
    combat.player.block = 0;
    expect(combat.enemyDamageScale).toBeCloseTo(0.65 * 0.875);
    expect(combat.enemies[0]!.maxHp).toBe(Math.round(definition.maxHp * 0.56));
    const preview = computeIncomingDamage(combat, enemies);
    const next = executeOneEnemyTurn(
      combat,
      combat.enemies[0]!,
      definition,
      createRNG("d0-hit"),
      enemies
    );
    expect(preview.player.hpLoss).toBe(4);
    expect(combat.player.currentHp - next.player.currentHp).toBe(
      preview.player.hpLoss
    );
    // The old opening scale rounded the same attack up to five damage.
    expect(
      computeIncomingDamage({ ...combat, enemyDamageScale: 0.65 }, enemies)
        .player.hpLoss
    ).toBe(5);
  });
});
