import type { InkPowerType } from "../schemas/enums";

export interface CharacterDefinition {
  id: string;
  /** Clés i18n : characters.<id>.name / .description */
  powers: [InkPowerType, InkPowerType, InkPowerType]; // slot 1, 2, 3
  starterDeckIds: string[];
  unlockCondition?: { totalRuns: number };
}

export const characterDefinitions: CharacterDefinition[] = [
  {
    id: "scribe",
    powers: ["CALLIGRAPHIE", "ENCRE_NOIRE", "SEAL"],
    starterDeckIds: [
      "strike",
      "strike",
      "strike",
      "strike",
      "defend",
      "defend",
      "defend",
      "ink_surge",
      "trace_tranchant",
      "parchemin_de_soin",
      "annotation",
    ],
    // toujours disponible
  },
  {
    id: "bibliothecaire",
    powers: ["VISION", "INDEX", "SILENCE"],
    starterDeckIds: [
      "strike",
      "strike",
      "strike",
      "strike",
      "defend",
      "defend",
      "ink_surge",
      "ink_surge",
      "catalogue",
      "chuchotement",
      "marque_page",
    ],
    unlockCondition: { totalRuns: 2 },
  },
  {
    id: "griot",
    powers: ["VENIN", "SAIGNEMENT", "GRISGRIS"],
    starterDeckIds: [
      "strike",
      "strike",
      "strike",
      "strike",
      "defend",
      "defend",
      "ink_surge",
      "piqure",
      "piqure",
      "rythme_mortel",
      "masque_de_bois",
    ],
    unlockCondition: { totalRuns: 5 },
  },
  {
    id: "fou",
    powers: ["DOUBLE_MISE", "PACTE_SANG", "FRENETIQUE"],
    starterDeckIds: [
      "strike",
      "strike",
      "strike",
      "defend",
      "ink_surge",
      "frappe_folle",
      "frappe_folle",
      "soif_de_puissance",
      "rage_aveugle",
      "rage_aveugle",
      "coup_de_grace_starter",
    ],
    unlockCondition: { totalRuns: 10 },
  },
];

export function getCharacterById(id: string): CharacterDefinition {
  return (
    characterDefinitions.find((c) => c.id === id) ?? characterDefinitions[0]!
  );
}

export function getAvailableCharacters(
  totalRuns: number
): CharacterDefinition[] {
  return characterDefinitions.filter(
    (c) => !c.unlockCondition || totalRuns >= c.unlockCondition.totalRuns
  );
}
