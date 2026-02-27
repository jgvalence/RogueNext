"use client";

import { cn } from "@/lib/utils/cn";
import type { PlayerState } from "@/game/schemas/entities";
import type { InkPowerType } from "@/game/schemas/enums";
import { canUseInkPower } from "@/game/engine/ink";
import type { CombatState } from "@/game/schemas/combat-state";
import { GAME_CONSTANTS } from "@/game/constants";
import { useTranslation } from "react-i18next";

interface InkGaugeProps {
  player: PlayerState;
  combatState: CombatState;
  onUsePower: (power: InkPowerType) => void;
  unlockedPowers?: InkPowerType[];
  compact?: boolean;
}

const ALL_INK_POWERS: { type: InkPowerType; label: string; desc: string }[] = [
  { type: "REWRITE", label: "Rewrite", desc: "Retrieve a card from discard" },
  { type: "LOST_CHAPTER", label: "Lost Chapter", desc: "Draw 2 cards" },
  { type: "SEAL", label: "Seal", desc: "Gain 8 block" },
];

export function InkGauge({
  player,
  combatState,
  onUsePower,
  unlockedPowers = ["REWRITE"],
  compact = false,
}: InkGaugeProps) {
  const { t } = useTranslation();
  const inkPowers = ALL_INK_POWERS.filter((p) =>
    unlockedPowers.includes(p.type)
  );
  const percent = Math.max(
    0,
    Math.min(100, (player.inkCurrent / player.inkMax) * 100)
  );

  if (compact) {
    return (
      <div className="space-y-1 rounded-lg border border-cyan-700/70 bg-cyan-950/35 p-1">
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-semibold text-cyan-300">
            {t("inkGauge.ink")} {player.inkCurrent}/{player.inkMax}
          </span>
          <div className="relative h-1.5 flex-1 rounded bg-slate-700">
            <div
              className="h-full rounded bg-cyan-500 transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {inkPowers.map((power) => {
            const canUse = canUseInkPower(combatState, power.type);
            const cost = GAME_CONSTANTS.INK_POWER_COSTS[power.type];

            return (
              <button
                key={power.type}
                className={cn(
                  "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold transition",
                  canUse
                    ? "bg-cyan-700 text-cyan-100"
                    : "cursor-not-allowed bg-gray-700 text-gray-500"
                )}
                disabled={!canUse}
                onClick={() => onUsePower(power.type)}
                title={t("inkGauge.powerTooltip", {
                  description: t(
                    `inkGauge.powers.${power.type}.desc`,
                    power.desc
                  ),
                  cost,
                })}
              >
                {t(`inkGauge.powers.${power.type}.label`, power.label)} ({cost})
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1 rounded-lg border border-cyan-700/70 bg-cyan-950/40 p-1.5 lg:space-y-1.5 lg:p-2">
      {/* Ink bar */}
      <div className="flex items-center gap-1.5 lg:gap-2">
        <span className="text-[10px] font-medium text-cyan-400 lg:text-xs">
          {t("inkGauge.ink")}
        </span>
        <div className="relative h-2.5 flex-1 rounded bg-slate-700 lg:h-3">
          <div
            className="h-full rounded bg-cyan-500 transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow lg:text-xs">
            {player.inkCurrent}/{player.inkMax}
          </span>
        </div>
      </div>

      {/* Ink powers */}
      <div className="flex gap-1">
        {inkPowers.map((power) => {
          const canUse = canUseInkPower(combatState, power.type);
          const cost = GAME_CONSTANTS.INK_POWER_COSTS[power.type];

          return (
            <button
              key={power.type}
              className={cn(
                "flex-1 rounded px-1 py-0.5 text-[9px] font-medium transition lg:px-1.5 lg:py-1 lg:text-[11px]",
                canUse
                  ? "bg-cyan-700 text-cyan-100 hover:bg-cyan-600"
                  : "cursor-not-allowed bg-gray-700 text-gray-500"
              )}
              disabled={!canUse}
              onClick={() => onUsePower(power.type)}
              title={t("inkGauge.powerTooltip", {
                description: t(
                  `inkGauge.powers.${power.type}.desc`,
                  power.desc
                ),
                cost,
              })}
            >
              {t(`inkGauge.powers.${power.type}.label`, power.label)} ({cost})
            </button>
          );
        })}
      </div>
    </div>
  );
}
