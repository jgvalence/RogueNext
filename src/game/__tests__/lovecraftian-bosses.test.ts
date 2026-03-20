import { describe, expect, it } from "vitest";

import { buildCardDefsMap, buildEnemyDefsMap } from "../data";
import { drawCards } from "../engine/deck";
import { createRNG } from "../engine/rng";
import {
  getNyarlathotepUiState,
  registerNyarlathotepCardPlayed,
  startNyarlathotepPlayerTurn,
  triggerNyarlathotepPhaseTwo,
} from "../engine/nyarlathotep";
import {
  getShubNestUiState,
  getShubUiState,
  initializeShubSpawnCombat,
  resolveShubPostAbility,
  triggerShubSpawnPhaseTwo,
} from "../engine/shub-spawn";
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

describe("lovecraftian bosses", () => {
  it("nyarlathotep consumes an ATTACK prophecy and adds Echo Curse", () => {
    const heavyStrike = cardDefs.get("heavy_strike");
    expect(heavyStrike).toBeDefined();
    if (!heavyStrike) return;

    let state = makeCombatState([
      makeEnemyState("nyarlathotep_shard", {
        mechanicFlags: {
          nyarlathotep_shard_slot_1_omen: 2,
          nyarlathotep_shard_slot_1_consumed: 0,
        },
      }),
    ]);

    state = registerNyarlathotepCardPlayed(state, heavyStrike, 0);

    expect(
      state.drawPile.some((card) => card.definitionId === "echo_curse")
    ).toBe(true);
    expect(
      getNyarlathotepUiState(getEnemy(state, "nyarlathotep_shard"))
        ?.prophecies[0]?.consumed
    ).toBe(true);
  });

  it("nyarlathotep ignores base draw for DRAW prophecy but triggers on player-effect draw", () => {
    const rng = createRNG("nyarl-draw");
    let state = makeCombatState(
      [
        makeEnemyState("nyarlathotep_shard", {
          mechanicFlags: {
            nyarlathotep_shard_slot_1_omen: 0,
            nyarlathotep_shard_slot_1_consumed: 0,
          },
        }),
      ],
      {
        drawPile: [
          {
            instanceId: "draw-1",
            definitionId: "heavy_strike",
            upgraded: false,
          },
          { instanceId: "draw-2", definitionId: "ink_surge", upgraded: false },
        ],
      }
    );

    state = drawCards(state, 1, rng, "SYSTEM", "TURN_START_BASE_DRAW");
    expect(
      state.drawPile.some((card) => card.definitionId === "haunting_regret")
    ).toBe(false);

    state = drawCards(state, 1, rng, "PLAYER", "TEST:PLAYER_DRAW");
    expect(
      state.drawPile.some((card) => card.definitionId === "haunting_regret")
    ).toBe(true);
    expect(
      getNyarlathotepUiState(getEnemy(state, "nyarlathotep_shard"))
        ?.prophecies[0]?.consumed
    ).toBe(true);
  });

  it("nyarlathotep phase 2 summons a Void Tendril and rolls two distinct prophecies", () => {
    const rng = createRNG("nyarl-phase2");
    const nyarlId = "nyarlathotep_shard-1";
    let state = makeCombatState([
      makeEnemyState("nyarlathotep_shard", { instanceId: nyarlId }),
    ]);

    state = triggerNyarlathotepPhaseTwo(state, nyarlId, enemyDefs);
    state = startNyarlathotepPlayerTurn(state, rng);

    const ui = getNyarlathotepUiState(getEnemy(state, "nyarlathotep_shard"));
    expect(
      state.enemies.some((enemy) => enemy.definitionId === "void_tendril")
    ).toBe(true);
    expect(ui?.phaseTwo).toBe(true);
    expect(ui?.prophecies).toHaveLength(2);
    expect(new Set(ui?.prophecies.map((prophecy) => prophecy.omen)).size).toBe(
      2
    );
  });

  it("shub spawn eruption creates a brood nest that later hatches into a Shoggoth Spawn", () => {
    const shubId = "shub_spawn-1";
    let state = makeCombatState([
      makeEnemyState("shub_spawn", { instanceId: shubId }),
    ]);

    state = resolveShubPostAbility(state, shubId, "Spawn Eruption", enemyDefs);
    expect(
      state.enemies.some((enemy) => enemy.definitionId === "shub_brood_nest")
    ).toBe(true);
    expect(getShubNestUiState(getEnemy(state, "shub_brood_nest"))?.timer).toBe(
      2
    );

    state = resolveShubPostAbility(
      state,
      shubId,
      "Dark Young Stomp",
      enemyDefs
    );
    expect(getShubNestUiState(getEnemy(state, "shub_brood_nest"))?.timer).toBe(
      1
    );

    state = resolveShubPostAbility(
      state,
      shubId,
      "Dark Young Stomp",
      enemyDefs
    );
    expect(
      state.enemies.some((enemy) => enemy.definitionId === "shub_brood_nest")
    ).toBe(false);
    expect(
      state.enemies.some((enemy) => enemy.definitionId === "shoggoth_spawn")
    ).toBe(true);
  });

  it("shub starts combat with a brood nest already in play", () => {
    const state = initializeShubSpawnCombat(
      makeCombatState([makeEnemyState("shub_spawn")]),
      enemyDefs
    );

    expect(
      state.enemies.filter((enemy) => enemy.definitionId === "shub_brood_nest")
    ).toHaveLength(1);
    expect(getShubNestUiState(getEnemy(state, "shub_brood_nest"))?.timer).toBe(
      2
    );
    expect(getShubUiState(getEnemy(state, "shub_spawn"))?.nestCount).toBe(1);
  });

  it("shub can consume a brood nest with Eldritch Veil for heal and poison", () => {
    const shubId = "shub_spawn-1";
    let state = makeCombatState(
      [
        makeEnemyState("shub_spawn", {
          instanceId: shubId,
          currentHp: 140,
        }),
        makeEnemyState("shub_brood_nest", {
          mechanicFlags: {
            shub_brood_nest_timer: 2,
          },
        }),
      ],
      {
        player: {
          ...makeCombatState([]).player,
          currentHp: 80,
          maxHp: 80,
          buffs: [],
        },
      }
    );

    state = resolveShubPostAbility(state, shubId, "Eldritch Veil", enemyDefs);

    expect(
      state.enemies.some((enemy) => enemy.definitionId === "shub_brood_nest")
    ).toBe(false);
    expect(getEnemy(state, "shub_spawn").currentHp).toBe(152);
    expect(
      state.player.buffs.find((buff) => buff.type === "POISON")?.stacks
    ).toBe(4);
  });

  it("shub phase 2 can maintain two brood nests at once", () => {
    const shubId = "shub_spawn-1";
    let state = makeCombatState([
      makeEnemyState("shub_spawn", { instanceId: shubId }),
    ]);

    state = triggerShubSpawnPhaseTwo(state, shubId, enemyDefs);
    state = resolveShubPostAbility(state, shubId, "Spawn Eruption", enemyDefs);

    expect(
      state.enemies.filter((enemy) => enemy.definitionId === "shub_brood_nest")
    ).toHaveLength(2);
    expect(getShubUiState(getEnemy(state, "shub_spawn"))?.maxNests).toBe(2);
  });

  it("shub phase 2 can still summon through dead brood and shoggoth corpses", () => {
    const shubId = "shub_spawn-1";
    let state = makeCombatState([
      makeEnemyState("shub_spawn", {
        instanceId: shubId,
        mechanicFlags: {
          shub_spawn_phase2: 1,
        },
      }),
      makeEnemyState("shub_brood_nest", {
        instanceId: "dead-nest",
        currentHp: 0,
        mechanicFlags: {
          shub_brood_nest_timer: 1,
        },
      }),
      makeEnemyState("shoggoth_spawn", {
        instanceId: "dead-shoggoth",
        currentHp: 0,
      }),
    ]);

    state = resolveShubPostAbility(state, shubId, "Spawn Eruption", enemyDefs);

    expect(
      state.enemies.filter((enemy) => enemy.definitionId === "shub_brood_nest")
    ).toHaveLength(2);
    expect(
      state.enemies.some(
        (enemy) =>
          enemy.instanceId === "dead-nest" ||
          enemy.instanceId === "dead-shoggoth"
      )
    ).toBe(false);
  });
});
