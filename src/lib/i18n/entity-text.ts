import {
  getAllyAbilityText,
  getAllyTextEntry,
} from "@/lib/i18n/ally-text-resources";
import { getEnemyAbilityText } from "@/lib/i18n/enemy-ability-text-resources";
import { getCurrentLocale, i18n } from "@/lib/i18n";
import { getEnemyTextEntry } from "@/lib/i18n/enemy-text-resources";
import {
  normalizeEntityFallbackText,
  normalizeRelicFallbackName,
} from "@/lib/i18n/fallback-text";

function getLocaleString(key: string): string | null {
  const locale = getCurrentLocale();
  const value = i18n.getResource(locale, "translation", key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toI18nKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function localizeRelicName(
  relicId: string | undefined,
  fallback: string | undefined
): string {
  const locale = getCurrentLocale();
  if (!relicId) {
    return fallback
      ? normalizeRelicFallbackName(undefined, fallback, locale)
      : "";
  }
  return (
    getLocaleString(`relics.${relicId}.name`) ??
    (fallback ? normalizeRelicFallbackName(relicId, fallback, locale) : relicId)
  );
}

export function localizeRelicDescription(
  relicId: string | undefined,
  fallback: string | undefined
): string {
  const locale = getCurrentLocale();
  if (!relicId) {
    return fallback ? normalizeEntityFallbackText(fallback, locale) : "";
  }
  return (
    getLocaleString(`relics.${relicId}.description`) ??
    (fallback ? normalizeEntityFallbackText(fallback, locale) : relicId)
  );
}

export function localizeUsableItemName(
  usableItemId: string | undefined,
  fallback: string | undefined
): string {
  const locale = getCurrentLocale();
  if (!usableItemId)
    return fallback ? normalizeEntityFallbackText(fallback, locale) : "";
  return (
    getLocaleString(`usableItems.${usableItemId}.name`) ??
    (fallback ? normalizeEntityFallbackText(fallback, locale) : usableItemId)
  );
}

export function localizeUsableItemDescription(
  usableItemId: string | undefined,
  fallback: string | undefined
): string {
  const locale = getCurrentLocale();
  if (!usableItemId)
    return fallback ? normalizeEntityFallbackText(fallback, locale) : "";
  return (
    getLocaleString(`usableItems.${usableItemId}.description`) ??
    (fallback ? normalizeEntityFallbackText(fallback, locale) : usableItemId)
  );
}

export function localizeAllyName(
  allyId: string | undefined,
  fallback: string | undefined
): string {
  const locale = getCurrentLocale();
  const fallbackValue = fallback ?? allyId ?? "";
  if (!allyId) return normalizeEntityFallbackText(fallbackValue, locale);
  const localizedEntry = getAllyTextEntry(locale, allyId);
  return (
    getLocaleString(`allies.${allyId}.name`) ??
    localizedEntry?.name ??
    normalizeEntityFallbackText(fallbackValue, locale)
  );
}

export function localizeAllyAbilityName(
  allyId: string | undefined,
  abilityName: string | undefined
): string {
  const locale = getCurrentLocale();
  const fallbackValue = abilityName ?? "";
  if (!fallbackValue) return "";

  const abilityKey = toI18nKey(fallbackValue);
  if (allyId && abilityKey) {
    const perAlly = getLocaleString(`allyAbilities.${allyId}.${abilityKey}`);
    if (perAlly) return perAlly;
  }

  if (abilityKey) {
    const global = getLocaleString(`allyAbilities.global.${abilityKey}`);
    if (global) return global;
  }

  const localizedAbility = getAllyAbilityText(locale, fallbackValue);
  if (localizedAbility) return localizedAbility;

  return normalizeEntityFallbackText(fallbackValue, locale);
}

export function localizeEnemyName(
  enemyId: string | undefined,
  fallback: string | undefined
): string {
  const locale = getCurrentLocale();
  const fallbackValue = fallback ?? enemyId ?? "";
  if (!enemyId) return normalizeEntityFallbackText(fallbackValue, locale);
  const localizedEntry = getEnemyTextEntry(locale, enemyId);
  return (
    getLocaleString(`enemies.${enemyId}.name`) ??
    localizedEntry?.name ??
    normalizeEntityFallbackText(fallbackValue, locale)
  );
}

export function localizeEnemyLore(
  enemyId: string | undefined,
  fallback: string | undefined
): string {
  const locale = getCurrentLocale();
  const fallbackValue = fallback ?? "";
  if (!enemyId) return normalizeEntityFallbackText(fallbackValue, locale);
  const localizedEntry = getEnemyTextEntry(locale, enemyId);
  return (
    getLocaleString(`enemies.${enemyId}.lore`) ??
    getLocaleString(`enemies.${enemyId}.loreEntries.1`) ??
    localizedEntry?.lore ??
    localizedEntry?.loreEntries[0] ??
    normalizeEntityFallbackText(fallbackValue, locale)
  );
}

export function localizeEnemyLoreEntry(
  enemyId: string | undefined,
  entryIndex: number,
  fallback: string | undefined
): string {
  const locale = getCurrentLocale();
  const fallbackValue = fallback ?? "";
  if (!enemyId) return normalizeEntityFallbackText(fallbackValue, locale);
  const normalizedIndex = Math.max(0, Math.floor(entryIndex));
  const localizedEntry = getEnemyTextEntry(locale, enemyId);

  const indexedLore =
    getLocaleString(`enemies.${enemyId}.loreEntries.${normalizedIndex + 1}`) ??
    getLocaleString(`enemies.${enemyId}.lore.${normalizedIndex + 1}`);
  if (indexedLore) return indexedLore;

  const generatedLore = localizedEntry?.loreEntries[normalizedIndex];
  if (generatedLore) return generatedLore;

  if (normalizedIndex === 0) {
    const baseLore =
      getLocaleString(`enemies.${enemyId}.lore`) ??
      getLocaleString(`enemies.${enemyId}.loreEntries.1`) ??
      localizedEntry?.lore ??
      localizedEntry?.loreEntries[0];
    if (baseLore) return baseLore;
  }

  return normalizeEntityFallbackText(fallbackValue, locale);
}

export function localizeEnemyAbilityName(
  enemyId: string | undefined,
  abilityName: string | undefined
): string {
  const locale = getCurrentLocale();
  const fallbackValue = abilityName ?? "";
  if (!fallbackValue) return "";

  const abilityKey = toI18nKey(fallbackValue);
  if (enemyId && abilityKey) {
    const perEnemy = getLocaleString(`enemyAbilities.${enemyId}.${abilityKey}`);
    if (perEnemy) return perEnemy;
  }

  if (abilityKey) {
    const global = getLocaleString(`enemyAbilities.global.${abilityKey}`);
    if (global) return global;
  }

  const localizedAbility = getEnemyAbilityText(locale, fallbackValue);
  if (localizedAbility) return localizedAbility;

  return normalizeEntityFallbackText(fallbackValue, locale);
}
