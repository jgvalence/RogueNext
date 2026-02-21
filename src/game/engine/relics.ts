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

  return {
    ...state,
    player: {
      ...state.player,
      block: retainedBlock,
      energyCurrent,
    },
  };
}

/**
 * Apply relic effects on run state (passive, non-combat).
 */
export function applyRelicsOnRun(runState: RunState): RunState {
  // MVP: no run-level relic effects yet
  return runState;
}
