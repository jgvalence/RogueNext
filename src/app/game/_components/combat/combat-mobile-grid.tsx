"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";
import type { CombatState } from "@/game/schemas/combat-state";
import type {
  AllyDefinition,
  BuffInstance,
  EnemyDefinition,
} from "@/game/schemas/entities";
import { buildMobileEnemyIntentChips } from "./combat-view-helpers";
import { resolveEnemyAbilityTarget } from "@/game/engine/enemies";
import { shouldHideEnemyIntent } from "@/game/engine/difficulty";
import { getEnemyImageSrc } from "@/lib/assets";
import { localizeAllyName } from "@/lib/i18n/entity-text";
import { DamageNumber } from "./DamageNumber";
import { buffMeta } from "../shared/buff-meta";
import { playSound } from "@/lib/sound";
import { vibrate } from "@/lib/haptics";

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
  incomingDamageByEnemyId: Map<string, number>;
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

const DEBUFF_BUFF_TYPES = new Set([
  "POISON",
  "BLEED",
  "VULNERABLE",
  "WEAK",
  "STUN",
]);

const VISIBLE_BUFF_TYPES = new Set([
  "BLEED",
  "POISON",
  "VULNERABLE",
  "WEAK",
  "STUN",
  "STRENGTH",
  "THORNS",
  "WARD",
]);

interface MobileEnemyPortraitProps {
  enemy: CombatState["enemies"][number];
  def: EnemyDefinition;
  name: string;
  roleLabel: string | null;
  firstIntent: string | null;
  isDead: boolean;
  isTargetable: boolean;
  isCheatSelectable: boolean;
  isActing: boolean;
  attackingEnemyId: string | null;
  newlySummonedIds: Set<string>;
  enemyArtSrc: string;
  enemyArtFailed: boolean;
  cardRounding: string;
  aoeFlashMap: Map<string, { delay: number; color: string }>;
  incomingDamage: number;
  isArmorTutorialStep: boolean;
  markEnemyArtFailure: (id: string) => void;
  onClick: () => void;
}

