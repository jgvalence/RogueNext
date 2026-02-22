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
import {
  CardCollectionClient,
  type CollectionCardRow,
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
  const unlockProgress = readUnlockProgressFromResources(progression.resources);
  const details = getCardUnlockDetails(
    allCardDefinitions,
    unlockProgress,
    progression.unlockedStoryIds
  );

  const cards: CollectionCardRow[] = allCardDefinitions
    .filter(
      (c) =>
        !c.isStarterCard &&
        c.isCollectible !== false &&
        c.type !== "STATUS" &&
        c.type !== "CURSE"
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

  return (
    <CardCollectionClient
      cards={cards}
      runConditionRows={runConditionResult.data.conditions}
      runStats={runConditionResult.data.runStats}
    />
  );
}
