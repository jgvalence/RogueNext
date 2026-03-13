import { useMemo } from "react";
import type { CardDefinition } from "@/game/schemas/cards";
import type { RunState } from "@/game/schemas/run-state";
import { buildRelicDefsMap } from "@/game/data";
import type { RelicDefinitionData } from "@/game/data/relics";

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

  const earnedResourcesSummary = useMemo(() => {
    if (isInfiniteMode) return [] as Array<[string, number]>;
    return Object.entries(state.earnedResources ?? {})
      .filter(([, amount]) => amount > 0)
      .sort((a, b) => b[1] - a[1]);
  }, [isInfiniteMode, state.earnedResources]);

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
  }, [
    relicDefs,
    state.initialUnlockedRelicIds,
    state.unlockedRelicIds,
  ]);

  return {
    earnedResourcesSummary,
    newlyUnlockedCards,
    newlyUnlockedRelics,
  };
}
