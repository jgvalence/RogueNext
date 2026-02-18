"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getActiveRunAction } from "@/server/actions/run";
import {
  useCardDefsMap,
  useEnemyDefinitions,
} from "@/lib/query/hooks/use-game-data";
import { GameProvider, useGame } from "../_providers/game-provider";
import { useAutoSave } from "../_hooks/use-auto-save";
import { GameLayout } from "../_components/shared/GameLayout";
import { CombatView } from "../_components/combat/CombatView";
import { FloorMap } from "../_components/map/FloorMap";
import { RewardScreen } from "../_components/rewards/RewardScreen";
import { ShopView } from "../_components/merchant/ShopView";
import { SpecialRoomView } from "../_components/special/SpecialRoomView";
import type { EnemyDefinition } from "@/game/schemas/entities";
import { GAME_CONSTANTS } from "@/game/constants";
import { endRunAction } from "@/server/actions/run";
import {
  generateCombatRewards,
  type CombatRewards,
} from "@/game/engine/rewards";
import { createRNG } from "@/game/engine/rng";
import type { CardDefinition } from "@/game/schemas/cards";

export default function RunPage() {
  const params = useParams<{ runId: string }>();
  const { data: cardDefsMap, isLoading: cardsLoading } = useCardDefsMap();
  const { data: enemyList, isLoading: enemiesLoading } = useEnemyDefinitions();

  const { data: runData, isLoading: runLoading } = useQuery({
    queryKey: ["game", "run", params.runId],
    queryFn: async () => {
      const result = await getActiveRunAction();
      if (!result.success) throw new Error(result.error.message);
      return result.data.run;
    },
  });

  const enemyDefs = useMemo(() => {
    if (!enemyList) return new Map<string, EnemyDefinition>();
    return new Map(enemyList.map((e) => [e.id, e]));
  }, [enemyList]);

  if (cardsLoading || enemiesLoading || runLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p>Loading game...</p>
      </div>
    );
  }

  if (!runData || !cardDefsMap || cardDefsMap.size === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p>Run not found</p>
      </div>
    );
  }

  return (
    <GameProvider
      initialState={runData.state}
      cardDefs={cardDefsMap}
      enemyDefs={enemyDefs}
    >
      <GameContent cardDefs={cardDefsMap} enemyDefs={enemyDefs} />
    </GameProvider>
  );
}

type GamePhase =
  | "MAP"
  | "COMBAT"
  | "REWARDS"
  | "MERCHANT"
  | "SPECIAL"
  | "VICTORY"
  | "DEFEAT";

