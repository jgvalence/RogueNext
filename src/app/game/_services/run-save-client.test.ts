import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeTestRunState } from "@/test/factories/game-state";
import {
  endRunAction,
  persistRunState,
  resetRunSaveSession,
  SaveConflictError,
} from "./run-save-client";
const { save, finish } = vi.hoisted(() => ({ save: vi.fn(), finish: vi.fn() }));
vi.mock("@/server/actions/run", () => ({
  saveRunStateAction: save,
  endRunAction: finish,
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
const state = () => makeTestRunState({ runId: "save-client-test" });
const ack = { success: true, data: { saved: true } };
beforeEach(() => {
  vi.clearAllMocks();
  resetRunSaveSession("save-client-test");
  save.mockResolvedValue(ack);
  finish.mockResolvedValue({ success: true, data: { ended: true } });
});
describe("serialized save and finalization", () => {
  it("stops queued writes after a conflict until a newer server revision is loaded", async () => {
    save.mockResolvedValueOnce({ success: true, data: { saved: false } });
    await expect(persistRunState(state())).rejects.toBeInstanceOf(SaveConflictError);
    await expect(persistRunState({ ...state(), gold: 999 })).rejects.toBeInstanceOf(SaveConflictError);
    expect(save).toHaveBeenCalledTimes(1);
    await persistRunState({ ...state(), saveRevision: 5 });
    expect(save.mock.calls[1]![0].state.saveRevision).toBe(5);
  });
  it("reconciles an uncertain pagehide request before the next regular save", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);
    try {
      await expect(persistRunState({ ...state(), gold: 10 }, true)).rejects.toThrow("offline");
      expect(fetchMock.mock.calls[0]![1].keepalive).toBe(true);
      await persistRunState({ ...state(), gold: 20 });
      expect(save.mock.calls.map(([input]) => [input.state.saveRevision, input.state.gold])).toEqual([[0, 10], [1, 20]]);
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it("queues writes and ends with the last confirmed revision", async () => {
    let confirm!: (value: typeof ack) => void;
    save.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          confirm = resolve;
        })
    );
    const first = persistRunState(state());
    const second = persistRunState({ ...state(), gold: 52 });
    const end = endRunAction({
      runId: state().runId,
      status: "ABANDONED",
      finalState: state(),
    });
    expect(save).toHaveBeenCalledTimes(1);
    expect(finish).not.toHaveBeenCalled();
    confirm(ack);
    await Promise.all([first, second, end]);
    expect(save.mock.calls.map(([input]) => input.state.saveRevision)).toEqual([
      0, 1,
    ]);
    expect(finish.mock.calls[0]![0].finalState.saveRevision).toBe(2);
  });
  it("retries the exact uncertain snapshot before saving newer gameplay", async () => {
    save.mockRejectedValueOnce(new Error("connection lost after commit"));
    const original = { ...state(), gold: 10 };
    await expect(persistRunState(original)).rejects.toThrow("connection lost");
    await persistRunState({ ...original, gold: 20 });
    expect(
      save.mock.calls.map(([input]) => [
        input.state.saveRevision,
        input.state.gold,
      ])
    ).toEqual([
      [0, 10],
      [0, 10],
      [1, 20],
    ]);
  });
  it("does not consider an unconfirmed end successful", async () => {
    finish.mockResolvedValueOnce({ success: true, data: { ended: false } });
    expect(
      (
        await endRunAction({
          runId: state().runId,
          status: "ABANDONED",
          finalState: state(),
        })
      ).success
    ).toBe(false);
  });
  it("waits for an in-flight end before allowing a second caller to return", async () => {
    let confirm!: (value: { success: true; data: { ended: true } }) => void;
    finish.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          confirm = resolve;
        })
    );
    const input = {
      runId: state().runId,
      status: "ABANDONED" as const,
      finalState: state(),
    };
    const first = endRunAction(input);
    const navigate = vi.fn();
    const second = endRunAction(input).then(navigate);
    expect(navigate).not.toHaveBeenCalled();
    confirm({ success: true, data: { ended: true } });
    await Promise.all([first, second]);
    expect(navigate).toHaveBeenCalledOnce();
    expect(finish).toHaveBeenCalledOnce();
    await persistRunState(state());
    expect(save).not.toHaveBeenCalled();
  });
});
