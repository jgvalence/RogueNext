import type { Histoire } from "../schemas/meta";

/**
 * Catalogue statique des 45 Histoires de la Bibliothèque.
 * 5 histoires par biome (2 tier 1, 2 tier 2, 1 tier 3).
 * Chaque Histoire débloque un bonus permanent pour les runs suivants.
 */
export const histoireDefinitions: Histoire[] = [
  // =========================================================================
  // LIBRARY – Pages
  // =========================================================================
  {
    id: "encyclopedie_du_savoir",
    titre: "Encyclopédie du Savoir",
    biome: "LIBRARY",
    tier: 1,
    cout: { PAGES: 8 },
    prerequis: [],
    bonus: { type: "EXTRA_DRAW", value: 1 },
    description:
      "Un traité exhaustif consignant les techniques de mémorisation rapide. +1 carte piochée par tour.",
    visuel: "livre",
  },
  {
    id: "traite_de_lenergie",
    titre: "Traité de l'Énergie",
    biome: "LIBRARY",
    tier: 1,
    cout: { PAGES: 10 },
    prerequis: [],
    bonus: { type: "EXTRA_ENERGY_MAX", value: 1 },
    description:
      "Un manuel hermétique sur la canalisation de l'énergie vitale. +1 énergie max.",
    visuel: "grimoire",
  },
  {
    id: "grimoire_des_index",
    titre: "Grimoire des Index",
    biome: "LIBRARY",
    tier: 2,
    cout: { PAGES: 18 },
    prerequis: ["encyclopedie_du_savoir"],
    bonus: { type: "EXTRA_HAND_AT_START", value: 2 },
    description:
      "Un système d'indexation occulte qui accélère la préparation au combat. Commence chaque combat avec 2 cartes supplémentaires en main.",
    visuel: "grimoire",
  },
  {
    id: "manuel_de_revision",
    titre: "Manuel de Révision",
    biome: "LIBRARY",
    tier: 2,
    cout: { PAGES: 20 },
    prerequis: ["traite_de_lenergie"],
    bonus: { type: "FREE_UPGRADE_PER_RUN" },
    description:
      "Des annotations marginales qui permettent d'améliorer une carte gratuitement avant chaque run.",
    visuel: "livre",
  },
  {
    id: "le_codex_infini",
    titre: "Le Codex Infini",
    biome: "LIBRARY",
    tier: 3,
    cout: { PAGES: 55, LAURIERS: 8 },
    prerequis: ["grimoire_des_index", "manuel_de_revision"],
    bonus: { type: "EXTRA_DRAW", value: 1 },
    description:
      "L'œuvre maîtresse de la Bibliothèque – un codex qui se réécrit lui-même. +1 carte piochée supplémentaire et récompenses de cartes avec un choix de plus.",
    visuel: "grimoire",
  },

  // =========================================================================
  // VIKING – Runes
  // =========================================================================
  {
    id: "saga_de_ragnar",
    titre: "Saga de Ragnar",
    auteur: "Anonyme",
    biome: "VIKING",
    tier: 1,
    cout: { RUNES: 8 },
    prerequis: [],
    bonus: { type: "STARTING_STRENGTH", value: 1 },
    description:
      "Les exploits de Ragnar Lodbrok mis en vers. +1 Force au début de chaque combat.",
    visuel: "parchemin",
  },
  {
    id: "edda_des_berserkers",
    titre: "Edda des Berserkers",
    biome: "VIKING",
    tier: 1,
    cout: { RUNES: 10 },
    prerequis: [],
    bonus: { type: "EXTRA_HP", value: 15 },
    description: "Les chants sacrés des guerriers frénétiques. +15 HP max.",
    visuel: "parchemin",
  },
  {
    id: "chant_de_skald",
    titre: "Chant de Skald",
    biome: "VIKING",
    tier: 2,
    cout: { RUNES: 18 },
    prerequis: ["saga_de_ragnar"],
    bonus: { type: "ATTACK_BONUS", value: 1 },
    description:
      "Poèmes de bataille récités avant chaque assaut. +1 dégâts de base sur toutes les cartes Attaque.",
    visuel: "parchemin",
  },
  {
    id: "runes_du_valhalla",
    titre: "Runes du Valhalla",
    biome: "VIKING",
    tier: 2,
    cout: { RUNES: 20 },
    prerequis: ["edda_des_berserkers"],
    bonus: { type: "SURVIVAL_ONCE" },
    description:
      "Des runes gravées par Odin lui-même. Survit à 1 HP une fois par run.",
    visuel: "tablette",
  },
  {
    id: "le_poeme_de_beowulf",
    titre: "Le Poème de Beowulf",
    biome: "VIKING",
    tier: 3,
    cout: { RUNES: 55, PAGES: 8 },
    prerequis: ["chant_de_skald", "runes_du_valhalla"],
    bonus: { type: "STARTING_STRENGTH", value: 2 },
    description:
      "L'épopée du grand héros germanique. +2 Force de départ et les ennemis élites ont 15% de HP en moins.",
    visuel: "livre",
  },

  // =========================================================================
  // GREEK – Lauriers
  // =========================================================================
  {
    id: "l_odyssee",
    titre: "L'Odyssée",
    auteur: "Homère",
    biome: "GREEK",
    tier: 1,
    cout: { LAURIERS: 8 },
    prerequis: [],
    bonus: { type: "STARTING_GOLD", value: 25 },
    description:
      "Le récit du retour d'Ulysse, plein de ruses et de richesses. +25 or de départ à chaque run.",
    visuel: "parchemin",
  },
  {
    id: "la_republique",
    titre: "La République",
    auteur: "Platon",
    biome: "GREEK",
    tier: 1,
    cout: { LAURIERS: 10 },
    prerequis: [],
    bonus: { type: "EXTRA_CARD_REWARD_CHOICES", value: 1 },
    description:
      "La philosophie politique de Platon appliquée au choix stratégique. +1 choix lors des récompenses de cartes.",
    visuel: "livre",
  },
  {
    id: "les_travaux_d_heracles",
    titre: "Les Travaux d'Héraclès",
    biome: "GREEK",
    tier: 2,
    cout: { LAURIERS: 18 },
    prerequis: ["l_odyssee"],
    bonus: { type: "RELIC_DISCOUNT", value: 20 },
    description:
      "Douze épreuves qui enseignent l'art de négocier avec les dieux. Les reliques coûtent 20% moins cher chez le marchand.",
    visuel: "parchemin",
  },
  {
    id: "hymnes_homeriques",
    titre: "Hymnes Homériques",
    auteur: "Homère",
    biome: "GREEK",
    tier: 2,
    cout: { LAURIERS: 20 },
    prerequis: ["la_republique"],
    bonus: { type: "STARTING_RARE_CARD" },
    description:
      "Des hymnes aux dieux de l'Olympe qui attirent les faveurs divines. Commence chaque run avec une carte rare aléatoire dans le deck.",
    visuel: "parchemin",
  },
  {
    id: "le_banquet",
    titre: "Le Banquet",
    auteur: "Platon",
    biome: "GREEK",
    tier: 3,
    cout: { LAURIERS: 55, PAGES: 8 },
    prerequis: ["les_travaux_d_heracles", "hymnes_homeriques"],
    bonus: { type: "EXTRA_CARD_REWARD_CHOICES", value: 1 },
    description:
      "Le dialogue sur l'amour et la sagesse. Toutes les récompenses offrent un choix supplémentaire.",
    visuel: "livre",
  },

  // =========================================================================
  // EGYPTIAN – Glyphes
  // =========================================================================
  {
    id: "livre_des_morts",
    titre: "Livre des Morts",
    biome: "EGYPTIAN",
    tier: 1,
    cout: { GLYPHES: 8 },
    prerequis: [],
    bonus: { type: "EXTRA_INK_MAX", value: 2 },
    description:
      "Le guide égyptien de l'au-delà, riche en formules magiques. +2 Ink max.",
    visuel: "parchemin",
  },
  {
    id: "hymne_a_re",
    titre: "Hymne à Rê",
    biome: "EGYPTIAN",
    tier: 1,
    cout: { GLYPHES: 10 },
    prerequis: [],
    bonus: { type: "INK_PER_CARD_CHANCE", value: 35 },
    description:
      "Un hymne au dieu soleil qui infuse chaque geste d'énergie divine. +35% de chance de gain d'Ink par carte jouée.",
    visuel: "tablette",
  },
  {
    id: "textes_des_pyramides",
    titre: "Textes des Pyramides",
    biome: "EGYPTIAN",
    tier: 2,
    cout: { GLYPHES: 18 },
    prerequis: ["livre_des_morts"],
    bonus: { type: "UNLOCK_INK_POWER", power: "LOST_CHAPTER" },
    description:
      "Les plus anciens textes religieux de l'humanité, gravés dans la pierre. Débloque le pouvoir d'Ink LOST_CHAPTER.",
    visuel: "tablette",
  },
  {
    id: "papyrus_d_ani",
    titre: "Papyrus d'Ani",
    biome: "EGYPTIAN",
    tier: 2,
    cout: { GLYPHES: 20 },
    prerequis: ["hymne_a_re"],
    bonus: { type: "STARTING_INK", value: 3 },
    description:
      "Le célèbre papyrus funéraire d'Ani, chargé d'énergie mystique. Commence chaque combat avec 3 Ink.",
    visuel: "parchemin",
  },
  {
    id: "le_rituel_du_soleil",
    titre: "Le Rituel du Soleil",
    biome: "EGYPTIAN",
    tier: 3,
    cout: { GLYPHES: 55, PAGES: 8 },
    prerequis: ["textes_des_pyramides", "papyrus_d_ani"],
    bonus: { type: "UNLOCK_INK_POWER", power: "SEAL" },
    description:
      "Le rituel secret qui permet de sceller la réalité elle-même. Débloque le pouvoir d'Ink SEAL et +3 Ink max supplémentaires.",
    visuel: "tablette",
  },

  // =========================================================================
  // AZTEC – Obsidienne
  // =========================================================================
  {
    id: "codex_fejerváry",
    titre: "Codex Féjerváry",
    biome: "AZTEC",
    tier: 1,
    cout: { OBSIDIENNE: 8 },
    prerequis: [],
    bonus: { type: "EXTRA_HP", value: 10 },
    description:
      "Le codex divinatoire aztèque, source de résistance corporelle. +10 HP max.",
    visuel: "tablette",
  },
  {
    id: "calendrier_de_pierre",
    titre: "Calendrier de Pierre",
    biome: "AZTEC",
    tier: 1,
    cout: { OBSIDIENNE: 10 },
    prerequis: [],
    bonus: { type: "HEAL_AFTER_COMBAT_FLAT", value: 3 },
    description:
      "La Piedra del Sol révèle les cycles de régénération. Récupère 3 PV après chaque combat.",
    visuel: "tablette",
  },
  {
    id: "chant_de_quetzalcoatl",
    titre: "Chant de Quetzalcoatl",
    biome: "AZTEC",
    tier: 2,
    cout: { OBSIDIENNE: 18 },
    prerequis: ["codex_fejerváry"],
    bonus: { type: "EXTRA_HP", value: 10 },
    description:
      "L'hymne au Serpent à Plumes, symbole de renaissance. +10 HP max supplémentaires.",
    visuel: "parchemin",
  },
  {
    id: "rite_du_soleil_noir",
    titre: "Rite du Soleil Noir",
    biome: "AZTEC",
    tier: 2,
    cout: { OBSIDIENNE: 20 },
    prerequis: ["calendrier_de_pierre"],
    bonus: { type: "HEAL_AFTER_COMBAT_FLAT", value: 3 },
    description:
      "Le rituel qui honore Tezcatlipoca, maître du miroir sombre. +3 PV récupérés supplémentaires après chaque combat.",
    visuel: "tablette",
  },
  {
    id: "le_sacrifice_cosmique",
    titre: "Le Sacrifice Cosmique",
    biome: "AZTEC",
    tier: 3,
    cout: { OBSIDIENNE: 55, RUNES: 8 },
    prerequis: ["chant_de_quetzalcoatl", "rite_du_soleil_noir"],
    bonus: { type: "EXTRA_HP", value: 10 },
    description:
      "Le sacrifice ultime qui maintient le soleil en mouvement. +10 HP max et les boss ont une chance de dropper une relique supplémentaire.",
    visuel: "tablette",
  },

  // =========================================================================
  // LOVECRAFTIAN – Fragments
  // =========================================================================
  {
    id: "necronomicon_fragment",
    titre: "Necronomicon (fragment)",
    auteur: "Abdul Alhazred",
    biome: "LOVECRAFTIAN",
    tier: 1,
    cout: { FRAGMENTS: 8 },
    prerequis: [],
    bonus: { type: "EXHAUST_KEEP_CHANCE", value: 30 },
    description:
      "Un fragment du livre maudit. Les cartes avec Exhaust ont 30% de chance de ne pas être exhaustées.",
    visuel: "grimoire",
  },
  {
    id: "journal_de_miskatonic",
    titre: "Journal de Miskatonic",
    biome: "LOVECRAFTIAN",
    tier: 1,
    cout: { FRAGMENTS: 10 },
    prerequis: [],
    bonus: { type: "STARTING_RARE_CARD" },
    description:
      "Les notes d'un chercheur de l'université de Miskatonic. Commence chaque run avec une carte rare aléatoire.",
    visuel: "livre",
  },
  {
    id: "cultes_innommables",
    titre: "Cultes Innommables",
    auteur: "Von Junzt",
    biome: "LOVECRAFTIAN",
    tier: 2,
    cout: { FRAGMENTS: 18 },
    prerequis: ["necronomicon_fragment"],
    bonus: { type: "EXHAUST_KEEP_CHANCE", value: 30 },
    description:
      "Le traité secret sur les cultes anciens. +30% de chance supplémentaire de ne pas exhaustée une carte.",
    visuel: "grimoire",
  },
  {
    id: "mondes_sans_nom",
    titre: "Mondes Sans Nom",
    biome: "LOVECRAFTIAN",
    tier: 2,
    cout: { FRAGMENTS: 20 },
    prerequis: ["journal_de_miskatonic"],
    bonus: { type: "SURVIVAL_ONCE" },
    description:
      "Une révélation sur la nature insaisissable de la réalité. Survit à 1 HP une fois par run (si non déjà obtenu via les Runes).",
    visuel: "grimoire",
  },
  {
    id: "le_signe_des_anciens",
    titre: "Le Signe des Anciens",
    biome: "LOVECRAFTIAN",
    tier: 3,
    cout: { FRAGMENTS: 55, GLYPHES: 8 },
    prerequis: ["cultes_innommables", "mondes_sans_nom"],
    bonus: { type: "EXHAUST_KEEP_CHANCE", value: 20 },
    description:
      "Le signe mystique qui permet de manipuler les lois du cosmos. Les variantes Inked coûtent 1 Ink de moins.",
    visuel: "tablette",
  },

  // =========================================================================
  // CELTIC – Ambre
  // =========================================================================
  {
    id: "mabinogion",
    titre: "Mabinogion",
    biome: "CELTIC",
    tier: 1,
    cout: { AMBRE: 8 },
    prerequis: [],
    bonus: { type: "STARTING_BLOCK", value: 3 },
    description:
      "Les contes gallois de la Première Branche. Commence chaque combat avec 3 Block.",
    visuel: "parchemin",
  },
  {
    id: "cycle_d_ulster",
    titre: "Cycle d'Ulster",
    biome: "CELTIC",
    tier: 1,
    cout: { AMBRE: 10 },
    prerequis: [],
    bonus: { type: "STARTING_REGEN", value: 1 },
    description:
      "Les épopées du héros Cú Chulainn, champion de l'Ulster. Récupère 1 HP au début de chaque tour.",
    visuel: "parchemin",
  },
  {
    id: "taliesin",
    titre: "Taliesin",
    biome: "CELTIC",
    tier: 2,
    cout: { AMBRE: 18 },
    prerequis: ["mabinogion"],
    bonus: { type: "STARTING_BLOCK", value: 3 },
    description:
      "Les poèmes du barde légendaire Taliesin. +3 Block supplémentaires au début de chaque combat.",
    visuel: "livre",
  },
  {
    id: "les_triades_galloises",
    titre: "Les Triades Galloises",
    biome: "CELTIC",
    tier: 2,
    cout: { AMBRE: 20 },
    prerequis: ["cycle_d_ulster"],
    bonus: { type: "ATTACK_BONUS", value: 1 },
    description:
      "Sagesse traditionnelle galloise organisée en triades. +1 dégâts sur les cartes Attaque.",
    visuel: "tablette",
  },
  {
    id: "le_chaudron_de_dagda",
    titre: "Le Chaudron de Dagda",
    biome: "CELTIC",
    tier: 3,
    cout: { AMBRE: 55, OBSIDIENNE: 8 },
    prerequis: ["taliesin", "les_triades_galloises"],
    bonus: { type: "STARTING_BLOCK", value: 4 },
    description:
      "Le chaudron magique qui nourrit et soigne tous ceux qui en ont besoin. +4 Block et +1 Strength de départ.",
    visuel: "grimoire",
  },

  // =========================================================================
  // RUSSIAN – Sceaux
  // =========================================================================
  {
    id: "byliny_de_ilya",
    titre: "Byliny de Ilya",
    biome: "RUSSIAN",
    tier: 1,
    cout: { SCEAUX: 8 },
    prerequis: [],
    bonus: { type: "STARTING_BLOCK", value: 4 },
    description:
      "Les chants héroïques d'Ilya Mouromets, héros du peuple russe. +4 Block au début de chaque combat.",
    visuel: "parchemin",
  },
  {
    id: "contes_de_baba_yaga",
    titre: "Contes de Baba Yaga",
    biome: "RUSSIAN",
    tier: 1,
    cout: { SCEAUX: 10 },
    prerequis: [],
    bonus: { type: "FIRST_HIT_DAMAGE_REDUCTION", value: 30 },
    description:
      "Les contes de la sorcière de la forêt russe. Le premier coup subi en combat inflige 30% de dégâts en moins.",
    visuel: "livre",
  },
  {
    id: "l_oiseau_de_feu",
    titre: "L'Oiseau de Feu",
    biome: "RUSSIAN",
    tier: 2,
    cout: { SCEAUX: 18 },
    prerequis: ["byliny_de_ilya"],
    bonus: { type: "STARTING_GOLD", value: 20 },
    description:
      "Le conte de la capture de l'oiseau mythique. +20 or de départ à chaque run.",
    visuel: "parchemin",
  },
  {
    id: "domovoi",
    titre: "Domovoi",
    biome: "RUSSIAN",
    tier: 2,
    cout: { SCEAUX: 20 },
    prerequis: ["contes_de_baba_yaga"],
    bonus: { type: "STARTING_BLOCK", value: 4 },
    description:
      "Les rituels pour s'attirer les faveurs de l'esprit protecteur du foyer. +4 Block supplémentaires.",
    visuel: "livre",
  },
  {
    id: "le_grand_livre_des_sorts",
    titre: "Le Grand Livre des Sorts",
    biome: "RUSSIAN",
    tier: 3,
    cout: { SCEAUX: 55, AMBRE: 8 },
    prerequis: ["l_oiseau_de_feu", "domovoi"],
    bonus: { type: "EXTRA_ENERGY_MAX", value: 1 },
    description:
      "Le grimoire interdit de la tradition russe. +1 énergie max et +5 Block de départ supplémentaires.",
    visuel: "grimoire",
  },

  // =========================================================================
  // AFRICAN – Masques
  // =========================================================================
  {
    id: "epopee_de_soundiata",
    titre: "Épopée de Soundiata",
    biome: "AFRICAN",
    tier: 1,
    cout: { MASQUES: 8 },
    prerequis: [],
    bonus: { type: "ALLY_SLOTS", value: 1 },
    description:
      "L'épopée fondatrice de l'Empire du Mali. Débloque le système d'alliés (1 emplacement).",
    visuel: "parchemin",
  },
  {
    id: "contes_d_anansi",
    titre: "Contes d'Anansi",
    biome: "AFRICAN",
    tier: 1,
    cout: { MASQUES: 10 },
    prerequis: [],
    bonus: { type: "EXTRA_CARD_REWARD_CHOICES", value: 1 },
    description:
      "Les ruses de l'araignée trickster, maître des histoires. +1 choix lors des récompenses de cartes.",
    visuel: "livre",
  },
  {
    id: "rites_de_passage",
    titre: "Rites de Passage",
    biome: "AFRICAN",
    tier: 2,
    cout: { MASQUES: 18 },
    prerequis: ["epopee_de_soundiata"],
    bonus: { type: "ALLY_SLOTS", value: 1 },
    description:
      "Les rituels initiatiques de nombreuses cultures africaines. +1 emplacement allié (max 2).",
    visuel: "tablette",
  },
  {
    id: "masque_de_legba",
    titre: "Masque de Légba",
    biome: "AFRICAN",
    tier: 2,
    cout: { MASQUES: 20 },
    prerequis: ["contes_d_anansi"],
    bonus: { type: "STARTING_STRENGTH", value: 1 },
    description:
      "Le masque du dieu carrefour Légba, maître des chemins. +1 Strength de départ.",
    visuel: "tablette",
  },
  {
    id: "le_griot_immortel",
    titre: "Le Griot Immortel",
    biome: "AFRICAN",
    tier: 3,
    cout: { MASQUES: 55, LAURIERS: 8 },
    prerequis: ["rites_de_passage", "masque_de_legba"],
    bonus: { type: "ALLY_SLOTS", value: 1 },
    description:
      "La mémoire vivante de toutes les traditions africaines. +1 emplacement allié (max 3) et les alliés ont 25% de HP supplémentaires.",
    visuel: "grimoire",
  },
];

export function buildHistoireDefsMap(): Map<string, Histoire> {
  return new Map(histoireDefinitions.map((h) => [h.id, h]));
}
