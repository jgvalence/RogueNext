import { describe, expect, it } from "vitest";
import { buildAllyDefsMap, buildCardDefsMap, buildEnemyDefsMap } from "../data";
import { playCard, canPlayCard, canPlayCardInked } from "../engine/cards";
import { initCombat } from "../engine/combat";
import { executeOneEnemyTurn } from "../engine/enemies";
import {
  ARCHIVIST_BLACK_INKWELL_ID,
  ARCHIVIST_PALE_INKWELL_ID,
} from "../engine/archivist";
import type { CombatState } from "../schemas/combat-state";
import { makeTestRunState } from "@/test/factories/game-state";

const enemyDefs = buildEnemyDefsMap();
const allyDefs = buildAllyDefsMap();
const cardDefs = buildCardDefsMap();

function makeDeterministicRng(seed: string) {
  return {
    seed,
    next: () => 0,
    nextInt: (min: number, _max: number) => min,
    shuffle: <T>(arr: readonly T[]) => [...arr],
    pick: <T>(arr: readonly T[]) => arr[0]!,
  };
}

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
      inkCurrent: 3,
      inkMax: 10,
      inkPerCardChance: 0,
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
        instanceId: "boss",
        definitionId: "the_archivist",
        name: "The Corrupted Archivist",
        currentHp: 140,
        maxHp: 140,
        block: 0,
        speed: 7,
        buffs: [],
        intentIndex: 0,
      },
      {
        instanceId: "black",
        definitionId: ARCHIVIST_BLACK_INKWELL_ID,
        name: "Black Inkwell",
        currentHp: 22,
        maxHp: 22,
        block: 0,
        speed: 1,
        buffs: [],
        intentIndex: 0,
      },
      {
        instanceId: "pale",
        definitionId: ARCHIVIST_PALE_INKWELL_ID,
        name: "Pale Inkwell",
        currentHp: 18,
        maxHp: 18,
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

describe("the corrupted archivist", () => {
  it("starts the fight with two inkwells and a visible opening cost redaction", () => {
    const runState = makeTestRunState({
      deck: [
        { instanceId: "mythic", definitionId: "mythic_blow", upgraded: false },
        { instanceId: "fortify", definitionId: "fortify", upgraded: false },
        { instanceId: "strike-1", definitionId: "strike", upgraded: false },
        { instanceId: "strike-2", definitionId: "strike", upgraded: false },
        { instanceId: "defend-1", definitionId: "defend", upgraded: false },
      ],
    });

    const combat = initCombat(
      runState,
      ["the_archivist"],
      enemyDefs,
      allyDefs,
      cardDefs,
      makeDeterministicRng("archivist-init")
    );

    expect(combat.enemies.map((enemy) => enemy.definitionId)).toEqual([
      "the_archivist",
      ARCHIVIST_BLACK_INKWELL_ID,
      ARCHIVIST_PALE_INKWELL_ID,
    ]);
    expect(combat.cardRedactions).toEqual([
      {
        cardInstanceId: "mythic",
        sourceEnemyDefinitionId: ARCHIVIST_BLACK_INKWELL_ID,
        type: "COST",
      },
    ]);
  });

  it("restores cost-redacted cards when the black inkwell dies", () => {
    let state = makeMinimalCombat({
      player: {
        ...makeMinimalCombat().player,
        energyCurrent: 1,
        energyMax: 1,
      },
      hand: [
        { instanceId: "atk", definitionId: "quick_feint", upgraded: false },
        { instanceId: "fort", definitionId: "fortify", upgraded: false },
      ],
      enemies: [
        makeMinimalCombat().enemies[0]!,
        {
          ...makeMinimalCombat().enemies[1]!,
          currentHp: 2,
          maxHp: 22,
        },
        makeMinimalCombat().enemies[2]!,
      ],
      cardRedactions: [
        {
          cardInstanceId: "fort",
          sourceEnemyDefinitionId: ARCHIVIST_BLACK_INKWELL_ID,
          type: "COST",
        },
      ],
    });

    expect(canPlayCard(state, "fort", cardDefs)).toBe(false);

    state = playCard(
      state,
      "atk",
      "black",
      false,
      cardDefs,
      makeDeterministicRng("archivist-kill-inkwell")
    );

    expect(
      state.cardRedactions?.some(
        (redaction) =>
          redaction.sourceEnemyDefinitionId === ARCHIVIST_BLACK_INKWELL_ID
      ) ?? false
    ).toBe(false);
    expect(canPlayCard(state, "fort", cardDefs)).toBe(true);
  });

  it("text redaction suppresses both upgrade payoff and inked use", () => {
    const state = makeMinimalCombat({
      player: {
        ...makeMinimalCombat().player,
        energyCurrent: 2,
        energyMax: 2,
        inkCurrent: 3,
      },
      hand: [{ instanceId: "fort", definitionId: "fortify", upgraded: true }],
      cardRedactions: [
        {
          cardInstanceId: "fort",
          sourceEnemyDefinitionId: ARCHIVIST_PALE_INKWELL_ID,
          type: "TEXT",
        },
      ],
    });

    expect(canPlayCardInked(state, "fort", cardDefs)).toBe(false);

    const result = playCard(
      state,
      "fort",
      null,
      false,
      cardDefs,
      makeDeterministicRng("archivist-text-redaction")
    );

    expect(result.player.block).toBe(8);
  });

  it("Ink Erasure applies a new cost redaction while the black inkwell lives", () => {
    const baseDef = enemyDefs.get("the_archivist");
    expect(baseDef).toBeDefined();
    if (!baseDef) return;

    const state = makeMinimalCombat({
      phase: "ALLIES_ENEMIES_TURN",
      hand: [],
      drawPile: [
        { instanceId: "fort", definitionId: "fortify", upgraded: false },
        { instanceId: "strike-1", definitionId: "strike", upgraded: false },
      ],
      enemies: [
        {
          ...makeMinimalCombat().enemies[0]!,
          intentIndex: 0,
        },
        makeMinimalCombat().enemies[1]!,
        makeMinimalCombat().enemies[2]!,
      ],
    });

    const inkErasureOnlyDef = {
      ...baseDef,
      abilities: [
        baseDef.abilities.find((ability) => ability.name === "Ink Erasure")!,
      ],
    };

    const result = executeOneEnemyTurn(
      state,
      state.enemies[0]!,
      inkErasureOnlyDef,
      makeDeterministicRng("archivist-ink-erasure"),
      enemyDefs
    );

    expect(result.cardRedactions).toEqual([
      {
        cardInstanceId: "fort",
        sourceEnemyDefinitionId: ARCHIVIST_BLACK_INKWELL_ID,
        type: "COST",
      },
    ]);
  });
});
