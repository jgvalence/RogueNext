import type { CombatState } from "../schemas/combat-state";
import type { CardDefinition } from "../schemas/cards";
import type { Effect } from "../schemas/effects";
import type { Targeting } from "../schemas/enums";
import { moveCardToDiscard, moveCardToExhaust } from "./deck";
import { resolveEffects, type EffectTarget } from "./effects";
import type { RNG } from "./rng";

export function canPlayCard(
  state: CombatState,
  instanceId: string,
  cardDefs: Map<string, CardDefinition>
): boolean {
  const cardInst = state.hand.find((c) => c.instanceId === instanceId);
  if (!cardInst) return false;

  const def = cardDefs.get(cardInst.definitionId);
  if (!def) return false;
  if (def.type === "STATUS" || def.type === "CURSE") return false;

  if (state.player.energyCurrent < def.energyCost) return false;
  if (def.inkCost > 0 && state.player.inkCurrent < def.inkCost) return false;

  return true;
}

export function canPlayCardInked(
  state: CombatState,
  instanceId: string,
  cardDefs: Map<string, CardDefinition>
): boolean {
  if (!canPlayCard(state, instanceId, cardDefs)) return false;

  const cardInst = state.hand.find((c) => c.instanceId === instanceId);
  if (!cardInst) return false;

  const def = cardDefs.get(cardInst.definitionId);
  if (!def?.inkedVariant) return false;

  return state.player.inkCurrent >= def.inkedVariant.inkMarkCost;
}

function targetingToEffectTarget(
  targeting: Targeting,
  targetId: string | null
): EffectTarget {
  switch (targeting) {
    case "SINGLE_ENEMY":
      return targetId ? { type: "enemy", instanceId: targetId } : "all_enemies";
    case "ALL_ENEMIES":
      return "all_enemies";
    case "SELF":
      return "player";
    case "SINGLE_ALLY":
      return targetId ? { type: "ally", instanceId: targetId } : "player";
    case "ALL_ALLIES":
      return "all_allies";
  }
}

export function playCard(
  state: CombatState,
  instanceId: string,
  targetId: string | null,
  useInked: boolean,
  cardDefs: Map<string, CardDefinition>,
  rng: RNG
): CombatState {
  const cardInst = state.hand.find((c) => c.instanceId === instanceId);
  if (!cardInst) return state;

  const def = cardDefs.get(cardInst.definitionId);
  if (!def) return state;

  let effects =
    useInked && def.inkedVariant ? def.inkedVariant.effects : def.effects;
  const inkCost =
    useInked && def.inkedVariant
      ? def.inkCost + def.inkedVariant.inkMarkCost
      : def.inkCost;

  // Apply upgrade: use card-specific upgrade if defined, else generic boost
  let energyCost = def.energyCost;
  if (cardInst.upgraded) {
    if (def.upgrade) {
      effects = def.upgrade.effects;
      if (def.upgrade.energyCost !== undefined)
        energyCost = def.upgrade.energyCost;
    } else {
      effects = boostEffects(effects);
    }
  }

  // Validate costs
  if (state.player.energyCurrent < energyCost) return state;
  if (inkCost > 0 && state.player.inkCurrent < inkCost) return state;

  // Deduct costs
  let current: CombatState = {
    ...state,
    player: {
      ...state.player,
      energyCurrent: state.player.energyCurrent - energyCost,
      inkCurrent: state.player.inkCurrent - inkCost,
    },
  };

  // Resolve effects
  const target = targetingToEffectTarget(def.targeting, targetId);
  current = resolveEffects(current, effects, { source: "player", target }, rng);

  // Chance-based extra ink on card play.
  if (
    current.player.inkPerCardChance > 0 &&
    current.player.inkPerCardValue > 0
  ) {
    const gainedInk =
      rng.next() * 100 < current.player.inkPerCardChance
        ? current.player.inkPerCardValue
        : 0;
    if (gainedInk > 0) {
      current = {
        ...current,
        player: {
          ...current.player,
          inkCurrent: Math.min(
            current.player.inkMax,
            current.player.inkCurrent + gainedInk
          ),
        },
      };
    }
  }

  // Move card to appropriate pile
  const shouldExhaust =
    def.type === "POWER" || effects.some((e) => e.type === "EXHAUST");
  if (shouldExhaust) {
    current = moveCardToExhaust(current, instanceId);
  } else {
    current = moveCardToDiscard(current, instanceId);
  }

  return current;
}

/**
 * Boost effect values for upgraded cards.
 * - DAMAGE / BLOCK / HEAL / GAIN_INK : ×1.5 (floor), minimum +1
 * - DRAW_CARDS / GAIN_ENERGY / GAIN_STRENGTH / GAIN_FOCUS : +1
 * - APPLY_BUFF / APPLY_DEBUFF : +1 stack
 */
function boostEffects(effects: Effect[]): Effect[] {
  return effects.map((e) => {
    switch (e.type) {
      case "DAMAGE":
      case "BLOCK":
      case "HEAL":
      case "GAIN_INK":
        return {
          ...e,
          value: Math.max(Math.floor(e.value * 1.5), e.value + 1),
        };
      case "DRAW_CARDS":
      case "GAIN_ENERGY":
      case "GAIN_STRENGTH":
      case "GAIN_FOCUS":
      case "APPLY_BUFF":
      case "APPLY_DEBUFF":
        return { ...e, value: e.value + 1 };
      default:
        return e;
    }
  });
}
