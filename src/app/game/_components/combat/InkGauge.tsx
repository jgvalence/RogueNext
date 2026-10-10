"use client";

import { cn } from "@/lib/utils/cn";
import type { PlayerState } from "@/game/schemas/entities";
import type { InkPowerType } from "@/game/schemas/enums";
import { canUseInkPower } from "@/game/engine/ink";
import type { CombatState } from "@/game/schemas/combat-state";
import { GAME_CONSTANTS } from "@/game/constants";
import { useTranslation } from "react-i18next";
import { RogueButton, RogueTooltip } from "@/components/ui/rogue";

interface InkGaugeProps {
  player: PlayerState;
  combatState: CombatState;
  onUsePower: (power: InkPowerType) => void;
  unlockedPowers?: InkPowerType[];
  allowedPowers?: InkPowerType[] | null;
  compact?: boolean;
  onOpenPowers?: () => void;
  showDescriptions?: boolean;
  shellClassName?: string;
  labelClassName?: string;
  fillClassName?: string;
  readyPowerClassName?: string;
}

const ALL_INK_POWERS: { type: InkPowerType; label: string; desc: string }[] = [
  // Scribe
  {
    type: "CALLIGRAPHIE",
    label: "Calligraphie",
    desc: "Upgrade a random card in your hand for this combat",
  },
  {
    type: "ENCRE_NOIRE",
    label: "Encre Noire",
    desc: "Deal damage to all enemies based on your current Ink",
  },
  { type: "SEAL", label: "Seal", desc: "Gain 8 block" },
  // Bibliothecaire
  { type: "VISION", label: "Vision", desc: "Draw 2 cards" },
  { type: "INDEX", label: "Index", desc: "Return a discard card to your hand" },
  {
    type: "SILENCE",
    label: "Silence",
    desc: "Make the target lose its next turn; elites and bosses resist stun for 1 turn after that",
  },
  {
    type: "VENIN",
    label: "Venin",
    desc: "Poison all enemies and advance the Refrain",
  },
  {
    type: "SAIGNEMENT",
    label: "Saignement",
    desc: "Apply Bleed and advance the Refrain",
  },
  {
    type: "GRISGRIS",
    label: "Gris-Gris",
    desc: "Deal damage from Poison and Bleed",
  },
  {
    type: "DOUBLE_MISE",
    label: "Double Mise",
    desc: "Double the next card damage, then lose energy next turn",
  },
  {
    type: "PACTE_SANG",
    label: "Pacte de Sang",
    desc: "Pay 6 HP to gain 3 Ink. Requires more than 6 HP.",
  },
  {
    type: "FRENETIQUE",
    label: "Frenetique",
    desc: "Draw 3 cards, randomly discard 1",
  },
  // Legacy
  { type: "REWRITE", label: "Rewrite", desc: "Retrieve a card from discard" },
  { type: "LOST_CHAPTER", label: "Lost Chapter", desc: "Draw 2 cards" },
];

