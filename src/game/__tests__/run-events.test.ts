import { describe, expect, it } from "vitest";
import {
  applyEventChoice,
  isEventChoiceAvailable,
  type GameEvent,
} from "@/game/engine/run-events";
import { makeTestRunState } from "@/test/factories/game-state";
import { RunStateSchema } from "../schemas/run-state";
import { removeCardFromRunDeck } from "../engine/run";
import { deriveInitialPhase } from "@/app/game/_services/run-phase";

describe("run events", () => {
  it("resumes an event purge after its cost without applying the event twice", () => {
    const initial = makeTestRunState({ currentRoom: 4, playerCurrentHp: 60 });
    const event: GameEvent = { id: "purge", title: "purge", description: "purge", choices: [{ label: "purge", description: "purge", requiresPurge: true, apply: s => ({ ...s, playerCurrentHp: s.playerCurrentHp - 10 }) }] };
    const paid = applyEventChoice(initial, event, 0);
    const restored = RunStateSchema.parse(JSON.parse(JSON.stringify(paid)));
    expect(restored.pendingEventPurge).toBe(true);
    expect(deriveInitialPhase(restored)).toBe("SPECIAL");
    expect(applyEventChoice(restored, event, 0)).toBe(restored);
    const finished = removeCardFromRunDeck(restored, restored.deck[0]!.instanceId);
    expect(finished.pendingEventPurge).toBe(false);
    expect(finished.deck.length).toBe(initial.deck.length - 1);
    expect(finished.playerCurrentHp).toBe(50);
  });
  it("keeps the last deck card when an event requires a purge", () => {
    const run = makeTestRunState({ deck: [{ instanceId: "last", definitionId: "strike", upgraded: false }] });
    expect(isEventChoiceAvailable(run, { label: "purge", description: "purge", requiresPurge: true, apply: s => s })).toBe(false);
  });
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
    expect(applyEventChoice(result, paidEvent, 0)).toBe(result);
  });
});
