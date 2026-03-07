import type { CardDefinition, CardInstance } from "../schemas/cards";
import type { CombatState } from "../schemas/combat-state";

function hasInkedVariant(
  card: CardInstance,
  cardDefs: Map<string, CardDefinition>
): boolean {
  return Boolean(cardDefs.get(card.definitionId)?.inkedVariant);
}

function findFirstInkedCardIndex(
  pile: CardInstance[],
  cardDefs: Map<string, CardDefinition>
): number {
  return pile.findIndex((card) => hasInkedVariant(card, cardDefs));
}

export function getFirstInkedCardInHand(
  combat: CombatState,
  cardDefs: Map<string, CardDefinition>
): CardInstance | null {
  return combat.hand.find((card) => hasInkedVariant(card, cardDefs)) ?? null;
}

export function getInkedCardTotalInkCost(
  card: CardInstance,
  cardDefs: Map<string, CardDefinition>
): number {
  const definition = cardDefs.get(card.definitionId);
  if (!definition?.inkedVariant) return 0;
  return definition.inkCost + definition.inkedVariant.inkMarkCost;
}

export function ensureFirstCombatTutorialInkedCardInHand(
  combat: CombatState,
  cardDefs: Map<string, CardDefinition>
): CombatState {
  if (getFirstInkedCardInHand(combat, cardDefs)) {
    return combat;
  }

  const drawPileIndex = findFirstInkedCardIndex(combat.drawPile, cardDefs);
  if (drawPileIndex >= 0) {
    const inkedCard = combat.drawPile[drawPileIndex]!;
    const replaceHandIndex = Math.max(
      0,
      combat.hand.findIndex((card) => !hasInkedVariant(card, cardDefs))
    );

    if (combat.hand.length === 0) {
      return {
        ...combat,
        hand: [inkedCard],
        drawPile: combat.drawPile.filter((_, index) => index !== drawPileIndex),
      };
    }

    const displacedCard = combat.hand[replaceHandIndex]!;
    const nextHand = [...combat.hand];
    nextHand[replaceHandIndex] = inkedCard;
    const nextDrawPile = [...combat.drawPile];
    nextDrawPile[drawPileIndex] = displacedCard;

    return {
      ...combat,
      hand: nextHand,
      drawPile: nextDrawPile,
    };
  }

  const discardPileIndex = findFirstInkedCardIndex(
    combat.discardPile,
    cardDefs
  );
  if (discardPileIndex >= 0) {
    const inkedCard = combat.discardPile[discardPileIndex]!;
    const nextDiscardPile = combat.discardPile.filter(
      (_, index) => index !== discardPileIndex
    );

    if (combat.hand.length === 0) {
      return {
        ...combat,
        hand: [inkedCard],
        discardPile: nextDiscardPile,
      };
    }

    const replaceHandIndex = Math.max(
      0,
      combat.hand.findIndex((card) => !hasInkedVariant(card, cardDefs))
    );
    const displacedCard = combat.hand[replaceHandIndex]!;
    const nextHand = [...combat.hand];
    nextHand[replaceHandIndex] = inkedCard;

    return {
      ...combat,
      hand: nextHand,
      discardPile: [...nextDiscardPile, displacedCard],
    };
  }

  return combat;
}
