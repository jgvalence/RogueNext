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
  startPlayerTurn,
  endPlayerTurn,
  executeAlliesEnemiesTurn,
  checkCombatEnd,
} from "../engine/combat";
import {
  createGuaranteedRelicEvent,
  createNewRun,
  generateFloorMap,
  selectRoom,
  completeCombat,
  advanceFloor,
} from "../engine/run";
import { generateCombatRewards, addCardToRunDeck } from "../engine/rewards";
import { applyRelicsOnCombatStart } from "../engine/relics";
import { resolveEffects, type EffectContext } from "../engine/effects";
import { executeOneEnemyTurn } from "../engine/enemies";
import {
  computeUnlockedCardIds,
  getCardUnlockDetails,
} from "../engine/card-unlocks";
import type { CombatState } from "../schemas/combat-state";
import type { Effect } from "../schemas/effects";
import { DEFAULT_META_BONUSES } from "../schemas/meta";
import { GAME_CONSTANTS } from "../constants";
import { buildAllyDefsMap, buildCardDefsMap, buildEnemyDefsMap } from "../data";
import { relicDefinitions } from "../data/relics";

// ============================
// Helpers
// ============================

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
    drawPile: [
      { instanceId: "c1", definitionId: "strike", upgraded: false },
      { instanceId: "c2", definitionId: "strike", upgraded: false },
      { instanceId: "c3", definitionId: "defend", upgraded: false },
    ],
    hand: [],
    discardPile: [],
    exhaustPile: [],
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

