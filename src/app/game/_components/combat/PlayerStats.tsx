"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { PlayerState } from "@/game/schemas/entities";
import { HpBar } from "../shared/HpBar";
import { EnergyOrb } from "../shared/EnergyOrb";
import { DamageNumber } from "./DamageNumber";
import { BuffPill } from "../shared/BuffPill";
import { Tooltip } from "../shared/Tooltip";

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

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {player.block > 0 && (
            <Tooltip content="Absorbs incoming damage this turn. Resets at the start of your turn.">
              <span className="cursor-default rounded bg-blue-800 px-2 py-0.5 text-blue-200">
                🛡 {player.block}
              </span>
            </Tooltip>
          )}
          {player.strength > 0 && (
            <Tooltip content={`Increases all damage dealt by ${player.strength}.`}>
              <span className="cursor-default rounded bg-red-800 px-2 py-0.5 text-red-200">
                ⚔ +{player.strength}
              </span>
            </Tooltip>
          )}
          {player.focus > 0 && (
            <Tooltip content={`Increases block gained by ${player.focus}.`}>
              <span className="cursor-default rounded bg-blue-900 px-2 py-0.5 text-blue-300">
                Focus +{player.focus}
              </span>
            </Tooltip>
          )}
          {player.buffs.map((b, i) => (
            <BuffPill key={`${b.type}-${i}`} buff={b} />
          ))}
        </div>
      </div>
    </div>
  );
}
