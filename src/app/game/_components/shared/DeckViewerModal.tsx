"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { CardInstance } from "@/game/schemas/cards";
import type { CardDefinition } from "@/game/schemas/cards";
import { GameCard } from "../combat/GameCard";

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
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

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

  const modal = (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/75 px-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-700/60 px-4 py-3">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-slate-100">
              Votre Deck{" "}
              <span className="text-slate-400">({deck.length} cartes)</span>
            </h3>
            <div className="flex gap-1.5">
              {Object.entries(breakdown).map(([type, count]) => (
                <span
                  key={type}
                  className="rounded bg-slate-700/70 px-1.5 py-0.5 text-[10px] font-medium text-slate-300"
                >
                  {count} {type.charAt(0) + type.slice(1).toLowerCase()}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded border border-slate-600 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:border-slate-400 hover:text-white"
          >
            Fermer
          </button>
        </div>

        {/* Card grid */}
        <div className="overflow-y-auto p-4">
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
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
