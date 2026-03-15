import type { CombatState } from "../schemas/combat-state";
import type { RunState } from "../schemas/run-state";
import type {
  EnemyDefinition,
  EnemyState,
  AllyDefinition,
  AllyState,
} from "../schemas/entities";
import type { CardDefinition } from "../schemas/cards";
import type { ComputedMetaBonuses } from "../schemas/meta";
import { GAME_CONSTANTS } from "../constants";
import { drawCards, discardHand, shuffleDeck } from "./deck";
import { executeAlliesTurn, executeEnemiesTurn } from "./enemies";
import { applyMetaBonusesToCombat } from "./meta";
import { applyRelicsOnTurnStart, applyRelicsOnTurnEnd } from "./relics";
import {
  getDifficultyModifiers,
  getEnemyStartingBlock,
  getPostFloorFiveEscalation,
} from "./difficulty";
import {
  finalizeChapterGuardianPlayerTurn,
  initializeChapterGuardianCombat,
  resetChapterGuardianTurnState,
} from "./chapter-guardian";
import {
  ARCHIVIST_BLACK_INKWELL_ID,
  ARCHIVIST_PALE_INKWELL_ID,
  initializeArchivistCombat,
  synchronizeArchivistCombatState,
} from "./archivist";
import { matchesCardCharacter } from "./card-filters";
import {
  buildConditionCombatStartCards,
  isInfiniteRunConditionId,
} from "./run-conditions";
import type { RNG } from "./rng";
import { nanoid } from "nanoid";

const EMPTY_DISRUPTION: CombatState["playerDisruption"] = {
  extraCardCost: 0,
  drawPenalty: 0,
  drawsToDiscardRemaining: 0,
  freezeNextDrawsRemaining: 0,
  frozenHandCardIds: [],
  disabledInkPowers: [],
};

function mergeDisruptions(
  current: CombatState["playerDisruption"],
  incoming: CombatState["nextPlayerDisruption"]
): CombatState["playerDisruption"] {
  return {
    extraCardCost: (current.extraCardCost ?? 0) + (incoming.extraCardCost ?? 0),
    drawPenalty: (current.drawPenalty ?? 0) + (incoming.drawPenalty ?? 0),
    drawsToDiscardRemaining:
      (current.drawsToDiscardRemaining ?? 0) +
      (incoming.drawsToDiscardRemaining ?? 0),
    freezeNextDrawsRemaining:
      (current.freezeNextDrawsRemaining ?? 0) +
      (incoming.freezeNextDrawsRemaining ?? 0),
    frozenHandCardIds: [...(current.frozenHandCardIds ?? [])],
    disabledInkPowers: Array.from(
      new Set([
        ...(current.disabledInkPowers ?? []),
        ...(incoming.disabledInkPowers ?? []),
      ])
    ),
  };
}

function getEliteEscortChance(difficultyLevel: number): number {
  if (difficultyLevel >= 5) return 0.85;
  if (difficultyLevel >= 4) return 0.55;
  if (difficultyLevel >= 3) return 0.3;
  return 0;
}

function buildEliteEscortIds(
  enemyIds: string[],
  difficultyLevel: number,
  enemyDefs: Map<string, EnemyDefinition>,
  rng: RNG
): string[] {
  const escortChance = getEliteEscortChance(difficultyLevel);
  if (escortChance <= 0) return [];

  const eliteDefs = enemyIds
    .map((id) => enemyDefs.get(id))
    .filter(
      (enemy): enemy is EnemyDefinition =>
        enemy != null && enemy.isElite === true && enemy.isBoss !== true
    );
  if (eliteDefs.length !== 1) return [];
  if (rng.next() >= escortChance) return [];

  const leader = eliteDefs[0];
  if (!leader) return [];
  const normalPool = [...enemyDefs.values()].filter(
    (enemy) =>
      !enemy.isBoss &&
      !enemy.isElite &&
      !enemy.isScriptedOnly &&
      !enemyIds.includes(enemy.id) &&
      (enemy.biome === leader.biome || enemy.biome === "LIBRARY")
  );
  if (normalPool.length === 0) return [];

  const supportPool = normalPool.filter(
    (enemy) => enemy.role === "SUPPORT" || enemy.role === "CONTROL"
  );
  const escortPool = supportPool.length > 0 ? supportPool : normalPool;
  return [rng.pick(escortPool).id];
}

/**
 * Initialize a new combat encounter.
 */
