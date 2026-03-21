import type { SupportedLocale } from "@/lib/i18n";

const RELIC_ID_PREFIXES_TO_DROP = new Set([
  "library",
  "viking",
  "greek",
  "egypt",
  "love",
  "aztec",
  "celtic",
  "russian",
  "african",
  "global",
  "scribe",
  "bibliothecaire",
]);

const FRENCH_HINT_PATTERN =
  /\b(?:de|du|des|la|le|les|avec|sans|chaque|combat|tour|premiere|premier|debut|fin|ennemi|ennemis|carte|cartes|marchand|pioche|gagne|gagnez|applique|recompense|recompenses|salle|salles|cout|obtention|jouees|soigne|soignez|degats|armure|encre|energie|focus|force|epines|faiblesse|malediction|competence)\b/i;

const GARBLED_PATTERN =
  /\?|GAant|Acaille|MAdaille|NAud|Ameraude|DAchirA|ChAne|CAur|BAte|AcorchA|PAte|TempAte|R\?mige/i;

const SANITIZE_REPLACEMENTS: Array<readonly [string, string]> = [
  ["Graine du Baobab GAant", "Graine du Baobab geant"],
  ["Acaille d'Ombre d'Apep", "Ecaille d'Ombre d'Apep"],
  ["MAdaille du Garde du Tsar", "Medaille du Garde du Tsar"],
  ["NAud Stellaire Tentaculaire", "Noeud Stellaire Tentaculaire"],
  ["Ail Ameraude de Wadjet", "Oeil d'Emeraude de Wadjet"],
  ["Folio DAchirA du Spectre", "Folio dechire du Spectre"],
  ["Sceau du Verme Venimeux", "Sceau du Ver venimeux"],
  ["Parchemin du ChAne Initiatique", "Parchemin du Chene initiatique"],
  ["CAur de la BAte des Marais", "Coeur de la Bete des marais"],
  ["Apine de Rejeton Hydre", "Epine du Rejeton d'Hydre"],
  ["Masque de l'AcorchA", "Masque de l'Ecorche"],
  ["Noyau de PAte Golem", "Noyau de Pate golem"],
  ["Cloche de TempAte d'Oya", "Cloche de Tempete d'Oya"],
  ["R?mige de Harpie", "Remige de Harpie"],
  ["Oeil de l Archiviste", "Oeil de l'Archiviste"],
  [" d un ", " d'un "],
  [" d un:", " d'un:"],
  [" d un combat", " d'un combat"],
  [" l Oracle", " l'Oracle"],
  [" l Archiviste", " l'Archiviste"],
  [" d Hydre", " d'Hydre"],
  [" d Oya", " d'Oya"],
  [" d Anansi", " d'Anansi"],
  [" d Osiris", " d'Osiris"],
  [" d un tour", " d'un tour"],
];

const FR_EXACT_TEXT: Record<string, string> = {
  "Reactive Binding": "Reliure reactive",
  "Resonant Quill": "Plume resonante",
  "Scholar's Stone": "Pierre de l'erudit",
  "Spectral Inkwell": "Encrier spectral",
  "Thorn Mantle": "Manteau d'epines",
  "Ember Seal": "Sceau de braise",
  "Fading Grimoire": "Grimoire fanant",
  "Iron Codex": "Codex de fer",
  "Archivist's Lens": "Lentille de l'Archiviste",
  "Blood Grimoire": "Grimoire de sang",
  "Cernunnos's Horn": "Corne de Cernunnos",
  "Dagda's Club": "Massue de Dagda",
  "Deathless Bone": "Os sans-mort",
  "Eye of Maat": "Oeil de Maat",
  "Griot's Drum": "Tambour du griot",
  "Guardian's Seal": "Sceau du gardien",
  "Hel's Crown": "Couronne de Hel",
  "Hydra Scale": "Ecaille d'Hydre",
  "Obsidian Mirror": "Miroir d'obsidienne",
  "Quetzal Feather": "Plume de Quetzal",
  "Shub Idol": "Idole de Shub",
  "Solar Disc": "Disque solaire",
  "Stone Pendant": "Pendentif de pierre",
  "Void Shard": "Eclat du vide",
  "Weaver's Thread": "Fil du tisseur",
  "Wolf Fang": "Croc de loup",
  "Yaga's Skull": "Crane de Yaga",
};

