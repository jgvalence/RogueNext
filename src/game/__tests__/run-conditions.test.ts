import { describe, expect, it } from "vitest";
import { createRNG } from "../engine/rng";
import {
  computeUnlockedRunConditionIds,
  drawRunConditionChoices,
  runConditionDefinitions,
} from "../engine/run-conditions";

describe("Run conditions", () => {
  it("keeps exactly three start choices when enough conditions are unlocked", () => {
    const allIds = runConditionDefinitions.map((condition) => condition.id);
    const choices = drawRunConditionChoices(
      allIds,
      createRNG("run-conditions")
    );
    expect(choices).toHaveLength(3);
    expect(new Set(choices).size).toBe(3);
  });

  it("unlocks additional conditions as progression increases", () => {
    const early = computeUnlockedRunConditionIds({ totalRuns: 0, wonRuns: 0 });
    const late = computeUnlockedRunConditionIds({ totalRuns: 6, wonRuns: 3 });
    expect(early.length).toBeGreaterThanOrEqual(6);
    expect(early.length).toBeLessThan(late.length);
  });
});
