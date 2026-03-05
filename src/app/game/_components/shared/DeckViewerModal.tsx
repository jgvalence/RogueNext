"use client";

import { RogueButton, RogueModal, RogueTag } from "@/components/ui/rogue";
import type { CardInstance } from "@/game/schemas/cards";
import type { CardDefinition } from "@/game/schemas/cards";
import { GameCard } from "../combat/GameCard";
import { useTranslation } from "react-i18next";

interface DeckViewerModalProps {
  deck: CardInstance[];
  cardDefs: Map<string, CardDefinition>;
  onClose: () => void;
}

const TYPE_ORDER: Record<string, number> = {
  ATTACK: 0,
  SKILL: 1,
  POWER: 2,
  STATUS: 3,
  CURSE: 4,
};

export function DeckViewerModal({
  deck,
  cardDefs,
  onClose,
}: DeckViewerModalProps) {
  const { t } = useTranslation();

  const sorted = [...deck].sort((a, b) => {
    const defA = cardDefs.get(a.definitionId);
    const defB = cardDefs.get(b.definitionId);
    const typeA = TYPE_ORDER[defA?.type ?? ""] ?? 99;
    const typeB = TYPE_ORDER[defB?.type ?? ""] ?? 99;
    if (typeA !== typeB) return typeA - typeB;
    return (defA?.name ?? "").localeCompare(defB?.name ?? "");
  });

  const breakdown = deck.reduce<Record<string, number>>((acc, card) => {
    const def = cardDefs.get(card.definitionId);
    if (def) acc[def.type] = (acc[def.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <RogueModal
      open
      onCancel={onClose}
      footer={null}
      centered
      destroyOnClose
      width={1120}
      title={
        <div className="flex flex-wrap items-center gap-3 pr-2">
          <h3 className="text-base font-bold text-slate-100">
            {t("deckViewer.title")}{" "}
            <span className="text-slate-400">
              ({t("deckViewer.cardsCount", { count: deck.length })})
            </span>
          </h3>
          <div className="flex gap-1.5">
            {Object.entries(breakdown).map(([type, count]) => (
              <RogueTag
                key={type}
                bordered={false}
                className="rounded bg-slate-700/70 px-1.5 py-0.5 text-[10px] font-medium text-slate-300"
              >
                {count} {type.charAt(0) + type.slice(1).toLowerCase()}
              </RogueTag>
            ))}
          </div>
        </div>
      }
      className="[&_.ant-modal-content]:!max-h-[85vh] [&_.ant-modal-content]:!overflow-hidden [&_.ant-modal-content]:!rounded-xl [&_.ant-modal-content]:!border [&_.ant-modal-content]:!border-slate-700 [&_.ant-modal-content]:!bg-slate-900 [&_.ant-modal-header]:!border-b [&_.ant-modal-header]:!border-slate-700/60 [&_.ant-modal-header]:!bg-transparent"
    >
      <div className="max-h-[65vh] overflow-y-auto p-1">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
          {sorted.map((card) => {
            const def = cardDefs.get(card.definitionId);
            if (!def) return null;
            return (
              <div key={card.instanceId} className="flex justify-center">
                <GameCard
                  definition={def}
                  instanceId={card.instanceId}
                  upgraded={card.upgraded}
                  canPlay={false}
                  size="sm"
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <RogueButton
          onClick={onClose}
          className="!rounded !border !border-slate-600 !bg-transparent !px-2.5 !py-1 !text-xs !font-semibold !text-slate-300 hover:!border-slate-400 hover:!text-white"
        >
          {t("common.close")}
        </RogueButton>
      </div>
    </RogueModal>
  );
}
