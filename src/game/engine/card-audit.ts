import type { CardDefinition } from "../schemas/cards";

type JsonLike =
  | null
  | string
  | number
  | boolean
  | JsonLike[]
  | { [key: string]: JsonLike };

function normalizeCardForSignature(card: CardDefinition): JsonLike {
  return {
    type: card.type,
    energyCost: card.energyCost,
    inkCost: card.inkCost,
    targeting: card.targeting,
    effects: card.effects,
    onRandomDiscardEffects: card.onRandomDiscardEffects ?? [],
    inkedVariant: card.inkedVariant
      ? {
          inkMarkCost: card.inkedVariant.inkMarkCost,
          effects: card.inkedVariant.effects,
          upgradedEffects: card.inkedVariant.upgradedEffects ?? null,
        }
      : null,
    upgrade: card.upgrade
      ? {
          energyCost: card.upgrade.energyCost ?? null,
          effects: card.upgrade.effects,
          onRandomDiscardEffects: card.upgrade.onRandomDiscardEffects ?? [],
        }
      : null,
  };
}

function maskNumbers(value: JsonLike): JsonLike {
  if (typeof value === "number") return "#";
  if (Array.isArray(value)) {
    return value.map((entry) => maskNumbers(entry));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, maskNumbers(entry)])
    );
  }
  return value;
}

export function stableSerialize(value: JsonLike): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value).sort(([left], [right]) =>
      left.localeCompare(right)
    );
    return `{${entries
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function buildCardExactMechanicSignature(card: CardDefinition): string {
  return stableSerialize(normalizeCardForSignature(card));
}

export function buildCardPatternSignature(card: CardDefinition): string {
  return stableSerialize(maskNumbers(normalizeCardForSignature(card)));
}
