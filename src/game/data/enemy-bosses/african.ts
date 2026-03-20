import type { RawEnemyDefinition } from "./types";
import { anansiWeaverBossEnemyDefinitions } from "./african-anansi-weaver";
import { soundiataSpiritBossEnemyDefinitions } from "./african-soundiata-spirit";

// African bosses are split one file per encounter so each raw definition can
// point directly to its boss-only rules.
//
// Read order:
// - african-soundiata-spirit.ts
// - african-anansi-weaver.ts
export {
  anansiWeaverBossEnemyDefinitions,
  soundiataSpiritBossEnemyDefinitions,
};

export const africanBossEnemyDefinitions: RawEnemyDefinition[] = [
  ...soundiataSpiritBossEnemyDefinitions,
  ...anansiWeaverBossEnemyDefinitions,
];
