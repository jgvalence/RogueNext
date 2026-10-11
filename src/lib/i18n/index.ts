import i18n from "i18next";
import { en } from "./messages/en";
import { fr } from "./messages/fr";

export const supportedLocales = ["fr", "en"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

const fallbackLocale: SupportedLocale = "fr";
const localeStorageKey = "rogue-next-locale";

const resources = {
  fr: { translation: fr },
  en: { translation: en },
} as const;

function isSupportedLocale(value: string): value is SupportedLocale {
  return supportedLocales.includes(value as SupportedLocale);
}

function detectPreferredLocale(): SupportedLocale {
  if (typeof window === "undefined") {
    return fallbackLocale;
  }

  try {
    const savedLocale = window.localStorage.getItem(localeStorageKey);
    if (savedLocale && isSupportedLocale(savedLocale)) return savedLocale;
  } catch {
    /* Storage can be disabled; the browser language still works. */
  }

  const browserLocale = window.navigator.language.split("-")[0]?.toLowerCase();
  if (browserLocale && isSupportedLocale(browserLocale)) {
    return browserLocale;
  }

  return fallbackLocale;
}

if (!i18n.isInitialized) {
  i18n.init({
    resources,
    // Server HTML and the first client render must use the same language.
    lng: fallbackLocale,
    fallbackLng: fallbackLocale,
    supportedLngs: supportedLocales,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}

export function setLocale(locale: SupportedLocale): void {
  i18n.changeLanguage(locale);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(localeStorageKey, locale);
    } catch {
      /* Keep language switching usable. */
    }
    document.documentElement.lang = locale;
  }
}

export function restorePreferredLocale(): void {
  if (typeof window !== "undefined")
    i18n.changeLanguage(detectPreferredLocale());
}

export function getCurrentLocale(): SupportedLocale {
  const resolved = i18n.resolvedLanguage ?? i18n.language;
  return isSupportedLocale(resolved) ? resolved : fallbackLocale;
}

export { i18n };
