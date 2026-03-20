import { describe, expect, it } from "vitest";

import { buildEnemyDefsMap } from "../data";
import { executeOneEnemyTurn } from "../engine/enemies";
import {
  finalizeRaPlayerTurn,
  getRaUiState,
  initializeRaCombat,
  registerRaSolarBarrierBreak,
  synchronizeRaCombatState,
} from "../engine/ra-avatar";
import {
  getOsirisUiState,
  initializeOsirisCombat,
  registerOsirisBlockGain,
  registerOsirisDamageDealt,
} from "../engine/osiris-judgment";
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

describe("egyptian bosses", () => {
  it("ra gains sun charge from unspent ink and forces Solar Judgment at full charge", () => {
    let state = initializeRaCombat(
      makeCombatState([
        makeEnemyState("ra_avatar", {
          intentIndex: 1,
          mechanicFlags: {
            ra_avatar_sun_charge: 2,
          },
        }),
      ])
    );

    state = {
      ...state,
      player: {
        ...state.player,
        inkCurrent: 2,
      },
    };
    state = finalizeRaPlayerTurn(state);

    expect(getRaUiState(state.enemies[0])?.charge).toBe(3);
    expect(getRaUiState(state.enemies[0])?.judgmentReady).toBe(true);
    expect(state.enemies[0]?.intentIndex).toBe(3);
    expect(state.enemies[0]?.mechanicFlags?.ra_avatar_saved_intent).toBe(1);
  });

  it("breaking Solar Barrier removes a sun charge and restores the saved intent", () => {
    const state = registerRaSolarBarrierBreak(
      synchronizeRaCombatState(
        makeCombatState([
          makeEnemyState("ra_avatar", {
            intentIndex: 3,
            block: 18,
            mechanicFlags: {
              ra_avatar_sun_charge: 3,
              ra_avatar_forced_judgment: 1,
              ra_avatar_saved_intent: 1,
            },
          }),
        ])
      ),
      "ra_avatar-1",
      "player",
      18,
      0
    );

    expect(getRaUiState(state.enemies[0])?.charge).toBe(2);
    expect(getRaUiState(state.enemies[0])?.judgmentReady).toBe(false);
    expect(state.enemies[0]?.intentIndex).toBe(1);
  });

  it("Solar Judgment drains all ink and adds bonus damage when fully charged", () => {
    const rng = createRNG("ra-judgment");
    const raDef = enemyDefs.get("ra_avatar");
    expect(raDef).toBeDefined();
    if (!raDef) return;

    let state = synchronizeRaCombatState(
      makeCombatState(
        [
          makeEnemyState("ra_avatar", {
            intentIndex: 3,
            mechanicFlags: {
              ra_avatar_sun_charge: 3,
              ra_avatar_forced_judgment: 1,
              ra_avatar_saved_intent: 0,
            },
          }),
        ],
        {
          player: {
            ...makeCombatState([]).player,
            inkCurrent: 5,
          },
        }
      )
    );
    state = executeOneEnemyTurn(
      state,
      state.enemies[0]!,
      raDef,
      rng,
      enemyDefs
    );

    expect(state.player.currentHp).toBe(48);
    expect(state.player.inkCurrent).toBe(0);
    expect(getRaUiState(state.enemies[0])?.charge).toBe(0);
  });

  it("osiris attack-heavy turns gain bonus damage and Weak on the next action", () => {
    const rng = createRNG("osiris-attack");
    const osirisDef = enemyDefs.get("osiris_judgment");
    expect(osirisDef).toBeDefined();
    if (!osirisDef) return;

    let state = initializeOsirisCombat(
      makeCombatState([
        makeEnemyState("osiris_judgment", {
          intentIndex: 0,
        }),
      ])
    );

    state = registerOsirisDamageDealt(state, 10, "player");
    state = executeOneEnemyTurn(
      state,
      state.enemies[0]!,
      osirisDef,
      rng,
      enemyDefs
    );

    expect(state.player.currentHp).toBe(57);
    expect(
      state.player.buffs.find((buff) => buff.type === "WEAK")?.stacks
    ).toBe(4);
  });

  it("osiris block-heavy turns gain extra block and Vulnerable on the next action", () => {
    const rng = createRNG("osiris-block");
    const osirisDef = enemyDefs.get("osiris_judgment");
    expect(osirisDef).toBeDefined();
    if (!osirisDef) return;

    let state = initializeOsirisCombat(
      makeCombatState([
        makeEnemyState("osiris_judgment", {
          intentIndex: 2,
        }),
      ])
    );

    state = registerOsirisBlockGain(state, 12);
    state = executeOneEnemyTurn(
      state,
      state.enemies[0]!,
      osirisDef,
      rng,
      enemyDefs
    );

    expect(state.enemies[0]?.block).toBe(32);
    expect(
      state.player.buffs.find((buff) => buff.type === "VULNERABLE")?.stacks
    ).toBe(2);
  });

  it("osiris phase 2 lowers the verdict threshold and strengthens the punishment", () => {
    const rng = createRNG("osiris-phase-two");
    const osirisDef = enemyDefs.get("osiris_judgment");
    expect(osirisDef).toBeDefined();
    if (!osirisDef) return;

    let state = initializeOsirisCombat(
      makeCombatState([
        makeEnemyState("osiris_judgment", {
          intentIndex: 0,
          mechanicFlags: {
            osiris_judgment_phase2: 1,
          },
        }),
      ])
    );

    state = registerOsirisDamageDealt(state, 6, "player");
    state = executeOneEnemyTurn(
      state,
      state.enemies[0]!,
      osirisDef,
      rng,
      enemyDefs
    );

    expect(getOsirisUiState(state.enemies[0])?.threshold).toBe(5);
    expect(state.player.currentHp).toBe(53);
    expect(
      state.player.buffs.find((buff) => buff.type === "WEAK")?.stacks
    ).toBe(5);
  });
});
