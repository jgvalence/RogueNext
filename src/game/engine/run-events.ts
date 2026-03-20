import type { RunState } from "../schemas/run-state";
import type { BiomeType, CardArchetypeTag } from "../schemas/enums";
import { GAME_CONSTANTS } from "../constants";
import { relicDefinitions } from "../data/relics";
import { createRNG, type RNG } from "./rng";
import { nanoid } from "nanoid";
import { getTotalLootLuck, weightedSampleByRarity } from "./loot";
import { addRelicToRunState } from "./relics";
import { markCardAcquiredForRunConditionUnlock } from "./rewards";

// ============================
// Random Events
// ============================

export interface GameEvent {
  id: string;
  title: string;
  flavorText?: string;
  description: string;
  biome?: BiomeType;
  /** If true, this event can only appear once per run (tracked via RunState.seenEventIds) */
  once?: boolean;
  choices: EventChoice[];
  condition?: (state: RunState) => boolean;
}

export interface EventChoice {
  label: string;
  description: string;
  outcomeText?: string;
  requiresPurge?: boolean;
  rewardArchetypeTag?: CardArchetypeTag;
  minimumRewardChoices?: number;
  apply: (state: RunState) => RunState;
}

const RISKY_EVENT_IDS = new Set([
  "mysterious_tome",
  "ancient_sarcophagus",
  "whispering_idol",
  "ruthless_scrivener",
  "mirror_of_bronze",
  "skald_fire",
  "thread_of_ariadne",
  "kostchei_needle",
  "huginn_bargain",
  "anubis_scales",
  "thoth_archives",
  "forbidden_lexicon",
  "dreaming_gate",
  "obsidian_altar",
  "lady_of_the_lake",
  "morrigan_crow",
  "nyame_trial",
]);

function addDeckCard(state: RunState, definitionId: string): RunState {
  return markCardAcquiredForRunConditionUnlock(
    {
      ...state,
      deck: [
        ...state.deck,
        {
          instanceId: nanoid(),
          definitionId,
          upgraded: false,
        },
      ],
    },
    definitionId
  );
}

function addRelicToRun(state: RunState, relicId: string): RunState {
  return addRelicToRunState(state, relicId);
}

export function pickGuaranteedEventRelicId(state: RunState): string | null {
  const nonBossPool = relicDefinitions.filter((r) => r.rarity !== "BOSS");
  const available = nonBossPool.filter((r) => !state.relicIds.includes(r.id));
  const unlockedRelicIds = new Set(
    (state.unlockedRelicIds?.length ?? 0) > 0
      ? state.unlockedRelicIds
      : nonBossPool.map((r) => r.id)
  );
  const eligible = available.filter((r) => unlockedRelicIds.has(r.id));
  if (eligible.length === 0) return null;
  const rng = createRNG(
    `${state.seed}-guaranteed-relic-${state.floor}-${state.currentRoom}-${state.relicIds.length}`
  );
  const lootLuck = getTotalLootLuck(
    state.relicIds,
    state.metaBonuses?.lootLuck ?? 0
  );
  return weightedSampleByRarity(eligible, 1, rng, lootLuck)[0]?.id ?? null;
}

