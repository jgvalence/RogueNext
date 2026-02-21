"use client";

import type { CardDefinition } from "@/game/schemas/cards";
import { buildUpgradedCardDefinition } from "@/game/engine/card-upgrades";
import { GameCard } from "../combat/GameCard";

interface CardUpgradePreviewProps {
  definition: CardDefinition;
  size?: "sm" | "md";
}

export function CardUpgradePreview({
  definition,
  size = "sm",
}: CardUpgradePreviewProps) {
  const upgradedDefinition = buildUpgradedCardDefinition(definition);

  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-600 bg-gray-950/95 p-3 shadow-2xl">
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
          Current
        </p>
        <GameCard definition={definition} size={size} />
      </div>

      <div className="flex items-center self-center text-lg text-amber-400">
        {"->"}
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-yellow-400">
          Upgraded
        </p>
        <GameCard definition={upgradedDefinition} upgraded size={size} />
      </div>
    </div>
  );
}
