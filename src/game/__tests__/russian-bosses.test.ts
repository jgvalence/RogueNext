import { describe, expect, it } from "vitest";

import { buildEnemyDefsMap } from "../data";
import {
  getBabaYagaUiState,
  initializeBabaYagaCombat,
  registerBabaYagaAttackCardPlayed,
  resetBabaYagaTurnState,
} from "../engine/baba-yaga";
import { checkCombatEnd } from "../engine/combat";
import { executeOneEnemyTurn } from "../engine/enemies";
import { resolveEffects } from "../engine/effects";
import {
  getKoscheiUiState,
  initializeKoscheiCombat,
  synchronizeKoscheiCombatState,
} from "../engine/koschei";
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
    hand: [
      { instanceId: "card-1", definitionId: "strike", upgraded: false },
      { instanceId: "card-2", definitionId: "guard", upgraded: false },
      { instanceId: "card-3", definitionId: "spark", upgraded: false },
    ],
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

function setEnemyHpByDefinition(
  state: CombatState,
  definitionId: string,
  currentHp: number
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) =>
      enemy.definitionId === definitionId ? { ...enemy, currentHp } : enemy
    ),
  };
}

describe("russian bosses", () => {
  it("baba yaga rotates faces and only punishes when the active face was ignored", () => {
    const rng = createRNG("baba-yaga-cycle");
    const babaDef = enemyDefs.get("baba_yaga_hut");
    expect(babaDef).toBeDefined();
    if (!babaDef) return;

    let state = initializeBabaYagaCombat(
      makeCombatState([makeEnemyState("baba_yaga_hut", { intentIndex: 0 })])
    );

    expect(getBabaYagaUiState(state.enemies[0])?.face).toBe("TEETH");
    expect(getBabaYagaUiState(state.enemies[0])?.turnsUntilRotate).toBe(2);

    state = executeOneEnemyTurn(
      state,
      state.enemies[0]!,
      babaDef,
      rng,
      enemyDefs
    );

    expect(
      state.enemies[0]?.buffs.find((buff) => buff.type === "STRENGTH")?.stacks
    ).toBe(1);
    expect(getBabaYagaUiState(state.enemies[0])?.face).toBe("TEETH");
    expect(getBabaYagaUiState(state.enemies[0])?.turnsUntilRotate).toBe(1);

    state = resetBabaYagaTurnState(state);
    state = registerBabaYagaAttackCardPlayed(state);
    state = registerBabaYagaAttackCardPlayed(state);

    const strengthBefore =
      state.enemies[0]?.buffs.find((buff) => buff.type === "STRENGTH")
        ?.stacks ?? 0;
    state = executeOneEnemyTurn(
      state,
      state.enemies[0]!,
      babaDef,
      rng,
      enemyDefs
    );

    expect(
      state.enemies[0]?.buffs.find((buff) => buff.type === "STRENGTH")
        ?.stacks ?? 0
    ).toBe(strengthBefore);
    expect(getBabaYagaUiState(state.enemies[0])?.face).toBe("BONES");
    expect(getBabaYagaUiState(state.enemies[0])?.turnsUntilRotate).toBe(2);
  });

  it("baba yaga cursed face freezes cards and taxes the next turn in phase 2", () => {
    const rng = createRNG("baba-yaga-curse");
    const babaDef = enemyDefs.get("baba_yaga_hut");
    expect(babaDef).toBeDefined();
    if (!babaDef) return;

    const state = initializeBabaYagaCombat(
      makeCombatState([
        makeEnemyState("baba_yaga_hut", {
          intentIndex: 1,
          mechanicFlags: {
            baba_yaga_hut_phase2: 1,
            baba_yaga_hut_face: 3,
            baba_yaga_hut_turns_until_rotate: 1,
          },
        }),
      ])
    );

    const result = executeOneEnemyTurn(
      state,
      state.enemies[0]!,
      babaDef,
      rng,
      enemyDefs
    );

    expect(result.playerDisruption.frozenHandCardIds).toHaveLength(2);
    expect(result.nextPlayerDisruption.extraCardCost).toBe(1);
    expect(getBabaYagaUiState(result.enemies[0])?.face).toBe("TEETH");
    expect(getBabaYagaUiState(result.enemies[0])?.turnsUntilRotate).toBe(1);
  });

  it("koschei progresses chest to egg to needle, then loses immortality", () => {
    const rng = createRNG("koschei-chain");
    let state = initializeKoscheiCombat(
      makeCombatState([makeEnemyState("koschei_deathless")])
    );
    const koscheiId = state.enemies[0]!.instanceId;

    expect(getKoscheiUiState(state.enemies[0])?.stage).toBe("CHEST");
    expect(
      state.enemies.some((enemy) => enemy.definitionId === "koschei_bone_chest")
    ).toBe(true);

    state = setEnemyHpByDefinition(state, "koschei_bone_chest", 0);
    state = synchronizeKoscheiCombatState(state);
    expect(getKoscheiUiState(state.enemies[0])?.stage).toBe("EGG");
    expect(
      state.enemies.some(
        (enemy) =>
          enemy.definitionId === "koschei_black_egg" && enemy.currentHp > 0
      )
    ).toBe(true);

    state = resolveEffects(
      state,
      [{ type: "DAMAGE", value: 999 }],
      { source: "player", target: { type: "enemy", instanceId: koscheiId } },
      rng
    );
    expect(state.enemies[0]?.currentHp).toBe(1);

    state = setEnemyHpByDefinition(state, "koschei_black_egg", 0);
    state = synchronizeKoscheiCombatState(state);
    expect(getKoscheiUiState(state.enemies[0])?.stage).toBe("NEEDLE");
    expect(
      state.enemies.some(
        (enemy) =>
          enemy.definitionId === "koschei_hidden_needle" && enemy.currentHp > 0
      )
    ).toBe(true);

    state = setEnemyHpByDefinition(state, "koschei_hidden_needle", 0);
    state = synchronizeKoscheiCombatState(state);
    expect(getKoscheiUiState(state.enemies[0])?.mortal).toBe(true);

    state = resolveEffects(
      state,
      [{ type: "DAMAGE", value: 999 }],
      { source: "player", target: { type: "enemy", instanceId: koscheiId } },
      rng
    );
    expect(state.enemies[0]!.currentHp).toBeLessThanOrEqual(0);
  });

  it("koschei clears dead vessel corpses before exposing the hidden needle", () => {
    let state = makeCombatState([
      makeEnemyState("koschei_deathless", {
        mechanicFlags: {
          koschei_deathless_phase2: 1,
          koschei_deathless_stage: 1,
          koschei_deathless_reseal_used: 1,
          koschei_deathless_reseal_pending: 0,
        },
      }),
      makeEnemyState("koschei_herald"),
      makeEnemyState("koschei_bone_chest", {
        instanceId: "koschei-bone-chest-corpse",
        currentHp: 0,
      }),
      makeEnemyState("koschei_black_egg", {
        instanceId: "koschei-black-egg-corpse",
        currentHp: 0,
      }),
    ]);

    state = synchronizeKoscheiCombatState(state);

    expect(getKoscheiUiState(state.enemies[0])?.stage).toBe("NEEDLE");
    expect(getKoscheiUiState(state.enemies[0])?.mortal).toBe(false);
    expect(
      state.enemies.some(
        (enemy) =>
          enemy.definitionId === "koschei_hidden_needle" && enemy.currentHp > 0
      )
    ).toBe(true);
    expect(
      state.enemies.some((enemy) => enemy.definitionId === "koschei_bone_chest")
    ).toBe(false);
    expect(
      state.enemies.some((enemy) => enemy.definitionId === "koschei_black_egg")
    ).toBe(false);
  });

  it("koschei phase 2 reseals the current vessel once before exposing the next step", () => {
    const rng = createRNG("koschei-reseal");
    const koscheiDef = enemyDefs.get("koschei_deathless");
    expect(koscheiDef).toBeDefined();
    if (!koscheiDef) return;

    let state = makeCombatState([
      makeEnemyState("koschei_deathless", {
        mechanicFlags: {
          koschei_deathless_phase2: 1,
          koschei_deathless_stage: 1,
          koschei_deathless_reseal_used: 0,
          koschei_deathless_reseal_pending: 0,
        },
      }),
    ]);
    state = synchronizeKoscheiCombatState(state);

    expect(getKoscheiUiState(state.enemies[0])?.stage).toBe("EGG");
    expect(getKoscheiUiState(state.enemies[0])?.resealPending).toBe(true);
    expect(
      state.enemies.some(
        (enemy) =>
          enemy.definitionId === "koschei_black_egg" && enemy.currentHp > 0
      )
    ).toBe(false);

    state = executeOneEnemyTurn(
      state,
      state.enemies[0]!,
      koscheiDef,
      rng,
      enemyDefs
    );

    expect(getKoscheiUiState(state.enemies[0])?.resealPending).toBe(false);
    expect(
      state.enemies.some(
        (enemy) =>
          enemy.definitionId === "koschei_black_egg" && enemy.currentHp > 0
      )
    ).toBe(true);

    state = setEnemyHpByDefinition(state, "koschei_black_egg", 0);
    state = synchronizeKoscheiCombatState(state);

    expect(getKoscheiUiState(state.enemies[0])?.stage).toBe("NEEDLE");
    expect(
      state.enemies.some(
        (enemy) =>
          enemy.definitionId === "koschei_hidden_needle" && enemy.currentHp > 0
      )
    ).toBe(true);
  });

  it("checkCombatEnd does not grant victory while koschei should revive behind a vessel", () => {
    const state = makeCombatState([
      makeEnemyState("koschei_deathless", {
        currentHp: 0,
        block: 0,
      }),
      makeEnemyState("koschei_bone_chest", {
        currentHp: 0,
        block: 0,
      }),
    ]);

    const result = checkCombatEnd(state);
    const koschei = result.enemies.find(
      (enemy) => enemy.definitionId === "koschei_deathless"
    );

    expect(result.phase).not.toBe("COMBAT_WON");
    expect(koschei?.currentHp).toBe(1);
    expect(getKoscheiUiState(koschei)?.stage).toBe("EGG");
    expect(
      result.enemies.some(
        (enemy) =>
          enemy.definitionId === "koschei_black_egg" && enemy.currentHp > 0
      )
    ).toBe(true);
  });
});
