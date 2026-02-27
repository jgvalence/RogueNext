"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { PlayerState } from "@/game/schemas/entities";
import type { TurnDisruption } from "@/game/schemas/combat-state";
import { HpBar } from "../shared/HpBar";
import { EnergyOrb } from "../shared/EnergyOrb";
import { DamageNumber } from "./DamageNumber";
import { BuffPill } from "../shared/BuffPill";
import { Tooltip } from "../shared/Tooltip";

interface PlayerStatsProps {
  player: PlayerState;
  disruption?: TurnDisruption;
}

export function PlayerStats({ player, disruption }: PlayerStatsProps) {
  const { t } = useTranslation();
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
    <div className="relative flex items-center gap-1.5 rounded-lg border border-slate-600/80 bg-slate-900/80 p-1.5 lg:gap-3 lg:p-2">
      {dmgPopups.map((p) => (
        <DamageNumber
          key={p.id}
          value={p.value}
          type={p.type}
          onDone={() => removePopup(p.id)}
        />
      ))}

      <EnergyOrb
        current={player.energyCurrent}
        max={player.energyMax}
        className="h-8 w-8 text-[11px] lg:h-12 lg:w-12 lg:text-lg"
      />

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-300 lg:text-xs">
          <span>{t("combat.hp")}</span>
          <span className="tabular-nums text-slate-100">
            {player.currentHp}/{player.maxHp}
          </span>
        </div>
        <HpBar
          current={player.currentHp}
          max={player.maxHp}
          showText={false}
          className="h-3 bg-slate-700 lg:h-3.5"
        />

        <div className="flex flex-wrap items-center gap-1 text-[10px] lg:text-xs">
          {player.block > 0 && (
            <Tooltip content={t("playerStats.blockTooltip")}>
              <span className="cursor-default rounded bg-blue-800 px-2 py-0.5 text-blue-200">
                {t("playerStats.block")} {player.block}
              </span>
            </Tooltip>
          )}
          {player.strength > 0 && (
            <Tooltip
              content={t("playerStats.strengthTooltip", {
                value: player.strength,
              })}
            >
              <span className="cursor-default rounded bg-red-800 px-2 py-0.5 text-red-200">
                {t("playerStats.strength")} +{player.strength}
              </span>
            </Tooltip>
          )}
          {player.focus > 0 && (
            <Tooltip
              content={t("playerStats.focusTooltip", { value: player.focus })}
            >
              <span className="cursor-default rounded bg-blue-900 px-2 py-0.5 text-blue-300">
                {t("playerStats.focus")} +{player.focus}
              </span>
            </Tooltip>
          )}
          {player.buffs.map((b, i) => (
            <BuffPill key={`${b.type}-${i}`} buff={b} />
          ))}
          {(disruption?.extraCardCost ?? 0) > 0 && (
            <span className="rounded bg-amber-900 px-2 py-0.5 text-amber-200">
              {t("playerStats.extraCardCost", {
                value: disruption?.extraCardCost,
              })}
            </span>
          )}
          {(disruption?.drawPenalty ?? 0) > 0 && (
            <span className="rounded bg-slate-700 px-2 py-0.5 text-slate-200">
              {t("playerStats.drawPenalty", { value: disruption?.drawPenalty })}
            </span>
          )}
          {(disruption?.drawsToDiscardRemaining ?? 0) > 0 && (
            <span className="rounded bg-purple-900 px-2 py-0.5 text-purple-200">
              {t("playerStats.nextDrawDiscard")}
            </span>
          )}
          {(disruption?.disabledInkPowers ?? []).length > 0 && (
            <span className="rounded bg-cyan-900 px-2 py-0.5 text-cyan-200">
              {t("playerStats.inkPowerLocked")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
