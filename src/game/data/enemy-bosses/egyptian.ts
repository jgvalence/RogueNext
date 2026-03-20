import type { RawEnemyDefinition } from "./types";
import { osirisJudgmentBossEnemyDefinitions } from "./egyptian-osiris-judgment";
import { raAvatarBossEnemyDefinitions } from "./egyptian-ra-avatar";

// Egyptian bosses are split one file per encounter so each raw definition can
// point directly to its boss-only rules.
//
// Read order:
// - egyptian-ra-avatar.ts
// - egyptian-osiris-judgment.ts
export { osirisJudgmentBossEnemyDefinitions, raAvatarBossEnemyDefinitions };

export const egyptianBossEnemyDefinitions: RawEnemyDefinition[] = [
  ...raAvatarBossEnemyDefinitions,
  ...osirisJudgmentBossEnemyDefinitions,
];
