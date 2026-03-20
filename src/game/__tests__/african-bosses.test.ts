import { describe, expect, it } from "vitest";

import { buildCardDefsMap, buildEnemyDefsMap } from "../data";
import { playCard } from "../engine/cards";
import { drawCards } from "../engine/deck";
import { executeOneEnemyTurn } from "../engine/enemies";
import { resolveEffects } from "../engine/effects";
import { createRNG } from "../engine/rng";
import {
  getAnansiUiState,
  synchronizeAnansiCombatState,
} from "../engine/anansi-weaver";
import {
  getSoundiataUiState,
  initializeSoundiataCombat,
  registerSoundiataInterruptDamage,
  synchronizeSoundiataCombatState,
} from "../engine/soundiata-spirit";
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
      inkCurrent: 2,
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
    webbedCardIds: [],
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

describe("african bosses", () => {
  it("soundiata starts with a mask hunter when he enters combat alone", () => {
    const state = initializeSoundiataCombat(
      makeCombatState([makeEnemyState("soundiata_spirit")]),
      enemyDefs
    );

    expect(
      state.enemies.filter((enemy) => enemy.definitionId === "mask_hunter")
    ).toHaveLength(1);
  });

  it("soundiata resolves Rally on the next action and buffs the whole enemy board", () => {
    const rng = createRNG("soundiata-rally");
    const soundiataDef = enemyDefs.get("soundiata_spirit");
    expect(soundiataDef).toBeDefined();
    if (!soundiataDef) return;

    let state = initializeSoundiataCombat(
      makeCombatState([
        makeEnemyState("soundiata_spirit", {
          mechanicFlags: {
            soundiata_spirit_slot_1_chapter: 0,
            soundiata_spirit_slot_1_progress: 1,
          },
        }),
        makeEnemyState("mask_hunter"),
      ]),
      enemyDefs
    );

    state = { ...state, phase: "ALLIES_ENEMIES_TURN" };
    state = executeOneEnemyTurn(
      state,
      getEnemy(state, "soundiata_spirit"),
      soundiataDef,
      rng,
      enemyDefs
    );

    const soundiata = getEnemy(state, "soundiata_spirit");
    const maskHunter = getEnemy(state, "mask_hunter");

    expect(
      soundiata.buffs.find((buff) => buff.type === "STRENGTH")?.stacks
    ).toBe(1);
    expect(
      maskHunter.buffs.find((buff) => buff.type === "STRENGTH")?.stacks
    ).toBe(1);
    expect(getSoundiataUiState(soundiata)?.verses[0]?.chapter).toBe("SHIELD");
    expect(getSoundiataUiState(soundiata)?.verses[0]?.progress).toBe(0);
  });

  it("soundiata can have a verse interrupted by player damage before it resolves", () => {
    const rng = createRNG("soundiata-interrupt");
    const soundiataDef = enemyDefs.get("soundiata_spirit");
    expect(soundiataDef).toBeDefined();
    if (!soundiataDef) return;

    let state = initializeSoundiataCombat(
      makeCombatState([
        makeEnemyState("soundiata_spirit", {
          mechanicFlags: {
            soundiata_spirit_slot_1_chapter: 0,
            soundiata_spirit_slot_1_progress: 1,
          },
        }),
        makeEnemyState("mask_hunter"),
      ]),
      enemyDefs
    );
    const soundiataId = getEnemy(state, "soundiata_spirit").instanceId;

    state = resolveEffects(
      state,
      [{ type: "DAMAGE", value: 12 }],
      { source: "player", target: { type: "enemy", instanceId: soundiataId } },
      rng
    );
    state = { ...state, phase: "ALLIES_ENEMIES_TURN" };
    state = executeOneEnemyTurn(
      state,
      getEnemy(state, "soundiata_spirit"),
      soundiataDef,
      rng,
      enemyDefs
    );

    expect(
      getEnemy(state, "soundiata_spirit").buffs.find(
        (buff) => buff.type === "STRENGTH"
      )
    ).toBeUndefined();
    expect(
      getEnemy(state, "mask_hunter").buffs.find(
        (buff) => buff.type === "STRENGTH"
      )
    ).toBeUndefined();
    expect(
      getSoundiataUiState(getEnemy(state, "soundiata_spirit"))?.verses[0]
        ?.chapter
    ).toBe("SHIELD");
  });

  it("soundiata phase 2 unlocks a second overlapping verse without duplicating the starting ally", () => {
    const rng = createRNG("soundiata-phase2");
    const soundiataDef = enemyDefs.get("soundiata_spirit");
    expect(soundiataDef).toBeDefined();
    if (!soundiataDef) return;

    let state = initializeSoundiataCombat(
      makeCombatState([
        makeEnemyState("soundiata_spirit", {
          currentHp: Math.floor(soundiataDef.maxHp / 2),
        }),
      ]),
      enemyDefs
    );

    state = { ...state, phase: "ALLIES_ENEMIES_TURN" };
    state = executeOneEnemyTurn(
      state,
      getEnemy(state, "soundiata_spirit"),
      soundiataDef,
      rng,
      enemyDefs
    );

    const soundiata = getEnemy(state, "soundiata_spirit");
    expect(soundiata.mechanicFlags?.soundiata_spirit_phase2).toBe(1);
    expect(
      state.enemies.filter((enemy) => enemy.definitionId === "mask_hunter")
    ).toHaveLength(1);
    expect(getSoundiataUiState(soundiata)?.verses).toHaveLength(2);
  });

  it("soundiata phase 2 routes interrupt damage to the first verse before the second", () => {
    const soundiataId = "soundiata-spirit-1";
    let state = synchronizeSoundiataCombatState(
      makeCombatState([
        makeEnemyState("soundiata_spirit", {
          instanceId: soundiataId,
          mechanicFlags: {
            soundiata_spirit_phase2: 1,
            soundiata_spirit_slot_1_chapter: 0,
            soundiata_spirit_slot_1_progress: 1,
            soundiata_spirit_slot_2_chapter: 2,
            soundiata_spirit_slot_2_progress: 1,
          },
        }),
        makeEnemyState("mask_hunter"),
      ])
    );

    state = registerSoundiataInterruptDamage(state, soundiataId, 18, "player");

    const ui = getSoundiataUiState(getEnemy(state, "soundiata_spirit"));
    expect(ui?.verses[0]?.interruptProgress).toBe(14);
    expect(ui?.verses[1]?.interruptProgress).toBe(4);
  });

  it("anansi webs the completing card and injects Shrouded Omen when the pattern is completed", () => {
    const rng = createRNG("anansi-complete");
    const anansiId = "anansi_weaver-1";
    let state = synchronizeAnansiCombatState(
      makeCombatState([
        makeEnemyState("anansi_weaver", {
          instanceId: anansiId,
          mechanicFlags: {
            anansi_weaver_pattern: 0,
            anansi_weaver_progress: 0,
            anansi_weaver_stalled: 0,
          },
        }),
      ])
    );

    state = playCard(state, "strike-1", anansiId, false, cardDefs, rng);
    state = playCard(state, "defend-1", null, false, cardDefs, rng);

    expect(state.webbedCardIds).toContain("defend-1");
    expect(
      state.discardPile.some((card) => card.definitionId === "shrouded_omen")
    ).toBe(true);
    expect(
      getAnansiUiState(getEnemy(state, "anansi_weaver"), state)?.progress
    ).toBe(2);
  });

  it("an inked skill counts as both SKILL and INK for anansi", () => {
    const rng = createRNG("anansi-inked-skill");
    const anansiId = "anansi_weaver-1";
    let state = synchronizeAnansiCombatState(
      makeCombatState([
        makeEnemyState("anansi_weaver", {
          instanceId: anansiId,
          mechanicFlags: {
            anansi_weaver_pattern: 2,
            anansi_weaver_progress: 0,
            anansi_weaver_stalled: 0,
          },
        }),
      ])
    );

    state = playCard(state, "ink-surge-1", null, true, cardDefs, rng);

    expect(state.webbedCardIds).toContain("ink-surge-1");
    expect(
      state.discardPile.some((card) => card.definitionId === "shrouded_omen")
    ).toBe(true);
    expect(
      getAnansiUiState(getEnemy(state, "anansi_weaver"), state)?.progress
    ).toBe(2);
    expect(
      getAnansiUiState(getEnemy(state, "anansi_weaver"), state)?.stalled
    ).toBe(false);
  });

  it("anansi stalls the loom when the player breaks the current pattern", () => {
    const rng = createRNG("anansi-stall");
    let state = synchronizeAnansiCombatState(
      makeCombatState([
        makeEnemyState("anansi_weaver", {
          mechanicFlags: {
            anansi_weaver_pattern: 1,
            anansi_weaver_progress: 0,
            anansi_weaver_stalled: 0,
          },
        }),
      ])
    );

    state = playCard(state, "defend-1", null, false, cardDefs, rng);

    expect(
      getAnansiUiState(getEnemy(state, "anansi_weaver"), state)?.stalled
    ).toBe(true);
    expect(state.webbedCardIds).toEqual([]);
    expect(
      state.discardPile.some((card) => card.definitionId === "shrouded_omen")
    ).toBe(true);
  });

  it("anansi still allows a free stall on non-ink patterns", () => {
    const rng = createRNG("anansi-stall-no-ink");
    let state = synchronizeAnansiCombatState(
      makeCombatState([
        makeEnemyState("anansi_weaver", {
          mechanicFlags: {
            anansi_weaver_pattern: 0,
            anansi_weaver_progress: 0,
            anansi_weaver_stalled: 0,
          },
        }),
      ])
    );

    state = playCard(state, "defend-1", null, false, cardDefs, rng);
    state = playCard(state, "ink-surge-1", null, false, cardDefs, rng);

    expect(
      getAnansiUiState(getEnemy(state, "anansi_weaver"), state)?.stalled
    ).toBe(true);
    expect(state.webbedCardIds).toEqual([]);
    expect(
      state.discardPile.some((card) => card.definitionId === "shrouded_omen")
    ).toBe(false);
  });

  it("webbed cards enter the hand frozen when they are drawn again", () => {
    const rng = createRNG("anansi-webbed-draw");
    let state = makeCombatState([makeEnemyState("anansi_weaver")], {
      hand: [],
      drawPile: [
        { instanceId: "defend-1", definitionId: "defend", upgraded: false },
      ],
      webbedCardIds: ["defend-1"],
    });

    state = drawCards(state, 1, rng, "PLAYER", "TEST:WEBBED_DRAW");

    expect(state.hand.map((card) => card.instanceId)).toContain("defend-1");
    expect(state.playerDisruption.frozenHandCardIds).toContain("defend-1");
  });

  it("anansi phase 2 uses a three-step pattern and injects two curses on completion", () => {
    const rng = createRNG("anansi-phase2");
    const anansiId = "anansi_weaver-1";
    let state = synchronizeAnansiCombatState(
      makeCombatState(
        [
          makeEnemyState("anansi_weaver", {
            instanceId: anansiId,
            mechanicFlags: {
              anansi_weaver_phase2: 1,
              anansi_weaver_pattern: 3,
              anansi_weaver_progress: 0,
              anansi_weaver_stalled: 0,
            },
          }),
        ],
        {
          player: {
            ...makeCombatState([]).player,
            energyCurrent: 6,
            energyMax: 6,
            inkCurrent: 2,
          },
        }
      )
    );

    state = playCard(state, "strike-1", anansiId, false, cardDefs, rng);
    state = playCard(state, "defend-1", null, false, cardDefs, rng);
    state = playCard(state, "ink-surge-1", null, true, cardDefs, rng);

    expect(state.webbedCardIds).toContain("ink-surge-1");
    expect(
      state.discardPile.some((card) => card.definitionId === "shrouded_omen")
    ).toBe(true);
    expect(
      state.discardPile.some((card) => card.definitionId === "binding_curse")
    ).toBe(true);
    expect(
      getAnansiUiState(getEnemy(state, "anansi_weaver"), state)?.length
    ).toBe(3);
  });
});
