"use client";

import { cn } from "@/lib/utils/cn";
import type { CardDefinition } from "@/game/schemas/cards";

interface GameCardProps {
  definition: CardDefinition;
  instanceId?: string;
  canPlay?: boolean;
  canPlayInked?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onInkedClick?: () => void;
  size?: "sm" | "md";
}

const typeColors: Record<string, string> = {
  ATTACK: "border-red-500 bg-red-950/50",
  SKILL: "border-blue-500 bg-blue-950/50",
  POWER: "border-purple-500 bg-purple-950/50",
};

const typeBadgeColors: Record<string, string> = {
  ATTACK: "bg-red-600",
  SKILL: "bg-blue-600",
  POWER: "bg-purple-600",
};

const rarityColors: Record<string, string> = {
  STARTER: "text-gray-400",
  COMMON: "text-white",
  UNCOMMON: "text-blue-400",
  RARE: "text-yellow-400",
};

export function GameCard({
  definition,
  canPlay = true,
  canPlayInked = false,
  isSelected = false,
  onClick,
  onInkedClick,
  size = "md",
}: GameCardProps) {
  const isMd = size === "md";

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-lg border-2 transition-all",
        typeColors[definition.type] ?? "border-gray-500 bg-gray-800",
        isMd ? "w-36 p-3" : "w-28 p-2",
        canPlay
          ? "cursor-pointer hover:-translate-y-2 hover:shadow-lg hover:shadow-white/10"
          : "cursor-not-allowed opacity-50",
        isSelected && "ring-2 ring-white"
      )}
      onClick={canPlay ? onClick : undefined}
    >
      {/* Energy cost */}
      <div className="absolute -left-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-yellow-600 text-sm font-bold text-white">
        {definition.energyCost}
      </div>

      {/* Ink cost indicator */}
      {definition.inkCost > 0 && (
        <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-600 text-xs font-bold text-white">
          {definition.inkCost}
        </div>
      )}

      {/* Name */}
      <div
        className={cn(
          "mt-3 font-bold",
          rarityColors[definition.rarity] ?? "text-white",
          isMd ? "text-sm" : "text-xs"
        )}
      >
        {definition.name}
      </div>

      {/* Type badge */}
      <div
        className={cn(
          "mt-1 inline-block w-fit rounded px-1.5 py-0.5 text-xs text-white",
          typeBadgeColors[definition.type] ?? "bg-gray-600"
        )}
      >
        {definition.type}
      </div>

      {/* Description */}
      <p className={cn("mt-2 text-gray-300", isMd ? "text-xs" : "text-[10px]")}>
        {definition.description}
      </p>

      {/* Inked variant button */}
      {definition.inkedVariant && canPlayInked && (
        <button
          className="mt-2 rounded bg-cyan-700 px-2 py-1 text-xs font-medium text-cyan-200 hover:bg-cyan-600"
          onClick={(e) => {
            e.stopPropagation();
            onInkedClick?.();
          }}
        >
          Ink ({definition.inkedVariant.inkMarkCost})
        </button>
      )}
    </div>
  );
}
