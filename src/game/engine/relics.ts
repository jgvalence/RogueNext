import type { CombatState } from "../schemas/combat-state";
import type { RunState } from "../schemas/run-state";
import { nanoid } from "nanoid";
import { applyDamage } from "./damage";
import { drawCards } from "./deck";
import type { RNG } from "./rng";

export function addRelicToRunState(
  runState: RunState,
  relicId: string
): RunState {
  if (runState.relicIds.includes(relicId)) return runState;

  let next: RunState = {
    ...runState,
    relicIds: [...runState.relicIds, relicId],
  };

  switch (relicId) {
    case "library_guardian_chain":
      next = {
        ...next,
        playerMaxHp: next.playerMaxHp + 12,
        playerCurrentHp: next.playerCurrentHp + 12,
      };
      break;
    case "aztec_codex_market": {
      const gold = next.gold + 300;
      next = {
        ...next,
        gold,
        maxGoldReached: Math.max(next.maxGoldReached ?? 0, gold),
      };
      break;
    }
  }

  return next;
}

export function getRelicExhaustKeepChance(relicIds: string[]): number {
  return relicIds.includes("love_migo_lantern") ? 50 : 0;
}

function getCounter(state: CombatState, key: string): number {
  return Math.max(0, Math.floor(state.relicCounters?.[key] ?? 0));
}

function setCounter(
  state: CombatState,
  key: string,
  value: number
): CombatState {
  return {
    ...state,
    relicCounters: {
      ...(state.relicCounters ?? {}),
      [key]: Math.max(0, Math.floor(value)),
    },
  };
}

function incrementCounter(
  state: CombatState,
  key: string,
  amount = 1
): CombatState {
  return setCounter(state, key, getCounter(state, key) + amount);
}

function setFlag(state: CombatState, key: string, value = true): CombatState {
  return {
    ...state,
    relicFlags: {
      ...(state.relicFlags ?? {}),
      [key]: value,
    },
  };
}

/**
 * Apply relic effects at combat start.
 * Called after initCombat to modify the initial combat state.
 */
