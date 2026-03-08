import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import {
  getProgressionAction,
  getRunConditionCollectionAction,
} from "@/server/actions/progression";
import { allCardDefinitions } from "@/game/data";
import {
  getCardUnlockDetails,
  readUnlockProgressFromResources,
} from "@/game/engine/card-unlocks";
import { readEnemyKillCountsFromResources } from "@/game/engine/bestiary";
import {
  getBestGoldInSingleRun,
  getRelicUnlockDetails,
  readCharacterWinsByDifficultyFromResources,
  getUnlockedMaxDifficultyFromResources,
} from "@/game/engine/difficulty";
import { relicDefinitions } from "@/game/data/relics";
import {
  CardCollectionClient,
  type CollectionCardRow,
  type CollectionRelicRow,
} from "../_components/CardCollectionClient";
import { LibraryLoadError } from "../_components/LibraryLoadError";

export default async function CardCollectionPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/library/collection");

  const [result, runConditionResult] = await Promise.all([
    getProgressionAction(),
    getRunConditionCollectionAction(),
  ]);

  if (!result.success) {
    return (
      <LibraryLoadError scope="collection" message={result.error.message} />
    );
  }
  if (!runConditionResult.success) {
    return (
      <LibraryLoadError
        scope="collection"
        message={runConditionResult.error.message}
      />
    );
  }

  const progression = result.data.progression;
  const runStats = runConditionResult.data.runStats;
  const unlockProgress = readUnlockProgressFromResources(progression.resources);
  const enemyKillCounts = readEnemyKillCountsFromResources(
    progression.resources
  );
  const details = getCardUnlockDetails(
    allCardDefinitions,
    unlockProgress,
    progression.unlockedStoryIds,
    enemyKillCounts
  );

  const cards: CollectionCardRow[] = allCardDefinitions
    .filter(
      (c) =>
        c.type !== "STATUS" && c.type !== "CURSE" && c.isCollectible !== false
    )
    .map((c) => ({
      id: c.id,
      definition: c,
      name: c.name,
      biome: c.biome,
      type: c.type as "ATTACK" | "SKILL" | "POWER",
      rarity: c.rarity,
      energyCost: c.energyCost,
      description: c.description,
      unlocked: details[c.id]?.unlocked ?? true,
      unlockCondition: details[c.id]?.condition ?? "alwaysUnlocked",
      missingCondition: details[c.id]?.missingCondition ?? null,
      unlockProgress: details[c.id]?.progress ?? null,
    }));

  const relicUnlockProgress = {
    totalRuns: runStats.totalRuns,
    wonRuns: runStats.wonRuns,
    unlockedDifficultyMax: getUnlockedMaxDifficultyFromResources(
      progression.resources
    ),
    winsByDifficulty: progression.winsByDifficulty ?? {},
    characterWinsByDifficulty: readCharacterWinsByDifficultyFromResources(
      progression.resources
    ),
    bestGoldInSingleRun: getBestGoldInSingleRun(progression.resources),
    enemyKillCounts,
  };
  const relicUnlockDetails = getRelicUnlockDetails(
    relicDefinitions.map((relic) => relic.id),
    relicUnlockProgress
  );

  const relics: CollectionRelicRow[] = relicDefinitions.map((relic) => ({
    id: relic.id,
    name: relic.name,
    description: relic.description,
    rarity: relic.rarity,
    sourceBossId: relic.sourceBossId,
    unlocked: relicUnlockDetails[relic.id]?.unlocked ?? true,
    unlockRequirements: relicUnlockDetails[relic.id]?.requirements ?? [],
    missingUnlockRequirement:
      relicUnlockDetails[relic.id]?.missingRequirement ?? null,
  }));

  return (
    <CardCollectionClient
      cards={cards}
      runConditionRows={runConditionResult.data.conditions}
      runStats={runStats}
      relics={relics}
    />
  );
}
