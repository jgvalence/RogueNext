import { describe, expect, it } from "vitest";
import { buildCardDefsMap } from "../data";
import {
  getCardUpgrade,
  buildUpgradedCardDefinition,
} from "../engine/card-upgrades";
import { playCard } from "../engine/cards";
import { resolveEffects } from "../engine/effects";
import { getBuffStacks } from "../engine/buffs";
import { createRNG } from "../engine/rng";
import { makeTestCombat } from "@/test/factories/game-state";
import { getBuildProfile } from "../engine/build-profile";
import { scoreCardForBuild } from "../../../scripts/simulation-policy";
import { getDeckArchetypeCounts } from "../engine/card-archetypes";
import { discardHand } from "../engine/deck";
import { startPlayerTurn } from "../engine/combat";
import { CombatStateSchema } from "../schemas/combat-state";

const defs = buildCardDefsMap();
const rng = () => createRNG("build-contract");
function handCard(id: string, branch?: "A" | "B") {
  const base = makeTestCombat();
  return makeTestCombat({
    player: {
      ...base.player,
      energyCurrent: 5,
      inkCurrent: 5,
      inkPerCardChance: 0,
    },
    hand: [
      {
        instanceId: "card",
        definitionId: id,
        upgraded: Boolean(branch),
        upgradeBranch: branch,
      },
    ],
    enemies: base.enemies.map((enemy) => ({
      ...enemy,
      currentHp: 100,
      maxHp: 100,
    })),
  });
}

