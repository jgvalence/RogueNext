"use client";

import { useTranslation } from "react-i18next";
import { setLocale, supportedLocales, type SupportedLocale } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  return (
    <div className="inline-flex items-center gap-1 rounded border border-slate-600/70 bg-slate-900/70 p-1">
      <span className="px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {t("common.language")}
      </span>
      {supportedLocales.map((locale) => {
        const isActive = i18n.resolvedLanguage === locale;
        return (
          <button
            key={locale}
            type="button"
            onClick={() => setLocale(locale as SupportedLocale)}
            className={`rounded px-2 py-1 text-xs font-semibold transition ${
              isActive
                ? "bg-slate-200 text-slate-900"
                : "text-slate-300 hover:bg-slate-700/70"
            }`}
          >
            {locale.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
