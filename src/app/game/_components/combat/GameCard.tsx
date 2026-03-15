"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";
import type { CardRedactionType } from "@/game/schemas/combat-state";
import type { CardDefinition } from "@/game/schemas/cards";
import type { BiomeType, CardType, Rarity } from "@/game/schemas/enums";
import { CARD_IMAGES } from "@/lib/assets";
import { Tooltip } from "../shared/Tooltip";
import { parseDescriptionWithTooltips } from "../shared/parse-description";
import { buildUpgradedCardDefinition } from "@/game/engine/card-upgrades";
import {
  applyAttackBonusToCardDefinition,
  localizeCardDescription,
  localizeCardName,
  localizeCardType,
  localizeInkedDescription,
} from "@/lib/i18n/card-text";

interface GameCardProps {
  definition: CardDefinition;
  instanceId?: string;
  redactionTypes?: CardRedactionType[];
  canPlay?: boolean;
  canPlayInked?: boolean;
  isSelected?: boolean;
  isPendingInked?: boolean;
  isFrozen?: boolean;
  upgraded?: boolean;
  costModifier?: number;
  attackBonus?: number;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onInkedClick?: () => void;
  onInkedDoubleClick?: () => void;
  size?: "sm" | "md" | "lg";
  detailMode?: "full" | "condensed";
  className?: string;
}

const typeStyles: Record<
  CardType,
  {
    border: string;
    shell: string;
    art: string;
    badge: string;
    kicker: string;
    inkPanel: string;
    inkPanelActive: string;
    fallbackMark: string;
  }
> = {
  ATTACK: {
    border: "border-red-500/75",
    shell: "from-[#2b0f15] via-[#14090d] to-[#09070a] text-red-50",
    art: "from-red-950 via-red-900/70 to-[#17070a]",
    badge: "border-red-400/35 bg-red-500/18 text-red-100",
    kicker: "text-red-200/80",
    inkPanel: "border-red-500/20 bg-red-950/30",
    inkPanelActive:
      "border-cyan-300/45 bg-gradient-to-r from-cyan-900/60 to-red-950/55 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.18)]",
    fallbackMark: "//",
  },
  SKILL: {
    border: "border-sky-500/75",
    shell: "from-[#0c1b2a] via-[#08111b] to-[#07090d] text-sky-50",
    art: "from-sky-950 via-blue-900/70 to-[#091017]",
    badge: "border-sky-400/35 bg-sky-500/18 text-sky-100",
    kicker: "text-sky-200/80",
    inkPanel: "border-sky-500/20 bg-sky-950/30",
    inkPanelActive:
      "border-cyan-300/45 bg-gradient-to-r from-cyan-900/60 to-sky-950/55 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.18)]",
    fallbackMark: "[]",
  },
  POWER: {
    border: "border-violet-500/75",
    shell: "from-[#231233] via-[#100918] to-[#09070c] text-violet-50",
    art: "from-violet-950 via-fuchsia-900/65 to-[#110812]",
    badge: "border-violet-400/35 bg-violet-500/18 text-violet-100",
    kicker: "text-violet-200/80",
    inkPanel: "border-violet-500/20 bg-violet-950/30",
    inkPanelActive:
      "border-cyan-300/45 bg-gradient-to-r from-cyan-900/60 to-violet-950/55 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.18)]",
    fallbackMark: "++",
  },
  STATUS: {
    border: "border-slate-500/75",
    shell: "from-[#1f2732] via-[#0f141c] to-[#090a0e] text-slate-50",
    art: "from-slate-800 via-slate-700/70 to-slate-950",
    badge: "border-slate-400/35 bg-slate-500/18 text-slate-100",
    kicker: "text-slate-300/80",
    inkPanel: "border-slate-500/20 bg-slate-900/35",
    inkPanelActive:
      "border-cyan-300/45 bg-gradient-to-r from-cyan-900/60 to-slate-900/55 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.18)]",
    fallbackMark: "--",
  },
  CURSE: {
    border: "border-rose-600/75",
    shell: "from-[#2a101c] via-[#140911] to-[#09070b] text-rose-50",
    art: "from-rose-950 via-purple-950/70 to-[#130711]",
    badge: "border-rose-400/35 bg-rose-500/18 text-rose-100",
    kicker: "text-rose-200/80",
    inkPanel: "border-rose-500/20 bg-rose-950/30",
    inkPanelActive:
      "border-cyan-300/45 bg-gradient-to-r from-cyan-900/60 to-rose-950/55 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.18)]",
    fallbackMark: "XX",
  },
};

