import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { getProgressionAction } from "@/server/actions/progression";
import { allCardDefinitions } from "@/game/data";
import {
  getCardUnlockDetails,
  readUnlockProgressFromResources,
} from "@/game/engine/card-unlocks";
import { CardCollectionClient, type CollectionCardRow } from "../_components/CardCollectionClient";

export default async function CardCollectionPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/library/collection");

  const result = await getProgressionAction();
  if (!result.success) redirect("/");

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
      name: c.name,
      biome: c.biome,
      type: c.type as "ATTACK" | "SKILL" | "POWER",
      rarity: c.rarity,
      energyCost: c.energyCost,
      description: c.description,
      unlocked: details[c.id]?.unlocked ?? true,
      unlockCondition: details[c.id]?.condition ?? "Toujours debloquee",
      missingCondition: details[c.id]?.missingCondition ?? null,
      unlockProgress: details[c.id]?.progress ?? null,
    }));

  return <CardCollectionClient cards={cards} />;
}
