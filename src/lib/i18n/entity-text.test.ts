import { describe, expect, it } from "vitest";
import { relicDefinitions } from "@/game/data/relics";
import { i18n } from "@/lib/i18n";
import {
  localizeAllyAbilityName,
  localizeAllyName,
  localizeEnemyAbilityName,
  localizeEnemyName,
  localizeRelicDescription,
  localizeRelicName,
} from "@/lib/i18n/entity-text";
import { getAllRelicTextEntries } from "@/lib/i18n/relic-text-resources";

describe("relic fallback localization", () => {
  it("normalizes English relic names when raw fallbacks are French or garbled", async () => {
    await i18n.changeLanguage("en");

    expect(
      localizeRelicName("colossus_tome_plate", "Plaque du Colosse-Tome")
    ).toBe("Colossus Tome Plate");
    expect(localizeRelicName("greek_harpy_pinion", "R?mige de Harpie")).toBe(
      "Harpy Pinion"
    );
  });

  it("normalizes English relic descriptions from French source text", async () => {
    await i18n.changeLanguage("en");

    expect(
      localizeRelicDescription(
        "library_margin_inkpot",
        "La premiere SKILL de chaque tour donne +1 Ink."
      )
    ).toBe("The first Skill of each turn grants +1 Ink.");
  });

  it("normalizes French relic fallbacks without leaking English tokens", async () => {
    await i18n.changeLanguage("fr");

    expect(localizeRelicName("reactive_binding", "Reactive Binding")).toBe(
      "Reliure reactive"
    );
    expect(
      localizeRelicName("giant_baobab_seed", "Graine du Baobab GAant")
    ).toBe("Graine du Baobab geant");

    const description = localizeRelicDescription(
      "library_margin_inkpot",
      "La premiere SKILL de chaque tour donne +1 Ink."
    );

    expect(description).toContain("Competence");
    expect(description).toContain("Encre");
    expect(description).not.toContain("SKILL");
    expect(description).not.toContain("Ink");
  });

  it("prefers explicit French relic translations for venom signet", async () => {
    await i18n.changeLanguage("fr");

    expect(localizeRelicName("wyrm_venom_signet", "Wyrm Venom Signet")).toBe(
      "Sceau du ver venimeux"
    );
    expect(
      localizeRelicDescription(
        "wyrm_venom_signet",
        "Apply 1 Weak to all enemies at combat start."
      )
    ).toBe("Applique 1 Faiblesse a tous les ennemis au debut du combat.");
  });

  it("provides generated relic text entries for the whole relic pool", () => {
    const enEntries = getAllRelicTextEntries("en");
    const frEntries = getAllRelicTextEntries("fr");

    expect(Object.keys(enEntries)).toHaveLength(relicDefinitions.length);
    expect(Object.keys(frEntries)).toHaveLength(relicDefinitions.length);

    for (const relic of relicDefinitions) {
      expect(enEntries[relic.id]?.name).toBeTruthy();
      expect(enEntries[relic.id]?.description).toBeTruthy();
      expect(frEntries[relic.id]?.name).toBeTruthy();
      expect(frEntries[relic.id]?.description).toBeTruthy();
    }
  });

  it("fills missing French relic entries from generated resources", async () => {
    await i18n.changeLanguage("fr");

    expect(localizeRelicName("hunters_signet", "Hunter's Signet")).toBe(
      "Sceau du chasseur"
    );
    expect(
      localizeRelicDescription(
        "hunters_signet",
        "Once per run, at a boss room, you may choose which boss of the current biome you face."
      )
    ).toBe(
      "Une fois par run, dans une salle de boss, vous pouvez choisir quel boss du biome actuel vous affrontez."
    );
    expect(localizeRelicName("atlas_of_realms", "Atlas of Realms")).toBe(
      "Atlas des royaumes"
    );
    expect(
      localizeRelicDescription(
        "atlas_of_realms",
        "When choosing the next biome, choose from all 8 realms."
      )
    ).toBe("Lors du choix du prochain biome, choisissez parmi les 8 royaumes.");
    expect(
      localizeRelicDescription(
        "colossus_tome_plate",
        "Start each combat with 12 Block."
      )
    ).toBe("Commencez chaque combat avec 12 Armure.");
    expect(
      localizeRelicDescription(
        "giant_baobab_seed",
        "At end of turn, if you have no Block, gain 6 Block."
      )
    ).toBe("A la fin du tour, si vous n'avez pas d'Armure, gagnez 6 Armure.");
    expect(
      localizeRelicDescription(
        "library_margin_inkpot",
        "La premiere SKILL de chaque tour donne +1 Ink."
      )
    ).toBe("La premiere carte Competence de chaque tour donne +1 Encre.");
    expect(
      localizeRelicDescription(
        "library_archivist_eye",
        "Debut de combat: +1 draw, +2 Focus. La premiere Curse piochee est Exhautee."
      )
    ).toBe(
      "Au debut du combat, gagnez +1 pioche et 2 Concentration. La premiere Malediction piochee est Exhautee."
    );
    expect(
      localizeRelicDescription(
        "african_hyena_talisman",
        "Premiere ATTACK sur cible full HP: +4 degats."
      )
    ).toBe(
      "La premiere Attaque sur une cible a tous ses PV inflige 4 degats supplementaires."
    );
  });

  it("localizes scripted enemy names and combat intent names in French", async () => {
    await i18n.changeLanguage("fr");

    expect(localizeEnemyName("hydra_head_left", "Hydra Head")).toBe(
      "Tete gauche de l'Hydre"
    );
    expect(localizeEnemyName("archivist_black_inkwell", "Black Inkwell")).toBe(
      "Encrier noir"
    );
    expect(localizeEnemyAbilityName("the_archivist", "Ink Erasure")).toBe(
      "Effacement d'encre"
    );
    expect(localizeEnemyAbilityName("fenrir", "World's End")).toBe(
      "Fin du monde"
    );
  });

  it("keeps English enemy combat names stable", async () => {
    await i18n.changeLanguage("en");

    expect(localizeEnemyName("hydra_head_left", "Hydra Head")).toBe(
      "Hydra Head"
    );
    expect(localizeEnemyAbilityName("the_archivist", "Ink Erasure")).toBe(
      "Ink Erasure"
    );
  });

  it("localizes ally names and abilities in French", async () => {
    await i18n.changeLanguage("fr");

    expect(localizeAllyName("scribe_apprentice", "Scribe Apprentice")).toBe(
      "Apprenti scribe"
    );
    expect(localizeAllyName("ink_familiar", "Ink Familiar")).toBe(
      "Familier d'encre"
    );
    expect(localizeAllyAbilityName("scribe_apprentice", "Paper Volley")).toBe(
      "Volee de pages"
    );
    expect(localizeAllyAbilityName("ward_knight", "Battle Lesson")).toBe(
      "Lecon de bataille"
    );
  });

  it("keeps English ally labels stable", async () => {
    await i18n.changeLanguage("en");

    expect(localizeAllyName("scribe_apprentice", "Scribe Apprentice")).toBe(
      "Scribe Apprentice"
    );
    expect(localizeAllyAbilityName("ward_knight", "Shielded Slash")).toBe(
      "Shielded Slash"
    );
  });
});
