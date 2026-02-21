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
import type {
  InkPowerType,
  BiomeType,
  BiomeResource,
} from "@/game/schemas/enums";
import { GAME_CONSTANTS } from "@/game/constants";
import { createRNG, type RNG } from "@/game/engine/rng";
import { playCard } from "@/game/engine/cards";
import {
  initCombat,
  startPlayerTurn,
  endPlayerTurn,
  executeAlliesEnemiesTurn,
  checkCombatEnd,
} from "@/game/engine/combat";
import {
  executeAlliesTurn,
  executeOneEnemyTurn,
  finalizeEnemyRound,
} from "@/game/engine/enemies";
import { applyInkPower } from "@/game/engine/ink";
import { applyRelicsOnCombatStart } from "@/game/engine/relics";
import { drawCards } from "@/game/engine/deck";
import {
  selectRoom,
  completeCombat,
  advanceFloor,
  applyHealRoom,
  upgradeCardInDeck,
  applyEventChoice,
  type GameEvent,
} from "@/game/engine/run";
import { addCardToRunDeck } from "@/game/engine/rewards";
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
  | { type: "BEGIN_ENEMY_TURN" }
  | { type: "EXECUTE_ENEMY_STEP"; payload: { enemyInstanceId: string } }
  | { type: "FINALIZE_ENEMY_TURN" }
  | {
      type: "USE_INK_POWER";
      payload: { power: InkPowerType; targetId: string | null };
    }
  | { type: "SELECT_ROOM"; payload: { choiceIndex: number } }
  | { type: "PICK_CARD_REWARD"; payload: { definitionId: string } }
  | { type: "SKIP_CARD_REWARD" }
  | {
      type: "COMPLETE_COMBAT";
      payload: {
        goldReward: number;
        biomeResources?: Partial<Record<BiomeResource, number>>;
      };
    }
  | { type: "PICK_RELIC_REWARD"; payload: { relicId: string } }
  | { type: "PICK_ALLY_REWARD"; payload: { allyId: string } }
  | { type: "GAIN_MAX_HP"; payload: { amount: number } }
  | { type: "APPLY_HEAL_ROOM" }
  | { type: "ADVANCE_ROOM" }
  | { type: "BUY_SHOP_ITEM"; payload: { item: ShopItem } }
  | { type: "CHEAT_KILL_ENEMY"; payload: { enemyInstanceId: string } }
  | { type: "UPGRADE_CARD"; payload: { cardInstanceId: string } }
  | { type: "APPLY_EVENT"; payload: { event: GameEvent; choiceIndex: number } }
  | { type: "CHOOSE_BIOME"; payload: { biome: BiomeType } };

interface GameContextValue {
  state: RunState;
  dispatch: (action: GameAction) => void;
  cardDefs: Map<string, CardDefinition>;
  enemyDefs: Map<string, EnemyDefinition>;
  allyDefs: Map<string, AllyDefinition>;
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
  allyDefs: Map<string, AllyDefinition>;
  rng: RNG;
  setRewards: (rewards: CombatRewards | null) => void;
}

