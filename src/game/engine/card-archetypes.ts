import type { CardDefinition, CardInstance } from "../schemas/cards";
import type { CardArchetypeTag } from "../schemas/enums";
import type { Effect } from "../schemas/effects";
import { buildUpgradedCardDefinition } from "./card-upgrades";

const BLOCK_EFFECT_TYPES = new Set([
  "BLOCK",
  "BLOCK_PER_CURRENT_INK",
  "BLOCK_PER_DEBUFF",
  "BLOCK_PER_EXHAUSTED_CARD",
  "EMPTY_DRAW_PILE_BLOCK",
  "EXACT_ENERGY_REWARD",
]);

const INK_EFFECT_TYPES = new Set([
  "GAIN_INK",
  "DRAIN_INK",
  "BLOCK_PER_CURRENT_INK",
  "DAMAGE_PER_CURRENT_INK",
  "RHYTHM_REWARD",
  "EXACT_INK_REWARD",
]);

const EXHAUST_EFFECT_TYPES = new Set([
  "EXHAUST",
  "BLOCK_PER_EXHAUSTED_CARD",
  "DAMAGE_PER_EXHAUSTED_CARD",
  "APPLY_BUFF_PER_EXHAUSTED_CARD",
]);

function collectCardEffects(
  card: CardDefinition,
  includeUpgrades: boolean
): Effect[] {
  return [
    ...card.effects,
    ...(card.onRandomDiscardEffects ?? []),
    ...(card.inkedVariant?.effects ?? []),
    ...(includeUpgrades ? (card.upgrade?.effects ?? []) : []),
    ...(includeUpgrades ? (card.upgrade?.onRandomDiscardEffects ?? []) : []),
    ...(includeUpgrades ? (card.inkedVariant?.upgradedEffects ?? []) : []),
    ...(includeUpgrades
      ? (card.upgradeBranches?.flatMap((branch) => [
          ...branch.effects,
          ...(branch.onRandomDiscardEffects ?? []),
        ]) ?? [])
      : []),
  ];
}

function inferTagFromEffect(effect: Effect, tags: Set<CardArchetypeTag>): void {
  if (effect.type === "DOUBLE_POISON" || effect.buff === "POISON_BURST")
    tags.add("POISON");
  if (
    effect.type === "PROPAGATE_DOT" ||
    effect.type === "DAMAGE_PER_DOT_STACKS"
  ) {
    tags.add("POISON");
    tags.add("BLEED");
  }
  if (effect.buff === "BLEED" || effect.scalingBuff === "BLEED") {
    tags.add("BLEED");
  }

  if (effect.buff === "POISON" || effect.scalingBuff === "POISON") {
    tags.add("POISON");
  }

  if (
    BLOCK_EFFECT_TYPES.has(effect.type) ||
    effect.buff === "WARD" ||
    effect.scalingBuff === "WARD"
  ) {
    tags.add("BLOCK");
  }

  if (effect.type === "HEAL") {
    tags.add("HEAL");
  }

  if (INK_EFFECT_TYPES.has(effect.type)) {
    tags.add("INK");
  }

  if (
    EXHAUST_EFFECT_TYPES.has(effect.type) ||
    effect.buff === "EXHAUST_ENERGY" ||
    effect.scalingBuff === "EXHAUST_ENERGY"
  ) {
    tags.add("EXHAUST");
  }

  if (
    effect.type === "DRAW_CARDS" ||
    effect.type === "ARCHIVE_AND_DRAW" ||
    effect.type === "DAMAGE_PER_DRAWN_THIS_TURN"
  ) {
    tags.add("DRAW");
  }

  if (
    effect.type === "GAIN_STRENGTH" ||
    effect.buff === "STRENGTH" ||
    effect.scalingBuff === "STRENGTH"
  ) {
    tags.add("STRENGTH");
  }
}

export function getCardArchetypeTags(
  card: CardDefinition,
  includeUpgrades = true
): CardArchetypeTag[] {
  const tags = new Set<CardArchetypeTag>(card.archetypeTags ?? []);

  if (card.inkCost > 0) {
    tags.add("INK");
  }

  for (const effect of collectCardEffects(card, includeUpgrades)) {
    inferTagFromEffect(effect, tags);
  }

  return [...tags];
}

export function getDeckArchetypeCounts(
  deck: CardInstance[],
  cardDefs: Map<string, CardDefinition>
): Partial<Record<CardArchetypeTag, number>> {
  const counts: Partial<Record<CardArchetypeTag, number>> = {};

  for (const card of deck) {
    const definition = cardDefs.get(card.definitionId);
    if (!definition) continue;

    const effective = card.upgraded
      ? buildUpgradedCardDefinition(definition, card.upgradeBranch ?? "A")
      : definition;
    for (const tag of getCardArchetypeTags(effective, false)) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }

  return counts;
}
