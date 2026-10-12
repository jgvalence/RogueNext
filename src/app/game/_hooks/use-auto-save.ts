"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RunState } from "@/game/schemas/run-state";
import {
  persistRunState,
  SaveConflictError,
} from "../_services/run-save-client";

const terminal = (state: RunState) =>
  (state.status !== "IN_PROGRESS" &&
    !(state.status === "VICTORY" && state.pendingRewards)) ||
  state.combat?.phase === "COMBAT_LOST";
const stateKey = (state: RunState) => JSON.stringify(state);
const checkpoint = (state: RunState) =>
  JSON.stringify([
    state.floor,
    state.currentRoom,
    state.status,
    state.pendingRewards,
    state.merchantCheckpoint,
    state.pendingEventPurge,
    state.map,
    state.combat === null,
    state.combat?.phase === "COMBAT_WON",
    state.combat?.phase === "COMBAT_LOST",
  ]);
export function useAutoSave(
  state: RunState,
  buildStateSnapshot?: (state: RunState) => RunState
) {
  const [saveError, setSaveError] = useState<
    "offline" | "failed" | "conflict" | null
  >(null);
  const latest = useRef(state);
  const buildSnapshot = useRef(buildStateSnapshot);
  const confirmed = useRef("");
  const previousCheckpoint = useRef(checkpoint(state));
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  latest.current = state;
  buildSnapshot.current = buildStateSnapshot;
  const save = useCallback(async (keepalive = false) => {
    const current = latest.current;
    if (terminal(current)) return;
    const snapshot = buildSnapshot.current?.(current) ?? current;
    const key = stateKey(current);
    if (key === confirmed.current && !keepalive) return;
    try {
      await persistRunState(snapshot, keepalive);
      confirmed.current = key;
      if (mounted.current) setSaveError(null);
    } catch (error) {
      if (!mounted.current) return;
      const conflict = error instanceof SaveConflictError;
      setSaveError(
        conflict
          ? "conflict"
          : navigator.onLine === false
            ? "offline"
            : "failed"
      );
      if (!conflict && !keepalive) {
        if (retryTimer.current) clearTimeout(retryTimer.current);
        retryTimer.current = setTimeout(() => {
          void save();
        }, 5000);
      }
    }
  }, []);
  useEffect(() => {
    const next = checkpoint(state);
    const immediate = next !== previousCheckpoint.current;
    previousCheckpoint.current = next;
    if (terminal(state)) return;
    if (immediate) {
      void save();
      return;
    }
    const timer = setTimeout(() => {
      void save();
    }, 2000);
    return () => clearTimeout(timer);
  }, [state, save]);
  useEffect(() => {
    mounted.current = true;
    const flush = () => {
      void save(true);
    };
    const visibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    const online = () => {
      void save();
    };
    const offline = () => setSaveError("offline");
    window.addEventListener("pagehide", flush);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      mounted.current = false;
      if (retryTimer.current) clearTimeout(retryTimer.current);
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [save]);
  return { saveError, retrySave: () => save() };
}
