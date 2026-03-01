"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";
import type { CombatState } from "@/game/schemas/combat-state";
import type { CardDefinition } from "@/game/schemas/cards";
import type {
  EnemyDefinition,
  AllyDefinition,
  EnemyAbility,
  BuffInstance,
  PlayerState,
} from "@/game/schemas/entities";
import type { InkPowerType, BiomeType } from "@/game/schemas/enums";
import type {
  UsableItemDefinition,
  UsableItemInstance,
} from "@/game/schemas/items";
import type { Effect } from "@/game/schemas/effects";
import { GameCard } from "./GameCard";
import { HandArea } from "./HandArea";
import { InkGauge } from "./InkGauge";
import { EnergyOrb } from "../shared/EnergyOrb";
import { Tooltip } from "../shared/Tooltip";
import { HpBar } from "../shared/HpBar";
import { buffMeta } from "../shared/buff-meta";
// TEMPORARY: centralized asset registry Ã¢â‚¬â€ swap paths in src/lib/assets.ts when real art is ready
import { COMBAT_BACKGROUNDS, PLAYER_AVATAR } from "@/lib/assets";
import { playSound } from "@/lib/sound";
import { resolveEnemyAbilityTarget } from "@/game/engine/enemies";
import { boostEffectsForUpgrade } from "@/game/engine/card-upgrades";
import { calculateDamage } from "@/game/engine/damage";
import { computeIncomingDamage } from "@/game/engine/incoming-damage";
import { applyBuff } from "@/game/engine/buffs";
import { shouldHideEnemyIntent } from "@/game/engine/difficulty";
import { useTranslation } from "react-i18next";
import {
  getBonusDamageIfPlayerDebuffed,
  hasPlayerDebuffForEnemyBonus,
} from "@/game/engine/enemy-intent-preview";
import { localizeCardName } from "@/lib/i18n/card-text";
import {
  localizeEnemyAbilityName,
  localizeEnemyName,
  localizeUsableItemDescription,
  localizeUsableItemName,
} from "@/lib/i18n/entity-text";

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

type ReshuffleCardFx = {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  rot: number;
  delay: number;
};

