"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { CombatState } from "@/game/schemas/combat-state";
import type { CardDefinition } from "@/game/schemas/cards";
import type { EnemyDefinition, AllyDefinition } from "@/game/schemas/entities";
import type { InkPowerType, BiomeType } from "@/game/schemas/enums";
import type {
  UsableItemDefinition,
  UsableItemInstance,
} from "@/game/schemas/items";
import { CombatPlayerZone } from "./combat-player-zone";
import { CombatBattlefield } from "./combat-battlefield";
import { CombatTargetPrompts } from "./combat-target-prompts";
import { useCombatVisualEffects } from "./use-combat-visual-effects";
import { useFirstCombatTutorial } from "./use-first-combat-tutorial";
import { useCombatInteractions } from "./use-combat-interactions";
import {
  buildIncomingDamagePreviewMap,
  getPreviewEffectsForSelectedCard,
} from "./combat-view-helpers";
import {
  MobileInkPanelOverlay,
  MobileInventoryPanelOverlay,
} from "./combat-mobile-drawers";
import { CombatMobileInfoPanel } from "./combat-mobile-info-panel";
import { CombatOverlays } from "./combat-overlays";
import { computeIncomingDamage } from "@/game/engine/incoming-damage";
import { useTranslation } from "react-i18next";
import { localizeEnemyName } from "@/lib/i18n/entity-text";
import { useGame } from "@/app/game/_providers/game-provider";
import { GAME_CONSTANTS } from "@/game/constants";
import {
  getFirstInkedCardInHand,
  getInkedCardTotalInkCost,
} from "@/game/engine/first-combat-tutorial";

interface CombatViewProps {
  combat: CombatState;
  cardDefs: Map<string, CardDefinition>;
  enemyDefs: Map<string, EnemyDefinition>;
  allyDefs: Map<string, AllyDefinition>;
  onPlayCard: (
    instanceId: string,
    targetId: string | null,
    useInked: boolean
  ) => void;
  onEndTurn: () => void;
  onUseItem: (itemInstanceId: string, targetId: string | null) => void;
  onUseInkPower: (power: InkPowerType, targetId: string | null) => void;
  onResolveHandOverflowExhaust: (cardInstanceId: string) => void;
  usableItems: UsableItemInstance[];
  usableItemDefs: Map<string, UsableItemDefinition>;
  onCheatKillEnemy?: (enemyInstanceId: string) => void;
  actingEnemyId?: string | null;
  attackingEnemyId?: string | null;
  unlockedInkPowers?: InkPowerType[];
  isDiscarding?: boolean;
  isResolvingEndTurn?: boolean;
  attackBonus?: number;
  biome?: BiomeType;
  showFirstCombatTutorial?: boolean;
  onDismissFirstCombatTutorial?: () => void;
  shouldAutoLoseFirstRunElite?: boolean;
  debugEnemySelection?: {
    floor: number;
    room: number;
    biome: string;
    plannedEnemyIds: string[];
    activeEnemies: Array<{
      instanceId: string;
      definitionId: string;
      biome: string;
      role: string;
      hasDisruption: boolean;
    }>;
    hasThematicUnit: boolean;
  };
  debugDrawInfo?: {
    drawCount: number;
    handSize: number;
    maxHandSize: number;
    pendingOverflow: number;
    history: Array<{
      turnNumber: number;
      phase:
        | "PLAYER_TURN"
        | "ALLIES_ENEMIES_TURN"
        | "COMBAT_WON"
        | "COMBAT_LOST";
      source: "PLAYER" | "ENEMY" | "SYSTEM";
      reason: string;
      requested: number;
      movedToHand: number;
      movedToDiscard: number;
      exhaustedOverflow: number;
      handBefore: number;
      handAfter: number;
      pendingOverflowAfter: number;
    }>;
  };
}

