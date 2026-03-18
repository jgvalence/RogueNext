import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeTestRunState } from "@/test/factories/game-state";
import type { GamePhase } from "../_services/run-phase";
import { useStableSpecialRoomType } from "./use-stable-special-room-type";

function renderSpecialRoomTypeHook(
  phase: GamePhase,
  state = makeTestRunState()
) {
  return renderHook(
    ({ currentPhase, currentState }) =>
      useStableSpecialRoomType(currentPhase, currentState),
    {
      initialProps: {
        currentPhase: phase,
        currentState: state,
      },
    }
  );
}

describe("useStableSpecialRoomType", () => {
  it("keeps the entered special room type while an event outcome advances currentRoom", () => {
    const enteredEventState = makeTestRunState({
      currentRoom: 3,
      map: [
        [
          {
            index: 0,
            type: "COMBAT",
            completed: false,
            enemyIds: ["ink_slime"],
            isElite: false,
          },
        ],
        [
          {
            index: 1,
            type: "COMBAT",
            completed: false,
            enemyIds: ["ink_slime"],
            isElite: false,
          },
        ],
        [
          {
            index: 2,
            type: "COMBAT",
            completed: false,
            enemyIds: ["ink_slime"],
            isElite: false,
          },
        ],
        [
          {
            index: 3,
            type: "SPECIAL",
            specialType: "EVENT",
            completed: true,
            isElite: false,
          },
        ],
        [
          {
            index: 4,
            type: "SPECIAL",
            specialType: "HEAL",
            completed: false,
            isElite: false,
          },
        ],
      ],
    });

    const { result, rerender } = renderSpecialRoomTypeHook(
      "SPECIAL",
      enteredEventState
    );

    expect(result.current).toBe("EVENT");

    const advancedRoomState = {
      ...enteredEventState,
      currentRoom: 4,
    };

    rerender({
      currentPhase: "SPECIAL",
      currentState: advancedRoomState,
    });

    expect(result.current).toBe("EVENT");

    rerender({
      currentPhase: "MAP",
      currentState: advancedRoomState,
    });

    expect(result.current).toBeUndefined();
  });
});
