import type { RawEnemyDefinition } from "./types";
import { archivistLibraryBossEnemyDefinitions } from "./library-archivist";
import { chapterGuardianLibraryBossEnemyDefinitions } from "./library-chapter-guardian";

// Library bosses are split because their unique encounter rules do not live in
// raw stats alone.
//
// Read order:
// - library-chapter-guardian.ts: base data for Chapter Guardian
// - src/game/engine/chapter-guardian.ts: binding puzzle, damage cap, open/rebind
// - src/game/engine/boss-mechanics/library.ts: phase burst + post-ability hooks
// - library-archivist.ts: base data for Archivist + scripted inkwells
// - src/game/engine/archivist.ts: redactions, inkwell restores, phase logic
//
// The tests in src/game/__tests__/chapter-guardian.test.ts and
// src/game/__tests__/archivist.test.ts are the canonical spec for edge cases.
export {
  archivistLibraryBossEnemyDefinitions,
  chapterGuardianLibraryBossEnemyDefinitions,
};

export const libraryBossEnemyDefinitions: RawEnemyDefinition[] = [
  ...chapterGuardianLibraryBossEnemyDefinitions,
  ...archivistLibraryBossEnemyDefinitions,
];
