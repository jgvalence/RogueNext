// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildCardDefsMap } from "../data";
import { playCard } from "../engine/cards";
import { createRNG } from "../engine/rng";
import { CombatStateSchema } from "../schemas/combat-state";
import { makeTestCombat } from "@/test/factories/game-state";

const definitions = buildCardDefsMap();
const cards = [...definitions.values()].filter(
  (c) => c.type !== "STATUS" && c.type !== "CURSE"
);

describe("catalogue resolution contracts", () => {
  for (const branch of [null, "A", "B"] as const) {
    for (const inked of [false, true]) {
      it(`resolves ${branch ?? "base"}, inked=${inked} without corrupting combat or its input`, () => {
        for (const card of cards) {
          if (inked && !card.inkedVariant) continue;
          const combat = makeTestCombat();
          combat.player.energyCurrent = combat.player.energyMax = 50;
          combat.player.inkCurrent = combat.player.inkMax = 50;
          combat.player.currentHp = 50;
          combat.player.block = 20;
          combat.enemies[0]!.currentHp = combat.enemies[0]!.maxHp = 500;
          combat.enemies.push({ ...combat.enemies[0]!, instanceId: "e2" });
          combat.allies = [
            {
              ...combat.enemies[0]!,
              instanceId: "a1",
              definitionId: "ink_familiar",
            },
          ];
          combat.hand = [
            {
              instanceId: "played",
              definitionId: card.id,
              upgraded: branch !== null,
              upgradeBranch: branch,
            },
          ];
          const original = structuredClone(combat);
          const label = `${card.id}/${branch}/${inked}`;
          const next = playCard(
            combat,
            "played",
            "e1",
            inked,
            definitions,
            createRNG(label)
          );
          expect(next, label).not.toBe(combat);
          expect(combat, `${label}: input mutation`).toEqual(original);
          expect(
            CombatStateSchema.safeParse(next).success,
            `${label}: persisted format`
          ).toBe(true);
          expect(next.player.energyCurrent, label).toBeGreaterThanOrEqual(0);
          expect(next.player.inkCurrent, label).toBeGreaterThanOrEqual(0);
          expect(next.player.currentHp, label).toBeLessThanOrEqual(
            next.player.maxHp
          );
          const piles = [
            ...next.hand,
            ...next.drawPile,
            ...next.discardPile,
            ...next.exhaustPile,
          ];
          expect(
            new Set(piles.map((c) => c.instanceId)).size,
            `${label}: duplicated card`
          ).toBe(piles.length);
        }
      });
    }
  }
});