export function applyRelicsOnCombatStart(
  state: CombatState,
  relicIds: string[]
): CombatState {
  let current = state;

  for (const relicId of relicIds) {
    switch (relicId) {
      case "ancient_quill":
        // +2 ink max
        current = {
          ...current,
          player: {
            ...current.player,
            inkMax: current.player.inkMax + 2,
          },
        };
        break;

      case "energy_crystal":
        // +1 energy max
        current = {
          ...current,
          player: {
            ...current.player,
            energyMax: current.player.energyMax + 1,
            energyCurrent: current.player.energyCurrent + 1,
          },
        };
        break;

      case "bookmark":
        // +1 draw per turn
        current = {
          ...current,
          player: {
            ...current.player,
            drawCount: current.player.drawCount + 1,
          },
        };
        break;

      case "ink_stamp":
        // Start combat with 3 ink
        current = {
          ...current,
          player: {
            ...current.player,
            inkCurrent: current.player.inkCurrent + 3,
          },
        };
        break;

      case "iron_binding":
        // +1 extra ink value when ink-per-card proc happens
        current = {
          ...current,
          player: {
            ...current.player,
            inkPerCardValue: current.player.inkPerCardValue + 1,
          },
        };
        break;

      case "blighted_compass":
        // +1 draw, but apply Weak at combat start
        current = {
          ...current,
          player: {
            ...current.player,
            drawCount: current.player.drawCount + 1,
            buffs: [
              ...current.player.buffs,
              { type: "WEAK", stacks: 1, duration: 2 },
            ],
          },
        };
        break;

      case "cursed_diacrit":
        // +1 energy, but inject a curse into discard each combat
        current = {
          ...current,
          player: {
            ...current.player,
            energyMax: current.player.energyMax + 1,
            energyCurrent: current.player.energyCurrent + 1,
          },
          discardPile: [
            ...current.discardPile,
            {
              instanceId: nanoid(),
              definitionId: "haunting_regret",
              upgraded: false,
            },
          ],
        };
        break;

      case "briar_codex":
        // Start combat with Thorns
        current = {
          ...current,
          player: {
            ...current.player,
            buffs: [...current.player.buffs, { type: "THORNS", stacks: 2 }],
          },
        };
        break;

      case "warded_ribbon":
        // Start combat with block
        current = {
          ...current,
          player: {
            ...current.player,
            block: current.player.block + 6,
          },
        };
        break;

      case "inkwell_reservoir":
        // +1 max ink and start with +1 ink
        current = {
          ...current,
          player: {
            ...current.player,
            inkMax: current.player.inkMax + 1,
            inkCurrent: Math.min(
              current.player.inkMax + 1,
              current.player.inkCurrent + 1
            ),
          },
        };
        break;

      case "battle_lexicon":
        // Start combat with +1 strength
        current = {
          ...current,
          player: {
            ...current.player,
            strength: current.player.strength + 1,
          },
        };
        break;

      // ── Boss-specific relics ───────────────────────────────────────────
      case "slime_ink_vial":
        current = {
          ...current,
          player: {
            ...current.player,
            block: current.player.block + 6,
          },
        };
        break;

      case "golem_pulp_core":
        current = {
          ...current,
          player: {
            ...current.player,
            drawCount: current.player.drawCount + 1,
          },
        };
        break;

      case "sprite_quill_charm":
        current = {
          ...current,
          player: {
            ...current.player,
            energyCurrent: current.player.energyCurrent + 1,
          },
        };
        break;

      case "wraith_torn_folio":
        current = {
          ...current,
          player: {
            ...current.player,
            strength: current.player.strength + 1,
          },
        };
        break;

      case "serpent_scroll_seal":
        current = {
          ...current,
          player: {
            ...current.player,
            focus: current.player.focus + 1,
            block: current.player.block + 4,
          },
        };
        break;

      case "archon_ink_crown":
        current = {
          ...current,
          player: {
            ...current.player,
            buffs: [
              ...current.player.buffs,
              { type: "THORNS" as const, stacks: 3 },
            ],
          },
        };
        break;

      case "colossus_tome_plate":
        current = {
          ...current,
          player: {
            ...current.player,
            block: current.player.block + 12,
          },
        };
        break;

      case "wyrm_venom_signet":
        current = {
          ...current,
          enemies: current.enemies.map((enemy) =>
            enemy.currentHp <= 0
              ? enemy
              : {
                  ...enemy,
                  buffs: [
                    ...enemy.buffs,
                    { type: "WEAK", stacks: 1, duration: 2 },
                  ],
                }
          ),
        };
        break;

      case "berserker_rune_axehead":
        current = {
          ...current,
          player: {
            ...current.player,
            strength: current.player.strength + 2,
          },
        };
        break;

      case "einherjar_oath_band":
        current = {
          ...current,
          player: {
            ...current.player,
            energyCurrent: current.player.energyCurrent + 1,
            focus: current.player.focus + 1,
          },
        };
        break;

      case "shaman_storm_totem":
        current = {
          ...current,
          player: {
            ...current.player,
            block: current.player.block + 8,
            buffs: [
              ...current.player.buffs,
              { type: "THORNS" as const, stacks: 1 },
            ],
          },
        };
        break;

      case "mummy_linen_knot":
        current = {
          ...current,
          enemies: current.enemies.map((enemy) => {
            if (!enemy.isElite || enemy.currentHp <= 0) return enemy;
            return {
              ...enemy,
              currentHp: Math.max(1, Math.ceil(enemy.currentHp * 0.75)),
            };
          }),
        };
        break;

      case "apep_shadow_scale":
        current = {
          ...current,
          enemies: current.enemies.map((enemy) =>
            enemy.currentHp <= 0
              ? enemy
              : {
                  ...enemy,
                  buffs: [
                    ...enemy.buffs,
                    { type: "VULNERABLE", stacks: 1, duration: 2 },
                  ],
                }
          ),
        };
        break;

      case "wadjet_emerald_eye":
        current = {
          ...current,
          player: {
            ...current.player,
            strength: current.player.strength + 1,
            block: current.player.block + 6,
          },
        };
        break;

      case "idol_sun_fragment":
        current = {
          ...current,
          player: {
            ...current.player,
            strength: current.player.strength + 1,
            inkCurrent: Math.min(
              current.player.inkMax,
              current.player.inkCurrent + 1
            ),
          },
        };
        break;

      case "cultist_flayed_mask":
        current = {
          ...current,
          enemies: current.enemies.map((enemy) =>
            enemy.currentHp <= 0
              ? enemy
              : {
                  ...enemy,
                  buffs: [...enemy.buffs, { type: "POISON", stacks: 2 }],
                }
          ),
        };
        break;

      case "priest_obsidian_censer":
        current = {
          ...current,
          player: {
            ...current.player,
            focus: current.player.focus + 1,
            drawCount: current.player.drawCount + 1,
          },
        };
        break;

      case "kikimora_night_lantern":
        current = {
          ...current,
          player: {
            ...current.player,
            drawCount: current.player.drawCount + 1,
            inkCurrent: Math.min(
              current.player.inkMax,
              current.player.inkCurrent + 1
            ),
          },
        };
        break;

      case "harbinger_storm_bell":
        current = {
          ...current,
          player: {
            ...current.player,
            energyCurrent: current.player.energyCurrent + 1,
            block: current.player.block + 4,
          },
        };
        break;

      case "guardians_seal":
        // +2 max ink, start with 2 ink
        current = {
          ...current,
          player: {
            ...current.player,
            inkMax: current.player.inkMax + 2,
            inkCurrent: Math.min(
              current.player.inkMax + 2,
              current.player.inkCurrent + 2
            ),
          },
        };
        break;

      case "archivists_lens":
        // +2 max ink, start with 2 Focus
        current = {
          ...current,
          player: {
            ...current.player,
            inkMax: current.player.inkMax + 2,
            focus: current.player.focus + 2,
          },
        };
        break;

      case "wolf_fang":
        // Start with 2 Strength
        current = {
          ...current,
          player: {
            ...current.player,
            strength: current.player.strength + 2,
          },
        };
        break;

      case "hels_crown":
        // Start with 2 Strength and 4 Thorns
        current = {
          ...current,
          player: {
            ...current.player,
            strength: current.player.strength + 2,
            buffs: [
              ...current.player.buffs,
              { type: "THORNS" as const, stacks: 4 },
            ],
          },
        };
        break;

      case "stone_pendant":
        // Start with 1 Strength and 1 Focus
        current = {
          ...current,
          player: {
            ...current.player,
            strength: current.player.strength + 1,
            focus: current.player.focus + 1,
          },
        };
        break;

      case "hydra_scale":
        // Start with 1 Strength and 5 Thorns
        current = {
          ...current,
          player: {
            ...current.player,
            strength: current.player.strength + 1,
            buffs: [
              ...current.player.buffs,
              { type: "THORNS" as const, stacks: 5 },
            ],
          },
        };
        break;

      case "solar_disc":
        // +1 max energy, start with 2 ink
        current = {
          ...current,
          player: {
            ...current.player,
            energyMax: current.player.energyMax + 1,
            energyCurrent: current.player.energyCurrent + 1,
            inkCurrent: Math.min(
              current.player.inkMax,
              current.player.inkCurrent + 2
            ),
          },
        };
        break;

      case "eye_of_maat":
        // +1 max energy, start with 1 Focus
        current = {
          ...current,
          player: {
            ...current.player,
            energyMax: current.player.energyMax + 1,
            energyCurrent: current.player.energyCurrent + 1,
            focus: current.player.focus + 1,
          },
        };
        break;

      case "void_shard":
        // Start with 2 Focus
        current = {
          ...current,
          player: {
            ...current.player,
            focus: current.player.focus + 2,
          },
        };
        break;

      case "shub_idol":
        // Start with 2 Strength and 3 ink
        current = {
          ...current,
          player: {
            ...current.player,
            strength: current.player.strength + 2,
            inkCurrent: Math.min(
              current.player.inkMax,
              current.player.inkCurrent + 3
            ),
          },
        };
        break;

      case "obsidian_mirror":
        // Start with 3 Strength
        current = {
          ...current,
          player: {
            ...current.player,
            strength: current.player.strength + 3,
          },
        };
        break;

      case "quetzal_feather":
        // Start with 1 Strength, 1 Focus, and 1 energy
        current = {
          ...current,
          player: {
            ...current.player,
            strength: current.player.strength + 1,
            focus: current.player.focus + 1,
            energyMax: current.player.energyMax + 1,
            energyCurrent: current.player.energyCurrent + 1,
          },
        };
        break;

      case "dagdas_club":
        // Start with 6 Thorns
        current = {
          ...current,
          player: {
            ...current.player,
            buffs: [
              ...current.player.buffs,
              { type: "THORNS" as const, stacks: 6 },
            ],
          },
        };
        break;

      case "cernunnos_horn":
        // Start with 6 Thorns and 1 extra draw
        current = {
          ...current,
          player: {
            ...current.player,
            drawCount: current.player.drawCount + 1,
            buffs: [
              ...current.player.buffs,
              { type: "THORNS" as const, stacks: 6 },
            ],
          },
        };
        break;

      case "yaga_skull":
        // Start with 1 extra draw and 3 Thorns
        current = {
          ...current,
          player: {
            ...current.player,
            drawCount: current.player.drawCount + 1,
            buffs: [
              ...current.player.buffs,
              { type: "THORNS" as const, stacks: 3 },
            ],
          },
        };
        break;

      case "deathless_bone":
        // +1 max energy, start with 10 Block
        current = {
          ...current,
          player: {
            ...current.player,
            energyMax: current.player.energyMax + 1,
            energyCurrent: current.player.energyCurrent + 1,
            block: current.player.block + 10,
          },
        };
        break;

      case "griot_drum":
        // Start with 6 Block and 1 Strength
        current = {
          ...current,
          player: {
            ...current.player,
            block: current.player.block + 6,
            strength: current.player.strength + 1,
          },
        };
        break;

      case "weavers_thread":
        // Start with 1 extra draw and 2 Focus
        current = {
          ...current,
          player: {
            ...current.player,
            drawCount: current.player.drawCount + 1,
            focus: current.player.focus + 2,
          },
        };
        break;

      // Planned relics: status and damage rule overrides
      case "love_deep_one_idol":
        current = setFlag(current, "statusCursePlayable", true);
        current = setFlag(current, "statusCursePlayExhaust", true);
        break;
      case "aztec_quetzal_coil":
        current = {
          ...current,
          relicModifiers: {
            ...(current.relicModifiers ?? {}),
            playerVulnerableDamageMultiplier: 1.25,
          },
        };
        break;
      case "greek_medusa_eye":
        current = {
          ...current,
          relicModifiers: {
            ...(current.relicModifiers ?? {}),
            enemyVulnerableDamageMultiplier: 1.75,
          },
        };
        break;
      case "egypt_scarab_idol":
        current = {
          ...current,
          relicModifiers: {
            ...(current.relicModifiers ?? {}),
            enemyPoisonDamageMultiplier: 1.5,
          },
        };
        break;
      case "viking_frost_torc":
        current = {
          ...current,
          relicModifiers: {
            ...(current.relicModifiers ?? {}),
            playerPoisonDamageMultiplier: 0.6,
          },
        };
        break;
      case "celtic_briar_seed":
        current = {
          ...current,
          relicModifiers: {
            ...(current.relicModifiers ?? {}),
            enemyBleedDamageMultiplier: 1.5,
          },
        };
        break;
      case "russian_wolf_pelt":
        current = {
          ...current,
          relicModifiers: {
            ...(current.relicModifiers ?? {}),
            playerBleedDamageMultiplier: 0.6,
          },
        };
        break;
      case "russian_frost_ledger":
        current = {
          ...current,
          player: {
            ...current.player,
            buffs: current.player.buffs.filter(
              (buff) => buff.type !== "WEAK" && buff.type !== "VULNERABLE"
            ),
          },
        };
        break;
      case "library_prep_satchel":
        current = {
          ...current,
          player: {
            ...current.player,
            drawCount: current.player.drawCount + 2,
          },
        };
        current = setCounter(
          current,
          "library_prep_satchel_cleanup_pending",
          1
        );
        break;
      case "library_archon_stamp":
        current = {
          ...current,
          player: {
            ...current.player,
            focus: current.player.focus + 1,
            block: current.player.block + 5,
          },
        };
        break;
      case "library_archivist_eye":
        current = {
          ...current,
          player: {
            ...current.player,
            drawCount: current.player.drawCount + 1,
            focus: current.player.focus + 2,
          },
        };
        current = setFlag(current, "first_curse_draw_exhaust_pending", true);
        break;
      case "viking_raider_horn":
        current = setFlag(current, "first_attack_combat_bonus_pending", true);
        break;
      case "viking_fenrir_fang":
        current = setFlag(current, "fenrir_fang_active", true);
        break;
      case "viking_hel_signet":
        current = {
          ...current,
          enemies: current.enemies.map((enemy) =>
            enemy.currentHp <= 0
              ? enemy
              : {
                  ...enemy,
                  buffs: [
                    ...enemy.buffs,
                    { type: "VULNERABLE", stacks: 1, duration: 2 },
                  ],
                }
          ),
          player: {
            ...current.player,
            buffs: [
              ...current.player.buffs,
              { type: "THORNS" as const, stacks: 2 },
            ],
          },
        };
        break;
      case "egypt_anubis_scale":
        current = {
          ...current,
          enemies: current.enemies.map((enemy) => {
            if (!enemy.isElite || enemy.currentHp <= 0) return enemy;
            return {
              ...enemy,
              currentHp: Math.max(1, Math.ceil(enemy.currentHp * 0.8)),
            };
          }),
        };
        break;
      case "egypt_ra_brazier":
        current = {
          ...current,
          player: {
            ...current.player,
            energyCurrent: current.player.energyCurrent + 1,
          },
        };
        break;
      case "egypt_osiris_feather":
        current = {
          ...current,
          player: {
            ...current.player,
            maxHp: current.player.maxHp + 15,
            currentHp: Math.min(
              current.player.maxHp + 15,
              current.player.currentHp + 5
            ),
          },
        };
        break;
      case "love_shub_brood_core":
        current = {
          ...current,
          player: {
            ...current.player,
            energyCurrent: current.player.energyCurrent + 1,
            drawCount: current.player.drawCount + 1,
          },
          discardPile: [
            ...current.discardPile,
            {
              instanceId: nanoid(),
              definitionId: "dazed",
              upgraded: false,
            },
          ],
        };
        break;
      case "love_elder_shard":
        current = {
          ...current,
          player: {
            ...current.player,
            focus: current.player.focus + 1,
            buffs: [
              ...current.player.buffs,
              { type: "WEAK", stacks: 1, duration: 2 },
            ],
          },
        };
        break;
      case "aztec_quetzal_crown":
        current = {
          ...current,
          player: {
            ...current.player,
            energyCurrent: current.player.energyCurrent + 1,
            drawCount: current.player.drawCount + 1,
            inkCurrent: Math.min(
              current.player.inkMax,
              current.player.inkCurrent + 1
            ),
            currentHp: Math.max(1, current.player.currentHp - 4),
          },
        };
        break;
      case "african_oracle_shell":
        // Approximation du choix: applique les deux options en version moderee.
        current = {
          ...current,
          player: {
            ...current.player,
            inkCurrent: Math.min(
              current.player.inkMax,
              current.player.inkCurrent + 1
            ),
            block: current.player.block + 6,
          },
        };
        break;
      case "celtic_cernunnos_antler":
        current = {
          ...current,
          player: {
            ...current.player,
            regenPerTurn: current.player.regenPerTurn + 1,
            buffs: [
              ...current.player.buffs,
              { type: "THORNS" as const, stacks: 4 },
            ],
          },
        };
        break;
      case "russian_deathless_locket":
        current = setFlag(current, "deathless_locket_available", true);
        break;
      case "russian_rusalka_teardrop":
        current = setFlag(current, "rusalka_teardrop_active", true);
        break;
      case "russian_koschei_needle":
        if (current.floor >= 4) {
          current = {
            ...current,
            enemies: current.enemies.map((enemy) =>
              enemy.currentHp <= 0
                ? enemy
                : {
                    ...enemy,
                    buffs: [
                      ...enemy.buffs,
                      { type: "VULNERABLE", stacks: 1, duration: 2 },
                    ],
                  }
            ),
          };
        }
        break;
      case "celtic_sidhe_cloak":
        current = setFlag(current, "sidhe_cloak_available", true);
        break;
      case "celtic_oak_geas":
        current = setFlag(current, "oak_geas_available", true);
        break;
      case "aztec_tezca_mirror":
        current = setCounter(current, "tezca_reflect_hits_left", 5);
        break;
      case "african_soundiata_standard":
        current = {
          ...current,
          player: {
            ...current.player,
            strength: current.player.strength + 1,
            focus: current.player.focus + 1,
            drawCount: current.player.drawCount + 1,
          },
        };
        break;
    }
  }

  return current;
}

