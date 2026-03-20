"use client";

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HUNTERS_SIGNET_USED_FLAG } from "@/game/engine/relics";
import { makeTestRunState } from "@/test/factories/game-state";
import { useRunRoomActions } from "./use-run-room-actions";

describe("useRunRoomActions", () => {
  it("dispatches the dev shortcut action to jump to the boss room", () => {
    const state = makeTestRunState();
    const dispatch = vi.fn();
    const setPhase = vi.fn();
    const setForceEventWithRelicStable = vi.fn();

    const { result } = renderHook(() =>
      useRunRoomActions({
        state,
        stateRef: { current: state },
        currentRoomChoices: state.map[state.currentRoom],
        dispatch,
        setPhase,
        setForceEventWithRelicStable,
        canOfferFreeUpgradeAtStart: false,
        hasOpeningBiomeChoice: false,
      })
    );

    act(() => {
      result.current.handleDevSkipToBossRoom();
    });

    expect(dispatch).toHaveBeenCalledWith({ type: "DEV_SKIP_TO_BOSS_ROOM" });
  });

  it("consumes the boss-choice relic flag and overrides the boss room encounter", () => {
    const baseState = makeTestRunState();
    const bossRoomIndex = baseState.map.length - 1;
    const preBossIndex = bossRoomIndex - 1;
    const bossNodeId = "boss-node";
    const state = {
      ...baseState,
      currentRoom: bossRoomIndex,
      currentBiome: "LIBRARY" as const,
      map: baseState.map.map((rooms, index) => {
        if (index === preBossIndex) {
          return [
            {
              ...rooms[0]!,
              completed: true,
              nextNodeIds: [bossNodeId],
            },
          ];
        }

        if (index === bossRoomIndex) {
          return [
            {
              index: bossRoomIndex,
              nodeId: bossNodeId,
              lane: 2,
              nextNodeIds: [],
              type: "COMBAT" as const,
              enemyIds: ["chapter_guardian"],
              isElite: false,
              completed: false,
            },
          ];
        }

        return rooms;
      }),
    };
    const dispatch = vi.fn();
    const setPhase = vi.fn();
    const setForceEventWithRelicStable = vi.fn();

    const { result } = renderHook(() =>
      useRunRoomActions({
        state,
        stateRef: { current: state },
        currentRoomChoices: state.map[state.currentRoom],
        dispatch,
        setPhase,
        setForceEventWithRelicStable,
        canOfferFreeUpgradeAtStart: false,
        hasOpeningBiomeChoice: false,
        bossEncounterOverride: {
          biome: "VIKING",
          bossId: "fenrir",
          consumeRunFlag: HUNTERS_SIGNET_USED_FLAG,
        },
      })
    );

    act(() => {
      result.current.handleSelectRoom(0);
    });

    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: "SELECT_ROOM",
      payload: { choiceIndex: 0 },
    });
    expect(dispatch).toHaveBeenNthCalledWith(2, {
      type: "SET_RELIC_RUN_FLAG",
      payload: { flag: HUNTERS_SIGNET_USED_FLAG },
    });
    expect(dispatch).toHaveBeenNthCalledWith(3, {
      type: "START_COMBAT",
      payload: {
        enemyIds: ["fenrir"],
        encounterBiomeOverride: "VIKING",
        encounterBossIdOverride: "fenrir",
      },
    });
    expect(setPhase).toHaveBeenCalledWith("COMBAT");
  });
});
