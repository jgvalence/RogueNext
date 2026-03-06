import type { RunState, RoomNode } from "../schemas/run-state";
import type { CombatState } from "../schemas/combat-state";
import type { CardDefinition, CardInstance } from "../schemas/cards";
import type { BiomeType, BiomeResource } from "../schemas/enums";
import type { ComputedMetaBonuses } from "../schemas/meta";
import { GAME_CONSTANTS } from "../constants";
import { enemyDefinitions } from "../data/enemies";
import { relicDefinitions } from "../data/relics";
import type { CardUnlockProgress } from "./card-unlocks";
import {
  computeUnlockedCardIds,
  onBossKilled,
  onEliteKilled,
  onEnterBiome,
} from "./card-unlocks";
import { createRNG, type RNG } from "./rng";
import { nanoid } from "nanoid";
import {
  applyRunConditionMetaBonuses,
  buildConditionStarterCards,
  drawRunConditionChoices,
  getRunConditionById,
  getRunConditionMapRules,
  isInfiniteRunConditionId,
  isRunModeConditionId,
  normalizeRunConditionId,
  normalizeRunConditionIds,
} from "./run-conditions";
import {
  computeEnemyKillUnlockedRelicIds,
  getDifficultyModifiers,
  getPostFloorFiveEscalation,
} from "./difficulty";
import { createUsableItemInstance } from "./items";
import {
  deriveEncounteredEnemyType,
  mergeEncounteredEnemies,
  type EncounteredEnemyType,
} from "./bestiary";
import { addRelicToRunState } from "./relics";

type EnemyDef = (typeof enemyDefinitions)[0];
const DISRUPTION_EFFECT_TYPES = new Set([
  "FREEZE_HAND_CARDS",
  "NEXT_DRAW_TO_DISCARD_THIS_TURN",
  "DISABLE_INK_POWER_THIS_TURN",
  "INCREASE_CARD_COST_THIS_TURN",
  "INCREASE_CARD_COST_NEXT_TURN",
  "REDUCE_DRAW_THIS_TURN",
  "REDUCE_DRAW_NEXT_TURN",
  "FORCE_DISCARD_RANDOM",
]);

function weightedPick<T>(
  items: readonly T[],
  getWeight: (item: T) => number,
  rng: RNG
): T {
  const weights = items.map((item) => Math.max(0, getWeight(item)));
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return rng.pick(items);

  let roll = rng.next() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i]!;
    if (roll <= 0) return items[i]!;
  }
  return items[items.length - 1]!;
}

function getEnemySelectionWeight(
  enemy: EnemyDef,
  floor: number,
  currentBiome?: BiomeType
): number {
  // Base weight by explicit tier ("difficulty level").
  const tierWeight = 1 + Math.max(0, enemy.tier - 1) * Math.max(0, floor - 1);
  // Extra bias by HP so stronger monsters inside a tier appear more on high floors.
  const hpWeight = 1 + (enemy.maxHp / 100) * Math.max(0, floor - 1);
  let biomeWeight = 1;
  if (currentBiome) {
    if (enemy.biome === currentBiome) biomeWeight = 2.2;
    else if (enemy.biome === "LIBRARY" && currentBiome !== "LIBRARY")
      biomeWeight = 0.35;
  }
  return tierWeight * hpWeight * biomeWeight;
}

function hasDisruptionAbility(enemy: EnemyDef): boolean {
  return enemy.abilities.some((ability) =>
    ability.effects.some((effect) => DISRUPTION_EFFECT_TYPES.has(effect.type))
  );
}

function isThematicEnemy(enemy: EnemyDef): boolean {
  return (
    hasDisruptionAbility(enemy) ||
    enemy.role === "SUPPORT" ||
    enemy.role === "CONTROL" ||
    enemy.role === "TANK"
  );
}

function getMaxEnemyCountForRoom(
  floor: number,
  biome: BiomeType,
  difficultyLevel: number
): number {
  const difficultyModifiers = getDifficultyModifiers(difficultyLevel);
  const biomeCountBonusByBiome: Record<BiomeType, number> = {
    LIBRARY: 0,
    VIKING: 0,
    GREEK: 0,
    EGYPTIAN: 0,
    LOVECRAFTIAN: -1,
    AZTEC: 0,
    CELTIC: -1,
    RUSSIAN: -1,
    AFRICAN: 1,
  };

  return Math.min(
    GAME_CONSTANTS.MAX_ENEMIES,
    Math.max(
      1,
      2 +
        Math.floor(floor / 2) +
        (biomeCountBonusByBiome[biome] ?? 0) +
        difficultyModifiers.enemyPackSizeBonus
    )
  );
}

/**
 * Create a new run with starter deck and generated map.
 */
