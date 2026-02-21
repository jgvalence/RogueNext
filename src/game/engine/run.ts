import type { RunState, RoomNode } from "../schemas/run-state";
import type { CombatState } from "../schemas/combat-state";
import type { CardDefinition, CardInstance } from "../schemas/cards";
import type { BiomeType, BiomeResource } from "../schemas/enums";
import type { ComputedMetaBonuses } from "../schemas/meta";
import { GAME_CONSTANTS } from "../constants";
import { enemyDefinitions } from "../data/enemies";
import type { CardUnlockProgress } from "./card-unlocks";
import {
  computeUnlockedCardIds,
  onBossKilled,
  onEliteKilled,
  onEnterBiome,
} from "./card-unlocks";
import type { RNG } from "./rng";
import { nanoid } from "nanoid";

type EnemyDef = (typeof enemyDefinitions)[0];

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

function getEnemySelectionWeight(enemy: EnemyDef, floor: number): number {
  // Base weight by explicit tier ("difficulty level").
  const tierWeight = 1 + Math.max(0, enemy.tier - 1) * Math.max(0, floor - 1);
  // Extra bias by HP so stronger monsters inside a tier appear more on high floors.
  const hpWeight = 1 + (enemy.maxHp / 100) * Math.max(0, floor - 1);
  return tierWeight * hpWeight;
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
  allCards?: CardDefinition[]
): RunState {
  // Build starter deck instances
  const deck: CardInstance[] = starterCards.map((card) => ({
    instanceId: nanoid(),
    definitionId: card.id,
    upgraded: false,
  }));

  const map = generateFloorMap(1, rng, "LIBRARY");

  const startingGold =
    GAME_CONSTANTS.STARTING_GOLD + (metaBonuses?.startingGold ?? 0);
  const extraHp = metaBonuses?.extraHp ?? 0;
  const unlockProgress = initialUnlockProgress ?? {
    enteredBiomes: { LIBRARY: 1 },
    biomeRunsCompleted: {},
    eliteKillsByBiome: {},
    bossKillsByBiome: {},
  };
  const unlockedCardIds = allCards
    ? computeUnlockedCardIds(allCards, unlockProgress, unlockedStoryIdsSnapshot)
    : [];

  return {
    runId,
    seed,
    status: "IN_PROGRESS",
    floor: 1,
    currentRoom: 0,
    gold: startingGold,
    playerMaxHp: GAME_CONSTANTS.STARTING_HP + extraHp,
    playerCurrentHp: GAME_CONSTANTS.STARTING_HP + extraHp,
    deck,
    allyIds: [],
    relicIds: [],
    map,
    combat: null,
    currentBiome: "LIBRARY",
    pendingBiomeChoices: null,
    earnedResources: {},
    metaBonuses,
    unlockedStoryIdsSnapshot,
    unlockedCardIds,
    initialUnlockedCardIds: unlockedCardIds,
    cardUnlockProgress: unlockProgress,
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
  biome: BiomeType
): RoomNode[][] {
  // Build the sequence for rooms 1-7 (7 middle rooms): 1 shop, 1-2 events, rest combat
  // Room 8 is always PRE_BOSS; Room 9 is always BOSS
  const numSpecial = rng.nextInt(1, 2);
  const middleTypes: Array<"COMBAT" | "MERCHANT" | "SPECIAL"> = [
    "MERCHANT",
    ...Array<"SPECIAL">(numSpecial).fill("SPECIAL"),
    ...Array<"COMBAT">(6 - numSpecial).fill("COMBAT"),
  ];
  const shuffledMiddle = buildBalancedMiddleRooms(middleTypes, rng);

  const PRE_BOSS_ROOM_INDEX = GAME_CONSTANTS.BOSS_ROOM_INDEX - 1; // 8

  const map: RoomNode[][] = [];

  for (let i = 0; i < GAME_CONSTANTS.ROOMS_PER_FLOOR; i++) {
    const isBossRoom = i === GAME_CONSTANTS.BOSS_ROOM_INDEX;
    const isFirstRoom = i === 0;
    const isPreBossRoom = i === PRE_BOSS_ROOM_INDEX;

    // PRE_BOSS room: always a single node with 1 elite enemy for the "fight for relic" option
    if (isPreBossRoom) {
      const elitePool = enemyDefinitions
        .filter(
          (e) => e.isElite && (e.biome === biome || e.biome === "LIBRARY")
        )
        .map((e) => e.id);
      const eliteDefs = enemyDefinitions.filter(
        (e) =>
          e.isElite &&
          elitePool.includes(e.id) &&
          (e.biome === biome || e.biome === "LIBRARY")
      );
      const preBossEnemyId =
        eliteDefs.length > 0
          ? weightedPick(
              eliteDefs,
              (e) => getEnemySelectionWeight(e, floor),
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

    const numChoices =
      isBossRoom || isFirstRoom
        ? 1
        : rng.nextInt(1, GAME_CONSTANTS.ROOM_CHOICES);

    const baseType: "COMBAT" | "MERCHANT" | "SPECIAL" =
      isBossRoom || isFirstRoom ? "COMBAT" : shuffledMiddle[i - 1]!;

    const choices: RoomNode[] = [];
    for (let j = 0; j < numChoices; j++) {
      // First choice uses the assigned type; extra choices are always COMBAT
      const type = j === 0 ? baseType : ("COMBAT" as const);

      const enemyResult =
        type === "COMBAT"
          ? generateRoomEnemies(floor, i, isBossRoom, biome, rng)
          : undefined;

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
  rng: RNG
): { enemyIds: string[]; isElite: boolean } {
  const canAppear = (e: (typeof enemyDefinitions)[0]) =>
    e.biome === biome || e.biome === "LIBRARY";

  if (isBoss) {
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
  const eliteChance = Math.min(0.5, 0.25 + (floor - 1) * 0.05);
  if (room >= 3 && eliteDefs.length > 0 && rng.next() < eliteChance) {
    const elite = weightedPick(
      eliteDefs,
      (e) => getEnemySelectionWeight(e, floor),
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

  const maxEnemyCount = Math.min(
    GAME_CONSTANTS.MAX_ENEMIES,
    2 + Math.floor(floor / 2)
  );
  const count = rng.nextInt(1, maxEnemyCount);
  const enemies: string[] = [];
  for (let i = 0; i < count; i++) {
    const picked = weightedPick(
      normalPool,
      (e) => getEnemySelectionWeight(e, floor),
      rng
    );
    enemies.push(picked.id);
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

/**
 * Complete a combat and update run state.
 * - Non-boss: advance room normally.
 * - Boss on floor < MAX_FLOORS: generate biome choices for the next floor.
 * - Boss on final floor: set status VICTORY.
 */
export function completeCombat(
  runState: RunState,
  combatResult: CombatState,
  goldReward: number,
  rng: RNG,
  biomeResources?: Partial<Record<BiomeResource, number>>,
  allCards?: CardDefinition[],
  relicIds?: string[]
): RunState {
  const isBossRoom = runState.currentRoom === GAME_CONSTANTS.BOSS_ROOM_INDEX;
  const isFinalFloor = runState.floor >= GAME_CONSTANTS.MAX_FLOORS;
  const hpAfterCombat = Math.max(0, combatResult.player.currentHp);
  const healPct = Math.max(0, runState.metaBonuses?.healAfterCombat ?? 0);

  // Blood Grimoire relic: gain max HP for each enemy killed this combat
  const roomChoicesForRelic = runState.map[runState.currentRoom];
  const selectedRoomForRelic =
    roomChoicesForRelic?.find((r) => r.completed) ?? roomChoicesForRelic?.[0];
  const isEliteRoom = selectedRoomForRelic?.isElite ?? false;
  const enemyCount = combatResult.enemies.length;
  const bloodGrimoireGain = (relicIds ?? runState.relicIds).includes(
    "blood_grimoire"
  )
    ? isBossRoom
      ? 5
      : isEliteRoom
        ? enemyCount * 2
        : enemyCount * 1
    : 0;

  const newPlayerMaxHp = runState.playerMaxHp + bloodGrimoireGain;
  const healAmount = Math.floor((newPlayerMaxHp * healPct) / 100);
  const hpAfterMetaHeal = Math.min(
    newPlayerMaxHp,
    hpAfterCombat + healAmount + bloodGrimoireGain
  );

  let pendingBiomeChoices: RunState["pendingBiomeChoices"] = null;

  if (isBossRoom && !isFinalFloor) {
    if (runState.floor === 1) {
      // First transition (floor 1 -> 2): always include LIBRARY.
      const firstNonLibrary = rng.pick(GAME_CONSTANTS.AVAILABLE_BIOMES);
      pendingBiomeChoices = ["LIBRARY", firstNonLibrary];
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
  if (biomeResources) {
    for (const [key, amount] of Object.entries(biomeResources)) {
      updatedEarnedResources[key] =
        (updatedEarnedResources[key] ?? 0) + (amount as number);
    }
  }

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
  const unlockedCardIds = computeUnlockedCardIds(
    allCards ?? [],
    unlockProgress,
    runState.unlockedStoryIdsSnapshot ?? []
  );

  return {
    ...runState,
    playerMaxHp: newPlayerMaxHp,
    playerCurrentHp: hpAfterMetaHeal,
    gold: runState.gold + goldReward,
    combat: null,
    currentRoom: runState.currentRoom + 1,
    status: isBossRoom && isFinalFloor ? "VICTORY" : runState.status,
    pendingBiomeChoices,
    earnedResources: updatedEarnedResources,
    unlockedCardIds:
      unlockedCardIds.length > 0 ? unlockedCardIds : runState.unlockedCardIds,
    cardUnlockProgress: unlockProgress,
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
  const newFloor = state.floor + 1;
  const newMap = generateFloorMap(newFloor, rng, biome);

  const unlockProgress = onEnterBiome(
    state.cardUnlockProgress ?? {
      enteredBiomes: {},
      biomeRunsCompleted: {},
      eliteKillsByBiome: {},
      bossKillsByBiome: {},
    },
    biome
  );
  const unlockedCardIds = computeUnlockedCardIds(
    allCards ?? [],
    unlockProgress,
    state.unlockedStoryIdsSnapshot ?? []
  );

  return {
    ...state,
    floor: newFloor,
    currentRoom: 0,
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
  const healAmount = Math.floor(
    runState.playerMaxHp * GAME_CONSTANTS.HEAL_ROOM_PERCENT
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
  const roll = rng.next();
  if (roll < 0.4) return "HEAL";
  if (roll < 0.7) return "UPGRADE";
  return "EVENT";
}

/**
 * Upgrade a card in the deck — sets the upgraded flag.
 * Upgraded cards deal +50% damage/block values at play time.
 */
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

// ============================
// Random Events
// ============================

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  choices: EventChoice[];
}

export interface EventChoice {
  label: string;
  description: string;
  apply: (state: RunState) => RunState;
}

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

const EVENTS: GameEvent[] = [
  {
    id: "mysterious_tome",
    title: "Mysterious Tome",
    description:
      "You find an ancient book radiating energy. Its pages whisper to you...",
    choices: [
      {
        label: "Read the tome",
        description: "Lose 10 HP, gain 50 gold",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 10),
          gold: s.gold + 50,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "Leave it alone",
        description: "Nothing happens",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  {
    id: "ink_fountain",
    title: "Ink Fountain",
    description:
      "A fountain of pure ink bubbles from the ground. The ink seems alive...",
    choices: [
      {
        label: "Drink deeply",
        description: "Heal 15 HP, gain 25 gold",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.min(s.playerMaxHp, s.playerCurrentHp + 15),
          gold: s.gold + 25,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "Fill your pockets",
        description: "Gain 75 gold",
        apply: (s) => ({
          ...s,
          gold: s.gold + 75,
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "wandering_scribe",
    title: "Wandering Scribe",
    description: "A tired scribe offers to trade. They seem desperate...",
    choices: [
      {
        label: "Pay 30 gold for their blessing",
        description: "Lose 30 gold, gain 20 max HP",
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
        label: "Wish them well",
        description: "Heal 10 HP",
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
    title: "Ancient Sarcophagus",
    description:
      "A sealed sarcophagus hums with old energy. Opening it could fortify your body — or drain it.",
    choices: [
      {
        label: "Absorb the essence",
        description: "Gain 20 max HP.",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 20,
          playerCurrentHp: s.playerCurrentHp + 20,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "Take the risk",
        description: "Gain 30 max HP, but lose 15 current HP.",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 30,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 15),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "Leave it sealed",
        description: "Nothing happens.",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  {
    id: "whispering_idol",
    title: "Whispering Idol",
    description:
      "A cracked idol offers you a pact: wealth now, but a curse bound to your deck.",
    choices: [
      {
        label: "Accept the pact",
        description: "Gain 90 gold. Add Hexed Parchment to your deck.",
        apply: (s) => ({
          ...addDeckCard(s, "hexed_parchment"),
          gold: s.gold + 90,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "Push your luck",
        description: "Gain 140 gold. Add Haunting Regret to your deck.",
        apply: (s) => ({
          ...addDeckCard(s, "haunting_regret"),
          gold: s.gold + 140,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "Refuse",
        description: "Leave safely.",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
];

export function pickEvent(rng: RNG): GameEvent {
  return rng.pick(EVENTS);
}

export function applyEventChoice(
  runState: RunState,
  event: GameEvent,
  choiceIndex: number
): RunState {
  const choice = event.choices[choiceIndex];
  if (!choice) return runState;
  return choice.apply(runState);
}
