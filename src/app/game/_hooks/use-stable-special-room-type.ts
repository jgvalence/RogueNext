"use client";

import { useEffect, useState } from "react";
import type { RunState } from "@/game/schemas/run-state";
import type { GamePhase } from "../_services/run-phase";

type SpecialRoomType = "HEAL" | "UPGRADE" | "EVENT";

export function useStableSpecialRoomType(
  phase: GamePhase,
  state: RunState
): SpecialRoomType | undefined {
  const selectedCurrentRoom =
    state.map[state.currentRoom]?.find((room) => room.completed) ?? null;
  const [stableSpecialRoomType, setStableSpecialRoomType] = useState<
    SpecialRoomType | undefined
  >(() => (phase === "SPECIAL" ? selectedCurrentRoom?.specialType : undefined));

  useEffect(() => {
    if (phase !== "SPECIAL") {
      setStableSpecialRoomType(undefined);
      return;
    }

    if (selectedCurrentRoom?.specialType) {
      setStableSpecialRoomType(selectedCurrentRoom.specialType);
    }
  }, [phase, selectedCurrentRoom?.specialType]);

  return stableSpecialRoomType;
}
