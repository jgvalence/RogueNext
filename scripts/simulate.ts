/**
 * Headless game simulator for balance testing.
 *
 * Usage:
 *   npx tsx scripts/simulate.ts [options]
 *
 * Positional args (all optional):
 *   [numRuns]    Number of runs (default: 200)
 *   [difficulty] Difficulty level 0-5 (default: 0)
 *   [biome]      Force biome or "null" for random (default: null)
 *   [character]  "scribe" | "bibliothecaire" (default: scribe)
 *   [meta]       Meta preset: "none" | "minimal" | "average" | "strong" (default: none)
 *   [seed]       RNG seed string (default: "sim")
 *
 * Flags:
 *   --log               Write CSV log to scripts/sim-results.csv
 *   --verbose           Print per-run and per-combat details
 *   --build TYPE        Card selection strategy: mixed (default) | poison | armor | bleed | ink | draw
 *   --cards id1,id2     Pre-add card IDs to starting deck (build testing)
 *
 * Examples:
 *   npx tsx scripts/simulate.ts 500 2
 *   npx tsx scripts/simulate.ts 200 0 LIBRARY scribe average
 *   npx tsx scripts/simulate.ts 200 1 null scribe strong sim --build poison
 *   npx tsx scripts/simulate.ts 5 0 null scribe average sim --verbose
 *   npx tsx scripts/simulate.ts 100 0 null scribe none sim --cards poison_quill,venom_echo --build poison
 */

import fs from "fs";
import {
  createNewRun,
  advanceFloor,
  selectRoom,
  completeCombat,
  applyHealRoom,
  applyDifficultyToRun,
  upgradeCardInDeck,
  getReachableRoomChoiceIndexes,
  getBossRoomIndexForMap,
} from "../src/game/engine/run";
import {
  initCombat,
  checkCombatEnd,
  startPlayerTurn,
  endPlayerTurn,
  executeAlliesEnemiesTurn,
} from "../src/game/engine/combat";
import {
  playCard,
  canPlayCard,
  canPlayCardInked,
} from "../src/game/engine/cards";
import {
  generateCombatRewards,
  addCardToRunDeck,
} from "../src/game/engine/rewards";
import {
  addRelicToRunState,
  applyRelicsOnCombatStart,
  applyRelicsOnCardPlayed,
} from "../src/game/engine/relics";
import {
  generateShopInventory,
  buyShopItem,
} from "../src/game/engine/merchant";
import { createRNG } from "../src/game/engine/rng";
import {
  allCardDefinitions,
  buildCardDefsMap,
  buildEnemyDefsMap,
  buildAllyDefsMap,
} from "../src/game/data";
import { getCharacterById } from "../src/game/data/characters";
import { GAME_CONSTANTS } from "../src/game/constants";
import type { RunState } from "../src/game/schemas/run-state";
import type { CombatState } from "../src/game/schemas/combat-state";
import type { BiomeType } from "../src/game/schemas/enums";
import {
  ComputedMetaBonusesSchema,
  type ComputedMetaBonuses,
} from "../src/game/schemas/meta";
import type { RNG } from "../src/game/engine/rng";

// ─── Meta presets ─────────────────────────────────────────────────────────────

// Presets calibrated on actual histoire values (src/game/data/histoires.ts).
// Each preset approximates a real progression stage.
//
// Totaux max atteignables (45 histoires débloquées) :
//   startingStrength 6 | startingBlock 11 | attackBonus 3 | extraHp +35
//   extraDraw +1 | extraEnergyMax +1 | extraHandAtStart +1
//   healAfterCombat 5% | healAfterCombatFlat +3 | exhaustKeepChance 50
//   startingFocus +1 | startingRegen +3 | lootLuck +3 | startingGold +45
const META_PRESETS: Record<string, Partial<ComputedMetaBonuses>> = {
  // Joueur débutant, aucune histoire débloquée
  none: {},

  // ~8-10 histoires : LIBRARY complète + 1 biome tier 1
  minimal: {
    extraDraw: 1,
    extraEnergyMax: 1,
    extraHandAtStart: 1,
    extraCardRewardChoices: 1,
    startingStrength: 3,
    attackBonus: 2,
    startingBlock: 4,
    extraHp: 18,
    healAfterCombat: 5,
    healAfterCombatFlat: 6,
    startingRegen: 1,
    lootLuck: 1,
    unlockedPowerSlots: [1],
  },

  // ~24-26 histoires : LIBRARY + 3 biomes, quelques tier 2 débloqués
  average: {
    extraDraw: 1,
    extraEnergyMax: 1,
    extraHandAtStart: 1,
    extraHp: 22,
    startingStrength: 4,
    startingBlock: 7,
    attackBonus: 2,
    healAfterCombat: 5,
    healAfterCombatFlat: 3,
    exhaustKeepChance: 20,
    startingRegen: 1,
    startingFocus: 1,
    allySlots: 1, // 1 histoire ALLY_SLOTS débloquée
    extraCardRewardChoices: 1,
    lootLuck: 1,
    startingGold: 25,
    unlockedPowerSlots: [1, 2],
  },

  // ~33-36 histoires : 5-6 biomes, plupart des tier 2
  strong: {
    extraDraw: 1,
    extraEnergyMax: 1,
    extraHandAtStart: 1,
    extraHp: 28,
    healAfterCombat: 5,
    healAfterCombatFlat: 3,
    startingStrength: 5,
    startingBlock: 9,
    attackBonus: 3,
    extraCardRewardChoices: 1,
    exhaustKeepChance: 35,
    lootLuck: 2,
    startingFocus: 1,
    startingRegen: 2,
    allySlots: 2, // 2 histoires ALLY_SLOTS
    unlockedPowerSlots: [1, 2, 3],
  },

  // Toutes les 45 histoires débloquées (état final complet)
  max: {
    extraDraw: 1,
    extraEnergyMax: 1,
    extraHandAtStart: 1,
    extraHp: 35,
    healAfterCombat: 5,
    healAfterCombatFlat: 3,
    startingStrength: 6,
    startingBlock: 11,
    attackBonus: 3,
    extraCardRewardChoices: 1,
    exhaustKeepChance: 50,
    lootLuck: 3,
    startingFocus: 1,
    startingRegen: 3,
    startingGold: 45,
    allySlots: 3, // 3 histoires ALLY_SLOTS (max)
    unlockedPowerSlots: [1, 2, 3],
  },
};

