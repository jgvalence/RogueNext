"use client";

import { useEffect, useRef, useState } from "react";
import { CharacterPortrait, AllyPortrait } from "../shared/CharacterPortrait";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";
import { scaleCombatDelay } from "@/lib/combat-speed";
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
import { EnemyArtwork } from "../shared/EnemyArtwork";
import { localizeAllyName } from "@/lib/i18n/entity-text";
import { buffMeta } from "../shared/buff-meta";
import { vibrate } from "@/lib/haptics";

interface CombatMobileGridProps {
  characterId?: string;
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
  const { t } = useTranslation();
  const prevHp = useRef(enemy.currentHp);
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
      if (enemy.currentHp <= 0) {
        vibrate(25);
      } else {
        vibrate(8);
      }
    }
  }, [enemy.currentHp]);

  useEffect(() => {
    const nowDead = enemy.currentHp <= 0;
    if (!wasDead.current && nowDead) {
      setIsDying(true);
      wasDead.current = true;
      const timer = setTimeout(() => setIsDying(false), scaleCombatDelay(500));
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
    const timer = setTimeout(() => setBuffFlash(null), scaleCombatDelay(600));
    return () => clearTimeout(timer);
  }, [enemy.buffs, enemy.currentHp]);

  useEffect(() => {
    if (!phase2Key) return undefined;
    const isPhase2 = phase2Flag > 0;
    if (!prevPhase2.current && isPhase2) {
      setBossPhaseFlash(true);
      prevPhase2.current = true;
      const timer = setTimeout(
        () => setBossPhaseFlash(false),
        scaleCombatDelay(1100)
      );
      return () => clearTimeout(timer);
    }
    prevPhase2.current = isPhase2;
    return undefined;
  }, [phase2Flag, phase2Key]);


  const visibleBuffs = (enemy.buffs ?? []).filter((b: BuffInstance) =>
    VISIBLE_BUFF_TYPES.has(b.type)
  );

  return (
    <button
      key={`mobile-enemy-${enemy.instanceId}`}
      data-enemy-id={enemy.instanceId}
      data-fx-target={enemy.instanceId}
      data-boss={def.isBoss || undefined}
      data-targetable={isTargetable || isCheatSelectable || undefined}
      data-acting={
        isActing || attackingEnemyId === enemy.instanceId || undefined
      }
      disabled={isDead}
      aria-label={`${name} · ${Math.max(0, enemy.currentHp)}/${enemy.maxHp} ${t("combat.hp")} · ${firstIntent ?? ""}`}
      type="button"
      data-keep-selection="true"
      onClick={onClick}
      className={cn(
        "mobile-enemy-portrait relative min-w-[46%] flex-1 shrink-0 snap-start border text-left transition-all duration-200",
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

      <div className="mobile-enemy-art">
        {!enemyArtFailed ? (
          <EnemyArtwork
            enemyId={enemy.definitionId}
            src={enemyArtSrc}
            alt=""
            aria-hidden="true"
            onError={() => markEnemyArtFailure(enemy.definitionId)}
          />
        ) : (
          <span className="mobile-enemy-monogram">
            {getMonogram(name, "EN")}
          </span>
        )}
        {roleLabel && <span className="mobile-enemy-role">{roleLabel}</span>}
        {incomingDamage > 0 && !isDead && (
          <span className="mobile-enemy-preview">−{incomingDamage}</span>
        )}
        {(isTargetable || isCheatSelectable) && (
          <span className="mobile-target-mark" aria-hidden="true">
            ⌖
          </span>
        )}
      </div>
      <div className="mobile-enemy-details">
        <p className="mobile-enemy-name">{name}</p>
        <div className="mobile-vitals">
          <span>
            {Math.max(0, enemy.currentHp)}/{enemy.maxHp} {t("combat.hp")}
          </span>
          {enemy.block > 0 && (
            <span
              className={cn(
                "mobile-armor",
                isArmorTutorialStep && "ring-1 ring-cyan-300"
              )}
            >
              {t("combat.block")} {enemy.block}
            </span>
          )}
        </div>
        <MiniHpBar
          current={Math.max(0, enemy.currentHp)}
          max={enemy.maxHp}
          className="mobile-hp-track"
        />
        {firstIntent && !isDead && (
          <span className="mobile-enemy-intent">{firstIntent}</span>
        )}
        {visibleBuffs.length > 0 && (
          <div className="mobile-status-chips">
            {visibleBuffs.slice(0, 2).map((b: BuffInstance) => {
              const meta = buffMeta[b.type];
              return meta ? (
                <span key={b.type} className={meta.color}>
                  {meta.label()} {b.stacks}
                </span>
              ) : null;
            })}
            {visibleBuffs.length > 2 && <span>+{visibleBuffs.length - 2}</span>}
          </div>
        )}
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
  characterId: string;
  player: CombatState["player"];
  playerHit: boolean;
  isArmorTutorialStep: boolean;
  onOpenPlayerInfo: () => void;
}

function MobilePlayerBar({
  characterId,
  player,
  playerHit,
  isArmorTutorialStep,
  onOpenPlayerInfo,
}: MobilePlayerBarProps) {
  const { t } = useTranslation();
  const prevHp = useRef(player.currentHp);

  useEffect(() => {
    const diff = prevHp.current - player.currentHp;
    prevHp.current = player.currentHp;
    if (diff > 0) {
      vibrate([12, 40, 18]);
    }
  }, [player.currentHp]);


  return (
    <button
      type="button"
      data-keep-selection="true"
      onClick={onOpenPlayerInfo}
      data-hit={playerHit || undefined}
      data-fx-target="player"
      className={cn(
        "mobile-player-summary relative flex w-full items-center gap-2 overflow-visible rounded-xl border px-2 py-1.5 text-left transition-all duration-200",
        playerHit
          ? "border-red-400/40 bg-[linear-gradient(90deg,rgba(127,29,29,0.28),rgba(2,6,23,0.85))] shadow-[0_0_14px_rgba(248,113,113,0.18)]"
          : "border-indigo-400/30 bg-[linear-gradient(90deg,rgba(79,70,229,0.18),rgba(2,6,23,0.85))]",
        isArmorTutorialStep && "ring-1 ring-cyan-300/60"
      )}
    >
      <div className="mobile-hero-portrait">
        <CharacterPortrait identity={characterId} />
      </div>
      <div className="mobile-hero-details">
        <p className="mobile-hero-name">
          {t(`characters.${characterId}.name`)}
        </p>
        <div className="mobile-vitals">
          <span>
            {Math.max(0, player.currentHp)}/{player.maxHp} {t("combat.hp")}
          </span>
          <span className="mobile-armor">
            {t("combat.block")} {player.block}
          </span>
        </div>
        <MiniHpBar
          current={Math.max(0, player.currentHp)}
          max={player.maxHp}
          className="mobile-hp-track"
        />
        {player.buffs.length > 0 && (
          <div className="mobile-status-chips">
            {player.buffs.slice(0, 2).map((buff) => {
              const meta = buffMeta[buff.type];
              return meta ? (
                <span key={buff.type} className={meta.color}>
                  {meta.label()} {buff.stacks}
                </span>
              ) : null;
            })}
            {player.buffs.length > 2 && <span>+{player.buffs.length - 2}</span>}
          </div>
        )}
      </div>
    </button>
  );
}

export function CombatMobileGrid({
  characterId = "scribe",
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
    <div className="combat-mobile-grid flex h-full w-full min-w-0 flex-col gap-1 px-1 pb-1 pt-1 lg:hidden">
      <div className="mobile-enemy-rail">
        <div className="mobile-encounter-caption">
          <span>
            {selectingEnemyTarget || isSelectingCheatKillTarget
              ? t("combat.chooseTargetCta")
              : t("combat.mobileEnemies")}
          </span>
          <span>
            {combat.enemies.filter((enemy) => enemy.currentHp > 0).length}
            {enemyCount > 2 && ` · ${t("combat.mobileBrowseEnemies")}`}
          </span>
        </div>
        <div
          data-mobile-row={combat.enemies.length}
          data-crowded={enemyCount > 2 || undefined}
          className="combat-mobile-enemies"
        >
          <div className="mobile-enemy-roster">
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
                enemy.currentHp > 0 ? intentLabels.join(" · ") || null : null;

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
      </div>

      {/* ── ALLY + PLAYER COMPACT BARS ──────────────────────
          Slim horizontal bars (~42px each) in a column.
          Tappable for targeting or info.                      */}
      <div
        data-mobile-row={combat.allies.length + 1}
        className="combat-mobile-allies flex shrink-0 flex-col gap-1 sm:grid sm:auto-cols-fr sm:grid-flow-col"
      >
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
              data-fx-target={ally.instanceId}
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
              <AllyPortrait
                identity={ally.definitionId}
                className="mobile-ally-portrait"
              />
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

        {/* Hero remains visible beside the allied team. */}
        <MobilePlayerBar
          characterId={characterId}
          player={combat.player}
          playerHit={playerHit}
          isArmorTutorialStep={isArmorTutorialStep}
          onOpenPlayerInfo={onOpenPlayerInfo}
        />
      </div>
    </div>
  );
}
