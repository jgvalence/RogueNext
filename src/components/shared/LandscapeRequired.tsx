"use client";

import { useTranslation } from "react-i18next";

export function LandscapeRequired() {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 hidden flex-col items-center justify-center gap-6 bg-slate-950 sm:hidden portrait:flex">
      <div className="text-5xl font-black tracking-[0.2em]">
        {t("layout.rotate")}
      </div>
      <p className="text-xl font-bold text-white">{t("layout.rotateDevice")}</p>
      <p className="text-sm text-slate-400">{t("layout.rotateHint")}</p>
    </div>
  );
}
