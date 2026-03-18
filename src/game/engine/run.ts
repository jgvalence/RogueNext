import type {
  RunState,
  RoomNode,
  FirstRunScriptState,
} from "../schemas/run-state";
import type { CombatState } from "../schemas/combat-state";
import type { CardDefinition, CardInstance } from "../schemas/cards";
import type { BiomeType, BiomeResource } from "../schemas/enums";
import type { ComputedMetaBonuses } from "../schemas/meta";
import { GAME_CONSTANTS } from "../constants";
import { enemyDefinitions } from "../data/enemies";
import { relicDefinitions } from "../data/relics";
import type { CardUnlockProgress } from "./card-unlocks";
import { matchesCardCharacter } from "./card-filters";
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
import { createFirstRunScriptedMap } from "./first-run-script";
import { isClogCardDefinitionId } from "./status-cards";

type EnemyDef = (typeof enemyDefinitions)[0];
const TRACKED_ENEMY_DEFINITION_IDS = new Set(
  enemyDefinitions
    .filter((enemy) => !enemy.isScriptedOnly)
    .map((enemy) => enemy.id)
);
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

function inferRunCharacterId(starterCards: CardDefinition[]): string {
  const characterIds = Array.from(
    new Set(
      starterCards
        .map((card) => card.characterId)
        .filter((characterId): characterId is string => Boolean(characterId))
    )
  );
  return characterIds.length === 1 ? characterIds[0]! : "scribe";
}

const RANDOM_BIOME_CHOICE_POOL = [
  "LIBRARY",
  ...GAME_CONSTANTS.AVAILABLE_BIOMES,
] as BiomeType[];

export function drawRandomBiomeChoices(rng: RNG): [BiomeType, BiomeType] {
  const shuffled = rng.shuffle(RANDOM_BIOME_CHOICE_POOL);
  return [shuffled[0]!, shuffled[1]!] as [BiomeType, BiomeType];
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
  difficultyMaxByCharacter: Record<string, number> = {},
  firstRunScript: FirstRunScriptState | null = null,
  winsByDifficultySnapshot: Record<string, number> = {}
): RunState {
  const runCharacterId = inferRunCharacterId(starterCards);
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
        card.isCollectible !== false &&
        matchesCardCharacter(card, runCharacterId)
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

  const baseMap = generateFloorMap(1, rng, "LIBRARY");
  const map =
    firstRunScript?.enabled === true
      ? createFirstRunScriptedMap(baseMap)
      : baseMap;
  const pendingRunConditionChoices = drawRunConditionChoices(
    unlockedRunConditionIds,
    createRNG(`${seed}-run-conditions`)
  );

  const startingGold =
    GAME_CONSTANTS.STARTING_GOLD + (metaBonuses?.startingGold ?? 0);
  const extraHp = metaBonuses?.extraHp ?? 0;
  const baseUnlockProgress = initialUnlockProgress ?? {
    enteredBiomes: { LIBRARY: 1 },
    biomeRunsCompleted: {},
    eliteKillsByBiome: {},
    bossKillsByBiome: {},
    byCharacter: {},
  };
  const unlockProgress =
    availableCharacters.length > 1
      ? baseUnlockProgress
      : onEnterBiome(baseUnlockProgress, "LIBRARY", runCharacterId);
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
    activePlayMs: 0,
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
    firstRunScript,
    map,
    combat: null,
    currentBiome: "LIBRARY",
    characterId: runCharacterId,
    pendingCharacterChoices:
      availableCharacters.length > 1 ? availableCharacters : null,
    difficultyMaxByCharacter,
    winsByDifficultySnapshot,
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
    initialUnlockedRelicIds: unlockedRelicIdsSnapshot,
    cardUnlockProgress: unlockProgress,
    seenEventIds: [],
    scribeAttitude: 0,
    scribeChoices: {},
    encounteredEnemies: initialEncounteredEnemies,
    enemyKillCounts: initialEnemyKillCounts,
    relicPersistentStats: { strength: 0, focus: 0, inkMax: 0 },
  };
}

type TemplateSpecialType = NonNullable<RoomNode["specialType"]>;
type MainRouteTag = "SAFE" | "BALANCED" | "GREEDY";
type RouteTag = MainRouteTag | "WILD";
type TemplateNode = {
  key: string;
  lane: number;
  type: RoomNode["type"];
  nextKeys: string[];
  isElite?: boolean;
  isBoss?: boolean;
  specialType?: TemplateSpecialType;
  routeTag?: RouteTag;
};
type FloorMapTemplate = TemplateNode[][];

const MAIN_ROUTE_TAGS: readonly MainRouteTag[] = ["SAFE", "BALANCED", "GREEDY"];
const ROUTE_LANE_SETS: readonly [number, number, number][] = [
  [0, 1, 2],
  [0, 1, 3],
  [0, 1, 4],
  [0, 2, 3],
  [0, 2, 4],
  [0, 3, 4],
  [1, 2, 3],
  [1, 2, 4],
  [1, 3, 4],
  [2, 3, 4],
] as const;