// ─── CLI parsing ──────────────────────────────────────────────────────────────

const positionals = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const flags = new Set(
  process.argv.slice(2).filter((a) => a.startsWith("--") && !a.includes("="))
);
const flagValues: Record<string, string> = {};
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith("--") && arg.includes("=")) {
    const [k, v] = arg.split("=", 2);
    if (k && v) flagValues[k.slice(2)] = v;
  }
}
// --cards / --build can use = syntax or space-separated value
function getFlagValue(name: string): string | null {
  return (
    flagValues[name] ??
    process.argv.slice(2).reduce<string | null>((acc, a, i, arr) => {
      if (a === `--${name}` && arr[i + 1] && !arr[i + 1]!.startsWith("--"))
        return arr[i + 1]!;
      return acc;
    }, null)
  );
}

const RAW_BIOME = positionals[2];
const RAW_META = positionals[4] ?? "none";
const RAW_BUILD = getFlagValue("build") ?? "mixed";

export type BuildType = "mixed" | "poison" | "armor" | "bleed" | "ink" | "draw";

interface SimConfig {
  numRuns: number;
  difficulty: number;
  biome: BiomeType | null;
  character: string;
  metaPreset: string;
  seed: string;
  buildType: BuildType;
  maxTurnsPerCombat: number;
  writeCsv: boolean;
  verbose: boolean;
  extraStartCards: string[];
}

