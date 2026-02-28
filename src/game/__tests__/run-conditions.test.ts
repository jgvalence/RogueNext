import { describe, expect, it } from "vitest";
import { createRNG } from "../engine/rng";
import {
  computeUnlockedRunConditionIds,
  drawRunConditionChoices,
  getRunConditionById,
  isInfiniteRunConditionId,
  normalizeRunConditionId,
  runConditionDefinitions,
} from "../engine/run-conditions";

describe("Run conditions", () => {
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
    const early = computeUnlockedRunConditionIds({ totalRuns: 3, wonRuns: 1 });
    expect(early.includes("chaos_draft")).toBe(false);
    expect(early.includes("boss_rush")).toBe(false);

    const late = computeUnlockedRunConditionIds({ totalRuns: 9, wonRuns: 3 });
    expect(late.includes("chaos_draft")).toBe(true);
    expect(late.includes("boss_rush")).toBe(true);
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
