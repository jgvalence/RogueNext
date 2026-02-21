import type { CardDefinition } from "../schemas/cards";
import type { Effect } from "../schemas/effects";

export function boostEffectsForUpgrade(effects: Effect[]): Effect[] {
  return effects.map((effect) => {
    switch (effect.type) {
      case "DAMAGE":
      case "BLOCK":
      case "HEAL":
      case "GAIN_INK":
        return {
          ...effect,
          value: Math.max(Math.floor(effect.value * 1.5), effect.value + 1),
        };
      case "DRAW_CARDS":
      case "GAIN_ENERGY":
      case "GAIN_STRENGTH":
      case "GAIN_FOCUS":
      case "APPLY_BUFF":
      case "APPLY_DEBUFF":
        return { ...effect, value: effect.value + 1 };
      default:
        return effect;
    }
  });
}

function buildUpgradedDescriptionFromEffects(def: CardDefinition): string {
  const boostedEffects = boostEffectsForUpgrade(def.effects);
  let description = def.description;

  for (let i = 0; i < def.effects.length; i += 1) {
    const base = def.effects[i];
    const boosted = boostedEffects[i];
    if (!base || !boosted || base.value === boosted.value) continue;
    description = description.replace(
      new RegExp(`\\b${base.value}\\b`),
      String(boosted.value)
    );
  }

  return description;
}

export function buildUpgradedCardDefinition(def: CardDefinition): CardDefinition {
  if (def.upgrade) {
    return {
      ...def,
      description: def.upgrade.description,
      energyCost:
        def.upgrade.energyCost !== undefined
          ? def.upgrade.energyCost
          : def.energyCost,
      effects: def.upgrade.effects,
    };
  }

  return {
    ...def,
    description: buildUpgradedDescriptionFromEffects(def),
    effects: boostEffectsForUpgrade(def.effects),
  };
}