function getLaneSetMovement(
  previous: readonly number[],
  next: readonly number[]
): number {
  return previous.reduce(
    (sum, lane, index) => sum + Math.abs(lane - next[index]!),
    0
  );
}

function pickRandomLaneSet(
  previous: readonly number[] | null,
  repeatedMiddleLaneCount: number,
  depth: number,
  rng: RNG
): [number, number, number] {
  const candidates = ROUTE_LANE_SETS.filter(
    (candidate) =>
      previous === null || getLaneSetMovement(previous, candidate) <= 5
  );

  return weightedPick(
    candidates,
    (candidate) => {
      const spread = candidate[2] - candidate[0];
      if (previous === null) {
        let weight = spread >= 3 ? 1.25 : 0.9;
        if (candidate[1] !== 2) weight *= 1.08;
        return weight;
      }

      const movement = getLaneSetMovement(previous, candidate);
      let weight = 1;
      if (movement === 0) weight *= 0.04;
      else if (movement <= 2) weight *= 1.05;
      else if (movement <= 4) weight *= 1.25;
      else weight *= 0.72;

      if (candidate[1] === previous[1]) {
        weight *= repeatedMiddleLaneCount >= 1 ? 0.18 : 0.65;
      }
      if (candidate[0] === previous[0] && candidate[2] === previous[2]) {
        weight *= 0.6;
      }
      if (depth <= 4) {
        weight *= spread >= 3 ? 1.18 : 0.85;
      }
      if (depth >= 10) {
        weight *= candidate.some((lane) => lane === 2) ? 1.14 : 0.82;
      }
      if (!candidate.includes(2) && previous.includes(2)) {
        weight *= 1.1;
      }
      return weight;
    },
    rng
  );
}

function pickExtraDepths(rng: RNG): Set<number> {
  const candidateDepths = rng.shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const targetCount = 4 + (rng.next() < 0.45 ? 1 : 0);
  const picked: number[] = [];

  for (const depth of candidateDepths) {
    if (picked.every((existingDepth) => Math.abs(existingDepth - depth) >= 2)) {
      picked.push(depth);
      if (picked.length >= targetCount) break;
    }
  }

  return new Set(picked);
}

function appendUniqueNextKey(node: TemplateNode, nextKey: string): void {
  if (!node.nextKeys.includes(nextKey)) {
    node.nextKeys.push(nextKey);
  }
}

/** Two directed edges (sA→tA) and (sB→tB) visually cross if their lane orderings are inverted. */
function edgesWouldCross(
  sA: TemplateNode,
  tA: TemplateNode,
  edges: ReadonlyArray<readonly [TemplateNode, TemplateNode]>
): boolean {
  for (const [sB, tB] of edges) {
    const sSign = Math.sign(sA.lane - sB.lane);
    const tSign = Math.sign(tA.lane - tB.lane);
    if (sSign !== 0 && tSign !== 0 && sSign !== tSign) return true;
  }
  return false;
}

function appendIfNoCross(
  source: TemplateNode,
  target: TemplateNode,
  depthEdges: Array<readonly [TemplateNode, TemplateNode]>
): void {
  if (edgesWouldCross(source, target, depthEdges)) return;
  appendUniqueNextKey(source, target.key);
  depthEdges.push([source, target] as const);
}

function pickClosestTemplateNodes(
  nodes: TemplateNode[],
  lane: number,
  limit: number
): TemplateNode[] {
  return [...nodes]
    .sort((left, right) => {
      const laneDelta =
        Math.abs(left.lane - lane) - Math.abs(right.lane - lane);
      if (laneDelta !== 0) return laneDelta;
      return left.lane - right.lane;
    })
    .slice(0, limit);
}

function pickGeneratedNode(
  template: FloorMapTemplate,
  depths: readonly number[],
  routeTags: readonly RouteTag[],
  rng: RNG
): TemplateNode | null {
  const candidates = depths.flatMap((depth) =>
    (template[depth] ?? []).filter(
      (node) =>
        routeTags.includes(node.routeTag ?? "WILD") &&
        node.key !== "start" &&
        node.key !== "preboss" &&
        !node.isBoss &&
        node.type === "COMBAT" &&
        !node.isElite
    )
  );

  if (candidates.length === 0) return null;

  return weightedPick(
    candidates,
    (node) => {
      let weight = 1;
      if (node.routeTag === "WILD") weight *= 1.15;
      if (node.lane === 2) weight *= 0.9;
      return weight;
    },
    rng
  );
}

function assignPlanSpecial(
  node: TemplateNode | null,
  specialType: TemplateSpecialType
): void {
  if (!node) return;
  node.type = "SPECIAL";
  node.specialType = specialType;
  node.isElite = false;
}

function assignPlanMerchant(node: TemplateNode | null): void {
  if (!node) return;
  node.type = "MERCHANT";
  node.specialType = undefined;
  node.isElite = false;
}

function assignPlanElite(node: TemplateNode | null): void {
  if (!node) return;
  node.type = "COMBAT";
  node.specialType = undefined;
  node.isElite = true;
}