function MobileEnemyPortrait({
  enemy,
  def,
  name,
  roleLabel,
  firstIntent,
  isDead,
  isTargetable,
  isCheatSelectable,
  isActing,
  attackingEnemyId,
  newlySummonedIds,
  enemyArtSrc,
  enemyArtFailed,
  cardRounding,
  aoeFlashMap,
  incomingDamage,
  isArmorTutorialStep,
  markEnemyArtFailure,
  onClick,
}: MobileEnemyPortraitProps) {
  const prevHp = useRef(enemy.currentHp);
  const popupId = useRef(0);
  const [dmgPopups, setDmgPopups] = useState<{ id: number; value: number }[]>(
    []
  );
  const wasDead = useRef(enemy.currentHp <= 0);
  const [isDying, setIsDying] = useState(false);
  const prevBuffCount = useRef((enemy.buffs ?? []).length);
  const [buffFlash, setBuffFlash] = useState<"buff" | "debuff" | null>(null);
  const phase2Key = def.isBoss ? `${def.id}_phase2` : "";
  const phase2Flag = phase2Key
    ? ((enemy.mechanicFlags ?? {})[phase2Key] ?? 0)
    : 0;
  const prevPhase2 = useRef(phase2Flag > 0);
  const [bossPhaseFlash, setBossPhaseFlash] = useState(false);

  useEffect(() => {
    const diff = prevHp.current - enemy.currentHp;
    prevHp.current = enemy.currentHp;
    if (diff > 0) {
      const id = popupId.current++;
      setDmgPopups((prev) => [...prev, { id, value: diff }]);
      if (enemy.currentHp <= 0) {
        playSound("ENEMY_DEATH", 0.8);
        vibrate(25);
      } else {
        playSound("ENEMY_HIT", 0.6);
        vibrate(8);
      }
    }
  }, [enemy.currentHp]);

  useEffect(() => {
    const nowDead = enemy.currentHp <= 0;
    if (!wasDead.current && nowDead) {
      setIsDying(true);
      wasDead.current = true;
      const timer = setTimeout(() => setIsDying(false), 500);
      return () => clearTimeout(timer);
    }
    wasDead.current = nowDead;
    return undefined;
  }, [enemy.currentHp]);

  useEffect(() => {
    if (enemy.currentHp <= 0) return;
    const curr = (enemy.buffs ?? []).length;
    const prev = prevBuffCount.current;
    prevBuffCount.current = curr;
    if (curr <= prev) return;
    const lastBuff = (enemy.buffs ?? [])[curr - 1];
    if (!lastBuff) return;
    const flashType = DEBUFF_BUFF_TYPES.has(lastBuff.type) ? "debuff" : "buff";
    setBuffFlash(flashType);
    const timer = setTimeout(() => setBuffFlash(null), 600);
    return () => clearTimeout(timer);
  }, [(enemy.buffs ?? []).length, enemy.currentHp]);

  useEffect(() => {
    if (!phase2Key) return undefined;
    const isPhase2 = phase2Flag > 0;
    if (!prevPhase2.current && isPhase2) {
      setBossPhaseFlash(true);
      prevPhase2.current = true;
      const timer = setTimeout(() => setBossPhaseFlash(false), 1100);
      return () => clearTimeout(timer);
    }
    prevPhase2.current = isPhase2;
    return undefined;
  }, [phase2Flag, phase2Key]);

  const removePopup = useCallback((id: number) => {
    setDmgPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const visibleBuffs = (enemy.buffs ?? []).filter((b: BuffInstance) =>
    VISIBLE_BUFF_TYPES.has(b.type)
  );
  const hasArmor = enemy.block > 0;
  const armBadgeTop =
    (firstIntent && !isDead) || incomingDamage > 0 ? "top-8" : "top-1.5";

  return (
    <button
      key={`mobile-enemy-${enemy.instanceId}`}
      type="button"
      data-keep-selection="true"
      onClick={onClick}
      className={cn(
        "relative min-w-[46%] flex-1 shrink-0 snap-start border text-left transition-all duration-200",
        cardRounding,
        isDying && "animate-enemy-death",
        isDead && !isDying
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
        newlySummonedIds.has(enemy.instanceId) && "animate-enemy-summon-enter"
      )}
    >
      {/* Floating damage numbers */}
      {dmgPopups.map((p) => (
        <DamageNumber
          key={p.id}
          value={p.value}
          type="damage"
          onDone={() => removePopup(p.id)}
        />
      ))}

      {/* Art — fills the card (overflow-hidden here so art is clipped, not the damage popups) */}
      <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
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
          "pointer-events-none absolute inset-0 rounded-[inherit]",
          def.isBoss
            ? "bg-[radial-gradient(ellipse_at_50%_0%,rgba(120,53,15,0.35),transparent_55%)]"
            : "bg-[radial-gradient(ellipse_at_50%_0%,rgba(159,18,57,0.30),transparent_55%)]"
        )}
      />
      {/* Bottom fade so info strip is readable */}
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-t from-slate-950/95 via-slate-950/20 to-transparent" />

      {/* Intent badge — top, full width */}
      {firstIntent && !isDead && (
        <div className="absolute left-1.5 top-1.5 max-w-[calc(100%-12px)] [@media(max-height:400px)]:left-auto [@media(max-height:400px)]:right-1.5">
          <span
            className={cn(
              "inline-block max-w-full truncate rounded-xl border px-2 py-0.5 text-[9px] font-bold leading-tight backdrop-blur-sm",
              def.isBoss
                ? "border-amber-400/40 bg-black/40 text-amber-100"
                : "border-rose-400/35 bg-black/40 text-rose-100"
            )}
          >
            {firstIntent}
          </span>
        </div>
      )}

      {/* ARM badge */}
      {hasArmor && (
        <div
          className={cn(
            "absolute",
            "right-1.5 [@media(max-height:400px)]:left-1.5 [@media(max-height:400px)]:right-auto",
            "[@media(max-height:400px)]:top-1.5",
            armBadgeTop
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

      {/* Incoming damage preview badge */}
      {incomingDamage > 0 && !isDead && (
        <div
          className={cn(
            "absolute right-1.5 top-1.5",
            firstIntent && !isDead && "[@media(max-height:400px)]:top-8"
          )}
        >
          <span className="animate-pulse rounded-full border border-red-400/70 bg-red-950/80 px-1.5 py-0.5 text-[9px] font-black text-red-300 backdrop-blur-sm">
            -{incomingDamage}
          </span>
        </div>
      )}

      {/* Bottom info strip */}
      <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 pt-8 [@media(max-height:400px)]:pt-2">
        {/* Buff/debuff chips */}
        {visibleBuffs.length > 0 && (
          <div className="mb-1 flex flex-wrap gap-0.5">
            {visibleBuffs.slice(0, 4).map((b: BuffInstance) => {
              const meta = buffMeta[b.type];
              if (!meta) return null;
              return (
                <span
                  key={b.type}
                  className={cn(
                    "rounded px-1 py-px text-[7px] font-bold leading-tight",
                    meta.color
                  )}
                >
                  {meta.label()}
                  {b.stacks > 1 ? ` ${b.stacks}` : ""}
                </span>
              );
            })}
          </div>
        )}

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
          className="mt-1 h-[3px] [@media(max-height:400px)]:h-[5px]"
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
      {buffFlash && (
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 z-10 rounded-[inherit]",
            buffFlash === "debuff"
              ? "animate-debuff-gain-flash"
              : "animate-buff-gain-flash"
          )}
        />
      )}
      {bossPhaseFlash && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 animate-boss-phase-flash rounded-[inherit] bg-amber-500/55"
        />
      )}
    </button>
  );
}

interface MobilePlayerBarProps {
  player: CombatState["player"];
  playerHit: boolean;
  isArmorTutorialStep: boolean;
  onOpenPlayerInfo: () => void;
}

function MobilePlayerBar({
  player,
  playerHit,
  isArmorTutorialStep,
  onOpenPlayerInfo,
}: MobilePlayerBarProps) {
  const prevHp = useRef(player.currentHp);
  const popupId = useRef(0);
  const [dmgPopups, setDmgPopups] = useState<{ id: number; value: number }[]>(
    []
  );

  useEffect(() => {
    const diff = prevHp.current - player.currentHp;
    prevHp.current = player.currentHp;
    if (diff > 0) {
      const id = popupId.current++;
      setDmgPopups((prev) => [...prev, { id, value: diff }]);
      vibrate([12, 40, 18]);
    }
  }, [player.currentHp]);

  const removePopup = useCallback((id: number) => {
    setDmgPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <button
      type="button"
      data-keep-selection="true"
      onClick={onOpenPlayerInfo}
      className={cn(
        "relative flex w-full items-center gap-2 overflow-visible rounded-xl border px-2 py-1.5 text-left transition-all duration-200",
        playerHit
          ? "border-red-400/40 bg-[linear-gradient(90deg,rgba(127,29,29,0.28),rgba(2,6,23,0.85))] shadow-[0_0_14px_rgba(248,113,113,0.18)]"
          : "border-indigo-400/30 bg-[linear-gradient(90deg,rgba(79,70,229,0.18),rgba(2,6,23,0.85))]",
        isArmorTutorialStep && "ring-1 ring-cyan-300/60"
      )}
    >
      {dmgPopups.map((p) => (
        <DamageNumber
          key={p.id}
          value={p.value}
          type="damage"
          onDone={() => removePopup(p.id)}
        />
      ))}
      <div className="h-2 w-2 shrink-0 rounded-full bg-indigo-400/70" />
      <div className="min-w-0 flex-1">
        <MiniHpBar
          current={Math.max(0, player.currentHp)}
          max={player.maxHp}
          className="h-[3px]"
        />
        <p className="mt-0.5 text-[8px] tabular-nums text-white/45">
          {Math.max(0, player.currentHp)}/{player.maxHp} PV
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="text-[9px] font-black text-amber-200">
          EN {player.energyCurrent}
        </span>
        <span className="text-[9px] font-black text-cyan-200">
          INK {player.inkCurrent}
        </span>
        {player.block > 0 && (
          <span
            className={cn(
              "text-[9px] font-black",
              isArmorTutorialStep ? "text-cyan-100" : "text-slate-300/70"
            )}
          >
            ARM {player.block}
          </span>
        )}
      </div>
    </button>
  );
}

export function CombatMobileGrid({
  combat,
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
  onMobileAllyPress,
  onMobileEnemyPress,
  onOpenPlayerInfo,
  getEnemyDisplayName,
  markEnemyArtFailure,
  isArmorTutorialStep,
  aoeFlashMap,
  incomingDamageByEnemyId,
}: CombatMobileGridProps) {
  const { t } = useTranslation();

  const enemyCount = combat.enemies.length;

  return (
    <div className="flex h-full w-full flex-col gap-1 px-1 pb-1 pt-1 lg:hidden">
      {/* ── ENEMY PORTRAIT ZONE ─────────────────────────────
          Horizontal snap-scroll when 3+ enemies so each
          portrait stays readable (min ~46% of viewport).      */}
      <div className="min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex h-full gap-1.5" style={{ minWidth: "100%" }}>
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

            const cardRounding =
              enemyCount === 1
                ? "rounded-[24px]"
                : def.isBoss
                  ? "rounded-[22px]"
                  : "rounded-[20px]";

            const incomingDmg =
              incomingDamageByEnemyId.get(enemy.instanceId) ?? 0;

            return (
              <MobileEnemyPortrait
                key={`mobile-enemy-${enemy.instanceId}`}
                enemy={enemy}
                def={def}
                name={name}
                roleLabel={roleLabel}
                firstIntent={firstIntent}
                isDead={isDead}
                isTargetable={isTargetable}
                isCheatSelectable={isCheatSelectable}
                isActing={isActing}
                attackingEnemyId={attackingEnemyId}
                newlySummonedIds={newlySummonedIds}
                enemyArtSrc={enemyArtSrc}
                enemyArtFailed={enemyArtFailed}
                cardRounding={cardRounding}
                aoeFlashMap={aoeFlashMap}
                incomingDamage={incomingDmg}
                isArmorTutorialStep={isArmorTutorialStep}
                markEnemyArtFailure={markEnemyArtFailure}
                onClick={() => {
                  if (!isDead) onMobileEnemyPress(enemy.instanceId);
                }}
              />
            );
          })}
        </div>
      </div>

      {/* ── ALLY + PLAYER COMPACT BARS ──────────────────────
          Slim horizontal bars (~42px each) in a column.
          Tappable for targeting or info.                      */}
      <div className="flex shrink-0 flex-col gap-1">
        {combat.allies.map((ally) => {
          const localizedAllyName = localizeAllyName(
            ally.definitionId,
            ally.name
          );
          const canTarget =
            (selectingAllyTarget || selfCanRetargetToAlly) &&
            ally.currentHp > 0 &&
            !actingEnemyId;
          const isDead = ally.currentHp <= 0;

          return (
            <button
              key={`mobile-ally-${ally.instanceId}`}
              type="button"
              data-keep-selection="true"
              onClick={() => onMobileAllyPress(ally.instanceId)}
              className={cn(
                "flex w-full items-center gap-2 overflow-hidden rounded-xl border px-2 py-1.5 text-left transition-all duration-200",
                isDead
                  ? "border-slate-800/50 bg-slate-950/70 opacity-40 grayscale"
                  : "border-cyan-500/30 bg-[linear-gradient(90deg,rgba(8,145,178,0.18),rgba(2,6,23,0.85))]",
                canTarget &&
                  "border-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.28)] ring-1 ring-cyan-300/70"
              )}
            >
              <div className="h-2 w-2 shrink-0 rounded-full bg-cyan-400/70" />
              <span className="min-w-0 flex-1 truncate text-[10px] font-black leading-tight text-cyan-50">
                {localizedAllyName}
              </span>
              {ally.block > 0 && (
                <span
                  className={cn(
                    "shrink-0 text-[9px] font-black",
                    isArmorTutorialStep ? "text-cyan-200" : "text-cyan-300/70"
                  )}
                >
                  ARM {ally.block}
                </span>
              )}
              <div className="w-16 shrink-0">
                <MiniHpBar
                  current={Math.max(0, ally.currentHp)}
                  max={ally.maxHp}
                  className="h-[3px]"
                />
                <p className="mt-0.5 text-right text-[8px] tabular-nums text-white/45">
                  {Math.max(0, ally.currentHp)}/{ally.maxHp}
                </p>
              </div>
            </button>
          );
        })}

        {/* Player compact bar */}
        <MobilePlayerBar
          player={combat.player}
          playerHit={playerHit}
          isArmorTutorialStep={isArmorTutorialStep}
          onOpenPlayerInfo={onOpenPlayerInfo}
        />
      </div>
    </div>
  );
}
