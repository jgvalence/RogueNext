"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
import { SpecialRoomView } from "../_components/special/SpecialRoomView";
import { BiomeSelectScreen } from "../_components/biome/BiomeSelectScreen";
import { RunSetupScreen } from "../_components/run-setup/RunSetupScreen";
import { PreBossRoomView } from "../_components/preboss/PreBossRoomView";
import type { AllyDefinition, EnemyDefinition } from "@/game/schemas/entities";
import type { BiomeType } from "@/game/schemas/enums";
import type { RunState } from "@/game/schemas/run-state";
import { GAME_CONSTANTS } from "@/game/constants";
import { cn } from "@/lib/utils/cn";
import { endRunAction } from "@/server/actions/run";
import {
  generateCombatRewards,
  type CombatRewards,
} from "@/game/engine/rewards";
import {
  getRunConditionById,
  isInfiniteRunConditionId,
} from "@/game/engine/run-conditions";
import { createRNG } from "@/game/engine/rng";
import type { CardDefinition } from "@/game/schemas/cards";
import { playSound } from "@/lib/sound";
import { startMusic, stopMusic } from "@/lib/music";
import { getUsableItemDefinitionsMap } from "@/game/engine/items";
import type { StartMerchantOffer } from "@/game/engine/merchant";

export default function RunPage() {
  const { t } = useTranslation();
  const params = useParams<{ runId: string }>();
  const { data: cardDefsMap, isLoading: cardsLoading } = useCardDefsMap();
  const { data: enemyList, isLoading: enemiesLoading } = useEnemyDefinitions();
  const { data: allyList, isLoading: alliesLoading } = useAllyDefinitions();

  const { data: runData, isLoading: runLoading } = useQuery({
    queryKey: ["game", "run", params.runId],
    queryFn: async () => {
      const result = await getActiveRunAction();
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
        <p>{t("run.loading")}</p>
      </div>
    );
  }

  if (!runData?.run || !cardDefsMap || cardDefsMap.size === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p>{t("run.notFound")}</p>
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

function isRunStartState(state: RunState): boolean {
  return state.floor === 1 && state.currentRoom === 0 && state.combat === null;
}

function canOfferFreeUpgradeAtRunStart(state: RunState): boolean {
  return (
    Boolean(state.metaBonuses?.freeUpgradePerRun) &&
    !state.freeUpgradeUsed &&
    isRunStartState(state) &&
    state.deck.some((card) => !card.upgraded)
  );
}

function deriveInitialPhase(state: RunState): GamePhase {
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
  const { t } = useTranslation();
  const { state, dispatch, rng } = useGame();
  const router = useRouter();
  const hasOpeningBiomeChoice =
    isRunStartState(state) && state.pendingBiomeChoices !== null;
  const canOfferFreeUpgradeAtStart = canOfferFreeUpgradeAtRunStart(state);
  const [phase, setPhase] = useState<GamePhase>(() =>
    deriveInitialPhase(state)
  );
  const [rewards, setRewards] = useState<CombatRewards | null>(null);
  const [isBossRewards, setIsBossRewards] = useState(false);
  const [isEliteRewards, setIsEliteRewards] = useState(false);
  const [actingEnemyId, setActingEnemyId] = useState<string | null>(null);
  const [attackingEnemyId, setAttackingEnemyId] = useState<string | null>(null);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [isResolvingEndTurn, setIsResolvingEndTurn] = useState(false);
  const enemyTurnCancelledRef = useRef(false);
  const runEndedRef = useRef(false);
  const endTurnInFlightRef = useRef(false);
  // Always-current ref to avoid stale closures in callbacks
  const stateRef = useRef(state);
  stateRef.current = state;
  const isInfiniteMode = isInfiniteRunConditionId(state.selectedRunConditionId);
  const buildEndRunPayload = useCallback(
    () => ({
      earnedResources: isInfiniteMode ? {} : stateRef.current.earnedResources,
      startMerchantSpentResources:
        stateRef.current.startMerchantSpentResources ?? {},
    }),
    [isInfiniteMode]
  );
  const isDevBuild = process.env.NODE_ENV !== "production";
  const usableItemDefs = useMemo(() => getUsableItemDefinitionsMap(), []);

  useAutoSave(state);

  // Music — start/stop based on phase, clean up on unmount
  useEffect(() => {
    if (phase === "COMBAT") {
      const enemies = state.combat?.enemies ?? [];
      const hasBoss = enemies.some((enemy) => enemy.isBoss);
      const hasElite = enemies.some((enemy) => enemy.isElite);
      startMusic(hasBoss ? "boss" : hasElite ? "elite" : "combat");
    } else if (
      phase === "MAP" ||
      phase === "REWARDS" ||
      phase === "MERCHANT" ||
      phase === "SPECIAL" ||
      phase === "PRE_BOSS" ||
      phase === "BIOME_SELECT" ||
      phase === "RUN_SETUP"
    )
      startMusic("map");
    else stopMusic(); // VICTORY or DEFEAT
  }, [phase, state.combat?.enemies]);

  useEffect(() => () => stopMusic(0.3), []);

  // Determine current room info
  const currentRoomChoices = state.map[state.currentRoom];

  // Async end-turn with step-by-step enemy animation
  const handleEndTurn = useCallback(async () => {
    const combat = stateRef.current.combat;
    if (!combat || combat.phase !== "PLAYER_TURN") return;
    if ((combat.pendingHandOverflowExhaust ?? 0) > 0) return;
    if (endTurnInFlightRef.current) return;

    const sleep = (ms: number) =>
      new Promise<void>((res) => setTimeout(res, ms));

    endTurnInFlightRef.current = true;
    setIsResolvingEndTurn(true);
    try {
      // Animate cards discarding before state update
      if (combat.hand.length > 0) {
        setIsDiscarding(true);
        await sleep(350);
        setIsDiscarding(false);
      }

      // Collect living enemies in speed order (mirrors the engine logic)
      const sortedEnemies = [...combat.enemies]
        .filter((e) => e.currentHp > 0)
        .sort((a, b) => b.speed - a.speed);

      enemyTurnCancelledRef.current = false;
      dispatch({ type: "BEGIN_ENEMY_TURN" });
      await sleep(150);

      for (const enemy of sortedEnemies) {
        if (enemyTurnCancelledRef.current) break;

        // Highlight the acting enemy
        setActingEnemyId(enemy.instanceId);
        await sleep(350);

        if (enemyTurnCancelledRef.current) break;

        // Trigger lunge + resolve the action
        setAttackingEnemyId(enemy.instanceId);
        dispatch({
          type: "EXECUTE_ENEMY_STEP",
          payload: { enemyInstanceId: enemy.instanceId },
        });
        await sleep(300);

        setAttackingEnemyId(null);
        setActingEnemyId(null);
        await sleep(150);
      }

      if (!enemyTurnCancelledRef.current) {
        dispatch({ type: "FINALIZE_ENEMY_TURN" });
      }
      setActingEnemyId(null);
      setAttackingEnemyId(null);
    } finally {
      endTurnInFlightRef.current = false;
      setIsResolvingEndTurn(false);
      setIsDiscarding(false);
    }
  }, [dispatch]);

  // Start combat when room is selected and is COMBAT type
  const handleSelectRoom = useCallback(
    (choiceIndex: number) => {
      const room = currentRoomChoices?.[choiceIndex];
      if (!room) return;

      dispatch({ type: "SELECT_ROOM", payload: { choiceIndex } });

      if (room.type === "COMBAT" && room.enemyIds) {
        dispatch({
          type: "START_COMBAT",
          payload: { enemyIds: room.enemyIds },
        });
        setPhase("COMBAT");
      } else if (room.type === "MERCHANT") {
        setPhase("MERCHANT");
      } else if (room.type === "SPECIAL") {
        setPhase("SPECIAL");
      } else if (room.type === "PRE_BOSS") {
        setPhase("PRE_BOSS");
      }
    },
    [currentRoomChoices, dispatch]
  );

  const handleSelectSetupDifficulty = useCallback(
    (difficultyLevel: number) => {
      dispatch({ type: "APPLY_DIFFICULTY", payload: { difficultyLevel } });
    },
    [dispatch]
  );

  const handleSelectSetupMode = useCallback(
    (conditionId: string) => {
      if (state.selectedDifficultyLevel === null) return;
      dispatch({ type: "APPLY_RUN_CONDITION", payload: { conditionId } });
    },
    [dispatch, state.selectedDifficultyLevel]
  );

  const handleBuySetupOffer = useCallback(
    (offer: StartMerchantOffer) => {
      dispatch({ type: "BUY_START_MERCHANT_OFFER", payload: { offer } });
    },
    [dispatch]
  );

  const handleContinueSetup = useCallback(() => {
    const hasDifficulty = state.selectedDifficultyLevel !== null;
    const needsRunConditionChoice =
      !state.selectedRunConditionId &&
      (state.pendingRunConditionChoices?.length ?? 0) > 0;
    if (!hasDifficulty || needsRunConditionChoice) return;

    if (!state.startMerchantCompleted) {
      dispatch({ type: "COMPLETE_START_MERCHANT" });
    }
    if (canOfferFreeUpgradeAtStart) {
      setPhase("RUN_FREE_UPGRADE");
    } else if (hasOpeningBiomeChoice) {
      setPhase("BIOME_SELECT");
    } else {
      setPhase("MAP");
    }
  }, [
    dispatch,
    state.selectedDifficultyLevel,
    state.selectedRunConditionId,
    state.pendingRunConditionChoices,
    state.startMerchantCompleted,
    canOfferFreeUpgradeAtStart,
    hasOpeningBiomeChoice,
  ]);

  // Handle combat end
  useEffect(() => {
    if (!state.combat) return;

    if (state.combat.phase === "COMBAT_WON") {
      const isBoss = state.currentRoom === GAME_CONSTANTS.BOSS_ROOM_INDEX;

      // Find the selected room to get enemy count and elite status
      const roomChoices = state.map[state.currentRoom];
      const selectedRoom =
        roomChoices?.find((r) => r.completed) ?? roomChoices?.[0];
      const enemyCount = selectedRoom?.enemyIds?.length ?? 1;
      const isElite = selectedRoom?.isElite ?? false;

      const defeatedBossId = isBoss ? selectedRoom?.enemyIds?.[0] : undefined;
      const combatRng = createRNG(state.seed + "-rewards-" + state.currentRoom);
      const runConditionRewardMultiplier =
        getRunConditionById(state.selectedRunConditionId)?.effects
          .combatRewardMultiplier ?? 1;
      const combatRewards = generateCombatRewards(
        state.floor,
        state.currentRoom,
        isBoss,
        isElite,
        enemyCount,
        [...cardDefs.values()],
        combatRng,
        state.currentBiome,
        state.relicIds,
        state.unlockedCardIds,
        state.allyIds,
        state.metaBonuses?.allySlots ?? 0,
        state.unlockedDifficultyLevelSnapshot ?? 0,
        defeatedBossId,
        state.metaBonuses?.extraCardRewardChoices ?? 0,
        state.metaBonuses?.lootLuck ?? 0,
        state.selectedDifficultyLevel ?? 0,
        state.unlockedRelicIds,
        runConditionRewardMultiplier,
        isInfiniteMode
      );
      setRewards(combatRewards);
      setIsBossRewards(isBoss);
      setIsEliteRewards(isElite);

      // TEMPORARY: play victory sound (file: /public/sounds/result/victory.ogg)
      playSound("VICTORY", 0.8);
      dispatch({
        type: "COMPLETE_COMBAT",
        payload: {
          goldReward: combatRewards.gold,
          biomeResources: combatRewards.biomeResources,
          usableItemDropDefinitionId: combatRewards.usableItemDropDefinitionId,
        },
      });
      setPhase("REWARDS");
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
          ...buildEndRunPayload(),
        });
      }
      setPhase("DEFEAT");
    }
  }, [state.combat?.phase, buildEndRunPayload]); // eslint-disable-line react-hooks/exhaustive-deps

  // After rewards, go back to map — or biome select — or victory
  const handlePickCard = useCallback(
    (definitionId: string) => {
      dispatch({ type: "PICK_CARD_REWARD", payload: { definitionId } });
      setRewards(null);
      if (!isBossRewards) {
        setPhase("MAP");
      } else if (state.pendingBiomeChoices !== null) {
        setPhase("BIOME_SELECT");
      } else {
        if (!runEndedRef.current) {
          runEndedRef.current = true;
          void endRunAction({
            runId: stateRef.current.runId,
            status: "VICTORY",
            ...buildEndRunPayload(),
          });
        }
        setPhase("VICTORY");
      }
    },
    [dispatch, isBossRewards, state.pendingBiomeChoices, buildEndRunPayload]
  );

  const handleSkipReward = useCallback(() => {
    dispatch({ type: "SKIP_CARD_REWARD" });
    setRewards(null);
    if (!isBossRewards) {
      setPhase("MAP");
    } else if (state.pendingBiomeChoices !== null) {
      setPhase("BIOME_SELECT");
    } else {
      if (!runEndedRef.current) {
        runEndedRef.current = true;
        void endRunAction({
          runId: stateRef.current.runId,
          status: "VICTORY",
          ...buildEndRunPayload(),
        });
      }
      setPhase("VICTORY");
    }
  }, [dispatch, isBossRewards, state.pendingBiomeChoices, buildEndRunPayload]);

  const handlePickRelic = useCallback(
    (relicId: string) => {
      dispatch({ type: "PICK_RELIC_REWARD", payload: { relicId } });
      setRewards(null);
      if (!isBossRewards) {
        setPhase("MAP");
      } else if (state.pendingBiomeChoices !== null) {
        setPhase("BIOME_SELECT");
      } else {
        if (!runEndedRef.current) {
          runEndedRef.current = true;
          void endRunAction({
            runId: stateRef.current.runId,
            status: "VICTORY",
            ...buildEndRunPayload(),
          });
        }
        setPhase("VICTORY");
      }
    },
    [dispatch, isBossRewards, state.pendingBiomeChoices, buildEndRunPayload]
  );

  const handlePickAlly = useCallback(
    (allyId: string) => {
      dispatch({ type: "PICK_ALLY_REWARD", payload: { allyId } });
      setRewards(null);
      if (!isBossRewards) {
        setPhase("MAP");
      } else if (state.pendingBiomeChoices !== null) {
        setPhase("BIOME_SELECT");
      } else {
        if (!runEndedRef.current) {
          runEndedRef.current = true;
          void endRunAction({
            runId: stateRef.current.runId,
            status: "VICTORY",
            ...buildEndRunPayload(),
          });
        }
        setPhase("VICTORY");
      }
    },
    [dispatch, isBossRewards, state.pendingBiomeChoices, buildEndRunPayload]
  );

  const handlePickMaxHp = useCallback(
    (amount: number) => {
      dispatch({ type: "GAIN_MAX_HP", payload: { amount } });
      setRewards(null);
      if (state.pendingBiomeChoices !== null) {
        setPhase("BIOME_SELECT");
      } else {
        if (!runEndedRef.current) {
          runEndedRef.current = true;
          void endRunAction({
            runId: stateRef.current.runId,
            status: "VICTORY",
            ...buildEndRunPayload(),
          });
        }
        setPhase("VICTORY");
      }
    },
    [dispatch, state.pendingBiomeChoices, buildEndRunPayload]
  );

  const handlePickBiome = useCallback(
    (biome: BiomeType) => {
      dispatch({ type: "CHOOSE_BIOME", payload: { biome } });
      setPhase("MAP");
    },
    [dispatch]
  );

  // Special room actions
  const handleHeal = useCallback(() => {
    dispatch({ type: "APPLY_HEAL_ROOM" });
    setPhase("MAP");
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
          ...buildEndRunPayload(),
        });
      }
      router.push(redirectTo);
    },
    [router, buildEndRunPayload]
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
        ...buildEndRunPayload(),
      });
    }
    setPhase("ABANDONED");
  }, [buildEndRunPayload]);

  const earnedResourcesSummary = useMemo(() => {
    if (isInfiniteMode) return [];
    return Object.entries(state.earnedResources ?? {})
      .filter(([, amount]) => (amount as number) > 0)
      .sort((a, b) => (b[1] as number) - (a[1] as number));
  }, [isInfiniteMode, state.earnedResources]);

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
  const debugDrawInfo = useMemo(() => {
    if (!isDevBuild || !isAdmin || !state.combat) return null;
    return {
      drawCount: state.combat.player.drawCount,
      handSize: state.combat.hand.length,
      maxHandSize: GAME_CONSTANTS.MAX_HAND_SIZE,
      pendingOverflow: state.combat.pendingHandOverflowExhaust ?? 0,
      history: [...(state.combat.drawDebugHistory ?? [])].slice(-12).reverse(),
    };
  }, [isAdmin, isDevBuild, state.combat]);

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

        {phase === "RUN_SETUP" && (
          <RunSetupScreen
            runState={state}
            cardDefs={cardDefs}
            allyDefs={allyDefs}
            onSelectDifficulty={handleSelectSetupDifficulty}
            onSelectMode={handleSelectSetupMode}
            onBuyStartOffer={handleBuySetupOffer}
            onContinue={handleContinueSetup}
          />
        )}

        {phase === "RUN_FREE_UPGRADE" && (
          <CardPickerModal
            title={t("run.freeUpgradeTitle")}
            subtitle={t("run.freeUpgradeSubtitle")}
            cards={state.deck.filter((card) => !card.upgraded)}
            cardDefs={cardDefs}
            showUpgradePreview
            onPick={(cardInstanceId) => {
              dispatch({
                type: "APPLY_FREE_UPGRADE",
                payload: { cardInstanceId },
              });
              setPhase(hasOpeningBiomeChoice ? "BIOME_SELECT" : "MAP");
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
              dispatch({
                type: "PLAY_CARD",
                payload: { instanceId, targetId, useInked },
              })
            }
            onEndTurn={handleEndTurn}
            onUseItem={(itemInstanceId, targetId) =>
              dispatch({
                type: "USE_USABLE_ITEM",
                payload: { itemInstanceId, targetId },
              })
            }
            onUseInkPower={(power, targetId) =>
              dispatch({
                type: "USE_INK_POWER",
                payload: { power, targetId },
              })
            }
            onResolveHandOverflowExhaust={(cardInstanceId) =>
              dispatch({
                type: "RESOLVE_HAND_OVERFLOW_EXHAUST",
                payload: { cardInstanceId },
              })
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
            isResolvingEndTurn={isResolvingEndTurn}
            attackBonus={state.metaBonuses?.attackBonus ?? 0}
            biome={state.currentBiome}
            debugEnemySelection={debugEnemySelection ?? undefined}
            debugDrawInfo={debugDrawInfo ?? undefined}
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
            unlockedRelicIds={state.unlockedRelicIds ?? []}
            unlockedDifficultyLevelSnapshot={
              state.unlockedDifficultyLevelSnapshot ?? 0
            }
            selectedDifficultyLevel={state.selectedDifficultyLevel ?? 0}
            relicDiscount={state.metaBonuses?.relicDiscount ?? 0}
            cardDefs={cardDefs}
            rng={rng}
            deck={state.deck}
            usableItems={state.usableItems ?? []}
            usableItemCapacity={
              state.usableItemCapacity ?? GAME_CONSTANTS.MAX_USABLE_ITEMS
            }
            rerollCount={state.merchantRerollCount ?? 0}
            allyIds={state.allyIds ?? []}
            allySlots={state.metaBonuses?.allySlots ?? 0}
            onBuy={(item) =>
              dispatch({ type: "BUY_SHOP_ITEM", payload: { item } })
            }
            onReroll={() => dispatch({ type: "REROLL_SHOP" })}
            onRemoveCard={(cardInstanceId) =>
              dispatch({
                type: "REMOVE_CARD_FROM_DECK",
                payload: { cardInstanceId },
              })
            }
            onLeave={() => {
              dispatch({ type: "ADVANCE_ROOM" });
              setPhase("MAP");
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
            runState={state}
            onHeal={handleHeal}
            onUpgrade={(cardInstanceId) => {
              dispatch({ type: "UPGRADE_CARD", payload: { cardInstanceId } });
              setPhase("MAP");
            }}
            onEventChoice={(event, choiceIndex) => {
              dispatch({
                type: "APPLY_EVENT",
                payload: { event, choiceIndex },
              });
              // If choice requires a purge, stay on SPECIAL screen until card is picked
              if (!event.choices[choiceIndex]?.requiresPurge) {
                setPhase("MAP");
              }
            }}
            onEventPurge={(cardInstanceId) => {
              dispatch({
                type: "REMOVE_CARD_FROM_DECK",
                payload: { cardInstanceId },
              });
              dispatch({ type: "ADVANCE_ROOM" });
              setPhase("MAP");
            }}
            onSkip={() => {
              dispatch({ type: "ADVANCE_ROOM" });
              setPhase("MAP");
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
              dispatch({ type: "APPLY_HEAL_ROOM" });
              setPhase("MAP");
            }}
            onUpgrade={(cardInstanceId) => {
              dispatch({ type: "UPGRADE_CARD", payload: { cardInstanceId } });
              setPhase("MAP");
            }}
            onFight={() => {
              const preBossRoom = state.map[state.currentRoom]?.[0];
              if (!preBossRoom?.enemyIds) return;
              dispatch({
                type: "START_COMBAT",
                payload: { enemyIds: preBossRoom.enemyIds },
              });
              setPhase("COMBAT");
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
            <h2 className="text-4xl font-bold text-green-400">
              {t("run.victoryTitle")}
            </h2>
            <p className="text-gray-400">
              {t("run.victorySubtitle", { floor: state.floor })}
            </p>
            <div className="space-y-1 text-sm text-gray-500">
              <p>{t("run.goldEarned", { gold: state.gold })}</p>
              <p>{t("run.deckSize", { count: state.deck.length })}</p>
              <p>{t("run.relicCount", { count: state.relicIds.length })}</p>
            </div>
            <div className="w-full max-w-2xl space-y-3 rounded-lg border border-gray-700 bg-gray-900/60 p-4 text-sm">
              <div>
                <p className="mb-1 font-semibold text-gray-300">
                  {t("run.resourcesGained")}
                </p>
                {earnedResourcesSummary.length === 0 ? (
                  <p className="text-gray-500">{t("run.none")}</p>
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
                  {t("run.cardsUnlocked")}
                </p>
                {newlyUnlockedCardNames.length === 0 ? (
                  <p className="text-gray-500">{t("run.none")}</p>
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
                {t("run.backToLibrary")}
              </Link>
            </div>
          </div>
        )}

        {phase === "DEFEAT" && (
          <div className="flex flex-col items-center gap-4 py-4 sm:py-16">
            <h2 className="text-4xl font-bold text-red-400">
              {t("run.defeatTitle")}
            </h2>
            <p className="text-gray-400">{t("run.defeatSubtitle")}</p>
            <div className="space-y-1 text-sm text-gray-500">
              <p>
                {t("run.reachedRoom", {
                  room: state.currentRoom,
                  total: GAME_CONSTANTS.ROOMS_PER_FLOOR,
                })}
              </p>
              <p>{t("run.goldSimple", { gold: state.gold })}</p>
            </div>
            <div className="w-full max-w-2xl space-y-3 rounded-lg border border-gray-700 bg-gray-900/60 p-4 text-sm">
              <div>
                <p className="mb-1 font-semibold text-gray-300">
                  {t("run.resourcesGained")}
                </p>
                {earnedResourcesSummary.length === 0 ? (
                  <p className="text-gray-500">{t("run.none")}</p>
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
                  {t("run.cardsUnlocked")}
                </p>
                {newlyUnlockedCardNames.length === 0 ? (
                  <p className="text-gray-500">{t("run.none")}</p>
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
                {t("run.backToLibrary")}
              </Link>
            </div>
          </div>
        )}

        {phase === "ABANDONED" && (
          <div className="flex flex-col items-center gap-4 py-4 sm:py-16">
            <h2 className="text-4xl font-bold text-amber-400">
              {t("run.abandonedTitle")}
            </h2>
            <p className="text-gray-400">{t("run.abandonedSubtitle")}</p>
            <div className="space-y-1 text-sm text-gray-500">
              <p>
                {t("run.reachedRoom", {
                  room: state.currentRoom,
                  total: GAME_CONSTANTS.ROOMS_PER_FLOOR,
                })}
              </p>
              <p>{t("run.goldSimple", { gold: state.gold })}</p>
            </div>
            <div className="w-full max-w-2xl space-y-3 rounded-lg border border-gray-700 bg-gray-900/60 p-4 text-sm">
              <div>
                <p className="mb-1 font-semibold text-gray-300">
                  {t("run.resourcesGained")}
                </p>
                {earnedResourcesSummary.length === 0 ? (
                  <p className="text-gray-500">{t("run.none")}</p>
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
                  {t("run.cardsUnlocked")}
                </p>
                {newlyUnlockedCardNames.length === 0 ? (
                  <p className="text-gray-500">{t("run.none")}</p>
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
                {t("run.backToLibrary")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
