import { describe, it, expect } from "vitest";
import { createRNG } from "../engine/rng";
import {
  drawCards,
  discardHand,
  moveCardToDiscard,
  moveCardToExhaust,
  moveFromDiscardToHand,
  exhaustCardFromHandForOverflow,
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
  applyDifficultyToRun,
  applyRunConditionToRun,
  applyHealRoomBloodPurge,
  createGuaranteedRelicEvent,
  createNewRun,
  drawRandomBiomeChoices,
  generateFloorMap,
  getHealRoomBloodPurgeHpCost,
  selectRoom,
  completeCombat,
  advanceFloor,
} from "../engine/run";
import { generateCombatRewards, addCardToRunDeck } from "../engine/rewards";
import {
  buyShopItem,
  generateShopInventory,
  generateStartMerchantOffers,
  getShopRerollPrice,
} from "../engine/merchant";
import {
  getCardOfferWeight,
  weightedSampleCardsForOffers,
} from "../engine/card-offers";
import {
  applyRelicsOnCardPlayed,
  applyRelicsOnCombatStart,
} from "../engine/relics";
import { resolveEffects, type EffectContext } from "../engine/effects";
import { executeOneEnemyTurn } from "../engine/enemies";
import { getCernunnosUiState } from "../engine/cernunnos-shade";
import { getDagdaUiState } from "../engine/dagda-shadow";
import { getFenrirUiState } from "../engine/fenrir";
import { getMedusaUiState } from "../engine/medusa";
import { getOsirisUiState } from "../engine/osiris-judgment";
import { getRaUiState } from "../engine/ra-avatar";
import {
  computeUnlockedCardIds,
  getCardUnlockDetails,
  onBossKilled,
  onEliteKilled,
  onEnterBiome,
  readUnlockProgressFromResources,
  writeUnlockProgressToResources,
} from "../engine/card-unlocks";
import type { CardUnlockProgress } from "../engine/card-unlocks";
import { getLoreEntryIndexForKillCount } from "../engine/bestiary";
import { getLootRarityWeight } from "../engine/loot";
import type { CombatState } from "../schemas/combat-state";
import type { CardDefinition } from "../schemas/cards";
import type { Effect } from "../schemas/effects";
import { DEFAULT_META_BONUSES } from "../schemas/meta";
import type { RoomNode } from "../schemas/run-state";
import { GAME_CONSTANTS } from "../constants";
import {
  buildAllyDefsMap,
  buildCardDefsMap,
  buildEnemyDefsMap,
  statusCardDefinitionIds,
} from "../data";
import { getCharacterById } from "../data/characters";
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

function enumerateMapPaths(map: RoomNode[][]): RoomNode[][] {
  if (map.length === 0 || map[0]?.length === 0) return [];

  const nodeById = new Map(
    map.flatMap((depth) =>
      depth.map(
        (node, nodeChoiceIndex) =>
          [node.nodeId ?? `${node.index}-${nodeChoiceIndex}`, node] as const
      )
    )
  );
  const startNode = map[0]?.[0];
  if (!startNode) return [];

  const results: RoomNode[][] = [];
  const visit = (node: RoomNode, path: RoomNode[]) => {
    const nextPath = [...path, node];
    if ((node.nextNodeIds?.length ?? 0) === 0) {
      results.push(nextPath);
      return;
    }

    for (const nextNodeId of node.nextNodeIds ?? []) {
      const nextNode = nodeById.get(nextNodeId);
      if (nextNode) {
        visit(nextNode, nextPath);
      }
    }
  };

  visit(startNode, []);
  return results;
}

function getPathSupportKind(node: RoomNode): string | null {
  if (node.type === "MERCHANT") return "MERCHANT";
  if (node.type === "SPECIAL") return node.specialType ?? "SPECIAL";
  return null;
}

function makeDeterministicRng(seed: string) {
  return {
    seed,
    next: () => 0,
    nextInt: (min: number, _max: number) => min,
    shuffle: <T>(arr: readonly T[]) => [...arr],
    pick: <T>(arr: readonly T[]) => arr[0]!,
  };
}