export function InkGauge({
  player,
  combatState,
  onUsePower,
  unlockedPowers = ["REWRITE"],
  allowedPowers = null,
  compact = false,
  onOpenPowers,
  showDescriptions = false,
  shellClassName,
  labelClassName,
  fillClassName,
  readyPowerClassName,
}: InkGaugeProps) {
  const { t } = useTranslation();
  const inkPowers = ALL_INK_POWERS.filter((p) =>
    unlockedPowers.includes(p.type)
  );
  const powerRequirement = (power: InkPowerType, cost: number) =>
    cost > player.inkMax
      ? " " + t("inkGauge.capacityRequired", { cost })
      : power === "PACTE_SANG"
        ? " " +
          t("inkGauge.hpAfterPayment", {
            hp: Math.max(
              0,
              player.currentHp - GAME_CONSTANTS.PACTE_SANG_HP_COST
            ),
          })
        : "";
  const percent = Math.max(
    0,
    Math.min(100, (player.inkCurrent / player.inkMax) * 100)
  );

  if (compact) {
    if (onOpenPowers) {
      return (
        <RogueButton
          type="text"
          onClick={onOpenPowers}
          className="!flex !h-11 !w-full !min-w-0 !flex-col !items-center !justify-center !gap-0 !rounded-lg !border !border-cyan-600/50 !bg-cyan-950/60 !px-2 !text-xs !text-cyan-100"
        >
          <span className="font-bold tabular-nums">
            {t("inkGauge.ink")} {player.inkCurrent}/{player.inkMax}
          </span>
          <span className="text-[10px]">{t("visual.powers")} ›</span>
        </RogueButton>
      );
    }
    return (
      <div
        className={cn(
          "space-y-1 rounded-lg border border-cyan-700/70 bg-cyan-950/35 p-1",
          shellClassName
        )}
      >
        <div className="flex items-center gap-1">
          <span
            className={cn(
              "text-[9px] font-semibold text-cyan-300",
              labelClassName
            )}
          >
            {t("inkGauge.ink")} {player.inkCurrent}/{player.inkMax}
          </span>
          <div className="relative h-1.5 flex-1 rounded bg-slate-700">
            <div
              className={cn(
                "h-full rounded bg-cyan-500 transition-all duration-300",
                fillClassName
              )}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {inkPowers.map((power) => {
            const isAllowedByTutorial =
              allowedPowers == null || allowedPowers.includes(power.type);
            const canUse =
              isAllowedByTutorial && canUseInkPower(combatState, power.type);
            const cost = GAME_CONSTANTS.INK_POWER_COSTS[power.type];
            const tooltip =
              t("inkGauge.powerTooltip", {
                description: t(
                  `inkGauge.powers.${power.type}.desc`,
                  power.desc
                ),
                cost,
              }) + powerRequirement(power.type, cost);

            return (
              <RogueTooltip key={power.type} title={tooltip}>
                <RogueButton
                  type="text"
                  className={cn(
                    "!h-auto !max-w-full !shrink-0 !whitespace-normal !rounded !px-1.5 !py-0.5 !text-[9px] !font-semibold !leading-tight !transition",
                    canUse
                      ? (readyPowerClassName ??
                          "!bg-cyan-700 !text-cyan-100 hover:!bg-cyan-600")
                      : "!cursor-not-allowed !bg-gray-700 !text-gray-500"
                  )}
                  disabled={!canUse}
                  onClick={() => onUsePower(power.type)}
                >
                  {t(`inkGauge.powers.${power.type}.label`, power.label)} (
                  {cost})
                </RogueButton>
              </RogueTooltip>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "space-y-1 rounded-lg border border-cyan-700/70 bg-cyan-950/40 p-1.5 lg:space-y-1.5 lg:p-2",
        shellClassName
      )}
    >
      {/* Ink bar */}
      <div className="flex items-center gap-1.5 lg:gap-2">
        <span
          className={cn(
            "text-[10px] font-medium text-cyan-400 lg:text-xs",
            labelClassName
          )}
        >
          {t("inkGauge.ink")}
        </span>
        <div className="relative h-2.5 flex-1 rounded bg-slate-700 lg:h-3">
          <div
            className={cn(
              "h-full rounded bg-cyan-500 transition-all duration-300",
              fillClassName
            )}
            style={{ width: `${percent}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow lg:text-xs">
            {player.inkCurrent}/{player.inkMax}
          </span>
        </div>
      </div>

      {/* Ink powers */}
      <div
        className={cn(
          "grid gap-1",
          showDescriptions ? "grid-cols-1" : "grid-cols-2"
        )}
      >
        {inkPowers.map((power) => {
          const isAllowedByTutorial =
            allowedPowers == null || allowedPowers.includes(power.type);
          const canUse =
            isAllowedByTutorial && canUseInkPower(combatState, power.type);
          const cost = GAME_CONSTANTS.INK_POWER_COSTS[power.type];
          const localizedLabel = t(
            `inkGauge.powers.${power.type}.label`,
            power.label
          );
          const tooltip =
            t("inkGauge.powerTooltip", {
              description: t(`inkGauge.powers.${power.type}.desc`, power.desc),
              cost,
            }) + powerRequirement(power.type, cost);

          return (
            <RogueTooltip
              key={power.type}
              title={tooltip}
              className="!block !min-w-0"
            >
              <RogueButton
                type="text"
                className={cn(
                  "!h-auto !w-full !min-w-0 !overflow-hidden !rounded !px-1 !py-1 !text-center !transition lg:!px-1.5 lg:!py-1.5",
                  "[&>span]:!inline-flex [&>span]:!w-full [&>span]:!min-w-0 [&>span]:!items-center [&>span]:!justify-center",
                  canUse
                    ? (readyPowerClassName ??
                        "!bg-cyan-700 !text-cyan-100 hover:!bg-cyan-600")
                    : "!cursor-not-allowed !bg-gray-700 !text-gray-500"
                )}
                disabled={!canUse}
                onClick={() => onUsePower(power.type)}
              >
                <span className="flex min-w-0 flex-col items-center gap-1 text-center">
                  <span className="block max-w-full text-[9px] font-semibold leading-tight [overflow-wrap:anywhere] lg:text-[10px]">
                    {localizedLabel}
                  </span>
                  {showDescriptions && (
                    <span className="block whitespace-normal text-xs font-normal leading-relaxed text-slate-200">
                      {t(`inkGauge.powers.${power.type}.desc`, power.desc)}
                      {powerRequirement(power.type, cost)}
                    </span>
                  )}
                  <span className="border-current/20 inline-flex min-w-[22px] items-center justify-center rounded-full border bg-black/20 px-1.5 py-0.5 text-[9px] font-black leading-none text-current">
                    {cost}
                  </span>
                </span>
              </RogueButton>
            </RogueTooltip>
          );
        })}
      </div>
    </div>
  );
}
