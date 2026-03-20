import { describe, expect, it } from "vitest";

import { buildEnemyDefsMap } from "../data";
import { executeOneEnemyTurn } from "../engine/enemies";
import { resolveEffects } from "../engine/effects";
import {
  getFenrirUiState,
  initializeFenrirCombat,
  resetFenrirHuntForPlayerTurn,
} from "../engine/fenrir";
import {
  getHelQueenUiState,
  initializeHelQueenCombat,
} from "../engine/hel-queen";
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
    allies: [
      {
        instanceId: "ally-1",
        definitionId: "scribe_apprentice",
        name: "Scribe Apprentice",
        currentHp: 16,
        maxHp: 16,
        block: 0,
        speed: 5,
        buffs: [],
        intentIndex: 0,
      },
    ],
    enemies,
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

function setEnemy(
  state: CombatState,
  instanceId: string,
  overrides: Partial<EnemyState>
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) =>
      enemy.instanceId === instanceId ? { ...enemy, ...overrides } : enemy
    ),
  };
}

describe("viking bosses", () => {
  it("fenrir hunt breaks on repeated hits and resets for the next player turn", () => {
    const rng = createRNG("fenrir-hunt");
    const fenrir = makeEnemyState("fenrir");
    const fenrirDef = enemyDefs.get("fenrir");
    expect(fenrirDef).toBeDefined();
    if (!fenrirDef) return;

    let state = initializeFenrirCombat(makeCombatState([fenrir]));
    const fenrirId = state.enemies[0]!.instanceId;

    expect(getFenrirUiState(state.enemies[0])?.huntRemaining).toBe(3);

    state = resolveEffects(
      state,
      [{ type: "DAMAGE", value: 1 }],
      {
        source: "player",
        target: { type: "enemy", instanceId: fenrirId },
      },
      rng
    );
    state = resolveEffects(
      state,
      [{ type: "DAMAGE", value: 1 }],
      {
        source: "player",
        target: { type: "enemy", instanceId: fenrirId },
      },
      rng
    );
    state = resolveEffects(
      state,
      [{ type: "DAMAGE", value: 1 }],
      {
        source: { type: "ally", instanceId: "ally-1" },
        target: { type: "enemy", instanceId: fenrirId },
      },
      rng
    );

    expect(getFenrirUiState(state.enemies[0])?.huntRemaining).toBe(0);

    const brokenHunt = executeOneEnemyTurn(
      state,
      state.enemies[0]!,
      fenrirDef,
      rng,
      enemyDefs
    );
    expect(brokenHunt.player.currentHp).toBe(66);

    const resetState = resetFenrirHuntForPlayerTurn(state);
    expect(getFenrirUiState(resetState.enemies[0])?.huntRemaining).toBe(3);

    const empoweredHunt = executeOneEnemyTurn(
      resetState,
      resetState.enemies[0]!,
      fenrirDef,
      rng,
      enemyDefs
    );
    expect(empoweredHunt.player.currentHp).toBe(60);
  });

  it("fenrir phase-2 Pack Howl only gains its extra effect when hunt remains", () => {
    const rng = createRNG("fenrir-pack-howl");
    const fenrirDef = enemyDefs.get("fenrir");
    expect(fenrirDef).toBeDefined();
    if (!fenrirDef) return;

    const withHunt = makeCombatState([
      makeEnemyState("fenrir", {
        intentIndex: 1,
        mechanicFlags: {
          fenrir_phase2: 1,
          fenrir_hunt_remaining: 4,
        },
      }),
    ]);
    const summoned = executeOneEnemyTurn(
      withHunt,
      withHunt.enemies[0]!,
      fenrirDef,
      rng,
      enemyDefs
    );
    expect(
      summoned.enemies.some((enemy) => enemy.definitionId === "draugr")
    ).toBe(true);

    const broken = makeCombatState([
      makeEnemyState("fenrir", {
        intentIndex: 1,
        mechanicFlags: {
          fenrir_phase2: 1,
          fenrir_hunt_remaining: 0,
        },
      }),
    ]);
    const noSummon = executeOneEnemyTurn(
      broken,
      broken.enemies[0]!,
      fenrirDef,
      rng,
      enemyDefs
    );
    expect(
      noSummon.enemies.some((enemy) => enemy.definitionId === "draugr")
    ).toBe(false);

    const fullBoard = makeCombatState([
      makeEnemyState("fenrir", {
        intentIndex: 1,
        mechanicFlags: {
          fenrir_phase2: 1,
          fenrir_hunt_remaining: 4,
        },
      }),
      makeEnemyState("draugr", { instanceId: "draugr-1" }),
      makeEnemyState("draugr", { instanceId: "draugr-2" }),
      makeEnemyState("draugr", { instanceId: "draugr-3" }),
    ]);
    const bleedFallback = executeOneEnemyTurn(
      fullBoard,
      fullBoard.enemies[0]!,
      fenrirDef,
      rng,
      enemyDefs
    );

    expect(bleedFallback.enemies).toHaveLength(4);
    expect(
      bleedFallback.player.buffs.find((buff) => buff.type === "BLEED")?.stacks
    ).toBe(2);
  });

  it("hel queen alternates life and death, then cashes out bleed and revives a draugr", () => {
    const rng = createRNG("hel-cycle");
    const helDef = enemyDefs.get("hel_queen");
    expect(helDef).toBeDefined();
    if (!helDef) return;

    let state = initializeHelQueenCombat(
      makeCombatState([
        makeEnemyState("hel_queen", {
          intentIndex: 3,
        }),
        makeEnemyState("draugr", {
          instanceId: "draugr-dead",
          currentHp: 0,
        }),
      ])
    );

    expect(getHelQueenUiState(state.enemies[0])?.stance).toBe("LIFE");
    expect(getHelQueenUiState(state.enemies[0])?.turnsUntilSwap).toBe(2);

    state = executeOneEnemyTurn(
      state,
      state.enemies[0]!,
      helDef,
      rng,
      enemyDefs
    );
    expect(
      state.player.buffs.find((buff) => buff.type === "BLEED")?.stacks
    ).toBe(2);
    expect(getHelQueenUiState(state.enemies[0])?.stance).toBe("LIFE");
    expect(getHelQueenUiState(state.enemies[0])?.turnsUntilSwap).toBe(1);

    state = setEnemy(state, state.enemies[0]!.instanceId, { intentIndex: 3 });
    state = executeOneEnemyTurn(
      state,
      state.enemies[0]!,
      helDef,
      rng,
      enemyDefs
    );
    expect(
      state.player.buffs.find((buff) => buff.type === "BLEED")?.stacks
    ).toBe(4);
    expect(getHelQueenUiState(state.enemies[0])?.stance).toBe("DEATH");
    expect(getHelQueenUiState(state.enemies[0])?.turnsUntilSwap).toBe(2);

    state = setEnemy(state, state.enemies[0]!.instanceId, { intentIndex: 3 });
    state = executeOneEnemyTurn(
      state,
      state.enemies[0]!,
      helDef,
      rng,
      enemyDefs
    );

    expect(state.player.currentHp).toBe(68);
    expect(
      state.player.buffs.some(
        (buff) => buff.type === "BLEED" && buff.stacks > 0
      )
    ).toBe(false);
    expect(
      state.enemies.find((enemy) => enemy.instanceId === "draugr-dead")
        ?.currentHp
    ).toBe(12);
    expect(getHelQueenUiState(state.enemies[0])?.stance).toBe("DEATH");
    expect(getHelQueenUiState(state.enemies[0])?.turnsUntilSwap).toBe(1);
  });

  it("hel queen phase 2 switches every turn and adds weak on death turns", () => {
    const rng = createRNG("hel-phase-two");
    const helDef = enemyDefs.get("hel_queen");
    expect(helDef).toBeDefined();
    if (!helDef) return;

    const state = initializeHelQueenCombat(
      makeCombatState([
        makeEnemyState("hel_queen", {
          intentIndex: 3,
          mechanicFlags: {
            hel_queen_phase2: 1,
            hel_queen_stance: 1,
            hel_queen_turns_until_swap: 1,
          },
        }),
      ])
    );
    const phaseTwoState = setEnemy(state, state.enemies[0]!.instanceId, {
      intentIndex: 3,
      mechanicFlags: {
        ...(state.enemies[0]!.mechanicFlags ?? {}),
        hel_queen_phase2: 1,
        hel_queen_stance: 1,
        hel_queen_turns_until_swap: 1,
      },
    });

    const result = executeOneEnemyTurn(
      phaseTwoState,
      phaseTwoState.enemies[0]!,
      helDef,
      rng,
      enemyDefs
    );

    expect(
      result.player.buffs.find((buff) => buff.type === "WEAK")?.stacks
    ).toBe(1);
    expect(getHelQueenUiState(result.enemies[0])?.stance).toBe("LIFE");
    expect(getHelQueenUiState(result.enemies[0])?.turnsUntilSwap).toBe(1);
  });
});
