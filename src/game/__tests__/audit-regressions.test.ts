// @vitest-environment node
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  allCardDefinitions,
  buildCardDefsMap,
  buildEnemyDefsMap,
} from "@/game/data";
import { characterDefinitions } from "@/game/data/characters";
import { bossGuides } from "@/game/data/boss-guides";
import { CARD_IMAGES, ENEMY_IMAGES, getEnemyImageSrc } from "@/lib/assets";
import {
  getDifficultyFloorRamp,
  getDifficultyModifiers,
} from "@/game/engine/difficulty";
import { generateFloorMap, isValidFloorMapCandidate } from "@/game/engine/run";
import {
  getRunConditionMapRules,
  runConditionDefinitions,
} from "@/game/engine/run-conditions";
import { createRNG } from "@/game/engine/rng";
import { canUseInkPower, applyInkPower } from "@/game/engine/ink";
import { makeTestCombat } from "@/test/factories/game-state";

describe("audit correction contracts", () => {
  it("has one definition per card and a real asset for every starter and boss entity", () => {
    const cards = buildCardDefsMap();
    expect(cards.size).toBe(allCardDefinitions.length);
    for (const id of new Set(
      characterDefinitions.flatMap((c) => c.starterDeckIds)
    )) {
      expect(cards.has(id), id).toBe(true);
      expect(CARD_IMAGES[id], id).toBeTruthy();
      expect(existsSync(resolve("public", CARD_IMAGES[id]!.slice(1))), id).toBe(
        true
      );
    }
    for (const enemy of buildEnemyDefsMap().values()) {
      if (!enemy.isBoss && !enemy.isScriptedOnly) continue;
      expect(ENEMY_IMAGES[enemy.id], enemy.id).toBeTruthy();
      expect(
        existsSync(resolve("public", getEnemyImageSrc(enemy.id).slice(1))),
        enemy.id
      ).toBe(true);
      if (enemy.isBoss) expect(bossGuides[enemy.id], enemy.id).toBeTruthy();
    }
  });
  it("keeps D0 to D1 scaling gradual and D4 block penetration in D5", () => {
    for (const floor of [1, 2, 3]) {
      const zero = getDifficultyFloorRamp(0, floor);
      const one = getDifficultyFloorRamp(1, floor);
      expect(
        (one.enemyHpMultiplier * getDifficultyModifiers(1).enemyHpMultiplier) /
          zero.enemyHpMultiplier
      ).toBeLessThan(1.35);
      expect(
        (one.enemyDamageMultiplier *
          getDifficultyModifiers(1).enemyDamageMultiplier) /
          zero.enemyDamageMultiplier
      ).toBeLessThan(1.3);
    }
    expect(getDifficultyModifiers(4).blockPenetrationFraction).toBe(0.03);
    expect(getDifficultyModifiers(5).blockPenetrationFraction).toBe(0.03);
  });
  it("never offers a fatal blood pact and counts the ink actually gained", () => {
    const base = makeTestCombat();
    const atSix = { ...base, player: { ...base.player, currentHp: 6 } };
    expect(canUseInkPower(atSix, "PACTE_SANG")).toBe(false);
    const atSeven = { ...base, player: { ...base.player, currentHp: 7 } };
    expect(canUseInkPower(atSeven, "PACTE_SANG")).toBe(true);
    const result = applyInkPower(
      atSeven,
      "PACTE_SANG",
      null,
      buildCardDefsMap(),
      createRNG("pact")
    );
    expect(result.player.currentHp).toBe(1);
    expect(result.analyticsInkGenerated).toBe(3);
  });
  it("generates valid graphs across every map-changing condition", () => {
    const conditions = [
      undefined,
      ...runConditionDefinitions
        .filter((condition) => condition.effects.mapRules)
        .map((condition) => condition.id),
    ];
    for (const condition of conditions) {
      for (let seed = 0; seed < 60; seed++) {
        const map = generateFloorMap(
          (seed % 3) + 1,
          createRNG(`corrections-map-${condition}-${seed}`),
          "LIBRARY",
          condition,
          seed % 6
        );
        expect(
          isValidFloorMapCandidate(map, getRunConditionMapRules(condition)),
          `${condition}:${seed}`
        ).toBe(true);
        const fallback = generateFloorMap(
          1,
          createRNG(`forced-fallback-${seed}`),
          "LIBRARY",
          condition,
          0,
          { maxAttempts: 0 }
        );
        expect(
          isValidFloorMapCandidate(
            fallback,
            getRunConditionMapRules(condition)
          ),
          `fallback:${condition}:${seed}`
        ).toBe(true);
      }
    }
  }, 30000);
});
