import { describe, expect, it } from "vitest";

import { buildCardDefsMap, buildEnemyDefsMap } from "../data";
import { playCard } from "../engine/cards";
import {
  finalizeHydraPlayerTurn,
  getHydraUiState,
  initializeHydraCombat,
  registerHydraDamage,
  synchronizeHydraCombatState,
  triggerHydraPhaseShift,
} from "../engine/hydra";
import { getCardPetrifiedCostBonus, getMedusaUiState } from "../engine/medusa";
import { createRNG } from "../engine/rng";
import type { CombatState } from "../schemas/combat-state";
import type { EnemyState } from "../schemas/entities";

const enemyDefs = buildEnemyDefsMap();
const cardDefs = buildCardDefsMap();

function makeEnemyState(
  definitionId: string,
  overrides: Partial<EnemyState> = {}
): EnemyState {
  const definition = enemyDefs.get(definitionId);
  if (!definition) {
    throw new Error(`Missing enemy definition: ${definitionId}`);
  }

  return {
    instanceId: `${definitionId}-1`,
    definitionId,
    name: definition.name,
    isBoss: definition.isBoss,
    isElite: definition.isElite,
    currentHp: definition.maxHp,
    maxHp: definition.maxHp,
    block: 0,
    mechanicFlags: {},
    speed: definition.speed,
    buffs: [],
    intentIndex: 0,
    ...overrides,
  };
}

function makeCombatState(
  enemies: EnemyState[],
  overrides: Partial<CombatState> = {}
): CombatState {
  return {
    floor: 1,
    difficultyLevel: 0,
    enemyDamageScale: 1,
    turnNumber: 1,
    phase: "PLAYER_TURN",
    player: {
      currentHp: 80,
      maxHp: 80,
      block: 0,
      energyCurrent: 6,
      energyMax: 6,
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
    enemies,
    drawPile: [],
    hand: [
      { instanceId: "defend-1", definitionId: "defend", upgraded: false },
      { instanceId: "strike-1", definitionId: "strike", upgraded: false },
      { instanceId: "ink-surge-1", definitionId: "ink_surge", upgraded: false },
    ],
    discardPile: [],
    exhaustPile: [],
    pendingHandOverflowExhaust: 0,
    drawDebugHistory: [],
    inkPowerUsedThisTurn: false,
    usedInkPowersThisTurn: [],
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

function setEnemyHpByInstanceId(
  state: CombatState,
  instanceId: string,
  currentHp: number
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) =>
      enemy.instanceId === instanceId ? { ...enemy, currentHp } : enemy
    ),
  };
}

