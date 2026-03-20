import type { RawEnemyDefinition } from "./types";
import { babaYagaHutBossEnemyDefinitions } from "./russian-baba-yaga-hut";
import { koscheiDeathlessBossEnemyDefinitions } from "./russian-koschei-deathless";

// Russian bosses are split one file per encounter so each raw definition can
// point directly to its boss-only rules.
//
// Read order:
// - russian-baba-yaga-hut.ts
// - russian-koschei-deathless.ts
export {
  babaYagaHutBossEnemyDefinitions,
  koscheiDeathlessBossEnemyDefinitions,
};

export const russianBossEnemyDefinitions: RawEnemyDefinition[] = [
  ...babaYagaHutBossEnemyDefinitions,
  ...koscheiDeathlessBossEnemyDefinitions,
];
