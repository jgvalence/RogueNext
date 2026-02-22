"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";
import type { EnemyState, EnemyDefinition } from "@/game/schemas/entities";
import type { Effect } from "@/game/schemas/effects";
import { HpBar } from "../shared/HpBar";
import { DamageNumber } from "./DamageNumber";
import { BuffPill } from "../shared/BuffPill";
import { Tooltip } from "../shared/Tooltip";
import { buffMeta } from "../shared/buff-meta";
// TEMPORARY: centralized asset registry — swap paths in src/lib/assets.ts when real art is ready
import { ENEMY_IMAGES } from "@/lib/assets";
import { playSound } from "@/lib/sound";

interface EnemyCardProps {
  enemy: EnemyState;
  definition: EnemyDefinition;
  enemyDamageScale?: number;
  intentTargetLabel?: string | null;
  isTargeted?: boolean;
  isActing?: boolean;
  isAttacking?: boolean;
  isNewlySummoned?: boolean;
  onClick?: () => void;
}

export function EnemyCard({
  enemy,
  definition,
  enemyDamageScale = 1,
  intentTargetLabel = null,
  isTargeted = false,
  isActing = false,
  isAttacking = false,
  isNewlySummoned = false,
  onClick,
}: EnemyCardProps) {
  const isDead = enemy.currentHp <= 0;
  const intent = definition.abilities[enemy.intentIndex];
  const prevHp = useRef(enemy.currentHp);
  const [dmgPopups, setDmgPopups] = useState<{ id: number; value: number }[]>(
    []
  );
  const popupId = useRef(0);
  // Track whether the enemy art image loaded successfully
  const [artFailed, setArtFailed] = useState(false);

  useEffect(() => {
    const diff = prevHp.current - enemy.currentHp;
    prevHp.current = enemy.currentHp;
    if (diff > 0) {
      const id = popupId.current++;
      setDmgPopups((prev) => [...prev, { id, value: diff }]);
      // TEMPORARY: play hit/death sound (files in /public/sounds/combat/)
      if (enemy.currentHp <= 0) {
        playSound("ENEMY_DEATH", 0.8);
      } else {
        playSound("ENEMY_HIT", 0.6);
      }
    }
  }, [enemy.currentHp]);

  const removePopup = useCallback((id: number) => {
    setDmgPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const cardW = definition.isBoss
    ? "w-28 lg:w-40 xl:w-56"
    : "w-24 lg:w-36 xl:w-44";
  const artH = definition.isBoss
    ? "h-16 lg:h-28 xl:h-40"
    : "h-14 lg:h-24 xl:h-32";

  let borderClass = "border-gray-600/70";
  if (isDead) borderClass = "border-gray-700/40";
  else if (isActing)
    borderClass = "border-orange-400 animate-enemy-acting z-10";
  else if (isTargeted)
    borderClass = "border-red-400 scale-105 shadow-lg shadow-red-500/30";
  else if (definition.isBoss)
    borderClass = "border-yellow-600/80 shadow-lg shadow-yellow-500/20";
  else if (definition.isElite)
    borderClass = "border-orange-600/70 shadow-md shadow-orange-500/20";

  const interactClass =
    !isDead && !isActing && onClick
      ? isTargeted
        ? "cursor-pointer"
        : "cursor-pointer hover:border-red-500/80 hover:scale-105"
      : "";

  // TEMPORARY: use image from asset registry, fall back to emoji if missing
  const artImageSrc = ENEMY_IMAGES[definition.id];

  return (
    <div
      data-keep-selection="true"
      className={cn(
        "relative flex flex-col overflow-hidden rounded-xl border-2 bg-gray-900/95 shadow-md transition-all duration-150",
        isAttacking && "animate-enemy-attack",
        isNewlySummoned && "animate-enemy-summon-enter",
        isDead && "opacity-30 grayscale",
        cardW,
        borderClass,
        interactClass
      )}
      onClick={!isDead && !isActing ? onClick : undefined}
    >
      {/* Damage popups */}
      {dmgPopups.map((p) => (
        <DamageNumber
          key={p.id}
          value={p.value}
          type="damage"
          onDone={() => removePopup(p.id)}
        />
      ))}

      {/* Art area — TEMPORARY: shows image if present, emoji placeholder otherwise */}
      <div
        className={cn(
          "relative flex flex-shrink-0 items-center justify-center overflow-hidden bg-gradient-to-b",
          artH,
          definition.isBoss
            ? "from-yellow-950/80 to-gray-900"
            : "from-gray-800 to-gray-900"
        )}
      >
        {/* Real art (hidden on error → falls back to emoji below) */}
        {artImageSrc && !artFailed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artImageSrc}
            alt={definition.name}
            className="absolute inset-0 h-full w-full object-cover object-top"
            onError={() => setArtFailed(true)}
          />
        )}

        {/* Emoji placeholder — shown when image is missing */}
        {(!artImageSrc || artFailed) && (
          <span
            className={cn(
              "font-black opacity-20",
              definition.isBoss
                ? "text-6xl text-yellow-500"
                : "text-4xl text-gray-400"
            )}
          >
            {definition.isBoss ? "☽" : "◈"}
          </span>
        )}

        {/* Boss / Elite badge */}
        {definition.isBoss && (
          <div className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full bg-yellow-600/80 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-yellow-100">
            Boss
          </div>
        )}
        {definition.isElite && (
          <div className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full bg-orange-600/80 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-orange-100">
            Elite
          </div>
        )}

        {/* Acting indicator */}
        {isActing && !isDead && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-bounce rounded-full bg-orange-500/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
              ▶ Acting
            </div>
          </div>
        )}

        {/* Block overlay badge */}
        {enemy.block > 0 && (
          <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 rounded-full bg-blue-900/90 px-1.5 py-0.5 text-[10px] font-bold text-blue-200 shadow">
            🛡 {enemy.block}
          </div>
        )}
      </div>

      {/* ── Info area ── */}
      <div className="flex flex-col gap-1 p-2 lg:gap-1.5 lg:p-2.5">
        {/* Name */}
        <div
          className={cn(
            "truncate font-bold leading-tight",
            definition.isBoss
              ? "text-xs text-yellow-300 lg:text-sm"
              : "text-[11px] text-white lg:text-xs"
          )}
        >
          {enemy.name}
        </div>

        {/* HP bar + numbers + block badge */}
        <div>
          <HpBar
            current={Math.max(0, enemy.currentHp)}
            max={enemy.maxHp}
            className="mb-0.5 w-full"
          />
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold tabular-nums text-white">
              {Math.max(0, enemy.currentHp)}
            </span>
            <span className="text-[10px] text-slate-500">/ {enemy.maxHp}</span>
            {enemy.block > 0 && (
              <div className="ml-auto flex items-center gap-0.5 rounded bg-blue-900/80 px-1.5 py-0.5">
                <span className="text-[10px]">🛡</span>
                <span className="text-[10px] font-bold text-blue-200">
                  {enemy.block}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Active buffs/debuffs */}
        {enemy.buffs.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {enemy.buffs.map((b, i) => (
              <BuffPill key={`${b.type}-${i}`} buff={b} />
            ))}
          </div>
        )}

        {/* Intent */}
        {!isDead && intent && (
          <div className="mt-0.5 rounded-lg border border-gray-700/60 bg-gray-800/70 px-1.5 py-1 lg:px-2 lg:py-1.5">
            {/* Intent name + target */}
            <div className="flex items-start justify-between gap-1">
              <span className="truncate text-[10px] font-semibold leading-tight text-gray-100 lg:text-[11px]">
                {intent.name}
              </span>
              {intentTargetLabel && (
                <span className="shrink-0 text-[9px] text-amber-300/90 lg:text-[10px]">
                  → {intentTargetLabel}
                </span>
              )}
            </div>
            {/* Effect chips */}
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {formatIntentEffects(
                intent.effects,
                definition.id,
                intent.name,
                enemyDamageScale
              )}
            </div>
          </div>
        )}
        {!isDead && definition.isBoss && (
          <BossPhaseHint enemy={enemy} definition={definition} />
        )}
      </div>
    </div>
  );
}

