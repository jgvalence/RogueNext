import type { RawEnemyDefinition } from "./types";
import { africanBossEnemyDefinitions } from "./african";
import { aztecBossEnemyDefinitions } from "./aztec";
import { celticBossEnemyDefinitions } from "./celtic";
import { egyptianBossEnemyDefinitions } from "./egyptian";
import { greekBossEnemyDefinitions } from "./greek";
import { libraryBossEnemyDefinitions } from "./library";
import { lovecraftianBossEnemyDefinitions } from "./lovecraftian";
import { russianBossEnemyDefinitions } from "./russian";
import { vikingBossEnemyDefinitions } from "./viking";

// Boss data is organized in two layers:
// - one manifest per biome
// - one file per boss encounter
//
// Start from the biome manifest when tracing a chapter.
// Start from the per-boss file when tracing one encounter.
export {
  africanBossEnemyDefinitions,
  aztecBossEnemyDefinitions,
  celticBossEnemyDefinitions,
  egyptianBossEnemyDefinitions,
  greekBossEnemyDefinitions,
  libraryBossEnemyDefinitions,
  lovecraftianBossEnemyDefinitions,
  russianBossEnemyDefinitions,
  vikingBossEnemyDefinitions,
};

export const bossEnemyDefinitions: RawEnemyDefinition[] = [
  ...libraryBossEnemyDefinitions,
  ...vikingBossEnemyDefinitions,
  ...greekBossEnemyDefinitions,
  ...egyptianBossEnemyDefinitions,
  ...lovecraftianBossEnemyDefinitions,
  ...aztecBossEnemyDefinitions,
  ...celticBossEnemyDefinitions,
  ...russianBossEnemyDefinitions,
  ...africanBossEnemyDefinitions,
];
