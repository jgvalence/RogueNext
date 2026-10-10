import { describe, expect, it } from "vitest";
import type { CombatState } from "../schemas/combat-state";
import type { CardDefinition } from "../schemas/cards";
import { resolveEffects } from "../engine/effects";
import { createRNG } from "../engine/rng";
import { getBuffStacks } from "../engine/buffs";
import { startPlayerTurn } from "../engine/combat";
import { playCard } from "../engine/cards";
import { applyInkPower } from "../engine/ink";
import { lootableCardDefinitions } from "../data/cards";

function makeCombat(overrides: Partial<CombatState> = {}): CombatState {
  return {
    floor: 1,
    enemyDamageScale: 1,
    turnNumber: 1,
    phase: "PLAYER_TURN",
    player: {
      currentHp: 80,
      maxHp: 80,
      block: 0,
      energyCurrent: 1,
      energyMax: 3,
      inkCurrent: 0,
      inkMax: 10,
      inkPerCardChance: 0,
      inkPerCardValue: 0,
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
        definitionId: "one",
        name: "One",
        currentHp: 20,
        maxHp: 20,
        block: 0,
        speed: 1,
        buffs: [],
        intentIndex: 0,
      },
      {
        instanceId: "e2",
        definitionId: "two",
        name: "Two",
        currentHp: 20,
        maxHp: 20,
        block: 0,
        speed: 1,
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

const skill: CardDefinition = {
  id: "rhythm_skill",
  name: "Rhythm Skill",
  type: "SKILL",
  energyCost: 1,
  inkCost: 0,
  targeting: "SELF",
  rarity: "COMMON",
  description: "Test.",
  effects: [],
  inkedVariant: null,
  upgrade: null,
  isStarterCard: false,
  biome: "AFRICAN",
};

describe("character identity mechanics", () => {
  it("builds a Griot rhythm by alternating card types", () => {
    const state = makeCombat({
      lastPlayedCardType: "ATTACK",
      rhythmStreak: 2,
      hand: [{ instanceId: "skill", definitionId: skill.id, upgraded: false }],
    });
    const result = resolveEffects(
      state,
      [{ type: "RHYTHM_REWARD", value: 1 }],
      {
        source: "player",
        target: "player",
        sourceCardInstanceId: "skill",
        cardDefs: new Map([[skill.id, skill]]),
      },
      createRNG("rhythm")
    );
    expect(result.rhythmStreak).toBe(3);
    expect(result.player.inkCurrent).toBe(1);
  });

  it("makes the Fool's immediate energy create explicit future debt", () => {
    const result = resolveEffects(
      makeCombat(),
      [{ type: "TAKE_ENERGY_DEBT", value: 2 }],
      { source: "player", target: "player" },
      createRNG("debt")
    );
    expect(result.player.energyCurrent).toBe(3);
    expect(result.pendingEnergyDebt).toBe(2);
    const nextTurn = startPlayerTurn(
      { ...result, phase: "ALLIES_ENEMIES_TURN" },
      createRNG("debt-turn")
    );
    expect(nextTurn.pendingEnergyDebt).toBe(0);
    expect(nextTurn.player.energyCurrent).toBe(1);
  });

  it("returns archived cards upgraded on the following turn", () => {
    const archived = {
      instanceId: "stored",
      definitionId: "strike",
      upgraded: true,
    };
    const result = startPlayerTurn(
      makeCombat({ phase: "ALLIES_ENEMIES_TURN", archivedCards: [archived] }),
      createRNG("archive-return")
    );
    expect(result.archivedCards).toEqual([]);
    expect(result.hand).toContainEqual(archived);
  });

  it("reveals and reverses the top of the Librarian draw pile", () => {
    const drawPile = ["one", "two", "three", "hidden"].map((definitionId) => ({
      instanceId: definitionId,
      definitionId,
      upgraded: false,
    }));
    const result = resolveEffects(
      makeCombat({ drawPile }),
      [{ type: "REVEAL_AND_REVERSE_TOP", value: 3 }],
      { source: "player", target: "player" },
      createRNG("reverse-top")
    );
    expect(result.drawPile.map((card) => card.definitionId)).toEqual([
      "three",
      "two",
      "one",
      "hidden",
    ]);
    expect(result.revealedDrawCards).toBe(3);
  });

  it("rewards the Librarian for playing at an empty draw pile", () => {
    const empty = resolveEffects(
      makeCombat({ drawPile: [] }),
      [{ type: "EMPTY_DRAW_PILE_BLOCK", value: 10 }],
      { source: "player", target: "player" },
      createRNG("empty-library")
    );
    const nonEmpty = resolveEffects(
      makeCombat({
        drawPile: [
          { instanceId: "one", definitionId: "strike", upgraded: false },
        ],
      }),
      [{ type: "EMPTY_DRAW_PILE_BLOCK", value: 10 }],
      { source: "player", target: "player" },
      createRNG("non-empty-library")
    );
    expect(empty.player.block).toBe(10);
    expect(nonEmpty.player.block).toBe(0);
  });

  it("archives another card, upgrades it, and replaces it immediately", () => {
    const state = makeCombat({
      hand: [
        { instanceId: "source", definitionId: "archive", upgraded: false },
        { instanceId: "target", definitionId: "strike", upgraded: false },
      ],
      drawPile: [
        { instanceId: "drawn", definitionId: "defend", upgraded: false },
      ],
    });
    const result = resolveEffects(
      state,
      [{ type: "ARCHIVE_AND_DRAW", value: 1 }],
      { source: "player", target: "player", sourceCardInstanceId: "source" },
      createRNG("archive")
    );
    expect(result.archivedCards).toEqual([
      expect.objectContaining({ instanceId: "target", upgraded: true }),
    ]);
    expect(result.hand.some((card) => card.instanceId === "drawn")).toBe(true);
  });

  it("propagates Poison and Bleed without changing the original target", () => {
    const state = makeCombat({
      enemies: makeCombat().enemies.map((enemy, index) =>
        index === 0
          ? {
              ...enemy,
              buffs: [
                { type: "POISON", stacks: 3 },
                { type: "BLEED", stacks: 2 },
              ],
            }
          : enemy
      ),
    });
    const result = resolveEffects(
      state,
      [{ type: "PROPAGATE_DOT", value: 1 }],
      { source: "player", target: { type: "enemy", instanceId: "e1" } },
      createRNG("spread")
    );
    expect(getBuffStacks(result.enemies[1]!.buffs, "POISON")).toBe(3);
    expect(getBuffStacks(result.enemies[1]!.buffs, "BLEED")).toBe(2);
  });

  it("allows an Ink transformation to change a card's target", () => {
    const definitions = new Map(
      lootableCardDefinitions.map((card) => [card.id, card] as const)
    );
    const state = makeCombat({
      player: { ...makeCombat().player, energyCurrent: 3, inkCurrent: 3 },
      hand: [
        { instanceId: "heavy", definitionId: "heavy_strike", upgraded: false },
      ],
    });
    const result = playCard(
      state,
      "heavy",
      null,
      true,
      definitions,
      createRNG("ink-target")
    );
    expect(result.enemies.every((enemy) => enemy.currentHp < 20)).toBe(true);
  });

  it("makes Seal scale with the Scribe's annotated hand", () => {
    const definitions = new Map(
      lootableCardDefinitions.map((card) => [card.id, card] as const)
    );
    const result = applyInkPower(
      makeCombat({
        player: { ...makeCombat().player, inkCurrent: 2 },
        hand: [
          { instanceId: "one", definitionId: "strike", upgraded: true },
          { instanceId: "two", definitionId: "defend", upgraded: true },
        ],
      }),
      "SEAL",
      null,
      definitions,
      createRNG("annotated-seal")
    );
    expect(result.player.block).toBe(10);
  });

  it("makes Vision manipulate the Librarian's next draws", () => {
    const definitions = new Map(
      lootableCardDefinitions.map((card) => [card.id, card] as const)
    );
    const drawPile = ["one", "two", "three", "four"].map((definitionId) => ({
      instanceId: definitionId,
      definitionId,
      upgraded: false,
    }));
    const result = applyInkPower(
      makeCombat({
        player: { ...makeCombat().player, inkCurrent: 2 },
        drawPile,
      }),
      "VISION",
      null,
      definitions,
      createRNG("librarian-vision")
    );
    expect(result.hand.map((card) => card.definitionId)).toEqual([
      "three",
      "two",
    ]);
    expect(result.drawPile.map((card) => card.definitionId)).toEqual([
      "one",
      "four",
    ]);
    expect(result.revealedDrawCards).toBe(1);
  });

  it("builds a Griot Refrain across ink powers", () => {
    const definitions = new Map(
      lootableCardDefinitions.map((card) => [card.id, card] as const)
    );
    const result = applyInkPower(
      makeCombat({
        rhythmStreak: 2,
        player: { ...makeCombat().player, inkCurrent: 2 },
        drawPile: [
          { instanceId: "draw", definitionId: "strike", upgraded: false },
        ],
      }),
      "VENIN",
      null,
      definitions,
      createRNG("griot-ink-refrain")
    );
    expect(result.rhythmStreak).toBe(3);
    expect(result.hand).toHaveLength(1);
    expect(result.player.inkCurrent).toBe(1);
  });

  it("makes the Fool's Double Down create future debt", () => {
    const definitions = new Map(
      lootableCardDefinitions.map((card) => [card.id, card] as const)
    );
    const result = applyInkPower(
      makeCombat({ player: { ...makeCombat().player, inkCurrent: 1 } }),
      "DOUBLE_MISE",
      null,
      definitions,
      createRNG("fool-double-down")
    );
    expect(result.nextCardDoubleDamage).toBe(true);
    expect(result.pendingEnergyDebt).toBe(1);
  });
});
