// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeTestRunState } from "@/test/factories/game-state";
import { createRunForUser, endRunForUser } from "./run-lifecycle.service";
const mocks = vi.hoisted(() => ({
  initial: vi.fn(),
  create: vi.fn(),
  owned: vi.fn(),
  save: vi.fn(),
  mark: vi.fn(),
  sync: vi.fn(),
  stats: vi.fn(),
  summary: vi.fn(),
  pvp: vi.fn(),
  progression: vi.fn(),
  transaction: vi.fn(),
}));
const tx = vi.hoisted(() => ({
  run: { findMany: vi.fn() },
  userProgression: { findUnique: mocks.progression },
  runSummary: { create: mocks.summary },
  pvpDeckSnapshot: { create: mocks.pvp },
}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { $transaction: mocks.transaction },
}));
vi.mock("./run-state.service", () => ({
  buildInitialRunStateForUser: mocks.initial,
  getActiveRunSnapshotForUser: vi.fn(),
}));
vi.mock("./run-persistence.service", () => ({
  createActiveRunForUser: mocks.create,
  getOwnedRunForUser: mocks.owned,
  saveRunStateForUser: mocks.save,
  markRunEndedForUser: mocks.mark,
}));
vi.mock("./run-progression-sync.service", () => ({
  syncRunEndProgression: mocks.sync,
}));
vi.mock("@/server/services/progression-stats.service", () => ({
  incrementRunStatsInternal: mocks.stats,
}));
beforeEach(() => {
  vi.clearAllMocks();
  tx.run.findMany.mockResolvedValue([]);
  const state = makeTestRunState({
    runId: "r",
    status: "VICTORY",
    activePlayMs: 500,
    earnedResources: { PAGES: 4 },
  });
  const run = {
    id: "r",
    userId: "u",
    status: "IN_PROGRESS",
    state,
    createdAt: new Date(),
  };
  mocks.transaction.mockImplementation(async (callback) => callback(tx));
  mocks.owned.mockResolvedValue(run);
  mocks.mark.mockResolvedValue({ run, ended: true });
  mocks.save.mockResolvedValue(true);
  mocks.sync.mockResolvedValue(undefined);
  mocks.summary.mockResolvedValue({});
  mocks.pvp.mockResolvedValue({});
  mocks.progression.mockResolvedValue({ unlockedStoryIds: [] });
  mocks.initial.mockResolvedValue({ seed: "seed", state });
  mocks.create.mockResolvedValue({ runId: "r", state, abandonedCount: 0 });
});
describe("atomic run lifecycle", () => {
  it("creates the initial snapshot and records prior abandoned runs", async () => {
    tx.run.findMany.mockResolvedValueOnce([{ id: "previous" }]);
    await createRunForUser("u");
    expect(mocks.sync).toHaveBeenCalledWith(
      expect.objectContaining({ status: "ABANDONED" }),
      tx
    );
    expect(mocks.create).toHaveBeenCalledWith(
      "u",
      "seed",
      expect.any(Object),
      tx
    );
  });
  it("uses one serializable transaction for status, progression and both summaries", async () => {
    expect(
      await endRunForUser({
        userId: "u",
        runId: "r",
        status: "VICTORY",
        earnedResources: { PAGES: 99999 },
      })
    ).toBe(true);
    expect(mocks.transaction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ isolationLevel: "Serializable" })
    );
    expect(mocks.mark).toHaveBeenCalledWith(
      { userId: "u", runId: "r", status: "VICTORY" },
      tx
    );
    expect(mocks.sync).toHaveBeenCalledWith(
      expect.objectContaining({ runDurationMs: 500 }),
      tx
    );
    expect(mocks.sync.mock.calls[0]![0].earnedResources).toBeUndefined();
    expect(mocks.summary).toHaveBeenCalledTimes(1);
    expect(mocks.pvp).toHaveBeenCalledTimes(1);
  });
  it("is idempotent after a committed finish whose response was lost", async () => {
    mocks.owned.mockResolvedValueOnce({ status: "VICTORY" });
    expect(
      await endRunForUser({ userId: "u", runId: "r", status: "VICTORY" })
    ).toBe(true);
    expect(mocks.sync).not.toHaveBeenCalled();
    expect(mocks.summary).not.toHaveBeenCalled();
  });
  it.each(["sync", "summary", "pvp"] as const)(
    "propagates a %s failure to rollback the transaction",
    async (stage) => {
      mocks[stage].mockRejectedValueOnce(new Error("injected failure"));
      await expect(
        endRunForUser({ userId: "u", runId: "r", status: "VICTORY" })
      ).rejects.toThrow("injected failure");
    }
  );
  it("rejects a stale final snapshot before awarding resources", async () => {
    mocks.save.mockResolvedValueOnce(false);
    await expect(
      endRunForUser({
        userId: "u",
        runId: "r",
        status: "VICTORY",
        finalState: makeTestRunState(),
      })
    ).rejects.toThrow("SAVE_CONFLICT");
    expect(mocks.sync).not.toHaveBeenCalled();
  });
  it("rejects a victory unsupported by the saved state", async () => {
    mocks.mark.mockResolvedValueOnce({
      ended: true,
      run: { state: makeTestRunState() },
    });
    await expect(
      endRunForUser({ userId: "u", runId: "r", status: "VICTORY" })
    ).rejects.toThrow("Victory");
    expect(mocks.sync).not.toHaveBeenCalled();
  });
});
