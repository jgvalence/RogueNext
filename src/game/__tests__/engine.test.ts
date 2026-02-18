import { describe, it, expect } from "vitest";
import { createRNG } from "../engine/rng";
import {
  drawCards,
  discardHand,
  moveCardToDiscard,
  moveCardToExhaust,
  moveFromDiscardToHand,
} from "../engine/deck";
import { calculateDamage, applyDamage, applyBlock } from "../engine/damage";
import {
  applyBuff,
  getBuffStacks,
  tickBuffs,
  applyPoison,
} from "../engine/buffs";
import { canPlayCard, playCard } from "../engine/cards";
import {
  gainInk,
  spendInk,
  canUseInkPower,
  applyInkPower,
} from "../engine/ink";
import {
  initCombat,
  endPlayerTurn,
  executeAlliesEnemiesTurn,
  checkCombatEnd,
} from "../engine/combat";
import { createNewRun, generateFloorMap, selectRoom } from "../engine/run";
import { generateCombatRewards, addCardToRunDeck } from "../engine/rewards";
import { applyRelicsOnCombatStart } from "../engine/relics";
import { resolveEffects, type EffectContext } from "../engine/effects";
import type { CombatState } from "../schemas/combat-state";
import type { Effect } from "../schemas/effects";
import { buildCardDefsMap, buildEnemyDefsMap } from "../data";

// ============================
// Helpers
// ============================

function makeMinimalCombat(overrides?: Partial<CombatState>): CombatState {
  return {
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
      inkPerCardPlayed: 0,
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
    drawPile: [
      { instanceId: "c1", definitionId: "strike", upgraded: false },
      { instanceId: "c2", definitionId: "strike", upgraded: false },
      { instanceId: "c3", definitionId: "defend", upgraded: false },
    ],
    hand: [],
    discardPile: [],
    exhaustPile: [],
    inkPowerUsedThisTurn: false,
    ...overrides,
  };
}

const cardDefs = buildCardDefsMap();
const enemyDefs = buildEnemyDefsMap();

// ============================
// RNG Tests
// ============================

describe("RNG", () => {
  it("produces deterministic sequences", () => {
    const rng1 = createRNG("test-seed");
    const rng2 = createRNG("test-seed");
    const seq1 = Array.from({ length: 10 }, () => rng1.next());
    const seq2 = Array.from({ length: 10 }, () => rng2.next());
    expect(seq1).toEqual(seq2);
  });

  it("produces different sequences for different seeds", () => {
    const rng1 = createRNG("seed-a");
    const rng2 = createRNG("seed-b");
    expect(rng1.next()).not.toBe(rng2.next());
  });

  it("nextInt returns values in range", () => {
    const rng = createRNG("range-test");
    for (let i = 0; i < 100; i++) {
      const val = rng.nextInt(1, 10);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(10);
    }
  });

  it("shuffle preserves elements", () => {
    const rng = createRNG("shuffle-test");
    const arr = [1, 2, 3, 4, 5];
    const shuffled = rng.shuffle(arr);
    expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

// ============================
// Deck Tests
// ============================

describe("Deck operations", () => {
  it("draws cards from draw pile to hand", () => {
    const rng = createRNG("deck-test");
    const state = makeMinimalCombat();
    const result = drawCards(state, 2, rng);
    expect(result.hand).toHaveLength(2);
    expect(result.drawPile).toHaveLength(1);
  });

  it("reshuffles discard into draw when draw pile empty", () => {
    const rng = createRNG("reshuffle-test");
    const state = makeMinimalCombat({
      drawPile: [],
      discardPile: [
        { instanceId: "c1", definitionId: "strike" },
        { instanceId: "c2", definitionId: "defend" },
      ],
    });
    const result = drawCards(state, 1, rng);
    expect(result.hand).toHaveLength(1);
    expect(result.drawPile.length + result.discardPile.length).toBe(1);
  });

  it("stops drawing when both piles are empty", () => {
    const rng = createRNG("empty-test");
    const state = makeMinimalCombat({
      drawPile: [{ instanceId: "c1", definitionId: "strike" }],
      discardPile: [],
    });
    const result = drawCards(state, 5, rng);
    expect(result.hand).toHaveLength(1);
  });

  it("discardHand moves all hand cards to discard", () => {
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "strike" },
        { instanceId: "c2", definitionId: "defend" },
      ],
    });
    const result = discardHand(state);
    expect(result.hand).toHaveLength(0);
    expect(result.discardPile).toHaveLength(2);
  });

  it("moveCardToDiscard moves specific card", () => {
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "strike" },
        { instanceId: "c2", definitionId: "defend" },
      ],
    });
    const result = moveCardToDiscard(state, "c1");
    expect(result.hand).toHaveLength(1);
    expect(result.hand[0]?.instanceId).toBe("c2");
    expect(result.discardPile).toHaveLength(1);
  });

  it("moveCardToExhaust moves card to exhaust pile", () => {
    const state = makeMinimalCombat({
      hand: [{ instanceId: "c1", definitionId: "strike" }],
    });
    const result = moveCardToExhaust(state, "c1");
    expect(result.hand).toHaveLength(0);
    expect(result.exhaustPile).toHaveLength(1);
  });

  it("moveFromDiscardToHand retrieves card", () => {
    const state = makeMinimalCombat({
      discardPile: [{ instanceId: "c1", definitionId: "strike" }],
    });
    const result = moveFromDiscardToHand(state, "c1");
    expect(result.discardPile).toHaveLength(0);
    expect(result.hand).toHaveLength(1);
  });
});

