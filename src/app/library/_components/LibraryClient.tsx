"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { RogueButton, RogueCard, RogueTag } from "@/components/ui/rogue";
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
  const { t } = useTranslation();
  const router = useRouter();
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
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-900/10 blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-900/10 blur-[128px]" />
      </div>

      <header className="relative z-10 border-b border-slate-800 bg-gray-950/80 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl">
          <RogueCard
            className="rounded-2xl border border-slate-800 bg-slate-950/70"
            styles={{ body: { padding: 16 } }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <RogueButton
                  onClick={() => router.push("/")}
                  className="!flex !items-center !gap-1.5 !rounded-lg !border !border-slate-700 !bg-transparent !px-3 !py-1.5 !text-xs !font-semibold !text-slate-400 hover:!border-slate-500 hover:!text-white"
                >
                  {"<-"} {t("library.backHome")}
                </RogueButton>
                <div>
                  <h1 className="text-lg font-black tracking-tight text-white">
                    {t("library.title")}
                  </h1>
                  <RogueTag
                    bordered={false}
                    className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300"
                  >
                    {t("library.collectedStories", {
                      unlocked: totalUnlocked,
                      total: totalHistoires,
                    })}
                  </RogueTag>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <RogueButton
                  onClick={() => router.push("/library/collection")}
                  className="!rounded-lg !border !border-slate-700 !bg-transparent !px-4 !py-2.5 !text-sm !font-semibold !text-slate-200 hover:!border-slate-500 hover:!text-white"
                >
                  {t("library.collection")}
                </RogueButton>
                <RogueButton
                  onClick={() => router.push("/library/bestiary")}
                  className="!rounded-lg !border !border-slate-700 !bg-transparent !px-4 !py-2.5 !text-sm !font-semibold !text-slate-200 hover:!border-slate-500 hover:!text-white"
                >
                  {t("library.bestiary")}
                </RogueButton>
                <RogueButton
                  type="primary"
                  onClick={() => router.push("/game")}
                  className="!flex !items-center !gap-2 !rounded-lg !bg-purple-600 !px-5 !py-2.5 !text-sm !font-bold hover:!bg-purple-500"
                >
                  {t("library.startRun")}
                </RogueButton>
              </div>
            </div>
          </RogueCard>
        </div>
      </header>

      <div className="relative z-10 border-b border-slate-800/50 px-6 py-3">
        <div className="mx-auto max-w-6xl">
          <ResourceBar resources={progression.resources} />
        </div>
      </div>

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

      {selected && (
        <HistoireModal
          histoire={selected}
          histoires={histoires}
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
