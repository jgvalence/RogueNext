"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getActiveRunAction } from "@/server/actions/run";
import {
  useAllyDefinitions,
  useCardDefsMap,
  useEnemyDefinitions,
} from "@/lib/query/hooks/use-game-data";
import { GameProvider, useGame } from "../_providers/game-provider";
import { useAutoSave } from "../_hooks/use-auto-save";
import { GameLayout } from "../_components/shared/GameLayout";
import { CardPickerModal } from "../_components/shared/CardPickerModal";
import { CombatView } from "../_components/combat/CombatView";
import { FloorMap } from "../_components/map/FloorMap";
import { RewardScreen } from "../_components/rewards/RewardScreen";
import { ShopView } from "../_components/merchant/ShopView";
import { StartMerchantView } from "../_components/merchant/StartMerchantView";
import { SpecialRoomView } from "../_components/special/SpecialRoomView";
import { BiomeSelectScreen } from "../_components/biome/BiomeSelectScreen";
import { RunDifficultySelectScreen } from "../_components/run-difficulty/RunDifficultySelectScreen";
import { RunConditionSelectScreen } from "../_components/run-condition/RunConditionSelectScreen";
import { PreBossRoomView } from "../_components/preboss/PreBossRoomView";
import type { AllyDefinition, EnemyDefinition } from "@/game/schemas/entities";
import type { BiomeType } from "@/game/schemas/enums";
import { GAME_CONSTANTS } from "@/game/constants";
import { cn } from "@/lib/utils/cn";
import {
  applyDifficultyAction,
  applyFreeUpgradeAction,
  applyRunConditionAction,
  applySpecialEventChoiceAction,
  applySpecialHealAction,
  applySpecialUpgradeAction,
  buyShopItemAction,
  buyStartMerchantOfferAction,
  chooseBiomeAction,
  completeStartMerchantAction,
  claimCombatRewardAction,
  enterNonCombatRoomAction,
  endRunAction,
  endTurnCombatAction,
  leaveMerchantAction,
  playCardAction,
  resolveCombatVictoryAction,
  skipSpecialRoomAction,
  startCombatAction,
  useInkPowerAction as inkPowerAction,
  useUsableItemAction as usableItemAction,
} from "@/server/actions/run";
import { type CombatRewards } from "@/game/engine/rewards";
import type { CardDefinition } from "@/game/schemas/cards";
import { playSound } from "@/lib/sound";
import { startMusic, stopMusic } from "@/lib/music";
import { getUsableItemDefinitionsMap } from "@/game/engine/items";

export default function RunPage() {
  const params = useParams<{ runId: string }>();
  const { data: cardDefsMap, isLoading: cardsLoading } = useCardDefsMap();
  const { data: enemyList, isLoading: enemiesLoading } = useEnemyDefinitions();
  const { data: allyList, isLoading: alliesLoading } = useAllyDefinitions();

  const { data: runData, isLoading: runLoading } = useQuery({
    queryKey: ["game", "run", params.runId],
    queryFn: async () => {
      const result = await getActiveRunAction({ runId: params.runId });
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
  });

  const enemyDefs = useMemo(() => {
    if (!enemyList) return new Map<string, EnemyDefinition>();
    return new Map(enemyList.map((e) => [e.id, e]));
  }, [enemyList]);

  const allyDefs = useMemo(() => {
    if (!allyList) return new Map<string, AllyDefinition>();
    return new Map(allyList.map((a) => [a.id, a]));
  }, [allyList]);

  if (cardsLoading || enemiesLoading || alliesLoading || runLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p>Loading game...</p>
      </div>
    );
  }

  if (!runData?.run || !cardDefsMap || cardDefsMap.size === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p>Run not found</p>
      </div>
    );
  }

  return (
    <GameProvider
      initialState={runData.run.state}
      cardDefs={cardDefsMap}
      enemyDefs={enemyDefs}
      allyDefs={allyDefs}
    >
      <GameContent
        cardDefs={cardDefsMap}
        enemyDefs={enemyDefs}
        allyDefs={allyDefs}
        isAdmin={runData.userRole === "ADMIN"}
      />
    </GameProvider>
  );
}

type GamePhase =
  | "RUN_DIFFICULTY"
  | "START_MERCHANT"
  | "RUN_CONDITION"
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