// ============================
// Damage Tests
// ============================

describe("Damage calculation", () => {
  it("adds strength to base damage", () => {
    const dmg = calculateDamage(6, { strength: 3, buffs: [] }, { buffs: [] });
    expect(dmg).toBe(9);
  });

  it("applies weak debuff (-25%)", () => {
    const dmg = calculateDamage(
      8,
      { strength: 0, buffs: [{ type: "WEAK", stacks: 1 }] },
      { buffs: [] }
    );
    expect(dmg).toBe(6); // floor(8 * 0.75)
  });

  it("applies vulnerable debuff (+50%)", () => {
    const dmg = calculateDamage(
      10,
      { strength: 0, buffs: [] },
      { buffs: [{ type: "VULNERABLE", stacks: 1 }] }
    );
    expect(dmg).toBe(15);
  });

  it("applies both weak and vulnerable", () => {
    const dmg = calculateDamage(
      10,
      { strength: 0, buffs: [{ type: "WEAK", stacks: 1 }] },
      { buffs: [{ type: "VULNERABLE", stacks: 1 }] }
    );
    // floor(10 * 0.75) = 7, then floor(7 * 1.5) = 10
    expect(dmg).toBe(10);
  });

  it("block absorbs damage", () => {
    const result = applyDamage({ currentHp: 80, block: 5 }, 8);
    expect(result.block).toBe(0);
    expect(result.currentHp).toBe(77); // 80 - (8 - 5)
  });

  it("block fully absorbs weak attack", () => {
    const result = applyDamage({ currentHp: 80, block: 10 }, 6);
    expect(result.block).toBe(4);
    expect(result.currentHp).toBe(80);
  });

  it("applyBlock adds focus bonus", () => {
    expect(applyBlock(0, 5, 2)).toBe(7);
  });
});

// ============================
// Buffs Tests
// ============================

describe("Buffs", () => {
  it("stacks buffs of same type", () => {
    let buffs = applyBuff([], "STRENGTH", 2);
    buffs = applyBuff(buffs, "STRENGTH", 3);
    expect(getBuffStacks(buffs, "STRENGTH")).toBe(5);
  });

  it("tickBuffs decrements durations", () => {
    const buffs = [{ type: "VULNERABLE" as const, stacks: 1, duration: 2 }];
    const ticked = tickBuffs(buffs);
    expect(ticked[0]?.duration).toBe(1);
  });

  it("tickBuffs removes expired buffs", () => {
    const buffs = [{ type: "WEAK" as const, stacks: 1, duration: 1 }];
    const ticked = tickBuffs(buffs);
    expect(ticked).toHaveLength(0);
  });

  it("permanent buffs persist through ticks", () => {
    const buffs = [{ type: "STRENGTH" as const, stacks: 2 }];
    const ticked = tickBuffs(buffs);
    expect(ticked).toHaveLength(1);
    expect(getBuffStacks(ticked, "STRENGTH")).toBe(2);
  });

  it("poison deals damage and reduces stacks", () => {
    const entity = {
      currentHp: 20,
      buffs: [{ type: "POISON" as const, stacks: 3 }],
    };
    const result = applyPoison(entity);
    expect(result.currentHp).toBe(17);
    expect(getBuffStacks(result.buffs, "POISON")).toBe(2);
  });

  it("poison removes buff when stacks reach 1", () => {
    const entity = {
      currentHp: 20,
      buffs: [{ type: "POISON" as const, stacks: 1 }],
    };
    const result = applyPoison(entity);
    expect(result.currentHp).toBe(19);
    expect(getBuffStacks(result.buffs, "POISON")).toBe(0);
  });
});

