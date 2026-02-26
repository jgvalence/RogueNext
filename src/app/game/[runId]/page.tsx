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
import { endRunAction } from "@/server/actions/run";
import {
  generateCombatRewards,
  type CombatRewards,
} from "@/game/engine/rewards";
import { createRNG } from "@/game/engine/rng";
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

  // Async end-turn with step-by-step enemy animation
  const handleEndTurn = useCallback(async () => {
    if (!state.combat || state.combat.phase !== "PLAYER_TURN") return;

    const sleep = (ms: number) =>
      new Promise<void>((res) => setTimeout(res, ms));

    // Animate cards discarding before state update
    if (state.combat.hand.length > 0) {
      setIsDiscarding(true);
      await sleep(350);
      setIsDiscarding(false);
    }

    // Collect living enemies in speed order (mirrors the engine logic)
    const sortedEnemies = [...state.combat.enemies]
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
  }, [state.combat, dispatch]);

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

  const handlePickRunCondition = useCallback(
    (conditionId: string) => {
      dispatch({ type: "APPLY_RUN_CONDITION", payload: { conditionId } });
      setPhase(
        canOfferFreeUpgradeAtStart
          ? "RUN_FREE_UPGRADE"
          : hasOpeningBiomeChoice
            ? "BIOME_SELECT"
            : "MAP"
      );
    },
    [dispatch, hasOpeningBiomeChoice, canOfferFreeUpgradeAtStart]
  );

  const handlePickDifficulty = useCallback(
    (difficultyLevel: number) => {
      dispatch({ type: "APPLY_DIFFICULTY", payload: { difficultyLevel } });
      if (!state.startMerchantCompleted) {
        setPhase("START_MERCHANT");
      } else if ((state.pendingRunConditionChoices?.length ?? 0) > 0) {
        setPhase("RUN_CONDITION");
      } else if (canOfferFreeUpgradeAtStart) {
        setPhase("RUN_FREE_UPGRADE");
      } else if (hasOpeningBiomeChoice) {
        setPhase("BIOME_SELECT");
      } else {
        setPhase("MAP");
      }
    },
    [
      dispatch,
      hasOpeningBiomeChoice,
      canOfferFreeUpgradeAtStart,
      state.startMerchantCompleted,
      state.pendingRunConditionChoices,
    ]
  );

  const handleCompleteStartMerchant = useCallback(() => {
    dispatch({ type: "COMPLETE_START_MERCHANT" });
    if ((state.pendingRunConditionChoices?.length ?? 0) > 0) {
      setPhase("RUN_CONDITION");
    } else if (canOfferFreeUpgradeAtStart) {
      setPhase("RUN_FREE_UPGRADE");
    } else if (hasOpeningBiomeChoice) {
      setPhase("BIOME_SELECT");
    } else {
      setPhase("MAP");
    }
  }, [
    dispatch,
    state.pendingRunConditionChoices,
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
        state.metaBonuses?.lootLuck ?? 0
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
          earnedResources: stateRef.current.earnedResources,
          startMerchantSpentResources:
            stateRef.current.startMerchantSpentResources ?? {},
        });
      }
      setPhase("DEFEAT");
    }
  }, [state.combat?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

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
            earnedResources: stateRef.current.earnedResources,
            startMerchantSpentResources:
              stateRef.current.startMerchantSpentResources ?? {},
          });
        }
        setPhase("VICTORY");
      }
    },
    [dispatch, isBossRewards, state.pendingBiomeChoices]
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
          earnedResources: stateRef.current.earnedResources,
          startMerchantSpentResources:
            stateRef.current.startMerchantSpentResources ?? {},
        });
      }
      setPhase("VICTORY");
    }
  }, [dispatch, isBossRewards, state.pendingBiomeChoices]);

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
            earnedResources: stateRef.current.earnedResources,
            startMerchantSpentResources:
              stateRef.current.startMerchantSpentResources ?? {},
          });
        }
        setPhase("VICTORY");
      }
    },
    [dispatch, isBossRewards, state.pendingBiomeChoices]
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
            earnedResources: stateRef.current.earnedResources,
            startMerchantSpentResources:
              stateRef.current.startMerchantSpentResources ?? {},
          });
        }
        setPhase("VICTORY");
      }
    },
    [dispatch, isBossRewards, state.pendingBiomeChoices]
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
            earnedResources: stateRef.current.earnedResources,
            startMerchantSpentResources:
              stateRef.current.startMerchantSpentResources ?? {},
          });
        }
        setPhase("VICTORY");
      }
    },
    [dispatch, state.pendingBiomeChoices]
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
          earnedResources: stateRef.current.earnedResources,
          startMerchantSpentResources:
            stateRef.current.startMerchantSpentResources ?? {},
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
        earnedResources: stateRef.current.earnedResources,
        startMerchantSpentResources:
          stateRef.current.startMerchantSpentResources ?? {},
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
            onBuy={(offer) =>
              dispatch({ type: "BUY_START_MERCHANT_OFFER", payload: { offer } })
            }
            onContinue={handleCompleteStartMerchant}
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
            onBuy={(item) =>
              dispatch({ type: "BUY_SHOP_ITEM", payload: { item } })
            }
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