function connectGraphTemplate(template: FloorMapTemplate, rng: RNG): void {
  const startNode = template[0]?.[0];
  if (startNode) {
    startNode.nextKeys = (template[1] ?? []).map((node) => node.key);
  }

  for (let depth = 1; depth < GAME_CONSTANTS.BOSS_ROOM_INDEX - 1; depth += 1) {
    const currentNodes = template[depth] ?? [];
    const nextNodes = template[depth + 1] ?? [];
    const nextByKey = new Map(nextNodes.map((n) => [n.key, n]));

    // Track all edges added at this depth to enforce planarity.
    const depthEdges: Array<readonly [TemplateNode, TemplateNode]> = [];

    const currentByRoute = new Map<RouteTag, TemplateNode>(
      currentNodes
        .filter((node): node is TemplateNode & { routeTag: RouteTag } =>
          Boolean(node.routeTag)
        )
        .map((node) => [node.routeTag, node] as const)
    );
    const nextByRoute = new Map<RouteTag, TemplateNode>(
      nextNodes
        .filter((node): node is TemplateNode & { routeTag: RouteTag } =>
          Boolean(node.routeTag)
        )
        .map((node) => [node.routeTag, node] as const)
    );

    // Main same-route connections are added unconditionally (backbone connectivity),
    // but are tracked so subsequent edges can avoid crossing them.
    for (const routeTag of MAIN_ROUTE_TAGS) {
      const source = currentByRoute.get(routeTag);
      const target = nextByRoute.get(routeTag);
      if (source && target) {
        appendUniqueNextKey(source, target.key);
        depthEdges.push([source, target] as const);
      }
    }

    // Seed depthEdges with any other connections that already exist on currentNodes
    // (e.g. from previous iterations assigning nextKeys early).
    for (const node of currentNodes) {
      for (const key of node.nextKeys) {
        const target = nextByKey.get(key);
        if (
          target &&
          !depthEdges.some(([s, t]) => s === node && t === target)
        ) {
          depthEdges.push([node, target] as const);
        }
      }
    }

    for (const nextWildNode of nextNodes.filter(
      (node) => node.routeTag === "WILD"
    )) {
      const sources = pickClosestTemplateNodes(
        currentNodes,
        nextWildNode.lane,
        2
      );
      if (sources[0]) {
        appendIfNoCross(sources[0], nextWildNode, depthEdges);
      }
      if (
        sources[1] &&
        Math.abs(sources[1].lane - nextWildNode.lane) <= 1 &&
        rng.next() < 0.4
      ) {
        appendIfNoCross(sources[1], nextWildNode, depthEdges);
      }
    }

    for (const currentWildNode of currentNodes.filter(
      (node) => node.routeTag === "WILD"
    )) {
      const targets = pickClosestTemplateNodes(
        nextNodes,
        currentWildNode.lane,
        2
      );
      if (targets[0]) {
        appendIfNoCross(currentWildNode, targets[0], depthEdges);
      }
      if (
        targets[1] &&
        Math.abs(targets[1].lane - currentWildNode.lane) <= 1 &&
        rng.next() < 0.32
      ) {
        appendIfNoCross(currentWildNode, targets[1], depthEdges);
      }
    }

    const crossoverPairs: Array<[MainRouteTag, MainRouteTag]> = [];
    if (rng.next() < 0.42) {
      crossoverPairs.push(
        rng.next() < 0.5 ? ["SAFE", "BALANCED"] : ["BALANCED", "SAFE"]
      );
    }
    if (rng.next() < 0.42) {
      crossoverPairs.push(
        rng.next() < 0.5 ? ["BALANCED", "GREEDY"] : ["GREEDY", "BALANCED"]
      );
    }
    if (depth >= 4 && depth <= 10 && rng.next() < 0.1) {
      crossoverPairs.push(
        rng.next() < 0.5 ? ["SAFE", "GREEDY"] : ["GREEDY", "SAFE"]
      );
    }

    for (const [fromRoute, toRoute] of crossoverPairs) {
      const source = currentByRoute.get(fromRoute);
      const target = nextByRoute.get(toRoute);
      if (
        source &&
        target &&
        source.nextKeys.length < 2 &&
        Math.abs(source.lane - target.lane) <= 2
      ) {
        appendIfNoCross(source, target, depthEdges);
      }
    }

    for (const node of currentNodes) {
      if (node.nextKeys.length > 0 || nextNodes.length === 0) continue;

      const fallbackTargets = pickClosestTemplateNodes(
        nextNodes,
        node.lane,
        nextNodes.length
      );

      for (const target of fallbackTargets) {
        appendIfNoCross(node, target, depthEdges);
        if (node.nextKeys.length > 0) break;
      }

      if (node.nextKeys.length === 0) {
        const nearestTarget = fallbackTargets[0];
        if (nearestTarget) {
          appendUniqueNextKey(node, nearestTarget.key);
          depthEdges.push([node, nearestTarget] as const);
        }
      }
    }
  }

  for (const node of template[GAME_CONSTANTS.BOSS_ROOM_INDEX - 2] ?? []) {
    appendUniqueNextKey(node, "preboss");
  }
}