export function initCombat(
  runState: RunState,
  enemyIds: string[],
  enemyDefs: Map<string, EnemyDefinition>,
  allyDefs: Map<string, AllyDefinition>,
  cardDefs: Map<string, CardDefinition>,
  rng: RNG,
  metaBonuses?: ComputedMetaBonuses
): CombatState {
  const bonuses = metaBonuses ?? runState.metaBonuses;
  const difficultyLevel = runState.selectedDifficultyLevel ?? 0;
  const difficultyMods = getDifficultyModifiers(difficultyLevel);
  const postFloorEscalation = getPostFloorFiveEscalation(
    runState.floor,
    isInfiniteRunConditionId(runState.selectedRunConditionId)
  );
  const floorEnemyHpMultiplier =
    (1 + (runState.floor - 1) * 0.15) *
    difficultyMods.enemyHpMultiplier *
    postFloorEscalation.enemyHpMultiplier;
  const enemyDamageScale =
    (1 + (runState.floor - 1) * 0.18) *
    difficultyMods.enemyDamageMultiplier *
    postFloorEscalation.enemyDamageMultiplier;
  const enemySpawnCountByDef: Record<string, number> = {};
  const scriptedArchivistAdds = enemyIds.includes("the_archivist")
    ? [ARCHIVIST_BLACK_INKWELL_ID, ARCHIVIST_PALE_INKWELL_ID].filter(
        (id) => !enemyIds.includes(id)
      )
    : [];
  const encounterEnemyIds = [
    ...enemyIds,
    ...scriptedArchivistAdds,
    ...buildEliteEscortIds(enemyIds, difficultyLevel, enemyDefs, rng),
  ].slice(0, 4);

  // Create enemy instances
  const enemies: EnemyState[] = encounterEnemyIds.map((id) => {
    const def = enemyDefs.get(id);
    if (!def) throw new Error(`Unknown enemy definition: ${id}`);
    const spawnedCount = enemySpawnCountByDef[id] ?? 0;
    enemySpawnCountByDef[id] = spawnedCount + 1;
    const abilityCount = Math.max(1, def.abilities.length);
    // Desync identical enemies so they don't mirror the exact same opening intent.
    const initialIntentIndex = spawnedCount % abilityCount;
    const scaledHp = Math.max(
      1,
      Math.round(def.maxHp * floorEnemyHpMultiplier)
    );
    const startingBlock = getEnemyStartingBlock(
      difficultyLevel,
      runState.floor,
      {
        isBoss: def.isBoss,
        isElite: def.isElite,
      }
    );
    return {
      instanceId: nanoid(),
      definitionId: id,
      name: def.name,
      isBoss: def.isBoss,
      isElite: def.isElite,
      currentHp: scaledHp,
      maxHp: scaledHp,
      block: startingBlock,
      mechanicFlags: {},
      speed: def.speed,
      buffs: [],
      intentIndex: initialIntentIndex,
    };
  });

  // Create allied instances from run recruits (capped by unlocked slots)
  const maxAllies = Math.min(
    GAME_CONSTANTS.MAX_ALLIES,
    Math.max(0, bonuses?.allySlots ?? 0)
  );
  const allyIds = (runState.allyIds ?? []).slice(0, maxAllies);
  const allies: AllyState[] = allyIds
    .map((id) => allyDefs.get(id))
    .filter((a): a is AllyDefinition => a != null)
    .map((def) => {
      const allyHpPercent = Math.max(0, bonuses?.allyHpPercent ?? 0);
      const scaledMaxHp = Math.max(
        1,
        Math.round(def.maxHp * (1 + allyHpPercent / 100))
      );
      // Use persistent HP if available (ally took damage in a previous combat)
      const storedHp = runState.allyCurrentHps?.[def.id];
      const currentHp =
        storedHp != null ? Math.min(storedHp, scaledMaxHp) : scaledMaxHp;
      return {
        instanceId: nanoid(),
        definitionId: def.id,
        name: def.name,
        currentHp,
        maxHp: scaledMaxHp,
        block: 0,
        speed: def.speed,
        buffs: [],
        intentIndex: 0,
      };
    });

  // Build draw pile from run deck
  const drawPile = shuffleDeck([...runState.deck], rng);

  const combat: CombatState = {
    floor: runState.floor,
    difficultyLevel,
    enemyDamageScale,
    turnNumber: 1,
    phase: "PLAYER_TURN",
    player: {
      currentHp: runState.playerCurrentHp,
      maxHp: runState.playerMaxHp,
      block: 0,
      energyCurrent: GAME_CONSTANTS.STARTING_ENERGY,
      energyMax: GAME_CONSTANTS.STARTING_ENERGY,
      inkCurrent: 0,
      inkMax:
        GAME_CONSTANTS.STARTING_INK_MAX +
        (runState.relicPersistentStats?.inkMax ?? 0),
      inkPerCardChance: GAME_CONSTANTS.STARTING_INK_PER_CARD_CHANCE,
      inkPerCardValue: GAME_CONSTANTS.STARTING_INK_PER_CARD_VALUE,
      regenPerTurn: 0,
      firstHitDamageReductionPercent: 0,
      drawCount: GAME_CONSTANTS.STARTING_DRAW_COUNT,
      speed: 0,
      strength: runState.relicPersistentStats?.strength ?? 0,
      focus: runState.relicPersistentStats?.focus ?? 0,
      buffs: [],
    },
    allies,
    enemies,
    drawPile,
    hand: [],
    discardPile: [],
    exhaustPile: [],
    pendingHandOverflowExhaust: 0,
    drawDebugHistory: [],
    inkPowerUsedThisTurn: false,
    firstHitReductionUsed: false,
    playerDisruption: { ...EMPTY_DISRUPTION },
    nextPlayerDisruption: { ...EMPTY_DISRUPTION },
    relicFlags: {},
    relicCounters: {},
    relicModifiers: {
      playerVulnerableDamageMultiplier: 1.5,
      enemyVulnerableDamageMultiplier: 1.5,
      playerPoisonDamageMultiplier: 1,
      enemyPoisonDamageMultiplier: 1,
      playerBleedDamageMultiplier: 1,
      enemyBleedDamageMultiplier: 1,
    },
  };

  // Apply meta-progression bonuses if any
  const combatWithChapterGuardian = initializeChapterGuardianCombat(combat);
  const combatWithMeta = bonuses
    ? applyMetaBonusesToCombat(combatWithChapterGuardian, bonuses)
    : combatWithChapterGuardian;
  const startCombatCards = buildConditionCombatStartCards(
    runState.selectedRunConditionId,
    cardDefs
  ).filter((card) => matchesCardCharacter(card, runState.characterId));
  const openingHandCards = startCombatCards.map((card) => ({
    instanceId: nanoid(),
    definitionId: card.id,
    upgraded: false,
  }));
  const combatWithOpeningCards =
    openingHandCards.length > 0
      ? {
          ...combatWithMeta,
          hand: [...combatWithMeta.hand, ...openingHandCards],
        }
      : combatWithMeta;

  // Draw initial hand (extraHandAtStart included via drawCount bonus)
  const extraHand = bonuses?.extraHandAtStart ?? 0;
  const combatWithOpeningDraw = drawCards(
    combatWithOpeningCards,
    combatWithOpeningCards.player.drawCount + extraHand,
    rng,
    "SYSTEM",
    "COMBAT_INIT_OPENING_HAND"
  );
  return initializeArchivistCombat(combatWithOpeningDraw);
}