/**
 * Apply turn-start relic effects.
 */
export function applyRelicsOnTurnStart(
  state: CombatState,
  relicIds: string[],
  rng?: RNG
): CombatState {
  const retainRatios = [
    relicIds.includes("runic_bulwark") ? 0.5 : 0,
    relicIds.includes("surgeon_mi_go_tools") ? 0.75 : 0,
    relicIds.includes("library_colossus_plate") ? 0.4 : 0,
    relicIds.includes("russian_domovoi_hearth") ? 0.3 : 0,
  ];
  const retainedRatio = Math.max(...retainRatios);
  const keepEnergy = relicIds.includes("eternal_hourglass");
  const retainedBlock =
    retainedRatio > 0 ? Math.floor(state.player.block * retainedRatio) : 0;
  const energyCurrent = keepEnergy
    ? state.player.energyCurrent + state.player.energyMax
    : state.player.energyMax;

  let current: CombatState = {
    ...state,
    player: {
      ...state.player,
      block: retainedBlock,
      energyCurrent,
    },
  };

  // Reset common per-turn counters used by several relic triggers.
  current = {
    ...current,
    relicFlags: {
      ...(current.relicFlags ?? {}),
      turn_first_skill_relic_active: false,
      anansi_skill_dup_pending: false,
    },
    relicCounters: {
      ...(current.relicCounters ?? {}),
      turn_attack_count: 0,
      turn_skill_count: 0,
      turn_cards_played: 0,
      turn_kills: 0,
      turn_empty_hand_draws: 0,
      turn_fenrir_triggers: 0,
      turn_valkyrie_draws: 0,
      turn_snow_charm_draws: 0,
      turn_sunbird_triggers: 0,
      turn_shuriken_attack_sets: 0,
      turn_nunchaku_attacks: 0,
      turn_drawn_count: 0,
      turn_rusalka_focus_granted: 0,
    },
  };

  const pendingNextTurnEnergy = getCounter(current, "next_turn_energy_bonus");
  if (pendingNextTurnEnergy > 0) {
    current = {
      ...current,
      player: {
        ...current.player,
        energyCurrent: current.player.energyCurrent + pendingNextTurnEnergy,
      },
    };
    current = setCounter(current, "next_turn_energy_bonus", 0);
  }

  if (retainedBlock > 0 && relicIds.includes("russian_domovoi_hearth")) {
    current = {
      ...current,
      player: {
        ...current.player,
        inkCurrent: Math.min(
          current.player.inkMax,
          current.player.inkCurrent + 1
        ),
      },
    };
  }

  for (const relicId of relicIds) {
    switch (relicId) {
      case "thorn_mantle": {
        const existingThorns = current.player.buffs.find(
          (b) => b.type === "THORNS"
        );
        if (existingThorns) {
          current = {
            ...current,
            player: {
              ...current.player,
              buffs: current.player.buffs.map((b) =>
                b.type === "THORNS" ? { ...b, stacks: b.stacks + 1 } : b
              ),
            },
          };
        } else {
          current = {
            ...current,
            player: {
              ...current.player,
              buffs: [
                ...current.player.buffs,
                { type: "THORNS" as const, stacks: 1 },
              ],
            },
          };
        }
        break;
      }

      case "spectral_inkwell":
        current = {
          ...current,
          player: {
            ...current.player,
            inkCurrent: Math.min(
              current.player.inkMax,
              current.player.inkCurrent + 1
            ),
          },
        };
        break;

      case "fading_grimoire":
        current = {
          ...current,
          player: {
            ...current.player,
            strength: current.player.strength + 1,
          },
        };
        break;

      case "phoenix_ash":
        current = {
          ...current,
          player: {
            ...current.player,
            currentHp: Math.min(
              current.player.maxHp,
              current.player.currentHp + 2
            ),
          },
        };
        break;

      case "guardian_dune_amulet":
        current = {
          ...current,
          player: {
            ...current.player,
            currentHp: Math.min(
              current.player.maxHp,
              current.player.currentHp + 1
            ),
          },
        };
        break;

      case "spawn_void_ichor":
        current = {
          ...current,
          player: {
            ...current.player,
            focus: current.player.focus + 1,
          },
        };
        break;

      case "tendril_star_knot":
        current = {
          ...current,
          player: {
            ...current.player,
            inkCurrent: Math.min(
              current.player.inkMax,
              current.player.inkCurrent + 1
            ),
          },
        };
        break;

      case "beast_bog_heart":
        current = {
          ...current,
          player: {
            ...current.player,
            energyCurrent: current.player.energyCurrent + 1,
          },
        };
        break;

      case "apprentice_oak_scroll":
        current = {
          ...current,
          player: {
            ...current.player,
            currentHp: Math.min(
              current.player.maxHp,
              current.player.currentHp + 3
            ),
          },
        };
        break;

      case "hound_amber_fang":
        current = {
          ...current,
          player: {
            ...current.player,
            block: current.player.block + 6,
          },
        };
        break;

      // Planned relics: start-of-turn / periodic mechanics
      case "viking_serpent_scale":
        if (current.player.block <= 0) {
          current = {
            ...current,
            player: {
              ...current.player,
              block: current.player.block + 8,
            },
          };
        }
        break;
      case "library_prep_satchel":
        if (getCounter(current, "library_prep_satchel_cleanup_pending") > 0) {
          current = {
            ...current,
            player: {
              ...current.player,
              drawCount: Math.max(0, current.player.drawCount - 2),
            },
          };
          current = setCounter(
            current,
            "library_prep_satchel_cleanup_pending",
            0
          );
        }
        break;
      case "love_byakhee_wing":
        if (current.hand.length === 0 && rng) {
          current = drawCards(
            current,
            2,
            rng,
            "SYSTEM",
            "RELIC_LOVE_BYAKHEE_WING"
          );
        }
        break;
      case "love_nyar_mask":
        if (current.turnNumber % 3 === 0) {
          current = {
            ...current,
            player: {
              ...current.player,
              inkCurrent: Math.min(
                current.player.inkMax,
                current.player.inkCurrent + 2
              ),
              strength: current.player.strength + 1,
            },
          };
        }
        break;
      case "russian_midwinter_star":
        if (current.turnNumber % 3 === 0) {
          current = {
            ...current,
            player: {
              ...current.player,
              energyCurrent: current.player.energyCurrent + 1,
            },
          };
          if (rng) {
            current = drawCards(
              current,
              1,
              rng,
              "SYSTEM",
              "RELIC_RUSSIAN_MIDWINTER_STAR"
            );
          }
        }
        break;
      case "global_labyrinth_spiral": {
        const cycle = (((current.turnNumber - 1) % 3) + 3) % 3;
        if (cycle === 0) {
          current = {
            ...current,
            player: {
              ...current.player,
              energyCurrent: current.player.energyCurrent + 1,
            },
          };
        } else if (cycle === 1) {
          if (rng) {
            current = drawCards(
              current,
              1,
              rng,
              "SYSTEM",
              "RELIC_GLOBAL_LABYRINTH_SPIRAL"
            );
          }
        } else {
          current = {
            ...current,
            player: {
              ...current.player,
              strength: current.player.strength + 1,
            },
          };
        }
        break;
      }
      case "library_margin_inkpot":
      case "egypt_tomb_censer":
        // Marker flags consumed in applyRelicsOnCardPlayed.
        current = setFlag(current, "turn_first_skill_relic_active", true);
        break;
    }
  }

  return current;
}