// ============================
// Card Playing Tests
// ============================

describe("Card playing", () => {
  it("canPlayCard returns true with enough energy", () => {
    const state = makeMinimalCombat({
      hand: [{ instanceId: "c1", definitionId: "strike" }],
    });
    expect(canPlayCard(state, "c1", cardDefs)).toBe(true);
  });

  it("canPlayCard returns false without enough energy", () => {
    const state = makeMinimalCombat({
      hand: [{ instanceId: "c1", definitionId: "strike" }],
      player: {
        ...makeMinimalCombat().player,
        energyCurrent: 0,
      },
    });
    expect(canPlayCard(state, "c1", cardDefs)).toBe(false);
  });

  it("playCard deals damage and moves card to discard", () => {
    const rng = createRNG("play-test");
    const state = makeMinimalCombat({
      hand: [{ instanceId: "c1", definitionId: "strike" }],
    });
    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    // Strike deals 6 damage
    expect(result.enemies[0]?.currentHp).toBe(14 - 6);
    // Card moved to discard
    expect(result.hand).toHaveLength(0);
    expect(result.discardPile).toHaveLength(1);
    // Energy spent
    expect(result.player.energyCurrent).toBe(2);
    // Ink gained
    expect(result.player.inkCurrent).toBe(1);
  });

  it("playCard with inked variant costs ink and deals more damage", () => {
    const rng = createRNG("inked-test");
    const state = makeMinimalCombat({
      hand: [{ instanceId: "c1", definitionId: "heavy_strike" }],
      player: {
        ...makeMinimalCombat().player,
        inkCurrent: 5,
      },
    });
    const result = playCard(state, "c1", "e1", true, cardDefs, rng);

    // Heavy Strike inked deals 18 damage
    expect(result.enemies[0]?.currentHp).toBe(14 - 18);
    // Ink spent: 2 (inkMarkCost) then +1 (ink per card played)
    expect(result.player.inkCurrent).toBe(5 - 2 + 1);
  });
});

// ============================
// Ink System Tests
// ============================

describe("Ink system", () => {
  it("gainInk caps at inkMax", () => {
    const state = makeMinimalCombat({
      player: { ...makeMinimalCombat().player, inkCurrent: 9, inkMax: 10 },
    });
    const result = gainInk(state, 5);
    expect(result.player.inkCurrent).toBe(10);
  });

  it("spendInk returns null if insufficient", () => {
    const state = makeMinimalCombat({
      player: { ...makeMinimalCombat().player, inkCurrent: 1 },
    });
    expect(spendInk(state, 3)).toBeNull();
  });

  it("canUseInkPower REWRITE requires cards in discard", () => {
    const state = makeMinimalCombat({
      player: { ...makeMinimalCombat().player, inkCurrent: 5 },
      discardPile: [],
    });
    expect(canUseInkPower(state, "REWRITE")).toBe(false);
  });

  it("applyInkPower SEAL grants block", () => {
    const rng = createRNG("seal-test");
    const state = makeMinimalCombat({
      player: { ...makeMinimalCombat().player, inkCurrent: 5 },
    });
    const result = applyInkPower(state, "SEAL", null, cardDefs, rng);
    expect(result.player.block).toBe(8);
    expect(result.player.inkCurrent).toBe(3); // 5 - 2
  });

  it("applyInkPower REWRITE moves card from discard to hand", () => {
    const rng = createRNG("rewrite-test");
    const state = makeMinimalCombat({
      player: { ...makeMinimalCombat().player, inkCurrent: 5 },
      discardPile: [{ instanceId: "c1", definitionId: "strike" }],
    });
    const result = applyInkPower(state, "REWRITE", "c1", cardDefs, rng);
    expect(result.discardPile).toHaveLength(0);
    expect(result.hand).toHaveLength(1);
    expect(result.player.inkCurrent).toBe(2); // 5 - 3
  });

  it("applyInkPower LOST_CHAPTER draws cards", () => {
    const rng = createRNG("lostchapter-test");
    const state = makeMinimalCombat({
      player: { ...makeMinimalCombat().player, inkCurrent: 5 },
    });
    const result = applyInkPower(state, "LOST_CHAPTER", null, cardDefs, rng);
    expect(result.hand).toHaveLength(2);
    expect(result.drawPile).toHaveLength(1);
    expect(result.player.inkCurrent).toBe(3); // 5 - 2
  });
});