function assignGraphRoomTypes(template: FloorMapTemplate, rng: RNG): void {
  for (const depthNodes of template) {
    for (const node of depthNodes) {
      if (node.key === "start" || node.key === "preboss" || node.isBoss)
        continue;
      node.type = "COMBAT";
      node.specialType = undefined;
      node.isElite = false;
    }
  }

  assignPlanSpecial(pickGeneratedNode(template, [1, 2], ["SAFE"], rng), "HEAL");
  assignPlanSpecial(
    pickGeneratedNode(template, [4, 5], ["SAFE"], rng),
    rng.next() < 0.5 ? "UPGRADE" : "EVENT"
  );
  assignPlanSpecial(
    pickGeneratedNode(template, [6, 7], ["SAFE"], rng),
    rng.next() < 0.5 ? "HEAL" : "UPGRADE"
  );
  assignPlanMerchant(pickGeneratedNode(template, [8], ["SAFE"], rng));
  assignPlanSpecial(
    pickGeneratedNode(template, [12, 13], ["SAFE"], rng),
    "EVENT"
  );

  assignPlanSpecial(
    pickGeneratedNode(template, [2, 3], ["BALANCED"], rng),
    "EVENT"
  );
  assignPlanSpecial(
    pickGeneratedNode(template, [4, 5], ["BALANCED"], rng),
    "UPGRADE"
  );
  assignPlanElite(pickGeneratedNode(template, [6, 7], ["BALANCED"], rng));
  assignPlanMerchant(pickGeneratedNode(template, [8], ["BALANCED"], rng));
  assignPlanSpecial(
    pickGeneratedNode(template, [9, 10], ["BALANCED"], rng),
    rng.next() < 0.5 ? "EVENT" : "HEAL"
  );
  assignPlanSpecial(
    pickGeneratedNode(template, [12, 13], ["BALANCED"], rng),
    rng.next() < 0.55 ? "UPGRADE" : "HEAL"
  );

  assignPlanSpecial(
    pickGeneratedNode(template, [1, 2], ["GREEDY"], rng),
    rng.next() < 0.5 ? "EVENT" : "HEAL"
  );
  assignPlanElite(pickGeneratedNode(template, [2, 3], ["GREEDY"], rng));
  assignPlanSpecial(
    pickGeneratedNode(template, [4, 5], ["GREEDY"], rng),
    "EVENT"
  );
  assignPlanSpecial(
    pickGeneratedNode(template, [6, 7], ["GREEDY"], rng),
    "UPGRADE"
  );
  assignPlanMerchant(pickGeneratedNode(template, [8], ["GREEDY"], rng));
  assignPlanElite(pickGeneratedNode(template, [9, 10], ["GREEDY"], rng));
  assignPlanSpecial(
    pickGeneratedNode(template, [12, 13], ["GREEDY"], rng),
    "EVENT"
  );

  assignPlanSpecial(
    pickGeneratedNode(template, [3, 4, 5], ["WILD"], rng),
    "EVENT"
  );
  assignPlanMerchant(pickGeneratedNode(template, [8], ["WILD"], rng));
  assignPlanSpecial(
    pickGeneratedNode(template, [10, 11], ["WILD"], rng),
    rng.next() < 0.5 ? "HEAL" : "UPGRADE"
  );
}

function buildGraphTemplate(rng: RNG): FloorMapTemplate {
  const template: FloorMapTemplate = [
    [{ key: "start", lane: 2, type: "COMBAT", nextKeys: [] }],
  ];
  const extraDepths = pickExtraDepths(rng);
  let previousLaneSet: readonly number[] | null = null;
  let repeatedMiddleLaneCount = 0;

  for (let depth = 1; depth < GAME_CONSTANTS.BOSS_ROOM_INDEX - 1; depth += 1) {
    const laneSet = pickRandomLaneSet(
      previousLaneSet,
      repeatedMiddleLaneCount,
      depth,
      rng
    );
    repeatedMiddleLaneCount =
      previousLaneSet && laneSet[1] === previousLaneSet[1]
        ? repeatedMiddleLaneCount + 1
        : 0;
    previousLaneSet = laneSet;

    const depthNodes: TemplateNode[] = laneSet.map((lane, index) => ({
      key: `d${depth}-${MAIN_ROUTE_TAGS[index]!.toLowerCase()}`,
      lane,
      type: "COMBAT",
      nextKeys: [],
      routeTag: MAIN_ROUTE_TAGS[index]!,
    }));

    if (extraDepths.has(depth)) {
      const unusedLanes = Array.from(
        { length: GAME_CONSTANTS.MAP_LANES },
        (_, lane) => lane
      ).filter((lane) => !laneSet.includes(lane));
      if (unusedLanes.length > 0) {
        const extraLane = weightedPick(
          unusedLanes,
          (lane) => {
            const nearestMainLaneDelta = Math.min(
              ...laneSet.map((mainLane) => Math.abs(mainLane - lane))
            );
            let weight = nearestMainLaneDelta <= 1 ? 1.25 : 1;
            if (lane === 2) weight *= 0.82;
            return weight;
          },
          rng
        );
        depthNodes.push({
          key: `d${depth}-wild`,
          lane: extraLane,
          type: "COMBAT",
          nextKeys: [],
          routeTag: "WILD",
        });
      }
    }

    template[depth] = depthNodes.sort((left, right) => left.lane - right.lane);
  }

  template[GAME_CONSTANTS.BOSS_ROOM_INDEX - 1] = [
    {
      key: "preboss",
      lane: 2,
      type: "PRE_BOSS",
      nextKeys: ["boss"],
    },
  ];
  template[GAME_CONSTANTS.BOSS_ROOM_INDEX] = [
    {
      key: "boss",
      lane: 2,
      type: "COMBAT",
      isBoss: true,
      nextKeys: [],
    },
  ];

  connectGraphTemplate(template, rng);
  assignGraphRoomTypes(template, rng);
  return template;
}

