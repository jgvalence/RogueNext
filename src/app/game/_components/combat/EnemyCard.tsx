"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import type {
  EnemyState,
  EnemyDefinition,
  EnemyAbility,
} from "@/game/schemas/entities";
import { HpBar } from "../shared/HpBar";
import { DamageNumber } from "./DamageNumber";
import { BuffPill } from "../shared/BuffPill";
// TEMPORARY: centralized asset registry — swap paths in src/lib/assets.ts when real art is ready
import { ENEMY_IMAGES } from "@/lib/assets";
import { playSound } from "@/lib/sound";

interface EnemyCardProps {
  enemy: EnemyState;
  definition: EnemyDefinition;
  isTargeted?: boolean;
  isActing?: boolean;
  isAttacking?: boolean;
  onClick?: () => void;
}


export function EnemyCard({
  enemy,
  definition,
  isTargeted = false,
  isActing = false,
  isAttacking = false,
  onClick,
}: EnemyCardProps) {
  const isDead = enemy.currentHp <= 0;
  const intent = definition.abilities[enemy.intentIndex];
  const prevHp = useRef(enemy.currentHp);
  const [dmgPopups, setDmgPopups] = useState<{ id: number; value: number }[]>([]);
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

  const cardW = definition.isBoss ? "w-52" : "w-40";
  const artH  = definition.isBoss ? "h-36" : "h-28";

  let stateClasses = "border-gray-600 cursor-pointer hover:border-red-500 hover:scale-105";
  if (isDead)                  stateClasses = "border-gray-700 opacity-30 grayscale";
  else if (isActing)           stateClasses = "border-orange-400 animate-enemy-acting z-10";
  else if (isTargeted)         stateClasses = "border-red-400 cursor-pointer scale-105 shadow-lg shadow-red-500/30";
  else if (definition.isBoss)  stateClasses = "border-yellow-600 shadow-lg shadow-yellow-500/20";
  else if (definition.isElite) stateClasses = "border-orange-600 cursor-pointer hover:border-red-500 hover:scale-105 shadow-md shadow-orange-500/20";

  // TEMPORARY: use image from asset registry, fall back to emoji if missing
  const artImageSrc = ENEMY_IMAGES[definition.id];

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-xl border-2 bg-gray-900 transition-colors duration-150",
        isAttacking && "animate-enemy-attack",
        cardW,
        stateClasses
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
          "relative flex flex-shrink-0 items-center justify-center bg-gradient-to-b overflow-hidden",
          artH,
          definition.isBoss
            ? "from-yellow-950 to-gray-900"
            : "from-gray-800 to-gray-850"
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
          <span className={cn(
            "opacity-20 font-black",
            definition.isBoss ? "text-6xl text-yellow-500" : "text-4xl text-gray-400"
          )}>
            {definition.isBoss ? "☽" : "◈"}
          </span>
        )}

        {/* Boss crown */}
        {definition.isBoss && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 rounded-full bg-yellow-600/80 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-yellow-100">
            Boss
          </div>
        )}

        {/* Elite badge */}
        {definition.isElite && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 rounded-full bg-orange-600/80 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-orange-100">
            Elite
          </div>
        )}

        {/* Acting indicator */}
        {isActing && !isDead && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-bounce rounded-full bg-orange-500/90 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white shadow-lg">
              ▶ Acting
            </div>
          </div>
        )}

        {/* Block badge — displayed on art */}
        {enemy.block > 0 && (
          <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-blue-900/90 px-2 py-0.5 text-xs font-bold text-blue-200 shadow">
            🛡 {enemy.block}
          </div>
        )}
      </div>

      {/* Info area */}
      <div className="flex flex-col gap-1.5 p-2">
        {/* Intent */}
        {!isDead && intent && (
          <div className="rounded bg-gray-800 px-2 py-1">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Next:</span>
              <span className="text-[10px] font-medium text-gray-200 truncate">{intent.name}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {formatIntent(intent)}
            </div>
          </div>
        )}

        {/* Name */}
        <div
          className={cn(
            "font-bold leading-tight",
            definition.isBoss ? "text-sm text-yellow-300" : "text-xs text-white"
          )}
        >
          {enemy.name}
        </div>

        {/* HP bar */}
        <HpBar
          current={Math.max(0, enemy.currentHp)}
          max={enemy.maxHp}
          className="w-full"
        />

        {/* Buffs */}
        {enemy.buffs.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {enemy.buffs.map((b, i) => (
              <BuffPill key={`${b.type}-${i}`} buff={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatIntent(ability: EnemyAbility) {
  const parts: React.ReactNode[] = [];
  for (const effect of ability.effects) {
    switch (effect.type) {
      case "DAMAGE":
        parts.push(
          <span key={`d-${parts.length}`} className="text-[11px] font-bold text-red-400">
            ⚔ {effect.value}
          </span>
        );
        break;
      case "BLOCK":
        parts.push(
          <span key={`b-${parts.length}`} className="text-[11px] font-bold text-blue-400">
            🛡 {effect.value}
          </span>
        );
        break;
      case "APPLY_DEBUFF":
        parts.push(
          <span key={`x-${parts.length}`} className="text-[10px] text-purple-400">
            {effect.buff} {effect.value}
          </span>
        );
        break;
      case "DRAIN_INK":
        parts.push(
          <span key={`i-${parts.length}`} className="text-[10px] text-cyan-400">
            -{effect.value}✦
          </span>
        );
        break;
    }
  }
  return parts;
}
