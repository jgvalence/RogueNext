import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { buildCardDefsMap } from "@/game/data";
import { makeTestRunState } from "@/test/factories/game-state";
import { PendingRewardsSchema } from "@/game/schemas/pending-rewards";
import type { CombatRewards } from "@/game/engine/rewards";
import {
  checkpointRewards,
  getPendingRewards,
  restoreCombatRewards,
} from "./reward-checkpoint";
import { deriveInitialPhase } from "./run-phase";
import { useRewardPhaseHandlers } from "../_hooks/use-reward-phase-handlers";

const cards = buildCardDefsMap();
const rewards: CombatRewards = {
  gold: 50,
  biomeResources: { PAGES: 3 },
  cardChoices: [cards.get("heavy_strike")!],
  relicChoices: [],
  allyChoices: [],
  bossMaxHpBonus: 10,
  usableItemDropDefinitionId: null,
};
describe("reward checkpoints", () => {
  it("resumes the same offer and consumed rerolls before biome selection", () => {
    const state = makeTestRunState({
      floor: 2,
      currentRoom: 16,
      gold: 125,
      pendingBiomeChoices: ["GREEK", "VIKING"],
    });
    const pending = checkpointRewards(
      state,
      rewards,
      true,
      false,
      1,
      1,
      (index) => [cards.get(index === 2 ? "tome_strike" : "heavy_strike")!]
    );
    state.pendingRewards = PendingRewardsSchema.parse(
      JSON.parse(JSON.stringify(pending))
    );
    expect(deriveInitialPhase(state)).toBe("REWARDS");
    expect(restoreCombatRewards(getPendingRewards(state), cards)).toEqual(
      rewards
    );
    expect(state.pendingRewards.rerollCounter).toBe(1);
    expect(state.pendingRewards.rerollsRemaining).toBe(1);
    expect(state.pendingRewards.rerollCardIds[2]).toEqual(["tome_strike"]);
    expect(state.gold).toBe(125);
    state.status = "VICTORY";
    expect(deriveInitialPhase(state)).toBe("REWARDS");
    state.currentRoom = 0;
    expect(getPendingRewards(state)).toBeUndefined();
    expect(deriveInitialPhase(state)).toBe("VICTORY");
  });
  it("offers a new rare card at the next boss after the previous choice was taken", () => {
    const { result, rerender } = renderHook(
      ({ offer }) =>
        useRewardPhaseHandlers({
          rewards: offer,
          isBossRewards: true,
          hasPendingBiomeChoices: true,
          dispatch: vi.fn(),
          queueVictoryRunEnd: vi.fn(),
          setPhase: vi.fn(),
          setRewards: vi.fn(),
        }),
      {
        initialProps: {
          offer: { ...rewards, cardChoices: [] } as CombatRewards,
        },
      }
    );
    expect(result.current.bossCardPicked).toBe(true);
    rerender({ offer: rewards });
    expect(result.current.bossCardPicked).toBe(false);
  });
});
