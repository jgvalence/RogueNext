"use client";

import { useEffect, useRef } from "react";
import type { RunState } from "@/game/schemas/run-state";
import { saveRunStateAction } from "@/server/actions/run";

const DEBOUNCE_MS = 2000;

function buildMapCompletionSignature(state: RunState): string {
  return state.map
    .map((slot) => slot.map((room) => (room.completed ? "1" : "0")).join(""))
    .join("|");
}

function buildAutoSaveStateKey(state: RunState): string {
  return JSON.stringify({
    floor: state.floor,
    currentRoom: state.currentRoom,
    mapCompletion: buildMapCompletionSignature(state),
    gold: state.gold,
    playerCurrentHp: state.playerCurrentHp,
    deckLength: state.deck.length,
    relicIds: state.relicIds,
    status: state.status,
    combat: state.combat
      ? {
          phase: state.combat.phase,
          turnNumber: state.combat.turnNumber,
          playerCurrentHp: state.combat.player.currentHp,
          playerBlock: state.combat.player.block,
          enemySnapshot: state.combat.enemies.map((enemy) => ({
            instanceId: enemy.instanceId,
            currentHp: enemy.currentHp,
            block: enemy.block,
            intentIndex: enemy.intentIndex,
          })),
          handIds: state.combat.hand.map((card) => card.instanceId),
          drawPileLength: state.combat.drawPile.length,
          discardPileLength: state.combat.discardPile.length,
          exhaustPileLength: state.combat.exhaustPile.length,
        }
      : null,
  });
}

export function useAutoSave(
  state: RunState,
  buildStateSnapshot?: (state: RunState) => RunState
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");
  const lastSavedActivePlayMsRef = useRef<number>(state.activePlayMs ?? 0);
  const latestStateRef = useRef(state);
  const latestStateKeyRef = useRef(buildAutoSaveStateKey(state));
  const previousStateRef = useRef(state);

  latestStateRef.current = state;
  latestStateKeyRef.current = buildAutoSaveStateKey(state);

  useEffect(() => {
    const previousState = previousStateRef.current;
    const stateKey = latestStateKeyRef.current;
    const previousMapCompletion = buildMapCompletionSignature(previousState);
    const currentMapCompletion = buildMapCompletionSignature(state);
    const enteredOrLeftCombat =
      (previousState.combat === null) !== (state.combat === null);
    const reachedCombatOutcome =
      previousState.combat?.phase !== state.combat?.phase &&
      (state.combat?.phase === "COMBAT_WON" ||
        state.combat?.phase === "COMBAT_LOST");
    const isCheckpointTransition =
      previousState.floor !== state.floor ||
      previousState.currentRoom !== state.currentRoom ||
      previousMapCompletion !== currentMapCompletion ||
      previousState.status !== state.status ||
      enteredOrLeftCombat ||
      reachedCombatOutcome;

    previousStateRef.current = state;

    if (stateKey === lastSavedRef.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isCheckpointTransition) {
      const snapshotState = buildStateSnapshot
        ? buildStateSnapshot(state)
        : state;
      void saveRunStateAction({
        runId: snapshotState.runId,
        state: snapshotState,
      })
        .then(() => {
          lastSavedRef.current = stateKey;
          lastSavedActivePlayMsRef.current = snapshotState.activePlayMs ?? 0;
        })
        .catch((error) => {
          console.error("Checkpoint save failed:", error);
        });
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        const snapshotState = buildStateSnapshot
          ? buildStateSnapshot(state)
          : state;
        await saveRunStateAction({
          runId: snapshotState.runId,
          state: snapshotState,
        });
        lastSavedRef.current = stateKey;
        lastSavedActivePlayMsRef.current = snapshotState.activePlayMs ?? 0;
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state]);

  useEffect(() => {
    const flushLatestState = () => {
      const latestState = latestStateRef.current;
      const latestStateKey = latestStateKeyRef.current;
      const snapshotState = buildStateSnapshot
        ? buildStateSnapshot(latestState)
        : latestState;
      const snapshotActivePlayMs = snapshotState.activePlayMs ?? 0;
      if (
        latestStateKey === lastSavedRef.current &&
        snapshotActivePlayMs <= lastSavedActivePlayMsRef.current
      ) {
        return;
      }

      void fetch("/api/run/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        keepalive: true,
        body: JSON.stringify({
          runId: snapshotState.runId,
          state: snapshotState,
        }),
      }).catch((error) => {
        console.error("Auto-save flush failed:", error);
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushLatestState();
      }
    };

    window.addEventListener("pagehide", flushLatestState);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", flushLatestState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [buildStateSnapshot]);
}
