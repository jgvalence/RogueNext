import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildCardDefsMap } from "@/game/data";
import { makeTestRunState } from "@/test/factories/game-state";
import { useRunOutcomeSummary } from "./use-run-outcome-summary";

describe("useRunOutcomeSummary", () => {
  it("returns only cards and relics unlocked during the run", () => {
    const state = makeTestRunState({
      initialUnlockedCardIds: ["haunting_regret"],
      unlockedCardIds: ["haunting_regret", "mythic_blow"],
      initialUnlockedRelicIds: ["ancient_quill"],
      unlockedRelicIds: ["ancient_quill", "battle_lexicon"],
      earnedResources: {
        PAGES: 2,
        RUNES: 1,
        __RUN_CONDITION_CARD__war_dance: 1,
      },
    });

    const { result } = renderHook(() =>
      useRunOutcomeSummary({
        state,
        isInfiniteMode: false,
        cardDefs: buildCardDefsMap(),
      })
    );

    expect(result.current.earnedResourcesSummary).toEqual([
      ["PAGES", 2],
      ["RUNES", 1],
    ]);
    expect(result.current.newlyUnlockedCards.map((card) => card.id)).toEqual([
      "mythic_blow",
    ]);
    expect(result.current.newlyUnlockedRelics.map((relic) => relic.id)).toEqual(
      ["battle_lexicon"]
    );
  });

  it("does not fabricate relic unlocks for older runs without an initial relic snapshot", () => {
    const state = makeTestRunState({
      initialUnlockedRelicIds: undefined,
      unlockedRelicIds: ["ancient_quill", "battle_lexicon"],
    });

    const { result } = renderHook(() =>
      useRunOutcomeSummary({
        state,
        isInfiniteMode: false,
        cardDefs: buildCardDefsMap(),
      })
    );

    expect(result.current.newlyUnlockedRelics).toEqual([]);
  });

  it("applies repeated-difficulty reward reduction to the displayed summary", () => {
    const state = makeTestRunState({
      status: "VICTORY",
      selectedDifficultyLevel: 2,
      winsByDifficultySnapshot: { "2": 1 },
      earnedResources: {
        PAGES: 6,
        RUNES: 1,
      },
    });

    const { result } = renderHook(() =>
      useRunOutcomeSummary({
        state,
        isInfiniteMode: false,
        cardDefs: buildCardDefsMap(),
      })
    );

    expect(result.current.earnedResourceMultiplier).toBe(0.2);
    expect(result.current.earnedResourcesSummary).toEqual([["PAGES", 1]]);
  });
});