function formatIntentEffects(
  effects: Effect[],
  definitionId: string,
  abilityName: string,
  enemyDamageScale: number
): ReactNode[] {
  const parts: ReactNode[] = [];

  for (const effect of effects) {
    switch (effect.type) {
      case "DAMAGE":
        {
          const scaledDamage = Math.max(
            1,
            Math.round(effect.value * enemyDamageScale)
          );
        parts.push(
          <span
            key={`d-${parts.length}`}
            className="inline-flex items-center gap-0.5 rounded bg-red-900/60 px-1.5 py-0.5 text-sm font-black text-red-300 lg:text-base"
          >
            ⚔ {scaledDamage}
          </span>
        );
        break;
        }

      case "BLOCK":
        parts.push(
          <span
            key={`b-${parts.length}`}
            className="inline-flex items-center gap-0.5 rounded bg-blue-900/60 px-1.5 py-0.5 text-sm font-black text-blue-300 lg:text-base"
          >
            🛡 {effect.value}
          </span>
        );
        break;

      case "APPLY_DEBUFF":
      case "APPLY_BUFF": {
        const buffKey = effect.buff ?? "";
        const meta = buffMeta[buffKey];
        const label = meta?.label() ?? buffKey;
        const colorClass = meta?.color ?? "bg-purple-900 text-purple-300";
        const tooltipContent = meta ? (
          <span>
            <span className="font-bold">{meta.label()}</span>
            <br />
            {meta.description(effect.value ?? 1)}
          </span>
        ) : null;

        const badge = (
          <span
            className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold lg:text-[11px] ${colorClass}`}
          >
            {label}
            {(effect.value ?? 0) > 1 && (
              <span className="font-black">×{effect.value}</span>
            )}
          </span>
        );

        parts.push(
          tooltipContent ? (
            <Tooltip key={`fx-${parts.length}`} content={tooltipContent}>
              {badge}
            </Tooltip>
          ) : (
            <span key={`fx-${parts.length}`}>{badge}</span>
          )
        );
        break;
      }

      case "HEAL":
        parts.push(
          <span
            key={`h-${parts.length}`}
            className="inline-flex items-center gap-0.5 rounded bg-green-900/60 px-1.5 py-0.5 text-[10px] font-semibold text-green-300 lg:text-[11px]"
          >
            ❤ {effect.value}
          </span>
        );
        break;

      case "DRAIN_INK":
        parts.push(
          <span
            key={`i-${parts.length}`}
            className="inline-flex items-center gap-0.5 rounded bg-cyan-900/60 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-300 lg:text-[11px]"
          >
            ✦ -{effect.value}
          </span>
        );
        break;

      case "FREEZE_HAND_CARDS":
        parts.push(
          <span
            key={`freeze-${parts.length}`}
            className="inline-flex items-center gap-0.5 rounded bg-cyan-950/80 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-200 lg:text-[11px]"
          >
            Freeze {effect.value}
          </span>
        );
        break;

      case "NEXT_DRAW_TO_DISCARD_THIS_TURN":
        parts.push(
          <span
            key={`nd2d-${parts.length}`}
            className="inline-flex items-center gap-0.5 rounded bg-purple-950/80 px-1.5 py-0.5 text-[10px] font-semibold text-purple-200 lg:text-[11px]"
          >
            Next draw discard
          </span>
        );
        break;

      case "DISABLE_INK_POWER_THIS_TURN":
        parts.push(
          <span
            key={`inklock-${parts.length}`}
            className="inline-flex items-center gap-0.5 rounded bg-cyan-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-100 lg:text-[11px]"
          >
            Lock ink {effect.inkPower ?? "all"}
          </span>
        );
        break;

      case "INCREASE_CARD_COST_THIS_TURN":
      case "INCREASE_CARD_COST_NEXT_TURN":
        parts.push(
          <span
            key={`costup-${parts.length}`}
            className="inline-flex items-center gap-0.5 rounded bg-amber-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-amber-100 lg:text-[11px]"
          >
            Cards +{effect.value} cost
          </span>
        );
        break;

      case "REDUCE_DRAW_THIS_TURN":
      case "REDUCE_DRAW_NEXT_TURN":
        parts.push(
          <span
            key={`drawdown-${parts.length}`}
            className="inline-flex items-center gap-0.5 rounded bg-slate-700 px-1.5 py-0.5 text-[10px] font-semibold text-slate-100 lg:text-[11px]"
          >
            Draw -{effect.value}
          </span>
        );
        break;

      case "FORCE_DISCARD_RANDOM":
        parts.push(
          <span
            key={`forcediscard-${parts.length}`}
            className="inline-flex items-center gap-0.5 rounded bg-rose-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-rose-100 lg:text-[11px]"
          >
            Random discard {effect.value}
          </span>
        );
        break;
    }
  }

  const summonLabel = getSummonLabelFromBossAbility(definitionId, abilityName);
  if (summonLabel) {
    parts.push(
      <span
        key={`summon-${parts.length}`}
        className="inline-flex items-center gap-0.5 rounded bg-orange-900/60 px-1.5 py-0.5 text-[10px] font-semibold text-orange-200 lg:text-[11px]"
      >
        Summon {summonLabel}
      </span>
    );
  }

  return parts;
}

function getSummonLabelFromBossAbility(
  definitionId: string,
  abilityName: string
): string | null {
  const key = `${definitionId}:${abilityName}`;
  switch (key) {
    case "chapter_guardian:Page Storm":
      return "Ink Slime";
    case "fenrir:Pack Howl":
      return "Draugr";
    case "nyarlathotep_shard:Void Mantle":
      return "Cultist Scribe";
    default:
      return null;
  }
}

function BossPhaseHint({
  enemy,
  definition,
}: {
  enemy: EnemyState;
  definition: EnemyDefinition;
}) {
  const label = getPhaseTwoSummonLabel(definition.id);
  if (!label) return null;
  const phaseKey = `${definition.id}_phase2`;
  const alreadyTriggered = (enemy.mechanicFlags?.[phaseKey] ?? 0) > 0;
  if (alreadyTriggered) return null;

  return (
    <div className="mt-1 rounded border border-amber-700/60 bg-amber-950/40 px-1.5 py-1 text-[9px] text-amber-200 lg:text-[10px]">
      Phase 2 (&lt;50% HP): summons {label}
    </div>
  );
}

function getPhaseTwoSummonLabel(definitionId: string): string | null {
  switch (definitionId) {
    case "fenrir":
      return "Draugr";
    case "nyarlathotep_shard":
      return "Void Tendril";
    case "baba_yaga_hut":
      return "Frost Witch";
    case "soundiata_spirit":
      return "Mask Hunter";
    default:
      return null;
  }
}
