"use client";

import {
  useCallback,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import type { CombatState } from "@/game/schemas/combat-state";
import type { CardDefinition } from "@/game/schemas/cards";
import type { InkPowerType } from "@/game/schemas/enums";
import type {
  UsableItemDefinition,
  UsableItemInstance,
} from "@/game/schemas/items";
import { playSound } from "@/lib/sound";

interface UseCombatSelectionParams {
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

export function useCombatSelection({
  combat,
  cardDefs,
  usableItems,
  usableItemDefs,
  onPlayCard,
  onUseItem,
  onUseInkPower,
  onCheatKillEnemy,
  canAct,
}: UseCombatSelectionParams) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedUsableItemId, setSelectedUsableItemId] = useState<
    string | null
  >(null);
  const [pendingInked, setPendingInked] = useState(false);
  const [pendingDiscardTargetInkPower, setPendingDiscardTargetInkPower] =
    useState<InkPowerType | null>(null);
  const [pendingEnemyTargetInkPower, setPendingEnemyTargetInkPower] =
    useState<InkPowerType | null>(null);
  const [isSelectingCheatKillTarget, setIsSelectingCheatKillTarget] =
    useState(false);
  const [playingCardId, setPlayingCardId] = useState<string | null>(null);

  const selectedCard = selectedCardId
    ? combat.hand.find((card) => card.instanceId === selectedCardId)
    : null;
  const selectedDef = selectedCard
    ? (cardDefs.get(selectedCard.definitionId) ?? null)
    : null;
  const needsTarget =
    selectedDef?.targeting === "SINGLE_ENEMY" ||
    selectedDef?.targeting === "SINGLE_ALLY";
  const selectedUsableItem = selectedUsableItemId
    ? usableItems.find((item) => item.instanceId === selectedUsableItemId)
    : null;
  const selectedUsableItemDef = selectedUsableItem
    ? usableItemDefs.get(selectedUsableItem.definitionId)
    : null;
  const needsItemEnemyTarget =
    selectedUsableItemDef?.targeting === "SINGLE_ENEMY";
  const selectingEnemyTarget = selectedDef?.targeting === "SINGLE_ENEMY";
  const selectingAllyTarget = selectedDef?.targeting === "SINGLE_ALLY";
  const selfCanRetargetToAlly =
    selectedDef?.targeting === "SELF" &&
    selectedDef.effects.some(
      (effect) =>
        effect.type === "HEAL" ||
        effect.type === "BLOCK" ||
        effect.type === "APPLY_BUFF"
    );
  const isSelectingRewriteTarget = pendingDiscardTargetInkPower !== null;

  const clearCardSelection = useCallback(() => {
    setSelectedCardId(null);
    setPendingInked(false);
  }, []);
  const clearAllSelections = useCallback(() => {
    setSelectedCardId(null);
    setSelectedUsableItemId(null);
    setPendingInked(false);
    setPendingDiscardTargetInkPower(null);
    setPendingEnemyTargetInkPower(null);
    setIsSelectingCheatKillTarget(false);
  }, []);
  const clearInkPowerTargets = useCallback(() => {
    setPendingDiscardTargetInkPower(null);
    setPendingEnemyTargetInkPower(null);
  }, []);
  const disableCheatKillTargeting = useCallback(
    () => setIsSelectingCheatKillTarget(false),
    []
  );
  const toggleCheatKillTargeting = useCallback(
    () => setIsSelectingCheatKillTarget((value) => !value),
    []
  );
  const setDiscardTargetInkPower = useCallback((power: InkPowerType | null) => {
    setPendingDiscardTargetInkPower(power);
  }, []);
  const setEnemyTargetInkPower = useCallback((power: InkPowerType | null) => {
    setPendingEnemyTargetInkPower(power);
  }, []);

  const triggerCardPlay = useCallback(
    (instanceId: string, targetId: string | null, useInked: boolean) => {
      playSound("CARD_PLAY", 0.6);
      setPlayingCardId(instanceId);
      clearCardSelection();
      setTimeout(() => {
        onPlayCard(instanceId, targetId, useInked);
        setPlayingCardId(null);
      }, 280);
    },
    [clearCardSelection, onPlayCard]
  );

  const handleDoublePlayCard = useCallback(
    (instanceId: string, useInked: boolean) => {
      if (!canAct) return;
      const card = combat.hand.find((entry) => entry.instanceId === instanceId);
      if (!card) return;
      const def = cardDefs.get(card.definitionId);
      if (!def || def.targeting !== "SINGLE_ENEMY") return;

      const livingEnemies = combat.enemies.filter(
        (enemy) => enemy.currentHp > 0
      );
      if (livingEnemies.length !== 1) return;

      clearInkPowerTargets();
      setSelectedUsableItemId(null);
      triggerCardPlay(instanceId, livingEnemies[0]!.instanceId, useInked);
    },
    [
      canAct,
      combat.enemies,
      combat.hand,
      cardDefs,
      clearInkPowerTargets,
      triggerCardPlay,
    ]
  );

  const handleEnemyClick = useCallback(
    (enemyInstanceId: string) => {
      if (!canAct && !(isSelectingCheatKillTarget && onCheatKillEnemy)) return;
      if (isSelectingCheatKillTarget && onCheatKillEnemy) {
        onCheatKillEnemy(enemyInstanceId);
        setIsSelectingCheatKillTarget(false);
        return;
      }
      if (pendingEnemyTargetInkPower) {
        onUseInkPower(pendingEnemyTargetInkPower, enemyInstanceId);
        setPendingEnemyTargetInkPower(null);
        return;
      }

      if (selectedCardId && selectingEnemyTarget) {
        triggerCardPlay(selectedCardId, enemyInstanceId, pendingInked);
        return;
      }

      if (selectedUsableItemId && needsItemEnemyTarget) {
        onUseItem(selectedUsableItemId, enemyInstanceId);
        setSelectedUsableItemId(null);
      }
    },
    [
      canAct,
      isSelectingCheatKillTarget,
      onCheatKillEnemy,
      pendingEnemyTargetInkPower,
      onUseInkPower,
      selectedCardId,
      selectingEnemyTarget,
      triggerCardPlay,
      pendingInked,
      selectedUsableItemId,
      needsItemEnemyTarget,
      onUseItem,
    ]
  );

  const handleAllyClick = useCallback(
    (allyInstanceId: string) => {
      if (!canAct) return;
      if (!selectedCardId || (!selectingAllyTarget && !selfCanRetargetToAlly))
        return;
      triggerCardPlay(selectedCardId, allyInstanceId, pendingInked);
    },
    [
      canAct,
      selectedCardId,
      selectingAllyTarget,
      selfCanRetargetToAlly,
      triggerCardPlay,
      pendingInked,
    ]
  );

  const handlePlayCard = useCallback(
    (instanceId: string, useInked: boolean) => {
      if (!canAct) return;
      const card = combat.hand.find((entry) => entry.instanceId === instanceId);
      if (!card) return;
      const def = cardDefs.get(card.definitionId);
      if (!def) return;

      const isSameCardSelected = selectedCardId === instanceId;
      const sameSelection = isSameCardSelected && pendingInked === useInked;

      // Mobile-friendly flow: first tap selects, second tap confirms.
      if (!sameSelection) {
        if (
          isSameCardSelected &&
          def.targeting !== "SINGLE_ENEMY" &&
          def.targeting !== "SINGLE_ALLY"
        ) {
          // Avoid accidental downgrade from inked -> normal on second tap.
          triggerCardPlay(instanceId, null, pendingInked || useInked);
          return;
        }
        setSelectedCardId(instanceId);
        setSelectedUsableItemId(null);
        setPendingInked(useInked);
        clearInkPowerTargets();
        return;
      }

      if (def.targeting === "SINGLE_ENEMY" || def.targeting === "SINGLE_ALLY") {
        return;
      }

      triggerCardPlay(instanceId, null, useInked);
    },
    [
      canAct,
      combat.hand,
      cardDefs,
      selectedCardId,
      pendingInked,
      triggerCardPlay,
      clearInkPowerTargets,
    ]
  );

  const handleUseItemClick = useCallback(
    (itemInstanceId: string) => {
      if (!canAct) return;
      const item = usableItems.find(
        (entry) => entry.instanceId === itemInstanceId
      );
      if (!item) return;
      const def = usableItemDefs.get(item.definitionId);
      if (!def) return;

      setSelectedCardId(null);
      setPendingInked(false);
      clearInkPowerTargets();

      if (def.targeting === "SINGLE_ENEMY") {
        setSelectedUsableItemId(itemInstanceId);
        return;
      }

      onUseItem(itemInstanceId, null);
      setSelectedUsableItemId(null);
    },
    [canAct, usableItems, usableItemDefs, clearInkPowerTargets, onUseItem]
  );

  const handleGlobalClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (
        !selectedCardId &&
        !selectedUsableItemId &&
        !pendingEnemyTargetInkPower
      ) {
        return;
      }
      const target = event.target as HTMLElement;
      if (target.closest('[data-keep-selection="true"]')) return;
      setSelectedCardId(null);
      setSelectedUsableItemId(null);
      setPendingInked(false);
      setPendingEnemyTargetInkPower(null);
    },
    [selectedCardId, selectedUsableItemId, pendingEnemyTargetInkPower]
  );

  return {
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
    handleDoublePlayCard,
    handleUseItemClick,
    handleGlobalClick,
    clearCardSelection,
    clearAllSelections,
    clearInkPowerTargets,
    disableCheatKillTargeting,
    toggleCheatKillTargeting,
    setDiscardTargetInkPower,
    setEnemyTargetInkPower,
  };
}
