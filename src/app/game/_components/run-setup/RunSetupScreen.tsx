"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { CardDefinition } from "@/game/schemas/cards";
import type { AllyDefinition } from "@/game/schemas/entities";
import type { RunState } from "@/game/schemas/run-state";
import { createRNG } from "@/game/engine/rng";
import {
  generateStartMerchantOffers,
  getRemainingStartMerchantResources,
  type StartMerchantOffer,
} from "@/game/engine/merchant";
import {
  INFINITE_RUN_CONDITION_ID,
  VANILLA_RUN_CONDITION_ID,
  getRunConditionById,
  normalizeRunConditionId,
  normalizeRunConditionIds,
} from "@/game/engine/run-conditions";
import {
  localizeCardDescription,
  localizeCardName,
} from "@/lib/i18n/card-text";
import {
  localizeRelicDescription,
  localizeRelicName,
  localizeUsableItemDescription,
  localizeUsableItemName,
} from "@/lib/i18n/entity-text";

interface RunSetupScreenProps {
  runState: RunState;
  cardDefs: Map<string, CardDefinition>;
  allyDefs: Map<string, AllyDefinition>;
  onSelectDifficulty: (difficultyLevel: number) => void;
  onSelectMode: (conditionId: string) => void;
  onBuyStartOffer: (offer: StartMerchantOffer) => void;
  onContinue: () => void;
}

function canAfford(
  remaining: Record<string, number>,
  offer: StartMerchantOffer
): boolean {
  return Object.entries(offer.cost).every(
    ([resource, amount]) => (remaining[resource] ?? 0) >= (amount ?? 0)
  );
}

function getOfferTypeLabel(type: StartMerchantOffer["type"]): string {
  switch (type) {
    case "CARD":
      return "startMerchant.offerType.CARD";
    case "RELIC":
      return "startMerchant.offerType.RELIC";
    case "USABLE_ITEM":
      return "startMerchant.offerType.USABLE_ITEM";
    case "ALLY":
      return "startMerchant.offerType.ALLY";
    case "BONUS_GOLD":
      return "startMerchant.offerType.BONUS_GOLD";
    case "BONUS_MAX_HP":
      return "startMerchant.offerType.BONUS_MAX_HP";
    default:
      return "startMerchant.offerType.default";
  }
}

