import { relicDefinitions } from "@/game/data/relics";
import {
  normalizeEntityFallbackText,
  normalizeRelicFallbackName,
} from "@/lib/i18n/fallback-text";

export type RelicTextLocale = "en" | "fr";

export interface LocalizedRelicTextEntry {
  name: string;
  description: string;
}

type RelicTextOverrides = Partial<
  Record<string, Partial<LocalizedRelicTextEntry>>
>;

const RELIC_TEXT_OVERRIDES: Record<RelicTextLocale, RelicTextOverrides> = {
  en: {},
  fr: {
    archivists_lens: {
      name: "Lentille de l'Archiviste",
      description:
        "+2 Encre maximale. Le premier Pouvoir joue de chaque combat donne 2 Concentration et pioche 2 cartes.",
    },
    cernunnos_horn: {
      name: "Cor de Cernunnos",
      description:
        "Commencez chaque combat avec 3 Epines. Terminez un tour sans Armure pour gagner 2 Epines.",
    },
    deathless_bone: {
      name: "Os de l'Immortel",
      description:
        "+1 Energie maximale, mais ajoutez 1 Hebete a votre defausse au debut du combat.",
    },
    eye_of_maat: {
      name: "Oeil de Maat",
      description:
        "+1 Energie maximale. Votre premiere carte de chaque tour accorde un bienfait selon son type.",
    },
    griot_drum: {
      name: "Tambour du Griot",
      description:
        "Toutes les 3 cartes jouees dans un tour, gagnez une recompense selon le type de la troisieme.",
    },
    guardians_seal: {
      name: "Sceau du Gardien",
      description:
        "+2 Encre maximale. Une fois par tour, depenser votre derniere Encre donne 1 Energie.",
    },
    quetzal_feather: {
      name: "Plume de Quetzal",
      description:
        "La premiere carte de chaque tour donne 5 Armure, 2 Encres ou 1 Energie selon son type.",
    },
    solar_disc: {
      name: "Disque solaire",
      description:
        "+1 Energie maximale. En fin de tour, convertissez jusqu'a 2 Energies non depensees en Encre.",
    },
    stone_pendant: {
      name: "Pendentif de pierre",
      description:
        "Votre premiere Attaque de chaque tour contre un ennemi indemne donne 8 Armure.",
    },
    void_shard: {
      name: "Eclat du Vide",
      description:
        "Toutes les 5 cartes jouees, gagnez 2 Concentration, mais ajoutez 1 Hebete a votre defausse.",
    },
    weavers_thread: {
      name: "Fil de la Tisseuse",
      description:
        "Toutes les 3 Competences jouees dans un tour, piochez 1 carte et gagnez 2 Armure.",
    },
    yaga_skull: {
      name: "Crane de Yaga",
      description:
        "Piochez 1 carte supplementaire par tour, mais ajoutez 1 Hebete a votre defausse tous les 3 tours.",
    },
    viking_hel_signet: {
      name: "Sceau de Hel",
      description:
        "Au debut du combat, appliquez 1 Vulnerable a tous les ennemis. La premiere Attaque de chaque tour contre une cible Vulnerable donne 2 Epines.",
    },
    // Older relic pool: explicit editorial cleanup for entries that still
    // came from mixed French/English source text.
    atlas_of_realms: {
      name: "Atlas des royaumes",
      description:
        "Lors du choix du prochain biome, choisissez parmi les 8 royaumes.",
    },
    hunters_signet: {
      name: "Sceau du chasseur",
      description:
        "Une fois par run, dans une salle de boss, vous pouvez choisir quel boss du biome actuel vous affrontez.",
    },
    colossus_tome_plate: {
      name: "Plaque du Colosse-Tome",
      description: "Commencez chaque combat avec 10 Armure.",
    },
    giant_baobab_seed: {
      name: "Graine du Baobab geant",
      description:
        "A la fin du tour, si vous n'avez pas d'Armure, gagnez 6 Armure.",
    },
    slime_ink_vial: {
      name: "Fiole d'encre visqueuse",
      description: "Commencez chaque combat avec 4 Armure et 2 Encres.",
    },
    apep_shadow_scale: {
      name: "Ecaille d'ombre d'Apep",
      description:
        "Appliquez 1 Vulnerable a tous les ennemis au debut du combat.",
    },
    archon_ink_crown: {
      name: "Couronne de l'Archonte d'encre",
      description: "Commencez chaque combat avec 3 Epines.",
    },
    alchemists_bandolier: {
      name: "Bandouliere d'alchimiste",
      description: "Vous pouvez transporter 2 potions supplementaires.",
    },
    quartermaster_cork: {
      name: "Bouchon de quartier-maitre",
      description:
        "Apres chaque combat, gagnez une potion aleatoire s'il reste de la place.",
    },
    distillers_prism: {
      name: "Prisme du distillateur",
      description: "Les effets des potions sont doubles.",
    },
    automaton_bronze_gear: {
      name: "Pignon de l'Automate de bronze",
      description: "Chaque carte Attaque jouee vous donne 2 Armure.",
    },
    spectral_inkwell: {
      name: "Encrier Spectral",
      description: "Au debut de chaque tour, gagnez 1 Encre.",
    },
    ink_stamp: {
      name: "Cachet d'Encre",
      description: "Commencez chaque combat avec 4 Encres.",
    },
    cossack_iron_spur: {
      name: "Eperon du Cosaque de fer",
      description: "A la fin du tour, gagnez 1 Encre.",
    },
    guard_czar_medal: {
      name: "Medaille du Garde du tsar",
      description: "A la fin du tour, gagnez 4 Armure.",
    },
    guardian_dune_amulet: {
      name: "Amulette des dunes gardiennes",
      description:
        "Au debut de chaque tour, recuperez 2 PV si vous avez moins de la moitie de vos PV.",
    },
    hound_amber_fang: {
      name: "Croc d'ambre",
      description: "Gagnez 2 Armure au debut de chaque tour.",
    },
    idol_sun_fragment: {
      name: "Fragment solaire de l'idole",
      description: "Commencez chaque combat avec 1 Force et 1 Encre.",
    },
    kikimora_night_lantern: {
      name: "Lanterne nocturne de Kikimora",
      description: "Commencez chaque combat avec +1 pioche et 1 Encre.",
    },
    lamia_veil: {
      name: "Voile de Lamie",
      description:
        "Chaque carte Competence jouee inflige 1 degat a tous les ennemis.",
    },
    serpent_scroll_seal: {
      name: "Sceau du serpent scripturaire",
      description: "Commencez chaque combat avec 1 Concentration et 4 Armure.",
    },
    shaman_storm_totem: {
      name: "Totem d'orage du chaman",
      description: "Commencez chaque combat avec 6 Armure et 1 Epine.",
    },
    wadjet_emerald_eye: {
      name: "Oeil d'emeraude de Wadjet",
      description: "Commencez chaque combat avec 1 Force et 6 Armure.",
    },
    wraith_torn_folio: {
      name: "Folio dechire du spectre",
      description: "Commencez chaque combat avec 1 Force.",
    },
    apprentice_oak_scroll: {
      name: "Parchemin du chene initiatique",
      description: "Recuperez 2 PV au debut de chaque tour.",
    },
    phoenix_ash: {
      name: "Cendre de phenix",
      description:
        "Au debut de chaque tour pair, recuperez 4 PV.",
    },
    beast_bog_heart: {
      name: "Coeur de la bete des marais",
      description: "Gagnez 1 Energie au debut de chaque tour.",
    },
    berserker_rune_axehead: {
      name: "Tranchant runique du berserker",
      description: "Commencez chaque combat avec 2 Force.",
    },
    broodling_hydra_spine: {
      name: "Epine du rejeton d'Hydre",
      description: "Chaque carte Attaque jouee vous donne 1 Force.",
    },
    cultist_flayed_mask: {
      name: "Masque de l'Ecorche",
      description: "Appliquez 2 Poison a tous les ennemis au debut du combat.",
    },
    einherjar_oath_band: {
      name: "Anneau de serment einherjar",
      description: "Commencez chaque combat avec 1 Energie et 1 Concentration.",
    },
    golem_pulp_core: {
      name: "Noyau de pate golem",
      description: "Piochez 1 carte supplementaire chaque tour.",
    },
    harbinger_storm_bell: {
      name: "Cloche de tempete d'Oya",
      description: "Commencez chaque combat avec 1 Energie et 4 Armure.",
    },
    impundulu_thunder_plume: {
      name: "Plume de foudre d'Impundulu",
      description:
        "Chaque carte Attaque jouee inflige 1 degat a tous les ennemis.",
    },
    mummy_linen_knot: {
      name: "Noeud de lin de momie",
      description:
        "Les elites commencent chaque combat avec 25 % de PV en moins.",
    },
    priest_obsidian_censer: {
      name: "Encensoir d'obsidienne",
      description: "Commencez chaque combat avec 1 Concentration et +1 pioche.",
    },
    spawn_void_ichor: {
      name: "Ichor de rejeton du Vide",
      description:
        "La premiere carte Epuisee de chaque tour vous donne 1 Encre.",
    },
    surgeon_mi_go_tools: {
      name: "Instruments du chirurgien Mi-Go",
      description: "La premiere carte Epuisee de chaque tour vous rend 1 PV.",
    },
    sprite_quill_charm: {
      name: "Talisman de plume folle",
      description: "Commencez chaque combat avec 1 Energie supplementaire.",
    },
    // Frequently surfaced generated FR entries that still read too mechanically.
    library_margin_inkpot: {
      description:
        "La premiere carte Competence de chaque tour donne +1 Encre.",
    },
    library_archon_stamp: {
      description: "Au debut du combat, gagnez 1 Concentration et 5 Armure.",
    },
    library_guardian_chain: {
      description: "A l'obtention, gagnez 12 PV max.",
    },
    library_archivist_eye: {
      name: "Oeil de l'Archiviste",
      description:
        "Au debut du combat, gagnez +1 pioche et 2 Concentration. La premiere Malediction piochee est Exhautee.",
    },
    library_catalog_discount: {
      description:
        "Chez le marchand, le cout de purge des cartes est reduit de 50 %.",
    },
    viking_frost_torc: {
      description:
        "Les degats de Poison que vous subissez sont reduits de 40 %.",
    },
    viking_maiden_rune: {
      description:
        "Toutes les 3 cartes Competence jouees pendant un combat, gagnez 1 Epine.",
    },
    viking_valkyrie_feather: {
      description: "A chaque ennemi vaincu, piochez 1 carte (max 2 par tour).",
    },
    viking_serpent_scale: {
      description:
        "Au debut du tour, si vous n'avez pas d'Armure, gagnez 8 Armure.",
    },
    viking_skald_ledger: {
      description: "Gagnez 1 or par ennemi vaincu en combat (max 30).",
    },
    viking_longship_standard: {
      description:
        "La premiere fois que votre main se vide en combat, gagnez 1 Energie et piochez 2 cartes.",
    },
    greek_harpy_pinion: {
      name: "Remige de Harpie",
      description:
        "Sequence Competence, Competence, Attaque : piochez 1 carte.",
    },
    greek_minotaur_labrys: {
      description:
        "Quand vous brisez toute l'Armure d'un ennemi, gagnez 3 Armure.",
    },
    greek_hydra_heart: {
      description: "A chaque ennemi vaincu, soignez 3 PV et gagnez 1 Force.",
    },
    greek_oracle_drachma: {
      description: "Les recompenses de cartes offrent 1 choix supplementaire.",
    },
    greek_stoa_treatise: {
      description:
        "A la fin du tour, si vous avez au moins 6 cartes en main, gagnez 1 Energie au tour suivant.",
    },
    egypt_scarab_idol: {
      description: "Le Poison inflige 2,5 degats par stack au lieu de 1,5.",
    },
    egypt_tomb_censer: {
      description:
        "La premiere carte Competence de chaque tour coute 0 Energie.",
    },
    egypt_ushabti_ward: {
      description: "Quand vous gagnez de la Concentration, soignez 2 PV.",
    },
    egypt_anubis_scale: {
      description:
        "Les elites commencent chaque combat avec 20 % de PV en moins.",
    },
    egypt_sekhmet_blade: {
      description: "Au premier ennemi vaincu de chaque tour, gagnez 1 Energie.",
    },
    egypt_ra_brazier: {
      description:
        "Au debut du combat, gagnez 1 Energie. A la fin du combat, perdez 1 PV.",
    },
    egypt_golden_canopic: {
      description:
        "Les ressources de biome gagnees en combat augmentent de 20 %.",
    },
    love_byakhee_wing: {
      description:
        "Au debut du tour, si votre main est vide, piochez 2 cartes.",
    },
    love_elder_shard: {
      description:
        "Commencez chaque combat avec 1 Concentration, mais aussi 1 Faiblesse.",
    },
    love_nyar_mask: {
      description: "Tous les 3 tours, gagnez 2 Encre et 1 Force.",
    },
    love_forbidden_contract: {
      description:
        "Chez le marchand, 1 choix de relique supplementaire est propose, mais les prix augmentent de 10 %.",
    },
    aztec_eagle_standard: {
      description: "Quand vous appliquez Vulnerable, gagnez 3 Armure.",
    },
    aztec_tzitzimitl_star: {
      description:
        "Toutes les 4 cartes Attaque jouees dans un tour, gagnez 1 Energie au tour suivant.",
    },
    aztec_codex_market: {
      description: "A l'obtention, gagnez 300 or.",
    },
    celtic_morrigan_feather: {
      description:
        "A chaque affaiblissement inflige, gagnez 1 Epine (max 5 par combat).",
    },
    celtic_briar_seed: {
      description: "Le Saignement inflige 2,5 degats par stack au lieu de 1,5.",
    },
    celtic_morrigan_cauldron: {
      description: "A la fin d'un combat d'elite, soignez 8 PV.",
    },
    celtic_cernunnos_antler: {
      description:
        "Commencez chaque combat avec 3 Epines. Votre premiere Competence de chaque tour vous soigne de 1 PV si vous avez des Epines.",
    },
    celtic_grove_compass: {
      description:
        "Votre premiere carte Competence de chaque tour vous donne 3 Armure si vous avez des Epines.",
    },
    celtic_oak_geas: {
      description:
        "Une fois par combat, sous 40 % de PV, gagnez 2 Force et 8 Armure.",
    },
    russian_wolf_pelt: {
      description:
        "Les degats de Bleed que vous subissez sont reduits de 40 %.",
    },
    russian_rusalka_teardrop: {
      description:
        "Quand vous piochez au moins 3 cartes dans un tour, gagnez 1 Concentration.",
    },
    russian_domovoi_hearth: {
      description: "Commencez chaque combat avec 3 Encres.",
    },
    russian_midwinter_star: {
      description: "Tous les 3 tours, gagnez 1 Energie et piochez 1 carte.",
    },
    african_hyena_talisman: {
      description:
        "La premiere Attaque sur une cible a tous ses PV inflige 4 degats supplementaires.",
    },
    african_mask_drum: {
      description:
        "Toutes les 3 cartes Competence jouees dans un tour, gagnez 1 Force pour ce tour.",
    },
    african_legba_key: {
      description: "Chez le marchand, la premiere relance est gratuite.",
    },
    african_soundiata_standard: {
      description:
        "Au debut du combat, gagnez 1 Force, 1 Concentration et +1 pioche.",
    },
    african_griot_archive: {
      description:
        "Les combats d'elite offrent 1 choix de carte supplementaire en recompense.",
    },
    african_sunbird_refrain: {
      description:
        "A la 3e carte Attaque d'un tour, soignez 2 PV et piochez 1 carte.",
    },
    bibliothecaire_quiet_lens: {
      description:
        "La premiere carte Competence de chaque tour vous donne 1 Concentration.",
    },
    bibliothecaire_cross_reference: {
      description:
        "Toutes les 2 cartes Competence jouees dans un tour : piochez 1 carte.",
    },
    bibliothecaire_restricted_index: {
      description:
        "A la 3e carte Competence d'un tour, gagnez 1 Energie et 6 Armure.",
    },
    blighted_compass: {
      name: "Compas Fletri",
      description:
        "Piochez 2 cartes supplementaires par tour, mais commencez chaque combat avec 2 Faiblesse.",
    },
    energy_crystal: {
      name: "Cristal d'Energie",
      description:
        "Gagnez 1 Energie par tour, mais piochez 1 carte de moins par tour.",
    },
    dagdas_club: {
      name: "Massue du Dagda",
      description:
        "Commencez chaque combat avec 2 Epines. Gagnez 1 Epine par tour.",
    },
    hels_crown: {
      name: "Couronne de Hel",
      description:
        "Commencez chaque combat avec 1 Force. Votre premiere carte Competence de chaque tour vous donne 3 Armure et 1 Epine.",
    },
    hydra_scale: {
      name: "Ecaille de l'Hydre",
      description:
        "Commencez chaque combat avec 2 Epines. Toutes les 3 cartes Attaque jouees dans un tour, gagnez 2 Epines.",
    },
    obsidian_mirror: {
      name: "Miroir d'obsidienne",
      description:
        "La premiere carte Attaque de chaque tour applique 1 Vulnerable a sa cible.",
    },
    shub_idol: {
      name: "Idole de Shub",
      description:
        "Commencez chaque combat avec 2 Force et 3 Encre, mais ajoutez 2 cartes Statut aleatoires a votre defausse.",
    },
    wolf_fang: {
      name: "Croc du loup",
      description:
        "La premiere carte Attaque de chaque tour contre un ennemi sous la moitie de ses PV inflige 8 degats supplementaires.",
    },
    library_midnight_press: {
      name: "Presse de Minuit",
      description:
        "Toutes les 10 cartes jouees en combat, piochez 2 cartes et gagnez 1 Encre.",
    },
    scroll_of_marginalia: {
      name: "Parchemin de Marginalia",
      description:
        "Piochez 1 carte supplementaire par tour, mais ajoutez 1 Hebete a votre defausse au debut du combat.",
    },
    bleeding_thistle: {
      name: "Chardon Sanglant",
      description:
        "Votre première Attaque de chaque tour donne 3 Bouclier. Toutes les 3 Attaques du tour, appliquez 2 Saignement à tous les ennemis.",
    },
    venom_pouch: {
      name: "Bourse de Venin",
      description:
        "Toutes les 3 cartes Competence jouees dans un tour, appliquez 2 Poison a tous les ennemis.",
    },
    arcane_reservoir: {
      name: "Reservoir Arcanique",
      description: "Pendant les tours impairs, gagnez 2 Encre.",
    },
    plague_vial: {
      name: "Fiole de Peste",
      description:
        "Au debut du combat, appliquez 6 Poison a tous les ennemis. S'ils sont au moins 3, gagnez 1 Encre.",
    },
    endless_codex: {
      name: "Codex Infini",
      description:
        "En fin de tour, infligez 2 degats par carte piochee ce tour a tous les ennemis.",
    },
    crimson_covenant: {
      name: "Pacte Cramoisi",
      description:
        "Au debut du combat, appliquez 5 Saignement a tous les ennemis. Chaque tour, appliquez 1 Saignement supplementaire a tous les ennemis.",
    },
    philosophers_tome: {
      name: "Tome du Philosophe",
      description:
        "Gagnez 1 Energie par tour et commencez le combat avec 2 Force, mais ajoutez une Malediction a votre defausse.",
    },
    eternal_flow: {
      name: "Flux Eternel",
      description:
        "Cycle par tour : gagnez 3 Encre, puis 6 Armure, puis 2 Force.",
    },
    venom_grimoire: {
      name: "Grimoire Venimeux",
      description:
        "Le Poison inflige +1,0 degats par stack (cumulable avec autres reliques Poison).",
    },
    hemorrhage_codex: {
      name: "Codex Hemorragique",
      description:
        "Le Saignement inflige +1,0 degats par stack (cumulable avec autres reliques Saignement).",
    },
  },
};