// ============================
// Combat Flow Tests
// ============================

describe("Combat flow", () => {
  it("initCombat creates valid combat state with hand drawn", () => {
    const rng = createRNG("combat-init");
    const runState = createNewRun(
      "run-1",
      "combat-init",
      [...cardDefs.values()].filter((c) => c.isStarterCard),
      rng
    );

    const rng2 = createRNG("combat-init-2");
    const combat = initCombat(
      runState,
      ["ink_slime"],
      enemyDefs,
      cardDefs,
      rng2
    );

    expect(combat.phase).toBe("PLAYER_TURN");
    expect(combat.hand.length).toBeGreaterThan(0);
    expect(combat.enemies).toHaveLength(1);
    expect(combat.player.energyCurrent).toBe(3);
  });

  it("endPlayerTurn discards hand and changes phase", () => {
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "strike" },
        { instanceId: "c2", definitionId: "defend" },
      ],
    });
    const result = endPlayerTurn(state);
    expect(result.hand).toHaveLength(0);
    expect(result.discardPile).toHaveLength(2);
    expect(result.phase).toBe("ALLIES_ENEMIES_TURN");
  });

  it("executeAlliesEnemiesTurn makes enemies attack", () => {
    const rng = createRNG("enemy-turn");
    const state = makeMinimalCombat({
      phase: "ALLIES_ENEMIES_TURN",
    });
    const result = executeAlliesEnemiesTurn(state, enemyDefs, rng);

    // Ink Slime first ability (Splatter) deals 5 damage
    expect(result.player.currentHp).toBeLessThan(80);
  });

  it("checkCombatEnd detects victory when all enemies dead", () => {
    const state = makeMinimalCombat({
      enemies: [
        {
          instanceId: "e1",
          definitionId: "ink_slime",
          name: "Ink Slime",
          currentHp: 0,
          maxHp: 14,
          block: 0,
          speed: 2,
          buffs: [],
          intentIndex: 0,
        },
      ],
    });
    const result = checkCombatEnd(state);
    expect(result.phase).toBe("COMBAT_WON");
  });

  it("checkCombatEnd detects defeat when player dead", () => {
    const state = makeMinimalCombat({
      player: { ...makeMinimalCombat().player, currentHp: 0 },
    });
    const result = checkCombatEnd(state);
    expect(result.phase).toBe("COMBAT_LOST");
  });
});

// ============================
// Run Tests
// ============================

describe("Run management", () => {
  it("createNewRun creates a valid run state", () => {
    const rng = createRNG("new-run");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const run = createNewRun("run-1", "new-run", starterCards, rng);

    expect(run.status).toBe("IN_PROGRESS");
    expect(run.floor).toBe(1);
    expect(run.currentRoom).toBe(0);
    expect(run.playerCurrentHp).toBe(80);
    expect(run.deck).toHaveLength(starterCards.length);
    expect(run.map).toHaveLength(10);
  });

  it("generateFloorMap creates 10 room slots", () => {
    const rng = createRNG("map-gen");
    const map = generateFloorMap(1, rng);
    expect(map).toHaveLength(10);

    // First room has exactly 1 choice (always COMBAT)
    expect(map[0]).toHaveLength(1);
    expect(map[0]?.[0]?.type).toBe("COMBAT");

    // Boss room has exactly 1 choice (COMBAT)
    expect(map[9]).toHaveLength(1);
    expect(map[9]?.[0]?.type).toBe("COMBAT");
  });

  it("selectRoom marks room as completed", () => {
    const rng = createRNG("select-room");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const run = createNewRun("run-1", "select-room", starterCards, rng);

    const result = selectRoom(run, 0);
    expect(result.map[0]?.[0]?.completed).toBe(true);
  });
});

// ============================
// Rewards Tests
// ============================

