import { histoireDefinitions } from "../data/histoires";
import type { MetaBonus } from "../schemas/meta";
import { en } from "../../lib/i18n/messages/en";

type Locale = "fr" | "en";

export interface StoryDescriptionAuditIssue {
  storyId: string;
  locale: Locale;
  bonusType: MetaBonus["type"];
  message: string;
}

type DescriptionRule = {
  fr: RegExp[];
  en: RegExp[];
};

const DESCRIPTION_RULES: Record<MetaBonus["type"], DescriptionRule> = {
  EXTRA_DRAW: {
    fr: [/pioche.*par tour/],
    en: [/drawn?.*each turn|drawn?.*per turn/],
  },
  EXTRA_ENERGY_MAX: {
    fr: [/energie max/],
    en: [/max energy/],
  },
  EXTRA_INK_MAX: {
    fr: [/ink max/],
    en: [/max ink/],
  },
  INK_PER_CARD_CHANCE: {
    fr: [/chance.*ink.*carte/],
    en: [/chance to gain ink when playing a card/],
  },
  INK_PER_CARD_VALUE: {
    fr: [/encre.*proc|ink quand le proc/],
    en: [/ink when proc triggers/],
  },
  STARTING_INK: {
    fr: [/commence chaque combat avec .*ink/],
    en: [/start each combat with .*ink/],
  },
  STARTING_BLOCK: {
    fr: [
      /block.*debut de chaque combat/,
      /commence chaque combat avec .*block/,
      /\+.*block/,
    ],
    en: [
      /start each combat with .*block/,
      /\+.*starting block/,
      /block at the start of each combat/,
      /\+.*additional block/,
    ],
  },
  STARTING_STRENGTH: {
    fr: [/force de depart|force au debut de chaque combat|strength de depart/],
    en: [/starting strength|strength at the start of each combat/],
  },
  STARTING_FOCUS: {
    fr: [/focus/],
    en: [/focus/],
  },
  STARTING_REGEN: {
    fr: [/debut de chaque tour/],
    en: [/start of each turn/],
  },
  FIRST_HIT_DAMAGE_REDUCTION: {
    fr: [/premier coup subi.*degats en moins/],
    en: [/first hit taken.*less damage/],
  },
  EXTRA_HP: {
    fr: [/hp max/],
    en: [/max hp/],
  },
  EXTRA_HAND_AT_START: {
    fr: [/en main/],
    en: [/in hand/],
  },
  STARTING_GOLD: {
    fr: [/or de depart/],
    en: [/starting gold/],
  },
  EXTRA_CARD_REWARD_CHOICES: {
    fr: [/choix.*recompenses? de cartes?/],
    en: [/choice in card rewards|card reward choices/],
  },
  UNLOCK_POWER_SLOT: {
    fr: [/deuxieme pouvoir|troisieme pouvoir/],
    en: [/second power slot|third power slot/],
  },
  HEAL_AFTER_COMBAT: {
    fr: [/pv max.*apres chaque combat/],
    en: [/max hp after combat/],
  },
  HEAL_AFTER_COMBAT_FLAT: {
    fr: [/pv.*apres chaque combat/],
    en: [/hp.*after each combat/],
  },
  EXHAUST_KEEP_CHANCE: {
    fr: [/chance.*ne pas .*exhaust/],
    en: [/chance.*not to be exhausted|chance to not exhaust a card/],
  },
  SURVIVAL_ONCE: {
    fr: [/survit a 1 hp une fois par run/],
    en: [/survive at 1 hp once per run/],
  },
  FREE_UPGRADE_PER_RUN: {
    fr: [/ameliorer une carte gratuitement/],
    en: [/upgrade one card for free/],
  },
  ATTACK_BONUS: {
    fr: [/degats.*cartes? attaque|degats de base.*attaque/],
    en: [
      /damage on all attack cards/,
      /attack card damage/,
      /base damage on all attack cards/,
      /damage on attack cards/,
    ],
  },
  ALLY_SLOTS: {
    fr: [/emplacement allie|systeme d.?allies?/],
    en: [/ally slot|ally system/],
  },
  RELIC_DISCOUNT: {
    fr: [/reliques.*moins cher/],
    en: [/relics cost .*less/],
  },
  LOOT_LUCK: {
    fr: [/qualite de butin/],
    en: [/loot quality/],
  },
  STARTING_RARE_CARD: {
    fr: [/carte rare aleatoire/],
    en: [/random rare card/],
  },
};

function normalizeAuditText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function getEnglishStoryDescription(
  storyId: string,
  fallback: string
): string {
  const stories = (en.stories ?? {}) as Record<string, { description?: string }>;
  return stories[storyId]?.description ?? fallback;
}

function matchesRule(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

export function auditStoryDescriptions(): StoryDescriptionAuditIssue[] {
  const issues: StoryDescriptionAuditIssue[] = [];

  for (const story of histoireDefinitions) {
    const rule = DESCRIPTION_RULES[story.bonus.type];
    const frText = normalizeAuditText(story.description);
    const enText = normalizeAuditText(
      getEnglishStoryDescription(story.id, story.description)
    );

    if (!matchesRule(frText, rule.fr)) {
      issues.push({
        storyId: story.id,
        locale: "fr",
        bonusType: story.bonus.type,
        message: "La description FR ne semble pas decrire le bonus reel.",
      });
    }

    if (!matchesRule(enText, rule.en)) {
      issues.push({
        storyId: story.id,
        locale: "en",
        bonusType: story.bonus.type,
        message: "The EN description does not seem to describe the real bonus.",
      });
    }
  }

  return issues;
}