const rarityStyles: Record<
  Rarity,
  {
    badge: string;
    frame: string;
    glow: string;
    cost: string;
  }
> = {
  STARTER: {
    badge: "border-slate-400/20 bg-slate-500/12 text-slate-200",
    frame: "border-white/8",
    glow: "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.10),transparent_48%)]",
    cost: "border-slate-200/20 bg-slate-200/10 text-slate-100",
  },
  COMMON: {
    badge: "border-zinc-300/20 bg-zinc-200/10 text-zinc-100",
    frame: "border-white/10",
    glow: "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_48%)]",
    cost: "border-zinc-100/25 bg-zinc-100/10 text-zinc-50",
  },
  UNCOMMON: {
    badge: "border-sky-300/25 bg-sky-400/12 text-sky-100",
    frame: "border-sky-200/20",
    glow: "bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.20),transparent_52%)]",
    cost: "border-sky-200/30 bg-sky-300/14 text-sky-50",
  },
  RARE: {
    badge: "border-amber-300/30 bg-amber-300/14 text-amber-100",
    frame: "border-amber-200/20",
    glow: "bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.24),transparent_54%)]",
    cost: "border-amber-200/40 bg-amber-300/18 text-amber-50",
  },
};

const biomeStyles: Record<
  BiomeType,
  { badge: string; edge: string; aura: string }
> = {
  LIBRARY: {
    badge: "border-amber-400/25 bg-amber-500/12 text-amber-100",
    edge: "from-amber-300/0 via-amber-300/80 to-amber-300/0",
    aura: "bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.16),transparent_42%)]",
  },
  VIKING: {
    badge: "border-cyan-300/25 bg-cyan-300/12 text-cyan-100",
    edge: "from-cyan-300/0 via-cyan-300/80 to-cyan-300/0",
    aura: "bg-[radial-gradient(circle_at_50%_0%,rgba(103,232,249,0.16),transparent_42%)]",
  },
  GREEK: {
    badge: "border-yellow-300/25 bg-yellow-300/12 text-yellow-100",
    edge: "from-yellow-300/0 via-yellow-300/80 to-yellow-300/0",
    aura: "bg-[radial-gradient(circle_at_50%_0%,rgba(250,204,21,0.15),transparent_42%)]",
  },
  EGYPTIAN: {
    badge: "border-orange-300/25 bg-orange-300/12 text-orange-100",
    edge: "from-orange-300/0 via-orange-300/80 to-orange-300/0",
    aura: "bg-[radial-gradient(circle_at_50%_0%,rgba(251,146,60,0.18),transparent_42%)]",
  },
  LOVECRAFTIAN: {
    badge: "border-fuchsia-300/25 bg-fuchsia-300/12 text-fuchsia-100",
    edge: "from-fuchsia-300/0 via-fuchsia-300/80 to-fuchsia-300/0",
    aura: "bg-[radial-gradient(circle_at_50%_0%,rgba(217,70,239,0.16),transparent_42%)]",
  },
  AZTEC: {
    badge: "border-emerald-300/25 bg-emerald-300/12 text-emerald-100",
    edge: "from-emerald-300/0 via-emerald-300/80 to-emerald-300/0",
    aura: "bg-[radial-gradient(circle_at_50%_0%,rgba(52,211,153,0.16),transparent_42%)]",
  },
  CELTIC: {
    badge: "border-lime-300/25 bg-lime-300/12 text-lime-100",
    edge: "from-lime-300/0 via-lime-300/80 to-lime-300/0",
    aura: "bg-[radial-gradient(circle_at_50%_0%,rgba(163,230,53,0.16),transparent_42%)]",
  },
  RUSSIAN: {
    badge: "border-sky-200/25 bg-sky-200/12 text-sky-50",
    edge: "from-sky-200/0 via-sky-200/80 to-sky-200/0",
    aura: "bg-[radial-gradient(circle_at_50%_0%,rgba(186,230,253,0.18),transparent_42%)]",
  },
  AFRICAN: {
    badge: "border-amber-200/25 bg-amber-200/12 text-amber-50",
    edge: "from-amber-200/0 via-amber-200/80 to-amber-200/0",
    aura: "bg-[radial-gradient(circle_at_50%_0%,rgba(253,230,138,0.18),transparent_42%)]",
  },
};

