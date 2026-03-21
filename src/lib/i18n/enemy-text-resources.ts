import { enemyDefinitions } from "@/game/data/enemies";
import type { EnemyDefinition } from "@/game/schemas/entities";
import type { BiomeType, EnemyRole } from "@/game/schemas/enums";

export type EnemyTextLocale = "en" | "fr";

export interface LocalizedEnemyTextEntry {
  name: string;
  lore: string;
  loreEntries: string[];
}

const FR_ENEMY_NAMES: Record<string, string> = {
  ink_slime: "Gelatine d'encre",
  paper_golem: "Golem de papier",
  quill_sprite: "Esprit de plume",
  tome_wraith: "Spectre du tome",
  scroll_serpent: "Serpent de parchemin",
  ink_archon: "Archonte d'encre",
  tome_colossus: "Colosse du tome",
  venom_wyrm: "Wyrm venimeux",
  chapter_guardian: "Gardien de chapitre",
  the_archivist: "L'Archiviste corrompu",
  draugr: "Draugr",
  rune_berserker: "Berserker runique",
  frost_troll: "Troll du givre",
  shield_maiden: "Guerriere au bouclier",
  rune_shaman: "Chaman des runes",
  einherjar: "Einherjar",
  valkyrie: "Valkyrie",
  jormungandr_spawn: "Rejeton de Jormungandr",
  fenrir: "Fenrir",
  hel_queen: "Hel, reine de Niflheim",
  satyr: "Satyre",
  harpy: "Harpie",
  cyclops: "Cyclope",
  gorgon: "Gorgone",
  lamia: "Lamia",
  bronze_automaton: "Automate de bronze",
  minotaur: "Minotaure",
  lernaean_broodling: "Rejeton de Lerne",
  medusa: "Meduse",
  hydra_aspect: "Aspect de l'Hydre",
  hydra_head_left: "Tete gauche de l'Hydre",
  hydra_head_right: "Tete droite de l'Hydre",
  hydra_head_center: "Tete centrale de l'Hydre",
  scarab_swarm: "Essaim de scarabees",
  sand_guardian: "Gardien des sables",
  tomb_priest: "Pretre du tombeau",
  mummy_knight: "Chevalier momifie",
  apep_scion: "Rejeton d'Apep",
  wadjet_guardian: "Gardien de Wadjet",
  ushabti_servant: "Serviteur oushebti",
  anubis_champion: "Champion d'Anubis",
  sekhmet_chosen: "Elu de Sekhmet",
  ra_avatar: "Avatar de Ra",
  osiris_judgment: "Jugement d'Osiris",
  cultist_scribe: "Scribe cultiste",
  deep_one: "Profond",
  shoggoth_spawn: "Rejeton de Shoggoth",
  void_tendril: "Vrille du vide",
  star_spawn: "Engeance stellaire",
  byakhee: "Byakhee",
  elder_hybrid: "Hybride ancestral",
  mi_go_surgeon: "Chirurgien Mi-Go",
  nyarlathotep_shard: "Eclat de Nyarlathotep",
  shub_spawn: "Rejeton de Shub-Niggurath",
  jaguar_warrior: "Guerrier jaguar",
  obsidian_priest: "Pretre d'obsidienne",
  eagle_knight: "Chevalier aigle",
  stone_idol: "Idole de pierre",
  flayed_cultist: "Cultiste ecorche",
  tzitzimitl: "Tzitzimitl",
  quetzal_harbinger: "Messager de Quetzal",
  huitzilopochtli_enforcer: "Executeur de Huitzilopochtli",
  tezcatlipoca_echo: "Echo de Tezcatlipoca",
  quetzalcoatl_wrath: "Colere de Quetzalcoatl",
  sidhe_raider: "Pillard sidhe",
  bog_beast: "Bete des marais",
  druid_apprentice: "Apprenti druide",
  amber_hound: "Limier d'ambre",
  morrigan_wisp: "Feu-follet de Morrigan",
  briar_beast: "Bete de ronces",
  morrigan_chosen: "Elu de Morrigan",
  wild_hunt_hound: "Limier de la Chasse sauvage",
  dagda_shadow: "Ombre de Dagda",
  dagda_cauldron: "Chaudron de Dagda",
  cernunnos_shade: "Ombre de Cernunnos",
  winter_wolf: "Loup d'hiver",
  czar_guard: "Garde du tsar",
  snow_maiden: "Demoiselle des neiges",
  iron_cossack: "Cosaque de fer",
  kikimora: "Kikimora",
  rusalka: "Rusalka",
  koschei_herald: "Heraut de Koschei",
  domovoi_titan: "Titan domovoi",
  baba_yaga_hut: "Cabane de Baba Yaga",
  koschei_deathless: "Koschei l'Immortel",
  hyena_pack: "Meute de hyenes",
  mask_hunter: "Chasseur au masque",
  baobab_giant: "Geant baobab",
  serpent_oracle: "Oracle serpent",
  impundulu: "Impundulu",
  tokoloshe: "Tokoloshe",
  legba_emissary: "Emissaire de Legba",
  oya_harbinger: "Messager d'Oya",
  soundiata_spirit: "Esprit de Soundiata",
  anansi_weaver: "Anansi le Tisseur",
  archivist_black_inkwell: "Encrier noir",
  archivist_pale_inkwell: "Encrier pale",
  shub_brood_nest: "Nid du couvain",
  koschei_bone_chest: "Coffre d'os",
  koschei_black_egg: "Oeuf noir",
  koschei_hidden_needle: "Aiguille cachee",
};

