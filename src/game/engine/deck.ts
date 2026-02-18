import type { CombatState } from "../schemas/combat-state";
import type { CardInstance } from "../schemas/cards";
import type { RNG } from "./rng";

export function shuffleDeck(pile: CardInstance[], rng: RNG): CardInstance[] {
  return rng.shuffle(pile);
}

export function reshuffleDiscardIntoDraw(
  state: CombatState,
  rng: RNG
): CombatState {
  const newDrawPile = rng.shuffle([...state.discardPile]);
  return {
    ...state,
    drawPile: newDrawPile,
    discardPile: [],
  };
}

export function drawCards(
  state: CombatState,
  count: number,
  rng: RNG
): CombatState {
  let current = { ...state };
  const drawn: CardInstance[] = [...current.hand];
  let remaining = count;

  while (remaining > 0) {
    if (current.drawPile.length === 0 && current.discardPile.length === 0) {
      break;
    }

    if (current.drawPile.length === 0) {
      current = reshuffleDiscardIntoDraw(current, rng);
    }

    const card = current.drawPile[0];
    if (!card) break;

    drawn.push(card);
    current = {
      ...current,
      drawPile: current.drawPile.slice(1),
    };
    remaining--;
  }

  return {
    ...current,
    hand: drawn,
  };
}

export function discardHand(state: CombatState): CombatState {
  return {
    ...state,
    discardPile: [...state.discardPile, ...state.hand],
    hand: [],
  };
}

export function moveCardToDiscard(
  state: CombatState,
  instanceId: string
): CombatState {
  const cardIndex = state.hand.findIndex((c) => c.instanceId === instanceId);
  if (cardIndex === -1) return state;

  const card = state.hand[cardIndex]!;
  return {
    ...state,
    hand: state.hand.filter((_, i) => i !== cardIndex),
    discardPile: [...state.discardPile, card],
  };
}

export function moveCardToExhaust(
  state: CombatState,
  instanceId: string
): CombatState {
  const cardIndex = state.hand.findIndex((c) => c.instanceId === instanceId);
  if (cardIndex === -1) return state;

  const card = state.hand[cardIndex]!;
  return {
    ...state,
    hand: state.hand.filter((_, i) => i !== cardIndex),
    exhaustPile: [...state.exhaustPile, card],
  };
}

export function moveFromDiscardToHand(
  state: CombatState,
  instanceId: string
): CombatState {
  const cardIndex = state.discardPile.findIndex(
    (c) => c.instanceId === instanceId
  );
  if (cardIndex === -1) return state;

  const card = state.discardPile[cardIndex]!;
  return {
    ...state,
    discardPile: state.discardPile.filter((_, i) => i !== cardIndex),
    hand: [...state.hand, card],
  };
}