const sizeStyles = {
  md: {
    cardW: "w-[94px] lg:w-[144px] xl:w-[176px]",
    cardH: "h-[170px] lg:h-[258px] xl:h-[314px]",
    costBubble: "h-7 w-7 text-[11px] lg:h-9 lg:w-9 lg:text-base",
    topPad: "px-2 pb-2 pt-2 lg:px-3 lg:pb-3 lg:pt-3",
    headerLeftPad: "pl-7 lg:pl-11",
    kicker: "text-[6px] lg:text-[8px] xl:text-[9px]",
    name: "text-[8px] lg:text-[12px] xl:text-[14px]",
    artH: "h-[54px] lg:h-[84px] xl:h-[104px]",
    badge: "text-[6px] lg:text-[8px] xl:text-[9px]",
    description: "text-[7px] lg:text-[10px] xl:text-[11px]",
    descriptionMin: "min-h-[36px] lg:min-h-[56px] xl:min-h-[70px]",
    footer: "text-[6px] lg:text-[8px] xl:text-[9px]",
    iconMark: "text-xl lg:text-3xl xl:text-4xl",
    placeholderType: "text-[6px] lg:text-[8px] xl:text-[10px]",
    inkMeta: "text-[6px] lg:text-[8px] xl:text-[9px]",
  },
  sm: {
    cardW: "w-[76px] lg:w-[116px] xl:w-[136px]",
    cardH: "h-[154px] lg:h-[218px] xl:h-[256px]",
    costBubble: "h-6 w-6 text-[10px] lg:h-8 lg:w-8 lg:text-sm",
    topPad: "px-1.5 pb-1.5 pt-1.5 lg:px-2 lg:pb-2 lg:pt-2",
    headerLeftPad: "pl-6 lg:pl-9",
    kicker: "text-[6px] lg:text-[7px] xl:text-[8px]",
    name: "text-[8px] lg:text-[10px] xl:text-[12px]",
    artH: "h-[46px] lg:h-[66px] xl:h-[82px]",
    badge: "text-[6px] lg:text-[7px] xl:text-[8px]",
    description: "text-[7px] lg:text-[8px] xl:text-[9px]",
    descriptionMin: "min-h-[32px] lg:min-h-[44px] xl:min-h-[52px]",
    footer: "text-[6px] lg:text-[7px] xl:text-[8px]",
    iconMark: "text-lg lg:text-[28px] xl:text-[34px]",
    placeholderType: "text-[6px] lg:text-[7px] xl:text-[8px]",
    inkMeta: "text-[6px] lg:text-[7px] xl:text-[8px]",
  },
  lg: {
    cardW: "w-[176px] lg:w-[188px] xl:w-[204px]",
    cardH: "h-[292px] lg:h-[314px] xl:h-[336px]",
    costBubble: "h-10 w-10 text-lg lg:h-11 lg:w-11 lg:text-xl",
    topPad: "px-3 pb-3 pt-3 lg:px-3.5 lg:pb-3.5 lg:pt-3.5",
    headerLeftPad: "pl-11 lg:pl-12",
    kicker: "text-[8px] lg:text-[9px] xl:text-[10px]",
    name: "text-[14px] lg:text-[16px] xl:text-[18px]",
    artH: "h-[104px] lg:h-[116px] xl:h-[128px]",
    badge: "text-[8px] lg:text-[9px] xl:text-[10px]",
    description: "text-[11px] lg:text-[12px] xl:text-[13px]",
    descriptionMin: "min-h-[72px] lg:min-h-[84px] xl:min-h-[96px]",
    footer: "text-[8px] lg:text-[9px] xl:text-[10px]",
    iconMark: "text-4xl lg:text-5xl xl:text-6xl",
    placeholderType: "text-[8px] lg:text-[9px] xl:text-[10px]",
    inkMeta: "text-[8px] lg:text-[9px] xl:text-[10px]",
  },
} as const;