const FR_BIOME_CONTEXT: Record<BiomeType, string> = {
  LIBRARY:
    "des marges corrompues et des manuscrits sans repos de la Bibliotheque",
  VIKING: "des terres du givre, des serments et des chants de guerre",
  GREEK: "des rivalites divines, de l'orgueil et de la prophetie",
  EGYPTIAN: "des rites funeraires, du jugement et de l'equilibre eternel",
  LOVECRAFTIAN: "du vide entre les etoiles impossibles",
  AZTEC: "des cultes du soleil et du sang rituel",
  CELTIC: "des bosquets sauvages, des presages et des anciens pactes",
  RUSSIAN: "des maledictions d'hiver et du folklore de fer",
  AFRICAN: "des masques ancestraux, des tambours et des esprits de tempete",
};

const EN_BIOME_LORE_CONTEXT: Record<BiomeType, string> = {
  LIBRARY: "born from corrupted margins and restless manuscripts",
  VIKING: "forged by frost, oaths, and battle songs",
  GREEK: "shaped by pride, prophecy, and divine rivalry",
  EGYPTIAN: "bound to tomb rites, judgment, and eternal balance",
  LOVECRAFTIAN: "drawn from the void between impossible stars",
  AZTEC: "fed by ritual blood and solar fanaticism",
  CELTIC: "woven from wild groves, omens, and old pacts",
  RUSSIAN: "tempered by winter curses and iron folklore",
  AFRICAN: "carried by ancestral masks, drums, and storm spirits",
};

const FR_ROLE_HINTS: Record<EnemyRole, string> = {
  ASSAULT: "Il mise sur une pression constante plutot que sur la defense.",
  SUPPORT: "Il influe sur le combat en soutenant son camp jusqu'au bout.",
  CONTROL: "Il casse le tempo et punit les tours trop previsibles.",
  TANK: "Il absorbe les coups et verrouille le champ de bataille.",
  HYBRID: "Il alterne entre offense directe et guerre d'usure.",
};

const FR_ROLE_BEHAVIOR: Record<EnemyRole, string> = {
  ASSAULT:
    "Il cherche a imposer un rythme brutal et ne laisse presque aucun tour de repit.",
  SUPPORT:
    "Il alterne pression et soutien pour prolonger le combat en faveur de son camp.",
  CONTROL:
    "Il adore casser les plans trop propres et transformer un tour calme en mauvais echange.",
  TANK: "Il avance lentement, verrouille l'espace puis use sa cible avant le coup decisif.",
  HYBRID:
    "Il change de registre au fil du combat et teste plusieurs angles avant de s'engager.",
};

function getSourceLoreEntries(definition: EnemyDefinition): string[] {
  if (definition.loreEntries && definition.loreEntries.length > 0) {
    return [...definition.loreEntries];
  }
  if (definition.loreText) {
    return [definition.loreText];
  }
  return [];
}

function getFrenchEnemyName(definition: EnemyDefinition): string {
  return FR_ENEMY_NAMES[definition.id] ?? definition.name;
}

function getEnglishEncounterRank(definition: EnemyDefinition): string {
  if (definition.isBoss) return "boss";
  if (definition.isElite) return "elite";
  return "foe";
}

