import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GameProvider, useGame } from "./game-provider";
import { makeTestRunState } from "@/test/factories/game-state";
import {
  buildAllyDefsMap,
  buildCardDefsMap,
  buildEnemyDefsMap,
} from "@/game/data";
import type { RunState } from "@/game/schemas/run-state";

afterEach(cleanup);
const enemyDefs = buildEnemyDefsMap();
function CombatProbe({ legacy }: { legacy: RunState }) {
  const { state, dispatch } = useGame();
  return (
    <>
      <output data-testid="count">{state.analytics.combatsStarted}</output>
      <output data-testid="combat">{state.combat ? "started" : "none"}</output>
      <button
        onClick={() =>
          dispatch({
            type: "START_COMBAT",
            payload: { enemyIds: [enemyDefs.keys().next().value!] },
          })
        }
      >
        Fight
      </button>
      <button onClick={() => dispatch({ type: "LOAD_RUN", payload: legacy })}>
        Reload snapshot
      </button>
    </>
  );
}

describe("legacy snapshots in the browser query cache", () => {
  it.each([undefined, { combatsStarted: 4 }])(
    "can start combat from incomplete analytics (%j)",
    (analytics) => {
      const legacy = {
        ...makeTestRunState(),
        analytics,
      } as unknown as RunState;
      render(
        <GameProvider
          initialState={legacy}
          cardDefs={buildCardDefsMap()}
          enemyDefs={enemyDefs}
          allyDefs={buildAllyDefsMap()}
        >
          <CombatProbe legacy={legacy} />
        </GameProvider>
      );
      fireEvent.click(screen.getByText("Fight"));
      expect(screen.getByTestId("count")).toHaveTextContent(
        String((analytics?.combatsStarted ?? 0) + 1)
      );
      expect(screen.getByTestId("combat")).toHaveTextContent("started");
      fireEvent.click(screen.getByText("Reload snapshot"));
      fireEvent.click(screen.getByText("Fight"));
      expect(screen.getByTestId("count")).toHaveTextContent(
        String((analytics?.combatsStarted ?? 0) + 1)
      );
    }
  );
});
