import { describe, expect, it } from "vitest";
import { GAME_CONSTANTS } from "../constants";
import {
  computeEnemyKillUnlockedRelicIds,
  eliteCanDropRelic,
  filterCardIdsByDifficulty,
  filterRelicsByDifficulty,
  getBossDebuffBonus,
  getBestInfiniteFloor,
  getBestGoldInSingleRun,
  getDifficultyModifiers,
  getDifficultyFloorRamp,
  getEarnedResourceMultiplierForRun,
  getEnemyStartingBlock,
  getPostFloorCapEscalation,
  getRelicUnlockDetails,
  hasClearedDifficultyBefore,
  hasClearedDifficultyGloballyBefore,
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
      shouldHideEnemyIntent(
        0,
        1,
        { isElite: true },
        {
          playerHand: [{ definitionId: "shrouded_omen" }],
        }
      )
    ).toBe(true);
    expect(getEnemyStartingBlock(3, 2, { isBoss: true })).toBe(0);
    expect(getEnemyStartingBlock(4, 2, { isElite: true })).toBe(0);
    expect(getBossDebuffBonus(4)).toBe(0);
    expect(eliteCanDropRelic(5, 0.2)).toBe(false);
    expect(getBossDebuffBonus(5)).toBe(1);
    expect(eliteCanDropRelic(5, 0.25)).toBe(true);
    expect(eliteCanDropRelic(5, 0.8)).toBe(true);
  });

  it("preserves normal resources after clearing a difficulty", () => {
    let resources = unlockNextDifficultyOnVictory({}, 0, "scribe");
    resources = recordCharacterDifficultyVictory(resources, "scribe", 0);

    expect(hasClearedDifficultyBefore(resources, "scribe", 0)).toBe(true);
    expect(hasClearedDifficultyGloballyBefore({ "0": 1 }, 0)).toBe(true);
    expect(hasClearedDifficultyGloballyBefore({ "0": 1 }, 1)).toBe(false);
    expect(hasClearedDifficultyBefore(resources, "scribe", 1)).toBe(false);
    expect(getEarnedResourceMultiplierForRun({ "0": 1 }, 0, "VICTORY")).toBe(
      1
    );
    expect(getEarnedResourceMultiplierForRun({}, 0, "VICTORY")).toBe(1.25);
    expect(getEarnedResourceMultiplierForRun({ "0": 1 }, 0, "DEFEAT")).toBe(
      1
    );
  });

  it("hardens high-end difficulties 4 and 5", () => {
    expect(getDifficultyModifiers(3)).toMatchObject({
      enemyDamageMultiplier: 1.13,
      disruptionWeightBonus: 0.34,
    });
    expect(getDifficultyModifiers(4)).toMatchObject({
      enemyHpMultiplier: 1.2,
      enemyDamageMultiplier: 1.14,
      eliteChanceBonus: 0.06,
      specialRoomHealWeightMultiplier: 0.98,
      disruptionWeightBonus: 0.38,
    });
    expect(getDifficultyModifiers(5).eliteChanceBonus).toBe(0.09);
  });

  it("keeps combined enemy scaling progressive without a D2 stat cliff", () => {
    for (const floor of [1, 2, 3]) {
      for (const stat of ["enemyHpMultiplier", "enemyDamageMultiplier"] as const) {
        let previous = getDifficultyFloorRamp(0, floor)[stat];
        for (let difficulty = 1; difficulty <= 5; difficulty++) {
          const current = getDifficultyFloorRamp(difficulty, floor)[stat] * getDifficultyModifiers(difficulty)[stat];
          expect(current).toBeGreaterThan(previous);
          if (difficulty >= 2) expect(current / previous).toBeLessThan(1.14);
          previous = current;
        }
      }
    }
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
      isRelicUnlocked("ink_stamp", {
        totalRuns: 0,
        wonRuns: 0,
        unlockedDifficultyMax: 5,
        characterWinsByDifficulty,
      })
    ).toBe(true);

    expect(
      isRelicUnlocked("bookmark", {
        totalRuns: 0,
        wonRuns: 0,
        unlockedDifficultyMax: 5,
        characterWinsByDifficulty,
      })
    ).toBe(false);
  });

  it("gives all four characters a five-step mastery relic track", () => {
    const tracks = {
      scribe: [
        "ink_stamp",
        "scribe_last_word",
        "scribe_warfolio",
        "scribe_sealed_edition",
        "scribe_black_index",
      ],
      bibliothecaire: [
        "bookmark",
        "bibliothecaire_quiet_lens",
        "bibliothecaire_cross_reference",
        "bibliothecaire_restricted_index",
        "bibliothecaire_grand_catalogue",
      ],
      griot: [
        "venom_grimoire",
        "venom_pouch",
        "plague_vial",
        "crimson_covenant",
        "hemorrhage_codex",
      ],
      fou: [
        "cursed_diacrit",
        "arcane_reservoir",
        "endless_codex",
        "philosophers_tome",
        "eternal_flow",
      ],
    } as const;

    for (const [characterId, relicIds] of Object.entries(tracks)) {
      const characterWinsByDifficulty = {
        [characterId]: { "1": 1, "2": 1, "3": 1, "4": 1, "5": 1 },
      };
      expect(
        relicIds.every((relicId) =>
          isRelicUnlocked(relicId, {
            totalRuns: 0,
            wonRuns: 0,
            unlockedDifficultyMax: 5,
            characterWinsByDifficulty,
          })
        )
      ).toBe(true);
    }
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
        bestGoldInSingleRun: 220,
      })
    ).toBe(false);

    expect(
      isRelicUnlocked("egypt_golden_canopic", {
        totalRuns: 10,
        wonRuns: 5,
        unlockedDifficultyMax: 5,
        winsByDifficulty: { "2": 1 },
        bestGoldInSingleRun: 240,
      })
    ).toBe(true);
  });

  it("brings pure progression relics into early-mid runs instead of late collection cleanup", () => {
    expect(
      isRelicUnlocked("library_catalog_discount", {
        totalRuns: 20,
        wonRuns: 1,
        unlockedDifficultyMax: 0,
      })
    ).toBe(false);

    expect(
      isRelicUnlocked("library_catalog_discount", {
        totalRuns: 2,
        wonRuns: 2,
        unlockedDifficultyMax: 0,
      })
    ).toBe(true);

    expect(
      isRelicUnlocked("african_sunbird_refrain", {
        totalRuns: 10,
        wonRuns: 3,
        unlockedDifficultyMax: 0,
      })
    ).toBe(false);

    expect(
      isRelicUnlocked("african_sunbird_refrain", {
        totalRuns: 10,
        wonRuns: 4,
        unlockedDifficultyMax: 0,
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

  it("adds a steep post-floor-cap escalation only when enabled", () => {
    const floorCap = GAME_CONSTANTS.MAX_FLOORS;

    expect(getPostFloorCapEscalation(floorCap, false)).toEqual({
      enemyHpMultiplier: 1,
      enemyDamageMultiplier: 1,
      eliteChanceBonus: 0,
    });
    expect(getPostFloorCapEscalation(floorCap, true)).toEqual({
      enemyHpMultiplier: 1,
      enemyDamageMultiplier: 1,
      eliteChanceBonus: 0,
    });

    const nextFloor = getPostFloorCapEscalation(floorCap + 1, true);
    const laterFloor = getPostFloorCapEscalation(floorCap + 2, true);

    // Immediate spike right after the normal floor cap.
    expect(nextFloor.enemyHpMultiplier).toBeGreaterThan(1.8);
    expect(nextFloor.enemyDamageMultiplier).toBeGreaterThan(1.55);
    expect(nextFloor.eliteChanceBonus).toBeGreaterThan(0.17);

    // Then scaling keeps ramping aggressively each floor.
    expect(laterFloor.enemyHpMultiplier).toBeGreaterThan(3.4);
    expect(laterFloor.enemyDamageMultiplier).toBeGreaterThan(2.5);
    expect(laterFloor.enemyHpMultiplier).toBeGreaterThan(
      nextFloor.enemyHpMultiplier
    );
    expect(laterFloor.enemyDamageMultiplier).toBeGreaterThan(
      nextFloor.enemyDamageMultiplier
    );
    expect(laterFloor.eliteChanceBonus).toBeGreaterThan(
      nextFloor.eliteChanceBonus
    );
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