const LINEAR_TEMPLATE: FloorMapTemplate = [
  [
    {
      key: "start",
      lane: 2,
      type: "COMBAT",
      nextKeys: ["l1"],
    },
  ],
  [
    {
      key: "l1",
      lane: 2,
      type: "SPECIAL",
      specialType: "EVENT",
      nextKeys: ["l2"],
    },
  ],
  [{ key: "l2", lane: 2, type: "COMBAT", nextKeys: ["l3"] }],
  [{ key: "l3", lane: 2, type: "MERCHANT", nextKeys: ["l4"] }],
  [
    {
      key: "l4",
      lane: 2,
      type: "COMBAT",
      isElite: true,
      nextKeys: ["l5"],
    },
  ],
  [
    {
      key: "l5",
      lane: 2,
      type: "SPECIAL",
      specialType: "HEAL",
      nextKeys: ["l6"],
    },
  ],
  [{ key: "l6", lane: 2, type: "COMBAT", nextKeys: ["l7"] }],
  [
    {
      key: "l7",
      lane: 2,
      type: "SPECIAL",
      specialType: "UPGRADE",
      nextKeys: ["l8"],
    },
  ],
  [{ key: "l8", lane: 2, type: "COMBAT", nextKeys: ["l9"] }],
  [{ key: "l9", lane: 2, type: "MERCHANT", nextKeys: ["l10"] }],
  [
    {
      key: "l10",
      lane: 2,
      type: "COMBAT",
      isElite: true,
      nextKeys: ["l11"],
    },
  ],
  [
    {
      key: "l11",
      lane: 2,
      type: "SPECIAL",
      specialType: "EVENT",
      nextKeys: ["l12"],
    },
  ],
  [{ key: "l12", lane: 2, type: "COMBAT", nextKeys: ["l13"] }],
  [
    {
      key: "l13",
      lane: 2,
      type: "SPECIAL",
      specialType: "HEAL",
      nextKeys: ["preboss"],
    },
  ],
  [
    {
      key: "preboss",
      lane: 2,
      type: "PRE_BOSS",
      nextKeys: ["boss"],
    },
  ],
  [
    {
      key: "boss",
      lane: 2,
      type: "COMBAT",
      isBoss: true,
      nextKeys: [],
    },
  ],
];

function cloneTemplate(template: FloorMapTemplate): FloorMapTemplate {
  return template.map((depth) => depth.map((node) => ({ ...node })));
}

function varyTemplateSpecialRooms(
  template: FloorMapTemplate,
  rng: RNG
): FloorMapTemplate {
  return template.map((depth) =>
    depth.map((node) => {
      if (node.type !== "SPECIAL") return { ...node };
      if (node.specialType === "HEAL" && rng.next() < 0.25) {
        return { ...node, specialType: "UPGRADE" };
      }
      if (node.specialType === "UPGRADE" && rng.next() < 0.25) {
        return { ...node, specialType: "HEAL" };
      }
      return { ...node };
    })
  );
}

function pickTemplate(
  mapRules: ReturnType<typeof getRunConditionMapRules>,
  rng: RNG
): FloorMapTemplate {
  if (mapRules.forceSingleChoice || mapRules.bossOnlyCombats) {
    return varyTemplateSpecialRooms(cloneTemplate(LINEAR_TEMPLATE), rng);
  }

  return buildGraphTemplate(rng);
}

function applyTemplateMapRules(
  template: FloorMapTemplate,
  mapRules: ReturnType<typeof getRunConditionMapRules>,
  rng: RNG
): FloorMapTemplate {
  const result = cloneTemplate(template);

  if (mapRules.noMerchants) {
    for (const depth of result) {
      for (const node of depth) {
        if (node.type === "MERCHANT") {
          node.type = "SPECIAL";
          node.specialType = depth[0]?.key === node.key ? "UPGRADE" : "EVENT";
        }
      }
    }
  }

  if (mapRules.extraSpecialRoom) {
    const candidates = result
      .flat()
      .filter(
        (node) =>
          node.type === "COMBAT" &&
          !node.isElite &&
          !node.isBoss &&
          node.key !== "start" &&
          node.key !== "boss"
      );
    if (candidates.length > 0) {
      const picked = rng.pick(candidates);
      picked.type = "SPECIAL";
      picked.specialType = "EVENT";
    }
  }

  return result;
}

