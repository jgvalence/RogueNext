"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { CardDefinition } from "@/game/schemas/cards";
// TEMPORARY: centralized asset registry — swap paths in src/lib/assets.ts when real art is ready
import { CARD_IMAGES } from "@/lib/assets";
import { Tooltip } from "../shared/Tooltip";
import { parseDescriptionWithTooltips } from "../shared/parse-description";

interface GameCardProps {
  definition: CardDefinition;
  instanceId?: string;
  canPlay?: boolean;
  canPlayInked?: boolean;
  isSelected?: boolean;
  isPendingInked?: boolean; // card is selected and will be played as its inked variant
  upgraded?: boolean;
  onClick?: () => void;
  onInkedClick?: () => void;
  size?: "sm" | "md";
  className?: string;
}

const typeBorder: Record<string, string> = {
  ATTACK: "border-red-600",
  SKILL: "border-blue-500",
  POWER: "border-purple-500",
};

const typeArtBg: Record<string, string> = {
  ATTACK: "from-red-950 to-red-900/60",
  SKILL: "from-blue-950 to-blue-900/60",
  POWER: "from-purple-950 to-purple-900/60",
};

const typeBadge: Record<string, string> = {
  ATTACK: "bg-red-700 text-red-100",
  SKILL: "bg-blue-700 text-blue-100",
  POWER: "bg-purple-700 text-purple-100",
};

const rarityColors: Record<string, string> = {
  STARTER: "text-gray-400",
  COMMON: "text-gray-100",
  UNCOMMON: "text-blue-300",
  RARE: "text-yellow-300",
};

const typeIcon: Record<string, string> = {
  ATTACK: "⚔",
  SKILL: "🛡",
  POWER: "✦",
};

