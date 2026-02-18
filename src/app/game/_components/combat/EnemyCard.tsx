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

interface EnemyCardProps {
  enemy: EnemyState;
  definition: EnemyDefinition;
  isTargeted?: boolean;
  onClick?: () => void;
}

export function EnemyCard({
  enemy,
  definition,
  isTargeted = false,
  onClick,
}: EnemyCardProps) {
  const isDead = enemy.currentHp <= 0;
  const intent = definition.abilities[enemy.intentIndex];
  const prevHp = useRef(enemy.currentHp);
  const [dmgPopups, setDmgPopups] = useState<{ id: number; value: number }[]>(
    []
  );
  const popupId = useRef(0);

  useEffect(() => {
    const diff = prevHp.current - enemy.currentHp;
    prevHp.current = enemy.currentHp;
    if (diff > 0) {
      const id = popupId.current++;
      setDmgPopups((prev) => [...prev, { id, value: diff }]);
    }
  }, [enemy.currentHp]);

  const removePopup = useCallback((id: number) => {
    setDmgPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <div
      className={cn(
        "relative flex w-40 flex-col items-center rounded-lg border-2 p-3 transition-all",
        isDead
          ? "border-gray-600 bg-gray-800/30 opacity-40"
          : isTargeted
            ? "border-red-400 bg-gray-800 shadow-lg shadow-red-500/20"
            : "cursor-pointer border-gray-600 bg-gray-800 hover:border-red-500",
        definition.isBoss && !isDead && "border-yellow-600"
      )}
      onClick={!isDead ? onClick : undefined}
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

      {/* Intent */}
      {!isDead && intent && (
        <div className="mb-2 flex flex-col items-center gap-0.5 rounded bg-gray-700 px-2 py-1">
          <span className="text-xs font-medium text-gray-300">
            {intent.name}
          </span>
          <div className="flex items-center gap-1.5">
            {formatIntent(intent)}
          </div>
        </div>
      )}

      {/* Name */}
      <div
        className={cn(
          "mb-1 text-sm font-bold",
          definition.isBoss ? "text-yellow-400" : "text-white",
          isDead && "line-through"
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

      {/* Block */}
      {enemy.block > 0 && (
        <span className="mt-1 text-xs text-blue-300">Block: {enemy.block}</span>
      )}

      {/* Buffs/Debuffs */}
      {enemy.buffs.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {enemy.buffs.map((b, i) => (
            <span
              key={`${b.type}-${i}`}
              className="rounded bg-gray-700 px-1 py-0.5 text-[10px] text-gray-300"
            >
              {b.type}: {b.stacks}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function formatIntent(ability: EnemyAbility) {
  const parts: React.ReactNode[] = [];

  for (const effect of ability.effects) {
    switch (effect.type) {
      case "DAMAGE":
        parts.push(
          <span
            key={`dmg-${parts.length}`}
            className="text-[11px] font-bold text-red-400"
          >
            {effect.value}
          </span>
        );
        break;
      case "BLOCK":
        parts.push(
          <span
            key={`blk-${parts.length}`}
            className="text-[11px] font-bold text-blue-400"
          >
            {effect.value}
          </span>
        );
        break;
      case "APPLY_DEBUFF":
        parts.push(
          <span
            key={`dbf-${parts.length}`}
            className="text-[10px] text-purple-400"
          >
            {effect.buff} {effect.value}
          </span>
        );
        break;
      case "DRAIN_INK":
        parts.push(
          <span
            key={`ink-${parts.length}`}
            className="text-[10px] text-cyan-400"
          >
            -{effect.value} ink
          </span>
        );
        break;
      case "HEAL":
        parts.push(
          <span
            key={`heal-${parts.length}`}
            className="text-[11px] font-bold text-green-400"
          >
            +{effect.value} HP
          </span>
        );
        break;
    }
  }

  return parts;
}