/**
 * Start a new player turn: reset block, restore energy, draw cards.
 */
export function startPlayerTurn(
  state: CombatState,
  rng: RNG,
  relicIds: string[] = []
): CombatState {
  const regenAmount = Math.max(0, state.player.regenPerTurn);
  let current: CombatState = {
    ...state,
    phase: "PLAYER_TURN",
    turnNumber: state.turnNumber + 1,
    inkPowerUsedThisTurn: false,
    playerDisruption: mergeDisruptions(
      state.playerDisruption ?? { ...EMPTY_DISRUPTION },
      state.nextPlayerDisruption ?? { ...EMPTY_DISRUPTION }
    ),
    nextPlayerDisruption: { ...EMPTY_DISRUPTION },
    player: {
      ...state.player,
      currentHp: Math.min(
        state.player.maxHp,
        state.player.currentHp + regenAmount
      ),
    },
  };

  current = resetChapterGuardianTurnState(current);
  current = applyRelicsOnTurnStart(current, relicIds, rng);
  current = drawCards(
    current,
    Math.max(
      0,
      current.player.drawCount - (current.playerDisruption.drawPenalty ?? 0)
    ),
    rng,
    "SYSTEM",
    "TURN_START_BASE_DRAW"
  );
  return current;
}

/**
 * End the player's turn: apply turn-end relic effects, discard hand, transition to enemy phase.
 */
export function endPlayerTurn(
  state: CombatState,
  relicIds: string[] = []
): CombatState {
  const afterRelics = applyRelicsOnTurnEnd(state, relicIds);
  const afterGuardian = finalizeChapterGuardianPlayerTurn(afterRelics);
  const afterDiscard = discardHand(afterGuardian);
  return {
    ...afterDiscard,
    phase: "ALLIES_ENEMIES_TURN",
    playerDisruption: { ...EMPTY_DISRUPTION },
  };
}

/**
 * Execute the allies + enemies phase, then check for combat end.
 */
export function executeAlliesEnemiesTurn(
  state: CombatState,
  enemyDefs: Map<string, EnemyDefinition>,
  allyDefs: Map<string, AllyDefinition>,
  rng: RNG
): CombatState {
  // Reset enemy blocks at start of their turn
  let current: CombatState = {
    ...state,
    enemies: state.enemies.map((e) => ({ ...e, block: 0 })),
  };

  current = executeAlliesTurn(current, allyDefs, rng);
  current = executeEnemiesTurn(current, enemyDefs, rng);
  return checkCombatEnd(synchronizeArchivistCombatState(current));
}

/**
 * Check win/loss conditions and update phase accordingly.
 */
export function checkCombatEnd(state: CombatState): CombatState {
  if (state.player.currentHp <= 0) {
    if (state.relicFlags?.deathless_locket_available) {
      return {
        ...state,
        player: {
          ...state.player,
          currentHp: Math.max(1, Math.floor(state.player.maxHp * 0.3)),
          block: state.player.block + 20,
        },
        relicFlags: {
          ...(state.relicFlags ?? {}),
          deathless_locket_available: false,
        },
      };
    }
    return { ...state, phase: "COMBAT_LOST" };
  }

  const allEnemiesDead = state.enemies.every((e) => e.currentHp <= 0);
  if (allEnemiesDead) {
    return { ...state, phase: "COMBAT_WON" };
  }

  return state;
}
