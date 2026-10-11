// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeTestRunState } from "@/test/factories/game-state";
import { createGameReducer } from "@/app/game/_providers/game-reducer";
import {
  buildAllyDefsMap,
  buildCardDefsMap,
  buildEnemyDefsMap,
} from "@/game/data";
import { createRNG } from "@/game/engine/rng";
import { getActiveRunSnapshotForUser } from "./run-state.service";

const { findRun, findProgression } = vi.hoisted(() => ({
  findRun: vi.fn(),
  findProgression: vi.fn(),
}));
vi.mock("./run-persistence.service", () => ({
  findLatestActiveRunForUser: findRun,
}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { userProgression: { findUnique: findProgression } },
}));

beforeEach(() => {
  vi.clearAllMocks();
  findProgression.mockResolvedValue({
    resources: {},
    unlockedStoryIds: [],
    totalRuns: 4,
  });
});

describe("resuming older saved runs", () => {
  it.each([undefined, null, { combatsStarted: 7, cardPlays: { strike: 12 } }])(
    "backfills missing analytics and allows the next combat (%j)",
    async (analytics) => {
      const saved = {
        ...makeTestRunState({ floor: 2, currentRoom: 5, gold: 84 }),
        analytics,
      };
      findRun.mockResolvedValue({
        id: saved.runId,
        seed: saved.seed,
        state: saved,
        createdAt: new Date("2026-06-26T12:00:00Z"),
      });
      const loaded = (await getActiveRunSnapshotForUser("user-test")).run!
        .state;
      expect(loaded).toMatchObject({
        floor: 2,
        currentRoom: 5,
        gold: 84,
        deck: saved.deck,
        analytics: {
          combatsStarted: analytics?.combatsStarted ?? 0,
          cardPlays: analytics?.cardPlays ?? {},
          cardsAdded: {},
          cardModePlays: {},
          combats: [],
          rulesVersion: "legacy",
        },
      });
      const reducer = createGameReducer({
        cardDefs: buildCardDefsMap(),
        enemyDefs: buildEnemyDefsMap(),
        allyDefs: buildAllyDefsMap(),
        rng: createRNG(saved.seed),
      });
      const started = reducer(loaded, {
        type: "START_COMBAT",
        payload: { enemyIds: [buildEnemyDefsMap().keys().next().value!] },
      });
      expect(started.combat).not.toBeNull();
      expect(started.analytics.combatsStarted).toBe(
        (analytics?.combatsStarted ?? 0) + 1
      );
      expect(saved.analytics).toEqual(analytics);
    }
  );

  it("preserves analytics and the original rules version on modern runs", async () => {
    const saved = makeTestRunState();
    saved.analytics.combatsStarted = 9;
    findRun.mockResolvedValue({
      id: saved.runId,
      seed: saved.seed,
      state: saved,
      createdAt: new Date(),
    });
    const loaded = (await getActiveRunSnapshotForUser("user-test")).run!.state;
    expect(loaded.analytics).toEqual(saved.analytics);
    loaded.analytics.cardPlays.strike = 1;
    expect(saved.analytics.cardPlays).toEqual({});
  });
});
