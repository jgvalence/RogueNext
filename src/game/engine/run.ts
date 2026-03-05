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
import { getTotalLootLuck, weightedSampleByRarity } from "./loot";
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
// Random Events
// ============================

export interface GameEvent {
  id: string;
  title: string;
  flavorText?: string;
  description: string;
  biome?: BiomeType;
  /** If true, this event can only appear once per run (tracked via RunState.seenEventIds) */
  once?: boolean;
  choices: EventChoice[];
  condition?: (state: RunState) => boolean;
}

export interface EventChoice {
  label: string;
  description: string;
  outcomeText?: string;
  requiresPurge?: boolean;
  apply: (state: RunState) => RunState;
}

const RISKY_EVENT_IDS = new Set([
  "mysterious_tome",
  "ancient_sarcophagus",
  "whispering_idol",
  "ruthless_scrivener",
  "mirror_of_bronze",
  "skald_fire",
  "thread_of_ariadne",
  "kostchei_needle",
  "huginn_bargain",
  "anubis_scales",
  "thoth_archives",
  "forbidden_lexicon",
  "dreaming_gate",
  "obsidian_altar",
  "lady_of_the_lake",
  "morrigan_crow",
  "nyame_trial",
]);

function addDeckCard(state: RunState, definitionId: string): RunState {
  return {
    ...state,
    deck: [
      ...state.deck,
      {
        instanceId: nanoid(),
        definitionId,
        upgraded: false,
      },
    ],
  };
}

function addRelicToRun(state: RunState, relicId: string): RunState {
  return addRelicToRunState(state, relicId);
}

export function pickGuaranteedEventRelicId(state: RunState): string | null {
  const nonBossPool = relicDefinitions.filter((r) => r.rarity !== "BOSS");
  const available = nonBossPool.filter((r) => !state.relicIds.includes(r.id));
  const unlockedRelicIds = new Set(
    (state.unlockedRelicIds?.length ?? 0) > 0
      ? state.unlockedRelicIds
      : nonBossPool.map((r) => r.id)
  );
  const eligible = available.filter((r) => unlockedRelicIds.has(r.id));
  if (eligible.length === 0) return null;
  const rng = createRNG(
    `${state.seed}-guaranteed-relic-${state.floor}-${state.currentRoom}-${state.relicIds.length}`
  );
  const lootLuck = getTotalLootLuck(
    state.relicIds,
    state.metaBonuses?.lootLuck ?? 0
  );
  return weightedSampleByRarity(eligible, 1, rng, lootLuck)[0]?.id ?? null;
}

