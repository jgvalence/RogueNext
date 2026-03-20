import type { CombatState } from "../schemas/combat-state";
import type { InkPowerType } from "../schemas/enums";
import type { CardDefinition } from "../schemas/cards";
import { GAME_CONSTANTS } from "../constants";
import {
  drawCards,
  isClogCardDefinitionId,
  moveFromDiscardToHand,
} from "./deck";
import { applyDamage } from "./damage";
import { getBuffStacks } from "./buffs";
import { applyBuff } from "./buffs";
import { registerBabaYagaInkSpent } from "./baba-yaga";
import { registerHydraDamage, synchronizeHydraCombatState } from "./hydra";
import { synchronizeKoscheiCombatState } from "./koschei";
import { synchronizeMedusaCombatState } from "./medusa";
import { synchronizeAnansiCombatState } from "./anansi-weaver";
import {
  modifyCernunnosIncomingDamage,
  registerCernunnosDamage,
  synchronizeCernunnosCombatState,
} from "./cernunnos-shade";
import { synchronizeDagdaCombatState } from "./dagda-shadow";
import {
  registerNyarlathotepInkSpent,
  synchronizeNyarlathotepCombatState,
} from "./nyarlathotep";
import {
  registerOsirisBlockGain,
  registerOsirisDamageDealt,
  synchronizeOsirisCombatState,
} from "./osiris-judgment";
import {
  modifyQuetzalcoatlIncomingDamage,
  registerQuetzalcoatlDamage,
  synchronizeQuetzalcoatlCombatState,
} from "./quetzalcoatl";
import {
  registerRaSolarBarrierBreak,
  synchronizeRaCombatState,
} from "./ra-avatar";
import { applyRelicsOnInkSpent } from "./relics";
import {
  registerSoundiataInterruptDamage,
  synchronizeSoundiataCombatState,
} from "./soundiata-spirit";
import { synchronizeShubCombatState } from "./shub-spawn";
import { synchronizeTezcatlipocaCombatState } from "./tezcatlipoca";
import type { RNG } from "./rng";

