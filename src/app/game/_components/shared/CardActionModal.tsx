"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { CardDefinition } from "@/game/schemas/cards";
import { CardUpgradePreview } from "./CardUpgradePreview";

interface CardActionModalProps {
  card: CardDefinition;
  actionLabel: string;
  onAction: () => void;
  onCancel: () => void;
}

export function CardActionModal({
  card,
  actionLabel,
  onAction,
  onCancel,
}: CardActionModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm overflow-y-auto rounded-t-2xl border border-slate-700/80 bg-slate-900 p-5 pb-10 shadow-2xl sm:rounded-2xl sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center overflow-x-auto">
          <CardUpgradePreview definition={card} size="sm" />
        </div>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-600 bg-slate-800/50 py-3 text-sm font-semibold text-slate-300 active:bg-slate-700/70"
          >
            {t("reward.skip")}
          </button>
          <button
            onClick={onAction}
            className="flex-[2] rounded-xl border border-amber-500/60 bg-amber-900/40 py-3 text-sm font-bold text-amber-100 active:bg-amber-900/70"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
