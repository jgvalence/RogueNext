import type { CardDefinition, CardInstance } from "../schemas/cards";
import type { CardArchetypeTag } from "../schemas/enums";
import type { Effect } from "../schemas/effects";

const BLOCK_EFFECT_TYPES = new Set([
  "BLOCK",
  "BLOCK_PER_CURRENT_INK",
  "BLOCK_PER_DEBUFF",
  "BLOCK_PER_EXHAUSTED_CARD",
]);

const INK_EFFECT_TYPES = new Set([
  "GAIN_INK",
  "DRAIN_INK",
  "BLOCK_PER_CURRENT_INK",
  "DAMAGE_PER_CURRENT_INK",
]);

const EXHAUST_EFFECT_TYPES = new Set([
  "EXHAUST",
  "BLOCK_PER_EXHAUSTED_CARD",
  "DAMAGE_PER_EXHAUSTED_CARD",
  "APPLY_BUFF_PER_EXHAUSTED_CARD",
]);

function collectCardEffects(card: CardDefinition): Effect[] {
  return [
    ...card.effects,
    ...(card.onRandomDiscardEffects ?? []),
    ...(card.inkedVariant?.effects ?? []),
    ...(card.upgrade?.effects ?? []),
    ...(card.upgrade?.onRandomDiscardEffects ?? []),
    ...(card.inkedVariant?.upgradedEffects ?? []),
  ];
}

function inferTagFromEffect(effect: Effect, tags: Set<CardArchetypeTag>): void {
  if (effect.buff === "BLEED" || effect.scalingBuff === "BLEED") {
    tags.add("BLEED");
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
}

export function getCardArchetypeTags(card: CardDefinition): CardArchetypeTag[] {
  const tags = new Set<CardArchetypeTag>(card.archetypeTags ?? []);

  if (card.inkCost > 0) {
    tags.add("INK");
  }

  for (const effect of collectCardEffects(card)) {
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

    for (const tag of getCardArchetypeTags(definition)) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }

  return counts;
}
