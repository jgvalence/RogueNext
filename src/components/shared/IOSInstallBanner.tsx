"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "ios-install-dismissed";

export function IOSInstallBanner() {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    setShow(isIOS && !isStandalone && !dismissed);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[200] flex items-center gap-3 rounded-xl border border-slate-600/60 bg-slate-900/95 px-4 py-3 shadow-2xl backdrop-blur-sm sm:inset-x-auto sm:left-1/2 sm:w-80 sm:-translate-x-1/2">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-white">
          {t("layout.iosInstallTitle")}
        </p>
        <p className="mt-0.5 text-xs text-amber-300/90">
          {t("layout.iosInstallHint")}
        </p>
      </div>
      <button
        onClick={dismiss}
        aria-label={t("layout.iosInstallDismiss")}
        className="shrink-0 rounded p-1 text-slate-400 transition hover:text-white"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