const FR_PHRASE_REPLACEMENTS: Array<readonly [string, string]> = [
  ["at combat start", "au debut du combat"],
  ["start each combat with", "commencez chaque combat avec"],
  ["start combat with", "commencez le combat avec"],
  ["at the start of each turn", "au debut de chaque tour"],
  ["at the start of the turn", "au debut du tour"],
  ["at end of turn", "a la fin du tour"],
  ["at the end of turn", "a la fin du tour"],
  ["at the end of your turn", "a la fin de votre tour"],
  ["once per combat", "une fois par combat"],
  ["once per run", "une fois par run"],
  ["the first time", "la premiere fois"],
  ["on pickup", "a l'obtention"],
  ["card rewards", "recompenses de cartes"],
  ["boss rewards", "recompenses de boss"],
  ["boss room", "salle de boss"],
  ["special rooms", "salles speciales"],
  ["discard pile", "defausse"],
  ["current biome", "biome actuel"],
  ["next turn", "tour suivant"],
  ["remaining block", "armure restante"],
  ["rounded down", "arrondi a l'inferieur"],
  ["all enemies", "tous les ennemis"],
  ["all 8 realms", "les 8 royaumes"],
  ["current-ink", "encre actuelle"],
  ["ink cost", "cout en encre"],
  ["inked cards", "cartes encrees"],
  ["effects doubled", "effets doubles"],
  ["random stat", "stat aleatoire"],
  ["attack card", "carte Attaque"],
  ["skill card", "carte Competence"],
  ["power card", "carte Pouvoir"],
  ["if you have no block", "si vous n'avez pas d'Armure"],
  ["1 extra draw", "+1 pioche"],
  ["extra draw", "pioche supplementaire"],
  [
    "first purchase in each shop refreshes the full stock",
    "le premier achat chez chaque marchand reapprovisionne tout le stock",
  ],
  ["you can purge up to", "vous pouvez purger jusqu'a"],
  [
    "gain 1 max hp per normal enemy killed, 2 per elite, 5 per boss",
    "gagnez 1 PV max par ennemi normal vaincu, 2 par elite et 5 par boss",
  ],
  ["max 3", "max 3"],
];

const FR_WORD_REPLACEMENTS: Record<string, string> = {
  ancient: "ancien",
  attack: "attaque",
  atlas: "atlas",
  battle: "bataille",
  binding: "reliure",
  block: "armure",
  blood: "sang",
  boss: "boss",
  card: "carte",
  cards: "cartes",
  each: "chaque",
  charm: "charme",
  choice: "choix",
  choices: "choix",
  codex: "codex",
  combat: "combat",
  compass: "compas",
  cost: "cout",
  crown: "couronne",
  crystal: "cristal",
  curse: "malediction",
  curses: "maledictions",
  damage: "degats",
  deals: "inflige",
  disc: "disque",
  discard: "defausse",
  draw: "pioche",
  enemies: "ennemis",
  enemy: "ennemi",
  energy: "energie",
  exhaust: "epuise",
  extra: "supplementaire",
  first: "premiere",
  focus: "concentration",
  gain: "gagnez",
  grants: "donne",
  guard: "garde",
  guardian: "gardien",
  heal: "soignez",
  horn: "corne",
  hp: "PV",
  if: "si",
  ink: "encre",
  iron: "fer",
  item: "objet",
  ledger: "registre",
  lens: "lentille",
  mantle: "manteau",
  merchant: "marchand",
  mirror: "miroir",
  option: "option",
  played: "jouee",
  power: "pouvoir",
  purchase: "achat",
  purge: "purge",
  quill: "plume",
  random: "aleatoire",
  reactive: "reactive",
  recover: "recuperez",
  relic: "relique",
  rewards: "recompenses",
  room: "salle",
  rooms: "salles",
  scale: "ecaille",
  scholar: "erudit",
  scholars: "erudit",
  seal: "sceau",
  shard: "eclat",
  shop: "boutique",
  skill: "competence",
  skills: "competences",
  spectral: "spectral",
  start: "debut",
  stat: "stat",
  stone: "pierre",
  strength: "force",
  thorns: "epines",
  thorn: "epine",
  thread: "fil",
  turn: "tour",
  turns: "tours",
  upgraded: "amelioree",
  upgradeds: "ameliorees",
  usable: "utilisable",
  vulnerable: "vulnerable",
  when: "quand",
  void: "vide",
  weak: "faiblesse",
  weaver: "tisseur",
  wolf: "loup",
  with: "avec",
  you: "vous",
  your: "votre",
};

