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

interface StartMerchantViewProps {
  runState: RunState;
  cardDefs: Map<string, CardDefinition>;
  allyDefs: Map<string, AllyDefinition>;
  onBuy: (offerId: string) => void;
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
      return "Carte";
    case "RELIC":
      return "Relique";
    case "USABLE_ITEM":
      return "Consommable";
    case "ALLY":
      return "Allie";
    case "BONUS_GOLD":
      return "Bonus or";
    case "BONUS_MAX_HP":
      return "Bonus PV max";
    default:
      return "Offre";
  }
}

export function StartMerchantView({
  runState,
  cardDefs,
  allyDefs,
  onBuy,
  onContinue,
}: StartMerchantViewProps) {
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

  const remaining = useMemo(
    () => getRemainingStartMerchantResources(runState),
    [runState]
  );
  const purchased = new Set(runState.startMerchantPurchasedOfferIds ?? []);

  const resources = Object.entries(remaining).filter(
    ([, amount]) => amount > 0
  );

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col items-center gap-6 px-4 py-10">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-emerald-400/70">
          Pre-run
        </p>
        <h2 className="mt-1 text-3xl font-bold text-emerald-100">
          Marchand des Origines
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Echange tes ressources de bibliotheque contre des bonus de run.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {resources.length === 0 && (
          <span className="rounded border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs text-slate-300">
            Aucune ressource disponible
          </span>
        )}
        {resources.map(([resource, amount]) => (
          <span
            key={resource}
            className="rounded border border-emerald-700/50 bg-emerald-950/60 px-2.5 py-1 text-xs font-semibold text-emerald-300"
          >
            {t(`reward.resources.${resource}`, resource)}: {amount}
          </span>
        ))}
      </div>

      <div className="grid w-full max-w-5xl gap-4 md:grid-cols-3">
        {offers.map((offer) => {
          const alreadyBought = purchased.has(offer.id);
          const affordable = canAfford(remaining, offer);
          return (
            <button
              key={offer.id}
              type="button"
              disabled={alreadyBought || !affordable}
              onClick={() => onBuy(offer.id)}
              className="flex h-full flex-col gap-3 rounded-xl border border-emerald-800/40 bg-slate-900/85 p-5 text-left transition-all duration-200 enabled:hover:border-emerald-500/70 enabled:hover:bg-slate-800/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="w-fit rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                {getOfferTypeLabel(offer.type)}
              </span>
              <h3 className="text-base font-bold text-emerald-100">
                {offer.name}
              </h3>
              <p className="text-xs text-slate-400">{offer.description}</p>
              <p className="text-xs text-slate-300">
                Cout:{" "}
                {Object.entries(offer.cost)
                  .map(
                    ([resource, amount]) =>
                      `${amount} ${t(`reward.resources.${resource}`, resource)}`
                  )
                  .join(" + ")}
              </p>
              <div className="mt-auto text-xs font-semibold uppercase tracking-wide text-emerald-400">
                {alreadyBought
                  ? "Achete"
                  : affordable
                    ? "Echanger"
                    : "Ressources insuffisantes"}
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="rounded-lg bg-slate-700 px-8 py-2.5 font-medium text-white transition hover:bg-slate-600"
        onClick={onContinue}
      >
        Continuer l&apos;aventure
      </button>
    </div>
  );
}
