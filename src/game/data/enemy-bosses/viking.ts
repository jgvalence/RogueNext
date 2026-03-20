import type { RawEnemyDefinition } from "./types";
import { fenrirBossEnemyDefinitions } from "./viking-fenrir";
import { helQueenBossEnemyDefinitions } from "./viking-hel-queen";

// Viking bosses are split one file per encounter so each raw definition can
// point directly to its boss-only rules.
//
// Read order:
// - viking-fenrir.ts
// - viking-hel-queen.ts
export { fenrirBossEnemyDefinitions, helQueenBossEnemyDefinitions };

export const vikingBossEnemyDefinitions: RawEnemyDefinition[] = [
  ...fenrirBossEnemyDefinitions,
  ...helQueenBossEnemyDefinitions,
];