export function createNewRun(
  runId: string,
  seed: string,
  starterCards: CardDefinition[],
  rng: RNG,
  metaBonuses?: ComputedMetaBonuses,
  unlockedStoryIdsSnapshot: string[] = [],
  initialUnlockProgress?: CardUnlockProgress,
  allCards?: CardDefinition[],
  unlockedRunConditionIds: string[] = [],
  unlockedDifficultyLevels: number[] = [0],
  unlockedDifficultyLevelMax = 0,
  startingBiomeChoices: [BiomeType, BiomeType] | null = null,
  startMerchantResourcePool: Record<string, number> = {},
  initialEncounteredEnemies: Record<string, EncounteredEnemyType> = {},
  unlockedRelicIdsSnapshot: string[] = relicDefinitions.map((r) => r.id),
  initialEnemyKillCounts: Record<string, number> = {},
  availableCharacters: string[] = ["scribe"],
  difficultyMaxByCharacter: Record<string, number> = {}
): RunState {
  // Build starter deck instances
  const deck: CardInstance[] = starterCards.map((card) => ({
    instanceId: nanoid(),
    definitionId: card.id,
    upgraded: false,
  }));
  if (metaBonuses?.startingRareCard && allCards && allCards.length > 0) {
    const rarePool = allCards.filter(
      (card) =>
        card.rarity === "RARE" &&
        !card.isStarterCard &&
        card.isCollectible !== false
    );
    if (rarePool.length > 0) {
      const rareCard = rng.pick(rarePool);
      deck.push({
        instanceId: nanoid(),
        definitionId: rareCard.id,
        upgraded: false,
      });
    }
  }

  const map = generateFloorMap(1, rng, "LIBRARY");
  const pendingRunConditionChoices = drawRunConditionChoices(
    unlockedRunConditionIds,
    createRNG(`${seed}-run-conditions`)
  );

  const startingGold =
    GAME_CONSTANTS.STARTING_GOLD + (metaBonuses?.startingGold ?? 0);
  const extraHp = metaBonuses?.extraHp ?? 0;
  const unlockProgress = initialUnlockProgress ?? {
    enteredBiomes: { LIBRARY: 1 },
    biomeRunsCompleted: {},
    eliteKillsByBiome: {},
    bossKillsByBiome: {},
  };
  const unlockedCardIdsRaw = allCards
    ? computeUnlockedCardIds(
        allCards,
        unlockProgress,
        unlockedStoryIdsSnapshot,
        initialEnemyKillCounts
      )
    : [];
  const unlockedCardIds = unlockedCardIdsRaw;

  return {
    runId,
    seed,
    status: "IN_PROGRESS",
    runStartedAtMs: Date.now(),
    floor: 1,
    currentRoom: 0,
    gold: startingGold,
    maxGoldReached: startingGold,
    merchantRerollCount: 0,
    playerMaxHp: GAME_CONSTANTS.STARTING_HP + extraHp,
    playerCurrentHp: GAME_CONSTANTS.STARTING_HP + extraHp,
    deck,
    allyIds: [],
    allyCurrentHps: {},
    relicIds: [],
    usableItems: [],
    usableItemCapacity: GAME_CONSTANTS.MAX_USABLE_ITEMS,
    freeUpgradeUsed: false,
    survivalOnceUsed: false,
    map,
    combat: null,
    currentBiome: "LIBRARY",
    characterId: "scribe",
    pendingCharacterChoices:
      availableCharacters.length > 1 ? availableCharacters : null,
    difficultyMaxByCharacter,
    pendingBiomeChoices: startingBiomeChoices,
    pendingDifficultyLevels: unlockedDifficultyLevels,
    selectedDifficultyLevel: null,
    unlockedDifficultyLevelSnapshot: unlockedDifficultyLevelMax,
    pendingRunConditionChoices,
    selectedRunConditionId: null,
    earnedResources: {},
    startMerchantResourcePool,
    startMerchantSpentResources: {},
    startMerchantPurchasedOfferIds: [],
    startMerchantCompleted: false,
    metaBonuses,
    unlockedStoryIdsSnapshot,
    unlockedRelicIds: unlockedRelicIdsSnapshot,
    unlockedCardIds,
    initialUnlockedCardIds: unlockedCardIds,
    cardUnlockProgress: unlockProgress,
    seenEventIds: [],
    scribeAttitude: 0,
    scribeChoices: {},
    encounteredEnemies: initialEncounteredEnemies,
    enemyKillCounts: initialEnemyKillCounts,
    relicPersistentStats: { strength: 0, focus: 0, inkMax: 0 },
  };
}

/**
 * Generate a floor map: array of room slots, each with 1-3 room choices.
 * Room 0 = always COMBAT, Room 9 = always COMBAT (boss).
 * Rooms 1-8: exactly 1 MERCHANT + 1-2 SPECIAL + rest COMBAT, shuffled.
 */
