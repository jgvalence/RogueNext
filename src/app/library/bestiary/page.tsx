import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { getProgressionAction } from "@/server/actions/progression";
import { LibraryLoadError } from "../_components/LibraryLoadError";
import {
  deriveEncounteredEnemyType,
  readEnemyKillCountsFromResources,
  readEncounteredEnemiesFromResources,
} from "@/game/engine/bestiary";
import { enemyDefinitions } from "@/game/data/enemies";
import { getEnemyImageSrc } from "@/lib/assets";
import {
  BestiaryClient,
  type BestiaryEnemyRow,
} from "../_components/BestiaryClient";
import { BIOME_ORDER } from "../_components/constants";

const TYPE_ORDER: Record<BestiaryEnemyRow["type"], number> = {
  NORMAL: 0,
  ELITE: 1,
  BOSS: 2,
};

const BIOME_ORDER_INDEX = BIOME_ORDER.reduce<Record<string, number>>(
  (acc, biome, index) => {
    acc[biome] = index;
    return acc;
  },
  {}
);

export default async function BestiaryPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/library/bestiary");

  const result = await getProgressionAction();
  if (!result.success) {
    return <LibraryLoadError scope="library" message={result.error.message} />;
  }

  const encounteredEnemies = readEncounteredEnemiesFromResources(
    result.data.progression.resources
  );
  const enemyKillCounts = readEnemyKillCountsFromResources(
    result.data.progression.resources
  );

  const enemies: BestiaryEnemyRow[] = enemyDefinitions
    .map((definition) => {
      const derivedType = deriveEncounteredEnemyType({
        isBoss: definition.isBoss,
        isElite: definition.isElite,
      });
      return {
        id: definition.id,
        name: definition.name,
        loreEntries:
          definition.loreEntries ??
          (definition.loreText ? [definition.loreText] : []),
        biome: definition.biome,
        type: derivedType,
        maxHp: definition.maxHp,
        speed: definition.speed,
        imageSrc: getEnemyImageSrc(definition.id),
        discovered:
          Boolean(encounteredEnemies[definition.id]) ||
          (enemyKillCounts[definition.id] ?? 0) > 0,
        killCount: enemyKillCounts[definition.id] ?? 0,
      };
    })
    .sort((a, b) => {
      const biomeDelta =
        (BIOME_ORDER_INDEX[a.biome] ?? Number.MAX_SAFE_INTEGER) -
        (BIOME_ORDER_INDEX[b.biome] ?? Number.MAX_SAFE_INTEGER);
      if (biomeDelta !== 0) return biomeDelta;
      const typeDelta = TYPE_ORDER[a.type] - TYPE_ORDER[b.type];
      if (typeDelta !== 0) return typeDelta;
      return a.name.localeCompare(b.name);
    });

  return <BestiaryClient enemies={enemies} />;
}
