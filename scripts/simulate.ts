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
 *   [character]  "scribe" | "bibliothecaire" | "griot" | "fou" (default: scribe)
 *   [meta]       Meta preset: "none" | "minimal" | "average" | "strong" | "max" (default: none)
 *   [seed]       RNG seed string (default: "sim")
 *
 * Flags:
 *   --log               Write CSV log to scripts/sim-results.csv
 *   --verbose           Print per-run and per-combat details
 *   --build TYPE        Draft preference: mixed | poison | armor | bleed | ink | draw | exhaust | discard | strength | rhythm | archive | upgrade | debt
 *   --json PATH         Export per-run results, draft exposures/picks and upgrade branches
 *   --no-armor-payoffs   Decline base armor payoff rewards and never play armor damage/thorns card forms
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
import { createGameReducer, type GameAction } from "../src/app/game/_providers/game-reducer";
import { chooseCombatCard, chooseInkPower, estimateIncomingDamage, hasArmorPayoff } from "./simulation-combat-policy";
import { BUILD_PATHS } from "../src/game/engine/build-profile";
import {
  scoreCardForBuild,
  chooseUpgradeBranch,
  chooseUpgradeCard,
  type BuildType,
} from "./simulation-policy";
import { histoireDefinitions } from "../src/game/data/histoires";
import { computeUnlockedRelicIds } from "../src/game/engine/difficulty";
import { relicDefinitions } from "../src/game/data/relics";
import { computeMetaBonuses } from "../src/game/engine/meta";
import {
  pickEvent,
  applyEventChoice,
  isEventChoiceAvailable,
} from "../src/game/engine/run-events";
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
} from "../src/game/engine/combat";
import {
  generateCombatRewards,
  addCardToRunDeck,
} from "../src/game/engine/rewards";
import {
  addRelicToRunState,
  applyRelicsOnCombatStart,
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

// Real story IDs, with prerequisite closure: no hand-written impossible bonuses.
const storyOrder = [...histoireDefinitions].sort((a, b) => a.tier - b.tier);
const presetCounts: Record<string, number> = {
  none: 0,
  minimal: 9,
  average: 25,
  strong: 35,
  max: storyOrder.length,
};
function storyIdsForPreset(preset: string): string[] {
  const ids = new Set(
    storyOrder.slice(0, presetCounts[preset] ?? 0).map((story) => story.id)
  );
  const addPrerequisites = (id: string) => {
    for (const prerequisite of histoireDefinitions.find(
      (story) => story.id === id
    )?.prerequis ?? []) {
      if (!ids.has(prerequisite)) {
        ids.add(prerequisite);
        addPrerequisites(prerequisite);
      }
    }
  };
  for (const id of ids) addPrerequisites(id);
  return [...ids];
}
const META_PRESETS = Object.fromEntries(
  Object.keys(presetCounts).map((name) => [
    name,
    computeMetaBonuses(storyIdsForPreset(name)),
  ])
);

// ─── CLI parsing ──────────────────────────────────────────────────────────────

const positionals: string[] = [];
const flags = new Set<string>();
const flagValues: Record<string, string> = {};
const args = process.argv.slice(2);
for (let index = 0; index < args.length; index++) {
  const arg = args[index]!;
  if (!arg.startsWith("--")) {
    positionals.push(arg);
    continue;
  }
  const separator = arg.indexOf("=");
  if (separator >= 0) {
    flagValues[arg.slice(2, separator)] = arg.slice(separator + 1);
    continue;
  }
  if (
    ["--cards", "--build", "--json"].includes(arg) &&
    args[index + 1] &&
    !args[index + 1]!.startsWith("--")
  ) {
    flagValues[arg.slice(2)] = args[++index]!;
  } else flags.add(arg);
}
function getFlagValue(name: string): string | null {
  return flagValues[name] ?? null;
}

const RAW_BIOME = positionals[2];
const RAW_META = positionals[4] ?? "none";
const RAW_BUILD = getFlagValue("build") ?? "mixed";
if (!["mixed", ...BUILD_PATHS].includes(RAW_BUILD))
  throw new Error(`Unknown build: ${RAW_BUILD}`);
const draftStats: Record<string, { offered: number; picked: number }> = {};
const upgradeStats = { A: 0, B: 0 };

interface SimConfig {
  numRuns: number;
  difficulty: number;
  biome: BiomeType | null;
  character: string;
  metaPreset: string;
  seed: string;
  buildType: BuildType;
  noArmorPayoffs: boolean;
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
  noArmorPayoffs: flags.has("--no-armor-payoffs"),
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
  golem_pulp_core: { base: 65, draw: 115, mixed: 80 },
  priest_obsidian_censer: { base: 60, draw: 90, ink: 75, mixed: 70 },
  viking_valkyrie_feather: { base: 50, draw: 95, mixed: 70 },

  // Poison (biome-gated but impactful when available)
  cultist_flayed_mask: { base: 45, poison: 115, mixed: 60 },
  egypt_scarab_idol: { base: 40, poison: 125, mixed: 60 },

  // Bleed (biome-gated but impactful when available)
  celtic_briar_seed: { base: 35, bleed: 120, mixed: 50 },
  celtic_morrigan_feather: { base: 40, bleed: 85, armor: 60, mixed: 55 },
  broodling_hydra_spine: { base: 55, bleed: 90, draw: 70, mixed: 65 },

  // Difficulty-unlock relics (diff 2-5)
  scroll_of_marginalia: { base: 70, draw: 140, mixed: 90 },
  bleeding_thistle: { base: 60, bleed: 145, mixed: 70 },
  venom_pouch: { base: 60, poison: 145, mixed: 70 },
  arcane_reservoir: { base: 75, ink: 155, mixed: 85 },
  plague_vial: { base: 65, poison: 155, mixed: 75 },
  endless_codex: { base: 70, draw: 155, mixed: 80 },
  crimson_covenant: { base: 65, bleed: 155, mixed: 75 },
  philosophers_tome: {
    base: 95,
    mixed: 110,
    ink: 110,
    draw: 100,
    bleed: 100,
    poison: 100,
    armor: 95,
  },
  eternal_flow: {
    base: 95,
    ink: 115,
    mixed: 115,
    bleed: 100,
    poison: 100,
    draw: 100,
    armor: 100,
  },
  venom_grimoire: { base: 55, poison: 155, mixed: 65 },
  hemorrhage_codex: { base: 55, bleed: 155, mixed: 65 },
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

  const reducer = createGameReducer({cardDefs, enemyDefs, allyDefs, rng});
  let liveRun = runState;
  const act = (action: GameAction) => {
    liveRun = reducer({...liveRun, combat, usableItems}, action);
    combat = liveRun.combat!;
    usableItems = liveRun.usableItems ?? [];
  };
  let turns = 0;

  while (
    combat.phase !== "COMBAT_WON" &&
    combat.phase !== "COMBAT_LOST" &&
    turns < config.maxTurnsPerCombat
  ) {
    turns++;
    // Use every unlocked character power once when legal. Earlier simulator
    // versions ignored powers entirely, which badly understated Griot and
    // Bibliothecaire while making cross-character comparisons misleading.
    const character = getCharacterById(runState.characterId ?? "scribe");
    const resolveOverflow = () => {
      while (
        (combat.pendingHandOverflowExhaust ?? 0) > 0 &&
        combat.hand.length > 0
      ) {
        const worst = [...combat.hand].sort(
          (a, b) =>
            scoreCardForBuild(cardDefs.get(a.definitionId)!, config.buildType) -
            scoreCardForBuild(cardDefs.get(b.definitionId)!, config.buildType)
        )[0]!;
        act({type:"RESOLVE_HAND_OVERFLOW_EXHAUST",payload:{cardInstanceId:worst.instanceId}});
      }
    };
    resolveOverflow();
    const unlockedSlots = new Set(
      runState.metaBonuses?.unlockedPowerSlots ?? [1]
    );
    const availablePowers = character.powers.filter((_, index) => unlockedSlots.has(index + 1));

    // Potion usage
    if (usableItems.length > 0) {
      const hpRatio = combat.player.currentHp / combat.player.maxHp;
      const aliveEnemies = combat.enemies.filter((e) => e.currentHp > 0);
      const netDamage = estimateIncomingDamage(combat, enemyDefs);
      const lowestHpEnemy =
        aliveEnemies.length > 0
          ? [...aliveEnemies].sort((a, b) => a.currentHp - b.currentHp)[0]!
          : null;

      const applyPotion = (defId: string, targetId: string | null) => {
        const item = usableItems.find((i) => i.definitionId === defId);
        if (!item) return;
        act({type:"USE_USABLE_ITEM",payload:{itemInstanceId:item.instanceId,targetId}});
      };

      // Block / guardian potions: use when about to take fatal/heavy damage
      if (hpRatio < 0.4 || netDamage >= combat.player.currentHp) {
        applyPotion("potion_block", null);
        applyPotion("potion_guardian", null);
      }

      // Offensive potions in boss fights
      if (isBossFight && lowestHpEnemy) {
        applyPotion("potion_damage", lowestHpEnemy.instanceId);
        applyPotion("potion_poison", lowestHpEnemy.instanceId);
        applyPotion("potion_bleed", lowestHpEnemy.instanceId);
        applyPotion("potion_weakness", lowestHpEnemy.instanceId);
        applyPotion("potion_vulnerable", lowestHpEnemy.instanceId);
      }

      // Buff potions in boss fights
      if (isBossFight) {
        applyPotion("potion_strength", null);
        applyPotion("potion_focus", null);
        applyPotion("potion_ink", null);
        applyPotion("potion_energy", null);
      }

      // Draw potion: use when hand is near empty
      if (combat.hand.length <= 1) {
        applyPotion("potion_draw", null);
      }

      combat = checkCombatEnd(combat);
    }

    // Play all cards we can
    combat = checkCombatEnd(combat);
    let cardsThisTurn = 0;
    while (
      combat.phase !== "COMBAT_WON" &&
      combat.phase !== "COMBAT_LOST" &&
      cardsThisTurn < 30
    ) {
      resolveOverflow();
      const pick = chooseCombatCard(combat, cardDefs, enemyDefs, config.noArmorPayoffs);
      const powerPick = chooseInkPower(combat, cardDefs, enemyDefs, availablePowers);
      if (powerPick && (!pick || powerPick.score > pick.score)) {
        act({type:"USE_INK_POWER",payload:{power:powerPick.power,targetId:powerPick.targetId}});
        cardsThisTurn++;
        continue;
      }
      if (!pick) break;
      act({type:"PLAY_CARD",payload:{instanceId:pick.instanceId,targetId:pick.targetId,useInked:pick.useInked}});

      combat = checkCombatEnd(combat);
      cardsThisTurn++;
    }

    if (combat.phase === "COMBAT_WON" || combat.phase === "COMBAT_LOST") break;

    resolveOverflow();
    act({type:"END_TURN"});
  }

  // Treat timeout as defeat (stalemate = can't kill enemy)
  if (combat.phase !== "COMBAT_WON" && combat.phase !== "COMBAT_LOST") {
    combat = { ...combat, phase: "COMBAT_LOST" };
  }

  return { combat, turns, runState: { ...liveRun, combat, usableItems } };
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
  finalDeck?: Array<{id:string;upgraded:boolean;branch:string|null}>;
  defeatedBy?: string[];
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
      storyIdsForPreset(config.metaPreset),
      undefined, // no card unlock progress
      allCardDefinitions,
      [], // no run conditions
      [config.difficulty], // unlocked difficulties
      config.difficulty, // max difficulty
      null, // biome choices handled by advanceFloor
      {},
      {},
      computeUnlockedRelicIds(
        relicDefinitions.map((relic) => relic.id),
        {
          totalRuns:
            config.metaPreset === "none"
              ? (character.unlockCondition?.totalRuns ?? 0)
              : 30,
          wonRuns: 0,
          unlockedDifficultyMax: config.difficulty,
        }
      )
    );

    // Inject extra cards for build testing
    for (const cardId of config.extraStartCards) {
      run = addCardToRunDeck(run, cardId);
    }

    run = applyDifficultyToRun(run, config.difficulty);
    run = { ...run, pendingRunConditionChoices: [] };

    // Start floor 1
    const startBiome: BiomeType =
      config.biome ??
      (config.difficulty === 0 ? "LIBRARY" : rng.pick(AVAILABLE_BIOMES));
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

      if (room.type === "PRE_BOSS" && run.playerCurrentHp < run.playerMaxHp * 0.75) {
        run = applyHealRoom(run);
        continue;
      }
      if (room.type === "COMBAT" || room.type === "PRE_BOSS") {
        const enemyIds = room.enemyIds ?? [];
        const startHp = run.playerCurrentHp;
        const {
          combat,
          turns,
          runState: runAfterCombat,
        } = simulateCombat(run, enemyIds, rng, isBoss);
        // Propagate potion consumption back to run state
        run = runAfterCombat;

        result.totalTurns += turns;
        result.combats++;
        result.damageTaken += Math.max(
          0,
          startHp - Math.max(0, combat.player.currentHp)
        );

        // Defeat: stop the run immediately
        if (combat.phase === "COMBAT_LOST") {
          result.defeatedBy = enemyIds;
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
          run = {
            ...run,
            status: "DEFEAT",
            playerCurrentHp: Math.max(0, combat.player.currentHp),
          };
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
          run.unlockedCardIds,
          run.allyIds,
          run.metaBonuses?.allySlots ?? 0,
          run.unlockedDifficultyLevelSnapshot ?? 0,
          isBoss ? enemyIds.find((id) => enemyDefs.get(id)?.isBoss) : undefined,
          run.metaBonuses?.extraCardRewardChoices ?? 0,
          run.metaBonuses?.lootLuck ?? 0,
          run.selectedDifficultyLevel ?? 0,
          run.unlockedRelicIds,
          1,
          false,
          run.characterId,
          run.deck,
          run.playerCurrentHp,
          run.playerMaxHp
        );

        const goldReward = rewards.gold;
        const biomeResources = (rewards.biomeResources ?? {}) as Parameters<
          typeof completeCombat
        >[4];

        for (const choice of rewards.cardChoices) {
          (draftStats[choice.id] ??= { offered: 0, picked: 0 }).offered++;
        }
        // Pick card reward — score by build type, take best
        const choosesEliteRelic =
          !isBoss && room.isElite && rewards.relicChoices.length > 0;
        const eligibleChoices = config.noArmorPayoffs ? rewards.cardChoices.filter(card => !hasArmorPayoff(card)) : rewards.cardChoices;
        if (eligibleChoices.length > 0 && !choosesEliteRelic) {
          const best = eligibleChoices.reduce((a, b) =>
            scoreCardForBuild(a, config.buildType) >=
            scoreCardForBuild(b, config.buildType)
              ? a
              : b
          );
          draftStats[best.id]!.picked++;
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

        // Elite: pick the offered relic (always offered at diff < 5)
        if (
          (room.isElite ?? false) &&
          !isBoss &&
          rewards.relicChoices.length > 0
        ) {
          const bestRelic = rewards.relicChoices.reduce((a, b) =>
            scoreRelicForBuild(a.id, config.buildType) >=
            scoreRelicForBuild(b.id, config.buildType)
              ? a
              : b
          );
          run = addRelicToRunState(run, bestRelic.id);
          result.relicsGained++;
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
          rewards.usableItemDropDefinitionId
        );
      } else if (room.type === "SPECIAL" && room.specialType === "HEAL") {
        run = applyHealRoom(run);
      } else if (room.type === "SPECIAL" && room.specialType === "UPGRADE") {
        const candidate = chooseUpgradeCard(
          run.deck,
          cardDefs,
          config.buildType
        );
        if (candidate) {
          const branch = chooseUpgradeBranch(
            cardDefs.get(candidate.definitionId)!,
            config.buildType
          );
          upgradeStats[branch]++;
          run = upgradeCardInDeck(run, candidate.instanceId, branch); // also advances currentRoom
        } else {
          run = { ...run, currentRoom: run.currentRoom + 1 };
        }
      } else if (room.type === "SPECIAL" && room.specialType === "EVENT") {
        const event = pickEvent(rng, config.difficulty, run);
        const options = event.choices
          .map((choice, index) => ({ choice, index }))
          .filter(({ choice }) => isEventChoiceAvailable(run, choice));
        const choice =
          options.find(
            ({ choice }) =>
              !choice.requiresRelicChoice &&
              !choice.requiresPurge &&
              !choice.rewardAllCards &&
              !choice.rewardArchetypeTag
          ) ?? options.at(-1);
        if (choice) run = applyEventChoice(run, event, choice.index);
        else run = { ...run, currentRoom: run.currentRoom + 1 };
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

        // Priority 2: buy best relic if affordable
        const relicOffers = shopItems.filter(
          (i) => i.type === "relic" && run.gold >= i.price
        );
        if (relicOffers.length > 0) {
          const best = relicOffers.reduce((a, b) =>
            scoreRelicForBuild(a.relicId ?? "", config.buildType) >=
            scoreRelicForBuild(b.relicId ?? "", config.buildType)
              ? a
              : b
          );
          const updated = buyShopItem(run, best);
          if (updated) {
            run = updated;
            result.relicsGained++;
          }
        }

        // Priority 3: buy usable_item (potion) if we have a slot and can afford it
        for (const item of shopItems) {
          if (item.type === "usable_item" && run.gold >= item.price) {
            const updated = buyShopItem(run, item);
            if (updated) {
              run = updated;
              break;
            }
          }
        }

        // Priority 4: buy ally if we have a free slot
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

        // Priority 5: purge STATUS/CURSE cards from deck (max 1 purge per merchant)
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
    result.finalDeck = run.deck.map(c=>({id:c.definitionId,upgraded:c.upgraded,branch:c.upgradeBranch??null}));
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

  const jsonPath = getFlagValue("json");
  if (jsonPath)
    fs.writeFileSync(
      jsonPath,
      JSON.stringify(
        {
          config,
          runs: results,
          wins: wins.length,
          errors,
          draftStats,
          upgradeStats,
        },
        null,
        2
      )
    );
  if (errors.length > 0) process.exitCode = 1;

  if (config.writeCsv) {
    writeCsv(results);
  }
}

main();
