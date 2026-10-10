import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeTestCombat, makeTestRunState } from "@/test/factories/game-state";
import { useAutoSave } from "./use-auto-save";
import { resetRunSaveSession } from "../_services/run-save-client";
const { save } = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock("@/server/actions/run", () => ({ saveRunStateAction: save }));
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  resetRunSaveSession(makeTestRunState().runId);
  save.mockResolvedValue({ success: true, data: { saved: true } });
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const tick = async (ms = 2100) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};
describe("autosave acknowledgements and complete snapshots", () => {
  it("saves the final boss offer before victory finalization", async () => {
    const state = makeTestRunState({status: "VICTORY", pendingRewards: {
      floor: 3, room: 16, isBoss: true, isElite: false,
      gold: 50, biomeResources: {}, cardIds: ["heavy_strike"], relicIds: [], allyIds: [],
      bossMaxHpBonus: 10, usableItemDropDefinitionId: null,
      rerollsRemaining: 0, rerollCounter: 0, rerollCardIds: [],
    }});
    renderHook(() => useAutoSave(state));
    await tick();
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0]![0].state.pendingRewards.cardIds).toEqual(["heavy_strike"]);
  });
  it("debounces ordinary changes and increments acknowledged revisions", async () => {
    const state = makeTestRunState();
    const { rerender } = renderHook(({ state }) => useAutoSave(state), {
      initialProps: { state },
    });
    rerender({ state: { ...state, gold: 42 } });
    await tick(1999);
    expect(save).not.toHaveBeenCalled();
    await tick(1);
    expect(save).toHaveBeenLastCalledWith({
      runId: state.runId,
      state: { ...state, gold: 42, saveRevision: 0 },
    });
    rerender({ state: { ...state, gold: 43 } });
    await tick();
    expect(save.mock.calls[1]![0].state.saveRevision).toBe(1);
  });
  it("saves checkpoint transitions immediately", async () => {
    const state = makeTestRunState();
    const { rerender } = renderHook(({ state }) => useAutoSave(state), {
      initialProps: { state },
    });
    rerender({ state: { ...state, combat: makeTestCombat() } });
    expect(save).toHaveBeenCalledTimes(1);
    await tick(0);
  });
  it("retries returned business failures without waiting for another action", async () => {
    save.mockResolvedValueOnce({
      success: false,
      error: { message: "offline" },
    });
    const { result } = renderHook(() => useAutoSave(makeTestRunState()));
    await tick();
    expect(result.current.saveError).toBe("failed");
    await tick(5000);
    expect(save).toHaveBeenCalledTimes(2);
    expect(result.current.saveError).toBeNull();
    expect(save.mock.calls[1]![0].state.saveRevision).toBe(0);
  });
  it("does not overwrite a conflicting tab or silently retry its revision", async () => {
    save.mockResolvedValue({ success: true, data: { saved: false } });
    const { result } = renderHook(() => useAutoSave(makeTestRunState()));
    await tick();
    expect(result.current.saveError).toBe("conflict");
    await tick(20000);
    expect(save).toHaveBeenCalledTimes(1);
  });
  it("persists ink-only, upgrade-only and inventory changes", async () => {
    let state = makeTestRunState({ combat: makeTestCombat() });
    const { rerender } = renderHook(({ state }) => useAutoSave(state), {
      initialProps: { state },
    });
    await tick();
    state = {
      ...state,
      combat: {
        ...state.combat!,
        player: { ...state.combat!.player, inkCurrent: 4 },
      },
    };
    rerender({ state });
    await tick();
    state = {
      ...state,
      deck: state.deck.map((card, i) =>
        i === 0 ? { ...card, upgraded: true } : card
      ),
      usableItemCapacity: 4,
    };
    rerender({ state });
    await tick();
    expect(save).toHaveBeenCalledTimes(3);
  });
  it("flushes through the authenticated keepalive endpoint", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ saved: true }) });
    vi.stubGlobal("fetch", fetchMock);
    renderHook(() => useAutoSave(makeTestRunState()));
    await act(async () => {
      window.dispatchEvent(new Event("pagehide"));
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/run/save",
      expect.objectContaining({ keepalive: true, credentials: "same-origin" })
    );
  });
  it("leaves terminal state to atomic finalization", async () => {
    renderHook(() => useAutoSave(makeTestRunState({ status: "VICTORY" })));
    await tick();
    expect(save).not.toHaveBeenCalled();
  });
});
