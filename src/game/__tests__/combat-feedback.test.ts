import { describe, expect, it } from "vitest";
import { makeTestCombat } from "@/test/factories/game-state";
import { buildCardDefsMap } from "@/game/data";
import { CombatStateSchema } from "../schemas/combat-state";
import {
  appendCombatFeedback,
  statusTickFeedback,
} from "../engine/combat-feedback";
import { resolveEffect, resolveEffects } from "../engine/effects";
import { finalizeEnemyRound } from "../engine/enemies";
import { applyInkPower } from "../engine/ink";
import { playCard } from "../engine/cards";
import { createRNG } from "../engine/rng";
const rng = () => createRNG("feedback-test");
const target = {
  source: "player" as const,
  target: { type: "enemy" as const, instanceId: "e1" },
};

describe("combat presentation journal", () => {
  it("records each hit, including armor absorption and clipped overkill, without duplicates", () => {
    const state = makeTestCombat();
    state.enemies[0]!.block = 3;
    const after = resolveEffects(
      state,
      [
        { type: "DAMAGE", value: 8 },
        { type: "DAMAGE", value: 8 },
        { type: "DAMAGE", value: 8 },
      ],
      target,
      rng()
    );
    expect(
      after.feedback?.events.map((e) => [e.kind, e.amount, e.blocked])
    ).toEqual([
      ["hit", 5, 3],
      ["hit", 8, 0],
      ["hit", 1, 0],
    ]);
    expect(state.enemies[0]!.currentHp).toBe(14);
  });
  it("records every area target and a fully blocked hit", () => {
    const state = makeTestCombat();
    state.enemies.push({ ...state.enemies[0]!, instanceId: "e2", block: 10 });
    const after = resolveEffect(
      state,
      { type: "DAMAGE", value: 4 },
      { source: "player", target: "all_enemies" },
      rng()
    );
    expect(
      after.feedback?.events.map((e) => [e.target, e.amount, e.blocked])
    ).toEqual([
      ["e1", 4, 0],
      ["e2", 0, 4],
    ]);
  });
  it("distinguishes poison stacks from poison and bleed damage at round end", () => {
    const state = makeTestCombat();
    state.enemies[0]!.buffs = [
      { type: "POISON", stacks: 1 },
      { type: "BLEED", stacks: 2 },
    ];
    const applied = resolveEffect(
      state,
      { type: "APPLY_DEBUFF", buff: "POISON", value: 2 },
      target,
      rng()
    );
    expect(applied.feedback?.events).toEqual([
      expect.objectContaining({ kind: "poison", amount: 2, target: "e1" }),
    ]);
    const after = finalizeEnemyRound(applied);
    const ticks = after.feedback!.events.filter((e) => e.kind.endsWith("Tick"));
    expect(ticks.map((e) => e.kind)).toEqual(["poisonTick", "bleedTick"]);
    expect(ticks.reduce((sum, e) => sum + (e.amount ?? 0), 0)).toBe(
      14 - after.enemies[0]!.currentHp
    );
    expect(statusTickFeedback("e1", 2, 0, -3)).toEqual([
      { kind: "poisonTick", target: "e1", amount: 2 },
    ]);
  });
  it("records support effects, draws and ink upgrades", () => {
    const state = makeTestCombat();
    state.player.currentHp = 75;
    const after = resolveEffects(
      state,
      [
        { type: "BLOCK", value: 6 },
        { type: "HEAL", value: 20 },
        { type: "DRAW_CARDS", value: 2 },
      ],
      { source: "player", target: "player" },
      rng()
    );
    expect(after.feedback?.events.map((e) => [e.kind, e.amount])).toEqual([
      ["armor", 6],
      ["heal", 5],
      ["draw", 2],
    ]);
    after.player.inkCurrent = 10;
    const upgraded = applyInkPower(
      after,
      "CALLIGRAPHIE",
      null,
      buildCardDefsMap(),
      rng()
    );
    expect(upgraded.feedback?.events.slice(-2).map((e) => e.kind)).toEqual([
      "ink",
      "upgrade",
    ]);
  });
  it("does not emit for rejected actions and shows accepted skills", () => {
    const state = makeTestCombat();
    expect(
      playCard(state, "missing", null, false, buildCardDefsMap(), rng())
    ).toBe(state);
    expect(applyInkPower(state, "SEAL", null, buildCardDefsMap(), rng())).toBe(
      state
    );
    state.hand = [
      { instanceId: "def", definitionId: "defend", upgraded: false },
    ];
    const played = playCard(
      state,
      "def",
      null,
      false,
      buildCardDefsMap(),
      rng()
    );
    expect(played.feedback?.events.map((e) => e.kind)).toContain("skill");
    expect(played.feedback?.events.map((e) => e.kind)).toContain("armor");
  });
  it("bounds persisted history and accepts old saves with no journal", () => {
    const state = makeTestCombat();
    expect(CombatStateSchema.safeParse(state).success).toBe(true);
    const after = appendCombatFeedback(
      state,
      Array.from({ length: 90 }, () => ({
        kind: "hit" as const,
        target: "e1",
        amount: 1,
      }))
    );
    expect(after.feedback?.sequence).toBe(90);
    expect(after.feedback?.events).toHaveLength(64);
    expect(after.feedback?.events[0]!.id).toBe(27);
    expect(
      CombatStateSchema.parse(JSON.parse(JSON.stringify(after))).feedback
    ).toEqual(after.feedback);
  });
});
it("shows a reinforcement for a direct strength gain", () => {
  const state = makeTestCombat();
  const after = resolveEffect(
    state,
    { type: "GAIN_STRENGTH", value: 2 },
    { source: "player", target: "player" },
    rng()
  );
  expect(after.feedback?.events).toEqual([
    expect.objectContaining({ kind: "buff", target: "player", amount: 2 }),
  ]);
});
