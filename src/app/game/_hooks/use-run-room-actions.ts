"use client";

import {
  useCallback,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import type { RunState } from "@/game/schemas/run-state";
import type { BiomeType } from "@/game/schemas/enums";
import { VANILLA_RUN_CONDITION_ID } from "@/game/engine/run-conditions";
import { getFirstRunForcedMapChoiceIndex } from "@/game/engine/first-run-script";
import {
  getBossRoomIndexForMap,
  isRoomChoiceReachable,
} from "@/game/engine/run";
import type { GameAction } from "../_providers/game-reducer";
import { isRunStartState, type GamePhase } from "../_services/run-phase";
import type { RunSetupDraft } from "../_components/run-setup/RunSetupScreen";

interface UseRunRoomActionsParams {
  state: RunState;
  stateRef: MutableRefObject<RunState>;
  currentRoomChoices: RunState["map"][number] | undefined;
  dispatch: (action: GameAction) => void;
  setPhase: Dispatch<SetStateAction<GamePhase>>;
  setForceEventWithRelicStable: Dispatch<SetStateAction<boolean>>;
  canOfferFreeUpgradeAtStart: boolean;
  hasOpeningBiomeChoice: boolean;
  bossEncounterOverride?: {
    biome: BiomeType;
    bossId: string;
    consumeRunFlag?: string;
  } | null;
}

export function useRunRoomActions({
  state,
  stateRef,
  currentRoomChoices,
  dispatch,
  setPhase,
  setForceEventWithRelicStable,
  canOfferFreeUpgradeAtStart,
  hasOpeningBiomeChoice,
  bossEncounterOverride = null,
}: UseRunRoomActionsParams) {
  const handleSelectRoom = useCallback(
    (choiceIndex: number) => {
      const forcedChoiceIndex = getFirstRunForcedMapChoiceIndex(
        stateRef.current
      );
      if (forcedChoiceIndex != null && choiceIndex !== forcedChoiceIndex) {
        return;
      }

      const room = currentRoomChoices?.[choiceIndex];
      if (!room) return;
      if (
        !isRoomChoiceReachable(
          stateRef.current.map,
          stateRef.current.currentRoom,
          choiceIndex
        )
      ) {
        return;
      }

      dispatch({ type: "SELECT_ROOM", payload: { choiceIndex } });

      if (room.type === "COMBAT" && room.enemyIds) {
        const isBossRoom =
          stateRef.current.currentRoom ===
          getBossRoomIndexForMap(stateRef.current.map);
        const plannedBossId = room.enemyIds[0];
        const hasBossEncounterOverride =
          isBossRoom && bossEncounterOverride !== null;
        const shouldOverrideBossEncounter =
          hasBossEncounterOverride &&
          (bossEncounterOverride.biome !== stateRef.current.currentBiome ||
            bossEncounterOverride.bossId !== plannedBossId);

        if (hasBossEncounterOverride && bossEncounterOverride.consumeRunFlag) {
          dispatch({
            type: "SET_RELIC_RUN_FLAG",
            payload: { flag: bossEncounterOverride.consumeRunFlag },
          });
        }

        dispatch({
          type: "START_COMBAT",
          payload: shouldOverrideBossEncounter
            ? {
                enemyIds: [bossEncounterOverride.bossId],
                encounterBiomeOverride: bossEncounterOverride.biome,
                encounterBossIdOverride: bossEncounterOverride.bossId,
              }
            : { enemyIds: room.enemyIds },
        });
        setPhase("COMBAT");
      } else if (room.type === "MERCHANT") {
        setPhase("MERCHANT");
      } else if (room.type === "SPECIAL") {
        setForceEventWithRelicStable(
          stateRef.current.floor === 1 && stateRef.current.currentRoom === 2
        );
        setPhase("SPECIAL");
      } else if (room.type === "PRE_BOSS") {
        setPhase("PRE_BOSS");
      }
    },
    [
      currentRoomChoices,
      bossEncounterOverride,
      dispatch,
      setForceEventWithRelicStable,
      setPhase,
      stateRef,
    ]
  );

  const handleContinueSetup = useCallback(
    (draft: RunSetupDraft) => {
      const difficultyLevel = draft.difficultyLevel;
      const modeConditionId = draft.modeConditionId;
      if (difficultyLevel === null || modeConditionId === null) return;
      const difficultyMaxForCharacter =
        state.difficultyMaxByCharacter?.[draft.characterId];
      if (
        typeof difficultyMaxForCharacter === "number" &&
        Number.isFinite(difficultyMaxForCharacter) &&
        difficultyLevel > Math.max(0, Math.floor(difficultyMaxForCharacter))
      ) {
        return;
      }
      if (
        modeConditionId === VANILLA_RUN_CONDITION_ID &&
        draft.normalConditionId === null
      ) {
        return;
      }

      if (draft.characterId !== state.characterId) {
        dispatch({
          type: "CHOOSE_CHARACTER",
          payload: { characterId: draft.characterId },
        });
      }

      dispatch({ type: "APPLY_DIFFICULTY", payload: { difficultyLevel } });
      dispatch({
        type: "APPLY_RUN_CONDITION",
        payload: { conditionId: modeConditionId },
      });

      if (modeConditionId === VANILLA_RUN_CONDITION_ID) {
        dispatch({
          type: "APPLY_RUN_CONDITION",
          payload: {
            conditionId: draft.normalConditionId ?? VANILLA_RUN_CONDITION_ID,
          },
        });
      }

      for (const offer of draft.selectedStartOffers) {
        dispatch({ type: "BUY_START_MERCHANT_OFFER", payload: { offer } });
      }

      if (!state.startMerchantCompleted) {
        dispatch({ type: "COMPLETE_START_MERCHANT" });
      }
      const shouldShowOpeningBiomeChoice =
        hasOpeningBiomeChoice &&
        !(difficultyLevel === 0 && isRunStartState(state));
      if (canOfferFreeUpgradeAtStart) {
        setPhase("RUN_FREE_UPGRADE");
      } else if (shouldShowOpeningBiomeChoice) {
        setPhase("BIOME_SELECT");
      } else {
        setPhase("MAP");
      }
    },
    [
      canOfferFreeUpgradeAtStart,
      dispatch,
      hasOpeningBiomeChoice,
      setPhase,
      state.characterId,
      state.difficultyMaxByCharacter,
      state.startMerchantCompleted,
    ]
  );

  const handlePickBiome = useCallback(
    (biome: BiomeType) => {
      dispatch({ type: "CHOOSE_BIOME", payload: { biome } });
      setPhase("MAP");
    },
    [dispatch, setPhase]
  );

  const handleHeal = useCallback(() => {
    dispatch({ type: "APPLY_HEAL_ROOM" });
    setPhase("MAP");
  }, [dispatch, setPhase]);

  const handleDevSkipToBossRoom = useCallback(() => {
    dispatch({ type: "DEV_SKIP_TO_BOSS_ROOM" });
  }, [dispatch]);

  return {
    handleSelectRoom,
    handleContinueSetup,
    handlePickBiome,
    handleHeal,
    handleDevSkipToBossRoom,
  };
}