function synchronizeBossStates(state: CombatState): CombatState {
  return synchronizeKoscheiCombatState(
    synchronizeHydraCombatState(
      synchronizeMedusaCombatState(
        synchronizeQuetzalcoatlCombatState(
          synchronizeTezcatlipocaCombatState(
            synchronizeOsirisCombatState(
              synchronizeShubCombatState(
                synchronizeNyarlathotepCombatState(
                  synchronizeSoundiataCombatState(
                    synchronizeAnansiCombatState(
                      synchronizeCernunnosCombatState(
                        synchronizeDagdaCombatState(
                          synchronizeRaCombatState(state)
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )
    )
  );
}

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

  const usedInkPowersThisTurn = state.usedInkPowersThisTurn;
  if (usedInkPowersThisTurn?.includes(power)) return false;
  if (!usedInkPowersThisTurn && state.inkPowerUsedThisTurn) return false;

  const cost = GAME_CONSTANTS.INK_POWER_COSTS[power];
  if (state.player.inkCurrent < cost) return false;

  switch (power) {
    // Scribe
    case "CALLIGRAPHIE":
      return state.hand.some(
        (card) => !card.upgraded && !isClogCardDefinitionId(card.definitionId)
      );
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
      return state.enemies.some(
        (e) => e.currentHp > 0 && getBuffStacks(e.buffs, "STUN_IMMUNITY") <= 0
      );
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
 * - SILENCE      : étourdis un ennemi 1 tour (élites/boss résistants 1 tour ensuite)
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

  if (power === "SILENCE") {
    if (!targetInstanceId) return state;
    const targetEnemy = state.enemies.find(
      (enemy) => enemy.instanceId === targetInstanceId
    );
    if (
      !targetEnemy ||
      targetEnemy.currentHp <= 0 ||
      getBuffStacks(targetEnemy.buffs, "STUN_IMMUNITY") > 0
    ) {
      return state;
    }
  }

  const cost = GAME_CONSTANTS.INK_POWER_COSTS[power];
  const afterSpend = spendInk(state, cost);
  if (!afterSpend) return state;

  const marked: CombatState = {
    ...afterSpend,
    inkPowerUsedThisTurn: true,
    usedInkPowersThisTurn: Array.from(
      new Set([...(afterSpend.usedInkPowersThisTurn ?? []), power])
    ),
  };
  let markedWithRussianState = applyRelicsOnInkSpent(marked, cost);
  markedWithRussianState = registerBabaYagaInkSpent(
    markedWithRussianState,
    cost
  );
  markedWithRussianState = registerNyarlathotepInkSpent(
    markedWithRussianState,
    cost
  );

  switch (power) {
    case "CALLIGRAPHIE": {
      // Améliore une carte aléatoire en main (combat uniquement)
      const upgradable = marked.hand.filter(
        (card) => !card.upgraded && !isClogCardDefinitionId(card.definitionId)
      );
      if (upgradable.length === 0) return state;
      const target = rng.pick(upgradable);
      return synchronizeBossStates({
        ...markedWithRussianState,
        hand: markedWithRussianState.hand.map((c) =>
          c.instanceId === target.instanceId ? { ...c, upgraded: true } : c
        ),
      });
    }

    case "ENCRE_NOIRE": {
      // Dégâts = inkCurrent (avant dépense) × MULTIPLIER à tous les ennemis
      const rawInk = state.player.inkCurrent;
      const dmg = rawInk * GAME_CONSTANTS.ENCRE_NOIRE_DAMAGE_MULTIPLIER;
      let current = { ...markedWithRussianState };
      const updatedEnemies = markedWithRussianState.enemies.map((e) => {
        if (e.currentHp <= 0) return e;
        const quetzalModifiedDamage = modifyQuetzalcoatlIncomingDamage(
          current,
          e.instanceId,
          "player",
          dmg
        );
        const modifiedDamage = modifyCernunnosIncomingDamage(
          current,
          e.instanceId,
          "player",
          quetzalModifiedDamage
        );
        const result = applyDamage(e, modifiedDamage);
        return { ...e, currentHp: result.currentHp, block: result.block };
      });
      current = {
        ...current,
        enemies: updatedEnemies,
      };
      for (const enemy of updatedEnemies) {
        const previousEnemy = markedWithRussianState.enemies.find(
          (entry) => entry.instanceId === enemy.instanceId
        );
        if (!previousEnemy) continue;
        const actualDamage =
          Math.max(0, previousEnemy.currentHp - enemy.currentHp) +
          Math.max(0, previousEnemy.block - enemy.block);
        current = registerRaSolarBarrierBreak(
          current,
          enemy.instanceId,
          "player",
          previousEnemy.block,
          enemy.block
        );
        if (actualDamage <= 0) continue;
        current = registerSoundiataInterruptDamage(
          current,
          enemy.instanceId,
          actualDamage,
          "player"
        );
        current = registerOsirisDamageDealt(current, actualDamage, "player");
        current = registerHydraDamage(current, enemy.instanceId, "player");
        current = registerQuetzalcoatlDamage(
          current,
          enemy.instanceId,
          "player"
        );
        current = registerCernunnosDamage(current, enemy.instanceId, "player");
      }
      return synchronizeBossStates(current);
    }

    case "SEAL": {
      return synchronizeBossStates(
        registerOsirisBlockGain(
          {
            ...markedWithRussianState,
            player: {
              ...markedWithRussianState.player,
              block:
                markedWithRussianState.player.block +
                GAME_CONSTANTS.SEAL_BLOCK_AMOUNT,
            },
          },
          GAME_CONSTANTS.SEAL_BLOCK_AMOUNT
        )
      );
    }

    case "VISION": {
      return synchronizeBossStates(
        drawCards(
          markedWithRussianState,
          GAME_CONSTANTS.VISION_DRAW,
          rng,
          "PLAYER",
          "INK_POWER:VISION"
        )
      );
    }

    case "INDEX": {
      if (!targetInstanceId) return state;
      return synchronizeBossStates(
        moveFromDiscardToHand(markedWithRussianState, targetInstanceId)
      );
    }

    case "SILENCE": {
      // Étourdis l'ennemi ciblé : il passe son prochain tour
      if (!targetInstanceId) return state;
      const updatedEnemies = markedWithRussianState.enemies.map((e) => {
        if (e.instanceId !== targetInstanceId || e.currentHp <= 0) return e;
        return { ...e, buffs: applyBuff(e.buffs, "STUN", 1, 1) };
      });
      return synchronizeBossStates({
        ...markedWithRussianState,
        enemies: updatedEnemies,
      });
    }

    // Legacy
    case "REWRITE": {
      if (!targetInstanceId) return state;
      return synchronizeBossStates(
        moveFromDiscardToHand(markedWithRussianState, targetInstanceId)
      );
    }

    case "LOST_CHAPTER": {
      return synchronizeBossStates(
        drawCards(
          markedWithRussianState,
          GAME_CONSTANTS.LOST_CHAPTER_DRAW,
          rng,
          "PLAYER",
          "INK_POWER:LOST_CHAPTER"
        )
      );
    }
  }
}
