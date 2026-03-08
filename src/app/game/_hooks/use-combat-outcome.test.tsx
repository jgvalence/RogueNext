import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildCardDefsMap } from "@/game/data";
import { makeTestCombat, makeTestRunState } from "@/test/factories/game-state";
import { useCombatOutcome } from "./use-combat-outcome";
import type { CombatRewards } from "@/game/engine/rewards";
import { isFirstRunScriptedEliteRoom } from "@/game/engine/first-run-script";

const {
  endRunActionMock,
  generateCombatRewardsMock,
  getRunConditionByIdMock,
  computeEnemyKillUnlockedRelicIdsMock,
  playSoundMock,
} = vi.hoisted(() => ({
  endRunActionMock: vi.fn(),
  generateCombatRewardsMock: vi.fn(),
  getRunConditionByIdMock: vi.fn(),
  computeEnemyKillUnlockedRelicIdsMock: vi.fn(),
  playSoundMock: vi.fn(),
}));

vi.mock("@/server/actions/run", () => ({
  endRunAction: (...args: unknown[]) => endRunActionMock(...args),
}));

vi.mock("@/game/engine/rewards", () => ({
  generateCombatRewards: (...args: unknown[]) =>
    generateCombatRewardsMock(...args),
}));

vi.mock("@/game/engine/run-conditions", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/game/engine/run-conditions")>();
  return {
    ...actual,
    getRunConditionById: (...args: unknown[]) =>
      getRunConditionByIdMock(...args),
  };
});

vi.mock("@/game/engine/difficulty", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/game/engine/difficulty")>();
  return {
    ...actual,
    computeEnemyKillUnlockedRelicIds: (...args: unknown[]) =>
      computeEnemyKillUnlockedRelicIdsMock(...args),
  };
});

vi.mock("@/lib/sound", () => ({
  playSound: (...args: unknown[]) => playSoundMock(...args),
}));

vi.mock("@/game/engine/first-run-script", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/game/engine/first-run-script")>();
  return {
    ...actual,
    FIRST_RUN_ENERGY_TUTORIAL_OUTCOME: "FIRST_RUN_ENERGY_TUTORIAL",
    getFirstRunScriptedEndResources: vi.fn(() => ({ PAGES: 14 })),
    isFirstRunScriptedEliteRoom: vi.fn(() => false),
  };
});

const mockRewards: CombatRewards = {
  gold: 42,
  cardChoices: [],
  biomeResources: { PAGES: 3 },
  relicChoices: [],
  allyChoices: [],
  bossMaxHpBonus: null,
  usableItemDropDefinitionId: "ink_vial",
};

function makeParams(
  overrides: Partial<Parameters<typeof useCombatOutcome>[0]>
) {
  const state = overrides.state ?? makeTestRunState();

  return {
    state,
    stateRef: overrides.stateRef ?? { current: state },
    runEndedRef: overrides.runEndedRef ?? { current: false },
    cardDefs: overrides.cardDefs ?? buildCardDefsMap(),
    isInfiniteMode: overrides.isInfiniteMode ?? false,
    buildEndRunPayload:
      overrides.buildEndRunPayload ??
      (() => ({
        runDurationMs: 1234,
        earnedResources: {},
        startMerchantSpentResources: {},
        encounteredEnemies: {},
        enemyKillCounts: {},
      })),
    dispatch: overrides.dispatch ?? vi.fn(),
    setRewards: overrides.setRewards ?? vi.fn(),
    setIsBossRewards: overrides.setIsBossRewards ?? vi.fn(),
    setIsEliteRewards: overrides.setIsEliteRewards ?? vi.fn(),
    setPhase: overrides.setPhase ?? vi.fn(),
    setNewBestiaryEntries: overrides.setNewBestiaryEntries ?? vi.fn(),
    onCombatLost: overrides.onCombatLost ?? vi.fn(),
    onScriptedFirstRunDefeat: overrides.onScriptedFirstRunDefeat ?? vi.fn(),
  };
}