export function generateFloorMap(
  floor: number,
  rng: RNG,
  biome: BiomeType,
  selectedRunConditionId?: string | null,
  difficultyLevel = 0
): RoomNode[][] {
  const mapRules = getRunConditionMapRules(selectedRunConditionId);
  const isInfiniteMode = isInfiniteRunConditionId(selectedRunConditionId);
  // Build the sequence for rooms 1-7 (7 middle rooms): 1 shop, 1-2 events, rest combat
  // Room 8 is always PRE_BOSS; Room 9 is always BOSS
  const minSpecial = mapRules.extraSpecialRoom ? 2 : 1;
  const maxSpecial = mapRules.extraSpecialRoom ? 3 : 2;
  const numSpecial = rng.nextInt(minSpecial, maxSpecial);
  const middleTypes: Array<"COMBAT" | "MERCHANT" | "SPECIAL"> = [
    ...(mapRules.noMerchants ? [] : (["MERCHANT"] as const)),
    ...Array<"SPECIAL">(numSpecial).fill("SPECIAL"),
    ...Array<"COMBAT">(7 - (mapRules.noMerchants ? 0 : 1) - numSpecial).fill(
      "COMBAT"
    ),
  ];
  const shuffledMiddle = buildBalancedMiddleRooms(middleTypes, rng);
  if (floor === 1 && shuffledMiddle[1] !== "SPECIAL") {
    const specialIndex = shuffledMiddle.findIndex((type) => type === "SPECIAL");
    if (specialIndex >= 0) {
      [shuffledMiddle[1], shuffledMiddle[specialIndex]] = [
        shuffledMiddle[specialIndex]!,
        shuffledMiddle[1]!,
      ];
    }
  }

  const PRE_BOSS_ROOM_INDEX = GAME_CONSTANTS.BOSS_ROOM_INDEX - 1; // 8
  const maxRandomEliteRoomsForFloor =
    floor === 1 ? 1 : Number.POSITIVE_INFINITY;
  let randomEliteRoomsGenerated = 0;

  const map: RoomNode[][] = [];

  for (let i = 0; i < GAME_CONSTANTS.ROOMS_PER_FLOOR; i++) {
    const isBossRoom = i === GAME_CONSTANTS.BOSS_ROOM_INDEX;
    const isFirstRoom = i === 0;
    const isPreBossRoom = i === PRE_BOSS_ROOM_INDEX;

    // PRE_BOSS room: always a single node with 1 elite enemy for the "fight for relic" option
    if (isPreBossRoom) {
      const preBossDefs = mapRules.bossOnlyCombats
        ? enemyDefinitions.filter((e) => e.isBoss && e.biome === biome)
        : enemyDefinitions.filter(
            (e) => e.isElite && (e.biome === biome || e.biome === "LIBRARY")
          );
      const preBossEnemyId =
        preBossDefs.length > 0
          ? weightedPick(
              preBossDefs,
              (e) => getEnemySelectionWeight(e, floor, biome),
              rng
            ).id
          : "ink_slime";
      map.push([
        {
          index: i,
          type: "PRE_BOSS",
          enemyIds: [preBossEnemyId],
          isElite: true,
          completed: false,
        },
      ]);
      continue;
    }

    const requestedChoices =
      mapRules.forceSingleChoice ||
      mapRules.bossOnlyCombats ||
      isBossRoom ||
      isFirstRoom
        ? 1
        : rng.nextInt(1, GAME_CONSTANTS.ROOM_CHOICES);

    const baseType: "COMBAT" | "MERCHANT" | "SPECIAL" =
      isBossRoom || isFirstRoom ? "COMBAT" : shuffledMiddle[i - 1]!;

    const maxEnemyCount = getMaxEnemyCountForRoom(
      floor,
      biome,
      difficultyLevel
    );
    const numChoices =
      baseType === "COMBAT"
        ? Math.min(requestedChoices, Math.max(1, maxEnemyCount))
        : requestedChoices;

    const choices: RoomNode[] = [];
    for (let j = 0; j < numChoices; j++) {
      // First choice uses the assigned type; extra choices are always COMBAT
      const type = j === 0 ? baseType : ("COMBAT" as const);

      const enemyResult =
        type === "COMBAT"
          ? generateRoomEnemies(
              floor,
              i,
              isBossRoom,
              biome,
              rng,
              difficultyLevel,
              numChoices > 1 ? j + 1 : 1,
              randomEliteRoomsGenerated < maxRandomEliteRoomsForFloor,
              mapRules.bossOnlyCombats ?? false,
              isInfiniteMode
            )
          : undefined;

      if (enemyResult?.isElite) {
        randomEliteRoomsGenerated += 1;
      }

      choices.push({
        index: i,
        type,
        enemyIds: enemyResult?.enemyIds,
        isElite: enemyResult?.isElite ?? false,
        completed: false,
      });
    }

    map.push(choices);
  }

  return map;
}

function buildBalancedMiddleRooms(
  middleTypes: Array<"COMBAT" | "MERCHANT" | "SPECIAL">,
  rng: RNG
): Array<"COMBAT" | "MERCHANT" | "SPECIAL"> {
  // Avoid long early-combat streaks:
  // at least one non-combat in the first 5 slots, and at most one non-combat in last 2.
  const isAcceptable = (rooms: Array<"COMBAT" | "MERCHANT" | "SPECIAL">) => {
    const firstFiveHaveNonCombat = rooms
      .slice(0, 5)
      .some((t) => t !== "COMBAT");
    const tailNonCombatCount = rooms
      .slice(5)
      .filter((t) => t !== "COMBAT").length;
    return firstFiveHaveNonCombat && tailNonCombatCount <= 1;
  };

  for (let attempt = 0; attempt < 8; attempt++) {
    const shuffled = rng.shuffle(middleTypes);
    if (isAcceptable(shuffled)) return shuffled;
  }

  // Fallback: keep randomness but force a single early non-combat if needed.
  const fallback = rng.shuffle(middleTypes);
  const firstFiveHaveNonCombat = fallback
    .slice(0, 5)
    .some((t) => t !== "COMBAT");
  if (firstFiveHaveNonCombat) return fallback;

  const lateNonCombatIndex = fallback.findIndex(
    (t, idx) => idx >= 5 && t !== "COMBAT"
  );
  if (lateNonCombatIndex === -1) return fallback;

  const earlyCombatSlots = fallback
    .map((t, idx) => ({ t, idx }))
    .filter((x) => x.idx < 5 && x.t === "COMBAT")
    .map((x) => x.idx);
  if (earlyCombatSlots.length === 0) return fallback;

  const swapWith = rng.pick(earlyCombatSlots);
  const result = [...fallback];
  [result[swapWith], result[lateNonCombatIndex]] = [
    result[lateNonCombatIndex]!,
    result[swapWith]!,
  ];
  return result;
}

/**
 * Generate enemy IDs for a combat room, filtered by biome.
 * Library enemies appear in all biomes (they're universal).
 * Biome-specific enemies only appear in their biome.
 */
