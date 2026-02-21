"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";
import type { CombatState } from "@/game/schemas/combat-state";
import type { CardDefinition } from "@/game/schemas/cards";
import type { EnemyDefinition } from "@/game/schemas/entities";
import type { InkPowerType } from "@/game/schemas/enums";
import { EnemyCard } from "./EnemyCard";
import { GameCard } from "./GameCard";
import { HandArea } from "./HandArea";
import { PlayerStats } from "./PlayerStats";
import { InkGauge } from "./InkGauge";
// TEMPORARY: centralized asset registry — swap paths in src/lib/assets.ts when real art is ready
import { BACKGROUNDS, PLAYER_AVATAR } from "@/lib/assets";
import { playSound } from "@/lib/sound";

interface CombatViewProps {
  combat: CombatState;
  cardDefs: Map<string, CardDefinition>;
  enemyDefs: Map<string, EnemyDefinition>;
  onPlayCard: (instanceId: string, targetId: string | null, useInked: boolean) => void;
  onEndTurn: () => void;
  onUseInkPower: (power: InkPowerType, targetId: string | null) => void;
  onCheatKillEnemy?: (enemyInstanceId: string) => void;
  actingEnemyId?: string | null;
  attackingEnemyId?: string | null;
  unlockedInkPowers?: InkPowerType[];
}

