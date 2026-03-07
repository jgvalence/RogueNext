"use client";

import { useRef, useLayoutEffect, useMemo, useState } from "react";
import type { RefObject } from "react";
import type { CardInstance, CardDefinition } from "@/game/schemas/cards";
import type { CombatState } from "@/game/schemas/combat-state";
import { canPlayCard, canPlayCardInked } from "@/game/engine/cards";
import { GameCard } from "./GameCard";
import { useTranslation } from "react-i18next";

interface HandAreaProps {
  hand: CardInstance[];
  combatState: CombatState;
  cardDefs: Map<string, CardDefinition>;
  selectedCardId: string | null;
  pendingInked: boolean;
  onPlayCard: (instanceId: string, useInked: boolean) => void;
  disableCardInteractions?: boolean;
  tutorialPlayableInkedCardId?: string | null;
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
  disableCardInteractions = false,
  tutorialPlayableInkedCardId = null,
  isDiscarding = false,
  discardBtnRef,
  playingCardId = null,
  enemyRowRef,
}: HandAreaProps) {
  const { t } = useTranslation();
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const hoveredIndex = useMemo(
    () => hand.findIndex((c) => c.instanceId === hoveredCardId),
    [hand, hoveredCardId]
  );

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

  return (
    <>
      <div
        data-keep-selection="true"
        className="relative z-30 flex h-[170px] w-full min-w-0 touch-pan-x items-end gap-0 overflow-x-auto overflow-y-visible overscroll-x-contain px-2 pb-1.5 pr-2 [-webkit-overflow-scrolling:touch] lg:hidden [@media(max-height:540px)]:h-[156px]"
      >
        <div className="mx-auto flex h-full w-max min-w-full items-end justify-center">
          {hand.map((card, index) => {
            const def = cardDefs.get(card.definitionId);
            if (!def) return null;

            const canPlay = canPlayCard(combatState, card.instanceId, cardDefs);
            const canInked = canPlayCardInked(
              combatState,
              card.instanceId,
              cardDefs
            );
            const isTutorialPlayableInkedCard =
              tutorialPlayableInkedCardId === card.instanceId;
            const cardInteractionsBlocked =
              disableCardInteractions ||
              (tutorialPlayableInkedCardId !== null &&
                !isTutorialPlayableInkedCard);
            const displayedCanPlay =
              tutorialPlayableInkedCardId !== null
                ? false
                : !cardInteractionsBlocked && canPlay;
            const displayedCanPlayInked = !cardInteractionsBlocked && canInked;
            const isFrozen = (
              combatState.playerDisruption?.frozenHandCardIds ?? []
            ).includes(card.instanceId);
            const isSelected = selectedCardId === card.instanceId;
            const fanOffset = index - (hand.length - 1) / 2;
            const fanRotateDeg = fanOffset * 2.6;
            const fanLiftPx = Math.max(0, 4.5 - Math.abs(fanOffset) * 1.25);
            const selectedLiftPx = isSelected ? 10 : fanLiftPx;

            return (
              <div
                key={`mobile-card-${card.instanceId}`}
                className="relative shrink-0 origin-bottom snap-start transition-all duration-200 ease-out"
                style={{
                  marginLeft: index === 0 ? 0 : -22,
                  transform: `translateY(-${selectedLiftPx}px) rotate(${fanRotateDeg}deg) scale(${isSelected ? 1.06 : 1})`,
                  zIndex: isSelected ? 90 : 30 + index,
                }}
              >
                <GameCard
                  instanceId={card.instanceId}
                  definition={def}
                  canPlay={displayedCanPlay}
                  canPlayInked={displayedCanPlayInked}
                  isSelected={isSelected}
                  isPendingInked={isSelected && pendingInked}
                  isFrozen={isFrozen}
                  upgraded={card.upgraded}
                  size="md"
                  className={[
                    "!h-[152px] !w-[88px] shadow-[0_10px_18px_rgba(2,6,23,0.45)] [@media(max-height:540px)]:!h-[140px] [@media(max-height:540px)]:!w-[82px]",
                    isTutorialPlayableInkedCard &&
                      "ring-2 ring-cyan-300/85 ring-offset-2 ring-offset-slate-950",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => onPlayCard(card.instanceId, false)}
                  onInkedClick={() => onPlayCard(card.instanceId, true)}
                />
              </div>
            );
          })}

          {hand.length === 0 && (
            <p className="self-center text-xs text-gray-500">
              {t("combat.noCardsInHand")}
            </p>
          )}
        </div>
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
          const isTutorialPlayableInkedCard =
            tutorialPlayableInkedCardId === card.instanceId;
          const cardInteractionsBlocked =
            disableCardInteractions ||
            (tutorialPlayableInkedCardId !== null &&
              !isTutorialPlayableInkedCard);
          const displayedCanPlay =
            tutorialPlayableInkedCardId !== null
              ? false
              : !cardInteractionsBlocked && canPlay;
          const displayedCanPlayInked = !cardInteractionsBlocked && canInked;
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
                canPlay={displayedCanPlay}
                canPlayInked={displayedCanPlayInked}
                isSelected={isSelected}
                isPendingInked={isSelected && pendingInked}
                isFrozen={isFrozen}
                upgraded={card.upgraded}
                className={
                  isTutorialPlayableInkedCard
                    ? "ring-2 ring-cyan-300/85 ring-offset-2 ring-offset-slate-950"
                    : undefined
                }
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
    </>
  );
}