describe("Rewards", () => {
  it("generateCombatRewards returns gold and card choices", () => {
    const rng = createRNG("rewards-test");
    const allCards = [...cardDefs.values()];
    const rewards = generateCombatRewards(1, 3, false, allCards, rng);

    expect(rewards.gold).toBeGreaterThan(0);
    expect(rewards.cardChoices).toHaveLength(3);
    // No starter cards in rewards
    expect(rewards.cardChoices.every((c) => !c.isStarterCard)).toBe(true);
  });

  it("boss rewards give more gold", () => {
    const rng1 = createRNG("rewards-normal");
    const rng2 = createRNG("rewards-boss");
    const allCards = [...cardDefs.values()];

    const normal = generateCombatRewards(1, 9, false, allCards, rng1);
    const boss = generateCombatRewards(1, 9, true, allCards, rng2);

    expect(boss.gold).toBeGreaterThan(normal.gold);
  });

  it("addCardToRunDeck adds a new card instance", () => {
    const rng = createRNG("add-card");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const run = createNewRun("run-1", "add-card", starterCards, rng);
    const deckSize = run.deck.length;

    const result = addCardToRunDeck(run, "heavy_strike");
    expect(result.deck).toHaveLength(deckSize + 1);
    expect(result.deck[result.deck.length - 1]?.definitionId).toBe(
      "heavy_strike"
    );
  });
});

// ============================
// Relics Tests
// ============================

describe("Relics", () => {
  it("ancient_quill increases ink max", () => {
    const state = makeMinimalCombat();
    const result = applyRelicsOnCombatStart(state, ["ancient_quill"]);
    expect(result.player.inkMax).toBe(12);
  });

  it("energy_crystal increases energy", () => {
    const state = makeMinimalCombat();
    const result = applyRelicsOnCombatStart(state, ["energy_crystal"]);
    expect(result.player.energyMax).toBe(4);
    expect(result.player.energyCurrent).toBe(4);
  });

  it("multiple relics stack", () => {
    const state = makeMinimalCombat();
    const result = applyRelicsOnCombatStart(state, [
      "ancient_quill",
      "energy_crystal",
      "bookmark",
    ]);
    expect(result.player.inkMax).toBe(12);
    expect(result.player.energyMax).toBe(4);
    expect(result.player.drawCount).toBe(6);
  });
});

describe("Debuff blocked by armor", () => {
  const rng = createRNG("debuff-block-test");

  function makeStateWithBlock(block: number): CombatState {
    const state = makeMinimalCombat();
    return {
      ...state,
      player: { ...state.player, block },
    };
  }

  const enemyCtx: EffectContext = {
    source: { type: "enemy", instanceId: "enemy-1" },
    target: "player",
  };

  it("debuffs are skipped when damage is fully blocked", () => {
    const state = makeStateWithBlock(10);
    const effects: Effect[] = [
      { type: "DAMAGE", value: 4 },
      { type: "APPLY_DEBUFF", value: 5, buff: "POISON" },
    ];
    const result = resolveEffects(state, effects, enemyCtx, rng);
    // Damage fully blocked: no poison applied
    expect(result.player.currentHp).toBe(state.player.currentHp);
    expect(getBuffStacks(result.player.buffs, "POISON")).toBe(0);
  });

  it("debuffs apply when damage gets through block", () => {
    const state = makeStateWithBlock(2);
    const effects: Effect[] = [
      { type: "DAMAGE", value: 4 },
      { type: "APPLY_DEBUFF", value: 5, buff: "POISON" },
    ];
    const result = resolveEffects(state, effects, enemyCtx, rng);
    // 4 dmg - 2 block = 2 actual damage
    expect(result.player.currentHp).toBe(state.player.currentHp - 2);
    expect(getBuffStacks(result.player.buffs, "POISON")).toBe(5);
  });

  it("ink drain is skipped when damage is fully blocked", () => {
    const state = makeStateWithBlock(10);
    const withInk = {
      ...state,
      player: { ...state.player, block: 10, inkCurrent: 5 },
    };
    const effects: Effect[] = [
      { type: "DAMAGE", value: 3 },
      { type: "DRAIN_INK", value: 3 },
    ];
    const result = resolveEffects(withInk, effects, enemyCtx, rng);
    expect(result.player.inkCurrent).toBe(5); // ink NOT drained
  });

  it("debuffs still apply when source is player (not blocked)", () => {
    const state = makeStateWithBlock(10);
    const playerCtx: EffectContext = {
      source: "player",
      target: "player",
    };
    const effects: Effect[] = [
      { type: "DAMAGE", value: 2 },
      { type: "APPLY_DEBUFF", value: 3, buff: "WEAK" },
    ];
    const result = resolveEffects(state, effects, playerCtx, rng);
    // Player self-effects should still apply debuffs regardless
    expect(getBuffStacks(result.player.buffs, "WEAK")).toBe(3);
  });
});
