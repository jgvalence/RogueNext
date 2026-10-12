import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { makeTestCombat } from "@/test/factories/game-state";
import { appendCombatFeedback } from "@/game/engine/combat-feedback";
import { CombatFeedbackLayer } from "./combat-feedback-layer";
vi.mock("@/lib/sound", () => ({ playSound: vi.fn() }));
beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      return {
        x: 20,
        y: 60,
        width: this.hidden ? 0 : 150,
        height: 100,
        bottom: 160,
        top: 60,
        left: 20,
        right: 170,
        toJSON: () => ({}),
      };
    }
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
it("skips saved feedback, locates the visible target and staggers every strike", () => {
  const initial = appendCombatFeedback(makeTestCombat(), [
    { kind: "poison", target: "e1", amount: 3 },
  ]);
  const view = (combat: typeof initial) => (
    <>
      <div hidden data-fx-target="e1" />
      <div data-fx-target="e1" />
      <CombatFeedbackLayer combat={combat} />
    </>
  );
  const { rerender, unmount } = render(view(initial));
  act(() => vi.runOnlyPendingTimers());
  expect(document.querySelectorAll("[data-combat-fx]")).toHaveLength(0);
  const next = appendCombatFeedback(initial, [
    { kind: "hit", target: "e1", amount: 4 },
    { kind: "hit", target: "e1", amount: 5 },
  ]);
  rerender(view(next));
  act(() => vi.advanceTimersByTime(0));
  expect(document.querySelectorAll('[data-combat-fx="hit"]')).toHaveLength(1);
  expect(
    document.querySelector<HTMLElement>('[data-combat-fx="hit"]')?.style.left
  ).toBe("95px");
  act(() => vi.advanceTimersByTime(100));
  expect(document.querySelectorAll('[data-combat-fx="hit"]')).toHaveLength(2);
  rerender(view(next));
  act(() => vi.advanceTimersByTime(100));
  expect(document.querySelectorAll('[data-combat-fx="hit"]')).toHaveLength(2);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
  expect(document.querySelector(".combat-feedback-layer")).toBeNull();
});
it("removes effects after their display duration", () => {
  const initial = makeTestCombat();
  const view = (combat: typeof initial) => (
    <>
      <div data-fx-target="player" />
      <CombatFeedbackLayer combat={combat} />
    </>
  );
  const { rerender } = render(view(initial));
  rerender(
    view(
      appendCombatFeedback(initial, [
        { kind: "armor", target: "player", amount: 8 },
      ])
    )
  );
  act(() => vi.advanceTimersByTime(0));
  expect(document.querySelector('[data-combat-fx="armor"]')).not.toBeNull();
  act(() => vi.advanceTimersByTime(721));
  expect(document.querySelector(".combat-feedback-layer")).toBeNull();
});
it("renders inside the fullscreen game and remains pointer transparent", () => {
  const initial = makeTestCombat();
  const host = document.createElement("div");
  document.body.append(host);
  Object.defineProperty(document, "fullscreenElement", {
    configurable: true,
    value: host,
  });
  const view = (combat: typeof initial) => (
    <>
      <div data-fx-target="player" />
      <CombatFeedbackLayer combat={combat} />
    </>
  );
  const { rerender, unmount } = render(view(initial));
  rerender(
    view(
      appendCombatFeedback(initial, [
        { kind: "heal", target: "player", amount: 5 },
      ])
    )
  );
  act(() => vi.advanceTimersByTime(0));
  expect(host.querySelector('[data-combat-fx="heal"]')).not.toBeNull();
  unmount();
  host.remove();
  Object.defineProperty(document, "fullscreenElement", {
    configurable: true,
    value: null,
  });
});
