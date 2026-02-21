"use client";

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
}

export function HandArea({
  hand,
  combatState,
  cardDefs,
  selectedCardId,
  pendingInked,
  onPlayCard,
}: HandAreaProps) {
  return (
    <div className="flex items-end justify-center gap-2 py-2">
      {hand.map((card) => {
        const def = cardDefs.get(card.definitionId);
        if (!def) return null;

        const canPlay = canPlayCard(combatState, card.instanceId, cardDefs);
        const canInked = canPlayCardInked(
          combatState,
          card.instanceId,
          cardDefs
        );

        return (
          <GameCard
            key={card.instanceId}
            instanceId={card.instanceId}
            definition={def}
            canPlay={canPlay}
            canPlayInked={canInked}
            isSelected={selectedCardId === card.instanceId}
            isPendingInked={selectedCardId === card.instanceId && pendingInked}
            onClick={() => {
              // Always route through onPlayCard so handlePlayCard sets pendingInked correctly
              onPlayCard(card.instanceId, false);
            }}
            onInkedClick={() => {
              // Always pass useInked=true — handlePlayCard handles targeting
              onPlayCard(card.instanceId, true);
            }}
          />
        );
      })}
      {hand.length === 0 && (
        <p className="text-sm text-gray-500">No cards in hand</p>
      )}
    </div>
  );
}
