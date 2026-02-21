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
  createNewRun,
  generateFloorMap,
  selectRoom,
  completeCombat,
} from "../engine/run";
import { generateCombatRewards, addCardToRunDeck } from "../engine/rewards";
import { applyRelicsOnCombatStart } from "../engine/relics";
import { resolveEffects, type EffectContext } from "../engine/effects";
import {
  computeUnlockedCardIds,
  getCardUnlockDetails,
} from "../engine/card-unlocks";
import type { CombatState } from "../schemas/combat-state";
import type { Effect } from "../schemas/effects";
import { DEFAULT_META_BONUSES } from "../schemas/meta";
import { buildAllyDefsMap, buildCardDefsMap, buildEnemyDefsMap } from "../data";
import { relicDefinitions } from "../data/relics";

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
    const map = generateFloorMap(1, rng, "LIBRARY");
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
    expect(result.playerCurrentHp).toBe(58); // 50 + 10% of 80
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
});
