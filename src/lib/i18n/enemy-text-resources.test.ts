import { describe, expect, it } from "vitest";
import { enemyDefinitions } from "@/game/data/enemies";
import { i18n } from "@/lib/i18n";
import {
  getAllEnemyTextEntries,
  getMissingFrenchEnemyNameIds,
} from "@/lib/i18n/enemy-text-resources";
import {
  localizeEnemyLoreEntry,
  localizeEnemyName,
} from "@/lib/i18n/entity-text";

describe("enemy bestiary localization resources", () => {
  it("covers every enemy definition in English", () => {
    const entries = getAllEnemyTextEntries("en");

    for (const definition of enemyDefinitions) {
      const entry = entries[definition.id];
      expect(entry, definition.id).toBeDefined();
      expect(entry?.name).toBe(definition.name);
      expect(entry?.lore.trim().length).toBeGreaterThan(0);
      expect(entry?.loreEntries).toHaveLength(3);
    }
  });

  it("covers every enemy definition in French", () => {
    const entries = getAllEnemyTextEntries("fr");

    expect(getMissingFrenchEnemyNameIds()).toEqual([]);

    for (const definition of enemyDefinitions) {
      const entry = entries[definition.id];
      expect(entry, definition.id).toBeDefined();
      expect(entry?.name.trim().length).toBeGreaterThan(0);
      expect(entry?.lore.trim().length).toBeGreaterThan(0);
      expect(entry?.loreEntries).toHaveLength(3);
    }
  });

  it("serves French bestiary text through entity localization helpers", async () => {
    await i18n.changeLanguage("fr");

    expect(localizeEnemyName("chapter_guardian", "Chapter Guardian")).toBe(
      "Gardien de chapitre"
    );
    expect(localizeEnemyLoreEntry("chapter_guardian", 0, "")).toContain(
      "Gardien de chapitre"
    );
  });

  it("keeps enemy definitions free of generated lore text", () => {
    const definition = enemyDefinitions.find(
      (enemy) => enemy.id === "chapter_guardian"
    );
    const entry = getAllEnemyTextEntries("en").chapter_guardian;

    expect(definition?.loreText).toBeUndefined();
    expect(definition?.loreEntries).toBeUndefined();
    expect(entry).toBeDefined();
    expect(entry?.loreEntries).toHaveLength(3);
  });
});
