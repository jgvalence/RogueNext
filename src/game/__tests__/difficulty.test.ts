import { describe, expect, it } from "vitest";
import {
  computeEnemyKillUnlockedRelicIds,
  eliteCanDropRelic,
  filterCardIdsByDifficulty,
  filterRelicsByDifficulty,
  getBossDebuffBonus,
  getBestInfiniteFloor,
  getBestGoldInSingleRun,
  getDifficultyModifiers,
  getEarnedResourceMultiplierForRun,
  getEnemyStartingBlock,
  getPostFloorFiveEscalation,
  getRelicUnlockDetails,
  hasClearedDifficultyBefore,
  isRelicUnlocked,
  readCharacterWinsByDifficultyFromResources,
  recordCharacterDifficultyVictory,
  getUnlockedDifficultyLevels,
  getUnlockedMaxDifficultyFromResources,
  shouldHideEnemyIntent,
  unlockNextDifficultyOnVictory,
  updateBestInfiniteFloor,
  updateBestGoldInSingleRun,
  computeUnlockedRelicIds,
} from "../engine/difficulty";

describe("Run difficulty progression", () => {
  it("starts with difficulty 0 unlocked", () => {
    expect(getUnlockedDifficultyLevels({})).toEqual([0]);
    expect(getUnlockedMaxDifficultyFromResources({})).toBe(0);
  });

  it("unlocks only the next difficulty on victory at current max", () => {
    const resources0 = {};
    const resources1 = unlockNextDifficultyOnVictory(resources0, 0);
    expect(getUnlockedMaxDifficultyFromResources(resources1)).toBe(1);

    const resources2 = unlockNextDifficultyOnVictory(resources1, 0);
    expect(getUnlockedMaxDifficultyFromResources(resources2)).toBe(1);

    const resources3 = unlockNextDifficultyOnVictory(resources2, 1);
    expect(getUnlockedMaxDifficultyFromResources(resources3)).toBe(2);
  });

  it("applies new gameplay rules at difficulty 3/4/5", () => {
    expect(shouldHideEnemyIntent(3, 3, { isElite: true })).toBe(true);
    expect(shouldHideEnemyIntent(3, 2, { isBoss: true })).toBe(false);
    expect(
      shouldHideEnemyIntent(0, 1, { isElite: true }, {
        playerHand: [{ definitionId: "shrouded_omen" }],
      })
    ).toBe(true);
    expect(getEnemyStartingBlock(3, 2, { isBoss: true })).toBe(10);
    expect(getEnemyStartingBlock(4, 2, { isElite: true })).toBe(10);
    expect(getBossDebuffBonus(4)).toBe(1);
    expect(eliteCanDropRelic(5, 0.2)).toBe(false);
    expect(eliteCanDropRelic(5, 0.8)).toBe(true);
  });

  it("reduces resource gains when the selected difficulty was already cleared", () => {
    let resources = unlockNextDifficultyOnVictory({}, 0, "scribe");
    resources = recordCharacterDifficultyVictory(resources, "scribe", 0);

    expect(hasClearedDifficultyBefore(resources, "scribe", 0)).toBe(true);
    expect(hasClearedDifficultyBefore(resources, "scribe", 1)).toBe(false);
    expect(
      getEarnedResourceMultiplierForRun(resources, "scribe", 0, "VICTORY")
    ).toBe(0.875);
    expect(
      getEarnedResourceMultiplierForRun({}, "scribe", 0, "VICTORY")
    ).toBe(1.25);
  });

  it("increases elite encounter pressure at difficulty 5", () => {
    expect(getDifficultyModifiers(4).eliteChanceBonus).toBe(0.08);
    expect(getDifficultyModifiers(5).eliteChanceBonus).toBe(0.24);
  });

  it("supports run-win gated relic unlocks from relic.md", () => {
    const baseProgress = {
      totalRuns: 5,
      wonRuns: 2,
      unlockedDifficultyMax: 5,
      winsByDifficulty: { "1": 1 },
    };
    expect(isRelicUnlocked("vital_flask", baseProgress)).toBe(true);
    expect(isRelicUnlocked("menders_charm", baseProgress)).toBe(true);
    expect(isRelicUnlocked("global_codex_prime", baseProgress)).toBe(false);

    const lateProgress = {
      totalRuns: 14,
      wonRuns: 10,
      unlockedDifficultyMax: 5,
      winsByDifficulty: { "1": 1, "3": 1, "4": 1 },
    };
    expect(isRelicUnlocked("global_codex_prime", lateProgress)).toBe(true);

    const unlocked = computeUnlockedRelicIds(
      ["vital_flask", "menders_charm", "global_codex_prime"],
      lateProgress
    );
    expect(unlocked).toEqual([
      "vital_flask",
      "menders_charm",
      "global_codex_prime",
    ]);
  });

  it("exposes relic unlock conditions and progress for the collection view", () => {
    const details = getRelicUnlockDetails(
      ["global_codex_prime", "guardians_seal", "vital_flask"],
      {
        totalRuns: 12,
        wonRuns: 9,
        unlockedDifficultyMax: 5,
        winsByDifficulty: { "3": 1 },
        enemyKillCounts: { chapter_guardian: 1 },
      }
    );
    const globalCodexPrime = details.global_codex_prime!;
    const guardiansSeal = details.guardians_seal!;
    const vitalFlask = details.vital_flask!;

    expect(globalCodexPrime.unlocked).toBe(false);
    expect(globalCodexPrime.requirements).toEqual([
      { type: "WON_RUNS", required: 10, current: 9 },
      { type: "WINS_BY_DIFFICULTY", difficulty: 4, required: 1, current: 0 },
    ]);
    expect(globalCodexPrime.missingRequirement).toEqual({
      type: "WON_RUNS",
      required: 10,
      current: 9,
    });

    expect(guardiansSeal.missingRequirement).toEqual({
      type: "ENEMY_KILLS",
      enemyId: "chapter_guardian",
      required: 2,
      current: 1,
    });

    expect(vitalFlask).toEqual({
      unlocked: true,
      requirements: [],
      missingRequirement: null,
    });
  });

  it("unlocks character difficulty relics only for the matching character", () => {
    let resources = unlockNextDifficultyOnVictory({}, 0, "scribe");
    resources = unlockNextDifficultyOnVictory(resources, 1, "scribe");
    resources = recordCharacterDifficultyVictory(resources, "scribe", 1);
    const characterWinsByDifficulty =
      readCharacterWinsByDifficultyFromResources(resources);

    expect(
      isRelicUnlocked("scribe_opening_glyph", {
        totalRuns: 0,
        wonRuns: 0,
        unlockedDifficultyMax: 5,
        characterWinsByDifficulty,
      })
    ).toBe(true);

    expect(
      isRelicUnlocked("bibliothecaire_margin_tabs", {
        totalRuns: 0,
        wonRuns: 0,
        unlockedDifficultyMax: 5,
        characterWinsByDifficulty,
      })
    ).toBe(false);
  });

  it("soft-backfills character clears from unlocked difficulty max for prior wins", () => {
    const resources = {
      __RUN_DIFFICULTY_UNLOCKED_MAX_scribe: 3,
    };
    const characterWinsByDifficulty =
      readCharacterWinsByDifficultyFromResources(resources);

    expect(characterWinsByDifficulty.scribe).toMatchObject({
      "0": 1,
      "1": 1,
      "2": 1,
    });

    expect(
      isRelicUnlocked("scribe_last_word", {
        totalRuns: 0,
        wonRuns: 0,
        unlockedDifficultyMax: 5,
        characterWinsByDifficulty,
      })
    ).toBe(true);

    expect(
      isRelicUnlocked("scribe_warfolio", {
        totalRuns: 0,
        wonRuns: 0,
        unlockedDifficultyMax: 5,
        characterWinsByDifficulty,
      })
    ).toBe(false);
  });

  it("tracks and uses best gold from a single run for relic unlocks", () => {
    const emptyResources = {};
    expect(getBestGoldInSingleRun(emptyResources)).toBe(0);

    const withBest = updateBestGoldInSingleRun(emptyResources, 260);
    expect(getBestGoldInSingleRun(withBest)).toBe(260);

    const noDowngrade = updateBestGoldInSingleRun(withBest, 120);
    expect(getBestGoldInSingleRun(noDowngrade)).toBe(260);

    expect(
      isRelicUnlocked("egypt_golden_canopic", {
        totalRuns: 10,
        wonRuns: 5,
        unlockedDifficultyMax: 5,
        winsByDifficulty: { "2": 1 },
        bestGoldInSingleRun: 200,
      })
    ).toBe(false);

    expect(
      isRelicUnlocked("egypt_golden_canopic", {
        totalRuns: 10,
        wonRuns: 5,
        unlockedDifficultyMax: 5,
        winsByDifficulty: { "2": 1 },
        bestGoldInSingleRun: 300,
      })
    ).toBe(true);
  });

  it("requires 2 kills of each boss to unlock its boss relic", () => {
    expect(
      isRelicUnlocked("guardians_seal", {
        totalRuns: 0,
        wonRuns: 0,
        unlockedDifficultyMax: 0,
        enemyKillCounts: { chapter_guardian: 1 },
      })
    ).toBe(false);

    expect(
      isRelicUnlocked("guardians_seal", {
        totalRuns: 0,
        wonRuns: 0,
        unlockedDifficultyMax: 0,
        enemyKillCounts: { chapter_guardian: 2 },
      })
    ).toBe(true);
  });

  it("unlocks enemy mastery relics from non-boss enemy kill thresholds", () => {
    expect(
      isRelicUnlocked("slime_ink_vial", {
        totalRuns: 0,
        wonRuns: 0,
        unlockedDifficultyMax: 0,
        enemyKillCounts: { ink_slime: 4 },
      })
    ).toBe(false);

    expect(
      isRelicUnlocked("slime_ink_vial", {
        totalRuns: 0,
        wonRuns: 0,
        unlockedDifficultyMax: 0,
        enemyKillCounts: { ink_slime: 5 },
      })
    ).toBe(true);

    expect(
      isRelicUnlocked("harbinger_storm_bell", {
        totalRuns: 0,
        wonRuns: 0,
        unlockedDifficultyMax: 0,
        enemyKillCounts: { oya_harbinger: 2 },
      })
    ).toBe(false);

    expect(
      isRelicUnlocked("harbinger_storm_bell", {
        totalRuns: 0,
        wonRuns: 0,
        unlockedDifficultyMax: 0,
        enemyKillCounts: { oya_harbinger: 3 },
      })
    ).toBe(true);

    expect(
      computeEnemyKillUnlockedRelicIds(
        ["slime_ink_vial", "harbinger_storm_bell"],
        { ink_slime: 5, oya_harbinger: 3 }
      )
    ).toEqual(["slime_ink_vial", "harbinger_storm_bell"]);
  });

  it("tracks best floor reached in infinite mode", () => {
    const emptyResources = {};
    expect(getBestInfiniteFloor(emptyResources)).toBe(0);

    const withBest = updateBestInfiniteFloor(emptyResources, 9);
    expect(getBestInfiniteFloor(withBest)).toBe(9);

    const noDowngrade = updateBestInfiniteFloor(withBest, 7);
    expect(getBestInfiniteFloor(noDowngrade)).toBe(9);
  });

  it("adds a steep post-floor-5 escalation only when enabled", () => {
    expect(getPostFloorFiveEscalation(5, false)).toEqual({
      enemyHpMultiplier: 1,
      enemyDamageMultiplier: 1,
      eliteChanceBonus: 0,
    });
    expect(getPostFloorFiveEscalation(5, true)).toEqual({
      enemyHpMultiplier: 1,
      enemyDamageMultiplier: 1,
      eliteChanceBonus: 0,
    });

    const floor6 = getPostFloorFiveEscalation(6, true);
    const floor7 = getPostFloorFiveEscalation(7, true);

    // Immediate spike right after floor 5.
    expect(floor6.enemyHpMultiplier).toBeGreaterThan(1.8);
    expect(floor6.enemyDamageMultiplier).toBeGreaterThan(1.55);
    expect(floor6.eliteChanceBonus).toBeGreaterThan(0.17);

    // Then scaling keeps ramping aggressively each floor.
    expect(floor7.enemyHpMultiplier).toBeGreaterThan(3.4);
    expect(floor7.enemyDamageMultiplier).toBeGreaterThan(2.5);
    expect(floor7.enemyHpMultiplier).toBeGreaterThan(floor6.enemyHpMultiplier);
    expect(floor7.enemyDamageMultiplier).toBeGreaterThan(
      floor6.enemyDamageMultiplier
    );
    expect(floor7.eliteChanceBonus).toBeGreaterThan(floor6.eliteChanceBonus);
  });

  it("does not gate cards/relics by difficulty anymore", () => {
    expect(
      filterCardIdsByDifficulty(["final_chapter", "redacted_blast"], 0)
    ).toEqual(["final_chapter", "redacted_blast"]);
    expect(
      filterRelicsByDifficulty(
        [
          { id: "blood_grimoire", name: "", description: "", rarity: "BOSS" },
          { id: "runic_bulwark", name: "", description: "", rarity: "RARE" },
        ],
        0
      ).map((r) => r.id)
    ).toEqual(["blood_grimoire", "runic_bulwark"]);
  });
});