function generateRoomEnemies(
  floor: number,
  room: number,
  isBoss: boolean,
  biome: BiomeType,
  rng: RNG,
  difficultyLevel = 0,
  minEnemyCount = 1,
  allowElite = true,
  bossOnlyCombats = false,
  isInfiniteMode = false
): { enemyIds: string[]; isElite: boolean } {
  const difficultyModifiers = getDifficultyModifiers(difficultyLevel);
  const postFloorEscalation = getPostFloorFiveEscalation(floor, isInfiniteMode);
  const canAppear = (e: (typeof enemyDefinitions)[0]) =>
    e.biome === biome || e.biome === "LIBRARY";

  if (isBoss || bossOnlyCombats) {
    const bossPool = enemyDefinitions
      .filter((e) => e.isBoss && e.biome === biome)
      .map((e) => e.id);
    // Fallback to Library boss if biome has none
    if (bossPool.length === 0) {
      return { enemyIds: ["chapter_guardian"], isElite: false };
    }
    return { enemyIds: [rng.pick(bossPool)], isElite: false };
  }

  // Elite rooms — only from room 3 onwards
  const elitePool = enemyDefinitions
    .filter((e) => e.isElite && canAppear(e))
    .map((e) => e.id);
  const eliteDefs = enemyDefinitions.filter((e) => elitePool.includes(e.id));
  const eliteChance = Math.min(
    isInfiniteMode ? 0.95 : 0.8,
    0.25 +
      (floor - 1) * 0.05 +
      difficultyModifiers.eliteChanceBonus +
      postFloorEscalation.eliteChanceBonus
  );
  if (
    allowElite &&
    room >= 3 &&
    eliteDefs.length > 0 &&
    rng.next() < eliteChance
  ) {
    const elite = weightedPick(
      eliteDefs,
      (e) => getEnemySelectionWeight(e, floor, biome),
      rng
    );
    return { enemyIds: [elite.id], isElite: true };
  }

  // Regular enemies
  const normalPool = enemyDefinitions.filter(
    (e) => !e.isBoss && !e.isElite && canAppear(e)
  );

  if (normalPool.length === 0) {
    return { enemyIds: ["ink_slime"], isElite: false };
  }

  const maxEnemyCount = getMaxEnemyCountForRoom(floor, biome, difficultyLevel);
  const clampedMinEnemyCount = Math.max(
    1,
    Math.min(minEnemyCount, maxEnemyCount)
  );
  const count = rng.nextInt(clampedMinEnemyCount, maxEnemyCount);
  const enemies: string[] = [];
  const assaultPool = normalPool.filter(
    (e) => e.role === "ASSAULT" || e.role === "HYBRID"
  );
  const supportPool = normalPool.filter(
    (e) => e.role === "SUPPORT" || e.role === "CONTROL" || e.role === "TANK"
  );
  const disruptionPool = normalPool.filter(hasDisruptionAbility);

  for (let i = 0; i < count; i++) {
    const preferDisruptionLead =
      i === 0 && biome === "AFRICAN" && disruptionPool.length > 0;
    const preferSupportSlot =
      count > 1 && i > 0 && (biome === "AFRICAN" || biome === "LIBRARY");
    const sourcePool = preferDisruptionLead
      ? disruptionPool
      : preferSupportSlot && supportPool.length > 0
        ? supportPool
        : assaultPool.length > 0
          ? assaultPool
          : normalPool;
    const picked = weightedPick(
      sourcePool,
      (e) => getEnemySelectionWeight(e, floor, biome),
      rng
    );
    enemies.push(picked.id);
  }

  const selectedDefs = enemies
    .map((enemyId) => normalPool.find((enemy) => enemy.id === enemyId))
    .filter((enemy): enemy is EnemyDef => !!enemy);

  // Keep the encounter identity anchored in the chosen biome.
  if (
    biome !== "LIBRARY" &&
    !selectedDefs.some((enemy) => enemy.biome === biome)
  ) {
    const biomePool = normalPool.filter((enemy) => enemy.biome === biome);
    if (biomePool.length > 0) {
      enemies[0] = weightedPick(
        biomePool,
        (enemy) => getEnemySelectionWeight(enemy, floor, biome),
        rng
      ).id;
    }
  }

  // Ensure multi-enemy fights are not pure assault mirrors.
  if (count > 1) {
    const refreshedDefs = enemies
      .map((enemyId) => normalPool.find((enemy) => enemy.id === enemyId))
      .filter((enemy): enemy is EnemyDef => !!enemy);
    const hasThematicUnit = refreshedDefs.some(isThematicEnemy);
    if (!hasThematicUnit) {
      const biomeThematicPool = normalPool.filter(
        (enemy) => enemy.biome === biome && isThematicEnemy(enemy)
      );
      const fallbackThematicPool = normalPool.filter(isThematicEnemy);
      const thematicPool =
        biomeThematicPool.length > 0 ? biomeThematicPool : fallbackThematicPool;
      if (thematicPool.length > 0) {
        enemies[count - 1] = weightedPick(
          thematicPool,
          (enemy) => getEnemySelectionWeight(enemy, floor, biome),
          rng
        ).id;
      }
    }
  }

  // In larger packs, avoid full clone squads when alternatives exist.
  if (count >= 3 && new Set(enemies).size === 1 && normalPool.length > 1) {
    const cloneId = enemies[0]!;
    const alternatives = normalPool.filter((enemy) => enemy.id !== cloneId);
    if (alternatives.length > 0) {
      enemies[count - 1] = weightedPick(
        alternatives,
        (enemy) => getEnemySelectionWeight(enemy, floor, biome),
        rng
      ).id;
    }
  }

  return { enemyIds: enemies, isElite: false };
}

/**
 * Select a room choice and advance the run.
 */
export function selectRoom(runState: RunState, choiceIndex: number): RunState {
  const currentRoomChoices = runState.map[runState.currentRoom];
  if (!currentRoomChoices) return runState;

  const choice = currentRoomChoices[choiceIndex];
  if (!choice) return runState;

  // Mark as completed
  const newMap = runState.map.map((slot, i) =>
    i === runState.currentRoom
      ? slot.map((r, j) => (j === choiceIndex ? { ...r, completed: true } : r))
      : slot
  );

  return {
    ...runState,
    map: newMap,
  };
}

