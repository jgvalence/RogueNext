import { describe, expect, it } from "vitest";
import type { RunState, RoomNode } from "@/game/schemas/run-state";
import {
  FIRST_RUN_SCRIPT_FORCED_CHOICE_INDEX,
  createFirstRunScriptedMap,
  getFirstRunForcedMapChoiceIndex,
  getFirstRunScriptedEndResources,
  shouldShowFirstRunMapTutorial,
} from "@/game/engine/first-run-script";

function makeRoom(index: number, type: RoomNode["type"]): RoomNode {
  return {
    index,
    type,
    completed: false,
    isElite: false,
  };
}

function makeRunState(overrides: Partial<RunState> = {}): RunState {
  return {
    runId: "run-1",
    seed: "seed-1",
    status: "IN_PROGRESS",
    runStartedAtMs: 0,
    activePlayMs: 0,
    floor: 1,
    currentRoom: 1,
    gold: 0,
    maxGoldReached: 0,
    merchantRerollCount: 0,
    playerMaxHp: 60,
    playerCurrentHp: 60,
    deck: [],
    allyIds: [],
    allyCurrentHps: {},
    relicIds: [],
    usableItems: [],
    usableItemCapacity: 3,
    freeUpgradeUsed: false,
    survivalOnceUsed: false,
    map: Array.from({ length: 10 }, (_, index) => [makeRoom(index, "COMBAT")]),
    combat: null,
    currentBiome: "LIBRARY",
    pendingBiomeChoices: null,
    difficultyMaxByCharacter: {},
    firstRunScript: {
      enabled: true,
      step: "MAP_INTRO",
    },
    pendingDifficultyLevels: [],
    selectedDifficultyLevel: 0,
    unlockedDifficultyLevelSnapshot: 0,
    pendingRunConditionChoices: [],
    selectedRunConditionId: null,
    earnedResources: {},
    startMerchantResourcePool: {},
    startMerchantSpentResources: {},
    startMerchantPurchasedOfferIds: [],
    startMerchantCompleted: true,
    characterId: "scribe",
    pendingCharacterChoices: null,
    unlockedStoryIdsSnapshot: [],
    unlockedRelicIds: [],
    unlockedCardIds: [],
    initialUnlockedCardIds: [],
    cardUnlockProgress: {
      enteredBiomes: {},
      biomeRunsCompleted: {},
      eliteKillsByBiome: {},
      bossKillsByBiome: {},
      byCharacter: {},
    },
    seenEventIds: [],
    scribeAttitude: 0,
    scribeChoices: {},
    encounteredEnemies: {},
    enemyKillCounts: {},
    relicPersistentStats: { strength: 0, focus: 0, inkMax: 0 },
    ...overrides,
  };
}

describe("first run script helpers", () => {
  it("overrides the opening rooms with the scripted tutorial sequence", () => {
    const baseMap = Array.from({ length: 10 }, (_, index) => [
      makeRoom(index, "COMBAT"),
    ]);

    const scriptedMap = createFirstRunScriptedMap(baseMap);

    expect(scriptedMap[0]?.[0]?.enemyIds).toEqual(["ink_slime"]);
    expect(scriptedMap[1]?.map((room) => room.type)).toEqual([
      "SPECIAL",
      "MERCHANT",
      "COMBAT",
    ]);
    expect(scriptedMap[1]?.[2]?.isElite).toBe(true);
    expect(scriptedMap[1]?.[2]?.enemyIds).toEqual(["tome_colossus"]);
  });

  it("forces the third map choice during the guided map step", () => {
    const runState = makeRunState();

    expect(shouldShowFirstRunMapTutorial(runState)).toBe(true);
    expect(getFirstRunForcedMapChoiceIndex(runState)).toBe(
      FIRST_RUN_SCRIPT_FORCED_CHOICE_INDEX
    );
  });

  it("grants exactly enough pages for the +1 draw story", () => {
    expect(getFirstRunScriptedEndResources()).toEqual({ PAGES: 11 });
  });
});