type MobileInfoPanelState =
  | { type: "player" }
  | { type: "ally"; instanceId: string }
  | { type: "enemy"; instanceId: string }
  | null;

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
  debugEnemySelection: _debugEnemySelection,
  debugDrawInfo,
}: CombatViewProps) {
  const { t } = useTranslation();
  type PileType = "draw" | "discard" | "exhaust";

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedUsableItemId, setSelectedUsableItemId] = useState<
    string | null
  >(null);
  const [pendingInked, setPendingInked] = useState(false);
  const [openPile, setOpenPile] = useState<PileType | null>(null);
  const [isSelectingRewriteTarget, setIsSelectingRewriteTarget] =
    useState(false);
  const [isSelectingCheatKillTarget, setIsSelectingCheatKillTarget] =
    useState(false);
  const [newlySummonedIds, setNewlySummonedIds] = useState<Set<string>>(
    new Set()
  );
  const [summonAnnouncement, setSummonAnnouncement] = useState<string | null>(
    null
  );
  const [reshuffleFx, setReshuffleFx] = useState(false);
  const [reshuffleCards, setReshuffleCards] = useState<ReshuffleCardFx[]>([]);
  const [mobileInfoPanel, setMobileInfoPanel] =
    useState<MobileInfoPanelState>(null);
  const [mobileInkPanelOpen, setMobileInkPanelOpen] = useState(false);

  const drawBtnRef = useRef<HTMLButtonElement>(null);
  const discardBtnRef = useRef<HTMLButtonElement>(null);
  const enemyRowRef = useRef<HTMLDivElement>(null);
  const [playingCardId, setPlayingCardId] = useState<string | null>(null);
  const prevEnemyIdsRef = useRef<string[]>(
    combat.enemies.map((e) => e.instanceId)
  );
  const prevDrawCountRef = useRef(combat.drawPile.length);
  const prevDiscardCountRef = useRef(combat.discardPile.length);
  const reshuffleFxIdRef = useRef(0);
  const summonHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spawnClearTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
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

  // Player hit flash + sound
  const prevPlayerHp = useRef(combat.player.currentHp);
  const [playerHit, setPlayerHit] = useState(false);
  useEffect(() => {
    const prev = prevPlayerHp.current;
    prevPlayerHp.current = combat.player.currentHp;
    if (combat.player.currentHp >= prev) return undefined;
    setPlayerHit(true);
    // TEMPORARY: play player hit sound (file: /public/sounds/combat/player_hit.ogg)
    playSound("PLAYER_HIT", 0.7);
    const t = setTimeout(() => setPlayerHit(false), 500);
    return () => clearTimeout(t);
  }, [combat.player.currentHp]);

  useEffect(() => {
    const prevIds = new Set(prevEnemyIdsRef.current);
    const spawned = combat.enemies.filter((e) => !prevIds.has(e.instanceId));
    prevEnemyIdsRef.current = combat.enemies.map((e) => e.instanceId);
    if (spawned.length === 0) return;

    setNewlySummonedIds((prev) => {
      const next = new Set(prev);
      for (const enemy of spawned) next.add(enemy.instanceId);
      return next;
    });

    for (const enemy of spawned) {
      const timer = setTimeout(() => {
        setNewlySummonedIds((prev) => {
          const next = new Set(prev);
          next.delete(enemy.instanceId);
          return next;
        });
      }, 650);
      spawnClearTimersRef.current.push(timer);
    }

    if (summonHideTimerRef.current) clearTimeout(summonHideTimerRef.current);
    const summoner = actingEnemyId
      ? combat.enemies.find((e) => e.instanceId === actingEnemyId)
      : null;
    const summonerName = summoner
      ? getEnemyDisplayName(summoner)
      : t("combat.enemy");
    const spawnedNames = spawned.map((enemy) => getEnemyDisplayName(enemy));
    const announcement =
      spawnedNames.length === 1
        ? t("combat.summonOne", {
            summoner: summonerName,
            target: spawnedNames[0],
          })
        : t("combat.summonMany", { summoner: summonerName });
    setSummonAnnouncement(announcement);
    summonHideTimerRef.current = setTimeout(
      () => setSummonAnnouncement(null),
      1200
    );
  }, [combat.enemies, actingEnemyId, t, getEnemyDisplayName]);

  useEffect(() => {
    const spawnTimers = spawnClearTimersRef.current;
    return () => {
      if (summonHideTimerRef.current) clearTimeout(summonHideTimerRef.current);
      for (const timer of spawnTimers) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const prevDraw = prevDrawCountRef.current;
    const prevDiscard = prevDiscardCountRef.current;
    const drawNow = combat.drawPile.length;
    const discardNow = combat.discardPile.length;

    const recycledDiscardToDraw =
      prevDraw === 0 &&
      prevDiscard > 0 &&
      drawNow > 0 &&
      discardNow < prevDiscard;

    if (recycledDiscardToDraw) {
      setReshuffleFx(true);
      const fromRect = discardBtnRef.current?.getBoundingClientRect();
      const toRect = drawBtnRef.current?.getBoundingClientRect();
      if (fromRect && toRect) {
        const fromX = fromRect.left + fromRect.width / 2;
        const fromY = fromRect.top + fromRect.height / 2;
        const toX = toRect.left + toRect.width / 2;
        const toY = toRect.top + toRect.height / 2;
        const cardsCount = Math.min(7, Math.max(4, prevDiscard));
        const batchIdBase = reshuffleFxIdRef.current;
        reshuffleFxIdRef.current += cardsCount;
        const burst: ReshuffleCardFx[] = Array.from(
          { length: cardsCount },
          (_, index) => ({
            id: batchIdBase + index,
            x: fromX + (Math.random() - 0.5) * 18,
            y: fromY + (Math.random() - 0.5) * 14,
            tx: toX - fromX + (Math.random() - 0.5) * 20,
            ty: toY - fromY + (Math.random() - 0.5) * 12,
            rot: (Math.random() - 0.5) * 26,
            delay: index * 55,
          })
        );
        setReshuffleCards(burst);
      }

      const timer = setTimeout(() => {
        setReshuffleFx(false);
        setReshuffleCards([]);
      }, 980);
      prevDrawCountRef.current = drawNow;
      prevDiscardCountRef.current = discardNow;
      return () => clearTimeout(timer);
    }

    prevDrawCountRef.current = drawNow;
    prevDiscardCountRef.current = discardNow;
    return undefined;
  }, [combat.drawPile.length, combat.discardPile.length]);

  // TEMPORARY: track whether background image loaded
  const [bgFailed, setBgFailed] = useState(false);
  // TEMPORARY: track whether player avatar loaded
  const [avatarFailed, setAvatarFailed] = useState(false);

  const selectedCard = selectedCardId
    ? combat.hand.find((c) => c.instanceId === selectedCardId)
    : null;
  const selectedDef: CardDefinition | null = selectedCard
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
      (e) => e.type === "HEAL" || e.type === "BLOCK" || e.type === "APPLY_BUFF"
    );
  const previewEffects = useMemo(
    () =>
      selectedDef && selectedCard
        ? getPreviewEffectsForSelectedCard(
            selectedDef,
            selectedCard.upgraded,
            pendingInked,
            attackBonus
          )
        : [],
    [selectedDef, selectedCard, pendingInked, attackBonus]
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
  const hasIncomingPreview = incomingDamageByEnemyId.size > 0;
  const incomingDamage = useMemo(
    () =>
      combat.phase === "PLAYER_TURN"
        ? computeIncomingDamage(combat, enemyDefs)
        : { player: 0, allies: {} as Record<string, number> },
    [combat, enemyDefs]
  );
  const mobileFrontline = useMemo(
    () => [
      { type: "player" as const },
      ...combat.allies.map((ally) => ({ type: "ally" as const, ally })),
    ],
    [combat.allies]
  );
  const mobileInfoAlly =
    mobileInfoPanel?.type === "ally"
      ? (combat.allies.find(
          (entry) => entry.instanceId === mobileInfoPanel.instanceId
        ) ?? null)
      : null;
  const mobileInfoEnemy =
    mobileInfoPanel?.type === "enemy"
      ? (combat.enemies.find(
          (entry) => entry.instanceId === mobileInfoPanel.instanceId
        ) ?? null)
      : null;
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

  const triggerCardPlay = useCallback(
    (instanceId: string, targetId: string | null, useInked: boolean) => {
      playSound("CARD_PLAY", 0.6);
      setPlayingCardId(instanceId);
      setSelectedCardId(null);
      setPendingInked(false);
      setTimeout(() => {
        onPlayCard(instanceId, targetId, useInked);
        setPlayingCardId(null);
      }, 280);
    },
    [onPlayCard]
  );

  const handleEnemyClick = useCallback(
    (enemyInstanceId: string) => {
      if (!canAct && !(isSelectingCheatKillTarget && onCheatKillEnemy)) return;
      if (isSelectingCheatKillTarget && onCheatKillEnemy) {
        onCheatKillEnemy(enemyInstanceId);
        setIsSelectingCheatKillTarget(false);
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
      isSelectingCheatKillTarget,
      onCheatKillEnemy,
      selectedCardId,
      selectingEnemyTarget,
      pendingInked,
      triggerCardPlay,
      selectedUsableItemId,
      needsItemEnemyTarget,
      onUseItem,
      canAct,
    ]
  );

  const handleMobileEnemyPress = useCallback(
    (enemyInstanceId: string) => {
      const shouldTarget =
        isSelectingCheatKillTarget ||
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
      selectedCardId,
      selectingEnemyTarget,
      selectedUsableItemId,
      needsItemEnemyTarget,
      handleEnemyClick,
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
      selectedCardId,
      selectingAllyTarget,
      selfCanRetargetToAlly,
      triggerCardPlay,
      pendingInked,
      canAct,
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

  const handlePlayCard = useCallback(
    (instanceId: string, useInked: boolean) => {
      if (!canAct) return;
      const card = combat.hand.find((c) => c.instanceId === instanceId);
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
          // For no-target cards, avoid accidental downgrade from inked -> normal
          // when the second tap lands on card body instead of the ink button.
          triggerCardPlay(instanceId, null, pendingInked || useInked);
          return;
        }
        setSelectedCardId(instanceId);
        setSelectedUsableItemId(null);
        setPendingInked(useInked);
        return;
      }

      if (def.targeting === "SINGLE_ENEMY" || def.targeting === "SINGLE_ALLY") {
        return;
      }

      triggerCardPlay(instanceId, null, useInked);
    },
    [
      combat.hand,
      cardDefs,
      triggerCardPlay,
      pendingInked,
      selectedCardId,
      canAct,
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

      if (def.targeting === "SINGLE_ENEMY") {
        setSelectedUsableItemId(itemInstanceId);
        return;
      }

      onUseItem(itemInstanceId, null);
      setSelectedUsableItemId(null);
    },
    [onUseItem, usableItemDefs, usableItems, canAct]
  );

  const endTurnClass = canAct
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

  const getPileCards = (pile: PileType) => {
    if (pile === "discard") return combat.discardPile;
    if (pile === "exhaust") return combat.exhaustPile;

    // Do not leak real draw order: sort for display.
    return [...combat.drawPile].sort((a, b) => {
      const aName = cardDefs.get(a.definitionId)?.name ?? a.definitionId;
      const bName = cardDefs.get(b.definitionId)?.name ?? b.definitionId;
      const byName = aName.localeCompare(bName);
      if (byName !== 0) return byName;
      return a.instanceId.localeCompare(b.instanceId);
    });
  };

  const pileTitle =
    openPile === "draw"
      ? t("combat.drawPile")
      : openPile === "discard"
        ? t("combat.discardPile")
        : openPile === "exhaust"
          ? t("combat.exhaustPile")
          : null;

  const pileCards = openPile ? getPileCards(openPile) : [];

  const handleUseInkPower = useCallback(
    (power: InkPowerType) => {
      if (!canAct) return;
      if (power === "REWRITE") {
        setIsSelectingCheatKillTarget(false);
        setIsSelectingRewriteTarget(true);
        setOpenPile("discard");
        return;
      }

      onUseInkPower(power, null);
    },
    [onUseInkPower, canAct]
  );

  const closePileOverlay = useCallback(() => {
    setOpenPile(null);
    setIsSelectingRewriteTarget(false);
    setIsSelectingCheatKillTarget(false);
  }, []);

  const handleGlobalClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!selectedCardId && !selectedUsableItemId) return;
      const target = event.target as HTMLElement;
      if (target.closest('[data-keep-selection="true"]')) return;
      setSelectedCardId(null);
      setSelectedUsableItemId(null);
      setPendingInked(false);
    },
    [selectedCardId, selectedUsableItemId]
  );

  return (
    <div
      className="relative flex h-full min-h-0 flex-col overflow-hidden"
      onClick={handleGlobalClick}
    >
      {/* Ã¢â€â‚¬Ã¢â€â‚¬ BATTLEFIELD Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-[#030712] via-[#041235] to-[#020617] px-2 py-2 lg:px-6 lg:py-4 [@media(max-height:540px)]:px-1.5 [@media(max-height:540px)]:py-1">
        {/* Background Ã¢â‚¬â€ TEMPORARY: shows image if present, CSS gradient otherwise */}
        {!bgFailed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={COMBAT_BACKGROUNDS[biome]}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"
            onError={() => setBgFailed(true)}
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgba(56,189,248,0.12),transparent)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan-500/5 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950 to-transparent" />

        {/* Turn indicator */}
        <div className="relative z-10 flex items-center gap-1.5 self-start lg:gap-2 [@media(max-height:540px)]:hidden">
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 lg:px-2 lg:text-xs">
            {t("combat.turn")} {combat.turnNumber}
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors lg:px-3 lg:text-xs lg:tracking-widest",
              turnBadgeClass
            )}
          >
            {turnLabel}
          </span>
        </div>
        {summonAnnouncement && (
          <div className="pointer-events-none absolute left-1/2 top-2 z-20 -translate-x-1/2 rounded-full border border-orange-400/60 bg-orange-950/80 px-3 py-1 text-xs font-semibold text-orange-200 shadow-lg shadow-orange-900/50">
            {summonAnnouncement}
          </div>
        )}
        {debugDrawInfo && (
          <div className="absolute right-2 top-2 z-20 w-[min(36rem,calc(100%-1rem))] rounded-md border border-cyan-500/40 bg-cyan-950/75 p-2 text-[10px] text-cyan-100 shadow-lg shadow-cyan-950/60 lg:text-xs">
            <div className="mb-1 flex items-center justify-between font-semibold uppercase tracking-wide text-cyan-200">
              <span>{t("combat.drawDebugTitle")}</span>
              <span>
                {debugDrawInfo.handSize}/{debugDrawInfo.maxHandSize}
              </span>
            </div>
            <p className="mb-1 text-cyan-100/90">
              {t("combat.drawDebugSummary", {
                hand: debugDrawInfo.handSize,
                max: debugDrawInfo.maxHandSize,
                draw: debugDrawInfo.drawCount,
                overflow: debugDrawInfo.pendingOverflow,
              })}
            </p>
            {debugDrawInfo.history.length === 0 ? (
              <p className="text-cyan-100/80">
                {t("combat.drawDebugNoEvents")}
              </p>
            ) : (
              <div className="max-h-28 space-y-0.5 overflow-auto pr-1">
                {debugDrawInfo.history.map((event, index) => (
                  <p
                    key={`${event.turnNumber}-${event.reason}-${index}`}
                    className="truncate text-cyan-50/90"
                    title={`${event.phase} ${event.source} ${event.reason}`}
                  >
                    T{event.turnNumber} {event.source} {event.reason} req:
                    {event.requested} h:+{event.movedToHand} d:+
                    {event.movedToDiscard} ex:+{event.exhaustedOverflow} hand:
                    {event.handBefore} {"->"} {event.handAfter} ovf:
                    {event.pendingOverflowAfter}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
        {/* {debugEnemySelection && (
          <div className="absolute right-2 top-2 z-20 w-[min(28rem,calc(100%-1rem))] rounded-md border border-cyan-500/40 bg-cyan-950/70 p-2 text-[10px] text-cyan-100 shadow-lg shadow-cyan-950/60 lg:text-xs">
            <div className="mb-1 flex items-center justify-between font-semibold uppercase tracking-wide text-cyan-200">
              <span>{t("combat.debugTitle")}</span>
              <span>
                F{debugEnemySelection.floor} R{debugEnemySelection.room + 1} ·{" "}
                {debugEnemySelection.biome}
              </span>
            </div>
            <p className="truncate text-cyan-100/90">
              {t("combat.debugPlanned")}:{" "}
              {debugEnemySelection.plannedEnemyIds.join(", ") || "-"}
            </p>
            <p className="mb-1 text-cyan-100/90">
              {t("combat.debugThematic")}:{" "}
              {debugEnemySelection.hasThematicUnit
                ? t("combat.yes")
                : t("combat.no")}
            </p>
            <div className="max-h-24 space-y-0.5 overflow-auto pr-1">
              {debugEnemySelection.activeEnemies.map((enemy) => (
                <p key={enemy.instanceId} className="truncate text-cyan-50/90">
                  {enemy.definitionId} [{enemy.biome}] role:{enemy.role}
                  {enemy.hasDisruption ? " disruption" : ""}
                </p>
              ))}
            </div>
          </div>
        )} */}

        <div
          ref={enemyRowRef}
          className="relative z-10 flex min-h-0 w-full flex-1 items-center justify-center py-0.5 lg:py-4 [@media(max-height:540px)]:py-0"
        >
          <div className="w-full space-y-1 lg:hidden">
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${Math.max(1, mobileFrontline.length)}, minmax(0, 1fr))`,
              }}
            >
              {mobileFrontline.map((entry, index) => {
                if (entry.type === "player") {
                  return (
                    <button
                      key={`mobile-player-${index}`}
                      type="button"
                      data-keep-selection="true"
                      onClick={() => setMobileInfoPanel({ type: "player" })}
                      className={cn(
                        "relative h-[72px] rounded-lg border bg-indigo-950/40 px-1.5 py-1 text-left",
                        playerHit
                          ? "border-red-400 shadow-[0_0_14px_rgba(248,113,113,0.4)]"
                          : "border-indigo-500/70"
                      )}
                    >
                      {incomingDamage.player > 0 && (
                        <IncomingDamageBadge
                          damage={incomingDamage.player}
                          block={combat.player.block}
                        />
                      )}
                      <p className="truncate text-[9px] font-bold text-indigo-100">
                        {t("combat.player")}
                      </p>
                      <HpBar
                        current={Math.max(0, combat.player.currentHp)}
                        max={combat.player.maxHp}
                        showText={false}
                        className="mt-1 h-1.5 bg-slate-700"
                      />
                      <p className="mt-1 text-[9px] font-semibold text-slate-200">
                        {Math.max(0, combat.player.currentHp)}/
                        {combat.player.maxHp}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-0.5">
                        {renderCompactBuffs(
                          buildPlayerMarkerBuffs(combat.player)
                        )}
                      </div>
                    </button>
                  );
                }

                const ally = entry.ally;
                const canTarget =
                  (selectingAllyTarget || selfCanRetargetToAlly) &&
                  ally.currentHp > 0 &&
                  !actingEnemyId;
                const isDead = ally.currentHp <= 0;

                return (
                  <button
                    key={`ally-mobile-${ally.instanceId}`}
                    type="button"
                    data-keep-selection="true"
                    onClick={() => handleMobileAllyPress(ally.instanceId)}
                    className={cn(
                      "relative h-[72px] rounded-lg border bg-cyan-950/40 px-1.5 py-1 text-left",
                      isDead
                        ? "border-slate-800 opacity-45 grayscale"
                        : "border-cyan-700/80",
                      canTarget && "border-cyan-300 ring-1 ring-cyan-300/70"
                    )}
                  >
                    {!isDead &&
                      (incomingDamage.allies[ally.instanceId] ?? 0) > 0 && (
                        <IncomingDamageBadge
                          damage={incomingDamage.allies[ally.instanceId]!}
                          block={ally.block}
                        />
                      )}
                    <p className="truncate text-[9px] font-bold text-cyan-100">
                      {ally.name}
                    </p>
                    <HpBar
                      current={Math.max(0, ally.currentHp)}
                      max={ally.maxHp}
                      showText={false}
                      color="green"
                      className="mt-1 h-1.5 bg-slate-700"
                    />
                    <p className="mt-1 text-[9px] font-semibold text-slate-200">
                      {Math.max(0, ally.currentHp)}/{ally.maxHp}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-0.5">
                      {renderCompactBuffs(ally.buffs)}
                    </div>
                  </button>
                );
              })}
            </div>

            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${Math.max(1, combat.enemies.length)}, minmax(0, 1fr))`,
              }}
            >
              {combat.enemies.map((enemy) => {
                const def = enemyDefs.get(enemy.definitionId);
                const ability = def?.abilities[enemy.intentIndex];
                const resolvedTarget = ability
                  ? resolveEnemyAbilityTarget(combat, enemy, ability)
                  : "player";
                const hideIntent = shouldHideEnemyIntent(
                  combat.difficultyLevel ?? 0,
                  combat.turnNumber,
                  enemy
                );
                const intentChips = buildMobileEnemyIntentChips(
                  combat,
                  enemy,
                  resolvedTarget,
                  ability,
                  hideIntent,
                  t
                );
                const isDead = enemy.currentHp <= 0;
                const isTargetable =
                  selectingEnemyTarget &&
                  selectedCardId !== null &&
                  enemy.currentHp > 0 &&
                  !actingEnemyId;
                const isCheatSelectable =
                  isSelectingCheatKillTarget && enemy.currentHp > 0;
                const isActing = actingEnemyId === enemy.instanceId;

                return (
                  <button
                    key={`enemy-mobile-${enemy.instanceId}`}
                    type="button"
                    data-keep-selection="true"
                    onClick={() => handleMobileEnemyPress(enemy.instanceId)}
                    className={cn(
                      "h-[88px] rounded-lg border bg-rose-950/40 px-1.5 py-1 text-left transition-all",
                      isDead
                        ? "border-slate-800 opacity-45 grayscale"
                        : "border-rose-700/80",
                      (isTargetable || isCheatSelectable) &&
                        "border-red-400 ring-1 ring-red-300/70",
                      hasIncomingPreview &&
                        !isDead &&
                        "animate-pulse border-amber-400/80 shadow-[0_0_16px_rgba(251,191,36,0.25)]",
                      isActing && "animate-enemy-acting",
                      attackingEnemyId === enemy.instanceId &&
                        "animate-enemy-attack",
                      newlySummonedIds.has(enemy.instanceId) &&
                        "animate-enemy-summon-enter"
                    )}
                  >
                    <p className="truncate text-[9px] font-bold text-rose-100">
                      {getEnemyDisplayName(enemy)}
                    </p>
                    <HpBar
                      current={Math.max(0, enemy.currentHp)}
                      max={enemy.maxHp}
                      showText={false}
                      className="mt-1 h-1.5 bg-slate-700"
                    />
                    <p className="mt-1 text-[9px] font-semibold text-slate-200">
                      {Math.max(0, enemy.currentHp)}/{enemy.maxHp}
                    </p>
                    {!isDead &&
                    incomingDamageByEnemyId.get(enemy.instanceId) ? (
                      <p className="mt-0.5 text-[9px] font-bold text-amber-300">
                        {t("enemyCard.incoming")}{" "}
                        {incomingDamageByEnemyId.get(enemy.instanceId)}
                      </p>
                    ) : null}
                    <div className="mt-0.5 flex flex-wrap gap-0.5">
                      {intentChips.map((chip, idx) => (
                        <span
                          key={`${enemy.instanceId}-intent-${idx}`}
                          className="rounded border border-rose-800/70 bg-rose-950/70 px-1 py-0.5 text-[8px] font-semibold text-rose-100"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-0.5">
                      {renderCompactBuffs(enemy.buffs)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hidden w-full max-w-[1500px] grid-cols-4 gap-1.5 lg:grid lg:grid-cols-8 lg:gap-3">
            {allySlots.map((ally, index) => {
              if (!ally) {
                return (
                  <div
                    key={`ally-empty-${index}`}
                    className="h-28 rounded-xl border border-cyan-900/50 bg-cyan-950/20 sm:h-32 lg:h-56"
                  />
                );
              }

              const def = allyDefs.get(ally.definitionId);
              const intent = def?.abilities[ally.intentIndex];
              const canTarget =
                (selectingAllyTarget || selfCanRetargetToAlly) &&
                ally.currentHp > 0 &&
                !actingEnemyId;
              const isDead = ally.currentHp <= 0;

              return (
                <Tooltip
                  key={ally.instanceId}
                  content={
                    <div className="space-y-1.5">
                      <p className="font-semibold text-cyan-200">{ally.name}</p>
                      <p>
                        {t("combat.hp")} {Math.max(0, ally.currentHp)}/
                        {ally.maxHp}
                      </p>
                      <p>
                        {t("combat.block")} {ally.block}
                      </p>
                      <p>
                        {t("combat.spd")} {ally.speed}
                      </p>
                      {intent ? (
                        <p className="text-cyan-100">
                          {intent.name}: {formatAllyIntent(intent, t)}
                        </p>
                      ) : (
                        <p className="text-slate-300">
                          {t("combat.noAbility")}
                        </p>
                      )}
                      {ally.buffs.length > 0 && (
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-100">
                            {t("combat.activeEffects")}
                          </p>
                          {renderBuffTooltipDetails(ally.buffs)}
                        </div>
                      )}
                    </div>
                  }
                >
                  <button
                    type="button"
                    data-keep-selection="true"
                    onClick={
                      canTarget
                        ? () => handleAllyClick(ally.instanceId)
                        : undefined
                    }
                    className={cn(
                      "relative h-28 w-full rounded-xl border bg-cyan-950/40 p-1.5 text-left sm:h-32 sm:p-2 lg:h-56 lg:p-2.5",
                      isDead
                        ? "border-slate-800 opacity-45 grayscale"
                        : "border-cyan-700/80",
                      canTarget &&
                        "cursor-pointer border-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.35)] hover:-translate-y-1",
                      !canTarget && "cursor-default"
                    )}
                  >
                    <div className="absolute -top-2 left-2 flex max-w-[90%] items-center gap-1 overflow-hidden">
                      {renderCompactBuffs(ally.buffs)}
                    </div>
                    {isDead && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl">
                        <span className="text-center text-[10px] font-bold text-red-400">
                          {t("combat.deadInCombat")}
                        </span>
                      </div>
                    )}
                    {!isDead &&
                      (incomingDamage.allies[ally.instanceId] ?? 0) > 0 && (
                        <IncomingDamageBadge
                          damage={incomingDamage.allies[ally.instanceId]!}
                          block={ally.block}
                        />
                      )}
                    <div className="mb-1 flex h-14 items-center justify-center rounded-lg border border-cyan-900/60 bg-cyan-950/70 text-2xl sm:h-16 lg:h-28">
                      *
                    </div>
                    <p className="truncate text-[11px] font-bold text-cyan-100 lg:text-xs">
                      {ally.name}
                    </p>
                    <HpBar
                      current={Math.max(0, ally.currentHp)}
                      max={ally.maxHp}
                      showText={false}
                      color="green"
                      className="mt-1 h-2 bg-slate-700"
                    />
                    <p className="mt-1 text-[10px] font-semibold text-slate-200 lg:text-[11px]">
                      {Math.max(0, ally.currentHp)}/{ally.maxHp}
                      {ally.block > 0
                        ? ` · ${t("combat.block")} ${ally.block}`
                        : ""}
                    </p>
                  </button>
                </Tooltip>
              );
            })}

            <Tooltip
              content={
                <div className="space-y-1.5">
                  <p className="font-semibold text-slate-100">
                    {t("combat.player")}
                  </p>
                  <p>
                    {t("combat.hp")} {combat.player.currentHp}/
                    {combat.player.maxHp}
                  </p>
                  <p>
                    {t("combat.block")} {combat.player.block}
                  </p>
                  <p>
                    Energy {combat.player.energyCurrent}/
                    {combat.player.energyMax}
                  </p>
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-100">
                      {t("combat.activeEffects")}
                    </p>
                    {renderBuffTooltipDetails(
                      buildPlayerMarkerBuffs(combat.player)
                    )}
                  </div>
                </div>
              }
            >
              <div
                className={cn(
                  "relative h-28 rounded-xl border bg-indigo-950/35 p-1.5 sm:h-32 sm:p-2 lg:h-56 lg:p-2.5",
                  playerHit
                    ? "border-red-400 shadow-[0_0_22px_rgba(248,113,113,0.4)]"
                    : "border-indigo-500/70"
                )}
              >
                <div className="absolute -top-2 left-2 flex max-w-[90%] items-center gap-1 overflow-hidden">
                  {renderCompactBuffs(buildPlayerMarkerBuffs(combat.player))}
                </div>
                {incomingDamage.player > 0 && (
                  <IncomingDamageBadge
                    damage={incomingDamage.player}
                    block={combat.player.block}
                  />
                )}
                <div className="mb-1 flex h-14 items-center justify-center overflow-hidden rounded-lg border border-indigo-800/70 bg-indigo-950/75 sm:h-16 lg:h-28">
                  {!avatarFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={PLAYER_AVATAR}
                      alt={t("combat.player")}
                      className="h-full w-full object-cover"
                      onError={() => setAvatarFailed(true)}
                    />
                  ) : (
                    <span className="text-2xl">*</span>
                  )}
                </div>
                <p className="truncate text-[11px] font-bold text-indigo-100 lg:text-xs">
                  {t("combat.player")}
                </p>
                <HpBar
                  current={Math.max(0, combat.player.currentHp)}
                  max={combat.player.maxHp}
                  showText={false}
                  className="mt-1 h-2 bg-slate-700"
                />
                <p className="mt-1 text-[10px] font-semibold text-slate-200 lg:text-[11px]">
                  {Math.max(0, combat.player.currentHp)}/{combat.player.maxHp}
                  {combat.player.block > 0
                    ? ` · ${t("combat.block")} ${combat.player.block}`
                    : ""}
                </p>
              </div>
            </Tooltip>

            {enemySlots.map((enemy, index) => {
              if (!enemy) {
                return (
                  <div
                    key={`enemy-empty-${index}`}
                    className="h-28 rounded-xl border border-rose-900/50 bg-rose-950/20 sm:h-32 lg:h-56"
                  />
                );
              }

              const def = enemyDefs.get(enemy.definitionId);
              if (!def) return null;
              const isDead = enemy.currentHp <= 0;
              const ability = def.abilities[enemy.intentIndex];
              const resolvedTarget = ability
                ? resolveEnemyAbilityTarget(combat, enemy, ability)
                : "player";
              const hideIntent = shouldHideEnemyIntent(
                combat.difficultyLevel ?? 0,
                combat.turnNumber,
                enemy
              );
              const isTargetable =
                selectingEnemyTarget &&
                selectedCardId !== null &&
                enemy.currentHp > 0 &&
                !actingEnemyId;
              const isCheatSelectable =
                isSelectingCheatKillTarget && enemy.currentHp > 0;
              const isActing = actingEnemyId === enemy.instanceId;

              return (
                <Tooltip
                  key={enemy.instanceId}
                  content={
                    <div className="space-y-1.5">
                      <p className="font-semibold text-rose-200">
                        {getEnemyDisplayName(enemy)}
                      </p>
                      <p>
                        {t("combat.hp")} {Math.max(0, enemy.currentHp)}/
                        {enemy.maxHp}
                      </p>
                      <p>
                        {t("combat.block")} {enemy.block}
                      </p>
                      {ability && !hideIntent ? (
                        <div>
                          <p className="text-amber-200">
                            {localizeEnemyAbilityName(
                              enemy.definitionId,
                              ability.name
                            )}
                            {" -> "}
                            {resolveEnemyIntentTargetLabel(
                              combat,
                              resolvedTarget,
                              t
                            )}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {renderEnemyIntentEffects(
                              ability.effects,
                              t,
                              combat,
                              enemy,
                              ability,
                              resolvedTarget
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-300">
                          {hideIntent ? t("enemyCard.intentHidden") : "-"}
                        </p>
                      )}
                      {enemy.buffs.length > 0 && (
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-100">
                            {t("combat.activeEffects")}
                          </p>
                          {renderBuffTooltipDetails(enemy.buffs)}
                        </div>
                      )}
                    </div>
                  }
                >
                  <button
                    type="button"
                    data-keep-selection="true"
                    onClick={() => handleEnemyClick(enemy.instanceId)}
                    className={cn(
                      "relative h-28 w-full rounded-xl border bg-rose-950/35 p-1.5 text-left transition-all sm:h-32 sm:p-2 lg:h-56 lg:p-2.5",
                      isDead
                        ? "border-slate-800 opacity-45 grayscale"
                        : "border-rose-700/80",
                      (isTargetable || isCheatSelectable) &&
                        "border-red-400 shadow-[0_0_20px_rgba(248,113,113,0.45)]",
                      !isDead &&
                        !isActing &&
                        "cursor-pointer hover:-translate-y-1",
                      isActing && "animate-enemy-acting",
                      attackingEnemyId === enemy.instanceId &&
                        "animate-enemy-attack",
                      newlySummonedIds.has(enemy.instanceId) &&
                        "animate-enemy-summon-enter"
                    )}
                  >
                    <div className="absolute -top-2 left-2 flex max-w-[90%] items-center gap-1 overflow-hidden">
                      {renderCompactBuffs(enemy.buffs)}
                    </div>
                    <div className="mb-1 flex h-14 items-center justify-center overflow-hidden rounded-lg border border-rose-900/60 bg-slate-900 sm:h-16 lg:h-28">
                      <span className="absolute left-2 top-1 text-[9px] font-bold uppercase tracking-wider text-amber-300/90">
                        {hideIntent
                          ? "???"
                          : ability
                            ? localizeEnemyAbilityName(
                                enemy.definitionId,
                                ability.name
                              )
                            : "-"}
                      </span>
                      <span className="text-2xl text-rose-200">*</span>
                    </div>
                    <p className="truncate text-[11px] font-bold text-rose-100 lg:text-xs">
                      {getEnemyDisplayName(enemy)}
                    </p>
                    <div className="mt-1 flex min-h-5 flex-wrap gap-0.5">
                      {buildMobileEnemyIntentChips(
                        combat,
                        enemy,
                        resolvedTarget,
                        ability,
                        hideIntent,
                        t
                      ).map((chip, idx) => (
                        <span
                          key={`${enemy.instanceId}-desktop-intent-${idx}`}
                          className="rounded border border-rose-800/70 bg-rose-950/70 px-1 py-0.5 text-[8px] font-semibold text-rose-100"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                    <HpBar
                      current={Math.max(0, enemy.currentHp)}
                      max={enemy.maxHp}
                      showText={false}
                      className="mt-1 h-2 bg-slate-700"
                    />
                    <p className="mt-1 text-[10px] font-semibold text-slate-200 lg:text-[11px]">
                      {Math.max(0, enemy.currentHp)}/{enemy.maxHp}
                      {enemy.block > 0
                        ? ` · ${t("combat.block")} ${enemy.block}`
                        : ""}
                    </p>
                    {!isDead &&
                    incomingDamageByEnemyId.get(enemy.instanceId) ? (
                      <p className="mt-1 text-[10px] font-semibold text-red-300">
                        {t("enemyCard.incoming")}{" "}
                        {incomingDamageByEnemyId.get(enemy.instanceId)}
                      </p>
                    ) : null}
                  </button>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Target prompt — desktop uniquement */}
        {needsTarget && selectedCardId && (
          <div className="relative z-10 hidden animate-bounce pb-1 text-xs font-semibold text-yellow-300 lg:block lg:text-sm">
            {selectingAllyTarget
              ? t("combat.chooseAllyFor")
              : t("combat.chooseTargetFor")}
            <span className="text-white">
              {selectedDef ? localizeCardName(selectedDef, t) : ""}
            </span>
          </div>
        )}
        {!needsTarget && selectedCardId && (
          <div className="relative z-10 hidden pb-1 text-[10px] font-semibold text-cyan-300 lg:block lg:text-xs">
            {selfCanRetargetToAlly
              ? t("combat.tapSelfOrAlly")
              : t("combat.tapToPlay")}
          </div>
        )}
        {needsItemEnemyTarget && selectedUsableItemDef && (
          <div className="relative z-10 hidden animate-bounce pb-1 text-xs font-semibold text-orange-300 lg:block lg:text-sm">
            {t("combat.chooseEnemyFor")}{" "}
            <span className="text-white">
              {localizeUsableItemName(
                selectedUsableItemDef.id,
                selectedUsableItemDef.name
              )}
            </span>
          </div>
        )}
        {isSelectingCheatKillTarget && (
          <div className="relative z-10 hidden animate-bounce pb-1 text-xs font-semibold text-rose-300 lg:block lg:text-sm">
            {t("combat.devChooseEnemy")}
          </div>
        )}
      </div>

      {/* PLAYER ZONE */}
      <div className="shrink-0 border-t border-cyan-500/20 bg-slate-950/95 backdrop-blur-sm [@media(max-height:540px)]:border-t-slate-800/70">
        <div className="relative border-t border-cyan-500/10 px-2 pb-2 pt-2 lg:px-4 lg:pb-3 lg:pt-2.5 [@media(max-height:540px)]:px-1.5 [@media(max-height:540px)]:pb-1 [@media(max-height:540px)]:pt-1">
          <div className="mb-1 space-y-1 lg:hidden">
            <div className="flex items-center gap-1.5">
              <div className="flex flex-1 gap-1 overflow-x-auto pb-0.5">
                <div className="flex h-8 min-w-[38px] items-center justify-center rounded-md border border-yellow-600/50 bg-yellow-950/30 px-1 text-[12px] font-black text-yellow-100">
                  {combat.player.energyCurrent}
                </div>

                <button
                  className="h-8 min-w-[48px] rounded-md border border-cyan-700/60 bg-cyan-950/40 px-1 text-left"
                  onClick={() => setMobileInkPanelOpen(true)}
                  type="button"
                >
                  <p className="text-[7px] font-semibold uppercase tracking-wide text-cyan-300/90">
                    {t("inkGauge.ink")}
                  </p>
                  <p className="text-[10px] font-black text-cyan-100">
                    {combat.player.inkCurrent}
                  </p>
                </button>

                <button
                  className="h-8 min-w-[52px] rounded-md border border-slate-500/70 bg-slate-800 px-1 text-left"
                  onClick={() => {
                    setIsSelectingCheatKillTarget(false);
                    setIsSelectingRewriteTarget(false);
                    setOpenPile("draw");
                  }}
                  type="button"
                >
                  <p className="text-[7px] font-semibold uppercase tracking-wide text-slate-400">
                    {t("combat.draw")}
                  </p>
                  <p className="text-[10px] font-black text-slate-100">
                    {combat.drawPile.length}
                  </p>
                </button>

                <button
                  className="h-8 min-w-[52px] rounded-md border border-red-700/60 bg-slate-800 px-1 text-left"
                  onClick={() => {
                    setIsSelectingCheatKillTarget(false);
                    setIsSelectingRewriteTarget(false);
                    setOpenPile("discard");
                  }}
                  type="button"
                >
                  <p className="text-[7px] font-semibold uppercase tracking-wide text-red-400/80">
                    {t("combat.discard")}
                  </p>
                  <p className="text-[10px] font-black text-slate-100">
                    {combat.discardPile.length}
                  </p>
                </button>

                {combat.exhaustPile.length > 0 && (
                  <button
                    className="h-8 min-w-[42px] rounded-md border border-purple-700/60 bg-slate-800 px-1 text-[8px] font-semibold text-purple-300"
                    onClick={() => {
                      setIsSelectingCheatKillTarget(false);
                      setIsSelectingRewriteTarget(false);
                      setOpenPile("exhaust");
                    }}
                    type="button"
                  >
                    {t("combat.exhaust")} {combat.exhaustPile.length}
                  </button>
                )}

                {usableItems.length === 0 ? (
                  <div className="flex h-8 items-center rounded-md border border-amber-900/60 bg-slate-900/70 px-2 text-[8px] font-semibold uppercase tracking-wide text-amber-200/60">
                    {t("combat.inventoryEmpty")}
                  </div>
                ) : (
                  usableItems.map((item) => {
                    const def = usableItemDefs.get(item.definitionId);
                    if (!def) return null;
                    const isSelected = selectedUsableItemId === item.instanceId;
                    return (
                      <button
                        key={item.instanceId}
                        type="button"
                        onClick={() => handleUseItemClick(item.instanceId)}
                        className={cn(
                          "h-8 shrink-0 rounded-md border px-1.5 text-[8px] font-semibold uppercase tracking-wide transition",
                          isSelected
                            ? "border-amber-300 bg-amber-700/50 text-amber-50"
                            : "border-amber-700/70 bg-slate-900/80 text-amber-200",
                          !canAct && "cursor-not-allowed opacity-50"
                        )}
                        disabled={!canAct}
                      >
                        {localizeUsableItemName(def.id, def.name)}
                      </button>
                    );
                  })
                )}
              </div>
              {/* Fin du tour — ancré à droite, hors du scroll */}
              <button
                type="button"
                className={cn(
                  "h-8 flex-shrink-0 rounded-lg px-2.5 text-[10px] font-black uppercase tracking-wide transition-all",
                  endTurnClass
                )}
                disabled={!canAct}
                onClick={onEndTurn}
              >
                {t("combat.endTurn")}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 lg:gap-4">
            <div className="hidden w-40 flex-shrink-0 flex-col gap-2 lg:flex">
              <div className="rounded-xl border border-yellow-500/40 bg-gradient-to-b from-yellow-900/30 to-slate-900/80 p-2 shadow-[0_0_16px_rgba(250,204,21,0.12)]">
                <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-yellow-300/80">
                  Energie
                </p>
                <EnergyOrb
                  current={combat.player.energyCurrent}
                  max={combat.player.energyMax}
                  className="h-12 w-12 border-yellow-300 bg-yellow-950/80 text-sm text-yellow-200"
                />
              </div>

              <InkGauge
                player={combat.player}
                combatState={combat}
                onUsePower={handleUseInkPower}
                unlockedPowers={unlockedInkPowers}
              />

              <button
                ref={drawBtnRef}
                style={{
                  boxShadow: "2px 2px 0 1px #334155, 4px 4px 0 1px #1e293b",
                }}
                className={cn(
                  "flex h-12 flex-col items-center justify-center gap-0.5 rounded-lg border border-slate-500/70 bg-slate-800 transition hover:border-slate-300",
                  reshuffleFx &&
                    "animate-pulse border-cyan-300 shadow-[0_0_22px_rgba(34,211,238,0.45)]"
                )}
                onClick={() => {
                  setIsSelectingCheatKillTarget(false);
                  setIsSelectingRewriteTarget(false);
                  setOpenPile("draw");
                }}
                type="button"
              >
                <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                  {t("combat.draw")}
                </span>
                <span className="text-xl font-black text-slate-100">
                  {combat.drawPile.length}
                </span>
              </button>

              {reshuffleFx && (
                <div className="pointer-events-none flex animate-bounce items-center justify-center text-lg font-black text-cyan-300">
                  â†º
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <HandArea
                hand={combat.hand}
                combatState={combat}
                cardDefs={cardDefs}
                selectedCardId={selectedCardId}
                pendingInked={pendingInked}
                onPlayCard={handlePlayCard}
                isDiscarding={isDiscarding}
                discardBtnRef={discardBtnRef}
                playingCardId={playingCardId}
                enemyRowRef={enemyRowRef}
              />
            </div>

            <div className="hidden w-56 flex-shrink-0 flex-col gap-2 lg:flex">
              <div className="rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-900/30 to-slate-900/80 px-2 py-1.5 shadow-[0_0_16px_rgba(251,191,36,0.15)]">
                <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-amber-300/80">
                  Inventaire
                </p>
                <div
                  data-keep-selection="true"
                  className="flex flex-wrap gap-1"
                >
                  {usableItems.length === 0 ? (
                    <div className="h-9 w-full rounded-lg border border-amber-900/60 bg-slate-900/70 px-2 py-2 text-[9px] font-semibold uppercase tracking-wide text-amber-200/60">
                      Vide
                    </div>
                  ) : (
                    usableItems.map((item) => {
                      const def = usableItemDefs.get(item.definitionId);
                      if (!def) return null;
                      const isSelected =
                        selectedUsableItemId === item.instanceId;
                      return (
                        <Tooltip
                          key={item.instanceId}
                          content={localizeUsableItemDescription(
                            def.id,
                            def.description
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => handleUseItemClick(item.instanceId)}
                            className={cn(
                              "h-9 min-w-24 rounded-lg border px-2 text-[9px] font-semibold uppercase tracking-wide transition",
                              isSelected
                                ? "border-amber-300 bg-amber-700/50 text-amber-50"
                                : "border-amber-700/70 bg-slate-900/80 text-amber-200 hover:border-amber-400 hover:bg-amber-950/60",
                              !canAct && "cursor-not-allowed opacity-50"
                            )}
                            disabled={!canAct}
                          >
                            {localizeUsableItemName(def.id, def.name)}
                          </button>
                        </Tooltip>
                      );
                    })
                  )}
                </div>
              </div>

              <button
                className={cn(
                  "h-12 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-wide transition-all lg:text-sm",
                  endTurnClass
                )}
                disabled={!canAct}
                onClick={onEndTurn}
              >
                {t("combat.endTurn")}
              </button>

              <button
                ref={discardBtnRef}
                style={{
                  boxShadow: "2px 2px 0 1px #7f1d1d, 4px 4px 0 1px #450a0a",
                }}
                className={cn(
                  "flex h-12 flex-col items-center justify-center gap-0.5 rounded-lg border border-red-700/60 bg-slate-800 transition hover:border-red-400",
                  reshuffleFx &&
                    "animate-pulse border-cyan-300 shadow-[0_0_22px_rgba(34,211,238,0.45)]"
                )}
                onClick={() => {
                  setIsSelectingCheatKillTarget(false);
                  setIsSelectingRewriteTarget(false);
                  setOpenPile("discard");
                }}
                type="button"
              >
                <span className="text-[9px] font-semibold uppercase tracking-wider text-red-400/80">
                  Defausse
                </span>
                <span className="text-xl font-black text-slate-100">
                  {combat.discardPile.length}
                </span>
              </button>

              {combat.exhaustPile.length > 0 && (
                <button
                  style={{
                    boxShadow: "2px 2px 0 1px #4c1d95, 4px 4px 0 1px #2e1065",
                  }}
                  className="flex h-12 flex-col items-center justify-center gap-0.5 rounded-lg border border-purple-700/60 bg-slate-800 transition hover:border-purple-400"
                  onClick={() => {
                    setIsSelectingCheatKillTarget(false);
                    setIsSelectingRewriteTarget(false);
                    setOpenPile("exhaust");
                  }}
                  type="button"
                >
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-purple-400/80">
                    Epuise
                  </span>
                  <span className="text-xl font-black text-slate-100">
                    {combat.exhaustPile.length}
                  </span>
                </button>
              )}

              {onCheatKillEnemy && (
                <button
                  className={cn(
                    "rounded-lg border px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all lg:px-3 lg:py-2 lg:text-xs",
                    isSelectingCheatKillTarget
                      ? "border-rose-500 bg-rose-900/60 text-rose-200"
                      : "border-rose-700 bg-rose-950/60 text-rose-300 hover:border-rose-500"
                  )}
                  onClick={() => {
                    setIsSelectingRewriteTarget(false);
                    setOpenPile(null);
                    setSelectedCardId(null);
                    setPendingInked(false);
                    setIsSelectingCheatKillTarget((v) => !v);
                  }}
                  type="button"
                >
                  {isSelectingCheatKillTarget
                    ? t("combat.cancelKill")
                    : t("combat.devKill")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {mobileInfoPanel && (
        <div
          data-keep-selection="true"
          className="fixed inset-0 z-[90] flex items-end lg:hidden"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setMobileInfoPanel(null)}
        >
          <div
            data-keep-selection="true"
            className="w-full overflow-hidden rounded-t-3xl bg-slate-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pb-1 pt-2.5">
              <div className="h-1 w-10 rounded-full bg-slate-700" />
            </div>

            {/* ── ENNEMI ── */}
            {mobileInfoPanel.type === "enemy" &&
              mobileInfoEnemy &&
              (() => {
                const enemy = mobileInfoEnemy;
                const def = enemyDefs.get(enemy.definitionId);
                const ability = def?.abilities[enemy.intentIndex];
                const resolvedTarget = ability
                  ? resolveEnemyAbilityTarget(combat, enemy, ability)
                  : "player";
                const hideIntent = shouldHideEnemyIntent(
                  combat.difficultyLevel ?? 0,
                  combat.turnNumber,
                  enemy
                );
                const hpRatio =
                  enemy.maxHp > 0
                    ? Math.max(0, enemy.currentHp) / enemy.maxHp
                    : 0;
                const canTargetNow =
                  selectingEnemyTarget &&
                  selectedCardId !== null &&
                  !actingEnemyId &&
                  enemy.currentHp > 0;

                return (
                  <>
                    {/* Header gradient */}
                    <div className="relative overflow-hidden bg-gradient-to-b from-rose-950/90 to-slate-950 px-5 pb-5 pt-3">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(220,38,38,0.2),transparent_60%)]" />
                      <div className="relative flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-400/70">
                            Ennemi
                          </p>
                          <h2 className="mt-0.5 truncate text-2xl font-black text-white">
                            {getEnemyDisplayName(enemy)}
                          </h2>
                          <div className="mt-3">
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="text-slate-400">PV</span>
                              <span className="font-bold text-slate-200">
                                {Math.max(0, enemy.currentHp)}/{enemy.maxHp}
                              </span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  hpRatio > 0.5
                                    ? "bg-gradient-to-r from-emerald-500 to-green-400"
                                    : hpRatio > 0.25
                                      ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                                      : "bg-gradient-to-r from-red-600 to-rose-400"
                                )}
                                style={{ width: `${hpRatio * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        {enemy.block > 0 && (
                          <div className="flex flex-shrink-0 flex-col items-center rounded-2xl border border-blue-500/40 bg-blue-950/80 px-4 py-2">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-blue-400">
                              Armure
                            </p>
                            <p className="text-2xl font-black text-blue-200">
                              {enemy.block}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="max-h-[40vh] space-y-3 overflow-y-auto px-5 py-3">
                      {/* Intent */}
                      <div>
                        <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                          Prochain coup
                        </p>
                        {ability && !hideIntent ? (
                          <div className="rounded-2xl border border-rose-800/50 bg-rose-950/30 px-4 py-3">
                            <p className="text-sm font-bold text-rose-200">
                              {localizeEnemyAbilityName(
                                enemy.definitionId,
                                ability.name
                              )}
                              <span className="ml-2 text-xs font-normal text-slate-400">
                                →{" "}
                                {resolveEnemyIntentTargetLabel(
                                  combat,
                                  resolvedTarget,
                                  t
                                )}
                              </span>
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {renderEnemyIntentEffects(
                                ability.effects,
                                t,
                                combat,
                                enemy,
                                ability,
                                resolvedTarget
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-3">
                            <p className="text-sm text-slate-500">
                              {hideIntent ? t("enemyCard.intentHidden") : "—"}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Buffs */}
                      {enemy.buffs.length > 0 && (
                        <div>
                          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                            Effets actifs
                          </p>
                          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 px-4 py-3">
                            {renderBuffTooltipDetails(enemy.buffs)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2.5 px-5 pb-8 pt-2">
                      {canTargetNow && (
                        <button
                          type="button"
                          data-keep-selection="true"
                          className="flex-1 rounded-2xl border border-red-400/30 bg-gradient-to-r from-red-700 to-rose-600 py-3.5 text-sm font-black uppercase tracking-wide text-white shadow-[0_0_18px_rgba(239,68,68,0.35)]"
                          onClick={() => {
                            handleEnemyClick(enemy.instanceId);
                            setMobileInfoPanel(null);
                          }}
                        >
                          {t("combat.chooseTargetCta")}
                        </button>
                      )}
                      <button
                        type="button"
                        data-keep-selection="true"
                        className="flex-1 rounded-2xl border border-slate-700 bg-slate-800 py-3.5 text-sm font-semibold text-slate-300"
                        onClick={() => setMobileInfoPanel(null)}
                      >
                        {t("common.close")}
                      </button>
                    </div>
                  </>
                );
              })()}

            {/* ── JOUEUR ── */}
            {mobileInfoPanel.type === "player" &&
              (() => {
                const player = combat.player;
                const hpRatio =
                  player.maxHp > 0
                    ? Math.max(0, player.currentHp) / player.maxHp
                    : 0;
                const playerBuffs = buildPlayerMarkerBuffs(player);

                return (
                  <>
                    <div className="relative overflow-hidden bg-gradient-to-b from-indigo-950/90 to-slate-950 px-5 pb-5 pt-3">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.2),transparent_60%)]" />
                      <div className="relative flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400/70">
                            Joueur
                          </p>
                          <h2 className="mt-0.5 text-2xl font-black text-white">
                            {t("combat.player")}
                          </h2>
                          <div className="mt-3">
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="text-slate-400">PV</span>
                              <span className="font-bold text-slate-200">
                                {Math.max(0, player.currentHp)}/{player.maxHp}
                              </span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  hpRatio > 0.5
                                    ? "bg-gradient-to-r from-emerald-500 to-green-400"
                                    : hpRatio > 0.25
                                      ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                                      : "bg-gradient-to-r from-red-600 to-rose-400"
                                )}
                                style={{ width: `${hpRatio * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        {player.block > 0 && (
                          <div className="flex flex-shrink-0 flex-col items-center rounded-2xl border border-blue-500/40 bg-blue-950/80 px-4 py-2">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-blue-400">
                              Armure
                            </p>
                            <p className="text-2xl font-black text-blue-200">
                              {player.block}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="max-h-[40vh] space-y-3 overflow-y-auto px-5 py-3">
                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-2xl border border-yellow-800/40 bg-yellow-950/20 px-4 py-2.5">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-yellow-500">
                            Énergie
                          </p>
                          <p className="text-xl font-black text-yellow-200">
                            {player.energyCurrent}
                            <span className="text-sm font-normal text-slate-500">
                              /{player.energyMax}
                            </span>
                          </p>
                        </div>
                        <div className="rounded-2xl border border-cyan-800/40 bg-cyan-950/20 px-4 py-2.5">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-cyan-500">
                            Encre
                          </p>
                          <p className="text-xl font-black text-cyan-200">
                            {player.inkCurrent}
                            <span className="text-sm font-normal text-slate-500">
                              /{player.inkMax}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Buffs */}
                      {playerBuffs.length > 0 && (
                        <div>
                          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                            Effets actifs
                          </p>
                          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 px-4 py-3">
                            {renderBuffTooltipDetails(playerBuffs)}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="px-5 pb-8 pt-2">
                      <button
                        type="button"
                        data-keep-selection="true"
                        className="w-full rounded-2xl border border-slate-700 bg-slate-800 py-3.5 text-sm font-semibold text-slate-300"
                        onClick={() => setMobileInfoPanel(null)}
                      >
                        {t("common.close")}
                      </button>
                    </div>
                  </>
                );
              })()}

            {/* ── ALLIÉ ── */}
            {mobileInfoPanel.type === "ally" &&
              mobileInfoAlly &&
              (() => {
                const ally = mobileInfoAlly;
                const def = allyDefs.get(ally.definitionId);
                const intent = def?.abilities[ally.intentIndex];
                const hpRatio =
                  ally.maxHp > 0 ? Math.max(0, ally.currentHp) / ally.maxHp : 0;
                const canTargetAlly =
                  (selectingAllyTarget || selfCanRetargetToAlly) &&
                  selectedCardId !== null &&
                  ally.currentHp > 0;

                return (
                  <>
                    <div className="relative overflow-hidden bg-gradient-to-b from-cyan-950/90 to-slate-950 px-5 pb-5 pt-3">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.2),transparent_60%)]" />
                      <div className="relative flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-400/70">
                            Allié
                          </p>
                          <h2 className="mt-0.5 truncate text-2xl font-black text-white">
                            {ally.name}
                          </h2>
                          <div className="mt-3">
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="text-slate-400">PV</span>
                              <span className="font-bold text-slate-200">
                                {Math.max(0, ally.currentHp)}/{ally.maxHp}
                              </span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  hpRatio > 0.5
                                    ? "bg-gradient-to-r from-emerald-500 to-green-400"
                                    : hpRatio > 0.25
                                      ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                                      : "bg-gradient-to-r from-red-600 to-rose-400"
                                )}
                                style={{ width: `${hpRatio * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        {ally.block > 0 && (
                          <div className="flex flex-shrink-0 flex-col items-center rounded-2xl border border-blue-500/40 bg-blue-950/80 px-4 py-2">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-blue-400">
                              Armure
                            </p>
                            <p className="text-2xl font-black text-blue-200">
                              {ally.block}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="max-h-[40vh] space-y-3 overflow-y-auto px-5 py-3">
                      {/* Intent */}
                      {intent && (
                        <div>
                          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                            Prochain coup
                          </p>
                          <div className="rounded-2xl border border-cyan-800/50 bg-cyan-950/30 px-4 py-3">
                            <p className="text-sm font-bold text-cyan-200">
                              {intent.name}
                              <span className="ml-2 text-xs font-normal text-slate-300">
                                {formatAllyIntent(intent, t)}
                              </span>
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Buffs */}
                      {ally.buffs.length > 0 && (
                        <div>
                          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                            Effets actifs
                          </p>
                          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 px-4 py-3">
                            {renderBuffTooltipDetails(ally.buffs)}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2.5 px-5 pb-8 pt-2">
                      {canTargetAlly && (
                        <button
                          type="button"
                          data-keep-selection="true"
                          className="flex-1 rounded-2xl border border-cyan-400/30 bg-gradient-to-r from-cyan-700 to-teal-600 py-3.5 text-sm font-black uppercase tracking-wide text-white shadow-[0_0_18px_rgba(6,182,212,0.35)]"
                          onClick={() => {
                            handleAllyClick(ally.instanceId);
                            setMobileInfoPanel(null);
                          }}
                        >
                          {t("combat.chooseTargetCta")}
                        </button>
                      )}
                      <button
                        type="button"
                        data-keep-selection="true"
                        className="flex-1 rounded-2xl border border-slate-700 bg-slate-800 py-3.5 text-sm font-semibold text-slate-300"
                        onClick={() => setMobileInfoPanel(null)}
                      >
                        {t("common.close")}
                      </button>
                    </div>
                  </>
                );
              })()}
          </div>
        </div>
      )}

      {mobileInkPanelOpen && (
        <div
          data-keep-selection="true"
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/65 p-3 lg:hidden"
          onClick={() => setMobileInkPanelOpen(false)}
        >
          <div
            data-keep-selection="true"
            className="w-full max-w-sm rounded-xl border border-cyan-700/60 bg-slate-950/95 p-3 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <InkGauge
              player={combat.player}
              combatState={combat}
              onUsePower={(power) => {
                handleUseInkPower(power);
                setMobileInkPanelOpen(false);
              }}
              unlockedPowers={unlockedInkPowers}
            />
            <button
              type="button"
              data-keep-selection="true"
              className="mt-2 w-full rounded border border-slate-600 px-2 py-1.5 text-xs font-semibold text-slate-200"
              onClick={() => setMobileInkPanelOpen(false)}
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      )}
      {isResolvingHandOverflow && (
        <div
          className="absolute inset-0 z-[70] flex items-center justify-center bg-black/75 px-4"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="max-h-[84vh] w-full max-w-5xl rounded-xl border border-amber-600/70 bg-slate-950 p-4">
            <div className="mb-3 space-y-1">
              <h3 className="text-lg font-semibold text-amber-100">
                {t("combat.handOverflowTitle")}
              </h3>
              <p className="text-sm text-amber-200/90">
                {t("combat.handOverflowSubtitle", {
                  count: pendingHandOverflowExhaust,
                })}
              </p>
              <p className="text-xs text-slate-300">
                {t("combat.handOverflowHint")}
              </p>
            </div>

            {combat.hand.length === 0 ? (
              <p className="text-sm text-slate-400">
                {t("combat.noCardsInHand")}
              </p>
            ) : (
              <div className="grid max-h-[62vh] grid-cols-2 gap-2 overflow-auto pr-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {combat.hand.map((card) => {
                  const definition = cardDefs.get(card.definitionId);
                  if (!definition) return null;
                  return (
                    <button
                      key={card.instanceId}
                      type="button"
                      className="rounded outline-none ring-0 transition hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-amber-300"
                      onClick={() =>
                        onResolveHandOverflowExhaust(card.instanceId)
                      }
                    >
                      <GameCard
                        definition={definition}
                        upgraded={card.upgraded}
                        size="sm"
                        canPlay={false}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      {openPile && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={closePileOverlay}
        >
          <div
            className="max-h-[80vh] w-full max-w-5xl rounded-xl border border-slate-700 bg-slate-950 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  {pileTitle}
                </h3>
                <p className="text-xs text-slate-400">
                  {t("combat.cardsCount", { count: pileCards.length })}
                  {openPile === "draw" ? ` ${t("combat.drawOrderMasked")}` : ""}
                </p>
                {isSelectingRewriteTarget && openPile === "discard" && (
                  <p className="text-xs font-semibold text-cyan-300">
                    {t("combat.selectRewrite")}
                  </p>
                )}
              </div>
              <button
                className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:border-slate-400"
                onClick={closePileOverlay}
                type="button"
              >
                {t("common.close")}
              </button>
            </div>

            {pileCards.length === 0 ? (
              <p className="text-sm text-slate-500">
                {t("combat.noCardsInPile")}
              </p>
            ) : (
              <div className="grid max-h-[64vh] grid-cols-2 gap-2 overflow-auto pr-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {pileCards.map((card) => {
                  const definition = cardDefs.get(card.definitionId);
                  if (!definition) return null;
                  const rewriteSelectable =
                    isSelectingRewriteTarget && openPile === "discard";

                  return (
                    <div key={card.instanceId} className="flex justify-center">
                      {rewriteSelectable ? (
                        <button
                          type="button"
                          className="rounded"
                          onClick={() => {
                            onUseInkPower("REWRITE", card.instanceId);
                            closePileOverlay();
                          }}
                        >
                          <GameCard
                            definition={definition}
                            upgraded={card.upgraded}
                            size="sm"
                          />
                        </button>
                      ) : (
                        <GameCard
                          definition={definition}
                          upgraded={card.upgraded}
                          size="sm"
                          canPlay={false}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {reshuffleCards.map((card) => (
        <div
          key={card.id}
          className="animate-reshuffle-card pointer-events-none fixed z-[80] h-14 w-10 rounded-md border border-slate-300/50 bg-gradient-to-b from-slate-200/80 to-slate-500/70 shadow-lg"
          style={
            {
              left: `${card.x}px`,
              top: `${card.y}px`,
              "--reshuffle-tx": `${card.tx}px`,
              "--reshuffle-ty": `${card.ty}px`,
              "--reshuffle-rot": `${card.rot}deg`,
              animationDelay: `${card.delay}ms`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

function renderCompactBuffs(buffs: BuffInstance[]): ReactNode {
  if (buffs.length === 0) return null;

  const visible = buffs.slice(0, 3);
  const remaining = buffs.length - visible.length;

  return (
    <>
      {visible.map((buff, index) => {
        const meta = buffMeta[buff.type];
        const label = (meta?.label() ?? buff.type).slice(0, 2).toUpperCase();
        return (
          <span
            key={`${buff.type}-${index}`}
            className={cn(
              "rounded border border-slate-950/60 px-1 py-0.5 text-[9px] font-bold",
              meta?.color ?? "bg-slate-700 text-slate-200"
            )}
          >
            {label}
            {buff.stacks > 1 ? ` ${buff.stacks}` : ""}
          </span>
        );
      })}
      {remaining > 0 && (
        <span className="rounded bg-slate-900/80 px-1 py-0.5 text-[9px] font-bold text-slate-200">
          +{remaining}
        </span>
      )}
    </>
  );
}

function renderBuffTooltipDetails(buffs: BuffInstance[]): ReactNode {
  return (
    <div className="space-y-0.5">
      {buffs.map((buff, index) => {
        const meta = buffMeta[buff.type];
        const label = meta?.label() ?? buff.type;
        const description = meta?.description(buff.stacks) ?? "";
        return (
          <p
            key={`${buff.type}-${index}`}
            className="text-[11px] text-slate-200"
          >
            <span
              className={cn("font-semibold", meta?.color ?? "text-slate-200")}
            >
              {label}
              {buff.stacks > 1 ? ` x${buff.stacks}` : ""}
            </span>
            {description ? ` - ${description}` : ""}
          </p>
        );
      })}
    </div>
  );
}

function buildPlayerMarkerBuffs(player: PlayerState): BuffInstance[] {
  const markers: BuffInstance[] = [...player.buffs];
  if (player.strength > 0) {
    markers.push({ type: "STRENGTH", stacks: player.strength });
  }
  if (player.focus > 0) {
    markers.push({ type: "FOCUS", stacks: player.focus });
  }
  return markers;
}

function renderEnemyIntentEffects(
  effects: Effect[],
  t: (key: string, options?: Record<string, unknown>) => string,
  combat: CombatState,
  enemy: CombatState["enemies"][number],
  ability: EnemyAbility | undefined,
  resolvedTarget:
    | "player"
    | "all_enemies"
    | "all_allies"
    | { type: "enemy"; instanceId: string }
    | { type: "ally"; instanceId: string }
): ReactNode[] {
  return effects.map((effect, index) => {
    let label = "";
    let colorClass = "bg-slate-700 text-slate-100";

    switch (effect.type) {
      case "DAMAGE":
        label = `${t("enemyCard.dmg")} ${computeEnemyDamagePreview(
          combat,
          enemy,
          resolvedTarget,
          effect.value,
          ability
        )}`;
        colorClass = "bg-red-900/70 text-red-200";
        break;
      case "HEAL":
        label = `${t("reward.effect.heal", { value: effect.value })}`;
        colorClass = "bg-emerald-900/70 text-emerald-200";
        break;
      case "BLOCK":
        label = `${t("reward.effect.block", { value: effect.value })}`;
        colorClass = "bg-blue-900/70 text-blue-200";
        break;
      case "DRAW_CARDS":
        label = t("reward.effect.drawCards", { value: effect.value });
        colorClass = "bg-indigo-900/70 text-indigo-200";
        break;
      case "GAIN_INK":
        label = t("reward.effect.gainInk", { value: effect.value });
        colorClass = "bg-cyan-900/70 text-cyan-200";
        break;
      case "APPLY_BUFF":
        label = t("reward.effect.applyBuff", {
          buff: effect.buff ?? "status",
          value: effect.value,
        });
        colorClass = "bg-amber-900/70 text-amber-200";
        break;
      case "APPLY_DEBUFF":
        label = t("reward.effect.applyDebuff", {
          buff: effect.buff ?? "status",
          value: effect.value,
        });
        colorClass = "bg-purple-900/70 text-purple-200";
        break;
      default:
        label = t("reward.effect.fallback", {
          type: effect.type.toLowerCase(),
          value: effect.value,
        });
        colorClass = "bg-slate-700 text-slate-100";
        break;
    }

    return (
      <span
        key={`${effect.type}-${index}`}
        className={cn(
          "rounded px-1.5 py-0.5 text-[10px] font-bold",
          colorClass
        )}
      >
        {label}
      </span>
    );
  });
}

function formatAllyIntent(
  ability: EnemyAbility,
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  const effects = ability.effects.map((effect) => {
    switch (effect.type) {
      case "DAMAGE":
        return t("reward.effect.damage", { value: effect.value });
      case "HEAL":
        return t("reward.effect.heal", { value: effect.value });
      case "BLOCK":
        return t("reward.effect.block", { value: effect.value });
      case "DRAW_CARDS":
        return t("reward.effect.drawCards", { value: effect.value });
      case "GAIN_INK":
        return t("reward.effect.gainInk", { value: effect.value });
      case "GAIN_FOCUS":
        return t("reward.effect.gainFocus", { value: effect.value });
      case "GAIN_STRENGTH":
        return t("reward.effect.gainStrength", { value: effect.value });
      case "GAIN_ENERGY":
        return t("reward.effect.gainEnergy", { value: effect.value });
      case "APPLY_BUFF":
        return t("reward.effect.applyBuff", {
          buff: effect.buff ?? "status",
          value: effect.value,
        });
      case "APPLY_DEBUFF":
        return t("reward.effect.applyDebuff", {
          buff: effect.buff ?? "status",
          value: effect.value,
        });
      case "DRAIN_INK":
        return t("reward.effect.drainInk", { value: effect.value });
      default:
        return t("reward.effect.fallback", {
          type: effect.type.toLowerCase(),
          value: effect.value,
        });
    }
  });

  const targetLabel =
    ability.target === "ALL_ENEMIES"
      ? t("reward.target.allEnemies")
      : ability.target === "LOWEST_HP_ENEMY"
        ? t("reward.target.lowestHpEnemy")
        : ability.target === "ALLY_PRIORITY"
          ? t("reward.target.allyPriority")
          : ability.target === "SELF"
            ? t("reward.target.self")
            : t("reward.target.player");

  return `${targetLabel}: ${effects.join(", ")}`;
}

function buildMobileEnemyIntentChips(
  combat: CombatState,
  enemy: CombatState["enemies"][number],
  resolvedTarget:
    | "player"
    | "all_enemies"
    | "all_allies"
    | { type: "enemy"; instanceId: string }
    | { type: "ally"; instanceId: string },
  ability: EnemyAbility | undefined,
  hideIntent: boolean,
  t?: (key: string, options?: Record<string, unknown>) => string
): string[] {
  const translate = typeof t === "function" ? t : (key: string) => key;
  if (!ability || hideIntent) return [translate("enemyCard.intentHidden")];

  const chips = ability.effects.map((effect) => {
    switch (effect.type) {
      case "DAMAGE":
        return `${translate("enemyCard.dmg")} ${computeEnemyDamagePreview(
          combat,
          enemy,
          resolvedTarget,
          effect.value,
          ability
        )}`;
      case "BLOCK":
        return `${translate("enemyCard.blk")} ${effect.value}`;
      case "HEAL":
        return `HEAL ${effect.value}`;
      case "APPLY_DEBUFF":
        return `DEB ${effect.value}`;
      case "APPLY_BUFF":
        return `BUF ${effect.value}`;
      case "DRAIN_INK":
        return `INK-${effect.value}`;
      default:
        return `${effect.type.slice(0, 3)} ${effect.value}`;
    }
  });

  const bonusIfPlayerDebuffed = getBonusDamageIfPlayerDebuffed(
    enemy.definitionId,
    ability.name
  );
  if (bonusIfPlayerDebuffed) {
    chips.push(
      translate("enemyCard.conditionalBonusVsDebuffed", {
        bonus: bonusIfPlayerDebuffed,
      })
    );
  }

  return chips;
}

function computeEnemyDamagePreview(
  combat: CombatState,
  enemy: CombatState["enemies"][number],
  resolvedTarget:
    | "player"
    | "all_enemies"
    | "all_allies"
    | { type: "enemy"; instanceId: string }
    | { type: "ally"; instanceId: string },
  baseDamage: number,
  ability?: EnemyAbility
): number {
  let effectiveBaseDamage = baseDamage;
  if (ability && resolvedTarget === "player") {
    const bonusIfPlayerDebuffed = getBonusDamageIfPlayerDebuffed(
      enemy.definitionId,
      ability.name
    );
    if (
      bonusIfPlayerDebuffed &&
      hasPlayerDebuffForEnemyBonus(combat.player.buffs)
    ) {
      effectiveBaseDamage += bonusIfPlayerDebuffed;
    }
  }

  const scaledBaseDamage = Math.max(
    1,
    Math.round(effectiveBaseDamage * (combat.enemyDamageScale ?? 1))
  );
  const targetBuffs = resolveEnemyIntentTargetBuffs(combat, resolvedTarget);
  return calculateDamage(
    scaledBaseDamage,
    { strength: getStrengthFromBuffs(enemy.buffs), buffs: enemy.buffs },
    { buffs: targetBuffs }
  );
}

function resolveEnemyIntentTargetBuffs(
  combat: CombatState,
  resolvedTarget:
    | "player"
    | "all_enemies"
    | "all_allies"
    | { type: "enemy"; instanceId: string }
    | { type: "ally"; instanceId: string }
): BuffInstance[] {
  if (resolvedTarget === "player") return combat.player.buffs;

  if (resolvedTarget === "all_enemies") {
    return combat.player.buffs;
  }

  if (resolvedTarget === "all_allies") {
    return combat.enemies.find((entry) => entry.currentHp > 0)?.buffs ?? [];
  }

  if (resolvedTarget.type === "ally") {
    return (
      combat.allies.find(
        (entry) => entry.instanceId === resolvedTarget.instanceId
      )?.buffs ?? []
    );
  }

  return (
    combat.enemies.find(
      (entry) => entry.instanceId === resolvedTarget.instanceId
    )?.buffs ?? []
  );
}

function getStrengthFromBuffs(buffs: BuffInstance[]): number {
  return buffs
    .filter((buff) => buff.type === "STRENGTH")
    .reduce((total, buff) => total + buff.stacks, 0);
}

function getPreviewEffectsForSelectedCard(
  definition: CardDefinition,
  upgraded: boolean,
  useInked: boolean,
  attackBonus: number
): Effect[] {
  const isUsingInkedVariant = Boolean(useInked && definition.inkedVariant);
  let effects = isUsingInkedVariant
    ? definition.inkedVariant!.effects
    : definition.effects;

  if (upgraded) {
    if (isUsingInkedVariant) {
      effects = boostEffectsForUpgrade(effects);
    } else if (definition.upgrade) {
      effects = definition.upgrade.effects;
    } else {
      effects = boostEffectsForUpgrade(effects);
    }
  }

  const effectiveAttackBonus = definition.type === "ATTACK" ? attackBonus : 0;
  if (effectiveAttackBonus <= 0) {
    return effects;
  }

  return effects.map((effect) =>
    effect.type === "DAMAGE"
      ? { ...effect, value: effect.value + effectiveAttackBonus }
      : effect
  );
}

function buildIncomingDamagePreviewMap(
  combat: CombatState,
  definition: CardDefinition | null,
  effects: Effect[],
  selectedCardId: string | null
): Map<string, number> {
  const result = new Map<string, number>();
  if (!selectedCardId || !definition) return result;
  if (
    definition.targeting !== "SINGLE_ENEMY" &&
    definition.targeting !== "ALL_ENEMIES"
  ) {
    return result;
  }
  if (!effects.some((e) => e.type === "DAMAGE")) return result;

  for (const enemy of combat.enemies) {
    if (enemy.currentHp <= 0) continue;
    result.set(
      enemy.instanceId,
      computeIncomingDamageAgainstEnemy(
        effects,
        combat.player.strength,
        combat.player.buffs,
        enemy.block,
        enemy.buffs
      )
    );
  }

  return result;
}

function computeIncomingDamageAgainstEnemy(
  effects: Effect[],
  attackerStrength: number,
  attackerBuffs: CombatState["player"]["buffs"],
  targetBlock: number,
  targetBuffs: CombatState["enemies"][number]["buffs"]
): number {
  let totalHpLoss = 0;
  let tempBlock = Math.max(0, targetBlock);
  let tempStrength = attackerStrength;
  let tempTargetBuffs = targetBuffs;

  for (const effect of effects) {
    if (effect.type === "GAIN_STRENGTH") {
      tempStrength += effect.value;
      continue;
    }

    if (
      (effect.type === "APPLY_DEBUFF" || effect.type === "APPLY_BUFF") &&
      effect.buff
    ) {
      tempTargetBuffs = applyBuff(
        tempTargetBuffs,
        effect.buff,
        effect.value,
        effect.duration
      );
      continue;
    }

    if (effect.type === "DAMAGE") {
      const rawDamage = calculateDamage(
        effect.value,
        { strength: tempStrength, buffs: attackerBuffs },
        { buffs: tempTargetBuffs }
      );
      const blocked = Math.min(tempBlock, rawDamage);
      tempBlock -= blocked;
      totalHpLoss += Math.max(0, rawDamage - blocked);
    }
  }

  return Math.max(0, totalHpLoss);
}

function resolveEnemyIntentTargetLabel(
  combat: CombatState,
  target:
    | "player"
    | "all_enemies"
    | "all_allies"
    | { type: "enemy"; instanceId: string }
    | { type: "ally"; instanceId: string },
  t: (key: string, options?: Record<string, unknown>) => string
): string | null {
  if (target === "player") return t("combat.you");
  if (target === "all_enemies") return t("combat.allEnemies");
  if (target === "all_allies") return t("combat.allAllies");
  if (target.type === "ally") {
    return (
      combat.allies.find((a) => a.instanceId === target.instanceId)?.name ??
      t("combat.ally")
    );
  }
  if (target.type === "enemy") {
    const enemy = combat.enemies.find(
      (e) => e.instanceId === target.instanceId
    );
    return enemy
      ? localizeEnemyName(enemy.definitionId, enemy.name)
      : t("combat.enemy");
  }
  return t("combat.you");
}

/**
 * Small badge showing incoming damage for the next enemy turn.
 * Red   = net damage after current block (block < damage).
 * Green = current block fully absorbs the hit.
 */
function IncomingDamageBadge({
  damage,
  block,
}: {
  damage: number;
  block: number;
}) {
  const covered = block >= damage;
  return (
    <div
      className={cn(
        "absolute -top-3 right-1 z-20 rounded border px-1 py-0.5 text-[10px] font-bold",
        covered
          ? "border-green-700/80 bg-green-950/90 text-green-300"
          : "border-red-700/80 bg-red-950/90 text-red-300"
      )}
    >
      {covered ? "🛡" : "⚔"} {damage}
    </div>
  );
}
