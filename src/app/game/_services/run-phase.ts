import type { RunState } from "@/game/schemas/run-state";

export type GamePhase =
  | "RUN_SETUP"
  | "RUN_FREE_UPGRADE"
  | "MAP"
  | "COMBAT"
  | "REWARDS"
  | "MERCHANT"
  | "SPECIAL"
  | "PRE_BOSS"
  | "BIOME_SELECT"
  | "VICTORY"
  | "DEFEAT"
  | "ABANDONED";

export function isRunStartState(state: RunState): boolean {
  return state.floor === 1 && state.currentRoom === 0 && state.combat === null;
}

export function canOfferFreeUpgradeAtRunStart(state: RunState): boolean {
  return (
    Boolean(state.metaBonuses?.freeUpgradePerRun) &&
    !state.freeUpgradeUsed &&
    isRunStartState(state) &&
    state.deck.some((card) => !card.upgraded)
  );
}

export function deriveInitialPhase(state: RunState): GamePhase {
  if (state.status === "VICTORY") return "VICTORY";
  if (state.status === "DEFEAT") return "DEFEAT";
  if (state.status === "ABANDONED") return "ABANDONED";

  const isRunStart = isRunStartState(state);
  const needsDifficultySelection = state.selectedDifficultyLevel === null;
  const needsRunConditionSelection =
    !state.selectedRunConditionId &&
    (state.pendingRunConditionChoices?.length ?? 0) > 0;
  const needsPreGameSetup =
    isRunStart &&
    (needsDifficultySelection ||
      needsRunConditionSelection ||
      !state.startMerchantCompleted);

  if (needsPreGameSetup) {
    return "RUN_SETUP";
  }
  if (canOfferFreeUpgradeAtRunStart(state)) return "RUN_FREE_UPGRADE";
  if (state.combat !== null) return "COMBAT";
  if (state.pendingBiomeChoices !== null) return "BIOME_SELECT";

  const selectedCurrentRoom =
    state.map[state.currentRoom]?.find((room) => room.completed) ?? null;
  if (selectedCurrentRoom?.type === "MERCHANT") return "MERCHANT";
  if (selectedCurrentRoom?.type === "SPECIAL") return "SPECIAL";
  if (selectedCurrentRoom?.type === "PRE_BOSS") return "PRE_BOSS";

  return "MAP";
}
