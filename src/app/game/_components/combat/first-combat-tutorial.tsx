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

  const stepIcons: Record<string, string> = {
    cards: "▱",
    energy: "◆",
    armor: "◇",
    incomingDamage: "⚔",
    ink: "●",
    inkPowers: "✦",
    inkedCard: "+",
    deckCycle: "↻",
    endTurn: "→",
  };

  return (
    <div
      data-keep-selection="true"
      className="absolute inset-x-2 bottom-2 z-30 max-h-[68dvh] overflow-y-auto rounded-2xl border border-cyan-300/45 bg-[linear-gradient(145deg,rgba(8,47,73,0.97),rgba(2,6,23,0.98)_62%)] p-4 shadow-[0_20px_70px_rgba(8,145,178,0.3)] backdrop-blur-md lg:bottom-auto lg:left-auto lg:right-3 lg:top-12 lg:max-h-none lg:w-[min(28rem,calc(100%-1.5rem))] lg:overflow-visible"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-400/10 text-xl font-black text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.12)]">
          {stepIcons[currentStep] ?? "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/75">
            {t("combat.firstCombatTutorial.kicker")}
          </p>
          <h3 className="mt-1 text-base font-black uppercase tracking-[0.08em] text-cyan-50">
            {t(`combat.firstCombatTutorial.steps.${currentStep}.title`)}
          </h3>
        </div>
        <span className="rounded-full border border-cyan-300/20 bg-cyan-950/60 px-2 py-1 text-[9px] font-bold tabular-nums text-cyan-100/70">
          {stepIndex + 1}/{totalSteps}
        </span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-100/90 sm:text-sm">
        {t(`combat.firstCombatTutorial.steps.${currentStep}.description`)}
      </p>
      {isNextDisabled && (
        <div className="mt-3 rounded-xl border border-amber-300/25 bg-amber-500/10 px-3 py-2">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-300/75">
            {t("combat.firstCombatTutorial.actionRequired")}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-amber-50/80">
            {t(`combat.firstCombatTutorial.steps.${currentStep}.action`)}
          </p>
        </div>
      )}
      <div className="mt-4 flex gap-1" aria-hidden="true">
        {Array.from({ length: totalSteps }, (_, index) => (
          <span
            key={index}
            className={`h-1 flex-1 rounded-full ${
              index <= stepIndex ? "bg-cyan-300" : "bg-slate-700"
            }`}
          />
        ))}
      </div>
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