const cardDefs = buildCardDefsMap();
const enemyDefs = buildEnemyDefsMap();
const allyDefs = buildAllyDefsMap();

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
        { instanceId: "c1", definitionId: "strike", upgraded: false },
        { instanceId: "c2", definitionId: "defend", upgraded: false },
      ],
    });
    const result = drawCards(state, 1, rng);
    expect(result.hand).toHaveLength(1);
    expect(result.drawPile.length + result.discardPile.length).toBe(1);
  });

  it("stops drawing when both piles are empty", () => {
    const rng = createRNG("empty-test");
    const state = makeMinimalCombat({
      drawPile: [{ instanceId: "c1", definitionId: "strike", upgraded: false }],
      discardPile: [],
    });
    const result = drawCards(state, 5, rng);
    expect(result.hand).toHaveLength(1);
  });

  it("discardHand moves all hand cards to discard", () => {
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "strike", upgraded: false },
        { instanceId: "c2", definitionId: "defend", upgraded: false },
      ],
    });
    const result = discardHand(state);
    expect(result.hand).toHaveLength(0);
    expect(result.discardPile).toHaveLength(2);
  });

  it("moveCardToDiscard moves specific card", () => {
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "strike", upgraded: false },
        { instanceId: "c2", definitionId: "defend", upgraded: false },
      ],
    });
    const result = moveCardToDiscard(state, "c1");
    expect(result.hand).toHaveLength(1);
    expect(result.hand[0]?.instanceId).toBe("c2");
    expect(result.discardPile).toHaveLength(1);
  });

  it("moveCardToExhaust moves card to exhaust pile", () => {
    const state = makeMinimalCombat({
      hand: [{ instanceId: "c1", definitionId: "strike", upgraded: false }],
    });
    const result = moveCardToExhaust(state, "c1");
    expect(result.hand).toHaveLength(0);
    expect(result.exhaustPile).toHaveLength(1);
  });

  it("moveFromDiscardToHand retrieves card", () => {
    const state = makeMinimalCombat({
      discardPile: [
        { instanceId: "c1", definitionId: "strike", upgraded: false },
      ],
    });
    const result = moveFromDiscardToHand(state, "c1");
    expect(result.discardPile).toHaveLength(0);
    expect(result.hand).toHaveLength(1);
  });

  it("can play a SELF heal card on an ally target", () => {
    const rng = createRNG("heal-ally-target");
    const healingScript = [...cardDefs.values()].find(
      (c) => c.name === "Healing Script"
    );
    expect(healingScript).toBeDefined();
    if (!healingScript) return;

    const state = makeMinimalCombat({
      hand: [
        {
          instanceId: "heal1",
          definitionId: healingScript.id,
          upgraded: false,
        },
      ],
      allies: [
        {
          instanceId: "a1",
          definitionId: "scribe_apprentice",
          name: "Scribe Apprentice",
          currentHp: 10,
          maxHp: 20,
          block: 0,
          speed: 7,
          buffs: [],
          intentIndex: 0,
        },
      ],
    });

    const result = playCard(state, "heal1", "a1", false, cardDefs, rng);
    expect(result.allies[0]?.currentHp).toBeGreaterThan(10);
    expect(result.player.currentHp).toBe(80);
  });

  it("can play a SELF block card on an ally target", () => {
    const rng = createRNG("block-ally-target");
    const fortify = [...cardDefs.values()].find((c) => c.name === "Fortify");
    expect(fortify).toBeDefined();
    if (!fortify) return;

    const state = makeMinimalCombat({
      hand: [
        {
          instanceId: "block1",
          definitionId: fortify.id,
          upgraded: false,
        },
      ],
      player: { ...makeMinimalCombat().player, block: 0 },
      allies: [
        {
          instanceId: "a1",
          definitionId: "scribe_apprentice",
          name: "Scribe Apprentice",
          currentHp: 20,
          maxHp: 20,
          block: 0,
          speed: 7,
          buffs: [],
          intentIndex: 0,
        },
      ],
    });

    const result = playCard(state, "block1", "a1", false, cardDefs, rng);
    expect(result.allies[0]?.block).toBeGreaterThan(0);
    expect(result.player.block).toBe(0);
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
      hand: [{ instanceId: "c1", definitionId: "strike", upgraded: false }],
    });
    expect(canPlayCard(state, "c1", cardDefs)).toBe(true);
  });

  it("canPlayCard returns false without enough energy", () => {
    const state = makeMinimalCombat({
      hand: [{ instanceId: "c1", definitionId: "strike", upgraded: false }],
      player: {
        ...makeMinimalCombat().player,
        energyCurrent: 0,
      },
    });
    expect(canPlayCard(state, "c1", cardDefs)).toBe(false);
  });

  it("cannot play CURSE cards", () => {
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "hexed_parchment", upgraded: false },
      ],
    });
    expect(canPlayCard(state, "c1", cardDefs)).toBe(false);
  });

  it("playCard deals damage and moves card to discard", () => {
    const rng = createRNG("play-test");
    const state = makeMinimalCombat({
      hand: [{ instanceId: "c1", definitionId: "strike", upgraded: false }],
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

  it("playCard does not gain extra ink when chance is 0%", () => {
    const rng = createRNG("no-ink-proc");
    const state = makeMinimalCombat({
      hand: [{ instanceId: "c1", definitionId: "strike", upgraded: false }],
      player: {
        ...makeMinimalCombat().player,
        inkPerCardChance: 0,
        inkPerCardValue: 3,
      },
    });
    const result = playCard(state, "c1", "e1", false, cardDefs, rng);
    expect(result.player.inkCurrent).toBe(0);
  });

  it("playCard gains configured ink value when chance procs", () => {
    const rng = createRNG("ink-proc-100");
    const state = makeMinimalCombat({
      hand: [{ instanceId: "c1", definitionId: "strike", upgraded: false }],
      player: {
        ...makeMinimalCombat().player,
        inkPerCardChance: 100,
        inkPerCardValue: 2,
      },
    });
    const result = playCard(state, "c1", "e1", false, cardDefs, rng);
    expect(result.player.inkCurrent).toBe(2);
  });

  it("playCard with inked variant costs ink and deals more damage", () => {
    const rng = createRNG("inked-test");
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "heavy_strike", upgraded: false },
      ],
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

  it("playCard upgraded also boosts inked variant effects", () => {
    const rng = createRNG("inked-upgraded-test");
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "heavy_strike", upgraded: true },
      ],
      player: {
        ...makeMinimalCombat().player,
        inkCurrent: 5,
      },
    });
    const result = playCard(state, "c1", "e1", true, cardDefs, rng);

    // Heavy Strike inked is 18; upgraded inked uses boosted effects => 27.
    expect(result.enemies[0]?.currentHp).toBe(14 - 27);
  });

  it("playCard inked lightning_bolt applies Vulnerable to all surviving enemies", () => {
    const rng = createRNG("inked-lightning-bolt-test");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "lightning_bolt", upgraded: false },
      ],
      player: {
        ...base.player,
        inkCurrent: 5,
      },
      enemies: [
        {
          ...base.enemies[0]!,
          instanceId: "e1",
          currentHp: 30,
          maxHp: 30,
          buffs: [],
        },
        {
          ...base.enemies[0]!,
          instanceId: "e2",
          currentHp: 28,
          maxHp: 28,
          buffs: [],
        },
      ],
    });

    const result = playCard(state, "c1", null, true, cardDefs, rng);

    expect(result.enemies[0]?.currentHp).toBe(18);
    expect(result.enemies[1]?.currentHp).toBe(16);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "VULNERABLE")).toBe(1);
    expect(getBuffStacks(result.enemies[1]?.buffs ?? [], "VULNERABLE")).toBe(1);
  });

  it("playCard exhausts POWER cards for the rest of combat", () => {
    const rng = createRNG("power-exhaust-test");
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "inner_focus", upgraded: false },
      ],
    });
    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.hand).toHaveLength(0);
    expect(result.discardPile).toHaveLength(0);
    expect(result.exhaustPile).toHaveLength(1);
    expect(result.exhaustPile[0]?.definitionId).toBe("inner_focus");
    expect(result.player.focus).toBe(2);
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
      discardPile: [
        { instanceId: "c1", definitionId: "strike", upgraded: false },
      ],
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
      allyDefs,
      cardDefs,
      rng2
    );

    expect(combat.phase).toBe("PLAYER_TURN");
    expect(combat.hand.length).toBeGreaterThan(0);
    expect(combat.enemies).toHaveLength(1);
    expect(combat.player.energyCurrent).toBe(3);
  });

  it("initCombat spawns recruited allies up to unlocked slots", () => {
    const rng = createRNG("combat-allies");
    const runState = createNewRun(
      "run-1",
      "combat-allies",
      [...cardDefs.values()].filter((c) => c.isStarterCard),
      rng,
      { ...DEFAULT_META_BONUSES, allySlots: 1 }
    );
    runState.allyIds = ["scribe_apprentice"];

    const combat = initCombat(
      runState,
      ["ink_slime"],
      enemyDefs,
      allyDefs,
      cardDefs,
      createRNG("combat-allies-2")
    );

    expect(combat.allies).toHaveLength(1);
    expect(combat.allies[0]?.definitionId).toBe("scribe_apprentice");
  });

  it("at difficulty 3, bosses start combat with +5 block per floor", () => {
    const rng = createRNG("combat-boss-start-block");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const runState = {
      ...createNewRun("run-1", "combat-boss-start-block", starterCards, rng),
      floor: 2,
      selectedDifficultyLevel: 3,
    };

    const combat = initCombat(
      runState,
      ["chapter_guardian"],
      enemyDefs,
      allyDefs,
      cardDefs,
      createRNG("combat-boss-start-block-2")
    );

    expect(combat.enemies[0]?.isBoss).toBe(true);
    expect(combat.enemies[0]?.block).toBe(10);
  });

  it("at difficulty 4, elites also start combat with +5 block per floor", () => {
    const rng = createRNG("combat-elite-start-block");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const runState = {
      ...createNewRun("run-1", "combat-elite-start-block", starterCards, rng),
      floor: 3,
      selectedDifficultyLevel: 4,
    };

    const combat = initCombat(
      runState,
      ["ink_archon"],
      enemyDefs,
      allyDefs,
      cardDefs,
      createRNG("combat-elite-start-block-2")
    );

    expect(combat.enemies[0]?.isElite).toBe(true);
    expect(combat.enemies[0]?.block).toBe(15);
  });

  it("endPlayerTurn discards hand and changes phase", () => {
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "strike", upgraded: false },
        { instanceId: "c2", definitionId: "defend", upgraded: false },
      ],
    });
    const result = endPlayerTurn(state);
    expect(result.hand).toHaveLength(0);
    expect(result.discardPile).toHaveLength(2);
    expect(result.phase).toBe("ALLIES_ENEMIES_TURN");
  });

  it("startPlayerTurn heals with regenPerTurn", () => {
    const rng = createRNG("regen-turn");
    const state = makeMinimalCombat({
      phase: "ALLIES_ENEMIES_TURN",
      player: {
        ...makeMinimalCombat().player,
        currentHp: 70,
        regenPerTurn: 3,
      },
    });
    const result = startPlayerTurn(state, rng);
    expect(result.player.currentHp).toBe(73);
  });

  it("executeAlliesEnemiesTurn makes enemies attack", () => {
    const rng = createRNG("enemy-turn");
    const state = makeMinimalCombat({
      phase: "ALLIES_ENEMIES_TURN",
    });
    const result = executeAlliesEnemiesTurn(state, enemyDefs, allyDefs, rng);

    // Ink Slime first ability (Splatter) deals 5 damage
    expect(result.player.currentHp).toBeLessThan(80);
  });

  it("ALLY_PRIORITY enemy attacks hit an ally first when one is alive", () => {
    const rng = createRNG("enemy-target-ally");
    const state = makeMinimalCombat({
      player: { ...makeMinimalCombat().player, currentHp: 80 },
      allies: [
        {
          instanceId: "ally-1",
          definitionId: "scribe_apprentice",
          name: "Scribe Apprentice",
          currentHp: 8,
          maxHp: 20,
          block: 0,
          speed: 7,
          buffs: [],
          intentIndex: 0,
        },
      ],
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
    });
    const enemy = state.enemies[0]!;
    const baseDef = enemyDefs.get(enemy.definitionId);
    expect(baseDef).toBeDefined();
    if (!baseDef) return;
    const def = {
      ...baseDef,
      abilities: baseDef.abilities.map((a, i) =>
        i === 0 ? { ...a, target: "ALLY_PRIORITY" as const } : a
      ),
    };

    const result = executeOneEnemyTurn(state, enemy, def, rng, enemyDefs);
    expect(result.allies[0]?.currentHp).toBeLessThan(8);
    expect(result.player.currentHp).toBe(80);
  });

  it("legacy damage fallback targets player when no explicit target is set", () => {
    const rng = createRNG("enemy-target-player-fallback");
    const state = makeMinimalCombat({
      player: { ...makeMinimalCombat().player, currentHp: 80 },
      allies: [
        {
          instanceId: "ally-1",
          definitionId: "scribe_apprentice",
          name: "Scribe Apprentice",
          currentHp: 8,
          maxHp: 20,
          block: 0,
          speed: 7,
          buffs: [],
          intentIndex: 0,
        },
      ],
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
    });
    const enemy = state.enemies[0]!;
    const def = enemyDefs.get(enemy.definitionId);
    expect(def).toBeDefined();
    if (!def) return;

    const result = executeOneEnemyTurn(state, enemy, def, rng, enemyDefs);
    expect(result.player.currentHp).toBeLessThan(80);
    expect(result.allies[0]?.currentHp).toBe(8);
  });

  it("PLAYER-target enemy attacks can pressure allies on turn 3", () => {
    const rng = createRNG("enemy-pressure-turn");
    const state = makeMinimalCombat({
      turnNumber: 3,
      player: { ...makeMinimalCombat().player, currentHp: 80 },
      allies: [
        {
          instanceId: "ally-1",
          definitionId: "scribe_apprentice",
          name: "Scribe Apprentice",
          currentHp: 20,
          maxHp: 20,
          block: 0,
          speed: 7,
          buffs: [],
          intentIndex: 0,
        },
      ],
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
          intentIndex: 0, // Splatter targets PLAYER in data
        },
      ],
    });
    const enemy = state.enemies[0]!;
    const def = enemyDefs.get(enemy.definitionId);
    expect(def).toBeDefined();
    if (!def) return;

    const result = executeOneEnemyTurn(state, enemy, def, rng, enemyDefs);
    expect(result.allies[0]?.currentHp).toBeLessThan(20);
  });

  it("boss Ally Reckoning scales damage and debuff with living allies", () => {
    const rng = createRNG("boss-ally-reckoning");
    const state = makeMinimalCombat({
      player: { ...makeMinimalCombat().player, currentHp: 80, block: 0 },
      allies: [
        {
          instanceId: "ally-1",
          definitionId: "scribe_apprentice",
          name: "Scribe Apprentice",
          currentHp: 20,
          maxHp: 20,
          block: 0,
          speed: 7,
          buffs: [],
          intentIndex: 0,
        },
        {
          instanceId: "ally-2",
          definitionId: "ink_familiar",
          name: "Ink Familiar",
          currentHp: 14,
          maxHp: 14,
          block: 0,
          speed: 9,
          buffs: [],
          intentIndex: 0,
        },
      ],
      enemies: [
        {
          instanceId: "boss-1",
          definitionId: "chapter_guardian",
          name: "Chapter Guardian",
          isBoss: true,
          currentHp: 145,
          maxHp: 145,
          block: 0,
          speed: 5,
          buffs: [],
          intentIndex: 0,
        },
      ],
    });
    const customBossDef = {
      ...(enemyDefs.get("chapter_guardian") ?? {
        id: "chapter_guardian",
        name: "Chapter Guardian",
        maxHp: 145,
        speed: 5,
        abilities: [],
        isBoss: true,
        isElite: false,
        role: "HYBRID" as const,
        tier: 1,
        biome: "LIBRARY" as const,
      }),
      abilities: [
        {
          name: "Ally Reckoning",
          weight: 1,
          target: "PLAYER" as const,
          effects: [
            { type: "DAMAGE" as const, value: 12 },
            {
              type: "APPLY_DEBUFF" as const,
              value: 1,
              buff: "WEAK" as const,
              duration: 2,
            },
          ],
        },
      ],
    };
    const result = executeOneEnemyTurn(
      state,
      state.enemies[0]!,
      customBossDef,
      rng,
      enemyDefs
    );

    // Base 12 + (2 allies * 3) bonus damage.
    expect(result.player.currentHp).toBe(62);
    expect(getBuffStacks(result.player.buffs, "VULNERABLE")).toBe(2);
  });

  it("enemy damage scales with floor multiplier", () => {
    const rng = createRNG("enemy-dmg-scale");
    const state = makeMinimalCombat({
      enemyDamageScale: 1.36,
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
          intentIndex: 0, // Splatter: 7 base
        },
      ],
    });
    const enemy = state.enemies[0]!;
    const def = enemyDefs.get(enemy.definitionId);
    expect(def).toBeDefined();
    if (!def) return;

    const result = executeOneEnemyTurn(state, enemy, def, rng, enemyDefs);
    // 7 * 1.36 = 9.52 => round 10
    expect(result.player.currentHp).toBe(70);
  });

  it("ally death is not permanent across combats", () => {
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const runState = createNewRun(
      "run-ally-reset",
      "run-ally-reset",
      starterCards,
      createRNG("run-ally-reset"),
      { ...DEFAULT_META_BONUSES, allySlots: 1 }
    );
    runState.allyIds = ["scribe_apprentice"];

    const firstCombat = initCombat(
      runState,
      ["ink_slime"],
      enemyDefs,
      allyDefs,
      cardDefs,
      createRNG("run-ally-reset-1")
    );
    expect(firstCombat.allies[0]?.currentHp).toBe(20);

    // Simulate ally death during a combat snapshot; run master state keeps only ally ids.
    const deadCombatRun = { ...runState, combat: firstCombat };
    deadCombatRun.combat!.allies[0]!.currentHp = 0;

    const nextCombat = initCombat(
      deadCombatRun,
      ["ink_slime"],
      enemyDefs,
      allyDefs,
      cardDefs,
      createRNG("run-ally-reset-2")
    );
    expect(nextCombat.allies[0]?.currentHp).toBe(20);
  });

  it("chapter guardian triggers phase 2 once at half HP", () => {
    const rng = createRNG("chapter-phase2");
    const def = enemyDefs.get("chapter_guardian");
    expect(def).toBeDefined();
    if (!def) return;

    const state = makeMinimalCombat({
      enemies: [
        {
          instanceId: "boss-1",
          definitionId: "chapter_guardian",
          name: "Chapter Guardian",
          currentHp: 70,
          maxHp: 160,
          block: 0,
          mechanicFlags: {},
          speed: 5,
          buffs: [],
          intentIndex: 0,
        },
      ],
    });

    const once = executeOneEnemyTurn(
      state,
      state.enemies[0]!,
      def,
      rng,
      enemyDefs
    );
    const bossAfterOnce = once.enemies[0]!;
    expect(bossAfterOnce.currentHp).toBeGreaterThan(70);
    expect(bossAfterOnce.mechanicFlags?.chapter_guardian_phase2).toBe(1);
    expect(
      once.drawPile.filter((c) => c.definitionId === "haunting_regret").length
    ).toBeGreaterThanOrEqual(2);

    const twice = executeOneEnemyTurn(
      once,
      bossAfterOnce,
      def,
      createRNG("chapter-phase2-second"),
      enemyDefs
    );
    expect(
      twice.drawPile.filter((c) => c.definitionId === "haunting_regret").length
    ).toBe(
      once.drawPile.filter((c) => c.definitionId === "haunting_regret").length
    );
  });

  it("chapter guardian can summon adds on Page Storm", () => {
    const rng = createRNG("chapter-summon");
    const def = enemyDefs.get("chapter_guardian");
    expect(def).toBeDefined();
    if (!def) return;

    const state = makeMinimalCombat({
      enemies: [
        {
          instanceId: "boss-1",
          definitionId: "chapter_guardian",
          name: "Chapter Guardian",
          currentHp: 160,
          maxHp: 160,
          block: 0,
          mechanicFlags: {},
          speed: 5,
          buffs: [],
          intentIndex: 1, // Page Storm
        },
      ],
    });

    const result = executeOneEnemyTurn(
      state,
      state.enemies[0]!,
      def,
      rng,
      enemyDefs
    );
    expect(result.enemies.length).toBeGreaterThan(1);
    expect(result.enemies.some((e) => e.definitionId === "ink_slime")).toBe(
      true
    );
  });

  it("chapter guardian Ink Devour deals bonus damage per combat curse", () => {
    const rng = createRNG("chapter-curse-bonus");
    const def = enemyDefs.get("chapter_guardian");
    expect(def).toBeDefined();
    if (!def) return;

    const state = makeMinimalCombat({
      enemies: [
        {
          instanceId: "boss-1",
          definitionId: "chapter_guardian",
          name: "Chapter Guardian",
          currentHp: 160,
          maxHp: 160,
          block: 0,
          mechanicFlags: {},
          speed: 5,
          buffs: [],
          intentIndex: 3, // Ink Devour
        },
      ],
      drawPile: [
        {
          instanceId: "curse1",
          definitionId: "haunting_regret",
          upgraded: false,
        },
        {
          instanceId: "curse2",
          definitionId: "hexed_parchment",
          upgraded: false,
        },
      ],
    });

    const result = executeOneEnemyTurn(
      state,
      state.enemies[0]!,
      def,
      rng,
      enemyDefs
    );
    // Base Ink Devour = 16, plus 2*2 curse bonus = 4.
    expect(result.player.currentHp).toBe(60);
  });

  it("each boss has a distinct phase-2 mechanic trigger", () => {
    const cases: Array<{
      id: string;
      check: (result: CombatState) => void;
    }> = [
      {
        id: "chapter_guardian",
        check: (r) =>
          expect(
            r.drawPile.some((c) => c.definitionId === "haunting_regret")
          ).toBe(true),
      },
      {
        id: "fenrir",
        check: (r) =>
          expect(r.enemies.some((e) => e.definitionId === "draugr")).toBe(true),
      },
      {
        id: "medusa",
        check: (r) =>
          expect(r.discardPile.some((c) => c.definitionId === "dazed")).toBe(
            true
          ),
      },
      {
        id: "ra_avatar",
        check: (r) =>
          expect(r.player.buffs.some((b) => b.type === "VULNERABLE")).toBe(
            true
          ),
      },
      {
        id: "nyarlathotep_shard",
        check: (r) =>
          expect(
            r.enemies.some(
              (e) =>
                e.definitionId === "void_tendril" ||
                r.drawPile.some((c) => c.definitionId === "haunting_regret")
            )
          ).toBe(true),
      },
      {
        id: "tezcatlipoca_echo",
        check: (r) =>
          expect(r.drawPile.some((c) => c.definitionId === "ink_burn")).toBe(
            true
          ),
      },
      {
        id: "dagda_shadow",
        check: (r) =>
          expect(
            r.discardPile.some((c) => c.definitionId === "hexed_parchment")
          ).toBe(true),
      },
      {
        id: "baba_yaga_hut",
        check: (r) =>
          expect(r.enemies.some((e) => e.definitionId === "frost_witch")).toBe(
            true
          ),
      },
      {
        id: "soundiata_spirit",
        check: (r) =>
          expect(r.enemies.some((e) => e.definitionId === "mask_hunter")).toBe(
            true
          ),
      },
    ];

    for (const testCase of cases) {
      const def = enemyDefs.get(testCase.id);
      expect(def).toBeDefined();
      if (!def) continue;

      const state = makeMinimalCombat({
        enemies: [
          {
            instanceId: "boss-unique",
            definitionId: testCase.id,
            name: def.name,
            currentHp: Math.floor(def.maxHp / 2),
            maxHp: def.maxHp,
            block: 0,
            mechanicFlags: {},
            speed: def.speed,
            buffs: [],
            intentIndex: 0,
          },
        ],
      });

      const result = executeOneEnemyTurn(
        state,
        state.enemies[0]!,
        def,
        createRNG(`boss-unique-${testCase.id}`),
        enemyDefs
      );

      expect(result.enemies[0]?.mechanicFlags?.[`${testCase.id}_phase2`]).toBe(
        1
      );
      testCase.check(result);
    }
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
    expect(run.runStartedAtMs).toBeGreaterThan(0);
    expect(run.playerCurrentHp).toBe(60);
    expect(run.deck).toHaveLength(starterCards.length);
    expect(run.map).toHaveLength(10);
  });

  it("createNewRun can expose opening biome choices", () => {
    const rng = createRNG("new-run-opening-biome-choice");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const run = createNewRun(
      "run-1",
      "new-run-opening-biome-choice",
      starterCards,
      rng,
      undefined,
      [],
      undefined,
      undefined,
      [],
      [0],
      0,
      ["LIBRARY", "VIKING"]
    );

    expect(run.pendingBiomeChoices).toEqual(["LIBRARY", "VIKING"]);
  });

  it("generateFloorMap creates 10 room slots", () => {
    const rng = createRNG("map-gen");
    const map = generateFloorMap(1, rng, "LIBRARY");
    expect(map).toHaveLength(10);

    // First room has exactly 1 choice (always COMBAT)
    expect(map[0]).toHaveLength(1);
    expect(map[0]?.[0]?.type).toBe("COMBAT");

    // Boss room has exactly 1 choice (COMBAT)
    expect(map[9]).toHaveLength(1);
    expect(map[9]?.[0]?.type).toBe("COMBAT");
  });

  it("generateFloorMap distributes non-combat rooms before late-floor slots", () => {
    const seeds = [
      "map-balance-1",
      "map-balance-2",
      "map-balance-3",
      "map-balance-4",
      "map-balance-5",
      "map-balance-6",
      "map-balance-7",
      "map-balance-8",
    ];

    for (const seed of seeds) {
      const map = generateFloorMap(1, createRNG(seed), "LIBRARY");
      const middleBaseTypes = map
        .slice(1, 8)
        .map((slot) => slot?.[0]?.type ?? "COMBAT");

      const firstFiveHaveNonCombat = middleBaseTypes
        .slice(0, 5)
        .some((t) => t === "MERCHANT" || t === "SPECIAL");
      const tailNonCombatCount = middleBaseTypes
        .slice(5)
        .filter((t) => t === "MERCHANT" || t === "SPECIAL").length;

      expect(firstFiveHaveNonCombat).toBe(true);
      expect(tailNonCombatCount).toBeLessThanOrEqual(1);
    }
  });

  it("generateFloorMap forces room 3 to SPECIAL on floor 1", () => {
    const seeds = [
      "room3-special-1",
      "room3-special-2",
      "room3-special-3",
      "room3-special-4",
    ];
    for (const seed of seeds) {
      const map = generateFloorMap(1, createRNG(seed), "LIBRARY");
      expect(map[2]?.[0]?.type).toBe("SPECIAL");
    }
  });

  it("generateFloorMap avoids multi-choice pure combat slots when packs are capped to 1 enemy", () => {
    const seeds = [
      "russian-pack-cap-1",
      "russian-pack-cap-2",
      "russian-pack-cap-3",
      "russian-pack-cap-4",
      "russian-pack-cap-5",
      "russian-pack-cap-6",
    ];

    for (const seed of seeds) {
      const map = generateFloorMap(1, createRNG(seed), "RUSSIAN");
      for (let roomIndex = 1; roomIndex < 8; roomIndex++) {
        const slot = map[roomIndex] ?? [];
        const baseType = slot[0]?.type;
        if (baseType === "COMBAT") {
          expect(slot).toHaveLength(1);
        }
      }
    }
  });

  it("selectRoom marks room as completed", () => {
    const rng = createRNG("select-room");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const run = createNewRun("run-1", "select-room", starterCards, rng);

    const result = selectRoom(run, 0);
    expect(result.map[0]?.[0]?.completed).toBe(true);
  });

  it("completeCombat applies HEAL_AFTER_COMBAT meta bonus", () => {
    const rng = createRNG("meta-heal");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const run = createNewRun("run-1", "meta-heal", starterCards, rng, {
      ...DEFAULT_META_BONUSES,
      healAfterCombat: 10,
    });
    const combatResult = makeMinimalCombat({
      player: { ...makeMinimalCombat().player, currentHp: 50 },
    });

    const result = completeCombat(run, combatResult, 0, rng, { PAGES: 2 });
    expect(result.playerCurrentHp).toBe(56); // 50 + 10% of 60
  });

  it("completeCombat offers LIBRARY as a guaranteed option after floor 1 boss", () => {
    const rng = createRNG("boss-floor-1-biomes");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const run = createNewRun("run-1", "boss-floor-1-biomes", starterCards, rng);
    const combat = makeMinimalCombat();

    const result = completeCombat(
      {
        ...run,
        floor: 1,
        currentRoom: GAME_CONSTANTS.BOSS_ROOM_INDEX,
      },
      combat,
      0,
      createRNG("boss-floor-1-biomes-next")
    );

    expect(result.pendingBiomeChoices).not.toBeNull();
    expect(result.pendingBiomeChoices).toContain("LIBRARY");
    const nonLibraryChoices = (result.pendingBiomeChoices ?? []).filter(
      (b) => b !== "LIBRARY"
    );
    expect(nonLibraryChoices).toHaveLength(1);
    expect(GAME_CONSTANTS.AVAILABLE_BIOMES).toContain(nonLibraryChoices[0]);
  });

  it("completeCombat offers only non-LIBRARY biomes after floor 2+ boss", () => {
    const rng = createRNG("boss-floor-2-biomes");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const run = createNewRun("run-1", "boss-floor-2-biomes", starterCards, rng);
    const combat = makeMinimalCombat();

    const result = completeCombat(
      {
        ...run,
        floor: 2,
        currentRoom: GAME_CONSTANTS.BOSS_ROOM_INDEX,
      },
      combat,
      0,
      createRNG("boss-floor-2-biomes-next")
    );

    expect(result.pendingBiomeChoices).not.toBeNull();
    expect(result.pendingBiomeChoices).not.toContain("LIBRARY");
    const choices = result.pendingBiomeChoices ?? [];
    expect(choices[0]).not.toBe(choices[1]);
    expect(GAME_CONSTANTS.AVAILABLE_BIOMES).toContain(choices[0]);
    expect(GAME_CONSTANTS.AVAILABLE_BIOMES).toContain(choices[1]);
  });

  it("advanceFloor keeps floor 1 when resolving opening biome choice", () => {
    const rng = createRNG("opening-biome-choice");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const run = createNewRun(
      "run-1",
      "opening-biome-choice",
      starterCards,
      rng,
      undefined,
      [],
      undefined,
      [...cardDefs.values()],
      [],
      [0],
      0,
      ["LIBRARY", "VIKING"]
    );

    const result = advanceFloor(
      { ...run, pendingBiomeChoices: ["LIBRARY", "VIKING"] },
      "VIKING",
      createRNG("opening-biome-choice-select"),
      [...cardDefs.values()]
    );

    expect(result.floor).toBe(1);
    expect(result.currentRoom).toBe(0);
    expect(result.currentBiome).toBe("VIKING");
    expect(result.pendingBiomeChoices).toBeNull();
    expect(result.map).toHaveLength(10);
  });

  it("guaranteed relic event grants a relic and advances room", () => {
    const rng = createRNG("guaranteed-relic-event");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const run = createNewRun(
      "run-1",
      "guaranteed-relic-event",
      starterCards,
      rng
    );
    const event = createGuaranteedRelicEvent();
    const result = event.choices[0]!.apply(run);

    expect(result.currentRoom).toBe(run.currentRoom + 1);
    expect(result.relicIds.length).toBe(run.relicIds.length + 1);
  });
});

