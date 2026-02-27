"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { CardInstance, CardDefinition } from "@/game/schemas/cards";
import { GameCard } from "../combat/GameCard";
import {
  UpgradePreviewPortal,
  type UpgradePreviewHoverInfo,
} from "./UpgradePreviewPortal";
import { useTranslation } from "react-i18next";

interface CardPickerModalProps {
  title: string;
  subtitle?: string;
  cards: CardInstance[];
  cardDefs: Map<string, CardDefinition>;
  onPick: (cardInstanceId: string) => void;
  onCancel?: () => void;
  showUpgradePreview?: boolean;
}

export function CardPickerModal({
  title,
  subtitle,
  cards,
  cardDefs,
  onPick,
  onCancel,
  showUpgradePreview = false,
}: CardPickerModalProps) {
  const { t } = useTranslation();
  const [hoverInfo, setHoverInfo] = useState<UpgradePreviewHoverInfo | null>(
    null
  );
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onCancel) onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel]);
  const handleCardMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, def: CardDefinition) => {
      if (!showUpgradePreview) return;
      setHoverInfo({ definition: def, anchorEl: e.currentTarget });
    },
    [showUpgradePreview]
  );
  const handleCardMouseLeave = useCallback(() => {
    if (!showUpgradePreview) return;
    setHoverInfo(null);
  }, [showUpgradePreview]);

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl border border-rose-800/60 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-700/60 px-4 py-3">
          <div>
            <h3 className="text-base font-bold text-slate-100">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
            )}
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="rounded border border-slate-600 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:border-slate-400 hover:text-white"
            >
              {t("cardPicker.cancel")}
            </button>
          )}
        </div>

        {/* Card grid */}
        <div className="overflow-y-auto p-4">
          {cards.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              {t("cardPicker.noCards")}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {cards.map((card) => {
                const def = cardDefs.get(card.definitionId);
                if (!def) return null;
                return (
                  <button
                    key={card.instanceId}
                    className="flex cursor-pointer justify-center rounded-lg ring-2 ring-transparent transition hover:ring-rose-500 focus:outline-none focus:ring-rose-400"
                    onClick={() => onPick(card.instanceId)}
                    onMouseEnter={(e) => handleCardMouseEnter(e, def)}
                    onMouseLeave={handleCardMouseLeave}
                    type="button"
                  >
                    <GameCard
                      definition={def}
                      instanceId={card.instanceId}
                      upgraded={card.upgraded}
                      canPlay={false}
                      size="sm"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {showUpgradePreview && <UpgradePreviewPortal info={hoverInfo} />}
    </div>
  );

  return createPortal(modal, document.body);
}