const redactionBadgeOrder: Record<CardRedactionType, number> = {
  COST: 0,
  TEXT: 1,
};

const redactionBadgeStyles: Record<CardRedactionType, string> = {
  COST: "border-amber-200/45 bg-amber-300/16 text-amber-50",
  TEXT: "border-slate-200/30 bg-slate-200/10 text-slate-100",
};

export function GameCard({
  definition,
  redactionTypes = [],
  canPlay = true,
  canPlayInked = false,
  isSelected = false,
  isPendingInked = false,
  isFrozen = false,
  upgraded = false,
  costModifier = 0,
  attackBonus = 0,
  onClick,
  onDoubleClick,
  onInkedClick,
  onInkedDoubleClick,
  size = "md",
  detailMode = "full",
  className,
}: GameCardProps) {
  const { t } = useTranslation();
  const sortedRedactionTypes = [...new Set(redactionTypes)].sort(
    (left, right) => redactionBadgeOrder[left] - redactionBadgeOrder[right]
  );
  const displayDefinition = upgraded
    ? buildUpgradedCardDefinition(definition)
    : definition;
  const rawAttackBonus =
    displayDefinition.type === "ATTACK" ? Math.max(0, attackBonus) : 0;
  const displayDefinitionWithAttackBonus = applyAttackBonusToCardDefinition(
    displayDefinition,
    rawAttackBonus
  );
  const displayedEnergyCost = Math.max(
    0,
    displayDefinition.energyCost + costModifier
  );
  const hasModifiedCost = costModifier > 0;
  const hasInteractiveAction = canPlay || canPlayInked;
  const sizeStyle = sizeStyles[size];
  const typeStyle = typeStyles[displayDefinition.type];
  const rarityStyle = rarityStyles[displayDefinition.rarity];
  const biomeStyle = biomeStyles[displayDefinition.biome];
  const [artFailed, setArtFailed] = useState(false);
  const artImageSrc = CARD_IMAGES[displayDefinition.id];
  const localizedName = localizeCardName(displayDefinitionWithAttackBonus, t);
  const localizedDescription = localizeCardDescription(
    displayDefinitionWithAttackBonus,
    t
  );
  const localizedInkedDescription = localizeInkedDescription(
    displayDefinitionWithAttackBonus,
    t
  );
  const localizedType = localizeCardType(displayDefinition.type, t);
  const localizedRarity = t(`gameCard.rarity.${displayDefinition.rarity}`, {
    defaultValue: displayDefinition.rarity,
  });
  const localizedBiome = t(`biome.${displayDefinition.biome}`, {
    defaultValue: displayDefinition.biome,
  });
  const isCondensed = detailMode === "condensed";
  const isScrollablePreview = size !== "sm" && !isCondensed;
  const showArtworkMeta = size !== "lg";
  const activeDescription =
    isPendingInked && displayDefinition.inkedVariant
      ? (localizedInkedDescription ??
        displayDefinition.inkedVariant.description)
      : localizedDescription;

  const bodyTextClass = isPendingInked
    ? "text-cyan-100/92"
    : displayDefinition.type === "CURSE"
      ? "text-rose-100/90"
      : displayDefinition.type === "STATUS"
        ? "text-slate-200/90"
        : upgraded
          ? "text-amber-50/95"
          : "text-slate-200/90";

  return (
    <div
      data-keep-selection="true"
      className={cn(
        "group relative isolate z-0 flex select-none flex-col overflow-hidden rounded-[18px] border bg-slate-950/95 shadow-[0_10px_24px_rgba(2,6,23,0.45)] transition-all duration-200",
        typeStyle.border,
        sizeStyle.cardW,
        sizeStyle.cardH,
        hasInteractiveAction
          ? "cursor-pointer hover:-translate-y-1.5 hover:shadow-[0_18px_34px_rgba(2,6,23,0.62)] lg:hover:-translate-y-2"
          : "cursor-not-allowed opacity-55 saturate-[0.78]",
        isFrozen &&
          "shadow-[0_0_22px_rgba(34,211,238,0.2)] ring-2 ring-cyan-400/85",
        isSelected &&
          "z-30 -translate-y-2 ring-2 ring-offset-2 ring-offset-slate-950 lg:-translate-y-3",
        isSelected &&
          (isPendingInked
            ? "shadow-[0_0_26px_rgba(34,211,238,0.32)] ring-cyan-300"
            : "ring-amber-100"),
        className
      )}
      onClick={canPlay ? onClick : undefined}
      onDoubleClick={canPlay ? onDoubleClick : undefined}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-b opacity-95",
          typeStyle.shell
        )}
      />
      <div className={cn("absolute inset-0 opacity-80", rarityStyle.glow)} />
      <div className={cn("absolute inset-0 opacity-70", biomeStyle.aura)} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_18%,transparent_82%,rgba(255,255,255,0.03))]" />
      <div
        className={cn(
          "absolute right-0 top-4 h-[72%] w-[3px] rounded-full bg-gradient-to-b opacity-80",
          biomeStyle.edge
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-[3px] rounded-[14px] border",
          rarityStyle.frame
        )}
      />
      {upgraded && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-400" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(253,224,71,0.18),transparent_34%)]" />
        </>
      )}

      <div
        className={cn(
          "absolute left-2 top-2 z-20 flex items-center justify-center rounded-full border font-black shadow-[0_8px_18px_rgba(0,0,0,0.35)] backdrop-blur-sm",
          sizeStyle.costBubble,
          hasModifiedCost
            ? "border-amber-200/50 bg-gradient-to-br from-amber-200 via-orange-300 to-orange-500 text-slate-950"
            : rarityStyle.cost,
          upgraded &&
            !hasModifiedCost &&
            "border-amber-200/55 bg-gradient-to-br from-amber-100 via-amber-300 to-amber-500 text-slate-950"
        )}
      >
        {displayedEnergyCost}
      </div>

      <div
        className={cn(
          "relative z-10 flex h-full min-h-0 flex-col",
          sizeStyle.topPad
        )}
      >
        <div
          className={cn(
            "flex items-start justify-between gap-1.5",
            sizeStyle.headerLeftPad
          )}
        >
          <div className="min-w-0">
            <p
              className={cn(
                "font-black uppercase tracking-[0.24em]",
                sizeStyle.kicker,
                typeStyle.kicker
              )}
            >
              {localizedType}
            </p>
            <h3
              className={cn(
                "mt-1 whitespace-normal break-normal font-black leading-[1.06] text-slate-50 [overflow-wrap:normal] [text-wrap:pretty]",
                sizeStyle.name
              )}
            >
              {localizedName}
            </h3>
          </div>

          <div className="flex flex-col items-end gap-1">
            {upgraded && (
              <span
                className={cn(
                  "bg-amber-300/18 rounded-full border border-amber-200/60 px-1.5 py-0.5 font-black uppercase tracking-[0.18em] text-amber-50 shadow-[0_0_12px_rgba(245,158,11,0.18)]",
                  sizeStyle.badge
                )}
              >
                +
              </span>
            )}
            {isFrozen && (
              <span
                className={cn(
                  "bg-cyan-400/14 rounded-full border border-cyan-300/45 px-1.5 py-0.5 font-black uppercase tracking-[0.16em] text-cyan-100",
                  sizeStyle.badge
                )}
              >
                Frozen
              </span>
            )}
            {sortedRedactionTypes.map((redactionType) => (
              <span
                key={redactionType}
                className={cn(
                  "rounded-full border px-1.5 py-0.5 font-black uppercase tracking-[0.14em]",
                  sizeStyle.badge,
                  redactionBadgeStyles[redactionType]
                )}
              >
                {t(`gameCard.labels.redaction.${redactionType}`, {
                  defaultValue: redactionType,
                })}
              </span>
            ))}
          </div>
        </div>

        <div
          className={cn(
            "mt-2 flex min-h-0 flex-1 flex-col gap-2",
            isScrollablePreview &&
              "[&::-webkit-scrollbar-thumb]:bg-white/18 touch-pan-y overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar]:w-1"
          )}
        >
          <div
            className={cn(
              "relative overflow-hidden rounded-[14px] border border-white/10 bg-black/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
              isScrollablePreview && "shrink-0",
              sizeStyle.artH
            )}
          >
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-95",
                typeStyle.art
              )}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.16),transparent_44%)]" />

            {artImageSrc && !artFailed && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={artImageSrc}
                alt={localizedName}
                className={cn(
                  "absolute inset-0 h-full w-full",
                  size === "lg"
                    ? "object-contain object-center p-1.5"
                    : "object-cover object-center"
                )}
                onError={() => setArtFailed(true)}
              />
            )}

            {(!artImageSrc || artFailed) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
                <span
                  className={cn(
                    "font-black uppercase tracking-[0.38em] text-white/30",
                    sizeStyle.placeholderType
                  )}
                >
                  {localizedType}
                </span>
                <span
                  className={cn(
                    "mt-1 font-black leading-none text-white/10",
                    sizeStyle.iconMark
                  )}
                >
                  {typeStyle.fallbackMark}
                </span>
                <span
                  className={cn(
                    "mt-1 uppercase tracking-[0.24em] text-white/25",
                    sizeStyle.footer
                  )}
                >
                  {localizedBiome}
                </span>
              </div>
            )}

            <div
              className={cn(
                "pointer-events-none absolute inset-0",
                showArtworkMeta
                  ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.07),transparent_36%,rgba(2,6,23,0.14)_82%,rgba(2,6,23,0.75))]"
                  : "bg-[linear-gradient(180deg,rgba(255,255,255,0.07),transparent_36%,rgba(2,6,23,0.22)_78%,rgba(2,6,23,0.72))]"
              )}
            />
            {showArtworkMeta && (
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 border-t border-white/10 bg-slate-950/60 px-2 py-1 backdrop-blur-sm">
                <span
                  className={cn(
                    "truncate rounded-full border px-1.5 py-0.5 font-semibold uppercase tracking-[0.16em]",
                    sizeStyle.badge,
                    rarityStyle.badge
                  )}
                >
                  {localizedRarity}
                </span>
                <span
                  className={cn(
                    "truncate rounded-full border px-1.5 py-0.5 font-semibold uppercase tracking-[0.16em]",
                    sizeStyle.badge,
                    biomeStyle.badge
                  )}
                >
                  {localizedBiome}
                </span>
              </div>
            )}
          </div>

          <div
            className={cn(
              "flex flex-col",
              isScrollablePreview ? "flex-none shrink-0" : "min-h-0 flex-1"
            )}
          >
            <div
              className={cn(
                "border-white/8 relative rounded-[14px] border bg-black/20 px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
                isScrollablePreview
                  ? "flex-none overflow-visible"
                  : "min-h-0 flex-1 overflow-hidden",
                isCondensed
                  ? size === "md"
                    ? "min-h-[22px] lg:min-h-[30px] xl:min-h-[36px]"
                    : "min-h-[20px] lg:min-h-[24px] xl:min-h-[30px]"
                  : sizeStyle.descriptionMin
              )}
            >
              <div
                className={cn(
                  "leading-[1.24]",
                  sizeStyle.description,
                  bodyTextClass
                )}
              >
                {parseDescriptionWithTooltips(activeDescription)}
              </div>
              {!isScrollablePreview && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-black/35 to-transparent" />
              )}
            </div>

            {displayDefinition.inkedVariant ? (
              <Tooltip
                className="mt-1.5 block"
                content={
                  <div className="space-y-2">
                    <div>
                      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                        {t("gameCard.labels.normal")}
                      </p>
                      <p className="text-[11px] text-gray-200">
                        {localizedDescription}
                      </p>
                    </div>
                    <div>
                      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-400">
                        + {t("gameCard.labels.inked")}
                      </p>
                      <p className="text-[11px] text-cyan-200">
                        {localizedInkedDescription ??
                          displayDefinition.inkedVariant.description}
                      </p>
                    </div>
                  </div>
                }
              >
                {canPlayInked ? (
                  <button
                    className={cn(
                      "mt-1.5 w-full shrink-0 rounded-[14px] border px-2 py-1.5 text-left transition-all duration-150",
                      sizeStyle.inkMeta,
                      isCondensed && "py-1",
                      isPendingInked && "ring-1 ring-cyan-200/55",
                      isPendingInked
                        ? "bg-cyan-400/18 animate-pulse border-cyan-200/55 shadow-[0_0_18px_rgba(34,211,238,0.22)]"
                        : typeStyle.inkPanelActive
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onInkedClick?.();
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      onInkedDoubleClick?.();
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black uppercase tracking-[0.18em] text-cyan-50">
                        + {t("gameCard.labels.ink")}
                      </span>
                      <span className="rounded-full border border-cyan-200/30 bg-cyan-100/10 px-1.5 py-0.5 font-black text-cyan-50">
                        {displayDefinition.inkedVariant.inkMarkCost}
                      </span>
                    </div>
                    {!isCondensed && (
                      <p
                        className="mt-1 leading-[1.2] text-cyan-100/85"
                        style={
                          size === "lg"
                            ? undefined
                            : {
                                display: "-webkit-box",
                                WebkitBoxOrient: "vertical",
                                WebkitLineClamp: size === "sm" ? 1 : 2,
                                overflow: "hidden",
                              }
                        }
                      >
                        {localizedInkedDescription ??
                          displayDefinition.inkedVariant.description}
                      </p>
                    )}
                  </button>
                ) : (
                  <div
                    className={cn(
                      "mt-1.5 w-full shrink-0 rounded-[14px] border px-2 py-1.5 opacity-60",
                      sizeStyle.inkMeta,
                      isCondensed && "py-1",
                      typeStyle.inkPanel
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black uppercase tracking-[0.18em] text-cyan-100/80">
                        + {t("gameCard.labels.ink")}
                      </span>
                      <span className="bg-cyan-100/8 rounded-full border border-cyan-200/20 px-1.5 py-0.5 font-black text-cyan-50/80">
                        {displayDefinition.inkedVariant.inkMarkCost}
                      </span>
                    </div>
                    {!isCondensed && (
                      <p
                        className="mt-1 leading-[1.2] text-slate-300/75"
                        style={
                          size === "lg"
                            ? undefined
                            : {
                                display: "-webkit-box",
                                WebkitBoxOrient: "vertical",
                                WebkitLineClamp: size === "sm" ? 1 : 2,
                                overflow: "hidden",
                              }
                        }
                      >
                        {localizedInkedDescription ??
                          displayDefinition.inkedVariant.description}
                      </p>
                    )}
                  </div>
                )}
              </Tooltip>
            ) : (
              <div
                className={cn(
                  "border-white/6 mt-1.5 flex items-center justify-between gap-2 rounded-[14px] border bg-black/10 px-2 py-1.5 text-slate-300/70",
                  sizeStyle.footer
                )}
              >
                <span className="uppercase tracking-[0.18em] text-slate-400/80">
                  {upgraded
                    ? t("gameCard.labels.upgraded")
                    : t("gameCard.labels.normal")}
                </span>
                <span className="truncate uppercase tracking-[0.16em] text-slate-500/90">
                  {localizedBiome}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