/**
 * Apply relic effects at the end of the player's turn (before discarding hand).
 */
export function applyRelicsOnTurnEnd(
  state: CombatState,
  relicIds: string[]
): CombatState {
  let current = state;

  for (const relicId of relicIds) {
    switch (relicId) {
      case "iron_codex":
        current = {
          ...current,
          player: {
            ...current.player,
            block: current.player.block + current.hand.length,
          },
        };
        break;

      case "resonant_quill":
        current = {
          ...current,
          player: {
            ...current.player,
            inkCurrent: Math.min(
              current.player.inkMax,
              current.player.inkCurrent + Math.min(current.hand.length, 3)
            ),
          },
        };
        break;

      case "ember_seal":
        current = {
          ...current,
          player: {
            ...current.player,
            block: current.player.block + current.player.energyCurrent * 3,
          },
        };
        break;

      case "ink_spindle":
        if (current.hand.length === 0) {
          current = {
            ...current,
            player: {
              ...current.player,
              focus: current.player.focus + 1,
            },
          };
        }
        break;

      case "guard_czar_medal":
        current = {
          ...current,
          player: {
            ...current.player,
            block: current.player.block + 8,
          },
        };
        break;

      case "cossack_iron_spur":
        current = {
          ...current,
          player: {
            ...current.player,
            inkCurrent: Math.min(
              current.player.inkMax,
              current.player.inkCurrent + 1
            ),
          },
        };
        break;

      case "giant_baobab_seed":
        if (current.player.block <= 0) {
          current = {
            ...current,
            player: {
              ...current.player,
              block: current.player.block + 6,
            },
          };
        }
        break;

      // Planned relics: end-of-turn combo/tempo checks
      case "greek_stoa_treatise":
        if (current.hand.length >= 6) {
          current = incrementCounter(current, "next_turn_energy_bonus", 1);
        }
        break;
      case "celtic_dagda_cauldron":
        if (getCounter(current, "turn_skill_count") >= 3) {
          current = incrementCounter(current, "next_turn_energy_bonus", 1);
        }
        break;
      case "aztec_tzitzimitl_star":
        if (getCounter(current, "turn_nunchaku_attacks") >= 4) {
          current = incrementCounter(current, "next_turn_energy_bonus", 1);
          current = setCounter(current, "turn_nunchaku_attacks", 0);
        }
        break;
      case "russian_yaga_mortar":
        if (current.turnNumber === 3) {
          current = {
            ...current,
            discardPile: [
              ...current.discardPile,
              {
                instanceId: nanoid(),
                definitionId: "dazed",
                upgraded: false,
              },
            ],
            player: {
              ...current.player,
              focus: current.player.focus + 2,
            },
          };
        }
        break;
    }
  }

  return current;
}

