"use client";

import {
  useCallback,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import { endRunAction } from "@/server/actions/run";
import type { RunState } from "@/game/schemas/run-state";
import type { GameAction } from "../_providers/game-reducer";
import type { GamePhase } from "../_services/run-phase";

type RunEndStatus = "VICTORY" | "DEFEAT" | "ABANDONED";
type BuyShopItemPayload = Extract<
  GameAction,
  { type: "BUY_SHOP_ITEM" }
>["payload"]["item"];
type ApplyEventPayload = Extract<
  GameAction,
  { type: "APPLY_EVENT" }
>["payload"];

interface UseRunPhaseViewHandlersParams<TEndPayload extends object> {
  state: RunState;
  stateRef: MutableRefObject<RunState>;
  runEndedRef: MutableRefObject<boolean>;
  dispatch: (action: GameAction) => void;
  setPhase: Dispatch<SetStateAction<GamePhase>>;
  buildEndRunPayload: () => TEndPayload;
  pushToRoute: (href: string) => void;
  cancelEnemyTurnFlow: () => void;
}

export function useRunPhaseViewHandlers<TEndPayload extends object>({
  state,
  stateRef,
  runEndedRef,
  dispatch,
  setPhase,
  buildEndRunPayload,
  pushToRoute,
  cancelEnemyTurnFlow,
}: UseRunPhaseViewHandlersParams<TEndPayload>) {
  const handleEndRun = useCallback(
    async (status: RunEndStatus, redirectTo: string = "/library") => {
      if (!runEndedRef.current) {
        runEndedRef.current = true;
        await endRunAction({
          runId: stateRef.current.runId,
          status,
          ...buildEndRunPayload(),
        });
      }
      pushToRoute(redirectTo);
    },
    [buildEndRunPayload, pushToRoute, runEndedRef, stateRef]
  );

  const handleAbandonRun = useCallback(async () => {
    cancelEnemyTurnFlow();
    if (!runEndedRef.current) {
      runEndedRef.current = true;
      await endRunAction({
        runId: stateRef.current.runId,
        status: "ABANDONED",
        ...buildEndRunPayload(),
      });
    }
    setPhase("ABANDONED");
  }, [
    buildEndRunPayload,
    cancelEnemyTurnFlow,
    runEndedRef,
    setPhase,
    stateRef,
  ]);

  const handleMerchantBuy = useCallback(
    (item: BuyShopItemPayload) => {
      dispatch({ type: "BUY_SHOP_ITEM", payload: { item } });
    },
    [dispatch]
  );

  const handleMerchantReroll = useCallback(() => {
    dispatch({ type: "REROLL_SHOP" });
  }, [dispatch]);

  const handleMerchantRemoveCard = useCallback(
    (cardInstanceId: string) => {
      dispatch({
        type: "REMOVE_CARD_FROM_DECK",
        payload: { cardInstanceId },
      });
    },
    [dispatch]
  );

  const handleMerchantLeave = useCallback(() => {
    dispatch({ type: "ADVANCE_ROOM" });
    setPhase("MAP");
  }, [dispatch, setPhase]);

  const handleSpecialUpgrade = useCallback(
    (cardInstanceId: string) => {
      dispatch({ type: "UPGRADE_CARD", payload: { cardInstanceId } });
      setPhase("MAP");
    },
    [dispatch, setPhase]
  );

  const handleSpecialEventChoice = useCallback(
    (event: ApplyEventPayload["event"], choiceIndex: number) => {
      dispatch({
        type: "APPLY_EVENT",
        payload: { event, choiceIndex },
      });
    },
    [dispatch]
  );

  const handleSpecialEventCardReward = useCallback(
    (definitionId: string) => {
      dispatch({ type: "PICK_CARD_REWARD", payload: { definitionId } });
    },
    [dispatch]
  );

  const handleSpecialEventContinue = useCallback(() => {
    setPhase("MAP");
  }, [setPhase]);

  const handleSpecialEventPurge = useCallback(
    (cardInstanceId: string) => {
      dispatch({
        type: "REMOVE_CARD_FROM_DECK",
        payload: { cardInstanceId },
      });
      dispatch({ type: "ADVANCE_ROOM" });
      setPhase("MAP");
    },
    [dispatch, setPhase]
  );

  const handleSpecialSkip = useCallback(() => {
    dispatch({ type: "ADVANCE_ROOM" });
    setPhase("MAP");
  }, [dispatch, setPhase]);

  const handlePreBossHeal = useCallback(() => {
    dispatch({ type: "APPLY_HEAL_ROOM" });
    setPhase("MAP");
  }, [dispatch, setPhase]);

  const handlePreBossUpgrade = useCallback(
    (cardInstanceId: string) => {
      dispatch({ type: "UPGRADE_CARD", payload: { cardInstanceId } });
      setPhase("MAP");
    },
    [dispatch, setPhase]
  );

  const handlePreBossFight = useCallback(() => {
    const preBossRoom = state.map[state.currentRoom]?.[0];
    if (!preBossRoom?.enemyIds) return;
    dispatch({
      type: "START_COMBAT",
      payload: { enemyIds: preBossRoom.enemyIds },
    });
    setPhase("COMBAT");
  }, [dispatch, setPhase, state.currentRoom, state.map]);

  return {
    handleEndRun,
    handleAbandonRun,
    handleMerchantBuy,
    handleMerchantReroll,
    handleMerchantRemoveCard,
    handleMerchantLeave,
    handleSpecialUpgrade,
    handleSpecialEventChoice,
    handleSpecialEventCardReward,
    handleSpecialEventContinue,
    handleSpecialEventPurge,
    handleSpecialSkip,
    handlePreBossHeal,
    handlePreBossUpgrade,
    handlePreBossFight,
  };
}