export function applyDifficultyToRun(
  runState: RunState,
  difficultyLevel: number
): RunState {
  if (runState.selectedDifficultyLevel !== null) return runState;
  const pendingLevels = runState.pendingDifficultyLevels ?? [];
  if (!pendingLevels.includes(difficultyLevel)) return runState;

  return {
    ...runState,
    selectedDifficultyLevel: difficultyLevel,
    pendingDifficultyLevels: [],
  };
}

export function applyRunConditionToRun(
  runState: RunState,
  conditionId: string,
  rng: RNG,
  allCards: CardDefinition[]
): RunState {
  if (runState.selectedDifficultyLevel === null) return runState;
  const normalizedConditionId = normalizeRunConditionId(conditionId);
  if (!normalizedConditionId) return runState;
  const isAtRunSetupStart =
    runState.floor === 1 &&
    runState.currentRoom === 0 &&
    runState.combat === null;
  const isTargetModeCondition = isRunModeConditionId(normalizedConditionId);
  const pendingChoices = normalizeRunConditionIds(
    runState.pendingRunConditionChoices ?? []
  );

  const currentConditionId = normalizeRunConditionId(
    runState.selectedRunConditionId
  );
  if (currentConditionId) {
    const canSwapRunModeOnly =
      currentConditionId !== normalizedConditionId &&
      isRunModeConditionId(currentConditionId) &&
      isTargetModeCondition &&
      isAtRunSetupStart;
    if (canSwapRunModeOnly) {
      return {
        ...runState,
        selectedRunConditionId: normalizedConditionId,
      };
    }
    const canPromoteModeIntoNormalCondition =
      isAtRunSetupStart &&
      isRunModeConditionId(currentConditionId) &&
      !isTargetModeCondition &&
      pendingChoices.includes(normalizedConditionId);
    if (!canPromoteModeIntoNormalCondition) return runState;
  } else if (isTargetModeCondition) {
    // Run mode (normal/infinite) is selected by the setup toggle and does not
    // consume the 3 normal run-condition choices.
    if (!isAtRunSetupStart) return runState;
    return {
      ...runState,
      selectedRunConditionId: normalizedConditionId,
    };
  }

  if (!pendingChoices.includes(normalizedConditionId)) return runState;

  const condition = getRunConditionById(normalizedConditionId);
  if (!condition) return runState;

  const cardMap = new Map(allCards.map((card) => [card.id, card]));
  const bonusCards = buildConditionStarterCards(normalizedConditionId, cardMap);
  const bonusDeck: CardInstance[] = bonusCards.map((card) => ({
    instanceId: nanoid(),
    definitionId: card.id,
    upgraded: false,
  }));
  const replacementDeckCount = Math.max(
    0,
    Math.floor(condition.effects.replaceStarterDeckWithRandomCount ?? 0)
  );
  const addRandomCardsCount = Math.max(
    0,
    Math.floor(condition.effects.addRandomCardsCount ?? 0)
  );
  const removeRandomStarterCardsCount = Math.max(
    0,
    Math.floor(condition.effects.removeRandomStarterCardsCount ?? 0)
  );
  const upgradeRandomDeckCardsCount = Math.max(
    0,
    Math.floor(condition.effects.upgradeRandomDeckCardsCount ?? 0)
  );
  const addRandomCardRarities = condition.effects.addRandomCardRarities;
  const rarityFilter =
    addRandomCardRarities && addRandomCardRarities.length > 0
      ? new Set(addRandomCardRarities)
      : null;
  const replacementPool = allCards.filter(
    (card) =>
      !card.isStarterCard &&
      card.isCollectible !== false &&
      ((runState.unlockedCardIds?.length ?? 0) === 0 ||
        runState.unlockedCardIds.includes(card.id))
  );
  const randomAdditionPool = replacementPool.filter((card) =>
    rarityFilter
      ? card.rarity !== "STARTER" && rarityFilter.has(card.rarity)
      : true
  );
  const starterCardIds = new Set(
    allCards.filter((card) => card.isStarterCard).map((card) => card.id)
  );
  let conditionedDeck: CardInstance[] =
    replacementDeckCount > 0 && replacementPool.length > 0
      ? Array.from({ length: replacementDeckCount }, () => {
          const picked = rng.pick(replacementPool);
          return {
            instanceId: nanoid(),
            definitionId: picked.id,
            upgraded: false,
          };
        })
      : [...runState.deck];

  if (removeRandomStarterCardsCount > 0 && conditionedDeck.length > 1) {
    const removableStarterCards = conditionedDeck.filter((card) =>
      starterCardIds.has(card.definitionId)
    );
    const maxRemovals = Math.max(
      0,
      Math.min(
        removeRandomStarterCardsCount,
        removableStarterCards.length,
        conditionedDeck.length - 1
      )
    );
    if (maxRemovals > 0) {
      const toRemove = new Set(
        rng
          .shuffle(removableStarterCards)
          .slice(0, maxRemovals)
          .map((card) => card.instanceId)
      );
      conditionedDeck = conditionedDeck.filter(
        (card) => !toRemove.has(card.instanceId)
      );
    }
  }

  if (addRandomCardsCount > 0 && randomAdditionPool.length > 0) {
    const randomAddedCards: CardInstance[] = Array.from(
      { length: addRandomCardsCount },
      () => {
        const picked = rng.pick(randomAdditionPool);
        return {
          instanceId: nanoid(),
          definitionId: picked.id,
          upgraded: false,
        };
      }
    );
    conditionedDeck = [...conditionedDeck, ...randomAddedCards];
  }

  conditionedDeck = [...conditionedDeck, ...bonusDeck];

  if (upgradeRandomDeckCardsCount > 0) {
    const upgradableCards = conditionedDeck.filter((card) => !card.upgraded);
    const upgradeCount = Math.min(
      upgradeRandomDeckCardsCount,
      upgradableCards.length
    );
    if (upgradeCount > 0) {
      const toUpgrade = new Set(
        rng
          .shuffle(upgradableCards)
          .slice(0, upgradeCount)
          .map((card) => card.instanceId)
      );
      conditionedDeck = conditionedDeck.map((card) =>
        toUpgrade.has(card.instanceId) ? { ...card, upgraded: true } : card
      );
    }
  }

  const hpDelta = condition.effects.maxHpDelta ?? 0;
  const goldDelta = condition.effects.startingGoldDelta ?? 0;
  const nextMaxHp = Math.max(1, runState.playerMaxHp + hpDelta);
  const nextCurrentHp = Math.max(
    1,
    Math.min(nextMaxHp, runState.playerCurrentHp + hpDelta)
  );
  const nextGold = Math.max(0, runState.gold + goldDelta);
  const nextMetaBonuses = applyRunConditionMetaBonuses(
    runState.metaBonuses,
    normalizedConditionId
  );
  const hasMapRuleEffects = Boolean(condition.effects.mapRules);
  const nextMap = hasMapRuleEffects
    ? generateFloorMap(
        runState.floor,
        rng,
        runState.currentBiome,
        normalizedConditionId,
        runState.selectedDifficultyLevel ?? 0
      )
    : runState.map;

  const baseState: RunState = {
    ...runState,
    gold: nextGold,
    maxGoldReached: Math.max(runState.maxGoldReached ?? 0, nextGold),
    playerMaxHp: nextMaxHp,
    playerCurrentHp: nextCurrentHp,
    deck: conditionedDeck,
    map: nextMap,
    metaBonuses: nextMetaBonuses,
    selectedRunConditionId: normalizedConditionId,
    pendingRunConditionChoices: [],
  };

  const relicIdsToAdd = condition.effects.addRelicIds ?? [];
  if (relicIdsToAdd.length === 0) {
    return baseState;
  }

  return relicIdsToAdd.reduce<RunState>(
    (state, relicId) => addRelicToRunState(state, relicId),
    baseState
  );
}

