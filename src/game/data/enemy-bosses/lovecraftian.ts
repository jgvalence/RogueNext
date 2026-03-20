import type { RawEnemyDefinition } from "./types";
import { nyarlathotepShardBossEnemyDefinitions } from "./lovecraftian-nyarlathotep-shard";
import { shubSpawnBossEnemyDefinitions } from "./lovecraftian-shub-spawn";

// Lovecraftian bosses are split one file per encounter so each raw definition
// can point directly to its boss-only rules.
//
// Read order:
// - lovecraftian-nyarlathotep-shard.ts
// - lovecraftian-shub-spawn.ts
export { nyarlathotepShardBossEnemyDefinitions, shubSpawnBossEnemyDefinitions };

export const lovecraftianBossEnemyDefinitions: RawEnemyDefinition[] = [
  ...nyarlathotepShardBossEnemyDefinitions,
  ...shubSpawnBossEnemyDefinitions,
];