describe("useCombatOutcome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    endRunActionMock.mockResolvedValue({ success: true });
    generateCombatRewardsMock.mockReturnValue(mockRewards);
    getRunConditionByIdMock.mockReturnValue(null);
    computeEnemyKillUnlockedRelicIdsMock.mockReturnValue([]);
    vi.mocked(isFirstRunScriptedEliteRoom).mockReturnValue(false);
  });

  it("handles combat victory by opening rewards and announcing newly discovered enemies", async () => {
    const baseState = makeTestRunState();
    const state = {
      ...baseState,
      currentRoom: 0,
      encounteredEnemies: { ink_slime: "NORMAL" as const },
      map: baseState.map.map((rooms, index) =>
        index === 0
          ? [
              {
                index: 0,
                type: "COMBAT" as const,
                enemyIds: ["ink_slime", "paper_golem"],
                isElite: false,
                completed: true,
              },
            ]
          : rooms
      ),
      combat: makeTestCombat({
        phase: "COMBAT_WON",
        enemies: [
          {
            instanceId: "e1",
            definitionId: "ink_slime",
            name: "Ink Slime",
            currentHp: 0,
            maxHp: 14,
            block: 0,
            speed: 2,
            buffs: [],
            intentIndex: 0,
          },
          {
            instanceId: "e2",
            definitionId: "paper_golem",
            name: "Paper Golem",
            currentHp: 0,
            maxHp: 38,
            block: 0,
            speed: 1,
            buffs: [],
            intentIndex: 0,
          },
        ],
      }),
    };
    const params = makeParams({ state });

    renderHook(() => useCombatOutcome(params));

    await waitFor(() => {
      expect(generateCombatRewardsMock).toHaveBeenCalledTimes(1);
    });

    expect(params.setNewBestiaryEntries).toHaveBeenCalledWith(["paper_golem"]);
    expect(params.setRewards).toHaveBeenCalledWith(mockRewards);
    expect(params.setIsBossRewards).toHaveBeenCalledWith(false);
    expect(params.setIsEliteRewards).toHaveBeenCalledWith(false);
    expect(params.dispatch).toHaveBeenCalledWith({
      type: "COMPLETE_COMBAT",
      payload: {
        goldReward: 42,
        biomeResources: { PAGES: 3 },
        usableItemDropDefinitionId: "ink_vial",
      },
    });
    expect(params.setPhase).toHaveBeenCalledWith("REWARDS");
    expect(playSoundMock).toHaveBeenCalledWith("VICTORY", 0.8);
    expect(endRunActionMock).not.toHaveBeenCalled();
  });

  it("ends a normal defeat only once even if dependencies rerender", async () => {
    const state = {
      ...makeTestRunState(),
      combat: makeTestCombat({ phase: "COMBAT_LOST" }),
    };
    let params = makeParams({
      state,
      buildEndRunPayload: () => ({
        runDurationMs: 1111,
        earnedResources: { PAGES: 1 },
        startMerchantSpentResources: {},
        encounteredEnemies: state.encounteredEnemies,
        enemyKillCounts: state.enemyKillCounts,
      }),
    });

    const { rerender } = renderHook(() => useCombatOutcome(params));

    await waitFor(() => {
      expect(endRunActionMock).toHaveBeenCalledTimes(1);
    });

    params = {
      ...params,
      buildEndRunPayload: () => ({
        runDurationMs: 2222,
        earnedResources: { PAGES: 2 },
        startMerchantSpentResources: {},
        encounteredEnemies: state.encounteredEnemies,
        enemyKillCounts: state.enemyKillCounts,
      }),
    };
    rerender();

    await waitFor(() => {
      expect(endRunActionMock).toHaveBeenCalledTimes(1);
    });

    expect(params.runEndedRef.current).toBe(true);
    expect(params.setPhase).toHaveBeenCalledWith("DEFEAT");
    expect(params.onCombatLost).toHaveBeenCalled();
    expect(playSoundMock).toHaveBeenCalledWith("DEFEAT", 0.8);
  });

  it("routes scripted first-run defeat through the special completion path", async () => {
    vi.mocked(isFirstRunScriptedEliteRoom).mockReturnValue(true);

    const baseState = makeTestRunState();
    const state = {
      ...baseState,
      currentRoom: 1,
      firstRunScript: { enabled: true, step: "FORCED_ELITE" as const },
      combat: makeTestCombat({ phase: "COMBAT_LOST" }),
    };
    const params = makeParams({
      state,
      onScriptedFirstRunDefeat: vi.fn(),
    });

    renderHook(() => useCombatOutcome(params));

    await waitFor(() => {
      expect(endRunActionMock).toHaveBeenCalledWith(
        expect.objectContaining({
          runId: state.runId,
          status: "DEFEAT",
          runDurationMs: 1234,
          earnedResources: { PAGES: 14 },
          startMerchantSpentResources: {},
          encounteredEnemies: {},
          enemyKillCounts: {},
          scriptedOutcome: "FIRST_RUN_ENERGY_TUTORIAL",
        })
      );
    });

    expect(params.onScriptedFirstRunDefeat).toHaveBeenCalledTimes(1);
    expect(params.setPhase).not.toHaveBeenCalledWith("DEFEAT");
  });
});
