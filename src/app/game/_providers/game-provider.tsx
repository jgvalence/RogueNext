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
import type { EnemyDefinition } from "@/game/schemas/entities";
import type { InkPowerType } from "@/game/schemas/enums";
import { createRNG, type RNG } from "@/game/engine/rng";
import { playCard } from "@/game/engine/cards";
import {
  initCombat,
  startPlayerTurn,
  endPlayerTurn,
  executeAlliesEnemiesTurn,
  checkCombatEnd,
} from "@/game/engine/combat";
import { applyInkPower } from "@/game/engine/ink";
import { applyRelicsOnCombatStart } from "@/game/engine/relics";
import {
  selectRoom,
  completeCombat,
  applyHealRoom,
  upgradeCardInDeck,
  applyEventChoice,
  type GameEvent,
} from "@/game/engine/run";
import { addCardToRunDeck, generateCombatRewards } from "@/game/engine/rewards";
import type { CombatRewards } from "@/game/engine/rewards";
import { buyShopItem, type ShopItem } from "@/game/engine/merchant";

// ============================
// Types
// ============================

export type GameAction =
  | { type: "LOAD_RUN"; payload: RunState }
  | {
      type: "START_COMBAT";
      payload: { enemyIds: string[] };
    }
  | {
      type: "PLAY_CARD";
      payload: {
        instanceId: string;
        targetId: string | null;
        useInked: boolean;
      };
    }
  | { type: "END_TURN" }
  | {
      type: "USE_INK_POWER";
      payload: { power: InkPowerType; targetId: string | null };
    }
  | { type: "SELECT_ROOM"; payload: { choiceIndex: number } }
  | { type: "PICK_CARD_REWARD"; payload: { definitionId: string } }
  | { type: "SKIP_CARD_REWARD" }
  | { type: "COMPLETE_COMBAT"; payload: { goldReward: number } }
  | { type: "APPLY_HEAL_ROOM" }
  | { type: "ADVANCE_ROOM" }
  | { type: "BUY_SHOP_ITEM"; payload: { item: ShopItem } }
  | { type: "UPGRADE_CARD"; payload: { cardInstanceId: string } }
  | { type: "APPLY_EVENT"; payload: { event: GameEvent; choiceIndex: number } };

interface GameContextValue {
  state: RunState;
  dispatch: (action: GameAction) => void;
  cardDefs: Map<string, CardDefinition>;
  enemyDefs: Map<string, EnemyDefinition>;
  rng: RNG;
  rewards: CombatRewards | null;
}

const GameContext = createContext<GameContextValue | null>(null);

// ============================
// Reducer
// ============================

interface ReducerDeps {
  cardDefs: Map<string, CardDefinition>;
  enemyDefs: Map<string, EnemyDefinition>;
  rng: RNG;
  setRewards: (rewards: CombatRewards | null) => void;
}

function createGameReducer(deps: ReducerDeps) {
  return function gameReducer(state: RunState, action: GameAction): RunState {
    const { cardDefs, enemyDefs, rng } = deps;

    switch (action.type) {
      case "LOAD_RUN":
        return action.payload;

      case "START_COMBAT": {
        let combat = initCombat(
          state,
          action.payload.enemyIds,
          enemyDefs,
          cardDefs,
          rng
        );
        combat = applyRelicsOnCombatStart(combat, state.relicIds);
        return { ...state, combat };
      }

      case "PLAY_CARD": {
        if (!state.combat || state.combat.phase !== "PLAYER_TURN") return state;
        let combat = playCard(
          state.combat,
          action.payload.instanceId,
          action.payload.targetId,
          action.payload.useInked,
          cardDefs,
          rng
        );
        combat = checkCombatEnd(combat);
        return { ...state, combat };
      }

      case "END_TURN": {
        if (!state.combat || state.combat.phase !== "PLAYER_TURN") return state;
        let combat = endPlayerTurn(state.combat);
        combat = executeAlliesEnemiesTurn(combat, enemyDefs, rng);

        if (combat.phase !== "COMBAT_WON" && combat.phase !== "COMBAT_LOST") {
          combat = startPlayerTurn(combat, rng);
        }

        return { ...state, combat };
      }

      case "USE_INK_POWER": {
        if (!state.combat || state.combat.phase !== "PLAYER_TURN") return state;
        const combat = applyInkPower(
          state.combat,
          action.payload.power,
          action.payload.targetId,
          cardDefs,
          rng
        );
        return { ...state, combat };
      }

      case "SELECT_ROOM":
        return selectRoom(state, action.payload.choiceIndex);

      case "COMPLETE_COMBAT": {
        if (!state.combat) return state;

        // Generate rewards
        const isBoss = state.currentRoom === state.map.length - 1;
        const rewards = generateCombatRewards(
          state.floor,
          state.currentRoom,
          isBoss,
          [...cardDefs.values()],
          rng
        );
        deps.setRewards(rewards);

        return completeCombat(state, state.combat, action.payload.goldReward);
      }

      case "PICK_CARD_REWARD":
        deps.setRewards(null);
        return addCardToRunDeck(state, action.payload.definitionId);

      case "SKIP_CARD_REWARD":
        deps.setRewards(null);
        return state;

      case "APPLY_HEAL_ROOM":
        return applyHealRoom(state);

      case "ADVANCE_ROOM":
        return { ...state, currentRoom: state.currentRoom + 1 };

      case "BUY_SHOP_ITEM": {
        const result = buyShopItem(state, action.payload.item);
        return result ?? state;
      }

      case "UPGRADE_CARD":
        return upgradeCardInDeck(state, action.payload.cardInstanceId);

      case "APPLY_EVENT":
        return applyEventChoice(
          state,
          action.payload.event,
          action.payload.choiceIndex
        );

      default:
        return state;
    }
  };
}

// ============================
// Provider
// ============================

interface GameProviderProps {
  children: ReactNode;
  initialState: RunState;
  cardDefs: Map<string, CardDefinition>;
  enemyDefs: Map<string, EnemyDefinition>;
}

export function GameProvider({
  children,
  initialState,
  cardDefs,
  enemyDefs,
}: GameProviderProps) {
  const rng = useMemo(
    () => createRNG(initialState.seed + "-" + initialState.currentRoom),
    [initialState.seed, initialState.currentRoom]
  );

  // Track combat rewards in a ref-like pattern via state
  let currentRewards: CombatRewards | null = null;
  const setRewards = (r: CombatRewards | null) => {
    currentRewards = r;
  };

  const reducer = useMemo(
    () => createGameReducer({ cardDefs, enemyDefs, rng, setRewards }),
    [cardDefs, enemyDefs, rng]
  );

  const [state, dispatch] = useReducer(reducer, initialState);

  const contextValue = useMemo(
    () => ({
      state,
      dispatch,
      cardDefs,
      enemyDefs,
      rng,
      rewards: currentRewards,
    }),
    [state, dispatch, cardDefs, enemyDefs, rng, currentRewards]
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
