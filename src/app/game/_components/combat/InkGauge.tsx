"use client";

import { cn } from "@/lib/utils/cn";
import type { PlayerState } from "@/game/schemas/entities";
import type { InkPowerType } from "@/game/schemas/enums";
import { canUseInkPower } from "@/game/engine/ink";
import type { CombatState } from "@/game/schemas/combat-state";
import { GAME_CONSTANTS } from "@/game/constants";

interface InkGaugeProps {
  player: PlayerState;
  combatState: CombatState;
  onUsePower: (power: InkPowerType) => void;
  unlockedPowers?: InkPowerType[];
}

const ALL_INK_POWERS: { type: InkPowerType; label: string; desc: string }[] = [
  { type: "REWRITE", label: "Rewrite", desc: "Retrieve a card from discard" },
  { type: "LOST_CHAPTER", label: "Lost Chapter", desc: "Draw 2 cards" },
  { type: "SEAL", label: "Seal", desc: "Gain 8 block" },
];

export function InkGauge({ player, combatState, onUsePower, unlockedPowers = ["REWRITE"] }: InkGaugeProps) {
  const inkPowers = ALL_INK_POWERS.filter((p) => unlockedPowers.includes(p.type));
  const percent = Math.max(
    0,
    Math.min(100, (player.inkCurrent / player.inkMax) * 100)
  );

  return (
    <div className="space-y-2 rounded-lg border border-cyan-800 bg-cyan-950/30 p-3">
      {/* Ink bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-cyan-400">INK</span>
        <div className="relative h-4 flex-1 rounded bg-gray-700">
          <div
            className="h-full rounded bg-cyan-500 transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
            {player.inkCurrent}/{player.inkMax}
          </span>
        </div>
      </div>

      {/* Ink powers */}
      <div className="flex gap-2">
        {inkPowers.map((power) => {
          const canUse = canUseInkPower(combatState, power.type);
          const cost = GAME_CONSTANTS.INK_POWER_COSTS[power.type];

          return (
            <button
              key={power.type}
              className={cn(
                "flex-1 rounded px-2 py-1.5 text-xs font-medium transition",
                canUse
                  ? "bg-cyan-700 text-cyan-100 hover:bg-cyan-600"
                  : "cursor-not-allowed bg-gray-700 text-gray-500"
              )}
              disabled={!canUse}
              onClick={() => onUsePower(power.type)}
              title={`${power.desc} (${cost} ink)`}
            >
              {power.label} ({cost})
            </button>
          );
        })}
      </div>
    </div>
  );
}