describe("greek bosses", () => {
  it("medusa petrifies the last card when a forbidden pattern is completed", () => {
    const rng = createRNG("medusa-pattern");
    const medusa = makeEnemyState("medusa", {
      mechanicFlags: {
        medusa_gaze_initialized: 1,
        medusa_gaze_slot_1_pattern: 1,
        medusa_gaze_slot_1_progress: 0,
      },
    });
    let state = makeCombatState([medusa]);

    state = playCard(state, "defend-1", null, false, cardDefs, rng);
    expect(getMedusaUiState(state.enemies[0])?.patterns[0]?.progress).toBe(1);

    state = playCard(
      state,
      "strike-1",
      state.enemies[0]!.instanceId,
      false,
      cardDefs,
      rng
    );

    const petrifiedStrike = state.discardPile.find(
      (card) => card.instanceId === "strike-1"
    );

    expect(petrifiedStrike).toBeDefined();
    expect(getCardPetrifiedCostBonus(state, petrifiedStrike?.instanceId)).toBe(
      1
    );
  });

  it("medusa phase 2 tracks two patterns and increases petrified card cost", () => {
    const rng = createRNG("medusa-phase-two");
    const medusa = makeEnemyState("medusa", {
      mechanicFlags: {
        medusa_phase2: 1,
        medusa_gaze_initialized: 1,
        medusa_gaze_slot_1_pattern: 1,
        medusa_gaze_slot_2_pattern: 0,
        medusa_gaze_slot_1_progress: 0,
        medusa_gaze_slot_2_progress: 0,
      },
    });
    let state = makeCombatState([medusa]);

    expect(getMedusaUiState(state.enemies[0])?.patterns).toHaveLength(2);

    state = playCard(state, "defend-1", null, false, cardDefs, rng);
    state = playCard(
      state,
      "strike-1",
      state.enemies[0]!.instanceId,
      false,
      cardDefs,
      rng
    );

    const petrifiedStrike = state.discardPile.find(
      (card) => card.instanceId === "strike-1"
    );
    expect(getCardPetrifiedCostBonus(state, petrifiedStrike?.instanceId)).toBe(
      2
    );
  });

  it("hydra regrows a killed head if the body was not hit in the same turn", () => {
    let state = initializeHydraCombat(
      makeCombatState([makeEnemyState("hydra_aspect")])
    );
    const hydraId = state.enemies[0]!.instanceId;
    const leftHeadId = state.enemies.find(
      (enemy) => enemy.definitionId === "hydra_head_left"
    )?.instanceId;

    expect(leftHeadId).toBeDefined();

    state = setEnemyHpByInstanceId(state, leftHeadId!, 0);
    state = registerHydraDamage(state, leftHeadId!, "player");

    expect(
      getHydraUiState(
        state.enemies.find((enemy) => enemy.instanceId === hydraId)
      )?.pendingHeads
    ).toBe(1);
    expect(
      state.enemies.some(
        (enemy) =>
          enemy.definitionId === "hydra_head_left" && enemy.currentHp > 0
      )
    ).toBe(false);

    state = finalizeHydraPlayerTurn(state);

    expect(
      getHydraUiState(
        state.enemies.find((enemy) => enemy.instanceId === hydraId)
      )?.pendingHeads
    ).toBe(0);
    expect(
      getHydraUiState(
        state.enemies.find((enemy) => enemy.instanceId === hydraId)
      )?.aliveHeads
    ).toBe(2);
    expect(
      state.enemies.some(
        (enemy) =>
          enemy.definitionId === "hydra_head_left" && enemy.currentHp > 0
      )
    ).toBe(true);
  });

  it("hydra cauterizes a killed head when the body is hit in the same turn", () => {
    let state = initializeHydraCombat(
      makeCombatState([makeEnemyState("hydra_aspect")])
    );
    const hydraId = state.enemies[0]!.instanceId;
    const leftHeadId = state.enemies.find(
      (enemy) => enemy.definitionId === "hydra_head_left"
    )?.instanceId;

    expect(leftHeadId).toBeDefined();

    state = setEnemyHpByInstanceId(state, leftHeadId!, 0);
    state = registerHydraDamage(state, leftHeadId!, "player");
    state = registerHydraDamage(state, hydraId, "player");
    state = finalizeHydraPlayerTurn(state);

    const hydra = state.enemies.find((enemy) => enemy.instanceId === hydraId);

    expect(getHydraUiState(hydra)?.cauterizedHeads).toBe(1);
    expect(getHydraUiState(hydra)?.aliveHeads).toBe(1);
    expect(
      state.enemies.some(
        (enemy) =>
          enemy.definitionId === "hydra_head_left" && enemy.currentHp > 0
      )
    ).toBe(false);
  });

  it("hydra phase 2 adds the center head", () => {
    let state = initializeHydraCombat(
      makeCombatState([
        makeEnemyState("hydra_aspect", {
          mechanicFlags: {
            hydra_aspect_phase2: 1,
          },
        }),
      ])
    );

    state = triggerHydraPhaseShift(state);

    expect(getHydraUiState(state.enemies[0])?.totalHeads).toBe(3);
    expect(getHydraUiState(state.enemies[0])?.aliveHeads).toBe(3);
    expect(
      state.enemies.some(
        (enemy) =>
          enemy.definitionId === "hydra_head_center" && enemy.currentHp > 0
      )
    ).toBe(true);
  });

  it("hydra does not instantly respawn a killed head during synchronization", () => {
    let state = initializeHydraCombat(
      makeCombatState([makeEnemyState("hydra_aspect")])
    );
    const hydraId = state.enemies[0]!.instanceId;
    const leftHeadId = state.enemies.find(
      (enemy) => enemy.definitionId === "hydra_head_left"
    )?.instanceId;

    expect(leftHeadId).toBeDefined();

    state = setEnemyHpByInstanceId(state, leftHeadId!, 0);
    state = synchronizeHydraCombatState(state);

    expect(
      getHydraUiState(
        state.enemies.find((enemy) => enemy.instanceId === hydraId)
      )?.pendingHeads
    ).toBe(1);
    expect(
      state.enemies.some(
        (enemy) =>
          enemy.definitionId === "hydra_head_left" && enemy.currentHp > 0
      )
    ).toBe(false);
  });
});