const EN_PHRASE_REPLACEMENTS: Array<readonly [string, string]> = [
  ["au debut du combat", "at combat start"],
  ["debut de combat", "at combat start"],
  ["au debut de chaque tour", "at the start of each turn"],
  ["au debut du tour", "at the start of the turn"],
  ["a la fin de votre tour", "at the end of your turn"],
  ["a la fin du tour", "at end of turn"],
  ["fin de tour", "at end of turn"],
  ["la premiere fois", "the first time"],
  ["une fois par combat", "once per combat"],
  ["une fois par run", "once per run"],
  ["a l'obtention", "on pickup"],
  ["recompenses de cartes", "card rewards"],
  ["recompenses de boss", "boss rewards"],
  ["salle de boss", "boss room"],
  ["salles speciales", "special rooms"],
  ["cout de purge de carte", "card purge cost"],
  ["armure restante", "remaining Block"],
  ["arrondi a l'inferieur", "rounded down"],
  ["arrondi inferieur", "rounded down"],
  ["tour suivant", "next turn"],
  ["biome actuel", "current biome"],
  ["stat aleatoire", "random stat"],
  ["tous les ennemis", "all enemies"],
  ["les 8 royaumes", "all 8 realms"],
  ["defausse", "discard pile"],
];

const EN_WORD_REPLACEMENTS: Record<string, string> = {
  aleatoire: "random",
  amelioree: "upgraded",
  ameliorees: "upgraded",
  ancetre: "ancestor",
  ancetres: "ancestors",
  armure: "Block",
  attaque: "Attack",
  chaque: "each",
  cartes: "cards",
  carte: "card",
  chaine: "chain",
  choix: "choice",
  colosse: "colossus",
  combat: "combat",
  competence: "Skill",
  cout: "cost",
  debut: "start",
  defausse: "discard pile",
  degats: "damage",
  du: "of the",
  des: "of the",
  de: "of",
  donne: "grants",
  eclat: "shard",
  ecorche: "flayed",
  emeraude: "emerald",
  encre: "Ink",
  energie: "Energy",
  ennemi: "enemy",
  ennemis: "enemies",
  concentration: "Focus",
  epine: "thorn",
  epines: "Thorns",
  epreuve: "trial",
  et: "and",
  faiblesse: "Weak",
  fin: "end",
  focus: "Focus",
  force: "Strength",
  gagne: "gain",
  gagnez: "gain",
  gardez: "keep",
  garde: "guard",
  geant: "giant",
  goutte: "drop",
  guerre: "war",
  harpie: "harpy",
  inflige: "deals",
  la: "the",
  leger: "light",
  le: "the",
  les: "the",
  livre: "book",
  malediction: "Curse",
  marchand: "Merchant",
  marge: "margin",
  marges: "margins",
  max: "max",
  or: "gold",
  obtention: "pickup",
  oeil: "Eye",
  plaque: "plate",
  parchemin: "scroll",
  perte: "loss",
  pioche: "draw",
  poison: "Poison",
  pouvoir: "power",
  premiere: "first",
  premier: "first",
  prochaine: "next",
  prochain: "next",
  purge: "purge",
  recupere: "recover",
  recuperez: "recover",
  recompense: "reward",
  recompenses: "rewards",
  relique: "relic",
  reliques: "relics",
  reste: "remaining",
  salle: "room",
  salles: "rooms",
  sang: "blood",
  sans: "without",
  sceau: "seal",
  soigne: "heal",
  soignez: "heal",
  special: "special",
  speciales: "special",
  stat: "stat",
  statut: "Status",
  suivant: "next",
  sur: "on",
  tisseur: "weaver",
  tous: "all",
  toutes: "every",
  tour: "turn",
  tours: "turns",
  une: "one",
  un: "one",
  vulnerable: "Vulnerable",
  vide: "void",
  vivantes: "living",
  vivante: "living",
  vous: "you",
};

const FR_WORD_REPLACEMENT_ENTRIES = Object.entries(FR_WORD_REPLACEMENTS).sort(
  ([a], [b]) => b.length - a.length
);

const EN_WORD_REPLACEMENT_ENTRIES = Object.entries(EN_WORD_REPLACEMENTS).sort(
  ([a], [b]) => b.length - a.length
);

