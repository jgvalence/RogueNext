"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getActiveRunAction } from "@/server/actions/run";
import {
  useAllyDefinitions,
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
import { BiomeSelectScreen } from "../_components/biome/BiomeSelectScreen";
import { PreBossRoomView } from "../_components/preboss/PreBossRoomView";
import type { AllyDefinition, EnemyDefinition } from "@/game/schemas/entities";
import type { BiomeType } from "@/game/schemas/enums";
import { GAME_CONSTANTS } from "@/game/constants";
import { endRunAction } from "@/server/actions/run";
import {
  generateCombatRewards,
  type CombatRewards,
} from "@/game/engine/rewards";
import { createRNG } from "@/game/engine/rng";
import type { CardDefinition } from "@/game/schemas/cards";
import { playSound } from "@/lib/sound";
import { startMusic, stopMusic } from "@/lib/music";

export default function RunPage() {
  const params = useParams<{ runId: string }>();
  const { data: cardDefsMap, isLoading: cardsLoading } = useCardDefsMap();
  const { data: enemyList, isLoading: enemiesLoading } = useEnemyDefinitions();
  const { data: allyList, isLoading: alliesLoading } = useAllyDefinitions();

  const { data: runData, isLoading: runLoading } = useQuery({
    queryKey: ["game", "run", params.runId],
    queryFn: async () => {
      const result = await getActiveRunAction();
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
  });

  const enemyDefs = useMemo(() => {
    if (!enemyList) return new Map<string, EnemyDefinition>();
    return new Map(enemyList.map((e) => [e.id, e]));
  }, [enemyList]);

  const allyDefs = useMemo(() => {
    if (!allyList) return new Map<string, AllyDefinition>();
    return new Map(allyList.map((a) => [a.id, a]));
  }, [allyList]);

  if (cardsLoading || enemiesLoading || alliesLoading || runLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p>Loading game...</p>
      </div>
    );
  }

  if (!runData?.run || !cardDefsMap || cardDefsMap.size === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p>Run not found</p>
      </div>
    );
  }

  return (
    <GameProvider
      initialState={runData.run.state}
      cardDefs={cardDefsMap}
      enemyDefs={enemyDefs}
      allyDefs={allyDefs}
    >
      <GameContent
        cardDefs={cardDefsMap}
        enemyDefs={enemyDefs}
        isAdmin={runData.userRole === "ADMIN"}
      />
    </GameProvider>
  );
}

type GamePhase =
  | "MAP"
  | "COMBAT"
  | "REWARDS"
  | "MERCHANT"
  | "SPECIAL"
  | "PRE_BOSS"
  | "BIOME_SELECT"
  | "VICTORY"
  | "DEFEAT";

