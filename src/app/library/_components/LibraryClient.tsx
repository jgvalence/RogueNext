"use client";

import { useState } from "react";
import Link from "next/link";
import { BIOME_ORDER } from "./constants";
import type { SlotState } from "./constants";
import { ResourceBar } from "./ResourceBar";
import { BiomeSection } from "./BiomeSection";
import { HistoireModal } from "./HistoireModal";
import type { Histoire, MetaProgress } from "@/game/schemas/meta";

interface LibraryClientProps {
  initialProgression: MetaProgress;
  histoires: Histoire[];
}

function getSlotState(
  histoire: Histoire,
  progression: MetaProgress
): SlotState {
  if (progression.unlockedStoryIds.includes(histoire.id)) return "UNLOCKED";
  const prereqsMet = histoire.prerequis.every((id) =>
    progression.unlockedStoryIds.includes(id)
  );
  if (!prereqsMet) return "LOCKED_PREREQS";
  const canAfford = Object.entries(histoire.cout).every(
    ([resource, cost]) =>
      (progression.resources[resource] ?? 0) >= (cost as number)
  );
  return canAfford ? "AVAILABLE" : "LOCKED_RESOURCES";
}

export function LibraryClient({
  initialProgression,
  histoires,
}: LibraryClientProps) {
  const [progression, setProgression] =
    useState<MetaProgress>(initialProgression);
  const [selected, setSelected] = useState<Histoire | null>(null);

  const histoiresByBiome = BIOME_ORDER.reduce<Record<string, Histoire[]>>(
    (acc, biome) => {
      acc[biome] = histoires.filter((h) => h.biome === biome);
      return acc;
    },
    {}
  );

  const totalUnlocked = progression.unlockedStoryIds.length;
  const totalHistoires = histoires.length;

  return (
    <div className="relative flex min-h-screen flex-col bg-gray-950 text-white">
      {/* Background ambient glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-900/10 blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-900/10 blur-[128px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800 bg-gray-950/80 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:border-slate-500 hover:text-white"
            >
              ← Accueil
            </Link>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white">
                📚 Bibliothèque du Panlibrarium
              </h1>
              <p className="text-[11px] text-slate-500">
                {totalUnlocked}/{totalHistoires} histoires collectées
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/library/collection"
              className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              Collection
            </Link>
            <Link
              href="/game"
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-purple-500 hover:shadow-[0_0_24px_rgba(147,51,234,0.4)]"
            >
              Commencer un Run
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* Resource bar */}
      <div className="relative z-10 border-b border-slate-800/50 px-6 py-3">
        <div className="mx-auto max-w-6xl">
          <ResourceBar resources={progression.resources} />
        </div>
      </div>

      {/* Biome grid */}
      <main className="relative z-10 flex-1 px-6 py-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BIOME_ORDER.map((biome) => {
              const biomHistoires = histoiresByBiome[biome] ?? [];
              if (biomHistoires.length === 0) return null;
              return (
                <BiomeSection
                  key={biome}
                  biome={biome}
                  histoires={biomHistoires}
                  progression={progression}
                  onSelect={setSelected}
                />
              );
            })}
          </div>
        </div>
      </main>

      {/* Modal */}
      {selected && (
        <HistoireModal
          histoire={selected}
          progression={progression}
          slotState={getSlotState(selected, progression)}
          onClose={() => setSelected(null)}
          onUnlocked={(updated) => {
            setProgression(updated);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
