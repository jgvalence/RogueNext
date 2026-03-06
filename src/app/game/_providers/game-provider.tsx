"use client";

import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  type ReactNode,
} from "react";
import type { RunState } from "@/game/schemas/run-state";
import type { CardDefinition } from "@/game/schemas/cards";
import type { EnemyDefinition, AllyDefinition } from "@/game/schemas/entities";
import { createRNG, type RNG } from "@/game/engine/rng";
import { createGameReducer, type GameAction } from "./game-reducer";

interface GameContextValue {
  state: RunState;
  dispatch: (action: GameAction) => void;
  cardDefs: Map<string, CardDefinition>;
  enemyDefs: Map<string, EnemyDefinition>;
  allyDefs: Map<string, AllyDefinition>;
  rng: RNG;
}

const GameContext = createContext<GameContextValue | null>(null);

interface GameProviderProps {
  children: ReactNode;
  initialState: RunState;
  cardDefs: Map<string, CardDefinition>;
  enemyDefs: Map<string, EnemyDefinition>;
  allyDefs: Map<string, AllyDefinition>;
}

export function GameProvider({
  children,
  initialState,
  cardDefs,
  enemyDefs,
  allyDefs,
}: GameProviderProps) {
  const rng = useMemo(
    () => createRNG(initialState.seed + "-" + initialState.currentRoom),
    [initialState.seed, initialState.currentRoom]
  );

  const reducer = useMemo(
    () => createGameReducer({ cardDefs, enemyDefs, allyDefs, rng }),
    [cardDefs, enemyDefs, allyDefs, rng]
  );

  const [state, dispatch] = useReducer(reducer, initialState);

  const contextValue = useMemo(
    () => ({
      state,
      dispatch,
      cardDefs,
      enemyDefs,
      allyDefs,
      rng,
    }),
    [state, cardDefs, enemyDefs, allyDefs, rng]
  );

  return (
    <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return ctx;
}
