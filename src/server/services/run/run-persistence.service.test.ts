// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeTestRunState } from "@/test/factories/game-state";
import { saveRunStateForUser } from "./run-persistence.service";
const { find, update } = vi.hoisted(() => ({ find: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { run: { findUnique: find, updateMany: update } },
}));
beforeEach(() => {
  vi.clearAllMocks();
  update.mockResolvedValue({ count: 1 });
});
describe("snapshot compare and swap", () => {
  it("accepts several floors completed before reconnecting", async () => {
    const state = makeTestRunState({ runId: "r", floor: 1 });
    find.mockResolvedValue({ userId: "u", status: "IN_PROGRESS", state });
    expect(
      await saveRunStateForUser({
        userId: "u",
        runId: "r",
        state: { ...state, floor: 4 },
      })
    ).toBe(true);
  });
  it("accepts a legacy start time normalized from the stored creation date", async () => {
    const createdAt = new Date("2026-01-01T12:00:00Z");
    const previous = makeTestRunState({ runId: "r", runStartedAtMs: 0 });
    find.mockResolvedValue({
      userId: "u",
      status: "IN_PROGRESS",
      state: previous,
      createdAt,
    });
    expect(
      await saveRunStateForUser({
        userId: "u",
        runId: "r",
        state: { ...previous, runStartedAtMs: createdAt.getTime() },
      })
    ).toBe(true);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ state: { equals: previous } }),
      })
    );
  });
  it("rejects a client changing the original start time", async () => {
    const state = makeTestRunState({ runId: "r", runStartedAtMs: 1234 });
    find.mockResolvedValue({ userId: "u", status: "IN_PROGRESS", state });
    await expect(
      saveRunStateForUser({
        userId: "u",
        runId: "r",
        state: { ...state, runStartedAtMs: 5678 },
      })
    ).rejects.toThrow("Run identity mismatch");
    expect(update).not.toHaveBeenCalled();
  });
  it("rejects ownership mismatch", async () => {
    find.mockResolvedValue({ userId: "other" });
    await expect(
      saveRunStateForUser({
        userId: "u",
        runId: "r",
        state: makeTestRunState(),
      })
    ).rejects.toThrow("access denied");
    expect(update).not.toHaveBeenCalled();
  });
  it("saves a successor using an atomic equality predicate", async () => {
    const state = makeTestRunState({ runId: "r" });
    find.mockResolvedValue({ userId: "u", status: "IN_PROGRESS", state });
    expect(
      await saveRunStateForUser({
        userId: "u",
        runId: "r",
        state: { ...state, gold: state.gold + 1 },
      })
    ).toBe(true);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ state: { equals: state } }),
        data: expect.objectContaining({
          state: expect.objectContaining({ saveRevision: 1 }),
        }),
      })
    );
  });
  it("does not let another tab overwrite a newer revision", async () => {
    const state = makeTestRunState({ runId: "r", saveRevision: 3, floor: 2 });
    find.mockResolvedValue({ userId: "u", status: "IN_PROGRESS", state });
    expect(
      await saveRunStateForUser({
        userId: "u",
        runId: "r",
        state: JSON.parse(
          JSON.stringify({ ...state, saveRevision: 1, floor: 1 })
        ),
      })
    ).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
  it("reports a lost compare-and-swap race", async () => {
    const state = makeTestRunState({ runId: "r" });
    find.mockResolvedValue({ userId: "u", status: "IN_PROGRESS", state });
    update.mockResolvedValueOnce({ count: 0 });
    expect(await saveRunStateForUser({ userId: "u", runId: "r", state })).toBe(
      false
    );
  });
  it("accepts an identical retry after an acknowledgement was lost", async () => {
    const state = makeTestRunState({ runId: "r" });
    find.mockResolvedValue({
      userId: "u",
      status: "IN_PROGRESS",
      state: JSON.parse(JSON.stringify({ ...state, saveRevision: 1 })),
    });
    expect(await saveRunStateForUser({ userId: "u", runId: "r", state })).toBe(
      true
    );
    expect(update).not.toHaveBeenCalled();
  });
});