describe("Card unlock rules", () => {
  it("uses explicit card-id rules independently of input ordering", () => {
    const allCards = [...cardDefs.values()];
    const shuffled = [...allCards].reverse();
    const progress = {
      enteredBiomes: { LIBRARY: 1, VIKING: 1 },
      biomeRunsCompleted: {},
      eliteKillsByBiome: {},
      bossKillsByBiome: {},
    };
    const unlocked = computeUnlockedCardIds(shuffled, progress, []);
    expect(unlocked.includes("berserker_charge")).toBe(true);
    expect(unlocked.includes("shield_wall")).toBe(true);
    expect(unlocked.includes("rune_strike")).toBe(false);
  });

  it("returns missing condition for locked cards in details", () => {
    const allCards = [...cardDefs.values()];
    const progress = {
      enteredBiomes: { LIBRARY: 1 },
      biomeRunsCompleted: {},
      eliteKillsByBiome: {},
      bossKillsByBiome: {},
    };
    const details = getCardUnlockDetails(allCards, progress, []);
    expect(details["rune_strike"]?.unlocked).toBe(false);
    expect(details["rune_strike"]?.missingCondition).toContain("elite");
  });

  it("keeps selected LIBRARY cards locked at run start", () => {
    const allCards = [...cardDefs.values()];
    const startProgress = {
      enteredBiomes: { LIBRARY: 1 },
      biomeRunsCompleted: {},
      eliteKillsByBiome: {},
      bossKillsByBiome: {},
    };
    const unlocked = computeUnlockedCardIds(allCards, startProgress, []);
    expect(unlocked.includes("mythic_blow")).toBe(false);
    expect(unlocked.includes("rage_of_ages")).toBe(false);
  });

  it("supports combined ALL_OF unlock rules with focused missing condition", () => {
    const allCards = [...cardDefs.values()];
    const progress = {
      enteredBiomes: { LIBRARY: 1 },
      biomeRunsCompleted: { LIBRARY: 1 },
      eliteKillsByBiome: { LIBRARY: 1 },
      bossKillsByBiome: { LIBRARY: 0 },
    };
    const details = getCardUnlockDetails(allCards, progress, []);
    expect(details["forbidden_appendix"]?.unlocked).toBe(false);
    expect(details["forbidden_appendix"]?.progress).toBe("0/2 objectifs");
    expect(details["forbidden_appendix"]?.missingCondition).toContain(
      "grimoire_des_index"
    );
  });
});

