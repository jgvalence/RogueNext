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
import { enemyDefinitions } from "@/game/data/enemies";
import { relicDefinitions } from "@/game/data/relics";
import type { CardDefinition } from "@/game/schemas/cards";
import type { RunState } from "@/game/schemas/run-state";
import {
  FIRST_RUN_GUIDED_STORY_TUTORIAL_OUTCOME,
  getFirstRunScriptedEndResources,
  isFirstRunScriptedEliteRoom,
} from "@/game/engine/first-run-script";
import type { GameAction } from "../_providers/game-reducer";
import type { GamePhase } from "../_services/run-phase";

interface UseCombatOutcomeParams {
  state: RunState;
  stateRef: MutableRefObject<RunState>;
  runEndedRef: MutableRefObject<boolean>;
  cardDefs: Map<string, CardDefinition>;
  isInfiniteMode: boolean;
  buildEndRunPayload: () => {
    runDurationMs?: number;
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
  onScriptedFirstRunDefeat: () => void;
}

const TRACKED_ENEMY_DEFINITION_IDS = new Set(
  enemyDefinitions
    .filter((enemy) => !enemy.isScriptedOnly)
    .map((enemy) => enemy.id)
);

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
  onScriptedFirstRunDefeat,
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

      const isBoss = state.currentRoom === state.map.length - 1;

      const roomChoices = state.map[state.currentRoom];
      const selectedRoom =
        roomChoices?.find((room) => room.completed) ?? roomChoices?.[0];
      const enemyCount = selectedRoom?.enemyIds?.length ?? 1;
      const isElite = selectedRoom?.isElite ?? false;
      const encounterBiome =
        combat.encounterContext?.biome ?? state.currentBiome;

      const defeatedBossId = isBoss
        ? (combat.encounterContext?.bossDefinitionId ??
          selectedRoom?.enemyIds?.[0])
        : undefined;
      const projectedEnemyKillCounts = { ...(state.enemyKillCounts ?? {}) };
      for (const enemy of combat.enemies) {
        if (!TRACKED_ENEMY_DEFINITION_IDS.has(enemy.definitionId)) continue;
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
        encounterBiome,
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
        state.characterId ?? "scribe",
        state.deck,
        combat.player.currentHp,
        combat.player.maxHp
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
      const isScriptedFirstRunDefeat = isFirstRunScriptedEliteRoom(state);

      if (!runEndedRef.current) {
        runEndedRef.current = true;
        if (isScriptedFirstRunDefeat) {
          void (async () => {
            const result = await endRunAction({
              runId: stateRef.current.runId,
              status: "DEFEAT",
              ...buildEndRunPayload(),
              earnedResources: getFirstRunScriptedEndResources(),
              scriptedOutcome: FIRST_RUN_GUIDED_STORY_TUTORIAL_OUTCOME,
            });

            if (result.success) {
              onScriptedFirstRunDefeat();
              return;
            }

            setPhase("DEFEAT");
          })();
          return;
        }

        void endRunAction({
          runId: stateRef.current.runId,
          status: "DEFEAT",
          ...buildEndRunPayload(),
        });
      }
      setPhase("DEFEAT");
    }
  }, [
    state,
    cardDefs,
    isInfiniteMode,
    buildEndRunPayload,
    onCombatLost,
    onScriptedFirstRunDefeat,
    runEndedRef,
    setPhase,
    stateRef,
  ]);
}
