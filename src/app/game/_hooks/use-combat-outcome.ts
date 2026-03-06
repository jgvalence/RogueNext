import {
  useEffect,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import { endRunAction } from "@/server/actions/run";
import {
  generateCombatRewards,
  type CombatRewards,
} from "@/game/engine/rewards";
import { getRunConditionById } from "@/game/engine/run-conditions";
import { computeEnemyKillUnlockedRelicIds } from "@/game/engine/difficulty";
import { createRNG } from "@/game/engine/rng";
import { playSound } from "@/lib/sound";
import { relicDefinitions } from "@/game/data/relics";
import { GAME_CONSTANTS } from "@/game/constants";
import type { CardDefinition } from "@/game/schemas/cards";
import type { RunState } from "@/game/schemas/run-state";
import type { GameAction } from "../_providers/game-reducer";
import type { GamePhase } from "../_services/run-phase";

interface UseCombatOutcomeParams {
  state: RunState;
  stateRef: MutableRefObject<RunState>;
  runEndedRef: MutableRefObject<boolean>;
  cardDefs: Map<string, CardDefinition>;
  isInfiniteMode: boolean;
  buildEndRunPayload: () => {
    earnedResources?: Record<string, number>;
    startMerchantSpentResources?: Record<string, number>;
    encounteredEnemies?: Record<string, "NORMAL" | "ELITE" | "BOSS">;
    enemyKillCounts?: Record<string, number>;
  };
  dispatch: Dispatch<GameAction>;
  setRewards: Dispatch<SetStateAction<CombatRewards | null>>;
  setIsBossRewards: Dispatch<SetStateAction<boolean>>;
  setIsEliteRewards: Dispatch<SetStateAction<boolean>>;
  setPhase: Dispatch<SetStateAction<GamePhase>>;
  setNewBestiaryEntries: Dispatch<SetStateAction<string[]>>;
  onCombatLost: () => void;
}

export function useCombatOutcome({
  state,
  stateRef,
  runEndedRef,
  cardDefs,
  isInfiniteMode,
  buildEndRunPayload,
  dispatch,
  setRewards,
  setIsBossRewards,
  setIsEliteRewards,
  setPhase,
  setNewBestiaryEntries,
  onCombatLost,
}: UseCombatOutcomeParams) {
  useEffect(() => {
    const combat = state.combat;
    if (!combat) return;

    if (combat.phase === "COMBAT_WON") {
      const knownEnemyIds = new Set(
        Object.keys(state.encounteredEnemies ?? {})
      );
      const discoveredNow = Array.from(
        new Set(
          combat.enemies
            .map((enemy) => enemy.definitionId)
            .filter((enemyId) => !knownEnemyIds.has(enemyId))
        )
      );
      setNewBestiaryEntries(discoveredNow);

      const isBoss = state.currentRoom === GAME_CONSTANTS.BOSS_ROOM_INDEX;

      const roomChoices = state.map[state.currentRoom];
      const selectedRoom =
        roomChoices?.find((room) => room.completed) ?? roomChoices?.[0];
      const enemyCount = selectedRoom?.enemyIds?.length ?? 1;
      const isElite = selectedRoom?.isElite ?? false;

      const defeatedBossId = isBoss ? selectedRoom?.enemyIds?.[0] : undefined;
      const projectedEnemyKillCounts = { ...(state.enemyKillCounts ?? {}) };
      for (const enemy of combat.enemies) {
        projectedEnemyKillCounts[enemy.definitionId] =
          (projectedEnemyKillCounts[enemy.definitionId] ?? 0) + 1;
      }
      const projectedUnlockedRelicIds = new Set([
        ...(state.unlockedRelicIds ?? []),
        ...computeEnemyKillUnlockedRelicIds(
          relicDefinitions.map((relic) => relic.id),
          projectedEnemyKillCounts
        ),
      ]);

      const combatRng = createRNG(state.seed + "-rewards-" + state.currentRoom);
      const runConditionRewardMultiplier =
        getRunConditionById(state.selectedRunConditionId)?.effects
          .combatRewardMultiplier ?? 1;
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
        state.metaBonuses?.allySlots ?? 0,
        state.unlockedDifficultyLevelSnapshot ?? 0,
        defeatedBossId,
        state.metaBonuses?.extraCardRewardChoices ?? 0,
        state.metaBonuses?.lootLuck ?? 0,
        state.selectedDifficultyLevel ?? 0,
        [...projectedUnlockedRelicIds],
        runConditionRewardMultiplier,
        isInfiniteMode,
        state.characterId ?? "scribe"
      );
      setRewards(combatRewards);
      setIsBossRewards(isBoss);
      setIsEliteRewards(isElite);

      playSound("VICTORY", 0.8);
      dispatch({
        type: "COMPLETE_COMBAT",
        payload: {
          goldReward: combatRewards.gold,
          biomeResources: combatRewards.biomeResources,
          usableItemDropDefinitionId: combatRewards.usableItemDropDefinitionId,
        },
      });
      setPhase("REWARDS");
    }

    if (combat.phase === "COMBAT_LOST") {
      onCombatLost();
      playSound("DEFEAT", 0.8);
      if (!runEndedRef.current) {
        runEndedRef.current = true;
        void endRunAction({
          runId: stateRef.current.runId,
          status: "DEFEAT",
          ...buildEndRunPayload(),
        });
      }
      setPhase("DEFEAT");
    }
  }, [state, cardDefs, isInfiniteMode, buildEndRunPayload, onCombatLost]);
}