/**
 * Apply relic effects when a card is played.
 * cardType is the type field of the card definition (e.g. "ATTACK", "SKILL", "POWER").
 */
export function applyRelicsOnCardPlayed(
  state: CombatState,
  relicIds: string[],
  cardType: string,
  context?: {
    beforeState?: CombatState;
    targetId?: string | null;
    rng?: RNG;
  }
): CombatState {
  const beforeState = context?.beforeState ?? state;
  const rng = context?.rng;
  const targetId = context?.targetId ?? null;
  let current = state;

  const getBuffStacks = (
    buffs: Array<{ type: string; stacks: number }>,
    type: string
  ): number => buffs.find((buff) => buff.type === type)?.stacks ?? 0;

  const hasAnyDebuff = (buffs: Array<{ type: string; stacks: number }>) =>
    ["WEAK", "VULNERABLE", "POISON", "BLEED", "STUN"].some(
      (type) => getBuffStacks(buffs, type) > 0
    );

  const applyDamageToAllEnemies = (
    value: number,
    exceptInstanceId?: string
  ) => {
    current = {
      ...current,
      enemies: current.enemies.map((enemy) => {
        if (enemy.currentHp <= 0) return enemy;
        if (exceptInstanceId && enemy.instanceId === exceptInstanceId)
          return enemy;
        const result = applyDamage(enemy, value);
        return {
          ...enemy,
          currentHp: result.currentHp,
          block: result.block,
        };
      }),
    };
  };

  const applyDebuffToAllEnemies = (type: "WEAK" | "VULNERABLE") => {
    current = {
      ...current,
      enemies: current.enemies.map((enemy) =>
        enemy.currentHp <= 0
          ? enemy
          : {
              ...enemy,
              buffs: [...enemy.buffs, { type, stacks: 1, duration: 2 }],
            }
      ),
    };
  };

  current = incrementCounter(current, "turn_cards_played", 1);
  current = incrementCounter(current, "combat_cards_played", 1);
  if (cardType === "ATTACK") {
    current = incrementCounter(current, "turn_attack_count", 1);
    current = incrementCounter(current, "combat_attack_count", 1);
    current = incrementCounter(current, "turn_nunchaku_attacks", 1);
  }
  if (cardType === "SKILL") {
    current = incrementCounter(current, "turn_skill_count", 1);
    current = incrementCounter(current, "combat_skill_count", 1);
  }

  const firstAttackThisTurn =
    cardType === "ATTACK" && getCounter(current, "turn_attack_count") === 1;
  const firstAttackThisCombat =
    cardType === "ATTACK" && getCounter(current, "combat_attack_count") === 1;

  if (
    cardType === "SKILL" &&
    current.relicFlags?.turn_first_skill_relic_active
  ) {
    if (relicIds.includes("library_margin_inkpot")) {
      current = {
        ...current,
        player: {
          ...current.player,
          inkCurrent: Math.min(
            current.player.inkMax,
            current.player.inkCurrent + 1
          ),
        },
      };
    }
    if (relicIds.includes("egypt_tomb_censer")) {
      // Approximation: refund 1 energy on first SKILL each turn.
      current = {
        ...current,
        player: {
          ...current.player,
          energyCurrent: current.player.energyCurrent + 1,
        },
      };
    }
    current = setFlag(current, "turn_first_skill_relic_active", false);
  }

  for (const relicId of relicIds) {
    switch (relicId) {
      case "scholars_stone":
        if (cardType === "ATTACK") {
          current = {
            ...current,
            player: {
              ...current.player,
              inkCurrent: Math.min(
                current.player.inkMax,
                current.player.inkCurrent + 1
              ),
            },
          };
        }
        break;

      case "reactive_binding":
        if (cardType === "SKILL") {
          current = {
            ...current,
            player: {
              ...current.player,
              block: current.player.block + 1,
            },
          };
        }
        break;

      case "lamia_veil":
        if (cardType === "SKILL") {
          applyDamageToAllEnemies(1);
        }
        break;

      case "automaton_bronze_gear":
        if (cardType === "ATTACK") {
          current = {
            ...current,
            player: {
              ...current.player,
              block: current.player.block + 2,
            },
          };
        }
        break;

      case "broodling_hydra_spine":
        if (cardType === "ATTACK") {
          current = {
            ...current,
            player: {
              ...current.player,
              strength: current.player.strength + 1,
            },
          };
        }
        break;

      case "impundulu_thunder_plume":
        if (cardType === "ATTACK") {
          applyDamageToAllEnemies(1);
        }
        break;

      case "plague_carillon":
        applyDamageToAllEnemies(1);
        break;

      // Planned relics: card-play combo triggers
      case "library_redaction_quill":
        if (
          cardType === "SKILL" &&
          getCounter(current, "turn_skill_count") > 0 &&
          getCounter(current, "turn_skill_count") % 3 === 0
        ) {
          applyDebuffToAllEnemies("WEAK");
        }
        break;
      case "viking_maiden_rune":
        if (
          cardType === "SKILL" &&
          getCounter(current, "combat_skill_count") > 0 &&
          getCounter(current, "combat_skill_count") % 3 === 0
        ) {
          current = {
            ...current,
            player: {
              ...current.player,
              buffs: [...current.player.buffs, { type: "THORNS", stacks: 1 }],
            },
          };
        }
        break;
      case "african_mask_drum":
        if (
          cardType === "SKILL" &&
          getCounter(current, "turn_skill_count") > 0 &&
          getCounter(current, "turn_skill_count") % 3 === 0
        ) {
          current = {
            ...current,
            player: {
              ...current.player,
              strength: current.player.strength + 1,
            },
          };
        }
        break;
      case "greek_satyr_flute":
        if (
          cardType === "ATTACK" &&
          getCounter(current, "turn_attack_count") > 0 &&
          getCounter(current, "turn_attack_count") % 5 === 0
        ) {
          const strengthAfterGain = current.player.strength + 1;
          current = {
            ...current,
            player: {
              ...current.player,
              strength: strengthAfterGain,
            },
          };
          applyDamageToAllEnemies(strengthAfterGain);
        }
        break;
      case "celtic_wild_hunt_horn":
        if (
          cardType === "ATTACK" &&
          getCounter(current, "turn_attack_count") > 0 &&
          getCounter(current, "turn_attack_count") % 3 === 0
        ) {
          applyDebuffToAllEnemies("WEAK");
        }
        break;
      case "love_star_chart":
        if (
          getCounter(current, "combat_cards_played") > 0 &&
          getCounter(current, "combat_cards_played") % 5 === 0
        ) {
          applyDebuffToAllEnemies("VULNERABLE");
        }
        break;
      case "aztec_blood_calendar":
        if (
          getCounter(current, "combat_cards_played") > 0 &&
          getCounter(current, "combat_cards_played") % 12 === 0
        ) {
          current = {
            ...current,
            player: {
              ...current.player,
              currentHp: Math.min(
                current.player.maxHp,
                current.player.currentHp + 4
              ),
            },
          };
          if (rng) {
            current = drawCards(
              current,
              1,
              rng,
              "SYSTEM",
              "RELIC_AZTEC_BLOOD_CALENDAR"
            );
          }
        }
        break;
      case "african_anansi_weave":
        if (getCounter(current, "turn_cards_played") % 4 === 0) {
          current = setFlag(current, "anansi_skill_dup_pending", true);
        }
        if (
          cardType === "SKILL" &&
          current.relicFlags?.anansi_skill_dup_pending
        ) {
          current = {
            ...current,
            player: {
              ...current.player,
              block: current.player.block + 4,
            },
          };
          if (rng) {
            current = drawCards(
              current,
              1,
              rng,
              "SYSTEM",
              "RELIC_AFRICAN_ANANSI_WEAVE"
            );
          }
          current = setFlag(current, "anansi_skill_dup_pending", false);
        }
        break;
      case "african_oya_anklet":
        if (current.player.energyCurrent <= 0) {
          current = {
            ...current,
            player: {
              ...current.player,
              block: current.player.block + 6,
              buffs: [...current.player.buffs, { type: "THORNS", stacks: 1 }],
            },
          };
        }
        break;
    }
  }

  const targetBefore = targetId
    ? beforeState.enemies.find((enemy) => enemy.instanceId === targetId)
    : null;
  const targetAfter = targetId
    ? current.enemies.find((enemy) => enemy.instanceId === targetId)
    : null;

  const targetWasDebuffed = targetBefore
    ? hasAnyDebuff(targetBefore.buffs)
    : false;
  const targetWasFullHp = targetBefore
    ? targetBefore.currentHp >= targetBefore.maxHp
    : false;
  const targetBlockBroken = Boolean(
    targetBefore &&
    targetAfter &&
    targetBefore.block > 0 &&
    targetAfter.block <= 0
  );

  if (
    cardType === "ATTACK" &&
    targetBefore &&
    targetAfter &&
    targetAfter.currentHp > 0
  ) {
    if (relicIds.includes("viking_raider_horn") && firstAttackThisCombat) {
      const bonus = applyDamage(targetAfter, 6);
      current = {
        ...current,
        enemies: current.enemies.map((enemy) =>
          enemy.instanceId !== targetAfter.instanceId
            ? enemy
            : {
                ...enemy,
                currentHp: bonus.currentHp,
                block: bonus.block,
                buffs: [
                  ...enemy.buffs,
                  { type: "VULNERABLE", stacks: 1, duration: 2 },
                ],
              }
        ),
      };
    }
    if (
      relicIds.includes("african_hyena_talisman") &&
      firstAttackThisTurn &&
      targetWasFullHp
    ) {
      const latestTarget =
        current.enemies.find(
          (enemy) => enemy.instanceId === targetAfter.instanceId
        ) ?? targetAfter;
      const bonus = applyDamage(latestTarget, 4);
      current = {
        ...current,
        enemies: current.enemies.map((enemy) =>
          enemy.instanceId !== targetAfter.instanceId
            ? enemy
            : { ...enemy, currentHp: bonus.currentHp, block: bonus.block }
        ),
      };
    }
    if (
      relicIds.includes("aztec_jaguar_fang") &&
      firstAttackThisTurn &&
      targetWasDebuffed
    ) {
      current = {
        ...current,
        player: {
          ...current.player,
          currentHp: Math.min(
            current.player.maxHp,
            current.player.currentHp + 1
          ),
        },
      };
    }
    if (relicIds.includes("greek_cyclops_iris") && firstAttackThisTurn) {
      applyDamageToAllEnemies(3, targetAfter.instanceId);
    }
  }

  if (targetBlockBroken && relicIds.includes("greek_minotaur_labrys")) {
    current = {
      ...current,
      player: {
        ...current.player,
        block: current.player.block + 3,
      },
    };
  }

  const debuffTypes = [
    "WEAK",
    "VULNERABLE",
    "POISON",
    "BLEED",
    "STUN",
  ] as const;
  let totalDebuffsApplied = 0;
  let targetDebuffsApplied = 0;
  let vulnerableApplied = 0;
  for (const beforeEnemy of beforeState.enemies) {
    const afterEnemy = current.enemies.find(
      (enemy) => enemy.instanceId === beforeEnemy.instanceId
    );
    if (!afterEnemy) continue;
    for (const debuffType of debuffTypes) {
      const beforeStacks = getBuffStacks(beforeEnemy.buffs, debuffType);
      const afterStacks = getBuffStacks(afterEnemy.buffs, debuffType);
      if (afterStacks > beforeStacks) {
        const delta = afterStacks - beforeStacks;
        totalDebuffsApplied += delta;
        if (debuffType === "VULNERABLE") vulnerableApplied += delta;
        if (targetId && afterEnemy.instanceId === targetId) {
          targetDebuffsApplied += delta;
        }
      }
    }
  }

  if (relicIds.includes("aztec_eagle_standard") && vulnerableApplied > 0) {
    current = {
      ...current,
      player: {
        ...current.player,
        block: current.player.block + 3,
      },
    };
  }

  if (
    relicIds.includes("greek_hydra_ichor") &&
    targetDebuffsApplied > 0 &&
    targetId
  ) {
    const enemy = current.enemies.find((e) => e.instanceId === targetId);
    if (enemy && enemy.currentHp > 0) {
      const result = applyDamage(enemy, targetDebuffsApplied * 2);
      current = {
        ...current,
        enemies: current.enemies.map((e) =>
          e.instanceId === targetId
            ? { ...e, currentHp: result.currentHp, block: result.block }
            : e
        ),
      };
    }
  }

  if (relicIds.includes("celtic_morrigan_feather") && totalDebuffsApplied > 0) {
    const gainedSoFar = getCounter(current, "morrigan_thorns_gained");
    const toGain = Math.max(0, Math.min(5 - gainedSoFar, totalDebuffsApplied));
    if (toGain > 0) {
      current = {
        ...current,
        player: {
          ...current.player,
          buffs: [...current.player.buffs, { type: "THORNS", stacks: toGain }],
        },
      };
      current = incrementCounter(current, "morrigan_thorns_gained", toGain);
    }
  }

  const focusGain = Math.max(
    0,
    current.player.focus - beforeState.player.focus
  );
  if (focusGain > 0 && relicIds.includes("egypt_ushabti_ward")) {
    current = {
      ...current,
      player: {
        ...current.player,
        currentHp: Math.min(
          current.player.maxHp,
          current.player.currentHp + 2 * focusGain
        ),
      },
    };
  }

  if (cardType === "ATTACK" && getCounter(current, "turn_attack_count") === 3) {
    if (relicIds.includes("african_sunbird_refrain")) {
      current = {
        ...current,
        player: {
          ...current.player,
          currentHp: Math.min(
            current.player.maxHp,
            current.player.currentHp + 2
          ),
        },
      };
      if (rng) {
        current = drawCards(
          current,
          1,
          rng,
          "SYSTEM",
          "RELIC_AFRICAN_SUNBIRD_REFRAIN"
        );
      }
      current = incrementCounter(current, "turn_sunbird_triggers", 1);
    }
  }

  const handBecameEmpty =
    beforeState.hand.length > 0 &&
    current.hand.length === 0 &&
    current.phase === "PLAYER_TURN";
  if (handBecameEmpty) {
    if (relicIds.includes("russian_snow_charm")) {
      const drawsThisTurn = getCounter(current, "turn_snow_charm_draws");
      if (drawsThisTurn < 2 && rng) {
        current = drawCards(
          current,
          1,
          rng,
          "SYSTEM",
          "RELIC_RUSSIAN_SNOW_CHARM"
        );
        current = incrementCounter(current, "turn_snow_charm_draws", 1);
      }
    }
    if (
      relicIds.includes("viking_longship_standard") &&
      getCounter(current, "longship_standard_used") === 0
    ) {
      current = {
        ...current,
        player: {
          ...current.player,
          energyCurrent: current.player.energyCurrent + 1,
        },
      };
      if (rng) {
        current = drawCards(
          current,
          2,
          rng,
          "SYSTEM",
          "RELIC_VIKING_LONGSHIP_STANDARD"
        );
      }
      current = setCounter(current, "longship_standard_used", 1);
    }
  }

  const beforeLiving = new Set(
    beforeState.enemies
      .filter((enemy) => enemy.currentHp > 0)
      .map((enemy) => enemy.instanceId)
  );
  const killedNow = current.enemies.filter(
    (enemy) => beforeLiving.has(enemy.instanceId) && enemy.currentHp <= 0
  );
  const killCount = killedNow.length;
  if (killCount > 0) {
    const turnKillsBefore = getCounter(current, "turn_kills");
    const combatKillsBefore = getCounter(current, "combat_kills");
    current = setCounter(current, "turn_kills", turnKillsBefore + killCount);
    current = setCounter(
      current,
      "combat_kills",
      combatKillsBefore + killCount
    );

    if (relicIds.includes("greek_hydra_heart")) {
      current = {
        ...current,
        player: {
          ...current.player,
          currentHp: Math.min(
            current.player.maxHp,
            current.player.currentHp + 3 * killCount
          ),
          strength: current.player.strength + killCount,
        },
      };
    }

    if (
      relicIds.includes("aztec_huitzil_fire") &&
      getCounter(current, "huitzil_first_kill_done") === 0
    ) {
      current = {
        ...current,
        player: {
          ...current.player,
          strength: current.player.strength + 1,
        },
      };
      current = setCounter(current, "huitzil_first_kill_done", 1);
    }

    if (relicIds.includes("egypt_sekhmet_blade") && turnKillsBefore === 0) {
      current = {
        ...current,
        player: {
          ...current.player,
          energyCurrent: current.player.energyCurrent + 1,
        },
      };
    }

    if (relicIds.includes("viking_valkyrie_feather") && rng) {
      const drawsUsed = getCounter(current, "turn_valkyrie_draws");
      const draws = Math.max(0, Math.min(2 - drawsUsed, killCount));
      if (draws > 0) {
        current = drawCards(
          current,
          draws,
          rng,
          "SYSTEM",
          "RELIC_VIKING_VALKYRIE_FEATHER"
        );
        current = incrementCounter(current, "turn_valkyrie_draws", draws);
      }
    }
  }

  return current;
}

/**
 * Apply relic effects on run state (passive, non-combat).
 */
export function applyRelicsOnRun(runState: RunState): RunState {
  // MVP: no run-level relic effects yet
  return runState;
}
