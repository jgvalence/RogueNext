"use client";

import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";
import type { CombatState } from "@/game/schemas/combat-state";
import type { AllyDefinition, EnemyDefinition } from "@/game/schemas/entities";
import {
  buildMobileEnemyIntentChips,
  formatAllyIntent,
} from "./combat-view-helpers";
import { resolveEnemyAbilityTarget } from "@/game/engine/enemies";
import { shouldHideEnemyIntent } from "@/game/engine/difficulty";
import { getEnemyImageSrc, PLAYER_AVATAR } from "@/lib/assets";
import { localizeAllyName } from "@/lib/i18n/entity-text";

interface CombatMobileGridProps {
  combat: CombatState;
  allyDefs: Map<string, AllyDefinition>;
  enemyDefs: Map<string, EnemyDefinition>;
  selectingEnemyTarget: boolean;
  selectingAllyTarget: boolean;
  selfCanRetargetToAlly: boolean;
  selectedCardId: string | null;
  actingEnemyId: string | null;
  attackingEnemyId: string | null;
  isSelectingCheatKillTarget: boolean;
  newlySummonedIds: Set<string>;
  enemyArtFailures: Set<string>;
  attackBonus: number;
  playerHit: boolean;
  avatarFailed: boolean;
  onAvatarError: () => void;
  onMobileAllyPress: (allyInstanceId: string) => void;
  onMobileEnemyPress: (enemyInstanceId: string) => void;
  onOpenPlayerInfo: () => void;
  getEnemyDisplayName: (enemy: CombatState["enemies"][number]) => string;
  markEnemyArtFailure: (enemyDefinitionId: string) => void;
  isArmorTutorialStep: boolean;
  aoeFlashMap: Map<string, { delay: number; color: string }>;
}

