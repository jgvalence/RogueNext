"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { CombatRewards } from "@/game/engine/rewards";
import type { GameAction } from "../_providers/game-reducer";
import type { GamePhase } from "../_services/run-phase";

interface UseRewardPhaseHandlersParams {
  dispatch: (action: GameAction) => void;
  isBossRewards: boolean;
  rewards: CombatRewards | null;
  hasPendingBiomeChoices: boolean;
  queueVictoryRunEnd: () => void;
  setPhase: Dispatch<SetStateAction<GamePhase>>;
  setRewards: Dispatch<SetStateAction<CombatRewards | null>>;
}

export function useRewardPhaseHandlers({
  dispatch,
  isBossRewards,
  rewards,
  hasPendingBiomeChoices,
  queueVictoryRunEnd,
  setPhase,
  setRewards,
}: UseRewardPhaseHandlersParams) {
  const bossCardPicked =
    isBossRewards && rewards !== null && rewards.cardChoices.length === 0;

  const transitionAfterBossReward = useCallback(() => {
    if (hasPendingBiomeChoices) {
      setPhase("BIOME_SELECT");
      return;
    }
    queueVictoryRunEnd();
    setPhase("VICTORY");
  }, [hasPendingBiomeChoices, queueVictoryRunEnd, setPhase]);

  const transitionAfterReward = useCallback(() => {
    setRewards(null);
    if (!isBossRewards) {
      setPhase("MAP");
      return;
    }
    transitionAfterBossReward();
  }, [isBossRewards, setRewards, setPhase, transitionAfterBossReward]);

  const handlePickCard = useCallback(
    (definitionId: string) => {
      dispatch({
        type: "PICK_CARD_REWARD",
        payload: { definitionId, combatReward: true },
      });
      if (isBossRewards) {
        setRewards((prev) => (prev ? { ...prev, cardChoices: [] } : null));
        return;
      }
      transitionAfterReward();
    },
    [dispatch, isBossRewards, setRewards, transitionAfterReward]
  );

  const handleSkipReward = useCallback(() => {
    dispatch({ type: "SKIP_CARD_REWARD" });
    transitionAfterReward();
  }, [dispatch, transitionAfterReward]);

  const handlePickRelic = useCallback(
    (relicId: string) => {
      dispatch({
        type: "PICK_RELIC_REWARD",
        payload: { relicId, combatReward: true },
      });
      transitionAfterReward();
    },
    [dispatch, transitionAfterReward]
  );

  const handlePickAlly = useCallback(
    (allyId: string) => {
      dispatch({ type: "PICK_ALLY_REWARD", payload: { allyId } });
      transitionAfterReward();
    },
    [dispatch, transitionAfterReward]
  );

  const handlePickMaxHp = useCallback(
    (amount: number) => {
      dispatch({ type: "GAIN_MAX_HP", payload: { amount } });
      setRewards(null);
      transitionAfterBossReward();
    },
    [dispatch, setRewards, transitionAfterBossReward]
  );

  return {
    handlePickCard,
    handleSkipReward,
    handlePickRelic,
    handlePickAlly,
    handlePickMaxHp,
    bossCardPicked,
  };
}
