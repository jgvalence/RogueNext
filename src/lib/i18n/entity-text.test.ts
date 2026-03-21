import { describe, expect, it } from "vitest";
import { i18n } from "@/lib/i18n";
import {
  localizeAllyAbilityName,
  localizeAllyName,
  localizeEnemyAbilityName,
  localizeEnemyName,
  localizeRelicDescription,
  localizeRelicName,
} from "@/lib/i18n/entity-text";

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

  it("localizes scripted enemy names and combat intent names in French", async () => {
    await i18n.changeLanguage("fr");

    expect(localizeEnemyName("hydra_head_left", "Hydra Head")).toBe(
      "Tete gauche de l'Hydre"
    );
    expect(
      localizeEnemyName("archivist_black_inkwell", "Black Inkwell")
    ).toBe("Encrier noir");
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
    expect(
      localizeAllyAbilityName("scribe_apprentice", "Paper Volley")
    ).toBe("Volee de pages");
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
