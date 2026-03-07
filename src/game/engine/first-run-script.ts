import { histoireDefinitions } from "../data/histoires";
import type { CombatState } from "../schemas/combat-state";
import type { BiomeResource } from "../schemas/enums";
import type { RoomNode, RunState } from "../schemas/run-state";

export const FIRST_RUN_ENERGY_STORY_ID = "traite_de_lenergie";
export const FIRST_RUN_ENERGY_TUTORIAL_OUTCOME =
  "FIRST_RUN_ENERGY_TUTORIAL" as const;
export const FIRST_RUN_SCRIPT_MAP_ROOM_INDEX = 1;
export const FIRST_RUN_SCRIPT_FORCED_CHOICE_INDEX = 2;

const FIRST_RUN_OPENING_ROOM: RoomNode[] = [
  {
    index: 0,
    type: "COMBAT",
    enemyIds: ["ink_slime"],
    isElite: false,
    completed: false,
  },
];

const FIRST_RUN_GUIDED_MAP_ROOM: RoomNode[] = [
  {
    index: FIRST_RUN_SCRIPT_MAP_ROOM_INDEX,
    type: "SPECIAL",
    isElite: false,
    completed: false,
  },
  {
    index: FIRST_RUN_SCRIPT_MAP_ROOM_INDEX,
    type: "MERCHANT",
    isElite: false,
    completed: false,
  },
  {
    index: FIRST_RUN_SCRIPT_MAP_ROOM_INDEX,
    type: "COMBAT",
    enemyIds: ["tome_colossus"],
    isElite: true,
    completed: false,
  },
];

type ScriptedOutcome = typeof FIRST_RUN_ENERGY_TUTORIAL_OUTCOME;

export function createFirstRunScriptedMap(baseMap: RoomNode[][]): RoomNode[][] {
  const nextMap = baseMap.map((slot) => slot.map((room) => ({ ...room })));
  nextMap[0] = FIRST_RUN_OPENING_ROOM.map((room) => ({ ...room }));
  nextMap[FIRST_RUN_SCRIPT_MAP_ROOM_INDEX] = FIRST_RUN_GUIDED_MAP_ROOM.map(
    (room) => ({ ...room })
  );
  return nextMap;
}

export function isFirstRunScriptEnabled(runState: RunState): boolean {
  return Boolean(runState.firstRunScript?.enabled);
}

export function shouldShowFirstRunMapTutorial(runState: RunState): boolean {
  return (
    isFirstRunScriptEnabled(runState) &&
    runState.firstRunScript?.step === "MAP_INTRO" &&
    runState.floor === 1 &&
    runState.currentRoom === FIRST_RUN_SCRIPT_MAP_ROOM_INDEX &&
    runState.combat === null
  );
}

export function getFirstRunForcedMapChoiceIndex(
  runState: RunState
): number | null {
  return shouldShowFirstRunMapTutorial(runState)
    ? FIRST_RUN_SCRIPT_FORCED_CHOICE_INDEX
    : null;
}

export function isFirstRunScriptedEliteRoom(runState: RunState): boolean {
  return (
    isFirstRunScriptEnabled(runState) &&
    runState.firstRunScript?.step === "FORCED_ELITE" &&
    runState.floor === 1 &&
    runState.currentRoom === FIRST_RUN_SCRIPT_MAP_ROOM_INDEX
  );
}

export function applyFirstRunOpeningCombatAdvantage(
  combat: CombatState
): CombatState {
  if (combat.enemies.length === 0) return combat;

  return {
    ...combat,
    player: {
      ...combat.player,
      currentHp: combat.player.maxHp,
      block: combat.player.block + 8,
    },
    enemies: combat.enemies.map((enemy, index) =>
      index === 0
        ? {
            ...enemy,
            currentHp: Math.min(enemy.currentHp, 12),
          }
        : enemy
    ),
  };
}

export function getFirstRunScriptedEndResources(): Partial<
  Record<BiomeResource, number>
> {
  const energyStory = histoireDefinitions.find(
    (story) => story.id === FIRST_RUN_ENERGY_STORY_ID
  );
  const pagesCost = energyStory?.cout.PAGES ?? 14;

  return {
    PAGES: pagesCost,
  };
}

export function isFirstRunEnergyTutorialOutcome(
  value: string | null | undefined
): value is ScriptedOutcome {
  return value === FIRST_RUN_ENERGY_TUTORIAL_OUTCOME;
}
