"use client";

import { useCallback, useState } from "react";
import { RogueButton, RogueEmpty, RogueModal } from "@/components/ui/rogue";
import type { CardInstance, CardDefinition } from "@/game/schemas/cards";
import { GameCard } from "../combat/GameCard";
import { Tooltip } from "./Tooltip";
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
  const handleCardMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLElement>, def: CardDefinition) => {
      if (!showUpgradePreview) return;
      setHoverInfo({
        definition: def,
        anchorEl: e.currentTarget as HTMLButtonElement,
      });
    },
    [showUpgradePreview]
  );
  const handleCardMouseLeave = useCallback(() => {
    if (!showUpgradePreview) return;
    setHoverInfo(null);
  }, [showUpgradePreview]);

  return (
    <>
      <RogueModal
        open
        onCancel={onCancel}
        footer={null}
        centered
        destroyOnClose
        closable={Boolean(onCancel)}
        keyboard={Boolean(onCancel)}
        maskClosable={Boolean(onCancel)}
        width={980}
        title={
          <div className="pr-2">
            <h3 className="text-base font-bold text-slate-100">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
            )}
          </div>
        }
        className="[&_.ant-modal-content]:!max-h-[85vh] [&_.ant-modal-content]:!overflow-hidden [&_.ant-modal-content]:!rounded-xl [&_.ant-modal-content]:!border [&_.ant-modal-content]:!border-rose-800/60 [&_.ant-modal-content]:!bg-slate-900 [&_.ant-modal-header]:!border-b [&_.ant-modal-header]:!border-slate-700/60 [&_.ant-modal-header]:!bg-transparent"
      >
        <div className="max-h-[65vh] overflow-y-auto p-1">
          {cards.length === 0 ? (
            <RogueEmpty
              description={t("cardPicker.noCards")}
              className="py-8 [&_.ant-empty-description]:!text-sm [&_.ant-empty-description]:!text-slate-500"
            />
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {cards.map((card) => {
                const def = cardDefs.get(card.definitionId);
                if (!def) return null;
                const cardButton = (
                  <RogueButton
                    key={card.instanceId}
                    type="text"
                    className="!flex !h-auto !w-auto !cursor-pointer !justify-center !rounded-lg !p-0 !ring-2 !ring-transparent transition hover:!ring-rose-500 focus:!ring-rose-400"
                    onClick={() => onPick(card.instanceId)}
                    onMouseEnter={(e) => handleCardMouseEnter(e, def)}
                    onMouseLeave={handleCardMouseLeave}
                  >
                    <GameCard
                      definition={def}
                      instanceId={card.instanceId}
                      upgraded={card.upgraded}
                      canPlay={false}
                      className="!cursor-pointer !opacity-100 !saturate-100"
                      size="sm"
                    />
                  </RogueButton>
                );

                if (showUpgradePreview) {
                  return cardButton;
                }

                return (
                  <Tooltip
                    key={card.instanceId}
                    content={
                      <GameCard
                        definition={def}
                        instanceId={card.instanceId}
                        upgraded={card.upgraded}
                        canPlay={false}
                        className="!cursor-default !opacity-100 !saturate-100"
                        size="md"
                      />
                    }
                    contentClassName="!max-w-none !border-0 !bg-transparent !p-0 !shadow-none"
                    showArrow={false}
                    className="justify-self-center"
                  >
                    {cardButton}
                  </Tooltip>
                );
              })}
            </div>
          )}
        </div>
        {onCancel && (
          <div className="mt-3 flex justify-end">
            <RogueButton
              onClick={onCancel}
              className="!rounded !border !border-slate-600 !bg-transparent !px-2.5 !py-1 !text-xs !font-semibold !text-slate-300 hover:!border-slate-400 hover:!text-white"
            >
              {t("cardPicker.cancel")}
            </RogueButton>
          </div>
        )}
      </RogueModal>
      {showUpgradePreview && <UpgradePreviewPortal info={hoverInfo} />}
    </>
  );
}
