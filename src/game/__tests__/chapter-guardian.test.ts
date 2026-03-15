import { describe, expect, it } from "vitest";
import { buildCardDefsMap, buildEnemyDefsMap } from "../data";
import { playCard } from "../engine/cards";
import { endPlayerTurn } from "../engine/combat";
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
const cardDefs = buildCardDefsMap();

function makeCard(instanceId: string, definitionId: string) {
  return { instanceId, definitionId, upgraded: false };
}

describe("chapter guardian", () => {
  it("caps damage while Martial Binding is active and drops the cap on the breaking attack", () => {
    let state = makeMinimalCombat({
      player: {
        ...makeMinimalCombat().player,
        energyCurrent: 10,
        energyMax: 10,
      },
      hand: [
        makeCard("atk-1", "heavy_strike"),
        makeCard("atk-2", "heavy_strike"),
        makeCard("atk-3", "heavy_strike"),
      ],
      enemies: [
        {
          instanceId: "boss-1",
          definitionId: "chapter_guardian",
          name: "Chapter Guardian",
          currentHp: 120,
          maxHp: 145,
          block: 0,
          mechanicFlags: {},
          speed: 5,
          buffs: [],
          intentIndex: 0,
        },
      ],
    });

    state = playCard(
      state,
      "atk-1",
      "boss-1",
      false,
      cardDefs,
      createRNG("guardian-martial-1")
    );
    expect(state.enemies[0]?.currentHp).toBe(112);

    state = playCard(
      state,
      "atk-2",
      "boss-1",
      false,
      cardDefs,
      createRNG("guardian-martial-2")
    );
    expect(state.enemies[0]?.currentHp).toBe(104);

    state = playCard(
      state,
      "atk-3",
      "boss-1",
      false,
      cardDefs,
      createRNG("guardian-martial-3")
    );
    expect(state.enemies[0]?.currentHp).toBe(92);
    expect(
      state.enemies[0]?.mechanicFlags?.chapter_guardian_binding_martial_active
    ).toBe(0);
  });

  it("opens the chapter when the last binding breaks and forces a Rebind turn", () => {
    const def = enemyDefs.get("chapter_guardian");
    expect(def).toBeDefined();
    if (!def) return;

    let state = makeMinimalCombat({
      player: {
        ...makeMinimalCombat().player,
        energyCurrent: 5,
        energyMax: 5,
      },
      hand: [makeCard("atk-open", "heavy_strike")],
      enemies: [
        {
          instanceId: "boss-1",
          definitionId: "chapter_guardian",
          name: "Chapter Guardian",
          currentHp: 100,
          maxHp: 145,
          block: 20,
          mechanicFlags: {
            chapter_guardian_binding_martial_active: 1,
            chapter_guardian_binding_script_active: 0,
            chapter_guardian_binding_ink_active: 0,
            chapter_guardian_turn_attacks: 2,
          },
          speed: 5,
          buffs: [],
          intentIndex: 0,
        },
      ],
    });

    state = playCard(
      state,
      "atk-open",
      "boss-1",
      false,
      cardDefs,
      createRNG("guardian-open-attack")
    );

    expect(state.enemies[0]?.block).toBe(0);
    expect(state.enemies[0]?.currentHp).toBe(82);
    expect(state.enemies[0]?.mechanicFlags?.chapter_guardian_open_chapter).toBe(
      1
    );

    const ended = endPlayerTurn(state);
    expect(ended.enemies[0]?.intentIndex).toBe(6);
    expect(ended.enemies[0]?.mechanicFlags?.chapter_guardian_open_chapter).toBe(
      0
    );
    expect(
      ended.enemies[0]?.mechanicFlags?.chapter_guardian_rebind_pending
    ).toBe(1);

    const rebound = executeOneEnemyTurn(
      ended,
      ended.enemies[0]!,
      def,
      createRNG("guardian-rebind-turn"),
      enemyDefs
    );

    expect(rebound.player.currentHp).toBe(80);
    expect(rebound.enemies[0]?.block).toBe(12);
    expect(
      rebound.enemies[0]?.mechanicFlags?.chapter_guardian_binding_martial_active
    ).toBe(1);
    expect(
      rebound.enemies[0]?.mechanicFlags?.chapter_guardian_binding_script_active
    ).toBe(1);
    expect(
      rebound.enemies[0]?.mechanicFlags?.chapter_guardian_binding_ink_active
    ).toBe(1);
    expect(
      rebound.enemies[0]?.mechanicFlags?.chapter_guardian_rebind_pending
    ).toBe(0);
  });

  it("punishes the first block gain each turn and breaks Script Binding at 12 block", () => {
    let state = makeMinimalCombat({
      player: {
        ...makeMinimalCombat().player,
        energyCurrent: 5,
        energyMax: 5,
      },
      hand: [makeCard("skill-1", "fortify"), makeCard("skill-2", "fortify")],
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
          intentIndex: 0,
        },
      ],
    });

    state = playCard(
      state,
      "skill-1",
      null,
      false,
      cardDefs,
      createRNG("guardian-script-1")
    );
    expect(state.player.block).toBe(8);
    expect(state.enemies[0]?.block).toBe(6);

    state = playCard(
      state,
      "skill-2",
      null,
      false,
      cardDefs,
      createRNG("guardian-script-2")
    );
    expect(state.player.block).toBe(16);
    expect(state.enemies[0]?.block).toBe(6);
    expect(
      state.enemies[0]?.mechanicFlags?.chapter_guardian_binding_script_active
    ).toBe(0);
  });

  it("adds a single clog on the first ink spend and breaks Ink Binding at 3 ink", () => {
    let state = makeMinimalCombat({
      player: {
        ...makeMinimalCombat().player,
        energyCurrent: 5,
        energyMax: 5,
        inkCurrent: 4,
        inkMax: 10,
      },
      hand: [
        makeCard("ink-1", "heavy_strike"),
        makeCard("ink-2", "heavy_strike"),
      ],
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
          intentIndex: 0,
        },
      ],
    });

    state = playCard(
      state,
      "ink-1",
      "boss-1",
      true,
      cardDefs,
      createRNG("guardian-ink-1")
    );
    expect(
      state.discardPile.filter(
        (card) => card.definitionId === "haunting_regret"
      )
    ).toHaveLength(1);

    state = playCard(
      state,
      "ink-2",
      "boss-1",
      true,
      cardDefs,
      createRNG("guardian-ink-2")
    );
    expect(
      state.discardPile.filter(
        (card) => card.definitionId === "haunting_regret"
      )
    ).toHaveLength(1);
    expect(
      state.enemies[0]?.mechanicFlags?.chapter_guardian_binding_ink_active
    ).toBe(0);
  });

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
