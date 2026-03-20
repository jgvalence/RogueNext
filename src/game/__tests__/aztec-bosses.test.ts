import { describe, expect, it } from "vitest";

import { buildCardDefsMap, buildEnemyDefsMap } from "../data";
import { playCard } from "../engine/cards";
import { executeOneEnemyTurn } from "../engine/enemies";
import { resolveEffects } from "../engine/effects";
import {
  finalizeQuetzalcoatlPlayerTurn,
  getQuetzalcoatlUiState,
  initializeQuetzalcoatlCombat,
} from "../engine/quetzalcoatl";
import { createRNG } from "../engine/rng";
import {
  getTezcatlipocaUiState,
  initializeTezcatlipocaCombat,
} from "../engine/tezcatlipoca";
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
    hand: [
      { instanceId: "strike-1", definitionId: "strike", upgraded: false },
      { instanceId: "defend-1", definitionId: "defend", upgraded: false },
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

function getBoss(state: CombatState, definitionId: string): EnemyState {
  const enemy = state.enemies.find(
    (entry) => entry.definitionId === definitionId
  );
  if (!enemy) {
    throw new Error(`Missing enemy in combat: ${definitionId}`);
  }
  return enemy;
}

describe("aztec bosses", () => {
  it("tezcatlipoca stores the strongest echo and fires it on the next enemy action", () => {
    const rng = createRNG("tez-mirror");
    const tezcatlipocaDef = enemyDefs.get("tezcatlipoca_echo");
    expect(tezcatlipocaDef).toBeDefined();
    if (!tezcatlipocaDef) return;

    let state = initializeTezcatlipocaCombat(
      makeCombatState([makeEnemyState("tezcatlipoca_echo")])
    );
    const tezcatlipocaId = getBoss(state, "tezcatlipoca_echo").instanceId;

    state = playCard(state, "defend-1", null, false, cardDefs, rng);
    state = playCard(state, "strike-1", tezcatlipocaId, false, cardDefs, rng);

    expect(
      getTezcatlipocaUiState(getBoss(state, "tezcatlipoca_echo"))?.slots
    ).toEqual([
      {
        family: "ATTACK",
        value: 6,
      },
    ]);

    state = {
      ...state,
      phase: "ALLIES_ENEMIES_TURN",
    };
    state = executeOneEnemyTurn(
      state,
      getBoss(state, "tezcatlipoca_echo"),
      tezcatlipocaDef,
      rng,
      enemyDefs
    );

    expect(state.player.currentHp).toBe(60);
    expect(
      getTezcatlipocaUiState(getBoss(state, "tezcatlipoca_echo"))?.slots
    ).toHaveLength(0);
  });

  it("tezcatlipoca phase 2 stores the two largest echoes of the turn", () => {
    const rng = createRNG("tez-double-echo");
    let state = initializeTezcatlipocaCombat(
      makeCombatState([
        makeEnemyState("tezcatlipoca_echo", {
          mechanicFlags: {
            tezcatlipoca_echo_phase2: 1,
          },
        }),
      ])
    );
    const tezcatlipocaId = getBoss(state, "tezcatlipoca_echo").instanceId;

    state = playCard(state, "defend-1", null, false, cardDefs, rng);
    state = playCard(state, "strike-1", tezcatlipocaId, false, cardDefs, rng);
    state = playCard(state, "ink-surge-1", null, false, cardDefs, rng);

    expect(
      getTezcatlipocaUiState(getBoss(state, "tezcatlipoca_echo"))?.slots
    ).toEqual([
      {
        family: "INK",
        value: 7,
      },
      {
        family: "ATTACK",
        value: 6,
      },
    ]);
  });

  it("quetzalcoatl caps single hits in the air, then becomes grounded after enough hits", () => {
    const rng = createRNG("quetz-skyfall");
    let state = initializeQuetzalcoatlCombat(
      makeCombatState([makeEnemyState("quetzalcoatl_wrath")])
    );
    const quetzalcoatlId = getBoss(state, "quetzalcoatl_wrath").instanceId;

    state = resolveEffects(
      state,
      [{ type: "DAMAGE", value: 20 }],
      {
        source: "player",
        target: { type: "enemy", instanceId: quetzalcoatlId },
      },
      rng
    );

    expect(getBoss(state, "quetzalcoatl_wrath").currentHp).toBe(154);
    expect(
      getQuetzalcoatlUiState(getBoss(state, "quetzalcoatl_wrath"))?.hits
    ).toBe(1);

    state = resolveEffects(
      state,
      [{ type: "DAMAGE", value: 4 }],
      {
        source: "player",
        target: { type: "enemy", instanceId: quetzalcoatlId },
      },
      rng
    );
    state = resolveEffects(
      state,
      [{ type: "DAMAGE", value: 4 }],
      {
        source: "player",
        target: { type: "enemy", instanceId: quetzalcoatlId },
      },
      rng
    );

    expect(
      getQuetzalcoatlUiState(getBoss(state, "quetzalcoatl_wrath"))?.stance
    ).toBe("GROUNDED");
    expect(getBoss(state, "quetzalcoatl_wrath").intentIndex).toBe(4);
  });

  it("quetzalcoatl takes bonus damage while grounded and returns airborne after Solar Dive", () => {
    const rng = createRNG("quetz-grounded");
    const quetzalcoatlDef = enemyDefs.get("quetzalcoatl_wrath");
    expect(quetzalcoatlDef).toBeDefined();
    if (!quetzalcoatlDef) return;

    let state = initializeQuetzalcoatlCombat(
      makeCombatState([
        makeEnemyState("quetzalcoatl_wrath", {
          intentIndex: 4,
          mechanicFlags: {
            quetzalcoatl_wrath_stance: 1,
            quetzalcoatl_wrath_hit_count: 3,
          },
        }),
      ])
    );
    const quetzalcoatlId = getBoss(state, "quetzalcoatl_wrath").instanceId;

    state = resolveEffects(
      state,
      [{ type: "DAMAGE", value: 10 }],
      {
        source: "player",
        target: { type: "enemy", instanceId: quetzalcoatlId },
      },
      rng
    );

    expect(getBoss(state, "quetzalcoatl_wrath").currentHp).toBe(147);

    state = {
      ...state,
      phase: "ALLIES_ENEMIES_TURN",
    };
    state = executeOneEnemyTurn(
      state,
      getBoss(state, "quetzalcoatl_wrath"),
      quetzalcoatlDef,
      rng,
      enemyDefs
    );

    expect(
      getQuetzalcoatlUiState(getBoss(state, "quetzalcoatl_wrath"))?.stance
    ).toBe("AIRBORNE");
    expect(
      getQuetzalcoatlUiState(getBoss(state, "quetzalcoatl_wrath"))?.hits
    ).toBe(0);
  });

  it("quetzalcoatl phase 2 adds bleed when the player ends a turn without a knockdown", () => {
    const state = finalizeQuetzalcoatlPlayerTurn(
      initializeQuetzalcoatlCombat(
        makeCombatState([
          makeEnemyState("quetzalcoatl_wrath", {
            mechanicFlags: {
              quetzalcoatl_wrath_phase2: 1,
            },
          }),
        ])
      )
    );

    expect(
      state.player.buffs.find((buff) => buff.type === "BLEED")?.stacks
    ).toBe(2);
  });
});