function getFrenchEncounterRank(definition: EnemyDefinition): string {
  if (definition.isBoss) return "boss";
  if (definition.isElite) return "ennemi d'elite";
  return "ennemi";
}

function buildEnglishLoreEntries(definition: EnemyDefinition): string[] {
  const context = EN_BIOME_LORE_CONTEXT[definition.biome];
  const rank = getEnglishEncounterRank(definition);
  const roleHint =
    definition.role === "ASSAULT"
      ? "It prefers relentless pressure over defense."
      : definition.role === "SUPPORT"
        ? "It bends the fight by sustaining its allies."
        : definition.role === "CONTROL"
          ? "It disrupts tempo and punishes predictable turns."
          : definition.role === "TANK"
            ? "It absorbs punishment and stalls the battlefield."
            : "It adapts between offense and attrition.";

  const abilityNames = definition.abilities
    .slice(0, 2)
    .map((ability) => ability.name)
    .filter((name) => name.trim().length > 0);

  const secondEntry =
    abilityNames.length === 0
      ? `${definition.name} shifts its pattern after repeated clashes, testing openings before committing to a finishing rhythm.`
      : abilityNames.length === 1
        ? `${definition.name} often opens with ${abilityNames[0]}, then adjusts tempo to punish defensive turns.`
        : `${definition.name} alternates between ${abilityNames[0]} and ${abilityNames[1]} once it has measured its opponent.`;

  return [
    `${definition.name} is a ${rank} ${context}. ${roleHint}`,
    secondEntry,
    `Archive records suggest that defeating ${definition.name} repeatedly reveals a deeper will ${context}, as if each fall teaches the same story to fight back harder.`,
  ];
}

function buildFrenchLoreEntries(
  definition: EnemyDefinition,
  localizedName: string
): string[] {
  const intro = `${localizedName} est un ${getFrenchEncounterRank(definition)} issu ${FR_BIOME_CONTEXT[definition.biome]}. ${FR_ROLE_HINTS[definition.role]}`;

  const combatRead = definition.isBoss
    ? `${localizedName} dicte plusieurs rythmes de combat et adapte sa pression des qu'une faille apparait.`
    : FR_ROLE_BEHAVIOR[definition.role];

  const archivalRead = `${localizedName} revient souvent dans les archives du Panlibrarium. Chaque victoire contre lui revele une volonte plus ancienne qui cherche a reprendre le recit a son avantage.`;

  return [intro, combatRead, archivalRead];
}

function buildEnemyTextResources(): Record<
  EnemyTextLocale,
  Record<string, LocalizedEnemyTextEntry>
> {
  const enEntries = Object.fromEntries(
    enemyDefinitions.map((definition) => {
      const loreEntries = [
        ...getSourceLoreEntries(definition),
        ...buildEnglishLoreEntries(definition),
      ].slice(0, 3);
      return [
        definition.id,
        {
          name: definition.name,
          lore: loreEntries[0] ?? definition.name,
          loreEntries,
        } satisfies LocalizedEnemyTextEntry,
      ];
    })
  );

  const frEntries = Object.fromEntries(
    enemyDefinitions.map((definition) => {
      const localizedName = getFrenchEnemyName(definition);
      const loreEntries = buildFrenchLoreEntries(definition, localizedName);
      return [
        definition.id,
        {
          name: localizedName,
          lore: loreEntries[0] ?? localizedName,
          loreEntries,
        } satisfies LocalizedEnemyTextEntry,
      ];
    })
  );

  return { en: enEntries, fr: frEntries };
}

const ENEMY_TEXT_RESOURCES = buildEnemyTextResources();

export function getEnemyTextEntry(
  locale: EnemyTextLocale,
  enemyId: string
): LocalizedEnemyTextEntry | undefined {
  return ENEMY_TEXT_RESOURCES[locale][enemyId];
}

export function getAllEnemyTextEntries(
  locale: EnemyTextLocale
): Record<string, LocalizedEnemyTextEntry> {
  return ENEMY_TEXT_RESOURCES[locale];
}

export function getMissingFrenchEnemyNameIds(): string[] {
  return enemyDefinitions
    .filter(
      (definition) =>
        !definition.isScriptedOnly &&
        !Object.prototype.hasOwnProperty.call(FR_ENEMY_NAMES, definition.id)
    )
    .map((definition) => definition.id);
}
