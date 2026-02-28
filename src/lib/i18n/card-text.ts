import type { TFunction } from "i18next";
import type { CardDefinition } from "@/game/schemas/cards";
import type { BuffType, EffectType, Targeting } from "@/game/schemas/enums";
import type { Effect } from "@/game/schemas/effects";
import { getCurrentLocale, i18n } from "@/lib/i18n";

function effectHasAllEnemyTarget(targeting: Targeting): boolean {
  return targeting === "ALL_ENEMIES";
}

export function localizeCardType(type: string, t: TFunction): string {
  return t(`gameCard.type.${type}`, type);
}

export function localizeBuffName(
  buff: BuffType | string | undefined,
  t: TFunction
): string {
  if (!buff) return "status";
  return t(`buff.${buff}.label`, buff);
}

function formatEffect(
  effect: Effect,
  targeting: Targeting,
  t: TFunction
): string {
  const allEnemies = effectHasAllEnemyTarget(targeting);
  const buffLabel = localizeBuffName(effect.buff, t);

  switch (effect.type) {
    case "DAMAGE":
      return allEnemies
        ? t("gameCard.effect.damageAll", { value: effect.value })
        : t("gameCard.effect.damage", { value: effect.value });
    case "DAMAGE_EQUAL_BLOCK":
      return t("gameCard.effect.damageEqualBlock");
    case "BLOCK":
      return t("gameCard.effect.block", { value: effect.value });
    case "HEAL":
      return t("gameCard.effect.heal", { value: effect.value });
    case "DRAW_CARDS":
      return t("gameCard.effect.draw", { value: effect.value });
    case "DOUBLE_POISON":
      return t("gameCard.effect.doublePoison");
    case "GAIN_ENERGY":
      return t("gameCard.effect.gainEnergy", { value: effect.value });
    case "GAIN_INK":
      return t("gameCard.effect.gainInk", { value: effect.value });
    case "GAIN_STRENGTH":
      return t("gameCard.effect.gainStrength", { value: effect.value });
    case "GAIN_FOCUS":
      return t("gameCard.effect.gainFocus", { value: effect.value });
    case "APPLY_DEBUFF":
      return allEnemies
        ? t("gameCard.effect.applyDebuffAll", {
            value: effect.value,
            buff: buffLabel,
          })
        : t("gameCard.effect.applyDebuff", {
            value: effect.value,
            buff: buffLabel,
          });
    case "APPLY_BUFF":
      return t("gameCard.effect.applyBuff", {
        value: effect.value,
        buff: buffLabel,
      });
    case "DRAIN_INK":
      return t("gameCard.effect.drainInk", { value: effect.value });
    case "EXHAUST":
      return t("gameCard.effect.exhaust");
    case "ADD_CARD_TO_DRAW":
      return t("gameCard.effect.addToDraw");
    case "ADD_CARD_TO_DISCARD":
      return t("gameCard.effect.addToDiscard");
    case "FREEZE_HAND_CARDS":
      return t("gameCard.effect.freezeHandCards", { value: effect.value });
    case "NEXT_DRAW_TO_DISCARD_THIS_TURN":
      return t("gameCard.effect.nextDrawToDiscardThisTurn");
    case "DISABLE_INK_POWER_THIS_TURN":
      return t("gameCard.effect.disableInkPowerThisTurn", {
        power: effect.inkPower ?? "ALL",
      });
    case "INCREASE_CARD_COST_THIS_TURN":
      return t("gameCard.effect.increaseCardCostThisTurn", {
        value: effect.value,
      });
    case "INCREASE_CARD_COST_NEXT_TURN":
      return t("gameCard.effect.increaseCardCostNextTurn", {
        value: effect.value,
      });
    case "REDUCE_DRAW_THIS_TURN":
      return t("gameCard.effect.reduceDrawThisTurn", { value: effect.value });
    case "REDUCE_DRAW_NEXT_TURN":
      return t("gameCard.effect.reduceDrawNextTurn", { value: effect.value });
    case "FORCE_DISCARD_RANDOM":
      return t("gameCard.effect.forceDiscardRandom", { value: effect.value });
    default:
      return `${effect.type as EffectType} ${effect.value}`;
  }
}

function buildFromEffects(
  effects: Effect[],
  targeting: Targeting,
  baseDescription: string,
  t: TFunction
): string {
  const parts = effects.map((effect) => formatEffect(effect, targeting, t));

  // Keep gameplay flags present in legacy text when missing in effect array.
  if (/unplayable/i.test(baseDescription)) {
    parts.push(t("gameCard.effect.unplayable"));
  }
  if (
    /exhaust/i.test(baseDescription) &&
    !parts.includes(t("gameCard.effect.exhaust"))
  ) {
    parts.push(t("gameCard.effect.exhaust"));
  }

  if (parts.length === 0) {
    return baseDescription;
  }

  return `${parts.join(". ")}.`;
}

export function localizeCardName(
  definition: CardDefinition,
  _t: TFunction
): string {
  const locale = getCurrentLocale();
  const localizedName = i18n.getResource(
    locale,
    "translation",
    `cards.${definition.id}.name`
  );
  if (typeof localizedName === "string" && localizedName.trim().length > 0) {
    return localizedName;
  }
  return definition.name;
}

export function localizeCardDescription(
  definition: CardDefinition,
  t: TFunction
): string {
  return buildFromEffects(
    definition.effects,
    definition.targeting,
    definition.description,
    t
  );
}

export function localizeInkedDescription(
  definition: CardDefinition,
  t: TFunction
): string | null {
  if (!definition.inkedVariant) {
    return null;
  }
  return buildFromEffects(
    definition.inkedVariant.effects,
    definition.targeting,
    definition.inkedVariant.description,
    t
  );
}
