"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import type { CombatState } from "@/game/schemas/combat-state";
import type { CardDefinition } from "@/game/schemas/cards";
import type {
  EnemyDefinition,
  AllyDefinition,
  EnemyAbility,
} from "@/game/schemas/entities";
import type { InkPowerType } from "@/game/schemas/enums";
import type {
  UsableItemDefinition,
  UsableItemInstance,
} from "@/game/schemas/items";
import type { Effect } from "@/game/schemas/effects";
import { EnemyCard } from "./EnemyCard";
import { GameCard } from "./GameCard";
import { HandArea } from "./HandArea";
import { PlayerStats } from "./PlayerStats";
import { InkGauge } from "./InkGauge";
import { Tooltip } from "../shared/Tooltip";
// TEMPORARY: centralized asset registry — swap paths in src/lib/assets.ts when real art is ready
import { BACKGROUNDS, PLAYER_AVATAR } from "@/lib/assets";
import { playSound } from "@/lib/sound";
import { resolveEnemyAbilityTarget } from "@/game/engine/enemies";
import { boostEffectsForUpgrade } from "@/game/engine/card-upgrades";
import { calculateDamage } from "@/game/engine/damage";
import { applyBuff } from "@/game/engine/buffs";

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
  debugEnemySelection,
}: CombatViewProps) {
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

  const discardBtnRef = useRef<HTMLButtonElement>(null);
  const enemyRowRef = useRef<HTMLDivElement>(null);
  const [playingCardId, setPlayingCardId] = useState<string | null>(null);
  const prevEnemyIdsRef = useRef<string[]>(
    combat.enemies.map((e) => e.instanceId)
  );
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
      "Enemy";
    const spawnedNames = spawned.map((e) => e.name);
    const announcement =
      spawnedNames.length === 1
        ? `${summonerName} summons ${spawnedNames[0]}!`
        : `${summonerName} summons reinforcements!`;
    setSummonAnnouncement(announcement);
    summonHideTimerRef.current = setTimeout(
      () => setSummonAnnouncement(null),
      1200
    );
  }, [combat.enemies, actingEnemyId]);

  useEffect(() => {
    const spawnTimers = spawnClearTimersRef.current;
    return () => {
      if (summonHideTimerRef.current) clearTimeout(summonHideTimerRef.current);
      for (const timer of spawnTimers) clearTimeout(timer);
    };
  }, []);

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
    ? "bg-emerald-700 text-white hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-900/50"
    : "cursor-not-allowed bg-slate-700 text-slate-500 opacity-50";

  let turnBadgeClass = "bg-slate-700 text-slate-400";
  if (isPlayerTurn) turnBadgeClass = "bg-emerald-900/80 text-emerald-300";
  else if (combat.phase === "ALLIES_ENEMIES_TURN")
    turnBadgeClass = "bg-red-900/80 text-red-300";
  else if (combat.phase === "COMBAT_WON")
    turnBadgeClass = "bg-yellow-900/80 text-yellow-300";
  else if (combat.phase === "COMBAT_LOST")
    turnBadgeClass = "bg-red-900/80 text-red-300";

  const turnLabel = isPlayerTurn
    ? "Your Turn"
    : combat.phase === "ALLIES_ENEMIES_TURN"
      ? "Enemy Turn"
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
      ? "Draw Pile"
      : openPile === "discard"
        ? "Discard Pile"
        : openPile === "exhaust"
          ? "Exhaust Pile"
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
      {/* ── BATTLEFIELD ─────────────────────────────────── */}
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-2 py-2 lg:px-6 lg:py-4 [@media(max-height:540px)]:px-1.5 [@media(max-height:540px)]:py-1">
        {/* Background — TEMPORARY: shows image if present, CSS gradient otherwise */}
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
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(99,102,241,0.08),transparent)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950 to-transparent" />

        {/* Turn indicator */}
        <div className="relative z-10 flex items-center gap-1.5 self-start lg:gap-2 [@media(max-height:540px)]:hidden">
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 lg:px-2 lg:text-xs">
            Turn {combat.turnNumber}
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
        {debugEnemySelection && (
          <div className="absolute right-2 top-2 z-20 w-[min(28rem,calc(100%-1rem))] rounded-md border border-cyan-500/40 bg-cyan-950/70 p-2 text-[10px] text-cyan-100 shadow-lg shadow-cyan-950/60 lg:text-xs">
            <div className="mb-1 flex items-center justify-between font-semibold uppercase tracking-wide text-cyan-200">
              <span>Enemy Spawn Debug</span>
              <span>
                F{debugEnemySelection.floor} R{debugEnemySelection.room + 1} ·{" "}
                {debugEnemySelection.biome}
              </span>
            </div>
            <p className="truncate text-cyan-100/90">
              Planned: {debugEnemySelection.plannedEnemyIds.join(", ") || "-"}
            </p>
            <p className="mb-1 text-cyan-100/90">
              Thematic unit present:{" "}
              {debugEnemySelection.hasThematicUnit ? "YES" : "NO"}
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
        )}

        {/* Enemy row */}
        <div
          ref={enemyRowRef}
          className="relative z-10 flex min-h-0 w-full flex-1 items-center justify-center gap-2 overflow-x-auto py-1 lg:gap-6 lg:py-4 [@media(max-height:540px)]:gap-3 [@media(max-height:540px)]:py-0.5"
        >
          {combat.enemies.map((enemy) => {
            const def = enemyDefs.get(enemy.definitionId);
            if (!def) return null;
            const ability = def.abilities[enemy.intentIndex];
            const resolvedTarget = ability
              ? resolveEnemyAbilityTarget(combat, enemy, ability)
              : "player";
            return (
              <EnemyCard
                key={enemy.instanceId}
                enemy={enemy}
                definition={def}
                enemyDamageScale={combat.enemyDamageScale}
                playerBuffs={combat.player.buffs}
                intentTargetsPlayer={resolvedTarget === "player"}
                incomingDamagePreview={
                  incomingDamageByEnemyId.get(enemy.instanceId) ?? null
                }
                isTargeted={
                  selectingEnemyTarget &&
                  selectedCardId !== null &&
                  enemy.currentHp > 0 &&
                  !actingEnemyId
                }
                intentTargetLabel={resolveEnemyIntentTargetLabel(
                  combat,
                  resolvedTarget
                )}
                isActing={actingEnemyId === enemy.instanceId}
                isAttacking={attackingEnemyId === enemy.instanceId}
                isNewlySummoned={newlySummonedIds.has(enemy.instanceId)}
                onClick={() => handleEnemyClick(enemy.instanceId)}
              />
            );
          })}
        </div>

        {/* Target prompt */}
        {needsTarget && selectedCardId && (
          <div className="relative z-10 animate-bounce pb-1 text-xs font-semibold text-yellow-300 lg:text-sm">
            {selectingAllyTarget
              ? "Choose an ally for "
              : "Choose a target for "}
            <span className="text-white">{selectedDef?.name}</span>
          </div>
        )}
        {!needsTarget && selectedCardId && (
          <div className="relative z-10 pb-1 text-[10px] font-semibold text-cyan-300 lg:text-xs">
            {selfCanRetargetToAlly
              ? "Tap card again to self-cast, or click an ally to target them"
              : "Tap the selected card again to play it"}
          </div>
        )}
        {needsItemEnemyTarget && selectedUsableItemDef && (
          <div className="relative z-10 animate-bounce pb-1 text-xs font-semibold text-orange-300 lg:text-sm">
            Choose an enemy for{" "}
            <span className="text-white">{selectedUsableItemDef.name}</span>
          </div>
        )}
        {combat.allies.length > 0 && (
          <div className="relative z-10 mb-1 flex w-full max-w-4xl flex-wrap items-stretch justify-center gap-2 lg:mb-2">
            {combat.allies.map((ally) => {
              const def = allyDefs.get(ally.definitionId);
              const intent = def?.abilities[ally.intentIndex];
              return (
                <div
                  key={ally.instanceId}
                  data-keep-selection="true"
                  onClick={
                    (selectingAllyTarget || selfCanRetargetToAlly) &&
                    ally.currentHp > 0 &&
                    !actingEnemyId
                      ? () => handleAllyClick(ally.instanceId)
                      : undefined
                  }
                  className={cn(
                    "w-44 rounded-lg border p-2 text-left transition",
                    ally.currentHp > 0
                      ? "border-cyan-700 bg-cyan-950/50 text-cyan-100"
                      : "border-gray-700 bg-gray-900/60 text-gray-500",
                    (selectingAllyTarget || selfCanRetargetToAlly) &&
                      ally.currentHp > 0 &&
                      !actingEnemyId &&
                      "cursor-pointer hover:border-cyan-400 hover:bg-cyan-900/50"
                  )}
                >
                  <div className="truncate text-xs font-bold">{ally.name}</div>
                  <div className="mt-0.5 text-[11px]">
                    HP {Math.max(0, ally.currentHp)}/{ally.maxHp} - SPD{" "}
                    {ally.speed}
                  </div>
                  {ally.block > 0 && (
                    <div className="mt-0.5 text-[10px] text-blue-300">
                      Block {ally.block}
                    </div>
                  )}
                  {!intent ? (
                    <div className="mt-1 text-[10px] text-cyan-300/70">
                      No ability
                    </div>
                  ) : (
                    <div className="mt-1 rounded border border-cyan-800/70 bg-cyan-900/40 px-1.5 py-1">
                      <div className="text-[10px] uppercase tracking-wide text-cyan-300">
                        Next
                      </div>
                      <div className="truncate text-[11px] font-semibold text-white">
                        {intent.name}
                      </div>
                      <div className="mt-0.5 text-[10px] text-cyan-200">
                        {formatAllyIntent(intent)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {isSelectingCheatKillTarget && (
          <div className="relative z-10 animate-bounce pb-1 text-xs font-semibold text-rose-300 lg:text-sm">
            DEV: choose an enemy to kill
          </div>
        )}
      </div>

      {/* ── PLAYER ZONE ──────────────────────────────────── */}
      <div className="shrink-0 border-t border-slate-700/50 bg-slate-950 [@media(max-height:540px)]:border-t-slate-800/70">
        {/* HUD row */}
        <div className="flex items-center gap-1.5 px-2 py-1.5 lg:gap-3 lg:px-4 lg:py-3 [@media(max-height:540px)]:gap-1 [@media(max-height:540px)]:px-1.5 [@media(max-height:540px)]:py-1">
          {/* Player avatar — TEMPORARY: shows image if present, ✦ otherwise */}
          <div
            className={cn(
              "relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 bg-slate-800 text-xl transition-colors duration-100 lg:h-14 lg:w-14 lg:text-2xl [@media(max-height:540px)]:h-8 [@media(max-height:540px)]:w-8 [@media(max-height:540px)]:text-sm",
              playerHit
                ? "animate-player-hit border-red-500 text-red-400"
                : "border-slate-700 text-slate-600"
            )}
          >
            {!avatarFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={PLAYER_AVATAR}
                alt="Player"
                className="absolute inset-0 h-full w-full object-cover"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <span>✦</span>
            )}
          </div>

          {/* HP + buffs */}
          <div className="min-w-0 flex-1">
            <PlayerStats
              player={combat.player}
              disruption={combat.playerDisruption}
            />
          </div>

          {usableItems.length > 0 && (
            <div
              data-keep-selection="true"
              className="flex flex-shrink-0 flex-wrap items-center justify-end gap-1 lg:max-w-72"
            >
              {usableItems.map((item) => {
                const def = usableItemDefs.get(item.definitionId);
                if (!def) return null;
                const isSelected = selectedUsableItemId === item.instanceId;
                return (
                  <Tooltip key={item.instanceId} content={def.description}>
                    <button
                      type="button"
                      onClick={() => handleUseItemClick(item.instanceId)}
                      className={cn(
                        "rounded border px-2 py-1 text-[9px] font-semibold uppercase tracking-wide transition lg:text-[10px]",
                        isSelected
                          ? "border-orange-400 bg-orange-900/60 text-orange-100"
                          : "border-orange-700/70 bg-slate-900 text-orange-200 hover:border-orange-400",
                        !isPlayerTurn && "cursor-not-allowed opacity-50"
                      )}
                      disabled={!isPlayerTurn}
                    >
                      {def.name}
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          )}

          {/* Ink gauge */}
          <div className="w-36 flex-shrink-0 lg:w-60 [@media(max-height:540px)]:w-28">
            <InkGauge
              player={combat.player}
              combatState={combat}
              onUsePower={handleUseInkPower}
              unlockedPowers={unlockedInkPowers}
            />
          </div>

          {/* End turn */}
          <button
            className={cn(
              "flex-shrink-0 rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all lg:px-5 lg:py-3 lg:text-sm [@media(max-height:540px)]:px-1.5 [@media(max-height:540px)]:py-1 [@media(max-height:540px)]:text-[9px]",
              endTurnClass
            )}
            disabled={!isPlayerTurn}
            onClick={onEndTurn}
          >
            End Turn
          </button>

          {onCheatKillEnemy && (
            <button
              className={cn(
                "flex-shrink-0 rounded-lg border px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all lg:px-3 lg:py-2 lg:text-xs",
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
              {isSelectingCheatKillTarget ? "Cancel Kill" : "Dev Kill"}
            </button>
          )}
        </div>

        {/* Hand */}
        <div className="border-t border-slate-800/60 px-2 pb-2 pt-1.5 lg:px-4 lg:pb-4 lg:pt-3 [@media(max-height:540px)]:px-1.5 [@media(max-height:540px)]:pb-1 [@media(max-height:540px)]:pt-1">
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

          {/* Pile counters */}
          <div className="mt-1.5 flex justify-center gap-3 lg:mt-2 lg:gap-6 [@media(max-height:540px)]:mt-1 [@media(max-height:540px)]:gap-2">
            {/* Pioche */}
            <button
              style={{
                boxShadow: "2px 2px 0 1px #334155, 4px 4px 0 1px #1e293b",
              }}
              className="flex w-14 flex-col items-center gap-0.5 rounded-lg border border-slate-500/70 bg-slate-800 py-1.5 transition hover:border-slate-300 lg:w-20 lg:py-2 [@media(max-height:540px)]:w-12 [@media(max-height:540px)]:py-1"
              onClick={() => {
                setIsSelectingCheatKillTarget(false);
                setIsSelectingRewriteTarget(false);
                setOpenPile("draw");
              }}
              type="button"
            >
              <span className="text-[8px] font-semibold uppercase tracking-wider text-slate-400 lg:text-[10px]">
                Pioche
              </span>
              <span className="text-base font-black text-slate-100 lg:text-xl">
                {combat.drawPile.length}
              </span>
            </button>

            {/* Défausse */}
            <button
              ref={discardBtnRef}
              style={{
                boxShadow: "2px 2px 0 1px #7f1d1d, 4px 4px 0 1px #450a0a",
              }}
              className="flex w-14 flex-col items-center gap-0.5 rounded-lg border border-red-700/60 bg-slate-800 py-1.5 transition hover:border-red-400 lg:w-20 lg:py-2 [@media(max-height:540px)]:w-12 [@media(max-height:540px)]:py-1"
              onClick={() => {
                setIsSelectingCheatKillTarget(false);
                setIsSelectingRewriteTarget(false);
                setOpenPile("discard");
              }}
              type="button"
            >
              <span className="text-[8px] font-semibold uppercase tracking-wider text-red-400/80 lg:text-[10px]">
                Défausse
              </span>
              <span className="text-base font-black text-slate-100 lg:text-xl">
                {combat.discardPile.length}
              </span>
            </button>

            {/* Épuisé */}
            {combat.exhaustPile.length > 0 && (
              <button
                style={{
                  boxShadow: "2px 2px 0 1px #4c1d95, 4px 4px 0 1px #2e1065",
                }}
                className="flex w-14 flex-col items-center gap-0.5 rounded-lg border border-purple-700/60 bg-slate-800 py-1.5 transition hover:border-purple-400 lg:w-20 lg:py-2 [@media(max-height:540px)]:w-12 [@media(max-height:540px)]:py-1"
                onClick={() => {
                  setIsSelectingCheatKillTarget(false);
                  setIsSelectingRewriteTarget(false);
                  setOpenPile("exhaust");
                }}
                type="button"
              >
                <span className="text-[8px] font-semibold uppercase tracking-wider text-purple-400/80 lg:text-[10px]">
                  Épuisé
                </span>
                <span className="text-base font-black text-slate-100 lg:text-xl">
                  {combat.exhaustPile.length}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

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
                  {pileCards.length} card{pileCards.length > 1 ? "s" : ""}
                  {openPile === "draw" ? " (display order is masked)" : ""}
                </p>
                {isSelectingRewriteTarget && openPile === "discard" && (
                  <p className="text-xs font-semibold text-cyan-300">
                    Select a card to retrieve with Rewrite
                  </p>
                )}
              </div>
              <button
                className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:border-slate-400"
                onClick={closePileOverlay}
                type="button"
              >
                Close
              </button>
            </div>

            {pileCards.length === 0 ? (
              <p className="text-sm text-slate-500">No cards in this pile.</p>
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
    </div>
  );
}

function formatAllyIntent(ability: EnemyAbility): string {
  const effects = ability.effects.map((effect) => {
    switch (effect.type) {
      case "DAMAGE":
        return `damage ${effect.value}`;
      case "HEAL":
        return `heal ${effect.value}`;
      case "BLOCK":
        return `block ${effect.value}`;
      case "DRAW_CARDS":
        return `draw ${effect.value}`;
      case "GAIN_INK":
        return `+${effect.value} ink`;
      case "GAIN_FOCUS":
        return `+${effect.value} focus`;
      case "GAIN_STRENGTH":
        return `+${effect.value} strength`;
      case "GAIN_ENERGY":
        return `+${effect.value} energy`;
      case "APPLY_BUFF":
        return `buff ${effect.buff ?? "status"} ${effect.value}`;
      case "APPLY_DEBUFF":
        return `debuff ${effect.buff ?? "status"} ${effect.value}`;
      case "DRAIN_INK":
        return `drain ${effect.value} ink`;
      default:
        return `${effect.type.toLowerCase()} ${effect.value}`;
    }
  });

  const targetLabel =
    ability.target === "ALL_ENEMIES"
      ? "all enemies"
      : ability.target === "LOWEST_HP_ENEMY"
        ? "lowest HP enemy"
        : ability.target === "ALLY_PRIORITY"
          ? "ally priority"
          : ability.target === "SELF"
            ? "self"
            : "player";

  return `${targetLabel}: ${effects.join(", ")}`;
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
    | { type: "ally"; instanceId: string }
): string | null {
  if (target === "player") return "You";
  if (target === "all_enemies") return "All enemies";
  if (target === "all_allies") return "All allies";
  if (target.type === "ally") {
    return (
      combat.allies.find((a) => a.instanceId === target.instanceId)?.name ??
      "Ally"
    );
  }
  if (target.type === "enemy") {
    return (
      combat.enemies.find((e) => e.instanceId === target.instanceId)?.name ??
      "Enemy"
    );
  }
  return "You";
}
