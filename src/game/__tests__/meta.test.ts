import { describe, expect, it } from "vitest";
import { computeMetaBonuses } from "@/game/engine/meta";

describe("meta progression bonuses", () => {
  it("turns the early energy story into a smaller starting-ink advantage", () => {
    expect(
      computeMetaBonuses(["traite_de_lenergie", "traite_de_lenergie"])
        .startingInk
    ).toBe(4);
  });

  it("grants only +1 opening hand card from grimoire_des_index", () => {
    expect(computeMetaBonuses(["grimoire_des_index"]).extraHandAtStart).toBe(1);
  });

  it("keeps library action economy below the previous +2 draw spike", () => {
    const bonuses = computeMetaBonuses([
      "encyclopedie_du_savoir",
      "traite_de_lenergie",
      "grimoire_des_index",
      "le_codex_infini",
    ]);

    expect(bonuses.extraDraw).toBe(1);
    expect(bonuses.extraEnergyMax).toBe(0);
    expect(bonuses.startingInk).toBe(2);
    expect(bonuses.extraHandAtStart).toBe(1);
    expect(bonuses.lootLuck).toBe(1);
  });

  it("uses the current Celtic branch sustain bonuses", () => {
    const bonuses = computeMetaBonuses(["mabinogion", "taliesin"]);

    expect(bonuses.healAfterCombatFlat).toBe(3);
    expect(bonuses.startingRegen).toBe(1);
  });

  it("gives Celtic a sustain capstone instead of more starting block", () => {
    const bonuses = computeMetaBonuses(["le_chaudron_de_dagda"]);

    expect(bonuses.healAfterCombat).toBe(5);
    expect(bonuses.startingBlock).toBe(0);
  });

  it("distributes ally slots across trees and caps them at 3", () => {
    const bonuses = computeMetaBonuses([
      "epopee_de_soundiata",
      "le_banquet",
      "le_griot_immortel",
      "epopee_de_soundiata",
    ]);

    expect(bonuses.allySlots).toBe(3);
  });

  it("keeps greek tier-1 on card reward quality instead of ally slots", () => {
    const bonuses = computeMetaBonuses(["la_republique"]);

    expect(bonuses.extraCardRewardChoices).toBe(1);
    expect(bonuses.allySlots).toBe(0);
  });

  it("uses the updated African tier-2 bonus", () => {
    expect(computeMetaBonuses(["rites_de_passage"]).startingRegen).toBe(1);
    expect(computeMetaBonuses(["rites_de_passage"]).allySlots).toBe(0);
  });

  it("shifts African reward quality from extra card choices to loot luck", () => {
    const bonuses = computeMetaBonuses(["contes_d_anansi"]);

    expect(bonuses.lootLuck).toBe(1);
    expect(bonuses.extraCardRewardChoices).toBe(0);
  });

  it("gives Lovecraftian resilience, focus, and loot quality", () => {
    const bonuses = computeMetaBonuses([
      "necronomicon_fragment",
      "cultes_innommables",
      "le_signe_des_anciens",
    ]);

    expect(bonuses.extraHp).toBe(10);
    expect(bonuses.startingFocus).toBe(1);
    expect(bonuses.lootLuck).toBe(1);
  });

  it("turns the Aztec capstone into a power spike instead of more max HP", () => {
    const bonuses = computeMetaBonuses(["le_sacrifice_cosmique"]);

    expect(bonuses.startingStrength).toBe(2);
    expect(bonuses.extraHp).toBe(0);
  });

  it("keeps only one flat post-combat heal in the Aztec branch", () => {
    const bonuses = computeMetaBonuses([
      "calendrier_de_pierre",
      "rite_du_soleil_noir",
    ]);

    expect(bonuses.healAfterCombatFlat).toBe(3);
    expect(bonuses.attackBonus).toBe(1);
  });
});