export function createGuaranteedRelicEvent(): GameEvent {
  return {
    id: "sealed_reliquary",
    title: "events.sealed_reliquary.title",
    flavorText: "events.sealed_reliquary.flavorText",
    description: "events.sealed_reliquary.description",
    choices: [
      {
        label: "events.sealed_reliquary.choices.0.label",
        description: "events.sealed_reliquary.choices.0.description",
        outcomeText: "events.sealed_reliquary.choices.0.outcomeText",
        apply: (s) => {
          const relicId = pickGuaranteedEventRelicId(s);
          if (!relicId) return { ...s, currentRoom: s.currentRoom + 1 };
          const withRelic = addRelicToRun(s, relicId);
          return { ...withRelic, currentRoom: withRelic.currentRoom + 1 };
        },
      },
      {
        label: "events.sealed_reliquary.choices.1.label",
        description: "events.sealed_reliquary.choices.1.description",
        outcomeText: "events.sealed_reliquary.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  };
}

function createArchetypeChoice(
  label: string,
  description: string,
  outcomeText: string,
  rewardArchetypeTag: CardArchetypeTag,
  minimumRewardChoices = 1
): EventChoice {
  return {
    label,
    description,
    outcomeText,
    rewardArchetypeTag,
    minimumRewardChoices,
    apply: (state) => ({ ...state, currentRoom: state.currentRoom + 1 }),
  };
}

const EVENTS: GameEvent[] = [
  {
    id: "scriptorium_catalog",
    title: "events.scriptorium_catalog.title",
    flavorText: "events.scriptorium_catalog.flavorText",
    description: "events.scriptorium_catalog.description",
    choices: [
      createArchetypeChoice(
        "events.scriptorium_catalog.choices.0.label",
        "events.scriptorium_catalog.choices.0.description",
        "events.scriptorium_catalog.choices.0.outcomeText",
        "BLOCK"
      ),
      createArchetypeChoice(
        "events.scriptorium_catalog.choices.1.label",
        "events.scriptorium_catalog.choices.1.description",
        "events.scriptorium_catalog.choices.1.outcomeText",
        "HEAL",
        3
      ),
      createArchetypeChoice(
        "events.scriptorium_catalog.choices.2.label",
        "events.scriptorium_catalog.choices.2.description",
        "events.scriptorium_catalog.choices.2.outcomeText",
        "INK"
      ),
    ],
  },
  {
    id: "scarlet_index",
    title: "events.scarlet_index.title",
    flavorText: "events.scarlet_index.flavorText",
    description: "events.scarlet_index.description",
    choices: [
      createArchetypeChoice(
        "events.scarlet_index.choices.0.label",
        "events.scarlet_index.choices.0.description",
        "events.scarlet_index.choices.0.outcomeText",
        "BLEED"
      ),
      createArchetypeChoice(
        "events.scarlet_index.choices.1.label",
        "events.scarlet_index.choices.1.description",
        "events.scarlet_index.choices.1.outcomeText",
        "EXHAUST"
      ),
      createArchetypeChoice(
        "events.scarlet_index.choices.2.label",
        "events.scarlet_index.choices.2.description",
        "events.scarlet_index.choices.2.outcomeText",
        "INK"
      ),
    ],
  },
  {
    id: "war_ledger",
    title: "events.war_ledger.title",
    flavorText: "events.war_ledger.flavorText",
    description: "events.war_ledger.description",
    choices: [
      createArchetypeChoice(
        "events.war_ledger.choices.0.label",
        "events.war_ledger.choices.0.description",
        "events.war_ledger.choices.0.outcomeText",
        "BLOCK"
      ),
      createArchetypeChoice(
        "events.war_ledger.choices.1.label",
        "events.war_ledger.choices.1.description",
        "events.war_ledger.choices.1.outcomeText",
        "BLEED"
      ),
      createArchetypeChoice(
        "events.war_ledger.choices.2.label",
        "events.war_ledger.choices.2.description",
        "events.war_ledger.choices.2.outcomeText",
        "EXHAUST"
      ),
    ],
  },
  // ── Neutral events ──────────────────────────────────────────────────────
  {
    id: "mysterious_tome",
    title: "events.mysterious_tome.title",
    flavorText: "events.mysterious_tome.flavorText",
    description: "events.mysterious_tome.description",
    choices: [
      {
        label: "events.mysterious_tome.choices.0.label",
        description: "events.mysterious_tome.choices.0.description",
        outcomeText: "events.mysterious_tome.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 10),
          gold: s.gold + 50,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 50),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.mysterious_tome.choices.1.label",
        description: "events.mysterious_tome.choices.1.description",
        outcomeText: "events.mysterious_tome.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  {
    id: "ink_fountain",
    title: "events.ink_fountain.title",
    flavorText: "events.ink_fountain.flavorText",
    description: "events.ink_fountain.description",
    choices: [
      {
        label: "events.ink_fountain.choices.0.label",
        description: "events.ink_fountain.choices.0.description",
        outcomeText: "events.ink_fountain.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.min(s.playerMaxHp, s.playerCurrentHp + 5),
          gold: s.gold + 25,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 25),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.ink_fountain.choices.1.label",
        description: "events.ink_fountain.choices.1.description",
        outcomeText: "events.ink_fountain.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          gold: s.gold + 75,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 75),
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "wandering_scribe",
    title: "events.wandering_scribe.title",
    flavorText: "events.wandering_scribe.flavorText",
    description: "events.wandering_scribe.description",
    choices: [
      {
        label: "events.wandering_scribe.choices.0.label",
        description: "events.wandering_scribe.choices.0.description",
        outcomeText: "events.wandering_scribe.choices.0.outcomeText",
        apply: (s) =>
          s.gold >= 30
            ? {
                ...s,
                gold: s.gold - 30,
                playerMaxHp: s.playerMaxHp + 20,
                playerCurrentHp: s.playerCurrentHp + 20,
                currentRoom: s.currentRoom + 1,
              }
            : { ...s, currentRoom: s.currentRoom + 1 },
      },
      {
        label: "events.wandering_scribe.choices.1.label",
        description: "events.wandering_scribe.choices.1.description",
        outcomeText: "events.wandering_scribe.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.min(s.playerMaxHp, s.playerCurrentHp + 10),
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "ancient_sarcophagus",
    title: "events.ancient_sarcophagus.title",
    flavorText: "events.ancient_sarcophagus.flavorText",
    description: "events.ancient_sarcophagus.description",
    choices: [
      {
        label: "events.ancient_sarcophagus.choices.0.label",
        description: "events.ancient_sarcophagus.choices.0.description",
        outcomeText: "events.ancient_sarcophagus.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 20,
          playerCurrentHp: s.playerCurrentHp + 20,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.ancient_sarcophagus.choices.1.label",
        description: "events.ancient_sarcophagus.choices.1.description",
        outcomeText: "events.ancient_sarcophagus.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 30,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 15),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.ancient_sarcophagus.choices.2.label",
        description: "events.ancient_sarcophagus.choices.2.description",
        outcomeText: "events.ancient_sarcophagus.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  {
    id: "whispering_idol",
    title: "events.whispering_idol.title",
    flavorText: "events.whispering_idol.flavorText",
    description: "events.whispering_idol.description",
    choices: [
      {
        label: "events.whispering_idol.choices.0.label",
        description: "events.whispering_idol.choices.0.description",
        outcomeText: "events.whispering_idol.choices.0.outcomeText",
        apply: (s) => ({
          ...addDeckCard(s, "hexed_parchment"),
          gold: s.gold + 90,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 90),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.whispering_idol.choices.1.label",
        description: "events.whispering_idol.choices.1.description",
        outcomeText: "events.whispering_idol.choices.1.outcomeText",
        apply: (s) => {
          const withFirstRegret = addDeckCard(s, "haunting_regret");
          const withSecondRegret = addDeckCard(
            withFirstRegret,
            "haunting_regret"
          );
          return {
            ...withSecondRegret,
            gold: s.gold + 140,
            maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 140),
            currentRoom: s.currentRoom + 1,
          };
        },
      },
      {
        label: "events.whispering_idol.choices.2.label",
        description: "events.whispering_idol.choices.2.description",
        outcomeText: "events.whispering_idol.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  {
    id: "ruthless_scrivener",
    title: "events.ruthless_scrivener.title",
    flavorText: "events.ruthless_scrivener.flavorText",
    description: "events.ruthless_scrivener.description",
    choices: [
      {
        label: "events.ruthless_scrivener.choices.0.label",
        description: "events.ruthless_scrivener.choices.0.description",
        outcomeText: "events.ruthless_scrivener.choices.0.outcomeText",
        requiresPurge: true,
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 10),
        }),
      },
      {
        label: "events.ruthless_scrivener.choices.1.label",
        description: "events.ruthless_scrivener.choices.1.description",
        outcomeText: "events.ruthless_scrivener.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  // ── Conditional neutral (floor 3+) ─────────────────────────────────────
  {
    id: "blank_page",
    title: "events.blank_page.title",
    flavorText: "events.blank_page.flavorText",
    description: "events.blank_page.description",
    condition: (s) => s.floor >= 3,
    choices: [
      {
        label: "events.blank_page.choices.0.label",
        description: "events.blank_page.choices.0.description",
        outcomeText: "events.blank_page.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 20,
          playerCurrentHp: s.playerCurrentHp + 20,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.blank_page.choices.1.label",
        description: "events.blank_page.choices.1.description",
        outcomeText: "events.blank_page.choices.1.outcomeText",
        requiresPurge: true,
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 10),
        }),
      },
      {
        label: "events.blank_page.choices.2.label",
        description: "events.blank_page.choices.2.description",
        outcomeText: "events.blank_page.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  // ── Ally recruitment events ─────────────────────────────────────────────
  {
    id: "loyal_scribe",
    title: "events.loyal_scribe.title",
    flavorText: "events.loyal_scribe.flavorText",
    description: "events.loyal_scribe.description",
    condition: (s) =>
      !s.allyIds.includes("scribe_apprentice") &&
      s.allyIds.length < (s.metaBonuses?.allySlots ?? 0),
    choices: [
      {
        label: "events.loyal_scribe.choices.0.label",
        description: "events.loyal_scribe.choices.0.description",
        outcomeText: "events.loyal_scribe.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          allyIds: [...s.allyIds, "scribe_apprentice"],
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.loyal_scribe.choices.1.label",
        description: "events.loyal_scribe.choices.1.description",
        outcomeText: "events.loyal_scribe.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  {
    id: "wandering_knight",
    title: "events.wandering_knight.title",
    flavorText: "events.wandering_knight.flavorText",
    description: "events.wandering_knight.description",
    condition: (s) =>
      !s.allyIds.includes("ward_knight") &&
      s.allyIds.length < (s.metaBonuses?.allySlots ?? 0),
    choices: [
      {
        label: "events.wandering_knight.choices.0.label",
        description: "events.wandering_knight.choices.0.description",
        outcomeText: "events.wandering_knight.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          allyIds: [...s.allyIds, "ward_knight"],
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.wandering_knight.choices.1.label",
        description: "events.wandering_knight.choices.1.description",
        outcomeText: "events.wandering_knight.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  {
    id: "ink_familiar_encounter",
    title: "events.ink_familiar_encounter.title",
    flavorText: "events.ink_familiar_encounter.flavorText",
    description: "events.ink_familiar_encounter.description",
    condition: (s) =>
      !s.allyIds.includes("ink_familiar") &&
      s.allyIds.length < (s.metaBonuses?.allySlots ?? 0),
    choices: [
      {
        label: "events.ink_familiar_encounter.choices.0.label",
        description: "events.ink_familiar_encounter.choices.0.description",
        outcomeText: "events.ink_familiar_encounter.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          allyIds: [...s.allyIds, "ink_familiar"],
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.ink_familiar_encounter.choices.1.label",
        description: "events.ink_familiar_encounter.choices.1.description",
        outcomeText: "events.ink_familiar_encounter.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  // ── Biome-specific events ───────────────────────────────────────────────
  {
    id: "mirror_of_bronze",
    title: "events.mirror_of_bronze.title",
    flavorText: "events.mirror_of_bronze.flavorText",
    description: "events.mirror_of_bronze.description",
    biome: "GREEK",
    choices: [
      {
        label: "events.mirror_of_bronze.choices.0.label",
        description: "events.mirror_of_bronze.choices.0.description",
        outcomeText: "events.mirror_of_bronze.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 20,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 15),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.mirror_of_bronze.choices.1.label",
        description: "events.mirror_of_bronze.choices.1.description",
        outcomeText: "events.mirror_of_bronze.choices.1.outcomeText",
        apply: (s) => ({
          ...addDeckCard(s, "haunting_regret"),
          gold: s.gold + 90,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 90),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.mirror_of_bronze.choices.2.label",
        description: "events.mirror_of_bronze.choices.2.description",
        outcomeText: "events.mirror_of_bronze.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  {
    id: "turning_house",
    title: "events.turning_house.title",
    flavorText: "events.turning_house.flavorText",
    description: "events.turning_house.description",
    biome: "RUSSIAN",
    choices: [
      {
        label: "events.turning_house.choices.0.label",
        description: "events.turning_house.choices.0.description",
        outcomeText: "events.turning_house.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 35,
          playerCurrentHp: s.playerCurrentHp + 35,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.turning_house.choices.1.label",
        description: "events.turning_house.choices.1.description",
        outcomeText: "events.turning_house.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 15),
          gold: s.gold + 75,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 75),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.turning_house.choices.2.label",
        description: "events.turning_house.choices.2.description",
        outcomeText: "events.turning_house.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.min(s.playerMaxHp, s.playerCurrentHp + 15),
          gold: s.gold + 15,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 15),
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "skald_fire",
    title: "events.skald_fire.title",
    flavorText: "events.skald_fire.flavorText",
    description: "events.skald_fire.description",
    biome: "VIKING",
    choices: [
      {
        label: "events.skald_fire.choices.0.label",
        description: "events.skald_fire.choices.0.description",
        outcomeText: "events.skald_fire.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 40,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 20),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.skald_fire.choices.1.label",
        description: "events.skald_fire.choices.1.description",
        outcomeText: "events.skald_fire.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          gold: s.gold + 50,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 50),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.skald_fire.choices.2.label",
        description: "events.skald_fire.choices.2.description",
        outcomeText: "events.skald_fire.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  // ── GREEK (2 more) ──────────────────────────────────────────────────────
  {
    id: "oracle_of_delphi",
    title: "events.oracle_of_delphi.title",
    flavorText: "events.oracle_of_delphi.flavorText",
    description: "events.oracle_of_delphi.description",
    biome: "GREEK",
    choices: [
      {
        label: "events.oracle_of_delphi.choices.0.label",
        description: "events.oracle_of_delphi.choices.0.description",
        outcomeText: "events.oracle_of_delphi.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 30,
          playerCurrentHp: s.playerCurrentHp + 30,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.oracle_of_delphi.choices.1.label",
        description: "events.oracle_of_delphi.choices.1.description",
        outcomeText: "events.oracle_of_delphi.choices.1.outcomeText",
        apply: (s) =>
          s.gold >= 30
            ? {
                ...s,
                gold: s.gold - 30,
                playerMaxHp: s.playerMaxHp + 45,
                playerCurrentHp: s.playerCurrentHp + 45,
                currentRoom: s.currentRoom + 1,
              }
            : {
                ...s,
                playerMaxHp: s.playerMaxHp + 30,
                playerCurrentHp: s.playerCurrentHp + 30,
                currentRoom: s.currentRoom + 1,
              },
      },
    ],
  },
  {
    id: "thread_of_ariadne",
    title: "events.thread_of_ariadne.title",
    flavorText: "events.thread_of_ariadne.flavorText",
    description: "events.thread_of_ariadne.description",
    biome: "GREEK",
    choices: [
      {
        label: "events.thread_of_ariadne.choices.0.label",
        description: "events.thread_of_ariadne.choices.0.description",
        outcomeText: "events.thread_of_ariadne.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 20,
          playerCurrentHp: s.playerCurrentHp + 20,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.thread_of_ariadne.choices.1.label",
        description: "events.thread_of_ariadne.choices.1.description",
        outcomeText: "events.thread_of_ariadne.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 40,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 15),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.thread_of_ariadne.choices.2.label",
        description: "events.thread_of_ariadne.choices.2.description",
        outcomeText: "events.thread_of_ariadne.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  // ── RUSSIAN (2 more) ────────────────────────────────────────────────────
  {
    id: "firebird_feather",
    title: "events.firebird_feather.title",
    flavorText: "events.firebird_feather.flavorText",
    description: "events.firebird_feather.description",
    biome: "RUSSIAN",
    choices: [
      {
        label: "events.firebird_feather.choices.0.label",
        description: "events.firebird_feather.choices.0.description",
        outcomeText: "events.firebird_feather.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.min(s.playerMaxHp, s.playerCurrentHp + 25),
          gold: s.gold + 25,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 25),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.firebird_feather.choices.1.label",
        description: "events.firebird_feather.choices.1.description",
        outcomeText: "events.firebird_feather.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 35,
          playerCurrentHp: s.playerCurrentHp + 35,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.firebird_feather.choices.2.label",
        description: "events.firebird_feather.choices.2.description",
        outcomeText: "events.firebird_feather.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  {
    id: "kostchei_needle",
    title: "events.kostchei_needle.title",
    flavorText: "events.kostchei_needle.flavorText",
    description: "events.kostchei_needle.description",
    biome: "RUSSIAN",
    choices: [
      {
        label: "events.kostchei_needle.choices.0.label",
        description: "events.kostchei_needle.choices.0.description",
        outcomeText: "events.kostchei_needle.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 50,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 25),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.kostchei_needle.choices.1.label",
        description: "events.kostchei_needle.choices.1.description",
        outcomeText: "events.kostchei_needle.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 25,
          playerCurrentHp: s.playerCurrentHp + 25,
          gold: s.gold + 25,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 25),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.kostchei_needle.choices.2.label",
        description: "events.kostchei_needle.choices.2.description",
        outcomeText: "events.kostchei_needle.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  // ── VIKING (2 more) ─────────────────────────────────────────────────────
  {
    id: "huginn_bargain",
    title: "events.huginn_bargain.title",
    flavorText: "events.huginn_bargain.flavorText",
    description: "events.huginn_bargain.description",
    biome: "VIKING",
    choices: [
      {
        label: "events.huginn_bargain.choices.0.label",
        description: "events.huginn_bargain.choices.0.description",
        outcomeText: "events.huginn_bargain.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 45,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 20),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.huginn_bargain.choices.1.label",
        description: "events.huginn_bargain.choices.1.description",
        outcomeText: "events.huginn_bargain.choices.1.outcomeText",
        apply: (s) =>
          s.gold >= 30
            ? {
                ...s,
                gold: s.gold - 30,
                playerMaxHp: s.playerMaxHp + 30,
                playerCurrentHp: s.playerCurrentHp + 30,
                currentRoom: s.currentRoom + 1,
              }
            : { ...s, currentRoom: s.currentRoom + 1 },
      },
      {
        label: "events.huginn_bargain.choices.2.label",
        description: "events.huginn_bargain.choices.2.description",
        outcomeText: "events.huginn_bargain.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  {
    id: "valkyrie_verdict",
    title: "events.valkyrie_verdict.title",
    flavorText: "events.valkyrie_verdict.flavorText",
    description: "events.valkyrie_verdict.description",
    biome: "VIKING",
    choices: [
      {
        label: "events.valkyrie_verdict.choices.0.label",
        description: "events.valkyrie_verdict.choices.0.description",
        outcomeText: "events.valkyrie_verdict.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 25,
          playerCurrentHp: s.playerCurrentHp + 25,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.valkyrie_verdict.choices.1.label",
        description: "events.valkyrie_verdict.choices.1.description",
        outcomeText: "events.valkyrie_verdict.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.min(s.playerMaxHp, s.playerCurrentHp + 25),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.valkyrie_verdict.choices.2.label",
        description: "events.valkyrie_verdict.choices.2.description",
        outcomeText: "events.valkyrie_verdict.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  // ── EGYPTIAN (3 new) ────────────────────────────────────────────────────
  {
    id: "anubis_scales",
    title: "events.anubis_scales.title",
    flavorText: "events.anubis_scales.flavorText",
    description: "events.anubis_scales.description",
    biome: "EGYPTIAN",
    choices: [
      {
        label: "events.anubis_scales.choices.0.label",
        description: "events.anubis_scales.choices.0.description",
        outcomeText: "events.anubis_scales.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 25,
          playerCurrentHp: s.playerCurrentHp + 25,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.anubis_scales.choices.1.label",
        description: "events.anubis_scales.choices.1.description",
        outcomeText: "events.anubis_scales.choices.1.outcomeText",
        requiresPurge: true,
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 45,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 10),
        }),
      },
      {
        label: "events.anubis_scales.choices.2.label",
        description: "events.anubis_scales.choices.2.description",
        outcomeText: "events.anubis_scales.choices.2.outcomeText",
        apply: (s) => {
          const w1 = addDeckCard(s, "haunting_regret");
          const w2 = addDeckCard(w1, "haunting_regret");
          return { ...w2, currentRoom: w2.currentRoom + 1 };
        },
      },
    ],
  },
  {
    id: "thoth_archives",
    title: "events.thoth_archives.title",
    flavorText: "events.thoth_archives.flavorText",
    description: "events.thoth_archives.description",
    biome: "EGYPTIAN",
    choices: [
      {
        label: "events.thoth_archives.choices.0.label",
        description: "events.thoth_archives.choices.0.description",
        outcomeText: "events.thoth_archives.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 25,
          playerCurrentHp: s.playerCurrentHp + 25,
          gold: s.gold + 20,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 20),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.thoth_archives.choices.1.label",
        description: "events.thoth_archives.choices.1.description",
        outcomeText: "events.thoth_archives.choices.1.outcomeText",
        apply: (s) => ({
          ...addDeckCard(s, "haunting_regret"),
          gold: s.gold + 60,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 60),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.thoth_archives.choices.2.label",
        description: "events.thoth_archives.choices.2.description",
        outcomeText: "events.thoth_archives.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 20,
          playerCurrentHp: s.playerCurrentHp + 20,
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "sphinx_riddle",
    title: "events.sphinx_riddle.title",
    flavorText: "events.sphinx_riddle.flavorText",
    description: "events.sphinx_riddle.description",
    biome: "EGYPTIAN",
    choices: [
      {
        label: "events.sphinx_riddle.choices.0.label",
        description: "events.sphinx_riddle.choices.0.description",
        outcomeText: "events.sphinx_riddle.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          gold: s.gold + 35,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 35),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.sphinx_riddle.choices.1.label",
        description: "events.sphinx_riddle.choices.1.description",
        outcomeText: "events.sphinx_riddle.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 25,
          playerCurrentHp: s.playerCurrentHp + 25,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.sphinx_riddle.choices.2.label",
        description: "events.sphinx_riddle.choices.2.description",
        outcomeText: "events.sphinx_riddle.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  // ── LOVECRAFTIAN (3 new) ─────────────────────────────────────────────────
  {
    id: "forbidden_lexicon",
    title: "events.forbidden_lexicon.title",
    flavorText: "events.forbidden_lexicon.flavorText",
    description: "events.forbidden_lexicon.description",
    biome: "LOVECRAFTIAN",
    choices: [
      {
        label: "events.forbidden_lexicon.choices.0.label",
        description: "events.forbidden_lexicon.choices.0.description",
        outcomeText: "events.forbidden_lexicon.choices.0.outcomeText",
        apply: (s) => ({
          ...addDeckCard(s, "haunting_regret"),
          gold: s.gold + 50,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 50),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.forbidden_lexicon.choices.1.label",
        description: "events.forbidden_lexicon.choices.1.description",
        outcomeText: "events.forbidden_lexicon.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 25,
          playerCurrentHp: s.playerCurrentHp + 25,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.forbidden_lexicon.choices.2.label",
        description: "events.forbidden_lexicon.choices.2.description",
        outcomeText: "events.forbidden_lexicon.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  {
    id: "deep_echo",
    title: "events.deep_echo.title",
    flavorText: "events.deep_echo.flavorText",
    description: "events.deep_echo.description",
    biome: "LOVECRAFTIAN",
    choices: [
      {
        label: "events.deep_echo.choices.0.label",
        description: "events.deep_echo.choices.0.description",
        outcomeText: "events.deep_echo.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 30,
          playerCurrentHp: s.playerCurrentHp + 30,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.deep_echo.choices.1.label",
        description: "events.deep_echo.choices.1.description",
        outcomeText: "events.deep_echo.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.min(s.playerMaxHp, s.playerCurrentHp + 20),
          gold: s.gold + 20,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 20),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.deep_echo.choices.2.label",
        description: "events.deep_echo.choices.2.description",
        outcomeText: "events.deep_echo.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  {
    id: "dreaming_gate",
    title: "events.dreaming_gate.title",
    flavorText: "events.dreaming_gate.flavorText",
    description: "events.dreaming_gate.description",
    biome: "LOVECRAFTIAN",
    choices: [
      {
        label: "events.dreaming_gate.choices.0.label",
        description: "events.dreaming_gate.choices.0.description",
        outcomeText: "events.dreaming_gate.choices.0.outcomeText",
        apply: (s) => {
          const w1 = addDeckCard(s, "hexed_parchment");
          const w2 = addDeckCard(w1, "hexed_parchment");
          return {
            ...w2,
            playerMaxHp: w2.playerMaxHp + 50,
            playerCurrentHp: w2.playerCurrentHp + 50,
            currentRoom: w2.currentRoom + 1,
          };
        },
      },
      {
        label: "events.dreaming_gate.choices.1.label",
        description: "events.dreaming_gate.choices.1.description",
        outcomeText: "events.dreaming_gate.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 25,
          playerCurrentHp: s.playerCurrentHp + 25,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.dreaming_gate.choices.2.label",
        description: "events.dreaming_gate.choices.2.description",
        outcomeText: "events.dreaming_gate.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  // ── AZTEC (3 new) ───────────────────────────────────────────────────────
  {
    id: "quetzalcoatl_blessing",
    title: "events.quetzalcoatl_blessing.title",
    flavorText: "events.quetzalcoatl_blessing.flavorText",
    description: "events.quetzalcoatl_blessing.description",
    biome: "AZTEC",
    choices: [
      {
        label: "events.quetzalcoatl_blessing.choices.0.label",
        description: "events.quetzalcoatl_blessing.choices.0.description",
        outcomeText: "events.quetzalcoatl_blessing.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 30,
          playerCurrentHp: s.playerCurrentHp + 30,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.quetzalcoatl_blessing.choices.1.label",
        description: "events.quetzalcoatl_blessing.choices.1.description",
        outcomeText: "events.quetzalcoatl_blessing.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 45,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 15),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.quetzalcoatl_blessing.choices.2.label",
        description: "events.quetzalcoatl_blessing.choices.2.description",
        outcomeText: "events.quetzalcoatl_blessing.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.min(s.playerMaxHp, s.playerCurrentHp + 10),
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "obsidian_altar",
    title: "events.obsidian_altar.title",
    flavorText: "events.obsidian_altar.flavorText",
    description: "events.obsidian_altar.description",
    biome: "AZTEC",
    choices: [
      {
        label: "events.obsidian_altar.choices.0.label",
        description: "events.obsidian_altar.choices.0.description",
        outcomeText: "events.obsidian_altar.choices.0.outcomeText",
        requiresPurge: true,
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 20,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 10),
          gold: s.gold + 40,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 40),
        }),
      },
      {
        label: "events.obsidian_altar.choices.1.label",
        description: "events.obsidian_altar.choices.1.description",
        outcomeText: "events.obsidian_altar.choices.1.outcomeText",
        apply: (s) =>
          s.gold >= 30
            ? {
                ...s,
                gold: s.gold - 30,
                playerMaxHp: s.playerMaxHp + 25,
                playerCurrentHp: s.playerCurrentHp + 25,
                currentRoom: s.currentRoom + 1,
              }
            : { ...s, currentRoom: s.currentRoom + 1 },
      },
      {
        label: "events.obsidian_altar.choices.2.label",
        description: "events.obsidian_altar.choices.2.description",
        outcomeText: "events.obsidian_altar.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 15),
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "xolotl_crossing",
    title: "events.xolotl_crossing.title",
    flavorText: "events.xolotl_crossing.flavorText",
    description: "events.xolotl_crossing.description",
    biome: "AZTEC",
    choices: [
      {
        label: "events.xolotl_crossing.choices.0.label",
        description: "events.xolotl_crossing.choices.0.description",
        outcomeText: "events.xolotl_crossing.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.min(s.playerMaxHp, s.playerCurrentHp + 25),
          gold: s.gold + 20,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 20),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.xolotl_crossing.choices.1.label",
        description: "events.xolotl_crossing.choices.1.description",
        outcomeText: "events.xolotl_crossing.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 35,
          playerCurrentHp: s.playerCurrentHp + 35,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.xolotl_crossing.choices.2.label",
        description: "events.xolotl_crossing.choices.2.description",
        outcomeText: "events.xolotl_crossing.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  // ── CELTIC (3 new) ──────────────────────────────────────────────────────
  {
    id: "druid_memory",
    title: "events.druid_memory.title",
    flavorText: "events.druid_memory.flavorText",
    description: "events.druid_memory.description",
    biome: "CELTIC",
    choices: [
      {
        label: "events.druid_memory.choices.0.label",
        description: "events.druid_memory.choices.0.description",
        outcomeText: "events.druid_memory.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 25,
          playerCurrentHp: s.playerCurrentHp + 25,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.druid_memory.choices.1.label",
        description: "events.druid_memory.choices.1.description",
        outcomeText: "events.druid_memory.choices.1.outcomeText",
        apply: (s) =>
          s.gold >= 20
            ? {
                ...s,
                gold: s.gold - 20,
                playerMaxHp: s.playerMaxHp + 40,
                playerCurrentHp: s.playerCurrentHp + 40,
                currentRoom: s.currentRoom + 1,
              }
            : {
                ...s,
                playerMaxHp: s.playerMaxHp + 25,
                playerCurrentHp: s.playerCurrentHp + 25,
                currentRoom: s.currentRoom + 1,
              },
      },
      {
        label: "events.druid_memory.choices.2.label",
        description: "events.druid_memory.choices.2.description",
        outcomeText: "events.druid_memory.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  {
    id: "lady_of_the_lake",
    title: "events.lady_of_the_lake.title",
    flavorText: "events.lady_of_the_lake.flavorText",
    description: "events.lady_of_the_lake.description",
    biome: "CELTIC",
    choices: [
      {
        label: "events.lady_of_the_lake.choices.0.label",
        description: "events.lady_of_the_lake.choices.0.description",
        outcomeText: "events.lady_of_the_lake.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 30,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 15),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.lady_of_the_lake.choices.1.label",
        description: "events.lady_of_the_lake.choices.1.description",
        outcomeText: "events.lady_of_the_lake.choices.1.outcomeText",
        apply: (s) =>
          s.gold >= 30
            ? {
                ...s,
                gold: s.gold - 30,
                playerMaxHp: s.playerMaxHp + 25,
                playerCurrentHp: s.playerCurrentHp + 25,
                currentRoom: s.currentRoom + 1,
              }
            : { ...s, currentRoom: s.currentRoom + 1 },
      },
      {
        label: "events.lady_of_the_lake.choices.2.label",
        description: "events.lady_of_the_lake.choices.2.description",
        outcomeText: "events.lady_of_the_lake.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  {
    id: "morrigan_crow",
    title: "events.morrigan_crow.title",
    flavorText: "events.morrigan_crow.flavorText",
    description: "events.morrigan_crow.description",
    biome: "CELTIC",
    choices: [
      {
        label: "events.morrigan_crow.choices.0.label",
        description: "events.morrigan_crow.choices.0.description",
        outcomeText: "events.morrigan_crow.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 50,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 20),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.morrigan_crow.choices.1.label",
        description: "events.morrigan_crow.choices.1.description",
        outcomeText: "events.morrigan_crow.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          gold: s.gold + 40,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 40),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.morrigan_crow.choices.2.label",
        description: "events.morrigan_crow.choices.2.description",
        outcomeText: "events.morrigan_crow.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  // ── AFRICAN (3 new) ─────────────────────────────────────────────────────
  {
    id: "anansi_story",
    title: "events.anansi_story.title",
    flavorText: "events.anansi_story.flavorText",
    description: "events.anansi_story.description",
    biome: "AFRICAN",
    choices: [
      {
        label: "events.anansi_story.choices.0.label",
        description: "events.anansi_story.choices.0.description",
        outcomeText: "events.anansi_story.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 30,
          playerCurrentHp: s.playerCurrentHp + 30,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.anansi_story.choices.1.label",
        description: "events.anansi_story.choices.1.description",
        outcomeText: "events.anansi_story.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.min(s.playerMaxHp, s.playerCurrentHp + 15),
          gold: s.gold + 15,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 15),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.anansi_story.choices.2.label",
        description: "events.anansi_story.choices.2.description",
        outcomeText: "events.anansi_story.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },
  {
    id: "griot_song",
    title: "events.griot_song.title",
    flavorText: "events.griot_song.flavorText",
    description: "events.griot_song.description",
    biome: "AFRICAN",
    choices: [
      {
        label: "events.griot_song.choices.0.label",
        description: "events.griot_song.choices.0.description",
        outcomeText: "events.griot_song.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.min(s.playerMaxHp, s.playerCurrentHp + 30),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.griot_song.choices.1.label",
        description: "events.griot_song.choices.1.description",
        outcomeText: "events.griot_song.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.min(s.playerMaxHp, s.playerCurrentHp + 25),
          gold: s.gold + 15,
          maxGoldReached: Math.max(s.maxGoldReached ?? 0, s.gold + 15),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.griot_song.choices.2.label",
        description: "events.griot_song.choices.2.description",
        outcomeText: "events.griot_song.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          playerCurrentHp: Math.min(s.playerMaxHp, s.playerCurrentHp + 10),
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "nyame_trial",
    title: "events.nyame_trial.title",
    flavorText: "events.nyame_trial.flavorText",
    description: "events.nyame_trial.description",
    biome: "AFRICAN",
    choices: [
      {
        label: "events.nyame_trial.choices.0.label",
        description: "events.nyame_trial.choices.0.description",
        outcomeText: "events.nyame_trial.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          playerMaxHp: s.playerMaxHp + 40,
          playerCurrentHp: Math.max(1, s.playerCurrentHp - 20),
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.nyame_trial.choices.1.label",
        description: "events.nyame_trial.choices.1.description",
        outcomeText: "events.nyame_trial.choices.1.outcomeText",
        apply: (s) =>
          s.gold >= 40
            ? {
                ...s,
                gold: s.gold - 40,
                playerMaxHp: s.playerMaxHp + 30,
                playerCurrentHp: s.playerCurrentHp + 30,
                currentRoom: s.currentRoom + 1,
              }
            : { ...s, currentRoom: s.currentRoom + 1 },
      },
      {
        label: "events.nyame_trial.choices.2.label",
        description: "events.nyame_trial.choices.2.description",
        outcomeText: "events.nyame_trial.choices.2.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
    ],
  },

  // ── Le Scribe Effacé — PNJ récurrent, 10 rencontres en chaîne (Phase 5) ────
  // Chaque rencontre requiert la précédente via seenEventIds (ordre narratif garanti).
  // scribeAttitude : +1 compassion / 0 neutre / -1 hostilité — lu par le boss final.
  {
    id: "scribe_1_first_meeting",
    title: "events.scribe_1_first_meeting.title",
    flavorText: "events.scribe_1_first_meeting.flavorText",
    description: "events.scribe_1_first_meeting.description",
    biome: "LIBRARY",
    once: true,
    condition: (s) => s.floor <= 2,
    choices: [
      {
        label: "events.scribe_1_first_meeting.choices.0.label",
        description: "events.scribe_1_first_meeting.choices.0.description",
        outcomeText: "events.scribe_1_first_meeting.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude + 0,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.scribe_1_first_meeting.choices.1.label",
        description: "events.scribe_1_first_meeting.choices.1.description",
        outcomeText: "events.scribe_1_first_meeting.choices.1.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude + 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.scribe_1_first_meeting.choices.2.label",
        description: "events.scribe_1_first_meeting.choices.2.description",
        outcomeText: "events.scribe_1_first_meeting.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude - 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "scribe_2_lost_words",
    title: "events.scribe_2_lost_words.title",
    flavorText: "events.scribe_2_lost_words.flavorText",
    description: "events.scribe_2_lost_words.description",
    biome: "LIBRARY",
    once: true,
    condition: (s) =>
      s.seenEventIds.includes("scribe_1_first_meeting") && s.floor <= 2,
    choices: [
      {
        label: "events.scribe_2_lost_words.choices.0.label",
        description: "events.scribe_2_lost_words.choices.0.description",
        outcomeText: "events.scribe_2_lost_words.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude + 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.scribe_2_lost_words.choices.1.label",
        description: "events.scribe_2_lost_words.choices.1.description",
        outcomeText: "events.scribe_2_lost_words.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
      {
        label: "events.scribe_2_lost_words.choices.2.label",
        description: "events.scribe_2_lost_words.choices.2.description",
        outcomeText: "events.scribe_2_lost_words.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude - 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "scribe_3_familiar_face",
    title: "events.scribe_3_familiar_face.title",
    flavorText: "events.scribe_3_familiar_face.flavorText",
    description: "events.scribe_3_familiar_face.description",
    once: true,
    condition: (s) =>
      s.seenEventIds.includes("scribe_2_lost_words") && s.floor >= 2,
    choices: [
      {
        label: "events.scribe_3_familiar_face.choices.0.label",
        description: "events.scribe_3_familiar_face.choices.0.description",
        outcomeText: "events.scribe_3_familiar_face.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude + 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.scribe_3_familiar_face.choices.1.label",
        description: "events.scribe_3_familiar_face.choices.1.description",
        outcomeText: "events.scribe_3_familiar_face.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
      {
        label: "events.scribe_3_familiar_face.choices.2.label",
        description: "events.scribe_3_familiar_face.choices.2.description",
        outcomeText: "events.scribe_3_familiar_face.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude - 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "scribe_4_torn_pages",
    title: "events.scribe_4_torn_pages.title",
    flavorText: "events.scribe_4_torn_pages.flavorText",
    description: "events.scribe_4_torn_pages.description",
    once: true,
    condition: (s) =>
      s.seenEventIds.includes("scribe_3_familiar_face") && s.floor >= 2,
    choices: [
      {
        label: "events.scribe_4_torn_pages.choices.0.label",
        description: "events.scribe_4_torn_pages.choices.0.description",
        outcomeText: "events.scribe_4_torn_pages.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude + 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.scribe_4_torn_pages.choices.1.label",
        description: "events.scribe_4_torn_pages.choices.1.description",
        outcomeText: "events.scribe_4_torn_pages.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
      {
        label: "events.scribe_4_torn_pages.choices.2.label",
        description: "events.scribe_4_torn_pages.choices.2.description",
        outcomeText: "events.scribe_4_torn_pages.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude - 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "scribe_5_the_name",
    title: "events.scribe_5_the_name.title",
    flavorText: "events.scribe_5_the_name.flavorText",
    description: "events.scribe_5_the_name.description",
    once: true,
    condition: (s) =>
      s.seenEventIds.includes("scribe_4_torn_pages") &&
      s.floor >= 3 &&
      (s.selectedDifficultyLevel ?? 0) >= 1,
    choices: [
      {
        label: "events.scribe_5_the_name.choices.0.label",
        description: "events.scribe_5_the_name.choices.0.description",
        outcomeText: "events.scribe_5_the_name.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude + 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.scribe_5_the_name.choices.1.label",
        description: "events.scribe_5_the_name.choices.1.description",
        outcomeText: "events.scribe_5_the_name.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
      {
        label: "events.scribe_5_the_name.choices.2.label",
        description: "events.scribe_5_the_name.choices.2.description",
        outcomeText: "events.scribe_5_the_name.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude - 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "scribe_6_the_warning",
    title: "events.scribe_6_the_warning.title",
    flavorText: "events.scribe_6_the_warning.flavorText",
    description: "events.scribe_6_the_warning.description",
    once: true,
    condition: (s) =>
      s.seenEventIds.includes("scribe_5_the_name") &&
      s.floor >= 3 &&
      (s.selectedDifficultyLevel ?? 0) >= 2,
    choices: [
      {
        label: "events.scribe_6_the_warning.choices.0.label",
        description: "events.scribe_6_the_warning.choices.0.description",
        outcomeText: "events.scribe_6_the_warning.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude + 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.scribe_6_the_warning.choices.1.label",
        description: "events.scribe_6_the_warning.choices.1.description",
        outcomeText: "events.scribe_6_the_warning.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
      {
        label: "events.scribe_6_the_warning.choices.2.label",
        description: "events.scribe_6_the_warning.choices.2.description",
        outcomeText: "events.scribe_6_the_warning.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude - 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "scribe_7_the_other",
    title: "events.scribe_7_the_other.title",
    flavorText: "events.scribe_7_the_other.flavorText",
    description: "events.scribe_7_the_other.description",
    once: true,
    condition: (s) =>
      s.seenEventIds.includes("scribe_6_the_warning") &&
      s.floor >= 3 &&
      (s.selectedDifficultyLevel ?? 0) >= 2,
    choices: [
      {
        label: "events.scribe_7_the_other.choices.0.label",
        description: "events.scribe_7_the_other.choices.0.description",
        outcomeText: "events.scribe_7_the_other.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude + 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.scribe_7_the_other.choices.1.label",
        description: "events.scribe_7_the_other.choices.1.description",
        outcomeText: "events.scribe_7_the_other.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
      {
        label: "events.scribe_7_the_other.choices.2.label",
        description: "events.scribe_7_the_other.choices.2.description",
        outcomeText: "events.scribe_7_the_other.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude - 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "scribe_8_the_truth",
    title: "events.scribe_8_the_truth.title",
    flavorText: "events.scribe_8_the_truth.flavorText",
    description: "events.scribe_8_the_truth.description",
    once: true,
    condition: (s) =>
      s.seenEventIds.includes("scribe_7_the_other") &&
      s.floor >= 4 &&
      (s.selectedDifficultyLevel ?? 0) >= 3,
    choices: [
      {
        label: "events.scribe_8_the_truth.choices.0.label",
        description: "events.scribe_8_the_truth.choices.0.description",
        outcomeText: "events.scribe_8_the_truth.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude + 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.scribe_8_the_truth.choices.1.label",
        description: "events.scribe_8_the_truth.choices.1.description",
        outcomeText: "events.scribe_8_the_truth.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
      {
        label: "events.scribe_8_the_truth.choices.2.label",
        description: "events.scribe_8_the_truth.choices.2.description",
        outcomeText: "events.scribe_8_the_truth.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude - 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "scribe_9_the_choice",
    title: "events.scribe_9_the_choice.title",
    flavorText: "events.scribe_9_the_choice.flavorText",
    description: "events.scribe_9_the_choice.description",
    once: true,
    condition: (s) =>
      s.seenEventIds.includes("scribe_8_the_truth") &&
      s.floor >= 4 &&
      (s.selectedDifficultyLevel ?? 0) >= 4,
    choices: [
      {
        label: "events.scribe_9_the_choice.choices.0.label",
        description: "events.scribe_9_the_choice.choices.0.description",
        outcomeText: "events.scribe_9_the_choice.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude + 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.scribe_9_the_choice.choices.1.label",
        description: "events.scribe_9_the_choice.choices.1.description",
        outcomeText: "events.scribe_9_the_choice.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
      {
        label: "events.scribe_9_the_choice.choices.2.label",
        description: "events.scribe_9_the_choice.choices.2.description",
        outcomeText: "events.scribe_9_the_choice.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude - 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
  {
    id: "scribe_10_the_reveal",
    title: "events.scribe_10_the_reveal.title",
    flavorText: "events.scribe_10_the_reveal.flavorText",
    description: "events.scribe_10_the_reveal.description",
    once: true,
    condition: (s) =>
      s.seenEventIds.includes("scribe_9_the_choice") &&
      s.floor >= GAME_CONSTANTS.MAX_FLOORS - 1 &&
      (s.selectedDifficultyLevel ?? 0) >= 5,
    choices: [
      {
        label: "events.scribe_10_the_reveal.choices.0.label",
        description: "events.scribe_10_the_reveal.choices.0.description",
        outcomeText: "events.scribe_10_the_reveal.choices.0.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude + 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
      {
        label: "events.scribe_10_the_reveal.choices.1.label",
        description: "events.scribe_10_the_reveal.choices.1.description",
        outcomeText: "events.scribe_10_the_reveal.choices.1.outcomeText",
        apply: (s) => ({ ...s, currentRoom: s.currentRoom + 1 }),
      },
      {
        label: "events.scribe_10_the_reveal.choices.2.label",
        description: "events.scribe_10_the_reveal.choices.2.description",
        outcomeText: "events.scribe_10_the_reveal.choices.2.outcomeText",
        apply: (s) => ({
          ...s,
          scribeAttitude: s.scribeAttitude - 1,
          currentRoom: s.currentRoom + 1,
        }),
      },
    ],
  },
];

export function pickEvent(
  rng: RNG,
  difficultyLevel = 0,
  runState?: RunState
): GameEvent {
  // Guard against legacy run states that predate seenEventIds
  const safeState = runState
    ? { ...runState, seenEventIds: runState.seenEventIds ?? [] }
    : runState;
  const currentBiome = safeState?.currentBiome;
  const eligible = EVENTS.filter(
    (e) =>
      (!e.condition || !safeState || e.condition(safeState)) &&
      (!e.biome || !currentBiome || e.biome === currentBiome) &&
      (!e.once || !safeState || !safeState.seenEventIds.includes(e.id))
  );
  const pool = eligible.length > 0 ? eligible : EVENTS;
  const riskyPool = pool.filter((event) => RISKY_EVENT_IDS.has(event.id));
  const safePool = pool.filter((event) => !RISKY_EVENT_IDS.has(event.id));
  if (difficultyLevel >= 4 && riskyPool.length > 0 && rng.next() < 0.7) {
    return rng.pick(riskyPool);
  }
  return rng.pick(safePool.length > 0 ? safePool : pool);
}

export function applyEventChoice(
  runState: RunState,
  event: GameEvent,
  choiceIndex: number
): RunState {
  const choice = event.choices[choiceIndex];
  if (!choice) return runState;
  const newState = choice.apply(runState);

  // Mark once-per-run events as seen
  const withSeen = event.once
    ? {
        ...newState,
        seenEventIds: [...(newState.seenEventIds ?? []), event.id],
      }
    : newState;

  // For Scribe events: record the individual attitude delta (-1/0/+1) per encounter
  if (event.id.startsWith("scribe_")) {
    const attitudeDelta =
      (newState.scribeAttitude ?? 0) - (runState.scribeAttitude ?? 0);
    return {
      ...withSeen,
      scribeChoices: { ...withSeen.scribeChoices, [event.id]: attitudeDelta },
    };
  }

  return withSeen;
}
