"use client";

import { useCallback } from "react";
import type { CombatState } from "@/game/schemas/combat-state";
import type { CardDefinition } from "@/game/schemas/cards";
import type { InkPowerType } from "@/game/schemas/enums";
import type {
  UsableItemDefinition,
  UsableItemInstance,
} from "@/game/schemas/items";
import { useCombatMobilePanels } from "./use-combat-mobile-panels";
import { useCombatPileOverlay } from "./use-combat-pile-overlay";
import { useCombatSelection } from "./use-combat-selection";

interface UseCombatInteractionsParams {
  combat: CombatState;
  cardDefs: Map<string, CardDefinition>;
  usableItems: UsableItemInstance[];
  usableItemDefs: Map<string, UsableItemDefinition>;
  onPlayCard: (
    instanceId: string,
    targetId: string | null,
    useInked: boolean
  ) => void;
  onUseItem: (itemInstanceId: string, targetId: string | null) => void;
  onUseInkPower: (power: InkPowerType, targetId: string | null) => void;
  onCheatKillEnemy?: (enemyInstanceId: string) => void;
  canAct: boolean;
}

export function useCombatInteractions({
  combat,
  cardDefs,
  usableItems,
  usableItemDefs,
  onPlayCard,
  onUseItem,
  onUseInkPower,
  onCheatKillEnemy,
  canAct,
}: UseCombatInteractionsParams) {
  const {
    selectedCardId,
    selectedUsableItemId,
    pendingInked,
    pendingDiscardTargetInkPower,
    pendingEnemyTargetInkPower,
    isSelectingCheatKillTarget,
    playingCardId,
    selectedDef,
    selectedUsableItemDef,
    needsTarget,
    needsItemEnemyTarget,
    selectingEnemyTarget,
    selectingAllyTarget,
    selfCanRetargetToAlly,
    isSelectingRewriteTarget,
    handleEnemyClick,
    handleAllyClick,
    handlePlayCard,
    handleUseItemClick,
    handleGlobalClick,
    clearCardSelection,
    clearInkPowerTargets,
    disableCheatKillTargeting,
    toggleCheatKillTargeting,
    setDiscardTargetInkPower,
    setEnemyTargetInkPower,
  } = useCombatSelection({
    combat,
    cardDefs,
    usableItems,
    usableItemDefs,
    onPlayCard,
    onUseItem,
    onUseInkPower,
    onCheatKillEnemy,
    canAct,
  });

  const { openPile, pileTitle, pileCards, openPileByType, closePile } =
    useCombatPileOverlay({
      combat,
      cardDefs,
    });

  const clearOverlayTargetModes = useCallback(() => {
    disableCheatKillTargeting();
    clearInkPowerTargets();
  }, [disableCheatKillTargeting, clearInkPowerTargets]);

  const handleOpenDrawPile = useCallback(() => {
    clearOverlayTargetModes();
    openPileByType("draw");
  }, [clearOverlayTargetModes, openPileByType]);

  const handleOpenDiscardPile = useCallback(() => {
    clearOverlayTargetModes();
    openPileByType("discard");
  }, [clearOverlayTargetModes, openPileByType]);

  const handleOpenExhaustPile = useCallback(() => {
    clearOverlayTargetModes();
    openPileByType("exhaust");
  }, [clearOverlayTargetModes, openPileByType]);

  const handleToggleCheatKill = useCallback(() => {
    clearInkPowerTargets();
    closePile();
    clearCardSelection();
    toggleCheatKillTargeting();
  }, [
    clearInkPowerTargets,
    closePile,
    clearCardSelection,
    toggleCheatKillTargeting,
  ]);

  const handleUseInkPower = useCallback(
    (power: InkPowerType) => {
      if (!canAct) return;
      if (power === "REWRITE" || power === "INDEX") {
        disableCheatKillTargeting();
        setEnemyTargetInkPower(null);
        setDiscardTargetInkPower(power);
        openPileByType("discard");
        return;
      }
      if (power === "SILENCE") {
        disableCheatKillTargeting();
        setDiscardTargetInkPower(null);
        closePile();
        setEnemyTargetInkPower(power);
        return;
      }

      clearInkPowerTargets();
      onUseInkPower(power, null);
    },
    [
      canAct,
      disableCheatKillTargeting,
      setEnemyTargetInkPower,
      setDiscardTargetInkPower,
      openPileByType,
      closePile,
      clearInkPowerTargets,
      onUseInkPower,
    ]
  );

  const closePileOverlay = useCallback(() => {
    closePile();
    clearOverlayTargetModes();
  }, [closePile, clearOverlayTargetModes]);

  const {
    mobileInfoPanel,
    mobileInkPanelOpen,
    mobileInventoryPanelOpen,
    handleMobileEnemyPress,
    handleMobileAllyPress,
    closeMobileInfoPanel,
    openMobilePlayerInfo,
    closeMobileInkPanel,
    closeMobileInventoryPanel,
    handleMobileInkPowerUse,
    handleMobileInventoryItemUse,
  } = useCombatMobilePanels({
    isSelectingCheatKillTarget,
    pendingEnemyTargetInkPower,
    selectedCardId,
    selectingEnemyTarget,
    selectedUsableItemId,
    needsItemEnemyTarget,
    selectingAllyTarget,
    selfCanRetargetToAlly,
    handleEnemyClick,
    handleAllyClick,
    handleUseInkPower,
    handleUseItemClick,
    clearOverlayTargetModes,
    openPileByType,
  });

  return {
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
  };
}
