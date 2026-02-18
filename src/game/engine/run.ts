import type { RunState, RoomNode } from "../schemas/run-state";
import type { CombatState } from "../schemas/combat-state";
import type { CardDefinition, CardInstance } from "../schemas/cards";
import { GAME_CONSTANTS } from "../constants";
import type { RNG } from "./rng";
import { nanoid } from "nanoid";

/**
 * Create a new run with starter deck and generated map.
 */
export function createNewRun(
  runId: string,
  seed: string,
  starterCards: CardDefinition[],
  rng: RNG
): RunState {
  // Build starter deck instances
  const deck: CardInstance[] = starterCards.map((card) => ({
    instanceId: nanoid(),
    definitionId: card.id,
    upgraded: false,
  }));

  const map = generateFloorMap(1, rng);

  return {
    runId,
    seed,
    status: "IN_PROGRESS",
    floor: 1,
    currentRoom: 0,
    gold: GAME_CONSTANTS.STARTING_GOLD,
    playerMaxHp: GAME_CONSTANTS.STARTING_HP,
    playerCurrentHp: GAME_CONSTANTS.STARTING_HP,
    deck,
    relicIds: [],
    map,
    combat: null,
  };
}

/**
 * Generate a floor map: array of room slots, each with 1-3 room choices.
 * Room 0 = always COMBAT, Room 9 = always COMBAT (boss).
 * Rooms 1-8 = weighted random: ~60% combat, ~20% merchant, ~20% special.
 */
export function generateFloorMap(floor: number, rng: RNG): RoomNode[][] {
  const map: RoomNode[][] = [];

  for (let i = 0; i < GAME_CONSTANTS.ROOMS_PER_FLOOR; i++) {
    const isBossRoom = i === GAME_CONSTANTS.BOSS_ROOM_INDEX;
    const isFirstRoom = i === 0;

    const numChoices =
      isBossRoom || isFirstRoom
        ? 1
        : rng.nextInt(1, GAME_CONSTANTS.ROOM_CHOICES);

    const choices: RoomNode[] = [];
    for (let j = 0; j < numChoices; j++) {
      const type =
        isBossRoom || isFirstRoom ? ("COMBAT" as const) : pickRoomType(rng);

      const enemyIds =
        type === "COMBAT"
          ? generateRoomEnemies(floor, i, isBossRoom, rng)
          : undefined;

      choices.push({
        index: i,
        type,
        enemyIds,
        completed: false,
      });
    }

    map.push(choices);
  }

  return map;
}

function pickRoomType(rng: RNG): "COMBAT" | "MERCHANT" | "SPECIAL" {
  const roll = rng.next();
  if (roll < 0.6) return "COMBAT";
  if (roll < 0.8) return "MERCHANT";
  return "SPECIAL";
}

/**
 * Generate enemy IDs for a combat room.
 * MVP: pick 1-3 random enemies from available pool.
 * Boss rooms: single boss enemy.
 */
function generateRoomEnemies(
  _floor: number,
  _room: number,
  isBoss: boolean,
  rng: RNG
): string[] {
  if (isBoss) {
    return ["chapter_guardian"]; // Our MVP boss
  }

  // Regular enemies — pool of MVP enemy IDs
  const enemyPool = [
    "ink_slime",
    "paper_golem",
    "quill_sprite",
    "tome_wraith",
    "scroll_serpent",
  ];

  const count = rng.nextInt(1, 3);
  const enemies: string[] = [];
  for (let i = 0; i < count; i++) {
    enemies.push(rng.pick(enemyPool));
  }
  return enemies;
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
 */
export function completeCombat(
  runState: RunState,
  combatResult: CombatState,
  goldReward: number
): RunState {
  const isBossRoom = runState.currentRoom === GAME_CONSTANTS.BOSS_ROOM_INDEX;

  return {
    ...runState,
    playerCurrentHp: Math.max(0, combatResult.player.currentHp),
    gold: runState.gold + goldReward,
    combat: null,
    currentRoom: runState.currentRoom + 1,
    status: isBossRoom ? "VICTORY" : runState.status,
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
