import type { RelicRarity } from "../schemas/enums";

export interface RelicDefinitionData {
  id: string;
  name: string;
  description: string;
  rarity: RelicRarity;
  /** If set, this relic is guaranteed as a choice when this boss is defeated. */
  sourceBossId?: string;
}

export const relicDefinitions: RelicDefinitionData[] = [
  {
    id: "ancient_quill",
    name: "Ancient Quill",
    description: "+2 ink max.",
    rarity: "COMMON",
  },
  {
    id: "colossus_tome_plate",
    name: "Plaque du Colosse-Tome",
    description: "Start each combat with 12 Block.",
    rarity: "COMMON",
  },
  {
    id: "giant_baobab_seed",
    name: "Graine du Baobab GAant",
    description: "At end of turn, if you have no Block, gain 6 Block.",
    rarity: "COMMON",
  },
  {
    id: "inkwell_reservoir",
    name: "Inkwell Reservoir",
    description: "+1 max ink and start each combat with 1 ink.",
    rarity: "COMMON",
  },
  {
    id: "slime_ink_vial",
    name: "Fiole d'Encre Visqueuse",
    description: "Start each combat with 6 Block.",
    rarity: "COMMON",
  },
  {
    id: "warded_ribbon",
    name: "Warded Ribbon",
    description: "Start each combat with 4 Block and 1 Thorn.",
    rarity: "COMMON",
  },
  {
    id: "apep_shadow_scale",
    name: "Acaille d'Ombre d'Apep",
    description: "Apply 1 Vulnerable to all enemies at combat start.",
    rarity: "UNCOMMON",
  },
  {
    id: "archon_ink_crown",
    name: "Couronne de l'Archonte d'Encre",
    description: "Start each combat with 3 Thorns.",
    rarity: "UNCOMMON",
  },
  {
    id: "automaton_bronze_gear",
    name: "Pignon de l'Automate de Bronze",
    description: "Each Attack card played grants 2 Block.",
    rarity: "UNCOMMON",
  },
  {
    id: "battle_lexicon",
    name: "Battle Lexicon",
    description: "Start each combat with +1 Strength.",
    rarity: "UNCOMMON",
  },
  {
    id: "blighted_compass",
    name: "Blighted Compass",
    description: "+1 draw per turn, but start combat with 1 Weak.",
    rarity: "UNCOMMON",
  },
  {
    id: "bookmark",
    name: "Bookmark",
    description: "Draw 1 extra card per turn.",
    rarity: "UNCOMMON",
  },
  {
    id: "briar_codex",
    name: "Briar Codex",
    description: "Start each combat with 2 Thorns.",
    rarity: "UNCOMMON",
  },
  {
    id: "cossack_iron_spur",
    name: "Aperon de Cosaque de Fer",
    description: "At end of turn, gain 1 Ink.",
    rarity: "UNCOMMON",
  },
  {
    id: "guard_czar_medal",
    name: "MAdaille du Garde du Tsar",
    description: "At end of turn, gain 8 Block.",
    rarity: "UNCOMMON",
  },
  {
    id: "guardian_dune_amulet",
    name: "Amulette des Dunes Gardiennes",
    description: "Recover 1 HP at the start of each turn.",
    rarity: "UNCOMMON",
  },
  {
    id: "haggler_satchel",
    name: "Haggler's Satchel",
    description: "First purchase in each shop refreshes the full stock.",
    rarity: "UNCOMMON",
  },
  {
    id: "hound_amber_fang",
    name: "Croc d'Ambre",
    description: "Gain 6 Block at the start of each turn.",
    rarity: "UNCOMMON",
  },
  {
    id: "idol_sun_fragment",
    name: "Fragment Solaire de l'Idole",
    description: "Start each combat with 1 Strength and 1 Ink.",
    rarity: "UNCOMMON",
  },
  {
    id: "ink_spindle",
    name: "Ink Spindle",
    description: "At end of turn, gain 1 Focus if your hand is empty.",
    rarity: "UNCOMMON",
  },
  {
    id: "hunters_signet",
    name: "Hunter's Signet",
    description:
      "Once per run, at a boss room, you may choose which boss of the current biome you face.",
    rarity: "UNCOMMON",
  },
  {
    id: "ink_stamp",
    name: "Ink Stamp",
    description: "Start each combat with 3 ink.",
    rarity: "UNCOMMON",
  },
  {
    id: "kikimora_night_lantern",
    name: "Lanterne Nocturne de Kikimora",
    description: "Start each combat with 1 extra draw and 1 Ink.",
    rarity: "UNCOMMON",
  },
  {
    id: "lamia_veil",
    name: "Voile de Lamie",
    description: "Each Skill card played deals 1 damage to all enemies.",
    rarity: "UNCOMMON",
  },
  {
    id: "lucky_charm",
    name: "Lucky Charm",
    description: "Increases loot luck for better rarity rolls.",
    rarity: "UNCOMMON",
  },
  {
    id: "reactive_binding",
    name: "Reactive Binding",
    description: "Each Skill card played grants 1 Block.",
    rarity: "UNCOMMON",
  },
  {
    id: "resonant_quill",
    name: "Resonant Quill",
    description:
      "At the end of your turn, gain 1 Ink per unplayed card (max 3).",
    rarity: "UNCOMMON",
  },
  {
    id: "scholars_stone",
    name: "Scholar's Stone",
    description: "Each Attack card played grants 1 Ink.",
    rarity: "UNCOMMON",
  },
  {
    id: "serpent_scroll_seal",
    name: "Sceau du Serpent Scripturaire",
    description: "Start each combat with 1 Focus and 4 Block.",
    rarity: "UNCOMMON",
  },
  {
    id: "shaman_storm_totem",
    name: "Totem d'Orage du Shaman",
    description: "Start each combat with 8 Block and 1 Thorn.",
    rarity: "UNCOMMON",
  },
  {
    id: "spectral_inkwell",
    name: "Spectral Inkwell",
    description: "Gain 1 Ink at the start of each turn.",
    rarity: "UNCOMMON",
  },
  {
    id: "tendril_star_knot",
    name: "NAud Stellaire Tentaculaire",
    description:
      "Gain 1 Ink at the start of each turn. Add 1 Dazed to your discard pile.",
    rarity: "UNCOMMON",
  },
  {
    id: "thorn_mantle",
    name: "Thorn Mantle",
    description: "Gain 1 Thorn at the start of each turn.",
    rarity: "UNCOMMON",
  },
  {
    id: "vital_flask",
    name: "Vital Flask",
    description: "Recover +5 HP after each combat.",
    rarity: "UNCOMMON",
  },
  {
    id: "wadjet_emerald_eye",
    name: "Ail Ameraude de Wadjet",
    description: "Start each combat with 1 Strength and 6 Block.",
    rarity: "UNCOMMON",
  },
  {
    id: "wraith_torn_folio",
    name: "Folio DAchirA du Spectre",
    description: "Start each combat with 1 Strength.",
    rarity: "UNCOMMON",
  },
  {
    id: "wyrm_venom_signet",
    name: "Sceau du Verme Venimeux",
    description: "Apply 1 Weak to all enemies at combat start.",
    rarity: "UNCOMMON",
  },
  {
    id: "apprentice_oak_scroll",
    name: "Parchemin du ChAne Initiatique",
    description: "Recover 3 HP at the start of each turn.",
    rarity: "RARE",
  },
  {
    id: "beast_bog_heart",
    name: "CAur de la BAte des Marais",
    description: "Gain 1 Energy at the start of each turn.",
    rarity: "RARE",
  },
  {
    id: "berserker_rune_axehead",
    name: "Tranchant Runique du Berserker",
    description: "Start each combat with 2 Strength.",
    rarity: "RARE",
  },
  {
    id: "broodling_hydra_spine",
    name: "Apine de Rejeton Hydre",
    description: "Each Attack card played grants 1 Strength.",
    rarity: "RARE",
  },
  {
    id: "cultist_flayed_mask",
    name: "Masque de l'AcorchA",
    description: "Apply 2 Poison to all enemies at combat start.",
    rarity: "RARE",
  },
  {
    id: "cursed_diacrit",
    name: "Cursed Diacrit",
    description: "+1 energy per turn, but add Haunting Regret each combat.",
    rarity: "RARE",
  },
  {
    id: "einherjar_oath_band",
    name: "Anneau de Serment Einherjar",
    description: "Start each combat with 1 Energy and 1 Focus.",
    rarity: "RARE",
  },
  {
    id: "ember_seal",
    name: "Ember Seal",
    description: "At the end of your turn, gain 3 Block per unspent Energy.",
    rarity: "RARE",
  },
  {
    id: "energy_crystal",
    name: "Energy Crystal",
    description: "+1 energy per turn.",
    rarity: "RARE",
  },
  {
    id: "eternal_hourglass",
    name: "Eternal Hourglass",
    description: "Unspent energy is conserved between turns.",
    rarity: "RARE",
  },
  {
    id: "fading_grimoire",
    name: "Fading Grimoire",
    description: "Gain 1 Strength at the start of each turn.",
    rarity: "RARE",
  },
  {
    id: "gilded_ledger",
    name: "Gilded Ledger",
    description: "Increase gold gained from combat rewards by 50%.",
    rarity: "RARE",
  },
  {
    id: "golem_pulp_core",
    name: "Noyau de PAte Golem",
    description: "Draw 1 extra card each turn.",
    rarity: "RARE",
  },
  {
    id: "harbinger_storm_bell",
    name: "Cloche de TempAte d'Oya",
    description: "Start each combat with 1 Energy and 4 Block.",
    rarity: "RARE",
  },
  {
    id: "impundulu_thunder_plume",
    name: "Plume de Foudre d'Impundulu",
    description: "Each Attack card played deals 1 damage to all enemies.",
    rarity: "RARE",
  },
  {
    id: "iron_codex",
    name: "Iron Codex",
    description:
      "At the end of your turn, gain 1 Block per card still in hand.",
    rarity: "RARE",
  },
  {
    id: "menders_charm",
    name: "Mender's Charm",
    description: "Increase post-combat healing percentage by 50%.",
    rarity: "RARE",
  },
  {
    id: "menders_inkwell",
    name: "Mender's Inkwell",
    description: "Whenever you spend Ink, heal that much HP.",
    rarity: "RARE",
  },
  {
    id: "echoing_inkstone",
    name: "Echoing Inkstone",
    description:
      "Inked cards, cards with Ink cost, and current-ink payoffs have their effects doubled.",
    rarity: "RARE",
  },
  {
    id: "mummy_linen_knot",
    name: "NAud de Lin de Momie",
    description: "Elites start combat with 25% less HP.",
    rarity: "RARE",
  },
  {
    id: "omens_compass",
    name: "Omen's Compass",
    description:
      "Boss rewards are more likely to include an additional Boss relic option.",
    rarity: "RARE",
  },
  {
    id: "phoenix_ash",
    name: "Phoenix Ash",
    description: "Recover 2 HP at the start of each turn.",
    rarity: "RARE",
  },
  {
    id: "plague_carillon",
    name: "Plague Carillon",
    description: "Each card played deals 1 damage to all enemies.",
    rarity: "RARE",
  },
  {
    id: "priest_obsidian_censer",
    name: "Encensoir d'Obsidienne",
    description: "Start each combat with 1 Focus and 1 extra draw.",
    rarity: "RARE",
  },
  {
    id: "runic_bulwark",
    name: "Runic Bulwark",
    description: "Retain 50% of your remaining Block each turn.",
    rarity: "RARE",
  },
  {
    id: "spawn_void_ichor",
    name: "Ichor de Rejeton du Vide",
    description: "The first time a card Exhausts each turn, gain 1 Ink.",
    rarity: "RARE",
  },
  {
    id: "atlas_of_realms",
    name: "Atlas of Realms",
    description: "When choosing the next biome, choose from all 8 realms.",
    rarity: "RARE",
  },
  {
    id: "sprite_quill_charm",
    name: "Talisman de Plume Folle",
    description: "Start each combat with 1 extra Energy.",
    rarity: "RARE",
  },
  {
    id: "surgeon_mi_go_tools",
    name: "Instruments du Chirurgien Mi-Go",
    description:
      "Retain 50% of your remaining Block each turn. Draw 1 fewer card on turns where Block is retained.",
    rarity: "RARE",
  },
  {
    id: "surgeons_quill",
    name: "Surgeon's Quill",
    description: "You can Purge up to 3 times per merchant visit.",
    rarity: "RARE",
  },
  {
    id: "archivists_lens",
    name: "Archivist's Lens",
    description: "+2 max ink. Start each combat with 2 Focus.",
    rarity: "BOSS",
    sourceBossId: "the_archivist",
  },
  {
    id: "blood_grimoire",
    name: "Blood Grimoire",
    description:
      "Gain 1 max HP per normal enemy killed, 2 per elite, 5 per boss.",
    rarity: "BOSS",
  },
  {
    id: "cernunnos_horn",
    name: "Cernunnos's Horn",
    description: "Start each combat with 6 Thorns and 1 extra draw.",
    rarity: "BOSS",
    sourceBossId: "cernunnos_shade",
  },
  {
    id: "dagdas_club",
    name: "Dagda's Club",
    description: "Start each combat with 6 Thorns.",
    rarity: "BOSS",
    sourceBossId: "dagda_shadow",
  },
  {
    id: "deathless_bone",
    name: "Deathless Bone",
    description: "+1 max energy. Start each combat with 10 Block.",
    rarity: "BOSS",
    sourceBossId: "koschei_deathless",
  },
  {
    id: "eye_of_maat",
    name: "Eye of Maat",
    description: "+1 max energy. Start each combat with 1 Focus.",
    rarity: "BOSS",
    sourceBossId: "osiris_judgment",
  },
  {
    id: "griot_drum",
    name: "Griot's Drum",
    description: "Start each combat with 6 Block and 1 Strength.",
    rarity: "BOSS",
    sourceBossId: "soundiata_spirit",
  },
  {
    id: "guardians_seal",
    name: "Guardian's Seal",
    description: "+2 max ink. Start each combat with 2 ink.",
    rarity: "BOSS",
    sourceBossId: "chapter_guardian",
  },
  {
    id: "hels_crown",
    name: "Hel's Crown",
    description: "Start each combat with 2 Strength and 4 Thorns.",
    rarity: "BOSS",
    sourceBossId: "hel_queen",
  },
  {
    id: "hydra_scale",
    name: "Hydra Scale",
    description: "Start each combat with 1 Strength and 5 Thorns.",
    rarity: "BOSS",
    sourceBossId: "hydra_aspect",
  },
  {
    id: "iron_binding",
    name: "Iron Binding",
    description: "Gain +1 ink when ink-per-card triggers.",
    rarity: "BOSS",
  },
  {
    id: "obsidian_mirror",
    name: "Obsidian Mirror",
    description: "Start each combat with 3 Strength.",
    rarity: "BOSS",
    sourceBossId: "tezcatlipoca_echo",
  },
  {
    id: "quetzal_feather",
    name: "Quetzal Feather",
    description: "Start each combat with 1 Strength, 1 Focus, and 1 energy.",
    rarity: "BOSS",
    sourceBossId: "quetzalcoatl_wrath",
  },
  {
    id: "shub_idol",
    name: "Shub Idol",
    description: "Start each combat with 2 Strength and 3 ink.",
    rarity: "BOSS",
    sourceBossId: "shub_spawn",
  },
  {
    id: "solar_disc",
    name: "Solar Disc",
    description: "+1 max energy. Start each combat with 2 ink.",
    rarity: "BOSS",
    sourceBossId: "ra_avatar",
  },
  {
    id: "stone_pendant",
    name: "Stone Pendant",
    description: "Start each combat with 1 Strength and 1 Focus.",
    rarity: "BOSS",
    sourceBossId: "medusa",
  },
  {
    id: "void_shard",
    name: "Void Shard",
    description: "Start each combat with 2 Focus.",
    rarity: "BOSS",
    sourceBossId: "nyarlathotep_shard",
  },
  {
    id: "weavers_thread",
    name: "Weaver's Thread",
    description: "Start each combat with 1 extra draw and 2 Focus.",
    rarity: "BOSS",
    sourceBossId: "anansi_weaver",
  },
  {
    id: "wolf_fang",
    name: "Wolf Fang",
    description: "Start each combat with 2 Strength and 4 Block.",
    rarity: "BOSS",
    sourceBossId: "fenrir",
  },
  {
    id: "yaga_skull",
    name: "Yaga's Skull",
    description: "Start each combat with 1 extra draw and 3 Thorns.",
    rarity: "BOSS",
    sourceBossId: "baba_yaga_hut",
  },
  {
    id: "library_margin_inkpot",
    name: "Encrier des Marges Vivantes",
    description: "La premiere SKILL de chaque tour donne +1 Ink.",
    rarity: "COMMON",
  },
  {
    id: "library_prep_satchel",
    name: "Sacoche de Preparation",
    description: "Au debut du combat, pioche +2 cartes au premier tour.",
    rarity: "UNCOMMON",
  },
  {
    id: "library_redaction_quill",
    name: "Plume de Redaction",
    description:
      "Toutes les 3 SKILL jouees dans un tour: applique 1 WEAK a tous les ennemis.",
    rarity: "RARE",
  },
  {
    id: "library_archon_stamp",
    name: "Tampon Archontique",
    description: "Debut de combat: +1 Focus, +5 Block.",
    rarity: "UNCOMMON",
  },
  {
    id: "library_colossus_plate",
    name: "Plaque du Colosse",
    description:
      "Fin de tour: conserve 40% du Block restant (arrondi inferieur).",
    rarity: "RARE",
  },
  {
    id: "library_guardian_chain",
    name: "Chaine de Reliure Vitale",
    description: "A l'obtention: +12 HP max.",
    rarity: "UNCOMMON",
  },
  {
    id: "library_archivist_eye",
    name: "Oeil de l Archiviste",
    description:
      "Debut de combat: +1 draw, +2 Focus. La premiere Curse piochee est Exhautee.",
    rarity: "BOSS",
    sourceBossId: "the_archivist",
  },
  {
    id: "library_catalog_discount",
    name: "Remise du Catalogueur",
    description: "Marchand: cout de purge de carte -50%.",
    rarity: "UNCOMMON",
  },
  {
    id: "library_midnight_press",
    name: "Presse de Minuit",
    description:
      "Toutes les 10 cartes jouees en combat: ajoute 1 SKILL amelioree aleatoire dans la defausse.",
    rarity: "RARE",
  },
  {
    id: "viking_raider_horn",
    name: "Cor du Pillard",
    description:
      "La premiere ATTACK de chaque combat inflige +6 degats et applique 1 VULNERABLE.",
    rarity: "COMMON",
  },
  {
    id: "viking_frost_torc",
    name: "Torque de Givre",
    description: "Les degats de POISON que vous subissez sont reduits de 40%.",
    rarity: "UNCOMMON",
  },
  {
    id: "viking_maiden_rune",
    name: "Rune de la Porte-Bouclier",
    description: "Toutes les 3 SKILL jouees dans le combat: gagne +1 THORNS.",
    rarity: "RARE",
  },
  {
    id: "viking_valkyrie_feather",
    name: "Plume de Valkyrie",
    description: "A chaque kill: pioche 1 carte (max 2 par tour).",
    rarity: "UNCOMMON",
  },
  {
    id: "viking_serpent_scale",
    name: "Ecaille du Serpent-Monde",
    description: "Debut de tour: si Block = 0, gagne 8 Block.",
    rarity: "RARE",
  },
  {
    id: "viking_fenrir_fang",
    name: "Croc de Fenrir",
    description:
      "Quand vous perdez des HP par attaque ennemie: +1 Strength (max 3 par tour).",
    rarity: "RARE",
  },
  {
    id: "viking_hel_signet",
    name: "Sceau de Hel",
    description:
      "Debut de combat: applique 1 VULNERABLE a tous les ennemis et gagne 2 THORNS.",
    rarity: "BOSS",
    sourceBossId: "hel_queen",
  },
  {
    id: "viking_skald_ledger",
    name: "Registre du Skalde",
    description: "Gagne +1 or par ennemi tue en combat (cap 30).",
    rarity: "UNCOMMON",
  },
  {
    id: "viking_longship_standard",
    name: "Etendard de Drakkar",
    description: "Premiere fois main vide en combat: +1 Energy et pioche 2.",
    rarity: "RARE",
  },
  {
    id: "greek_satyr_flute",
    name: "Flute de Satyre",
    description:
      "Chaque fois que vous jouez 5 ATTACK dans un tour: gagnez 1 Strength et infligez votre Strength a tous les ennemis.",
    rarity: "RARE",
  },
  {
    id: "greek_harpy_pinion",
    name: "R?mige de Harpie",
    description: "Sequence SKILL, SKILL, ATTACK: pioche 1.",
    rarity: "UNCOMMON",
  },
  {
    id: "greek_cyclops_iris",
    name: "Iris du Cyclope",
    description:
      "Premiere ATTACK de chaque tour: inflige 3 degats aux autres ennemis.",
    rarity: "RARE",
  },
  {
    id: "greek_minotaur_labrys",
    name: "Labrys du Minotaure",
    description: "Quand vous cassez tout le Block d un ennemi: gagne 3 Block.",
    rarity: "UNCOMMON",
  },
  {
    id: "greek_hydra_ichor",
    name: "Ichor d Hydre",
    description:
      "Chaque debuff applique ajoute 2 degats bonus immediats a la cible.",
    rarity: "RARE",
  },
  {
    id: "greek_medusa_eye",
    name: "Oeil de Meduse",
    description:
      "Les ennemis sous VULNERABLE subissent +75% de degats au lieu de +50%.",
    rarity: "RARE",
  },
  {
    id: "greek_hydra_heart",
    name: "Coeur Hydriforme",
    description: "A chaque ennemi tue: soigne 3 HP et gagne 1 Strength.",
    rarity: "BOSS",
    sourceBossId: "hydra_aspect",
  },
  {
    id: "greek_oracle_drachma",
    name: "Drachme de l Oracle",
    description: "Recompenses de cartes: +1 choix.",
    rarity: "UNCOMMON",
  },
  {
    id: "greek_stoa_treatise",
    name: "Traite du Portique",
    description: "Fin de tour: si main >= 6 cartes, +1 Energy au tour suivant.",
    rarity: "RARE",
  },
  {
    id: "egypt_scarab_idol",
    name: "Idole Scarabee",
    description: "Les ennemis sous POISON subissent +50% de degats de POISON.",
    rarity: "RARE",
  },
  {
    id: "egypt_tomb_censer",
    name: "Encensoir des Tombes",
    description: "La premiere SKILL de chaque tour coute 0 Energy.",
    rarity: "UNCOMMON",
  },
  {
    id: "egypt_ushabti_ward",
    name: "Garde Ouchebti",
    description: "Quand vous gagnez Focus, soignez 2 HP.",
    rarity: "RARE",
  },
  {
    id: "egypt_anubis_scale",
    name: "Balance d Anubis",
    description: "Les elites commencent avec -20% HP.",
    rarity: "UNCOMMON",
  },
  {
    id: "egypt_sekhmet_blade",
    name: "Lame de Sekhmet",
    description: "Premier kill de chaque tour: +1 Energy.",
    rarity: "RARE",
  },
  {
    id: "egypt_ra_brazier",
    name: "Brasero de Ra",
    description: "Debut de combat: +1 Energy. Fin de combat: perdez 1 HP.",
    rarity: "RARE",
  },
  {
    id: "egypt_osiris_feather",
    name: "Plume d Osiris",
    description:
      "Debut de combat: gagnez 15 HP max temporaires et soignez 5 HP.",
    rarity: "BOSS",
    sourceBossId: "osiris_judgment",
  },
  {
    id: "egypt_tomb_ledger",
    name: "Registre Funeraire",
    description:
      "Fin de combat: recuperez 3 HP. Si combat ELITE/BOSS: +4 HP supplementaires.",
    rarity: "RARE",
  },
  {
    id: "egypt_golden_canopic",
    name: "Canopique Dore",
    description: "Ressources de biome de combat +20%.",
    rarity: "RARE",
  },
  {
    id: "love_deep_one_idol",
    name: "Idole du Profond",
    description:
      "Les cartes STATUS/CURSE peuvent etre jouees et sont Exhautees.",
    rarity: "RARE",
  },
  {
    id: "love_star_chart",
    name: "Carte des Etoiles Folles",
    description:
      "Toutes les 5 cartes jouees: applique 1 VULNERABLE a tous les ennemis.",
    rarity: "UNCOMMON",
  },
  {
    id: "love_byakhee_wing",
    name: "Aile de Byakhee",
    description: "Debut de tour: si main vide, pioche 2.",
    rarity: "RARE",
  },
  {
    id: "love_elder_shard",
    name: "Eclat Ancien",
    description: "Debut de combat: +1 Focus, mais gagne 1 WEAK.",
    rarity: "UNCOMMON",
  },
  {
    id: "love_migo_lantern",
    name: "Lanterne Mi-Go",
    description:
      "Les cartes avec EPUISE ont 50% de chance d'etre defaussees a la place.",
    rarity: "RARE",
  },
  {
    id: "love_nyar_mask",
    name: "Masque de Nyarlathotep",
    description: "Tous les 3 tours: +2 Ink et +1 Strength.",
    rarity: "RARE",
  },
  {
    id: "love_shub_brood_core",
    name: "Noyau de la Couvee",
    description:
      "Debut de combat: +1 Energy, +1 draw, ajoute 1 STATUS aleatoire a la defausse.",
    rarity: "BOSS",
    sourceBossId: "shub_spawn",
  },
  {
    id: "love_forbidden_contract",
    name: "Contrat Interdit",
    description: "Marchand: +1 choix de relique, mais prix +10%.",
    rarity: "UNCOMMON",
  },
  {
    id: "love_void_compass",
    name: "Compas du Vide",
    description:
      "Recompenses de cartes +1 choix; si vous prenez une carte: perdez 2 HP.",
    rarity: "RARE",
  },
  {
    id: "aztec_jaguar_fang",
    name: "Croc du Jaguar",
    description:
      "Premiere ATTACK de chaque tour: si cible debuffee, soignez 1 HP.",
    rarity: "COMMON",
  },
  {
    id: "aztec_eagle_standard",
    name: "Etendard de l Aigle",
    description: "Quand vous appliquez VULNERABLE: gagnez 3 Block.",
    rarity: "UNCOMMON",
  },
  {
    id: "aztec_tzitzimitl_star",
    name: "Etoile Tzitzimitl",
    description: "Toutes les 4 ATTACK dans un tour: +1 Energy au tour suivant.",
    rarity: "RARE",
  },
  {
    id: "aztec_quetzal_coil",
    name: "Spire de Quetzal",
    description:
      "Sous VULNERABLE, les degats subis par les attaques ennemies augmentent de 25% au lieu de 50%.",
    rarity: "UNCOMMON",
  },
  {
    id: "aztec_huitzil_fire",
    name: "Feu de Huitzilopochtli",
    description: "Premier kill de chaque combat: +1 Strength.",
    rarity: "RARE",
  },
  {
    id: "aztec_tezca_mirror",
    name: "Miroir de Tezcatlipoca",
    description: "Les 5 premiers coups recus du combat renvoient 3 degats.",
    rarity: "RARE",
  },
  {
    id: "aztec_quetzal_crown",
    name: "Couronne du Serpent a Plumes",
    description: "Debut de combat: +1 Energy, +1 draw, +1 Ink. Perdez 4 HP.",
    rarity: "BOSS",
    sourceBossId: "quetzalcoatl_wrath",
  },
  {
    id: "aztec_codex_market",
    name: "Tresor du Codex",
    description: "A l'obtention: gagnez 300 or.",
    rarity: "UNCOMMON",
  },
  {
    id: "aztec_blood_calendar",
    name: "Calendrier de Sang",
    description: "Toutes les 12 cartes jouees: soignez 4 HP et piochez 1.",
    rarity: "RARE",
  },
  {
    id: "celtic_sidhe_cloak",
    name: "Manteau des Sidhes",
    description: "Ignore la premiere attaque non-boss recue en combat.",
    rarity: "COMMON",
  },
  {
    id: "celtic_morrigan_feather",
    name: "Plume de la Morrigane",
    description: "A chaque debuff inflige: gagnez 1 THORNS (max 5/combat).",
    rarity: "UNCOMMON",
  },
  {
    id: "celtic_briar_seed",
    name: "Graine de Ronce",
    description: "Les ennemis sous BLEED subissent +50% de degats de BLEED.",
    rarity: "RARE",
  },
  {
    id: "celtic_morrigan_cauldron",
    name: "Chaudron de Morrigane",
    description: "A la fin d un combat elite: soignez 8 HP.",
    rarity: "UNCOMMON",
  },
  {
    id: "celtic_wild_hunt_horn",
    name: "Cor de la Chasse Sauvage",
    description:
      "Quand vous jouez 3 ATTACK dans un tour: applique 1 WEAK a tous les ennemis.",
    rarity: "RARE",
  },
  {
    id: "celtic_dagda_cauldron",
    name: "Chaudron du Dagda",
    description:
      "Fin de tour: si vous avez joue au moins 3 SKILL ce tour, +1 Energy au tour suivant.",
    rarity: "RARE",
  },
  {
    id: "celtic_cernunnos_antler",
    name: "Ramure de Cernunnos",
    description: "Debut de combat: +4 THORNS et regenere 1 HP par tour.",
    rarity: "BOSS",
    sourceBossId: "cernunnos_shade",
  },
  {
    id: "celtic_grove_compass",
    name: "Compas du Bosquet",
    description: "Salles SPECIAL: +1 option positive potentielle.",
    rarity: "UNCOMMON",
  },
  {
    id: "celtic_oak_geas",
    name: "Geis du Chene",
    description: "Une fois par combat, sous 40% HP: +2 Strength et +8 Block.",
    rarity: "RARE",
  },
  {
    id: "russian_wolf_pelt",
    name: "Peau de Loup Blanc",
    description: "Les degats de BLEED que vous subissez sont reduits de 40%.",
    rarity: "UNCOMMON",
  },
  {
    id: "russian_snow_charm",
    name: "Charme des Neiges",
    description:
      "Quand votre main devient vide pendant votre tour: piochez 1 carte (max 2/tour).",
    rarity: "RARE",
  },
  {
    id: "russian_rusalka_teardrop",
    name: "Larme de Roussalka",
    description: "Quand vous piochez 3+ cartes dans un tour: +1 Focus.",
    rarity: "RARE",
  },
  {
    id: "russian_koschei_needle",
    name: "Aiguille de Koschei",
    description: "Etages 4+: debut de combat, ennemis sous 1 VULNERABLE.",
    rarity: "UNCOMMON",
  },
  {
    id: "russian_domovoi_hearth",
    name: "Foyer Domovoi",
    description: "Conservez 30% Block. Si Block conserve > 0: +1 Ink.",
    rarity: "RARE",
  },
  {
    id: "russian_yaga_mortar",
    name: "Mortier de Yaga",
    description:
      "Debut de combat: +1 Energy. A la fin du tour 3, ajoute 1 STATUS puis gagnez 2 Focus.",
    rarity: "RARE",
  },
  {
    id: "russian_deathless_locket",
    name: "Pendentif Sans-Mort",
    description:
      "Une fois par combat, degat mortel evite: revenez a 30% HP et gagnez 20 Block.",
    rarity: "BOSS",
    sourceBossId: "koschei_deathless",
  },
  {
    id: "russian_frost_ledger",
    name: "Registre du Gel",
    description:
      "Soins de repos +20%. Debut de combat: retire 1 WEAK ou 1 VULNERABLE.",
    rarity: "UNCOMMON",
  },
  {
    id: "russian_midwinter_star",
    name: "Etoile de Solstice",
    description: "Tous les 3 tours: +1 Energy et pioche 1.",
    rarity: "RARE",
  },
  {
    id: "african_hyena_talisman",
    name: "Talisman de Hyene",
    description: "Premiere ATTACK sur cible full HP: +4 degats.",
    rarity: "COMMON",
  },
  {
    id: "african_mask_drum",
    name: "Tambour Masque",
    description: "Toutes les 3 SKILL dans un tour: +1 Strength ce tour.",
    rarity: "UNCOMMON",
  },
  {
    id: "african_oracle_shell",
    name: "Coquille de l Oracle",
    description:
      "Debut de combat: choisissez +1 Ink immediate ou +6 Block immediate.",
    rarity: "RARE",
  },
  {
    id: "african_legba_key",
    name: "Cle de Legba",
    description: "Marchand: premier reroll gratuit.",
    rarity: "UNCOMMON",
  },
  {
    id: "african_oya_anklet",
    name: "Chevillere d Oya",
    description:
      "Quand vous depensez toute votre Energy: gagnez 6 Block et 1 THORNS.",
    rarity: "RARE",
  },
  {
    id: "african_soundiata_standard",
    name: "Etendard de Soundiata",
    description: "Debut de combat: +1 Strength, +1 Focus, +1 draw.",
    rarity: "RARE",
  },
  {
    id: "african_anansi_weave",
    name: "Tissage d Anansi",
    description:
      "Toutes les 4 cartes jouees: duplique la prochaine SKILL jouee ce tour (1 fois/tour).",
    rarity: "BOSS",
    sourceBossId: "anansi_weaver",
  },
  {
    id: "african_griot_archive",
    name: "Archive du Griot",
    description: "Combats elites: +1 choix de carte en recompense.",
    rarity: "UNCOMMON",
  },
  {
    id: "african_sunbird_refrain",
    name: "Refrain de l Oiseau-Soleil",
    description: "A la 3e ATTACK d un tour: soignez 2 HP et piochez 1.",
    rarity: "RARE",
  },
  {
    id: "global_codex_prime",
    name: "Codex Prime",
    description:
      "Apres chaque boss vaincu dans le run: +1 a une stat aleatoire (Strength/Focus/InkMax).",
    rarity: "RARE",
  },
  {
    id: "global_labyrinth_spiral",
    name: "Spirale du Labyrinthe",
    description:
      "Bonus cyclique par tour: T1 +1 Energy, T2 +1 draw, T3 +1 Strength, puis recommence.",
    rarity: "BOSS",
  },
  {
    id: "scribe_opening_glyph",
    name: "Glyphe d Ouverture",
    description:
      "Premiere carte de chaque tour: si ATTACK, gagnez 4 Block; si SKILL, gagnez 1 Ink.",
    rarity: "COMMON",
  },
  {
    id: "scribe_last_word",
    name: "Dernier Mot",
    description:
      "Premiere fois que votre main devient vide dans un tour: gagnez 1 Focus.",
    rarity: "COMMON",
  },
  {
    id: "scribe_warfolio",
    name: "Folio de Guerre",
    description:
      "Fin de tour: si vous avez joue au moins 4 cartes ce tour, gagnez 1 Ink et 5 Block.",
    rarity: "UNCOMMON",
  },
  {
    id: "scribe_sealed_edition",
    name: "Edition Scellee",
    description:
      "Toutes les 6 cartes jouees en combat: gagnez 1 Energy et piochez 1.",
    rarity: "RARE",
  },
  {
    id: "scribe_black_index",
    name: "Index Noir",
    description:
      "Chaque tour, la premiere SKILL donne +1 Energy et la premiere ATTACK inflige 3 degats aux autres ennemis.",
    rarity: "RARE",
  },
  {
    id: "bibliothecaire_margin_tabs",
    name: "Onglets de Marge",
    description:
      "Fin de tour: si vous gardez au moins 3 cartes en main, gagnez 5 Block.",
    rarity: "COMMON",
  },
  {
    id: "bibliothecaire_quiet_lens",
    name: "Lentille Silencieuse",
    description: "Premiere SKILL de chaque tour: gagnez 1 Focus.",
    rarity: "COMMON",
  },
  {
    id: "bibliothecaire_cross_reference",
    name: "Renvoi Croise",
    description: "Toutes les 2 SKILL jouees dans un tour: piochez 1.",
    rarity: "UNCOMMON",
  },
  {
    id: "bibliothecaire_restricted_index",
    name: "Index Restreint",
    description: "A la 3e SKILL d un tour: gagnez 1 Energy et 6 Block.",
    rarity: "RARE",
  },
  {
    id: "bibliothecaire_grand_catalogue",
    name: "Grand Catalogue",
    description:
      "Fin de tour: si vous avez joue au moins 2 SKILL et gardez au moins 2 cartes en main, gagnez 1 Focus, 4 Block et +1 Energy au prochain tour.",
    rarity: "RARE",
  },
];
