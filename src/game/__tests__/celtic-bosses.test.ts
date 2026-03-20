import { describe, expect, it } from "vitest";

import { buildEnemyDefsMap } from "../data";
import {
  getCernunnosUiState,
  initializeCernunnosCombat,
  resolveCernunnosPostAbility,
  triggerCernunnosPhaseTwo,
} from "../engine/cernunnos-shade";
import {
  getDagdaUiState,
  initializeDagdaCombat,
  resolveDagdaPostAbility,
  synchronizeDagdaCombatState,
  triggerDagdaPhaseTwo,
} from "../engine/dagda-shadow";
import { resolveEffects } from "../engine/effects";
import { createRNG } from "../engine/rng";
import type { CombatState } from "../schemas/combat-state";
import type { EnemyState } from "../schemas/entities";

const enemyDefs = buildEnemyDefsMap();

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
      inkCurrent: 4,
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
    enemies,
    drawPile: [],
    hand: [],
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

function getEnemy(state: CombatState, definitionId: string): EnemyState {
  const enemy = state.enemies.find(
    (entry) => entry.definitionId === definitionId
  );
  if (!enemy) {
    throw new Error(`Missing enemy in combat: ${definitionId}`);
  }
  return enemy;
}

describe("celtic bosses", () => {
  it("dagda starts combat with a cauldron in play", () => {
    const state = initializeDagdaCombat(
      makeCombatState([makeEnemyState("dagda_shadow")]),
      enemyDefs
    );

    expect(
      state.enemies.some((enemy) => enemy.definitionId === "dagda_cauldron")
    ).toBe(true);
    expect(
      getDagdaUiState(getEnemy(state, "dagda_shadow"))?.cauldronPresent
    ).toBe(true);
  });

  it("dagda feast brew resolves after two actions and then flips to famine", () => {
    const dagdaId = "dagda-shadow-test";
    let state = initializeDagdaCombat(
      makeCombatState([
        makeEnemyState("dagda_shadow", {
          instanceId: dagdaId,
          currentHp: 140,
        }),
      ]),
      enemyDefs
    );

    state = resolveDagdaPostAbility(state, dagdaId, "Club of Ruin", enemyDefs);
    expect(getDagdaUiState(getEnemy(state, "dagda_shadow"))?.progress).toBe(1);

    state = resolveDagdaPostAbility(state, dagdaId, "Famine Curse", enemyDefs);

    expect(getEnemy(state, "dagda_shadow").currentHp).toBe(154);
    expect(
      getEnemy(state, "dagda_shadow").buffs.find(
        (buff) => buff.type === "STRENGTH"
      )?.stacks
    ).toBe(2);
    expect(getDagdaUiState(getEnemy(state, "dagda_shadow"))?.brewType).toBe(
      "FAMINE"
    );
    expect(getDagdaUiState(getEnemy(state, "dagda_shadow"))?.progress).toBe(0);
  });

  it("destroying Dagda's cauldron cancels the brew until Cauldron Steam restores it", () => {
    const dagdaId = "dagda-shadow-test";
    let state = initializeDagdaCombat(
      makeCombatState([
        makeEnemyState("dagda_shadow", {
          instanceId: dagdaId,
          currentHp: 140,
        }),
      ]),
      enemyDefs
    );

    state = {
      ...state,
      enemies: state.enemies.map((enemy) =>
        enemy.definitionId === "dagda_cauldron"
          ? { ...enemy, currentHp: 0 }
          : enemy
      ),
    };
    state = synchronizeDagdaCombatState(state);
    state = resolveDagdaPostAbility(state, dagdaId, "Club of Ruin", enemyDefs);

    expect(
      state.enemies.some((enemy) => enemy.definitionId === "dagda_cauldron")
    ).toBe(false);
    expect(getEnemy(state, "dagda_shadow").currentHp).toBe(140);

    state = resolveDagdaPostAbility(
      state,
      dagdaId,
      "Cauldron Steam",
      enemyDefs
    );

    expect(
      state.enemies.some((enemy) => enemy.definitionId === "dagda_cauldron")
    ).toBe(true);
  });

  it("dagda phase 2 precharges the cauldron", () => {
    const dagdaId = "dagda-shadow-test";
    let state = initializeDagdaCombat(
      makeCombatState([
        makeEnemyState("dagda_shadow", {
          instanceId: dagdaId,
          mechanicFlags: {
            dagda_shadow_phase2: 1,
          },
        }),
      ]),
      enemyDefs
    );

    state = triggerDagdaPhaseTwo(state, dagdaId, enemyDefs);

    expect(getDagdaUiState(getEnemy(state, "dagda_shadow"))?.phaseTwo).toBe(
      true
    );
    expect(getDagdaUiState(getEnemy(state, "dagda_shadow"))?.progress).toBe(1);
  });

  it("cernunnos crown caps early hits, breaks after three hits, then exposes the boss", () => {
    const rng = createRNG("cernunnos-hits");
    const cernunnosId = "cernunnos-test";
    let state = initializeCernunnosCombat(
      makeCombatState([
        makeEnemyState("cernunnos_shade", { instanceId: cernunnosId }),
      ])
    );

    for (let index = 0; index < 3; index += 1) {
      state = resolveEffects(
        state,
        [{ type: "DAMAGE", value: 20 }],
        {
          source: "player",
          target: { type: "enemy", instanceId: cernunnosId },
        },
        rng
      );
    }

    expect(getEnemy(state, "cernunnos_shade").currentHp).toBe(144);
    expect(
      getCernunnosUiState(getEnemy(state, "cernunnos_shade"))?.exposed
    ).toBe(true);

    state = resolveEffects(
      state,
      [{ type: "DAMAGE", value: 10 }],
      {
        source: "player",
        target: { type: "enemy", instanceId: cernunnosId },
      },
      rng
    );

    expect(getEnemy(state, "cernunnos_shade").currentHp).toBe(129);
  });

  it("cernunnos regrows antlers faster in phase 2", () => {
    const cernunnosId = "cernunnos-test";
    let phaseOne = initializeCernunnosCombat(
      makeCombatState([
        makeEnemyState("cernunnos_shade", {
          instanceId: cernunnosId,
          mechanicFlags: {
            cernunnos_shade_antler_layers: 0,
          },
        }),
      ])
    );
    phaseOne = resolveCernunnosPostAbility(phaseOne, cernunnosId);
    expect(
      getCernunnosUiState(getEnemy(phaseOne, "cernunnos_shade"))?.antlerLayers
    ).toBe(1);

    let phaseTwo = initializeCernunnosCombat(
      makeCombatState([
        makeEnemyState("cernunnos_shade", {
          instanceId: cernunnosId,
          mechanicFlags: {
            cernunnos_shade_phase2: 1,
            cernunnos_shade_antler_layers: 0,
          },
        }),
      ])
    );
    phaseTwo = triggerCernunnosPhaseTwo(phaseTwo, cernunnosId, enemyDefs);
    phaseTwo = resolveCernunnosPostAbility(phaseTwo, cernunnosId);

    expect(
      phaseTwo.enemies.some((enemy) => enemy.definitionId === "amber_hound")
    ).toBe(true);
    expect(
      getCernunnosUiState(getEnemy(phaseTwo, "cernunnos_shade"))?.antlerLayers
    ).toBe(2);
  });
});
