export type AllyTextLocale = "en" | "fr";

export interface LocalizedAllyTextEntry {
  name: string;
}

const ALLY_TEXT_RESOURCES: Record<
  AllyTextLocale,
  Record<string, LocalizedAllyTextEntry>
> = {
  en: {},
  fr: {
    scribe_apprentice: { name: "Apprenti scribe" },
    ward_knight: { name: "Chevalier gardien" },
    ink_familiar: { name: "Familier d'encre" },
    margin_oracle: { name: "Oracle de marge" },
    index_raven: { name: "Corbeau de l'index" },
    copyist_mummy: { name: "Momie copiste" },
    venom_familiar: { name: "Familier venimeux" },
    forbidden_archivist: { name: "Archiviste interdit" },
  },
};

const ALLY_ABILITY_TEXT_RESOURCES: Record<
  AllyTextLocale,
  Record<string, string>
> = {
  en: {},
  fr: {
    "Paper Volley": "Volee de pages",
    "Ink Advice": "Conseil d'encre",
    "Shielded Slash": "Entaille protegee",
    "Battle Lesson": "Lecon de bataille",
    Nibble: "Grignotement",
    "Quick Notes": "Notes rapides",
    Omen: "Presage",
    "Clear Sight": "Regard net",
    "Annotated Beak": "Bec annote",
    "Troubling Cry": "Cri trouble",
    "Dry Bandage": "Bandelette seche",
    "Slow Rite": "Rite lent",
    "Black Bite": "Morsure noire",
    "Restless Twitch": "Agitation",
    "Forbidden Page": "Page interdite",
    "Risky Note": "Note risquee",
  },
};

export function getAllyTextEntry(
  locale: AllyTextLocale,
  allyId: string
): LocalizedAllyTextEntry | undefined {
  return ALLY_TEXT_RESOURCES[locale][allyId];
}

export function getAllyAbilityText(
  locale: AllyTextLocale,
  abilityName: string
): string | undefined {
  return ALLY_ABILITY_TEXT_RESOURCES[locale][abilityName];
}