describe("build balance contracts", () => {
  it("rewards the third alternating rhythm beat with draw and usable energy", () => {
    const state = handCard("rythme_mortel");
    state.lastPlayedCardType = "ATTACK";
    state.rhythmStreak = 2;
    const result = playCard(state,"card",null,false,defs,rng());
    expect(result.rhythmStreak).toBe(3);
    expect(result.player.energyCurrent).toBe(state.player.energyCurrent);
    expect(result.hand.length).toBe(state.hand.length);
    state.lastPlayedCardType = "SKILL";
    const broken = playCard(state,"card",null,false,defs,rng());
    expect(broken.rhythmStreak).toBe(0);
    expect(broken.player.energyCurrent).toBe(state.player.energyCurrent - 1);
  });
  it("makes Saga of Blood's inked exhaust payoff defensive", () => {
    const state = handCard("saga_of_blood");
    state.exhaustPile = [
      { instanceId: "spent", definitionId: "defend", upgraded: false },
    ];
    const result = playCard(state, "card", null, true, defs, rng());
    expect(result.player.currentHp).toBe(state.player.currentHp);
    expect(result.player.block).toBe(2);
  });

  it("gives the inked Web's Thorns to the player rather than every enemy", () => {
    const result = playCard(
      handCard("anansis_web"),
      "card",
      null,
      true,
      defs,
      rng()
    );
    expect(getBuffStacks(result.player.buffs, "THORNS")).toBeGreaterThan(0);
    expect(
      result.enemies.every(
        (enemy) => getBuffStacks(enemy.buffs, "THORNS") === 0
      )
    ).toBe(true);
  });

  it("calculates an area DoT payoff separately for each target", () => {
    const base = makeTestCombat();
    const state = makeTestCombat({
      enemies: [
        {
          ...base.enemies[0]!,
          currentHp: 100,
          buffs: [{ type: "POISON", stacks: 3 }],
        },
        {
          ...base.enemies[0]!,
          instanceId: "e2",
          currentHp: 100,
          buffs: [{ type: "BLEED", stacks: 5 }],
        },
      ],
    });
    const result = resolveEffects(
      state,
      [{ type: "DAMAGE_PER_DOT_STACKS", value: 2 }],
      { source: "player", target: "all_enemies" },
      rng()
    );
    expect(result.enemies.map((enemy) => enemy.currentHp)).toEqual([94, 90]);
  });
  it("carries unpaid energy debt instead of forgiving the excess", () => {
    const state = makeTestCombat({
      phase: "ALLIES_ENEMIES_TURN",
      pendingEnergyDebt: 5,
    });
    const first = startPlayerTurn(state, rng());
    expect(first.player.energyCurrent).toBe(0);
    expect(first.pendingEnergyDebt).toBe(2);
    const second = startPlayerTurn(
      { ...first, phase: "ALLIES_ENEMIES_TURN" },
      rng()
    );
    expect(second.player.energyCurrent).toBe(1);
    expect(second.pendingEnergyDebt).toBe(0);
  });
  it("gives all four characters equally deep pools including mastery cards", () => {
    const pool = [...defs.values()].filter(
      (card) =>
        !card.isStarterCard &&
        card.isCollectible !== false &&
        card.type !== "STATUS" &&
        card.type !== "CURSE"
    );
    for (const character of ["scribe", "bibliothecaire", "griot", "fou"]) {
      expect(
        pool.filter(
          (card) =>
            card.id.startsWith("bestiary_") && card.characterId === character
        ),
        character
      ).toHaveLength(10);
      expect(
        pool.filter(
          (card) => !card.characterId || card.characterId === character
        ),
        character
      ).toHaveLength(90);
    }
  });
  it("retains another playable card for one turn without freezing it", () => {
    const state = handCard("healing_rhythm");
    state.hand.push({
      instanceId: "kept",
      definitionId: "strike",
      upgraded: false,
    });
    const retained = resolveEffects(
      state,
      [{ type: "RETAIN_CARDS", value: 1 }],
      { source: "player", target: "player", sourceCardInstanceId: "card" },
      rng()
    );
    expect(retained.retainedHandCardIds).toEqual(["kept"]);
    expect(retained.playerDisruption.frozenHandCardIds).toEqual([]);
    const serialized = CombatStateSchema.parse(
      JSON.parse(JSON.stringify(retained))
    );
    const discarded = discardHand(serialized);
    expect(discarded.hand.map((c) => c.instanceId)).toEqual(["kept"]);
    expect(discarded.retainedHandCardIds).toEqual([]);
    const nextTurn = startPlayerTurn(
      { ...discarded, phase: "ALLIES_ENEMIES_TURN" },
      rng()
    );
    expect(nextTurn.hand.some((c) => c.instanceId === "kept")).toBe(true);
    expect(discardHand(nextTurn).hand).toEqual([]);
  });
  it("checks exact energy after payment even if the card then refunds energy", () => {
    const base = defs.get("fortify")!;
    const card = {
      ...base,
      id: "energy_contract",
      energyCost: 1,
      effects: [
        { type: "GAIN_ENERGY" as const, value: 2 },
        { type: "EXACT_ENERGY_REWARD" as const, value: 6 },
      ],
    };
    const state = handCard(card.id);
    state.player.energyCurrent = 1;
    const result = playCard(
      state,
      "card",
      null,
      false,
      new Map(defs).set(card.id, card),
      rng()
    );
    expect(result.player.energyCurrent).toBe(2);
    expect(result.player.block).toBe(6);
  });

  it("counts a selected upgrade's synergy without counting an unchosen branch", () => {
    const base = defs.get("fortify")!;
    const card = {
      ...base,
      id: "branch_contract",
      inkedVariant: null,
      upgrade: null,
      upgradeBranches: [
        {
          description: "Poison",
          effects: [
            {
              type: "APPLY_DEBUFF" as const,
              buff: "POISON" as const,
              value: 2,
            },
          ],
        },
        {
          description: "Draw",
          effects: [{ type: "DRAW_CARDS" as const, value: 1 }],
        },
      ] as [
        ReturnType<typeof getCardUpgrade>,
        ReturnType<typeof getCardUpgrade>,
      ],
    };
    const cards = new Map([[card.id, card]]);
    expect(
      getDeckArchetypeCounts(
        [{ instanceId: "c", definitionId: card.id, upgraded: false }],
        cards
      ).POISON
    ).toBeUndefined();
    expect(
      getDeckArchetypeCounts(
        [
          {
            instanceId: "c",
            definitionId: card.id,
            upgraded: true,
            upgradeBranch: "B",
          },
        ],
        cards
      ).POISON
    ).toBeUndefined();
    expect(
      getDeckArchetypeCounts(
        [
          {
            instanceId: "c",
            definitionId: card.id,
            upgraded: true,
            upgradeBranch: "A",
          },
        ],
        cards
      ).POISON
    ).toBe(1);
  });
  it("makes the Griot's defensive mask weaken enemies instead of its owner", () => {
    const state = handCard("masque_de_bois");
    const result = playCard(state, "card", null, false, defs, rng());
    expect(result.player.block).toBe(8);
    expect(getBuffStacks(result.player.buffs, "WEAK")).toBe(0);
    expect(getBuffStacks(result.enemies[0]!.buffs, "WEAK")).toBe(1);
  });

  it("preserves the rhythm, archive and copy engines when upgrading them", () => {
    for (const [id, effect] of [
      ["drum_strike", "RHYTHM_REWARD"],
      ["temple_archive", "ARCHIVE_AND_DRAW"],
      ["written_prophecy", "COPY_LAST_CARD_TO_HAND"],
    ]) {
      const card = defs.get(id!)!;
      for (const branch of ["A", "B"] as const) {
        const upgraded = buildUpgradedCardDefinition(card, branch);
        expect(
          upgraded.effects.some((e) => e.type === effect),
          `${id}:${branch}`
        ).toBe(true);
        expect(
          upgraded.inkedVariant?.effects.some((e) => e.type === effect),
          `${id}:${branch}:ink`
        ).toBe(true);
      }
    }
  });

  it("does not turn a shield's generated branch into damage against its owner", () => {
    const state = handCard("shield_wall", "B");
    state.exhaustPile = [
      { instanceId: "spent", definitionId: "defend", upgraded: false },
    ];
    const result = playCard(state, "card", null, false, defs, rng());
    expect(result.player.currentHp).toBe(state.player.currentHp);
    expect(result.player.block).toBeGreaterThan(0);
    for (const id of [
      "shield_wall",
      "void_shield",
      "starborn_omen",
      "sun_ritual",
      "blood_offering",
      "eclipse_vow",
    ]) {
      const card = defs.get(id)!;
      expect(
        getCardUpgrade(card, "B").effects.filter(
          (effect) =>
            effect.type.startsWith("DAMAGE") &&
            !card.effects.some((base) => base.type === effect.type)
        ),
        id
      ).toEqual([]);
    }
  });

  it("resolves every displayed branch addition in the inked form", () => {
    const base = defs.get("heavy_strike")!;
    const card = {
      ...base,
      id: "preview_contract",
      effects: [{ type: "DAMAGE" as const, value: 3 }],
      inkedVariant: {
        description: "Test",
        inkMarkCost: 2,
        effects: [{ type: "DAMAGE" as const, value: 5 }],
      },
      upgradeBranches: [
        {
          description: "A",
          effects: [
            { type: "DAMAGE" as const, value: 4 },
            { type: "GAIN_INK" as const, value: 1 },
          ],
        },
        {
          description: "B",
          effects: [
            { type: "DAMAGE" as const, value: 3 },
            { type: "BLOCK" as const, value: 4 },
            { type: "GAIN_INK" as const, value: 2 },
          ],
        },
      ] as [
        ReturnType<typeof getCardUpgrade>,
        ReturnType<typeof getCardUpgrade>,
      ],
    };
    const customDefs = new Map(defs).set(card.id, card);
    for (const branch of ["A", "B"] as const) {
      const state = handCard(card.id, branch);
      const preview = buildUpgradedCardDefinition(card, branch).inkedVariant!;
      const result = playCard(state, "card", "e1", true, customDefs, rng());
      const gain = preview.effects
        .filter((e) => e.type === "GAIN_INK")
        .reduce((sum, e) => sum + e.value, 0);
      expect(result.player.inkCurrent).toBe(3 + gain);
      expect(result.player.block).toBe(branch === "B" ? 4 : 0);
    }
  });

  it("spreads a DoT concentration without multiplying existing stacks by bouncing it", () => {
    const base = makeTestCombat();
    const state = makeTestCombat({
      enemies: [
        {
          ...base.enemies[0]!,
          buffs: [
            { type: "POISON", stacks: 6 },
            { type: "BLEED", stacks: 4 },
          ],
        },
        {
          ...base.enemies[0]!,
          instanceId: "e2",
          buffs: [{ type: "POISON", stacks: 2 }],
        },
      ],
    });
    const once = resolveEffects(
      state,
      [{ type: "PROPAGATE_DOT", value: 1 }],
      { source: "player", target: { type: "enemy", instanceId: "e1" } },
      rng()
    );
    const twice = resolveEffects(
      once,
      [{ type: "PROPAGATE_DOT", value: 1 }],
      { source: "player", target: { type: "enemy", instanceId: "e2" } },
      rng()
    );
    expect(twice.enemies.map((e) => getBuffStacks(e.buffs, "POISON"))).toEqual([
      6, 6,
    ]);
    expect(twice.enemies.map((e) => getBuffStacks(e.buffs, "BLEED"))).toEqual([
      4, 4,
    ]);
  });

  it("keeps repeatable poison setup separate from poison multiplication", () => {
    expect(
      defs.get("poison_herb")!.effects.some((e) => e.type === "DOUBLE_POISON")
    ).toBe(false);
    expect(getBuildProfile(defs.get("poison_herb")!).poison).toContain(
      "enabler"
    );
    expect(getBuildProfile(defs.get("transe_vaudou")!).poison).toContain(
      "payoff"
    );
  });

  it("keeps free burst energy and the final pact exhaustible after upgrading", () => {
    for (const id of ["adrenaline_pure", "pacte_final"]) {
      for (const branch of ["A", "B"] as const) {
        const result = playCard(
          handCard(id, branch),
          "card",
          null,
          false,
          defs,
          rng()
        );
        expect(
          result.exhaustPile.some((c) => c.instanceId === "card"),
          `${id}:${branch}`
        ).toBe(true);
      }
    }
  });

  it("scores builds from effects and ignores misleading names or rarity", () => {
    const card = defs.get("fortify")!;
    const renamed = {
      ...card,
      id: "poison_venom_toxic",
      name: "Poison",
      rarity: "RARE" as const,
    };
    expect(scoreCardForBuild(card, "poison")).toBe(
      scoreCardForBuild(renamed, "poison")
    );
    expect(scoreCardForBuild(card, "armor")).toBeGreaterThan(
      scoreCardForBuild(card, "poison")
    );
    expect(scoreCardForBuild(undefined, "mixed")).toBe(-1000);
  });
});
