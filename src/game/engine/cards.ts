import type { CombatState } from "../schemas/combat-state";
import type { CardDefinition } from "../schemas/cards";
import type { Targeting } from "../schemas/enums";
import { boostEffectsForUpgrade } from "./card-upgrades";
import { moveCardToDiscard, moveCardToExhaust } from "./deck";
import { resolveEffects, type EffectTarget } from "./effects";
import type { RNG } from "./rng";
import {
  getArchivistCardCostModifier,
  getArchivistEffectiveCardDefinition,
  getArchivistEffectiveUpgradeState,
  isArchivistCardTextRedacted,
  synchronizeArchivistCombatState,
} from "./archivist";
import {
  registerChapterGuardianAttackCardPlayed,
  registerChapterGuardianInkSpent,
} from "./chapter-guardian";

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
  const effectiveUpgraded = getArchivistEffectiveUpgradeState(
    state,
    instanceId,
    cardInst.upgraded
  );
  const statusCursePlayable = Boolean(
    state.relicFlags?.statusCursePlayable ?? false
  );
  if (!statusCursePlayable && (def.type === "STATUS" || def.type === "CURSE"))
    return false;
  if (state.playerDisruption?.frozenHandCardIds?.includes(instanceId))
    return false;

  const effectiveEnergyCost =
    getEffectiveCardEnergyCost(def, effectiveUpgraded) +
    (state.playerDisruption?.extraCardCost ?? 0) +
    getArchivistCardCostModifier(state, instanceId);
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
  if (isArchivistCardTextRedacted(state, instanceId)) return false;

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
  rng: RNG,
  metaBonuses?: { attackBonus?: number; exhaustKeepChance?: number }
): CombatState {
  const cardInst = state.hand.find((c) => c.instanceId === instanceId);
  if (!cardInst) return state;

  const def = cardDefs.get(cardInst.definitionId);
  if (!def) return state;
  const effectiveDefinition = getArchivistEffectiveCardDefinition(
    state,
    instanceId,
    def
  );
  const effectiveUpgraded = getArchivistEffectiveUpgradeState(
    state,
    instanceId,
    cardInst.upgraded
  );

  const isUsingInkedVariant = Boolean(
    useInked && effectiveDefinition.inkedVariant
  );
  let effects = isUsingInkedVariant
    ? effectiveDefinition.inkedVariant!.effects
    : effectiveDefinition.effects;
  const inkCost = isUsingInkedVariant
    ? effectiveDefinition.inkCost +
      effectiveDefinition.inkedVariant!.inkMarkCost
    : effectiveDefinition.inkCost;

  // Apply upgrade: use card-specific upgrade if defined, else generic boost
  let energyCost = getEffectiveCardEnergyCost(
    effectiveDefinition,
    effectiveUpgraded
  );
  if (effectiveUpgraded) {
    if (isUsingInkedVariant) {
      // Inked branch may define its own upgraded behavior; otherwise use the generic boost.
      effects =
        effectiveDefinition.inkedVariant?.upgradedEffects ??
        boostEffectsForUpgrade(effects);
    } else if (effectiveDefinition.upgrade) {
      effects = effectiveDefinition.upgrade.effects;
    } else {
      effects = boostEffectsForUpgrade(effects);
    }
  }
  const attackBonus =
    effectiveDefinition.type === "ATTACK"
      ? Math.max(0, metaBonuses?.attackBonus ?? 0)
      : 0;
  if (attackBonus > 0) {
    effects = effects.map((effect) =>
      effect.type === "DAMAGE"
        ? { ...effect, value: effect.value + attackBonus }
        : effect
    );
  }

  energyCost += state.playerDisruption?.extraCardCost ?? 0;
  energyCost += getArchivistCardCostModifier(state, instanceId);
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

  if (def.type === "ATTACK") {
    current = registerChapterGuardianAttackCardPlayed(current);
  }
  if (inkCost > 0) {
    current = registerChapterGuardianInkSpent(current, inkCost);
  }

  // Resolve effects
  const target = targetingToEffectTarget(def.targeting, targetId);
  current = resolveEffects(
    current,
    effects,
    {
      source: "player",
      target,
      drawReason: `CARD:${def.id}`,
      cardDefs,
      sourceCardInstanceId: instanceId,
    },
    rng
  );
  current = synchronizeArchivistCombatState(current);

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
    effectiveDefinition.type === "POWER" ||
    effects.some((e) => e.type === "EXHAUST") ||
    (Boolean(state.relicFlags?.statusCursePlayExhaust) &&
      (effectiveDefinition.type === "STATUS" ||
        effectiveDefinition.type === "CURSE"));
  if (shouldExhaust) {
    const keepChance = Math.min(
      100,
      Math.max(0, metaBonuses?.exhaustKeepChance ?? 0)
    );
    const keepCard = keepChance > 0 && rng.next() * 100 < keepChance;
    current = keepCard
      ? moveCardToDiscard(current, instanceId)
      : moveCardToExhaust(current, instanceId);
  } else {
    current = moveCardToDiscard(current, instanceId);
  }

  const playCountKey = `card_play_count:${def.id}`;
  const currentPlayCount = Math.max(
    0,
    Math.floor(current.relicCounters?.[playCountKey] ?? 0)
  );
  current = {
    ...current,
    relicCounters: {
      ...(current.relicCounters ?? {}),
      [playCountKey]: currentPlayCount + 1,
    },
  };

  return current;
}