export function getBossRoomIndexForMap(map: RoomNode[][]): number {
  return Math.max(0, map.length - 1);
}

export function getPreBossRoomIndexForMap(map: RoomNode[][]): number {
  return Math.max(0, getBossRoomIndexForMap(map) - 1);
}

function getRoomNodeStableId(node: RoomNode, choiceIndex: number): string {
  return node.nodeId ?? `${node.index}-${choiceIndex}`;
}

export function getReachableRoomChoiceIndexes(
  map: RoomNode[][],
  currentRoom: number
): number[] {
  const currentSlot = map[currentRoom] ?? [];
  if (currentSlot.length === 0) return [];
  if (currentRoom <= 0) return currentSlot.map((_, index) => index);

  const previousSlot = map[currentRoom - 1] ?? [];
  const previousSelectedNode = previousSlot.find((node) => node.completed);
  if (
    !previousSelectedNode ||
    (previousSelectedNode.nextNodeIds?.length ?? 0) === 0
  ) {
    return currentSlot.map((_, index) => index);
  }

  const reachableNodeIds = new Set(previousSelectedNode.nextNodeIds ?? []);
  return currentSlot
    .map((node, index) =>
      reachableNodeIds.has(getRoomNodeStableId(node, index)) ? index : -1
    )
    .filter((index) => index >= 0);
}

export function isRoomChoiceReachable(
  map: RoomNode[][],
  currentRoom: number,
  choiceIndex: number
): boolean {
  return getReachableRoomChoiceIndexes(map, currentRoom).includes(choiceIndex);
}

function buildRoomNode(
  index: number,
  lane: number,
  nodeId: string,
  type: RoomNode["type"],
  isElite = false,
  enemyIds?: string[],
  specialType?: RoomNode["specialType"],
  nextNodeIds: string[] = []
): RoomNode {
  return {
    index,
    nodeId,
    lane,
    nextNodeIds,
    type,
    specialType,
    enemyIds,
    isElite,
    completed: false,
  };
}

function pickPreBossEnemyId(
  floor: number,
  biome: BiomeType,
  rng: RNG,
  bossOnlyCombats: boolean
): string {
  const pool = bossOnlyCombats
    ? enemyDefinitions.filter((enemy) => enemy.isBoss && enemy.biome === biome)
    : enemyDefinitions.filter(
        (enemy) =>
          enemy.isElite &&
          !enemy.isScriptedOnly &&
          (enemy.biome === biome || enemy.biome === "LIBRARY")
      );
  if (pool.length === 0) {
    return bossOnlyCombats ? "chapter_guardian" : "ink_slime";
  }
  return weightedPick(
    pool,
    (enemy) => getEnemySelectionWeight(enemy, floor, biome),
    rng
  ).id;
}

function pickEliteEnemyId(
  floor: number,
  biome: BiomeType,
  rng: RNG
): string | null {
  const pool = enemyDefinitions.filter(
    (enemy) =>
      enemy.isElite &&
      !enemy.isScriptedOnly &&
      (enemy.biome === biome || enemy.biome === "LIBRARY")
  );
  if (pool.length === 0) return null;
  return weightedPick(
    pool,
    (enemy) => getEnemySelectionWeight(enemy, floor, biome),
    rng
  ).id;
}

function buildFloorMapCandidate(
  floor: number,
  rng: RNG,
  biome: BiomeType,
  mapRules: ReturnType<typeof getRunConditionMapRules>,
  difficultyLevel: number,
  isInfiniteMode: boolean
): RoomNode[][] {
  const template = applyTemplateMapRules(
    pickTemplate(mapRules, rng),
    mapRules,
    rng
  );

  return template.map((depthNodes, depthIndex) =>
    depthNodes.map((node) => {
      if (node.type === "MERCHANT" || node.type === "SPECIAL") {
        return buildRoomNode(
          depthIndex,
          node.lane,
          node.key,
          node.type,
          false,
          undefined,
          node.specialType,
          node.nextKeys
        );
      }

      if (node.type === "PRE_BOSS") {
        return buildRoomNode(
          depthIndex,
          node.lane,
          node.key,
          "PRE_BOSS",
          true,
          [
            pickPreBossEnemyId(
              floor,
              biome,
              rng,
              mapRules.bossOnlyCombats ?? false
            ),
          ],
          undefined,
          node.nextKeys
        );
      }

      if (mapRules.bossOnlyCombats) {
        return buildRoomNode(
          depthIndex,
          node.lane,
          node.key,
          "COMBAT",
          false,
          generateRoomEnemies(
            floor,
            depthIndex,
            Boolean(node.isBoss),
            biome,
            rng,
            difficultyLevel,
            1,
            false,
            true,
            isInfiniteMode
          ).enemyIds,
          undefined,
          node.nextKeys
        );
      }

      if (node.isBoss || depthIndex === GAME_CONSTANTS.BOSS_ROOM_INDEX) {
        return buildRoomNode(
          depthIndex,
          node.lane,
          node.key,
          "COMBAT",
          false,
          generateRoomEnemies(
            floor,
            depthIndex,
            true,
            biome,
            rng,
            difficultyLevel,
            1,
            false,
            false,
            isInfiniteMode
          ).enemyIds,
          undefined,
          node.nextKeys
        );
      }

      if (node.isElite) {
        const eliteEnemyId = pickEliteEnemyId(floor, biome, rng);
        return buildRoomNode(
          depthIndex,
          node.lane,
          node.key,
          "COMBAT",
          Boolean(eliteEnemyId),
          eliteEnemyId ? [eliteEnemyId] : ["ink_slime"],
          undefined,
          node.nextKeys
        );
      }

      return buildRoomNode(
        depthIndex,
        node.lane,
        node.key,
        "COMBAT",
        false,
        generateRoomEnemies(
          floor,
          depthIndex,
          false,
          biome,
          rng,
          difficultyLevel,
          1,
          false,
          false,
          isInfiniteMode
        ).enemyIds,
        undefined,
        node.nextKeys
      );
    })
  );
}