function getStarterCardsForCharacter(characterId: string): CardDefinition[] {
  return getCharacterById(characterId)
    .starterDeckIds.map((id) => cardDefs.get(id))
    .filter((card): card is NonNullable<typeof card> => card != null);
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

  it("ink_burn and hexed_parchment apply immediate penalties when drawn", () => {
    const rng = createRNG("draw-immediate-penalties");
    const state = makeMinimalCombat({
      hand: [],
      drawPile: [
        { instanceId: "s1", definitionId: "ink_burn", upgraded: false },
        {
          instanceId: "c1",
          definitionId: "hexed_parchment",
          upgraded: false,
        },
      ],
      player: {
        ...makeMinimalCombat().player,
        inkCurrent: 2,
      },
    });

    const result = drawCards(state, 2, rng);

    expect(result.hand.map((card) => card.definitionId)).toEqual([
      "ink_burn",
      "hexed_parchment",
    ]);
    expect(result.player.inkCurrent).toBe(1);
    expect(result.playerDisruption.extraCardCost).toBe(1);
  });

  it("haunting_regret sends the next drawn card to discard", () => {
    const rng = createRNG("haunting-regret-draw");
    const state = makeMinimalCombat({
      hand: [],
      drawPile: [
        {
          instanceId: "c1",
          definitionId: "haunting_regret",
          upgraded: false,
        },
        { instanceId: "c2", definitionId: "strike", upgraded: false },
      ],
      discardPile: [],
    });

    const result = drawCards(state, 2, rng);

    expect(result.hand.map((card) => card.definitionId)).toEqual([
      "haunting_regret",
    ]);
    expect(result.discardPile.map((card) => card.definitionId)).toContain(
      "strike"
    );
  });

  it("torn_index and binding_curse freeze future or current hand cards", () => {
    const rng = createRNG("freeze-draw-clog");
    const state = makeMinimalCombat({
      hand: [],
      drawPile: [
        { instanceId: "s1", definitionId: "torn_index", upgraded: false },
        { instanceId: "c1", definitionId: "strike", upgraded: false },
        { instanceId: "c2", definitionId: "binding_curse", upgraded: false },
      ],
      discardPile: [],
    });

    const result = drawCards(state, 3, rng);

    expect(result.hand.map((card) => card.definitionId)).toEqual([
      "torn_index",
      "strike",
      "binding_curse",
    ]);
    expect(result.playerDisruption.frozenHandCardIds).toContain("c1");
    expect(result.playerDisruption.frozenHandCardIds.length).toBe(2);
  });

  it("smudged_lens and echo_curse add delayed disruption and extra clog", () => {
    const rng = createRNG("delayed-draw-clog");
    const state = makeMinimalCombat({
      hand: [],
      drawPile: [
        { instanceId: "s1", definitionId: "smudged_lens", upgraded: false },
        { instanceId: "c1", definitionId: "echo_curse", upgraded: false },
      ],
      discardPile: [],
    });

    const result = drawCards(state, 2, rng);

    expect(result.nextPlayerDisruption.drawPenalty).toBe(1);
    expect(result.discardPile.map((card) => card.definitionId)).toContain(
      "dazed"
    );
  });

  it("player overdraw sets pending exhaust choices", () => {
    const rng = createRNG("hand-cap-overflow");
    const baseHand = Array.from({
      length: GAME_CONSTANTS.MAX_HAND_SIZE - 1,
    }).map((_, i) => ({
      instanceId: `h${i + 1}`,
      definitionId: "strike",
      upgraded: false,
    }));
    const state = makeMinimalCombat({
      hand: baseHand,
      drawPile: [
        { instanceId: "d1", definitionId: "strike", upgraded: false },
        { instanceId: "d2", definitionId: "defend", upgraded: false },
        { instanceId: "d3", definitionId: "ink_surge", upgraded: false },
      ],
      exhaustPile: [],
    });

    const result = drawCards(state, 3, rng);
    expect(result.hand).toHaveLength(GAME_CONSTANTS.MAX_HAND_SIZE + 2);
    expect(result.hand.some((c) => c.instanceId === "d1")).toBe(true);
    expect(result.hand.some((c) => c.instanceId === "d2")).toBe(true);
    expect(result.hand.some((c) => c.instanceId === "d3")).toBe(true);
    expect(result.pendingHandOverflowExhaust).toBe(2);
    expect(result.exhaustPile).toHaveLength(0);
    expect(result.drawPile).toHaveLength(0);
  });

  it("enemy overdraw exhausts overflow draws immediately", () => {
    const rng = createRNG("enemy-overdraw");
    const baseHand = Array.from({
      length: GAME_CONSTANTS.MAX_HAND_SIZE - 1,
    }).map((_, i) => ({
      instanceId: `h${i + 1}`,
      definitionId: "strike",
      upgraded: false,
    }));
    const state = makeMinimalCombat({
      hand: baseHand,
      drawPile: [
        { instanceId: "d1", definitionId: "strike", upgraded: false },
        { instanceId: "d2", definitionId: "defend", upgraded: false },
        { instanceId: "d3", definitionId: "ink_surge", upgraded: false },
      ],
      exhaustPile: [],
      pendingHandOverflowExhaust: 0,
    });

    const result = drawCards(state, 3, rng, "ENEMY");
    expect(result.hand).toHaveLength(GAME_CONSTANTS.MAX_HAND_SIZE);
    expect(result.hand.some((c) => c.instanceId === "d1")).toBe(true);
    expect(result.exhaustPile.map((c) => c.instanceId)).toEqual(["d2", "d3"]);
    expect(result.pendingHandOverflowExhaust).toBe(0);
    expect(result.drawPile).toHaveLength(0);
  });

  it("system overdraw exhausts overflow draws immediately", () => {
    const rng = createRNG("system-overdraw");
    const baseHand = Array.from({
      length: GAME_CONSTANTS.MAX_HAND_SIZE - 1,
    }).map((_, i) => ({
      instanceId: `h${i + 1}`,
      definitionId: "strike",
      upgraded: false,
    }));
    const state = makeMinimalCombat({
      hand: baseHand,
      drawPile: [
        { instanceId: "d1", definitionId: "strike", upgraded: false },
        { instanceId: "d2", definitionId: "defend", upgraded: false },
        { instanceId: "d3", definitionId: "ink_surge", upgraded: false },
      ],
      exhaustPile: [],
      pendingHandOverflowExhaust: 0,
    });

    const result = drawCards(state, 3, rng, "SYSTEM");
    expect(result.hand).toHaveLength(GAME_CONSTANTS.MAX_HAND_SIZE);
    expect(result.hand.some((c) => c.instanceId === "d1")).toBe(true);
    expect(result.exhaustPile.map((c) => c.instanceId)).toEqual(["d2", "d3"]);
    expect(result.pendingHandOverflowExhaust).toBe(0);
    expect(result.drawPile).toHaveLength(0);
  });

  it("exhaustCardFromHandForOverflow consumes one pending choice", () => {
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "h1", definitionId: "strike", upgraded: false },
        { instanceId: "h2", definitionId: "defend", upgraded: false },
      ],
      pendingHandOverflowExhaust: 1,
      exhaustPile: [],
    });

    const result = exhaustCardFromHandForOverflow(state, "h2");
    expect(result.pendingHandOverflowExhaust).toBe(0);
    expect(result.hand.map((c) => c.instanceId)).toEqual(["h1"]);
    expect(result.exhaustPile.map((c) => c.instanceId)).toEqual(["h2"]);
  });

  it("exhaustCardFromHandForOverflow is a no-op when nothing is pending", () => {
    const state = makeMinimalCombat({
      hand: [{ instanceId: "h1", definitionId: "strike", upgraded: false }],
      pendingHandOverflowExhaust: 0,
      exhaustPile: [],
    });

    const result = exhaustCardFromHandForOverflow(state, "h1");
    expect(result).toBe(state);
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

  it("discardHand exhausts dazed at end of turn", () => {
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "dazed", upgraded: false },
        { instanceId: "c2", definitionId: "strike", upgraded: false },
      ],
      discardPile: [],
      exhaustPile: [],
    });

    const result = discardHand(state);

    expect(result.hand).toHaveLength(0);
    expect(result.discardPile.map((card) => card.definitionId)).toEqual([
      "strike",
    ]);
    expect(result.exhaustPile.map((card) => card.definitionId)).toEqual([
      "dazed",
    ]);
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
    const fortify = [...cardDefs.values()].find(
      (c) =>
        c.targeting === "SELF" &&
        c.type === "SKILL" &&
        c.effects.some((effect) => effect.type === "BLOCK")
    );
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

  it("does not apply STUN while stun immunity is active", () => {
    const buffs = applyBuff(
      [{ type: "STUN_IMMUNITY" as const, stacks: 1, duration: 1 }],
      "STUN",
      1,
      1
    );

    expect(getBuffStacks(buffs, "STUN")).toBe(0);
    expect(getBuffStacks(buffs, "STUN_IMMUNITY")).toBe(1);
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

  it("canPlayCard returns false without enough ink for inkCost cards", () => {
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "book_of_the_dead", upgraded: false },
      ],
      player: {
        ...makeMinimalCombat().player,
        inkCurrent: 1,
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

  it("book_of_the_dead spends ink for a zero-energy setup swing", () => {
    const rng = createRNG("book-of-the-dead");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      player: {
        ...base.player,
        inkCurrent: 3,
        inkPerCardChance: 0,
      },
      hand: [
        { instanceId: "c1", definitionId: "book_of_the_dead", upgraded: false },
      ],
      drawPile: [{ instanceId: "d1", definitionId: "strike", upgraded: false }],
      enemies: [
        { ...base.enemies[0]! },
        {
          ...base.enemies[0]!,
          instanceId: "e2",
          currentHp: 18,
          maxHp: 18,
        },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.energyCurrent).toBe(3);
    expect(result.player.inkCurrent).toBe(1);
    expect(result.player.strength).toBe(2);
    expect(result.hand).toHaveLength(1);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "VULNERABLE")).toBe(2);
    expect(getBuffStacks(result.enemies[1]?.buffs ?? [], "VULNERABLE")).toBe(2);
    expect(result.exhaustPile[0]?.definitionId).toBe("book_of_the_dead");
  });

  it("menders_inkwell heals for ink spent on card costs", () => {
    const rng = createRNG("menders-inkwell-book");
    const base = makeMinimalCombat();
    const started = applyRelicsOnCombatStart(
      makeMinimalCombat({
        player: {
          ...base.player,
          currentHp: 30,
          inkCurrent: 3,
          inkPerCardChance: 0,
        },
        hand: [
          {
            instanceId: "c1",
            definitionId: "book_of_the_dead",
            upgraded: false,
          },
        ],
        drawPile: [
          { instanceId: "d1", definitionId: "strike", upgraded: false },
        ],
      }),
      ["menders_inkwell"]
    );

    const result = playCard(started, "c1", null, false, cardDefs, rng);

    expect(result.player.currentHp).toBe(32);
    expect(result.player.inkCurrent).toBe(1);
  });

  it("echoing_inkstone boosts cards that pay ink costs", () => {
    const rng = createRNG("echoing-inkstone-book");
    const base = makeMinimalCombat();
    const started = applyRelicsOnCombatStart(
      makeMinimalCombat({
        player: {
          ...base.player,
          inkCurrent: 3,
          inkPerCardChance: 0,
        },
        hand: [
          {
            instanceId: "c1",
            definitionId: "book_of_the_dead",
            upgraded: false,
          },
        ],
        drawPile: [
          { instanceId: "d1", definitionId: "strike", upgraded: false },
          { instanceId: "d2", definitionId: "defend", upgraded: false },
        ],
        enemies: [
          { ...base.enemies[0]! },
          {
            ...base.enemies[0]!,
            instanceId: "e2",
            currentHp: 18,
            maxHp: 18,
          },
        ],
      }),
      ["echoing_inkstone"]
    );

    const result = playCard(started, "c1", null, false, cardDefs, rng);

    expect(result.player.strength).toBe(4);
    expect(result.hand).toHaveLength(2);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "VULNERABLE")).toBe(4);
    expect(getBuffStacks(result.enemies[1]?.buffs ?? [], "VULNERABLE")).toBe(4);
  });

  it("playCard inked trickster_snare applies Vulnerable and Poison to all surviving enemies", () => {
    const rng = createRNG("inked-trickster-snare-test");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "trickster_snare", upgraded: false },
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

    // trickster_snare inked: 5 dmg AOE + VULN 2 ALL + POISON 2 ALL
    expect(result.enemies[0]?.currentHp).toBe(25);
    expect(result.enemies[1]?.currentHp).toBe(23);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "VULNERABLE")).toBe(2);
    expect(getBuffStacks(result.enemies[1]?.buffs ?? [], "VULNERABLE")).toBe(2);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "POISON")).toBe(2);
    expect(getBuffStacks(result.enemies[1]?.buffs ?? [], "POISON")).toBe(2);
  });

  it("playCard exhausts POWER cards for the rest of combat", () => {
    const rng = createRNG("power-exhaust-test");
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "rage_of_ages", upgraded: false },
      ],
    });
    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.hand).toHaveLength(0);
    expect(result.discardPile).toHaveLength(0);
    expect(result.exhaustPile).toHaveLength(1);
    expect(result.exhaustPile[0]?.definitionId).toBe("rage_of_ages");
    expect(result.player.strength).toBe(2);
  });

  it("exhaustKeepChance does not keep POWER cards out of exhaust", () => {
    const rng = createRNG("power-exhaust-keep-test");
    const state = makeMinimalCombat({
      hand: [{ instanceId: "c1", definitionId: "starborn_omen", upgraded: false }],
    });

    const result = playCard(
      state,
      "c1",
      null,
      false,
      cardDefs,
      rng,
      { exhaustKeepChance: 100 }
    );

    expect(result.discardPile).toHaveLength(0);
    expect(result.exhaustPile).toHaveLength(1);
    expect(result.exhaustPile[0]?.definitionId).toBe("starborn_omen");
  });

  it("exhaustKeepChance can keep non-POWER Exhaust cards in discard", () => {
    const rng = createRNG("non-power-exhaust-keep-test");
    const state = makeMinimalCombat({
      hand: [{ instanceId: "c1", definitionId: "eldritch_pact", upgraded: false }],
    });

    const result = playCard(
      state,
      "c1",
      null,
      false,
      cardDefs,
      rng,
      { exhaustKeepChance: 100 }
    );

    expect(result.exhaustPile).toHaveLength(0);
    expect(result.discardPile).toHaveLength(1);
    expect(result.discardPile[0]?.definitionId).toBe("eldritch_pact");
  });

  it("bastion_crash deals damage equal to current block", () => {
    const rng = createRNG("bastion-crash");
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "bastion_crash", upgraded: false },
      ],
      player: {
        ...makeMinimalCombat().player,
        block: 7,
      },
    });
    const result = playCard(state, "c1", "e1", false, cardDefs, rng);
    expect(result.enemies[0]?.currentHp).toBe(7);
  });

  it("venom_echo doubles poison stacks on target", () => {
    const rng = createRNG("venom-echo");
    const state = makeMinimalCombat({
      hand: [{ instanceId: "c1", definitionId: "venom_echo", upgraded: false }],
      enemies: [
        {
          ...makeMinimalCombat().enemies[0]!,
          buffs: [{ type: "POISON", stacks: 3 }],
        },
      ],
    });
    const result = playCard(state, "c1", "e1", false, cardDefs, rng);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "POISON")).toBe(6);
    expect(result.exhaustPile).toHaveLength(0);
    expect(result.discardPile).toHaveLength(1);
    expect(result.discardPile[0]?.definitionId).toBe("venom_echo");
  });

  it("venom_echo+ triples poison stacks on target", () => {
    const rng = createRNG("venom-echo-upgrade");
    const state = makeMinimalCombat({
      hand: [{ instanceId: "c1", definitionId: "venom_echo", upgraded: true }],
      enemies: [
        {
          ...makeMinimalCombat().enemies[0]!,
          buffs: [{ type: "POISON", stacks: 3 }],
        },
      ],
    });
    const result = playCard(state, "c1", "e1", false, cardDefs, rng);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "POISON")).toBe(9);
    expect(result.exhaustPile).toHaveLength(0);
    expect(result.discardPile).toHaveLength(1);
    expect(result.discardPile[0]?.definitionId).toBe("venom_echo");
  });

  it("heros_challenge grants player block while targeting an enemy", () => {
    const rng = createRNG("heros-challenge");
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "heros_challenge", upgraded: false },
      ],
    });

    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    expect(result.enemies[0]?.currentHp).toBe(8);
    expect(result.player.block).toBe(4);
  });

  it("titans_wrath cashes in existing vulnerable before applying more", () => {
    const rng = createRNG("titans-wrath");
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "titans_wrath", upgraded: false },
      ],
      enemies: [
        {
          ...makeMinimalCombat().enemies[0]!,
          currentHp: 40,
          maxHp: 40,
          buffs: [{ type: "VULNERABLE", stacks: 2, duration: 2 }],
        },
      ],
    });

    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    expect(result.enemies[0]?.currentHp).toBe(25);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "VULNERABLE")).toBe(3);
  });

  it("winter_inscription turns existing weak into a simple thorns payoff", () => {
    const rng = createRNG("winter-inscription");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      hand: [
        {
          instanceId: "c1",
          definitionId: "winter_inscription",
          upgraded: false,
        },
      ],
      enemies: [
        {
          ...base.enemies[0]!,
          buffs: [{ type: "WEAK", stacks: 2, duration: 2 }],
        },
        {
          ...base.enemies[0]!,
          instanceId: "e2",
          currentHp: 18,
          maxHp: 18,
          buffs: [{ type: "WEAK", stacks: 1, duration: 2 }],
        },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.block).toBe(5);
    expect(getBuffStacks(result.player.buffs, "THORNS")).toBe(3);
  });

  it("spider_web turns team-wide weak into thorns", () => {
    const rng = createRNG("spider-web");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      hand: [{ instanceId: "c1", definitionId: "spider_web", upgraded: false }],
      enemies: [
        {
          ...base.enemies[0]!,
          instanceId: "e1",
          currentHp: 14,
          maxHp: 14,
          buffs: [],
        },
        {
          ...base.enemies[0]!,
          instanceId: "e2",
          currentHp: 18,
          maxHp: 18,
          buffs: [],
        },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.enemies[0]?.currentHp).toBe(11);
    expect(result.enemies[1]?.currentHp).toBe(15);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "WEAK")).toBe(1);
    expect(getBuffStacks(result.enemies[1]?.buffs ?? [], "WEAK")).toBe(1);
    expect(getBuffStacks(result.player.buffs, "THORNS")).toBe(2);
  });

  it("wild_gale converts existing weak into thorns", () => {
    const rng = createRNG("wild-gale");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      hand: [{ instanceId: "c1", definitionId: "wild_gale", upgraded: false }],
      drawPile: [{ instanceId: "d1", definitionId: "strike", upgraded: false }],
      enemies: [
        {
          ...base.enemies[0]!,
          buffs: [{ type: "WEAK", stacks: 2, duration: 2 }],
        },
        {
          ...base.enemies[0]!,
          instanceId: "e2",
          currentHp: 18,
          maxHp: 18,
          buffs: [{ type: "WEAK", stacks: 1, duration: 2 }],
        },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(getBuffStacks(result.player.buffs, "THORNS")).toBe(3);
    expect(result.hand).toHaveLength(1);
  });

  it("frost_witch cashes in weak across enemies as thorns", () => {
    const rng = createRNG("frost-witch");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "frost_witch", upgraded: false },
      ],
      enemies: [
        {
          ...base.enemies[0]!,
          buffs: [{ type: "WEAK", stacks: 1, duration: 2 }],
        },
        {
          ...base.enemies[0]!,
          instanceId: "e2",
          currentHp: 18,
          maxHp: 18,
          buffs: [],
        },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "WEAK")).toBe(3);
    expect(getBuffStacks(result.enemies[1]?.buffs ?? [], "WEAK")).toBe(2);
    expect(getBuffStacks(result.player.buffs, "THORNS")).toBe(5);
    expect(result.exhaustPile[0]?.definitionId).toBe("frost_witch");
  });

  it("epic_saga cashes in bleed across all enemies", () => {
    const rng = createRNG("epic-saga");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      hand: [{ instanceId: "c1", definitionId: "epic_saga", upgraded: false }],
      enemies: [
        {
          ...base.enemies[0]!,
          currentHp: 20,
          maxHp: 20,
          buffs: [{ type: "BLEED", stacks: 2, duration: 4 }],
        },
        {
          ...base.enemies[0]!,
          instanceId: "e2",
          currentHp: 18,
          maxHp: 18,
          buffs: [{ type: "BLEED", stacks: 1, duration: 4 }],
        },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.enemies[0]?.currentHp).toBe(12);
    expect(result.enemies[1]?.currentHp).toBe(12);
    expect(result.exhaustPile[0]?.definitionId).toBe("epic_saga");
  });

  it("olympian_scripture turns draw and upgrade into a burst combo window", () => {
    const rng = createRNG("olympian-scripture");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      hand: [
        {
          instanceId: "c1",
          definitionId: "olympian_scripture",
          upgraded: false,
        },
      ],
      drawPile: [
        { instanceId: "d1", definitionId: "strike", upgraded: false },
        { instanceId: "d2", definitionId: "defend", upgraded: false },
        { instanceId: "d3", definitionId: "strike", upgraded: false },
      ],
      enemies: [
        {
          ...base.enemies[0]!,
          instanceId: "e1",
          currentHp: 30,
          maxHp: 30,
        },
      ],
    });

    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    expect(result.player.energyCurrent).toBe(2);
    expect(result.enemies[0]?.currentHp).toBe(18);
    expect(result.hand).toHaveLength(3);
    expect(result.hand.some((card) => card.upgraded)).toBe(true);
    expect(
      result.exhaustPile.some(
        (card) => card.definitionId === "olympian_scripture" && card.upgraded
      )
    ).toBe(false);
    expect(result.exhaustPile[0]?.definitionId).toBe("olympian_scripture");
  });

  it("void_scripture converts clog in discard into a burst payoff", () => {
    const rng = createRNG("void-scripture");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "void_scripture", upgraded: false },
      ],
      drawPile: [
        { instanceId: "d1", definitionId: "strike", upgraded: false },
        { instanceId: "d2", definitionId: "defend", upgraded: false },
        { instanceId: "d3", definitionId: "strike", upgraded: false },
      ],
      discardPile: [
        { instanceId: "x1", definitionId: "dazed", upgraded: false },
      ],
      enemies: [
        {
          ...base.enemies[0]!,
          instanceId: "e1",
          currentHp: 40,
          maxHp: 40,
        },
      ],
    });

    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    expect(result.enemies[0]?.currentHp).toBe(25);
    expect(result.hand).toHaveLength(2);
    expect(result.discardPile).toHaveLength(2);
    expect(
      result.discardPile.some((card) => card.definitionId === "haunting_regret")
    ).toBe(true);
    expect(result.exhaustPile[0]?.definitionId).toBe("void_scripture");
  });

  it("battle_inscription cashes out stored ink into defense and hand quality", () => {
    const rng = createRNG("battle-inscription");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      player: {
        ...base.player,
        inkPerCardChance: 0,
        inkCurrent: 3,
      },
      hand: [
        {
          instanceId: "c1",
          definitionId: "battle_inscription",
          upgraded: false,
        },
        { instanceId: "c2", definitionId: "strike", upgraded: false },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.inkCurrent).toBe(0);
    expect(result.player.block).toBe(14);
    expect(result.hand).toHaveLength(1);
    expect(result.hand[0]?.definitionId).toBe("strike");
    expect(result.hand[0]?.upgraded).toBe(true);
    expect(
      result.discardPile.some(
        (card) => card.definitionId === "battle_inscription" && card.upgraded
      )
    ).toBe(false);
  });

  it("odin_script converts prior exhaust into a burst payoff without exhausting itself", () => {
    const rng = createRNG("odin-script");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "odin_script", upgraded: false },
      ],
      exhaustPile: [
        { instanceId: "x1", definitionId: "strike", upgraded: false },
        { instanceId: "x2", definitionId: "defend", upgraded: false },
      ],
      enemies: [
        {
          ...base.enemies[0]!,
          instanceId: "e1",
          currentHp: 40,
          maxHp: 40,
        },
      ],
    });

    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    expect(result.enemies[0]?.currentHp).toBe(26);
    expect(result.discardPile.map((card) => card.definitionId)).toEqual([
      "dazed",
      "odin_script",
    ]);
    expect(result.exhaustPile).toHaveLength(2);
    expect(
      result.exhaustPile.some((card) => card.definitionId === "odin_script")
    ).toBe(false);
  });

  it("cosmic_archive turns prior exhaust into a defensive payoff", () => {
    const rng = createRNG("cosmic-archive");
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "cosmic_archive", upgraded: false },
      ],
      exhaustPile: [
        { instanceId: "x1", definitionId: "strike", upgraded: false },
        { instanceId: "x2", definitionId: "defend", upgraded: false },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.block).toBe(12);
    expect(result.player.focus).toBe(1);
    expect(result.discardPile[0]?.definitionId).toBe("dazed");
    expect(
      result.exhaustPile.some((card) => card.definitionId === "cosmic_archive")
    ).toBe(true);
  });

  it("saga_keeper turns prior exhaust into lasting strength scaling", () => {
    const rng = createRNG("saga-keeper");
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "saga_keeper", upgraded: false },
      ],
      exhaustPile: [
        { instanceId: "x1", definitionId: "strike", upgraded: false },
        { instanceId: "x2", definitionId: "defend", upgraded: false },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.focus).toBe(1);
    expect(result.player.strength).toBe(2);
    expect(result.hand).toHaveLength(1);
    expect(result.hand[0]?.definitionId).toBe("strike");
    expect(
      result.exhaustPile.some((card) => card.definitionId === "saga_keeper")
    ).toBe(true);
  });

  it("folk_epic sets up a weak-thorns retaliation payoff", () => {
    const rng = createRNG("folk-epic");
    const state = makeMinimalCombat({
      hand: [{ instanceId: "c1", definitionId: "folk_epic", upgraded: false }],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.block).toBe(6);
    expect(getBuffStacks(result.player.buffs, "THORNS")).toBe(2);
    expect(result.exhaustPile[0]?.definitionId).toBe("folk_epic");
  });

  it("folk_epic makes weak attackers trigger thorns twice", () => {
    const rng = createRNG("folk-epic-retaliation");
    const base = makeMinimalCombat();
    const afterFolkEpic = playCard(
      makeMinimalCombat({
        hand: [
          { instanceId: "c1", definitionId: "folk_epic", upgraded: false },
        ],
      }),
      "c1",
      null,
      false,
      cardDefs,
      rng
    );

    const state = {
      ...afterFolkEpic,
      enemies: [
        {
          ...base.enemies[0]!,
          buffs: applyBuff([], "WEAK", 1, 2),
        },
      ],
    };

    const result = resolveEffects(
      state,
      [{ type: "DAMAGE", value: 8 }],
      {
        source: { type: "enemy", instanceId: "e1" },
        target: "player",
      },
      rng
    );

    expect(result.player.currentHp).toBe(80);
    expect(result.player.block).toBe(0);
    expect(result.enemies[0]?.currentHp).toBe(10);
  });

  it("ink_surge upgrades a card in hand while granting ink and draw", () => {
    const rng = createRNG("ink-surge");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      player: {
        ...base.player,
        inkPerCardChance: 0,
      },
      hand: [
        { instanceId: "c1", definitionId: "ink_surge", upgraded: false },
        { instanceId: "c2", definitionId: "strike", upgraded: false },
      ],
      drawPile: [{ instanceId: "d1", definitionId: "defend", upgraded: false }],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.inkCurrent).toBe(2);
    expect(result.hand).toHaveLength(2);
    expect(result.hand.some((card) => card.upgraded)).toBe(true);
    expect(
      result.discardPile.some(
        (card) => card.definitionId === "ink_surge" && card.upgraded
      )
    ).toBe(false);
  });

  it("ink_surge does not upgrade STATUS cards in hand", () => {
    const rng = createRNG("ink-surge-status");
    const statusCardId = statusCardDefinitionIds[0]!;
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      player: {
        ...base.player,
        inkPerCardChance: 0,
      },
      hand: [
        { instanceId: "c1", definitionId: "ink_surge", upgraded: false },
        {
          instanceId: "status-1",
          definitionId: statusCardId,
          upgraded: false,
        },
        { instanceId: "c2", definitionId: "strike", upgraded: false },
      ],
      drawPile: [{ instanceId: "d1", definitionId: "defend", upgraded: false }],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(
      result.hand.find((card) => card.instanceId === "status-1")?.upgraded
    ).toBe(false);
    expect(result.hand.find((card) => card.instanceId === "c2")?.upgraded).toBe(
      true
    );
  });

  it("ink_surge does not upgrade itself when no other card is available", () => {
    const rng = createRNG("ink-surge-no-self-upgrade");
    const state = makeMinimalCombat({
      hand: [{ instanceId: "c1", definitionId: "ink_surge", upgraded: false }],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(
      result.discardPile.some(
        (card) => card.definitionId === "ink_surge" && card.upgraded
      )
    ).toBe(false);
  });

  it("book_of_ra turns draw and ink into vulnerable burst setup", () => {
    const rng = createRNG("book-of-ra");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      player: {
        ...base.player,
        inkPerCardChance: 0,
      },
      hand: [{ instanceId: "c1", definitionId: "book_of_ra", upgraded: false }],
      drawPile: [
        { instanceId: "d1", definitionId: "strike", upgraded: false },
        { instanceId: "d2", definitionId: "defend", upgraded: false },
      ],
    });

    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    expect(result.player.inkCurrent).toBe(2);
    expect(result.player.strength).toBe(1);
    expect(result.hand).toHaveLength(1);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "VULNERABLE")).toBe(2);
  });

  it("scald_cry bridges draw and strength into bleed pressure", () => {
    const rng = createRNG("scald-cry");
    const state = makeMinimalCombat({
      hand: [{ instanceId: "c1", definitionId: "scald_cry", upgraded: false }],
      drawPile: [{ instanceId: "d1", definitionId: "strike", upgraded: false }],
    });

    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    expect(result.player.strength).toBe(1);
    expect(result.hand).toHaveLength(1);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "BLEED")).toBe(2);
  });

  it("bardic_verse bridges draw and ink into poison", () => {
    const rng = createRNG("bardic-verse");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      player: {
        ...base.player,
        inkPerCardChance: 0,
      },
      hand: [
        { instanceId: "c1", definitionId: "bardic_verse", upgraded: false },
      ],
      drawPile: [{ instanceId: "d1", definitionId: "strike", upgraded: false }],
    });

    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    expect(result.player.inkCurrent).toBe(2);
    expect(result.hand).toHaveLength(1);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "POISON")).toBe(2);
  });

  it("byliny_verse bridges draw and ink into team-wide weak", () => {
    const rng = createRNG("byliny-verse");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      player: {
        ...base.player,
        inkPerCardChance: 0,
      },
      hand: [
        { instanceId: "c1", definitionId: "byliny_verse", upgraded: false },
      ],
      drawPile: [{ instanceId: "d1", definitionId: "strike", upgraded: false }],
      enemies: [
        { ...base.enemies[0]! },
        {
          ...base.enemies[0]!,
          instanceId: "e2",
          currentHp: 18,
          maxHp: 18,
        },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.inkCurrent).toBe(2);
    expect(result.hand).toHaveLength(1);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "WEAK")).toBe(1);
    expect(getBuffStacks(result.enemies[1]?.buffs ?? [], "WEAK")).toBe(1);
  });

  it("eye_of_ra opens a vulnerable combo window with ink and an upgrade", () => {
    const rng = createRNG("eye-of-ra");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      player: {
        ...base.player,
        inkPerCardChance: 0,
      },
      hand: [
        { instanceId: "c1", definitionId: "eye_of_ra", upgraded: false },
        { instanceId: "c2", definitionId: "strike", upgraded: false },
      ],
      drawPile: [
        { instanceId: "d1", definitionId: "defend", upgraded: false },
        { instanceId: "d2", definitionId: "strike", upgraded: false },
      ],
    });

    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    expect(result.player.inkCurrent).toBe(2);
    expect(result.hand).toHaveLength(3);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "VULNERABLE")).toBe(2);
    expect(
      result.hand.some((card) => card.upgraded) ||
        result.discardPile.some(
          (card) => card.definitionId === "eye_of_ra" && card.upgraded
        )
    ).toBe(true);
  });

  it("anansis_web turns team-wide vulnerable into strength tempo", () => {
    const rng = createRNG("anansis-web");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "anansis_web", upgraded: false },
      ],
      drawPile: [{ instanceId: "d1", definitionId: "strike", upgraded: false }],
      enemies: [
        { ...base.enemies[0]! },
        {
          ...base.enemies[0]!,
          instanceId: "e2",
          currentHp: 18,
          maxHp: 18,
        },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.strength).toBe(1);
    expect(result.hand).toHaveLength(1);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "VULNERABLE")).toBe(2);
    expect(getBuffStacks(result.enemies[1]?.buffs ?? [], "VULNERABLE")).toBe(2);
  });

  it("void_librarian trades clean setup for focus and clog", () => {
    const rng = createRNG("void-librarian");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      player: {
        ...base.player,
        inkPerCardChance: 0,
      },
      hand: [
        { instanceId: "c1", definitionId: "void_librarian", upgraded: false },
      ],
    });

    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    expect(result.player.inkCurrent).toBe(2);
    expect(result.player.focus).toBe(1);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "VULNERABLE")).toBe(2);
    expect(
      result.discardPile.some((card) => card.definitionId === "dazed")
    ).toBe(true);
  });

  it("sphinx_riddle turns team-wide vulnerable into focus", () => {
    const rng = createRNG("sphinx-riddle");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "sphinx_riddle", upgraded: false },
      ],
      drawPile: [{ instanceId: "d1", definitionId: "strike", upgraded: false }],
      enemies: [
        { ...base.enemies[0]! },
        {
          ...base.enemies[0]!,
          instanceId: "e2",
          currentHp: 18,
          maxHp: 18,
        },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.focus).toBe(1);
    expect(result.hand).toHaveLength(1);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "VULNERABLE")).toBe(2);
    expect(getBuffStacks(result.enemies[1]?.buffs ?? [], "VULNERABLE")).toBe(2);
  });

  it("norn_prophecy turns vulnerable setup into focus-backed card flow", () => {
    const rng = createRNG("norn-prophecy");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      player: {
        ...base.player,
        inkPerCardChance: 0,
      },
      hand: [
        { instanceId: "c1", definitionId: "norn_prophecy", upgraded: false },
      ],
      drawPile: [{ instanceId: "d1", definitionId: "strike", upgraded: false }],
    });

    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    expect(result.player.inkCurrent).toBe(2);
    expect(result.player.focus).toBe(1);
    expect(result.hand).toHaveLength(1);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "VULNERABLE")).toBe(2);
  });

  it("forbidden_index trades team-wide setup for draw plus clog", () => {
    const rng = createRNG("forbidden-index");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "forbidden_index", upgraded: false },
      ],
      drawPile: [
        { instanceId: "d1", definitionId: "strike", upgraded: false },
        { instanceId: "d2", definitionId: "defend", upgraded: false },
      ],
      enemies: [
        { ...base.enemies[0]! },
        {
          ...base.enemies[0]!,
          instanceId: "e2",
          currentHp: 18,
          maxHp: 18,
        },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.hand).toHaveLength(2);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "VULNERABLE")).toBe(1);
    expect(getBuffStacks(result.enemies[1]?.buffs ?? [], "VULNERABLE")).toBe(1);
    expect(
      result.discardPile.some((card) => card.definitionId === "dazed")
    ).toBe(true);
  });

  it("sacrificial_word turns team-wide vulnerable damage into an ink bridge", () => {
    const rng = createRNG("sacrificial-word");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      player: {
        ...base.player,
        inkPerCardChance: 0,
      },
      hand: [
        { instanceId: "c1", definitionId: "sacrificial_word", upgraded: false },
      ],
      enemies: [
        { ...base.enemies[0]! },
        {
          ...base.enemies[0]!,
          instanceId: "e2",
          currentHp: 18,
          maxHp: 18,
        },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.inkCurrent).toBe(2);
    expect(result.enemies[0]?.currentHp).toBe(10);
    expect(result.enemies[1]?.currentHp).toBe(14);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "VULNERABLE")).toBe(1);
    expect(getBuffStacks(result.enemies[1]?.buffs ?? [], "VULNERABLE")).toBe(1);
  });

  it("snowstorm_trap turns team-wide vulnerable damage into focus tempo", () => {
    const rng = createRNG("snowstorm-trap");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "snowstorm_trap", upgraded: false },
      ],
      enemies: [
        { ...base.enemies[0]! },
        {
          ...base.enemies[0]!,
          instanceId: "e2",
          currentHp: 18,
          maxHp: 18,
        },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.focus).toBe(1);
    expect(result.enemies[0]?.currentHp).toBe(10);
    expect(result.enemies[1]?.currentHp).toBe(14);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "VULNERABLE")).toBe(2);
    expect(getBuffStacks(result.enemies[1]?.buffs ?? [], "VULNERABLE")).toBe(2);
  });

  it("morrigan_curse turns team-wide vulnerable damage into sustain", () => {
    const rng = createRNG("morrigan-curse");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      player: {
        ...base.player,
        currentHp: 50,
      },
      hand: [
        { instanceId: "c1", definitionId: "morrigan_curse", upgraded: false },
      ],
      enemies: [
        { ...base.enemies[0]! },
        {
          ...base.enemies[0]!,
          instanceId: "e2",
          currentHp: 18,
          maxHp: 18,
        },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.currentHp).toBe(53);
    expect(result.enemies[0]?.currentHp).toBe(10);
    expect(result.enemies[1]?.currentHp).toBe(14);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "VULNERABLE")).toBe(2);
    expect(getBuffStacks(result.enemies[1]?.buffs ?? [], "VULNERABLE")).toBe(2);
  });

  it("iron_bard turns a heavy bleed hit into card flow", () => {
    const rng = createRNG("iron-bard");
    const state = makeMinimalCombat({
      hand: [{ instanceId: "c1", definitionId: "iron_bard", upgraded: false }],
      drawPile: [{ instanceId: "d1", definitionId: "strike", upgraded: false }],
    });

    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    expect(result.hand).toHaveLength(1);
    expect(result.enemies[0]?.currentHp).toBe(4);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "BLEED")).toBe(3);
  });

  it("koschei_strike cashes in existing bleed on the target", () => {
    const rng = createRNG("koschei-strike");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "koschei_strike", upgraded: false },
      ],
      enemies: [
        {
          ...base.enemies[0]!,
          currentHp: 30,
          maxHp: 30,
          buffs: [{ type: "BLEED", stacks: 1, duration: 4 }],
        },
      ],
    });

    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    expect(result.enemies[0]?.currentHp).toBe(14);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "BLEED")).toBe(4);
  });

  it("buffalo_charge turns a heavy bleed hit into strength tempo", () => {
    const rng = createRNG("buffalo-charge");
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "buffalo_charge", upgraded: false },
      ],
    });

    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    expect(result.player.strength).toBe(1);
    expect(result.enemies[0]?.currentHp).toBe(3);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "BLEED")).toBe(2);
  });

  it("celtic_illumination turns draw and ink burst into poison pressure", () => {
    const rng = createRNG("celtic-illumination");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      player: {
        ...base.player,
        inkPerCardChance: 0,
      },
      hand: [
        {
          instanceId: "c1",
          definitionId: "celtic_illumination",
          upgraded: false,
        },
      ],
      drawPile: [
        { instanceId: "d1", definitionId: "strike", upgraded: false },
        { instanceId: "d2", definitionId: "defend", upgraded: false },
      ],
    });

    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    expect(result.player.inkCurrent).toBe(4);
    expect(result.hand).toHaveLength(2);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "POISON")).toBe(2);
    expect(result.exhaustPile[0]?.definitionId).toBe("celtic_illumination");
  });

  it("ancestor_archive turns draw and energy burst into team-wide vulnerable", () => {
    const rng = createRNG("ancestor-archive");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "ancestor_archive", upgraded: false },
      ],
      drawPile: [
        { instanceId: "d1", definitionId: "strike", upgraded: false },
        { instanceId: "d2", definitionId: "defend", upgraded: false },
      ],
      enemies: [
        { ...base.enemies[0]! },
        {
          ...base.enemies[0]!,
          instanceId: "e2",
          currentHp: 18,
          maxHp: 18,
        },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.energyCurrent).toBe(3);
    expect(result.hand).toHaveLength(2);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "VULNERABLE")).toBe(1);
    expect(getBuffStacks(result.enemies[1]?.buffs ?? [], "VULNERABLE")).toBe(1);
    expect(result.exhaustPile[0]?.definitionId).toBe("ancestor_archive");
  });

  it("folklore_archive turns draw and energy burst into focus", () => {
    const rng = createRNG("folklore-archive");
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "folklore_archive", upgraded: false },
      ],
      drawPile: [
        { instanceId: "d1", definitionId: "strike", upgraded: false },
        { instanceId: "d2", definitionId: "defend", upgraded: false },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.energyCurrent).toBe(3);
    expect(result.player.focus).toBe(2);
    expect(result.hand).toHaveLength(2);
    expect(result.exhaustPile[0]?.definitionId).toBe("folklore_archive");
  });

  it("embalmed_tome turns draw and ink burst into team-wide weak", () => {
    const rng = createRNG("embalmed-tome");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      player: {
        ...base.player,
        inkPerCardChance: 0,
      },
      hand: [
        { instanceId: "c1", definitionId: "embalmed_tome", upgraded: false },
      ],
      drawPile: [
        { instanceId: "d1", definitionId: "strike", upgraded: false },
        { instanceId: "d2", definitionId: "defend", upgraded: false },
      ],
      enemies: [
        { ...base.enemies[0]! },
        {
          ...base.enemies[0]!,
          instanceId: "e2",
          currentHp: 18,
          maxHp: 18,
        },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.inkCurrent).toBe(4);
    expect(result.hand).toHaveLength(2);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "WEAK")).toBe(1);
    expect(getBuffStacks(result.enemies[1]?.buffs ?? [], "WEAK")).toBe(1);
    expect(result.exhaustPile[0]?.definitionId).toBe("embalmed_tome");
  });

  it("pythian_codex cashes out current ink into damage and hand quality", () => {
    const rng = createRNG("pythian-codex");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      player: {
        ...base.player,
        inkPerCardChance: 0,
        inkCurrent: 4,
      },
      hand: [
        { instanceId: "c1", definitionId: "pythian_codex", upgraded: false },
        { instanceId: "c2", definitionId: "strike", upgraded: false },
      ],
      enemies: [
        {
          ...base.enemies[0]!,
          instanceId: "e1",
          currentHp: 40,
          maxHp: 40,
        },
      ],
    });

    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    expect(result.player.inkCurrent).toBe(0);
    expect(result.enemies[0]?.currentHp).toBe(24);
    expect(result.hand).toHaveLength(1);
    expect(result.hand.some((card) => card.upgraded)).toBe(true);
    expect(
      result.exhaustPile.some(
        (card) => card.definitionId === "pythian_codex" && card.upgraded
      )
    ).toBe(false);
    expect(
      result.exhaustPile.some((card) => card.definitionId === "pythian_codex")
    ).toBe(true);
  });

  it("menders_inkwell heals for current-ink cash-outs", () => {
    const rng = createRNG("menders-inkwell-pythian");
    const base = makeMinimalCombat();
    const started = applyRelicsOnCombatStart(
      makeMinimalCombat({
        player: {
          ...base.player,
          currentHp: 30,
          inkPerCardChance: 0,
          inkCurrent: 4,
        },
        hand: [
          { instanceId: "c1", definitionId: "pythian_codex", upgraded: false },
        ],
        enemies: [
          {
            ...base.enemies[0]!,
            instanceId: "e1",
            currentHp: 40,
            maxHp: 40,
          },
        ],
      }),
      ["menders_inkwell"]
    );

    const result = playCard(started, "c1", "e1", false, cardDefs, rng);

    expect(result.player.currentHp).toBe(34);
    expect(result.player.inkCurrent).toBe(0);
  });

  it("echoing_inkstone boosts current-ink payoffs", () => {
    const rng = createRNG("echoing-inkstone-pythian");
    const base = makeMinimalCombat();
    const started = applyRelicsOnCombatStart(
      makeMinimalCombat({
        player: {
          ...base.player,
          inkPerCardChance: 0,
          inkCurrent: 4,
        },
        hand: [
          { instanceId: "c1", definitionId: "pythian_codex", upgraded: false },
          { instanceId: "c2", definitionId: "strike", upgraded: false },
        ],
        enemies: [
          {
            ...base.enemies[0]!,
            instanceId: "e1",
            currentHp: 40,
            maxHp: 40,
          },
        ],
      }),
      ["echoing_inkstone"]
    );

    const result = playCard(started, "c1", "e1", false, cardDefs, rng);

    expect(result.enemies[0]?.currentHp).toBe(8);
    expect(result.player.inkCurrent).toBe(0);
  });

  it("saga_archive turns draw and energy burst into strength tempo", () => {
    const rng = createRNG("saga-archive");
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "saga_archive", upgraded: false },
      ],
      drawPile: [
        { instanceId: "d1", definitionId: "strike", upgraded: false },
        { instanceId: "d2", definitionId: "defend", upgraded: false },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.energyCurrent).toBe(3);
    expect(result.player.strength).toBe(1);
    expect(result.hand).toHaveLength(2);
    expect(result.exhaustPile[0]?.definitionId).toBe("saga_archive");
  });

  it("annotated_thesis turns defense into hand quality", () => {
    const rng = makeDeterministicRng("annotated-thesis");
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "annotated_thesis", upgraded: false },
        { instanceId: "c2", definitionId: "strike", upgraded: false },
      ],
      drawPile: [{ instanceId: "d1", definitionId: "defend", upgraded: false }],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.block).toBe(6);
    expect(result.hand).toHaveLength(2);
    expect(
      result.hand.some((card) => card.upgraded) ||
        result.discardPile.some((card) => card.upgraded)
    ).toBe(true);
  });

  it("sacred_ink_burst turns poison stacks into a defensive payoff", () => {
    const rng = createRNG("sacred-ink-burst");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      player: {
        ...base.player,
        inkPerCardChance: 0,
      },
      hand: [
        { instanceId: "c1", definitionId: "sacred_ink_burst", upgraded: false },
      ],
      enemies: [
        {
          ...base.enemies[0]!,
          buffs: applyBuff([], "POISON", 3),
        },
      ],
    });

    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    expect(result.player.inkCurrent).toBe(3);
    expect(result.player.block).toBe(6);
    expect(result.enemies[0]?.currentHp).toBe(8);
  });

  it("quetzal_shield turns defense into team-wide weak setup", () => {
    const rng = createRNG("quetzal-shield");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      player: {
        ...base.player,
        inkPerCardChance: 0,
      },
      hand: [
        { instanceId: "c1", definitionId: "quetzal_shield", upgraded: false },
      ],
      enemies: [
        { ...base.enemies[0]! },
        {
          ...base.enemies[0]!,
          instanceId: "e2",
          currentHp: 18,
          maxHp: 18,
        },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.inkCurrent).toBe(2);
    expect(result.player.block).toBe(7);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "WEAK")).toBe(2);
    expect(getBuffStacks(result.enemies[1]?.buffs ?? [], "WEAK")).toBe(2);
  });

  it("baobab_shield converts sustain into a thorny counter stance", () => {
    const rng = createRNG("baobab-shield");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      player: {
        ...base.player,
        currentHp: 70,
      },
      hand: [
        { instanceId: "c1", definitionId: "baobab_shield", upgraded: false },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.currentHp).toBe(73);
    expect(result.player.block).toBe(7);
    expect(getBuffStacks(result.player.buffs, "THORNS")).toBe(2);
  });

  it("leshy_ward cashes in weak stacks into scaling defense", () => {
    const rng = createRNG("leshy-ward");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      player: {
        ...base.player,
        currentHp: 70,
      },
      hand: [{ instanceId: "c1", definitionId: "leshy_ward", upgraded: false }],
      enemies: [
        {
          ...base.enemies[0]!,
          buffs: applyBuff([], "WEAK", 2, 2),
        },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.currentHp).toBe(73);
    expect(result.player.block).toBe(12);
  });

  it("gorgons_gaze turns a flat AOE debuff attack into vulnerable setup and draw", () => {
    const rng = createRNG("gorgons-gaze");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "gorgons_gaze", upgraded: false },
      ],
      drawPile: [{ instanceId: "d1", definitionId: "strike", upgraded: false }],
      enemies: [
        { ...base.enemies[0]! },
        {
          ...base.enemies[0]!,
          instanceId: "e2",
          currentHp: 18,
          maxHp: 18,
        },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.hand).toHaveLength(1);
    expect(result.enemies[0]?.currentHp).toBe(base.enemies[0]!.currentHp - 3);
    expect(result.enemies[1]?.currentHp).toBe(15);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "VULNERABLE")).toBe(1);
    expect(getBuffStacks(result.enemies[1]?.buffs ?? [], "VULNERABLE")).toBe(1);
  });

  it("jaguars_blood bridges bleed pressure into strength", () => {
    const rng = createRNG("jaguars-blood");
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "jaguars_blood", upgraded: false },
      ],
    });

    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    expect(result.player.strength).toBe(1);
    expect(result.enemies[0]?.currentHp).toBe(9);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "BLEED")).toBe(3);
  });

  it("frost_nail cashes in existing weak on its target", () => {
    const rng = createRNG("frost-nail");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      hand: [{ instanceId: "c1", definitionId: "frost_nail", upgraded: false }],
      enemies: [
        {
          ...base.enemies[0]!,
          currentHp: 20,
          maxHp: 20,
          buffs: [{ type: "WEAK", stacks: 2, duration: 2 }],
        },
      ],
    });

    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    expect(result.enemies[0]?.currentHp).toBe(10);
  });

  it("iron_verse applies bleed first, then scales damage from total bleed", () => {
    const rng = createRNG("iron-verse");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      hand: [{ instanceId: "c1", definitionId: "iron_verse", upgraded: false }],
      enemies: [
        {
          ...base.enemies[0]!,
          currentHp: 20,
          maxHp: 20,
          buffs: [{ type: "BLEED", stacks: 1, duration: 4 }],
        },
      ],
    });

    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    expect(result.enemies[0]?.currentHp).toBe(14);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "BLEED")).toBe(3);
  });

  it("logos_strike turns vulnerable into a cantrip setup", () => {
    const rng = createRNG("logos-strike");
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "logos_strike", upgraded: false },
      ],
      drawPile: [{ instanceId: "d1", definitionId: "strike", upgraded: false }],
    });

    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    expect(result.hand).toHaveLength(1);
    expect(result.enemies[0]?.currentHp).toBe(9);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "VULNERABLE")).toBe(1);
  });

  it("kells_strike turns poison pressure into a cantrip attack", () => {
    const rng = createRNG("kells-strike");
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "kells_strike", upgraded: false },
      ],
      drawPile: [{ instanceId: "d1", definitionId: "strike", upgraded: false }],
    });

    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    expect(result.hand).toHaveLength(1);
    expect(result.enemies[0]?.currentHp).toBe(9);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "POISON")).toBe(2);
  });

  it("drum_strike turns bleed pressure into a cantrip attack", () => {
    const rng = createRNG("drum-strike");
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "drum_strike", upgraded: false },
      ],
      drawPile: [{ instanceId: "d1", definitionId: "strike", upgraded: false }],
    });

    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    expect(result.hand).toHaveLength(1);
    expect(result.enemies[0]?.currentHp).toBe(10);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "BLEED")).toBe(2);
  });

  it("death_scroll both stacks poison and cashes it in immediately", () => {
    const rng = createRNG("death-scroll");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "death_scroll", upgraded: false },
      ],
      enemies: [
        {
          ...base.enemies[0]!,
          currentHp: 30,
          maxHp: 30,
          buffs: [{ type: "POISON", stacks: 2 }],
        },
      ],
    });

    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    expect(result.enemies[0]?.currentHp).toBe(23);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "POISON")).toBe(4);
  });

  it("void_shield trades clean defense for clog", () => {
    const rng = createRNG("void-shield");
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "void_shield", upgraded: false },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.block).toBe(11);
    expect(
      result.discardPile.some((card) => card.definitionId === "dazed")
    ).toBe(true);
  });

  it("sacred_papyrus scales defense from poison already on enemies", () => {
    const rng = createRNG("sacred-papyrus");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "sacred_papyrus", upgraded: false },
      ],
      enemies: [
        {
          ...base.enemies[0]!,
          buffs: [{ type: "POISON", stacks: 2 }],
        },
        {
          ...base.enemies[0]!,
          instanceId: "e2",
          currentHp: 18,
          maxHp: 18,
          buffs: [{ type: "POISON", stacks: 1 }],
        },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.block).toBe(11);
  });

  it("fairy_veil bridges block into thorns", () => {
    const rng = createRNG("fairy-veil");
    const state = makeMinimalCombat({
      hand: [{ instanceId: "c1", definitionId: "fairy_veil", upgraded: false }],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.block).toBe(6);
    expect(getBuffStacks(result.player.buffs, "THORNS")).toBe(2);
  });

  it("sealed_tome gives block and focus while adding a dazed", () => {
    const rng = createRNG("sealed-tome");
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "sealed_tome", upgraded: false },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.block).toBe(7);
    expect(result.player.focus).toBe(1);
    expect(
      result.discardPile.some((card) => card.definitionId === "dazed")
    ).toBe(true);
  });

  it("calendric_ward turns defense into vulnerable-based scaling", () => {
    const rng = createRNG("calendric-ward");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      player: {
        ...base.player,
        inkPerCardChance: 0,
      },
      hand: [
        { instanceId: "c1", definitionId: "calendric_ward", upgraded: false },
      ],
      drawPile: [{ instanceId: "d1", definitionId: "strike", upgraded: false }],
      enemies: [
        {
          ...base.enemies[0]!,
          buffs: applyBuff([], "VULNERABLE", 2, 2),
        },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.block).toBe(10);
    expect(result.hand).toHaveLength(1);
  });

  it("nordic_treatise turns defense into draw and focus", () => {
    const rng = createRNG("nordic-treatise");
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "nordic_treatise", upgraded: false },
      ],
      drawPile: [{ instanceId: "d1", definitionId: "strike", upgraded: false }],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.block).toBe(5);
    expect(result.player.focus).toBe(1);
    expect(result.hand).toHaveLength(1);
  });

  it("healing_rhythm turns sustain into draw, ink, and strength", () => {
    const rng = createRNG("healing-rhythm");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      player: {
        ...base.player,
        currentHp: 50,
        inkPerCardChance: 0,
      },
      hand: [
        { instanceId: "c1", definitionId: "healing_rhythm", upgraded: false },
      ],
      drawPile: [{ instanceId: "d1", definitionId: "strike", upgraded: false }],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.currentHp).toBe(55);
    expect(result.player.inkCurrent).toBe(1);
    expect(result.player.strength).toBe(1);
    expect(result.hand).toHaveLength(1);
  });

  it("cauldron_lore bridges sustain into poison pressure", () => {
    const rng = createRNG("cauldron-lore");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      player: {
        ...base.player,
        currentHp: 50,
        inkPerCardChance: 0,
      },
      hand: [
        { instanceId: "c1", definitionId: "cauldron_lore", upgraded: false },
      ],
      drawPile: [{ instanceId: "d1", definitionId: "strike", upgraded: false }],
    });

    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    expect(result.player.currentHp).toBe(53);
    expect(result.player.inkCurrent).toBe(1);
    expect(result.hand).toHaveLength(1);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "POISON")).toBe(2);
  });

  it("druids_breath sustains and draws a replacement card", () => {
    const rng = createRNG("druids-breath");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      player: {
        ...base.player,
        currentHp: 50,
      },
      hand: [
        { instanceId: "c1", definitionId: "druids_breath", upgraded: false },
      ],
      drawPile: [{ instanceId: "d1", definitionId: "strike", upgraded: false }],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.currentHp).toBe(55);
    expect(result.player.focus).toBe(0);
    expect(result.hand).toHaveLength(1);
  });

  it("herb_lore heals the player while setting up weak on the target", () => {
    const rng = createRNG("herb-lore");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      player: {
        ...base.player,
        currentHp: 50,
      },
      hand: [{ instanceId: "c1", definitionId: "herb_lore", upgraded: false }],
      drawPile: [{ instanceId: "d1", definitionId: "strike", upgraded: false }],
    });

    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    expect(result.player.currentHp).toBe(56);
    expect(result.hand).toHaveLength(1);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "WEAK")).toBe(1);
  });

  it("selkie_song bridges sustain into draw and thorns", () => {
    const rng = createRNG("selkie-song");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      player: {
        ...base.player,
        currentHp: 50,
      },
      hand: [
        { instanceId: "c1", definitionId: "selkie_song", upgraded: false },
      ],
      drawPile: [
        { instanceId: "d1", definitionId: "strike", upgraded: false },
        { instanceId: "d2", definitionId: "defend", upgraded: false },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.currentHp).toBe(54);
    expect(getBuffStacks(result.player.buffs, "THORNS")).toBe(2);
    expect(result.hand).toHaveLength(2);
  });

  it("temple_archive upgrades a drawn card while healing", () => {
    const rng = createRNG("temple-archive");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      player: {
        ...base.player,
        currentHp: 50,
      },
      hand: [
        { instanceId: "c1", definitionId: "temple_archive", upgraded: false },
      ],
      drawPile: [{ instanceId: "d1", definitionId: "strike", upgraded: false }],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.currentHp).toBe(54);
    expect(result.hand).toHaveLength(1);
    expect(
      result.hand.some((card) => card.upgraded) ||
        result.discardPile.some(
          (card) => card.definitionId === "temple_archive" && card.upgraded
        )
    ).toBe(true);
  });

  it("osiris_archive turns sustain into a one-shot draw and ink burst", () => {
    const rng = createRNG("osiris-archive");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      player: {
        ...base.player,
        currentHp: 50,
        inkPerCardChance: 0,
      },
      hand: [
        { instanceId: "c1", definitionId: "osiris_archive", upgraded: false },
      ],
      drawPile: [
        { instanceId: "d1", definitionId: "strike", upgraded: false },
        { instanceId: "d2", definitionId: "defend", upgraded: false },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.currentHp).toBe(53);
    expect(result.player.inkCurrent).toBe(1);
    expect(result.hand).toHaveLength(2);
    expect(result.exhaustPile[0]?.definitionId).toBe("osiris_archive");
  });

  it("funerary_rite heals the player while setting up vulnerable", () => {
    const rng = createRNG("funerary-rite");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      player: {
        ...base.player,
        currentHp: 50,
      },
      hand: [
        { instanceId: "c1", definitionId: "funerary_rite", upgraded: false },
      ],
      drawPile: [{ instanceId: "d1", definitionId: "strike", upgraded: false }],
    });

    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    expect(result.player.currentHp).toBe(55);
    expect(result.hand).toHaveLength(1);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "VULNERABLE")).toBe(2);
  });

  it("written_prophecy turns draw volume into burst and sets the next draw to discard", () => {
    const rng = createRNG("written-prophecy");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "written_prophecy", upgraded: false },
      ],
      drawPile: [
        { instanceId: "d1", definitionId: "strike", upgraded: false },
        { instanceId: "d2", definitionId: "defend", upgraded: false },
        { instanceId: "d3", definitionId: "strike", upgraded: false },
      ],
      enemies: [
        {
          ...base.enemies[0]!,
          instanceId: "e1",
          currentHp: 40,
          maxHp: 40,
        },
      ],
    });

    const result = playCard(state, "c1", "e1", false, cardDefs, rng);

    expect(result.hand).toHaveLength(2);
    expect(result.enemies[0]?.currentHp).toBe(34);
    expect(result.playerDisruption.drawsToDiscardRemaining).toBe(1);
    expect(result.exhaustPile).toHaveLength(1);
    expect(result.exhaustPile[0]?.definitionId).toBe("written_prophecy");
  });

  it("fates_decree turns vulnerable stacks into an all-enemies finisher", () => {
    const rng = createRNG("fates-decree");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "fates_decree", upgraded: false },
      ],
      enemies: [
        {
          ...base.enemies[0]!,
          instanceId: "e1",
          currentHp: 40,
          maxHp: 40,
          buffs: [{ type: "VULNERABLE", stacks: 2 }],
        },
        {
          ...base.enemies[0]!,
          instanceId: "e2",
          currentHp: 40,
          maxHp: 40,
          buffs: [{ type: "VULNERABLE", stacks: 1 }],
        },
      ],
    });

    const result = playCard(state, "c1", "all_enemies", false, cardDefs, rng);

    expect(result.enemies[0]?.currentHp).toBe(27);
    expect(result.enemies[1]?.currentHp).toBe(32);
    expect(result.exhaustPile[0]?.definitionId).toBe("fates_decree");
  });

  it("curator_pact replays a real discard card while adding Hexed Parchment", () => {
    const rng = createRNG("curator-pact");
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "curator_pact", upgraded: false },
      ],
      discardPile: [
        { instanceId: "d1", definitionId: "hexed_parchment", upgraded: false },
        { instanceId: "d2", definitionId: "strike", upgraded: false },
        { instanceId: "d3", definitionId: "dazed", upgraded: false },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.energyCurrent).toBe(4);
    expect(result.player.inkCurrent).toBe(1);
    expect(result.hand).toHaveLength(1);
    expect(result.hand[0]?.definitionId).toBe("strike");
    expect(result.discardPile.map((card) => card.definitionId)).toEqual([
      "hexed_parchment",
      "dazed",
      "hexed_parchment",
    ]);
    expect(result.exhaustPile).toHaveLength(1);
    expect(result.exhaustPile[0]?.definitionId).toBe("curator_pact");
  });

  it("iron_samovar grants block and poisons all enemies", () => {
    const rng = createRNG("iron-samovar");
    const base = makeMinimalCombat();
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "iron_samovar", upgraded: false },
      ],
      enemies: [
        {
          ...base.enemies[0]!,
          instanceId: "e1",
          currentHp: 20,
          maxHp: 20,
          buffs: [],
        },
        {
          ...base.enemies[0]!,
          instanceId: "e2",
          currentHp: 18,
          maxHp: 18,
          buffs: [],
        },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.block).toBe(8);
    expect(getBuffStacks(result.enemies[0]?.buffs ?? [], "POISON")).toBe(2);
    expect(getBuffStacks(result.enemies[1]?.buffs ?? [], "POISON")).toBe(2);
  });

  it("xipe_shield marks the next draw to go to discard", () => {
    const rng = createRNG("xipe-shield");
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "xipe_shield", upgraded: false },
      ],
    });

    const result = playCard(state, "c1", null, false, cardDefs, rng);

    expect(result.player.block).toBe(8);
    expect(result.player.inkCurrent).toBe(3);
    expect(result.playerDisruption.drawsToDiscardRemaining).toBe(1);
  });

  it("matryoshka_lore rewards being randomly discarded", () => {
    const rng = createRNG("matryoshka-random-discard");
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "c1", definitionId: "matryoshka_lore", upgraded: false },
      ],
      drawPile: [{ instanceId: "d1", definitionId: "strike", upgraded: false }],
    });

    const result = resolveEffects(
      state,
      [{ type: "FORCE_DISCARD_RANDOM", value: 1 }],
      { source: "player", target: "player", cardDefs },
      rng
    );

    expect(result.player.energyCurrent).toBe(4);
    expect(result.hand).toHaveLength(1);
    expect(result.hand[0]?.definitionId).toBe("strike");
    expect(
      result.discardPile.some((card) => card.definitionId === "matryoshka_lore")
    ).toBe(true);
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

  it("applyInkPower CALLIGRAPHIE upgrades a random card in hand", () => {
    const rng = createRNG("calligraphie-test");
    const statusCardId = statusCardDefinitionIds[0]!;
    const state = makeMinimalCombat({
      player: { ...makeMinimalCombat().player, inkCurrent: 5 },
      hand: [
        {
          instanceId: "status-1",
          definitionId: statusCardId,
          upgraded: false,
        },
        { instanceId: "h1", definitionId: "strike", upgraded: false },
        { instanceId: "h2", definitionId: "defend", upgraded: true },
      ],
    });

    expect(canUseInkPower(state, "CALLIGRAPHIE")).toBe(true);

    const result = applyInkPower(state, "CALLIGRAPHIE", null, cardDefs, rng);

    expect(
      result.hand.find((card) => card.instanceId === "status-1")?.upgraded
    ).toBe(false);
    expect(result.hand.find((card) => card.instanceId === "h1")?.upgraded).toBe(
      true
    );
    const upgradedCount = result.hand.filter((c) => c.upgraded).length;
    expect(upgradedCount).toBe(2);
    expect(result.player.inkCurrent).toBe(2); // 5 - 3
  });

  it("cannot use CALLIGRAPHIE when only STATUS cards are in hand", () => {
    const rng = createRNG("calligraphie-status-only");
    const statusCardId = statusCardDefinitionIds[0]!;
    const state = makeMinimalCombat({
      player: { ...makeMinimalCombat().player, inkCurrent: 5 },
      hand: [
        {
          instanceId: "status-1",
          definitionId: statusCardId,
          upgraded: false,
        },
      ],
    });

    expect(canUseInkPower(state, "CALLIGRAPHIE")).toBe(false);

    const result = applyInkPower(state, "CALLIGRAPHIE", null, cardDefs, rng);

    expect(result).toEqual(state);
  });

  it("applyInkPower ENCRE_NOIRE deals inkCurrent*2 damage to all enemies", () => {
    const rng = createRNG("encrenoire-test");
    const enemy = {
      instanceId: "e1",
      definitionId: "test_enemy",
      name: "Test",
      currentHp: 30,
      maxHp: 30,
      block: 0,
      speed: 5,
      buffs: [],
      intentIndex: 0,
    };
    const state = makeMinimalCombat({
      player: { ...makeMinimalCombat().player, inkCurrent: 5 },
      enemies: [enemy],
    });
    const result = applyInkPower(state, "ENCRE_NOIRE", null, cardDefs, rng);
    // Damage = 5 (inkCurrent before spend) * 2 = 10
    expect(result.enemies[0]!.currentHp).toBe(20);
    expect(result.player.inkCurrent).toBe(1); // 5 - 4
  });

  it("applyInkPower SILENCE applies STUN buff to target enemy", () => {
    const rng = createRNG("silence-test");
    const enemy = {
      instanceId: "e1",
      definitionId: "test_enemy",
      name: "Test",
      currentHp: 30,
      maxHp: 30,
      block: 0,
      speed: 5,
      buffs: [],
      intentIndex: 0,
    };
    const state = makeMinimalCombat({
      player: { ...makeMinimalCombat().player, inkCurrent: 7 },
      enemies: [enemy],
    });
    const result = applyInkPower(state, "SILENCE", "e1", cardDefs, rng);
    const stunBuff = result.enemies[0]!.buffs.find((b) => b.type === "STUN");
    expect(stunBuff).toBeDefined();
    expect(result.player.inkCurrent).toBe(0); // 7 - 7
  });

  it("applyInkPower SILENCE does not spend ink on an elite already under stun immunity", () => {
    const rng = createRNG("silence-immune-target");
    const enemy = {
      instanceId: "e1",
      definitionId: "ink_slime",
      name: "Elite Test",
      currentHp: 30,
      maxHp: 30,
      block: 0,
      speed: 5,
      buffs: [{ type: "STUN_IMMUNITY" as const, stacks: 1, duration: 1 }],
      intentIndex: 0,
      isElite: true,
    };
    const altEnemy = {
      instanceId: "e2",
      definitionId: "ink_slime",
      name: "Backup",
      currentHp: 20,
      maxHp: 20,
      block: 0,
      speed: 4,
      buffs: [],
      intentIndex: 0,
    };
    const state = makeMinimalCombat({
      player: { ...makeMinimalCombat().player, inkCurrent: 7 },
      enemies: [enemy, altEnemy],
    });

    expect(canUseInkPower(state, "SILENCE")).toBe(true);

    const result = applyInkPower(state, "SILENCE", "e1", cardDefs, rng);

    expect(result.player.inkCurrent).toBe(7);
    expect(result.inkPowerUsedThisTurn).toBe(false);
    expect(result.enemies[0]!.buffs).toEqual(enemy.buffs);
  });

  it("SILENCE cannot chain-lock an elite every turn", () => {
    const enemy = {
      instanceId: "e1",
      definitionId: "ink_slime",
      name: "Elite Test",
      currentHp: 30,
      maxHp: 30,
      block: 0,
      speed: 5,
      buffs: [],
      intentIndex: 0,
      isElite: true,
    };
    const state = makeMinimalCombat({
      player: {
        ...makeMinimalCombat().player,
        currentHp: 40,
        maxHp: 40,
        inkCurrent: 7,
      },
      enemies: [enemy],
    });

    const stunned = applyInkPower(
      state,
      "SILENCE",
      "e1",
      cardDefs,
      createRNG("silence-elite-open")
    );
    const afterSkip = executeAlliesEnemiesTurn(
      { ...stunned, phase: "ALLIES_ENEMIES_TURN" },
      enemyDefs,
      allyDefs,
      createRNG("silence-elite-skip")
    );

    expect(afterSkip.player.currentHp).toBe(40);
    expect(
      afterSkip.enemies[0]!.buffs.find((buff) => buff.type === "STUN")
    ).toBeUndefined();
    expect(
      afterSkip.enemies[0]!.buffs.find((buff) => buff.type === "STUN_IMMUNITY")
        ?.duration
    ).toBe(1);

    const lockedTurn = {
      ...afterSkip,
      phase: "PLAYER_TURN" as const,
      inkPowerUsedThisTurn: false,
      usedInkPowersThisTurn: [],
      player: { ...afterSkip.player, inkCurrent: 7 },
    };
    expect(canUseInkPower(lockedTurn, "SILENCE")).toBe(false);

    const afterRecovery = executeAlliesEnemiesTurn(
      { ...lockedTurn, phase: "ALLIES_ENEMIES_TURN" },
      enemyDefs,
      allyDefs,
      createRNG("silence-elite-recovery")
    );

    expect(afterRecovery.player.currentHp).toBeLessThan(
      lockedTurn.player.currentHp
    );
    expect(
      afterRecovery.enemies[0]!.buffs.some(
        (buff) => buff.type === "STUN_IMMUNITY"
      )
    ).toBe(false);

    const recoveredTurn = {
      ...afterRecovery,
      phase: "PLAYER_TURN" as const,
      inkPowerUsedThisTurn: false,
      usedInkPowersThisTurn: [],
      player: { ...afterRecovery.player, inkCurrent: 7 },
    };
    expect(canUseInkPower(recoveredTurn, "SILENCE")).toBe(true);
  });

  it("applyInkPower VISION draws 2 cards", () => {
    const rng = createRNG("vision-test");
    const state = makeMinimalCombat({
      player: { ...makeMinimalCombat().player, inkCurrent: 5 },
    });
    const result = applyInkPower(state, "VISION", null, cardDefs, rng);
    expect(result.hand).toHaveLength(2);
    expect(result.player.inkCurrent).toBe(3); // 5 - 2
  });

  it("applyInkPower INDEX moves card from discard to hand", () => {
    const rng = createRNG("index-test");
    const state = makeMinimalCombat({
      player: { ...makeMinimalCombat().player, inkCurrent: 5 },
      discardPile: [
        { instanceId: "c1", definitionId: "strike", upgraded: false },
      ],
    });
    const result = applyInkPower(state, "INDEX", "c1", cardDefs, rng);
    expect(result.discardPile).toHaveLength(0);
    expect(result.hand).toHaveLength(1);
    expect(result.player.inkCurrent).toBe(2); // 5 - 3
  });

  it("allows using different ink powers in the same turn, but not the same power twice", () => {
    const rng = createRNG("multi-ink-power-turn");
    const state = makeMinimalCombat({
      player: { ...makeMinimalCombat().player, inkCurrent: 5 },
      drawPile: [{ instanceId: "d1", definitionId: "strike", upgraded: false }],
    });

    const afterSeal = applyInkPower(state, "SEAL", null, cardDefs, rng);

    expect(afterSeal.player.block).toBe(8);
    expect(afterSeal.usedInkPowersThisTurn).toEqual(["SEAL"]);
    expect(canUseInkPower(afterSeal, "SEAL")).toBe(false);
    expect(canUseInkPower(afterSeal, "VISION")).toBe(true);

    const afterVision = applyInkPower(
      afterSeal,
      "VISION",
      null,
      cardDefs,
      createRNG("multi-ink-power-turn-vision")
    );

    expect(afterVision.player.inkCurrent).toBe(1);
    expect(afterVision.hand).toHaveLength(1);
    expect(afterVision.usedInkPowersThisTurn).toEqual(["SEAL", "VISION"]);
    expect(canUseInkPower(afterVision, "VISION")).toBe(false);
  });

  it("keeps legacy global lock behavior when the per-power tracking list is absent", () => {
    const legacyLockedState = makeMinimalCombat({
      player: { ...makeMinimalCombat().player, inkCurrent: 7 },
      inkPowerUsedThisTurn: true,
      usedInkPowersThisTurn: undefined,
    });

    expect(canUseInkPower(legacyLockedState, "SEAL")).toBe(false);
    expect(canUseInkPower(legacyLockedState, "VISION")).toBe(false);
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

  it("at difficulty 3, bosses start combat with +6 block per floor", () => {
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
    expect(combat.enemies[0]?.block).toBe(12);
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

  it("at higher difficulties, elite combats can start with an escort enemy", () => {
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const runState = {
      ...createNewRun(
        "run-1",
        "combat-elite-escort",
        starterCards,
        createRNG("combat-elite-escort")
      ),
      floor: 3,
      selectedDifficultyLevel: 4,
    };
    const deterministicEscortRng = {
      seed: "combat-elite-escort-open",
      next: () => 0,
      nextInt: (min: number) => min,
      shuffle: <T>(arr: readonly T[]) => [...arr],
      pick: <T>(arr: readonly T[]) => arr[0]!,
    };

    const combat = initCombat(
      runState,
      ["ink_archon"],
      enemyDefs,
      allyDefs,
      cardDefs,
      deterministicEscortRng
    );

    expect(combat.enemies).toHaveLength(2);
    expect(combat.enemies[0]?.definitionId).toBe("ink_archon");
    expect(combat.enemies[1]?.isElite).not.toBe(true);
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

  it("brace + LOST_CHAPTER do not permanently increase drawCount", () => {
    const rng = createRNG("brace-lostchapter-drawcount");
    const drawPile = Array.from({ length: 20 }).map((_, i) => ({
      instanceId: `d${i + 1}`,
      definitionId: i % 2 === 0 ? "strike" : "defend",
      upgraded: false,
    }));
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "b1", definitionId: "brace", upgraded: false },
        { instanceId: "s1", definitionId: "strike", upgraded: false },
      ],
      drawPile,
      player: {
        ...makeMinimalCombat().player,
        energyCurrent: 3,
        inkCurrent: 2,
        drawCount: 5,
      },
    });

    const afterBrace = playCard(state, "b1", null, false, cardDefs, rng);
    const afterLostChapter = applyInkPower(
      afterBrace,
      "LOST_CHAPTER",
      null,
      cardDefs,
      rng
    );

    expect(afterBrace.player.drawCount).toBe(5);
    expect(afterLostChapter.player.drawCount).toBe(5);
    expect(afterLostChapter.hand.length).toBe(4);
  });

  it("after brace + LOST_CHAPTER, next turn draws exactly one normal hand", () => {
    const rng = createRNG("brace-lostchapter-next-turn");
    const drawPile = Array.from({ length: 20 }).map((_, i) => ({
      instanceId: `d${i + 1}`,
      definitionId: i % 2 === 0 ? "strike" : "defend",
      upgraded: false,
    }));
    const state = makeMinimalCombat({
      hand: [
        { instanceId: "b1", definitionId: "brace", upgraded: false },
        { instanceId: "s1", definitionId: "strike", upgraded: false },
      ],
      drawPile,
      player: {
        ...makeMinimalCombat().player,
        energyCurrent: 3,
        inkCurrent: 2,
        drawCount: 5,
      },
    });

    const afterBrace = playCard(state, "b1", null, false, cardDefs, rng);
    const afterLostChapter = applyInkPower(
      afterBrace,
      "LOST_CHAPTER",
      null,
      cardDefs,
      rng
    );
    const afterEnd = endPlayerTurn(afterLostChapter);
    const afterEnemyPhase = executeAlliesEnemiesTurn(
      afterEnd,
      enemyDefs,
      allyDefs,
      rng
    );

    expect(afterEnemyPhase.phase).toBe("ALLIES_ENEMIES_TURN");

    const nextTurn = startPlayerTurn(afterEnemyPhase, rng);
    expect(nextTurn.hand).toHaveLength(5);
    expect(nextTurn.player.drawCount).toBe(5);
    expect(nextTurn.turnNumber).toBe(afterEnemyPhase.turnNumber + 1);
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

  it("temporary card upgrades do not persist to the next combat", () => {
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const runState = createNewRun(
      "run-temp-upgrade-reset",
      "run-temp-upgrade-reset",
      starterCards,
      createRNG("run-temp-upgrade-reset")
    );

    const firstCombat = initCombat(
      runState,
      ["ink_slime"],
      enemyDefs,
      allyDefs,
      cardDefs,
      createRNG("run-temp-upgrade-reset-1")
    );
    expect(firstCombat.hand.length).toBeGreaterThan(0);

    const upgradedCardId = firstCombat.hand[0]!.instanceId;
    const upgradedCombat = {
      ...firstCombat,
      phase: "COMBAT_WON" as const,
      hand: firstCombat.hand.map((card) =>
        card.instanceId === upgradedCardId ? { ...card, upgraded: true } : card
      ),
    };

    const afterCombat = completeCombat(
      runState,
      upgradedCombat,
      0,
      createRNG("run-temp-upgrade-reset-2"),
      { PAGES: 1 },
      [...cardDefs.values()]
    );

    expect(afterCombat.deck.some((card) => card.upgraded)).toBe(false);

    const nextCombat = initCombat(
      afterCombat,
      ["ink_slime"],
      enemyDefs,
      allyDefs,
      cardDefs,
      createRNG("run-temp-upgrade-reset-3")
    );
    expect(nextCombat.hand.some((card) => card.upgraded)).toBe(false);
    expect(nextCombat.drawPile.some((card) => card.upgraded)).toBe(false);
    expect(nextCombat.discardPile.some((card) => card.upgraded)).toBe(false);
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
      once.drawPile.filter(
        (c) =>
          c.definitionId === "haunting_regret" ||
          c.definitionId === "binding_curse"
      ).length
    ).toBeGreaterThanOrEqual(2);
    expect(
      once.drawPile.some((c) => c.definitionId === "haunting_regret")
    ).toBe(true);

    const twice = executeOneEnemyTurn(
      once,
      bossAfterOnce,
      def,
      createRNG("chapter-phase2-second"),
      enemyDefs
    );
    expect(
      twice.drawPile.filter(
        (c) =>
          c.definitionId === "haunting_regret" ||
          c.definitionId === "binding_curse"
      ).length
    ).toBe(
      once.drawPile.filter(
        (c) =>
          c.definitionId === "haunting_regret" ||
          c.definitionId === "binding_curse"
      ).length
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
        check: (r) => expect(getFenrirUiState(r.enemies[0])?.huntMax).toBe(4),
      },
      {
        id: "medusa",
        check: (r) =>
          expect(getMedusaUiState(r.enemies[0])?.patterns).toHaveLength(2),
      },
      {
        id: "ra_avatar",
        check: (r) => expect(getRaUiState(r.enemies[0])?.chargePerTurn).toBe(2),
      },
      {
        id: "osiris_judgment",
        check: (r) => expect(getOsirisUiState(r.enemies[0])?.threshold).toBe(5),
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
        id: "dagda_shadow",
        check: (r) =>
          expect(getDagdaUiState(r.enemies[0])?.phaseTwo).toBe(true),
      },
      {
        id: "cernunnos_shade",
        check: (r) => {
          expect(r.enemies.some((e) => e.definitionId === "amber_hound")).toBe(
            true
          );
          expect(getCernunnosUiState(r.enemies[0])?.regrowPerTurn).toBe(2);
        },
      },
      {
        id: "baba_yaga_hut",
        check: (r) =>
          expect(r.enemies.some((e) => e.definitionId === "snow_maiden")).toBe(
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
    expect(run.map).toHaveLength(GAME_CONSTANTS.ROOMS_PER_FLOOR);
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

  it("drawRandomBiomeChoices does not force LIBRARY into the pair", () => {
    const choices = drawRandomBiomeChoices(createRNG("alpha"));

    expect(choices).toEqual(["VIKING", "LOVECRAFTIAN"]);
  });

  it("at displayed difficulty 1, the opening floor is forced to LIBRARY", () => {
    const rng = createRNG("forced-library-opening");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const run = createNewRun(
      "run-1",
      "forced-library-opening",
      starterCards,
      rng,
      undefined,
      [],
      undefined,
      undefined,
      [],
      [0, 1],
      1,
      ["LIBRARY", "VIKING"]
    );

    const result = applyDifficultyToRun(run, 0);

    expect(result.selectedDifficultyLevel).toBe(0);
    expect(result.currentBiome).toBe("LIBRARY");
    expect(result.pendingBiomeChoices).toBeNull();
  });

  it("generateFloorMap creates a 16-depth connected floor graph", () => {
    const rng = createRNG("map-gen");
    const map = generateFloorMap(1, rng, "LIBRARY");
    expect(map).toHaveLength(GAME_CONSTANTS.ROOMS_PER_FLOOR);

    expect(map[0]).toHaveLength(1);
    expect(map[0]?.[0]?.type).toBe("COMBAT");
    expect((map[0]?.[0]?.nextNodeIds?.length ?? 0) > 0).toBe(true);

    expect(map[GAME_CONSTANTS.BOSS_ROOM_INDEX - 1]).toHaveLength(1);
    expect(map[GAME_CONSTANTS.BOSS_ROOM_INDEX - 1]?.[0]?.type).toBe("PRE_BOSS");
    expect(map[GAME_CONSTANTS.BOSS_ROOM_INDEX]).toHaveLength(1);
    expect(map[GAME_CONSTANTS.BOSS_ROOM_INDEX]?.[0]?.type).toBe("COMBAT");
  });

  it("generateFloorMap with boss_rush uses bosses in non-boss combat rooms", () => {
    const map = generateFloorMap(
      1,
      createRNG("boss-rush-map"),
      "LIBRARY",
      "boss_rush"
    );
    const firstCombatEnemyId = map[0]?.[0]?.enemyIds?.[0];
    expect(firstCombatEnemyId).toBeDefined();
    if (!firstCombatEnemyId) return;
    const enemy = enemyDefs.get(firstCombatEnemyId);
    expect(enemy?.isBoss).toBe(true);
  });

  it("generateFloorMap keeps early correction rooms and 1-2 merchants per path", () => {
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
      const earlyNodes = map.slice(1, 7).flat();
      const allNodes = map.flat();
      const pathMerchantCounts = enumerateMapPaths(map).map(
        (path) => path.filter((room) => room.type === "MERCHANT").length
      );
      const optionalEliteCount = allNodes.filter(
        (room) => room.type === "COMBAT" && room.isElite
      ).length;

      expect(
        earlyNodes.some(
          (room) => room.type === "MERCHANT" || room.type === "SPECIAL"
        )
      ).toBe(true);
      expect(
        pathMerchantCounts.every((count) => count >= 1 && count <= 2)
      ).toBe(true);
      expect(optionalEliteCount).toBeGreaterThanOrEqual(2);
      expect(
        allNodes.filter((room) => (room.nextNodeIds?.length ?? 0) >= 2).length
      ).toBeGreaterThanOrEqual(8);
      expect(
        allNodes.filter((room) => room.type === "SPECIAL" && room.specialType)
          .length
      ).toBeGreaterThanOrEqual(4);
    }
  });

  it("generateFloorMap creates distinct safe, balanced, and greedy routes", () => {
    const seeds = [
      "map-routes-1",
      "map-routes-2",
      "map-routes-3",
      "map-routes-4",
      "map-routes-5",
      "map-routes-6",
    ];

    for (const seed of seeds) {
      const map = generateFloorMap(1, createRNG(seed), "LIBRARY");
      const preBossIndex = GAME_CONSTANTS.BOSS_ROOM_INDEX - 1;
      const paths = enumerateMapPaths(map).map((path) =>
        path.filter((node) => node.index < preBossIndex)
      );

      const eliteCounts = paths.map(
        (path) =>
          path.filter((node) => node.type === "COMBAT" && node.isElite).length
      );
      const supportKindCounts = paths.map(
        (path) =>
          new Set(
            path
              .map((node) => getPathSupportKind(node))
              .filter((kind): kind is string => kind !== null)
          ).size
      );
      const eventLikeCounts = paths.map(
        (path) =>
          path.filter(
            (node) =>
              node.type === "MERCHANT" ||
              (node.type === "SPECIAL" && node.specialType === "EVENT")
          ).length
      );

      expect(eliteCounts.some((count) => count === 0)).toBe(true);
      expect(eliteCounts.some((count) => count === 1)).toBe(true);
      expect(eliteCounts.some((count) => count >= 2)).toBe(true);
      expect(supportKindCounts.some((count) => count >= 3)).toBe(true);
      expect(eventLikeCounts.some((count) => count >= 2)).toBe(true);
    }
  });

  it("generateFloorMap varies lane signatures across seeds and breaks the fixed center spine", () => {
    const seeds = [
      "map-layout-1",
      "map-layout-2",
      "map-layout-3",
      "map-layout-4",
      "map-layout-5",
      "map-layout-6",
    ];

    const maps = seeds.map((seed) =>
      generateFloorMap(1, createRNG(seed), "LIBRARY")
    );
    const laneSignatures = maps.map((map) =>
      map
        .slice(1, GAME_CONSTANTS.BOSS_ROOM_INDEX - 1)
        .map((depth) => depth.map((room) => room.lane).join(""))
        .join("|")
    );

    expect(new Set(laneSignatures).size).toBeGreaterThanOrEqual(4);
    expect(
      maps.some((map) =>
        map
          .slice(1, GAME_CONSTANTS.BOSS_ROOM_INDEX - 1)
          .some((depth) => depth.every((room) => room.lane !== 2))
      )
    ).toBe(true);
  });

  it("generateFloorMap guarantees an early correction node on floor 1", () => {
    const seeds = [
      "room3-special-1",
      "room3-special-2",
      "room3-special-3",
      "room3-special-4",
    ];
    for (const seed of seeds) {
      const map = generateFloorMap(1, createRNG(seed), "LIBRARY");
      expect(
        map
          .slice(1, 4)
          .flat()
          .some((room) => room.type === "MERCHANT" || room.type === "SPECIAL")
      ).toBe(true);
    }
  });

  it("generateFloorMap connects every node to the next depth", () => {
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
      for (let depthIndex = 0; depthIndex < map.length - 1; depthIndex += 1) {
        const depth = map[depthIndex] ?? [];
        const nextDepthIds = new Set(
          (map[depthIndex + 1] ?? []).map(
            (room, choiceIndex) => room.nodeId ?? `${room.index}-${choiceIndex}`
          )
        );

        for (const room of depth) {
          expect((room.nextNodeIds?.length ?? 0) > 0).toBe(true);
          expect(
            (room.nextNodeIds ?? []).every((nextNodeId) =>
              nextDepthIds.has(nextNodeId)
            )
          ).toBe(true);
        }
      }
    }
  });

  it("generateFloorMap keeps generated combats inside the selected biome", () => {
    const seeds = [
      "biome-only-1",
      "biome-only-2",
      "biome-only-3",
      "biome-only-4",
    ];

    for (const seed of seeds) {
      const map = generateFloorMap(2, createRNG(seed), "GREEK", undefined, 4);
      const combatRooms = map
        .flat()
        .filter((room) => (room.enemyIds?.length ?? 0) > 0);

      for (const room of combatRooms) {
        for (const enemyId of room.enemyIds ?? []) {
          expect(enemyDefs.get(enemyId)?.biome).toBe("GREEK");
        }
      }
    }
  });

  it("generateFloorMap ramps normal encounter danger with room depth and difficulty", () => {
    const openingDangerScores: number[] = [];
    const lateDangerScores: number[] = [];
    const lateEncounterSizes: number[] = [];
    const encounterDanger = (enemyIds: string[]) =>
      enemyIds.reduce(
        (sum, enemyId) => sum + (enemyDefs.get(enemyId)?.tier ?? 1),
        0
      );

    for (let i = 0; i < 12; i += 1) {
      const openingMap = generateFloorMap(
        1,
        createRNG(`danger-opening-${i}`),
        "GREEK",
        undefined,
        1
      );
      const openingEncounter = openingMap[0]?.[0]?.enemyIds ?? [];
      openingDangerScores.push(encounterDanger(openingEncounter));
      expect(openingEncounter).toHaveLength(1);
      expect(encounterDanger(openingEncounter)).toBe(1);

      const lateMap = generateFloorMap(
        3,
        createRNG(`danger-late-${i}`),
        "GREEK",
        undefined,
        5
      );
      const lateNormalCombats = lateMap
        .flat()
        .filter(
          (room) =>
            room.type === "COMBAT" &&
            !room.isElite &&
            room.index >= 9 &&
            room.index < GAME_CONSTANTS.BOSS_ROOM_INDEX
        );

      expect(lateNormalCombats.length).toBeGreaterThan(0);

      const strongestLateCombat = lateNormalCombats.reduce((bestRoom, room) =>
        encounterDanger(room.enemyIds ?? []) > encounterDanger(bestRoom.enemyIds ?? [])
          ? room
          : bestRoom
      );
      const strongestLateDanger = encounterDanger(
        strongestLateCombat.enemyIds ?? []
      );
      lateDangerScores.push(strongestLateDanger);
      lateEncounterSizes.push(strongestLateCombat.enemyIds?.length ?? 0);
    }

    const averageOpeningDanger =
      openingDangerScores.reduce((sum, score) => sum + score, 0) /
      openingDangerScores.length;
    const averageLateDanger =
      lateDangerScores.reduce((sum, score) => sum + score, 0) /
      lateDangerScores.length;

    expect(averageLateDanger).toBeGreaterThan(averageOpeningDanger + 4);
    expect(Math.max(...lateDangerScores)).toBeGreaterThanOrEqual(8);
    expect(Math.max(...lateEncounterSizes)).toBeGreaterThanOrEqual(4);
  });

  it("generateFloorMap keeps floor one danger controlled on difficulty 1", () => {
    const lateFloorOneDangerScores: number[] = [];
    const lateFloorOneEncounterSizes: number[] = [];
    const encounterDanger = (enemyIds: string[]) =>
      enemyIds.reduce(
        (sum, enemyId) => sum + (enemyDefs.get(enemyId)?.tier ?? 1),
        0
      );

    for (let i = 0; i < 16; i += 1) {
      const map = generateFloorMap(
        1,
        createRNG(`danger-floor-one-${i}`),
        "GREEK",
        undefined,
        1
      );
      const lateNormalCombats = map
        .flat()
        .filter(
          (room) =>
            room.type === "COMBAT" &&
            !room.isElite &&
            room.index >= 6 &&
            room.index < GAME_CONSTANTS.BOSS_ROOM_INDEX
        );

      expect(lateNormalCombats.length).toBeGreaterThan(0);

      const strongestLateCombat = lateNormalCombats.reduce((bestRoom, room) =>
        encounterDanger(room.enemyIds ?? []) > encounterDanger(bestRoom.enemyIds ?? [])
          ? room
          : bestRoom
      );
      lateFloorOneDangerScores.push(
        encounterDanger(strongestLateCombat.enemyIds ?? [])
      );
      lateFloorOneEncounterSizes.push(
        strongestLateCombat.enemyIds?.length ?? 0
      );
    }

    const averageLateFloorOneDanger =
      lateFloorOneDangerScores.reduce((sum, score) => sum + score, 0) /
      lateFloorOneDangerScores.length;

    expect(averageLateFloorOneDanger).toBeLessThanOrEqual(2.5);
    expect(Math.max(...lateFloorOneDangerScores)).toBeLessThanOrEqual(3);
    expect(Math.max(...lateFloorOneEncounterSizes)).toBeLessThanOrEqual(2);
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

  it("completeCombat boosts percentage healing with menders_charm", () => {
    const rng = createRNG("meta-heal-menders");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const run = createNewRun("run-1", "meta-heal-menders", starterCards, rng, {
      ...DEFAULT_META_BONUSES,
      healAfterCombat: 10,
    });
    const combatResult = makeMinimalCombat({
      player: { ...makeMinimalCombat().player, currentHp: 50 },
    });

    const result = completeCombat(
      run,
      combatResult,
      0,
      rng,
      { PAGES: 2 },
      [...cardDefs.values()],
      ["menders_charm"]
    );
    expect(result.playerCurrentHp).toBe(59); // 50 + floor(60 * 15%)
  });

  it("completeCombat adds flat post-combat healing with vital_flask", () => {
    const rng = createRNG("meta-heal-vital-flask");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const run = createNewRun(
      "run-1",
      "meta-heal-vital-flask",
      starterCards,
      rng
    );
    const combatResult = makeMinimalCombat({
      player: { ...makeMinimalCombat().player, currentHp: 40 },
    });

    const result = completeCombat(
      run,
      combatResult,
      0,
      rng,
      { PAGES: 2 },
      [...cardDefs.values()],
      ["vital_flask"]
    );
    expect(result.playerCurrentHp).toBe(45); // 40 + 5 from relic
  });

  it("completeCombat records newly encountered enemies for bestiary tracking", () => {
    const rng = createRNG("bestiary-encounter-normal");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const run = createNewRun(
      "run-bestiary",
      "bestiary-encounter",
      starterCards,
      rng
    );
    const combatResult = makeMinimalCombat({
      enemies: [
        {
          instanceId: "enemy-1",
          definitionId: "ink_slime",
          name: "Ink Slime",
          currentHp: 0,
          maxHp: 18,
          block: 0,
          speed: 2,
          buffs: [],
          intentIndex: 0,
        },
      ],
    });

    const result = completeCombat(run, combatResult, 0, rng, { PAGES: 1 });
    expect(result.encounteredEnemies["ink_slime"]).toBe("NORMAL");
    expect(result.enemyKillCounts["ink_slime"]).toBe(1);
  });

  it("completeCombat upgrades bestiary encounter type to elite/boss when needed", () => {
    const rng = createRNG("bestiary-encounter-rank");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const run = {
      ...createNewRun(
        "run-bestiary-rank",
        "bestiary-encounter-rank",
        starterCards,
        rng
      ),
      encounteredEnemies: { ink_archon: "NORMAL" as const },
      enemyKillCounts: { ink_archon: 2 },
    };
    const combatResult = makeMinimalCombat({
      enemies: [
        {
          instanceId: "enemy-elite",
          definitionId: "ink_archon",
          name: "Ink Archon",
          isElite: true,
          currentHp: 0,
          maxHp: 52,
          block: 0,
          speed: 3,
          buffs: [],
          intentIndex: 0,
        },
        {
          instanceId: "enemy-boss",
          definitionId: "chapter_guardian",
          name: "Chapter Guardian",
          isBoss: true,
          currentHp: 0,
          maxHp: 145,
          block: 0,
          speed: 5,
          buffs: [],
          intentIndex: 0,
        },
      ],
    });

    const result = completeCombat(run, combatResult, 0, rng, { PAGES: 1 });
    expect(result.encounteredEnemies["ink_archon"]).toBe("ELITE");
    expect(result.encounteredEnemies["chapter_guardian"]).toBe("BOSS");
    expect(result.enemyKillCounts["ink_archon"]).toBe(3);
    expect(result.enemyKillCounts["chapter_guardian"]).toBe(1);
  });

  it("completeCombat ignores scripted-only enemies for bestiary tracking", () => {
    const rng = createRNG("bestiary-scripted-enemies");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const run = createNewRun(
      "run-bestiary-scripted",
      "bestiary-scripted-enemies",
      starterCards,
      rng
    );
    const combatResult = makeMinimalCombat({
      enemies: [
        {
          instanceId: "enemy-boss",
          definitionId: "the_archivist",
          name: "The Corrupted Archivist",
          isBoss: true,
          currentHp: 0,
          maxHp: 160,
          block: 0,
          speed: 4,
          buffs: [],
          intentIndex: 0,
        },
        {
          instanceId: "inkwell-black",
          definitionId: "archivist_black_inkwell",
          name: "Black Inkwell",
          currentHp: 0,
          maxHp: 30,
          block: 0,
          speed: 0,
          buffs: [],
          intentIndex: 0,
        },
      ],
    });

    const result = completeCombat(run, combatResult, 0, rng, { PAGES: 1 });
    expect(result.encounteredEnemies["the_archivist"]).toBe("BOSS");
    expect(result.enemyKillCounts["the_archivist"]).toBe(1);
    expect(
      result.encounteredEnemies["archivist_black_inkwell"]
    ).toBeUndefined();
    expect(result.enemyKillCounts["archivist_black_inkwell"]).toBeUndefined();
  });

  it("applyRunConditionToRun chaos_draft replaces starter deck with 10 random cards", () => {
    const rng = createRNG("run-condition-chaos-draft");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const run = createNewRun("run-chaos", "run-chaos", starterCards, rng);
    const applied = applyRunConditionToRun(
      {
        ...run,
        selectedDifficultyLevel: 0,
        pendingRunConditionChoices: [
          "chaos_draft",
          "vanilla_run",
          "quiet_pockets",
        ],
      },
      "chaos_draft",
      createRNG("run-condition-chaos-draft-apply"),
      [...cardDefs.values()]
    );

    expect(applied.deck).toHaveLength(10);
    expect(applied.deck.every((card) => card.definitionId !== "strike")).toBe(
      true
    );
  });

  it("applyRunConditionToRun ink_lender grants guaranteed ink on card play", () => {
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const run = createNewRun(
      "run-ink-lender",
      "run-ink-lender",
      starterCards,
      createRNG("run-ink-lender")
    );
    const applied = applyRunConditionToRun(
      {
        ...run,
        selectedDifficultyLevel: 0,
        pendingRunConditionChoices: [
          "ink_lender",
          "vanilla_run",
          "quiet_pockets",
        ],
      },
      "ink_lender",
      createRNG("run-ink-lender-apply"),
      [...cardDefs.values()]
    );

    expect(applied.metaBonuses?.startingInk).toBe(2);
    expect(applied.metaBonuses?.inkPerCardChance).toBe(100);
    expect(applied.metaBonuses?.inkPerCardValue).toBe(0);
    expect(applied.playerMaxHp).toBe(run.playerMaxHp - 8);
    expect(applied.playerCurrentHp).toBe(run.playerCurrentHp - 8);

    const combat = initCombat(
      applied,
      ["ink_slime"],
      enemyDefs,
      allyDefs,
      cardDefs,
      createRNG("run-ink-lender-combat")
    );
    const state = {
      ...combat,
      hand: [{ instanceId: "c1", definitionId: "strike", upgraded: false }],
      drawPile: [],
      discardPile: [],
      exhaustPile: [],
    };
    const result = playCard(
      state,
      "c1",
      "e1",
      false,
      cardDefs,
      createRNG("run-ink-lender-play")
    );

    expect(result.player.inkCurrent).toBe(3);
  });

  it("applyRunConditionToRun isolated_trials keeps the linear map but sharpens the starting deck", () => {
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const run = createNewRun(
      "run-isolated-trials",
      "run-isolated-trials",
      starterCards,
      createRNG("run-isolated-trials")
    );
    const applied = applyRunConditionToRun(
      {
        ...run,
        selectedDifficultyLevel: 0,
        pendingRunConditionChoices: [
          "isolated_trials",
          "vanilla_run",
          "quiet_pockets",
        ],
      },
      "isolated_trials",
      createRNG("run-isolated-trials-apply"),
      [...cardDefs.values()]
    );

    expect(applied.deck).toHaveLength(run.deck.length - 1);
    expect(applied.deck.filter((card) => card.upgraded)).toHaveLength(1);
    expect(applied.map.slice(1, 8).every((depth) => depth.length === 1)).toBe(
      true
    );
  });

  it("createNewRun filters starting rare card to the inferred run character", () => {
    const rng = makeDeterministicRng("new-run-starting-rare");
    const bibliStarterCards = getStarterCardsForCharacter("bibliothecaire").map(
      (card) => ({
        ...card,
        characterId: "bibliothecaire",
      })
    );
    const scribeRare = cardDefs.get("mythic_blow");
    const bibliRare = cardDefs.get("saga_keeper");
    expect(scribeRare).toBeDefined();
    expect(bibliRare).toBeDefined();
    if (!scribeRare || !bibliRare) return;

    const run = createNewRun(
      "run-biblio-starting-rare",
      "run-biblio-starting-rare",
      bibliStarterCards,
      rng,
      { ...DEFAULT_META_BONUSES, startingRareCard: true },
      [],
      undefined,
      [scribeRare, bibliRare]
    );

    expect(run.characterId).toBe("bibliothecaire");
    expect(run.deck.some((card) => card.definitionId === bibliRare.id)).toBe(
      true
    );
    expect(run.deck.some((card) => card.definitionId === scribeRare.id)).toBe(
      false
    );
  });

  it("applyRunConditionToRun filters explicit bonus cards to the current character", () => {
    const bibliStarterCards = getStarterCardsForCharacter("bibliothecaire");
    const run = createNewRun(
      "run-biblio-forbidden-contract",
      "run-biblio-forbidden-contract",
      bibliStarterCards,
      createRNG("run-biblio-forbidden-contract")
    );

    const applied = applyRunConditionToRun(
      {
        ...run,
        characterId: "bibliothecaire",
        selectedDifficultyLevel: 0,
        pendingRunConditionChoices: [
          "forbidden_contract",
          "vanilla_run",
          "quiet_pockets",
        ],
      },
      "forbidden_contract",
      createRNG("run-biblio-forbidden-contract-apply"),
      [...cardDefs.values()]
    );

    expect(
      applied.deck.some((card) => card.definitionId === "haunting_regret")
    ).toBe(true);
    expect(
      applied.deck.some((card) => card.definitionId === "mythic_blow")
    ).toBe(false);
  });

  it("applyRunConditionToRun filters random replacement pools to the current character", () => {
    const rng = makeDeterministicRng("run-condition-chaos-draft-biblio");
    const bibliStarterCards = getStarterCardsForCharacter("bibliothecaire");
    const scribeRare = cardDefs.get("mythic_blow");
    const bibliRare = cardDefs.get("saga_keeper");
    expect(scribeRare).toBeDefined();
    expect(bibliRare).toBeDefined();
    if (!scribeRare || !bibliRare) return;

    const run = createNewRun(
      "run-chaos-biblio",
      "run-chaos-biblio",
      bibliStarterCards,
      createRNG("run-chaos-biblio")
    );
    const applied = applyRunConditionToRun(
      {
        ...run,
        characterId: "bibliothecaire",
        selectedDifficultyLevel: 0,
        unlockedCardIds: [scribeRare.id, bibliRare.id],
        pendingRunConditionChoices: [
          "chaos_draft",
          "vanilla_run",
          "quiet_pockets",
        ],
      },
      "chaos_draft",
      rng,
      [...bibliStarterCards, scribeRare, bibliRare]
    );

    expect(applied.deck).toHaveLength(10);
    expect(
      applied.deck.every((card) => card.definitionId === bibliRare.id)
    ).toBe(true);
  });

  it("applyRunConditionToRun battle_manual upgrades two random starter cards", () => {
    const rng = createRNG("run-condition-battle-manual");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const statusCardId = statusCardDefinitionIds[0]!;
    const baseRun = createNewRun(
      "run-battle-manual",
      "run-battle-manual",
      starterCards,
      rng
    );
    const run = {
      ...baseRun,
      deck: [
        ...baseRun.deck,
        {
          instanceId: "status-1",
          definitionId: statusCardId,
          upgraded: false,
        },
      ],
    };
    const applied = applyRunConditionToRun(
      {
        ...run,
        selectedDifficultyLevel: 0,
        pendingRunConditionChoices: [
          "battle_manual",
          "vanilla_run",
          "quiet_pockets",
        ],
      },
      "battle_manual",
      createRNG("run-condition-battle-manual-apply"),
      [...cardDefs.values()]
    );

    expect(applied.selectedRunConditionId).toBe("battle_manual");
    expect(applied.deck.filter((card) => card.upgraded)).toHaveLength(2);
    expect(
      applied.deck.find((card) => card.instanceId === "status-1")?.upgraded
    ).toBe(false);
  });

  it("applyRunConditionToRun packed_supplies removes one starter card and adds one random collectible", () => {
    const rng = createRNG("run-condition-packed-supplies");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const run = createNewRun(
      "run-packed-supplies",
      "run-packed-supplies",
      starterCards,
      rng
    );
    const starterIds = new Set(starterCards.map((card) => card.id));
    const applied = applyRunConditionToRun(
      {
        ...run,
        selectedDifficultyLevel: 0,
        pendingRunConditionChoices: [
          "packed_supplies",
          "vanilla_run",
          "quiet_pockets",
        ],
      },
      "packed_supplies",
      createRNG("run-condition-packed-supplies-apply"),
      [...cardDefs.values()]
    );

    expect(applied.selectedRunConditionId).toBe("packed_supplies");
    expect(applied.deck).toHaveLength(run.deck.length);
    expect(
      applied.deck.some((card) => !starterIds.has(card.definitionId))
    ).toBe(true);
  });

  it("applyRunConditionToRun curators_patronage grants a start relic with a max HP drawback", () => {
    const rng = createRNG("run-condition-curator");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const run = createNewRun("run-curator", "run-curator", starterCards, rng);
    const applied = applyRunConditionToRun(
      {
        ...run,
        selectedDifficultyLevel: 0,
        pendingRunConditionChoices: [
          "curators_patronage",
          "vanilla_run",
          "quiet_pockets",
        ],
      },
      "curators_patronage",
      createRNG("run-condition-curator-apply"),
      [...cardDefs.values()]
    );

    expect(applied.selectedRunConditionId).toBe("curators_patronage");
    expect(applied.relicIds).toContain("library_prep_satchel");
    expect(applied.playerMaxHp).toBe(run.playerMaxHp - 12);
  });

  it("applyRunConditionToRun accepts legacy vanilla pending choice id", () => {
    const rng = createRNG("run-condition-legacy-vanilla");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const run = createNewRun(
      "run-legacy-vanilla",
      "run-legacy-vanilla",
      starterCards,
      rng
    );
    const applied = applyRunConditionToRun(
      {
        ...run,
        selectedDifficultyLevel: 0,
        pendingRunConditionChoices: [
          "vanilla",
          "quiet_pockets",
          "open_grimoire",
        ],
      },
      "vanilla_run",
      createRNG("run-condition-legacy-vanilla-apply"),
      [...cardDefs.values()]
    );

    expect(applied.selectedRunConditionId).toBe("vanilla_run");
    expect(applied.pendingRunConditionChoices).toEqual([
      "vanilla",
      "quiet_pockets",
      "open_grimoire",
    ]);
  });

  it("applyRunConditionToRun can switch between normal and infinite modes before the run starts", () => {
    const rng = createRNG("run-condition-mode-swap");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const run = createNewRun(
      "run-mode-swap",
      "run-mode-swap",
      starterCards,
      rng
    );

    const withNormalMode = applyRunConditionToRun(
      {
        ...run,
        selectedDifficultyLevel: 0,
        pendingRunConditionChoices: [
          "vanilla_run",
          "infinite_mode",
          "quiet_pockets",
        ],
      },
      "vanilla_run",
      createRNG("run-condition-mode-swap-normal"),
      [...cardDefs.values()]
    );

    const swappedToInfinite = applyRunConditionToRun(
      withNormalMode,
      "infinite_mode",
      createRNG("run-condition-mode-swap-infinite"),
      [...cardDefs.values()]
    );

    expect(withNormalMode.selectedRunConditionId).toBe("vanilla_run");
    expect(swappedToInfinite.selectedRunConditionId).toBe("infinite_mode");
  });

  it("applyRunConditionToRun blocks infinite mode during the first run tutorial", () => {
    const rng = createRNG("run-condition-first-run-infinite");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const run = createNewRun(
      "run-first-run-infinite",
      "run-first-run-infinite",
      starterCards,
      rng
    );

    const blocked = applyRunConditionToRun(
      {
        ...run,
        selectedDifficultyLevel: 0,
        firstRunScript: {
          enabled: true,
          step: "FIRST_COMBAT",
        },
      },
      "infinite_mode",
      createRNG("run-condition-first-run-infinite-apply"),
      [...cardDefs.values()]
    );

    expect(blocked.selectedRunConditionId).toBeNull();
  });

  it("applyRunConditionToRun can apply a normal condition after choosing normal mode", () => {
    const rng = createRNG("run-condition-promote-from-mode");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const run = createNewRun(
      "run-condition-promote-from-mode",
      "run-condition-promote-from-mode",
      starterCards,
      rng
    );

    const withNormalMode = applyRunConditionToRun(
      {
        ...run,
        selectedDifficultyLevel: 0,
        pendingRunConditionChoices: [
          "vanilla_run",
          "quiet_pockets",
          "open_grimoire",
        ],
      },
      "vanilla_run",
      createRNG("run-condition-promote-from-mode-normal"),
      [...cardDefs.values()]
    );

    const withQuietPockets = applyRunConditionToRun(
      withNormalMode,
      "quiet_pockets",
      createRNG("run-condition-promote-from-mode-quiet"),
      [...cardDefs.values()]
    );

    expect(withNormalMode.selectedRunConditionId).toBe("vanilla_run");
    expect(withQuietPockets.selectedRunConditionId).toBe("quiet_pockets");
    expect(withQuietPockets.pendingRunConditionChoices).toHaveLength(0);
  });

  it("completeCombat draws 2 random biome choices after floor 1 boss", () => {
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
    expect(result.pendingBiomeChoices).toEqual(["CELTIC", "LIBRARY"]);
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

  it("completeCombat credits boss progression to the overridden encounter biome", () => {
    const rng = createRNG("boss-override-progression");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const run = createNewRun(
      "run-override-boss",
      "boss-override-progression",
      starterCards,
      rng
    );
    const combat = makeMinimalCombat({
      encounterContext: {
        biome: "VIKING",
        bossDefinitionId: "fenrir",
      },
      enemies: [
        {
          instanceId: "fenrir-1",
          definitionId: "fenrir",
          name: "Fenrir",
          isBoss: true,
          currentHp: 0,
          maxHp: 140,
          block: 0,
          speed: 8,
          buffs: [],
          intentIndex: 0,
        },
      ],
    });

    const result = completeCombat(
      {
        ...run,
        currentBiome: "LIBRARY",
        currentRoom: GAME_CONSTANTS.BOSS_ROOM_INDEX,
      },
      combat,
      0,
      createRNG("boss-override-progression-next"),
      { RUNES: 2 },
      [...cardDefs.values()]
    );

    expect(result.cardUnlockProgress.bossKillsByBiome.VIKING).toBe(1);
    expect(result.cardUnlockProgress.bossKillsByBiome.LIBRARY ?? 0).toBe(0);
  });

  it("completeCombat in infinite mode does not end at the normal final boss", () => {
    const rng = createRNG("boss-floor-cap-infinite");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const run = createNewRun(
      "run-1",
      "boss-floor-cap-infinite",
      starterCards,
      rng
    );
    const combat = makeMinimalCombat();

    const result = completeCombat(
      {
        ...run,
        floor: GAME_CONSTANTS.MAX_FLOORS,
        currentRoom: GAME_CONSTANTS.BOSS_ROOM_INDEX,
        selectedRunConditionId: "infinite_mode",
      },
      combat,
      0,
      createRNG("boss-floor-cap-infinite-next")
    );

    expect(result.status).toBe("IN_PROGRESS");
    expect(result.pendingBiomeChoices).not.toBeNull();
  });

  it("completeCombat in infinite mode does not keep biome resources", () => {
    const rng = createRNG("infinite-no-biome-resources");
    const starterCards = [...cardDefs.values()].filter((c) => c.isStarterCard);
    const run = createNewRun(
      "run-1",
      "infinite-no-biome-resources",
      starterCards,
      rng
    );
    const combat = makeMinimalCombat();

    const result = completeCombat(
      {
        ...run,
        selectedRunConditionId: "infinite_mode",
      },
      combat,
      0,
      createRNG("infinite-no-biome-resources-next"),
      { PAGES: 3 }
    );

    expect(result.earnedResources).toEqual({});
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
    expect(result.map).toHaveLength(GAME_CONSTANTS.ROOMS_PER_FLOOR);
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

describe("Bestiary lore milestones", () => {
  it("uses 1/5/15 milestones for normal enemies", () => {
    expect(getLoreEntryIndexForKillCount("NORMAL", 0)).toBe(0);
    expect(getLoreEntryIndexForKillCount("NORMAL", 1)).toBe(0);
    expect(getLoreEntryIndexForKillCount("NORMAL", 5)).toBe(1);
    expect(getLoreEntryIndexForKillCount("NORMAL", 15)).toBe(2);
  });

  it("uses 1/3/5 milestones for elite enemies", () => {
    expect(getLoreEntryIndexForKillCount("ELITE", 1)).toBe(0);
    expect(getLoreEntryIndexForKillCount("ELITE", 3)).toBe(1);
    expect(getLoreEntryIndexForKillCount("ELITE", 5)).toBe(2);
  });

  it("uses 1/2/3 milestones for bosses", () => {
    expect(getLoreEntryIndexForKillCount("BOSS", 1)).toBe(0);
    expect(getLoreEntryIndexForKillCount("BOSS", 2)).toBe(1);
    expect(getLoreEntryIndexForKillCount("BOSS", 3)).toBe(2);
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
      byCharacter: {},
    };
    const unlocked = computeUnlockedCardIds(shuffled, progress, []);
    expect(unlocked.includes("berserker_charge")).toBe(true);
    expect(unlocked.includes("shield_wall")).toBe(true);
    expect(unlocked.includes("rune_strike")).toBe(false);
    expect(unlocked.includes("iron_verse")).toBe(false);
    expect(unlocked.includes("nordic_treatise")).toBe(false);
  });

  it("unlocks character biome cards only from the matching character progress", () => {
    const allCards = [...cardDefs.values()];
    const progress = {
      enteredBiomes: { LIBRARY: 1 },
      biomeRunsCompleted: {},
      eliteKillsByBiome: {},
      bossKillsByBiome: {},
      byCharacter: {
        bibliothecaire: {
          enteredBiomes: { VIKING: 1 },
          biomeRunsCompleted: {},
          eliteKillsByBiome: {},
          bossKillsByBiome: {},
        },
      },
    };

    const unlocked = computeUnlockedCardIds(allCards, progress, []);
    expect(unlocked.includes("nordic_treatise")).toBe(true);
    expect(unlocked.includes("iron_verse")).toBe(false);
    expect(unlocked.includes("berserker_charge")).toBe(false);
  });

  it("returns missing condition for locked cards in details", () => {
    const allCards = [...cardDefs.values()];
    const progress = {
      enteredBiomes: { LIBRARY: 1 },
      biomeRunsCompleted: {},
      eliteKillsByBiome: {},
      bossKillsByBiome: {},
      byCharacter: {},
    };
    const details = getCardUnlockDetails(allCards, progress, []);
    expect(details["rune_strike"]?.unlocked).toBe(false);
    expect(details["rune_strike"]?.missingCondition).toContain("elite");
    expect(details["iron_verse"]?.missingCondition).toContain("avec Scribe");
    expect(details["nordic_treatise"]?.missingCondition).toContain(
      "avec Bibliothecaire"
    );
  });

  it("unlocks bestiary enemy cards from per-enemy kill thresholds", () => {
    const allCards = [...cardDefs.values()];
    const progress = {
      enteredBiomes: { LIBRARY: 1 },
      biomeRunsCompleted: {},
      eliteKillsByBiome: {},
      bossKillsByBiome: {},
      byCharacter: {},
    };

    const locked = computeUnlockedCardIds(allCards, progress, [], {
      draugr: 4,
      valkyrie: 2,
    });
    expect(locked.includes("bestiary_normal_draugr")).toBe(false);
    expect(locked.includes("bestiary_elite_valkyrie")).toBe(false);

    const unlocked = computeUnlockedCardIds(allCards, progress, [], {
      draugr: 5,
      valkyrie: 3,
    });
    expect(unlocked.includes("bestiary_normal_draugr")).toBe(true);
    expect(unlocked.includes("bestiary_elite_valkyrie")).toBe(true);

    const details = getCardUnlockDetails(allCards, progress, [], {
      anubis_champion: 0,
    });
    expect(
      details["bestiary_elite_anubis_champion"]?.missingCondition
    ).not.toContain("anubis_champion");
  });

  it("keeps selected LIBRARY cards locked at run start", () => {
    const allCards = [...cardDefs.values()];
    const startProgress = {
      enteredBiomes: { LIBRARY: 1 },
      biomeRunsCompleted: {},
      eliteKillsByBiome: {},
      bossKillsByBiome: {},
      byCharacter: {},
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
      byCharacter: {},
    };
    const details = getCardUnlockDetails(allCards, progress, []);
    expect(details["forbidden_appendix"]?.unlocked).toBe(false);
    expect(details["forbidden_appendix"]?.progress).toBe("0/2 objectifs");
    expect(details["forbidden_appendix"]?.missingCondition).toContain(
      "grimoire_des_index"
    );
  });

  it("unlocks key build signature cards by first boss clears instead of endgame pacing", () => {
    const allCards = [...cardDefs.values()];
    const progress = {
      enteredBiomes: {
        LIBRARY: 1,
        GREEK: 1,
        EGYPTIAN: 1,
        LOVECRAFTIAN: 1,
        RUSSIAN: 1,
      },
      biomeRunsCompleted: {},
      eliteKillsByBiome: {
        LIBRARY: 1,
      },
      bossKillsByBiome: {
        LIBRARY: 1,
        GREEK: 1,
        EGYPTIAN: 1,
        LOVECRAFTIAN: 1,
        RUSSIAN: 1,
      },
      byCharacter: {
        scribe: {
          enteredBiomes: {
            LIBRARY: 1,
            GREEK: 1,
            EGYPTIAN: 1,
            LOVECRAFTIAN: 1,
            RUSSIAN: 1,
          },
          biomeRunsCompleted: {},
          eliteKillsByBiome: {
            LIBRARY: 1,
          },
          bossKillsByBiome: {
            LIBRARY: 1,
            GREEK: 1,
            EGYPTIAN: 1,
            LOVECRAFTIAN: 1,
            RUSSIAN: 1,
          },
        },
        bibliothecaire: {
          enteredBiomes: {
            LIBRARY: 1,
            GREEK: 1,
            EGYPTIAN: 1,
            LOVECRAFTIAN: 1,
            RUSSIAN: 1,
          },
          biomeRunsCompleted: {},
          eliteKillsByBiome: {
            LIBRARY: 1,
          },
          bossKillsByBiome: {
            LIBRARY: 1,
            GREEK: 1,
            EGYPTIAN: 1,
            LOVECRAFTIAN: 1,
            RUSSIAN: 1,
          },
        },
      },
    };

    const unlocked = computeUnlockedCardIds(allCards, progress, [
      "grimoire_des_index",
    ]);

    expect(unlocked.includes("final_chapter")).toBe(true);
    expect(unlocked.includes("curator_pact")).toBe(true);
    expect(unlocked.includes("fates_decree")).toBe(true);
    expect(unlocked.includes("book_of_the_dead")).toBe(true);
    expect(unlocked.includes("cosmic_archive")).toBe(true);
    expect(unlocked.includes("folk_epic")).toBe(true);
  });

  it("keeps some bridge cards out of the very first elite band but not the third one anymore", () => {
    const allCards = [...cardDefs.values()];
    const progress = {
      enteredBiomes: { EGYPTIAN: 1, VIKING: 1 },
      biomeRunsCompleted: {},
      eliteKillsByBiome: {
        EGYPTIAN: 2,
        VIKING: 2,
      },
      bossKillsByBiome: {},
      byCharacter: {
        scribe: {
          enteredBiomes: { EGYPTIAN: 1, VIKING: 1 },
          biomeRunsCompleted: {},
          eliteKillsByBiome: {
            EGYPTIAN: 2,
            VIKING: 2,
          },
          bossKillsByBiome: {},
        },
        bibliothecaire: {
          enteredBiomes: { EGYPTIAN: 1, VIKING: 1 },
          biomeRunsCompleted: {},
          eliteKillsByBiome: {
            EGYPTIAN: 2,
            VIKING: 2,
          },
          bossKillsByBiome: {},
        },
      },
    };

    const unlocked = computeUnlockedCardIds(allCards, progress, []);

    expect(unlocked.includes("sacred_ink_burst")).toBe(true);
    expect(unlocked.includes("battle_inscription")).toBe(true);
  });

  it("tracks and serializes biome progress per character alongside global progress", () => {
    let progress: CardUnlockProgress = {
      enteredBiomes: { LIBRARY: 1 },
      biomeRunsCompleted: {},
      eliteKillsByBiome: {},
      bossKillsByBiome: {},
      byCharacter: {},
    };

    progress = onEnterBiome(progress, "VIKING", "bibliothecaire");
    progress = onEliteKilled(progress, "VIKING", "bibliothecaire");
    progress = onBossKilled(progress, "VIKING", "bibliothecaire");

    expect(progress.enteredBiomes.VIKING).toBe(1);
    expect(progress.biomeRunsCompleted.VIKING).toBe(1);
    expect(progress.eliteKillsByBiome.VIKING).toBe(1);
    expect(progress.bossKillsByBiome.VIKING).toBe(1);
    expect(progress.byCharacter.bibliothecaire?.enteredBiomes.VIKING).toBe(1);
    expect(progress.byCharacter.bibliothecaire?.biomeRunsCompleted.VIKING).toBe(
      1
    );
    expect(progress.byCharacter.bibliothecaire?.eliteKillsByBiome.VIKING).toBe(
      1
    );
    expect(progress.byCharacter.bibliothecaire?.bossKillsByBiome.VIKING).toBe(
      1
    );

    const restored = readUnlockProgressFromResources(
      writeUnlockProgressToResources({}, progress)
    );

    expect(restored.enteredBiomes.LIBRARY).toBe(1);
    expect(restored.enteredBiomes.VIKING).toBe(1);
    expect(restored.biomeRunsCompleted.VIKING).toBe(1);
    expect(restored.eliteKillsByBiome.VIKING).toBe(1);
    expect(restored.bossKillsByBiome.VIKING).toBe(1);
    expect(restored.byCharacter?.bibliothecaire?.enteredBiomes.VIKING).toBe(1);
    expect(
      restored.byCharacter?.bibliothecaire?.biomeRunsCompleted.VIKING
    ).toBe(1);
    expect(restored.byCharacter?.bibliothecaire?.eliteKillsByBiome.VIKING).toBe(
      1
    );
    expect(restored.byCharacter?.bibliothecaire?.bossKillsByBiome.VIKING).toBe(
      1
    );
  });

  it("handles legacy progress objects missing byCharacter when entering a biome", () => {
    const legacyProgress = {
      enteredBiomes: { LIBRARY: 1 },
      biomeRunsCompleted: {},
      eliteKillsByBiome: {},
      bossKillsByBiome: {},
    } as unknown as CardUnlockProgress;

    const progress = onEnterBiome(legacyProgress, "LIBRARY", "scribe");

    expect(progress.enteredBiomes.LIBRARY).toBe(1);
    expect(progress.byCharacter.scribe?.enteredBiomes.LIBRARY).toBe(1);
    expect(() =>
      writeUnlockProgressToResources({}, legacyProgress)
    ).not.toThrow();
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

  it("initCombat does not apply extraHp twice", () => {
    const bonuses = {
      ...DEFAULT_META_BONUSES,
      extraHp: 15,
    };
    const bonusRun = createNewRun(
      "run-meta-extra-hp",
      "meta-extra-hp",
      starterCards,
      createRNG("meta-hp-1"),
      bonuses
    );
    const combat = initCombat(
      bonusRun,
      ["ink_slime"],
      enemyDefs,
      allyDefs,
      cardDefs,
      createRNG("meta-hp-2")
    );

    expect(combat.player.maxHp).toBe(bonusRun.playerMaxHp);
    expect(combat.player.currentHp).toBe(bonusRun.playerCurrentHp);
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

  it("normal rewards keep only one guaranteed current-biome card when off-biome options exist", () => {
    const rewardPool = [...cardDefs.values()].filter(
      (card) =>
        !card.isStarterCard &&
        card.isCollectible !== false &&
        (!card.characterId || card.characterId === "scribe") &&
        ["VIKING", "GREEK", "LIBRARY"].includes(card.biome)
    );
    const unlockedCardIds = rewardPool.map((card) => card.id);
    const rewards = generateCombatRewards(
      2,
      3,
      false,
      false,
      1,
      rewardPool,
      createRNG("rewards-viking-mix"),
      "VIKING",
      [],
      unlockedCardIds,
      [],
      0,
      0,
      undefined,
      0,
      0,
      0,
      undefined,
      1,
      false,
      "scribe"
    );

    expect(rewards.cardChoices).toHaveLength(3);
    expect(
      rewards.cardChoices.filter((card) => card.biome === "VIKING").length
    ).toBe(1);
  });

  it("extra reward card choices still keep current-biome picks capped when off-biome options exist", () => {
    const rewardPool = [...cardDefs.values()].filter(
      (card) =>
        !card.isStarterCard &&
        card.isCollectible !== false &&
        (!card.characterId || card.characterId === "scribe") &&
        ["VIKING", "GREEK", "LIBRARY", "EGYPTIAN"].includes(card.biome)
    );
    const unlockedCardIds = rewardPool.map((card) => card.id);
    const rewards = generateCombatRewards(
      2,
      4,
      false,
      false,
      1,
      rewardPool,
      createRNG("rewards-viking-extra-choices"),
      "VIKING",
      ["greek_oracle_drachma", "love_void_compass"],
      unlockedCardIds,
      [],
      0,
      0,
      undefined,
      1,
      0,
      0,
      undefined,
      1,
      false,
      "scribe"
    );

    expect(rewards.cardChoices).toHaveLength(6);
    expect(
      rewards.cardChoices.filter((card) => card.biome === "VIKING").length
    ).toBe(1);
  });

  it("african_griot_archive adds an extra elite card reward choice", () => {
    const rewardPool = [...cardDefs.values()].filter(
      (card) =>
        !card.isStarterCard &&
        card.isCollectible !== false &&
        card.rarity === "RARE" &&
        (!card.characterId || card.characterId === "scribe") &&
        ["VIKING", "GREEK", "LIBRARY"].includes(card.biome)
    );
    const unlockedCardIds = rewardPool.map((card) => card.id);
    const rewards = generateCombatRewards(
      2,
      4,
      false,
      true,
      1,
      rewardPool,
      createRNG("elite-griot-extra-choice"),
      "VIKING",
      ["african_griot_archive"],
      unlockedCardIds,
      [],
      0,
      0,
      undefined,
      0,
      0,
      0,
      undefined,
      1,
      false,
      "scribe"
    );

    expect(rewardPool.length).toBeGreaterThanOrEqual(2);
    expect(rewards.cardChoices).toHaveLength(2);
    expect(rewards.cardChoices.every((card) => card.rarity === "RARE")).toBe(
      true
    );
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

  it("gilded_ledger increases combat gold rewards by 50%", () => {
    const allCards = [...cardDefs.values()];
    const baseRng = createRNG("gilded-ledger-gold");
    const bonusRng = createRNG("gilded-ledger-gold");
    const base = generateCombatRewards(
      2,
      4,
      false,
      false,
      2,
      allCards,
      baseRng,
      "LIBRARY",
      []
    );
    const boosted = generateCombatRewards(
      2,
      4,
      false,
      false,
      2,
      allCards,
      bonusRng,
      "LIBRARY",
      ["gilded_ledger"]
    );
    expect(boosted.gold).toBe(Math.round(base.gold * 1.5));
  });

  it("boss_rush reward multiplier doubles gold and biome resources", () => {
    const allCards = [...cardDefs.values()];
    const baseRng = createRNG("boss-rush-rewards");
    const bonusRng = createRNG("boss-rush-rewards");
    const base = generateCombatRewards(
      2,
      4,
      false,
      false,
      2,
      allCards,
      baseRng,
      "LIBRARY",
      []
    );
    const doubled = generateCombatRewards(
      2,
      4,
      false,
      false,
      2,
      allCards,
      bonusRng,
      "LIBRARY",
      [],
      undefined,
      [],
      0,
      0,
      undefined,
      0,
      0,
      0,
      undefined,
      2
    );
    expect(doubled.gold).toBe(base.gold * 2);
    for (const [resource, amount] of Object.entries(base.biomeResources)) {
      expect(
        (doubled.biomeResources as Record<string, number | undefined>)[resource]
      ).toBe((amount ?? 0) * 2);
    }
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
// Merchant Tests
// ============================

describe("Heal Room", () => {
  it("blood purge removes a card, costs 30% max HP, and advances the room", () => {
    const run = createNewRun(
      "run-heal-room-blood-purge",
      "run-heal-room-blood-purge",
      getStarterCardsForCharacter("scribe"),
      createRNG("run-heal-room-blood-purge")
    );
    const cardToPurge = run.deck[0];
    expect(cardToPurge).toBeDefined();
    if (!cardToPurge) return;

    const bloodPurgeHpCost = getHealRoomBloodPurgeHpCost(run);
    const currentRoom = 4;
    const result = applyHealRoomBloodPurge(
      {
        ...run,
        currentRoom,
      },
      cardToPurge.instanceId
    );

    expect(result.deck).toHaveLength(run.deck.length - 1);
    expect(
      result.deck.some((card) => card.instanceId === cardToPurge.instanceId)
    ).toBe(false);
    expect(result.playerCurrentHp).toBe(run.playerCurrentHp - bloodPurgeHpCost);
    expect(result.currentRoom).toBe(currentRoom + 1);
  });

  it("blood purge stays non-lethal when the sacrifice would drop the player to 0", () => {
    const run = createNewRun(
      "run-heal-room-blood-purge-nonlethal",
      "run-heal-room-blood-purge-nonlethal",
      getStarterCardsForCharacter("scribe"),
      createRNG("run-heal-room-blood-purge-nonlethal")
    );
    const bloodPurgeHpCost = getHealRoomBloodPurgeHpCost(run);

    const result = applyHealRoomBloodPurge(
      {
        ...run,
        playerCurrentHp: bloodPurgeHpCost,
        currentRoom: 7,
      },
      run.deck[0]!.instanceId
    );

    expect(result).toEqual({
      ...run,
      playerCurrentHp: bloodPurgeHpCost,
      currentRoom: 7,
    });
  });
});

describe("Merchant", () => {
  it("generateShopInventory offers one gold purge and one blood purge by default", () => {
    const inventory = generateShopInventory(
      1,
      [...cardDefs.values()],
      [],
      makeDeterministicRng("merchant-purge-layout"),
      undefined,
      0,
      0,
      0,
      [],
      GAME_CONSTANTS.MAX_USABLE_ITEMS,
      undefined,
      [],
      0,
      "scribe"
    );

    const purgeTypes = inventory
      .filter((item) => item.type === "purge" || item.type === "blood_purge")
      .map((item) => item.type);
    expect(purgeTypes).toEqual(["purge", "blood_purge"]);
  });

  it("generateShopInventory makes blood purge a steep HP sacrifice", () => {
    const inventory = generateShopInventory(
      2,
      [...cardDefs.values()],
      [],
      makeDeterministicRng("merchant-blood-purge-cost"),
      undefined,
      0,
      0,
      0,
      [],
      GAME_CONSTANTS.MAX_USABLE_ITEMS,
      undefined,
      [],
      0,
      "scribe"
    );

    const bloodPurgeOffer = inventory.find(
      (item) => item.type === "blood_purge"
    );

    expect(bloodPurgeOffer).toMatchObject({
      type: "blood_purge",
      hpCost: 18,
    });
  });

  it("generateShopInventory keeps floor-1 prices affordable across cards and core services", () => {
    const commonCard = [...cardDefs.values()].find(
      (card) =>
        card.rarity === "COMMON" &&
        !card.isStarterCard &&
        card.isCollectible !== false
    );
    const uncommonCard = [...cardDefs.values()].find(
      (card) =>
        card.rarity === "UNCOMMON" &&
        !card.isStarterCard &&
        card.isCollectible !== false
    );
    const rareCard = [...cardDefs.values()].find(
      (card) =>
        card.rarity === "RARE" &&
        !card.isStarterCard &&
        card.isCollectible !== false
    );
    const uncommonRelic = relicDefinitions.find(
      (relic) => relic.rarity === "UNCOMMON"
    );

    expect(commonCard).toBeDefined();
    expect(uncommonCard).toBeDefined();
    expect(rareCard).toBeDefined();
    expect(uncommonRelic).toBeDefined();
    if (!commonCard || !uncommonCard || !rareCard || !uncommonRelic) return;

    const inventory = generateShopInventory(
      1,
      [commonCard, uncommonCard, rareCard],
      [],
      makeDeterministicRng("merchant-floor-1-prices"),
      [commonCard.id, uncommonCard.id, rareCard.id],
      0,
      0,
      0,
      [],
      GAME_CONSTANTS.MAX_USABLE_ITEMS,
      [uncommonRelic.id],
      [],
      0
    );

    const cardPrices = Object.fromEntries(
      inventory
        .filter((item) => item.type === "card" && item.cardDef)
        .map((item) => [item.cardDef!.rarity, item.price] as const)
    );
    const relicOffer = inventory.find((item) => item.type === "relic");
    const healOffer = inventory.find((item) => item.type === "heal");
    const maxHpOffer = inventory.find((item) => item.type === "max_hp");
    const purgeOffer = inventory.find((item) => item.type === "purge");
    const usableItemOffer = inventory.find(
      (item) => item.type === "usable_item"
    );

    expect(getShopRerollPrice(1, 0)).toBe(26);
    expect(cardPrices.COMMON).toBe(51);
    expect(cardPrices.UNCOMMON).toBe(74);
    expect(cardPrices.RARE).toBe(108);
    expect(relicOffer?.price).toBe(126);
    expect(healOffer?.price).toBe(45);
    expect(maxHpOffer?.price).toBe(101);
    expect(purgeOffer?.price).toBe(90);
    expect(usableItemOffer?.price).toBe(59);
  });

  it("buyShopItem blood purge pays HP instead of gold", () => {
    const run = createNewRun(
      "run-blood-purge",
      "run-blood-purge",
      getStarterCardsForCharacter("scribe"),
      createRNG("run-blood-purge")
    );
    const updated = buyShopItem(run, {
      id: "purge-blood-1",
      type: "blood_purge",
      price: 0,
      hpCost: 8,
    });

    expect(updated).not.toBeNull();
    expect(updated?.gold).toBe(run.gold);
    expect(updated?.playerCurrentHp).toBe(run.playerCurrentHp - 8);
  });

  it("getCardOfferWeight only boosts tuned signatures in their intended offer sources", () => {
    const boostedRare = cardDefs.get("book_of_the_dead");
    const controlRare = cardDefs.get("embalmed_tome");
    expect(boostedRare).toBeDefined();
    expect(controlRare).toBeDefined();
    if (!boostedRare || !controlRare) return;

    const baseRareWeight = getLootRarityWeight("RARE", 0);

    expect(
      getCardOfferWeight(boostedRare, 0, "NORMAL_REWARD", "EGYPTIAN")
    ).toBe(baseRareWeight * 3);
    expect(getCardOfferWeight(boostedRare, 0, "NORMAL_REWARD", "GREEK")).toBe(
      baseRareWeight
    );
    expect(getCardOfferWeight(boostedRare, 0, "ELITE_REWARD", "EGYPTIAN")).toBe(
      baseRareWeight
    );
    expect(getCardOfferWeight(boostedRare, 0, "MERCHANT")).toBe(
      baseRareWeight * 5
    );
    expect(
      getCardOfferWeight(controlRare, 0, "NORMAL_REWARD", "EGYPTIAN")
    ).toBe(baseRareWeight);
    expect(getCardOfferWeight(controlRare, 0, "MERCHANT")).toBe(baseRareWeight);
  });

  it("getCardOfferWeight gives only a modest boost to supported archetypes", () => {
    const blockCard = cardDefs.get("defend");
    expect(blockCard).toBeDefined();
    if (!blockCard) return;

    const baseWeight = getLootRarityWeight(blockCard.rarity, 0);

    expect(
      getCardOfferWeight(blockCard, 0, "NORMAL_REWARD", undefined, {
        archetypeCounts: { BLOCK: 2 },
      })
    ).toBeCloseTo(baseWeight * 1.1);
    expect(
      getCardOfferWeight(blockCard, 0, "NORMAL_REWARD", undefined, {
        archetypeCounts: { BLOCK: 8 },
      })
    ).toBeCloseTo(baseWeight * 1.25);
  });

  it("weighted normal rewards can bias toward a tuned home-biome signature", () => {
    const controlRare = cardDefs.get("embalmed_tome");
    const boostedRare = cardDefs.get("book_of_the_dead");
    expect(controlRare).toBeDefined();
    expect(boostedRare).toBeDefined();
    if (!controlRare || !boostedRare) return;

    const rng = {
      seed: "offer-weight-home-biome",
      next: () => 0.4,
      nextInt: (min: number) => min,
      shuffle: <T>(arr: readonly T[]) => [...arr],
      pick: <T>(arr: readonly T[]) => arr[0]!,
    };

    const homeBiomePick = weightedSampleCardsForOffers(
      [controlRare, boostedRare],
      1,
      rng,
      0,
      "NORMAL_REWARD",
      "EGYPTIAN"
    );
    const offBiomePick = weightedSampleCardsForOffers(
      [controlRare, boostedRare],
      1,
      rng,
      0,
      "NORMAL_REWARD",
      "GREEK"
    );

    expect(homeBiomePick.map((card) => card.id)).toEqual(["book_of_the_dead"]);
    expect(offBiomePick.map((card) => card.id)).toEqual(["embalmed_tome"]);
  });

  it("weighted merchant offers can bias toward a tuned signature card", () => {
    const controlRare = cardDefs.get("embalmed_tome");
    const boostedRare = cardDefs.get("book_of_the_dead");
    expect(controlRare).toBeDefined();
    expect(boostedRare).toBeDefined();
    if (!controlRare || !boostedRare) return;

    const rng = {
      seed: "offer-weight-merchant",
      next: () => 0.4,
      nextInt: (min: number) => min,
      shuffle: <T>(arr: readonly T[]) => [...arr],
      pick: <T>(arr: readonly T[]) => arr[0]!,
    };

    const merchantPick = weightedSampleCardsForOffers(
      [controlRare, boostedRare],
      1,
      rng,
      0,
      "MERCHANT"
    );
    const elitePick = weightedSampleCardsForOffers(
      [controlRare, boostedRare],
      1,
      rng,
      0,
      "ELITE_REWARD"
    );

    expect(merchantPick.map((card) => card.id)).toEqual(["book_of_the_dead"]);
    expect(elitePick.map((card) => card.id)).toEqual(["embalmed_tome"]);
  });

  it("generateShopInventory filters card offers to the current character", () => {
    const rng = makeDeterministicRng("merchant-character-filter");
    const scribeRare = cardDefs.get("mythic_blow");
    const bibliRare = cardDefs.get("saga_keeper");
    expect(scribeRare).toBeDefined();
    expect(bibliRare).toBeDefined();
    if (!scribeRare || !bibliRare) return;

    const inventory = generateShopInventory(
      1,
      [scribeRare, bibliRare],
      [],
      rng,
      [scribeRare.id, bibliRare.id],
      0,
      0,
      0,
      [],
      GAME_CONSTANTS.MAX_USABLE_ITEMS,
      undefined,
      [],
      0,
      "bibliothecaire"
    );

    const offeredCardIds = inventory
      .filter((item) => item.type === "card")
      .map((item) => item.cardDef?.id);
    expect(offeredCardIds).toEqual(["saga_keeper"]);
  });

  it("generateStartMerchantOffers filters card offers to the active character", () => {
    const rng = makeDeterministicRng("start-merchant-character-filter");
    const scribeRare = cardDefs.get("mythic_blow");
    const bibliRare = cardDefs.get("saga_keeper");
    expect(scribeRare).toBeDefined();
    expect(bibliRare).toBeDefined();
    if (!scribeRare || !bibliRare) return;

    const run = {
      ...createNewRun(
        "run-start-merchant-biblio",
        "run-start-merchant-biblio",
        getStarterCardsForCharacter("bibliothecaire"),
        createRNG("start-merchant-base")
      ),
      startMerchantResourcePool: { PAGES: 30 },
      unlockedCardIds: [scribeRare.id, bibliRare.id],
    };

    const offers = generateStartMerchantOffers(
      run,
      [scribeRare, bibliRare],
      [],
      rng,
      "bibliothecaire"
    );

    const offeredCardIds = offers
      .filter((offer) => offer.type === "CARD")
      .map((offer) => offer.cardId);
    expect(offeredCardIds).toEqual(["saga_keeper"]);
  });

  it("generateStartMerchantOffers does not create underpriced offers below the minimum total cost", () => {
    const run = {
      ...createNewRun(
        "run-start-merchant-low-pool",
        "run-start-merchant-low-pool",
        getStarterCardsForCharacter("scribe"),
        createRNG("start-merchant-low-pool")
      ),
      startMerchantResourcePool: { PAGES: 1 },
    };

    const offers = generateStartMerchantOffers(
      run,
      [...cardDefs.values()],
      [...allyDefs.values()],
      makeDeterministicRng("start-merchant-low-pool-offers")
    );

    expect(offers).toEqual([]);
  });

  it("generateStartMerchantOffers can split relic costs across multiple resources", () => {
    const run = {
      ...createNewRun(
        "run-start-merchant-multi-resource",
        "run-start-merchant-multi-resource",
        getStarterCardsForCharacter("scribe"),
        createRNG("start-merchant-multi-resource")
      ),
      startMerchantResourcePool: { PAGES: 6, RUNES: 6 },
    };

    const offers = generateStartMerchantOffers(
      run,
      [...cardDefs.values()],
      [...allyDefs.values()],
      makeDeterministicRng("start-merchant-multi-resource-offers")
    );

    const relicOffer = offers.find((offer) => offer.type === "RELIC");
    expect(relicOffer).toBeDefined();
    const relicCost = relicOffer?.cost ?? {};
    const relicResources = Object.entries(relicCost).filter(
      ([, amount]) => (amount ?? 0) > 0
    );
    const relicTotalCost = Object.values(relicCost).reduce(
      (sum, amount) => sum + (amount ?? 0),
      0
    );
    expect(relicResources.length).toBeGreaterThan(1);
    expect(relicTotalCost).toBeGreaterThanOrEqual(8);
    expect(relicTotalCost).toBeLessThanOrEqual(10);
  });

  it("generateStartMerchantOffers keeps relics expensive even with a small resource pool", () => {
    const run = {
      ...createNewRun(
        "run-start-merchant-small-pool",
        "run-start-merchant-small-pool",
        getStarterCardsForCharacter("scribe"),
        createRNG("start-merchant-small-pool")
      ),
      startMerchantResourcePool: { PAGES: 3, RUNES: 2 },
    };

    const offers = generateStartMerchantOffers(
      run,
      [...cardDefs.values()],
      [...allyDefs.values()],
      makeDeterministicRng("start-merchant-small-pool-offers")
    );

    const relicOffer = offers.find((offer) => offer.type === "RELIC");
    expect(relicOffer).toBeDefined();
    const relicTotalCost = Object.values(relicOffer?.cost ?? {}).reduce(
      (sum, amount) => sum + (amount ?? 0),
      0
    );
    expect(relicTotalCost).toBeGreaterThanOrEqual(4);
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

  it("opening-turn first-skill relics are armed at combat start", () => {
    const state = makeMinimalCombat({
      player: {
        ...makeMinimalCombat().player,
        energyCurrent: 0,
        inkCurrent: 0,
      },
    });
    const started = applyRelicsOnCombatStart(state, [
      "library_margin_inkpot",
      "egypt_tomb_censer",
    ]);
    const result = applyRelicsOnCardPlayed(
      started,
      ["library_margin_inkpot", "egypt_tomb_censer"],
      "SKILL"
    );

    expect(result.player.inkCurrent).toBe(1);
    expect(result.player.energyCurrent).toBe(1);
    expect(result.relicFlags?.turn_first_skill_relic_active).toBe(false);
  });

  it("cursed_diacrit adds energy and injects a curse", () => {
    const state = makeMinimalCombat();
    const result = applyRelicsOnCombatStart(state, ["cursed_diacrit"]);
    expect(result.player.energyMax).toBe(4);
    expect(
      result.discardPile.some((c) => c.definitionId === "haunting_regret")
    ).toBe(true);
  });

  it("love_shub_brood_core injects a random status from the richer pool", () => {
    const state = makeMinimalCombat();
    const result = applyRelicsOnCombatStart(
      state,
      ["love_shub_brood_core"],
      createRNG("shub-brood-status")
    );

    const injectedStatus = result.discardPile[0]?.definitionId;

    expect(injectedStatus).toBeDefined();
    expect(statusCardDefinitionIds).toContain(injectedStatus);
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

  it("surgeon_mi_go_tools retains 50% block and reduces draw by 1", () => {
    const rng = createRNG("surgeon-mi-go-tools");
    const state = makeMinimalCombat({
      phase: "ALLIES_ENEMIES_TURN",
      player: {
        ...makeMinimalCombat().player,
        block: 9,
      },
      drawPile: [
        { instanceId: "c1", definitionId: "strike", upgraded: false },
        { instanceId: "c2", definitionId: "strike", upgraded: false },
        { instanceId: "c3", definitionId: "defend", upgraded: false },
        { instanceId: "c4", definitionId: "defend", upgraded: false },
        { instanceId: "c5", definitionId: "ink_surge", upgraded: false },
      ],
    });

    const result = startPlayerTurn(state, rng, ["surgeon_mi_go_tools"]);

    expect(result.player.block).toBe(4);
    expect(result.hand).toHaveLength(4);
  });

  it("recursive_scratch upgraded draws a card and copies itself into the draw pile", () => {
    const rng = createRNG("recursive-scratch");
    const cardDefs = buildCardDefsMap();
    const state = makeMinimalCombat({
      hand: [
        {
          instanceId: "recursive-1",
          definitionId: "recursive_scratch",
          upgraded: true,
        },
      ],
      drawPile: [
        { instanceId: "draw-1", definitionId: "strike", upgraded: false },
      ],
      discardPile: [],
      exhaustPile: [],
      player: {
        ...makeMinimalCombat().player,
        inkPerCardChance: 0,
        inkPerCardValue: 0,
      },
    });

    const result = playCard(state, "recursive-1", "e1", false, cardDefs, rng);

    expect(result.exhaustPile).toHaveLength(1);
    expect(result.exhaustPile[0]).toMatchObject({
      definitionId: "recursive_scratch",
      upgraded: true,
    });
    expect(result.hand).toHaveLength(1);
    expect(result.hand[0]).toMatchObject({
      definitionId: "strike",
      upgraded: false,
    });
    expect(result.drawPile).toHaveLength(1);
    expect(result.drawPile[0]).toMatchObject({
      definitionId: "recursive_scratch",
      upgraded: true,
    });
  });

  it("recursive_scratch upgraded inked draws a card and adds two copies", () => {
    const rng = createRNG("recursive-scratch-inked");
    const cardDefs = buildCardDefsMap();
    const state = makeMinimalCombat({
      hand: [
        {
          instanceId: "recursive-inked",
          definitionId: "recursive_scratch",
          upgraded: true,
        },
      ],
      drawPile: [
        { instanceId: "draw-1", definitionId: "defend", upgraded: false },
      ],
      discardPile: [],
      exhaustPile: [],
      player: {
        ...makeMinimalCombat().player,
        inkCurrent: 1,
        inkPerCardChance: 0,
        inkPerCardValue: 0,
      },
    });

    const result = playCard(
      state,
      "recursive-inked",
      "e1",
      true,
      cardDefs,
      rng
    );

    expect(result.hand).toHaveLength(1);
    expect(result.hand[0]).toMatchObject({
      definitionId: "defend",
      upgraded: false,
    });
    expect(result.drawPile).toHaveLength(2);
    expect(
      result.drawPile.every((card) => card.definitionId === "recursive_scratch")
    ).toBe(true);
    expect(result.drawPile.every((card) => card.upgraded)).toBe(true);
  });

  it("addCardToRunDeck tracks recursive_scratch for future run-condition unlocks", () => {
    const rng = createRNG("recursive-scratch-unlock-track");
    const starterCards = [...cardDefs.values()].filter(
      (card) => card.isStarterCard
    );
    const run = createNewRun(
      "run-recursive-scratch-unlock-track",
      "run-recursive-scratch-unlock-track",
      starterCards,
      rng
    );

    const next = addCardToRunDeck(run, "recursive_scratch");

    expect(next.earnedResources.__RUN_CONDITION_CARD__recursive_scratch).toBe(
      1
    );
  });

  it("recursive_scratch_opening starts combat with Recursive Scratch in hand", () => {
    const rng = createRNG("recursive-scratch-opening");
    const starterCards = [...cardDefs.values()].filter(
      (card) => card.isStarterCard
    );
    const run = createNewRun(
      "run-recursive-scratch-opening",
      "run-recursive-scratch-opening",
      starterCards,
      rng
    );
    const combat = initCombat(
      {
        ...run,
        selectedDifficultyLevel: 0,
        selectedRunConditionId: "recursive_scratch_opening",
      },
      ["ink_slime"],
      enemyDefs,
      allyDefs,
      cardDefs,
      createRNG("recursive-scratch-opening-combat")
    );

    expect(
      combat.hand.some((card) => card.definitionId === "recursive_scratch")
    ).toBe(true);
    expect(combat.hand).toHaveLength(GAME_CONSTANTS.STARTING_DRAW_COUNT + 1);
  });

  it("spawn_void_ichor grants ink only on the first exhaust each turn", () => {
    const rng = createRNG("spawn-void-ichor");
    const cardDefs = buildCardDefsMap();
    let state = makeMinimalCombat({
      hand: [
        {
          instanceId: "recursive-1",
          definitionId: "recursive_scratch",
          upgraded: false,
        },
        {
          instanceId: "recursive-2",
          definitionId: "recursive_scratch",
          upgraded: false,
        },
      ],
      drawPile: [],
      discardPile: [],
      exhaustPile: [],
      player: {
        ...makeMinimalCombat().player,
        inkPerCardChance: 0,
        inkPerCardValue: 0,
        inkCurrent: 0,
      },
    });

    const beforeFirst = state;
    state = playCard(state, "recursive-1", "e1", false, cardDefs, rng);
    state = applyRelicsOnCardPlayed(state, ["spawn_void_ichor"], "ATTACK", {
      beforeState: beforeFirst,
      targetId: "e1",
      rng,
    });
    expect(state.player.inkCurrent).toBe(1);

    const beforeSecond = state;
    state = playCard(state, "recursive-2", "e1", false, cardDefs, rng);
    state = applyRelicsOnCardPlayed(state, ["spawn_void_ichor"], "ATTACK", {
      beforeState: beforeSecond,
      targetId: "e1",
      rng,
    });
    expect(state.player.inkCurrent).toBe(1);
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

  it("russian_koschei_needle applies vulnerable from the penultimate floor onward", () => {
    const activationFloor = Math.max(1, GAME_CONSTANTS.MAX_FLOORS - 1);
    const beforeActivation = Math.max(1, activationFloor - 1);

    const beforeResult = applyRelicsOnCombatStart(
      makeMinimalCombat({ floor: beforeActivation }),
      ["russian_koschei_needle"]
    );
    const activeResult = applyRelicsOnCombatStart(
      makeMinimalCombat({ floor: activationFloor }),
      ["russian_koschei_needle"]
    );

    expect(getBuffStacks(beforeResult.enemies[0]?.buffs ?? [], "VULNERABLE")).toBe(
      0
    );
    expect(getBuffStacks(activeResult.enemies[0]?.buffs ?? [], "VULNERABLE")).toBe(
      1
    );
  });

  it("plague_carillon deals 1 damage to all enemies on card played", () => {
    const state = makeMinimalCombat({
      enemies: [
        { ...makeMinimalCombat().enemies[0]!, currentHp: 10, maxHp: 10 },
        {
          ...makeMinimalCombat().enemies[0]!,
          instanceId: "e2",
          currentHp: 12,
          maxHp: 12,
        },
      ],
    });
    const result = applyRelicsOnCardPlayed(state, ["plague_carillon"], "SKILL");
    expect(result.enemies[0]?.currentHp).toBe(9);
    expect(result.enemies[1]?.currentHp).toBe(11);
  });

  it("scribe_opening_glyph rewards the first card of the turn based on its type", () => {
    const attackState = makeMinimalCombat({
      player: {
        ...makeMinimalCombat().player,
        block: 0,
      },
    });
    const attackResult = applyRelicsOnCardPlayed(
      attackState,
      ["scribe_opening_glyph"],
      "ATTACK"
    );
    expect(attackResult.player.block).toBe(4);

    const skillState = makeMinimalCombat({
      player: {
        ...makeMinimalCombat().player,
        inkCurrent: 0,
      },
    });
    const skillResult = applyRelicsOnCardPlayed(
      skillState,
      ["scribe_opening_glyph"],
      "SKILL"
    );
    expect(skillResult.player.inkCurrent).toBe(1);
  });

  it("scribe_black_index boosts the first skill and splashes on the first attack", () => {
    const skillState = makeMinimalCombat({
      player: {
        ...makeMinimalCombat().player,
        energyCurrent: 0,
      },
    });
    const skillResult = applyRelicsOnCardPlayed(
      skillState,
      ["scribe_black_index"],
      "SKILL"
    );
    expect(skillResult.player.energyCurrent).toBe(1);

    const attackState = makeMinimalCombat({
      enemies: [
        { ...makeMinimalCombat().enemies[0]!, instanceId: "e1" },
        {
          ...makeMinimalCombat().enemies[0]!,
          instanceId: "e2",
          currentHp: 14,
          maxHp: 14,
        },
      ],
    });
    const attackResult = applyRelicsOnCardPlayed(
      attackState,
      ["scribe_black_index"],
      "ATTACK",
      { targetId: "e1" }
    );
    expect(attackResult.enemies[0]?.currentHp).toBe(14);
    expect(attackResult.enemies[1]?.currentHp).toBe(11);
  });

  it("bibliothecaire relics reward repeated skill turns", () => {
    const firstSkill = applyRelicsOnCardPlayed(
      makeMinimalCombat({
        drawPile: [
          { instanceId: "draw-1", definitionId: "strike", upgraded: false },
        ],
        player: {
          ...makeMinimalCombat().player,
          focus: 0,
        },
      }),
      ["bibliothecaire_quiet_lens", "bibliothecaire_cross_reference"],
      "SKILL",
      { rng: createRNG("bibliothecaire-skill-1") }
    );
    expect(firstSkill.player.focus).toBe(1);
    expect(firstSkill.hand).toHaveLength(0);

    const secondSkill = applyRelicsOnCardPlayed(
      firstSkill,
      ["bibliothecaire_quiet_lens", "bibliothecaire_cross_reference"],
      "SKILL",
      { rng: createRNG("bibliothecaire-skill-2") }
    );
    expect(secondSkill.hand.map((card) => card.instanceId)).toContain("draw-1");
  });

  it("phoenix_ash heals at turn start", () => {
    const state = makeMinimalCombat({
      phase: "ALLIES_ENEMIES_TURN",
      player: {
        ...makeMinimalCombat().player,
        currentHp: 30,
      },
    });
    const result = startPlayerTurn(state, createRNG("phoenix-ash"), [
      "phoenix_ash",
    ]);
    expect(result.player.currentHp).toBe(32);
  });

  it("ink_spindle grants focus at turn end when hand is empty", () => {
    const state = makeMinimalCombat({
      hand: [],
      player: {
        ...makeMinimalCombat().player,
        focus: 0,
      },
    });
    const result = endPlayerTurn(state, ["ink_spindle"]);
    expect(result.player.focus).toBe(1);
  });

  it("bibliothecaire_grand_catalogue banks energy for the next turn", () => {
    const endState = endPlayerTurn(
      makeMinimalCombat({
        hand: [
          { instanceId: "c1", definitionId: "strike", upgraded: false },
          { instanceId: "c2", definitionId: "defend", upgraded: false },
        ],
        player: {
          ...makeMinimalCombat().player,
          focus: 0,
          block: 0,
        },
        relicCounters: {
          turn_skill_count: 2,
        },
      }),
      ["bibliothecaire_grand_catalogue"]
    );

    expect(endState.player.focus).toBe(1);
    expect(endState.player.block).toBe(4);
    expect(endState.relicCounters?.next_turn_energy_bonus).toBe(1);

    const nextTurn = startPlayerTurn(
      endState,
      createRNG("bibliothecaire-grand-catalogue"),
      ["bibliothecaire_grand_catalogue"]
    );
    expect(nextTurn.player.energyCurrent).toBe(4);
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

  it("armor-punish damage scales from player block and bypasses it", () => {
    const state = makeStateWithBlock(12);
    const effects: Effect[] = [
      { type: "DAMAGE_PER_TARGET_BLOCK", value: 2 },
      { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
    ];
    const result = resolveEffects(state, effects, enemyCtx, rng);

    expect(result.player.currentHp).toBe(state.player.currentHp - 6);
    expect(result.player.block).toBe(12);
    expect(getBuffStacks(result.player.buffs, "VULNERABLE")).toBe(2);
  });

  it("mixed base damage and armor-punish damage punishes stacking block", () => {
    const state = makeStateWithBlock(12);
    const effects: Effect[] = [
      { type: "DAMAGE", value: 2 },
      { type: "DAMAGE_PER_TARGET_BLOCK", value: 2 },
      { type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE", duration: 2 },
    ];
    const result = resolveEffects(state, effects, enemyCtx, rng);

    expect(result.player.currentHp).toBe(state.player.currentHp - 5);
    expect(result.player.block).toBe(10);
    expect(getBuffStacks(result.player.buffs, "VULNERABLE")).toBe(2);
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
          ...makeMinimalCombat().enemies[0]!,
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
          ...makeMinimalCombat().enemies[0]!,
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

  it("damage if target has debuff only triggers when the target is already afflicted", () => {
    const poisonedState = makeMinimalCombat({
      enemies: [
        {
          ...makeMinimalCombat().enemies[0]!,
          buffs: applyBuff([], "POISON", 2),
        },
      ],
    });
    const cleanState = makeMinimalCombat();
    const effects: Effect[] = [
      { type: "DAMAGE", value: 4 },
      { type: "DAMAGE_IF_TARGET_HAS_DEBUFF", value: 4, buff: "POISON" },
    ];

    const poisonedResult = resolveEffects(
      poisonedState,
      effects,
      { source: "player", target: { type: "enemy", instanceId: "e1" } },
      rng
    );
    const cleanResult = resolveEffects(
      cleanState,
      effects,
      { source: "player", target: { type: "enemy", instanceId: "e1" } },
      rng
    );

    expect(poisonedResult.enemies[0]?.currentHp).toBe(6);
    expect(cleanResult.enemies[0]?.currentHp).toBe(10);
  });

  it("ward negates the next damage taken and is consumed", () => {
    const state = makeMinimalCombat({
      player: {
        ...makeMinimalCombat().player,
        buffs: applyBuff([], "WARD", 1),
      },
    });
    const result = resolveEffects(
      state,
      [{ type: "DAMAGE", value: 9 }],
      enemyCtx,
      rng
    );

    expect(result.player.currentHp).toBe(state.player.currentHp);
    expect(getBuffStacks(result.player.buffs, "WARD")).toBe(0);
  });

  it("Deep One Dossier gains damage each time it is played this combat", () => {
    const rng = createRNG("deep-one-scaling");
    const state = makeMinimalCombat({
      player: { ...makeMinimalCombat().player, energyCurrent: 2 },
      hand: [
        {
          instanceId: "deep-1",
          definitionId: "bestiary_normal_deep_one",
          upgraded: false,
        },
        {
          instanceId: "deep-2",
          definitionId: "bestiary_normal_deep_one",
          upgraded: false,
        },
      ],
      drawPile: [],
      discardPile: [],
      relicCounters: {},
    });

    const afterFirst = playCard(state, "deep-1", "e1", false, cardDefs, rng);
    const afterSecond = playCard(
      afterFirst,
      "deep-2",
      "e1",
      false,
      cardDefs,
      rng
    );

    expect(afterFirst.enemies[0]?.currentHp).toBe(10);
    expect(afterSecond.enemies[0]?.currentHp).toBe(3);
  });

  it("Venom Rite triggers after six poison are applied by player cards", () => {
    const rng = createRNG("venom-rite");
    const state = makeMinimalCombat({
      player: { ...makeMinimalCombat().player, energyCurrent: 2 },
      enemies: [
        { ...makeMinimalCombat().enemies[0]! },
        {
          instanceId: "e2",
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
      hand: [
        {
          instanceId: "anubis-1",
          definitionId: "bestiary_elite_anubis_champion",
          upgraded: false,
        },
      ],
      drawPile: [],
      discardPile: [],
      relicCounters: {},
    });

    const afterAnubis = playCard(state, "anubis-1", null, false, cardDefs, rng);
    const afterPoison = resolveEffects(
      afterAnubis,
      [{ type: "APPLY_DEBUFF", value: 3, buff: "POISON" }],
      { source: "player", target: "all_enemies" },
      rng
    );

    expect(getBuffStacks(afterAnubis.player.buffs, "POISON_BURST")).toBe(1);
    expect(afterPoison.enemies[0]?.currentHp).toBe(9);
    expect(afterPoison.enemies[1]?.currentHp).toBe(9);
    expect(afterPoison.relicCounters?.poison_burst_progress).toBe(0);
  });

  it("Ember Flow refunds energy when a card exhausts", () => {
    const rng = createRNG("ember-flow");
    const state = makeMinimalCombat({
      player: { ...makeMinimalCombat().player, energyCurrent: 2 },
      hand: [
        {
          instanceId: "legba-1",
          definitionId: "bestiary_elite_legba_emissary",
          upgraded: false,
        },
      ],
      drawPile: [],
      discardPile: [],
      relicCounters: {},
    });

    const afterPlay = playCard(state, "legba-1", null, false, cardDefs, rng);
    const afterTriggers = applyRelicsOnCardPlayed(afterPlay, [], "POWER", {
      beforeState: state,
      rng,
    });

    expect(getBuffStacks(afterTriggers.player.buffs, "EXHAUST_ENERGY")).toBe(1);
    expect(afterTriggers.player.energyCurrent).toBe(1);
  });

  it("Stonebound blocks future block gain after Domovoi Titan Trophy", () => {
    const rng = createRNG("stonebound");
    const state = makeMinimalCombat({
      player: { ...makeMinimalCombat().player, energyCurrent: 2 },
      hand: [
        {
          instanceId: "domovoi-1",
          definitionId: "bestiary_elite_domovoi_titan",
          upgraded: false,
        },
      ],
      drawPile: [],
      discardPile: [],
      relicCounters: {},
    });

    const afterPlay = playCard(state, "domovoi-1", null, false, cardDefs, rng);
    const afterExtraBlock = resolveEffects(
      afterPlay,
      [{ type: "BLOCK", value: 10 }],
      { source: "player", target: "player" },
      rng
    );

    expect(afterPlay.player.block).toBe(30);
    expect(getBuffStacks(afterPlay.player.buffs, "STONEBOUND")).toBe(1);
    expect(afterExtraBlock.player.block).toBe(30);
  });
});
