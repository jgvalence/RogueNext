"use client";

import { useTranslation } from "react-i18next";
import { RogueTag, RogueTooltip } from "@/components/ui/rogue";
import { BIOME_THEMES, VISUEL_ICONS, TIER_LABELS } from "./constants";
import type { SlotState } from "./constants";
import type { Histoire } from "@/game/schemas/meta";
import { localizeStoryTitle } from "@/lib/i18n/stories";

interface HistoireSlotProps {
  histoire: Histoire;
  state: SlotState;
  onClick: (histoire: Histoire) => void;
}

export function HistoireSlot({ histoire, state, onClick }: HistoireSlotProps) {
  const { t } = useTranslation();
  const theme = BIOME_THEMES[histoire.biome];
  const isClickable = state !== "LOCKED_PREREQS";
  const storyTitle = localizeStoryTitle(histoire, t);
  const stateLabel =
    state === "UNLOCKED"
      ? t("collection.unlocked")
      : state === "AVAILABLE"
        ? t("library.unlock")
        : state === "LOCKED_RESOURCES"
          ? t("library.insufficientResources")
          : t("library.missingPrereqs");
  const tooltipTitle = `${storyTitle} - ${stateLabel}`;

  return (
    <RogueTooltip title={tooltipTitle}>
      <button
        onClick={() => isClickable && onClick(histoire)}
        disabled={!isClickable}
        className={[
          "relative flex h-24 w-14 flex-col items-center justify-between rounded-md border p-1.5 text-left transition-all duration-200",
          theme.border,
          theme.bg,
          state === "UNLOCKED"
            ? "cursor-pointer shadow-md hover:brightness-110"
            : state === "AVAILABLE"
              ? `animate-pulse cursor-pointer ring-1 ${theme.glow} hover:scale-105 hover:animate-none hover:brightness-125`
              : state === "LOCKED_RESOURCES"
                ? "cursor-pointer opacity-60 hover:opacity-80"
                : "cursor-not-allowed opacity-25",
        ].join(" ")}
      >
        <RogueTag
          bordered={false}
          className={`rounded px-1 py-0 text-[9px] font-bold leading-none ${theme.accent}`}
        >
          {TIER_LABELS[histoire.tier]}
        </RogueTag>

        <span className="text-xl leading-none">
          {VISUEL_ICONS[histoire.visuel]}
        </span>

        <span className="line-clamp-2 w-full text-center text-[7px] leading-tight text-white/70">
          {storyTitle}
        </span>

        {state === "UNLOCKED" && (
          <div
            className={`absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-bold ${theme.border} bg-slate-900 ${theme.accent}`}
          >
            {"\u2713"}
          </div>
        )}

        {state === "LOCKED_PREREQS" && (
          <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/30">
            <span className="text-base">{"\uD83D\uDD12"}</span>
          </div>
        )}
      </button>
    </RogueTooltip>
  );
}
