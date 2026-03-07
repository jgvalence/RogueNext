"use client";

import { useTranslation } from "react-i18next";

interface FirstCombatTutorialOverlayProps {
  isVisible: boolean;
  currentStep: string;
  stepIndex: number;
  totalSteps: number;
  isLastStep: boolean;
  isNextDisabled?: boolean;
  onSkip: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function FirstCombatTutorialOverlay({
  isVisible,
  currentStep,
  stepIndex,
  totalSteps,
  isLastStep,
  isNextDisabled = false,
  onSkip,
  onPrevious,
  onNext,
}: FirstCombatTutorialOverlayProps) {
  const { t } = useTranslation();

  if (!isVisible) return null;

  return (
    <div
      data-keep-selection="true"
      className="absolute inset-x-2 bottom-2 z-30 max-h-[60dvh] overflow-y-auto rounded-xl border border-cyan-400/50 bg-slate-950/95 p-3 shadow-[0_16px_50px_rgba(8,145,178,0.22)] lg:bottom-auto lg:left-auto lg:right-2 lg:top-11 lg:max-h-none lg:w-[min(26rem,calc(100%-1rem))] lg:overflow-visible"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300/85">
        {t("combat.firstCombatTutorial.kicker")}
      </p>
      <h3 className="mt-1 text-sm font-black uppercase tracking-[0.08em] text-cyan-100">
        {t(`combat.firstCombatTutorial.steps.${currentStep}.title`)}
      </h3>
      <p className="mt-1.5 text-xs text-slate-200/90">
        {t(`combat.firstCombatTutorial.steps.${currentStep}.description`)}
      </p>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-200/70">
        {t("combat.firstCombatTutorial.stepCounter", {
          current: stepIndex + 1,
          total: totalSteps,
        })}
      </p>
      <div className="mt-3 flex flex-col gap-2 border-t border-cyan-900/50 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          data-keep-selection="true"
          onClick={onSkip}
          className="self-start rounded-md border border-slate-600/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-200 transition hover:border-slate-400 sm:self-auto"
        >
          {t("combat.firstCombatTutorial.skip")}
        </button>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            data-keep-selection="true"
            onClick={onPrevious}
            disabled={stepIndex === 0}
            className="rounded-md border border-cyan-700/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-100 transition enabled:hover:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("combat.firstCombatTutorial.previous")}
          </button>
          <button
            type="button"
            data-keep-selection="true"
            onClick={onNext}
            disabled={isNextDisabled}
            className="rounded-md border border-cyan-400/80 bg-cyan-600/25 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLastStep
              ? t("combat.firstCombatTutorial.done")
              : t("combat.firstCombatTutorial.next")}
          </button>
        </div>
      </div>
    </div>
  );
}
