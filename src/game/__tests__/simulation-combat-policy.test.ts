import { describe, expect, it } from "vitest";
import { chooseCombatCard, chooseInkPower, estimateIncomingDamage } from "../../../scripts/simulation-combat-policy";
import { makeTestCombat } from "@/test/factories/game-state";
import { buildCardDefsMap, buildEnemyDefsMap } from "../data";

const cards = buildCardDefsMap(), enemies = buildEnemyDefsMap();
describe("simulation combat decisions", () => {
  it.each(["boss", "curse"])("cannot read a hidden %s intent for cards, powers or potions", (mode) => {
    const state = makeTestCombat();
    state.difficultyLevel = mode === "boss" ? 3 : 0;
    state.turnNumber = mode === "boss" ? 3 : 1;
    state.player.currentHp = 20;
    state.player.inkCurrent = 8;
    state.hand = ["strike", "defend", ...(mode === "curse" ? ["shrouded_omen"] : [])].map(id => ({ instanceId:id, definitionId:id, upgraded:false }));
    const def = { ...enemies.get("ink_slime")!, isBoss:mode === "boss", abilities:[
      { name:"Hit", weight:1, target:"PLAYER" as const, effects:[{type:"DAMAGE" as const,value:20}] },
      { name:"Wait", weight:1, target:"SELF" as const, effects:[{type:"BLOCK" as const,value:5}] },
    ] };
    const definitions = new Map(enemies).set(def.id,def);
    const other = structuredClone(state);
    other.enemies[0]!.intentIndex = 1;
    expect(estimateIncomingDamage(state,definitions)).toBe(estimateIncomingDamage(other,definitions));
    expect(chooseCombatCard(state,cards,definitions)).toEqual(chooseCombatCard(other,cards,definitions));
    expect(chooseInkPower(state,cards,definitions,["SILENCE","ENCRE_NOIRE","SEAL"])).toEqual(chooseInkPower(other,cards,definitions,["SILENCE","ENCRE_NOIRE","SEAL"]));
    state.difficultyLevel = 0;
    other.difficultyLevel = 0;
    state.hand = state.hand.filter(card => card.definitionId !== "shrouded_omen");
    other.hand = other.hand.filter(card => card.definitionId !== "shrouded_omen");
    expect(estimateIncomingDamage(state,definitions)).toBeGreaterThan(estimateIncomingDamage(other,definitions));
  });

  it("uses newly available ink to finish a fight after playing cards", () => {
    const state = makeTestCombat();
    state.player.inkCurrent = 0;
    state.player.energyCurrent = 0;
    state.hand = [];
    state.enemies[0]!.currentHp = 4;
    expect(chooseInkPower(state,cards,enemies,["ENCRE_NOIRE"])).toBeNull();
    state.player.inkCurrent = 4;
    expect(chooseInkPower(state,cards,enemies,["ENCRE_NOIRE"])?.power).toBe("ENCRE_NOIRE");
  });
  it("evaluates defensive effects instead of assuming every skill blocks", () => {
    const state = makeTestCombat();
    state.player.currentHp = 1;
    state.player.energyCurrent = 1;
    state.player.inkPerCardChance = 0;
    state.enemies[0]!.currentHp = 100;
    state.enemies[0]!.maxHp = 100;
    state.hand = ["rythme_mortel", "defend"].map(id=>({instanceId:id,definitionId:id,upgraded:false}));
    const original = structuredClone(state);
    expect(chooseCombatCard(state,cards,enemies)?.instanceId).toBe("defend");
    expect(state).toEqual(original);
  });
  it("finishes a fight rather than blocking a lethal enemy already within reach", () => {
    const state = makeTestCombat();
    state.player.currentHp = 1;
    state.player.energyCurrent = 1;
    state.enemies[0]!.currentHp = 3;
    state.hand = ["defend", "strike"].map(id=>({instanceId:id,definitionId:id,upgraded:false}));
    expect(chooseCombatCard(state,cards,enemies)?.instanceId).toBe("strike");
  });

  it("can forbid armor damage and thorns while retaining ordinary defense", () => {
    const state = makeTestCombat();
    state.player.energyCurrent = 3;
    const armor = { ...cards.get("strike")!, id: "test_armor", effects: [{ type: "DAMAGE_EQUAL_BLOCK" as const, value: 1 }] };
    const definitions = new Map(cards).set(armor.id, armor);
    state.player.block = 100;
    state.hand = [{instanceId:armor.id,definitionId:armor.id,upgraded:false}];
    expect(chooseCombatCard(state, definitions, enemies)).not.toBeNull();
    expect(chooseCombatCard(state, definitions, enemies, true)).toBeNull();
    definitions.set(armor.id, { ...armor, targeting:"SELF", effects:[{type:"APPLY_BUFF",buff:"THORNS",value:5}] });
    expect(chooseCombatCard(state, definitions, enemies, true)).toBeNull();
  });
});
