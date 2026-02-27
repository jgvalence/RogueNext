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
import type { InkPowerType } from "@/game/schemas/enums";
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
// TEMPORARY: centralized asset registry â€” swap paths in src/lib/assets.ts when real art is ready
import { BACKGROUNDS, PLAYER_AVATAR } from "@/lib/assets";
import { playSound } from "@/lib/sound";
import { resolveEnemyAbilityTarget } from "@/game/engine/enemies";
import { boostEffectsForUpgrade } from "@/game/engine/card-upgrades";
import { calculateDamage } from "@/game/engine/damage";
import { applyBuff } from "@/game/engine/buffs";
import { shouldHideEnemyIntent } from "@/game/engine/difficulty";
import { useTranslation } from "react-i18next";

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
  usableItems: UsableItemInstance[];
  usableItemDefs: Map<string, UsableItemDefinition>;
  onCheatKillEnemy?: (enemyInstanceId: string) => void;
  actingEnemyId?: string | null;
  attackingEnemyId?: string | null;
  unlockedInkPowers?: InkPowerType[];
  isDiscarding?: boolean;
  attackBonus?: number;
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
  usableItems,
  usableItemDefs,
  onCheatKillEnemy,
  actingEnemyId = null,
  attackingEnemyId = null,
  unlockedInkPowers,
  isDiscarding = false,
  attackBonus = 0,
  debugEnemySelection: _debugEnemySelection,
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
    const summonerName =
      (actingEnemyId &&
        combat.enemies.find((e) => e.instanceId === actingEnemyId)?.name) ||
      t("combat.enemy");
    const spawnedNames = spawned.map((e) => e.name);
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
  }, [combat.enemies, actingEnemyId, t]);

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
    [combat.hand, cardDefs, triggerCardPlay, pendingInked, selectedCardId]
  );

  const handleUseItemClick = useCallback(
    (itemInstanceId: string) => {
      if (combat.phase !== "PLAYER_TURN") return;
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
    [combat.phase, onUseItem, usableItemDefs, usableItems]
  );

  const isPlayerTurn = combat.phase === "PLAYER_TURN";

  const endTurnClass = isPlayerTurn
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
      if (power === "REWRITE") {
        setIsSelectingCheatKillTarget(false);
        setIsSelectingRewriteTarget(true);
        setOpenPile("discard");
        return;
      }

      onUseInkPower(power, null);
    },
    [onUseInkPower]
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
      {/* â”€â”€ BATTLEFIELD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-[#030712] via-[#041235] to-[#020617] px-2 py-2 lg:px-6 lg:py-4 [@media(max-height:540px)]:px-1.5 [@media(max-height:540px)]:py-1">
        {/* Background â€” TEMPORARY: shows image if present, CSS gradient otherwise */}
        {!bgFailed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={BACKGROUNDS.combat}
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
        {/* {debugEnemySelection && (
          <div className="absolute right-2 top-2 z-20 w-[min(28rem,calc(100%-1rem))] rounded-md border border-cyan-500/40 bg-cyan-950/70 p-2 text-[10px] text-cyan-100 shadow-lg shadow-cyan-950/60 lg:text-xs">
            <div className="mb-1 flex items-center justify-between font-semibold uppercase tracking-wide text-cyan-200">
              <span>{t("combat.debugTitle")}</span>
              <span>
                F{debugEnemySelection.floor} R{debugEnemySelection.room + 1} Â·{" "}
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
                        "h-[72px] rounded-lg border bg-indigo-950/40 px-1.5 py-1 text-left",
                        playerHit
                          ? "border-red-400 shadow-[0_0_14px_rgba(248,113,113,0.4)]"
                          : "border-indigo-500/70"
                      )}
                    >
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
                      "h-[72px] rounded-lg border bg-cyan-950/40 px-1.5 py-1 text-left",
                      isDead
                        ? "border-slate-800 opacity-45 grayscale"
                        : "border-cyan-700/80",
                      canTarget && "border-cyan-300 ring-1 ring-cyan-300/70"
                    )}
                  >
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
                const hideIntent = shouldHideEnemyIntent(
                  combat.difficultyLevel ?? 0,
                  combat.turnNumber,
                  enemy
                );
                const intentChips = buildMobileEnemyIntentChips(
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
                      {enemy.name}
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
                        ? ` Â· ${t("combat.block")} ${ally.block}`
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
                    <span className="text-2xl">âœ¦</span>
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
                    ? ` Â· ${t("combat.block")} ${combat.player.block}`
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
                        {enemy.name}
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
                            {ability.name}
                            {" -> "}
                            {resolveEnemyIntentTargetLabel(
                              combat,
                              resolvedTarget,
                              t
                            )}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {renderEnemyIntentEffects(ability.effects, t)}
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-300">
                          {hideIntent ? t("enemyCard.intentHidden") : "-"}
                        </p>
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
                        {hideIntent ? "???" : (ability?.name ?? "-")}
                      </span>
                      <span className="text-2xl text-rose-200">*</span>
                    </div>
                    <p className="truncate text-[11px] font-bold text-rose-100 lg:text-xs">
                      {enemy.name}
                    </p>
                    <HpBar
                      current={Math.max(0, enemy.currentHp)}
                      max={enemy.maxHp}
                      showText={false}
                      className="mt-1 h-2 bg-slate-700"
                    />
                    <p className="mt-1 text-[10px] font-semibold text-slate-200 lg:text-[11px]">
                      {Math.max(0, enemy.currentHp)}/{enemy.maxHp}
                      {enemy.block > 0
                        ? ` Â· ${t("combat.block")} ${enemy.block}`
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

        {/* Target prompt */}
        {needsTarget && selectedCardId && (
          <div className="relative z-10 animate-bounce pb-1 text-xs font-semibold text-yellow-300 lg:text-sm">
            {selectingAllyTarget
              ? t("combat.chooseAllyFor")
              : t("combat.chooseTargetFor")}
            <span className="text-white">{selectedDef?.name}</span>
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
          <div className="relative z-10 animate-bounce pb-1 text-xs font-semibold text-orange-300 lg:text-sm">
            {t("combat.chooseEnemyFor")}{" "}
            <span className="text-white">{selectedUsableItemDef.name}</span>
          </div>
        )}
        {isSelectingCheatKillTarget && (
          <div className="relative z-10 animate-bounce pb-1 text-xs font-semibold text-rose-300 lg:text-sm">
            {t("combat.devChooseEnemy")}
          </div>
        )}
      </div>

      {/* PLAYER ZONE */}
      <div className="shrink-0 border-t border-cyan-500/20 bg-slate-950/95 backdrop-blur-sm [@media(max-height:540px)]:border-t-slate-800/70">
        <div className="relative border-t border-cyan-500/10 px-2 pb-2 pt-2 lg:px-4 lg:pb-3 lg:pt-2.5 [@media(max-height:540px)]:px-1.5 [@media(max-height:540px)]:pb-1 [@media(max-height:540px)]:pt-1">
          <div className="mb-1 space-y-1 lg:hidden">
            <div className="flex gap-1 overflow-x-auto pb-0.5">
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

              <button
                className={cn(
                  "h-8 min-w-[96px] rounded-md px-2 text-[10px] font-black uppercase tracking-wide transition-all",
                  endTurnClass
                )}
                disabled={!isPlayerTurn}
                onClick={onEndTurn}
              >
                {t("combat.endTurn")}
              </button>

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
                        !isPlayerTurn && "cursor-not-allowed opacity-50"
                      )}
                      disabled={!isPlayerTurn}
                    >
                      {def.name}
                    </button>
                  );
                })
              )}
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
                  ↺
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
                          content={def.description}
                        >
                          <button
                            type="button"
                            onClick={() => handleUseItemClick(item.instanceId)}
                            className={cn(
                              "h-9 min-w-24 rounded-lg border px-2 text-[9px] font-semibold uppercase tracking-wide transition",
                              isSelected
                                ? "border-amber-300 bg-amber-700/50 text-amber-50"
                                : "border-amber-700/70 bg-slate-900/80 text-amber-200 hover:border-amber-400 hover:bg-amber-950/60",
                              !isPlayerTurn && "cursor-not-allowed opacity-50"
                            )}
                            disabled={!isPlayerTurn}
                          >
                            {def.name}
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
                disabled={!isPlayerTurn}
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
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/65 p-3 lg:hidden"
          onClick={() => setMobileInfoPanel(null)}
        >
          <div
            data-keep-selection="true"
            className="w-full max-w-sm rounded-xl border border-slate-600 bg-slate-900/95 p-3 text-[11px] text-slate-200 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {mobileInfoPanel.type === "player" && (
              <div className="space-y-1.5">
                <p className="text-sm font-bold text-indigo-200">
                  {t("combat.player")}
                </p>
                <p>
                  {t("combat.hp")} {Math.max(0, combat.player.currentHp)}/
                  {combat.player.maxHp}
                </p>
                <p>
                  {t("combat.block")} {combat.player.block}
                </p>
                <p>
                  {t("combat.energyShort")} {combat.player.energyCurrent}/
                  {combat.player.energyMax} | {t("inkGauge.ink")}{" "}
                  {combat.player.inkCurrent}/{combat.player.inkMax}
                </p>
                <div className="flex flex-wrap gap-1">
                  {renderCompactBuffs(buildPlayerMarkerBuffs(combat.player))}
                </div>
              </div>
            )}

            {mobileInfoPanel.type === "ally" &&
              mobileInfoAlly &&
              (() => {
                const def = allyDefs.get(mobileInfoAlly.definitionId);
                const intent = def?.abilities[mobileInfoAlly.intentIndex];
                return (
                  <div className="space-y-1.5">
                    <p className="text-sm font-bold text-cyan-200">
                      {mobileInfoAlly.name}
                    </p>
                    <p>
                      {t("combat.hp")} {Math.max(0, mobileInfoAlly.currentHp)}/
                      {mobileInfoAlly.maxHp}
                    </p>
                    <p>
                      {t("combat.block")} {mobileInfoAlly.block}
                    </p>
                    <p>
                      {t("combat.spd")} {mobileInfoAlly.speed}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {renderCompactBuffs(mobileInfoAlly.buffs)}
                    </div>
                    {intent ? (
                      <p>
                        {intent.name}: {formatAllyIntent(intent, t)}
                      </p>
                    ) : (
                      <p>{t("combat.noAbility")}</p>
                    )}
                  </div>
                );
              })()}

            {mobileInfoPanel.type === "enemy" &&
              mobileInfoEnemy &&
              (() => {
                const def = enemyDefs.get(mobileInfoEnemy.definitionId);
                const ability = def?.abilities[mobileInfoEnemy.intentIndex];
                const resolvedTarget = ability
                  ? resolveEnemyAbilityTarget(combat, mobileInfoEnemy, ability)
                  : "player";
                const hideIntent = shouldHideEnemyIntent(
                  combat.difficultyLevel ?? 0,
                  combat.turnNumber,
                  mobileInfoEnemy
                );
                return (
                  <div className="space-y-1.5">
                    <p className="text-sm font-bold text-rose-200">
                      {mobileInfoEnemy.name}
                    </p>
                    <p>
                      {t("combat.hp")} {Math.max(0, mobileInfoEnemy.currentHp)}/
                      {mobileInfoEnemy.maxHp}
                    </p>
                    <p>
                      {t("combat.block")} {mobileInfoEnemy.block}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {renderCompactBuffs(mobileInfoEnemy.buffs)}
                    </div>
                    {ability && !hideIntent ? (
                      <div>
                        <p>
                          {ability.name} {"->"}{" "}
                          {resolveEnemyIntentTargetLabel(
                            combat,
                            resolvedTarget,
                            t
                          )}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {renderEnemyIntentEffects(ability.effects, t)}
                        </div>
                      </div>
                    ) : (
                      <p>{hideIntent ? t("enemyCard.intentHidden") : "-"}</p>
                    )}
                  </div>
                );
              })()}

            <button
              type="button"
              data-keep-selection="true"
              className="mt-3 w-full rounded border border-slate-600 px-2 py-1.5 text-xs font-semibold text-slate-200"
              onClick={() => setMobileInfoPanel(null)}
            >
              {t("common.close")}
            </button>
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
  t: (key: string, options?: Record<string, unknown>) => string
): ReactNode[] {
  return effects.map((effect, index) => {
    let label = "";
    let colorClass = "bg-slate-700 text-slate-100";

    switch (effect.type) {
      case "DAMAGE":
        label = `${t("enemyCard.dmg")} ${effect.value}`;
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
  ability: EnemyAbility | undefined,
  hideIntent: boolean,
  t: (key: string, options?: Record<string, unknown>) => string
): string[] {
  if (!ability || hideIntent) return [t("enemyCard.intentHidden")];

  return ability.effects.map((effect) => {
    switch (effect.type) {
      case "DAMAGE":
        return `${t("enemyCard.dmg")} ${effect.value}`;
      case "BLOCK":
        return `${t("enemyCard.blk")} ${effect.value}`;
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
    return (
      combat.enemies.find((e) => e.instanceId === target.instanceId)?.name ??
      t("combat.enemy")
    );
  }
  return t("combat.you");
}
