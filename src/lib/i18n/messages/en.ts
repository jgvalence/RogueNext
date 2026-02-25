export const en = {
  common: {
    language: "Language",
    french: "FR",
    english: "EN",
  },
  home: {
    kicker: "Deck-builder Roguelike",
    subtitle: "Explore books of mythology. Build your deck. Survive.",
    play: "Play",
    library: "Library",
    rules: "Rules",
    logout: "Logout",
    signup: "Sign up",
    signin: "Sign in",
    loginHint: "Sign in to save your progression",
    tags: [
      "Tactical combat",
      "Deck-building",
      "World mythologies",
      "Roguelike",
    ],
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
  },
  gameHub: {
    loading: "Loading...",
    retry: "Retry",
    unknownError: "Unable to load game data.",
    failedToStart: "Failed to start game: {{message}}",
  },
  collection: {
    title: "Card Collection",
    unlockedCount: "{{unlocked}}/{{total}} unlocked",
    backToLibrary: "Back to Library",
    startRun: "Start Run",
    allBiomes: "All biomes",
    allTypes: "All types",
    attack: "Attack",
    defenseSkill: "Defense (Skill)",
    power: "Power",
    allRarities: "All rarities",
    allStates: "All states",
    unlocked: "Unlocked",
    locked: "Locked",
    searchPlaceholder: "Search card name...",
    energy: "energy",
    whyLocked: "Why this card is locked",
    missingCondition: "Missing condition",
    progress: "Progress",
    alwaysUnlocked: "Always unlocked",
    runConditions: {
      title: "Starting options",
      summary:
        "{{unlocked}}/{{total}} unlocked - Runs: {{runs}} - Wins: {{wins}}",
      unlockCondition: "Unlock condition",
      unlockRuns: "Complete at least {{runs}} run(s)",
      unlockWins: "Win at least {{wins}} run(s)",
      unlockRunsAndWins:
        "Complete at least {{runs}} run(s) and win {{wins}} run(s)",
    },
  },
  runCondition: {
    select: {
      kicker: "New run",
      title: "Choose a starting option",
      subtitle: "Pick 1 option among 3.",
      pickAction: "Choose this option",
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
        description: "Add Heavy Strike to your starting deck.",
      },
      packed_supplies: {
        name: "Packed Supplies",
        description: "Start with +12 gold and +6 max HP.",
      },
      forbidden_contract: {
        name: "Forbidden Contract",
        description:
          "Add Mythic Blow and Haunting Regret to your starting deck.",
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
        description: "Start with +1 Strength, but heal 5% less after combat.",
      },
    },
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
        name: "Archivist",
        description: "Standard difficulty: +0% enemy HP, +0% enemy damage.",
      },
      1: {
        name: "Watcher",
        description: "+12% enemy HP, +10% enemy damage.",
      },
      2: {
        name: "Curator",
        description: "+24% enemy HP, +20% enemy damage.",
      },
      3: {
        name: "Censor",
        description: "+36% enemy HP, +30% enemy damage.",
      },
      4: {
        name: "Abyssal",
        description:
          "+48% enemy HP, +40% enemy damage, +8 points elite chance, special rooms: HEAL weight x0.5.",
      },
      5: {
        name: "Mythic",
        description:
          "+60% enemy HP, +50% enemy damage, +16 points elite chance, special rooms: HEAL weight x0.25, enemy packs: +1 max size.",
      },
    },
  },
  map: {
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
      COMBAT: "Combat",
      MERCHANT: "Merchant",
      SPECIAL: "Event",
      PRE_BOSS: "Pre-Boss",
    },
    reward: {
      card: "Card",
      relic: "Relic",
      ally: "Ally",
      maxHp: "Max HP",
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
        "A hymn to the sun god that infuses every action with divine energy. +100% chance to gain Ink when playing a card.",
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
        "The Piedra del Sol reveals regeneration cycles. Recover 5% of max HP after each combat.",
    },
    chant_de_quetzalcoatl: {
      title: "Song of Quetzalcoatl",
      description:
        "A hymn to the Feathered Serpent, symbol of rebirth. +10 additional max HP.",
    },
    rite_du_soleil_noir: {
      title: "Rite of the Black Sun",
      description:
        "A ritual honoring Tezcatlipoca, master of the dark mirror. +5% additional max HP recovered after each combat.",
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
      block: "Gain {{value}} block",
      heal: "Heal {{value}} HP",
      draw: "Draw {{value}} cards",
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
    },
  },
  buff: {
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
    target: {
      allEnemies: "all enemies",
      lowestHpEnemy: "lowest HP enemy",
      allyPriority: "ally priority",
      self: "self",
      player: "player",
    },
    effect: {
      damage: "damage {{value}}",
      heal: "heal {{value}}",
      block: "block {{value}}",
      drawCards: "draw {{value}}",
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
} as const;