function enumerateFloorMapPaths(map: RoomNode[][]): RoomNode[][] {
  if (map.length === 0 || map[0]?.length === 0) return [];

  const nodesById = new Map(
    map.flatMap((depth) =>
      depth.map(
        (node, choiceIndex) =>
          [getRoomNodeStableId(node, choiceIndex), node] as const
      )
    )
  );
  const startNode = map[0]?.[0];
  if (!startNode) return [];

  const results: RoomNode[][] = [];
  const visit = (node: RoomNode, path: RoomNode[]) => {
    const nextPath = [...path, node];
    if (node.index >= map.length - 1 || (node.nextNodeIds?.length ?? 0) === 0) {
      results.push(nextPath);
      return;
    }

    for (const nextNodeId of node.nextNodeIds ?? []) {
      const nextNode = nodesById.get(nextNodeId);
      if (nextNode) {
        visit(nextNode, nextPath);
      }
    }
  };

  visit(startNode, []);
  return results;
}

function getPathSupportTag(node: RoomNode): string | null {
  if (node.type === "MERCHANT") return "MERCHANT";
  if (node.type === "SPECIAL") return node.specialType ?? "SPECIAL";
  return null;
}

function summarizePathIdentity(path: RoomNode[]): string {
  const supportTags = path
    .map((node) => getPathSupportTag(node))
    .filter((tag): tag is string => tag !== null);
  const firstSupport = supportTags[0] ?? "NONE";
  const lastSupport = supportTags[supportTags.length - 1] ?? "NONE";
  const eliteCount = path.filter(
    (node) => node.type === "COMBAT" && node.isElite
  ).length;
  const merchantCount = path.filter((node) => node.type === "MERCHANT").length;
  const eventCount = path.filter(
    (node) => node.type === "SPECIAL" && node.specialType === "EVENT"
  ).length;
  const healCount = path.filter(
    (node) => node.type === "SPECIAL" && node.specialType === "HEAL"
  ).length;
  const upgradeCount = path.filter(
    (node) => node.type === "SPECIAL" && node.specialType === "UPGRADE"
  ).length;

  return [
    `elite:${eliteCount}`,
    `merchant:${merchantCount}`,
    `event:${eventCount}`,
    `heal:${healCount}`,
    `upgrade:${upgradeCount}`,
    `first:${firstSupport}`,
    `last:${lastSupport}`,
  ].join("|");
}

