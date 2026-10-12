import { describe, expect, it } from "vitest";
import { buildAllyDefsMap, buildCardDefsMap, buildEnemyDefsMap } from "../data";
import { initCombat } from "../engine/combat";
import { getDifficultyFloorRamp } from "../engine/difficulty";
import { executeOneEnemyTurn } from "../engine/enemies";
import { computeIncomingDamage } from "../engine/incoming-damage";
import { createRNG } from "../engine/rng";
import { makeTestRunState } from "@/test/factories/game-state";

describe("D0 opening forgiveness", () => {
  it("only reduces first-floor D0 damage, preserving every other floor/difficulty and enemy HP", () => {
    for (const floor of [1, 2, 3, 4]) {
      const oldHp = floor === 1 ? 0.56 : floor === 2 ? 0.68 : 0.8;
      const oldDamage = floor === 1 ? 0.65 : floor === 2 ? 0.72 : 0.82;
      for (let difficulty = 0; difficulty <= 5; difficulty++) {
        const ramp = getDifficultyFloorRamp(difficulty, floor);
        expect(ramp.enemyHpMultiplier).toBeCloseTo(
          Math.min(1, oldHp + [0, 0.1, 0.16, 0.18, 0.2, 0.22][difficulty]!)
        );
        expect(ramp.enemyDamageMultiplier).toBeCloseTo(
          difficulty === 0 && floor === 1
            ? 0.63
            : Math.min(
                1,
                oldDamage + [0, 0.09, 0.12, 0.13, 0.14, 0.15][difficulty]!
              )
        );
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
    expect(combat.enemyDamageScale).toBe(0.63);
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
