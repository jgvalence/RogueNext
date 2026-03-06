import { useMemo } from "react";
import type { CardDefinition } from "@/game/schemas/cards";
import type { RunState } from "@/game/schemas/run-state";

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
  const earnedResourcesSummary = useMemo(() => {
    if (isInfiniteMode) return [] as Array<[string, number]>;
    return Object.entries(state.earnedResources ?? {})
      .filter(([, amount]) => amount > 0)
      .sort((a, b) => b[1] - a[1]);
  }, [isInfiniteMode, state.earnedResources]);

  const newlyUnlockedCardNames = useMemo(() => {
    const initial = new Set(state.initialUnlockedCardIds ?? []);
    return (state.unlockedCardIds ?? [])
      .filter((id) => !initial.has(id))
      .map((id) => cardDefs.get(id)?.name ?? id)
      .sort((a, b) => a.localeCompare(b));
  }, [state.initialUnlockedCardIds, state.unlockedCardIds, cardDefs]);

  return {
    earnedResourcesSummary,
    newlyUnlockedCardNames,
  };
}