function formatConditionFallback(conditionId: string): string {
  return conditionId
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function RunSetupScreen({
  runState,
  cardDefs,
  allyDefs,
  onSelectDifficulty,
  onSelectMode,
  onBuyStartOffer,
  onContinue,
}: RunSetupScreenProps) {
  const { t } = useTranslation();

  const offers = useMemo(
    () =>
      generateStartMerchantOffers(
        runState,
        [...cardDefs.values()],
        [...allyDefs.values()],
        createRNG(`${runState.seed}-start-merchant`)
      ),
    [runState, cardDefs, allyDefs]
  );
  const remainingResources = useMemo(
    () => getRemainingStartMerchantResources(runState),
    [runState]
  );
  const purchasedOfferIds = new Set(
    runState.startMerchantPurchasedOfferIds ?? []
  );

  const selectedDifficulty = runState.selectedDifficultyLevel;
  const selectedConditionId = normalizeRunConditionId(
    runState.selectedRunConditionId
  );
  const selectedModeConditionId = selectedConditionId
    ? selectedConditionId === INFINITE_RUN_CONDITION_ID
      ? INFINITE_RUN_CONDITION_ID
      : VANILLA_RUN_CONDITION_ID
    : null;
  const selectedNormalConditionId =
    selectedModeConditionId === VANILLA_RUN_CONDITION_ID
      ? selectedConditionId && selectedConditionId !== INFINITE_RUN_CONDITION_ID
        ? selectedConditionId
        : VANILLA_RUN_CONDITION_ID
      : null;
  const normalConditionChoices = useMemo(() => {
    const pending = normalizeRunConditionIds(
      runState.pendingRunConditionChoices ?? []
    ).filter((id) => id !== INFINITE_RUN_CONDITION_ID);
    const withSelected =
      selectedNormalConditionId && !pending.includes(selectedNormalConditionId)
        ? [selectedNormalConditionId, ...pending]
        : pending;
    const withVanilla = withSelected.includes(VANILLA_RUN_CONDITION_ID)
      ? withSelected
      : [VANILLA_RUN_CONDITION_ID, ...withSelected];
    return Array.from(new Set(withVanilla)).slice(0, 3);
  }, [runState.pendingRunConditionChoices, selectedNormalConditionId]);
  const modeLockedByCondition =
    selectedConditionId !== null &&
    selectedConditionId !== VANILLA_RUN_CONDITION_ID &&
    selectedConditionId !== INFINITE_RUN_CONDITION_ID;
  const canContinue =
    selectedDifficulty !== null &&
    selectedModeConditionId !== null &&
    (selectedModeConditionId === INFINITE_RUN_CONDITION_ID ||
      selectedNormalConditionId !== null);

  const visibleResources = Object.entries(remainingResources).filter(
    ([, amount]) => amount > 0
  );

  const getOfferName = (offer: StartMerchantOffer): string => {
    switch (offer.type) {
      case "CARD": {
        const card = offer.cardId ? cardDefs.get(offer.cardId) : undefined;
        return card ? localizeCardName(card, t) : offer.name;
      }
      case "RELIC":
        return localizeRelicName(offer.relicId, offer.name);
      case "USABLE_ITEM":
        return localizeUsableItemName(offer.usableItemId, offer.name);
      case "ALLY":
        return offer.name;
      case "BONUS_GOLD":
        return t("startMerchant.bonusGoldName");
      case "BONUS_MAX_HP":
        return t("startMerchant.bonusMaxHpName");
      default:
        return offer.name;
    }
  };

  const getOfferDescription = (offer: StartMerchantOffer): string => {
    switch (offer.type) {
      case "CARD": {
        const card = offer.cardId ? cardDefs.get(offer.cardId) : undefined;
        return card ? localizeCardDescription(card, t) : offer.description;
      }
      case "RELIC":
        return localizeRelicDescription(offer.relicId, offer.description);
      case "USABLE_ITEM":
        return localizeUsableItemDescription(
          offer.usableItemId,
          offer.description
        );
      case "ALLY":
        return offer.description;
      case "BONUS_GOLD":
        return t("startMerchant.bonusGoldDescription", {
          amount: offer.goldAmount ?? 0,
        });
      case "BONUS_MAX_HP":
        return t("startMerchant.bonusMaxHpDescription", {
          amount: offer.maxHpAmount ?? 0,
        });
      default:
        return offer.description;
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-3rem)] overflow-hidden bg-[#05090F] px-4 py-8 text-amber-50 sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 top-8 h-72 w-72 rounded-full bg-amber-700/15 blur-[100px]" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-sky-700/10 blur-[110px]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,10,0.55),rgba(2,6,10,0.95))]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl space-y-5">
        <header className="rounded-2xl border border-amber-100/15 bg-[#0A1118]/85 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-sm">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-amber-100/60">
            {t("runSetup.kicker")}
          </p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.08em] text-amber-100 sm:text-4xl">
            {t("runSetup.title")}
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-amber-100/70 sm:text-base">
            {t("runSetup.subtitle")}
          </p>
        </header>

        <section className="rounded-2xl border border-amber-100/15 bg-[#0A1118]/80 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.3)] sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100/80">
              {t("runSetup.sections.difficulty")}
            </h3>
            {selectedDifficulty !== null && (
              <span className="rounded border border-emerald-300/35 bg-emerald-300/15 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-emerald-100">
                {t("runDifficulty.levelLabel", { level: selectedDifficulty })}
              </span>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(runState.pendingDifficultyLevels ?? [0]).map((level) => {
              const isSelected = selectedDifficulty === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => onSelectDifficulty(level)}
                  disabled={selectedDifficulty !== null}
                  className={`rounded-xl border p-4 text-left transition ${
                    isSelected
                      ? "border-emerald-300/55 bg-emerald-300/10"
                      : "border-amber-100/15 bg-amber-100/5 hover:border-amber-300/45"
                  } disabled:cursor-not-allowed disabled:opacity-75`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-100/70">
                    {t("runDifficulty.levelLabel", { level })}
                  </p>
                  <p className="mt-1 text-base font-bold text-amber-50">
                    {t(`runDifficulty.levels.${level}.name`)}
                  </p>
                  <p className="mt-1 text-xs text-amber-100/70">
                    {t(`runDifficulty.levels.${level}.description`)}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-amber-100/15 bg-[#0A1118]/80 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.3)] sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100/80">
              {t("runSetup.sections.runType")}
            </h3>
            {selectedModeConditionId && (
              <span className="rounded border border-cyan-300/35 bg-cyan-300/15 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-cyan-100">
                {t("runSetup.selected")}
              </span>
            )}
          </div>
          <p className="mb-3 text-xs text-amber-100/65">
            {t("runSetup.modeHint")}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[VANILLA_RUN_CONDITION_ID, INFINITE_RUN_CONDITION_ID].map(
              (modeConditionId) => {
                const isSelected = selectedModeConditionId === modeConditionId;
                const title =
                  modeConditionId === INFINITE_RUN_CONDITION_ID
                    ? t("runSetup.modeInfinite")
                    : t("runSetup.modeNormal");
                const description =
                  modeConditionId === INFINITE_RUN_CONDITION_ID
                    ? t("runSetup.modeInfiniteDescription")
                    : t("runSetup.modeNormalDescription");
                return (
                  <button
                    key={modeConditionId}
                    type="button"
                    onClick={() => {
                      if (modeConditionId === INFINITE_RUN_CONDITION_ID) {
                        onSelectMode(INFINITE_RUN_CONDITION_ID);
                        return;
                      }
                      if (
                        selectedConditionId === null ||
                        selectedConditionId === INFINITE_RUN_CONDITION_ID
                      ) {
                        onSelectMode(VANILLA_RUN_CONDITION_ID);
                      }
                    }}
                    disabled={
                      selectedDifficulty === null || modeLockedByCondition
                    }
                    className={`rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-cyan-300/60 bg-cyan-300/10"
                        : "border-amber-100/15 bg-amber-100/5 hover:border-amber-300/45"
                    } disabled:cursor-not-allowed disabled:opacity-65`}
                  >
                    <span className="inline-flex rounded border border-cyan-300/35 bg-cyan-300/15 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-cyan-100">
                      {t("runSetup.modeType")}
                    </span>
                    <p className="mt-2 text-base font-bold text-amber-50">
                      {title}
                    </p>
                    <p className="mt-1 text-xs text-amber-100/70">
                      {description}
                    </p>
                  </button>
                );
              }
            )}
          </div>
          {modeLockedByCondition && (
            <p className="mt-3 text-[0.72rem] text-amber-200/70">
              {t("runSetup.modeLockedHint")}
            </p>
          )}
        </section>

        {selectedModeConditionId === VANILLA_RUN_CONDITION_ID && (
          <section className="rounded-2xl border border-amber-100/15 bg-[#0A1118]/80 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.3)] sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100/80">
                {t("runSetup.sections.runCondition")}
              </h3>
              {selectedNormalConditionId && (
                <span className="rounded border border-cyan-300/35 bg-cyan-300/15 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-cyan-100">
                  {t("runSetup.selected")}
                </span>
              )}
            </div>
            <p className="mb-3 text-xs text-amber-100/65">
              {t("runCondition.select.subtitle")}
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {normalConditionChoices.map((conditionId) => {
                const condition = getRunConditionById(conditionId);
                if (!condition) return null;
                const conditionName = t(
                  `runCondition.definitions.${condition.id}.name`,
                  {
                    defaultValue: formatConditionFallback(condition.id),
                  }
                );
                const conditionDescription = t(
                  `runCondition.definitions.${condition.id}.description`,
                  {
                    defaultValue: conditionName,
                  }
                );
                const isSelected = selectedNormalConditionId === condition.id;
                return (
                  <button
                    key={condition.id}
                    type="button"
                    onClick={() => onSelectMode(condition.id)}
                    disabled={
                      selectedDifficulty === null || modeLockedByCondition
                    }
                    className={`rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-cyan-300/60 bg-cyan-300/10"
                        : "border-amber-100/15 bg-amber-100/5 hover:border-amber-300/45"
                    } disabled:cursor-not-allowed disabled:opacity-65`}
                  >
                    <span className="inline-flex rounded border border-cyan-300/35 bg-cyan-300/15 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-cyan-100">
                      {t(`runCondition.category.${condition.category}`)}
                    </span>
                    <p className="mt-2 text-base font-bold text-amber-50">
                      {conditionName}
                    </p>
                    <p className="mt-1 text-xs text-amber-100/70">
                      {conditionDescription}
                    </p>
                    <p className="mt-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-amber-200/75">
                      {isSelected
                        ? t("runSetup.selected")
                        : t("runCondition.select.pickAction")}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-amber-100/15 bg-[#0A1118]/80 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.3)] sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100/80">
              {t("runSetup.sections.preGameOptions")}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {visibleResources.length === 0 ? (
                <span className="rounded border border-amber-100/20 bg-amber-100/5 px-2 py-0.5 text-[0.65rem] text-amber-100/65">
                  {t("startMerchant.noResources")}
                </span>
              ) : (
                visibleResources.map(([resource, amount]) => (
                  <span
                    key={resource}
                    className="rounded border border-emerald-300/35 bg-emerald-300/15 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-100"
                  >
                    {t(`reward.resources.${resource}`, resource)}: {amount}
                  </span>
                ))
              )}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => {
              const alreadyBought = purchasedOfferIds.has(offer.id);
              const affordable = canAfford(remainingResources, offer);
              return (
                <button
                  key={offer.id}
                  type="button"
                  disabled={alreadyBought || !affordable}
                  onClick={() => onBuyStartOffer(offer)}
                  className="rounded-xl border border-amber-100/15 bg-amber-100/5 p-4 text-left transition enabled:hover:border-amber-300/45 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  <span className="inline-flex rounded border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-amber-100">
                    {t(getOfferTypeLabel(offer.type))}
                  </span>
                  <p className="mt-2 text-sm font-bold text-amber-50">
                    {getOfferName(offer)}
                  </p>
                  <p className="mt-1 text-xs text-amber-100/70">
                    {getOfferDescription(offer)}
                  </p>
                  <p className="mt-2 text-[0.7rem] text-amber-100/75">
                    {t("startMerchant.cost")}:{" "}
                    {Object.entries(offer.cost)
                      .map(
                        ([resource, amount]) =>
                          `${amount} ${t(`reward.resources.${resource}`, resource)}`
                      )
                      .join(" + ")}
                  </p>
                  <p className="mt-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-amber-200/75">
                    {alreadyBought
                      ? t("startMerchant.bought")
                      : affordable
                        ? t("startMerchant.trade")
                        : t("startMerchant.insufficient")}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-amber-100/60">
            {canContinue ? t("runSetup.readyHint") : t("runSetup.missingHint")}
          </p>
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className="rounded-lg border border-amber-300/40 bg-amber-300/15 px-6 py-2 text-sm font-bold uppercase tracking-[0.12em] text-amber-100 transition hover:border-amber-200/65 hover:bg-amber-200/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("runSetup.continue")}
          </button>
        </div>
      </div>
    </div>
  );
}