function getMonogram(label: string, fallback: string): string {
  const parts = label
    .trim()
    .split(/\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const letters = parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return letters || fallback;
}

function MiniHpBar({
  current,
  max,
  className,
}: {
  current: number;
  max: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <div className={cn("overflow-hidden rounded-full bg-white/15", className)}>
      <div
        className="h-full rounded-full bg-emerald-400/80 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function CombatMobileGrid({
  combat,
  allyDefs,
  enemyDefs,
  selectingEnemyTarget,
  selectingAllyTarget,
  selfCanRetargetToAlly,
  selectedCardId,
  actingEnemyId,
  attackingEnemyId,
  isSelectingCheatKillTarget,
  newlySummonedIds,
  enemyArtFailures,
  playerHit,
  avatarFailed,
  onAvatarError,
  onMobileAllyPress,
  onMobileEnemyPress,
  onOpenPlayerInfo,
  getEnemyDisplayName,
  markEnemyArtFailure,
  isArmorTutorialStep,
  aoeFlashMap,
}: CombatMobileGridProps) {
  const { t } = useTranslation();

  const enemyCount = combat.enemies.length;

  // Ally strip height: taller when no allies (just player), compact otherwise
  const stripHeight =
    combat.allies.length === 0
      ? "h-[88px] [@media(max-height:540px)]:h-[72px]"
      : "h-[92px] [@media(max-height:540px)]:h-[76px]";

  return (
    <div className="flex h-full w-full flex-col gap-1.5 px-1 pb-1 pt-1 lg:hidden">
      {/* ── ENEMY PORTRAIT ZONE ─────────────────────────────
          Takes all remaining height. Enemies are displayed as
          tall portrait cards with art as the focal point.     */}
      <div className="flex min-h-0 flex-1 gap-1.5">
        {combat.enemies.map((enemy) => {
          const def = enemyDefs.get(enemy.definitionId);
          if (!def) return null;

          const ability = def.abilities[enemy.intentIndex];
          const resolvedTarget = ability
            ? resolveEnemyAbilityTarget(combat, enemy, ability)
            : "player";
          const hideIntent = shouldHideEnemyIntent(
            combat.difficultyLevel ?? 0,
            combat.turnNumber,
            enemy,
            { playerHand: combat.hand }
          );
          const intentLabels = buildMobileEnemyIntentChips(
            combat,
            enemy,
            resolvedTarget,
            ability,
            hideIntent,
            t
          );
          const firstIntent =
            !hideIntent && enemy.currentHp > 0
              ? (intentLabels[0] ?? null)
              : null;

          const isDead = enemy.currentHp <= 0;
          const isTargetable =
            selectingEnemyTarget &&
            selectedCardId !== null &&
            enemy.currentHp > 0 &&
            !actingEnemyId;
          const isCheatSelectable =
            isSelectingCheatKillTarget && enemy.currentHp > 0;
          const isActing = actingEnemyId === enemy.instanceId;
          const enemyArtSrc = getEnemyImageSrc(enemy.definitionId);
          const enemyArtFailed = enemyArtFailures.has(enemy.definitionId);
          const name = getEnemyDisplayName(enemy);
          const roleLabel = def.isBoss
            ? t("enemyCard.boss")
            : def.isElite
              ? t("enemyCard.elite")
              : null;

          // Wider cards when fewer enemies
          const cardRounding =
            enemyCount === 1
              ? "rounded-[24px]"
              : def.isBoss
                ? "rounded-[22px]"
                : "rounded-[20px]";

          return (
            <button
              key={`mobile-enemy-${enemy.instanceId}`}
              type="button"
              data-keep-selection="true"
              onClick={() => {
                if (!isDead) onMobileEnemyPress(enemy.instanceId);
              }}
              className={cn(
                "relative flex-1 overflow-hidden border text-left transition-all duration-200",
                cardRounding,
                isDead
                  ? "border-slate-800/50 bg-slate-950/70 opacity-40 grayscale"
                  : def.isBoss
                    ? "border-amber-500/35 bg-[linear-gradient(180deg,rgba(120,53,15,0.18),rgba(15,23,42,0.82))]"
                    : "border-rose-500/35 bg-[linear-gradient(180deg,rgba(159,18,57,0.15),rgba(15,23,42,0.82))]",
                isTargetable || isCheatSelectable
                  ? "border-red-400 shadow-[0_0_32px_rgba(248,113,113,0.45)] ring-2 ring-red-400/80"
                  : def.isBoss && !isDead
                    ? "shadow-[0_0_24px_rgba(245,158,11,0.12)]"
                    : "",
                !isDead &&
                  !isActing &&
                  attackingEnemyId !== enemy.instanceId &&
                  !newlySummonedIds.has(enemy.instanceId) &&
                  "animate-enemy-idle",
                isActing && "animate-enemy-acting",
                attackingEnemyId === enemy.instanceId && "animate-enemy-attack",
                newlySummonedIds.has(enemy.instanceId) &&
                  "animate-enemy-summon-enter"
              )}
            >
              {/* Art — fills the card */}
              <div className="absolute inset-0">
                {!enemyArtFailed ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={enemyArtSrc}
                    alt={name}
                    className="h-full w-full object-contain object-bottom"
                    onError={() => markEnemyArtFailure(enemy.definitionId)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="select-none text-5xl font-black uppercase tracking-widest text-rose-50/10">
                      {getMonogram(name, "EN")}
                    </span>
                  </div>
                )}
              </div>

              {/* Atmospheric overlays */}
              <div
                className={cn(
                  "pointer-events-none absolute inset-0",
                  def.isBoss
                    ? "bg-[radial-gradient(ellipse_at_50%_0%,rgba(120,53,15,0.35),transparent_55%)]"
                    : "bg-[radial-gradient(ellipse_at_50%_0%,rgba(159,18,57,0.30),transparent_55%)]"
                )}
              />
              {/* Bottom fade so info strip is readable */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/20 to-transparent" />

              {/* Intent badge — top, full width */}
              {firstIntent && !isDead && (
                <div className="absolute left-1.5 right-1.5 top-1.5">
                  <span
                    className={cn(
                      "block truncate rounded-xl border px-2 py-0.5 text-[9px] font-bold leading-tight backdrop-blur-sm",
                      def.isBoss
                        ? "border-amber-400/40 bg-slate-950/75 text-amber-200"
                        : "border-rose-400/35 bg-slate-950/75 text-rose-200"
                    )}
                  >
                    {firstIntent}
                  </span>
                </div>
              )}

              {/* ARM badge */}
              {enemy.block > 0 && (
                <div
                  className={cn(
                    "absolute right-1.5",
                    firstIntent && !isDead ? "top-8" : "top-1.5"
                  )}
                >
                  <span
                    className={cn(
                      "rounded-full border px-1.5 py-0.5 text-[9px] font-black backdrop-blur-sm",
                      isArmorTutorialStep
                        ? "border-cyan-300 bg-cyan-950/80 text-cyan-100 ring-1 ring-cyan-300"
                        : "border-cyan-400/40 bg-slate-950/70 text-cyan-200"
                    )}
                  >
                    ARM {enemy.block}
                  </span>
                </div>
              )}

              {/* Bottom info strip */}
              <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 pt-8">
                <div className="flex items-end justify-between gap-1">
                  <p className="min-w-0 truncate text-[11px] font-black leading-tight text-white">
                    {name}
                  </p>
                  {roleLabel && (
                    <span
                      className={cn(
                        "shrink-0 text-[8px] font-black uppercase tracking-wide",
                        def.isBoss ? "text-amber-300" : "text-purple-300"
                      )}
                    >
                      {roleLabel}
                    </span>
                  )}
                </div>
                <MiniHpBar
                  current={Math.max(0, enemy.currentHp)}
                  max={enemy.maxHp}
                  className="mt-1 h-[3px]"
                />
                <p className="mt-0.5 text-[9px] font-semibold tabular-nums text-white/55">
                  {Math.max(0, enemy.currentHp)}/{enemy.maxHp}
                </p>
              </div>

              {/* Targeting pulse overlay */}
              {(isTargetable || isCheatSelectable) && (
                <div className="bg-red-500/8 pointer-events-none absolute inset-0 animate-pulse rounded-[inherit]" />
              )}
              {aoeFlashMap.has(enemy.instanceId) && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 animate-aoe-hit rounded-[inherit]"
                  style={{
                    animationDelay: `${aoeFlashMap.get(enemy.instanceId)!.delay}ms`,
                    backgroundColor: aoeFlashMap.get(enemy.instanceId)!.color,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── ALLY + PLAYER STRIP ─────────────────────────────
          Fixed height at the bottom. Compact cards, tappable
          for targeting or info.                              */}
      <div className={cn("flex shrink-0 gap-1.5", stripHeight)}>
        {/* Allies */}
        {combat.allies.map((ally) => {
          const def = allyDefs.get(ally.definitionId);
          const intent = def?.abilities[ally.intentIndex];
          const localizedAllyName = localizeAllyName(
            ally.definitionId,
            ally.name
          );
          const canTarget =
            (selectingAllyTarget || selfCanRetargetToAlly) &&
            ally.currentHp > 0 &&
            !actingEnemyId;
          const isDead = ally.currentHp <= 0;
          const allyIntentSummary =
            intent && !isDead ? formatAllyIntent(intent, t) : null;

          return (
            <button
              key={`mobile-ally-${ally.instanceId}`}
              type="button"
              data-keep-selection="true"
              onClick={() => onMobileAllyPress(ally.instanceId)}
              className={cn(
                "relative flex-1 overflow-hidden rounded-[14px] border p-2 text-left transition-all duration-200",
                isDead
                  ? "border-slate-800/50 bg-slate-950/70 opacity-40 grayscale"
                  : "border-cyan-500/35 bg-[linear-gradient(135deg,rgba(8,145,178,0.20),rgba(2,6,23,0.90))]",
                canTarget &&
                  "border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.3)] ring-2 ring-cyan-300/70"
              )}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.10),transparent_55%)]" />

              <div className="relative flex h-full flex-col justify-between gap-0.5">
                {/* Name + ARM */}
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-cyan-300/55">
                      {t("combat.ally", { defaultValue: "Allié" })}
                    </p>
                    <p className="truncate text-[11px] font-black leading-tight text-cyan-50">
                      {localizedAllyName}
                    </p>
                  </div>
                  {ally.block > 0 && (
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-1.5 py-0.5 text-[8px] font-black",
                        isArmorTutorialStep
                          ? "border-cyan-300 bg-cyan-950 text-cyan-100 ring-1 ring-cyan-300"
                          : "border-cyan-400/30 bg-cyan-950/70 text-cyan-200"
                      )}
                    >
                      ARM {ally.block}
                    </span>
                  )}
                </div>

                {/* Intent summary */}
                {allyIntentSummary && (
                  <p
                    className="truncate text-[8px] font-medium leading-tight text-cyan-200/55"
                    style={{
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 1,
                      overflow: "hidden",
                    }}
                  >
                    {allyIntentSummary}
                  </p>
                )}

                {/* HP */}
                <div>
                  <MiniHpBar
                    current={Math.max(0, ally.currentHp)}
                    max={ally.maxHp}
                    className="h-[3px]"
                  />
                  <p className="mt-0.5 text-[9px] font-semibold tabular-nums text-white/50">
                    {Math.max(0, ally.currentHp)}/{ally.maxHp}
                  </p>
                </div>
              </div>
            </button>
          );
        })}

        {/* Player */}
        <button
          type="button"
          data-keep-selection="true"
          onClick={onOpenPlayerInfo}
          className={cn(
            "relative flex-1 overflow-hidden rounded-[14px] border p-2 text-left transition-all duration-200",
            playerHit
              ? "border-red-400/50 bg-[linear-gradient(135deg,rgba(127,29,29,0.28),rgba(2,6,23,0.90))] shadow-[0_0_20px_rgba(248,113,113,0.22)]"
              : "border-indigo-400/35 bg-[linear-gradient(135deg,rgba(79,70,229,0.20),rgba(2,6,23,0.90))]",
            isArmorTutorialStep && "ring-1 ring-cyan-300/75"
          )}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(129,140,248,0.12),transparent_55%)]" />

          {/* Small avatar top-right */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-20">
            {!avatarFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={PLAYER_AVATAR}
                alt=""
                aria-hidden
                className="h-10 w-10 object-contain"
                onError={onAvatarError}
              />
            ) : null}
          </div>

          <div className="relative flex h-full flex-col justify-between gap-0.5">
            {/* EN + INK + ARM pills */}
            <div className="flex flex-wrap gap-0.5">
              <span className="rounded-full border border-amber-400/35 bg-amber-950/65 px-1.5 py-0.5 text-[8px] font-black text-amber-100">
                EN {combat.player.energyCurrent}
              </span>
              <span className="rounded-full border border-cyan-400/35 bg-cyan-950/65 px-1.5 py-0.5 text-[8px] font-black text-cyan-100">
                INK {combat.player.inkCurrent}
              </span>
              {combat.player.block > 0 && (
                <span
                  className={cn(
                    "rounded-full border px-1.5 py-0.5 text-[8px] font-black",
                    isArmorTutorialStep
                      ? "border-cyan-300 bg-cyan-950 text-cyan-100 ring-1 ring-cyan-300"
                      : "border-slate-500/35 bg-slate-900/65 text-slate-200"
                  )}
                >
                  ARM {combat.player.block}
                </span>
              )}
            </div>

            {/* HP */}
            <div>
              <MiniHpBar
                current={Math.max(0, combat.player.currentHp)}
                max={combat.player.maxHp}
                className="h-[3px]"
              />
              <p className="mt-0.5 text-[9px] font-semibold tabular-nums text-white/50">
                {Math.max(0, combat.player.currentHp)}/{combat.player.maxHp}
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
