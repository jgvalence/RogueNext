"use client";

import { BIOME_THEMES, VISUEL_ICONS, TIER_LABELS } from "./constants";
import type { SlotState } from "./constants";
import type { Histoire } from "@/game/schemas/meta";

interface HistoireSlotProps {
  histoire: Histoire;
  state: SlotState;
  onClick: (histoire: Histoire) => void;
}

export function HistoireSlot({ histoire, state, onClick }: HistoireSlotProps) {
  const theme = BIOME_THEMES[histoire.biome];
  const isClickable = state !== "LOCKED_PREREQS";

  return (
    <button
      onClick={() => isClickable && onClick(histoire)}
      disabled={!isClickable}
      title={histoire.titre}
      className={[
        // Base
        "relative flex h-24 w-14 flex-col items-center justify-between rounded-md border p-1.5 text-left transition-all duration-200",
        theme.border,
        theme.bg,
        // State-based styles
        state === "UNLOCKED"
          ? "cursor-pointer shadow-md hover:brightness-110"
          : state === "AVAILABLE"
            ? `cursor-pointer animate-pulse ring-1 ${theme.glow} hover:scale-105 hover:animate-none hover:brightness-125`
            : state === "LOCKED_RESOURCES"
              ? "cursor-pointer opacity-60 hover:opacity-80"
              : "cursor-not-allowed opacity-25",
      ].join(" ")}
    >
      {/* Tier badge */}
      <span className={`text-[9px] font-bold leading-none ${theme.accent}`}>
        {TIER_LABELS[histoire.tier]}
      </span>

      {/* Visuel icon */}
      <span className="text-xl leading-none">{VISUEL_ICONS[histoire.visuel]}</span>

      {/* Title */}
      <span className="w-full text-center text-[7px] leading-tight text-white/70 line-clamp-2">
        {histoire.titre}
      </span>

      {/* Unlocked checkmark */}
      {state === "UNLOCKED" && (
        <div className={`absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-bold ${theme.border} bg-slate-900 ${theme.accent}`}>
          ✓
        </div>
      )}

      {/* Lock overlay for prereqs */}
      {state === "LOCKED_PREREQS" && (
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/30">
          <span className="text-base">🔒</span>
        </div>
      )}
    </button>
  );
}
