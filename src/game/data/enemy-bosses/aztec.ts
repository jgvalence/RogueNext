import type { RawEnemyDefinition } from "./types";
import { quetzalcoatlWrathBossEnemyDefinitions } from "./aztec-quetzalcoatl-wrath";
import { tezcatlipocaEchoBossEnemyDefinitions } from "./aztec-tezcatlipoca-echo";

// Aztec bosses are split one file per encounter so each raw definition can
// point directly to its boss-only rules.
//
// Read order:
// - aztec-tezcatlipoca-echo.ts
// - aztec-quetzalcoatl-wrath.ts
export {
  quetzalcoatlWrathBossEnemyDefinitions,
  tezcatlipocaEchoBossEnemyDefinitions,
};

export const aztecBossEnemyDefinitions: RawEnemyDefinition[] = [
  ...tezcatlipocaEchoBossEnemyDefinitions,
  ...quetzalcoatlWrathBossEnemyDefinitions,
];
