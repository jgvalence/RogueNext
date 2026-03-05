"use client";

import { useEffect, useMemo, useState } from "react";
import { RogueButton, RogueTag, RogueTooltip } from "@/components/ui/rogue";
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
import {
  localizeRunConditionDescription,
  localizeRunConditionName,
} from "@/lib/i18n/run-condition-text";
import { characterDefinitions } from "@/game/data/characters";

interface RunSetupScreenProps {
  runState: RunState;
  cardDefs: Map<string, CardDefinition>;
  allyDefs: Map<string, AllyDefinition>;
  onContinue: (draft: RunSetupDraft) => void;
}

export interface RunSetupDraft {
  characterId: string;
  difficultyLevel: number | null;
  modeConditionId: string | null;
  normalConditionId: string | null;
  selectedStartOffers: StartMerchantOffer[];
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

const START_MERCHANT_RESOURCE_KEYS = [
  "PAGES",
  "RUNES",
  "LAURIERS",
  "GLYPHES",
  "FRAGMENTS",
  "OBSIDIENNE",
  "AMBRE",
  "SCEAUX",
  "MASQUES",
] as const;

export function RunSetupScreen({
  runState,
  cardDefs,
  allyDefs,
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
  const initialCharacterId = runState.characterId ?? "scribe";
  const initialDifficulty = runState.selectedDifficultyLevel;
  const initialSelectedOfferIds = useMemo(
    () => runState.startMerchantPurchasedOfferIds ?? [],
    [runState.startMerchantPurchasedOfferIds]
  );
  const [draftCharacterId, setDraftCharacterId] = useState(initialCharacterId);
  const [draftDifficulty, setDraftDifficulty] = useState<number | null>(
    initialDifficulty
  );
  const [draftModeConditionId, setDraftModeConditionId] = useState<
    string | null
  >(null);
  const [draftNormalConditionId, setDraftNormalConditionId] = useState<
    string | null
  >(null);
  const [draftSelectedOfferIds, setDraftSelectedOfferIds] = useState<string[]>(
    initialSelectedOfferIds
  );

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

  useEffect(() => {
    setDraftCharacterId(initialCharacterId);
    setDraftDifficulty(initialDifficulty);
    setDraftModeConditionId(selectedModeConditionId);
    setDraftNormalConditionId(selectedNormalConditionId);
    setDraftSelectedOfferIds([...initialSelectedOfferIds]);
  }, [
    initialCharacterId,
    initialDifficulty,
    selectedModeConditionId,
    selectedNormalConditionId,
    initialSelectedOfferIds,
  ]);

  const fallbackCharacterChoices = useMemo(() => {
    const knownChoices = Object.keys(runState.difficultyMaxByCharacter ?? {});
    if (knownChoices.length === 0) return [initialCharacterId];
    const knownSet = new Set(knownChoices);
    return characterDefinitions
      .map((character) => character.id)
      .filter((characterId) => knownSet.has(characterId));
  }, [runState.difficultyMaxByCharacter, initialCharacterId]);

  const characterChoices = useMemo(() => {
    const pendingCharacterChoices = runState.pendingCharacterChoices ?? [];
    if (pendingCharacterChoices.length > 0) return pendingCharacterChoices;
    return fallbackCharacterChoices;
  }, [runState.pendingCharacterChoices, fallbackCharacterChoices]);
  const hasCharacterChoice = characterChoices.length > 1;

  const difficultyChoices = useMemo(() => {
    const difficultyMaxByCharacter = runState.difficultyMaxByCharacter ?? {};
    const characterMax = difficultyMaxByCharacter[draftCharacterId];
    if (typeof characterMax === "number" && Number.isFinite(characterMax)) {
      const max = Math.max(0, Math.floor(characterMax));
      return Array.from({ length: max + 1 }, (_, index) => index);
    }
    const fallback = runState.pendingDifficultyLevels ?? [0];
    return fallback.length > 0 ? fallback : [0];
  }, [
    draftCharacterId,
    runState.difficultyMaxByCharacter,
    runState.pendingDifficultyLevels,
  ]);

  useEffect(() => {
    if (draftDifficulty === null) return;
    if (!difficultyChoices.includes(draftDifficulty)) {
      setDraftDifficulty(null);
    }
  }, [draftDifficulty, difficultyChoices]);

  const normalConditionChoices = useMemo(() => {
    const pending = normalizeRunConditionIds(
      runState.pendingRunConditionChoices ?? []
    ).filter((id) => id !== INFINITE_RUN_CONDITION_ID);
    const withSelected = draftNormalConditionId
      ? [draftNormalConditionId, ...pending]
      : pending;
    const dedupedWithSelected = Array.from(new Set(withSelected));
    const withVanilla = dedupedWithSelected.includes(VANILLA_RUN_CONDITION_ID)
      ? dedupedWithSelected
      : [VANILLA_RUN_CONDITION_ID, ...dedupedWithSelected];
    return Array.from(new Set(withVanilla)).slice(0, 3);
  }, [runState.pendingRunConditionChoices, draftNormalConditionId]);

  const draftSelectedOfferIdSet = useMemo(
    () => new Set(draftSelectedOfferIds),
    [draftSelectedOfferIds]
  );
  const draftSelectedOffers = useMemo(
    () => offers.filter((offer) => draftSelectedOfferIdSet.has(offer.id)),
    [offers, draftSelectedOfferIdSet]
  );
  const remainingResources = useMemo(() => {
    const base = getRemainingStartMerchantResources(runState);
    const remaining: Record<string, number> = {};
    for (const resource of START_MERCHANT_RESOURCE_KEYS) {
      remaining[resource] = base[resource] ?? 0;
    }
    for (const offer of draftSelectedOffers) {
      for (const [resource, amount] of Object.entries(offer.cost)) {
        remaining[resource] = Math.max(
          0,
          (remaining[resource] ?? 0) - (amount ?? 0)
        );
      }
    }
    return remaining;
  }, [runState, draftSelectedOffers]);

  const isDifficultyValid =
    draftDifficulty !== null && difficultyChoices.includes(draftDifficulty);
  const canContinue =
    isDifficultyValid &&
    draftModeConditionId !== null &&
    (draftModeConditionId === INFINITE_RUN_CONDITION_ID ||
      draftNormalConditionId !== null);

  const visibleResources = Object.entries(remainingResources).filter(
    ([, amount]) => amount > 0
  );

  const toggleDraftStartOffer = (offer: StartMerchantOffer): void => {
    const isSelected = draftSelectedOfferIdSet.has(offer.id);
    if (isSelected) {
      setDraftSelectedOfferIds((prev) =>
        prev.filter((offerId) => offerId !== offer.id)
      );
      return;
    }
    if (!canAfford(remainingResources, offer)) return;
    setDraftSelectedOfferIds((prev) => [...prev, offer.id]);
  };

  const handleContinue = (): void => {
    if (!canContinue) return;
    onContinue({
      characterId: draftCharacterId,
      difficultyLevel: draftDifficulty,
      modeConditionId: draftModeConditionId,
      normalConditionId:
        draftModeConditionId === VANILLA_RUN_CONDITION_ID
          ? draftNormalConditionId
          : null,
      selectedStartOffers: draftSelectedOffers,
    });
  };

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

        {/* Character selection (when 2+ are available) */}
        {hasCharacterChoice && (
          <section className="rounded-2xl border border-amber-100/15 bg-[#0A1118]/80 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.3)] sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100/80">
                {t("runSetup.sections.character")}
              </h3>
              {hasCharacterChoice && (
                <RogueTag
                  bordered
                  className="!m-0 rounded border-violet-300/35 bg-violet-300/15 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-violet-100"
                >
                  {t(`characters.${draftCharacterId}.name`, draftCharacterId)}
                </RogueTag>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {characterChoices.map((charId) => {
                const charDef = characterDefinitions.find(
                  (c) => c.id === charId
                );
                if (!charDef) return null;
                const isSelected = draftCharacterId === charId;
                const slots = runState.metaBonuses?.unlockedPowerSlots ?? [1];
                return (
                  <RogueButton
                    key={charId}
                    type="text"
                    onClick={() => {
                      setDraftCharacterId(charId);
                      const charMax =
                        runState.difficultyMaxByCharacter?.[charId];
                      const maxDifficulty =
                        typeof charMax === "number" && Number.isFinite(charMax)
                          ? Math.max(0, Math.floor(charMax))
                          : 0;
                      setDraftDifficulty((current) => {
                        if (current === null) return null;
                        return current <= maxDifficulty ? current : null;
                      });
                    }}
                    className={`!flex !h-auto !w-full !flex-col !items-start !justify-start !whitespace-normal !rounded-xl !border !p-4 !text-left !transition ${
                      isSelected
                        ? "!border-violet-300/55 !bg-violet-300/10"
                        : "!border-amber-100/15 !bg-amber-100/5 hover:!border-amber-300/45"
                    }`}
                  >
                    <p className="text-base font-bold text-amber-50">
                      {t(`characters.${charId}.name`, charId)}
                    </p>
                    <p className="mt-1 text-xs italic text-amber-100/60">
                      {t(`characters.${charId}.description`, "")}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {charDef.powers.map((power, i) => {
                        const unlocked = slots.includes(i + 1);
                        const powerLabel = t(
                          `inkGauge.powers.${power}.label`,
                          power
                        );
                        const powerDescription = t(
                          `inkGauge.powers.${power}.desc`,
                          ""
                        );
                        const powerTooltip = powerDescription
                          ? `${powerLabel}: ${powerDescription}`
                          : powerLabel;
                        const tooltip = unlocked
                          ? powerTooltip
                          : `${t("playerStats.inkPowerLocked")} - ${powerTooltip}`;
                        return (
                          <RogueTooltip key={power} title={tooltip}>
                            <RogueTag
                              bordered={false}
                              aria-label={tooltip}
                              className={`!m-0 rounded px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider ${
                                unlocked
                                  ? "bg-violet-400/20 text-violet-200"
                                  : "bg-amber-100/5 text-amber-100/30"
                              }`}
                            >
                              {unlocked
                                ? t(`inkGauge.powers.${power}.label`, power)
                                : "\uD83D\uDD12"}
                            </RogueTag>
                          </RogueTooltip>
                        );
                      })}
                    </div>
                  </RogueButton>
                );
              })}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-amber-100/15 bg-[#0A1118]/80 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.3)] sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100/80">
              {t("runSetup.sections.difficulty")}
            </h3>
            {draftDifficulty !== null && (
              <RogueTag
                bordered
                className="!m-0 rounded border-emerald-300/35 bg-emerald-300/15 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-emerald-100"
              >
                {t(`runDifficulty.levels.${draftDifficulty}.chapter`)}
              </RogueTag>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {difficultyChoices.map((level) => {
              const isSelected = draftDifficulty === level;
              return (
                <RogueButton
                  key={level}
                  type="text"
                  onClick={() => setDraftDifficulty(level)}
                  className={`!flex !h-auto !w-full !flex-col !items-start !justify-start !whitespace-normal !rounded-xl !border !p-4 !text-left !transition ${
                    isSelected
                      ? "!border-emerald-300/55 !bg-emerald-300/10"
                      : "!border-amber-100/15 !bg-amber-100/5 hover:!border-amber-300/45"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-100/70">
                    {t(`runDifficulty.levels.${level}.chapter`)}
                  </p>
                  <p className="mt-1 text-base font-bold text-amber-50">
                    {t(`runDifficulty.levels.${level}.name`)}
                  </p>
                  <p className="text-xs italic text-amber-700/80">
                    {t(`runDifficulty.levels.${level}.subtitle`)}
                  </p>
                  <p className="mt-1 text-xs text-amber-100/70">
                    {t(`runDifficulty.levels.${level}.description`)}
                  </p>
                </RogueButton>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-amber-100/15 bg-[#0A1118]/80 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.3)] sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100/80">
              {t("runSetup.sections.runType")}
            </h3>
            {draftModeConditionId && (
              <RogueTag
                bordered
                className="!m-0 rounded border-cyan-300/35 bg-cyan-300/15 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-cyan-100"
              >
                {t("runSetup.selected")}
              </RogueTag>
            )}
          </div>
          <p className="mb-3 text-xs text-amber-100/65">
            {t("runSetup.modeHint")}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[VANILLA_RUN_CONDITION_ID, INFINITE_RUN_CONDITION_ID].map(
              (modeConditionId) => {
                const isSelected = draftModeConditionId === modeConditionId;
                const title =
                  modeConditionId === INFINITE_RUN_CONDITION_ID
                    ? t("runSetup.modeInfinite")
                    : t("runSetup.modeNormal");
                const description =
                  modeConditionId === INFINITE_RUN_CONDITION_ID
                    ? t("runSetup.modeInfiniteDescription")
                    : t("runSetup.modeNormalDescription");
                return (
                  <RogueButton
                    key={modeConditionId}
                    type="text"
                    onClick={() => {
                      if (modeConditionId === INFINITE_RUN_CONDITION_ID) {
                        setDraftModeConditionId(INFINITE_RUN_CONDITION_ID);
                        return;
                      }
                      setDraftModeConditionId(VANILLA_RUN_CONDITION_ID);
                      setDraftNormalConditionId(
                        (current) => current ?? VANILLA_RUN_CONDITION_ID
                      );
                    }}
                    disabled={draftDifficulty === null}
                    className={`!flex !h-auto !w-full !flex-col !items-start !justify-start !whitespace-normal !rounded-xl !border !p-4 !text-left !transition ${
                      isSelected
                        ? "!border-cyan-300/60 !bg-cyan-300/10"
                        : "!border-amber-100/15 !bg-amber-100/5 hover:!border-amber-300/45"
                    } disabled:!cursor-not-allowed disabled:!opacity-65`}
                  >
                    <RogueTag
                      bordered
                      className="!m-0 rounded border-cyan-300/35 bg-cyan-300/15 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-cyan-100"
                    >
                      {t("runSetup.modeType")}
                    </RogueTag>
                    <p className="mt-2 text-base font-bold text-amber-50">
                      {title}
                    </p>
                    <p className="mt-1 text-xs text-amber-100/70">
                      {description}
                    </p>
                  </RogueButton>
                );
              }
            )}
          </div>
        </section>

        {draftModeConditionId === VANILLA_RUN_CONDITION_ID && (
          <section className="rounded-2xl border border-amber-100/15 bg-[#0A1118]/80 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.3)] sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100/80">
                {t("runSetup.sections.runCondition")}
              </h3>
              {draftNormalConditionId && (
                <RogueTag
                  bordered
                  className="!m-0 rounded border-cyan-300/35 bg-cyan-300/15 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-cyan-100"
                >
                  {t("runSetup.selected")}
                </RogueTag>
              )}
            </div>
            <p className="mb-3 text-xs text-amber-100/65">
              {t("runCondition.select.subtitle")}
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {normalConditionChoices.map((conditionId) => {
                const condition = getRunConditionById(conditionId);
                if (!condition) return null;
                const conditionName = localizeRunConditionName(condition.id, t);
                const conditionDescription = localizeRunConditionDescription(
                  condition.id,
                  t
                );
                const isSelected = draftNormalConditionId === condition.id;
                return (
                  <RogueButton
                    key={condition.id}
                    type="text"
                    onClick={() => setDraftNormalConditionId(condition.id)}
                    disabled={
                      draftDifficulty === null ||
                      draftModeConditionId !== VANILLA_RUN_CONDITION_ID
                    }
                    className={`!flex !h-auto !w-full !flex-col !items-start !justify-start !whitespace-normal !rounded-xl !border !p-4 !text-left !transition ${
                      isSelected
                        ? "!border-cyan-300/60 !bg-cyan-300/10"
                        : "!border-amber-100/15 !bg-amber-100/5 hover:!border-amber-300/45"
                    } disabled:!cursor-not-allowed disabled:!opacity-65`}
                  >
                    <RogueTag
                      bordered
                      className="!m-0 rounded border-cyan-300/35 bg-cyan-300/15 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-cyan-100"
                    >
                      {t(`runCondition.category.${condition.category}`)}
                    </RogueTag>
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
                  </RogueButton>
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
                <RogueTag
                  bordered
                  className="!m-0 rounded border-amber-100/20 bg-amber-100/5 px-2 py-0.5 text-[0.65rem] text-amber-100/65"
                >
                  {t("startMerchant.noResources")}
                </RogueTag>
              ) : (
                visibleResources.map(([resource, amount]) => (
                  <RogueTag
                    key={resource}
                    bordered
                    className="!m-0 rounded border-emerald-300/35 bg-emerald-300/15 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-100"
                  >
                    {t(`reward.resources.${resource}`, resource)}: {amount}
                  </RogueTag>
                ))
              )}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => {
              const isSelected = draftSelectedOfferIdSet.has(offer.id);
              const affordable = canAfford(remainingResources, offer);
              return (
                <RogueButton
                  key={offer.id}
                  type="text"
                  disabled={!isSelected && !affordable}
                  onClick={() => toggleDraftStartOffer(offer)}
                  className={`!flex !h-auto !w-full !flex-col !items-start !justify-start !whitespace-normal !rounded-xl !border !p-4 !text-left !transition disabled:!cursor-not-allowed disabled:!opacity-55 ${
                    isSelected
                      ? "!border-emerald-300/60 !bg-emerald-300/10"
                      : "!border-amber-100/15 !bg-amber-100/5 enabled:hover:!border-amber-300/45"
                  }`}
                >
                  <RogueTag
                    bordered
                    className="!m-0 rounded border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-amber-100"
                  >
                    {t(getOfferTypeLabel(offer.type))}
                  </RogueTag>
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
                    {isSelected
                      ? t("runSetup.selected")
                      : affordable
                        ? t("startMerchant.trade")
                        : t("startMerchant.insufficient")}
                  </p>
                </RogueButton>
              );
            })}
          </div>
        </section>

        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-amber-100/60">
            {canContinue ? t("runSetup.readyHint") : t("runSetup.missingHint")}
          </p>
          <RogueButton
            type="primary"
            onClick={handleContinue}
            disabled={!canContinue}
            className="!h-auto !rounded-lg !px-6 !py-2 !text-sm !font-bold !uppercase !tracking-[0.12em]"
          >
            {t("runSetup.continue")}
          </RogueButton>
        </div>
      </div>
    </div>
  );
}
