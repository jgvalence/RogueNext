"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { getCurrentLocale, i18n } from "@/lib/i18n";

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    const syncHtmlLang = () => {
      document.documentElement.lang = getCurrentLocale();
    };
    syncHtmlLang();
    i18n.on("languageChanged", syncHtmlLang);
    return () => {
      i18n.off("languageChanged", syncHtmlLang);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
