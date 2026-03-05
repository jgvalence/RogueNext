import type { CombatState } from "../schemas/combat-state";
import type { InkPowerType } from "../schemas/enums";
import type { CardDefinition } from "../schemas/cards";
import { GAME_CONSTANTS } from "../constants";
import { moveFromDiscardToHand, drawCards } from "./deck";
import { applyDamage } from "./damage";
import { applyBuff } from "./buffs";
import type { RNG } from "./rng";

export function gainInk(state: CombatState, amount: number): CombatState {
  return {
    ...state,
    player: {
      ...state.player,
      inkCurrent: Math.min(
        state.player.inkMax,
        state.player.inkCurrent + amount
      ),
    },
  };
}

export function spendInk(
  state: CombatState,
  amount: number
): CombatState | null {
  if (state.player.inkCurrent < amount) return null;

  return {
    ...state,
    player: {
      ...state.player,
      inkCurrent: state.player.inkCurrent - amount,
    },
  };
}

export function canUseInkPower(
  state: CombatState,
  power: InkPowerType
): boolean {
  const disabled = state.playerDisruption?.disabledInkPowers ?? [];
  if (disabled.includes("ALL") || disabled.includes(power)) return false;

  if (state.inkPowerUsedThisTurn) return false;

  const cost = GAME_CONSTANTS.INK_POWER_COSTS[power];
  if (state.player.inkCurrent < cost) return false;

  switch (power) {
    // Scribe
    case "CALLIGRAPHIE":
      return state.hand.length > 0;
    case "ENCRE_NOIRE":
      return state.enemies.some((e) => e.currentHp > 0);
    case "SEAL":
      return true;
    // Bibliothécaire
    case "VISION":
      return state.drawPile.length > 0 || state.discardPile.length > 0;
    case "INDEX":
      return state.discardPile.length > 0;
    case "SILENCE":
      return state.enemies.some((e) => e.currentHp > 0);
    // Legacy
    case "REWRITE":
      return state.discardPile.length > 0;
    case "LOST_CHAPTER":
      return state.drawPile.length > 0 || state.discardPile.length > 0;
  }
}

/**
 * Use an ink power.
 * - CALLIGRAPHIE : améliore une carte aléatoire en main (ce combat)
 * - ENCRE_NOIRE  : inflige encre×2 dégâts à tous les ennemis
 * - SEAL         : gagne 8 armure
 * - VISION       : pioche 2 cartes
 * - INDEX        : récupère une carte de la défausse (targetInstanceId = card)
 * - SILENCE      : étourdis un ennemi 1 tour (targetInstanceId = enemy instanceId)
 * - REWRITE/LOST_CHAPTER : legacy, comportement conservé
 */
export function applyInkPower(
  state: CombatState,
  power: InkPowerType,
  targetInstanceId: string | null,
  _cardDefs: Map<string, CardDefinition>,
  rng: RNG
): CombatState {
  if (!canUseInkPower(state, power)) return state;

  const cost = GAME_CONSTANTS.INK_POWER_COSTS[power];
  const afterSpend = spendInk(state, cost);
  if (!afterSpend) return state;

  const marked: CombatState = { ...afterSpend, inkPowerUsedThisTurn: true };

  switch (power) {
    case "CALLIGRAPHIE": {
      // Améliore une carte aléatoire en main (combat uniquement)
      const upgradable = marked.hand.filter((c) => !c.upgraded);
      const pool = upgradable.length > 0 ? upgradable : marked.hand;
      if (pool.length === 0) return marked;
      const target = rng.pick(pool);
      return {
        ...marked,
        hand: marked.hand.map((c) =>
          c.instanceId === target.instanceId ? { ...c, upgraded: true } : c
        ),
      };
    }

    case "ENCRE_NOIRE": {
      // Dégâts = inkCurrent (avant dépense) × MULTIPLIER à tous les ennemis
      const rawInk = state.player.inkCurrent;
      const dmg = rawInk * GAME_CONSTANTS.ENCRE_NOIRE_DAMAGE_MULTIPLIER;
      const updatedEnemies = marked.enemies.map((e) => {
        if (e.currentHp <= 0) return e;
        const result = applyDamage(e, dmg);
        return { ...e, currentHp: result.currentHp, block: result.block };
      });
      return { ...marked, enemies: updatedEnemies };
    }

    case "SEAL": {
      return {
        ...marked,
        player: {
          ...marked.player,
          block: marked.player.block + GAME_CONSTANTS.SEAL_BLOCK_AMOUNT,
        },
      };
    }

    case "VISION": {
      return drawCards(
        marked,
        GAME_CONSTANTS.VISION_DRAW,
        rng,
        "PLAYER",
        "INK_POWER:VISION"
      );
    }

    case "INDEX": {
      if (!targetInstanceId) return state;
      return moveFromDiscardToHand(marked, targetInstanceId);
    }

    case "SILENCE": {
      // Étourdis l'ennemi ciblé : il passe son prochain tour
      if (!targetInstanceId) return state;
      const updatedEnemies = marked.enemies.map((e) => {
        if (e.instanceId !== targetInstanceId || e.currentHp <= 0) return e;
        return { ...e, buffs: applyBuff(e.buffs, "STUN", 1, 1) };
      });
      return { ...marked, enemies: updatedEnemies };
    }

    // Legacy
    case "REWRITE": {
      if (!targetInstanceId) return state;
      return moveFromDiscardToHand(marked, targetInstanceId);
    }

    case "LOST_CHAPTER": {
      return drawCards(
        marked,
        GAME_CONSTANTS.LOST_CHAPTER_DRAW,
        rng,
        "PLAYER",
        "INK_POWER:LOST_CHAPTER"
      );
    }
  }
}
