"use client";

import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import type { CombatState } from "@/game/schemas/combat-state";
import type { CardDefinition } from "@/game/schemas/cards";
import type { InkPowerType } from "@/game/schemas/enums";
import { GameCard } from "./GameCard";
import { RogueButton } from "@/components/ui/rogue";
import type { PileType, ReshuffleCardFx } from "./combat-view-types";

interface CombatOverlaysProps {
  isResolvingHandOverflow: boolean;
  pendingHandOverflowExhaust: number;
  combat: CombatState;
  cardDefs: Map<string, CardDefinition>;
  onResolveHandOverflowExhaust: (cardInstanceId: string) => void;
  openPile: PileType | null;
  closePileOverlay: () => void;
  pileTitle: string | null;
  pileCards: CombatState["drawPile"];
  isSelectingRewriteTarget: boolean;
  pendingDiscardTargetInkPower: InkPowerType | null;
  onUseInkPower: (power: InkPowerType, targetId: string | null) => void;
  reshuffleCards: ReshuffleCardFx[];
}

export function CombatOverlays({
  isResolvingHandOverflow,
  pendingHandOverflowExhaust,
  combat,
  cardDefs,
  onResolveHandOverflowExhaust,
  openPile,
  closePileOverlay,
  pileTitle,
  pileCards,
  isSelectingRewriteTarget,
  pendingDiscardTargetInkPower,
  onUseInkPower,
  reshuffleCards,
}: CombatOverlaysProps) {
  const { t } = useTranslation();

  return (
    <>
      {isResolvingHandOverflow && (
        <div
          className="absolute inset-0 z-[70] flex items-center justify-center bg-black/75 px-4"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="max-h-[84vh] w-full max-w-5xl rounded-xl border border-amber-600/70 bg-slate-950 p-4">
            <div className="mb-3 space-y-1">
              <h3 className="text-lg font-semibold text-amber-100">
                {t("combat.handOverflowTitle")}
              </h3>
              <p className="text-sm text-amber-200/90">
                {t("combat.handOverflowSubtitle", {
                  count: pendingHandOverflowExhaust,
                })}
              </p>
              <p className="text-xs text-slate-300">
                {t("combat.handOverflowHint")}
              </p>
            </div>

            {combat.hand.length === 0 ? (
              <p className="text-sm text-slate-400">
                {t("combat.noCardsInHand")}
              </p>
            ) : (
              <div className="grid max-h-[62vh] grid-cols-2 gap-2 overflow-auto pr-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {combat.hand.map((card) => {
                  const definition = cardDefs.get(card.definitionId);
                  if (!definition) return null;
                  return (
                    <button
                      key={card.instanceId}
                      type="button"
                      className="rounded outline-none ring-0 transition hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-amber-300"
                      onClick={() =>
                        onResolveHandOverflowExhaust(card.instanceId)
                      }
                    >
                      <GameCard
                        definition={definition}
                        upgraded={card.upgraded}
                        size="sm"
                        canPlay={false}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {openPile && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={closePileOverlay}
        >
          <div
            className="max-h-[80vh] w-full max-w-5xl rounded-xl border border-slate-700 bg-slate-950 p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  {pileTitle ?? ""}
                </h3>
                <p className="text-xs text-slate-400">
                  {t("combat.cardsCount", { count: pileCards.length })}
                  {openPile === "draw" ? ` ${t("combat.drawOrderMasked")}` : ""}
                </p>
                {isSelectingRewriteTarget && openPile === "discard" && (
                  <p className="text-xs font-semibold text-cyan-300">
                    {t("combat.selectRewrite")}
                  </p>
                )}
              </div>
              <RogueButton
                type="text"
                className="!h-auto !rounded !border !border-slate-600 !px-2 !py-1 !text-xs !text-slate-300 hover:!border-slate-400"
                onClick={closePileOverlay}
              >
                {t("common.close")}
              </RogueButton>
            </div>

            {pileCards.length === 0 ? (
              <p className="text-sm text-slate-500">
                {t("combat.noCardsInPile")}
              </p>
            ) : (
              <div className="grid max-h-[64vh] grid-cols-2 gap-2 overflow-auto pr-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {pileCards.map((card) => {
                  const definition = cardDefs.get(card.definitionId);
                  if (!definition) return null;
                  const rewriteSelectable =
                    isSelectingRewriteTarget && openPile === "discard";

                  return (
                    <div key={card.instanceId} className="flex justify-center">
                      {rewriteSelectable ? (
                        <button
                          type="button"
                          className="rounded"
                          onClick={() => {
                            if (!pendingDiscardTargetInkPower) return;
                            onUseInkPower(
                              pendingDiscardTargetInkPower,
                              card.instanceId
                            );
                            closePileOverlay();
                          }}
                        >
                          <GameCard
                            definition={definition}
                            upgraded={card.upgraded}
                            size="sm"
                          />
                        </button>
                      ) : (
                        <GameCard
                          definition={definition}
                          upgraded={card.upgraded}
                          size="sm"
                          canPlay={false}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {reshuffleCards.map((card) => (
        <div
          key={card.id}
          className="animate-reshuffle-card pointer-events-none fixed z-[80] h-14 w-10 rounded-md border border-slate-300/50 bg-gradient-to-b from-slate-200/80 to-slate-500/70 shadow-lg"
          style={
            {
              left: `${card.x}px`,
              top: `${card.y}px`,
              "--reshuffle-tx": `${card.tx}px`,
              "--reshuffle-ty": `${card.ty}px`,
              "--reshuffle-rot": `${card.rot}deg`,
              animationDelay: `${card.delay}ms`,
            } as CSSProperties
          }
        />
      ))}
    </>
  );
}