/**
 * Complete a combat and update run state.
 * - Non-boss: advance room normally.
 * - Boss on non-final floor (or in infinite mode): generate biome choices for the next floor.
 * - Boss on final floor in normal mode: set status VICTORY.
 */
export function completeCombat(
  runState: RunState,
  combatResult: CombatState,
  goldReward: number,
  rng: RNG,
  biomeResources?: Partial<Record<BiomeResource, number>>,
  allCards?: CardDefinition[],
  relicIds?: string[],
  usableItemDropDefinitionId?: string | null
): RunState {
  const isBossRoom = runState.currentRoom === GAME_CONSTANTS.BOSS_ROOM_INDEX;
  const isInfiniteMode = isInfiniteRunConditionId(
    runState.selectedRunConditionId
  );
  const isFinalFloor =
    !isInfiniteMode && runState.floor >= GAME_CONSTANTS.MAX_FLOORS;
  const hpAfterCombat = Math.max(0, combatResult.player.currentHp);
  const activeRelicIds = relicIds ?? runState.relicIds;
  const healPct = Math.max(0, runState.metaBonuses?.healAfterCombat ?? 0);
  const healFlat = Math.max(0, runState.metaBonuses?.healAfterCombatFlat ?? 0);
  const healPctMultiplier = activeRelicIds.includes("menders_charm") ? 1.5 : 1;
  const healFlatBonus = activeRelicIds.includes("vital_flask") ? 5 : 0;
  const effectiveHealPct = healPct * healPctMultiplier;

  // Blood Grimoire relic: gain max HP for each enemy killed this combat
  const roomChoicesForRelic = runState.map[runState.currentRoom];
  const selectedRoomForRelic =
    roomChoicesForRelic?.find((r) => r.completed) ?? roomChoicesForRelic?.[0];
  const isEliteRoom = selectedRoomForRelic?.isElite ?? false;
  const enemyCount = combatResult.enemies.length;
  const skaldGoldBonus = activeRelicIds.includes("viking_skald_ledger")
    ? Math.min(30, enemyCount)
    : 0;
  const tombLedgerHeal = activeRelicIds.includes("egypt_tomb_ledger")
    ? isEliteRoom || isBossRoom
      ? 7
      : 3
    : 0;
  const eliteCauldronHeal =
    activeRelicIds.includes("celtic_morrigan_cauldron") && isEliteRoom ? 8 : 0;
  const raBrazierPenalty = activeRelicIds.includes("egypt_ra_brazier") ? 1 : 0;
  const bloodGrimoireGain = activeRelicIds.includes("blood_grimoire")
    ? isBossRoom
      ? 5
      : isEliteRoom
        ? enemyCount * 2
        : enemyCount * 1
    : 0;

  const newPlayerMaxHp = runState.playerMaxHp + bloodGrimoireGain;
  const healAmount =
    Math.floor((newPlayerMaxHp * effectiveHealPct) / 100) +
    healFlat +
    healFlatBonus;
  const hpAfterMetaHeal = Math.min(
    newPlayerMaxHp,
    Math.max(
      1,
      hpAfterCombat +
        healAmount +
        bloodGrimoireGain +
        tombLedgerHeal +
        eliteCauldronHeal -
        raBrazierPenalty
    )
  );

  let pendingBiomeChoices: RunState["pendingBiomeChoices"] = null;

  if (isBossRoom && !isFinalFloor) {
    if (runState.floor === 1) {
      // First transition (floor 1 -> 2): keep LIBRARY as one safe option.
      const shuffled = rng.shuffle([...GAME_CONSTANTS.AVAILABLE_BIOMES]);
      pendingBiomeChoices = ["LIBRARY", shuffled[0]!] as [BiomeType, BiomeType];
    } else {
      // Floors 2+: draw 2 distinct non-LIBRARY biomes.
      const shuffled = rng.shuffle([...GAME_CONSTANTS.AVAILABLE_BIOMES]);
      pendingBiomeChoices = [shuffled[0]!, shuffled[1]!] as [
        BiomeType,
        BiomeType,
      ];
    }
  }

  // Accumulate biome resources earned this combat
  const updatedEarnedResources = { ...runState.earnedResources };
  if (!isInfiniteMode && biomeResources) {
    for (const [key, amount] of Object.entries(biomeResources)) {
      updatedEarnedResources[key] =
        (updatedEarnedResources[key] ?? 0) + (amount as number);
    }
  }

  const encounteredThisCombat: Record<string, EncounteredEnemyType> = {};
  const updatedEnemyKillCounts = { ...(runState.enemyKillCounts ?? {}) };
  for (const enemy of combatResult.enemies) {
    encounteredThisCombat[enemy.definitionId] = deriveEncounteredEnemyType({
      isBoss: enemy.isBoss,
      isElite: enemy.isElite,
    });
    updatedEnemyKillCounts[enemy.definitionId] =
      (updatedEnemyKillCounts[enemy.definitionId] ?? 0) + 1;
  }
  const updatedEncounteredEnemies = mergeEncounteredEnemies(
    runState.encounteredEnemies ?? {},
    encounteredThisCombat
  );
  const enemyKillUnlockedRelicIds = computeEnemyKillUnlockedRelicIds(
    relicDefinitions.map((relic) => relic.id),
    updatedEnemyKillCounts
  );
  const unlockedRelicIds = Array.from(
    new Set([
      ...(runState.unlockedRelicIds ?? []),
      ...enemyKillUnlockedRelicIds,
    ])
  );

  let unlockProgress = runState.cardUnlockProgress ?? {
    enteredBiomes: {},
    biomeRunsCompleted: {},
    eliteKillsByBiome: {},
    bossKillsByBiome: {},
  };
  const roomChoices = runState.map[runState.currentRoom];
  const selectedRoom =
    roomChoices?.find((r) => r.completed) ?? roomChoices?.[0];
  if (selectedRoom?.isElite) {
    unlockProgress = onEliteKilled(unlockProgress, runState.currentBiome);
  }
  if (isBossRoom) {
    unlockProgress = onBossKilled(unlockProgress, runState.currentBiome);
  }
  const unlockedCardIdsRaw = computeUnlockedCardIds(
    allCards ?? [],
    unlockProgress,
    runState.unlockedStoryIdsSnapshot ?? [],
    updatedEnemyKillCounts
  );
  const unlockedCardIds = unlockedCardIdsRaw;
  const usableItemCapacity =
    runState.usableItemCapacity ?? GAME_CONSTANTS.MAX_USABLE_ITEMS;
  const hasUsableItemSlot =
    (runState.usableItems?.length ?? 0) < usableItemCapacity;
  const nextUsableItems =
    usableItemDropDefinitionId && hasUsableItemSlot
      ? [
          ...(runState.usableItems ?? []),
          createUsableItemInstance(usableItemDropDefinitionId),
        ]
      : (runState.usableItems ?? []);
  const nextGold = runState.gold + goldReward + skaldGoldBonus;
  const currentPersistentStats = runState.relicPersistentStats ?? {
    strength: 0,
    focus: 0,
    inkMax: 0,
  };
  const relicPersistentStats =
    isBossRoom && activeRelicIds.includes("global_codex_prime")
      ? (() => {
          const codexPrimeRng = createRNG(
            `${runState.seed}-codex-prime-${runState.floor}-${runState.currentRoom}-${runState.relicIds.length}`
          );
          const picked = codexPrimeRng.pick([
            "strength",
            "focus",
            "inkMax",
          ] as const);
          return {
            ...currentPersistentStats,
            [picked]: (currentPersistentStats[picked] ?? 0) + 1,
          };
        })()
      : currentPersistentStats;

  // Ally persistence: save surviving allies' HP, permanently remove dead allies
  const updatedAllyCurrentHps: Record<string, number> = {
    ...(runState.allyCurrentHps ?? {}),
  };
  const survivingAllies = combatResult.allies.filter((a) => a.currentHp > 0);
  const survivingAllyDefIds = new Set(
    survivingAllies.map((a) => a.definitionId)
  );
  for (const ally of survivingAllies) {
    updatedAllyCurrentHps[ally.definitionId] = ally.currentHp;
  }
  const updatedAllyIds = (runState.allyIds ?? []).filter((id) =>
    survivingAllyDefIds.has(id)
  );
  for (const id of runState.allyIds ?? []) {
    if (!survivingAllyDefIds.has(id)) {
      delete updatedAllyCurrentHps[id];
    }
  }

  return {
    ...runState,
    playerMaxHp: newPlayerMaxHp,
    playerCurrentHp: hpAfterMetaHeal,
    gold: nextGold,
    maxGoldReached: Math.max(runState.maxGoldReached ?? 0, nextGold),
    combat: null,
    currentRoom: runState.currentRoom + 1,
    status: isBossRoom && isFinalFloor ? "VICTORY" : runState.status,
    pendingBiomeChoices,
    earnedResources: updatedEarnedResources,
    unlockedCardIds:
      unlockedCardIds.length > 0 ? unlockedCardIds : runState.unlockedCardIds,
    unlockedRelicIds,
    cardUnlockProgress: unlockProgress,
    usableItems: nextUsableItems,
    usableItemCapacity,
    allyIds: updatedAllyIds,
    allyCurrentHps: updatedAllyCurrentHps,
    encounteredEnemies: updatedEncounteredEnemies,
    enemyKillCounts: updatedEnemyKillCounts,
    relicPersistentStats,
  };
}

