"use client";

import { useState } from "react";
import { BIOME_THEMES, VISUEL_ICONS, TIER_LABELS } from "./constants";
import type { SlotState } from "./constants";
import type { Histoire, MetaBonus, MetaProgress } from "@/game/schemas/meta";
import { unlockStoryAction } from "@/server/actions/progression";

interface HistoireModalProps {
  histoire: Histoire;
  progression: MetaProgress;
  slotState: SlotState;
  onClose: () => void;
  onUnlocked: (updatedProgression: MetaProgress) => void;
}

function formatBonus(bonus: MetaBonus): string {
  switch (bonus.type) {
    case "EXTRA_DRAW":
      return `+${bonus.value} carte piochée par tour`;
    case "EXTRA_ENERGY_MAX":
      return `+${bonus.value} énergie max`;
    case "EXTRA_INK_MAX":
      return `+${bonus.value} Ink max`;
    case "INK_PER_CARD_CHANCE":
      return `+${bonus.value}% de chance de gagner de l'Ink en jouant une carte`;
    case "INK_PER_CARD_VALUE":
      return `+${bonus.value} Ink gagné quand l'effet proc`;
    case "STARTING_INK":
      return `Commence chaque combat avec +${bonus.value} Ink`;
    case "STARTING_BLOCK":
      return `+${bonus.value} Block au début de chaque combat`;
    case "STARTING_STRENGTH":
      return `+${bonus.value} Force au début de chaque combat`;
    case "STARTING_REGEN":
      return `Récupère +${bonus.value} HP au début de chaque tour`;
    case "FIRST_HIT_DAMAGE_REDUCTION":
      return `Premier coup subi: -${bonus.value}% dégâts`;
    case "EXTRA_HP":
      return `+${bonus.value} HP max`;
    case "EXTRA_HAND_AT_START":
      return `+${bonus.value} cartes en main au début du combat`;
    case "ATTACK_BONUS":
      return `+${bonus.value} dégâts sur les cartes Attaque`;
    case "ALLY_SLOTS":
      return `+${bonus.value} emplacement(s) allié`;
    case "STARTING_GOLD":
      return `+${bonus.value} or de départ à chaque run`;
    case "EXTRA_CARD_REWARD_CHOICES":
      return `+${bonus.value} choix lors des récompenses de cartes`;
    case "RELIC_DISCOUNT":
      return `${bonus.value}% de réduction sur les reliques`;
    case "UNLOCK_INK_POWER":
      return `Débloque le pouvoir d'Ink ${bonus.power}`;
    case "HEAL_AFTER_COMBAT":
      return `Récupère ${bonus.value}% des HP max après chaque combat`;
    case "EXHAUST_KEEP_CHANCE":
      return `${bonus.value}% de chance de ne pas exhaustée une carte`;
    case "SURVIVAL_ONCE":
      return "Survit à 1 HP une fois par run";
    case "FREE_UPGRADE_PER_RUN":
      return "Upgrade une carte gratuitement par run";
    case "STARTING_RARE_CARD":
      return "Commence chaque run avec une carte rare aléatoire";
    default:
      return "Bonus permanent";
  }
}

export function HistoireModal({
  histoire,
  progression,
  slotState,
  onClose,
  onUnlocked,
}: HistoireModalProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = BIOME_THEMES[histoire.biome];

  async function handleUnlock() {
    setIsPending(true);
    setError(null);
    try {
      const result = await unlockStoryAction({ storyId: histoire.id });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      // Build updated progression for optimistic update
      const updatedResources = { ...progression.resources };
      for (const [resource, cost] of Object.entries(histoire.cout)) {
        updatedResources[resource] =
          (updatedResources[resource] ?? 0) - (cost as number);
      }
      onUnlocked({
        resources: updatedResources,
        unlockedStoryIds: [...progression.unlockedStoryIds, histoire.id],
      });
      onClose();
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-2xl border bg-slate-950 shadow-2xl ${theme.border}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`rounded-t-2xl border-b px-5 py-4 ${theme.border} ${theme.bg}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {VISUEL_ICONS[histoire.visuel]}
                </span>
                <span
                  className={`rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${theme.accent} border ${theme.border}`}
                >
                  {theme.name} · Tier {TIER_LABELS[histoire.tier]}
                </span>
              </div>
              <h2 className="mt-1.5 text-lg font-bold leading-tight text-white">
                {histoire.titre}
              </h2>
              {histoire.auteur && (
                <p className={`text-xs ${theme.accent} opacity-80`}>
                  — {histoire.auteur}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-3 flex-shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          {/* Description */}
          <p className="text-sm leading-relaxed text-slate-300">
            {histoire.description}
          </p>

          {/* Bonus */}
          <div className={`rounded-lg border p-3 ${theme.border} ${theme.bg}`}>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Bonus permanent
            </p>
            <p className={`text-sm font-semibold ${theme.accent}`}>
              {formatBonus(histoire.bonus)}
            </p>
          </div>

          {/* Coût */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Coût
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(histoire.cout).map(([resource, cost]) => {
                const resTheme = Object.values(BIOME_THEMES).find(
                  (t) => t.resource === resource
                );
                const available = progression.resources[resource] ?? 0;
                const canAfford = available >= (cost as number);
                return (
                  <div
                    key={resource}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-semibold ${
                      canAfford
                        ? "border-slate-600 text-white"
                        : "border-red-800 text-red-400"
                    }`}
                  >
                    <span>{resTheme?.icon ?? resource}</span>
                    <span>
                      {cost as number}{" "}
                      <span
                        className={`text-xs font-normal ${canAfford ? "text-slate-400" : "text-red-500"}`}
                      >
                        ({available} disponibles)
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prérequis */}
          {histoire.prerequis.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Prérequis
              </p>
              <div className="flex flex-col gap-1">
                {histoire.prerequis.map((prereqId) => {
                  const unlocked =
                    progression.unlockedStoryIds.includes(prereqId);
                  return (
                    <div
                      key={prereqId}
                      className={`flex items-center gap-2 text-xs ${
                        unlocked ? "text-slate-400" : "text-red-400"
                      }`}
                    >
                      <span>{unlocked ? "✓" : "✗"}</span>
                      <span className="capitalize">
                        {prereqId.replace(/_/g, " ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          {/* CTA */}
          {slotState === "UNLOCKED" ? (
            <div
              className={`rounded-lg border p-3 text-center text-sm font-semibold ${theme.border} ${theme.accent}`}
            >
              ✓ Histoire possédée
            </div>
          ) : slotState === "AVAILABLE" ? (
            <button
              onClick={handleUnlock}
              disabled={isPending}
              className={`w-full rounded-lg border py-3 text-sm font-bold transition ${theme.border} ${theme.bg} ${theme.accent} hover:brightness-125 disabled:opacity-50`}
            >
              {isPending ? "Déblocage…" : "📚 Débloquer"}
            </button>
          ) : (
            <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-center text-sm text-slate-500">
              {slotState === "LOCKED_PREREQS"
                ? "🔒 Prérequis manquants"
                : "Ressources insuffisantes"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
