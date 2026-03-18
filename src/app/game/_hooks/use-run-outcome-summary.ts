import { useMemo } from "react";
import type { CardDefinition } from "@/game/schemas/cards";
import type { RunState } from "@/game/schemas/run-state";
import { buildRelicDefsMap } from "@/game/data";
import type { RelicDefinitionData } from "@/game/data/relics";
import { getEarnedResourceMultiplierForRun } from "@/game/engine/difficulty";
import { isRunConditionCardLootUnlockResourceKey } from "@/game/engine/run-conditions";

interface UseRunOutcomeSummaryParams {
  state: RunState;
  isInfiniteMode: boolean;
  cardDefs: Map<string, CardDefinition>;
}

export function useRunOutcomeSummary({
  state,
  isInfiniteMode,
  cardDefs,
}: UseRunOutcomeSummaryParams) {
  const relicDefs = useMemo(() => buildRelicDefsMap(), []);

  const earnedResourceMultiplier = useMemo(() => {
    if (isInfiniteMode) return 1;
    if (
      state.status !== "VICTORY" &&
      state.status !== "DEFEAT" &&
      state.status !== "ABANDONED"
    ) {
      return 1;
    }
    return getEarnedResourceMultiplierForRun(
      state.winsByDifficultySnapshot ?? {},
      state.selectedDifficultyLevel ?? 0,
      state.status
    );
  }, [
    isInfiniteMode,
    state.selectedDifficultyLevel,
    state.status,
    state.winsByDifficultySnapshot,
  ]);

  const earnedResourcesSummary = useMemo(() => {
    if (isInfiniteMode) return [] as Array<[string, number]>;
    return Object.entries(state.earnedResources ?? {})
      .map(
        ([resourceKey, amount]) =>
          [resourceKey, Math.round(amount * earnedResourceMultiplier)] as [
            string,
            number,
          ]
      )
      .filter(
        ([resourceKey, amount]) =>
          amount > 0 && !isRunConditionCardLootUnlockResourceKey(resourceKey)
      )
      .sort((a, b) => b[1] - a[1]);
  }, [earnedResourceMultiplier, isInfiniteMode, state.earnedResources]);

  const newlyUnlockedCards = useMemo(() => {
    const initial = new Set(state.initialUnlockedCardIds ?? []);
    return (state.unlockedCardIds ?? [])
      .filter((id) => !initial.has(id))
      .map((id) => cardDefs.get(id))
      .filter((card): card is CardDefinition => Boolean(card))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [state.initialUnlockedCardIds, state.unlockedCardIds, cardDefs]);

  const newlyUnlockedRelics = useMemo(() => {
    const initial = new Set(
      state.initialUnlockedRelicIds ?? state.unlockedRelicIds ?? []
    );
    return (state.unlockedRelicIds ?? [])
      .filter((id) => !initial.has(id))
      .map((id) => relicDefs.get(id))
      .filter((relic): relic is RelicDefinitionData => Boolean(relic))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [relicDefs, state.initialUnlockedRelicIds, state.unlockedRelicIds]);

  return {
    earnedResourcesSummary,
    earnedResourceMultiplier,
    newlyUnlockedCards,
    newlyUnlockedRelics,
  };
}
