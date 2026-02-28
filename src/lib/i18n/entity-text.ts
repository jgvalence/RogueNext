import { getCurrentLocale, i18n } from "@/lib/i18n";

function getLocaleString(key: string): string | null {
  const locale = getCurrentLocale();
  const value = i18n.getResource(locale, "translation", key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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

const FR_EXACT_ENTITY_TEXT: Record<string, string> = {
  "The Corrupted Archivist": "L'Archiviste corrompu",
  "Hel, Queen of Niflheim": "Hel, reine de Niflheim",
  "Aspect of the Hydra": "Aspect de l'Hydre",
  "Jormungandr Spawn": "Rejeton de Jormungandr",
  "Shub-Niggurath's Spawn": "Rejeton de Shub-Niggurath",
  "Quetzalcoatl's Wrath": "Colere de Quetzalcoatl",
  "Huitzilopochtli's Enforcer": "Executeur de Huitzilopochtli",
  "Morrigan's Wisp": "Feu-follet de Morrigan",
  "Morrigan's Chosen": "Elu de Morrigan",
  "Dagda's Shadow": "Ombre de Dagda",
  "Cernunnos's Shade": "Ombre de Cernunnos",
  "Baba Yaga's Hut": "Cabane de Baba Yaga",
  "Oya's Harbinger": "Messager d'Oya",
  "Warrior's Cry": "Cri du guerrier",
  "Valhalla's Wrath": "Colere du Valhalla",
  "World's End": "Fin du monde",
  "Half-World Strike": "Frappe du demi-monde",
  "Death's Grasp": "Poigne de la mort",
  "Death's Reckoning": "Chatiment de la mort",
  "Multi-Head Strike": "Frappe multi-tetes",
  "Hydra's Wrath": "Colere de l'Hydre",
  "Servant's Burden": "Fardeau du serviteur",
  "Sun's Wrath": "Colere du soleil",
  "Maat's Decree": "Decret de Maat",
  "War God's Favor": "Faveur du dieu de la guerre",
  "Guardian's Wall": "Mur du gardien",
  "Winter's Grasp": "Poigne de l'hiver",
  "Lion King's Blow": "Coup du roi lion",
  "Griot's Shield": "Bouclier du griot",
  "Trickster's Bite": "Morsure du filou",
  "Story's End": "Fin de l'histoire",
};

const FR_PHRASE_REPLACEMENTS: Array<readonly [string, string]> = [
  ["start each combat with", "commence chaque combat avec"],
  ["start combat with", "commence le combat avec"],
  ["at the start of each turn", "au debut de chaque tour"],
  ["at the end of your turn", "a la fin de votre tour"],
  ["per unplayed card", "par carte non jouee"],
  ["per card still in hand", "par carte encore en main"],
  ["per merchant visit", "par visite chez le marchand"],
  ["per turn", "par tour"],
  ["unspent energy", "energie non depensee"],
  ["extra draw", "pioche supplementaire"],
  ["draw 1 extra card", "pioche 1 carte supplementaire"],
  [
    "first purchase in each shop refreshes the full stock",
    "le premier achat dans chaque boutique rafraichit tout le stock",
  ],
  ["you can purge up to", "vous pouvez purger jusqu'a"],
  [
    "gain 1 max hp per normal enemy killed, 2 per elite, 5 per boss",
    "gagne 1 PV max par ennemi normal tue, 2 par elite, 5 par boss",
  ],
  ["max 3", "max 3"],
];

const FR_WORD_REPLACEMENTS: Record<string, string> = {
  ancient: "ancien",
  energy: "energie",
  crystal: "cristal",
  bookmark: "marque-page",
  iron: "fer",
  runic: "runique",
  eternal: "eternel",
  lucky: "chanceux",
  charm: "charme",
  surgeons: "chirurgien",
  blood: "sang",
  guardian: "gardien",
  archivist: "archiviste",
  wolf: "loup",
  hydra: "hydre",
  solar: "solaire",
  eye: "oeil",
  void: "vide",
  obsidian: "obsidienne",
  feather: "plume",
  drum: "tambour",
  thorn: "epine",
  mantle: "manteau",
  spectral: "spectral",
  fading: "fanant",
  codex: "codex",
  reactive: "reactive",
  scholars: "erudit",
  stone: "pierre",
  gain: "gagne",
  each: "chaque",
  card: "carte",
  cards: "cartes",
  played: "jouee",
  grants: "donne",
  grant: "donne",
  block: "armure",
  ink: "encre",
  focus: "concentration",
  strength: "force",
  thorns: "epines",
  max: "max",
  draw: "pioche",
  extra: "supplementaire",
  turn: "tour",
  turns: "tours",
  with: "avec",
  and: "et",
  of: "de",
  at: "a",
  end: "fin",
  start: "debut",
  your: "votre",
  remaining: "restante",
  conserved: "conservee",
  between: "entre",
  first: "premier",
  purchase: "achat",
  shop: "boutique",
  refreshes: "rafraichit",
  full: "complet",
  stock: "stock",
  can: "peut",
  purge: "purger",
  up: "jusqu'a",
  times: "fois",
  visit: "visite",
  enemy: "ennemi",
  killed: "tue",
  elite: "elite",
  boss: "boss",
  plus: "plus",
  deal: "inflige",
  damage: "degats",
  heal: "soin",
  strike: "frappe",
  slash: "entaille",
  bite: "morsure",
  crush: "ecrasement",
  slam: "impact",
  spear: "lance",
  shield: "bouclier",
  drain: "drain",
  storm: "tempete",
  ice: "glace",
  hex: "malefice",
  wrath: "colere",
  fang: "croc",
  lash: "fouet",
  sand: "sable",
  ward: "protection",
  soul: "ame",
  mind: "esprit",
  coil: "etreinte",
  toxic: "toxique",
  binding: "entrave",
  curse: "malediction",
  blow: "coup",
  frost: "givre",
  fist: "poing",
  cry: "cri",
  snap: "claquement",
  howl: "hurlement",
  grasp: "poigne",
  surge: "deferlement",
  wall: "mur",
  talon: "serre",
  stomp: "pietinement",
  ritual: "rituel",
  stab: "estoc",
  poison: "poison",
  cloud: "nuage",
  touch: "toucher",
  swing: "balayage",
  smash: "fracas",
  thrust: "percee",
  oath: "serment",
  divine: "divin",
  pack: "meute",
  chain: "chaine",
  death: "mort",
  buffet: "rafale",
  gaze: "regard",
  charge: "charge",
  roar: "rugissement",
  blade: "lame",
  burden: "fardeau",
  judgment: "jugement",
  decree: "decret",
  barrier: "barriere",
  scorch: "brulure",
  cut: "coupe",
  fray: "effilochage",
  claw: "griffe",
  dark: "sombre",
  sky: "ciel",
  fear: "peur",
  night: "nuit",
  armor: "armure",
  omen: "presage",
  lance: "lance",
  ancestral: "ancestral",
  lightning: "foudre",
  splatter: "eclaboussure",
  pulverize: "pulverisation",
  quick: "rapide",
  tip: "pointe",
  shadow: "ombre",
  weaken: "affaiblissement",
  flood: "inondation",
  corrupt: "corruption",
  titan: "titan",
  shatter: "brisure",
  grind: "broyage",
  ensnare: "entrave",
  heavy: "lourd",
  fortify: "fortification",
  devour: "devoration",
  crushing: "ecrasant",
  verdict: "verdict",
  erasure: "effacement",
  index: "index",
  grave: "tombe",
  frenzied: "frenetique",
  double: "double",
  bash: "fracassement",
  mark: "marque",
  chant: "chant",
  hold: "maintien",
  disarm: "desarmement",
  squeeze: "compression",
  scale: "ecaille",
  lunge: "ruade",
  break: "bris",
  realm: "royaume",
  reckoning: "chatiment",
  screech: "cri",
  boulder: "rocher",
  throw: "lancer",
  glare: "eclat",
  petrify: "petrification",
  constrict: "constriction",
  kiss: "baiser",
  bronze: "bronze",
  acid: "acide",
  regenerate: "regeneration",
  overwhelm: "submersion",
  petrifying: "petrifiant",
  viper: "vipere",
  triple: "triple",
  necrotic: "necrotique",
  gnaw: "rongement",
  infest: "infestation",
  dune: "dune",
  funerary: "funeraire",
  servant: "serviteur",
  sun: "soleil",
  eclipse: "eclipse",
  lunar: "lunaire",
  abyssal: "abyssal",
  mad: "folie",
  prophecy: "prophetie",
  mirror: "miroir",
  madness: "folie",
  tentacle: "tentacule",
  jaguar: "jaguar",
  lion: "lion",
  trickster: "filou",
  story: "histoire",
  margin: "marge",
  appendix: "annexe",
  redacted: "censuree",
  quill: "plume",
  slime: "gelatine",
  paper: "papier",
  golem: "golem",
  sprite: "esprit",
  tome: "tome",
  wraith: "spectre",
  scroll: "parchemin",
  serpent: "serpent",
  archon: "archonte",
  colossus: "colosse",
  wyrm: "wyrm",
  chapter: "chapitre",
  rune: "rune",
  maiden: "guerriere",
  shaman: "chaman",
  chosen: "elu",
  queen: "reine",
  spawn: "rejeton",
  priest: "pretre",
  knight: "chevalier",
  champion: "champion",
  tendril: "vrille",
  shard: "eclat",
  idol: "idole",
  echo: "echo",
  raider: "pillard",
  druid: "druide",
  apprentice: "apprenti",
  wisp: "feu-follet",
  shade: "ombre",
  witch: "sorciere",
  hunter: "chasseur",
  beast: "bete",
  hound: "limier",
  harbinger: "messager",
};

const FR_WORD_REPLACEMENT_ENTRIES = Object.entries(FR_WORD_REPLACEMENTS).sort(
  ([a], [b]) => b.length - a.length
);

function autoTranslateEntityTextToFr(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) return value;

  const exact = FR_EXACT_ENTITY_TEXT[trimmed];
  if (exact) return exact;

  let translated = trimmed;

  for (const [from, to] of FR_PHRASE_REPLACEMENTS) {
    const regex = new RegExp(escapeRegExp(from), "gi");
    translated = translated.replace(regex, (match) =>
      applyCasePattern(match, to)
    );
  }

  for (const [from, to] of FR_WORD_REPLACEMENT_ENTRIES) {
    const regex = new RegExp(`\\b${escapeRegExp(from)}\\b`, "gi");
    translated = translated.replace(regex, (match) =>
      applyCasePattern(match, to)
    );
  }

  translated = translated
    .replace(/\s+([.,!?:;])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();

  return translated.length > 0 ? translated : value;
}

function maybeTranslateFallbackText(value: string): string {
  if (getCurrentLocale() !== "fr") return value;
  return autoTranslateEntityTextToFr(value);
}

function toI18nKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function localizeRelicName(
  relicId: string | undefined,
  fallback: string | undefined
): string {
  if (!relicId) return fallback ? maybeTranslateFallbackText(fallback) : "";
  return (
    getLocaleString(`relics.${relicId}.name`) ??
    (fallback ? maybeTranslateFallbackText(fallback) : relicId)
  );
}

export function localizeRelicDescription(
  relicId: string | undefined,
  fallback: string | undefined
): string {
  if (!relicId) return fallback ? maybeTranslateFallbackText(fallback) : "";
  return (
    getLocaleString(`relics.${relicId}.description`) ??
    (fallback ? maybeTranslateFallbackText(fallback) : relicId)
  );
}

export function localizeUsableItemName(
  usableItemId: string | undefined,
  fallback: string | undefined
): string {
  if (!usableItemId)
    return fallback ? maybeTranslateFallbackText(fallback) : "";
  return (
    getLocaleString(`usableItems.${usableItemId}.name`) ??
    (fallback ? maybeTranslateFallbackText(fallback) : usableItemId)
  );
}

export function localizeUsableItemDescription(
  usableItemId: string | undefined,
  fallback: string | undefined
): string {
  if (!usableItemId)
    return fallback ? maybeTranslateFallbackText(fallback) : "";
  return (
    getLocaleString(`usableItems.${usableItemId}.description`) ??
    (fallback ? maybeTranslateFallbackText(fallback) : usableItemId)
  );
}

export function localizeEnemyName(
  enemyId: string | undefined,
  fallback: string | undefined
): string {
  const fallbackValue = fallback ?? enemyId ?? "";
  if (!enemyId) return maybeTranslateFallbackText(fallbackValue);
  return (
    getLocaleString(`enemies.${enemyId}.name`) ??
    maybeTranslateFallbackText(fallbackValue)
  );
}

export function localizeEnemyAbilityName(
  enemyId: string | undefined,
  abilityName: string | undefined
): string {
  const fallbackValue = abilityName ?? "";
  if (!fallbackValue) return "";

  const abilityKey = toI18nKey(fallbackValue);
  if (enemyId && abilityKey) {
    const perEnemy = getLocaleString(`enemyAbilities.${enemyId}.${abilityKey}`);
    if (perEnemy) return perEnemy;
  }

  if (abilityKey) {
    const global = getLocaleString(`enemyAbilities.global.${abilityKey}`);
    if (global) return global;
  }

  return maybeTranslateFallbackText(fallbackValue);
}