export function createGuaranteedRelicEvent(): GameEvent {
  return {
    id: "sealed_reliquary",
    title: "events.sealed_reliquary.title",
    flavorText: "events.sealed_reliquary.flavorText",
    description: "events.sealed_reliquary.description",
    choices: [
      {
        label: "events.sealed_reliquary.choices.0.label",
        description: "events.sealed_reliquary.choices.0.description",
        outcomeText: "events.sealed_reliquary.choices.0.outcomeText",
        apply: (s) => {
          const relicId = pickGuaranteedEventRelicId(s);
          if (!relicId) return { ...s, currentRoom: s.currentRoom + 1 };
          const withRelic = addRelicToRun(s, relicId);
          return { ...withRelic, currentRoom: withRelic.currentRoom + 1 };
        },
      },
      {
        label: "events.sealed_reliquary.choices.1.label",
        description: "events.sealed_reliquary.choices.1.description",
        outcomeText: "events.sealed_reliquary.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  };
}

const EVENTS: GameEvent[] = [
  // ── Neutral events ──────────────────────────────────────────────────────
  {
    id: "mysterious_tome",
    title: "events.mysterious_tome.title",
    flavorText: "events.mysterious_tome.flavorText",
    description: "events.mysterious_tome.description",
    choices: [
      {
        label: "events.mysterious_tome.choices.0.label",
        description: "events.mysterious_tome.choices.0.description",
        outcomeText: "events.mysterious_tome.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 10),
          gold: s.gold + 50,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 50),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.mysterious_tome.choices.1.label",
        description: "events.mysterious_tome.choices.1.description",
        outcomeText: "events.mysterious_tome.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  {
    id: "ink_fountain",
    title: "events.ink_fountain.title",
    flavorText: "events.ink_fountain.flavorText",
    description: "events.ink_fountain.description",
    choices: [
      {
        label: "events.ink_fountain.choices.0.label",
        description: "events.ink_fountain.choices.0.description",
        outcomeText: "events.ink_fountain.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.min(s.playerMaxHp, s.playerCurrentHp + 5),
          gold: s.gold + 25,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 25),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.ink_fountain.choices.1.label",
        description: "events.ink_fountain.choices.1.description",
        outcomeText: "events.ink_fountain.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          gold: s.gold + 75,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 75),
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "wandering_scribe",
    title: "events.wandering_scribe.title",
    flavorText: "events.wandering_scribe.flavorText",
    description: "events.wandering_scribe.description",
    choices: [
      {
        label: "events.wandering_scribe.choices.0.label",
        description: "events.wandering_scribe.choices.0.description",
        outcomeText: "events.wandering_scribe.choices.0.outcomeText",
        apply: (s) =>
          s.gold >= 30
            ? {
                ...s,
                gold: s.gold - 30,
                playerMaxHp: s.playerMaxHp + 20,
                playerCurrentHp: s.playerCurrentHp + 20,
                currentRoom: s.currentRoom + 1,
              }
            : { ...s, currentRoom: s.currentRoom + 1 },
      },
      {
        label: "events.wandering_scribe.choices.1.label",
        description: "events.wandering_scribe.choices.1.description",
        outcomeText: "events.wandering_scribe.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.min(s.playerMaxHp, s.playerCurrentHp + 10),
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "ancient_sarcophagus",
    title: "events.ancient_sarcophagus.title",
    flavorText: "events.ancient_sarcophagus.flavorText",
    description: "events.ancient_sarcophagus.description",
    choices: [
      {
        label: "events.ancient_sarcophagus.choices.0.label",
        description: "events.ancient_sarcophagus.choices.0.description",
        outcomeText: "events.ancient_sarcophagus.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 20,
          playerCurrentHp: s.playerCurrentHp + 20,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.ancient_sarcophagus.choices.1.label",
        description: "events.ancient_sarcophagus.choices.1.description",
        outcomeText: "events.ancient_sarcophagus.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 30,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 15),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.ancient_sarcophagus.choices.2.label",
        description: "events.ancient_sarcophagus.choices.2.description",
        outcomeText: "events.ancient_sarcophagus.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  {
    id: "whispering_idol",
    title: "events.whispering_idol.title",
    flavorText: "events.whispering_idol.flavorText",
    description: "events.whispering_idol.description",
    choices: [
      {
        label: "events.whispering_idol.choices.0.label",
        description: "events.whispering_idol.choices.0.description",
        outcomeText: "events.whispering_idol.choices.0.outcomeText",
        apply: (s) => ({
          ...addDeckCard(s, "hexed_parchment"),
          gold: s.gold + 90,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 90),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.whispering_idol.choices.1.label",
        description: "events.whispering_idol.choices.1.description",
        outcomeText: "events.whispering_idol.choices.1.outcomeText",
        apply: (s) => {
          const withFirstRegret = addDeckCard(s, "haunting_regret");
          const withSecondRegret = addDeckCard(
            withFirstRegret,
            "haunting_regret"
          );
          return {
            ...withSecondRegret,
            gold: s.gold + 140,
            maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 140),
            currentRoom: s.currentRoom + 1,
          };
        },
      },
      {
        label: "events.whispering_idol.choices.2.label",
        description: "events.whispering_idol.choices.2.description",
        outcomeText: "events.whispering_idol.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  {
    id: "ruthless_scrivener",
    title: "events.ruthless_scrivener.title",
    flavorText: "events.ruthless_scrivener.flavorText",
    description: "events.ruthless_scrivener.description",
    choices: [
      {
        label: "events.ruthless_scrivener.choices.0.label",
        description: "events.ruthless_scrivener.choices.0.description",
        outcomeText: "events.ruthless_scrivener.choices.0.outcomeText",
        requiresPurge: true,
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 10),
        }),
      },
      {
        label: "events.ruthless_scrivener.choices.1.label",
        description: "events.ruthless_scrivener.choices.1.description",
        outcomeText: "events.ruthless_scrivener.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  // ── Conditional neutral (floor 3+) ─────────────────────────────────────
  {
    id: "blank_page",
    title: "events.blank_page.title",
    flavorText: "events.blank_page.flavorText",
    description: "events.blank_page.description",
    condition: (s) => s.floor >= 3,
    choices: [
      {
        label: "events.blank_page.choices.0.label",
        description: "events.blank_page.choices.0.description",
        outcomeText: "events.blank_page.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 20,
          playerCurrentHp: s.playerCurrentHp + 20,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.blank_page.choices.1.label",
        description: "events.blank_page.choices.1.description",
        outcomeText: "events.blank_page.choices.1.outcomeText",
        requiresPurge: true,
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 10),
        }),
      },
      {
        label: "events.blank_page.choices.2.label",
        description: "events.blank_page.choices.2.description",
        outcomeText: "events.blank_page.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  // ── Ally recruitment events ─────────────────────────────────────────────
  {
    id: "loyal_scribe",
    title: "events.loyal_scribe.title",
    flavorText: "events.loyal_scribe.flavorText",
    description: "events.loyal_scribe.description",
    condition: (s) =>
      !s.allyIds.includes("scribe_apprentice") &&
      s.allyIds.length < (s.metaBonuses?.allySlots ?? 0),
    choices: [
      {
        label: "events.loyal_scribe.choices.0.label",
        description: "events.loyal_scribe.choices.0.description",
        outcomeText: "events.loyal_scribe.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          allyIds: [...s.allyIds, "scribe_apprentice"],
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.loyal_scribe.choices.1.label",
        description: "events.loyal_scribe.choices.1.description",
        outcomeText: "events.loyal_scribe.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  {
    id: "wandering_knight",
    title: "events.wandering_knight.title",
    flavorText: "events.wandering_knight.flavorText",
    description: "events.wandering_knight.description",
    condition: (s) =>
      !s.allyIds.includes("ward_knight") &&
      s.allyIds.length < (s.metaBonuses?.allySlots ?? 0),
    choices: [
      {
        label: "events.wandering_knight.choices.0.label",
        description: "events.wandering_knight.choices.0.description",
        outcomeText: "events.wandering_knight.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          allyIds: [...s.allyIds, "ward_knight"],
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.wandering_knight.choices.1.label",
        description: "events.wandering_knight.choices.1.description",
        outcomeText: "events.wandering_knight.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  {
    id: "ink_familiar_encounter",
    title: "events.ink_familiar_encounter.title",
    flavorText: "events.ink_familiar_encounter.flavorText",
    description: "events.ink_familiar_encounter.description",
    condition: (s) =>
      !s.allyIds.includes("ink_familiar") &&
      s.allyIds.length < (s.metaBonuses?.allySlots ?? 0),
    choices: [
      {
        label: "events.ink_familiar_encounter.choices.0.label",
        description: "events.ink_familiar_encounter.choices.0.description",
        outcomeText: "events.ink_familiar_encounter.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          allyIds: [...s.allyIds, "ink_familiar"],
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.ink_familiar_encounter.choices.1.label",
        description: "events.ink_familiar_encounter.choices.1.description",
        outcomeText: "events.ink_familiar_encounter.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  // ── Biome-specific events ───────────────────────────────────────────────
  {
    id: "mirror_of_bronze",
    title: "events.mirror_of_bronze.title",
    flavorText: "events.mirror_of_bronze.flavorText",
    description: "events.mirror_of_bronze.description",
    biome: "GREEK",
    choices: [
      {
        label: "events.mirror_of_bronze.choices.0.label",
        description: "events.mirror_of_bronze.choices.0.description",
        outcomeText: "events.mirror_of_bronze.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 20,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 15),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.mirror_of_bronze.choices.1.label",
        description: "events.mirror_of_bronze.choices.1.description",
        outcomeText: "events.mirror_of_bronze.choices.1.outcomeText",
        apply: (s) => ({
          ...addDeckCard(s, "haunting_regret"),
          gold: s.gold + 90,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 90),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.mirror_of_bronze.choices.2.label",
        description: "events.mirror_of_bronze.choices.2.description",
        outcomeText: "events.mirror_of_bronze.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  {
    id: "turning_house",
    title: "events.turning_house.title",
    flavorText: "events.turning_house.flavorText",
    description: "events.turning_house.description",
    biome: "RUSSIAN",
    choices: [
      {
        label: "events.turning_house.choices.0.label",
        description: "events.turning_house.choices.0.description",
        outcomeText: "events.turning_house.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 35,
          playerCurrentHp: s.playerCurrentHp + 35,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.turning_house.choices.1.label",
        description: "events.turning_house.choices.1.description",
        outcomeText: "events.turning_house.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 15),
          gold: s.gold + 75,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 75),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.turning_house.choices.2.label",
        description: "events.turning_house.choices.2.description",
        outcomeText: "events.turning_house.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.min(s.playerMaxHp, s.playerCurrentHp + 15),
          gold: s.gold + 15,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 15),
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "skald_fire",
    title: "events.skald_fire.title",
    flavorText: "events.skald_fire.flavorText",
    description: "events.skald_fire.description",
    biome: "VIKING",
    choices: [
      {
        label: "events.skald_fire.choices.0.label",
        description: "events.skald_fire.choices.0.description",
        outcomeText: "events.skald_fire.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 40,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 20),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.skald_fire.choices.1.label",
        description: "events.skald_fire.choices.1.description",
        outcomeText: "events.skald_fire.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          gold: s.gold + 50,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 50),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.skald_fire.choices.2.label",
        description: "events.skald_fire.choices.2.description",
        outcomeText: "events.skald_fire.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  // ── GREEK (2 more) ──────────────────────────────────────────────────────
  {
    id: "oracle_of_delphi",
    title: "events.oracle_of_delphi.title",
    flavorText: "events.oracle_of_delphi.flavorText",
    description: "events.oracle_of_delphi.description",
    biome: "GREEK",
    choices: [
      {
        label: "events.oracle_of_delphi.choices.0.label",
        description: "events.oracle_of_delphi.choices.0.description",
        outcomeText: "events.oracle_of_delphi.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 30,
          playerCurrentHp: s.playerCurrentHp + 30,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.oracle_of_delphi.choices.1.label",
        description: "events.oracle_of_delphi.choices.1.description",
        outcomeText: "events.oracle_of_delphi.choices.1.outcomeText",
        apply: (s) =>
          s.gold >= 30
            ? {
                ...s,
                gold: s.gold - 30,
                playerMaxHp: s.playerMaxHp + 45,
                playerCurrentHp: s.playerCurrentHp + 45,
                currentRoom: s.currentRoom + 1,
              }
            : {
                ...s,
                playerMaxHp: s.playerMaxHp + 30,
                playerCurrentHp: s.playerCurrentHp + 30,
                currentRoom: s.currentRoom + 1,
              },
      },
    ],
  },
  {
    id: "thread_of_ariadne",
    title: "events.thread_of_ariadne.title",
    flavorText: "events.thread_of_ariadne.flavorText",
    description: "events.thread_of_ariadne.description",
    biome: "GREEK",
    choices: [
      {
        label: "events.thread_of_ariadne.choices.0.label",
        description: "events.thread_of_ariadne.choices.0.description",
        outcomeText: "events.thread_of_ariadne.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 20,
          playerCurrentHp: s.playerCurrentHp + 20,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.thread_of_ariadne.choices.1.label",
        description: "events.thread_of_ariadne.choices.1.description",
        outcomeText: "events.thread_of_ariadne.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 40,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 15),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.thread_of_ariadne.choices.2.label",
        description: "events.thread_of_ariadne.choices.2.description",
        outcomeText: "events.thread_of_ariadne.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  // ── RUSSIAN (2 more) ────────────────────────────────────────────────────
  {
    id: "firebird_feather",
    title: "events.firebird_feather.title",
    flavorText: "events.firebird_feather.flavorText",
    description: "events.firebird_feather.description",
    biome: "RUSSIAN",
    choices: [
      {
        label: "events.firebird_feather.choices.0.label",
        description: "events.firebird_feather.choices.0.description",
        outcomeText: "events.firebird_feather.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.min(s.playerMaxHp, s.playerCurrentHp + 25),
          gold: s.gold + 25,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 25),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.firebird_feather.choices.1.label",
        description: "events.firebird_feather.choices.1.description",
        outcomeText: "events.firebird_feather.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 35,
          playerCurrentHp: s.playerCurrentHp + 35,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.firebird_feather.choices.2.label",
        description: "events.firebird_feather.choices.2.description",
        outcomeText: "events.firebird_feather.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  {
    id: "kostchei_needle",
    title: "events.kostchei_needle.title",
    flavorText: "events.kostchei_needle.flavorText",
    description: "events.kostchei_needle.description",
    biome: "RUSSIAN",
    choices: [
      {
        label: "events.kostchei_needle.choices.0.label",
        description: "events.kostchei_needle.choices.0.description",
        outcomeText: "events.kostchei_needle.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 50,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 25),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.kostchei_needle.choices.1.label",
        description: "events.kostchei_needle.choices.1.description",
        outcomeText: "events.kostchei_needle.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 25,
          playerCurrentHp: s.playerCurrentHp + 25,
          gold: s.gold + 25,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 25),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.kostchei_needle.choices.2.label",
        description: "events.kostchei_needle.choices.2.description",
        outcomeText: "events.kostchei_needle.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  // ── VIKING (2 more) ─────────────────────────────────────────────────────
  {
    id: "huginn_bargain",
    title: "events.huginn_bargain.title",
    flavorText: "events.huginn_bargain.flavorText",
    description: "events.huginn_bargain.description",
    biome: "VIKING",
    choices: [
      {
        label: "events.huginn_bargain.choices.0.label",
        description: "events.huginn_bargain.choices.0.description",
        outcomeText: "events.huginn_bargain.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 45,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 20),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.huginn_bargain.choices.1.label",
        description: "events.huginn_bargain.choices.1.description",
        outcomeText: "events.huginn_bargain.choices.1.outcomeText",
        apply: (s) =>
          s.gold >= 30
            ? {
                ...s,
                gold: s.gold - 30,
                playerMaxHp: s.playerMaxHp + 30,
                playerCurrentHp: s.playerCurrentHp + 30,
                currentRoom: s.currentRoom + 1,
              }
            : { ...s, currentRoom: s.currentRoom + 1 },
      },
      {
        label: "events.huginn_bargain.choices.2.label",
        description: "events.huginn_bargain.choices.2.description",
        outcomeText: "events.huginn_bargain.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  {
    id: "valkyrie_verdict",
    title: "events.valkyrie_verdict.title",
    flavorText: "events.valkyrie_verdict.flavorText",
    description: "events.valkyrie_verdict.description",
    biome: "VIKING",
    choices: [
      {
        label: "events.valkyrie_verdict.choices.0.label",
        description: "events.valkyrie_verdict.choices.0.description",
        outcomeText: "events.valkyrie_verdict.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 25,
          playerCurrentHp: s.playerCurrentHp + 25,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.valkyrie_verdict.choices.1.label",
        description: "events.valkyrie_verdict.choices.1.description",
        outcomeText: "events.valkyrie_verdict.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.min(s.playerMaxHp, s.playerCurrentHp + 25),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.valkyrie_verdict.choices.2.label",
        description: "events.valkyrie_verdict.choices.2.description",
        outcomeText: "events.valkyrie_verdict.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  // ── EGYPTIAN (3 new) ────────────────────────────────────────────────────
  {
    id: "anubis_scales",
    title: "events.anubis_scales.title",
    flavorText: "events.anubis_scales.flavorText",
    description: "events.anubis_scales.description",
    biome: "EGYPTIAN",
    choices: [
      {
        label: "events.anubis_scales.choices.0.label",
        description: "events.anubis_scales.choices.0.description",
        outcomeText: "events.anubis_scales.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 25,
          playerCurrentHp: s.playerCurrentHp + 25,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.anubis_scales.choices.1.label",
        description: "events.anubis_scales.choices.1.description",
        outcomeText: "events.anubis_scales.choices.1.outcomeText",
        requiresPurge: true,
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 45,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 10),
        }),
      },
      {
        label: "events.anubis_scales.choices.2.label",
        description: "events.anubis_scales.choices.2.description",
        outcomeText: "events.anubis_scales.choices.2.outcomeText",
        apply: (s) => {
          const w1 = addDeckCard(s, "haunting_regret");
          const w2 = addDeckCard(w1, "haunting_regret");
          return { ...w2, currentRoom: w2.currentRoom + 1 };
        },
      },
    ],
  },
  {
    id: "thoth_archives",
    title: "events.thoth_archives.title",
    flavorText: "events.thoth_archives.flavorText",
    description: "events.thoth_archives.description",
    biome: "EGYPTIAN",
    choices: [
      {
        label: "events.thoth_archives.choices.0.label",
        description: "events.thoth_archives.choices.0.description",
        outcomeText: "events.thoth_archives.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 25,
          playerCurrentHp: s.playerCurrentHp + 25,
          gold: s.gold + 20,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 20),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.thoth_archives.choices.1.label",
        description: "events.thoth_archives.choices.1.description",
        outcomeText: "events.thoth_archives.choices.1.outcomeText",
        apply: (s) => ({
          ...addDeckCard(s, "haunting_regret"),
          gold: s.gold + 60,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 60),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.thoth_archives.choices.2.label",
        description: "events.thoth_archives.choices.2.description",
        outcomeText: "events.thoth_archives.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 20,
          playerCurrentHp: s.playerCurrentHp + 20,
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "sphinx_riddle",
    title: "events.sphinx_riddle.title",
    flavorText: "events.sphinx_riddle.flavorText",
    description: "events.sphinx_riddle.description",
    biome: "EGYPTIAN",
    choices: [
      {
        label: "events.sphinx_riddle.choices.0.label",
        description: "events.sphinx_riddle.choices.0.description",
        outcomeText: "events.sphinx_riddle.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          gold: s.gold + 35,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 35),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.sphinx_riddle.choices.1.label",
        description: "events.sphinx_riddle.choices.1.description",
        outcomeText: "events.sphinx_riddle.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 25,
          playerCurrentHp: s.playerCurrentHp + 25,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.sphinx_riddle.choices.2.label",
        description: "events.sphinx_riddle.choices.2.description",
        outcomeText: "events.sphinx_riddle.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  // ── LOVECRAFTIAN (3 new) ─────────────────────────────────────────────────
  {
    id: "forbidden_lexicon",
    title: "events.forbidden_lexicon.title",
    flavorText: "events.forbidden_lexicon.flavorText",
    description: "events.forbidden_lexicon.description",
    biome: "LOVECRAFTIAN",
    choices: [
      {
        label: "events.forbidden_lexicon.choices.0.label",
        description: "events.forbidden_lexicon.choices.0.description",
        outcomeText: "events.forbidden_lexicon.choices.0.outcomeText",
        apply: (s) => ({
          ...addDeckCard(s, "haunting_regret"),
          gold: s.gold + 50,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 50),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.forbidden_lexicon.choices.1.label",
        description: "events.forbidden_lexicon.choices.1.description",
        outcomeText: "events.forbidden_lexicon.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 25,
          playerCurrentHp: s.playerCurrentHp + 25,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.forbidden_lexicon.choices.2.label",
        description: "events.forbidden_lexicon.choices.2.description",
        outcomeText: "events.forbidden_lexicon.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  {
    id: "deep_echo",
    title: "events.deep_echo.title",
    flavorText: "events.deep_echo.flavorText",
    description: "events.deep_echo.description",
    biome: "LOVECRAFTIAN",
    choices: [
      {
        label: "events.deep_echo.choices.0.label",
        description: "events.deep_echo.choices.0.description",
        outcomeText: "events.deep_echo.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 30,
          playerCurrentHp: s.playerCurrentHp + 30,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.deep_echo.choices.1.label",
        description: "events.deep_echo.choices.1.description",
        outcomeText: "events.deep_echo.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.min(s.playerMaxHp, s.playerCurrentHp + 20),
          gold: s.gold + 20,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 20),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.deep_echo.choices.2.label",
        description: "events.deep_echo.choices.2.description",
        outcomeText: "events.deep_echo.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  {
    id: "dreaming_gate",
    title: "events.dreaming_gate.title",
    flavorText: "events.dreaming_gate.flavorText",
    description: "events.dreaming_gate.description",
    biome: "LOVECRAFTIAN",
    choices: [
      {
        label: "events.dreaming_gate.choices.0.label",
        description: "events.dreaming_gate.choices.0.description",
        outcomeText: "events.dreaming_gate.choices.0.outcomeText",
        apply: (s) => {
          const w1 = addDeckCard(s, "hexed_parchment");
          const w2 = addDeckCard(w1, "hexed_parchment");
          return {
            ...w2,
            playerMaxHp: w2.playerMaxHp + 50,
            playerCurrentHp: w2.playerCurrentHp + 50,
            currentRoom: w2.currentRoom + 1,
          };
        },
      },
      {
        label: "events.dreaming_gate.choices.1.label",
        description: "events.dreaming_gate.choices.1.description",
        outcomeText: "events.dreaming_gate.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 25,
          playerCurrentHp: s.playerCurrentHp + 25,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.dreaming_gate.choices.2.label",
        description: "events.dreaming_gate.choices.2.description",
        outcomeText: "events.dreaming_gate.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  // ── AZTEC (3 new) ───────────────────────────────────────────────────────
  {
    id: "quetzalcoatl_blessing",
    title: "events.quetzalcoatl_blessing.title",
    flavorText: "events.quetzalcoatl_blessing.flavorText",
    description: "events.quetzalcoatl_blessing.description",
    biome: "AZTEC",
    choices: [
      {
        label: "events.quetzalcoatl_blessing.choices.0.label",
        description: "events.quetzalcoatl_blessing.choices.0.description",
        outcomeText: "events.quetzalcoatl_blessing.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 30,
          playerCurrentHp: s.playerCurrentHp + 30,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.quetzalcoatl_blessing.choices.1.label",
        description: "events.quetzalcoatl_blessing.choices.1.description",
        outcomeText: "events.quetzalcoatl_blessing.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 45,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 15),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.quetzalcoatl_blessing.choices.2.label",
        description: "events.quetzalcoatl_blessing.choices.2.description",
        outcomeText: "events.quetzalcoatl_blessing.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.min(s.playerMaxHp, s.playerCurrentHp + 10),
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "obsidian_altar",
    title: "events.obsidian_altar.title",
    flavorText: "events.obsidian_altar.flavorText",
    description: "events.obsidian_altar.description",
    biome: "AZTEC",
    choices: [
      {
        label: "events.obsidian_altar.choices.0.label",
        description: "events.obsidian_altar.choices.0.description",
        outcomeText: "events.obsidian_altar.choices.0.outcomeText",
        requiresPurge: true,
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 20,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 10),
          gold: s.gold + 40,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 40),
        }),
      },
      {
        label: "events.obsidian_altar.choices.1.label",
        description: "events.obsidian_altar.choices.1.description",
        outcomeText: "events.obsidian_altar.choices.1.outcomeText",
        apply: (s) =>
          s.gold >= 30
            ? {
                ...s,
                gold: s.gold - 30,
                playerMaxHp: s.playerMaxHp + 25,
                playerCurrentHp: s.playerCurrentHp + 25,
                currentRoom: s.currentRoom + 1,
              }
            : { ...s, currentRoom: s.currentRoom + 1 },
      },
      {
        label: "events.obsidian_altar.choices.2.label",
        description: "events.obsidian_altar.choices.2.description",
        outcomeText: "events.obsidian_altar.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 15),
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "xolotl_crossing",
    title: "events.xolotl_crossing.title",
    flavorText: "events.xolotl_crossing.flavorText",
    description: "events.xolotl_crossing.description",
    biome: "AZTEC",
    choices: [
      {
        label: "events.xolotl_crossing.choices.0.label",
        description: "events.xolotl_crossing.choices.0.description",
        outcomeText: "events.xolotl_crossing.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.min(s.playerMaxHp, s.playerCurrentHp + 25),
          gold: s.gold + 20,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 20),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.xolotl_crossing.choices.1.label",
        description: "events.xolotl_crossing.choices.1.description",
        outcomeText: "events.xolotl_crossing.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 35,
          playerCurrentHp: s.playerCurrentHp + 35,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.xolotl_crossing.choices.2.label",
        description: "events.xolotl_crossing.choices.2.description",
        outcomeText: "events.xolotl_crossing.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  // ── CELTIC (3 new) ──────────────────────────────────────────────────────
  {
    id: "druid_memory",
    title: "events.druid_memory.title",
    flavorText: "events.druid_memory.flavorText",
    description: "events.druid_memory.description",
    biome: "CELTIC",
    choices: [
      {
        label: "events.druid_memory.choices.0.label",
        description: "events.druid_memory.choices.0.description",
        outcomeText: "events.druid_memory.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 25,
          playerCurrentHp: s.playerCurrentHp + 25,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.druid_memory.choices.1.label",
        description: "events.druid_memory.choices.1.description",
        outcomeText: "events.druid_memory.choices.1.outcomeText",
        apply: (s) =>
          s.gold >= 20
            ? {
                ...s,
                gold: s.gold - 20,
                playerMaxHp: s.playerMaxHp + 40,
                playerCurrentHp: s.playerCurrentHp + 40,
                currentRoom: s.currentRoom + 1,
              }
            : {
                ...s,
                playerMaxHp: s.playerMaxHp + 25,
                playerCurrentHp: s.playerCurrentHp + 25,
                currentRoom: s.currentRoom + 1,
              },
      },
      {
        label: "events.druid_memory.choices.2.label",
        description: "events.druid_memory.choices.2.description",
        outcomeText: "events.druid_memory.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  {
    id: "lady_of_the_lake",
    title: "events.lady_of_the_lake.title",
    flavorText: "events.lady_of_the_lake.flavorText",
    description: "events.lady_of_the_lake.description",
    biome: "CELTIC",
    choices: [
      {
        label: "events.lady_of_the_lake.choices.0.label",
        description: "events.lady_of_the_lake.choices.0.description",
        outcomeText: "events.lady_of_the_lake.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 30,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 15),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.lady_of_the_lake.choices.1.label",
        description: "events.lady_of_the_lake.choices.1.description",
        outcomeText: "events.lady_of_the_lake.choices.1.outcomeText",
        apply: (s) =>
          s.gold >= 30
            ? {
                ...s,
                gold: s.gold - 30,
                playerMaxHp: s.playerMaxHp + 25,
                playerCurrentHp: s.playerCurrentHp + 25,
                currentRoom: s.currentRoom + 1,
              }
            : { ...s, currentRoom: s.currentRoom + 1 },
      },
      {
        label: "events.lady_of_the_lake.choices.2.label",
        description: "events.lady_of_the_lake.choices.2.description",
        outcomeText: "events.lady_of_the_lake.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  {
    id: "morrigan_crow",
    title: "events.morrigan_crow.title",
    flavorText: "events.morrigan_crow.flavorText",
    description: "events.morrigan_crow.description",
    biome: "CELTIC",
    choices: [
      {
        label: "events.morrigan_crow.choices.0.label",
        description: "events.morrigan_crow.choices.0.description",
        outcomeText: "events.morrigan_crow.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 50,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 20),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.morrigan_crow.choices.1.label",
        description: "events.morrigan_crow.choices.1.description",
        outcomeText: "events.morrigan_crow.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          gold: s.gold + 40,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 40),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.morrigan_crow.choices.2.label",
        description: "events.morrigan_crow.choices.2.description",
        outcomeText: "events.morrigan_crow.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  // ── AFRICAN (3 new) ─────────────────────────────────────────────────────
  {
    id: "anansi_story",
    title: "events.anansi_story.title",
    flavorText: "events.anansi_story.flavorText",
    description: "events.anansi_story.description",
    biome: "AFRICAN",
    choices: [
      {
        label: "events.anansi_story.choices.0.label",
        description: "events.anansi_story.choices.0.description",
        outcomeText: "events.anansi_story.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 30,
          playerCurrentHp: s.playerCurrentHp + 30,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.anansi_story.choices.1.label",
        description: "events.anansi_story.choices.1.description",
        outcomeText: "events.anansi_story.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.min(s.playerMaxHp, s.playerCurrentHp + 15),
          gold: s.gold + 15,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 15),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.anansi_story.choices.2.label",
        description: "events.anansi_story.choices.2.description",
        outcomeText: "events.anansi_story.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  {
    id: "griot_song",
    title: "events.griot_song.title",
    flavorText: "events.griot_song.flavorText",
    description: "events.griot_song.description",
    biome: "AFRICAN",
    choices: [
      {
        label: "events.griot_song.choices.0.label",
        description: "events.griot_song.choices.0.description",
        outcomeText: "events.griot_song.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.min(s.playerMaxHp, s.playerCurrentHp + 30),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.griot_song.choices.1.label",
        description: "events.griot_song.choices.1.description",
        outcomeText: "events.griot_song.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.min(s.playerMaxHp, s.playerCurrentHp + 25),
          gold: s.gold + 15,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 15),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.griot_song.choices.2.label",
        description: "events.griot_song.choices.2.description",
        outcomeText: "events.griot_song.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.min(s.playerMaxHp, s.playerCurrentHp + 10),
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "nyame_trial",
    title: "events.nyame_trial.title",
    flavorText: "events.nyame_trial.flavorText",
    description: "events.nyame_trial.description",
    biome: "AFRICAN",
    choices: [
      {
        label: "events.nyame_trial.choices.0.label",
        description: "events.nyame_trial.choices.0.description",
        outcomeText: "events.nyame_trial.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 40,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 20),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.nyame_trial.choices.1.label",
        description: "events.nyame_trial.choices.1.description",
        outcomeText: "events.nyame_trial.choices.1.outcomeText",
        apply: (s) =>
          s.gold >= 40
            ? {
                ...s,
                gold: s.gold - 40,
                playerMaxHp: s.playerMaxHp + 30,
                playerCurrentHp: s.playerCurrentHp + 30,
                currentRoom: s.currentRoom + 1,
              }
            : { ...s, currentRoom: s.currentRoom + 1 },
      },
      {
        label: "events.nyame_trial.choices.2.label",
        description: "events.nyame_trial.choices.2.description",
        outcomeText: "events.nyame_trial.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },

  // ── Le Scribe Effacé — PNJ récurrent, 10 rencontres en chaîne (Phase 5) ────
  // Chaque rencontre requiert la précédente via seenEventIds (ordre narratif garanti).
  // scribeAttitude : +1 compassion / 0 neutre / -1 hostilité — lu par le boss final.
  {
    id: "scribe_1_first_meeting",
    title: "events.scribe_1_first_meeting.title",
    flavorText: "events.scribe_1_first_meeting.flavorText",
    description: "events.scribe_1_first_meeting.description",
    biome: "LIBRARY",
    once: true,
    condition: (s) => s.floor <= 2,
    choices: [
      {
        label: "events.scribe_1_first_meeting.choices.0.label",
        description: "events.scribe_1_first_meeting.choices.0.description",
        outcomeText: "events.scribe_1_first_meeting.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude + 0,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.scribe_1_first_meeting.choices.1.label",
        description: "events.scribe_1_first_meeting.choices.1.description",
        outcomeText: "events.scribe_1_first_meeting.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude + 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.scribe_1_first_meeting.choices.2.label",
        description: "events.scribe_1_first_meeting.choices.2.description",
        outcomeText: "events.scribe_1_first_meeting.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude - 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "scribe_2_lost_words",
    title: "events.scribe_2_lost_words.title",
    flavorText: "events.scribe_2_lost_words.flavorText",
    description: "events.scribe_2_lost_words.description",
    biome: "LIBRARY",
    once: true,
    condition: (s) =>
      s.seenEventIds.includes("scribe_1_first_meeting") && s.floor <= 2,
    choices: [
      {
        label: "events.scribe_2_lost_words.choices.0.label",
        description: "events.scribe_2_lost_words.choices.0.description",
        outcomeText: "events.scribe_2_lost_words.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude + 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.scribe_2_lost_words.choices.1.label",
        description: "events.scribe_2_lost_words.choices.1.description",
        outcomeText: "events.scribe_2_lost_words.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
      {
        label: "events.scribe_2_lost_words.choices.2.label",
        description: "events.scribe_2_lost_words.choices.2.description",
        outcomeText: "events.scribe_2_lost_words.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude - 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "scribe_3_familiar_face",
    title: "events.scribe_3_familiar_face.title",
    flavorText: "events.scribe_3_familiar_face.flavorText",
    description: "events.scribe_3_familiar_face.description",
    once: true,
    condition: (s) =>
      s.seenEventIds.includes("scribe_2_lost_words") && s.floor >= 2,
    choices: [
      {
        label: "events.scribe_3_familiar_face.choices.0.label",
        description: "events.scribe_3_familiar_face.choices.0.description",
        outcomeText: "events.scribe_3_familiar_face.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude + 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.scribe_3_familiar_face.choices.1.label",
        description: "events.scribe_3_familiar_face.choices.1.description",
        outcomeText: "events.scribe_3_familiar_face.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
      {
        label: "events.scribe_3_familiar_face.choices.2.label",
        description: "events.scribe_3_familiar_face.choices.2.description",
        outcomeText: "events.scribe_3_familiar_face.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude - 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "scribe_4_torn_pages",
    title: "events.scribe_4_torn_pages.title",
    flavorText: "events.scribe_4_torn_pages.flavorText",
    description: "events.scribe_4_torn_pages.description",
    once: true,
    condition: (s) =>
      s.seenEventIds.includes("scribe_3_familiar_face") && s.floor >= 2,
    choices: [
      {
        label: "events.scribe_4_torn_pages.choices.0.label",
        description: "events.scribe_4_torn_pages.choices.0.description",
        outcomeText: "events.scribe_4_torn_pages.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude + 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.scribe_4_torn_pages.choices.1.label",
        description: "events.scribe_4_torn_pages.choices.1.description",
        outcomeText: "events.scribe_4_torn_pages.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
      {
        label: "events.scribe_4_torn_pages.choices.2.label",
        description: "events.scribe_4_torn_pages.choices.2.description",
        outcomeText: "events.scribe_4_torn_pages.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude - 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "scribe_5_the_name",
    title: "events.scribe_5_the_name.title",
    flavorText: "events.scribe_5_the_name.flavorText",
    description: "events.scribe_5_the_name.description",
    once: true,
    condition: (s) =>
      s.seenEventIds.includes("scribe_4_torn_pages") &&
      s.floor >= 3 &&
      (s.selectedDifficultyLevel ?? 0) >= 1,
    choices: [
      {
        label: "events.scribe_5_the_name.choices.0.label",
        description: "events.scribe_5_the_name.choices.0.description",
        outcomeText: "events.scribe_5_the_name.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude + 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.scribe_5_the_name.choices.1.label",
        description: "events.scribe_5_the_name.choices.1.description",
        outcomeText: "events.scribe_5_the_name.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
      {
        label: "events.scribe_5_the_name.choices.2.label",
        description: "events.scribe_5_the_name.choices.2.description",
        outcomeText: "events.scribe_5_the_name.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude - 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "scribe_6_the_warning",
    title: "events.scribe_6_the_warning.title",
    flavorText: "events.scribe_6_the_warning.flavorText",
    description: "events.scribe_6_the_warning.description",
    once: true,
    condition: (s) =>
      s.seenEventIds.includes("scribe_5_the_name") &&
      s.floor >= 3 &&
      (s.selectedDifficultyLevel ?? 0) >= 2,
    choices: [
      {
        label: "events.scribe_6_the_warning.choices.0.label",
        description: "events.scribe_6_the_warning.choices.0.description",
        outcomeText: "events.scribe_6_the_warning.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude + 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.scribe_6_the_warning.choices.1.label",
        description: "events.scribe_6_the_warning.choices.1.description",
        outcomeText: "events.scribe_6_the_warning.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
      {
        label: "events.scribe_6_the_warning.choices.2.label",
        description: "events.scribe_6_the_warning.choices.2.description",
        outcomeText: "events.scribe_6_the_warning.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude - 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "scribe_7_the_other",
    title: "events.scribe_7_the_other.title",
    flavorText: "events.scribe_7_the_other.flavorText",
    description: "events.scribe_7_the_other.description",
    once: true,
    condition: (s) =>
      s.seenEventIds.includes("scribe_6_the_warning") &&
      s.floor >= 3 &&
      (s.selectedDifficultyLevel ?? 0) >= 2,
    choices: [
      {
        label: "events.scribe_7_the_other.choices.0.label",
        description: "events.scribe_7_the_other.choices.0.description",
        outcomeText: "events.scribe_7_the_other.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude + 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.scribe_7_the_other.choices.1.label",
        description: "events.scribe_7_the_other.choices.1.description",
        outcomeText: "events.scribe_7_the_other.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
      {
        label: "events.scribe_7_the_other.choices.2.label",
        description: "events.scribe_7_the_other.choices.2.description",
        outcomeText: "events.scribe_7_the_other.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude - 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "scribe_8_the_truth",
    title: "events.scribe_8_the_truth.title",
    flavorText: "events.scribe_8_the_truth.flavorText",
    description: "events.scribe_8_the_truth.description",
    once: true,
    condition: (s) =>
      s.seenEventIds.includes("scribe_7_the_other") &&
      s.floor >= 4 &&
      (s.selectedDifficultyLevel ?? 0) >= 3,
    choices: [
      {
        label: "events.scribe_8_the_truth.choices.0.label",
        description: "events.scribe_8_the_truth.choices.0.description",
        outcomeText: "events.scribe_8_the_truth.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude + 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.scribe_8_the_truth.choices.1.label",
        description: "events.scribe_8_the_truth.choices.1.description",
        outcomeText: "events.scribe_8_the_truth.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
      {
        label: "events.scribe_8_the_truth.choices.2.label",
        description: "events.scribe_8_the_truth.choices.2.description",
        outcomeText: "events.scribe_8_the_truth.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude - 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "scribe_9_the_choice",
    title: "events.scribe_9_the_choice.title",
    flavorText: "events.scribe_9_the_choice.flavorText",
    description: "events.scribe_9_the_choice.description",
    once: true,
    condition: (s) =>
      s.seenEventIds.includes("scribe_8_the_truth") &&
      s.floor >= 4 &&
      (s.selectedDifficultyLevel ?? 0) >= 4,
    choices: [
      {
        label: "events.scribe_9_the_choice.choices.0.label",
        description: "events.scribe_9_the_choice.choices.0.description",
        outcomeText: "events.scribe_9_the_choice.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude + 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.scribe_9_the_choice.choices.1.label",
        description: "events.scribe_9_the_choice.choices.1.description",
        outcomeText: "events.scribe_9_the_choice.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
      {
        label: "events.scribe_9_the_choice.choices.2.label",
        description: "events.scribe_9_the_choice.choices.2.description",
        outcomeText: "events.scribe_9_the_choice.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude - 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "scribe_10_the_reveal",
    title: "events.scribe_10_the_reveal.title",
    flavorText: "events.scribe_10_the_reveal.flavorText",
    description: "events.scribe_10_the_reveal.description",
    once: true,
    condition: (s) =>
      s.seenEventIds.includes("scribe_9_the_choice") &&
      s.floor >= GAME_CONSTANTS.MAX_FLOORS - 1 &&
      (s.selectedDifficultyLevel ?? 0) >= 5,
    choices: [
      {
        label: "events.scribe_10_the_reveal.choices.0.label",
        description: "events.scribe_10_the_reveal.choices.0.description",
        outcomeText: "events.scribe_10_the_reveal.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude + 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.scribe_10_the_reveal.choices.1.label",
        description: "events.scribe_10_the_reveal.choices.1.description",
        outcomeText: "events.scribe_10_the_reveal.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
      {
        label: "events.scribe_10_the_reveal.choices.2.label",
        description: "events.scribe_10_the_reveal.choices.2.description",
        outcomeText: "events.scribe_10_the_reveal.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude - 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
];

export function pickEvent(
  rng: RNG,
  difficultyLevel = 0,
  runState?: RunState
): GameEvent {
  // Guard against legacy run states that predate seenEventIds
  const safeState = runState
    ? { ...runState, seenEventIds: runState.seenEventIds ?? [] }
    : runState;
  const currentBiome = safeState?.currentBiome;
  const eligible = EVENTS.filter(
    (e) =>
      (!e.condition || !safeState || e.condition(safeState)) &&
      (!e.biome || !currentBiome || e.biome === currentBiome) &&
      (!e.once || !safeState || !safeState.seenEventIds.includes(e.id))
  );
  const pool = eligible.length > 0 ? eligible : EVENTS;
  const riskyPool = pool.filter((event) => RISKY_EVENT_IDS.has(event.id));
  const safePool = pool.filter((event) => !RISKY_EVENT_IDS.has(event.id));
  if (difficultyLevel >= 4 && riskyPool.length > 0 && rng.next() < 0.7) {
    return rng.pick(riskyPool);
  }
  return rng.pick(safePool.length > 0 ? safePool : pool);
}

export function applyEventChoice(
  runState: RunState,
  event: GameEvent,
  choiceIndex: number
): RunState {
  const choice = event.choices[choiceIndex];
  if (!choice) return runState;
  const newState = choice.apply(runState);

  // Mark once-per-run events as seen
  const withSeen = event.once
    ? {
        ...newState,
        seenEventIds: [...(newState.seenEventIds ?? []), event.id],
      }
    : newState;

  // For Scribe events: record the individual attitude delta (-1/0/+1) per encounter
  if (event.id.startsWith("scribe_")) {
    const attitudeDelta =
      (newState.scribeAttitude ?? 0) - (runState.scribeAttitude ?? 0);
    return {
      ...withSeen,
      scribeChoices: { ...withSeen.scribeChoices, [event.id]: attitudeDelta },
    };
  }

  return withSeen;
}
