import type { CombatState } from "../schemas/combat-state";
import type { RunState } from "../schemas/run-state";
import { nanoid } from "nanoid";

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
    }
  }

  return current;
}

/**
 * Apply turn-start relic effects.
 */
export function applyRelicsOnTurnStart(
  state: CombatState,
  relicIds: string[]
): CombatState {
  const keepBlock = relicIds.includes("runic_bulwark");
  const keepEnergy = relicIds.includes("eternal_hourglass");
  const retainedBlock = keepBlock ? Math.floor(state.player.block * 0.5) : 0;
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
  cardType: string
): CombatState {
  let current = state;

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
