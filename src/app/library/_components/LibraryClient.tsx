"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BIOME_ORDER } from "./constants";
import type { SlotState } from "./constants";
import { ResourceBar } from "./ResourceBar";
import { BiomeSection } from "./BiomeSection";
import { HistoireModal } from "./HistoireModal";
import { LibraryIntroTutorial } from "./LibraryIntroTutorial";
import type { Histoire, MetaProgress } from "@/game/schemas/meta";
import {
  hasPendingFirstRunGuidedStoryTutorial,
  hasSeenLibraryIntroTutorial,
  markLibraryIntroTutorialSeen,
} from "@/game/engine/library-tutorial";
import { dismissLibraryIntroTutorialAction } from "@/server/actions/progression";
import type { BiomeType } from "@/game/schemas/enums";
import { localizeStoryTitle } from "@/lib/i18n/stories";
import { FIRST_RUN_GUIDED_STORY_ID } from "@/game/engine/first-run-script";

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
  const [activeBiome, setActiveBiome] = useState<BiomeType>("LIBRARY");
  const [restoredTitle, setRestoredTitle] = useState("");
  const [libraryIntroError, setLibraryIntroError] = useState<string | null>(
    null
  );
  const [progression, setProgression] =
    useState<MetaProgress>(initialProgression);
  const [selected, setSelected] = useState<Histoire | null>(null);
  const [isLibraryIntroVisible, setIsLibraryIntroVisible] = useState(
    () =>
      initialProgression.totalRuns > 0 &&
      !hasSeenLibraryIntroTutorial(initialProgression.resources)
  );
  const [isDismissingLibraryIntro, setIsDismissingLibraryIntro] =
    useState(false);

  const histoiresByBiome = BIOME_ORDER.reduce<Record<string, Histoire[]>>(
    (acc, biome) => {
      acc[biome] = histoires.filter((h) => h.biome === biome);
      return acc;
    },
    {}
  );

  const totalUnlocked = progression.unlockedStoryIds.length;
  const totalHistoires = histoires.length;
  const firstRunGuidedStory = histoires.find(
    (story) => story.id === FIRST_RUN_GUIDED_STORY_ID
  );
  const isFirstRunGuidedStoryTutorialVisible =
    hasPendingFirstRunGuidedStoryTutorial(progression.resources) &&
    !progression.unlockedStoryIds.includes(FIRST_RUN_GUIDED_STORY_ID);

  useEffect(() => {
    if (isLibraryIntroVisible) return;
    if (!isFirstRunGuidedStoryTutorialVisible) return;
    if (!firstRunGuidedStory) return;
    if (selected?.id === firstRunGuidedStory.id) return;
    setSelected(firstRunGuidedStory);
  }, [
    firstRunGuidedStory,
    isFirstRunGuidedStoryTutorialVisible,
    isLibraryIntroVisible,
    selected,
  ]);

  async function handleDismissLibraryIntro() {
    if (isDismissingLibraryIntro) return;
    setIsDismissingLibraryIntro(true);
    setLibraryIntroError(null);
    try {
      const result = await dismissLibraryIntroTutorialAction();
      if (!result.success) {
        setLibraryIntroError(result.error.message);
        return;
      }
      setProgression((current) => ({
        ...current,
        resources: markLibraryIntroTutorialSeen(current.resources),
      }));
      setIsLibraryIntroVisible(false);
    } catch {
      setLibraryIntroError(t("library.genericError"));
    } finally {
      setIsDismissingLibraryIntro(false);
    }
  }

  const availableCount = histoires.filter(
    (h) => getSlotState(h, progression) === "AVAILABLE"
  ).length;
  function closeStory() {
    const id = selected?.id;
    setSelected(null);
    requestAnimationFrame(() =>
      document.getElementById("story-" + id)?.focus()
    );
  }
  return (
    <main className="menu-page">
      <div className="library-atrium">
        <header className="library-hero">
          <span className="library-eyebrow">{t("menu.libraryKicker")}</span>
          <h1>{t("library.title")}</h1>
          <p>{t("menu.libraryIntro")}</p>
          <div className="library-summary">
            <span>
              <strong>
                {totalUnlocked}/{totalHistoires}
              </strong>
              {t("menu.restored")}
            </span>
            <span>
              <strong>{availableCount}</strong>
              {t("menu.available")}
            </span>
            <span>
              <strong>{BIOME_ORDER.length}</strong>
              {t("menu.chapters")}
            </span>
          </div>
        </header>
        <div role="status" aria-live="polite">
          {restoredTitle && (
            <p className="library-restored">
              {t("menu.storyRestored", { title: restoredTitle })}
            </p>
          )}
        </div>
        <section aria-label={t("menu.resources")}>
          <ResourceBar resources={progression.resources} />
        </section>
        <h2 className="library-eyebrow">{t("menu.chooseChapter")}</h2>
        <nav className="library-index" aria-label={t("menu.chooseChapter")}>
          {BIOME_ORDER.map((biome) => {
            const available = (histoiresByBiome[biome] ?? []).filter(
              (h) => getSlotState(h, progression) === "AVAILABLE"
            ).length;
            return (
              <button
                key={biome}
                aria-pressed={activeBiome === biome}
                onClick={() => setActiveBiome(biome)}
              >
                {t("biome." + biome)}
                {available > 0 && (
                  <small
                    aria-label={t("menu.availableCount", { count: available })}
                  >
                    +{available}
                  </small>
                )}
              </button>
            );
          })}
        </nav>
        <BiomeSection
          biome={activeBiome}
          histoires={histoiresByBiome[activeBiome] ?? []}
          progression={progression}
          onSelect={setSelected}
        />
      </div>
      {selected && (
        <HistoireModal
          key={selected.id}
          histoire={selected}
          histoires={histoires}
          progression={progression}
          slotState={getSlotState(selected, progression)}
          showFirstRunGuidedStoryTutorial={
            isFirstRunGuidedStoryTutorialVisible &&
            selected.id === FIRST_RUN_GUIDED_STORY_ID
          }
          onClose={closeStory}
          onSelectStory={(story) => {
            setActiveBiome(story.biome);
            setSelected(story);
          }}
          onUnlocked={(updated) => {
            setRestoredTitle(localizeStoryTitle(selected, t));
            setProgression(updated);
            closeStory();
          }}
        />
      )}
      {isLibraryIntroVisible && (
        <LibraryIntroTutorial
          error={libraryIntroError}
          isPending={isDismissingLibraryIntro}
          onDismiss={handleDismissLibraryIntro}
        />
      )}
    </main>
  );
}