function GameContent({
  cardDefs,
  enemyDefs,
  allyDefs,
  isAdmin,
}: {
  cardDefs: Map<string, CardDefinition>;
  enemyDefs: Map<string, EnemyDefinition>;
  allyDefs: Map<string, AllyDefinition>;
  isAdmin: boolean;
}) {
  const { state, dispatch, rng } = useGame();
  const router = useRouter();
  const hasOpeningBiomeChoice =
    state.floor === 1 &&
    state.currentRoom === 0 &&
    state.combat === null &&
    state.pendingBiomeChoices !== null;
  const canOfferFreeUpgradeAtStart =
    Boolean(state.metaBonuses?.freeUpgradePerRun) &&
    !state.freeUpgradeUsed &&
    state.floor === 1 &&
    state.currentRoom === 0 &&
    state.combat === null &&
    state.deck.some((card) => !card.upgraded);
  const [phase, setPhase] = useState<GamePhase>(() =>
    state.selectedDifficultyLevel === null
      ? "RUN_DIFFICULTY"
      : !state.startMerchantCompleted &&
          state.floor === 1 &&
          state.currentRoom === 0 &&
          state.combat === null
        ? "START_MERCHANT"
        : state.selectedRunConditionId ||
            (state.pendingRunConditionChoices?.length ?? 0) === 0
          ? canOfferFreeUpgradeAtStart
            ? "RUN_FREE_UPGRADE"
            : state.floor === 1 &&
                state.currentRoom === 0 &&
                state.pendingBiomeChoices !== null
              ? "BIOME_SELECT"
              : "MAP"
          : "RUN_CONDITION"
  );
  const [rewards, setRewards] = useState<CombatRewards | null>(null);
  const [isBossRewards, setIsBossRewards] = useState(false);
  const [isEliteRewards, setIsEliteRewards] = useState(false);
  const [actingEnemyId, setActingEnemyId] = useState<string | null>(null);
  const [attackingEnemyId, setAttackingEnemyId] = useState<string | null>(null);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [isCombatActionPending, setIsCombatActionPending] = useState(false);
  const enemyTurnCancelledRef = useRef(false);
  const runEndedRef = useRef(false);
  // Always-current ref to avoid stale closures in callbacks
  const stateRef = useRef(state);
  stateRef.current = state;
  const isDevBuild = process.env.NODE_ENV !== "production";
  const usableItemDefs = useMemo(() => getUsableItemDefinitionsMap(), []);

  useAutoSave(state);

  // Music — start/stop based on phase, clean up on unmount
  useEffect(() => {
    if (phase === "COMBAT") startMusic("combat");
    else if (
      phase === "MAP" ||
      phase === "REWARDS" ||
      phase === "MERCHANT" ||
      phase === "SPECIAL" ||
      phase === "PRE_BOSS" ||
      phase === "BIOME_SELECT" ||
      phase === "RUN_CONDITION" ||
      phase === "START_MERCHANT" ||
      phase === "RUN_DIFFICULTY"
    )
      startMusic("map");
    else stopMusic(); // VICTORY or DEFEAT
  }, [phase]);

  useEffect(() => () => stopMusic(0.3), []);

  // Determine current room info
  const currentRoomChoices = state.map[state.currentRoom];

  // Authoritative end turn resolved server-side
  const handleEndTurn = useCallback(async () => {
    if (
      !state.combat ||
      state.combat.phase !== "PLAYER_TURN" ||
      isCombatActionPending
    )
      return;

    const sleep = (ms: number) =>
      new Promise<void>((res) => setTimeout(res, ms));

    setIsCombatActionPending(true);
    try {
      if (state.combat.hand.length > 0) {
        setIsDiscarding(true);
        await sleep(350);
        setIsDiscarding(false);
      }
      const result = await endTurnCombatAction({
        runId: stateRef.current.runId,
      });
      if (!result.success) return;
      dispatch({ type: "LOAD_RUN", payload: result.data.state });
    } finally {
      setActingEnemyId(null);
      setAttackingEnemyId(null);
      setIsCombatActionPending(false);
    }
  }, [state.combat, dispatch, isCombatActionPending]);

  const handlePlayCardAuthoritative = useCallback(
    async (instanceId: string, targetId: string | null, useInked: boolean) => {
      if (
        !state.combat ||
        state.combat.phase !== "PLAYER_TURN" ||
        isCombatActionPending
      )
        return;
      setIsCombatActionPending(true);
      try {
        const result = await playCardAction({
          runId: stateRef.current.runId,
          instanceId,
          targetId,
          useInked,
        });
        if (!result.success) return;
        dispatch({ type: "LOAD_RUN", payload: result.data.state });
      } finally {
        setIsCombatActionPending(false);
      }
    },
    [dispatch, isCombatActionPending, state.combat]
  );

  const handleUseItemAuthoritative = useCallback(
    async (itemInstanceId: string, targetId: string | null) => {
      if (
        !state.combat ||
        state.combat.phase !== "PLAYER_TURN" ||
        isCombatActionPending
      )
        return;
      setIsCombatActionPending(true);
      try {
        const result = await usableItemAction({
          runId: stateRef.current.runId,
          itemInstanceId,
          targetId,
        });
        if (!result.success) return;
        dispatch({ type: "LOAD_RUN", payload: result.data.state });
      } finally {
        setIsCombatActionPending(false);
      }
    },
    [dispatch, isCombatActionPending, state.combat]
  );

  const handleUseInkPowerAuthoritative = useCallback(
    async (
      power: "REWRITE" | "LOST_CHAPTER" | "SEAL",
      targetId: string | null
    ) => {
      if (
        !state.combat ||
        state.combat.phase !== "PLAYER_TURN" ||
        isCombatActionPending
      )
        return;
      setIsCombatActionPending(true);
      try {
        const result = await inkPowerAction({
          runId: stateRef.current.runId,
          power,
          targetId,
        });
        if (!result.success) return;
        dispatch({ type: "LOAD_RUN", payload: result.data.state });
      } finally {
        setIsCombatActionPending(false);
      }
    },
    [dispatch, isCombatActionPending, state.combat]
  );

  // Start combat when room is selected and is COMBAT type
  const handleSelectRoom = useCallback(
    (choiceIndex: number) => {
      const room = currentRoomChoices?.[choiceIndex];
      if (!room) return;

      if (room.type === "COMBAT" && room.enemyIds) {
        if (isCombatActionPending) return;
        setIsCombatActionPending(true);
        void (async () => {
          try {
            const result = await startCombatAction({
              runId: stateRef.current.runId,
              choiceIndex,
            });
            if (!result.success) return;
            dispatch({ type: "LOAD_RUN", payload: result.data.state });
            setPhase("COMBAT");
          } finally {
            setIsCombatActionPending(false);
          }
        })();
      } else if (room.type === "MERCHANT") {
        void (async () => {
          const result = await enterNonCombatRoomAction({
            runId: stateRef.current.runId,
            choiceIndex,
          });
          if (!result.success) return;
          dispatch({ type: "LOAD_RUN", payload: result.data.state });
          setPhase("MERCHANT");
        })();
      } else if (room.type === "SPECIAL") {
        void (async () => {
          const result = await enterNonCombatRoomAction({
            runId: stateRef.current.runId,
            choiceIndex,
          });
          if (!result.success) return;
          dispatch({ type: "LOAD_RUN", payload: result.data.state });
          setPhase("SPECIAL");
        })();
      } else if (room.type === "PRE_BOSS") {
        void (async () => {
          const result = await enterNonCombatRoomAction({
            runId: stateRef.current.runId,
            choiceIndex,
          });
          if (!result.success) return;
          dispatch({ type: "LOAD_RUN", payload: result.data.state });
          setPhase("PRE_BOSS");
        })();
      }
    },
    [currentRoomChoices, dispatch, isCombatActionPending]
  );

  const handlePickRunCondition = useCallback(
    (conditionId: string) => {
      void (async () => {
        const result = await applyRunConditionAction({
          runId: stateRef.current.runId,
          conditionId,
        });
        if (!result.success) return;
        dispatch({ type: "LOAD_RUN", payload: result.data.state });
        const nextState = result.data.state;
        const canOfferFreeUpgrade =
          Boolean(nextState.metaBonuses?.freeUpgradePerRun) &&
          !nextState.freeUpgradeUsed &&
          nextState.floor === 1 &&
          nextState.currentRoom === 0 &&
          nextState.combat === null &&
          nextState.deck.some((card) => !card.upgraded);
        setPhase(
          canOfferFreeUpgrade
            ? "RUN_FREE_UPGRADE"
            : nextState.floor === 1 &&
                nextState.currentRoom === 0 &&
                nextState.pendingBiomeChoices !== null
              ? "BIOME_SELECT"
              : "MAP"
        );
      })();
    },
    [dispatch]
  );

  const handlePickDifficulty = useCallback(
    (difficultyLevel: number) => {
      void (async () => {
        const result = await applyDifficultyAction({
          runId: stateRef.current.runId,
          difficultyLevel,
        });
        if (!result.success) return;
        dispatch({ type: "LOAD_RUN", payload: result.data.state });
        const nextState = result.data.state;
        const canOfferFreeUpgrade =
          Boolean(nextState.metaBonuses?.freeUpgradePerRun) &&
          !nextState.freeUpgradeUsed &&
          nextState.floor === 1 &&
          nextState.currentRoom === 0 &&
          nextState.combat === null &&
          nextState.deck.some((card) => !card.upgraded);
        if (!nextState.startMerchantCompleted) {
          setPhase("START_MERCHANT");
        } else if ((nextState.pendingRunConditionChoices?.length ?? 0) > 0) {
          setPhase("RUN_CONDITION");
        } else if (canOfferFreeUpgrade) {
          setPhase("RUN_FREE_UPGRADE");
        } else if (
          nextState.floor === 1 &&
          nextState.currentRoom === 0 &&
          nextState.pendingBiomeChoices !== null
        ) {
          setPhase("BIOME_SELECT");
        } else {
          setPhase("MAP");
        }
      })();
    },
    [dispatch]
  );

  const handleCompleteStartMerchant = useCallback(async () => {
    const result = await completeStartMerchantAction({
      runId: stateRef.current.runId,
    });
    if (!result.success) return;
    dispatch({ type: "LOAD_RUN", payload: result.data.state });
    const nextState = result.data.state;
    if ((nextState.pendingRunConditionChoices?.length ?? 0) > 0) {
      setPhase("RUN_CONDITION");
    } else if (
      Boolean(nextState.metaBonuses?.freeUpgradePerRun) &&
      !nextState.freeUpgradeUsed &&
      nextState.floor === 1 &&
      nextState.currentRoom === 0 &&
      nextState.combat === null &&
      nextState.deck.some((card) => !card.upgraded)
    ) {
      setPhase("RUN_FREE_UPGRADE");
    } else if (
      nextState.floor === 1 &&
      nextState.currentRoom === 0 &&
      nextState.combat === null &&
      nextState.pendingBiomeChoices !== null
    ) {
      setPhase("BIOME_SELECT");
    } else {
      setPhase("MAP");
    }
  }, [dispatch]);

  // Handle combat end
  useEffect(() => {
    if (!state.combat) return;

    if (state.combat.phase === "COMBAT_WON") {
      if (isCombatActionPending) return;
      setIsCombatActionPending(true);
      void (async () => {
        try {
          const result = await resolveCombatVictoryAction({
            runId: stateRef.current.runId,
          });
          if (!result.success) return;
          dispatch({ type: "LOAD_RUN", payload: result.data.state });
          setRewards(result.data.rewards);
          setIsBossRewards(result.data.isBoss);
          setIsEliteRewards(result.data.isElite);
          // TEMPORARY: play victory sound (file: /public/sounds/result/victory.ogg)
          playSound("VICTORY", 0.8);
          setPhase("REWARDS");
        } finally {
          setIsCombatActionPending(false);
        }
      })();
    }

    if (state.combat.phase === "COMBAT_LOST") {
      enemyTurnCancelledRef.current = true;
      setActingEnemyId(null);
      setAttackingEnemyId(null);
      // TEMPORARY: play defeat sound (file: /public/sounds/result/defeat.ogg)
      playSound("DEFEAT", 0.8);
      // Finalise immediately so the run won't appear as "IN_PROGRESS" in the DB
      // if the player navigates away before clicking "Return to Menu".
      if (!runEndedRef.current) {
        runEndedRef.current = true;
        void endRunAction({
          runId: stateRef.current.runId,
          status: "DEFEAT",
        });
      }
      setPhase("DEFEAT");
    }
  }, [state.combat?.phase, isCombatActionPending]); // eslint-disable-line react-hooks/exhaustive-deps

  // After rewards, go back to map — or biome select — or victory
  const handleRewardProgressionAfterClaim = useCallback(
    async (nextStateRun: typeof state, wasBossRewards: boolean) => {
      dispatch({ type: "LOAD_RUN", payload: nextStateRun });
      setRewards(null);
      if (!wasBossRewards) {
        setPhase("MAP");
      } else if (nextStateRun.pendingBiomeChoices !== null) {
        setPhase("BIOME_SELECT");
      } else {
        if (!runEndedRef.current) {
          runEndedRef.current = true;
          await endRunAction({
            runId: stateRef.current.runId,
            status: "VICTORY",
          });
        }
        setPhase("VICTORY");
      }
    },
    [dispatch]
  );

  const handleClaimReward = useCallback(
    async (
      choice:
        | { type: "CARD"; definitionId: string }
        | { type: "RELIC"; relicId: string }
        | { type: "ALLY"; allyId: string }
        | { type: "MAX_HP"; amount: number }
        | { type: "SKIP" }
    ) => {
      if (isCombatActionPending) return;
      setIsCombatActionPending(true);
      try {
        const result = await claimCombatRewardAction({
          runId: stateRef.current.runId,
          choice,
        });
        if (!result.success) return;
        await handleRewardProgressionAfterClaim(
          result.data.state,
          isBossRewards
        );
      } finally {
        setIsCombatActionPending(false);
      }
    },
    [handleRewardProgressionAfterClaim, isBossRewards, isCombatActionPending]
  );

  const handlePickCard = useCallback(
    (definitionId: string) => {
      void handleClaimReward({ type: "CARD", definitionId });
    },
    [handleClaimReward]
  );

  const handleSkipReward = useCallback(() => {
    void handleClaimReward({ type: "SKIP" });
  }, [handleClaimReward]);

  const handlePickRelic = useCallback(
    (relicId: string) => {
      void handleClaimReward({ type: "RELIC", relicId });
    },
    [handleClaimReward]
  );

  const handlePickAlly = useCallback(
    (allyId: string) => {
      void handleClaimReward({ type: "ALLY", allyId });
    },
    [handleClaimReward]
  );

  const handlePickMaxHp = useCallback(
    (amount: number) => {
      void handleClaimReward({ type: "MAX_HP", amount });
    },
    [handleClaimReward]
  );

  const handlePickBiome = useCallback(
    (biome: BiomeType) => {
      void (async () => {
        const result = await chooseBiomeAction({
          runId: stateRef.current.runId,
          biome,
        });
        if (!result.success) return;
        dispatch({ type: "LOAD_RUN", payload: result.data.state });
        setPhase("MAP");
      })();
    },
    [dispatch]
  );

  // Special room actions
  const handleHeal = useCallback(() => {
    void (async () => {
      const result = await applySpecialHealAction({
        runId: stateRef.current.runId,
      });
      if (!result.success) return;
      dispatch({ type: "LOAD_RUN", payload: result.data.state });
      setPhase("MAP");
    })();
  }, [dispatch]);

  const handleEndRun = useCallback(
    async (
      status: "VICTORY" | "DEFEAT" | "ABANDONED",
      redirectTo: string = "/library"
    ) => {
      if (!runEndedRef.current) {
        runEndedRef.current = true;
        await endRunAction({
          runId: stateRef.current.runId,
          status,
        });
      }
      router.push(redirectTo);
    },
    [router]
  );

  const handleAbandonRun = useCallback(async () => {
    enemyTurnCancelledRef.current = true;
    setActingEnemyId(null);
    setAttackingEnemyId(null);
    if (!runEndedRef.current) {
      runEndedRef.current = true;
      await endRunAction({
        runId: stateRef.current.runId,
        status: "ABANDONED",
      });
    }
    setPhase("ABANDONED");
  }, []);

  const earnedResourcesSummary = useMemo(
    () =>
      Object.entries(state.earnedResources ?? {})
        .filter(([, amount]) => (amount as number) > 0)
        .sort((a, b) => (b[1] as number) - (a[1] as number)),
    [state.earnedResources]
  );

  const newlyUnlockedCardNames = useMemo(() => {
    const initial = new Set(state.initialUnlockedCardIds ?? []);
    return (state.unlockedCardIds ?? [])
      .filter((id) => !initial.has(id))
      .map((id) => cardDefs.get(id)?.name ?? id)
      .sort((a, b) => a.localeCompare(b));
  }, [state.initialUnlockedCardIds, state.unlockedCardIds, cardDefs]);

  const debugEnemySelection = useMemo(() => {
    if (!isDevBuild || !isAdmin || !state.combat) return null;

    const roomChoices = state.map[state.currentRoom];
    const selectedRoom =
      roomChoices?.find((room) => room.completed) ?? roomChoices?.[0];
    const plannedEnemyIds = selectedRoom?.enemyIds ?? [];
    const activeEnemies = state.combat.enemies.map((enemy) => {
      const def = enemyDefs.get(enemy.definitionId);
      const hasDisruption =
        def?.abilities.some((ability) =>
          ability.effects.some((effect) =>
            [
              "FREEZE_HAND_CARDS",
              "NEXT_DRAW_TO_DISCARD_THIS_TURN",
              "DISABLE_INK_POWER_THIS_TURN",
              "INCREASE_CARD_COST_THIS_TURN",
              "INCREASE_CARD_COST_NEXT_TURN",
              "REDUCE_DRAW_THIS_TURN",
              "REDUCE_DRAW_NEXT_TURN",
              "FORCE_DISCARD_RANDOM",
            ].includes(effect.type)
          )
        ) ?? false;
      return {
        instanceId: enemy.instanceId,
        definitionId: enemy.definitionId,
        biome: def?.biome ?? "UNKNOWN",
        role: def?.role ?? "UNKNOWN",
        hasDisruption,
      };
    });
    const hasThematicUnit = activeEnemies.some(
      (enemy) =>
        enemy.hasDisruption ||
        enemy.role === "SUPPORT" ||
        enemy.role === "CONTROL" ||
        enemy.role === "TANK"
    );
    return {
      floor: state.floor,
      room: state.currentRoom,
      biome: state.currentBiome,
      plannedEnemyIds,
      activeEnemies,
      hasThematicUnit,
    };
  }, [
    isAdmin,
    isDevBuild,
    enemyDefs,
    state.combat,
    state.currentBiome,
    state.currentRoom,
    state.floor,
    state.map,
  ]);

  return (
    <GameLayout onAbandonRun={handleAbandonRun}>
      <div
        className={cn(
          "flex min-h-0 flex-col",
          phase === "COMBAT" && "h-full overflow-hidden"
        )}
      >
        {phase === "MAP" && (
          <FloorMap
            map={state.map}
            currentRoom={state.currentRoom}
            floor={state.floor}
            currentBiome={state.currentBiome}
            onSelectRoom={handleSelectRoom}
          />
        )}

        {phase === "RUN_DIFFICULTY" && (
          <RunDifficultySelectScreen
            unlockedLevels={state.pendingDifficultyLevels ?? [0]}
            onSelect={handlePickDifficulty}
          />
        )}

        {phase === "RUN_CONDITION" && (
          <RunConditionSelectScreen
            conditionIds={state.pendingRunConditionChoices ?? []}
            onSelect={handlePickRunCondition}
          />
        )}

        {phase === "START_MERCHANT" && (
          <StartMerchantView
            runState={state}
            cardDefs={cardDefs}
            allyDefs={allyDefs}
            onBuy={(offerId) => {
              void (async () => {
                const result = await buyStartMerchantOfferAction({
                  runId: stateRef.current.runId,
                  offerId,
                });
                if (!result.success) return;
                dispatch({ type: "LOAD_RUN", payload: result.data.state });
              })();
            }}
            onContinue={() => {
              void handleCompleteStartMerchant();
            }}
          />
        )}

        {phase === "RUN_FREE_UPGRADE" && (
          <CardPickerModal
            title="Upgrade gratuit (Manuel de Revision)"
            subtitle="Choisis une carte non amelioree. Survole une carte pour voir son upgrade."
            cards={state.deck.filter((card) => !card.upgraded)}
            cardDefs={cardDefs}
            showUpgradePreview
            onPick={(cardInstanceId) => {
              void (async () => {
                const result = await applyFreeUpgradeAction({
                  runId: stateRef.current.runId,
                  cardInstanceId,
                });
                if (!result.success) return;
                dispatch({ type: "LOAD_RUN", payload: result.data.state });
                setPhase(hasOpeningBiomeChoice ? "BIOME_SELECT" : "MAP");
              })();
            }}
            onCancel={() => {
              setPhase(hasOpeningBiomeChoice ? "BIOME_SELECT" : "MAP");
            }}
          />
        )}

        {phase === "COMBAT" && state.combat && (
          <CombatView
            combat={state.combat}
            cardDefs={cardDefs}
            enemyDefs={enemyDefs}
            allyDefs={allyDefs}
            onPlayCard={(instanceId, targetId, useInked) =>
              void handlePlayCardAuthoritative(instanceId, targetId, useInked)
            }
            onEndTurn={handleEndTurn}
            onUseItem={(itemInstanceId, targetId) =>
              void handleUseItemAuthoritative(itemInstanceId, targetId)
            }
            onUseInkPower={(power, targetId) =>
              void handleUseInkPowerAuthoritative(power, targetId)
            }
            usableItems={state.usableItems ?? []}
            usableItemDefs={usableItemDefs}
            unlockedInkPowers={
              state.metaBonuses?.unlockedInkPowers ?? ["REWRITE"]
            }
            onCheatKillEnemy={
              isDevBuild && isAdmin
                ? (enemyInstanceId) =>
                    dispatch({
                      type: "CHEAT_KILL_ENEMY",
                      payload: { enemyInstanceId },
                    })
                : undefined
            }
            actingEnemyId={actingEnemyId}
            attackingEnemyId={attackingEnemyId}
            isDiscarding={isDiscarding}
            attackBonus={state.metaBonuses?.attackBonus ?? 0}
            debugEnemySelection={debugEnemySelection ?? undefined}
          />
        )}

        {phase === "REWARDS" && rewards && (
          <RewardScreen
            gold={rewards.gold}
            cardChoices={rewards.cardChoices}
            biomeResources={rewards.biomeResources}
            relicChoices={rewards.relicChoices}
            allyChoices={rewards.allyChoices}
            bossMaxHpBonus={rewards.bossMaxHpBonus}
            isBoss={isBossRewards}
            isElite={isEliteRewards}
            onPickCard={handlePickCard}
            onPickRelic={handlePickRelic}
            onPickAlly={handlePickAlly}
            onPickMaxHp={handlePickMaxHp}
            onSkip={handleSkipReward}
          />
        )}

        {phase === "MERCHANT" && (
          <ShopView
            floor={state.floor}
            gold={state.gold}
            relicIds={state.relicIds}
            unlockedCardIds={state.unlockedCardIds}
            unlockedDifficultyLevelSnapshot={
              state.unlockedDifficultyLevelSnapshot ?? 0
            }
            relicDiscount={state.metaBonuses?.relicDiscount ?? 0}
            cardDefs={cardDefs}
            rng={rng}
            deck={state.deck}
            usableItems={state.usableItems ?? []}
            usableItemCapacity={
              state.usableItemCapacity ?? GAME_CONSTANTS.MAX_USABLE_ITEMS
            }
            soldItemIds={state.shopSoldItemIds ?? []}
            onBuy={(itemId, purgeCardInstanceId) => {
              void (async () => {
                const result = await buyShopItemAction({
                  runId: stateRef.current.runId,
                  itemId,
                  purgeCardInstanceId,
                });
                if (!result.success) return;
                dispatch({ type: "LOAD_RUN", payload: result.data.state });
              })();
            }}
            onLeave={() => {
              void (async () => {
                const result = await leaveMerchantAction({
                  runId: stateRef.current.runId,
                });
                if (!result.success) return;
                dispatch({ type: "LOAD_RUN", payload: result.data.state });
                setPhase("MAP");
              })();
            }}
          />
        )}

        {phase === "SPECIAL" && (
          <SpecialRoomView
            playerCurrentHp={state.playerCurrentHp}
            playerMaxHp={state.playerMaxHp}
            gold={state.gold}
            deck={state.deck}
            cardDefs={cardDefs}
            rng={rng}
            difficultyLevel={state.selectedDifficultyLevel ?? 0}
            forceEventWithRelic={state.floor === 1 && state.currentRoom === 2}
            onHeal={handleHeal}
            onUpgrade={(cardInstanceId) => {
              void (async () => {
                const result = await applySpecialUpgradeAction({
                  runId: stateRef.current.runId,
                  cardInstanceId,
                });
                if (!result.success) return;
                dispatch({ type: "LOAD_RUN", payload: result.data.state });
                setPhase("MAP");
              })();
            }}
            onEventChoice={(choiceIndex, purgeCardInstanceId) => {
              void (async () => {
                const result = await applySpecialEventChoiceAction({
                  runId: stateRef.current.runId,
                  choiceIndex,
                  purgeCardInstanceId,
                });
                if (!result.success) return;
                dispatch({ type: "LOAD_RUN", payload: result.data.state });
                setPhase("MAP");
              })();
            }}
            onSkip={() => {
              void (async () => {
                const result = await skipSpecialRoomAction({
                  runId: stateRef.current.runId,
                });
                if (!result.success) return;
                dispatch({ type: "LOAD_RUN", payload: result.data.state });
                setPhase("MAP");
              })();
            }}
          />
        )}

        {phase === "PRE_BOSS" && (
          <PreBossRoomView
            playerCurrentHp={state.playerCurrentHp}
            playerMaxHp={state.playerMaxHp}
            deck={state.deck}
            cardDefs={cardDefs}
            onHeal={() => {
              void handleHeal();
            }}
            onUpgrade={(cardInstanceId) => {
              void (async () => {
                const result = await applySpecialUpgradeAction({
                  runId: stateRef.current.runId,
                  cardInstanceId,
                });
                if (!result.success) return;
                dispatch({ type: "LOAD_RUN", payload: result.data.state });
                setPhase("MAP");
              })();
            }}
            onFight={() => {
              if (isCombatActionPending) return;
              setIsCombatActionPending(true);
              void (async () => {
                try {
                  const result = await startCombatAction({
                    runId: stateRef.current.runId,
                    choiceIndex: 0,
                  });
                  if (!result.success) return;
                  dispatch({ type: "LOAD_RUN", payload: result.data.state });
                  setPhase("COMBAT");
                } finally {
                  setIsCombatActionPending(false);
                }
              })();
            }}
          />
        )}

        {phase === "BIOME_SELECT" && state.pendingBiomeChoices && (
          <BiomeSelectScreen
            choices={state.pendingBiomeChoices}
            currentFloor={state.floor}
            onChoose={handlePickBiome}
          />
        )}

        {phase === "VICTORY" && (
          <div className="flex flex-col items-center gap-4 py-4 sm:py-16">
            <h2 className="text-4xl font-bold text-green-400">Victory!</h2>
            <p className="text-gray-400">
              You conquered all {state.floor} floors of the Forbidden Library!
            </p>
            <div className="space-y-1 text-sm text-gray-500">
              <p>Gold earned: {state.gold}</p>
              <p>Deck size: {state.deck.length} cards</p>
              <p>Relics: {state.relicIds.length}</p>
            </div>
            <div className="w-full max-w-2xl space-y-3 rounded-lg border border-gray-700 bg-gray-900/60 p-4 text-sm">
              <div>
                <p className="mb-1 font-semibold text-gray-300">
                  Resources gained this run
                </p>
                {earnedResourcesSummary.length === 0 ? (
                  <p className="text-gray-500">None</p>
                ) : (
                  <ul className="space-y-0.5 text-gray-400">
                    {earnedResourcesSummary.map(([resource, amount]) => (
                      <li key={resource}>
                        {resource}: +{amount as number}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="mb-1 font-semibold text-gray-300">
                  Cards unlocked this run
                </p>
                {newlyUnlockedCardNames.length === 0 ? (
                  <p className="text-gray-500">None</p>
                ) : (
                  <ul className="space-y-0.5 text-gray-400">
                    {newlyUnlockedCardNames.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href="/library"
                className="rounded-lg border border-amber-700 px-6 py-3 font-bold text-amber-400 hover:border-amber-500 hover:text-amber-300"
                onClick={async (e) => {
                  e.preventDefault();
                  await handleEndRun("VICTORY");
                }}
              >
                Biblioth&egrave;que
              </Link>
            </div>
          </div>
        )}

        {phase === "DEFEAT" && (
          <div className="flex flex-col items-center gap-4 py-4 sm:py-16">
            <h2 className="text-4xl font-bold text-red-400">Defeat</h2>
            <p className="text-gray-400">Your story ends here...</p>
            <div className="space-y-1 text-sm text-gray-500">
              <p>
                Reached: Room {state.currentRoom}/
                {GAME_CONSTANTS.ROOMS_PER_FLOOR}
              </p>
              <p>Gold: {state.gold}</p>
            </div>
            <div className="w-full max-w-2xl space-y-3 rounded-lg border border-gray-700 bg-gray-900/60 p-4 text-sm">
              <div>
                <p className="mb-1 font-semibold text-gray-300">
                  Resources gained this run
                </p>
                {earnedResourcesSummary.length === 0 ? (
                  <p className="text-gray-500">None</p>
                ) : (
                  <ul className="space-y-0.5 text-gray-400">
                    {earnedResourcesSummary.map(([resource, amount]) => (
                      <li key={resource}>
                        {resource}: +{amount as number}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="mb-1 font-semibold text-gray-300">
                  Cards unlocked this run
                </p>
                {newlyUnlockedCardNames.length === 0 ? (
                  <p className="text-gray-500">None</p>
                ) : (
                  <ul className="space-y-0.5 text-gray-400">
                    {newlyUnlockedCardNames.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href="/library"
                className="rounded-lg border border-amber-700 px-6 py-3 font-bold text-amber-400 hover:border-amber-500 hover:text-amber-300"
                onClick={async (e) => {
                  e.preventDefault();
                  await handleEndRun("DEFEAT");
                }}
              >
                Biblioth&egrave;que
              </Link>
            </div>
          </div>
        )}

        {phase === "ABANDONED" && (
          <div className="flex flex-col items-center gap-4 py-4 sm:py-16">
            <h2 className="text-4xl font-bold text-amber-400">Run terminée</h2>
            <p className="text-gray-400">Vous avez quitté cette aventure.</p>
            <div className="space-y-1 text-sm text-gray-500">
              <p>
                Progression atteinte: Room {state.currentRoom}/
                {GAME_CONSTANTS.ROOMS_PER_FLOOR}
              </p>
              <p>Gold: {state.gold}</p>
            </div>
            <div className="w-full max-w-2xl space-y-3 rounded-lg border border-gray-700 bg-gray-900/60 p-4 text-sm">
              <div>
                <p className="mb-1 font-semibold text-gray-300">
                  Resources gained this run
                </p>
                {earnedResourcesSummary.length === 0 ? (
                  <p className="text-gray-500">None</p>
                ) : (
                  <ul className="space-y-0.5 text-gray-400">
                    {earnedResourcesSummary.map(([resource, amount]) => (
                      <li key={resource}>
                        {resource}: +{amount as number}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="mb-1 font-semibold text-gray-300">
                  Cards unlocked this run
                </p>
                {newlyUnlockedCardNames.length === 0 ? (
                  <p className="text-gray-500">None</p>
                ) : (
                  <ul className="space-y-0.5 text-gray-400">
                    {newlyUnlockedCardNames.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href="/library"
                className="rounded-lg border border-amber-700 px-6 py-3 font-bold text-amber-400 hover:border-amber-500 hover:text-amber-300"
                onClick={async (e) => {
                  e.preventDefault();
                  await handleEndRun("ABANDONED", "/library");
                }}
              >
                Biblioth&egrave;que
              </Link>
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
