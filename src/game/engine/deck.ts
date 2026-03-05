import type { CombatState } from "../schemas/combat-state";
import type { CardInstance } from "../schemas/cards";
import { GAME_CONSTANTS } from "../constants";
import type { RNG } from "./rng";

export type DrawSource = "PLAYER" | "ENEMY" | "SYSTEM";
const MAX_DRAW_DEBUG_EVENTS = 20;

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
  rng: RNG,
  source: DrawSource = "PLAYER",
  reason = "GENERIC"
): CombatState {
  let current = { ...state };
  const drawn: CardInstance[] = [...current.hand];
  let remaining = count;
  let pendingOverflow = Math.max(0, current.pendingHandOverflowExhaust ?? 0);
  const handBefore = drawn.length;
  let movedToHand = 0;
  let movedToDiscard = 0;
  let exhaustedOverflow = 0;
  const frozen = new Set(current.playerDisruption?.frozenHandCardIds ?? []);
  let freezeRemaining = current.playerDisruption?.freezeNextDrawsRemaining ?? 0;
  let drawsToDiscard = current.playerDisruption?.drawsToDiscardRemaining ?? 0;
  const isCurseLikeDefinitionId = (definitionId: string): boolean =>
    definitionId === "haunting_regret" ||
    definitionId === "hexed_parchment" ||
    definitionId.includes("curse");

  while (remaining > 0) {
    if (current.drawPile.length === 0 && current.discardPile.length === 0) {
      break;
    }

    if (current.drawPile.length === 0) {
      current = reshuffleDiscardIntoDraw(current, rng);
    }

    const card = current.drawPile[0];
    if (!card) break;

    if (drawsToDiscard > 0) {
      drawsToDiscard--;
      movedToDiscard++;
      current = {
        ...current,
        discardPile: [...current.discardPile, card],
      };
    } else {
      const exhaustFirstCursePending = Boolean(
        current.relicFlags?.first_curse_draw_exhaust_pending
      );
      if (
        exhaustFirstCursePending &&
        isCurseLikeDefinitionId(card.definitionId)
      ) {
        current = {
          ...current,
          exhaustPile: [...current.exhaustPile, card],
          relicFlags: {
            ...(current.relicFlags ?? {}),
            first_curse_draw_exhaust_pending: false,
          },
        };
      } else if (
        drawn.length >= GAME_CONSTANTS.MAX_HAND_SIZE &&
        source !== "PLAYER"
      ) {
        // Overflow safety: cards drawn beyond hand cap are exhausted.
        exhaustedOverflow++;
        current = {
          ...current,
          exhaustPile: [...current.exhaustPile, card],
        };
      } else {
        drawn.push(card);
        movedToHand++;
        if (
          drawn.length > GAME_CONSTANTS.MAX_HAND_SIZE &&
          source === "PLAYER"
        ) {
          pendingOverflow++;
        }
        if (freezeRemaining > 0) {
          frozen.add(card.instanceId);
          freezeRemaining--;
        }
      }
    }
    current = {
      ...current,
      drawPile: current.drawPile.slice(1),
    };
    remaining--;
  }

  let next: CombatState = {
    ...current,
    hand: drawn,
    pendingHandOverflowExhaust: pendingOverflow,
    drawDebugHistory: [
      ...(current.drawDebugHistory ?? []),
      {
        turnNumber: state.turnNumber,
        phase: state.phase,
        source,
        reason,
        requested: Math.max(0, count),
        movedToHand,
        movedToDiscard,
        exhaustedOverflow,
        handBefore,
        handAfter: drawn.length,
        pendingOverflowAfter: pendingOverflow,
      },
    ].slice(-MAX_DRAW_DEBUG_EVENTS),
    playerDisruption: {
      ...current.playerDisruption,
      drawsToDiscardRemaining: drawsToDiscard,
      freezeNextDrawsRemaining: freezeRemaining,
      frozenHandCardIds: [...frozen],
    },
  };

  if (movedToHand > 0 && next.phase === "PLAYER_TURN" && source !== "ENEMY") {
    const drawCountBefore = Math.max(
      0,
      Math.floor(next.relicCounters?.turn_drawn_count ?? 0)
    );
    const drawCountAfter = drawCountBefore + movedToHand;
    next = {
      ...next,
      relicCounters: {
        ...(next.relicCounters ?? {}),
        turn_drawn_count: drawCountAfter,
      },
    };
    if (next.relicFlags?.rusalka_teardrop_active) {
      const granted = Math.max(
        0,
        Math.floor(next.relicCounters?.turn_rusalka_focus_granted ?? 0)
      );
      if (drawCountBefore < 3 && drawCountAfter >= 3 && granted === 0) {
        next = {
          ...next,
          player: {
            ...next.player,
            focus: next.player.focus + 1,
          },
          relicCounters: {
            ...(next.relicCounters ?? {}),
            turn_drawn_count: drawCountAfter,
            turn_rusalka_focus_granted: 1,
          },
        };
      }
    }
  }

  return next;
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

export function exhaustCardFromHandForOverflow(
  state: CombatState,
  instanceId: string
): CombatState {
  if ((state.pendingHandOverflowExhaust ?? 0) <= 0) return state;
  const next = moveCardToExhaust(state, instanceId);
  if (next === state) return state;
  return {
    ...next,
    pendingHandOverflowExhaust: Math.max(
      0,
      (next.pendingHandOverflowExhaust ?? 0) - 1
    ),
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