function GameContent({
  cardDefs,
  enemyDefs,
}: {
  cardDefs: Map<string, CardDefinition>;
  enemyDefs: Map<string, EnemyDefinition>;
}) {
  const { state, dispatch, rng } = useGame();
  const router = useRouter();
  const [phase, setPhase] = useState<GamePhase>("MAP");
  const [rewards, setRewards] = useState<CombatRewards | null>(null);

  useAutoSave(state);

  // Determine current room info
  const currentRoomChoices = state.map[state.currentRoom];

  // Start combat when room is selected and is COMBAT type
  const handleSelectRoom = useCallback(
    (choiceIndex: number) => {
      const room = currentRoomChoices?.[choiceIndex];
      if (!room) return;

      dispatch({ type: "SELECT_ROOM", payload: { choiceIndex } });

      if (room.type === "COMBAT" && room.enemyIds) {
        dispatch({
          type: "START_COMBAT",
          payload: { enemyIds: room.enemyIds },
        });
        setPhase("COMBAT");
      } else if (room.type === "MERCHANT") {
        setPhase("MERCHANT");
      } else if (room.type === "SPECIAL") {
        setPhase("SPECIAL");
      }
    },
    [currentRoomChoices, dispatch]
  );

  // Handle combat end
  useEffect(() => {
    if (!state.combat) return;

    if (state.combat.phase === "COMBAT_WON") {
      const isBoss =
        state.currentRoom - 1 === GAME_CONSTANTS.BOSS_ROOM_INDEX ||
        state.currentRoom === GAME_CONSTANTS.BOSS_ROOM_INDEX;

      const combatRng = createRNG(state.seed + "-rewards-" + state.currentRoom);
      const combatRewards = generateCombatRewards(
        state.floor,
        state.currentRoom,
        isBoss,
        [...cardDefs.values()],
        combatRng
      );
      setRewards(combatRewards);

      dispatch({
        type: "COMPLETE_COMBAT",
        payload: { goldReward: combatRewards.gold },
      });
      setPhase("REWARDS");
    }

    if (state.combat.phase === "COMBAT_LOST") {
      setPhase("DEFEAT");
    }
  }, [state.combat?.phase]);

  // Check for run completion
  useEffect(() => {
    if (state.status === "VICTORY") {
      setPhase("VICTORY");
    }
  }, [state.status]);

  // After rewards, go back to map
  const handlePickCard = useCallback(
    (definitionId: string) => {
      dispatch({ type: "PICK_CARD_REWARD", payload: { definitionId } });
      setRewards(null);

      if (state.status === "VICTORY") {
        setPhase("VICTORY");
      } else {
        setPhase("MAP");
      }
    },
    [dispatch, state.status]
  );

  const handleSkipReward = useCallback(() => {
    dispatch({ type: "SKIP_CARD_REWARD" });
    setRewards(null);

    if (state.status === "VICTORY") {
      setPhase("VICTORY");
    } else {
      setPhase("MAP");
    }
  }, [dispatch, state.status]);

  // Special room actions
  const handleHeal = useCallback(() => {
    dispatch({ type: "APPLY_HEAL_ROOM" });
    setPhase("MAP");
  }, [dispatch]);

  const handleEndRun = useCallback(
    async (status: "VICTORY" | "DEFEAT" | "ABANDONED") => {
      await endRunAction({ runId: state.runId, status });
      router.push("/game");
    },
    [state.runId, router]
  );

  return (
    <GameLayout>
      <div className="flex min-h-[calc(100vh-3rem)] flex-col">
        {phase === "MAP" && (
          <FloorMap
            map={state.map}
            currentRoom={state.currentRoom}
            onSelectRoom={handleSelectRoom}
          />
        )}

        {phase === "COMBAT" && state.combat && (
          <CombatView
            combat={state.combat}
            cardDefs={cardDefs}
            enemyDefs={enemyDefs}
            onPlayCard={(instanceId, targetId, useInked) =>
              dispatch({
                type: "PLAY_CARD",
                payload: { instanceId, targetId, useInked },
              })
            }
            onEndTurn={() => dispatch({ type: "END_TURN" })}
            onUseInkPower={(power, targetId) =>
              dispatch({
                type: "USE_INK_POWER",
                payload: { power, targetId },
              })
            }
          />
        )}

        {phase === "REWARDS" && rewards && (
          <RewardScreen
            gold={rewards.gold}
            cardChoices={rewards.cardChoices}
            onPickCard={handlePickCard}
            onSkip={handleSkipReward}
          />
        )}

        {phase === "MERCHANT" && (
          <ShopView
            floor={state.floor}
            gold={state.gold}
            relicIds={state.relicIds}
            cardDefs={cardDefs}
            rng={rng}
            onBuy={(item) =>
              dispatch({ type: "BUY_SHOP_ITEM", payload: { item } })
            }
            onLeave={() => {
              dispatch({ type: "ADVANCE_ROOM" });
              setPhase("MAP");
            }}
          />
        )}

        {phase === "SPECIAL" && (
          <SpecialRoomView
            playerCurrentHp={state.playerCurrentHp}
            playerMaxHp={state.playerMaxHp}
            gold={state.gold}
            deck={state.deck}
            cardDefs={cardDefs}
            rng={rng}
            onHeal={handleHeal}
            onUpgrade={(cardInstanceId) => {
              dispatch({ type: "UPGRADE_CARD", payload: { cardInstanceId } });
              setPhase("MAP");
            }}
            onEventChoice={(event, choiceIndex) => {
              dispatch({
                type: "APPLY_EVENT",
                payload: { event, choiceIndex },
              });
              setPhase("MAP");
            }}
            onSkip={() => {
              dispatch({ type: "ADVANCE_ROOM" });
              setPhase("MAP");
            }}
          />
        )}

        {phase === "VICTORY" && (
          <div className="flex flex-col items-center gap-4 py-16">
            <h2 className="text-4xl font-bold text-green-400">Victory!</h2>
            <p className="text-gray-400">You conquered the Chapter Guardian!</p>
            <div className="space-y-1 text-sm text-gray-500">
              <p>Gold earned: {state.gold}</p>
              <p>Deck size: {state.deck.length} cards</p>
              <p>Relics: {state.relicIds.length}</p>
            </div>
            <button
              className="rounded-lg bg-blue-700 px-6 py-3 font-bold text-white hover:bg-blue-600"
              onClick={() => handleEndRun("VICTORY")}
            >
              Return to Menu
            </button>
          </div>
        )}

        {phase === "DEFEAT" && (
          <div className="flex flex-col items-center gap-4 py-16">
            <h2 className="text-4xl font-bold text-red-400">Defeat</h2>
            <p className="text-gray-400">Your story ends here...</p>
            <div className="space-y-1 text-sm text-gray-500">
              <p>
                Reached: Room {state.currentRoom}/
                {GAME_CONSTANTS.ROOMS_PER_FLOOR}
              </p>
              <p>Gold: {state.gold}</p>
            </div>
            <button
              className="rounded-lg bg-blue-700 px-6 py-3 font-bold text-white hover:bg-blue-600"
              onClick={() => handleEndRun("DEFEAT")}
            >
              Return to Menu
            </button>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
