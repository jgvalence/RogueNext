import { describe, expect, it } from "vitest";
import { buildEnemyDefsMap } from "../data";
import { executeOneEnemyTurn } from "../engine/enemies";
import { createRNG } from "../engine/rng";
import type { CombatState } from "../schemas/combat-state";

function makeMinimalCombat(overrides?: Partial<CombatState>): CombatState {
  return {
    floor: 1,
    enemyDamageScale: 1,
    turnNumber: 1,
    phase: "PLAYER_TURN",
    player: {
      currentHp: 80,
      maxHp: 80,
      block: 0,
      energyCurrent: 3,
      energyMax: 3,
      inkCurrent: 0,
      inkMax: 10,
      inkPerCardChance: 100,
      inkPerCardValue: 1,
      regenPerTurn: 0,
      firstHitDamageReductionPercent: 0,
      drawCount: 5,
      speed: 0,
      strength: 0,
      focus: 0,
      buffs: [],
    },
    allies: [],
    enemies: [
      {
        instanceId: "e1",
        definitionId: "ink_slime",
        name: "Ink Slime",
        currentHp: 14,
        maxHp: 14,
        block: 0,
        speed: 2,
        buffs: [],
        intentIndex: 0,
      },
    ],
    drawPile: [],
    hand: [],
    discardPile: [],
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
    ...overrides,
  };
}

const enemyDefs = buildEnemyDefsMap();

describe("chapter guardian", () => {
  it("Binding Curse adds a single haunting_regret to the draw pile", () => {
    const def = enemyDefs.get("chapter_guardian");
    expect(def).toBeDefined();
    if (!def) return;

    const state = makeMinimalCombat({
      enemies: [
        {
          instanceId: "boss-1",
          definitionId: "chapter_guardian",
          name: "Chapter Guardian",
          currentHp: 145,
          maxHp: 145,
          block: 0,
          mechanicFlags: {},
          speed: 5,
          buffs: [],
          intentIndex: 5,
        },
      ],
    });

    const result = executeOneEnemyTurn(
      state,
      state.enemies[0]!,
      def,
      createRNG("chapter-binding-curse"),
      enemyDefs
    );

    expect(result.hand).toHaveLength(0);
    expect(
      result.drawPile.filter((card) => card.definitionId === "haunting_regret")
    ).toHaveLength(1);
    expect(
      result.discardPile.filter(
        (card) => card.definitionId === "hexed_parchment"
      )
    ).toHaveLength(0);
  });
});
