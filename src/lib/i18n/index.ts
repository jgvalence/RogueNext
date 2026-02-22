import i18n from "i18next";
import { initReactI18next } from "react-i18next";
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

function detectInitialLocale(): SupportedLocale {
  if (typeof window === "undefined") {
    return fallbackLocale;
  }

  const savedLocale = window.localStorage.getItem(localeStorageKey);
  if (savedLocale && isSupportedLocale(savedLocale)) {
    return savedLocale;
  }

  const browserLocale = window.navigator.language.split("-")[0]?.toLowerCase();
  if (browserLocale && isSupportedLocale(browserLocale)) {
    return browserLocale;
  }

  return fallbackLocale;
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: detectInitialLocale(),
    fallbackLng: fallbackLocale,
    supportedLngs: supportedLocales,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}

export function setLocale(locale: SupportedLocale): void {
  i18n.changeLanguage(locale);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(localeStorageKey, locale);
    document.documentElement.lang = locale;
  }
}

export function getCurrentLocale(): SupportedLocale {
  const resolved = i18n.resolvedLanguage ?? i18n.language;
  return isSupportedLocale(resolved) ? resolved : fallbackLocale;
}

export { i18n };
