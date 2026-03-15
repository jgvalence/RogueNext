import { describe, expect, it } from "vitest";
import { createRNG } from "../engine/rng";
import {
  BOSS_START_OPTION_CONDITION_PREFIX,
  computeUnlockedRunConditionIds,
  drawRunConditionChoices,
  getRunConditionById,
  isInfiniteRunConditionId,
  normalizeRunConditionId,
  runConditionDefinitions,
} from "../engine/run-conditions";

describe("Run conditions", () => {
  it("defines 51 total starting options (including boss starts)", () => {
    expect(runConditionDefinitions).toHaveLength(51);
  });

  it("ensures each boss start option has a unique mechanic signature", () => {
    const bossStarts = runConditionDefinitions.filter((condition) =>
      condition.id.startsWith(BOSS_START_OPTION_CONDITION_PREFIX)
    );
    const signatures = bossStarts.map((condition) =>
      Object.keys(condition.effects.addMetaBonuses ?? {})
        .sort()
        .join("|")
    );
    expect(new Set(signatures).size).toBe(signatures.length);
  });

  it("keeps exactly three normal start choices, always including vanilla mode", () => {
    const allIds = runConditionDefinitions.map((condition) => condition.id);
    const choices = drawRunConditionChoices(
      allIds,
      createRNG("run-conditions")
    );
    expect(choices).toHaveLength(3);
    expect(new Set(choices).size).toBe(3);
    expect(choices).toContain("vanilla_run");
    expect(choices).not.toContain("infinite_mode");
  });

  it("unlocks additional conditions as progression increases", () => {
    const early = computeUnlockedRunConditionIds({ totalRuns: 0, wonRuns: 0 });
    const late = computeUnlockedRunConditionIds({ totalRuns: 6, wonRuns: 3 });
    expect(early.length).toBeGreaterThanOrEqual(7);
    expect(early.length).toBeLessThan(late.length);
  });

  it("locks advanced custom starts until their specific progression is met", () => {
    const early = computeUnlockedRunConditionIds({ totalRuns: 2, wonRuns: 1 });
    expect(early.includes("chaos_draft")).toBe(false);
    expect(early.includes("boss_rush")).toBe(false);

    const late = computeUnlockedRunConditionIds({ totalRuns: 9, wonRuns: 3 });
    expect(late.includes("chaos_draft")).toBe(true);
    expect(late.includes("boss_rush")).toBe(true);
  });

  it("unlocks boss start options after 2 kills of that boss", () => {
    const locked = computeUnlockedRunConditionIds({
      totalRuns: 20,
      wonRuns: 10,
      enemyKillCounts: { chapter_guardian: 1 },
    });
    expect(locked.includes("boss_start_option_chapter_guardian")).toBe(false);

    const unlocked = computeUnlockedRunConditionIds({
      totalRuns: 20,
      wonRuns: 10,
      enemyKillCounts: { chapter_guardian: 2 },
    });
    expect(unlocked.includes("boss_start_option_chapter_guardian")).toBe(true);
  });

  it("unlocks recursive_scratch_opening after looting Recursive Scratch once", () => {
    const locked = computeUnlockedRunConditionIds({
      totalRuns: 5,
      wonRuns: 2,
      resources: {},
    });
    expect(locked.includes("recursive_scratch_opening")).toBe(false);

    const unlocked = computeUnlockedRunConditionIds({
      totalRuns: 5,
      wonRuns: 2,
      resources: {
        __RUN_CONDITION_CARD__recursive_scratch: 1,
      },
    });
    expect(unlocked.includes("recursive_scratch_opening")).toBe(true);
  });

  it("normalizes the legacy vanilla identifier", () => {
    expect(normalizeRunConditionId("vanilla")).toBe("vanilla_run");
    expect(getRunConditionById("vanilla")?.id).toBe("vanilla_run");
  });

  it("detects the infinite run condition id", () => {
    expect(isInfiniteRunConditionId("infinite_mode")).toBe(true);
    expect(isInfiniteRunConditionId("vanilla_run")).toBe(false);
  });
});
