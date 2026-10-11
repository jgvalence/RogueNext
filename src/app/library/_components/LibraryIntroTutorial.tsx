"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { RogueAlert, RogueButton, RogueModal } from "@/components/ui/rogue";

interface LibraryIntroTutorialProps {
  error?: string | null;
  isPending?: boolean;
  onDismiss: () => void;
}

export function LibraryIntroTutorial({
  error,
  isPending = false,
  onDismiss,
}: LibraryIntroTutorialProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  // Ant Design's portal must open after hydration, including the first visit.
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <RogueModal
      open
      centered
      width={720}
      footer={null}
      closable={false}
      maskClosable={false}
      keyboard={false}
      className="story-modal"
      title={t("library.firstVisitTutorial.title")}
    >
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/85">
          {t("library.firstVisitTutorial.kicker")}
        </p>
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

        {error && (
          <RogueAlert type="error" showIcon message={error} className="mt-4" />
        )}
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
    </RogueModal>
  );
}
