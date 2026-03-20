import type { RawEnemyDefinition } from "./types";
import { cernunnosShadeBossEnemyDefinitions } from "./celtic-cernunnos-shade";
import { dagdaShadowBossEnemyDefinitions } from "./celtic-dagda-shadow";

// Celtic bosses are split one file per encounter so each raw definition can
// point directly to its boss-only rules.
//
// Read order:
// - celtic-dagda-shadow.ts
// - celtic-cernunnos-shade.ts
export { cernunnosShadeBossEnemyDefinitions, dagdaShadowBossEnemyDefinitions };

export const celticBossEnemyDefinitions: RawEnemyDefinition[] = [
  ...dagdaShadowBossEnemyDefinitions,
  ...cernunnosShadeBossEnemyDefinitions,
];
