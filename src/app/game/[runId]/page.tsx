"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { useActiveRunDuration } from "../_hooks/use-active-run-duration";
import { useCombatTurnFlow } from "../_hooks/use-combat-turn-flow";
import { useCombatOutcome } from "../_hooks/use-combat-outcome";
import { useCombatDebugInfo } from "../_hooks/use-combat-debug-info";
import { useRewardPhaseHandlers } from "../_hooks/use-reward-phase-handlers";
import { useRunRoomActions } from "../_hooks/use-run-room-actions";
import { useRunPhaseViewHandlers } from "../_hooks/use-run-phase-view-handlers";
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
import { RunOutcomeScreen } from "../_components/run-end/RunOutcomeScreen";
import { useRunOutcomeSummary } from "../_hooks/use-run-outcome-summary";
import {
  type GamePhase,
  canOfferFreeUpgradeAtRunStart,
  deriveInitialPhase,
  isRunStartState,
} from "../_services/run-phase";
import type { AllyDefinition, EnemyDefinition } from "@/game/schemas/entities";
import { GAME_CONSTANTS } from "@/game/constants";
import { getCharacterById } from "@/game/data/characters";
import { cn } from "@/lib/utils/cn";
import { endRunAction } from "@/server/actions/run";
import type { CombatRewards } from "@/game/engine/rewards";
import { isInfiniteRunConditionId } from "@/game/engine/run-conditions";
import type { CardDefinition } from "@/game/schemas/cards";
import { startMusic, stopMusic } from "@/lib/music";
import { getUsableItemDefinitionsMap } from "@/game/engine/items";
import { localizeEnemyName } from "@/lib/i18n/entity-text";
import {
  getFirstRunForcedMapChoiceIndex,
  isFirstRunScriptedEliteRoom,
  shouldShowFirstRunMapTutorial,
} from "@/game/engine/first-run-script";

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
        isFirstRun={runData.isFirstRun ?? false}
      />
    </GameProvider>
  );
}

