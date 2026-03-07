import { describe, expect, it } from "vitest";
import type { CardInstance } from "@/game/schemas/cards";
import type { CombatState } from "@/game/schemas/combat-state";
import { starterCardDefinitions } from "@/game/data/starter-deck";
import {
  ensureFirstCombatTutorialInkedCardInHand,
  getFirstInkedCardInHand,
  getInkedCardTotalInkCost,
} from "@/game/engine/first-combat-tutorial";

function makeCard(instanceId: string, definitionId: string): CardInstance {
  return {
    instanceId,
    definitionId,
    upgraded: false,
  };
}

function makeCombatState(
  hand: CardInstance[],
  drawPile: CardInstance[],
  discardPile: CardInstance[] = []
): CombatState {
  return {
    floor: 1,
    difficultyLevel: 0,
    enemyDamageScale: 1,
    turnNumber: 1,
    phase: "PLAYER_TURN",
    player: {
      currentHp: 60,
      maxHp: 60,
      block: 0,
      energyCurrent: 3,
      energyMax: 3,
      inkCurrent: 0,
      inkMax: 5,
      inkPerCardChance: 0,
      inkPerCardValue: 1,
      regenPerTurn: 0,
      firstHitDamageReductionPercent: 0,
      drawCount: 4,
      speed: 0,
      strength: 0,
      focus: 0,
      buffs: [],
    },
    allies: [],
    enemies: [],
    drawPile,
    hand,
    discardPile,
    exhaustPile: [],
    pendingHandOverflowExhaust: 0,
    drawDebugHistory: [],
    inkPowerUsedThisTurn: false,
    firstHitReductionUsed: false,
    playerDisruption: {
      extraCardCost: 0,
      drawPenalty: 0,
      drawsToDiscardRemaining: 0,
      freezeNextDrawsRemaining: 0,
      frozenHandCardIds: [],
      disabledInkPowers: [],
    },
    nextPlayerDisruption: {
      extraCardCost: 0,
      drawPenalty: 0,
      drawsToDiscardRemaining: 0,
      freezeNextDrawsRemaining: 0,
      frozenHandCardIds: [],
      disabledInkPowers: [],
    },
    relicFlags: {},
    relicCounters: {},
    relicModifiers: {
      playerVulnerableDamageMultiplier: 1.5,
      enemyVulnerableDamageMultiplier: 1.5,
      playerPoisonDamageMultiplier: 1,
      enemyPoisonDamageMultiplier: 1,
      playerBleedDamageMultiplier: 1,
      enemyBleedDamageMultiplier: 1,
    },
  };
}

describe("first combat tutorial helpers", () => {
  const cardDefs = new Map(
    starterCardDefinitions.map((definition) => [definition.id, definition])
  );

  it("forces an inked starter card into the opening hand when missing", () => {
    const combat = makeCombatState(
      [
        makeCard("hand-strike-1", "strike"),
        makeCard("hand-strike-2", "strike"),
        makeCard("hand-defend-1", "defend"),
        makeCard("hand-ink-surge", "ink_surge"),
      ],
      [
        makeCard("draw-parchemin", "parchemin_de_soin"),
        makeCard("draw-strike-3", "strike"),
      ]
    );

    const nextCombat = ensureFirstCombatTutorialInkedCardInHand(
      combat,
      cardDefs
    );

    expect(getFirstInkedCardInHand(nextCombat, cardDefs)?.definitionId).toBe(
      "parchemin_de_soin"
    );
    expect(nextCombat.hand).toHaveLength(combat.hand.length);
    expect(nextCombat.drawPile).toHaveLength(combat.drawPile.length);
    expect(
      [...nextCombat.hand, ...nextCombat.drawPile]
        .map((card) => card.instanceId)
        .sort()
    ).toEqual(
      [...combat.hand, ...combat.drawPile].map((card) => card.instanceId).sort()
    );
  });

  it("does not mutate combat if an inked card is already in hand", () => {
    const combat = makeCombatState(
      [
        makeCard("hand-strike-1", "strike"),
        makeCard("hand-parchemin", "parchemin_de_soin"),
      ],
      [makeCard("draw-strike-2", "strike")]
    );

    const nextCombat = ensureFirstCombatTutorialInkedCardInHand(
      combat,
      cardDefs
    );

    expect(nextCombat).toBe(combat);
  });

  it("computes the total ink cost of an inked starter card", () => {
    const totalInkCost = getInkedCardTotalInkCost(
      makeCard("hand-parchemin", "parchemin_de_soin"),
      cardDefs
    );

    expect(totalInkCost).toBe(2);
  });
});
