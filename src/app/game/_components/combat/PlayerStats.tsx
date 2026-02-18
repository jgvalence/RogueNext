"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { PlayerState } from "@/game/schemas/entities";
import { HpBar } from "../shared/HpBar";
import { EnergyOrb } from "../shared/EnergyOrb";
import { DamageNumber } from "./DamageNumber";

interface PlayerStatsProps {
  player: PlayerState;
}

export function PlayerStats({ player }: PlayerStatsProps) {
  const prevHp = useRef(player.currentHp);
  const [dmgPopups, setDmgPopups] = useState<
    { id: number; value: number; type: "damage" | "heal" }[]
  >([]);
  const popupId = useRef(0);

  useEffect(() => {
    const diff = prevHp.current - player.currentHp;
    prevHp.current = player.currentHp;
    if (diff > 0) {
      const id = popupId.current++;
      setDmgPopups((prev) => [...prev, { id, value: diff, type: "damage" }]);
    } else if (diff < 0) {
      const id = popupId.current++;
      setDmgPopups((prev) => [
        ...prev,
        { id, value: Math.abs(diff), type: "heal" },
      ]);
    }
  }, [player.currentHp]);

  const removePopup = useCallback((id: number) => {
    setDmgPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <div className="relative flex items-center gap-4 rounded-lg border border-gray-700 bg-gray-800/50 p-3">
      {/* Damage/heal popups */}
      {dmgPopups.map((p) => (
        <DamageNumber
          key={p.id}
          value={p.value}
          type={p.type}
          onDone={() => removePopup(p.id)}
        />
      ))}

      <EnergyOrb current={player.energyCurrent} max={player.energyMax} />

      <div className="flex-1 space-y-2">
        <HpBar current={player.currentHp} max={player.maxHp} />

        <div className="flex items-center gap-3 text-xs">
          {player.block > 0 && (
            <span className="rounded bg-blue-800 px-2 py-0.5 text-blue-200">
              Block: {player.block}
            </span>
          )}
          {player.strength > 0 && (
            <span className="rounded bg-red-800 px-2 py-0.5 text-red-200">
              Str: +{player.strength}
            </span>
          )}
          {player.focus > 0 && (
            <span className="rounded bg-green-800 px-2 py-0.5 text-green-200">
              Focus: +{player.focus}
            </span>
          )}
          {player.buffs.map((b, i) => (
            <span
              key={`${b.type}-${i}`}
              className="rounded bg-gray-700 px-2 py-0.5 text-gray-300"
            >
              {b.type}: {b.stacks}
              {b.duration !== undefined && ` (${b.duration}t)`}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