const config: SimConfig = {
  numRuns: parseInt(positionals[0] ?? "200", 10),
  difficulty: parseInt(positionals[1] ?? "0", 10),
  biome: RAW_BIOME && RAW_BIOME !== "null" ? (RAW_BIOME as BiomeType) : null,
  character: positionals[3] ?? "scribe",
  metaPreset: RAW_META,
  seed: positionals[5] ?? "sim",
  buildType: RAW_BUILD as BuildType,
  maxTurnsPerCombat: 60,
  writeCsv: flags.has("--log"),
  verbose: flags.has("--verbose"),
  extraStartCards: (getFlagValue("cards") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};

// ─── Static data (loaded once) ────────────────────────────────────────────────

const cardDefs = buildCardDefsMap();
const enemyDefs = buildEnemyDefsMap();
const allyDefs = buildAllyDefsMap();
const AVAILABLE_BIOMES = GAME_CONSTANTS.AVAILABLE_BIOMES as BiomeType[];

// ─── Build-type card scoring ──────────────────────────────────────────────────

import type { CardDefinition } from "../src/game/schemas/cards";

function scoreCardForBuild(card: CardDefinition, buildType: BuildType): number {
  const rarityBase =
    card.rarity === "RARE" ? 60 : card.rarity === "UNCOMMON" ? 30 : 10;

  if (buildType === "mixed") return rarityBase;

  const id = card.id.toLowerCase();
  const tags = card.archetypeTags ?? [];
  const effects = card.effects ?? [];
  let bonus = 0;

  switch (buildType) {
    case "poison":
      if (id.includes("poison") || id.includes("venom") || id.includes("toxic"))
        bonus += 60;
      if (effects.some((e) => e.buff === "POISON" || e.buff === "POISON_BURST"))
        bonus += 50;
      break;
    case "bleed":
      if (
        tags.includes("BLEED") ||
        id.includes("bleed") ||
        id.includes("blood") ||
        id.includes("hemorrhage")
      )
        bonus += 60;
      if (effects.some((e) => e.buff === "BLEED")) bonus += 50;
      break;
    case "armor":
      if (
        tags.includes("BLOCK") ||
        id.includes("defend") ||
        id.includes("shield") ||
        id.includes("armor") ||
        id.includes("ward")
      )
        bonus += 60;
      if (card.type === "SKILL" && effects.some((e) => e.type === "BLOCK"))
        bonus += 50;
      break;
    case "ink":
      if (
        tags.includes("INK") ||
        id.includes("ink") ||
        id.includes("scribe") ||
        id.includes("rune")
      )
        bonus += 60;
      if (card.type === "POWER" || effects.some((e) => e.type === "GAIN_INK"))
        bonus += 40;
      break;
    case "draw":
      if (
        id.includes("draw") ||
        id.includes("cycle") ||
        id.includes("tome") ||
        id.includes("library") ||
        id.includes("catalogue")
      )
        bonus += 60;
      if (effects.some((e) => e.type === "DRAW_CARDS")) bonus += 50;
      break;
  }

  return rarityBase + bonus;
}

// ─── Relic scoring by build ──────────────────────────────────────────────────

const RELIC_SCORES: Record<
  string,
  Partial<Record<BuildType, number>> & { base: number }
> = {
  // Universal strong relics
  vital_flask: {
    base: 90,
    mixed: 100,
    armor: 80,
    poison: 90,
    bleed: 90,
    ink: 90,
    draw: 90,
  },
  guardian_dune_amulet: { base: 85 },
  apprentice_oak_scroll: { base: 95 }, // +3 HP/tour — très puissant
  beast_bog_heart: { base: 90 }, // +1 énergie/tour

  // Block / Armor
  hound_amber_fang: { base: 50, armor: 130, bleed: 70 },
  guard_czar_medal: { base: 45, armor: 120, bleed: 65 },
  colossus_tome_plate: { base: 55, armor: 115 },
  shaman_storm_totem: { base: 50, armor: 110, bleed: 80 },
  giant_baobab_seed: { base: 40, armor: 90 },
  automaton_bronze_gear: { base: 45, armor: 85, mixed: 60 },
  slime_ink_vial: { base: 40, armor: 80 },
  warded_ribbon: { base: 35, armor: 70, bleed: 60 },
  serpent_scroll_seal: { base: 50, armor: 75, ink: 70 },
  reactive_binding: { base: 35, armor: 70 },

  // Attack / Strength
  battle_lexicon: { base: 70, mixed: 80, poison: 85, bleed: 75 },
  idol_sun_fragment: { base: 65, ink: 80, mixed: 75 },
  wadjet_emerald_eye: { base: 70, armor: 90, mixed: 80 },
  wraith_torn_folio: { base: 55, poison: 80, mixed: 65 },

  // Poison / Debuff
  apep_shadow_scale: { base: 40, poison: 120, bleed: 70, mixed: 60 },
  wyrm_venom_signet: { base: 40, poison: 110, mixed: 55 },

  // Thorns / Bleed
  thorn_mantle: { base: 30, bleed: 110, armor: 60 },
  archon_ink_crown: { base: 30, bleed: 100, ink: 50 },
  briar_codex: { base: 25, bleed: 90 },
  lamia_veil: { base: 30, bleed: 80, mixed: 45 },

  // Ink
  ink_stamp: { base: 35, ink: 110 },
  spectral_inkwell: { base: 35, ink: 105 },
  ancient_quill: { base: 30, ink: 90 },
  inkwell_reservoir: { base: 35, ink: 95 },
  cossack_iron_spur: { base: 30, ink: 85 },
  resonant_quill: { base: 30, ink: 80 },
  ink_spindle: { base: 25, ink: 70 },
  scholars_stone: { base: 30, ink: 65, mixed: 40 },

  // Draw
  bookmark: { base: 55, draw: 120, mixed: 70 },
  blighted_compass: { base: 40, draw: 110 },
  kikimora_night_lantern: { base: 45, draw: 100, ink: 70 },
};

function scoreAllyForBuild(allyId: string, buildType: BuildType): number {
  // scribe_apprentice: AoE 4 dmg + heal+ink — polyvalent, top pour ink
  // ward_knight:       6 dmg + focus      — meilleur DPS/HP, top pour armor/bleed
  // ink_familiar:      4 dmg + draw       — top pour draw
  const scores: Record<
    string,
    Partial<Record<BuildType, number>> & { base: number }
  > = {
    ward_knight: {
      base: 80,
      mixed: 90,
      armor: 100,
      bleed: 95,
      poison: 80,
      ink: 70,
      draw: 75,
    },
    scribe_apprentice: {
      base: 75,
      mixed: 80,
      armor: 70,
      bleed: 75,
      poison: 85,
      ink: 100,
      draw: 80,
    },
    ink_familiar: {
      base: 70,
      mixed: 75,
      armor: 65,
      bleed: 70,
      poison: 70,
      ink: 85,
      draw: 100,
    },
  };
  const entry = scores[allyId];
  if (!entry) return 50;
  return entry[buildType] ?? entry.base;
}

function scoreRelicForBuild(relicId: string, buildType: BuildType): number {
  const entry = RELIC_SCORES[relicId];
  if (!entry) return 40; // unknown relic: average score
  return entry[buildType] ?? entry.base;
}

// ─── Combat AI ────────────────────────────────────────────────────────────────

/** Returns true if any alive enemy is about to deal damage this turn. */
function enemiesWillAttack(combat: CombatState): boolean {
  return combat.enemies.some((e) => {
    if (e.currentHp <= 0) return false;
    const def = enemyDefs.get(e.definitionId);
    if (!def) return false;
    const ability = def.abilities[e.intentIndex];
    if (!ability) return false;
    return ability.effects.some((ef) =>
      (ef.type as string).startsWith("DAMAGE")
    );
  });
}

function pickCardToPlay(
  combat: CombatState,
  isDefensiveMode: boolean
): { instanceId: string; targetId: string | null } | null {
  const playable = combat.hand.filter((c) =>
    canPlayCard(combat, c.instanceId, cardDefs)
  );
  if (playable.length === 0) return null;

  const aliveEnemies = combat.enemies.filter((e) => e.currentHp > 0);

  // If enemies will attack this turn, prioritise block (SKILL) cards.
  // Otherwise (buffs, debuffs, non-damage turns), go offensive.
  const incomingAttack = enemiesWillAttack(combat);
  const wantBlock = isDefensiveMode || incomingAttack;

  // If we already have enough block to absorb all incoming damage, switch to attack.
  const totalIncoming = incomingAttack
    ? combat.enemies
        .filter((e) => e.currentHp > 0)
        .reduce((sum, e) => {
          const def = enemyDefs.get(e.definitionId);
          const ability = def?.abilities[e.intentIndex];
          const dmg =
            ability?.effects.reduce(
              (s, ef) =>
                (ef.type as string).startsWith("DAMAGE")
                  ? s + (ef.value ?? 0)
                  : s,
              0
            ) ?? 0;
          return sum + dmg;
        }, 0)
    : 0;
  const blockAlreadySufficient = combat.player.block >= totalIncoming;
  const finalWantBlock = wantBlock && !blockAlreadySufficient;

  const inkCurrent = combat.player.inkCurrent ?? 0;

  // Score each playable card.
  const scored = playable.map((c) => {
    const def = cardDefs.get(c.definitionId);
    if (!def) return { c, score: -1 };

    // Ink-aware base score
    let score: number;
    if (finalWantBlock) {
      score = def.type === "SKILL" ? 100 : def.type === "POWER" ? 75 : 55;
    } else {
      score = def.type === "ATTACK" ? 100 : def.type === "POWER" ? 90 : 70;
    }

    // Inked variant boost: prioritise cards with inked variants when ink is high (ink builds
    // accumulate ≥3 marks regularly; other builds rarely exceed 2).
    if (inkCurrent >= 3 && canPlayCardInked(combat, c.instanceId, cardDefs)) {
      score += 20;
    } else if (
      inkCurrent > 0 &&
      canPlayCardInked(combat, c.instanceId, cardDefs)
    ) {
      score += 8;
    }

    // GAIN_INK boost: prioritise ink generation when ink is depleted
    const generatesInk = def.effects?.some((e) => e.type === "GAIN_INK");
    if (generatesInk && inkCurrent === 0) {
      score += 15;
    }

    // STATUS/CURSE: never play these (they're unplayable anyway, but score -999 for safety)
    if (def.type === "STATUS" || def.type === "CURSE") {
      score = -999;
    }

    return { c, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0]!.c;
  const def = cardDefs.get(best.definitionId);

  // Target: prioritise enemies that will attack next turn, then lowest HP.
  // This avoids wasting turns on passive enemies (e.g. boss inkwells that only self-block).
  let targetId: string | null = null;
  if (
    def &&
    (def.targeting === "SINGLE_ENEMY" || def.targeting === "SINGLE_ALLY") &&
    aliveEnemies.length > 0
  ) {
    const threatening = aliveEnemies.filter((e) => {
      const eDef = enemyDefs.get(e.definitionId);
      const ability = eDef?.abilities[e.intentIndex];
      return (
        ability?.effects.some((ef) =>
          (ef.type as string).startsWith("DAMAGE")
        ) ?? false
      );
    });
    const pool = threatening.length > 0 ? threatening : aliveEnemies;
    targetId = [...pool].sort((a, b) => a.currentHp - b.currentHp)[0]!
      .instanceId;
  }

  return { instanceId: best.instanceId, targetId };
}

function simulateCombat(
  runState: RunState,
  enemyIds: string[],
  rng: RNG,
  isBossFight = false
): { combat: CombatState; turns: number; runState: RunState } {
  let combat = initCombat(
    runState,
    enemyIds,
    enemyDefs,
    allyDefs,
    cardDefs,
    rng
  );
  // initCombat already draws the opening hand; apply relic on-start effects
  combat = applyRelicsOnCombatStart(combat, runState.relicIds, rng);

  // Track potion usage separately (consumed during combat)
  let usableItems = [...(runState.usableItems ?? [])];

  let turns = 0;

  while (
    combat.phase !== "COMBAT_WON" &&
    combat.phase !== "COMBAT_LOST" &&
    turns < config.maxTurnsPerCombat
  ) {
    // Play all cards we can
    combat = checkCombatEnd(combat);
    let cardsThisTurn = 0;
    while (
      combat.phase !== "COMBAT_WON" &&
      combat.phase !== "COMBAT_LOST" &&
      cardsThisTurn < 30
    ) {
      const hpRatio = combat.player.currentHp / combat.player.maxHp;
      const defensiveThreshold = isBossFight ? 0.25 : 0.5;
      const defensive = hpRatio < defensiveThreshold;
      const pick = pickCardToPlay(combat, defensive);
      if (!pick) break;

      // Fix 1 — Inked variants: use the powered-up form when ink is available,
      // but only if we won't starve a POWER card that needs ink to activate.
      const cardInst = combat.hand.find(
        (c) => c.instanceId === pick.instanceId
      );
      const cardDef = cardDefs.get(cardInst?.definitionId ?? "");
      const inkNeededForPower = combat.hand.reduce((max, c) => {
        const d = cardDefs.get(c.definitionId);
        return d?.type === "POWER" && (d.inkCost ?? 0) > 0
          ? Math.max(max, d.inkCost ?? 0)
          : max;
      }, 0);
      const inkAfterInked =
        combat.player.inkCurrent - (cardDef?.inkedVariant?.inkMarkCost ?? 0);
      const useInked =
        canPlayCardInked(combat, pick.instanceId, cardDefs) &&
        inkAfterInked >= inkNeededForPower;

      const cardType = cardDef?.type ?? "ATTACK";

      combat = playCard(
        combat,
        pick.instanceId,
        pick.targetId,
        useInked,
        cardDefs,
        rng
      );

      // Fix 2 — On-play relic effects (automaton_bronze_gear, scholars_stone, etc.)
      combat = applyRelicsOnCardPlayed(combat, runState.relicIds, cardType, {
        targetId: pick.targetId,
        rng,
      });

      combat = checkCombatEnd(combat);
      cardsThisTurn++;
    }

    if (combat.phase === "COMBAT_WON" || combat.phase === "COMBAT_LOST") break;

    // Potion usage: use block potion when about to take fatal/heavy damage in boss fights
    if (usableItems.length > 0) {
      const hpRatio = combat.player.currentHp / combat.player.maxHp;
      const aliveEnemies = combat.enemies.filter((e) => e.currentHp > 0);
      const incomingDmg = aliveEnemies.reduce((sum, e) => {
        const def = enemyDefs.get(e.definitionId);
        const ability = def?.abilities[e.intentIndex];
        return (
          sum +
          (ability?.effects.reduce(
            (s, ef) =>
              (ef.type as string).startsWith("DAMAGE")
                ? s + (ef.value ?? 0)
                : s,
            0
          ) ?? 0)
        );
      }, 0);
      const netDamage = Math.max(0, incomingDmg - combat.player.block);

      const blockPotion = usableItems.find(
        (i) => i.definitionId === "potion_block"
      );
      if (
        blockPotion &&
        (hpRatio < 0.4 || netDamage >= combat.player.currentHp)
      ) {
        combat = {
          ...combat,
          player: { ...combat.player, block: combat.player.block + 12 },
        };
        usableItems = usableItems.filter(
          (i) => i.instanceId !== blockPotion.instanceId
        );
      }

      // Damage potion: use at start of boss turn 1 or when enemy is near death
      const dmgPotion = usableItems.find(
        (i) => i.definitionId === "potion_damage"
      );
      if (dmgPotion && isBossFight && aliveEnemies.length > 0) {
        const target = [...aliveEnemies].sort(
          (a, b) => a.currentHp - b.currentHp
        )[0]!;
        // Apply 14 damage (accounting for enemy block)
        const dmg = Math.max(0, 14 - (target.block ?? 0));
        const newEnemies = combat.enemies.map((e) =>
          e.instanceId === target.instanceId
            ? { ...e, currentHp: Math.max(0, e.currentHp - dmg) }
            : e
        );
        combat = checkCombatEnd({ ...combat, enemies: newEnemies });
        usableItems = usableItems.filter(
          (i) => i.instanceId !== dmgPotion.instanceId
        );
      }
    }

    // End turn → enemies act
    combat = endPlayerTurn(combat, runState.relicIds);
    combat = executeAlliesEnemiesTurn(combat, enemyDefs, allyDefs, rng);
    combat = checkCombatEnd(combat);

    if (combat.phase !== "COMBAT_WON" && combat.phase !== "COMBAT_LOST") {
      combat = startPlayerTurn(combat, rng, runState.relicIds);
    }

    turns++;
  }

  // Treat timeout as defeat (stalemate = can't kill enemy)
  if (combat.phase !== "COMBAT_WON" && combat.phase !== "COMBAT_LOST") {
    combat = { ...combat, phase: "COMBAT_LOST" };
  }

  return { combat, turns, runState: { ...runState, usableItems } };
}

// ─── Run simulation ───────────────────────────────────────────────────────────

interface SimRunResult {
  won: boolean;
  floorsCompleted: number;
  finalHp: number;
  finalGold: number;
  totalTurns: number;
  damageTaken: number;
  combats: number;
  bossesDefeated: number;
  cardsAdded: number;
  relicsGained: number;
  deckSizeAtEnd: number;
  defeatedAtFloor: number | null;
  defeatedAtRoom: number | null;
  error: string | null;
}

function buildMetaBonuses(): ComputedMetaBonuses | undefined {
  const preset = META_PRESETS[config.metaPreset] ?? {};
  if (Object.keys(preset).length === 0) return undefined;
  return ComputedMetaBonusesSchema.parse(preset) as ComputedMetaBonuses;
}

function simulateRun(runIndex: number): SimRunResult {
  const result: SimRunResult = {
    won: false,
    floorsCompleted: 0,
    finalHp: 0,
    finalGold: 0,
    totalTurns: 0,
    damageTaken: 0,
    combats: 0,
    bossesDefeated: 0,
    cardsAdded: 0,
    relicsGained: 0,
    deckSizeAtEnd: 0,
    defeatedAtFloor: null,
    defeatedAtRoom: null,
    error: null,
  };

  try {
    const seed = `${config.seed}-${runIndex}`;
    const rng = createRNG(seed);

    // Build starter deck from character definition (proper duplicates)
    const character = getCharacterById(config.character);
    const starterCards = character.starterDeckIds
      .map((id) => cardDefs.get(id))
      .filter((c): c is NonNullable<typeof c> => c != null);

    const metaBonuses = buildMetaBonuses();

    // Create and configure run
    let run = createNewRun(
      seed,
      seed,
      starterCards,
      rng,
      metaBonuses,
      [], // no unlocked story IDs
      undefined, // no card unlock progress
      allCardDefinitions,
      [], // no run conditions
      [config.difficulty], // unlocked difficulties
      config.difficulty, // max difficulty
      null // biome choices handled by advanceFloor
    );

    // For balance testing: unlock the full card pool so rewards aren't limited to base LIBRARY cards
    const allCollectibleIds = allCardDefinitions
      .filter((c) => !c.isStarterCard && c.isCollectible !== false)
      .map((c) => c.id);
    run = { ...run, unlockedCardIds: allCollectibleIds };

    // Inject extra cards for build testing
    for (const cardId of config.extraStartCards) {
      run = addCardToRunDeck(run, cardId);
    }

    run = applyDifficultyToRun(run, config.difficulty);
    run = { ...run, pendingRunConditionChoices: [] };

    // Start floor 1
    const startBiome: BiomeType = config.biome ?? rng.pick(AVAILABLE_BIOMES);
    run = advanceFloor(run, startBiome, rng, allCardDefinitions);

    let safetyLimit = 600;

    while (run.status === "IN_PROGRESS" && safetyLimit-- > 0) {
      const reachable = getReachableRoomChoiceIndexes(run.map, run.currentRoom);

      if (reachable.length === 0) {
        result.floorsCompleted = run.floor;
        if (run.floor < GAME_CONSTANTS.MAX_FLOORS) {
          const nextBiome: BiomeType =
            config.biome ?? rng.pick(AVAILABLE_BIOMES);
          run = advanceFloor(run, nextBiome, rng, allCardDefinitions);
        } else {
          break;
        }
        continue;
      }

      const choiceIndex = rng.pick(reachable);
      const room = run.map[run.currentRoom]?.[choiceIndex];
      if (!room) break;

      const bossRoomIdx = getBossRoomIndexForMap(run.map);
      const isBoss = run.currentRoom === bossRoomIdx;

      run = selectRoom(run, choiceIndex);

      if (room.type === "COMBAT" || room.type === "PRE_BOSS") {
        const enemyIds = room.enemyIds ?? [];
        const startHp = run.playerCurrentHp;
        const {
          combat,
          turns,
          runState: runAfterCombat,
        } = simulateCombat(run, enemyIds, rng, isBoss);
        // Propagate potion consumption back to run state
        run = { ...run, usableItems: runAfterCombat.usableItems };

        result.totalTurns += turns;
        result.combats++;
        result.damageTaken += Math.max(
          0,
          startHp - Math.max(0, combat.player.currentHp)
        );

        // Defeat: stop the run immediately
        if (combat.phase === "COMBAT_LOST") {
          result.defeatedAtFloor = run.floor;
          result.defeatedAtRoom = run.currentRoom;
          if (config.verbose) {
            const label = isBoss
              ? "BOSS"
              : room.isElite
                ? "ELITE"
                : room.type === "PRE_BOSS"
                  ? "PRE"
                  : "NORM";
            console.log(
              `  * fl${run.floor} d${run.currentRoom} ${label} [${(room.enemyIds ?? []).join("+")}]` +
                ` HP:${startHp}→MORT turns:${turns} [DÉFAITE]`
            );
          }
          run = { ...run, status: "DEFEAT" };
          break;
        }

        // Generate rewards
        const rewards = generateCombatRewards(
          run.floor,
          run.currentRoom,
          isBoss,
          room.isElite ?? false,
          enemyIds.length,
          allCardDefinitions,
          rng,
          run.currentBiome,
          run.relicIds,
          run.unlockedCardIds
        );

        const goldReward = rewards.gold;
        const biomeResources = (rewards.biomeResources ?? {}) as Parameters<
          typeof completeCombat
        >[4];

        // Pick card reward — score by build type, take best
        if (rewards.cardChoices.length > 0) {
          const best = rewards.cardChoices.reduce((a, b) =>
            scoreCardForBuild(a, config.buildType) >=
            scoreCardForBuild(b, config.buildType)
              ? a
              : b
          );
          run = addCardToRunDeck(run, best.id);
          result.cardsAdded++;
        }

        // Boss: count + pick best relic for build type
        if (isBoss) {
          result.bossesDefeated++;
          if (rewards.relicChoices.length > 0) {
            const bestRelic = rewards.relicChoices.reduce((a, b) =>
              scoreRelicForBuild(a.id, config.buildType) >=
              scoreRelicForBuild(b.id, config.buildType)
                ? a
                : b
            );
            run = addRelicToRunState(run, bestRelic.id);
            result.relicsGained++;
          }
        }

        if (config.verbose) {
          const label = isBoss
            ? "BOSS"
            : room.isElite
              ? "ELITE"
              : room.type === "PRE_BOSS"
                ? "PRE"
                : "NORM";
          console.log(
            `    fl${run.floor} d${run.currentRoom} ${label} [${(room.enemyIds ?? []).join("+")}]` +
              ` HP:${startHp}→${combat.player.currentHp} turns:${turns}`
          );
        }

        // Advance run state post-combat
        run = completeCombat(
          run,
          combat,
          goldReward,
          rng,
          biomeResources,
          allCardDefinitions,
          run.relicIds,
          null
        );
      } else if (room.type === "SPECIAL" && room.specialType === "HEAL") {
        run = applyHealRoom(run);
      } else if (room.type === "SPECIAL" && room.specialType === "UPGRADE") {
        // Free upgrade — pick best unupgraded attack card, then skill card
        const candidate =
          run.deck.find(
            (c) =>
              !c.upgraded && cardDefs.get(c.definitionId)?.type === "ATTACK"
          ) ??
          run.deck.find(
            (c) => !c.upgraded && cardDefs.get(c.definitionId)?.type === "SKILL"
          );
        if (candidate) {
          run = upgradeCardInDeck(run, candidate.instanceId); // also advances currentRoom
        } else {
          run = { ...run, currentRoom: run.currentRoom + 1 };
        }
      } else if (room.type === "MERCHANT") {
        // Generate the actual shop inventory so we buy real items at real prices
        const shopItems = generateShopInventory(
          run.floor,
          allCardDefinitions,
          run.relicIds,
          rng,
          run.unlockedCardIds,
          config.difficulty,
          config.difficulty,
          0,
          run.usableItems ?? [],
          run.usableItemCapacity ?? 3,
          undefined,
          run.allyIds ?? [],
          run.metaBonuses?.allySlots ?? 0
        );

        const hpPct = run.playerCurrentHp / run.playerMaxHp;

        // Priority 1: buy max_hp or heal if HP is low (below 60%)
        if (hpPct < 0.6) {
          for (const item of shopItems) {
            if (
              (item.type === "max_hp" || item.type === "heal") &&
              run.gold >= item.price
            ) {
              const updated = buyShopItem(run, item);
              if (updated) {
                run = updated;
                break;
              }
            }
          }
        }

        // Priority 2: buy usable_item (potion) if we have a slot and can afford it
        for (const item of shopItems) {
          if (item.type === "usable_item" && run.gold >= item.price) {
            const updated = buyShopItem(run, item);
            if (updated) {
              run = updated;
              break;
            }
          }
        }

        // Priority 3: buy ally if we have a free slot
        const allySlots = run.metaBonuses?.allySlots ?? 0;
        if ((run.allyIds ?? []).length < allySlots) {
          const allyOffers = shopItems.filter(
            (i) => i.type === "ally" && run.gold >= i.price
          );
          if (allyOffers.length > 0) {
            const best = allyOffers.reduce((a, b) =>
              scoreAllyForBuild(a.allyId ?? "", config.buildType) >=
              scoreAllyForBuild(b.allyId ?? "", config.buildType)
                ? a
                : b
            );
            const updated = buyShopItem(run, best);
            if (updated) run = updated;
          }
        }

        // Priority 4: purge STATUS/CURSE cards from deck (max 1 purge per merchant)
        const badCards = run.deck.filter((c) => {
          const def = cardDefs.get(c.definitionId);
          return def && (def.type === "STATUS" || def.type === "CURSE");
        });
        if (badCards.length > 0) {
          const purgeOffer = shopItems.find(
            (i) => i.type === "purge" && run.gold >= i.price
          );
          if (purgeOffer) {
            // Deduct gold via buyShopItem (it only deducts gold for purge, doesn't remove card)
            const afterPay = buyShopItem(run, purgeOffer);
            if (afterPay) {
              // Remove worst card: prefer STATUS > CURSE, then oldest (first found)
              const worst =
                badCards.find(
                  (c) => cardDefs.get(c.definitionId)?.type === "STATUS"
                ) ?? badCards[0]!;
              run = {
                ...afterPay,
                deck: afterPay.deck.filter(
                  (c) => c.instanceId !== worst.instanceId
                ),
              };
            }
          }
        }

        // Priority 5: upgrade best unupgraded attack/skill cards (up to 2)
        const UPGRADE_COST = 75;
        let upgraded = 0;
        while (run.gold >= UPGRADE_COST && upgraded < 2) {
          const card =
            run.deck.find(
              (c) =>
                !c.upgraded && cardDefs.get(c.definitionId)?.type === "ATTACK"
            ) ??
            run.deck.find(
              (c) =>
                !c.upgraded && cardDefs.get(c.definitionId)?.type === "SKILL"
            );
          if (!card) break;
          run = { ...run, gold: run.gold - UPGRADE_COST };
          const cardIdx = run.deck.findIndex(
            (c) => c.instanceId === card.instanceId
          );
          if (cardIdx >= 0) {
            const newDeck = [...run.deck];
            newDeck[cardIdx] = { ...newDeck[cardIdx]!, upgraded: true };
            run = { ...run, deck: newDeck };
          }
          upgraded++;
        }
        run = { ...run, currentRoom: run.currentRoom + 1 };
      } else {
        // EVENT, other SPECIAL — skip and advance room
        run = { ...run, currentRoom: run.currentRoom + 1 };
      }
    }

    result.won = run.status === "VICTORY";
    if (result.won) result.floorsCompleted = GAME_CONSTANTS.MAX_FLOORS;
    result.finalHp = run.playerCurrentHp;
    result.finalGold = run.gold;
    result.deckSizeAtEnd = run.deck.length;
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
  }

  return result;
}

// ─── CSV logging ──────────────────────────────────────────────────────────────

function writeCsv(results: SimRunResult[]): void {
  const header = [
    "won",
    "floorsCompleted",
    "finalHp",
    "finalGold",
    "totalTurns",
    "damageTaken",
    "combats",
    "bossesDefeated",
    "cardsAdded",
    "relicsGained",
    "deckSizeAtEnd",
    "defeatedAtFloor",
    "defeatedAtRoom",
    "error",
  ].join(",");

  const rows = results.map((r) =>
    [
      r.won ? 1 : 0,
      r.floorsCompleted,
      r.finalHp,
      r.finalGold,
      r.totalTurns,
      r.damageTaken,
      r.combats,
      r.bossesDefeated,
      r.cardsAdded,
      r.relicsGained,
      r.deckSizeAtEnd,
      r.defeatedAtFloor ?? "",
      r.defeatedAtRoom ?? "",
      r.error ? `"${r.error.replace(/"/g, "''")}"` : "",
    ].join(",")
  );

  const path = "scripts/sim-results.csv";
  fs.writeFileSync(path, [header, ...rows].join("\n"), "utf8");
  console.log(`  📄 Log CSV écrit dans ${path} (${results.length} lignes)`);
}

// ─── Statistics helpers ───────────────────────────────────────────────────────

function avg(nums: number[]): number {
  return nums.length === 0 ? 0 : nums.reduce((a, b) => a + b, 0) / nums.length;
}

function pct(n: number, total: number): string {
  return total === 0 ? "—" : `${((n / total) * 100).toFixed(1)}%`;
}

function fmt(n: number, decimals = 1): string {
  return n.toFixed(decimals);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const startMs = Date.now();

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║          RogueNext — Headless Simulator          ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(
    `  Runs: ${config.numRuns}  |  Diff: ${config.difficulty}  |  Character: ${config.character}  |  Méta: ${config.metaPreset}  |  Build: ${config.buildType}`
  );
  console.log(
    `  Biome: ${config.biome ?? "aléatoire"}  |  Seed: "${config.seed}"${config.extraStartCards.length ? `  |  Cards+: ${config.extraStartCards.join(",")}` : ""}\n`
  );

  const results: SimRunResult[] = [];
  const errors: string[] = [];

  if (!config.verbose) process.stdout.write("  Simulation ");
  for (let i = 0; i < config.numRuns; i++) {
    if (config.verbose)
      console.log(`\n── Run ${i + 1} ─────────────────────────────────────`);
    const r = simulateRun(i);
    results.push(r);
    if (r.error) errors.push(`run ${i}: ${r.error}`);
    if (config.verbose) {
      console.log(
        `  ${r.won ? "VICTOIRE" : "DÉFAITE"} fl${r.floorsCompleted} | HP:${r.finalHp} | deck:${r.deckSizeAtEnd} | boss:${r.bossesDefeated} | tours:${r.totalTurns}${r.error ? ` ERR:${r.error}` : ""}`
      );
    } else if ((i + 1) % Math.max(1, Math.floor(config.numRuns / 40)) === 0) {
      process.stdout.write("▪");
    }
  }
  const elapsedMs = Date.now() - startMs;
  if (!config.verbose) console.log(` done (${(elapsedMs / 1000).toFixed(1)}s)`);
  else
    console.log(
      `\n── Total: ${(elapsedMs / 1000).toFixed(1)}s ───────────────────────────────`
    );
  console.log();

  const total = results.length;
  const wins = results.filter((r) => r.won);
  const losses = results.filter((r) => !r.won);
  const valid = results.filter((r) => !r.error);

  console.log("══════════════════════════════════════════════════");
  console.log(
    `  RÉSULTATS  (${total} runs, diff: ${config.difficulty}, méta: ${config.metaPreset}, build: ${config.buildType})`
  );
  console.log("══════════════════════════════════════════════════");

  console.log("\n  ── Victoires ────────────────────────────────────");
  console.log(
    `  Taux de victoire       : ${pct(wins.length, total)}  (${wins.length}/${total})`
  );
  console.log(
    `  Moy. étages complétés  : ${fmt(avg(valid.map((r) => r.floorsCompleted)))} / ${GAME_CONSTANTS.MAX_FLOORS}`
  );
  console.log(
    `  Moy. boss tués         : ${fmt(avg(valid.map((r) => r.bossesDefeated)))}`
  );

  console.log("\n  ── Combat ───────────────────────────────────────");
  console.log(
    `  Moy. combats/run       : ${fmt(avg(valid.map((r) => r.combats)))}`
  );
  console.log(
    `  Moy. tours/run         : ${fmt(avg(valid.map((r) => r.totalTurns)))}`
  );
  console.log(
    `  Moy. dégâts subis/run  : ${fmt(avg(valid.map((r) => r.damageTaken)), 0)}`
  );
  if (wins.length > 0) {
    console.log(
      `  Moy. HP restants (win) : ${fmt(avg(wins.map((r) => r.finalHp)), 0)}`
    );
  }
  if (losses.length > 0) {
    console.log(
      `  Moy. HP restants (def) : ${fmt(avg(losses.map((r) => r.finalHp)), 0)}`
    );
  }

  console.log("\n  ── Deck / Progression ───────────────────────────");
  console.log(
    `  Moy. cartes ajoutées   : ${fmt(avg(valid.map((r) => r.cardsAdded)))}`
  );
  console.log(
    `  Moy. reliques gagnées  : ${fmt(avg(valid.map((r) => r.relicsGained)))}`
  );
  console.log(
    `  Moy. taille deck final : ${fmt(avg(valid.map((r) => r.deckSizeAtEnd)))}`
  );
  console.log(
    `  Moy. or final          : ${fmt(avg(valid.map((r) => r.finalGold)), 0)}`
  );

  if (losses.length > 0) {
    const byFloor: Record<number, number> = {};
    for (const r of losses) {
      const f = r.defeatedAtFloor ?? 0;
      byFloor[f] = (byFloor[f] ?? 0) + 1;
    }
    console.log("\n  ── Défaites par étage ───────────────────────────");
    for (const [floor, count] of Object.entries(byFloor).sort(
      ([a], [b]) => Number(a) - Number(b)
    )) {
      const bar = "█".repeat(Math.round((count / losses.length) * 20));
      console.log(
        `  Étage ${floor}  : ${String(count).padStart(4)}  ${pct(count, losses.length).padStart(6)}  ${bar}`
      );
    }
  }

  {
    const byFloor: Record<number, number> = {};
    for (const r of valid) {
      byFloor[r.floorsCompleted] = (byFloor[r.floorsCompleted] ?? 0) + 1;
    }
    console.log("\n  ── Répartition étages atteints ──────────────────");
    for (const [floor, count] of Object.entries(byFloor).sort(
      ([a], [b]) => Number(b) - Number(a)
    )) {
      const bar = "█".repeat(Math.round((count / total) * 20));
      console.log(
        `  ${floor} étage(s)  : ${String(count).padStart(4)}  ${pct(count, total).padStart(6)}  ${bar}`
      );
    }
  }

  if (errors.length > 0) {
    console.log(`\n  ⚠ ${errors.length} run(s) en erreur :`);
    errors.slice(0, 5).forEach((e) => console.log(`    - ${e}`));
    if (errors.length > 5) console.log(`    ... (+${errors.length - 5})`);
  }

  console.log("\n══════════════════════════════════════════════════\n");

  if (config.writeCsv) {
    writeCsv(results);
  }
}

main();
