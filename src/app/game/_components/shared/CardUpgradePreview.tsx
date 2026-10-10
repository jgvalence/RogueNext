"use client";

import { useTranslation } from "react-i18next";
import type { CardDefinition } from "@/game/schemas/cards";
import { GameCard } from "../combat/GameCard";

interface CardUpgradePreviewProps {
  definition: CardDefinition;
  size?: "sm" | "md";
}

export function CardUpgradePreview({
  definition,
  size = "sm",
}: CardUpgradePreviewProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-600 bg-gray-950/95 p-3 shadow-2xl">
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
          {t("gameCard.labels.current")}
        </p>
        <GameCard definition={definition} size={size} />
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-yellow-400">
          {t("gameCard.labels.upgraded")} A
        </p>
        <GameCard definition={definition} upgraded upgradeBranch="A" size={size} />
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-cyan-300">
          {t("gameCard.labels.upgraded")} B
        </p>
        <GameCard definition={definition} upgraded upgradeBranch="B" size={size} />
      </div>
    </div>
  );
}
