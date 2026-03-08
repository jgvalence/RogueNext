import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeTestCombat, makeTestRunState } from "@/test/factories/game-state";
import { useAutoSave } from "./use-auto-save";

const { saveRunStateActionMock } = vi.hoisted(() => ({
  saveRunStateActionMock: vi.fn(),
}));

vi.mock("@/server/actions/run", () => ({
  saveRunStateAction: (...args: unknown[]) => saveRunStateActionMock(...args),
}));

describe("useAutoSave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    saveRunStateActionMock.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("debounces non-checkpoint state changes", () => {
    const baseState = makeTestRunState();
    const { rerender } = renderHook(({ state }) => useAutoSave(state), {
      initialProps: { state: baseState },
    });

    const nextState = {
      ...baseState,
      gold: baseState.gold + 7,
    };
    rerender({ state: nextState });

    expect(saveRunStateActionMock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(saveRunStateActionMock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(saveRunStateActionMock).toHaveBeenCalledWith({
      runId: nextState.runId,
      state: nextState,
    });
  });

  it("saves immediately when a checkpoint transition happens", () => {
    const baseState = makeTestRunState();
    const { rerender } = renderHook(({ state }) => useAutoSave(state), {
      initialProps: { state: baseState },
    });

    const nextState = {
      ...baseState,
      combat: makeTestCombat({ phase: "COMBAT_WON" }),
    };
    rerender({ state: nextState });

    expect(saveRunStateActionMock).toHaveBeenCalledTimes(1);
    expect(saveRunStateActionMock).toHaveBeenCalledWith({
      runId: nextState.runId,
      state: nextState,
    });
  });

  it("flushes the latest state through the keepalive endpoint on pagehide", () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const state = makeTestRunState();
    renderHook(() => useAutoSave(state));

    act(() => {
      window.dispatchEvent(new Event("pagehide"));
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/run/save",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        keepalive: true,
      })
    );

    const [, requestInit] = fetchMock.mock.calls[0]!;
    const body = JSON.parse((requestInit as RequestInit).body as string);
    expect(body.runId).toBe(state.runId);
    expect(body.state.runId).toBe(state.runId);
  });
});