// ============================
// Robustness: legacy runs with missing fields
// ============================

describe("Legacy run robustness (missing fields from old DB records)", () => {
  const rng = createRNG("legacy");
  const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);

  function makeLegacyRun() {
    const run = createNewRun("run-legacy", "legacy", starterCards, rng);
    // Simulate fields that didn't exist in older schema versions
    const legacy = { ...run } as Record<string, unknown>;
    legacy.allyIds = undefined;
    legacy.earnedResources = undefined;
    legacy.cardUnlockProgress = undefined;
    legacy.unlockedStoryIdsSnapshot = undefined;
    return legacy as typeof run;
  }

  it("initCombat handles undefined allyIds", () => {
    const run = makeLegacyRun();
    expect(() =>
      initCombat(
        run,
        ["ink_slime"],
        enemyDefs,
        allyDefs,
        cardDefs,
        createRNG("legacy-2")
      )
    ).not.toThrow();
  });

  it("completeCombat handles undefined cardUnlockProgress", () => {
    const run = makeLegacyRun();
    const combat = makeMinimalCombat();
    expect(() =>
      completeCombat(run, combat, 0, createRNG("legacy-3"), { PAGES: 2 }, [
        ...cardDefs.values(),
      ])
    ).not.toThrow();
  });

  it("completeCombat handles undefined earnedResources and accumulates resources", () => {
    const run = makeLegacyRun();
    const combat = makeMinimalCombat();
    const result = completeCombat(
      run,
      combat,
      10,
      createRNG("legacy-4"),
      { PAGES: 3 },
      [...cardDefs.values()]
    );
    expect(result.gold).toBe(run.gold + 10);
    expect(result.earnedResources["PAGES"]).toBe(3);
  });

  it("initCombat applies metaBonuses from runState (extraDraw + extraEnergyMax)", () => {
    const bonuses = {
      ...DEFAULT_META_BONUSES,
      extraDraw: 1,
      extraEnergyMax: 1,
    };
    const bonusRun = createNewRun(
      "run-meta",
      "meta-bonus",
      starterCards,
      createRNG("meta1"),
      bonuses
    );
    const combat = initCombat(
      bonusRun,
      ["ink_slime"],
      enemyDefs,
      allyDefs,
      cardDefs,
      createRNG("meta2")
    );
    expect(combat.player.drawCount).toBe(5); // base 4 + 1 extraDraw
    expect(combat.player.energyMax).toBe(4); // base 3 + 1 extraEnergyMax
  });

  it("initCombat applies allyHpPercent bonus to recruited allies", () => {
    const bonuses = {
      ...DEFAULT_META_BONUSES,
      allySlots: 1,
      allyHpPercent: 25,
    };
    const bonusRun = createNewRun(
      "run-meta-ally-hp",
      "meta-ally-hp",
      starterCards,
      createRNG("meta-ally-1"),
      bonuses
    );
    bonusRun.allyIds = ["scribe_apprentice"];
    const combat = initCombat(
      bonusRun,
      ["ink_slime"],
      enemyDefs,
      allyDefs,
      cardDefs,
      createRNG("meta-ally-2")
    );

    // Scribe Apprentice base HP is 20, with +25% => 25.
    expect(combat.allies[0]?.maxHp).toBe(25);
    expect(combat.allies[0]?.currentHp).toBe(25);
  });
});