function GameContent({
  cardDefs,
  enemyDefs,
  allyDefs,
  isAdmin,
  isFirstRun,
}: {
  cardDefs: Map<string, CardDefinition>;
  enemyDefs: Map<string, EnemyDefinition>;
  allyDefs: Map<string, AllyDefinition>;
  isAdmin: boolean;
  isFirstRun: boolean;
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
  // Captured at room-entry time so it doesn't flip to false mid-outcome when
  // the event's apply() increments currentRoom (which would cause SpecialRoomView
  // to switch room types while showing the outcome screen).
  const [forceEventWithRelicStable, setForceEventWithRelicStable] = useState(
    () => state.floor === 1 && state.currentRoom === 2
  );
  const [rewards, setRewards] = useState<CombatRewards | null>(null);
  const [isBossRewards, setIsBossRewards] = useState(false);
  const [isEliteRewards, setIsEliteRewards] = useState(false);
  const [firstCombatTutorialDismissed, setFirstCombatTutorialDismissed] =
    useState(false);
  const [firstRewardTutorialDismissed, setFirstRewardTutorialDismissed] =
    useState(false);
  const [newBestiaryEntries, setNewBestiaryEntries] = useState<string[]>([]);
  const runEndedRef = useRef(false);
  // Always-current ref to avoid stale closures in callbacks
  const stateRef = useRef(state);
  stateRef.current = state;
  const {
    actingEnemyId,
    attackingEnemyId,
    isDiscarding,
    isResolvingEndTurn,
    handleEndTurn,
    cancelEnemyTurnFlow,
  } = useCombatTurnFlow({ dispatch, stateRef });
  const isInfiniteMode = isInfiniteRunConditionId(state.selectedRunConditionId);
  const isDevBuild = process.env.NODE_ENV !== "production";
  const usableItemDefs = useMemo(() => getUsableItemDefinitionsMap(), []);
  const showGuidedFirstRunMapTutorial = shouldShowFirstRunMapTutorial(state);
  const forcedFirstRunMapChoiceIndex = getFirstRunForcedMapChoiceIndex(state);
  const { elapsedMs, getCurrentDurationMs, buildStateSnapshot } =
    useActiveRunDuration(state.activePlayMs);
  const buildEndRunPayload = useCallback(
    () => ({
      runDurationMs: getCurrentDurationMs(),
      earnedResources: isInfiniteMode ? {} : stateRef.current.earnedResources,
      startMerchantSpentResources:
        stateRef.current.startMerchantSpentResources ?? {},
      encounteredEnemies: stateRef.current.encounteredEnemies ?? {},
      enemyKillCounts: stateRef.current.enemyKillCounts ?? {},
    }),
    [getCurrentDurationMs, isInfiniteMode]
  );

  const newBestiaryEntryNames = useMemo(
    () =>
      newBestiaryEntries.map((enemyId) =>
        localizeEnemyName(enemyId, enemyDefs.get(enemyId)?.name ?? enemyId)
      ),
    [newBestiaryEntries, enemyDefs]
  );

  useAutoSave(state, buildStateSnapshot);

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

  useEffect(() => {
    if (newBestiaryEntries.length === 0) return;
    const timer = window.setTimeout(() => setNewBestiaryEntries([]), 4200);
    return () => window.clearTimeout(timer);
  }, [newBestiaryEntries]);

  // Determine current room info
  const currentRoomChoices = state.map[state.currentRoom];

  const { handleSelectRoom, handleContinueSetup, handlePickBiome, handleHeal } =
    useRunRoomActions({
      state,
      stateRef,
      currentRoomChoices,
      dispatch,
      setPhase,
      setForceEventWithRelicStable,
      canOfferFreeUpgradeAtStart,
      hasOpeningBiomeChoice,
    });

  useCombatOutcome({
    state,
    stateRef,
    runEndedRef,
    cardDefs,
    isInfiniteMode,
    buildEndRunPayload,
    dispatch,
    setRewards,
    setIsBossRewards,
    setIsEliteRewards,
    setPhase,
    setNewBestiaryEntries,
    onCombatLost: cancelEnemyTurnFlow,
    onScriptedFirstRunDefeat: () => router.push("/library"),
  });

  const queueVictoryRunEnd = useCallback(() => {
    if (runEndedRef.current) return;
    runEndedRef.current = true;
    void endRunAction({
      runId: stateRef.current.runId,
      status: "VICTORY",
      ...buildEndRunPayload(),
    });
  }, [buildEndRunPayload]);

  // After rewards, go back to map — or biome select — or victory
  const {
    handlePickCard,
    handleSkipReward,
    handlePickRelic,
    handlePickAlly,
    handlePickMaxHp,
  } = useRewardPhaseHandlers({
    dispatch,
    isBossRewards,
    hasPendingBiomeChoices: state.pendingBiomeChoices !== null,
    queueVictoryRunEnd,
    setPhase,
    setRewards,
  });

  const {
    handleEndRun,
    handleAbandonRun,
    handleMerchantBuy,
    handleMerchantReroll,
    handleMerchantRemoveCard,
    handleMerchantLeave,
    handleSpecialUpgrade,
    handleSpecialEventChoice,
    handleSpecialEventContinue,
    handleSpecialEventPurge,
    handleSpecialSkip,
    handlePreBossHeal,
    handlePreBossUpgrade,
    handlePreBossFight,
  } = useRunPhaseViewHandlers({
    state,
    stateRef,
    runEndedRef,
    dispatch,
    setPhase,
    buildEndRunPayload,
    pushToRoute: router.push,
    cancelEnemyTurnFlow,
  });

  const { earnedResourcesSummary, newlyUnlockedCardNames } =
    useRunOutcomeSummary({
      state,
      isInfiniteMode,
      cardDefs,
    });
  const { debugEnemySelection, debugDrawInfo } = useCombatDebugInfo({
    isDevBuild,
    isAdmin,
    state,
    enemyDefs,
  });

  return (
    <GameLayout elapsedMs={elapsedMs} onAbandonRun={handleAbandonRun}>
      <div
        className={cn(
          "flex min-h-0 flex-col",
          phase === "COMBAT" && "h-full overflow-hidden"
        )}
      >
        {newBestiaryEntries.length > 0 && (
          <div className="pointer-events-none fixed right-4 top-16 z-40 max-w-sm rounded-lg border border-amber-600/80 bg-amber-950/95 px-4 py-3 shadow-xl shadow-amber-950/40">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              {t("run.newBestiaryEntryTitle")}
            </p>
            <p className="mt-1 text-sm text-amber-100">
              {newBestiaryEntryNames.length === 1
                ? t("run.newBestiaryEntrySingle", {
                    name: newBestiaryEntryNames[0],
                  })
                : t("run.newBestiaryEntryMultiple", {
                    count: newBestiaryEntryNames.length,
                  })}
            </p>
          </div>
        )}

        {phase === "MAP" && (
          <FloorMap
            map={state.map}
            currentRoom={state.currentRoom}
            floor={state.floor}
            currentBiome={state.currentBiome}
            enemyDefs={enemyDefs}
            showFirstMapTutorial={showGuidedFirstRunMapTutorial}
            forcedChoiceIndex={forcedFirstRunMapChoiceIndex}
            onSelectRoom={handleSelectRoom}
          />
        )}

        {phase === "RUN_SETUP" && (
          <RunSetupScreen
            runState={state}
            cardDefs={cardDefs}
            allyDefs={allyDefs}
            showFirstRunTutorial={isFirstRun}
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
            showFirstCombatTutorial={
              isFirstRun &&
              !firstCombatTutorialDismissed &&
              state.floor === 1 &&
              state.currentRoom === 0
            }
            onDismissFirstCombatTutorial={() =>
              setFirstCombatTutorialDismissed(true)
            }
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
            unlockedInkPowers={(() => {
              const char = getCharacterById(state.characterId ?? "scribe");
              const slots = state.metaBonuses?.unlockedPowerSlots ?? [1];
              return char.powers.filter((_, i) => slots.includes(i + 1));
            })()}
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
            shouldAutoLoseFirstRunElite={isFirstRunScriptedEliteRoom(state)}
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
            showFirstRewardTutorial={
              isFirstRun &&
              !firstRewardTutorialDismissed &&
              state.floor === 1 &&
              state.currentRoom === 0
            }
            onDismissFirstRewardTutorial={() =>
              setFirstRewardTutorialDismissed(true)
            }
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
            characterId={state.characterId ?? "scribe"}
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
            onBuy={handleMerchantBuy}
            onReroll={handleMerchantReroll}
            onRemoveCard={handleMerchantRemoveCard}
            onLeave={handleMerchantLeave}
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
            forceEventWithRelic={forceEventWithRelicStable}
            runState={state}
            onHeal={handleHeal}
            onUpgrade={handleSpecialUpgrade}
            onEventChoice={handleSpecialEventChoice}
            onEventContinue={handleSpecialEventContinue}
            onEventPurge={handleSpecialEventPurge}
            onSkip={handleSpecialSkip}
          />
        )}

        {phase === "PRE_BOSS" && (
          <PreBossRoomView
            playerCurrentHp={state.playerCurrentHp}
            playerMaxHp={state.playerMaxHp}
            deck={state.deck}
            cardDefs={cardDefs}
            onHeal={handlePreBossHeal}
            onUpgrade={handlePreBossUpgrade}
            onFight={handlePreBossFight}
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
          <RunOutcomeScreen
            status="VICTORY"
            floor={state.floor}
            currentRoom={state.currentRoom}
            gold={state.gold}
            deckSize={state.deck.length}
            relicCount={state.relicIds.length}
            earnedResourcesSummary={earnedResourcesSummary}
            newlyUnlockedCardNames={newlyUnlockedCardNames}
            onBackToLibrary={() => handleEndRun("VICTORY")}
          />
        )}

        {phase === "DEFEAT" && (
          <RunOutcomeScreen
            status="DEFEAT"
            floor={state.floor}
            currentRoom={state.currentRoom}
            gold={state.gold}
            deckSize={state.deck.length}
            relicCount={state.relicIds.length}
            earnedResourcesSummary={earnedResourcesSummary}
            newlyUnlockedCardNames={newlyUnlockedCardNames}
            onBackToLibrary={() => handleEndRun("DEFEAT")}
          />
        )}

        {phase === "ABANDONED" && (
          <RunOutcomeScreen
            status="ABANDONED"
            floor={state.floor}
            currentRoom={state.currentRoom}
            gold={state.gold}
            deckSize={state.deck.length}
            relicCount={state.relicIds.length}
            earnedResourcesSummary={earnedResourcesSummary}
            newlyUnlockedCardNames={newlyUnlockedCardNames}
            onBackToLibrary={() => handleEndRun("ABANDONED", "/library")}
          />
        )}
      </div>
    </GameLayout>
  );
}
