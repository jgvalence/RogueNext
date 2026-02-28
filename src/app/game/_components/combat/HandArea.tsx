"use client";

import { useRef, useLayoutEffect, useMemo, useState, useEffect } from "react";
import type { RefObject } from "react";
import type { CardInstance, CardDefinition } from "@/game/schemas/cards";
import type { CombatState } from "@/game/schemas/combat-state";
import { canPlayCard, canPlayCardInked } from "@/game/engine/cards";
import { GameCard } from "./GameCard";
import { useTranslation } from "react-i18next";
import { localizeCardName } from "@/lib/i18n/card-text";

interface HandAreaProps {
  hand: CardInstance[];
  combatState: CombatState;
  cardDefs: Map<string, CardDefinition>;
  selectedCardId: string | null;
  pendingInked: boolean;
  onPlayCard: (instanceId: string, useInked: boolean) => void;
  isDiscarding?: boolean;
  discardBtnRef?: RefObject<HTMLButtonElement | null>;
  playingCardId?: string | null;
  enemyRowRef?: RefObject<HTMLDivElement | null>;
}

export function HandArea({
  hand,
  combatState,
  cardDefs,
  selectedCardId,
  pendingInked,
  onPlayCard,
  isDiscarding = false,
  discardBtnRef,
  playingCardId = null,
  enemyRowRef,
}: HandAreaProps) {
  const { t } = useTranslation();
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [mobilePreviewCardId, setMobilePreviewCardId] = useState<string | null>(
    null
  );
  const hoveredIndex = useMemo(
    () => hand.findIndex((c) => c.instanceId === hoveredCardId),
    [hand, hoveredCardId]
  );

  const mobilePreviewCard = hand.find(
    (c) => c.instanceId === mobilePreviewCardId
  );
  const mobilePreviewDef = mobilePreviewCard
    ? cardDefs.get(mobilePreviewCard.definitionId)
    : null;
  const mobilePreviewNeedsTarget =
    mobilePreviewDef?.targeting === "SINGLE_ENEMY" ||
    mobilePreviewDef?.targeting === "SINGLE_ALLY";

  const wrapperRefs = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    if (!isDiscarding || !discardBtnRef?.current) return;

    const discardRect = discardBtnRef.current.getBoundingClientRect();
    const discardCx = discardRect.left + discardRect.width / 2;
    const discardCy = discardRect.top + discardRect.height / 2;

    wrapperRefs.current.forEach((el) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cardCx = rect.left + rect.width / 2;
      const cardCy = rect.top + rect.height / 2;
      el.style.setProperty("--tx", `${discardCx - cardCx}px`);
      el.style.setProperty("--ty", `${discardCy - cardCy}px`);
    });
  }, [isDiscarding, discardBtnRef]);

  useLayoutEffect(() => {
    if (!playingCardId || !enemyRowRef?.current) return;

    const enemyRect = enemyRowRef.current.getBoundingClientRect();
    const enemyCx = enemyRect.left + enemyRect.width / 2;
    const enemyCy = enemyRect.top + enemyRect.height / 2;

    const idx = hand.findIndex((c) => c.instanceId === playingCardId);
    const el = wrapperRefs.current[idx];
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const cardCx = rect.left + rect.width / 2;
    const cardCy = rect.top + rect.height / 2;
    el.style.setProperty("--tx", `${enemyCx - cardCx}px`);
    el.style.setProperty("--ty", `${enemyCy - cardCy}px`);
  }, [playingCardId, enemyRowRef, hand]);

  useEffect(() => {
    if (
      mobilePreviewCardId &&
      !hand.some((c) => c.instanceId === mobilePreviewCardId)
    ) {
      setMobilePreviewCardId(null);
    }
  }, [hand, mobilePreviewCardId]);

  useEffect(() => {
    if (!selectedCardId) setMobilePreviewCardId(null);
  }, [selectedCardId]);

  return (
    <>
      <div
        data-keep-selection="true"
        className="flex h-[44px] items-center gap-1.5 overflow-x-auto px-1 pb-0.5 lg:hidden"
      >
        {hand.map((card) => {
          const def = cardDefs.get(card.definitionId);
          if (!def) return null;
          const canPlay = canPlayCard(combatState, card.instanceId, cardDefs);
          const isSelected = selectedCardId === card.instanceId;
          const cardName = localizeCardName(def, t);

          const typeBorder: Record<string, string> = {
            ATTACK: "border-red-700/70",
            SKILL: "border-blue-700/70",
            POWER: "border-purple-700/70",
          };
          const typeGradient: Record<string, string> = {
            ATTACK: "from-red-950/50 to-slate-900",
            SKILL: "from-blue-950/50 to-slate-900",
            POWER: "from-purple-950/50 to-slate-900",
          };

          return (
            <button
              key={`mobile-chip-${card.instanceId}`}
              type="button"
              data-keep-selection="true"
              onClick={() => {
                onPlayCard(card.instanceId, false);
                setMobilePreviewCardId(card.instanceId);
              }}
              disabled={!canPlay}
              className={[
                "relative flex h-[36px] min-w-[76px] shrink-0 items-center gap-1.5 overflow-hidden rounded-xl border px-1.5 text-left transition-all duration-150",
                canPlay
                  ? isSelected
                    ? "-translate-y-1.5 border-cyan-400 bg-gradient-to-r from-slate-600 to-slate-800 shadow-[0_0_10px_rgba(34,211,238,0.45)]"
                    : `${typeBorder[def.type] ?? "border-slate-700/60"} bg-gradient-to-r ${typeGradient[def.type] ?? "from-slate-800/50 to-slate-900"} shadow-sm active:-translate-y-0.5`
                  : "cursor-not-allowed border-slate-800/50 bg-slate-900/30 opacity-40",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {/* Badge coût */}
              <div
                className={[
                  "flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full text-[10px] font-black",
                  canPlay
                    ? "border border-amber-600/50 bg-amber-950 text-amber-300"
                    : "border border-slate-700 bg-slate-800 text-slate-500",
                ].join(" ")}
              >
                {def.energyCost}
              </div>
              {/* Nom */}
              <p
                className={[
                  "truncate text-[9px] font-bold leading-tight",
                  canPlay
                    ? isSelected
                      ? "text-cyan-100"
                      : "text-slate-100"
                    : "text-slate-600",
                ].join(" ")}
              >
                {cardName}
              </p>
            </button>
          );
        })}
        {hand.length === 0 && (
          <p className="self-center text-xs text-gray-500">
            {t("combat.noCardsInHand")}
          </p>
        )}
      </div>

      <div className="hidden h-auto items-end justify-center gap-0 overflow-visible py-2 lg:flex">
        {hand.map((card, index) => {
          const def = cardDefs.get(card.definitionId);
          if (!def) return null;

          const canPlay = canPlayCard(combatState, card.instanceId, cardDefs);
          const canInked = canPlayCardInked(
            combatState,
            card.instanceId,
            cardDefs
          );
          const isFrozen = (
            combatState.playerDisruption?.frozenHandCardIds ?? []
          ).includes(card.instanceId);

          const isPlaying = playingCardId === card.instanceId;
          const isSelected = selectedCardId === card.instanceId;
          const isHovered = hoveredCardId === card.instanceId;

          const fanSpreadClass =
            hoveredIndex === -1 || isDiscarding || isPlaying
              ? ""
              : index < hoveredIndex
                ? "lg:-mr-1"
                : index > hoveredIndex
                  ? "lg:ml-1"
                  : "lg:mx-2";

          const stackClass = isSelected
            ? "z-[70]"
            : isHovered
              ? "z-[60]"
              : "z-10";

          const animationClass = isPlaying
            ? "animate-card-play"
            : isDiscarding
              ? "animate-card-discard"
              : "";

          return (
            <div
              key={card.instanceId}
              ref={(el) => {
                wrapperRefs.current[index] = el;
              }}
              className={[
                "relative shrink-0 transition-all duration-200",
                index > 0 && "ml-0 lg:-ml-10 xl:-ml-12",
                !isPlaying &&
                  !isDiscarding &&
                  (isHovered ? "-translate-y-3 lg:-translate-y-5" : ""),
                fanSpreadClass,
                stackClass,
                animationClass,
              ]
                .filter(Boolean)
                .join(" ")}
              onMouseEnter={() => setHoveredCardId(card.instanceId)}
              onMouseLeave={() =>
                setHoveredCardId((current) =>
                  current === card.instanceId ? null : current
                )
              }
            >
              <GameCard
                instanceId={card.instanceId}
                definition={def}
                canPlay={canPlay}
                canPlayInked={canInked}
                isSelected={isSelected}
                isPendingInked={isSelected && pendingInked}
                isFrozen={isFrozen}
                upgraded={card.upgraded}
                onClick={() => onPlayCard(card.instanceId, false)}
                onInkedClick={() => onPlayCard(card.instanceId, true)}
              />
            </div>
          );
        })}
        {hand.length === 0 && (
          <p className="text-sm text-gray-500">{t("combat.noCardsInHand")}</p>
        )}
      </div>

      {mobilePreviewCardId && mobilePreviewCard && mobilePreviewDef && (
        <div
          data-keep-selection="true"
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/65 p-2 lg:hidden"
          onClick={() => setMobilePreviewCardId(null)}
        >
          <div
            data-keep-selection="true"
            className="bg-slate-950/96 w-full max-w-[300px] rounded-xl border border-slate-600 p-3 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="shrink-0">
                <GameCard
                  instanceId={mobilePreviewCard.instanceId}
                  definition={mobilePreviewDef}
                  canPlay={canPlayCard(
                    combatState,
                    mobilePreviewCard.instanceId,
                    cardDefs
                  )}
                  canPlayInked={canPlayCardInked(
                    combatState,
                    mobilePreviewCard.instanceId,
                    cardDefs
                  )}
                  isSelected={selectedCardId === mobilePreviewCard.instanceId}
                  isPendingInked={
                    selectedCardId === mobilePreviewCard.instanceId &&
                    pendingInked
                  }
                  upgraded={mobilePreviewCard.upgraded}
                  onClick={() =>
                    onPlayCard(mobilePreviewCard.instanceId, false)
                  }
                  onInkedClick={() =>
                    onPlayCard(mobilePreviewCard.instanceId, true)
                  }
                />
              </div>
              <button
                type="button"
                data-keep-selection="true"
                className="w-full rounded-lg border border-emerald-300/30 bg-emerald-600 px-2 py-2 text-xs font-black uppercase tracking-wide text-white"
                onClick={() => {
                  if (mobilePreviewNeedsTarget) {
                    setMobilePreviewCardId(null);
                    return;
                  }
                  onPlayCard(mobilePreviewCard.instanceId, pendingInked);
                }}
              >
                {mobilePreviewNeedsTarget
                  ? t("combat.chooseTargetCta")
                  : t("combat.playCardCta")}
              </button>
              <button
                type="button"
                data-keep-selection="true"
                className="w-full rounded-lg border border-slate-600 px-2 py-1.5 text-xs font-semibold text-slate-200"
                onClick={() => setMobilePreviewCardId(null)}
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
