import { buildCardDefsMap } from "@/game/data";
import { getCharacterById } from "@/game/data/characters";
import { createRNG } from "@/game/engine/rng";
import { createNewRun } from "@/game/engine/run";
import type { CombatState } from "@/game/schemas/combat-state";
import type { RunState } from "@/game/schemas/run-state";

function getStarterCards() {
  const cardDefs = buildCardDefsMap();
  return getCharacterById("scribe")
    .starterDeckIds.map((id) => cardDefs.get(id))
    .filter((card): card is NonNullable<typeof card> => card != null);
}

export function makeTestCombat(
  overrides: Partial<CombatState> = {}
): CombatState {
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

export function makeTestRunState(overrides: Partial<RunState> = {}): RunState {
  const runId = overrides.runId ?? "run-test";
  const seed = overrides.seed ?? "seed-test";
  const state = createNewRun(runId, seed, getStarterCards(), createRNG(seed));

  return {
    ...state,
    ...overrides,
  };
}
