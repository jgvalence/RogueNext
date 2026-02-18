"use client";

import { useEffect, useRef } from "react";
import type { RunState } from "@/game/schemas/run-state";
import { saveRunStateAction } from "@/server/actions/run";

const DEBOUNCE_MS = 2000;

export function useAutoSave(state: RunState) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    const stateKey = JSON.stringify({
      currentRoom: state.currentRoom,
      gold: state.gold,
      playerCurrentHp: state.playerCurrentHp,
      deckLength: state.deck.length,
      relicIds: state.relicIds,
      status: state.status,
      // Don't include combat state in debounce key — too volatile
    });

    if (stateKey === lastSavedRef.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        await saveRunStateAction({
          runId: state.runId,
          state,
        });
        lastSavedRef.current = stateKey;
      } catch (e) {
        console.error("Auto-save failed:", e);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state]);
}
