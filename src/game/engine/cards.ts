import type { CombatState } from "../schemas/combat-state";
import type { CardDefinition } from "../schemas/cards";
import type { Targeting } from "../schemas/enums";
import { boostEffectsForUpgrade } from "./card-upgrades";
import { moveCardToDiscard, moveCardToExhaust } from "./deck";
import { resolveEffects, type EffectTarget } from "./effects";
import type { RNG } from "./rng";

function getEffectiveCardEnergyCost(
  definition: CardDefinition,
  upgraded: boolean
): number {
  if (upgraded && definition.upgrade?.energyCost !== undefined) {
    return definition.upgrade.energyCost;
  }
  return definition.energyCost;
}

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
  if (state.playerDisruption?.frozenHandCardIds?.includes(instanceId))
    return false;

  const effectiveEnergyCost =
    getEffectiveCardEnergyCost(def, cardInst.upgraded) +
    (state.playerDisruption?.extraCardCost ?? 0);
  if (state.player.energyCurrent < effectiveEnergyCost) return false;
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
      return targetId ? { type: "ally", instanceId: targetId } : "player";
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
  let energyCost = getEffectiveCardEnergyCost(def, cardInst.upgraded);
  if (cardInst.upgraded) {
    if (def.upgrade) {
      effects = def.upgrade.effects;
    } else {
      effects = boostEffectsForUpgrade(effects);
    }
  }

  energyCost += state.playerDisruption?.extraCardCost ?? 0;
  if (state.playerDisruption?.frozenHandCardIds?.includes(instanceId))
    return state;

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
