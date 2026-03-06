"use client";

import { useCallback, useEffect, useState } from "react";
import type { InkPowerType } from "@/game/schemas/enums";
import type { MobileInfoPanelState, PileType } from "./combat-view-types";

type TopMenuAction =
  | "open-ink"
  | "open-inventory"
  | "open-draw"
  | "open-discard"
  | "open-exhaust";

interface UseCombatMobilePanelsParams {
  isSelectingCheatKillTarget: boolean;
  pendingEnemyTargetInkPower: InkPowerType | null;
  selectedCardId: string | null;
  selectingEnemyTarget: boolean;
  selectedUsableItemId: string | null;
  needsItemEnemyTarget: boolean;
  selectingAllyTarget: boolean;
  selfCanRetargetToAlly: boolean;
  handleEnemyClick: (enemyInstanceId: string) => void;
  handleAllyClick: (allyInstanceId: string) => void;
  handleUseInkPower: (power: InkPowerType) => void;
  handleUseItemClick: (itemInstanceId: string) => void;
  clearOverlayTargetModes: () => void;
  openPileByType: (pile: PileType) => void;
}

export function useCombatMobilePanels({
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
}: UseCombatMobilePanelsParams) {
  const [mobileInfoPanel, setMobileInfoPanel] =
    useState<MobileInfoPanelState>(null);
  const [mobileInkPanelOpen, setMobileInkPanelOpen] = useState(false);
  const [mobileInventoryPanelOpen, setMobileInventoryPanelOpen] =
    useState(false);

  const handleMobileEnemyPress = useCallback(
    (enemyInstanceId: string) => {
      const shouldTarget =
        isSelectingCheatKillTarget ||
        pendingEnemyTargetInkPower !== null ||
        (selectedCardId && selectingEnemyTarget) ||
        (selectedUsableItemId && needsItemEnemyTarget);
      if (shouldTarget) {
        handleEnemyClick(enemyInstanceId);
        return;
      }
      setMobileInfoPanel({ type: "enemy", instanceId: enemyInstanceId });
    },
    [
      isSelectingCheatKillTarget,
      pendingEnemyTargetInkPower,
      selectedCardId,
      selectingEnemyTarget,
      selectedUsableItemId,
      needsItemEnemyTarget,
      handleEnemyClick,
    ]
  );

  const handleMobileAllyPress = useCallback(
    (allyInstanceId: string) => {
      const shouldTarget =
        selectedCardId && (selectingAllyTarget || selfCanRetargetToAlly);
      if (shouldTarget) {
        handleAllyClick(allyInstanceId);
        return;
      }
      setMobileInfoPanel({ type: "ally", instanceId: allyInstanceId });
    },
    [
      selectedCardId,
      selectingAllyTarget,
      selfCanRetargetToAlly,
      handleAllyClick,
    ]
  );

  const closeMobileInfoPanel = useCallback(() => setMobileInfoPanel(null), []);
  const openMobilePlayerInfo = useCallback(
    () => setMobileInfoPanel({ type: "player" }),
    []
  );
  const closeMobileInkPanel = useCallback(
    () => setMobileInkPanelOpen(false),
    []
  );
  const closeMobileInventoryPanel = useCallback(
    () => setMobileInventoryPanelOpen(false),
    []
  );

  const handleMobileInkPowerUse = useCallback(
    (power: InkPowerType) => {
      handleUseInkPower(power);
      setMobileInkPanelOpen(false);
    },
    [handleUseInkPower]
  );

  const handleMobileInventoryItemUse = useCallback(
    (itemInstanceId: string) => {
      handleUseItemClick(itemInstanceId);
      setMobileInventoryPanelOpen(false);
    },
    [handleUseItemClick]
  );

  useEffect(() => {
    const handleTopMenuAction = (
      event: Event & {
        detail?: {
          action?: TopMenuAction;
        };
      }
    ) => {
      const action = event.detail?.action;
      if (!action) return;

      setMobileInfoPanel(null);
      clearOverlayTargetModes();

      if (action === "open-ink") {
        setMobileInventoryPanelOpen(false);
        setMobileInkPanelOpen(true);
        return;
      }
      if (action === "open-inventory") {
        setMobileInkPanelOpen(false);
        setMobileInventoryPanelOpen(true);
        return;
      }

      setMobileInkPanelOpen(false);
      setMobileInventoryPanelOpen(false);
      if (action === "open-draw") {
        openPileByType("draw");
      } else if (action === "open-discard") {
        openPileByType("discard");
      } else if (action === "open-exhaust") {
        openPileByType("exhaust");
      }
    };

    window.addEventListener(
      "game:mobile-combat-action",
      handleTopMenuAction as EventListener
    );
    return () =>
      window.removeEventListener(
        "game:mobile-combat-action",
        handleTopMenuAction as EventListener
      );
  }, [clearOverlayTargetModes, openPileByType]);

  return {
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
  };
}
