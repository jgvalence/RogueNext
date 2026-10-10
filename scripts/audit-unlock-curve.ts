import { allCardDefinitions } from "../src/game/data";
import { characterDefinitions } from "../src/game/data/characters";
import {
  addInitialCharacterCardUnlocks,
  computeUnlockedCardIds,
  type CardUnlockProgress,
} from "../src/game/engine/card-unlocks";
import type { BiomeType } from "../src/game/schemas/enums";

const BIOMES: BiomeType[] = [
  "LIBRARY",
  "VIKING",
  "GREEK",
  "EGYPTIAN",
  "LOVECRAFTIAN",
  "AZTEC",
  "CELTIC",
  "RUSSIAN",
  "AFRICAN",
];

const stages = [
  { label: "Depart", entered: false, elites: 0, bosses: 0, runs: 0 },
  { label: "Premiere entree", entered: true, elites: 0, bosses: 0, runs: 0 },
  { label: "Premier elite", entered: true, elites: 1, bosses: 0, runs: 0 },
  { label: "Deux elites", entered: true, elites: 2, bosses: 0, runs: 0 },
  { label: "Trois elites", entered: true, elites: 3, bosses: 0, runs: 0 },
  { label: "Premier boss", entered: true, elites: 3, bosses: 1, runs: 1 },
  { label: "Deuxieme boss", entered: true, elites: 6, bosses: 2, runs: 2 },
] as const;

function values(value: number): Record<string, number> {
  return Object.fromEntries(BIOMES.map((biome) => [biome, value]));
}

function makeProgress(
  characterId: string,
  stage: (typeof stages)[number]
): CardUnlockProgress {
  const enteredBiomes = Object.fromEntries(
    BIOMES.map((biome) => [biome, biome === "LIBRARY" || stage.entered ? 1 : 0])
  );
  const characterProgress = {
    enteredBiomes,
    biomeRunsCompleted: values(stage.runs),
    eliteKillsByBiome: values(stage.elites),
    bossKillsByBiome: values(stage.bosses),
  };
  return {
    ...characterProgress,
    byCharacter: { [characterId]: characterProgress },
  };
}

function isAvailableToCharacter(
  card: (typeof allCardDefinitions)[number],
  characterId: string
): boolean {
  return !card.characterId || card.characterId === characterId;
}

for (const character of characterDefinitions) {
  console.log(`\n${character.id}`);
  let previous = new Set<string>();
  for (const stage of stages) {
    const unlocked = new Set(
      addInitialCharacterCardUnlocks(
        computeUnlockedCardIds(
          allCardDefinitions,
          makeProgress(character.id, stage),
          []
        ),
        character.id
      )
    );
    const current = new Set(
      allCardDefinitions
        .filter(
          (card) =>
            unlocked.has(card.id) &&
            !card.isStarterCard &&
            card.isCollectible !== false &&
            isAvailableToCharacter(card, character.id) &&
            !card.id.startsWith("bestiary_")
        )
        .map((card) => card.id)
    );
    const gained = [...current].filter((id) => !previous.has(id)).length;
    console.log(
      `${stage.label.padEnd(18)} ${String(current.size).padStart(3)} cartes (+${gained})`
    );
    previous = current;
  }
}
