"use client";

import { useEffect } from "react";
import type { RunState } from "@/game/schemas/run-state";

export function useAutoSave(state: RunState) {
  useEffect(() => {
    // All gameplay mutations are persisted through server-authoritative actions.
    // Disabling full-state autosave closes the client-forged payload vector.
    void state;
  }, [state]);
}
