import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { makeTestCombat } from "@/test/factories/game-state";
import { appendCombatFeedback } from "@/game/engine/combat-feedback";
import { useCombatFeedbackSettled } from "./use-combat-feedback-settled";
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
it("keeps the final blow visible before leaving combat", () => {
  const initial = makeTestCombat();
  const { result, rerender, unmount } = renderHook(
    ({ combat }) => useCombatFeedbackSettled(combat, "run:1:0"),
    { initialProps: { combat: initial } }
  );
  const ended = appendCombatFeedback({ ...initial, phase: "COMBAT_WON" }, [
    { kind: "hit", target: "e1", amount: 5 },
    { kind: "hit", target: "e1", amount: 9 },
  ]);
  rerender({ combat: ended });
  expect(result.current).toBe(false);
  act(() => vi.advanceTimersByTime(800));
  expect(result.current).toBe(false);
  act(() => vi.advanceTimersByTime(100));
  expect(result.current).toBe(true);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
it("does not delay a restored terminal save or replay old feedback", () => {
  const combat = appendCombatFeedback(
    { ...makeTestCombat(), phase: "COMBAT_LOST" },
    [{ kind: "hit", target: "player", amount: 80 }]
  );
  const { result } = renderHook(() =>
    useCombatFeedbackSettled(combat, "saved:1:0")
  );
  expect(result.current).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
});
it("cancels a pending transition when unmounted", () => {
  const initial = makeTestCombat();
  const { rerender, unmount } = renderHook(
    ({ combat }) => useCombatFeedbackSettled(combat, "run:1:0"),
    { initialProps: { combat: initial } }
  );
  rerender({
    combat: appendCombatFeedback({ ...initial, phase: "COMBAT_LOST" }, [
      { kind: "hit", target: "player", amount: 80 },
    ]),
  });
  expect(vi.getTimerCount()).toBe(1);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
