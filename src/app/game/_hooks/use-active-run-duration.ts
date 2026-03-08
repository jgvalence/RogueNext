"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RunState } from "@/game/schemas/run-state";

function isDocumentVisible(): boolean {
  return (
    typeof document !== "undefined" && document.visibilityState !== "hidden"
  );
}

export function useActiveRunDuration(baseDurationMs: number) {
  const baseDurationRef = useRef(Math.max(0, Math.floor(baseDurationMs ?? 0)));
  const activeSinceRef = useRef<number | null>(
    isDocumentVisible() ? Date.now() : null
  );
  const [elapsedMs, setElapsedMs] = useState(baseDurationRef.current);

  const getCurrentDurationMs = useCallback(() => {
    const activeDelta =
      activeSinceRef.current == null ? 0 : Date.now() - activeSinceRef.current;
    return Math.max(0, Math.floor(baseDurationRef.current + activeDelta));
  }, []);

  const pause = useCallback(() => {
    if (activeSinceRef.current == null) return;
    baseDurationRef.current = getCurrentDurationMs();
    activeSinceRef.current = null;
    setElapsedMs(baseDurationRef.current);
  }, [getCurrentDurationMs]);

  const resume = useCallback(() => {
    if (activeSinceRef.current != null || !isDocumentVisible()) return;
    activeSinceRef.current = Date.now();
    setElapsedMs(getCurrentDurationMs());
  }, [getCurrentDurationMs]);

  useEffect(() => {
    baseDurationRef.current = Math.max(0, Math.floor(baseDurationMs ?? 0));
    activeSinceRef.current = isDocumentVisible() ? Date.now() : null;
    setElapsedMs(getCurrentDurationMs());
  }, [baseDurationMs, getCurrentDurationMs]);

  useEffect(() => {
    const updateElapsed = () => {
      setElapsedMs(getCurrentDurationMs());
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        pause();
      } else {
        resume();
      }
    };

    updateElapsed();
    const interval = window.setInterval(() => {
      if (activeSinceRef.current != null) {
        updateElapsed();
      }
    }, 1000);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", pause);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", pause);
    };
  }, [getCurrentDurationMs, pause, resume]);

  const buildStateSnapshot = useCallback(
    (state: RunState): RunState => ({
      ...state,
      activePlayMs: Math.max(state.activePlayMs ?? 0, getCurrentDurationMs()),
    }),
    [getCurrentDurationMs]
  );

  return {
    elapsedMs,
    getCurrentDurationMs,
    buildStateSnapshot,
  };
}