export function CombatView({
  combat,
  cardDefs,
  enemyDefs,
  allyDefs,
  onPlayCard,
  onEndTurn,
  onUseItem,
  onUseInkPower,
  onResolveHandOverflowExhaust,
  usableItems,
  usableItemDefs,
  onCheatKillEnemy,
  actingEnemyId = null,
  attackingEnemyId = null,
  unlockedInkPowers,
  isDiscarding = false,
  isResolvingEndTurn = false,
  attackBonus = 0,
  biome = "LIBRARY",
  showFirstCombatTutorial = false,
  onDismissFirstCombatTutorial,
  shouldAutoLoseFirstRunElite = false,
  debugEnemySelection: _debugEnemySelection,
  debugDrawInfo: _debugDrawInfo,
}: CombatViewProps) {
  const { t } = useTranslation();
  const { dispatch } = useGame();

  const drawBtnRef = useRef<HTMLButtonElement>(null);
  const discardBtnRef = useRef<HTMLButtonElement>(null);
  const enemyRowRef = useRef<HTMLDivElement>(null);

  const getEnemyDisplayName = useCallback(
    (enemy: CombatState["enemies"][number]) => {
      const fallbackName =
        enemyDefs.get(enemy.definitionId)?.name ??
        enemy.name ??
        enemy.definitionId;
      return localizeEnemyName(enemy.definitionId, fallbackName);
    },
    [enemyDefs]
  );

  const isPlayerTurn = combat.phase === "PLAYER_TURN";
  const pendingHandOverflowExhaust = Math.max(
    0,
    combat.pendingHandOverflowExhaust ?? 0
  );
  const isResolvingHandOverflow = pendingHandOverflowExhaust > 0;
  const canAct =
    isPlayerTurn &&
    !isResolvingEndTurn &&
    !isDiscarding &&
    !isResolvingHandOverflow;

  const {
    firstCombatTutorialStepIndex,
    furthestFirstCombatTutorialStepIndex,
    firstCombatTutorialCurrentStep,
    firstCombatTutorialTotalSteps,
    isFirstCombatTutorialVisible,
    isLastFirstCombatTutorialStep,
    isArmorTutorialStep,
    isCardsTutorialStep,
    isEnergyTutorialStep,
    isIncomingDamageTutorialStep,
    isInkTutorialStep,
    isInkPowersTutorialStep,
    isInkedCardTutorialStep,
    isDeckCycleTutorialStep,
    isEndTurnTutorialStep,
    dismissFirstCombatTutorial,
    handleFirstCombatTutorialNext,
    handleFirstCombatTutorialPrevious,
  } = useFirstCombatTutorial({
    showFirstCombatTutorial,
    onDismissFirstCombatTutorial,
  });

  const tutorialInkedCard = useMemo(
    () => getFirstInkedCardInHand(combat, cardDefs),
    [combat, cardDefs]
  );
  const tutorialInkedCardId = tutorialInkedCard?.instanceId ?? null;
  const tutorialInkedCardInkCost = useMemo(
    () =>
      tutorialInkedCard
        ? getInkedCardTotalInkCost(tutorialInkedCard, cardDefs)
        : 0,
    [tutorialInkedCard, cardDefs]
  );
  const tutorialPrimaryInkPower = unlockedInkPowers?.[0] ?? null;
  const interactionCanAct =
    canAct &&
    (!isFirstCombatTutorialVisible ||
      isInkPowersTutorialStep ||
      isInkedCardTutorialStep);
  const disableCardInteractions =
    isFirstCombatTutorialVisible && !isInkedCardTutorialStep;
  const allowedInkPowers = !isFirstCombatTutorialVisible
    ? null
    : isInkPowersTutorialStep && tutorialPrimaryInkPower
      ? [tutorialPrimaryInkPower]
      : [];
  const canUseItems = canAct && !isFirstCombatTutorialVisible;
  const canEndTurn =
    canAct && (!isFirstCombatTutorialVisible || isEndTurnTutorialStep);
  const hasAlreadyAdvancedPastCurrentTutorialStep =
    firstCombatTutorialStepIndex < furthestFirstCombatTutorialStepIndex;
  const isFirstCombatTutorialNextDisabled =
    (isInkPowersTutorialStep ||
      isInkedCardTutorialStep ||
      isEndTurnTutorialStep) &&
    !hasAlreadyAdvancedPastCurrentTutorialStep;

  const handleTutorialPlayCard = useCallback(
    (instanceId: string, targetId: string | null, useInked: boolean) => {
      if (!isFirstCombatTutorialVisible) {
        onPlayCard(instanceId, targetId, useInked);
        return;
      }

      if (!isInkedCardTutorialStep) return;
      if (!useInked) return;
      if (tutorialInkedCardId && instanceId !== tutorialInkedCardId) return;

      onPlayCard(instanceId, targetId, true);
      handleFirstCombatTutorialNext();
    },
    [
      isFirstCombatTutorialVisible,
      isInkedCardTutorialStep,
      tutorialInkedCardId,
      onPlayCard,
      handleFirstCombatTutorialNext,
    ]
  );

  const handleTutorialUseInkPower = useCallback(
    (power: InkPowerType, targetId: string | null) => {
      if (!isFirstCombatTutorialVisible) {
        onUseInkPower(power, targetId);
        return;
      }

      if (!isInkPowersTutorialStep) return;
      if (!tutorialPrimaryInkPower || power !== tutorialPrimaryInkPower) return;

      onUseInkPower(power, targetId);
      handleFirstCombatTutorialNext();
    },
    [
      isFirstCombatTutorialVisible,
      isInkPowersTutorialStep,
      tutorialPrimaryInkPower,
      onUseInkPower,
      handleFirstCombatTutorialNext,
    ]
  );

  const handleTutorialEndTurn = useCallback(() => {
    if (isFirstCombatTutorialVisible && !isEndTurnTutorialStep) return;
    if (isFirstCombatTutorialVisible) {
      dismissFirstCombatTutorial();
    }
    onEndTurn();
  }, [
    isFirstCombatTutorialVisible,
    isEndTurnTutorialStep,
    dismissFirstCombatTutorial,
    onEndTurn,
  ]);

  const {
    selectedCardId,
    selectedUsableItemId,
    pendingInked,
    openPile,
    pendingDiscardTargetInkPower,
    isSelectingRewriteTarget,
    pendingEnemyTargetInkPower,
    isSelectingCheatKillTarget,
    mobileInfoPanel,
    mobileInkPanelOpen,
    mobileInventoryPanelOpen,
    playingCardId,
    selectedDef,
    selectedUsableItemDef,
    needsTarget,
    needsItemEnemyTarget,
    selectingEnemyTarget,
    selectingAllyTarget,
    selfCanRetargetToAlly,
    pileTitle,
    pileCards,
    handleEnemyClick,
    handleMobileEnemyPress,
    handleAllyClick,
    handleMobileAllyPress,
    handlePlayCard,
    handleUseItemClick,
    handleOpenDrawPile,
    handleOpenDiscardPile,
    handleOpenExhaustPile,
    handleToggleCheatKill,
    handleUseInkPower,
    closePileOverlay,
    handleGlobalClick,
    closeMobileInfoPanel,
    openMobilePlayerInfo,
    closeMobileInkPanel,
    closeMobileInventoryPanel,
    handleMobileInkPowerUse,
    handleMobileInventoryItemUse,
    resetInteractionState,
  } = useCombatInteractions({
    combat,
    cardDefs,
    usableItems,
    usableItemDefs,
    onPlayCard: handleTutorialPlayCard,
    onUseItem,
    onUseInkPower: handleTutorialUseInkPower,
    onCheatKillEnemy,
    canAct: interactionCanAct,
  });

  useEffect(() => {
    if (!isFirstCombatTutorialVisible) return;

    dispatch({
      type: "SYNC_FIRST_COMBAT_TUTORIAL_STATE",
      payload: {
        ensureInkedCardInHand: true,
        minimumInkCurrent: isInkPowersTutorialStep
          ? tutorialPrimaryInkPower
            ? GAME_CONSTANTS.INK_POWER_COSTS[tutorialPrimaryInkPower]
            : 0
          : isInkedCardTutorialStep
            ? tutorialInkedCardInkCost
            : undefined,
      },
    });
  }, [
    dispatch,
    isFirstCombatTutorialVisible,
    isInkPowersTutorialStep,
    tutorialPrimaryInkPower,
    isInkedCardTutorialStep,
    tutorialInkedCardInkCost,
  ]);

  useEffect(() => {
    if (!isFirstCombatTutorialVisible) return;
    resetInteractionState();
  }, [
    isFirstCombatTutorialVisible,
    firstCombatTutorialCurrentStep,
    resetInteractionState,
  ]);

  useEffect(() => {
    if (!shouldAutoLoseFirstRunElite) return;
    if (combat.phase !== "PLAYER_TURN") return;

    const timeoutId = window.setTimeout(() => {
      dispatch({ type: "FORCE_TUTORIAL_COMBAT_DEFEAT" });
    }, 1400);

    return () => window.clearTimeout(timeoutId);
  }, [combat.phase, dispatch, shouldAutoLoseFirstRunElite]);

  const previewEffects = useMemo(
    () =>
      selectedDef && selectedCardId
        ? getPreviewEffectsForSelectedCard(
            selectedDef,
            combat.hand.find((card) => card.instanceId === selectedCardId)
              ?.upgraded ?? false,
            pendingInked,
            attackBonus
          )
        : [],
    [selectedDef, selectedCardId, combat.hand, pendingInked, attackBonus]
  );

  const incomingDamageByEnemyId = useMemo(
    () =>
      buildIncomingDamagePreviewMap(
        combat,
        selectedDef,
        previewEffects,
        selectedCardId
      ),
    [combat, selectedDef, previewEffects, selectedCardId]
  );

  const allySlots = useMemo(
    () => Array.from({ length: 3 }, (_, index) => combat.allies[index] ?? null),
    [combat.allies]
  );
  const enemySlots = useMemo(
    () =>
      Array.from({ length: 4 }, (_, index) => combat.enemies[index] ?? null),
    [combat.enemies]
  );
  const incomingDamage = useMemo(
    () =>
      combat.phase === "PLAYER_TURN"
        ? computeIncomingDamage(combat, enemyDefs)
        : { player: 0, allies: {} as Record<string, number> },
    [combat, enemyDefs]
  );

  const {
    newlySummonedIds,
    summonAnnouncement,
    reshuffleFx,
    reshuffleCards,
    playerHit,
    bgFailed,
    setBgFailed,
    avatarFailed,
    setAvatarFailed,
    enemyArtFailures,
    markEnemyArtFailure,
  } = useCombatVisualEffects({
    combat,
    actingEnemyId,
    drawBtnRef,
    discardBtnRef,
    getEnemyDisplayName,
  });

  const endTurnClass = canEndTurn
    ? "border border-emerald-300/30 bg-emerald-600 text-white shadow-[0_0_18px_rgba(16,185,129,0.35)] hover:bg-emerald-500"
    : "cursor-not-allowed border border-slate-700 bg-slate-700 text-slate-500 opacity-50";

  let turnBadgeClass = "bg-slate-700 text-slate-400";
  if (isPlayerTurn) turnBadgeClass = "bg-emerald-900/80 text-emerald-300";
  else if (combat.phase === "ALLIES_ENEMIES_TURN")
    turnBadgeClass = "bg-red-900/80 text-red-300";
  else if (combat.phase === "COMBAT_WON")
    turnBadgeClass = "bg-yellow-900/80 text-yellow-300";
  else if (combat.phase === "COMBAT_LOST")
    turnBadgeClass = "bg-red-900/80 text-red-300";

  const turnLabel = isPlayerTurn
    ? t("combat.yourTurn")
    : combat.phase === "ALLIES_ENEMIES_TURN"
      ? t("combat.enemyTurn")
      : combat.phase.replace(/_/g, " ");

  return (
    <div
      className="relative flex h-full min-h-0 flex-col overflow-y-auto overflow-x-hidden lg:overflow-hidden"
      onClick={handleGlobalClick}
    >
      <CombatBattlefield
        biome={biome}
        bgFailed={bgFailed}
        onBackgroundError={() => setBgFailed(true)}
        turnNumber={combat.turnNumber}
        turnBadgeClass={turnBadgeClass}
        turnLabel={turnLabel}
        isFirstCombatTutorialVisible={isFirstCombatTutorialVisible}
        firstCombatTutorialCurrentStep={firstCombatTutorialCurrentStep}
        firstCombatTutorialStepIndex={firstCombatTutorialStepIndex}
        firstCombatTutorialTotalSteps={firstCombatTutorialTotalSteps}
        isLastFirstCombatTutorialStep={isLastFirstCombatTutorialStep}
        isNextFirstCombatTutorialDisabled={isFirstCombatTutorialNextDisabled}
        onDismissFirstCombatTutorial={dismissFirstCombatTutorial}
        onPreviousFirstCombatTutorial={handleFirstCombatTutorialPrevious}
        onNextFirstCombatTutorial={handleFirstCombatTutorialNext}
        summonAnnouncement={summonAnnouncement}
        enemyRowRef={enemyRowRef}
        combat={combat}
        allyDefs={allyDefs}
        enemyDefs={enemyDefs}
        selectingEnemyTarget={selectingEnemyTarget}
        selectingAllyTarget={selectingAllyTarget}
        selfCanRetargetToAlly={selfCanRetargetToAlly}
        selectedCardId={selectedCardId}
        actingEnemyId={actingEnemyId}
        attackingEnemyId={attackingEnemyId}
        isSelectingCheatKillTarget={isSelectingCheatKillTarget}
        newlySummonedIds={newlySummonedIds}
        enemyArtFailures={enemyArtFailures}
        playerHit={playerHit}
        avatarFailed={avatarFailed}
        onAvatarError={() => setAvatarFailed(true)}
        onMobileAllyPress={handleMobileAllyPress}
        onMobileEnemyPress={handleMobileEnemyPress}
        onOpenPlayerInfo={openMobilePlayerInfo}
        getEnemyDisplayName={getEnemyDisplayName}
        markEnemyArtFailure={markEnemyArtFailure}
        isArmorTutorialStep={isArmorTutorialStep}
        allySlots={allySlots}
        enemySlots={enemySlots}
        incomingDamage={incomingDamage}
        incomingDamageByEnemyId={incomingDamageByEnemyId}
        onAllyClick={handleAllyClick}
        onEnemyClick={handleEnemyClick}
        isIncomingDamageTutorialStep={isIncomingDamageTutorialStep}
      >
        <CombatTargetPrompts
          needsTarget={needsTarget}
          selectedCardId={selectedCardId}
          selectingAllyTarget={selectingAllyTarget}
          selectedDef={selectedDef}
          selfCanRetargetToAlly={selfCanRetargetToAlly}
          needsItemEnemyTarget={needsItemEnemyTarget}
          selectedUsableItemDef={selectedUsableItemDef}
          pendingEnemyTargetInkPower={pendingEnemyTargetInkPower}
          isSelectingCheatKillTarget={isSelectingCheatKillTarget}
        />
      </CombatBattlefield>

      <CombatPlayerZone
        combat={combat}
        cardDefs={cardDefs}
        selectedCardId={selectedCardId}
        pendingInked={pendingInked}
        onPlayCard={handlePlayCard}
        isDiscarding={isDiscarding}
        playingCardId={playingCardId}
        drawBtnRef={drawBtnRef}
        discardBtnRef={discardBtnRef}
        enemyRowRef={enemyRowRef}
        isInkTutorialStep={isInkTutorialStep}
        isInkPowersTutorialStep={isInkPowersTutorialStep}
        isInkedCardTutorialStep={isInkedCardTutorialStep}
        isEnergyTutorialStep={isEnergyTutorialStep}
        isCardsTutorialStep={isCardsTutorialStep}
        isEndTurnTutorialStep={isEndTurnTutorialStep}
        isDeckCycleTutorialStep={isDeckCycleTutorialStep}
        reshuffleFx={reshuffleFx}
        unlockedInkPowers={unlockedInkPowers}
        allowedInkPowers={allowedInkPowers}
        onUseInkPower={handleUseInkPower}
        onOpenDrawPile={handleOpenDrawPile}
        onOpenDiscardPile={handleOpenDiscardPile}
        onOpenExhaustPile={handleOpenExhaustPile}
        usableItems={usableItems}
        usableItemDefs={usableItemDefs}
        selectedUsableItemId={selectedUsableItemId}
        disableCardInteractions={disableCardInteractions}
        tutorialPlayableInkedCardId={
          isInkedCardTutorialStep ? tutorialInkedCardId : null
        }
        canUseItems={canUseItems}
        canEndTurn={canEndTurn}
        onUseItemClick={handleUseItemClick}
        onEndTurn={handleTutorialEndTurn}
        endTurnClass={endTurnClass}
        showCheatKillButton={Boolean(onCheatKillEnemy)}
        isSelectingCheatKillTarget={isSelectingCheatKillTarget}
        onToggleCheatKill={handleToggleCheatKill}
      />

      <CombatMobileInfoPanel
        mobileInfoPanel={mobileInfoPanel}
        combat={combat}
        enemyDefs={enemyDefs}
        allyDefs={allyDefs}
        selectingEnemyTarget={selectingEnemyTarget}
        selectingAllyTarget={selectingAllyTarget}
        selfCanRetargetToAlly={selfCanRetargetToAlly}
        selectedCardId={selectedCardId}
        actingEnemyId={actingEnemyId}
        getEnemyDisplayName={getEnemyDisplayName}
        onEnemyTarget={handleEnemyClick}
        onAllyTarget={handleAllyClick}
        onClose={closeMobileInfoPanel}
      />

      <MobileInkPanelOverlay
        isOpen={mobileInkPanelOpen}
        combat={combat}
        unlockedInkPowers={unlockedInkPowers}
        allowedInkPowers={allowedInkPowers}
        onUsePower={handleMobileInkPowerUse}
        onClose={closeMobileInkPanel}
      />
      <MobileInventoryPanelOverlay
        isOpen={mobileInventoryPanelOpen}
        usableItems={usableItems}
        usableItemDefs={usableItemDefs}
        selectedUsableItemId={selectedUsableItemId}
        canAct={canUseItems}
        onUseItem={handleMobileInventoryItemUse}
        onClose={closeMobileInventoryPanel}
      />
      <CombatOverlays
        isResolvingHandOverflow={isResolvingHandOverflow}
        pendingHandOverflowExhaust={pendingHandOverflowExhaust}
        combat={combat}
        cardDefs={cardDefs}
        onResolveHandOverflowExhaust={onResolveHandOverflowExhaust}
        openPile={openPile}
        closePileOverlay={closePileOverlay}
        pileTitle={pileTitle}
        pileCards={pileCards}
        isSelectingRewriteTarget={isSelectingRewriteTarget}
        pendingDiscardTargetInkPower={pendingDiscardTargetInkPower}
        onUseInkPower={handleTutorialUseInkPower}
        reshuffleCards={reshuffleCards}
      />
    </div>
  );
}
