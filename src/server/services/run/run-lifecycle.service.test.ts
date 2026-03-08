import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeTestRunState } from "@/test/factories/game-state";
import { createRunForUser, endRunForUser } from "./run-lifecycle.service";

const {
  buildInitialRunStateForUserMock,
  getActiveRunSnapshotForUserMock,
  createActiveRunForUserMock,
  markRunEndedForUserMock,
  deleteRunByIdMock,
  syncRunEndProgressionMock,
  incrementRunStatsInternalMock,
} = vi.hoisted(() => ({
  buildInitialRunStateForUserMock: vi.fn(),
  getActiveRunSnapshotForUserMock: vi.fn(),
  createActiveRunForUserMock: vi.fn(),
  markRunEndedForUserMock: vi.fn(),
  deleteRunByIdMock: vi.fn(),
  syncRunEndProgressionMock: vi.fn(),
  incrementRunStatsInternalMock: vi.fn(),
}));

vi.mock("./run-state.service", () => ({
  buildInitialRunStateForUser: (...args: unknown[]) =>
    buildInitialRunStateForUserMock(...args),
  getActiveRunSnapshotForUser: (...args: unknown[]) =>
    getActiveRunSnapshotForUserMock(...args),
}));

vi.mock("./run-persistence.service", () => ({
  createActiveRunForUser: (...args: unknown[]) =>
    createActiveRunForUserMock(...args),
  markRunEndedForUser: (...args: unknown[]) => markRunEndedForUserMock(...args),
  deleteRunById: (...args: unknown[]) => deleteRunByIdMock(...args),
}));

vi.mock("./run-progression-sync.service", () => ({
  syncRunEndProgression: (...args: unknown[]) =>
    syncRunEndProgressionMock(...args),
}));

vi.mock("@/server/actions/progression", () => ({
  incrementRunStatsInternal: (...args: unknown[]) =>
    incrementRunStatsInternalMock(...args),
}));

describe("run-lifecycle.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildInitialRunStateForUserMock.mockResolvedValue({
      seed: "seed-123",
      state: makeTestRunState({ runId: "temp-run", seed: "seed-123" }),
    });
    createActiveRunForUserMock.mockResolvedValue({
      runId: "db-run-1",
      state: makeTestRunState({ runId: "db-run-1", seed: "seed-123" }),
      abandonedCount: 0,
    });
    markRunEndedForUserMock.mockResolvedValue({
      run: {
        id: "db-run-1",
        userId: "user-1",
        state: makeTestRunState({ runId: "db-run-1", seed: "seed-123" }),
      },
      ended: true,
    });
    syncRunEndProgressionMock.mockResolvedValue(undefined);
    deleteRunByIdMock.mockResolvedValue(undefined);
    incrementRunStatsInternalMock.mockResolvedValue(undefined);
  });

  it("creates a run and records abandoned previous runs when needed", async () => {
    createActiveRunForUserMock.mockResolvedValueOnce({
      runId: "db-run-1",
      state: makeTestRunState({ runId: "db-run-1", seed: "seed-123" }),
      abandonedCount: 2,
    });

    const result = await createRunForUser("user-1", "seed-123");

    expect(buildInitialRunStateForUserMock).toHaveBeenCalledWith(
      "user-1",
      "seed-123"
    );
    expect(createActiveRunForUserMock).toHaveBeenCalledWith(
      "user-1",
      "seed-123",
      expect.objectContaining({ seed: "seed-123" })
    );
    expect(incrementRunStatsInternalMock).toHaveBeenCalledWith(
      "user-1",
      "ABANDONED",
      2
    );
    expect(result).toEqual({
      runId: "db-run-1",
      state: expect.objectContaining({ runId: "db-run-1", seed: "seed-123" }),
    });
  });

  it("skips abandoned stats increment when no prior run was abandoned", async () => {
    await createRunForUser("user-1", "seed-123");

    expect(incrementRunStatsInternalMock).not.toHaveBeenCalled();
  });

  it("does not sync or delete when the run was already ended", async () => {
    markRunEndedForUserMock.mockResolvedValueOnce({
      run: {
        id: "db-run-1",
        userId: "user-1",
        state: makeTestRunState({ runId: "db-run-1" }),
      },
      ended: false,
    });

    const result = await endRunForUser({
      userId: "user-1",
      runId: "db-run-1",
      status: "DEFEAT",
    });

    expect(result).toBe(false);
    expect(syncRunEndProgressionMock).not.toHaveBeenCalled();
    expect(deleteRunByIdMock).not.toHaveBeenCalled();
  });

  it("syncs progression and deletes the run when ending succeeds", async () => {
    const run = {
      id: "db-run-1",
      userId: "user-1",
      state: makeTestRunState({ runId: "db-run-1" }),
    };
    markRunEndedForUserMock.mockResolvedValueOnce({
      run,
      ended: true,
    });

    const result = await endRunForUser({
      userId: "user-1",
      runId: "db-run-1",
      status: "VICTORY",
      runDurationMs: 9876,
      earnedResources: { PAGES: 5 },
      startMerchantSpentResources: { PAGES: 2 },
      encounteredEnemies: { ink_slime: "NORMAL" },
      enemyKillCounts: { ink_slime: 3 },
    });

    expect(result).toBe(true);
    expect(markRunEndedForUserMock).toHaveBeenCalledWith({
      userId: "user-1",
      runId: "db-run-1",
      status: "VICTORY",
    });
    expect(syncRunEndProgressionMock).toHaveBeenCalledWith({
      userId: "user-1",
      run,
      status: "VICTORY",
      runDurationMs: 9876,
      earnedResources: { PAGES: 5 },
      startMerchantSpentResources: { PAGES: 2 },
      scriptedOutcome: undefined,
      encounteredEnemies: { ink_slime: "NORMAL" },
      enemyKillCounts: { ink_slime: 3 },
    });
    expect(deleteRunByIdMock).toHaveBeenCalledWith("db-run-1");
  });
});
