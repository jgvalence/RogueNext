import { describe, expect, it } from "vitest";
import {
  applyEventChoice,
  isEventChoiceAvailable,
  type GameEvent,
} from "@/game/engine/run-events";
import { makeTestRunState } from "@/test/factories/game-state";

describe("run events", () => {
  const paidEvent: GameEvent = {
    id: "paid-event",
    title: "paid-event.title",
    description: "paid-event.description",
    once: true,
    choices: [
      {
        label: "paid-event.choices.0.label",
        description: "paid-event.choices.0.description",
        goldCost: 30,
        apply: (state) => ({
          ...state,
          gold: state.gold - 30,
          playerMaxHp: state.playerMaxHp + 20,
          playerCurrentHp: state.playerCurrentHp + 20,
          currentRoom: state.currentRoom + 1,
        }),
      },
    ],
  };

  it("blocks unaffordable paid choices before they consume the room", () => {
    const run = makeTestRunState({
      gold: 20,
      currentRoom: 4,
      playerMaxHp: 70,
      playerCurrentHp: 55,
      seenEventIds: [],
    });

    expect(isEventChoiceAvailable(run, paidEvent.choices[0]!)).toBe(false);

    const result = applyEventChoice(run, paidEvent, 0);

    expect(result).toBe(run);
    expect(result.currentRoom).toBe(4);
    expect(result.gold).toBe(20);
    expect(result.playerMaxHp).toBe(70);
    expect(result.playerCurrentHp).toBe(55);
    expect(result.seenEventIds).toEqual([]);
  });

  it("applies paid choices normally when the player can afford them", () => {
    const run = makeTestRunState({
      gold: 50,
      currentRoom: 4,
      playerMaxHp: 70,
      playerCurrentHp: 55,
      seenEventIds: [],
    });

    expect(isEventChoiceAvailable(run, paidEvent.choices[0]!)).toBe(true);

    const result = applyEventChoice(run, paidEvent, 0);

    expect(result).not.toBe(run);
    expect(result.currentRoom).toBe(5);
    expect(result.gold).toBe(20);
    expect(result.playerMaxHp).toBe(90);
    expect(result.playerCurrentHp).toBe(75);
    expect(result.seenEventIds).toEqual(["paid-event"]);
  });
});