function isValidFloorMapCandidate(map: RoomNode[][]): boolean {
  const bossRoomIndex = getBossRoomIndexForMap(map);
  const preBossRoomIndex = getPreBossRoomIndexForMap(map);
  const paths = enumerateFloorMapPaths(map);
  if (paths.length === 0) return false;

  let safePathExists = false;
  let balancedPathExists = false;
  let greedyPathExists = false;
  const pathIdentities = new Set<string>();

  for (const path of paths) {
    if (path.length !== map.length) return false;

    const beforePreBoss = path.filter((node) => node.index < preBossRoomIndex);
    const earlyCorrectionCount = beforePreBoss.filter(
      (node) =>
        node.index >= 1 &&
        node.index <= 5 &&
        (node.type === "MERCHANT" || node.type === "SPECIAL")
    ).length;
    if (earlyCorrectionCount === 0) return false;

    const midCorrectionCount = beforePreBoss.filter(
      (node) =>
        node.index >= 6 &&
        node.index <= 10 &&
        (node.type === "MERCHANT" || node.type === "SPECIAL")
    ).length;
    if (midCorrectionCount === 0) return false;

    const lateCorrectionCount = beforePreBoss.filter(
      (node) =>
        node.index >= 11 &&
        node.index <= 13 &&
        (node.type === "MERCHANT" || node.type === "SPECIAL")
    ).length;
    if (lateCorrectionCount === 0) return false;

    const combatCount = beforePreBoss.filter(
      (node) => node.type === "COMBAT"
    ).length;
    if (combatCount < 6) return false;

    const supportNodes = beforePreBoss.filter(
      (node) => node.type === "MERCHANT" || node.type === "SPECIAL"
    );
    const supportKinds = new Set(
      supportNodes
        .map((node) => getPathSupportTag(node))
        .filter((tag): tag is string => tag !== null)
    );

    const eventLikeCount = beforePreBoss.filter(
      (node) =>
        node.type === "MERCHANT" ||
        (node.type === "SPECIAL" && node.specialType === "EVENT")
    ).length;

    const recoveryOrUpgradeCount = beforePreBoss.filter(
      (node) =>
        node.type === "SPECIAL" &&
        (node.specialType === "HEAL" || node.specialType === "UPGRADE")
    ).length;

    let combatStreak = 0;
    for (const node of beforePreBoss) {
      if (node.type === "COMBAT") {
        combatStreak += 1;
        if (combatStreak > 4) return false;
      } else {
        combatStreak = 0;
      }
    }

    const eliteCount = beforePreBoss.filter(
      (node) => node.type === "COMBAT" && node.isElite
    ).length;
    if (eliteCount > 2) return false;
    const merchantCount = beforePreBoss.filter(
      (node) => node.type === "MERCHANT"
    ).length;
    const merchantIndexes = beforePreBoss
      .filter((node) => node.type === "MERCHANT")
      .map((node) => node.index);
    if (merchantCount < 1) return false;
    if (merchantCount > 2) return false;
    if ((merchantIndexes[0] ?? Number.POSITIVE_INFINITY) > 8) return false;
    for (let index = 1; index < merchantIndexes.length; index += 1) {
      if (merchantIndexes[index]! - merchantIndexes[index - 1]! <= 1) {
        return false;
      }
    }
    safePathExists ||=
      eliteCount === 0 && recoveryOrUpgradeCount >= 2 && eventLikeCount >= 1;
    balancedPathExists ||=
      eliteCount === 1 && supportKinds.size >= 3 && merchantCount >= 1;
    greedyPathExists ||= eliteCount >= 2 && eventLikeCount >= 1;

    pathIdentities.add(summarizePathIdentity(beforePreBoss));
  }

  const preBossNodes = map[preBossRoomIndex] ?? [];
  const bossNodes = map[bossRoomIndex] ?? [];
  return (
    preBossNodes.length === 1 &&
    bossNodes.length === 1 &&
    safePathExists &&
    balancedPathExists &&
    pathIdentities.size >= 3 &&
    greedyPathExists
  );
}

/**
 * Generate a floor map as a connected graph inspired by Slay the Spire.
 * The outer array remains indexed by depth so the rest of the run flow can
 * continue using currentRoom as a depth cursor.
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

  for (let attempt = 0; attempt < 128; attempt += 1) {
    const candidate = buildFloorMapCandidate(
      floor,
      rng,
      biome,
      mapRules,
      difficultyLevel,
      isInfiniteMode
    );
    if (isValidFloorMapCandidate(candidate)) {
      return candidate;
    }
  }

  return buildFloorMapCandidate(
    floor,
    rng,
    biome,
    mapRules,
    difficultyLevel,
    isInfiniteMode
  );
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
    !e.isScriptedOnly && (e.biome === biome || e.biome === "LIBRARY");

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
  if (!isRoomChoiceReachable(runState.map, runState.currentRoom, choiceIndex)) {
    return runState;
  }

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
  const isOpeningBiomeSelection =
    runState.floor === 1 &&
    runState.currentRoom === 0 &&
    runState.combat === null;
  const forcedOpeningLibrary = difficultyLevel === 0 && isOpeningBiomeSelection;

  return {
    ...runState,
    selectedDifficultyLevel: difficultyLevel,
    pendingDifficultyLevels: [],
    pendingBiomeChoices: forcedOpeningLibrary
      ? null
      : runState.pendingBiomeChoices,
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
  if (
    runState.firstRunScript?.enabled &&
    isInfiniteRunConditionId(normalizedConditionId)
  ) {
    return runState;
  }
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
  const activeCharacterId = runState.characterId ?? "scribe";
  const bonusCards = buildConditionStarterCards(
    normalizedConditionId,
    cardMap
  ).filter((card) => matchesCardCharacter(card, activeCharacterId));
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
      matchesCardCharacter(card, activeCharacterId) &&
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
    const upgradableCards = conditionedDeck.filter(
      (card) => !card.upgraded && !isClogCardDefinitionId(card.definitionId)
    );
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
  const isBossRoom =
    runState.currentRoom === getBossRoomIndexForMap(runState.map);
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
      pendingBiomeChoices = drawRandomBiomeChoices(rng);
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
    if (!TRACKED_ENEMY_DEFINITION_IDS.has(enemy.definitionId)) continue;
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
    byCharacter: {},
  };
  const roomChoices = runState.map[runState.currentRoom];
  const selectedRoom =
    roomChoices?.find((r) => r.completed) ?? roomChoices?.[0];
  if (selectedRoom?.isElite) {
    unlockProgress = onEliteKilled(
      unlockProgress,
      runState.currentBiome,
      runState.characterId
    );
  }
  if (isBossRoom) {
    unlockProgress = onBossKilled(
      unlockProgress,
      runState.currentBiome,
      runState.characterId
    );
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
      byCharacter: {},
    },
    biome,
    state.characterId
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