export function GameCard({
  definition,
  canPlay = true,
  canPlayInked = false,
  isSelected = false,
  isPendingInked = false,
  upgraded = false,
  onClick,
  onInkedClick,
  size = "md",
  className,
}: GameCardProps) {
  const isMd = size === "md";
  const artH =
    isMd && isSelected
      ? "h-14 lg:h-14 xl:h-[72px]"
      : isMd
        ? "h-10 lg:h-14 xl:h-[72px]"
        : "h-9 lg:h-12 xl:h-14";
  // Precomputed so the Tailwind linter sees a single string per branch (no false conflicts)
  const inkBtnVariant = isPendingInked
    ? "animate-pulse bg-cyan-500 text-white ring-1 ring-cyan-300"
    : "bg-cyan-800 text-cyan-200 hover:bg-cyan-700";
  const inkDescVariant = isPendingInked ? "text-white/80" : "text-cyan-300/70";
  const cardW =
    size === "md"
      ? isSelected
        ? "w-[96px] lg:w-[96px] xl:w-[130px]"
        : "w-[72px] lg:w-[96px] xl:w-[130px]"
      : "w-[64px] lg:w-[88px] xl:w-[104px]";
  const hideArtUntilSelectedOnMobile = size === "md" && !isSelected;
  // TEMPORARY: track whether card art image loaded
  const [artFailed, setArtFailed] = useState(false);
  const artImageSrc = CARD_IMAGES[definition.id];

  return (
    <div
      data-keep-selection="true"
      className={cn(
        "relative z-0 flex select-none flex-col overflow-hidden rounded-xl border-2 bg-gray-900 transition-all duration-150",
        typeBorder[definition.type] ?? "border-gray-500",
        cardW,
        canPlay
          ? "cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50 lg:hover:-translate-y-3"
          : "cursor-not-allowed opacity-40",
        isSelected &&
          "z-30 -translate-y-10 ring-2 ring-offset-1 ring-offset-gray-900 lg:-translate-y-3",
        isSelected &&
          (isPendingInked
            ? "shadow-lg shadow-cyan-500/40 ring-cyan-400"
            : "ring-white"),
        className
      )}
      onClick={canPlay ? onClick : undefined}
    >
      {/* Energy cost orb */}
      <div className="absolute -left-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-900 bg-amber-500 text-[10px] font-black text-white shadow-md lg:-left-1.5 lg:-top-1.5 lg:h-7 lg:w-7 lg:text-sm">
        {definition.energyCost}
      </div>

      {/* Upgraded star */}
      {upgraded && (
        <div className="absolute right-1 top-1 z-10 text-xs text-yellow-400">
          ★
        </div>
      )}

      {/* Art area — TEMPORARY: shows image if present, icon placeholder otherwise */}
      <div
        className={cn(
          "relative flex-shrink-0 items-center justify-center overflow-hidden bg-gradient-to-b",
          hideArtUntilSelectedOnMobile ? "hidden lg:flex" : "flex",
          artH,
          typeArtBg[definition.type] ?? "from-gray-800 to-gray-700"
        )}
      >
        {/* Real art (hidden on error → falls back to icon below) */}
        {artImageSrc && !artFailed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artImageSrc}
            alt={definition.name}
            className="absolute inset-0 h-full w-full object-cover object-center"
            onError={() => setArtFailed(true)}
          />
        )}

        {/* Icon placeholder — shown when image is missing */}
        {(!artImageSrc || artFailed) && (
          <span className="text-2xl opacity-30">
            {typeIcon[definition.type] ?? "✦"}
          </span>
        )}
      </div>

      {/* Card body */}
      <div
        className={cn(
          "flex flex-1 flex-col gap-0.5 px-1.5 pb-1.5 pt-1 lg:gap-1 lg:px-2 lg:pb-2 lg:pt-1.5"
        )}
      >
        {/* Name */}
        <div
          className={cn(
            "font-bold leading-tight",
            rarityColors[definition.rarity] ?? "text-white",
            isMd
              ? "text-[8px] lg:text-[10px] xl:text-[11px]"
              : "text-[8px] lg:text-[9px] xl:text-[10px]"
          )}
        >
          {definition.name}
        </div>

        {/* Type badge */}
        <span
          className={cn(
            "w-fit rounded px-1 py-px text-[8px] font-semibold uppercase tracking-wide lg:text-[9px]",
            typeBadge[definition.type] ?? "bg-gray-600 text-gray-100"
          )}
        >
          {definition.type}
        </span>

        {/* Description — dimmed when inked variant is the active mode */}
        <div
          className={cn(
            "leading-snug transition-opacity",
            isMd
              ? "text-[8px] lg:text-[9px] xl:text-[10px]"
              : "text-[8px] lg:text-[9px]",
            isPendingInked ? "text-gray-500 opacity-50" : "text-gray-300"
          )}
        >
          {isPendingInked
            ? definition.description
            : parseDescriptionWithTooltips(definition.description)}
        </div>
      </div>

      {/* Inked variant — always shown when available; dim + disabled if not enough ink marks */}
      {definition.inkedVariant && (
        <Tooltip
          className="block px-1 pb-1 lg:px-1.5 lg:pb-1.5"
          content={
            <div className="space-y-2">
              <div>
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Normal
                </p>
                <p className="text-[11px] text-gray-200">
                  {definition.description}
                </p>
              </div>
              <div>
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-400">
                  ✦ Encré
                </p>
                <p className="text-[11px] text-cyan-200">
                  {definition.inkedVariant.description}
                </p>
              </div>
            </div>
          }
        >
          {canPlayInked ? (
            <button
              className={cn(
                "w-full rounded px-1 py-0.5 text-left text-[8px] font-semibold transition-colors lg:px-1.5 lg:py-1 lg:text-[10px]",
                inkBtnVariant
              )}
              onClick={(e) => {
                e.stopPropagation();
                onInkedClick?.();
              }}
            >
              ✦ Ink ({definition.inkedVariant.inkMarkCost})
              <span
                className={cn(
                  "mt-0.5 block text-[8px] font-normal leading-tight lg:text-[9px]",
                  inkDescVariant
                )}
              >
                {definition.inkedVariant.description}
              </span>
            </button>
          ) : (
            <div className="rounded border border-gray-700/50 px-1 py-0.5 opacity-50 lg:px-1.5 lg:py-1">
              <p className="text-[8px] font-semibold text-gray-400 lg:text-[10px]">
                ✦ Ink ({definition.inkedVariant.inkMarkCost})
              </p>
              <p className="mt-0.5 text-[8px] leading-tight text-gray-500 lg:text-[9px]">
                {definition.inkedVariant.description}
              </p>
            </div>
          )}
        </Tooltip>
      )}
    </div>
  );
}
