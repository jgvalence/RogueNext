"use client";

import { useTranslation } from "react-i18next";
import { RogueButton } from "@/components/ui/rogue";

interface LibraryIntroTutorialProps {
  isPending?: boolean;
  onDismiss: () => void;
}

export function LibraryIntroTutorial({
  isPending = false,
  onDismiss,
}: LibraryIntroTutorialProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl border border-amber-500/25 bg-slate-950/95 p-5 shadow-[0_28px_90px_rgba(2,6,23,0.72)] sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/85">
          {t("library.firstVisitTutorial.kicker")}
        </p>
        <h2 className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">
          {t("library.firstVisitTutorial.title")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-200/90">
          {t("library.firstVisitTutorial.description")}
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-950/30 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-200">
              {t("library.firstVisitTutorial.resourcesTitle")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-200/90">
              {t("library.firstVisitTutorial.resourcesDescription")}
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/25 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-200">
              {t("library.firstVisitTutorial.treeTitle")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-200/90">
              {t("library.firstVisitTutorial.treeDescription")}
            </p>
          </div>
        </div>

        <p className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
          {t("library.firstVisitTutorial.tip")}
        </p>

        <div className="mt-5 flex justify-end">
          <RogueButton
            type="primary"
            loading={isPending}
            onClick={onDismiss}
            className="!h-auto !rounded-xl !bg-amber-600 !px-4 !py-2.5 !text-xs !font-bold !uppercase !tracking-[0.12em] hover:!bg-amber-500"
          >
            {t("library.firstVisitTutorial.gotIt")}
          </RogueButton>
        </div>
      </div>
    </div>
  );
}