function createGameReducer(deps: ReducerDeps) {
  return function gameReducer(state: RunState, action: GameAction): RunState {
    const { cardDefs, enemyDefs, allyDefs, rng } = deps;

    switch (action.type) {
      case "LOAD_RUN":
        return action.payload;

      case "START_COMBAT": {
        let combat = initCombat(
          state,
          action.payload.enemyIds,
          enemyDefs,
          allyDefs,
          cardDefs,
          rng
        );
        combat = applyRelicsOnCombatStart(combat, state.relicIds);

        // initCombat already drew the initial hand before relics are applied.
        // If relics increased drawCount (e.g. Bookmark), top up opening hand.
        if (combat.hand.length < combat.player.drawCount) {
          combat = drawCards(
            combat,
            combat.player.drawCount - combat.hand.length,
            rng
          );
        }

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
        combat = executeAlliesEnemiesTurn(combat, enemyDefs, allyDefs, rng);

        if (combat.phase !== "COMBAT_WON" && combat.phase !== "COMBAT_LOST") {
          combat = startPlayerTurn(combat, rng, state.relicIds);
        }

        return { ...state, combat };
      }

      // ── Step-by-step enemy turn (for animations) ──────────────────
      case "BEGIN_ENEMY_TURN": {
        if (!state.combat || state.combat.phase !== "PLAYER_TURN") return state;
        let combat = endPlayerTurn(state.combat);
        // Reset enemy blocks at start of their turn
        combat = {
          ...combat,
          enemies: combat.enemies.map((e) => ({ ...e, block: 0 })),
        };
        combat = executeAlliesTurn(combat, allyDefs, rng);
        combat = checkCombatEnd(combat);
        return { ...state, combat };
      }

      case "EXECUTE_ENEMY_STEP": {
        if (!state.combat) return state;
        if (
          state.combat.phase === "COMBAT_WON" ||
          state.combat.phase === "COMBAT_LOST"
        )
          return state;
        const { enemyInstanceId } = action.payload;
        const enemy = state.combat.enemies.find(
          (e) => e.instanceId === enemyInstanceId
        );
        if (!enemy || enemy.currentHp <= 0) return state;
        const def = enemyDefs.get(enemy.definitionId);
        if (!def) return state;
        let combat = executeOneEnemyTurn(
          state.combat,
          enemy,
          def,
          rng,
          enemyDefs
        );
        combat = checkCombatEnd(combat);
        return { ...state, combat };
      }

      case "FINALIZE_ENEMY_TURN": {
        if (!state.combat) return state;
        if (
          state.combat.phase === "COMBAT_WON" ||
          state.combat.phase === "COMBAT_LOST"
        )
          return state;
        let combat = finalizeEnemyRound(state.combat);
        combat = checkCombatEnd(combat);
        if (combat.phase !== "COMBAT_WON" && combat.phase !== "COMBAT_LOST") {
          combat = startPlayerTurn(combat, rng, state.relicIds);
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
        return completeCombat(
          state,
          state.combat,
          action.payload.goldReward,
          rng,
          action.payload.biomeResources,
          [...cardDefs.values()],
          state.relicIds
        );
      }

      case "CHOOSE_BIOME":
        return advanceFloor(state, action.payload.biome, rng, [
          ...cardDefs.values(),
        ]);

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

      case "CHEAT_KILL_ENEMY": {
        if (process.env.NODE_ENV === "production") return state;
        if (!state.combat) return state;
        if (
          state.combat.phase === "COMBAT_WON" ||
          state.combat.phase === "COMBAT_LOST"
        ) {
          return state;
        }

        const combat = checkCombatEnd({
          ...state.combat,
          enemies: state.combat.enemies.map((enemy) =>
            enemy.instanceId === action.payload.enemyInstanceId
              ? { ...enemy, currentHp: 0, block: 0 }
              : enemy
          ),
        });

        return { ...state, combat };
      }

      case "UPGRADE_CARD":
        return upgradeCardInDeck(state, action.payload.cardInstanceId);

      case "APPLY_EVENT":
        return applyEventChoice(
          state,
          action.payload.event,
          action.payload.choiceIndex
        );

      case "PICK_RELIC_REWARD":
        return {
          ...state,
          relicIds: [...state.relicIds, action.payload.relicId],
        };

      case "GAIN_MAX_HP":
        return {
          ...state,
          playerMaxHp: state.playerMaxHp + action.payload.amount,
          playerCurrentHp: state.playerCurrentHp + action.payload.amount,
        };

      case "PICK_ALLY_REWARD": {
        const maxAllies = Math.min(
          GAME_CONSTANTS.MAX_ALLIES,
          Math.max(0, state.metaBonuses?.allySlots ?? 0)
        );
        if (state.allyIds.includes(action.payload.allyId)) return state;
        if (state.allyIds.length >= maxAllies) return state;
        return {
          ...state,
          allyIds: [...state.allyIds, action.payload.allyId],
        };
      }

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

  // Track combat rewards in a ref-like pattern via state
  let currentRewards: CombatRewards | null = null;
  const setRewards = (r: CombatRewards | null) => {
    currentRewards = r;
  };

  const reducer = useMemo(
    () => createGameReducer({ cardDefs, enemyDefs, allyDefs, rng, setRewards }),
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
      rewards: currentRewards,
    }),
    [state, dispatch, cardDefs, enemyDefs, allyDefs, rng, currentRewards]
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
