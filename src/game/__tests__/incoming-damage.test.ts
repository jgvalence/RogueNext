import { describe, expect, it } from "vitest";
import { buildEnemyDefsMap } from "@/game/data";
import { computeIncomingDamage } from "@/game/engine/incoming-damage";
import type { CombatState } from "@/game/schemas/combat-state";
import type { EnemyState, PlayerState } from "@/game/schemas/entities";

const enemyDefs = buildEnemyDefsMap();

function buildPlayer(block: number): PlayerState {
  return {
    currentHp: 40,
    maxHp: 40,
    block,
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
  };
}

function buildEnemyState(
  definitionId: string,
  intentName: string
): EnemyState {
  const definition = enemyDefs.get(definitionId);
  if (!definition) {
    throw new Error(`Missing enemy definition ${definitionId}`);
  }

  const intentIndex = definition.abilities.findIndex(
    (ability) => ability.name === intentName
  );
  if (intentIndex < 0) {
    throw new Error(`Missing intent ${intentName} on ${definitionId}`);
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
    intentIndex,
  };
}

function buildCombatState(playerBlock: number, enemy: EnemyState): CombatState {
  return {
    floor: 1,
    difficultyLevel: 0,
    enemyDamageScale: 1,
    turnNumber: 1,
    phase: "PLAYER_TURN",
    player: buildPlayer(playerBlock),
    allies: [],
    enemies: [enemy],
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
  };
}

describe("computeIncomingDamage", () => {
  it("makes Armor Shatter more dangerous to high-block targets", () => {
    const combat = buildCombatState(
      12,
      buildEnemyState("tome_colossus", "Armor Shatter")
    );
    const unarmoredCombat = buildCombatState(
      0,
      buildEnemyState("tome_colossus", "Armor Shatter")
    );

    const incoming = computeIncomingDamage(combat, enemyDefs);
    const unarmoredIncoming = computeIncomingDamage(unarmoredCombat, enemyDefs);

    expect(incoming.player.total).toBe(7);
    expect(incoming.player.hpLoss).toBe(5);
    expect(unarmoredIncoming.player.hpLoss).toBe(2);
    expect(incoming.player.hpLoss).toBeGreaterThan(unarmoredIncoming.player.hpLoss);
  });

  it("makes Soul Weighing more dangerous to high-block targets", () => {
    const combat = buildCombatState(
      12,
      buildEnemyState("anubis_champion", "Soul Weighing")
    );
    const unarmoredCombat = buildCombatState(
      0,
      buildEnemyState("anubis_champion", "Soul Weighing")
    );

    const incoming = computeIncomingDamage(combat, enemyDefs);
    const unarmoredIncoming = computeIncomingDamage(unarmoredCombat, enemyDefs);

    expect(incoming.player.total).toBe(7);
    expect(incoming.player.hpLoss).toBe(5);
    expect(unarmoredIncoming.player.hpLoss).toBe(2);
    expect(incoming.player.hpLoss).toBeGreaterThan(unarmoredIncoming.player.hpLoss);
  });

  it("keeps fully blocked attacks at zero HP loss", () => {
    const combat = buildCombatState(
      12,
      buildEnemyState("tome_colossus", "Titan Crush")
    );

    const incoming = computeIncomingDamage(combat, enemyDefs);

    expect(incoming.player.total).toBe(17);
    expect(incoming.player.hpLoss).toBe(5);
  });
});