/**
 * Advance to the next floor after the player chooses a biome.
 * Generates a fresh map for the new floor/biome.
 */
export function advanceFloor(
  state: RunState,
  biome: BiomeType,
  rng: RNG,
  allCards?: CardDefinition[]
): RunState {
  const isOpeningBiomeChoice =
    state.floor === 1 && state.currentRoom === 0 && state.combat === null;
  const newFloor = isOpeningBiomeChoice ? state.floor : state.floor + 1;
  const newMap = generateFloorMap(
    newFloor,
    rng,
    biome,
    state.selectedRunConditionId,
    state.selectedDifficultyLevel ?? 0
  );

  const unlockProgress = onEnterBiome(
    state.cardUnlockProgress ?? {
      enteredBiomes: {},
      biomeRunsCompleted: {},
      eliteKillsByBiome: {},
      bossKillsByBiome: {},
    },
    biome
  );
  const unlockedCardIdsRaw = computeUnlockedCardIds(
    allCards ?? [],
    unlockProgress,
    state.unlockedStoryIdsSnapshot ?? [],
    state.enemyKillCounts ?? {}
  );
  const unlockedCardIds = unlockedCardIdsRaw;

  return {
    ...state,
    floor: newFloor,
    currentRoom: isOpeningBiomeChoice ? state.currentRoom : 0,
    map: newMap,
    currentBiome: biome,
    pendingBiomeChoices: null,
    unlockedCardIds:
      unlockedCardIds.length > 0 ? unlockedCardIds : state.unlockedCardIds,
    cardUnlockProgress: unlockProgress,
  };
}