// ============================
// Rewards Tests
// ============================

describe("Rewards", () => {
  it("generateCombatRewards returns gold and card choices", () => {
    const rng = createRNG("rewards-test");
    const allCards = [...cardDefs.values()];
    const rewards = generateCombatRewards(1, 3, false, false, 1, allCards, rng);

    expect(rewards.gold).toBeGreaterThan(0);
    expect(rewards.cardChoices).toHaveLength(3);
    // No starter cards in rewards
    expect(rewards.cardChoices.every((c) => !c.isStarterCard)).toBe(true);
  });

  it("elite rewards can offer ally choices when slots are available", () => {
    const rng = createRNG("ally-reward");
    const allCards = [...cardDefs.values()];
    const rewards = generateCombatRewards(
      1,
      4,
      false,
      true,
      1,
      allCards,
      rng,
      "LIBRARY",
      [],
      undefined,
      [],
      1
    );
    expect(rewards.allyChoices.length).toBeGreaterThan(0);
  });

  it("boss rewards give more gold", () => {
    const rng1 = createRNG("rewards-normal");
    const rng2 = createRNG("rewards-boss");
    const allCards = [...cardDefs.values()];

    const normal = generateCombatRewards(1, 9, false, false, 1, allCards, rng1);
    const boss = generateCombatRewards(1, 9, true, false, 1, allCards, rng2);

    expect(boss.gold).toBeGreaterThan(normal.gold);
  });

  it("elite rewards fallback to an extra card choice when no relic is available", () => {
    const rng = createRNG("elite-no-relic-fallback");
    const allCards = [...cardDefs.values()];
    const allRelicIds = relicDefinitions.map((r) => r.id);
    const rewards = generateCombatRewards(
      1,
      4,
      false,
      true,
      1,
      allCards,
      rng,
      "LIBRARY",
      allRelicIds
    );

    expect(rewards.relicChoices).toHaveLength(0);
    expect(rewards.cardChoices.length).toBeGreaterThanOrEqual(2);
  });

  it("at difficulty 5, elite rewards can roll no relic", () => {
    const allCards = [...cardDefs.values()];
    const deterministicNoRelicRng = {
      seed: "elite-no-relic-diff5",
      next: () => 0.1,
      nextInt: (min: number) => min,
      shuffle: <T>(arr: readonly T[]) => [...arr],
      pick: <T>(arr: readonly T[]) => arr[0]!,
    };
    const rewards = generateCombatRewards(
      1,
      4,
      false,
      true,
      1,
      allCards,
      deterministicNoRelicRng,
      "LIBRARY",
      [],
      undefined,
      [],
      1,
      0,
      undefined,
      0,
      0,
      5
    );

    expect(rewards.relicChoices).toHaveLength(0);
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

  it("iron_binding increases ink-per-card value", () => {
    const state = makeMinimalCombat();
    const result = applyRelicsOnCombatStart(state, ["iron_binding"]);
    expect(result.player.inkPerCardValue).toBe(2);
  });

  it("cursed_diacrit adds energy and injects a curse", () => {
    const state = makeMinimalCombat();
    const result = applyRelicsOnCombatStart(state, ["cursed_diacrit"]);
    expect(result.player.energyMax).toBe(4);
    expect(
      result.discardPile.some((c) => c.definitionId === "haunting_regret")
    ).toBe(true);
  });

  it("runic_bulwark retains half of remaining block on next turn", () => {
    const rng = createRNG("runic-bulwark");
    const state = makeMinimalCombat({
      phase: "ALLIES_ENEMIES_TURN",
      player: {
        ...makeMinimalCombat().player,
        block: 9,
      },
    });
    const result = startPlayerTurn(state, rng, ["runic_bulwark"]);
    expect(result.player.block).toBe(4);
  });

  it("eternal_hourglass conserves unspent energy between turns", () => {
    const rng = createRNG("eternal-hourglass");
    const state = makeMinimalCombat({
      phase: "ALLIES_ENEMIES_TURN",
      player: {
        ...makeMinimalCombat().player,
        energyCurrent: 2,
        energyMax: 3,
      },
    });
    const result = startPlayerTurn(state, rng, ["eternal_hourglass"]);
    expect(result.player.energyCurrent).toBe(5);
  });

  it("briar_codex grants thorns at combat start", () => {
    const state = makeMinimalCombat();
    const result = applyRelicsOnCombatStart(state, ["briar_codex"]);
    expect(getBuffStacks(result.player.buffs, "THORNS")).toBe(2);
  });
});

describe("Combat disruption effects", () => {
  it("FREEZE_HAND_CARDS marks cards as frozen and prevents play", () => {
    const rng = createRNG("freeze-effect");
    const state = makeMinimalCombat({
      hand: [{ instanceId: "c1", definitionId: "strike", upgraded: false }],
      player: {
        ...makeMinimalCombat().player,
        energyCurrent: 3,
      },
    });

    const result = resolveEffects(
      state,
      [{ type: "FREEZE_HAND_CARDS", value: 1 }],
      { source: { type: "enemy", instanceId: "e1" }, target: "player" },
      rng
    );

    expect(result.playerDisruption.frozenHandCardIds).toContain("c1");
    expect(canPlayCard(result, "c1", cardDefs)).toBe(false);
  });

  it("NEXT_DRAW_TO_DISCARD_THIS_TURN sends the next drawn card to discard", () => {
    const rng = createRNG("next-draw-discard");
    const state = makeMinimalCombat({
      hand: [],
      drawPile: [{ instanceId: "c1", definitionId: "strike", upgraded: false }],
      discardPile: [],
    });

    const disrupted = resolveEffects(
      state,
      [{ type: "NEXT_DRAW_TO_DISCARD_THIS_TURN", value: 1 }],
      { source: { type: "enemy", instanceId: "e1" }, target: "player" },
      rng
    );
    const afterDraw = drawCards(disrupted, 1, rng);

    expect(afterDraw.hand).toHaveLength(0);
    expect(afterDraw.discardPile.map((c) => c.instanceId)).toContain("c1");
  });

  it("support enemies use offensive fallback when alone", () => {
    const supportDef = Array.from(enemyDefs.values()).find((def) => {
      if (def.role !== "SUPPORT") return false;
      const hasSupportAbility = def.abilities.some(
        (a) => !a.effects.some((e) => e.type === "DAMAGE")
      );
      const hasDamageAbility = def.abilities.some((a) =>
        a.effects.some((e) => e.type === "DAMAGE")
      );
      return hasSupportAbility && hasDamageAbility;
    });
    expect(supportDef).toBeDefined();
    if (!supportDef) return;

    const supportAbilityIndex = supportDef.abilities.findIndex(
      (a) => !a.effects.some((e) => e.type === "DAMAGE")
    );
    expect(supportAbilityIndex).toBeGreaterThanOrEqual(0);
    if (supportAbilityIndex < 0) return;

    const enemy = {
      instanceId: "support-1",
      definitionId: supportDef.id,
      name: supportDef.name,
      currentHp: supportDef.maxHp,
      maxHp: supportDef.maxHp,
      block: 0,
      speed: supportDef.speed,
      buffs: [],
      intentIndex: supportAbilityIndex,
    };
    const state = makeMinimalCombat({
      player: { ...makeMinimalCombat().player, currentHp: 80, maxHp: 80 },
      enemies: [enemy],
      allies: [],
    });

    const result = executeOneEnemyTurn(
      state,
      enemy,
      supportDef,
      createRNG("support-alone-fallback"),
      enemyDefs
    );

    expect(result.player.currentHp).toBeLessThan(80);
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

  it("at difficulty 3, boss debuffs bypass block", () => {
    const state = makeMinimalCombat({
      difficultyLevel: 3,
      player: { ...makeMinimalCombat().player, block: 10 },
      enemies: [
        {
          ...makeMinimalCombat().enemies[0]!,
          instanceId: "boss-1",
          isBoss: true,
        },
      ],
    });
    const effects: Effect[] = [
      { type: "DAMAGE", value: 4 },
      { type: "APPLY_DEBUFF", value: 2, buff: "WEAK", duration: 2 },
    ];
    const result = resolveEffects(
      state,
      effects,
      { source: { type: "enemy", instanceId: "boss-1" }, target: "player" },
      rng
    );
    expect(result.player.currentHp).toBe(state.player.currentHp);
    expect(getBuffStacks(result.player.buffs, "WEAK")).toBe(2);
  });

  it("at difficulty 4, elite debuffs bypass block", () => {
    const state = makeMinimalCombat({
      difficultyLevel: 4,
      player: { ...makeMinimalCombat().player, block: 10 },
      enemies: [
        {
          ...makeMinimalCombat().enemies[0]!,
          instanceId: "elite-1",
          isElite: true,
        },
      ],
    });
    const effects: Effect[] = [
      { type: "DAMAGE", value: 4 },
      { type: "APPLY_DEBUFF", value: 3, buff: "POISON" },
    ];
    const result = resolveEffects(
      state,
      effects,
      { source: { type: "enemy", instanceId: "elite-1" }, target: "player" },
      rng
    );
    expect(result.player.currentHp).toBe(state.player.currentHp);
    expect(getBuffStacks(result.player.buffs, "POISON")).toBe(3);
  });

  it("at difficulty 4, boss debuffs gain +1 stack", () => {
    const state = makeMinimalCombat({
      difficultyLevel: 4,
      player: { ...makeMinimalCombat().player, block: 0 },
      enemies: [
        {
          ...makeMinimalCombat().enemies[0]!,
          instanceId: "boss-1",
          isBoss: true,
        },
      ],
    });
    const effects: Effect[] = [
      { type: "APPLY_DEBUFF", value: 2, buff: "POISON" },
    ];
    const result = resolveEffects(
      state,
      effects,
      { source: { type: "enemy", instanceId: "boss-1" }, target: "player" },
      rng
    );
    expect(getBuffStacks(result.player.buffs, "POISON")).toBe(3);
  });

  it("at difficulty 5, normal enemy debuffs bypass block", () => {
    const state = makeMinimalCombat({
      difficultyLevel: 5,
      player: { ...makeMinimalCombat().player, block: 10 },
      enemies: [
        {
          ...makeMinimalCombat().enemies[0]!,
          instanceId: "normal-1",
          isBoss: false,
          isElite: false,
        },
      ],
    });
    const effects: Effect[] = [
      { type: "DAMAGE", value: 3 },
      { type: "APPLY_DEBUFF", value: 1, buff: "VULNERABLE", duration: 2 },
    ];
    const result = resolveEffects(
      state,
      effects,
      { source: { type: "enemy", instanceId: "normal-1" }, target: "player" },
      rng
    );
    expect(result.player.currentHp).toBe(state.player.currentHp);
    expect(getBuffStacks(result.player.buffs, "VULNERABLE")).toBe(1);
  });

  it("first hit damage reduction applies once per combat", () => {
    const state = makeMinimalCombat({
      player: {
        ...makeMinimalCombat().player,
        firstHitDamageReductionPercent: 50,
      },
      firstHitReductionUsed: false,
    });
    const effects: Effect[] = [{ type: "DAMAGE", value: 10 }];

    const once = resolveEffects(state, effects, enemyCtx, rng);
    expect(once.player.currentHp).toBe(75); // first hit reduced from 10 to 5
    expect(once.firstHitReductionUsed).toBe(true);

    const twice = resolveEffects(once, effects, enemyCtx, rng);
    expect(twice.player.currentHp).toBe(65); // second hit full 10
  });

  it("enemy effects can add status/curse cards to piles", () => {
    const state = makeMinimalCombat();
    const effects: Effect[] = [
      { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "dazed" },
      { type: "ADD_CARD_TO_DRAW", value: 1, cardId: "haunting_regret" },
    ];
    const result = resolveEffects(state, effects, enemyCtx, rng);
    expect(result.discardPile.some((c) => c.definitionId === "dazed")).toBe(
      true
    );
    expect(
      result.drawPile.some((c) => c.definitionId === "haunting_regret")
    ).toBe(true);
  });

  it("thorns retaliates against enemy attacks", () => {
    const state = makeMinimalCombat({
      player: {
        ...makeMinimalCombat().player,
        buffs: [{ type: "THORNS", stacks: 2 }],
      },
    });
    const thornsEnemyCtx: EffectContext = {
      source: { type: "enemy", instanceId: "e1" },
      target: "player",
    };
    const effects: Effect[] = [{ type: "DAMAGE", value: 1 }];
    const result = resolveEffects(state, effects, thornsEnemyCtx, rng);
    expect(result.enemies[0]?.currentHp).toBe(12);
  });

  it("enemy thorns retaliates against player attacks", () => {
    const state = makeMinimalCombat({
      enemies: [
        {
          ...makeMinimalCombat().enemies[0],
          buffs: [{ type: "THORNS", stacks: 3 }],
        },
      ],
    });
    const effects: Effect[] = [{ type: "DAMAGE", value: 6 }];
    const result = resolveEffects(
      state,
      effects,
      { source: "player", target: { type: "enemy", instanceId: "e1" } },
      rng
    );
    expect(result.player.currentHp).toBe(77);
    expect(result.enemies[0]?.currentHp).toBe(8);
  });

  it("enemy thorns retaliation stacks across all targeted enemies", () => {
    const state = makeMinimalCombat({
      enemies: [
        {
          ...makeMinimalCombat().enemies[0],
          buffs: [{ type: "THORNS", stacks: 2 }],
        },
        {
          instanceId: "e2",
          definitionId: "ink_slime",
          name: "Ink Slime",
          currentHp: 10,
          maxHp: 10,
          block: 0,
          speed: 2,
          buffs: [{ type: "THORNS", stacks: 1 }],
          intentIndex: 0,
        },
      ],
    });
    const effects: Effect[] = [{ type: "DAMAGE", value: 1 }];
    const result = resolveEffects(
      state,
      effects,
      { source: "player", target: "all_enemies" },
      rng
    );
    expect(result.player.currentHp).toBe(77);
  });
});