function buildRelicTextResources(): Record<
  RelicTextLocale,
  Record<string, LocalizedRelicTextEntry>
> {
  return {
    en: Object.fromEntries(
      relicDefinitions.map((relic) => [
        relic.id,
        {
          name: normalizeRelicFallbackName(relic.id, relic.name, "en"),
          description: normalizeEntityFallbackText(relic.description, "en"),
          ...RELIC_TEXT_OVERRIDES.en[relic.id],
        } satisfies LocalizedRelicTextEntry,
      ])
    ),
    fr: Object.fromEntries(
      relicDefinitions.map((relic) => [
        relic.id,
        {
          name: normalizeRelicFallbackName(relic.id, relic.name, "fr"),
          description: normalizeEntityFallbackText(relic.description, "fr"),
          ...RELIC_TEXT_OVERRIDES.fr[relic.id],
        } satisfies LocalizedRelicTextEntry,
      ])
    ),
  };
}

const RELIC_TEXT_RESOURCES = buildRelicTextResources();

export function getRelicTextEntry(
  locale: RelicTextLocale,
  relicId: string
): LocalizedRelicTextEntry | undefined {
  return RELIC_TEXT_RESOURCES[locale][relicId];
}

export function getAllRelicTextEntries(
  locale: RelicTextLocale
): Record<string, LocalizedRelicTextEntry> {
  return RELIC_TEXT_RESOURCES[locale];
}
