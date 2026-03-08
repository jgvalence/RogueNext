export const en = {
  common: {
    language: "Language",
    french: "FR",
    english: "EN",
    close: "Close",
    back: "Back",
  },
  home: {
    kicker: "Deck-builder Roguelike",
    subtitle: "Explore books of mythology. Build your deck. Survive.",
    play: "Play",
    library: "Library",
    leaderboard: "Leaderboard",
    rules: "Rules",
    logout: "Logout",
    signup: "Sign up",
    signin: "Sign in",
    loginHint: "Sign in to save your progression",
    signedInHint: "Your grimoire is open. Begin your next expedition.",
    ritualKicker: "Navigation Board",
    ritualTitle: "Run Plan",
    ritualSubtitle:
      "Trace your path, refine your deck, then crush the final boss.",
    pathLabel: "Progression sequence",
    modeLabel: "Doctrine",
    modeValue: "Tactical roguelike",
    pathSteps: ["Combat", "Elite", "Merchant", "Boss"],
    quickFacts: {
      floors: "Floors",
      rooms: "Rooms / floor",
      rewardChoices: "Card choices",
      startingEnergy: "Starting energy",
    },
    tags: [
      "Tactical combat",
      "Deck-building",
      "World mythologies",
      "Roguelike",
    ],
  },
  leaderboard: {
    kicker: "Global Ranking",
    title: "Archivists Hall",
    subtitle:
      "Top players ranked by best infinite floor first, then victories, difficulty progression, and best clear time.",
    backHome: "Home",
    loadError: "Unable to load leaderboard: {{message}}",
    empty: "No run statistics available yet.",
    playerFallback: "Archivist {{id}}",
    you: "You",
    noTime: "-",
    none: "-",
    columns: {
      rank: "Rank",
      player: "Player",
      wins: "Wins",
      runs: "Runs",
      winRate: "Win Rate",
      bestInfiniteFloor: "Best Infinite Floor",
      bestDifficulty: "Highest Difficulty",
      bestTime: "Times by Diff",
    },
  },
  auth: {
    back: "Back",
    password: "Password",
    signin: {
      subtitle: "Sign in to continue",
      invalidCredentials: "Incorrect email or password",
      loading: "Signing in...",
      submit: "Sign in",
      noAccount: "No account yet?",
      goSignup: "Sign up",
    },
    signup: {
      subtitle: "Create your account to play",
      nameOptional: "Name (optional)",
      namePlaceholder: "Explorer",
      passwordPlaceholder: "6 characters minimum",
      loading: "Signing up...",
      submit: "Sign up",
      hasAccount: "Already have an account?",
      goSignin: "Sign in",
      autoSigninError: "Account created, but sign-in failed. Please try again.",
    },
  },
  biome: {
    LIBRARY: "The Library",
    VIKING: "Viking Lands",
    GREEK: "Ancient Greece",
    EGYPTIAN: "Eternal Egypt",
    LOVECRAFTIAN: "Lovecraftian Abyss",
    AZTEC: "Aztec Empire",
    CELTIC: "Celtic Forests",
    RUSSIAN: "Russian Steppes",
    AFRICAN: "African Savannas",
  },
  library: {
    backHome: "Home",
    title: "Panlibrarium Library",
    collectedStories: "{{unlocked}}/{{total}} stories collected",
    collection: "Collection",
    bestiary: "Bestiary",
    startRun: "Start Run",
    tier: "Tier",
    permanentBonus: "Permanent bonus",
    cost: "Cost",
    availableAmount: "available",
    prerequisites: "Prerequisites",
    ownedStory: "Story owned",
    unlocking: "Unlocking...",
    unlock: "Unlock",
    missingPrereqs: "Missing prerequisites",
    insufficientResources: "Insufficient resources",
    genericError: "An error occurred.",
    loadErrorTitle: "Failed to load the library",
    collectionLoadErrorTitle: "Failed to load the collection",
    firstVisitTutorial: {
      kicker: "Library tutorial",
      title: "This is where runs become permanent progression",
      description:
        "The Library is your meta-progression hub. Resources earned during runs are spent here to unlock stories that strengthen every future run.",
      resourcesTitle: "Resources",
      resourcesDescription:
        "Each biome grants its own resource after combat. The bar at the top shows your current stock so you can see which stories you can afford.",
      treeTitle: "Skill tree",
      treeDescription:
        "Each book is a node in the tree. Unlocking a story grants a permanent bonus, but deeper branches require prerequisites or more resources first.",
      tip: "Start with the accessible Library biome nodes, then branch out as your expeditions bring back more resources.",
      gotIt: "Explore the library",
    },
    energyStoryTutorial: {
      kicker: "First purchase",
      description:
        "You recovered exactly enough Pages to unlock the Treatise of Energy. This story grants +1 max energy on all your future runs.",
    },
    bonus: {
      extraDraw: "+{{value}} draw each turn",
      extraEnergyMax: "+{{value}} max energy",
      extraInkMax: "+{{value}} max ink",
      inkPerCardChance: "+{{value}}% chance to gain ink on card play",
      inkPerCardValue: "+{{value}} ink when proc triggers",
      startingInk: "Start combat with +{{value}} ink",
      startingBlock: "+{{value}} block at combat start",
      startingStrength: "+{{value}} strength at combat start",
      startingRegen: "Recover +{{value}} HP at turn start",
      firstHitDamageReduction: "First hit taken: -{{value}}% damage",
      extraHp: "+{{value}} max HP",
      extraHandAtStart: "+{{value}} cards in opening hand",
      attackBonus: "+{{value}} attack card damage",
      allySlots: "+{{value}} ally slot(s)",
      startingGold: "+{{value}} starting gold each run",
      extraCardRewardChoices: "+{{value}} card reward choices",
      relicDiscount: "{{value}}% relic discount",
      unlockInkPower: "Unlock ink power {{power}}",
      unlockPowerSlot: "Unlock power slot {{slot}}",
      healAfterCombat: "Recover {{value}}% max HP after combat",
      healAfterCombatFlat: "Recover {{value}} HP after combat",
      exhaustKeepChance: "{{value}}% chance to not exhaust a card",
      survivalOnce: "Survive at 1 HP once per run",
      freeUpgradePerRun: "Upgrade one card for free each run",
      startingRareCard: "Start each run with a random rare card",
    },
  },
  gameHub: {
    loading: "Loading...",
    retry: "Retry",
    unknownError: "Unable to load game data.",
    failedToStart: "Failed to start game: {{message}}",
  },
  collection: {
    title: "Collection",
    unlockedCount: "{{unlocked}}/{{total}} unlocked",
    cardSummary: "{{unlocked}} unlocked - {{locked}} locked - {{total}} cards",
    relicSummary:
      "{{unlocked}} unlocked - {{locked}} locked - {{total}} relics",
    backToLibrary: "Back to Library",
    startRun: "Start Run",
    tabs: {
      runOptions: "Starting options",
      cards: "Cards",
      relics: "Relics",
    },
    allBiomes: "All biomes",
    allTypes: "All types",
    attack: "Attack",
    defenseSkill: "Defense (Skill)",
    power: "Power",
    allOwnerships: "All origins",
    neutralOnly: "Neutral",
    characterTypedOnly: "Character-typed",
    allRarities: "All rarities",
    bossRelicRarity: "Boss relic",
    allStates: "All states",
    unlocked: "Unlocked",
    locked: "Locked",
    searchPlaceholder: "Search card name...",
    searchRelicPlaceholder: "Search relic name...",
    noCardsForFilters: "No cards match these filters.",
    noRelicsForFilters: "No relics match these filters.",
    energy: "energy",
    neutralBadge: "Neutral",
    characterTypedBadge: "Typed {{character}}",
    relicSourceBoss: "Source: boss {{boss}}",
    relicSourceGeneral: "Source: general",
    whyLocked: "Why this card is locked",
    whyRelicLocked: "Why this relic is locked",
    missingCondition: "Missing condition",
    progress: "Progress",
    alwaysUnlocked: "Always unlocked",
    relicUnlockBestGold: "Reach {{gold}} gold in a single run",
    relicUnlockDifficultyWins:
      "Win {{wins}} run(s) on difficulty {{difficulty}}",
    relicUnlockCharacterDifficultyWins:
      "Win {{wins}} run(s) on difficulty {{difficulty}} with {{character}}",
    runConditions: {
      title: "Starting options",
      summary:
        "{{unlocked}}/{{total}} unlocked - Runs: {{runs}} - Wins: {{wins}}",
      unlockCondition: "Unlock condition",
      unlockRuns: "Complete at least {{runs}} run(s)",
      unlockWins: "Win at least {{wins}} run(s)",
      unlockEnemyKills: "Defeat {{enemy}} {{kills}} time(s)",
      unlockRunsAndWins:
        "Complete at least {{runs}} run(s) and win {{wins}} run(s)",
    },
  },
  bestiary: {
    title: "Realm Bestiary",
    discoveredCount: "{{discovered}}/{{total}} entries discovered",
    backToLibrary: "Back to Library",
    startRun: "Start Run",
    allBiomes: "All biomes",
    allTypes: "All types",
    noEntries: "No entries match this filter.",
    type: {
      NORMAL: "Normal",
      ELITE: "Elite",
      BOSS: "Boss",
    },
    state: {
      discovered: "Discovered",
      locked: "Locked",
    },
    lockedName: "???",
    lockedLore: "This entry is revealed after your first encounter.",
    stats: "Base stats",
    hp: "HP",
    speed: "Speed",
    kills: "Victories",
    loreTier: "Lore {{current}}/{{total}}",
    nextLoreAt: "next entry at {{count}}",
  },
  runCondition: {
    select: {
      kicker: "New run",
      title: "Choose a starting option",
      subtitle: "Pick 1 option among 3.",
      pickAction: "Choose this option",
    },
    bossStart: {
      name: "{{boss}} Blessing",
      description: "Start the run with: {{bonus}}.",
      bonusFallback: "Boss start bonus",
    },
    category: {
      LIGHT_BOON: "Light boon",
      BOON_WITH_DRAWBACK: "Boon + drawback",
      BONUS_CARD: "Bonus card",
      GOOD_BAD_CARD: "Good + bad card",
      SPECIAL_RULE: "Special rule",
      UNIQUE_MECHANIC: "Unique mechanic",
    },
    definitions: {
      vanilla_run: {
        name: "No Change",
        description: "Classic run with no special rule.",
      },
      quiet_pockets: {
        name: "Quiet Pockets",
        description: "Start with +20 gold.",
      },
      tempered_flesh: {
        name: "Tempered Flesh",
        description: "Start with +12 max HP, but -15 gold.",
      },
      open_grimoire: {
        name: "Open Grimoire",
        description: "Add Fortify to your starting deck.",
      },
      inked_beginning: {
        name: "Inked Beginning",
        description: "Start each combat with +2 ink.",
      },
      battle_manual: {
        name: "Battle Manual",
        description: "Upgrade 2 random cards in your starting deck.",
      },
      packed_supplies: {
        name: "Packed Supplies",
        description:
          "Remove 1 random starter card and add 1 random collectible card.",
      },
      curators_patronage: {
        name: "Curator's Patronage",
        description: "Start with the Prep Satchel relic, but lose 12 max HP.",
      },
      fractured_archive: {
        name: "Fractured Archive",
        description:
          "Upgrade 3 random cards, but add 2 Haunting Regret to your deck.",
      },
      severed_index: {
        name: "Severed Index",
        description:
          "Remove 2 random starter cards, then add 1 random Rare card and upgrade 1 random card.",
      },
      merciless_routes: {
        name: "Merciless Routes",
        description:
          "No merchants and only one path, but combat rewards are doubled.",
      },
      forbidden_contract: {
        name: "Forbidden Contract",
        description: "Add Mythic Blow and Haunting Regret, but lose 6 max HP.",
      },
      single_path: {
        name: "Single Path",
        description: "Only one room option at each step.",
      },
      eventful_routes: {
        name: "Eventful Routes",
        description: "No merchants, more special rooms.",
      },
      battle_rite: {
        name: "Battle Rite",
        description: "Start with +1 Strength, but lose 8 max HP.",
      },
      chaos_draft: {
        name: "Chaos Draft",
        description: "Replace your starting deck with 10 random cards.",
      },
      boss_rush: {
        name: "Boss Rush",
        description:
          "All combats become boss fights. Combat rewards are doubled.",
      },
      veterans_oath: {
        name: "Snokin Practitioners",
        description: "Recover 100% HP after each combat, but lose 50 max HP.",
      },
      ink_lender: {
        name: "Ink Loan",
        description:
          "Start each combat with +2 ink and +1 ink per card played, but -20 gold.",
      },
      prepared_wards: {
        name: "Prepared Wards",
        description: "Start with the Warded Ribbon relic.",
      },
      archivist_cache: {
        name: "Archivist Cache",
        description:
          "Add 2 random Common or Uncommon cards to your starting deck.",
      },
      rare_tithe: {
        name: "Rare Tithe",
        description: "Add 1 random Rare card, but lose 14 max HP.",
      },
      surgical_cut: {
        name: "Surgical Cut",
        description:
          "Remove 2 random starter cards and upgrade 2 random cards.",
      },
      quick_studies: {
        name: "Quick Studies",
        description:
          "Upgrade 1 random card and add 1 random Uncommon or Rare card.",
      },
      cursed_compendium: {
        name: "Cursed Compendium",
        description: "Add 2 random cards, but also add 2 Haunting Regret.",
      },
      crystal_loan: {
        name: "Crystal Loan",
        description:
          "Start with the Energy Crystal relic, upgrade 1 random card, but add 1 Haunting Regret.",
      },
      inkwell_bargain: {
        name: "Inkwell Bargain",
        description: "Start with the Inkwell Reservoir relic, but -25 gold.",
      },
      forged_lexicon: {
        name: "Forged Lexicon",
        description:
          "Start with the Battle Lexicon relic, but add 1 Haunting Regret.",
      },
      isolated_trials: {
        name: "Isolated Trials",
        description:
          "Only one path at each room, but add 2 random collectible cards.",
      },
      grim_shortcuts: {
        name: "Grim Shortcuts",
        description:
          "Single-path routes with extra special rooms, +10 gold, but add 1 Haunting Regret.",
      },
      fateful_manuscript: {
        name: "Fateful Manuscript",
        description:
          "Start with +1 max energy and +1 draw each turn, but add 2 Haunting Regret and lose 12 max HP.",
      },
      infinite_mode: {
        name: "Infinite Mode",
        description:
          "No floor cap. No biome resources are granted at the end of the run. Difficulty spikes hard after floor 5.",
      },
    },
  },
  runSetup: {
    kicker: "Run Preparation",
    title: "Configure Your Expedition",
    subtitle:
      "Choose your difficulty, pick your run type, and prepare your opening loadout before entering the first room.",
    firstRunTutorial: {
      kicker: "First run",
      title: "Quick tutorial",
      subtitle:
        "This first run is meant to teach the core loop. Difficulty 0 is the only available chapter for now.",
      steps: {
        chooseDifficulty:
          "Choose level 0. It is the only difficulty available for this first run.",
        pickMode: "Pick Normal for a classic 5-floor run.",
        planRoute:
          "On the map, prioritize fights to grow your deck, then visit merchants when you can afford upgrades.",
        combatFlow:
          "In combat: play cards, watch energy/ink, then end your turn.",
        endOfRun:
          "At the end of the run, claim rewards and return to the Library to invest your resources.",
      },
    },
    sections: {
      character: "Character",
      difficulty: "Difficulty",
      runType: "Run Type",
      runCondition: "Run Option",
      preGameOptions: "Pre-Game Options",
    },
    selected: "Selected",
    modeType: "Mode",
    modeHint: "Choose Normal or Infinite before selecting pre-game options.",
    modeLockedHint: "Run type is locked after selecting a run option.",
    modeNormal: "Normal",
    modeNormalDescription:
      "Classic 5-floor run with regular progression and end-of-run resources.",
    modeInfinite: "Infinite",
    modeInfiniteDescription:
      "No floor cap. Built for leaderboard climbing. No biome resources are awarded.",
    continue: "Start Run",
    readyHint: "Setup complete. You can start the run.",
    missingHint: "Pick a difficulty and a game mode to continue.",
  },
  runDifficulty: {
    select: {
      kicker: "Difficulty",
      title: "Choose a level",
      subtitle: "Clear a level to unlock the next one.",
      pickAction: "Choose this difficulty",
    },
    levelLabel: "Level {{level}}",
    levels: {
      0: {
        chapter: "Chapter I — Awakening",
        subtitle: "An anomaly stirs in the ink",
        name: "Archivist",
        description: "Standard experience, ideal for learning the game.",
      },
      1: {
        chapter: "Chapter II — Disruption",
        subtitle: "The Tomes grow corrupt",
        name: "Watcher",
        description: "Enemies are a bit more dangerous.",
      },
      2: {
        chapter: "Chapter III — Corruption",
        subtitle: "Stories bleed into one another",
        name: "Curator",
        description: "Pressure rises and fights require cleaner play.",
      },
      3: {
        chapter: "Chapter IV — Erasure",
        subtitle: "The Censure is at work",
        name: "Censor",
        description:
          "Elites and bosses become less predictable, and bosses break through your defense more easily.",
      },
      4: {
        chapter: "Chapter V — Amnesia",
        subtitle: "Last chance",
        name: "Abyssal",
        description:
          "Elite and boss fights become much more aggressive, and events are riskier.",
      },
      5: {
        chapter: "Chapter VI — The Abyss",
        subtitle: "There is nothing left to lose",
        name: "Mythic",
        description:
          "Ultimate mode: more elites, relentless enemies, and less reliable rewards.",
      },
    },
  },
  map: {
    floorLabel: "Floor {{floor}}",
    choosePath: "Choose Your Path",
    roomOf: "Room {{current}} of {{total}}",
    bossSuffix: "BOSS",
    elite: "Elite",
    enemyCount_one: "{{count}} enemy",
    enemyCount_other: "{{count}} enemies",
    combatPreview: {
      resourcesLabel: "Resources",
      resourcesBonusHint: "Random bonus: +1 other biome",
      resourcesBonusShort: "+1?",
    },
    floorComplete: "Floor complete!",
    roomType: {
      COMBAT: "Encounter",
      COMBAT_ELITE: "Elite Trial",
      MERCHANT: "Scriptorium",
      SPECIAL: "Chronicle",
      PRE_BOSS: "Anteroom",
    },
    bossRoom: "Boss Lair",
    reward: {
      card: "Card",
      relic: "Relic",
      ally: "Ally",
      maxHp: "Max HP",
    },
    firstMapTutorial: {
      kicker: "Map tutorial",
      title: "Read the floor paths",
      description:
        "Chronicles are event rooms, the Scriptorium helps improve your deck, and elite combats pay more but are far more dangerous.",
      tip: "For this first expedition, study these three options: we are deliberately taking the elite path so you can feel that risk.",
      forcedChoice: "Pick the 3rd card: the elite challenge.",
      gotIt: "Got it",
    },
  },
  stories: {
    encyclopedie_du_savoir: {
      title: "Encyclopedia of Knowledge",
      description:
        "A comprehensive treatise on rapid memorization techniques. +1 card drawn per turn.",
    },
    traite_de_lenergie: {
      title: "Treatise of Energy",
      description:
        "A hermetic manual on channeling vital energy. +1 max energy.",
    },
    grimoire_des_index: {
      title: "Grimoire of Indexes",
      description:
        "An occult indexing system that speeds up combat preparation. Start each combat with 2 additional cards in hand.",
    },
    manuel_de_revision: {
      title: "Revision Manual",
      description:
        "Marginal notes that let you upgrade one card for free before each run.",
    },
    le_codex_infini: {
      title: "The Infinite Codex",
      description:
        "The masterpiece of the Library, a codex that rewrites itself. +1 additional card drawn and card rewards offer one extra choice.",
    },
    saga_de_ragnar: {
      title: "Saga of Ragnar",
      author: "Anonymous",
      description:
        "The exploits of Ragnar Lodbrok set in verse. +1 Strength at the start of each combat.",
    },
    edda_des_berserkers: {
      title: "Edda of the Berserkers",
      description: "The sacred songs of frenzied warriors. +15 max HP.",
    },
    chant_de_skald: {
      title: "Skald's Chant",
      description:
        "Battle poems recited before each assault. +1 base damage on all Attack cards.",
    },
    runes_du_valhalla: {
      title: "Runes of Valhalla",
      description:
        "Runes engraved by Odin himself. Survive at 1 HP once per run.",
    },
    le_poeme_de_beowulf: {
      title: "The Poem of Beowulf",
      description:
        "The epic of the great Germanic hero. +2 starting Strength and elite enemies have 15% less HP.",
    },
    l_odyssee: {
      title: "The Odyssey",
      author: "Homer",
      description:
        "The tale of Odysseus' return, full of cunning and riches. +25 starting gold each run.",
    },
    la_republique: {
      title: "The Republic",
      author: "Plato",
      description:
        "Plato's political philosophy applied to strategic choices. +1 choice in card rewards.",
    },
    les_travaux_d_heracles: {
      title: "The Labors of Heracles",
      description:
        "Twelve trials that teach the art of bargaining with the gods. Relics cost 20% less at the merchant.",
    },
    hymnes_homeriques: {
      title: "Homeric Hymns",
      author: "Homer",
      description:
        "Hymns to the gods of Olympus that attract divine favor. Start each run with a random rare card in your deck.",
    },
    le_banquet: {
      title: "The Symposium",
      author: "Plato",
      description:
        "A dialogue on love and wisdom. All rewards offer one additional choice.",
    },
    livre_des_morts: {
      title: "Book of the Dead",
      description:
        "The Egyptian guide to the afterlife, rich with magical formulas. +2 max Ink.",
    },
    hymne_a_re: {
      title: "Hymn to Ra",
      description:
        "A hymn to the sun god that infuses every action with divine energy. +35% chance to gain Ink when playing a card.",
    },
    textes_des_pyramides: {
      title: "Pyramid Texts",
      description:
        "The oldest religious texts of humanity, carved in stone. Unlocks the LOST_CHAPTER Ink power.",
    },
    papyrus_d_ani: {
      title: "Papyrus of Ani",
      description:
        "The famous funerary papyrus of Ani, charged with mystical energy. Start each combat with 3 Ink.",
    },
    le_rituel_du_soleil: {
      title: "The Sun Ritual",
      description:
        "The secret ritual that seals reality itself. Unlocks the SEAL Ink power and +3 additional max Ink.",
    },
    codex_fejerváry: {
      title: "Fejervary Codex",
      description:
        "The Aztec divination codex, source of physical resilience. +10 max HP.",
    },
    calendrier_de_pierre: {
      title: "Stone Calendar",
      description:
        "The Piedra del Sol reveals regeneration cycles. Recover 3 HP after each combat.",
    },
    chant_de_quetzalcoatl: {
      title: "Song of Quetzalcoatl",
      description:
        "A hymn to the Feathered Serpent, symbol of rebirth. +10 additional max HP.",
    },
    rite_du_soleil_noir: {
      title: "Rite of the Black Sun",
      description:
        "A ritual honoring Tezcatlipoca, master of the dark mirror. +3 additional HP recovered after each combat.",
    },
    le_sacrifice_cosmique: {
      title: "The Cosmic Sacrifice",
      description:
        "The ultimate sacrifice that keeps the sun in motion. +10 max HP and bosses have a chance to drop an extra relic.",
    },
    necronomicon_fragment: {
      title: "Necronomicon (fragment)",
      author: "Abdul Alhazred",
      description:
        "A fragment of the cursed book. Cards with Exhaust have a 30% chance not to be exhausted.",
    },
    journal_de_miskatonic: {
      title: "Miskatonic Journal",
      description:
        "Notes from a scholar at Miskatonic University. Start each run with a random rare card.",
    },
    cultes_innommables: {
      title: "Nameless Cults",
      author: "Von Junzt",
      description:
        "The secret treatise on ancient cults. +30% additional chance for a card not to be exhausted.",
    },
    mondes_sans_nom: {
      title: "Nameless Worlds",
      description:
        "A revelation on the elusive nature of reality. Survive at 1 HP once per run (if not already gained via Runes).",
    },
    le_signe_des_anciens: {
      title: "The Sign of the Ancients",
      description:
        "The mystic sign that bends the laws of the cosmos. Inked variants cost 1 less Ink.",
    },
    mabinogion: {
      title: "Mabinogion",
      description:
        "Welsh tales of the First Branch. Start each combat with 3 Block.",
    },
    cycle_d_ulster: {
      title: "Ulster Cycle",
      description:
        "The epics of Cu Chulainn, champion of Ulster. Recover 2 HP at the start of each turn.",
    },
    taliesin: {
      title: "Taliesin",
      description:
        "Poems of the legendary bard Taliesin. +3 additional Block at the start of each combat.",
    },
    les_triades_galloises: {
      title: "The Welsh Triads",
      description:
        "Traditional Welsh wisdom organized in triads. +1 damage on Attack cards.",
    },
    le_chaudron_de_dagda: {
      title: "Dagda's Cauldron",
      description:
        "The magical cauldron that nourishes and heals all who need it. +4 Block and +1 starting Strength.",
    },
    byliny_de_ilya: {
      title: "Byliny of Ilya",
      description:
        "Heroic songs of Ilya Muromets, hero of the Russian people. +4 Block at the start of each combat.",
    },
    contes_de_baba_yaga: {
      title: "Tales of Baba Yaga",
      description:
        "Stories of the witch of the Russian forest. The first hit taken in combat deals 30% less damage.",
    },
    l_oiseau_de_feu: {
      title: "The Firebird",
      description:
        "The tale of capturing the mythical bird. +20 starting gold each run.",
    },
    domovoi: {
      title: "Domovoi",
      description:
        "Rituals to win the favor of the household guardian spirit. +4 additional Block.",
    },
    le_grand_livre_des_sorts: {
      title: "The Great Book of Spells",
      description:
        "The forbidden grimoire of Russian tradition. +1 max energy and +5 additional starting Block.",
    },
    epopee_de_soundiata: {
      title: "Epic of Sundiata",
      description:
        "The founding epic of the Mali Empire. Unlocks the ally system (1 slot).",
    },
    contes_d_anansi: {
      title: "Tales of Anansi",
      description:
        "The tricks of the spider trickster, master of stories. +1 choice in card rewards.",
    },
    rites_de_passage: {
      title: "Rites of Passage",
      description:
        "Initiatory rituals from many African cultures. +1 ally slot (max 2).",
    },
    masque_de_legba: {
      title: "Mask of Legba",
      description:
        "The mask of the crossroads god Legba, master of paths. +1 starting Strength.",
    },
    le_griot_immortel: {
      title: "The Immortal Griot",
      description:
        "The living memory of all African traditions. +1 ally slot (max 3) and allies gain 25% additional HP.",
    },
  },
  cards: {
    heavy_strike: { name: "Inkstone Blow" },
    cleave: { name: "Page Rend" },
    piercing_word: { name: "Piercing Word" },
    poison_quill: { name: "Poison Quill" },
    mythic_blow: { name: "Legendary Chapter" },
    swift_slash: { name: "Tome Slash" },
    quick_feint: { name: "Scripted Feint" },
    bastion_crash: { name: "Shelf Collapse" },
    venom_echo: { name: "Venom Echo" },
    fortify: { name: "Archive Seal" },
    scholars_focus: { name: "Scholar's Focus" },
    healing_script: { name: "Healing Script" },
    ink_flow: { name: "Ink Flow" },
    adrenaline: { name: "Ink Rush" },
    rage_of_ages: { name: "Rage of Ages" },
    tome_strike: { name: "Tome Strike" },
    double_strike: { name: "Dual Script" },
    curse_word: { name: "Curse Word" },
    final_chapter: { name: "Final Chapter" },
    vulnerability_hex: { name: "Vulnerability Hex" },
    meditation: { name: "Silent Study" },
    quick_recovery: { name: "Index Recovery" },
    inked_sweep: { name: "Inked Sweep" },
    brace: { name: "Stacked Volumes" },
    ink_surge: { name: "Ink Surge" },
    exploit_weakness: { name: "Exposed Margin" },
    iron_will: { name: "Scribal Resolve" },
    hexed_parchment: { name: "Hexed Parchment" },
    haunting_regret: { name: "Haunting Regret" },
    // VIKING — Scribe
    iron_verse: { name: "Iron Verse" },
    frost_rune_shield: { name: "Frost Rune Shield" },
    scald_cry: { name: "Scald Cry" },
    rune_storm: { name: "Rune Storm" },
    battle_inscription: { name: "Battle Inscription" },
    odin_script: { name: "Odin's Script" },
    epic_saga: { name: "Epic Saga" },
    // VIKING — Bibliothécaire
    nordic_treatise: { name: "Nordic Treatise" },
    rune_curse: { name: "Rune Curse" },
    saga_archive: { name: "Saga Archive" },
    norn_prophecy: { name: "Norn Prophecy" },
    ancient_ward: { name: "Ancient Ward" },
    saga_keeper: { name: "Saga Keeper" },
    valhalla_codex: { name: "Valhalla Codex" },
    // GREEK — Scribe
    logos_strike: { name: "Logos Strike" },
    philosophers_quill: { name: "Philosopher's Quill" },
    epic_simile: { name: "Epic Simile" },
    hermes_dash: { name: "Hermes Dash" },
    written_prophecy: { name: "Written Prophecy" },
    titans_wrath: { name: "Titan's Wrath" },
    ares_verse: { name: "Ares Verse" },
    olympian_scripture: { name: "Olympian Scripture" },
    // GREEK — Bibliothécaire
    oracle_scroll: { name: "Oracle Scroll" },
    shield_of_athena: { name: "Shield of Athena" },
    sphinx_riddle: { name: "Sphinx Riddle" },
    apollos_archive: { name: "Apollo's Archive" },
    labyrinth_trap: { name: "Labyrinth Trap" },
    pythian_codex: { name: "Pythian Codex" },
    fates_decree: { name: "Fate's Decree" },
    // EGYPTIAN — Scribe
    hieroglyph_strike: { name: "Hieroglyph Strike" },
    sacred_papyrus: { name: "Sacred Papyrus" },
    spell_inscription: { name: "Spell Inscription" },
    book_of_ra: { name: "Book of Ra" },
    sacred_ink_burst: { name: "Sacred Ink Burst" },
    scribes_judgment: { name: "Scribe's Judgment" },
    // EGYPTIAN — Bibliothécaire
    death_scroll: { name: "Death Scroll" },
    mummy_ward: { name: "Mummy Ward" },
    plague_of_words: { name: "Plague of Words" },
    osiris_archive: { name: "Osiris Archive" },
    funerary_rite: { name: "Funerary Rite" },
    desert_wisdom: { name: "Desert Papyrus" },
    embalmed_tome: { name: "Embalmed Tome" },
    book_of_the_dead: { name: "Book of the Dead" },
    // LOVECRAFTIAN — Scribe
    void_quill: { name: "Void Quill" },
    cursed_inscription: { name: "Cursed Inscription" },
    black_page: { name: "Black Page" },
    forbidden_verse: { name: "Forbidden Verse" },
    eldritch_script: { name: "Eldritch Script" },
    necrotic_words: { name: "Necrotic Words" },
    void_scripture: { name: "Void Scripture" },
    // LOVECRAFTIAN — Bibliothécaire
    sealed_tome: { name: "Sealed Tome" },
    library_horror: { name: "Library Horror" },
    readers_pact: { name: "Reader's Pact" },
    forbidden_index: { name: "Forbidden Index" },
    void_librarian: { name: "Void Librarian" },
    necronomicon_page: { name: "Necronomicon Page" },
    cosmic_archive: { name: "Cosmic Archive" },
    // AZTEC — Scribe
    obsidian_quill: { name: "Obsidian Quill" },
    codex_strike: { name: "Codex Strike" },
    sacrificial_word: { name: "Sacrificial Word" },
    xipe_shield: { name: "Xipe Shield" },
    sun_codex: { name: "Sun Codex" },
    hummingbird_strike: { name: "Hummingbird Strike" },
    blood_codex: { name: "Blood Codex" },
    // AZTEC — Bibliothécaire
    calendric_ward: { name: "Calendric Ward" },
    poison_herb: { name: "Sacred Herb" },
    star_chart: { name: "Star Chart" },
    quetzal_shield: { name: "Quetzal Shield" },
    temple_archive: { name: "Temple Archive" },
    obsidian_ward: { name: "Obsidian Curse" },
    feathered_serpent: { name: "Feathered Serpent" },
    // CELTIC — Scribe
    kells_strike: { name: "Kells Strike" },
    bardic_verse: { name: "Bardic Verse" },
    illuminated_shield: { name: "Illuminated Shield" },
    iron_bard: { name: "Iron Bard" },
    triquetra_mark: { name: "Triquetra Mark" },
    ogham_inscription: { name: "Ogham Inscription" },
    celtic_illumination: { name: "Celtic Illumination" },
    green_man_verse: { name: "Green Man Verse" },
    // CELTIC — Bibliothécaire
    herb_lore: { name: "Herb Lore" },
    fairy_veil: { name: "Fairy Veil" },
    morrigan_curse: { name: "Morrigan Curse" },
    cauldron_lore: { name: "Cauldron Lore" },
    selkie_song: { name: "Selkie Song" },
    ancient_manuscript: { name: "Ancient Manuscript" },
    world_tree: { name: "World Tree" },
    // RUSSIAN — Scribe
    byliny_verse: { name: "Byliny Verse" },
    bogatyr_strike: { name: "Bogatyr Strike" },
    winter_inscription: { name: "Winter Inscription" },
    blizzard_verse: { name: "Blizzard Verse" },
    firebird_script: { name: "Firebird Script" },
    baba_yaga_deal: { name: "Baba Yaga's Deal" },
    koschei_strike: { name: "Koschei Strike" },
    folk_epic: { name: "Folk Epic" },
    // RUSSIAN — Bibliothécaire
    fur_binding: { name: "Fur Binding" },
    folk_curse: { name: "Folk Curse" },
    matryoshka_lore: { name: "Matryoshka Lore" },
    snowstorm_trap: { name: "Snowstorm Trap" },
    leshy_ward: { name: "Leshy Ward" },
    zhar_ptitsa: { name: "Zhar-Ptitsa" },
    folklore_archive: { name: "Folklore Archive" },
    frost_witch: { name: "Frost Witch" },
    // AFRICAN — Scribe
    drum_strike: { name: "Griot's Beat" },
    war_dance: { name: "Battle Chant" },
    ink_of_ancestors: { name: "Ink of Ancestors" },
    griot_strike: { name: "Griot Strike" },
    anansi_tale: { name: "Anansi's Tale" },
    buffalo_charge: { name: "Griot's Epic" },
    ancestral_verse: { name: "Ancestral Verse" },
    sunbird_power: { name: "Sunbird's Script" },
    // AFRICAN — Bibliothécaire
    spider_web: { name: "Web of Lore" },
    baobab_shield: { name: "Baobab Codex" },
    healing_rhythm: { name: "Keeper's Song" },
    oral_history: { name: "Oral History" },
    trickster_lore: { name: "Trickster Lore" },
    ancestor_archive: { name: "Ancestor Archive" },
    cosmic_spider: { name: "Anansi Codex" },
  },
  relics: {
    ancient_quill: { name: "Ancient Quill", description: "+2 max ink" },
    energy_crystal: {
      name: "Energy Crystal",
      description: "+1 energy per turn",
    },
    bookmark: { name: "Bookmark", description: "Draw 1 extra card per turn" },
    ink_stamp: { name: "Ink Stamp", description: "Start combat with 3 ink" },
    iron_binding: {
      name: "Iron Binding",
      description: "+1 ink gained when ink-per-card triggers",
    },
    blighted_compass: {
      name: "Blighted Compass",
      description: "+1 draw per turn, but start combat with Weak.",
    },
    cursed_diacrit: {
      name: "Cursed Diacrit",
      description: "+1 energy per turn, but gain a curse each combat.",
    },
    runic_bulwark: {
      name: "Runic Bulwark",
      description: "Retain 50% of your remaining Block each turn.",
    },
    eternal_hourglass: {
      name: "Eternal Hourglass",
      description: "Unspent energy is conserved between turns.",
    },
    briar_codex: {
      name: "Briar Codex",
      description: "Start each combat with 2 Thorns.",
    },
    warded_ribbon: {
      name: "Warded Ribbon",
      description: "Start each combat with 6 Block.",
    },
    inkwell_reservoir: {
      name: "Inkwell Reservoir",
      description: "+1 max ink and start each combat with 1 ink.",
    },
    battle_lexicon: {
      name: "Battle Lexicon",
      description: "Start each combat with +1 Strength.",
    },
    vital_flask: {
      name: "Vital Flask",
      description: "Recover +5 HP after each combat.",
    },
    menders_charm: {
      name: "Mender's Charm",
      description: "Increase post-combat healing percentage by 50%.",
    },
    gilded_ledger: {
      name: "Gilded Ledger",
      description: "Increase gold gained from combat rewards by 50%.",
    },
    plague_carillon: {
      name: "Plague Carillon",
      description: "Each card played deals 1 damage to all enemies.",
    },
    phoenix_ash: {
      name: "Phoenix Ash",
      description: "Recover 2 HP at the start of each turn.",
    },
    ink_spindle: {
      name: "Ink Spindle",
      description: "At end of turn, gain 1 Focus if your hand is empty.",
    },
    omens_compass: {
      name: "Omen's Compass",
      description:
        "Boss rewards are more likely to include an additional Boss relic option.",
    },
    lucky_charm: {
      name: "Lucky Charm",
      description: "Increases loot luck for better rarity rolls.",
    },
    haggler_satchel: {
      name: "Haggler's Satchel",
      description: "First purchase in each shop refreshes the full stock.",
    },
    surgeons_quill: {
      name: "Surgeon's Quill",
      description: "You can Purge up to 3 times per merchant visit.",
    },
  },
  usableItems: {
    potion_damage: {
      name: "Damage Potion",
      description: "Deal 14 damage to one enemy.",
    },
    potion_block: {
      name: "Shield Potion",
      description: "Gain 12 block.",
    },
  },
  gameCard: {
    type: {
      ATTACK: "Attack",
      SKILL: "Skill",
      POWER: "Power",
      STATUS: "Status",
      CURSE: "Curse",
    },
    rarity: {
      STARTER: "Starter",
      COMMON: "Common",
      UNCOMMON: "Uncommon",
      RARE: "Rare",
    },
    labels: {
      normal: "Normal",
      inked: "Inked",
      ink: "Ink",
      current: "Current",
      upgraded: "Upgraded",
    },
    effect: {
      damage: "Deal {{value}} damage",
      damageAll: "Deal {{value}} damage to all enemies",
      damageEqualBlock: "Deal damage equal to your Block",
      damageBonusIfUpgradedInHand:
        "If this card is upgraded in hand: +{{value}} damage",
      block: "Gain {{value}} block",
      heal: "Heal {{value}} HP",
      draw: "Draw {{value}} cards",
      doublePoison: "Double Poison on target",
      triplePoison: "Triple Poison on target",
      gainEnergy: "Gain {{value}} energy",
      gainInk: "Gain {{value}} ink",
      gainStrength: "Gain {{value}} Strength",
      gainFocus: "Gain {{value}} Focus",
      applyDebuff: "Apply {{value}} {{buff}}",
      applyDebuffAll: "Apply {{value}} {{buff}} to all enemies",
      applyBuff: "Gain {{value}} {{buff}}",
      drainInk: "Drain {{value}} ink",
      exhaust: "Exhaust",
      unplayable: "Unplayable",
      addToDraw: "Add a card to draw pile",
      addToDiscard: "Add a card to discard pile",
      freezeHandCards: "Freeze {{value}} card(s) in hand",
      nextDrawToDiscardThisTurn: "Your next draw goes to discard this turn",
      disableInkPowerThisTurn: "Disable ink power {{power}} this turn",
      increaseCardCostThisTurn: "Cards cost +{{value}} this turn",
      increaseCardCostNextTurn: "Cards cost +{{value}} next turn",
      reduceDrawThisTurn: "Draw -{{value}} this turn",
      reduceDrawNextTurn: "Draw -{{value}} next turn",
      forceDiscardRandom: "Discard {{value}} random card(s)",
      upgradeRandomCardInHand: "Upgrade a random card in hand",
    },
  },
  buff: {
    durationNote_one: "Lasts {{count}} turn.",
    durationNote_other: "Lasts {{count}} turns.",
    POISON: {
      label: "Poison",
      description:
        "Deals {{stacks}} damage at end of turn, then decreases by 1.",
    },
    WEAK: {
      label: "Weak",
      description: "Reduces damage dealt by 25%.",
    },
    VULNERABLE: {
      label: "Vulnerable",
      description: "Increases damage taken by 50%.",
    },
    STUN: {
      label: "Stunned",
      description: "Loses the next turn.",
    },
    STUN_IMMUNITY: {
      label: "Stun Ward",
      description: "Cannot be stunned this turn.",
    },
    STRENGTH: {
      label: "Strength",
      description: "Increases all damage dealt by {{stacks}}.",
    },
    FOCUS: {
      label: "Focus",
      description: "Increases block gained by {{stacks}}.",
    },
    THORNS: {
      label: "Thorns",
      description: "Deals {{stacks}} damage to attackers.",
    },
    BLEED: {
      label: "Bleed",
      description:
        "Deals {{stacks}} damage at end of round (does not decrease, expires by duration).",
    },
  },
  reward: {
    victory: "Victory!",
    gold: "Gold",
    chooseReward: "Choose a reward:",
    chooseRewardCardOrRelic: "Choose your reward: card or relic",
    chooseRewardCard: "Choose your reward: card",
    chooseRewardRelic: "Choose your reward: relic",
    chooseRewardAlly: "Choose your reward: ally",
    noRewardChoices: "No reward choices available.",
    chooseCardToAdd: "Choose a card to add to your deck:",
    continue: "Continue",
    skip: "Skip",
    vitality: "Vitality",
    maxHp: "Max HP",
    maxHpDescription: "Increase your maximum health permanently",
    ally: "Ally",
    firstRewardTutorial: {
      kicker: "Reward tutorial",
      title: "Strengthen your deck",
      description:
        "After combat, pick a reward that fits your plan: card, relic, or ally depending on choices.",
      tip: "Early on, prioritize simple and reliable cards over highly situational effects.",
      gotIt: "Got it",
    },
    target: {
      allEnemies: "all enemies",
      lowestHpEnemy: "lowest HP enemy",
      allyPriority: "ally priority",
      self: "self",
      player: "player",
    },
    effect: {
      damage: "damage {{value}}",
      damageEqualBlock: "damage equal to your block",
      damageBonusIfUpgradedInHand:
        "if this card is upgraded in hand: +{{value}} damage",
      heal: "heal {{value}}",
      block: "block {{value}}",
      drawCards: "draw {{value}}",
      doublePoison: "double poison",
      gainInk: "gain {{value}} ink",
      gainEnergy: "gain {{value}} energy",
      gainFocus: "gain {{value}} focus",
      gainStrength: "gain {{value}} strength",
      applyBuff: "buff {{buff}} {{value}}",
      applyDebuff: "debuff {{buff}} {{value}}",
      drainInk: "drain {{value}} ink",
      fallback: "{{type}} {{value}}",
    },
    resources: {
      PAGES: "Pages",
      RUNES: "Runes",
      LAURIERS: "Laurels",
      GLYPHES: "Glyphs",
      FRAGMENTS: "Fragments",
      OBSIDIENNE: "Obsidian",
      AMBRE: "Amber",
      SCEAUX: "Seals",
      MASQUES: "Masks",
    },
  },
  gameError: {
    title: "Something went wrong",
    description:
      "An error occurred in the game. Your progress has been auto-saved.",
    tryAgain: "Try again",
    backToMenu: "Back to menu",
  },
  run: {
    loading: "Loading game...",
    notFound: "Run not found",
    freeUpgradeTitle: "Free upgrade (Revision Manual)",
    freeUpgradeSubtitle:
      "Choose a non-upgraded card. Hover to preview the upgrade.",
    victoryTitle: "Victory!",
    victorySubtitle:
      "You conquered all {{floor}} floors of the Forbidden Library!",
    defeatTitle: "Defeat",
    defeatSubtitle: "Your story ends here...",
    abandonedTitle: "Run abandoned",
    abandonedSubtitle: "You left this adventure.",
    goldEarned: "Gold earned: {{gold}}",
    goldSimple: "Gold: {{gold}}",
    deckSize: "Deck size: {{count}} cards",
    relicCount: "Relics: {{count}}",
    reachedRoom: "Reached: Room {{room}}/{{total}}",
    resourcesGained: "Resources gained this run",
    cardsUnlocked: "Cards unlocked this run",
    newBestiaryEntryTitle: "New Bestiary entry",
    newBestiaryEntrySingle: "{{name}} added to the Bestiary",
    newBestiaryEntryMultiple: "{{count}} new entries added to the Bestiary",
    none: "None",
    backToLibrary: "Library",
  },
  layout: {
    rotate: "ROTATE",
    rotateDevice: "Rotate your device",
    rotateHint: "Panlibrarium requires landscape mode",
    floor: "Floor {{floor}}",
    room: "Room",
    time: "Time {{value}}",
    hp: "HP",
    gold: "Gold",
    viewDeck: "View deck",
    deck: "Deck",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit fullscreen",
    showRelics: "Show relics",
    relics: "Relics",
    menu: "Menu",
    mute: "Mute",
    unmute: "Unmute",
    abandonConfirm: "End this run now?",
    abandonRun: "End run",
    yourRelics: "Your relics",
    noRelicsYet: "No relics yet.",
  },
  biomeSelect: {
    floorCleared: "Floor {{floor}} cleared",
    title: "Choose your destiny",
    subtitle: "Select the realm you will explore next",
    enemies: "Enemies",
    enterRealm: "Enter this realm",
    floorProgress: "Floor {{floor}} of {{total}}",
    biomes: {
      LIBRARY: {
        name: "The Forbidden Library",
        description:
          "Ancient tomes and ink-born creatures haunt endless shelves.",
        enemyPreview: "Ink Slimes, Tome Wraiths, Chapter Guardian",
        flavor: "The pages whisper forbidden knowledge...",
      },
      VIKING: {
        name: "The Frozen North",
        description: "Norse warriors and mythic beasts roam ice-bound halls.",
        enemyPreview: "Draugr, Shield Maidens, Fenrir",
        flavor: "Valhalla awaits those worthy of its gates.",
      },
      GREEK: {
        name: "The Labyrinthine Pantheon",
        description: "Olympian monsters guard treasures of the ancient world.",
        enemyPreview: "Harpies, Cyclops, Medusa",
        flavor: "The gods play games with mortal lives.",
      },
      EGYPTIAN: {
        name: "The Eternal Sands",
        description: "Undying guardians protect the secrets of the pharaohs.",
        enemyPreview: "Scarab Swarm, Anubis Guard, Ra's Avatar",
        flavor: "Death is but the beginning.",
      },
      LOVECRAFTIAN: {
        name: "The Outer Void",
        description: "Eldritch horrors from beyond reality itself.",
        enemyPreview: "Deep One, Void Cultist, Nyarlathotep Shard",
        flavor: "The stars align in patterns no mind should witness.",
      },
      AZTEC: {
        name: "The Obsidian Temple",
        description: "Jaguar warriors and feathered serpents demand tribute.",
        enemyPreview: "Sun Jaguar, Blood Priest, Tezcatlipoca Echo",
        flavor: "The fifth sun must be fed.",
      },
      CELTIC: {
        name: "The Mist-Veiled Otherworld",
        description: "Fae creatures and druidic spirits dwell beyond the veil.",
        enemyPreview: "Banshee, Thorn Druid, Dagda's Shadow",
        flavor: "The old ways have long memories.",
      },
      RUSSIAN: {
        name: "The Winter Forest",
        description: "Slavic spirits and forest demons lurk in eternal night.",
        enemyPreview: "Frost Witch, Leshy, Koschei the Deathless",
        flavor: "Baba Yaga's hut turns on its chicken legs.",
      },
      AFRICAN: {
        name: "The Spirit Savanna",
        description: "Orishas and ancestral beasts walk the sacred plains.",
        enemyPreview: "Hyena Pack, Mask Hunter, Anansi the Weaver",
        flavor: "The ancestors watch over those who remember them.",
      },
    },
  },
  deckViewer: {
    title: "Your Deck",
    cardsCount_one: "{{count}} card",
    cardsCount_other: "{{count}} cards",
  },
  inkGauge: {
    ink: "INK",
    powerTooltip: "{{description}} ({{cost}} ink)",
    powers: {
      // Scribe
      CALLIGRAPHIE: {
        label: "Calligraphy",
        desc: "Upgrade a random card in hand (this combat)",
      },
      ENCRE_NOIRE: {
        label: "Black Ink",
        desc: "Deal ink x2 damage to all enemies",
      },
      SEAL: {
        label: "Seal",
        desc: "Gain 8 block",
      },
      // Librarian
      VISION: {
        label: "Vision",
        desc: "Draw 2 cards",
      },
      INDEX: {
        label: "Index",
        desc: "Retrieve a card from discard",
      },
      SILENCE: {
        label: "Shhh",
        desc: "An enemy loses their next turn. Elites and bosses resist stun for 1 turn after that",
      },
      // Legacy
      REWRITE: {
        label: "Rewrite",
        desc: "Retrieve a card from discard",
      },
      LOST_CHAPTER: {
        label: "Lost Chapter",
        desc: "Draw 2 cards",
      },
    },
  },
  characters: {
    scribe: {
      name: "The Scribe",
      description:
        "Master of ink and word. Upgrades cards and strikes with the brilliance of ink.",
    },
    bibliothecaire: {
      name: "The Librarian",
      description:
        "Guardian of knowledge. Manipulates the draw pile and can silence enemies.",
    },
  },
  combat: {
    noCardsInHand: "No cards in hand",
    enemy: "Enemy",
    summonOne: "{{summoner}} summons {{target}}!",
    summonMany: "{{summoner}} summons reinforcements!",
    yourTurn: "Your turn",
    enemyTurn: "Enemy turn",
    turn: "Turn",
    drawPile: "Draw pile",
    discardPile: "Discard pile",
    exhaustPile: "Exhaust pile",
    debugTitle: "Enemy Spawn Debug",
    debugPlanned: "Planned",
    debugThematic: "Thematic unit present",
    drawDebugTitle: "Draw Debug",
    drawDebugSummary:
      "Hand {{hand}}/{{max}} - Draw/turn {{draw}} - Pending overflow {{overflow}}",
    drawDebugNoEvents: "No draw events yet.",
    yes: "YES",
    no: "NO",
    chooseAllyFor: "Choose an ally for ",
    chooseTargetFor: "Choose a target for ",
    tapSelfOrAlly:
      "Tap card again to self-cast, or click an ally to target them",
    tapToPlay: "Tap the selected card again to play it",
    playCardCta: "Play",
    chooseTargetCta: "Choose target",
    chooseEnemyFor: "Choose an enemy for ",
    hp: "HP",
    spd: "SPD",
    block: "Block",
    noAbility: "No ability",
    activeEffects: "Active effects",
    deadInCombat: "Dead in combat",
    next: "Next",
    devChooseEnemy: "DEV: choose an enemy to kill",
    player: "Player",
    endTurn: "End turn",
    cancelKill: "[DEV] Cancel",
    devKill: "[DEV] Kill",
    draw: "Draw",
    discard: "Discard",
    exhaust: "Exhaust",
    cardsCount_one: "{{count}} card",
    cardsCount_other: "{{count}} cards",
    drawOrderMasked: "(display order is masked)",
    selectRewrite: "Select a card to retrieve with Rewrite",
    noCardsInPile: "No cards in this pile.",
    handOverflowTitle: "Hand Overflow",
    handOverflowSubtitle:
      "You exceeded the hand limit. Choose {{count}} card(s) to exhaust.",
    handOverflowHint: "Enemy-caused overdraws are exhausted automatically.",
    section: "Combat",
    energy: "Energy",
    ink: "Ink",
    inventory: "Inventory",
    inventoryEmpty: "Inventory empty",
    energyShort: "EN",
    you: "You",
    allEnemies: "All enemies",
    allAllies: "All allies",
    ally: "Ally",
    firstCombatTutorial: {
      kicker: "Combat tutorial",
      stepCounter: "Step {{current}} / {{total}}",
      previous: "Previous",
      next: "Next",
      done: "Finish",
      skip: "Skip",
      steps: {
        cards: {
          title: "Cards in hand",
          description:
            "Each card has an energy cost and an effect. Read attack/skill/status before playing.",
        },
        energy: {
          title: "Energy per turn",
          description:
            "You spend energy to play cards. It refills at the start of your next turn.",
        },
        armor: {
          title: "Armor (block)",
          description:
            "The 🛡 badge shows current armor. It absorbs incoming damage before HP.",
        },
        incomingDamage: {
          title: "Incoming damage",
          description:
            "Enemy intents and ⚔/🛡 badges show expected damage for the next enemy turn.",
        },
        ink: {
          title: "Ink",
          description:
            "Your ink gauge fuels inked card variants and special combat powers.",
        },
        inkPowers: {
          title: "Ink powers",
          description:
            "I am giving you enough ink for this: use your ink power now. Here, it upgrades one card in your hand for this combat.",
        },
        inkedCard: {
          title: "Inked card",
          description:
            "Your power just upgraded a card: an upgraded card has stronger numbers, and sometimes a better cost or effect for this combat. Look for the golden treatment. Clicking the card plays its base version; the Ink button at the bottom plays the + Ink version. I am topping your ink up again: use the Ink button on the highlighted card now.",
        },
        deckCycle: {
          title: "Draw / Discard / Exhaust",
          description:
            "Played cards go to discard. When draw pile is empty, discard is shuffled back. Exhaust removes cards for this combat.",
        },
        endTurn: {
          title: "Ending your turn",
          description:
            "When you have no useful action left, end your turn now. Enemies will then act based on their intents.",
        },
      },
    },
  },
  enemyCard: {
    boss: "Boss",
    elite: "Elite",
    acting: "Acting",
    blk: "BLK",
    dmg: "DMG",
    calculated: "Calculated: {{from}} -> {{to}} ({{modifiers}})",
    incoming: "Incoming",
    intentHidden: "Intent Hidden",
    freeze: "Freeze",
    nextDrawDiscard: "Next draw discard",
    lockInk: "Lock ink {{power}}",
    cardCostUp: "Cards +{{value}} cost",
    drawDown: "Draw -{{value}}",
    randomDiscard: "Random discard {{value}}",
    summon: "Summon",
    conditionalBonusVsDebuffed: "+{{bonus}} if player is debuffed",
    phase2Summon: "Phase 2 (<50% HP): summons {{label}}",
  },
  playerStats: {
    block: "Block",
    strength: "Strength",
    focus: "Focus",
    blockTooltip:
      "Absorbs incoming damage this turn. Resets at the start of your turn.",
    strengthTooltip: "Increases all damage dealt by {{value}}.",
    focusTooltip: "Increases block gained by {{value}}.",
    extraCardCost: "Cards +{{value}} cost",
    drawPenalty: "Draw -{{value}}",
    nextDrawDiscard: "Next draw to discard",
    inkPowerLocked: "Ink power locked",
  },
  cardPicker: {
    cancel: "Cancel",
    noCards: "No cards available.",
  },
  preBoss: {
    label: "Antechamber",
    title: "The Antechamber",
    flavorText:
      "The torches flicker without reason. The room beyond presses heavy on the air — patient, dense, waiting.",
    subtitle: "One path. Choose it carefully.",
    hp: "HP: {{current}}/{{max}}",
    healTitle: "Restoration Basin",
    healDesc:
      "The water flowing over these stones smells of ink. Something written into these walls can still close your wounds.",
    upgradeTitle: "The Copyist's Table",
    upgradeDesc:
      "A workbench covered in illuminator's tools. Refine one card before the final trial.",
    upgradeHint: "Hover a card to preview the upgrade",
    upgradeAction: "Refine",
    huntTitle: "The Guardian's Challenge",
    huntDesc:
      "An adversary stands watch at the threshold. Defeat them to recover a fragment of a lost relic.",
  },
  special: {
    healTitle: "Healing Spring",
    healDesc:
      "Between two rows of grimoires, a stone basin rests flush with the floor. The water flowing from it smells of ink and old parchment. They say the words of destroyed books dissolved within — and that to drink is to let something written mend you from the inside.",
    currentHp: "Current: {{current}}/{{max}}",
    healAction: "Heal",
    upgradeTitle: "Enchanted Anvil",
    upgradeHint: "Hover a card to preview the upgrade",
    upgradeAction: "Upgrade",
    eventLabel: "Event",
    relicLabel: "Revealed Relic",
    eventStats: "HP: {{current}}/{{max}} - Gold: {{gold}}",
    purgePickerTitle: "Choose a card to remove",
    purgePickerSubtitle:
      "This card will be permanently removed from your deck.",
    eventContinue: "Continue",
    eventPurgeAction: "Choose a card to remove",
  },
  startMerchant: {
    kicker: "Pre-run",
    title: "Origin Merchant",
    subtitle: "Trade library resources for run bonuses.",
    noResources: "No available resources",
    cost: "Cost",
    bought: "Bought",
    trade: "Trade",
    insufficient: "Insufficient resources",
    bonusGoldName: "Scout's Purse",
    bonusGoldDescription: "+{{amount}} gold for this run",
    bonusMaxHpName: "Leather Blessing",
    bonusMaxHpDescription: "+{{amount}} max HP for this run",
    continue: "Continue adventure",
    offerType: {
      CARD: "Card",
      RELIC: "Relic",
      USABLE_ITEM: "Usable item",
      ALLY: "Ally",
      BONUS_GOLD: "Gold bonus",
      BONUS_MAX_HP: "Max HP bonus",
      default: "Offer",
    },
  },
  // Backward-compatible alias for legacy typo used in some UI paths.
  startMarchant: {
    bonusGoldName: "Scout's Purse",
    bonusGoldDescription: "+{{amount}} gold for this run",
    bonusMaxHpName: "Leather Blessing",
    bonusMaxHpDescription: "+{{amount}} max HP for this run",
  },
  shop: {
    title: "Merchant",
    gold: "Gold",
    itemName: {
      heal: "Heal",
      maxHp: "Max HP",
      purge: "Purge",
      ally: "Ally",
    },
    itemDescription: {
      heal: "Restore {{amount}} HP",
      maxHp: "+{{amount}} Max HP",
      purge: "Remove 1 card from your deck permanently.",
    },
    energyCost: "{{cost}} energy",
    sold: "SOLD",
    soldOut: "SOLD OUT",
    inventoryFull: "Inventory full",
    priceGold: "{{price}} gold",
    purgesLeft: "Purges left: {{count}}",
    reroll: "Reroll shop ({{price}} gold)",
    autoRestock: "Haggler's Satchel: auto-restock {{count}} charge left.",
    leave: "Leave shop",
    purgePickerTitle: "Purge - choose a card to remove",
    purgePickerSubtitle:
      "This card will be permanently removed from your deck.",
  },
  rules: {
    quickGuide: "Quick guide",
    back: "Back",
    close: "Close",
    gameTitle: "Panlibrarium",
    pageTitle: "Game Rules",
    sections: {
      overview: {
        title: "Overview",
        emoji: "📚",
        text: "Panlibrarium is a roguelike deck-builder: you progress room by room, strengthen your deck, then face a biome boss. Every decision matters: chosen cards, relics, resource management, and combat order. Your goal is to survive all 5 floors and defeat the bosses.",
      },
      runStructure: {
        title: "Run structure",
        emoji: "🧭",
        bullets: [
          "A run is made of 5 floors.",
          "Each floor has 10 rooms, progressing from left to right.",
          "Difficulty ramps up progressively until the boss fight.",
          "After a boss, you move to the next biome with new enemies and themes.",
        ],
      },
      combat: {
        title: "Combat",
        emoji: "⚔️",
        intro:
          "Combat is built around energy, hand, draw pile, and discard pile. You play your cards during your turn, then enemies act.",
        turnTitle: "Turn flow",
        steps: [
          "Start of turn: energy restored (3), relic effects applied.",
          "Player turn: play cards from hand (energy cost).",
          "End of turn: hand is discarded, then enemy phase.",
          "Enemy phase: attacks happen by speed order.",
        ],
      },
      cardTypes: {
        title: "Card types",
        emoji: "🃏",
        attack: "Attack",
        attackDesc: "deals damage.",
        skill: "Skill",
        skillDesc: "defense, draw, resource gains, utility.",
        power: "Power",
        powerDesc: "persistent effects, often very strong.",
        upgradesPrefix: "Cards can be",
        upgradesKey: "upgraded",
        upgradesSuffix: "to increase effects or reduce cost.",
      },
      ink: {
        title: "Ink",
        emoji: "🖋️",
        bullets: [
          "Ink is the secondary combat resource (max 5 by default).",
          "This maximum can be increased through some relics.",
          "Marking a card with ink (variable cost) amplifies its effect.",
          "You can use 1 ink power per turn.",
        ],
        tableHeaders: {
          power: "Power",
          cost: "Cost",
          effect: "Effect",
        },
        rows: [
          {
            power: "Rewrite",
            cost: "3 ink",
            effect: "Return one card from discard to hand.",
          },
          {
            power: "Lost Chapter",
            cost: "2 ink",
            effect: "Draw 2 additional cards.",
          },
          {
            power: "Seal",
            cost: "2 ink",
            effect: "Gain 8 block immediately.",
          },
        ],
      },
      rooms: {
        title: "Rooms",
        emoji: "🚪",
        tableHeaders: {
          room: "Room",
          content: "Content",
          reward: "Reward",
        },
        rows: [
          {
            room: "Combat",
            content: "1 to 4 enemies",
            reward: "Gold + 3 card choices",
          },
          {
            room: "Elite",
            content: "1 elite enemy (from room 3)",
            reward: "Bonus gold + relic",
          },
          {
            room: "Merchant",
            content: "Shop: cards, relics, heal, purge",
            reward: "-",
          },
          {
            room: "Special",
            content: "Heal 30% HP, card upgrade, or event",
            reward: "-",
          },
          {
            room: "Pre-boss",
            content: "Elite combat",
            reward: "Boss access",
          },
          {
            room: "Boss",
            content: "Biome boss",
            reward: "3 relic choices",
          },
        ],
      },
      buffs: {
        title: "Buffs and Debuffs",
        emoji: "📊",
        tableHeaders: {
          effect: "Effect",
          impact: "Impact",
        },
        rows: [
          {
            effect: "Strength",
            impact: "Increases damage dealt.",
          },
          {
            effect: "Focus",
            impact: "Improves utility and some card effects.",
          },
          {
            effect: "Vulnerable",
            impact: "You take increased damage.",
          },
          {
            effect: "Weak",
            impact: "Your attacks deal less damage.",
          },
          {
            effect: "Poison",
            impact: "Damage over time each turn.",
          },
        ],
      },
      tips: {
        title: "Starter tips",
        emoji: "💡",
        bullets: [
          "Keep your deck compact early: fewer cards, more consistency.",
          "Prioritize defense cards before the first boss.",
          "Spend ink when impact is decisive, not automatically.",
          "The merchant is ideal to remove weak cards and stabilize your plan.",
        ],
      },
    },
  },
  events: {
    mysterious_tome: {
      title: "The Sealed Tome",
      flavorText:
        "Behind a broken display case, a tome with black pages watches you. The ink inside moves on its own, searching for a reader for decades.",
      description: "Do you dare open it?",
      choices: [
        {
          label: "Unseal the tome",
          description: "Lose 10 HP, gain 50 gold.",
          outcomeText:
            "Your fingers bleed on the pages. The tome drinks, satisfied. Twenty coins fall from between the leaves — the price of another reader, long ago.",
        },
        {
          label: "Close the display case",
          description: "Nothing happens.",
          outcomeText:
            "The tome snaps shut. Through the glass, you see the pages turn, seeking another victim.",
        },
      ],
    },
    ink_fountain: {
      title: "The Ink Fountain",
      flavorText:
        "At the center of the room, a black marble basin overflows with glowing ink. It whispers in a language you have never learned — and yet, you understand every word.",
      description: "What will you do with this ink?",
      choices: [
        {
          label: "Drink from the basin",
          description: "Gain 5 HP and 25 gold.",
          outcomeText:
            "The ink is cold, strangely sweet. It reopens your wounds on one side and seals them on the other. Ancient words glow for an instant in your veins.",
        },
        {
          label: "Fill your pockets",
          description: "Gain 75 gold.",
          outcomeText:
            "The ink solidifies in the air into perfectly round gold coins. A fair trade with the Library — it always takes back what it gives.",
        },
      ],
    },
    wandering_scribe: {
      title: "The Wandering Scribe",
      flavorText:
        "A hunched old man wanders the stacks, his quill scratching the air. He does not seem to see you — until he turns abruptly: 'I can rewrite you. For a price.'",
      description: "His services have a cost. His care, too.",
      choices: [
        {
          label: "Pay for his services (30 gold)",
          description: "Lose 30 gold, gain 20 max HP.",
          outcomeText:
            "He traces runes in your palm. They burn, then vanish. You feel sturdier somehow — harder to erase.",
        },
        {
          label: "Accept his basic care",
          description: "Gain 10 HP.",
          outcomeText:
            "He dabs your wounds with strange ink and leaves without a word, his quill resuming its perpetual motion.",
        },
      ],
    },
    ancient_sarcophagus: {
      title: "The Sarcophagus of Words",
      flavorText:
        "The sarcophagus stands upright, its inscriptions glowing with otherworldly light. The lid trembles slightly, as though something inside seeks to escape — or to draw you in.",
      description: "The essence within can fortify you... at what cost?",
      choices: [
        {
          label: "Absorb the essence",
          description: "Gain 20 max HP.",
          outcomeText:
            "Ancient energy envelops you. Something old settles within you — benevolent, for now.",
        },
        {
          label: "Take the risk",
          description: "Gain 30 max HP, lose 15 HP.",
          outcomeText:
            "The essence passes through you like an electric current. It takes more than it gives immediately — but the scars turn violet, a sign of deep transformation.",
        },
        {
          label: "Leave it sealed",
          description: "Nothing happens.",
          outcomeText:
            "You back away. Behind you, the lid stops trembling. Perhaps it was not so urgent after all.",
        },
      ],
    },
    whispering_idol: {
      title: "The Whispering Idol",
      flavorText:
        "The idol is barely larger than your hand, carved from ash-colored marble. When it speaks, the whole room stops breathing. 'You want gold,' it says. 'Everyone wants gold. But I want something from you.'",
      description: "A pact of cursed wealth is offered.",
      choices: [
        {
          label: "Accept the pact",
          description: "Gain 90 gold. Add Hexed Parchment to your deck.",
          outcomeText:
            "The gold falls from nowhere. The pact is sealed with black ink that tattoos your wrist for a fraction of a second before vanishing. The Hexed Parchment slips into your pocket untouched.",
        },
        {
          label: "Push your luck",
          description: "Gain 140 gold. Add 2 Haunting Regrets to your deck.",
          outcomeText:
            "The idol laughs — or something like it. It gives you more than you asked. It takes more than you expected.",
        },
        {
          label: "Refuse",
          description: "You leave with nothing.",
          outcomeText:
            "The idol falls silent. You feel its gaze on your back until you leave the room — and even after.",
        },
      ],
    },
    ruthless_scrivener: {
      title: "The Ruthless Scrivener",
      flavorText:
        "Seated at his desk, he revises a manuscript with surgical precision, crossing out entire passages without hesitation. When you enter, he raises pale eyes like paper: 'Your deck is too verbose. I can fix that.'",
      description:
        "Purging costs blood. But a leaner deck can be worth the price.",
      choices: [
        {
          label: "Pay in blood",
          description: "Lose 10 HP. Permanently remove 1 card from your deck.",
          outcomeText:
            "He operates with his quill like a scalpel. A sharp pain, then the strange relief of knowing an unnecessary voice has been silenced.",
        },
        {
          label: "Walk away",
          description: "Nothing happens.",
          outcomeText:
            "He shrugs and returns to his manuscript. 'Come back when you are ready to be edited.' He does not watch you leave.",
        },
      ],
    },
    loyal_scribe: {
      title: "Lost Apprentice Scribe",
      flavorText:
        "A young apprentice has been lost in the Library's corridors since the Censorship. His hands are stained with ink to the elbows, and he carries under his arm a stack of grimoires he is trying to save.",
      description:
        "He seeks a protector. His knowledge of ancient texts could prove invaluable.",
      choices: [
        {
          label: "Take him in",
          description: "The Apprentice Scribe joins your party.",
          outcomeText:
            "He follows you with a mix of relief and fear. His knowledge will be useful — provided he survives long enough to demonstrate it.",
        },
        {
          label: "Refuse",
          description: "You continue alone.",
          outcomeText:
            "He watches you walk away without a word. You hope he will find another traveler before the Library's shadows catch up to him.",
        },
      ],
    },
    wandering_knight: {
      title: "Knight of Words",
      flavorText:
        "He stands in the shadows, his armor covered in hand-carved runes. His library burned — or worse, was censored. He seeks a new oath to swear, a cause worth defending.",
      description:
        "His ward-magic can protect you. His oath would bind you to each other.",
      choices: [
        {
          label: "Accept his oath",
          description: "The Knight of Words joins your party.",
          outcomeText:
            "He kneels, placing his hand on one of your grimoires as an oath. Something warm passes through your veins — his loyalty, printed in the ink of his armor.",
        },
        {
          label: "Decline",
          description: "You continue on your way.",
          outcomeText:
            "He nods, without bitterness. 'I will find another cause worthy of me.' You hope that is true.",
        },
      ],
    },
    ink_familiar_encounter: {
      title: "Ink Familiar",
      flavorText:
        "Something watches you from the shadow between two shelves — a silhouette barely larger than a cat, made entirely of living ink that pulses softly. Its eyes, two points of bright ink, do not leave you.",
      description:
        "It seeks a master. The ink that composes it responds to your presence.",
      choices: [
        {
          label: "Tame it",
          description: "The Ink Familiar joins your party.",
          outcomeText:
            "It approaches slowly, sniffs your hand, then coils around your forearm like a living tattoo. It belongs to you — and in some way, you belong to it.",
        },
        {
          label: "Ignore it",
          description: "You continue on your way.",
          outcomeText:
            "It watches you until you disappear around a corner. The ink shimmers. Then silence.",
        },
      ],
    },
    mirror_of_bronze: {
      title: "The Mirror of Bronze",
      flavorText:
        "The polished bronze mirror stands between two marble columns. It does not reflect your face — but that of someone you could have been. The silhouette smiles. It reaches out from the other side of the cold metal.",
      description:
        "What do you answer to what watches you from the other side?",
      choices: [
        {
          label: "Reach back",
          description: "Gain 20 max HP. Lose 15 HP.",
          outcomeText:
            "Your fingers pass through the cold metal. The silhouette takes something from you — raw vitality — and in exchange, carves new lines onto your body. You emerge with more capacity and fewer certainties.",
        },
        {
          label: "Shatter the mirror",
          description: "Gain 90 gold. Add Haunting Regret to your deck.",
          outcomeText:
            "The bronze shatters. The shards bleed for a few moments before solidifying into gold coins. The silhouette vanishes with a laugh that strangely resembles recognition. The regrets remain.",
        },
        {
          label: "Watch without acting",
          description: "Nothing happens.",
          outcomeText:
            "You observe until the silhouette tires of you and turns away. Some truths are not worth the price of their acquisition.",
        },
      ],
    },
    turning_house: {
      title: "The Turning House",
      flavorText:
        "The room slowly rotates on itself — the shelves change position when you are not looking. In the armchair at the center, an old woman knits with bone needles. She does not look up. 'Sit,' she says. 'Turning houses do not wait.'",
      description: "What do you ask of the keeper of this house?",
      choices: [
        {
          label: "Sit and listen",
          description: "Gain 35 max HP.",
          outcomeText:
            "She speaks for what seems like hours — in symbols, in images, in forgotten languages. You do not understand everything. But when you stand, your body is more capable of staying upright.",
        },
        {
          label: "Force your way out",
          description: "Gain 75 gold. Lose 15 HP.",
          outcomeText:
            "The house resists. Shelves move. You stumble, hit corners that should not exist. But you find the exit — with your gold and your bruises.",
        },
        {
          label: "Take something from the shelf",
          description: "Gain 15 HP and 15 gold.",
          outcomeText:
            "The old woman does not react — or pretends not to. The object you take seems to choose you as much as you choose it. Fair enough, for a house that turns.",
        },
      ],
    },
    skald_fire: {
      title: "The Skalds' Fire",
      flavorText:
        "The brazier at the center of the room has burned for centuries, without wood or fuel. The flames are an icy blue. When you reach out your hand, it is not heat that bites — it is a cold that reaches the marrow.",
      description: "The skalds' fire demands a sacrifice or a song.",
      choices: [
        {
          label: "Plunge your hands into the fire",
          description: "Gain 40 max HP. Lose 20 HP.",
          outcomeText:
            "The cold tears a cry from you. But your hands emerge marked with glowing runes that fade within seconds. What the fire took, it returned a hundredfold in another form.",
        },
        {
          label: "Recite a verse",
          description: "Gain 50 gold.",
          outcomeText:
            "The blue flames flicker. They recognize the words — or love them. Gold falls from the air like a reward for a poem recited in the right language at the right moment.",
        },
        {
          label: "Leave without a word",
          description: "Nothing happens.",
          outcomeText:
            "The fire remains indifferent. Some braziers wait to be honored. You turn your back and leave, intact.",
        },
      ],
    },
    blank_page: {
      title: "The Blank Page",
      flavorText:
        "In the middle of an empty corridor, a blank page is pinned at eye level. Not a word. Not an illustration. Yet you have the feeling it has been waiting for you since the beginning of your journey — perhaps before.",
      description: "The page is blank. What do you do with this void?",
      choices: [
        {
          label: "Write your strength",
          description: "Gain 20 max HP.",
          outcomeText:
            "You grasp a quill that was not there a moment ago. The words emerge on their own. The page absorbs them. When you look up, you feel sturdier — as though you just rewrote yourself a little better.",
        },
        {
          label: "Erase your weakness",
          description: "Lose 10 HP. Remove 1 card from your deck.",
          outcomeText:
            "The page tears with an almost human sound. The pieces combust in the air. Something in your deck lightens — a voice that spoke too loudly, reduced to silence.",
        },
        {
          label: "Turn your heels",
          description: "Nothing happens.",
          outcomeText:
            "You leave. Behind you, you hear something being written on the page. You do not look back.",
        },
      ],
    },
    sealed_reliquary: {
      title: "The Sealed Reliquary",
      flavorText:
        "A dust-covered reliquary rests on a pedestal at the center of the room. It pulses with luminous ink, as if waiting to be claimed for a long time.",
      description:
        "One relic among those this reliquary holds is meant for you.",
      choices: [
        {
          label: "Claim the relic",
          description: "Gain 1 relic.",
          outcomeText:
            "Your fingers close around the object. The reliquary empties, at peace. What it guarded was for you — or at least, that is what it wants you to believe.",
        },
        {
          label: "Leave the relic",
          description: "Take nothing. Move on.",
          outcomeText:
            "You turn your back on the reliquary. It watches you leave in silence. Perhaps it will call to you again, further on.",
        },
      ],
    },
    // ── GREEK ──────────────────────────────────────────────────────────────
    oracle_of_delphi: {
      title: "The Pythia of Delphi",
      flavorText:
        "The Pythia sits on her golden tripod above a crevasse exhaling ink vapors. Her eyes are rolled back, her lips forming words in a language of smoke. She does not look at you — she looks through time.",
      description: "She sees what awaits you. Do you want to know?",
      choices: [
        {
          label: "Listen to the prophecy",
          description: "Gain 30 max HP.",
          outcomeText:
            "Her words print themselves into you like indelible ink. You do not understand everything — but something in you has prepared for what comes. Your body remembers, even if your mind forgets.",
        },
        {
          label: "Offer tribute (30 gold)",
          description: "Lose 30 gold, gain 45 max HP.",
          outcomeText:
            "She accepts the offering without looking at it. In exchange, she places a cold finger on your sternum — and an extra life inscribes itself into you, like a revision in the margins of an already finished manuscript.",
        },
      ],
    },
    thread_of_ariadne: {
      title: "Ariadne's Thread",
      flavorText:
        "A silver thread stretches through the corridor's darkness, running between shelves like a vein through a body of stone. At one end, a woman whose features change every time you look at her holds the spool. 'This thread will lead you to what you need. How much do you want to take?'",
      description:
        "The thread can guide you. But the more you take, the more you bind yourself.",
      choices: [
        {
          label: "Take a little thread",
          description: "Gain 20 max HP.",
          outcomeText:
            "The thread guides you along a path you would not have found alone. It leads you to a room full of light, then vanishes. You found what needed finding.",
        },
        {
          label: "Unroll the entire spool",
          description: "Gain 40 max HP. Lose 15 HP.",
          outcomeText:
            "The thread pulls taut — too much. It passes through you, rewrites a few chapters, tears out others. What you gain in endurance, you pay in flesh. The labyrinth always takes its toll.",
        },
        {
          label: "Leave the thread",
          description: "Nothing happens.",
          outcomeText:
            "The woman puts away her spool without a word. Labyrinths have exits even without a guide. You will simply need to search longer.",
        },
      ],
    },
    // ── RUSSIAN ────────────────────────────────────────────────────────────
    firebird_feather: {
      title: "Zhar-Ptitsa's Feather",
      flavorText:
        "A golden-fire feather rests on a shelf, burning without consuming the wood, bathing the surrounding grimoires in orange light. It seems to have no owner — or rather, it waits to have one.",
      description:
        "The Firebird's feather brings luck to those who know how to grasp it.",
      choices: [
        {
          label: "Take the feather",
          description: "Gain 25 HP and 25 gold.",
          outcomeText:
            "The feather burns cold in your hand — a contradiction that becomes truth. Its warmth passes through you, healing what was wounded, shaping what had no form. Gold falls from your pockets as a side effect, as if fortune follows light.",
        },
        {
          label: "Contemplate it before taking it",
          description: "Gain 35 max HP.",
          outcomeText:
            "You study its light until it imprints behind your eyelids. When you finally take it, something deeper has already changed in you — not the flesh, but the text that defines you.",
        },
        {
          label: "Leave it for another",
          description: "Nothing happens.",
          outcomeText:
            "The feather continues to burn, indifferent. Perhaps the next person to pass here was the one who truly needed it. Perhaps it was you.",
        },
      ],
    },
    kostchei_needle: {
      title: "Kostchei's Needle",
      flavorText:
        "A bone box stands open on a pedestal. Inside: an egg. Inside the egg: a duck. Inside the duck: a hare. Inside the hare: a needle whose tip glows absolute black. A sourceless voice: 'My soul is immortal. I can lend a fragment of it.'",
      description:
        "Kostchei the Immortal offers a fragment of eternity. His bargains always have a hidden price.",
      choices: [
        {
          label: "Accept the fragment of immortality",
          description: "Gain 50 max HP. Lose 25 HP.",
          outcomeText:
            "The needle pricks you. The pain is brief, intense — then comes something else, older than pain. Your body learns a new definition of itself. More capacity. Less immediate integrity. Exactly what Kostchei promised.",
        },
        {
          label: "Negotiate the terms",
          description: "Gain 25 max HP and 25 gold.",
          outcomeText:
            "He laughs — the sound of a library burning in reverse. But he accepts. A smaller fragment, a smaller price. Something valuable falls from the bone box as if by inadvertence.",
        },
        {
          label: "Refuse the partial immortality",
          description: "Nothing happens.",
          outcomeText:
            "The needle packs itself back into the hare into the duck into the egg into the box. 'You will return,' says the voice. 'Everyone returns.'",
        },
      ],
    },
    // ── VIKING ─────────────────────────────────────────────────────────────
    huginn_bargain: {
      title: "Huginn's Gaze",
      flavorText:
        "A raven of unsettling intelligence perches on a shelf at eye level. Its irises are entirely white — Odin's eyes, stripped of their pupil to see further. It tilts its head. 'The Allfather watches you. He has questions about you. Let him see.'",
      description:
        "Odin wants to see through you. This sight always carries a price.",
      choices: [
        {
          label: "Offer an eye",
          description: "Gain 45 max HP. Lose 20 HP.",
          outcomeText:
            "The raven approaches. What follows is not pain — it is a rewrite. Odin sees you from the inside, and what he sees satisfies him enough to leave something in exchange. You leave with less integrity and much more depth.",
        },
        {
          label: "Offer gold instead",
          description: "Lose 30 gold, gain 30 max HP.",
          outcomeText:
            "The raven blinks its white eyes. Odin accepts the gold — gods always need gold, even those who claim otherwise. A satisfying exchange for both parties.",
        },
        {
          label: "Refuse to be seen",
          description: "Nothing happens.",
          outcomeText:
            "The raven lifts its wings in what resembles a shrug. 'He has already seen you anyway,' it says. 'He just wanted to be polite.'",
        },
      ],
    },
    valkyrie_verdict: {
      title: "The Valkyrie's Verdict",
      flavorText:
        "A warrior in ink-stained armor watches you from atop a shelf, writing something in a large book. She looks up. 'I am evaluating you,' she says simply. 'Show me what you are worth.'",
      description: "She chooses who deserves to continue. Show her your worth.",
      choices: [
        {
          label: "Defend your worth in words",
          description: "Gain 25 max HP.",
          outcomeText:
            "You speak. She listens with absolute attention. When you finish, she notes something and closes her book. 'Sufficient,' she says. 'For now.' Coming from her, that is a compliment.",
        },
        {
          label: "Show your wounds",
          description: "Gain 25 HP.",
          outcomeText:
            "She inspects each scar with the rigor of an architect reading a blueprint. 'You survived all this. Then you can survive what comes.' She briefly places a hand on your chest. The pain diminishes.",
        },
        {
          label: "Refuse the evaluation",
          description: "Nothing happens.",
          outcomeText:
            "She marks an X in her book and says something final. Perhaps you will be re-evaluated later. Perhaps not.",
        },
      ],
    },
    // ── EGYPTIAN ───────────────────────────────────────────────────────────
    anubis_scales: {
      title: "Anubis's Scales",
      flavorText:
        "Anubis himself stands in the room, his jackal head turned toward you with emotionless curiosity. On a lapis-lazuli scale, a white feather waits. He points to your chest. 'Your heart,' he says. 'Or whatever serves as one in the Library.'",
      description: "Anubis judges all hearts. Is yours light enough?",
      choices: [
        {
          label: "Present your deck to the scales",
          description: "Gain 25 max HP.",
          outcomeText:
            "The scale oscillates, hesitates, then tilts toward the feather. 'Not perfect,' says Anubis. 'But sufficient to continue.' He adds something to your vital reserves before dismissing you with a gesture.",
        },
        {
          label: "Offer a card to the scales",
          description: "Lose 10 HP. Remove 1 card. Gain 45 max HP.",
          outcomeText:
            "The scale settles into perfect balance. Anubis inclines his head with rare satisfaction. What you gave was what was weighing down your heart.",
        },
        {
          label: "Flee the judgment",
          description: "Add 2 Haunting Regrets to your deck.",
          outcomeText:
            "You run. Behind you, Anubis carefully notes your name. Gods of the dead never forget names. The Regrets catch you before you reach the door.",
        },
      ],
    },
    thoth_archives: {
      title: "Thoth's Archives",
      flavorText:
        "Thoth, scribe of the gods, sits at a monumental desk, his ibis beak hovering over a scroll that unrolls infinitely. He raises one hand without looking up. 'I am busy recording everything. But you may look. Or even take. At your own risk.'",
      description:
        "Thoth's archives contain everything — including things you were not meant to see.",
      choices: [
        {
          label: "Legitimately copy a scroll",
          description: "Gain 25 max HP and 20 gold.",
          outcomeText:
            "Thoth nods without looking up. You copy what is permitted. His knowledge prints itself into you like well-dried ink — permanent, legitimate, yours.",
        },
        {
          label: "Steal the main scroll",
          description: "Gain 60 gold. Add 1 Haunting Regret.",
          outcomeText:
            "Your fingers close around the scroll. Thoth writes something in his great book without looking up. He always notes everything. The scroll transforms into gold in your hands, but something of its nature remains in you as regret.",
        },
        {
          label: "Simply read over his shoulder",
          description: "Gain 20 max HP.",
          outcomeText:
            "He lets you look. He even notes your presence in his book. A silent reader who does not interrupt always deserves something.",
        },
      ],
    },
    sphinx_riddle: {
      title: "The Great Sphinx's Riddle",
      flavorText:
        "The Sphinx blocks a corridor between two immense shelves. She is alive, patient, holding between her paws a codex she reads with deliberate slowness. She looks up. 'A riddle,' she says. 'No wrong answer — just different answers.'",
      description:
        "The Sphinx asks a question to which all answers are true. Each opens a different door.",
      choices: [
        {
          label: "Answer: Ink",
          description: "Gain 35 gold.",
          outcomeText:
            "She smiles — insofar as a sphinx can smile. 'Ink creates and destroys at once. Yes. That suits you.' She deposits gold coins between her paws and lets you pass.",
        },
        {
          label: "Answer: Memory",
          description: "Gain 25 max HP.",
          outcomeText:
            "'Memory survives everything,' she says. 'Even censorship. Yes.' She places a paw on your shoulder for a fraction of a second — just long enough for something of her own permanence to rub off on you.",
        },
        {
          label: "Stay silent",
          description: "Nothing happens.",
          outcomeText:
            "She waits a full hour. Then she picks up her codex again. 'Silence is also an answer,' she says. 'Not the most useful, but the most honest.' She steps aside and lets you pass.",
        },
      ],
    },
    // ── LOVECRAFTIAN ───────────────────────────────────────────────────────
    forbidden_lexicon: {
      title: "The Forbidden Lexicon",
      flavorText:
        "The Librarian has no face — or rather, it has too many, succeeding one another too fast to count. It holds a lexicon whose words change as you watch. 'What you can read in this book cannot be seen twice,' it says. 'Choose your dosage.'",
      description:
        "The Librarian offers knowledge that can only be seen once. The price is paid in mental clarity.",
      choices: [
        {
          label: "Read the forbidden passage",
          description: "Gain 50 gold. Add 1 Haunting Regret.",
          outcomeText:
            "The words enter through your eyes and exit differently. What you understand has no translation. What you retain is gold. What you lose calls itself 'regret' for lack of a better term.",
        },
        {
          label: "Read with half-closed eyes",
          description: "Gain 25 max HP.",
          outcomeText:
            "A glimpse. Enough for something to change in you. Not enough to know precisely what. The Librarian notes in its faceless register: 'partial reading.'",
        },
        {
          label: "Close the book",
          description: "Nothing happens.",
          outcomeText:
            "The Librarian shelves the lexicon in a space that did not exist before it needed one. 'Perhaps you will return,' it says. 'Everyone returns.'",
        },
      ],
    },
    deep_echo: {
      title: "The Echo from the Abyss",
      flavorText:
        "A sound that is not quite a sound comes from below — through the Library's floor, through kilometers of stone and ink. It is not a cry. It is not a song. It is something trying to remember how to resonate in a human space.",
      description:
        "The echo seeks a response. Giving it one could be beneficial — or simply strange.",
      choices: [
        {
          label: "Resonate with the echo",
          description: "Gain 30 max HP.",
          outcomeText:
            "You breathe in and let the sound pass through you. Something as old as the first letter ever written settles into your bones. Your capacity grows. The sound departs satisfied, having found a vessel deep enough.",
        },
        {
          label: "Absorb the echo into a grimoire",
          description: "Gain 20 HP and 20 gold.",
          outcomeText:
            "The echo enters the open grimoire and becomes temporarily visible — a pulse of black ink that solidifies into something useful. The book closes. What it now contains, you don't know. But it weighs differently.",
        },
        {
          label: "Ignore the echo",
          description: "Nothing happens.",
          outcomeText:
            "The echo goes searching for another ear. Somewhere in the Library, someone else hears this sound and makes a different decision.",
        },
      ],
    },
    dreaming_gate: {
      title: "The Dreaming Gate",
      flavorText:
        "A door not attached to any wall stands in the room. Beyond its frame is not another room — it is something human language has never named, where stars that are not stars move like writing on a page turned too fast.",
      description: "The gate leads elsewhere. Elsewhere has side effects.",
      choices: [
        {
          label: "Enter the gate",
          description: "Gain 50 max HP. Add 2 Hexed Parchments.",
          outcomeText:
            "What you see on the other side does not translate. But your body translates the experience into capacity. The price: two fragments of that vision lodge themselves in your deck, refusing to leave.",
        },
        {
          label: "Look from the threshold",
          description: "Gain 25 max HP.",
          outcomeText:
            "A glimpse from the doorway — enough to expand what you can contain, not enough to lose the thread of what you are. The door closes on its own when you step back.",
        },
        {
          label: "Seal the gate",
          description: "Nothing happens.",
          outcomeText:
            "You seal the gate with whatever comes to hand. It opens a few minutes later in another part of the Library. Some doors cannot be sealed. They can only be ignored.",
        },
      ],
    },
    // ── AZTEC ──────────────────────────────────────────────────────────────
    quetzalcoatl_blessing: {
      title: "Quetzalcoatl's Blessing",
      flavorText:
        "A serpent covered in green and gold feathers winds between the shelves, too large for this room and yet present. It stops before you, its head level with your chest. On its forked tongue, glyphs are born and vanish. 'Scribe,' it says. 'You deserve a mark.'",
      description:
        "The Feathered Serpent offers a glyph of power. Blood always amplifies the gift.",
      choices: [
        {
          label: "Accept the blessing",
          description: "Gain 30 max HP.",
          outcomeText:
            "It traces a glyph on your forehead with the tip of its tongue. It does not burn — it carves. Something new is inscribed into your existence. Quetzalcoatl departs in silence, satisfied to have transmitted something ancient.",
        },
        {
          label: "Offer your blood for more power",
          description: "Gain 45 max HP. Lose 15 HP.",
          outcomeText:
            "You hold out an open palm. It traces the glyph in your blood. This is deeper than flesh — an inscription into something more fundamental. The price is visible. The exchange is fair.",
        },
        {
          label: "Bow respectfully and decline",
          description: "Gain 10 HP.",
          outcomeText:
            "It inclines its head respectfully in return. A polite refusal deserves a polite gift — a small healing, offered without comment. Then it departs into the corridors, larger than the shelves.",
        },
      ],
    },
    obsidian_altar: {
      title: "The Obsidian Altar",
      flavorText:
        "The altar is carved from a block of obsidian that absorbs light rather than reflecting it. The Codex Priestess stands behind it, clad in feathers and dried ink. She holds a volcanic glass knife. 'Every scholar knows that knowledge has a price. What will you give?'",
      description:
        "The Codex Priestess demands a sacrifice. What she gives in return is worth the price.",
      choices: [
        {
          label: "Sacrifice a card to the altar",
          description: "Lose 10 HP. Remove 1 card. Gain 20 max HP and 40 gold.",
          outcomeText:
            "The obsidian knife cuts cleanly. The card burns on the altar in a blue flame. The Priestess notes the sacrifice in her codex, satisfied. What you lose was what was weighing you down.",
        },
        {
          label: "Offer gold instead",
          description: "Lose 30 gold, gain 25 max HP.",
          outcomeText:
            "She accepts the gold with slight disappointment. Gold is not the altar's preferred sacrifice. But it is an acceptable offering. She writes your name in the codex — in ordinary ink.",
        },
        {
          label: "Back away from the altar",
          description: "Lose 15 HP.",
          outcomeText:
            "The Priestess says something in a language you do not know. It is not a curse — it is worse. It is disappointment. The obsidian grazes you as you pass. Some altars react to disrespect.",
        },
      ],
    },
    xolotl_crossing: {
      title: "Xolotl's Crossing",
      flavorText:
        "A hairless dog, its skin blue speckled with the color of night, sits in the corridor watching you with eyes that have seen the underside of all things. This is Xolotl — guide of the dead. 'I can show you the shortest path,' he says. 'If you accompany me.'",
      description:
        "Xolotl guides souls through what the living cannot see. A rare privilege.",
      choices: [
        {
          label: "Follow the guide of the dead",
          description: "Gain 25 HP and 20 gold.",
          outcomeText:
            "He trots ahead of you through corridors you had not noticed. Some doors open on their own. When he stops, you are elsewhere — healed and wealthier, without understanding how.",
        },
        {
          label: "Confide one of your secrets to him",
          description: "Gain 35 max HP.",
          outcomeText:
            "He tilts his head and listens. What he does with your secret, you don't know. But in return, he confides something back — not in words, but in capacity. Your vessel can contain more.",
        },
        {
          label: "Choose your own path",
          description: "Nothing happens.",
          outcomeText:
            "He watches you leave with the patience of someone who knows everyone retraces their steps. Then he departs, perhaps to find another soul to guide.",
        },
      ],
    },
    // ── CELTIC ─────────────────────────────────────────────────────────────
    druid_memory: {
      title: "The Druid's Formula",
      flavorText:
        "The Memory Druid has no book — his texts are all in his head, memorized across generations of druids before him. He whispers while walking, repeating formulas no one else can write down. Seeing you, he stops. 'You carry grimoires. So you know how to write. Better than nothing.'",
      description:
        "Druids keep knowledge alive. He can transmit some of it to you.",
      choices: [
        {
          label: "Receive the formula by recitation",
          description: "Gain 25 max HP.",
          outcomeText:
            "He speaks for several minutes, the same words in loops until they imprint. You do not understand everything — but something in you changes like a page turning. The formula works without your understanding it.",
        },
        {
          label: "Transcribe it in exchange for 20 gold",
          description: "Lose 20 gold, gain 40 max HP.",
          outcomeText:
            "He grimaces slightly at seeing the quill. 'Druids don't write. But you can.' You transcribe the formula. The gold pays for his generosity. What you have noted is more rooted, deeper — because written and heard at once.",
        },
        {
          label: "Refuse to learn",
          description: "Nothing happens.",
          outcomeText:
            "He shrugs. 'Formulas choose their bearers. Perhaps not you today.' He resumes his recitation and disappears between the shelves.",
        },
      ],
    },
    lady_of_the_lake: {
      title: "The Lady of the Inked Lake",
      flavorText:
        "At the back of a room, a perfectly still expanse of ink reflects the ceiling like black water. A hand emerges slowly, holding a book sealed by three chains. A voice rises from beneath the surface: 'This book will protect you. If you dare take it.'",
      description:
        "The Lady of the Inked Lake holds something for you. Taking it has a cost.",
      choices: [
        {
          label: "Plunge your hand into the ink",
          description: "Gain 30 max HP. Lose 15 HP.",
          outcomeText:
            "The ink is cold and thick, like plunging your hand into night. The Lady lets you take the book — then takes something in exchange, without violence. You leave with more capacity and a wound you cannot locate.",
        },
        {
          label: "Offer her 30 gold",
          description: "Lose 30 gold, gain 25 max HP.",
          outcomeText:
            "The hand disappears for a moment, reappears with the book extended toward you. The gold disappears beneath the surface without a sound. What you paid, you will not have back. What you received, you hold onto.",
        },
        {
          label: "Slowly back away",
          description: "Nothing happens.",
          outcomeText:
            "The hand remains extended for a long minute. Then it slowly withdraws beneath the surface, taking the book. The lake becomes perfectly still again, as if nothing had happened.",
        },
      ],
    },
    morrigan_crow: {
      title: "Morrigan's Crow",
      flavorText:
        "The crow is immense — not naturally, but as if the room around it has shrunk. It carries in its beak a feather from its own body. On this feather: your name, written in dried blood. It sets the feather at your feet. 'I have come to see your future. And to offer to change it.'",
      description:
        "Morrigan sees your death. She offers to delay it — on the condition of looking it in the face.",
      choices: [
        {
          label: "Look at your own end",
          description: "Gain 50 max HP. Lose 20 HP.",
          outcomeText:
            "What you see is not translatable. But your body reacts to the vision like an alarm — fortifying itself, thickening, learning to last longer. The pain of the present is worth the future it pushes back.",
        },
        {
          label: "Interpret the omens of wealth",
          description: "Gain 40 gold.",
          outcomeText:
            "The crow shows something else too — glints of gold in your near future. Morrigan sees everything: death, but also what precedes it. You choose to look only at that part.",
        },
        {
          label: "Chase away the crow",
          description: "Nothing happens.",
          outcomeText:
            "It flies away with your feather. Prophecies fulfill themselves with or without the consent of those involved. It might have been better to know.",
        },
      ],
    },
    // ── AFRICAN ────────────────────────────────────────────────────────────
    anansi_story: {
      title: "Anansi's Story",
      flavorText:
        "Between the threads of a giant web running from shelf to shelf like a second ceiling, Anansi the Spider hangs in his man-spider body, reading seven books simultaneously. He descends slowly. 'All knowledge is a story,' he says. 'And all stories have an exchange at their heart.'",
      description:
        "Anansi weaves tales like others weave nets. What he offers always has multiple meanings.",
      choices: [
        {
          label: "Tell him your journey",
          description: "Gain 30 max HP.",
          outcomeText:
            "He listens with all his eyes. When you finish, he smiles. 'A good story. Not the best I've heard. But honest.' He weaves something into your existence before climbing back to his ceiling.",
        },
        {
          label: "Listen to one of his stories",
          description: "Gain 15 HP and 15 gold.",
          outcomeText:
            "His story begins simply, then becomes complex, then ironic, then deep, then it turns and reveals something you didn't know about yourself. You leave with fewer wounds and more gold.",
        },
        {
          label: "Refuse the exchange",
          description: "Nothing happens.",
          outcomeText:
            "He watches you leave with the amusement of someone who knows how the story ends. 'You will return,' he says. 'Good characters always return.'",
        },
      ],
    },
    griot_song: {
      title: "The Griot's Song",
      flavorText:
        "The Pages Griot sits between the shelves, his kora leaning against a bookcase, loose pages swirling around him like birds that have forgotten how to fly. When he sings, the words of all surrounding books vibrate slightly in their bindings.",
      description:
        "The griot's song heals what medicine cannot reach. He sings for those who take time to listen.",
      choices: [
        {
          label: "Listen to the full melody",
          description: "Gain 30 HP.",
          outcomeText:
            "The melody takes time. It follows your scars, addresses them one by one. When it falls silent, you are less wounded. Not entirely — but significantly.",
        },
        {
          label: "Hum along with him",
          description: "Gain 25 HP and 15 gold.",
          outcomeText:
            "He smiles hearing you try. Your voice is not beautiful — but it is sincere, and the griot always rewards sincerity. The healing comes with a small treasure he pulls from nowhere.",
        },
        {
          label: "Leave quickly",
          description: "Gain 10 HP.",
          outcomeText:
            "He sings a few bars in your direction anyway. Even distracted listening deserves something. You leave slightly less wounded than you arrived.",
        },
      ],
    },
    scribe_1_first_meeting: {
      title: "The Erased Scribe",
      flavorText:
        "Between two shelves, nearly invisible. Not a ghost — something between a man and a margin note. He writes in the air, but his quill leaves no trace.",
      description: "He does not seem to see you. Or does not want to be seen.",
      choices: [
        {
          label: "Observe him in silence",
          description: "Watch without intervening.",
          outcomeText:
            "He keeps writing in the void. You leave with the certainty of having missed something, without knowing what.",
        },
        {
          label: "Speak to him",
          description: "Attempt contact.",
          outcomeText:
            "He startles. Opens his mouth. Closes it. Opens it again. 'There was a word,' he finally says. 'I can no longer find it.' You do not know what to say to that.",
        },
        {
          label: "Ignore him and walk on",
          description: "Not your concern.",
          outcomeText:
            "He vanishes from your field of vision before you have even turned your back. Nothing happened. And yet.",
        },
      ],
    },
    scribe_2_lost_words: {
      title: "The Torn Pages",
      flavorText:
        "He is sitting on the floor, surrounded by pages he has torn himself, trying to reassemble them. He does not look up when you approach.",
      description:
        "The fragments match nothing. He is searching for something he lost himself.",
      choices: [
        {
          label: "Help him gather the pages",
          description: "Reach out.",
          outcomeText:
            "He lets you help without protest. The pages do not fit together — the fragments correspond to nothing. But he watches you with something that looks like gratitude.",
        },
        {
          label: "Watch without intervening",
          description: "Keep your distance.",
          outcomeText:
            "The pages are covered in handwriting that vaguely resembles your own. You decide it is a coincidence.",
        },
        {
          label: "Tell him it is pointless",
          description: "Be blunt.",
          outcomeText:
            "He stops. Looks at you. 'Perhaps you are right,' he says. 'But I must try anyway.' He resumes. You leave.",
        },
      ],
    },
    scribe_3_familiar_face: {
      title: "The Known Face",
      flavorText:
        "He stops you in a corridor — this time, he takes the initiative. 'I know you,' he says. 'Not from this run. From the other one. Or perhaps... the next.'",
      description:
        "He speaks of you as a recurring character. He is not wrong.",
      choices: [
        {
          label: "Play along",
          description: "Nod in agreement.",
          outcomeText:
            "Your agreement relaxes him. 'I knew it. Good Archivists always return.' He says 'good' in a strange way, as though the word carries a price.",
        },
        {
          label: "Correct him: you have never met",
          description: "Be honest.",
          outcomeText:
            "He thinks it over. 'No,' he says. 'Perhaps you are right. Perhaps it was someone else.' He nods as though this is a satisfying answer. It is not.",
        },
        {
          label: "Leave without answering",
          description: "Do not stop.",
          outcomeText:
            "He says nothing. You feel his gaze on your back for the entire length of the next corridor.",
        },
      ],
    },
    scribe_4_torn_pages: {
      title: "The Erased Ink",
      flavorText:
        "He shows you a page. Up close, you can see the traces — something was there. Not a stain: a deliberately erased text. Someone took the time to remove every word.",
      description: "These pages were censored. Not by accident.",
      choices: [
        {
          label: "Try to read the traces",
          description: "Look more closely.",
          outcomeText:
            "With enough light and attention, a few words surface. Names. Places. And one title that recurs: Chief Archivist. You look up. He is waiting.",
        },
        {
          label: "Ask him who did this",
          description: "Ask the question.",
          outcomeText:
            "'Someone who believed certain stories were too dangerous.' He folds the page carefully. 'Someone who thought themselves reasonable.'",
        },
        {
          label: "Look away",
          description: "Do not look.",
          outcomeText:
            "He folds the page without a word. He will not hold it against you. He did not expect otherwise.",
        },
      ],
    },
    scribe_5_the_name: {
      title: "The Lost Name",
      flavorText:
        "He approaches murmuring something. One syllable. Then two. He is trying to reconstruct something essential he lost before he knew he had it.",
      description:
        "He is looking for his name. What remains of a man when the name is gone.",
      choices: [
        {
          label: "Encourage him to keep searching",
          description: "Stay with him.",
          outcomeText:
            "You wait. He tries. 'E...' He stops. 'I think it started with an E. Or perhaps that was someone else.' He smiles, undone. You stay until he gives up.",
        },
        {
          label: "Wait in silence",
          description: "Let silence do its work.",
          outcomeText:
            "The silence between you is comfortable. He eventually gives up for tonight — if this place has nights. 'Thank you for staying,' he says without explanation.",
        },
        {
          label: "Tell him it no longer matters",
          description: "Close the subject.",
          outcomeText:
            "He looks at you for a long moment. 'That's true,' he finally says. 'And that may be the problem.' He leaves before you do.",
        },
      ],
    },
    scribe_6_the_warning: {
      title: "What Lies Ahead",
      flavorText:
        "He intercepts you with unusual urgency. His face is sharper than usual, more present. 'I remember something,' he says. 'I must tell you before it goes.'",
      description: "He has something precise to pass on. One last time.",
      choices: [
        {
          label: "Listen carefully",
          description: "Give him your full attention.",
          outcomeText:
            "He speaks of a force — not an enemy, a direction. Something that decided to simplify everything. 'Simple stories hurt no one,' this thing says. 'It is wrong. Simple stories do not exist.' He looks at you as though you should understand something more.",
        },
        {
          label: "Listen without answering",
          description: "Absorb without commenting.",
          outcomeText:
            "He speaks. You absorb. You are not sure you understand everything, but the tone is enough. Something serious is coming.",
        },
        {
          label: "Tell him he is raving",
          description: "Dismiss his words.",
          outcomeText:
            "His gaze empties for a moment. 'Yes,' he says. 'Perhaps.' He leaves. That night, you do not sleep — if this place permits sleep.",
        },
      ],
    },
    scribe_7_the_other: {
      title: "The One Who Began",
      flavorText:
        "Without preamble: 'There was an Archivist before you. Before me too, I think. He decided that certain stories were too... complicated.' A pause. 'He must be found.'",
      description:
        "He speaks of someone without realizing he is speaking of himself.",
      choices: [
        {
          label: "Ask him to say more",
          description: "Dig deeper.",
          outcomeText:
            "He searches. The memory is fragmented. 'His name was...' He stops. Something in his eyes shifts — a second of panic, then it closes again. 'I no longer remember. I'm sorry.' You believe him.",
        },
        {
          label: "Observe his reaction",
          description: "Watch him speak about himself.",
          outcomeText:
            "What is striking is that he speaks of this man with anger. Not guilt. Not yet.",
        },
        {
          label: "Cut him short",
          description: "No time for this.",
          outcomeText:
            "He stops mid-sentence. Nods. 'You're right. Perhaps we don't have time.' But he had something to finish. He will not finish it today.",
        },
      ],
    },
    scribe_8_the_truth: {
      title: "The Archivist Before",
      flavorText:
        "His voice is steady. Steadier than all the previous times. 'I remember my role. Not my name yet. But my role: Chief Archivist of the Panlibrarium. Before you.'",
      description: "He knows what he was. Not yet what he did.",
      choices: [
        {
          label: "Tell him you believe him",
          description: "Grant him your trust.",
          outcomeText:
            "He closes his eyes for a second. 'That is more than I hoped for.' You are not entirely sure what you believe. But you believe it anyway.",
        },
        {
          label: "Keep your distance",
          description: "Stay cautious.",
          outcomeText:
            "It is not distrust — it is caution. He understands. 'You are right to wait,' he says. 'I have not told you everything yet.'",
        },
        {
          label: "Accuse him: he is the one who broke everything",
          description: "Say what you think.",
          outcomeText:
            "He pales. Or rather, what serves as his presence contracts. 'I do not rule out that possibility,' he says after a silence. It is not a denial.",
        },
      ],
    },
    scribe_9_the_choice: {
      title: "What You Would Do",
      flavorText:
        "'Suppose,' he says, 'that you had read all the stories. That you knew which ones make people violent. Which ones give them bad ideas. Dangerous ideas. What would you do?'",
      description:
        "He is not asking a rhetorical question. He genuinely wants to know.",
      choices: [
        {
          label: "Nothing. Stories belong to themselves.",
          description: "Defend the freedom of narratives.",
          outcomeText:
            "He nods slowly. 'That is what I would have said, once.' A pause. 'Before I saw what certain stories did to people.' But he does not seem to be contradicting you.",
        },
        {
          label: "It depends on the story.",
          description: "Be nuanced.",
          outcomeText:
            "'A reasonable answer,' he says. 'That is exactly how it begins.'",
        },
        {
          label: "Erase them. Protect the readers.",
          description: "Choose censorship.",
          outcomeText:
            "Something in his face changes — not satisfaction. Pain. 'Yes,' he says. 'That is what I would have said too.'",
        },
      ],
    },
    scribe_10_the_reveal: {
      title: "What Cannot Be Erased",
      flavorText:
        "He is entirely present. Lucid, steady, frightening in his clarity. 'I am the one I told you about. The Archivist who began it. I sought you through all these encounters because I did not yet remember. Now I do.'",
      description: "He knows. He tells you everything. He has a few minutes.",
      choices: [
        {
          label: "Tell him you already knew",
          description: "Offer him that grace.",
          outcomeText:
            "You were lying — you suspected, but you did not truly know. He smiles. 'No matter. Now you must go further than I did. What you find ahead is what I became. Kill it if you can. Or... no. Listen to it first.'",
        },
        {
          label: "Stay silent",
          description: "Let the weight of truth exist.",
          outcomeText:
            "He does not wait for an answer. He knows that certain truths call for no words. He fades slowly — literally, not as a metaphor. His ink dissolves. 'Good luck, Archivist.'",
        },
        {
          label: "Turn your back on him",
          description: "Refuse to hear it.",
          outcomeText:
            "He does not call you back. When you look behind you, he is gone. In the empty corridor, a page still floats — covered in handwriting you now recognize as his.",
        },
      ],
    },
    nyame_trial: {
      title: "Nyame's Trial",
      flavorText:
        "The room's ceiling is a window onto something resembling a sky — and in that sky, an immense eye watches you. Nyame, the sky god, has read every book in the Library from his ceiling since the first day. He saw you coming. 'A trial,' says the voice from above. 'To measure whether you deserve to continue.'",
      description:
        "Nyame judges from his sky. His trial is difficult but fair.",
      choices: [
        {
          label: "Accept the trial",
          description: "Gain 40 max HP. Lose 20 HP.",
          outcomeText:
            "What the trial demands, you pay in flesh. What it gives in return, you carry like a deep revision. Nyame makes a note in his own archives. You passed. Not easily — but passed.",
        },
        {
          label: "Offer gold for a lighter trial",
          description: "Lose 40 gold, gain 30 max HP.",
          outcomeText:
            "'Gold does not exempt from the trial,' says the voice. 'But it pays for a shorter version.' A brief light. A brief pain. A real gain.",
        },
        {
          label: "Ignore the gaze and move forward",
          description: "Nothing happens.",
          outcomeText:
            "The eye follows you to the next room. Nyame notes something in his archives. Perhaps for another occasion. Perhaps never to forget.",
        },
      ],
    },
  },
} as const;