/**
 * Apply a special room heal effect.
 */
export function applyHealRoom(runState: RunState): RunState {
  const hasFrostLedger = runState.relicIds.includes("russian_frost_ledger");
  const healMultiplier = hasFrostLedger ? 1.2 : 1;
  const healAmount = Math.floor(
    runState.playerMaxHp * GAME_CONSTANTS.HEAL_ROOM_PERCENT * healMultiplier
  );
  return {
    ...runState,
    playerCurrentHp: Math.min(
      runState.playerMaxHp,
      runState.playerCurrentHp + healAmount
    ),
    currentRoom: runState.currentRoom + 1,
  };
}

// ============================
// Special Room Subtypes
// ============================

export type SpecialRoomType = "HEAL" | "UPGRADE" | "EVENT";

export function pickSpecialRoomType(rng: RNG): SpecialRoomType {
  return pickSpecialRoomTypeWithDifficulty(rng, 0);
}

export function pickSpecialRoomTypeWithDifficulty(
  rng: RNG,
  difficultyLevel: number
): SpecialRoomType {
  const modifiers = getDifficultyModifiers(difficultyLevel);
  const healWeight = 0.4 * modifiers.specialRoomHealWeightMultiplier;
  const upgradeWeight = 0.3;
  const eventWeight = 0.3 + modifiers.specialRoomEventWeightBonus;
  const totalWeight = healWeight + upgradeWeight + eventWeight;
  const roll = rng.next() * totalWeight;
  if (roll < healWeight) return "HEAL";
  if (roll < healWeight + upgradeWeight) return "UPGRADE";
  return "EVENT";
}

/**
 * Upgrade a card in the deck — sets the upgraded flag.
 * Upgraded cards deal +50% damage/block values at play time.
 */
export function removeCardFromRunDeck(
  runState: RunState,
  cardInstanceId: string
): RunState {
  const index = runState.deck.findIndex((c) => c.instanceId === cardInstanceId);
  if (index === -1) return runState;

  return {
    ...runState,
    deck: [...runState.deck.slice(0, index), ...runState.deck.slice(index + 1)],
  };
}

export function upgradeCardInDeck(
  runState: RunState,
  cardInstanceId: string
): RunState {
  const cardIndex = runState.deck.findIndex(
    (c) => c.instanceId === cardInstanceId
  );
  if (cardIndex === -1) return runState;

  const card = runState.deck[cardIndex]!;
  if (card.upgraded) return runState;

  const newDeck = [...runState.deck];
  newDeck[cardIndex] = { ...card, upgraded: true };

  return {
    ...runState,
    deck: newDeck,
    currentRoom: runState.currentRoom + 1,
  };
}

export function applyFreeUpgradeInDeck(
  runState: RunState,
  cardInstanceId: string
): RunState {
  if (runState.freeUpgradeUsed) return runState;
  const cardIndex = runState.deck.findIndex(
    (c) => c.instanceId === cardInstanceId
  );
  if (cardIndex === -1) return runState;

  const card = runState.deck[cardIndex]!;
  if (card.upgraded) {
    return { ...runState, freeUpgradeUsed: true };
  }

  const newDeck = [...runState.deck];
  newDeck[cardIndex] = { ...card, upgraded: true };

  return {
    ...runState,
    deck: newDeck,
    freeUpgradeUsed: true,
  };
}

// ============================
// Random Events (extracted)
// ============================
export type { GameEvent, EventChoice } from "./run-events";
export {
  pickGuaranteedEventRelicId,
  createGuaranteedRelicEvent,
  pickEvent,
  applyEventChoice,
} from "./run-events";