export function CombatView({
  combat,
  cardDefs,
  enemyDefs,
  onPlayCard,
  onEndTurn,
  onUseInkPower,
  onCheatKillEnemy,
  actingEnemyId = null,
  attackingEnemyId = null,
  unlockedInkPowers,
}: CombatViewProps) {
  type PileType = "draw" | "discard" | "exhaust";

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [pendingInked, setPendingInked] = useState(false);
  const [openPile, setOpenPile] = useState<PileType | null>(null);
  const [isSelectingRewriteTarget, setIsSelectingRewriteTarget] = useState(false);
  const [isSelectingCheatKillTarget, setIsSelectingCheatKillTarget] = useState(false);

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

  // TEMPORARY: track whether background image loaded
  const [bgFailed, setBgFailed] = useState(false);
  // TEMPORARY: track whether player avatar loaded
  const [avatarFailed, setAvatarFailed] = useState(false);

  const selectedCard = selectedCardId
    ? combat.hand.find((c) => c.instanceId === selectedCardId)
    : null;
  const selectedDef = selectedCard ? cardDefs.get(selectedCard.definitionId) : null;
  const needsTarget =
    selectedDef?.targeting === "SINGLE_ENEMY" ||
    selectedDef?.targeting === "SINGLE_ALLY";

  const handleEnemyClick = useCallback(
    (enemyInstanceId: string) => {
      if (isSelectingCheatKillTarget && onCheatKillEnemy) {
        onCheatKillEnemy(enemyInstanceId);
        setIsSelectingCheatKillTarget(false);
        return;
      }

      if (selectedCardId && needsTarget) {
        onPlayCard(selectedCardId, enemyInstanceId, pendingInked);
        setSelectedCardId(null);
        setPendingInked(false);
      }
    },
    [
      isSelectingCheatKillTarget,
      onCheatKillEnemy,
      selectedCardId,
      needsTarget,
      pendingInked,
      onPlayCard,
    ]
  );

  const handlePlayCard = useCallback(
    (instanceId: string, useInked: boolean) => {
      const card = combat.hand.find((c) => c.instanceId === instanceId);
      if (!card) return;
      const def = cardDefs.get(card.definitionId);
      if (!def) return;

      // TEMPORARY: play card sound (file: /public/sounds/ui/card_play.ogg)
      playSound("CARD_PLAY", 0.6);

      if (def.targeting === "SINGLE_ENEMY" || def.targeting === "SINGLE_ALLY") {
        setSelectedCardId(instanceId);
        setPendingInked(useInked);
        return;
      }

      onPlayCard(instanceId, null, useInked);
      setSelectedCardId(null);
      setPendingInked(false);
    },
    [combat.hand, cardDefs, onPlayCard]
  );

  const isPlayerTurn = combat.phase === "PLAYER_TURN";

  const endTurnClass = isPlayerTurn
    ? "bg-emerald-700 text-white hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-900/50"
    : "cursor-not-allowed bg-slate-700 text-slate-500 opacity-50";

  let turnBadgeClass = "bg-slate-700 text-slate-400";
  if (isPlayerTurn) turnBadgeClass = "bg-emerald-900/80 text-emerald-300";
  else if (combat.phase === "ALLIES_ENEMIES_TURN") turnBadgeClass = "bg-red-900/80 text-red-300";
  else if (combat.phase === "COMBAT_WON") turnBadgeClass = "bg-yellow-900/80 text-yellow-300";
  else if (combat.phase === "COMBAT_LOST") turnBadgeClass = "bg-red-900/80 text-red-300";

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

  return (
    <div className="flex h-full flex-col">
      {/* ── BATTLEFIELD ─────────────────────────────────── */}
      <div className="relative flex flex-1 flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-4">

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
        <div className="relative z-10 flex items-center gap-2 self-start">
          <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-500">
            Turn {combat.turnNumber}
          </span>
          <span className={cn("rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-widest transition-colors", turnBadgeClass)}>
            {turnLabel}
          </span>
        </div>

        {/* Enemy row */}
        <div className="relative z-10 flex flex-1 items-center justify-center gap-6 py-4">
          {combat.enemies.map((enemy) => {
            const def = enemyDefs.get(enemy.definitionId);
            if (!def) return null;
            return (
              <EnemyCard
                key={enemy.instanceId}
                enemy={enemy}
                definition={def}
                isTargeted={needsTarget && selectedCardId !== null && enemy.currentHp > 0 && !actingEnemyId}
                isActing={actingEnemyId === enemy.instanceId}
                isAttacking={attackingEnemyId === enemy.instanceId}
                onClick={() => handleEnemyClick(enemy.instanceId)}
              />
            );
          })}
        </div>

        {/* Target prompt */}
        {needsTarget && selectedCardId && (
          <div className="relative z-10 animate-bounce pb-1 text-sm font-semibold text-yellow-300">
            Choose a target for <span className="text-white">{selectedDef?.name}</span>
          </div>
        )}
        {combat.allies.length > 0 && (
          <div className="relative z-10 mb-2 flex flex-wrap items-center justify-center gap-2">
            {combat.allies.map((ally) => (
              <div
                key={ally.instanceId}
                className={cn(
                  "rounded border px-2 py-1 text-xs",
                  ally.currentHp > 0
                    ? "border-cyan-700 bg-cyan-950/50 text-cyan-200"
                    : "border-gray-700 bg-gray-900/60 text-gray-500"
                )}
              >
                {ally.name}: {Math.max(0, ally.currentHp)}/{ally.maxHp}
              </div>
            ))}
          </div>
        )}
        {isSelectingCheatKillTarget && (
          <div className="relative z-10 animate-bounce pb-1 text-sm font-semibold text-rose-300">
            DEV: choose an enemy to kill
          </div>
        )}
      </div>

      {/* ── PLAYER ZONE ──────────────────────────────────── */}
      <div className="border-t border-slate-700/50 bg-slate-950">

        {/* HUD row */}
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Player avatar — TEMPORARY: shows image if present, ✦ otherwise */}
          <div className={cn(
            "relative flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 bg-slate-800 text-2xl transition-colors duration-100",
            playerHit ? "border-red-500 animate-player-hit text-red-400" : "border-slate-700 text-slate-600"
          )}>
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
            <PlayerStats player={combat.player} />
          </div>

          {/* Ink gauge */}
          <div className="w-60 flex-shrink-0">
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
              "flex-shrink-0 rounded-lg px-5 py-3 text-sm font-bold uppercase tracking-wide transition-all",
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
                "flex-shrink-0 rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-wide transition-all",
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
        <div className="border-t border-slate-800/60 px-4 pb-4 pt-3">
          <HandArea
            hand={combat.hand}
            combatState={combat}
            cardDefs={cardDefs}
            selectedCardId={selectedCardId}
            pendingInked={pendingInked}
            onPlayCard={handlePlayCard}
          />

          {/* Pile counters */}
          <div className="mt-2 flex justify-center gap-6 text-xs text-slate-600">
            <button
              className="rounded border border-slate-700/80 bg-slate-900/70 px-2 py-1 hover:border-slate-500 hover:text-slate-300"
              onClick={() => {
                setIsSelectingCheatKillTarget(false);
                setIsSelectingRewriteTarget(false);
                setOpenPile("draw");
              }}
              type="button"
            >
              Draw{" "}
              <span className="font-semibold text-slate-400">{combat.drawPile.length}</span>
            </button>
            <button
              className="rounded border border-slate-700/80 bg-slate-900/70 px-2 py-1 hover:border-slate-500 hover:text-slate-300"
              onClick={() => {
                setIsSelectingCheatKillTarget(false);
                setIsSelectingRewriteTarget(false);
                setOpenPile("discard");
              }}
              type="button"
            >
              Discard{" "}
              <span className="font-semibold text-slate-400">{combat.discardPile.length}</span>
            </button>
            {combat.exhaustPile.length > 0 && (
              <button
                className="rounded border border-slate-700/80 bg-slate-900/70 px-2 py-1 hover:border-slate-500 hover:text-slate-300"
                onClick={() => {
                  setIsSelectingCheatKillTarget(false);
                  setIsSelectingRewriteTarget(false);
                  setOpenPile("exhaust");
                }}
                type="button"
              >
                Exhaust{" "}
                <span className="font-semibold text-slate-400">{combat.exhaustPile.length}</span>
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
                <h3 className="text-lg font-semibold text-slate-100">{pileTitle}</h3>
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
