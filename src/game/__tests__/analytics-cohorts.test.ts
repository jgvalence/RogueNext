// @vitest-environment node
import { expect, it } from "vitest";
import { summarizeAnalyticsCohorts } from "../engine/analytics-cohorts";

it("separates versions and unknown experience, excluding abandonments from completed-run win rates", () => {
  const base = {
    characterId: "scribe",
    difficultyLevel: 1,
    unlockedStoryCount: 12,
    analytics: { rulesVersion: "v2", totalRunsAtStart: 8 },
  };
  const groups = summarizeAnalyticsCohorts([
    { ...base, status: "VICTORY" },
    { ...base, status: "DEFEAT" },
    { ...base, status: "ABANDONED" },
    {
      ...base,
      status: "VICTORY",
      analytics: { rulesVersion: "v1", totalRunsAtStart: 8 },
    },
    { ...base, status: "VICTORY", analytics: {} },
    { ...base, status: "VICTORY", analytics: null },
  ]);
  expect(groups).toHaveLength(3);
  expect(groups[0]).toMatchObject({
    runs: 3,
    wins: 1,
    defeats: 1,
    abandoned: 1,
    winRate: 0.5,
  });
  expect(
    groups.some(
      (group) =>
        group.label.includes("legacy") && group.label.includes("inconnue")
    )
  ).toBe(true);
});