function stripDiacritics(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0153/g, "oe")
    .replace(/\u0152/g, "Oe");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyCasePattern(source: string, replacement: string): string {
  if (source === source.toUpperCase()) return replacement.toUpperCase();
  if (source === source.toLowerCase()) return replacement.toLowerCase();
  if (source[0] === source[0]?.toUpperCase()) {
    return replacement[0]?.toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function applyPhraseReplacements(
  value: string,
  replacements: Array<readonly [string, string]>
): string {
  return replacements.reduce((current, [from, to]) => {
    const regex = new RegExp(escapeRegExp(from), "gi");
    return current.replace(regex, (match) => applyCasePattern(match, to));
  }, value);
}

function applyWordReplacements(
  value: string,
  replacements: Array<readonly [string, string]>
): string {
  return replacements.reduce((current, [from, to]) => {
    const regex = new RegExp(`\\b${escapeRegExp(from)}\\b`, "gi");
    return current.replace(regex, (match) => applyCasePattern(match, to));
  }, value);
}

function cleanupTranslatedText(value: string): string {
  const cleaned = value
    .replace(/\s+([.,!?:;])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .replace(/\bOf The\b/g, "of the")
    .replace(/\bOf\b/g, "of")
    .replace(/\bThe\b/g, "the")
    .replace(
      /\b(SKILL|ATTACK|POWER|STATUS|CURSE|WEAK|VULNERABLE|POISON|BLEED|THORNS)\b/g,
      (match) => match.charAt(0) + match.slice(1).toLowerCase()
    )
    .replace(
      /\b(COMPETENCE|ATTAQUE|POUVOIR|STATUT|MALEDICTION|FAIBLESSE|VULNERABLE|POISON|SAIGNEMENT|EPINES)\b/g,
      (match) => match.charAt(0) + match.slice(1).toLowerCase()
    )
    .trim();

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function normalizeSourceText(value: string): string {
  let normalized = stripDiacritics(
    value
      .replace(/[\u2019`]/g, "'")
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/\u00A0/g, " ")
  );

  for (const [from, to] of SANITIZE_REPLACEMENTS) {
    normalized = normalized.replace(new RegExp(escapeRegExp(from), "g"), to);
  }

  return normalized.replace(/\s{2,}/g, " ").trim();
}

function autoTranslateEntityTextToFr(value: string): string {
  const normalized = normalizeSourceText(value);
  if (normalized.length === 0) return value;

  const exact = FR_EXACT_TEXT[normalized];
  if (exact) return exact;

  const translated = cleanupTranslatedText(
    applyWordReplacements(
      applyPhraseReplacements(normalized, FR_PHRASE_REPLACEMENTS),
      FR_WORD_REPLACEMENT_ENTRIES
    )
  );

  return translated.length > 0 ? translated : normalized;
}

function autoTranslateEntityTextToEn(value: string): string {
  const normalized = normalizeSourceText(value);
  if (normalized.length === 0) return value;

  const translated = cleanupTranslatedText(
    applyWordReplacements(
      applyPhraseReplacements(normalized, EN_PHRASE_REPLACEMENTS),
      EN_WORD_REPLACEMENT_ENTRIES
    )
  );

  return translated.length > 0 ? translated : normalized;
}

function isLikelyFrenchText(value: string): boolean {
  return FRENCH_HINT_PATTERN.test(value);
}

function isGarbledText(value: string): boolean {
  return GARBLED_PATTERN.test(value);
}

function titleCaseWord(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function formatRelicNameFromId(relicId: string): string {
  const parts = relicId.split("_").filter(Boolean);
  if (parts.length > 1 && RELIC_ID_PREFIXES_TO_DROP.has(parts[0]!)) {
    parts.shift();
  }
  return parts.map(titleCaseWord).join(" ");
}

export function normalizeEntityFallbackText(
  value: string,
  locale: SupportedLocale
): string {
  if (locale === "fr") {
    return autoTranslateEntityTextToFr(value);
  }
  return autoTranslateEntityTextToEn(value);
}

export function normalizeRelicFallbackName(
  relicId: string | undefined,
  fallback: string | undefined,
  locale: SupportedLocale
): string {
  if (!fallback || fallback.trim().length === 0) {
    return relicId ? formatRelicNameFromId(relicId) : "";
  }

  const normalizedSource = normalizeSourceText(fallback);
  if (
    locale === "en" &&
    (isGarbledText(normalizedSource) || isLikelyFrenchText(normalizedSource))
  ) {
    return relicId
      ? formatRelicNameFromId(relicId)
      : autoTranslateEntityTextToEn(fallback);
  }

  const normalized = normalizeEntityFallbackText(fallback, locale);
  if (
    locale === "en" &&
    (isGarbledText(normalized) || isLikelyFrenchText(normalized))
  ) {
    return relicId ? formatRelicNameFromId(relicId) : normalized;
  }

  return normalized;
}
