"use client";

import { useRef, useLayoutEffect } from "react";
import type { RefObject } from "react";
import type { CardInstance, CardDefinition } from "@/game/schemas/cards";
import type { CombatState } from "@/game/schemas/combat-state";
import { canPlayCard, canPlayCardInked } from "@/game/engine/cards";
import { GameCard } from "./GameCard";

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
  // One wrapper ref per card slot — used to set per-card CSS vars for the
  // discard animation so each card flies toward the discard pile button,
  // and for the play animation so the card flies toward the enemy row.
  const wrapperRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Discard animation: calculate per-card trajectories toward the discard button.
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

  // Play animation: set CSS vars so the played card flies toward the enemy row.
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
    <div className="flex h-[72px] items-end justify-center gap-1 overflow-visible py-0.5 lg:h-auto lg:gap-2 lg:py-2 [@media(max-height:540px)]:h-[60px] [@media(max-height:540px)]:gap-0.5 [@media(max-height:540px)]:py-0">
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

        return (
          <div
            key={card.instanceId}
            ref={(el) => {
              wrapperRefs.current[index] = el;
            }}
            className={
              isPlaying
                ? "animate-card-play"
                : isDiscarding
                  ? "animate-card-discard"
                  : undefined
            }
          >
            <GameCard
              instanceId={card.instanceId}
              definition={def}
              canPlay={canPlay}
              canPlayInked={canInked}
              isSelected={selectedCardId === card.instanceId}
              isPendingInked={
                selectedCardId === card.instanceId && pendingInked
              }
              isFrozen={isFrozen}
              upgraded={card.upgraded}
              onClick={() => {
                // Always route through onPlayCard so handlePlayCard sets pendingInked correctly
                onPlayCard(card.instanceId, false);
              }}
              onInkedClick={() => {
                // Always pass useInked=true — handlePlayCard handles targeting
                onPlayCard(card.instanceId, true);
              }}
            />
          </div>
        );
      })}
      {hand.length === 0 && (
        <p className="text-sm text-gray-500">No cards in hand</p>
      )}
    </div>
  );
}
