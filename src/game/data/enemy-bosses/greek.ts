import type { RawEnemyDefinition } from "./types";
import { hydraAspectBossEnemyDefinitions } from "./greek-hydra-aspect";
import { medusaBossEnemyDefinitions } from "./greek-medusa";

// Greek bosses are split one file per encounter so each raw definition can
// point directly to its boss-only rules.
//
// Read order:
// - greek-medusa.ts
// - greek-hydra-aspect.ts
export { hydraAspectBossEnemyDefinitions, medusaBossEnemyDefinitions };

export const greekBossEnemyDefinitions: RawEnemyDefinition[] = [
  ...medusaBossEnemyDefinitions,
  ...hydraAspectBossEnemyDefinitions,
];
