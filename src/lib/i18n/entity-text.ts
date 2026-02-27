import { getCurrentLocale, i18n } from "@/lib/i18n";

function getLocaleString(key: string): string | null {
  const locale = getCurrentLocale();
  const value = i18n.getResource(locale, "translation", key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function localizeRelicName(
  relicId: string | undefined,
  fallback: string | undefined
): string {
  if (!relicId) return fallback ?? "";
  return getLocaleString(`relics.${relicId}.name`) ?? fallback ?? relicId;
}

export function localizeRelicDescription(
  relicId: string | undefined,
  fallback: string | undefined
): string {
  if (!relicId) return fallback ?? "";
  return (
    getLocaleString(`relics.${relicId}.description`) ?? fallback ?? relicId
  );
}

export function localizeUsableItemName(
  usableItemId: string | undefined,
  fallback: string | undefined
): string {
  if (!usableItemId) return fallback ?? "";
  return (
    getLocaleString(`usableItems.${usableItemId}.name`) ??
    fallback ??
    usableItemId
  );
}

export function localizeUsableItemDescription(
  usableItemId: string | undefined,
  fallback: string | undefined
): string {
  if (!usableItemId) return fallback ?? "";
  return (
    getLocaleString(`usableItems.${usableItemId}.description`) ??
    fallback ??
    usableItemId
  );
}