function GameContent({
  cardDefs,
  enemyDefs,
  isAdmin,
}: {
  cardDefs: Map<string, CardDefinition>;
  enemyDefs: Map<string, EnemyDefinition>;
  isAdmin: boolean;
}) {
  const { state, dispatch, rng } = useGame();
  const router = useRouter();
  const [phase, setPhase] = useState<GamePhase>("MAP");
  const [rewards, setRewards] = useState<CombatRewards | null>(null);
  const [isBossRewards, setIsBossRewards] = useState(false);
  const [isEliteRewards, setIsEliteRewards] = useState(false);
  const [actingEnemyId, setActingEnemyId] = useState<string | null>(null);
  const [attackingEnemyId, setAttackingEnemyId] = useState<string | null>(null);
  const enemyTurnCancelledRef = useRef(false);
  const runEndedRef = useRef(false);
  // Always-current ref to avoid stale closures in callbacks
  const stateRef = useRef(state);
  stateRef.current = state;
  const isDevBuild = process.env.NODE_ENV !== "production";

  useAutoSave(state);

  // Music — start/stop based on phase, clean up on unmount
  useEffect(() => {
    if (phase === "COMBAT") startMusic("combat");
    else if (phase === "MAP" || phase === "REWARDS" || phase === "MERCHANT" || phase === "SPECIAL" || phase === "PRE_BOSS" || phase === "BIOME_SELECT") startMusic("map");
    else stopMusic(); // VICTORY or DEFEAT
  }, [phase]);

  useEffect(() => () => stopMusic(0.3), []);

  // Determine current room info
  const currentRoomChoices = state.map[state.currentRoom];

  // Async end-turn with step-by-step enemy animation
  const handleEndTurn = useCallback(async () => {
    if (!state.combat || state.combat.phase !== "PLAYER_TURN") return;

    const sleep = (ms: number) =>
      new Promise<void>((res) => setTimeout(res, ms));

    // Collect living enemies in speed order (mirrors the engine logic)
    const sortedEnemies = [...state.combat.enemies]
      .filter((e) => e.currentHp > 0)
      .sort((a, b) => b.speed - a.speed);

    enemyTurnCancelledRef.current = false;
    dispatch({ type: "BEGIN_ENEMY_TURN" });
    await sleep(150);

    for (const enemy of sortedEnemies) {
      if (enemyTurnCancelledRef.current) break;

      // Highlight the acting enemy
      setActingEnemyId(enemy.instanceId);
      await sleep(350);

      if (enemyTurnCancelledRef.current) break;

      // Trigger lunge + resolve the action
      setAttackingEnemyId(enemy.instanceId);
      dispatch({
        type: "EXECUTE_ENEMY_STEP",
        payload: { enemyInstanceId: enemy.instanceId },
      });
      await sleep(300);

      setAttackingEnemyId(null);
      setActingEnemyId(null);
      await sleep(150);
    }

    if (!enemyTurnCancelledRef.current) {
      dispatch({ type: "FINALIZE_ENEMY_TURN" });
    }
    setActingEnemyId(null);
    setAttackingEnemyId(null);
  }, [state.combat, dispatch]);

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
      } else if (room.type === "PRE_BOSS") {
        setPhase("PRE_BOSS");
      }
    },
    [currentRoomChoices, dispatch]
  );

  // Handle combat end
  useEffect(() => {
    if (!state.combat) return;

    if (state.combat.phase === "COMBAT_WON") {
      const isBoss = state.currentRoom === GAME_CONSTANTS.BOSS_ROOM_INDEX;

      // Find the selected room to get enemy count and elite status
      const roomChoices = state.map[state.currentRoom];
      const selectedRoom = roomChoices?.find((r) => r.completed) ?? roomChoices?.[0];
      const enemyCount = selectedRoom?.enemyIds?.length ?? 1;
      const isElite = selectedRoom?.isElite ?? false;

      const combatRng = createRNG(state.seed + "-rewards-" + state.currentRoom);
      const combatRewards = generateCombatRewards(
        state.floor,
        state.currentRoom,
        isBoss,
        isElite,
        enemyCount,
        [...cardDefs.values()],
        combatRng,
        state.currentBiome,
        state.relicIds,
        state.unlockedCardIds,
        state.allyIds,
        state.metaBonuses?.allySlots ?? 0
      );
      setRewards(combatRewards);
      setIsBossRewards(isBoss);
      setIsEliteRewards(isElite);

      // TEMPORARY: play victory sound (file: /public/sounds/result/victory.ogg)
      playSound("VICTORY", 0.8);
      dispatch({
        type: "COMPLETE_COMBAT",
        payload: {
          goldReward: combatRewards.gold,
          biomeResources: combatRewards.biomeResources,
        },
      });
      setPhase("REWARDS");
    }

    if (state.combat.phase === "COMBAT_LOST") {
      enemyTurnCancelledRef.current = true;
      setActingEnemyId(null);
      setAttackingEnemyId(null);
      // TEMPORARY: play defeat sound (file: /public/sounds/result/defeat.ogg)
      playSound("DEFEAT", 0.8);
      // Finalise immediately so the run won't appear as "IN_PROGRESS" in the DB
      // if the player navigates away before clicking "Return to Menu".
      if (!runEndedRef.current) {
        runEndedRef.current = true;
        void endRunAction({
          runId: stateRef.current.runId,
          status: "DEFEAT",
          earnedResources: stateRef.current.earnedResources,
        });
      }
      setPhase("DEFEAT");
    }
  }, [state.combat?.phase]);

  // After rewards, go back to map — or biome select — or victory
  const handlePickCard = useCallback(
    (definitionId: string) => {
      dispatch({ type: "PICK_CARD_REWARD", payload: { definitionId } });
      setRewards(null);
      if (!isBossRewards) {
        setPhase("MAP");
      } else if (state.pendingBiomeChoices !== null) {
        setPhase("BIOME_SELECT");
      } else {
        if (!runEndedRef.current) {
          runEndedRef.current = true;
          void endRunAction({ runId: stateRef.current.runId, status: "VICTORY", earnedResources: stateRef.current.earnedResources });
        }
        setPhase("VICTORY");
      }
    },
    [dispatch, isBossRewards, state.pendingBiomeChoices]
  );

  const handleSkipReward = useCallback(() => {
    dispatch({ type: "SKIP_CARD_REWARD" });
    setRewards(null);
    if (!isBossRewards) {
      setPhase("MAP");
    } else if (state.pendingBiomeChoices !== null) {
      setPhase("BIOME_SELECT");
    } else {
      if (!runEndedRef.current) {
        runEndedRef.current = true;
        void endRunAction({ runId: stateRef.current.runId, status: "VICTORY", earnedResources: stateRef.current.earnedResources });
      }
      setPhase("VICTORY");
    }
  }, [dispatch, isBossRewards, state.pendingBiomeChoices]);

  const handlePickRelic = useCallback(
    (relicId: string) => {
      dispatch({ type: "PICK_RELIC_REWARD", payload: { relicId } });
      setRewards(null);
      if (!isBossRewards) {
        setPhase("MAP");
      } else if (state.pendingBiomeChoices !== null) {
        setPhase("BIOME_SELECT");
      } else {
        if (!runEndedRef.current) {
          runEndedRef.current = true;
          void endRunAction({ runId: stateRef.current.runId, status: "VICTORY", earnedResources: stateRef.current.earnedResources });
        }
        setPhase("VICTORY");
      }
    },
    [dispatch, isBossRewards, state.pendingBiomeChoices]
  );

  const handlePickAlly = useCallback(
    (allyId: string) => {
      dispatch({ type: "PICK_ALLY_REWARD", payload: { allyId } });
      setRewards(null);
      if (!isBossRewards) {
        setPhase("MAP");
      } else if (state.pendingBiomeChoices !== null) {
        setPhase("BIOME_SELECT");
      } else {
        if (!runEndedRef.current) {
          runEndedRef.current = true;
          void endRunAction({ runId: stateRef.current.runId, status: "VICTORY", earnedResources: stateRef.current.earnedResources });
        }
        setPhase("VICTORY");
      }
    },
    [dispatch, isBossRewards, state.pendingBiomeChoices]
  );

  const handlePickBiome = useCallback(
    (biome: BiomeType) => {
      dispatch({ type: "CHOOSE_BIOME", payload: { biome } });
      setPhase("MAP");
    },
    [dispatch]
  );

  // Special room actions
  const handleHeal = useCallback(() => {
    dispatch({ type: "APPLY_HEAL_ROOM" });
    setPhase("MAP");
  }, [dispatch]);

  const handleEndRun = useCallback(
    async (status: "VICTORY" | "DEFEAT" | "ABANDONED") => {
      if (!runEndedRef.current) {
        runEndedRef.current = true;
        await endRunAction({ runId: stateRef.current.runId, status, earnedResources: stateRef.current.earnedResources });
      }
      router.push("/game");
    },
    [router]
  );

  const earnedResourcesSummary = useMemo(
    () =>
      Object.entries(state.earnedResources ?? {})
        .filter(([, amount]) => (amount as number) > 0)
        .sort((a, b) => (b[1] as number) - (a[1] as number)),
    [state.earnedResources]
  );

  const newlyUnlockedCardNames = useMemo(() => {
    const initial = new Set(state.initialUnlockedCardIds ?? []);
    return (state.unlockedCardIds ?? [])
      .filter((id) => !initial.has(id))
      .map((id) => cardDefs.get(id)?.name ?? id)
      .sort((a, b) => a.localeCompare(b));
  }, [state.initialUnlockedCardIds, state.unlockedCardIds, cardDefs]);

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
            onEndTurn={handleEndTurn}
            onUseInkPower={(power, targetId) =>
              dispatch({
                type: "USE_INK_POWER",
                payload: { power, targetId },
              })
            }
            unlockedInkPowers={state.metaBonuses?.unlockedInkPowers ?? ["REWRITE"]}
            onCheatKillEnemy={
              isDevBuild && isAdmin
                ? (enemyInstanceId) =>
                    dispatch({
                      type: "CHEAT_KILL_ENEMY",
                      payload: { enemyInstanceId },
                    })
                : undefined
            }
            actingEnemyId={actingEnemyId}
            attackingEnemyId={attackingEnemyId}
          />
        )}

        {phase === "REWARDS" && rewards && (
          <RewardScreen
            gold={rewards.gold}
            cardChoices={rewards.cardChoices}
            biomeResources={rewards.biomeResources}
            relicChoices={rewards.relicChoices}
            allyChoices={rewards.allyChoices}
            isBoss={isBossRewards}
            isElite={isEliteRewards}
            onPickCard={handlePickCard}
            onPickRelic={handlePickRelic}
            onPickAlly={handlePickAlly}
            onSkip={handleSkipReward}
          />
        )}

        {phase === "MERCHANT" && (
          <ShopView
            floor={state.floor}
            gold={state.gold}
            relicIds={state.relicIds}
            unlockedCardIds={state.unlockedCardIds}
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

        {phase === "PRE_BOSS" && (
          <PreBossRoomView
            playerCurrentHp={state.playerCurrentHp}
            playerMaxHp={state.playerMaxHp}
            deck={state.deck}
            cardDefs={cardDefs}
            onHeal={() => {
              dispatch({ type: "APPLY_HEAL_ROOM" });
              setPhase("MAP");
            }}
            onUpgrade={(cardInstanceId) => {
              dispatch({ type: "UPGRADE_CARD", payload: { cardInstanceId } });
              setPhase("MAP");
            }}
            onFight={() => {
              const preBossRoom = state.map[state.currentRoom]?.[0];
              if (!preBossRoom?.enemyIds) return;
              dispatch({
                type: "START_COMBAT",
                payload: { enemyIds: preBossRoom.enemyIds },
              });
              setPhase("COMBAT");
            }}
          />
        )}

        {phase === "BIOME_SELECT" && state.pendingBiomeChoices && (
          <BiomeSelectScreen
            choices={state.pendingBiomeChoices}
            currentFloor={state.floor}
            onChoose={handlePickBiome}
          />
        )}

        {phase === "VICTORY" && (
          <div className="flex flex-col items-center gap-4 py-16">
            <h2 className="text-4xl font-bold text-green-400">Victory!</h2>
            <p className="text-gray-400">
              You conquered all {state.floor} floors of the Forbidden Library!
            </p>
            <div className="space-y-1 text-sm text-gray-500">
              <p>Gold earned: {state.gold}</p>
              <p>Deck size: {state.deck.length} cards</p>
              <p>Relics: {state.relicIds.length}</p>
            </div>
            <div className="w-full max-w-2xl space-y-3 rounded-lg border border-gray-700 bg-gray-900/60 p-4 text-sm">
              <div>
                <p className="mb-1 font-semibold text-gray-300">Resources gained this run</p>
                {earnedResourcesSummary.length === 0 ? (
                  <p className="text-gray-500">None</p>
                ) : (
                  <ul className="space-y-0.5 text-gray-400">
                    {earnedResourcesSummary.map(([resource, amount]) => (
                      <li key={resource}>
                        {resource}: +{amount as number}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="mb-1 font-semibold text-gray-300">Cards unlocked this run</p>
                {newlyUnlockedCardNames.length === 0 ? (
                  <p className="text-gray-500">None</p>
                ) : (
                  <ul className="space-y-0.5 text-gray-400">
                    {newlyUnlockedCardNames.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href="/library"
                className="rounded-lg border border-amber-700 px-6 py-3 font-bold text-amber-400 hover:border-amber-500 hover:text-amber-300"
                onClick={() => handleEndRun("VICTORY")}
              >
                Biblioth&egrave;que
              </Link>
            </div>
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
            <div className="w-full max-w-2xl space-y-3 rounded-lg border border-gray-700 bg-gray-900/60 p-4 text-sm">
              <div>
                <p className="mb-1 font-semibold text-gray-300">Resources gained this run</p>
                {earnedResourcesSummary.length === 0 ? (
                  <p className="text-gray-500">None</p>
                ) : (
                  <ul className="space-y-0.5 text-gray-400">
                    {earnedResourcesSummary.map(([resource, amount]) => (
                      <li key={resource}>
                        {resource}: +{amount as number}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="mb-1 font-semibold text-gray-300">Cards unlocked this run</p>
                {newlyUnlockedCardNames.length === 0 ? (
                  <p className="text-gray-500">None</p>
                ) : (
                  <ul className="space-y-0.5 text-gray-400">
                    {newlyUnlockedCardNames.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href="/library"
                className="rounded-lg border border-amber-700 px-6 py-3 font-bold text-amber-400 hover:border-amber-500 hover:text-amber-300"
                onClick={() => handleEndRun("DEFEAT")}
              >
                Biblioth&egrave;que
              </Link>
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
