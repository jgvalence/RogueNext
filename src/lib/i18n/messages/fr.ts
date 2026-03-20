export const fr = {
  common: {
    language: "Langue",
    french: "FR",
    english: "EN",
    close: "Fermer",
    back: "Retour",
  },
  home: {
    kicker: "Deck-builder Roguelike",
    subtitle:
      "Parcourez les livres de la mythologie. Construisez votre deck. Survivez.",
    play: "Jouer",
    library: "Bibliotheque",
    leaderboard: "Classement",
    rules: "Regles",
    logout: "Deconnexion",
    signup: "S'inscrire",
    signin: "Se connecter",
    loginHint: "Connectez-vous pour sauvegarder votre progression",
    signedInHint: "Le grimoire est ouvert. Lancez une nouvelle expedition.",
    ritualKicker: "Table de navigation",
    ritualTitle: "Plan de run",
    ritualSubtitle:
      "Tracez votre route, optimisez votre deck, puis terrassez le boss.",
    pathLabel: "Sequence de progression",
    modeLabel: "Doctrine",
    modeValue: "Roguelike tactique",
    pathSteps: ["Combat", "Elite", "Marchand", "Boss"],
    quickFacts: {
      floors: "Etages",
      rooms: "Salles / etage",
      rewardChoices: "Choix de carte",
      startingEnergy: "Energie de depart",
    },
    tags: [
      "Combats tactiques",
      "Deck-building",
      "Mythologies du monde",
      "Roguelike",
    ],
  },
  leaderboard: {
    kicker: "Classement global",
    title: "Hall des Archivistes",
    subtitle:
      "Compare la progression infinie ou les meilleurs temps de victoire par difficulte.",
    backHome: "Accueil",
    loadError: "Impossible de charger le classement: {{message}}",
    empty: "Aucune statistique de run disponible pour le moment.",
    playerFallback: "Archiviste {{id}}",
    you: "Vous",
    noTime: "-",
    none: "-",
    filters: {
      kicker: "Tri du classement",
      limit: "Top {{count}} joueurs affiches.",
      sortLabel: "Trier par",
      difficultyLabel: "Difficulte du temps",
      allDifficulties: "Toutes les difficultes",
      summaryProgression:
        "Classement progression: etage infini, puis victoires, difficulte max et temps.",
      summaryVictoryTimeAll:
        "Classement par meilleur temps de victoire, toutes difficultes confondues.",
      summaryVictoryTimeDifficulty:
        "Classement par meilleur temps de victoire en D{{difficulty}}.",
      sortOptions: {
        progression: "Progression",
        victoryTime: "Temps de victoire",
      },
    },
    columns: {
      rank: "Rang",
      player: "Joueur",
      wins: "Victoires",
      runs: "Runs",
      winRate: "Winrate",
      bestInfiniteFloor: "Etage infini max",
      bestDifficulty: "Difficulte max",
      bestTime: "Temps par diff",
      bestTimeVictory: "Temps victoire",
      bestTimeDifficulty: "Temps victoire D{{difficulty}}",
    },
  },
  auth: {
    back: "Retour",
    password: "Mot de passe",
    signin: {
      subtitle: "Connectez-vous pour continuer",
      invalidCredentials: "Email ou mot de passe incorrect",
      loading: "Connexion...",
      submit: "Se connecter",
      noAccount: "Pas encore de compte ?",
      goSignup: "S'inscrire",
    },
    signup: {
      subtitle: "Creez votre compte pour jouer",
      nameOptional: "Nom (optionnel)",
      namePlaceholder: "Explorateur",
      passwordPlaceholder: "6 caracteres minimum",
      loading: "Inscription...",
      submit: "S'inscrire",
      hasAccount: "Deja un compte ?",
      goSignin: "Se connecter",
      autoSigninError: "Compte cree, mais connexion impossible. Reessayez.",
    },
  },
  biome: {
    LIBRARY: "La Bibliotheque",
    VIKING: "Contrees Vikings",
    GREEK: "Grece Antique",
    EGYPTIAN: "Egypte Eternelle",
    LOVECRAFTIAN: "Abysses Lovecraftiennes",
    AZTEC: "Empire Azteque",
    CELTIC: "Forets Celtiques",
    RUSSIAN: "Steppes Russes",
    AFRICAN: "Savanes Africaines",
  },
  library: {
    backHome: "Accueil",
    title: "Bibliotheque du Panlibrarium",
    collectedStories: "{{unlocked}}/{{total}} histoires collectees",
    collection: "Collection",
    bestiary: "Bestiaire",
    startRun: "Commencer un run",
    tier: "Tier",
    permanentBonus: "Bonus permanent",
    cost: "Cout",
    availableAmount: "disponibles",
    prerequisites: "Prerequis",
    ownedStory: "Histoire possedee",
    unlocking: "Deblocage...",
    unlock: "Debloquer",
    missingPrereqs: "Prerequis manquants",
    insufficientResources: "Ressources insuffisantes",
    genericError: "Une erreur est survenue.",
    loadErrorTitle: "Impossible de charger la bibliotheque",
    collectionLoadErrorTitle: "Impossible de charger la collection",
    firstVisitTutorial: {
      kicker: "Tutoriel bibliotheque",
      title: "Ici, tu transformes tes runs en progression permanente",
      description:
        "La Bibliotheque sert de meta-progression. Les ressources gagnees en run sont depensees ici pour debloquer des histoires qui renforcent tous tes prochains runs.",
      resourcesTitle: "Ressources",
      resourcesDescription:
        "Chaque biome donne sa propre ressource apres les combats. Le bandeau en haut montre ton stock actuel pour savoir quelles histoires tu peux acheter.",
      treeTitle: "Arbre de competences",
      treeDescription:
        "Chaque livre est un noeud de l'arbre. Debloquer une histoire accorde un bonus permanent, mais certaines branches demandent d'abord des prerequis ou plus de ressources.",
      tip: "Commence par les noeuds accessibles du biome Bibliotheque, puis ouvre les autres branches au fil de tes expeditions.",
      gotIt: "Explorer la bibliotheque",
    },
    guidedStoryTutorial: {
      kicker: "Premier achat",
      description:
        "Tu as recupere juste assez de Pages pour debloquer l'Encyclopedie du Savoir. Cette histoire te donnera +1 pioche sur tous tes prochains runs.",
    },
    bonus: {
      extraDraw: "+{{value}} pioche par tour",
      extraEnergyMax: "+{{value}} energie max",
      extraInkMax: "+{{value}} encre max",
      inkPerCardChance:
        "+{{value}}% de chance de gagner de l'encre en jouant une carte",
      inkPerCardValue: "+{{value}} encre quand le proc se declenche",
      startingInk: "Commence le combat avec +{{value}} encre",
      startingBlock: "+{{value}} armure au debut du combat",
      startingStrength: "+{{value}} force au debut du combat",
      startingFocus: "+{{value}} focus au debut du combat",
      startingRegen: "Recupere +{{value}} PV au debut du tour",
      firstHitDamageReduction: "Premier coup subi : -{{value}}% degats",
      extraHp: "+{{value}} PV max",
      extraHandAtStart: "+{{value}} cartes en main de depart",
      attackBonus: "+{{value}} degats des cartes Attaque",
      allySlots: "+{{value}} emplacement(s) allie",
      startingGold: "+{{value}} or de depart a chaque run",
      extraCardRewardChoices: "+{{value}} choix de carte en recompense",
      relicDiscount: "{{value}}% de reduction sur les reliques",
      lootLuck: "+{{value}} qualite du butin",
      unlockInkPower: "Debloque le pouvoir d'encre {{power}}",
      unlockPowerSlot: "Debloque le pouvoir de rang {{slot}}",
      healAfterCombat: "Recupere {{value}}% des PV max apres combat",
      healAfterCombatFlat: "Recupere {{value}} PV apres combat",
      exhaustKeepChance:
        "{{value}}% de chance de ne pas epuiser une carte avec Exhaust (hors pouvoirs)",
      survivalOnce: "Survit a 1 PV une fois par run",
      freeUpgradePerRun: "Ameliore une carte gratuitement a chaque run",
      startingRareCard: "Commence chaque run avec une carte rare aleatoire",
    },
  },
  gameHub: {
    loading: "Chargement...",
    retry: "Reessayer",
    unknownError: "Impossible de charger les donnees du jeu.",
    failedToStart: "Impossible de lancer la partie : {{message}}",
  },
  collection: {
    title: "Collection",
    unlockedCount: "{{unlocked}}/{{total}} debloquees",
    cardSummary:
      "{{unlocked}} debloquees - {{locked}} bloquees - {{total}} cartes",
    relicSummary:
      "{{unlocked}} debloquees - {{locked}} bloquees - {{total}} reliques",
    backToLibrary: "Retour bibliotheque",
    startRun: "Commencer un run",
    tabs: {
      runOptions: "Options de depart",
      cards: "Cartes",
      relics: "Reliques",
    },
    allBiomes: "Tous les biomes",
    allTypes: "Tous les types",
    attack: "Attaque",
    defenseSkill: "Defense (Competence)",
    power: "Pouvoir",
    allOwnerships: "Toutes les origines",
    neutralOnly: "Neutres",
    characterTypedOnly: "Typees personnage",
    allRarities: "Toutes les raretes",
    bossRelicRarity: "Relique de boss",
    allStates: "Tous les etats",
    unlocked: "Debloquee",
    locked: "Bloquee",
    searchPlaceholder: "Rechercher une carte...",
    searchRelicPlaceholder: "Rechercher une relique...",
    noCardsForFilters: "Aucune carte pour ces filtres.",
    noRelicsForFilters: "Aucune relique pour ces filtres.",
    energy: "energie",
    neutralBadge: "Neutre",
    characterTypedBadge: "Typee {{character}}",
    relicSourceBoss: "Source: boss {{boss}}",
    relicSourceGeneral: "Source: generale",
    whyLocked: "Pourquoi cette carte est bloquee",
    whyRelicLocked: "Pourquoi cette relique est bloquee",
    missingCondition: "Condition manquante",
    progress: "Progression",
    alwaysUnlocked: "Toujours debloquee",
    relicUnlockBestGold: "Atteindre {{gold}} or sur un meme run",
    relicUnlockDifficultyWins:
      "Gagner {{wins}} run(s) en difficulte {{difficulty}}",
    relicUnlockCharacterDifficultyWins:
      "Gagner {{wins}} run(s) en difficulte {{difficulty}} avec {{character}}",
    runConditions: {
      title: "Options de depart",
      summary:
        "{{unlocked}}/{{total}} debloquees - Runs: {{runs}} - Victoires: {{wins}}",
      unlockCondition: "Condition de debloquage",
      unlockRuns: "Terminer au moins {{runs}} run(s)",
      unlockWins: "Gagner au moins {{wins}} run(s)",
      unlockEnemyKills: "Vaincre {{enemy}} {{kills}} fois",
      unlockLootedCard: "Obtenir {{card}} au moins une fois",
      unlockRunsAndWins:
        "Terminer au moins {{runs}} run(s) et gagner {{wins}} run(s)",
    },
  },
  bestiary: {
    title: "Bestiaire des royaumes",
    discoveredCount: "{{discovered}}/{{total}} entrees decouvertes",
    backToLibrary: "Retour bibliotheque",
    startRun: "Commencer un run",
    allBiomes: "Tous les biomes",
    allTypes: "Tous les types",
    noEntries: "Aucune entree pour ce filtre.",
    type: {
      NORMAL: "Normal",
      ELITE: "Elite",
      BOSS: "Boss",
    },
    state: {
      discovered: "Decouverte",
      locked: "Verrouillee",
    },
    lockedName: "???",
    lockedLore: "Cette entree sera revelee apres votre premiere rencontre.",
    stats: "Stats de base",
    hp: "PV",
    speed: "Vitesse",
    kills: "Victoires",
    loreTier: "Lore {{current}}/{{total}}",
    nextLoreAt: "prochaine entree a {{count}}",
  },
  runCondition: {
    select: {
      kicker: "Nouveau run",
      title: "Choisis une option de depart",
      subtitle: "Choisis 1 option parmi 3.",
      pickAction: "Choisir cette option",
    },
    bossStart: {
      name: "Benediction de {{boss}}",
      description: "Commence le run avec : {{bonus}}.",
      bonusFallback: "Bonus de depart de boss",
    },
    category: {
      LIGHT_BOON: "Petit avantage",
      BOON_WITH_DRAWBACK: "Avantage + malus",
      BONUS_CARD: "Carte bonus",
      GOOD_BAD_CARD: "Bonne + mauvaise carte",
      SPECIAL_RULE: "Regle speciale",
      UNIQUE_MECHANIC: "Mecanique unique",
    },
    definitions: {
      vanilla_run: {
        name: "Sans changement",
        description: "Run classique, sans regle speciale.",
      },
      quiet_pockets: {
        name: "Poches tranquilles",
        description: "Commence avec +20 or.",
      },
      tempered_flesh: {
        name: "Chair temperee",
        description: "Commence avec +12 PV max, mais -15 or.",
      },
      open_grimoire: {
        name: "Grimoire ouvert",
        description: "Ajoute Fortify au deck de depart.",
      },
      recursive_scratch_opening: {
        name: "Griffure recursive",
        description: "Commence chaque combat avec Recursive Scratch en main.",
      },
      inked_beginning: {
        name: "Debut encre",
        description: "Commence chaque combat avec +2 encre.",
      },
      battle_manual: {
        name: "Manuel de bataille",
        description: "Ameliore 2 cartes aleatoires de votre deck de depart.",
      },
      packed_supplies: {
        name: "Ravitaillement",
        description:
          "Retire 1 carte de depart aleatoire et ajoute 1 carte aleatoire.",
      },
      curators_patronage: {
        name: "Patronage du conservateur",
        description:
          "Commence avec la relique Sacoche de Preparation, mais perdez 12 PV max.",
      },
      fractured_archive: {
        name: "Archive fracturee",
        description:
          "Ameliore 3 cartes aleatoires, mais ajoute 2 Regret hantant au deck.",
      },
      severed_index: {
        name: "Index tronque",
        description:
          "Retire 2 cartes de depart aleatoires, puis ajoute 1 carte rare aleatoire et ameliore 1 carte aleatoire.",
      },
      merciless_routes: {
        name: "Routes impitoyables",
        description:
          "Pas de marchands et un seul chemin, mais recompenses de combat x2.",
      },
      forbidden_contract: {
        name: "Contrat interdit",
        description:
          "Ajoute Mythic Blow et Haunting Regret, mais perdez 6 PV max.",
      },
      single_path: {
        name: "Chemin unique",
        description: "Une seule option de salle a chaque etape.",
      },
      eventful_routes: {
        name: "Routes agitees",
        description: "Pas de marchands, plus de salles speciales.",
      },
      battle_rite: {
        name: "Rite de guerre",
        description: "Commence avec +1 Force, mais perdez 8 PV max.",
      },
      chaos_draft: {
        name: "Draft chaotique",
        description: "Le deck de depart est remplace par 10 cartes aleatoires.",
      },
      boss_rush: {
        name: "Marche des boss",
        description:
          "Tous les combats deviennent des combats de boss. Recompenses de combat x2.",
      },
      veterans_oath: {
        name: "Praticiens de Snokin",
        description:
          "Vous recupererez 100% de vos PV apres chaque combat, mais perdez 50 PV max.",
      },
      ink_lender: {
        name: "Pret d'encre",
        description:
          "Commence chaque combat avec +2 encre et +1 encre par carte jouee, mais -20 or.",
      },
      prepared_wards: {
        name: "Gardes pretes",
        description: "Commence avec la relique Ruban garde.",
      },
      archivist_cache: {
        name: "Reserve d'archiviste",
        description:
          "Ajoute 2 cartes aleatoires communes ou peu communes au deck de depart.",
      },
      rare_tithe: {
        name: "Dime rare",
        description: "Ajoute 1 carte rare aleatoire, mais perdez 14 PV max.",
      },
      surgical_cut: {
        name: "Coupe chirurgicale",
        description:
          "Retire 2 cartes de depart aleatoires et ameliore 2 cartes aleatoires.",
      },
      quick_studies: {
        name: "Etudes eclair",
        description:
          "Ameliore 1 carte aleatoire et ajoute 1 carte peu commune ou rare aleatoire.",
      },
      cursed_compendium: {
        name: "Compendium maudit",
        description: "Ajoute 2 cartes aleatoires, mais aussi 2 Regret hantant.",
      },
      crystal_loan: {
        name: "Pret de cristal",
        description:
          "Commence avec la relique Cristal d'energie, ameliore 1 carte aleatoire, mais ajoute 1 Regret hantant.",
      },
      inkwell_bargain: {
        name: "Marche de l'encrier",
        description: "Commence avec la relique Reservoir d'encre, mais -25 or.",
      },
      forged_lexicon: {
        name: "Lexique forge",
        description:
          "Commence avec la relique Lexique de bataille, mais ajoute 1 Regret hantant.",
      },
      isolated_trials: {
        name: "Epreuves isolees",
        description:
          "Un seul chemin a chaque salle, mais ajoute 2 cartes aleatoires.",
      },
      grim_shortcuts: {
        name: "Raccourcis funestes",
        description:
          "Un seul chemin avec plus de salles speciales, +10 or, mais ajoute 1 Regret hantant.",
      },
      fateful_manuscript: {
        name: "Manuscrit fatal",
        description:
          "Commence avec +1 energie max et +1 pioche par tour, mais ajoute 2 Regret hantant et perdez 12 PV max.",
      },
      infinite_mode: {
        name: "Mode infini",
        description:
          "Pas de limite d'etages. Aucune ressource de biome en fin de run. La difficulte explose apres l'etage 5.",
      },
    },
  },
  runSetup: {
    kicker: "Preparation du run",
    title: "Configure ton expedition",
    subtitle:
      "Choisis la difficulte, le type de run, puis prepare tes options de depart avant d'entrer dans la premiere salle.",
    firstRunTutorial: {
      kicker: "Premier run",
      title: "Mini tutoriel",
      subtitle:
        "Cette partie sert a prendre en main les bases. Pour ce premier run, la difficulte 0 est la seule disponible.",
      steps: {
        chooseDifficulty:
          "Choisis le niveau 0. C'est la seule difficulte disponible pour ce premier run.",
        pickMode: "Selectionne Normal pour un run classique en 5 etages.",
        planRoute:
          "Sur la carte, vise des combats pour renforcer ton deck, et passe au marchand si tu as assez d'or.",
        combatFlow:
          "En combat: joue tes cartes, garde un oeil sur l'energie/encre, puis termine ton tour.",
        endOfRun:
          "En fin de run, recupere tes recompenses et retourne a la Bibliotheque pour investir tes ressources.",
      },
    },
    sections: {
      character: "Personnage",
      difficulty: "Difficulte",
      runType: "Type de run",
      runCondition: "Option de run",
      preGameOptions: "Options pre-game",
    },
    selected: "Selectionne",
    modeType: "Mode",
    modeHint:
      "Choisis d'abord entre Normal et Infini, puis configure tes options pre-game.",
    modeLockedHint:
      "Le type de run est verrouille apres selection d'une option de run.",
    modeNormal: "Normal",
    modeNormalDescription:
      "Run classique en 5 etages, avec progression standard et ressources de fin de run.",
    modeInfinite: "Infini",
    modeInfiniteDescription:
      "Pas de limite d'etages. Pense pour grimper au leaderboard. Aucune ressource de biome n'est accordee.",
    continue: "Lancer le run",
    readyHint: "Preparation complete. Tu peux lancer le run.",
    missingHint: "Choisis une difficulte et un mode de jeu pour continuer.",
  },
  runDifficulty: {
    select: {
      kicker: "Difficulte",
      title: "Choisis un niveau",
      subtitle: "Termine un niveau pour debloquer le suivant.",
      pickAction: "Choisir cette difficulte",
    },
    levelLabel: "Niveau {{level}}",
    levels: {
      0: {
        chapter: "Chapitre I — Eveil",
        subtitle: "L'anomalie dans l'encre",
        name: "Archiviste",
        description: "Experience standard, ideale pour decouvrir le jeu.",
      },
      1: {
        chapter: "Chapitre II — Perturbation",
        subtitle: "Les Tomes se contaminent",
        name: "Veilleur",
        description: "Les ennemis deviennent un peu plus menacants.",
      },
      2: {
        chapter: "Chapitre III — Corruption",
        subtitle: "Les histoires se melangent",
        name: "Conservateur",
        description:
          "La pression monte: les combats demandent plus de rigueur.",
      },
      3: {
        chapter: "Chapitre IV — Effacement",
        subtitle: "La Censure agit",
        name: "Censeur",
        description:
          "Les elites et boss deviennent plus imprevisibles, et les boss percent mieux votre defense.",
      },
      4: {
        chapter: "Chapitre V — Amnesie",
        subtitle: "Derniere chance",
        name: "Abyssal",
        description:
          "Les combats elites et boss deviennent nettement plus agressifs, et les evenements sont plus risques.",
      },
      5: {
        chapter: "Chapitre VI — L'Abime",
        subtitle: "Il ne reste plus rien a perdre",
        name: "Mythique",
        description:
          "Mode ultime: plus d'elites, des ennemis impitoyables, et des recompenses moins garanties.",
      },
    },
  },
  map: {
    floorLabel: "Étage {{floor}}",
    choosePath: "Choisis ton chemin",
    roomOf: "Salle {{current}} sur {{total}}",
    bossSuffix: "BOSS",
    devBossSelector: {
      kicker: "DEV Salle Boss",
      subtitle:
        "Remplace le prochain combat de boss en choisissant un biome et l'un de ses boss.",
      biomeLabel: "Biome",
      bossLabel: "Boss",
      plannedBoss: "Boss prevu dans la salle : {{boss}} du biome {{biome}}",
    },
    devShortcut: {
      kicker: "Raccourci DEV",
      subtitle: "Ignore le routing et saute directement a la salle du boss.",
      action: "Aller au boss",
    },
    relicBossSelector: {
      kicker: "Choix de Boss",
      subtitle:
        "Depense la charge de la relique pour choisir quel boss de ce biome tu affrontes.",
      biomeLabel: "Biome",
      bossLabel: "Boss",
      plannedBoss: "Boss prevu dans la salle : {{boss}} du biome {{biome}}",
      readyKicker: "Relique prete",
      readySubtitle:
        "Le Sceau du Chasseur n'a pas encore ete utilise. Tu peux le depenser ici pour choisir le boss du biome.",
      useAction: "Utiliser le Sceau du Chasseur",
      cancelAction: "Le garder pour plus tard",
    },
    elite: "Elite",
    enemyCount_one: "{{count}} ennemi",
    enemyCount_other: "{{count}} ennemis",
    combatPreview: {
      resourcesLabel: "Ressources",
      resourcesBonusHint: "Bonus aleatoire: +1 autre biome",
      resourcesBonusShort: "+1?",
    },
    floorComplete: "Etage termine !",
    roomType: {
      COMBAT: "Affrontement",
      COMBAT_ELITE: "Épreuve d'Élite",
      MERCHANT: "Scriptorium",
      SPECIAL: "Chronique",
      SPECIAL_EVENT: "Evenement",
      SPECIAL_HEAL: "Halte de repos",
      SPECIAL_UPGRADE: "Forge des marges",
      PRE_BOSS: "Antichambre",
    },
    bossRoom: "Antre du Boss",
    reward: {
      card: "Carte",
      relic: "Relique",
      ally: "Allie",
      maxHp: "PV max",
    },
    firstMapTutorial: {
      kicker: "Tutoriel carte",
      title: "Lire les chemins de l'etage",
      description:
        "Les chroniques sont des evenements, le Scriptorium sert a ameliorer ton deck, et les combats d'elite offrent plus mais sont beaucoup plus dangereux.",
      tip: "Pour cette premiere expedition, observe bien ces trois options: on va volontairement prendre le chemin d'elite pour te montrer le risque.",
      forcedChoice: "Choisis obligatoirement la 3e carte: l'epreuve d'elite.",
      gotIt: "Compris",
    },
  },
  stories: {
    encyclopedie_du_savoir: {
      title: "Encyclopedie du Savoir",
      description:
        "Un traite exhaustif consignant les techniques de memorisation rapide. +1 carte piochee par tour.",
    },
    traite_de_lenergie: {
      title: "Traite de l'Energie",
      description:
        "Un manuel hermetique sur la canalisation de l'energie vitale. +1 energie max.",
    },
    le_grand_livre_des_sorts: {
      title: "Le Grand Livre des Sorts",
      description:
        "Le grimoire interdit de la tradition russe. Ses marges cachent des chemins vers les recompenses les plus rares. +2 qualite du butin.",
    },
    saga_de_ragnar: {
      title: "Saga de Ragnar",
      author: "Anonyme",
      description:
        "Les exploits de Ragnar Lodbrok mis en vers. +1 Force au debut de chaque combat.",
    },
  },
  cards: {
    heavy_strike: { name: "Coup de Pierre à Encre" },
    cleave: { name: "Déchirement de Page" },
    piercing_word: { name: "Mot perçant" },
    poison_quill: { name: "Plume empoisonnee" },
    mythic_blow: { name: "Chapitre Légendaire" },
    swift_slash: { name: "Tranche-Tome" },
    quick_feint: { name: "Feinte Scriptée" },
    bastion_crash: { name: "Étagère Effondrée" },
    venom_echo: { name: "Echo venimeux" },
    fortify: { name: "Sceau d'Archive" },
    scholars_focus: { name: "Concentration de l'erudit" },
    healing_script: { name: "Script de soin" },
    ink_flow: { name: "Flux d'encre" },
    adrenaline: { name: "Ruée d'Encre" },
    rage_of_ages: { name: "Rage des ages" },
    tome_strike: { name: "Frappe du tome" },
    double_strike: { name: "Script Double" },
    curse_word: { name: "Mot maudit" },
    final_chapter: { name: "Chapitre final" },
    vulnerability_hex: { name: "Hexe de vulnerabilite" },
    meditation: { name: "Étude Silencieuse" },
    quick_recovery: { name: "Récupération de l'Index" },
    inked_sweep: { name: "Balayage encre" },
    brace: { name: "Volumes Empilés" },
    ink_surge: { name: "Afflux d'encre" },
    exploit_weakness: { name: "Marge Exposée" },
    iron_will: { name: "Résolution du Scribe" },
    dazed: { name: "Hebete" },
    ink_burn: { name: "Brulure d'encre" },
    torn_index: { name: "Index dechire" },
    smudged_lens: { name: "Lentille maculee" },
    hexed_parchment: { name: "Parchemin maudit" },
    haunting_regret: { name: "Regret hantant" },
    binding_curse: { name: "Malediction de lien" },
    echo_curse: { name: "Malediction d'echo" },
    shrouded_omen: { name: "Presage voile" },
    berserker_charge: { name: "Charge berserker" },
    shield_wall: { name: "Mur de boucliers" },
    rune_strike: { name: "Frappe runique" },
    mjolnir_echo: { name: "Echo de Mjolnir" },
    saga_of_blood: { name: "Saga du sang" },
    valkyries_dive: { name: "Plongeon de la Valkyrie" },
    olympian_guard: { name: "Garde olympienne" },
    gorgons_gaze: { name: "Regard de Gorgone" },
    labyrinth: { name: "Labyrinthe" },
    heros_challenge: { name: "Defi du heros" },
    olympian_cleave: { name: "Entaille olympienne" },
    anubis_strike: { name: "Frappe d'Anubis" },
    canopic_ward: { name: "Protection canopique" },
    pharaohs_curse: { name: "Malediction du pharaon" },
    eye_of_ra: { name: "Oeil de Ra" },
    sand_whip: { name: "Fouet de sable" },
    solar_hymn: { name: "Hymne solaire" },
    forbidden_whisper: { name: "Murmure interdit" },
    madness_spike: { name: "Pointe de folie" },
    void_shield: { name: "Bouclier du vide" },
    starborn_omen: { name: "Presage astral" },
    void_touch: { name: "Toucher du vide" },
    eldritch_pact: { name: "Pacte occulte" },
    obsidian_jab: { name: "Estoc d'obsidienne" },
    sun_ritual: { name: "Rituel du soleil" },
    blood_offering: { name: "Offrande de sang" },
    jaguar_pounce: { name: "Bond du jaguar" },
    eclipse_vow: { name: "Voeu d'eclipse" },
    jaguars_blood: { name: "Sang du jaguar" },
    thorn_slash: { name: "Entaille epineuse" },
    druids_breath: { name: "Souffle du druide" },
    ancient_grove: { name: "Bosquet ancien" },
    faerie_fire: { name: "Feu feerique" },
    wild_gale: { name: "Rafale sauvage" },
    frost_nail: { name: "Griffe de givre" },
    iron_samovar: { name: "Samovar de fer" },
    bear_claw: { name: "Griffe d'ours" },
    permafrost_ward: { name: "Protection de pergelisol" },
    ancestral_drum: { name: "Tambour ancestral" },
    trickster_snare: { name: "Piege du filou" },
    griot_legacy: { name: "Heritage du griot" },
    spirit_drum: { name: "Tambour spirituel" },
    anansis_web: { name: "Toile d'Anansi" },
    annotated_thesis: { name: "These annotee" },
    forbidden_appendix: { name: "Annexe interdite" },
    index_of_echoes: { name: "Index des echos" },
    redacted_blast: { name: "Explosion censuree" },
    curator_pact: { name: "Pacte du conservateur" },
    // VIKING — Scribe
    iron_verse: { name: "Vers de Fer" },
    frost_rune_shield: { name: "Rune de Givre" },
    scald_cry: { name: "Cri du Scalde" },
    rune_storm: { name: "Tempête Runique" },
    battle_inscription: { name: "Inscription de Bataille" },
    odin_script: { name: "Runes d'Odin" },
    epic_saga: { name: "Épopée" },
    // VIKING — Bibliothécaire
    nordic_treatise: { name: "Traité Nordique" },
    rune_curse: { name: "Malédiction Runique" },
    saga_archive: { name: "Archive des Sagas" },
    norn_prophecy: { name: "Prophétie des Nornes" },
    ancient_ward: { name: "Ward Ancestral" },
    saga_keeper: { name: "Gardienne des Sagas" },
    valhalla_codex: { name: "Codex du Valhalla" },
    // GREEK — Scribe
    logos_strike: { name: "Frappe Logos" },
    philosophers_quill: { name: "Plume du Philosophe" },
    epic_simile: { name: "Comparaison Épique" },
    hermes_dash: { name: "Élan d'Hermès" },
    written_prophecy: { name: "Prophétie Écrite" },
    titans_wrath: { name: "Colère des Titans" },
    ares_verse: { name: "Vers d'Arès" },
    olympian_scripture: { name: "Écriture Olympienne" },
    // GREEK — Bibliothécaire
    oracle_scroll: { name: "Parchemin de l'Oracle" },
    shield_of_athena: { name: "Bouclier d'Athéna" },
    sphinx_riddle: { name: "Énigme du Sphinx" },
    apollos_archive: { name: "Archives d'Apollon" },
    labyrinth_trap: { name: "Piège du Labyrinthe" },
    pythian_codex: { name: "Codex de Pythie" },
    fates_decree: { name: "Décret des Moires" },
    // EGYPTIAN — Scribe
    hieroglyph_strike: { name: "Frappe Hiéroglyphe" },
    sacred_papyrus: { name: "Papyrus Sacré" },
    spell_inscription: { name: "Inscription de Sort" },
    book_of_ra: { name: "Livre de Râ" },
    sacred_ink_burst: { name: "Jaillissement d'Encre Sacrée" },
    scribes_judgment: { name: "Jugement du Scribe" },
    // EGYPTIAN — Bibliothécaire
    death_scroll: { name: "Parchemin de Mort" },
    mummy_ward: { name: "Garde de Momie" },
    plague_of_words: { name: "Plaie de Mots" },
    osiris_archive: { name: "Archives d'Osiris" },
    funerary_rite: { name: "Rite Funéraire" },
    desert_wisdom: { name: "Papyrus du Désert" },
    embalmed_tome: { name: "Tome Embaumé" },
    book_of_the_dead: { name: "Livre des Morts" },
    // LOVECRAFTIAN — Scribe
    void_quill: { name: "Plume du Néant" },
    cursed_inscription: { name: "Inscription Maudite" },
    black_page: { name: "Page Noire" },
    forbidden_verse: { name: "Vers Interdit" },
    eldritch_script: { name: "Écriture Abyssale" },
    necrotic_words: { name: "Mots Nécrotiques" },
    void_scripture: { name: "Écriture du Néant" },
    // LOVECRAFTIAN — Bibliothécaire
    sealed_tome: { name: "Tome Scellé" },
    library_horror: { name: "Horreur Bibliothécaire" },
    readers_pact: { name: "Pacte du Lecteur" },
    forbidden_index: { name: "Index Interdit" },
    void_librarian: { name: "Bibliothécaire du Néant" },
    necronomicon_page: { name: "Page du Nécronomicon" },
    cosmic_archive: { name: "Archives Cosmiques" },
    // AZTEC — Scribe
    obsidian_quill: { name: "Plume d'Obsidienne" },
    codex_strike: { name: "Frappe du Codex" },
    sacrificial_word: { name: "Mot Sacrificiel" },
    xipe_shield: { name: "Bouclier de Xipe" },
    sun_codex: { name: "Codex Solaire" },
    hummingbird_strike: { name: "Frappe du Colibri" },
    blood_codex: { name: "Codex de Sang" },
    // AZTEC — Bibliothécaire
    calendric_ward: { name: "Garde du Calendrier" },
    poison_herb: { name: "Herbe Sacrée" },
    star_chart: { name: "Carte des Étoiles" },
    quetzal_shield: { name: "Bouclier de Quetzal" },
    temple_archive: { name: "Archives du Temple" },
    obsidian_ward: { name: "Malédiction d'Obsidienne" },
    feathered_serpent: { name: "Serpent à Plumes" },
    // CELTIC — Scribe
    kells_strike: { name: "Frappe de Kells" },
    bardic_verse: { name: "Vers du Barde" },
    illuminated_shield: { name: "Bouclier Enluminé" },
    iron_bard: { name: "Barde de Fer" },
    triquetra_mark: { name: "Marque de la Triquètre" },
    ogham_inscription: { name: "Inscription Oghamique" },
    celtic_illumination: { name: "Enluminure Celtique" },
    green_man_verse: { name: "Vers de l'Homme Vert" },
    // CELTIC — Bibliothécaire
    herb_lore: { name: "Connaissance des Herbes" },
    fairy_veil: { name: "Voile des Fées" },
    morrigan_curse: { name: "Malédiction de la Morrigane" },
    cauldron_lore: { name: "Savoir du Chaudron" },
    selkie_song: { name: "Chant des Selkies" },
    ancient_manuscript: { name: "Manuscrit Ancien" },
    world_tree: { name: "L'Arbre Monde" },
    // RUSSIAN — Scribe
    byliny_verse: { name: "Vers de Bylina" },
    bogatyr_strike: { name: "Frappe du Bogatyr" },
    winter_inscription: { name: "Inscription d'Hiver" },
    blizzard_verse: { name: "Vers du Blizzard" },
    firebird_script: { name: "Écriture de l'Oiseau de Feu" },
    baba_yaga_deal: { name: "Marché de Baba Yaga" },
    koschei_strike: { name: "Frappe de Kochtcheï" },
    folk_epic: { name: "Épopée Populaire" },
    // RUSSIAN — Bibliothécaire
    fur_binding: { name: "Reliure de Fourrure" },
    folk_curse: { name: "Malédiction Folklorique" },
    matryoshka_lore: { name: "Savoir Matriochka" },
    snowstorm_trap: { name: "Piège de Blizzard" },
    leshy_ward: { name: "Garde du Leshiy" },
    zhar_ptitsa: { name: "Zhar-Ptitsa" },
    folklore_archive: { name: "Archives du Folklore" },
    frost_witch: { name: "Sorcière de Givre" },
    // AFRICAN — Scribe
    drum_strike: { name: "Battement du Griot" },
    war_dance: { name: "Chant de Bataille" },
    ink_of_ancestors: { name: "Encre des Ancêtres" },
    griot_strike: { name: "Frappe du Griot" },
    anansi_tale: { name: "Conte d'Anansi" },
    buffalo_charge: { name: "Épopée du Griot" },
    ancestral_verse: { name: "Vers Ancestral" },
    sunbird_power: { name: "Script de l'Oiseau Solaire" },
    // AFRICAN — Bibliothécaire
    spider_web: { name: "Toile du Savoir" },
    baobab_shield: { name: "Codex du Baobab" },
    healing_rhythm: { name: "Chant de la Gardienne" },
    oral_history: { name: "Histoire Orale" },
    trickster_lore: { name: "Sagesse du Filou" },
    ancestor_archive: { name: "Archives Ancestrales" },
    cosmic_spider: { name: "Codex d'Anansi" },
    strike: { name: "Frappe" },
    defend: { name: "Defense" },
  },
  relics: {
    ancient_quill: {
      name: "Plume ancienne",
      description: "+2 encre max",
    },
    energy_crystal: {
      name: "Cristal d'energie",
      description: "+1 energie par tour",
    },
    bookmark: {
      name: "Marque-page",
      description: "Pioche 1 carte supplementaire par tour",
    },
    ink_stamp: {
      name: "Tampon d'encre",
      description: "Commence le combat avec 3 encre",
    },
    iron_binding: {
      name: "Reliure de fer",
      description: "+1 encre gagnee quand l'effet encre-sur-carte se declenche",
    },
    blighted_compass: {
      name: "Boussole fletrie",
      description: "+1 pioche par tour, mais commence le combat avec Faible.",
    },
    cursed_diacrit: {
      name: "Diacritique maudit",
      description:
        "+1 energie par tour, mais gagne une malediction a chaque combat.",
    },
    runic_bulwark: {
      name: "Rempart runique",
      description: "Conserve 50% de votre armure restante a chaque tour.",
    },
    eternal_hourglass: {
      name: "Sablier eternel",
      description: "L'energie non depensee est conservee entre les tours.",
    },
    briar_codex: {
      name: "Codex d'epines",
      description: "Commence chaque combat avec 2 Epines.",
    },
    warded_ribbon: {
      name: "Ruban de garde",
      description: "Commence chaque combat avec 4 armure et 1 epine.",
    },
    inkwell_reservoir: {
      name: "Reservoir d'encrier",
      description: "+1 encre max et commence chaque combat avec 1 encre.",
    },
    battle_lexicon: {
      name: "Lexique de bataille",
      description: "Commence chaque combat avec +1 Force.",
    },
    vital_flask: {
      name: "Flasque vitale",
      description: "Recupere +5 PV apres chaque combat.",
    },
    menders_charm: {
      name: "Charme du guerisseur",
      description:
        "Augmente de 50% le pourcentage de soin applique apres chaque combat.",
    },
    menders_inkwell: {
      name: "Encrier du guerisseur",
      description:
        "Chaque fois que vous depensez de l'encre, soignez-vous d'autant de PV.",
    },
    echoing_inkstone: {
      name: "Pierre d'encre resonante",
      description:
        "Les cartes encrees, les cartes avec un cout en encre et les payoffs bases sur l'encre actuelle voient leurs effets doubles.",
    },
    gilded_ledger: {
      name: "Ledger dore",
      description: "Augmente de 50% l'or gagne via les recompenses de combat.",
    },
    plague_carillon: {
      name: "Carillon pestilentiel",
      description: "Chaque carte jouee inflige 1 degat a tous les ennemis.",
    },
    phoenix_ash: {
      name: "Cendre de phenix",
      description: "Recupere 2 PV au debut de chaque tour.",
    },
    ink_spindle: {
      name: "Fuseau d'encre",
      description:
        "A la fin du tour, gagne 1 concentration si votre main est vide.",
    },
    omens_compass: {
      name: "Boussole des presages",
      description:
        "Les recompenses de boss ont plus de chances d'inclure une option de relique de boss supplementaire.",
    },
    lucky_charm: {
      name: "Porte-bonheur",
      description: "Ameliore la chance de butin pour de meilleures raretes.",
    },
    haggler_satchel: {
      name: "Besace du negociant",
      description:
        "Le premier achat dans chaque boutique rafraichit tout le stock.",
    },
    surgeons_quill: {
      name: "Plume du chirurgien",
      description:
        "Vous pouvez purger jusqu'a 3 fois par visite chez le marchand.",
    },
    blood_grimoire: {
      name: "Grimoire de sang",
      description:
        "Gagne 1 PV max par ennemi normal tue, 2 par elite, 5 par boss.",
    },
    guardians_seal: {
      name: "Sceau du gardien",
      description: "+2 encre max. Commence chaque combat avec 2 encre.",
    },
    archivists_lens: {
      name: "Lentille de l'archiviste",
      description: "+2 encre max. Commence chaque combat avec 2 concentration.",
    },
    wolf_fang: {
      name: "Croc de loup",
      description: "Commence chaque combat avec 2 force.",
    },
    hels_crown: {
      name: "Couronne de Hel",
      description: "Commence chaque combat avec 2 force et 4 epines.",
    },
    stone_pendant: {
      name: "Pendentif de pierre",
      description: "Commence chaque combat avec 1 force et 1 concentration.",
    },
    hydra_scale: {
      name: "Ecaille d'hydre",
      description: "Commence chaque combat avec 1 force et 5 epines.",
    },
    solar_disc: {
      name: "Disque solaire",
      description: "+1 energie max. Commence chaque combat avec 2 encre.",
    },
    eye_of_maat: {
      name: "Oeil de Maat",
      description:
        "+1 energie max. Commence chaque combat avec 1 concentration.",
    },
    void_shard: {
      name: "Eclat du vide",
      description: "Commence chaque combat avec 2 concentration.",
    },
    shub_idol: {
      name: "Idole de Shub",
      description: "Commence chaque combat avec 2 force et 3 encre.",
    },
    obsidian_mirror: {
      name: "Miroir d'obsidienne",
      description: "Commence chaque combat avec 3 force.",
    },
    quetzal_feather: {
      name: "Plume de quetzal",
      description:
        "Commence chaque combat avec 1 force, 1 concentration et 1 energie.",
    },
    dagdas_club: {
      name: "Gourdin de Dagda",
      description: "Commence chaque combat avec 6 epines.",
    },
    cernunnos_horn: {
      name: "Corne de Cernunnos",
      description: "Commence chaque combat avec 6 epines et +1 pioche.",
    },
    yaga_skull: {
      name: "Crane de Yaga",
      description: "Commence chaque combat avec +1 pioche et 3 epines.",
    },
    deathless_bone: {
      name: "Os de l'immortel",
      description: "+1 energie max. Commence chaque combat avec 10 armure.",
    },
    griot_drum: {
      name: "Tambour du griot",
      description: "Commence chaque combat avec 6 armure et 1 force.",
    },
    weavers_thread: {
      name: "Fil du tisseur",
      description: "Commence chaque combat avec +1 pioche et 2 concentration.",
    },
    thorn_mantle: {
      name: "Manteau d'epines",
      description: "Gagne 1 epine au debut de chaque tour.",
    },
    spectral_inkwell: {
      name: "Encrier spectral",
      description: "Gagne 1 encre au debut de chaque tour.",
    },
    fading_grimoire: {
      name: "Grimoire fanant",
      description: "Gagne 1 force au debut de chaque tour.",
    },
    iron_codex: {
      name: "Codex de fer",
      description:
        "A la fin de votre tour, gagne 1 armure par carte encore en main.",
    },
    resonant_quill: {
      name: "Plume resonante",
      description:
        "A la fin de votre tour, gagne 1 encre par carte non jouee (max 3).",
    },
    ember_seal: {
      name: "Sceau de braise",
      description:
        "A la fin de votre tour, gagne 3 armure par energie non depensee.",
    },
    scholars_stone: {
      name: "Pierre de l'erudit",
      description: "Chaque carte Attaque jouee donne 1 encre.",
    },
    reactive_binding: {
      name: "Reliure reactive",
      description: "Chaque carte Competence jouee donne 1 armure.",
    },
  },
  usableItems: {
    potion_damage: {
      name: "Potion de degats",
      description: "Inflige 14 degats a un ennemi.",
    },
    potion_block: {
      name: "Potion de bouclier",
      description: "Gagne 12 armure.",
    },
  },
  gameCard: {
    type: {
      ATTACK: "Attaque",
      SKILL: "Competence",
      POWER: "Pouvoir",
      STATUS: "Statut",
      CURSE: "Malediction",
    },
    rarity: {
      STARTER: "Depart",
      COMMON: "Commun",
      UNCOMMON: "Inhabituel",
      RARE: "Rare",
    },
    labels: {
      normal: "Normal",
      noInk: "Sans encre",
      inked: "Encre",
      ink: "Encre",
      current: "Actuelle",
      upgraded: "Amelioree",
      petrified: "Petrifiee",
      webbed: "Capturee",
      neutral: "Neutre",
      redaction: {
        COST: "Cout +1",
        TEXT: "Texte censure",
      },
    },
    effect: {
      damage: "Inflige {{value}} degats",
      damageAll: "Inflige {{value}} degats a tous les ennemis",
      damageEqualBlock: "Inflige des degats egaux a votre armure",
      damagePerDebuff: "Inflige {{value}} degats par {{buff}} sur la cible",
      damageIfTargetHasDebuff:
        "Si la cible a deja {{buff}}, inflige {{value}} degats",
      damagePerThisCardPlayed:
        "Inflige {{value}} degats supplementaires pour chaque fois que cette carte a ete jouee ce combat",
      damagePerCurrentInk:
        "Inflige {{value}} degats par encre actuelle, puis retire toute votre encre",
      damagePerClogInDiscard:
        "Inflige {{value}} degats par statut/malediction dans votre defausse",
      damagePerExhaustedCard:
        "Inflige {{value}} degats par carte dans votre pile d'epuisement",
      damagePerDrawnThisTurn:
        "Inflige {{value}} degats par carte piochee ce tour",
      damageBonusIfUpgradedInHand:
        "Si cette carte est amelioree en main : +{{value}} degats",
      block: "Gagne {{value}} armure",
      blockPerCurrentInk:
        "Gagne {{value}} armure par encre actuelle, puis retire toute votre encre",
      blockPerDebuff: "Gagne {{value}} armure par {{buff}} sur les ennemis",
      blockPerExhaustedCard:
        "Gagne {{value}} armure par carte dans votre pile d'epuisement",
      applyBuffPerExhaustedCard:
        "Gagne {{value}} {{buff}} par carte dans votre pile d'epuisement",
      applyBuffPerDebuff:
        "Gagne {{value}} {{buff}} par {{scalingBuff}} sur les ennemis",
      retriggerThornsOnWeakAttack:
        "Quand un ennemi Affaibli vous attaque, vos Epines se declenchent {{value}} fois de plus ce combat",
      heal: "Soigne {{value}} PV",
      draw_one: "Pioche {{count}} carte",
      draw_other: "Pioche {{count}} cartes",
      doublePoison: "Double le Poison de la cible",
      triplePoison: "Triple le Poison de la cible",
      gainEnergy: "Gagne {{value}} energie",
      gainInk: "Gagne {{value}} encre",
      gainStrength: "Gagne {{value}} Force",
      gainFocus: "Gagne {{value}} Concentration",
      applyDebuff: "Applique {{value}} {{buff}}",
      applyDebuffAll: "Applique {{value}} {{buff}} a tous les ennemis",
      applyBuff: "Gagne {{value}} {{buff}}",
      drainInk: "Retire {{value}} encre",
      exhaust: "Epuisement",
      unplayable: "Injouable",
      addToDraw: "Ajoute une carte a la pioche",
      addToDrawCount_one: "Ajoute {{count}} carte a la pioche",
      addToDrawCount_other: "Ajoute {{count}} cartes a la pioche",
      addThisCardToDraw_one:
        "Ajoute {{count}} copie de cette carte a votre pioche",
      addThisCardToDraw_other:
        "Ajoute {{count}} copies de cette carte a votre pioche",
      addToDiscard: "Ajoute une carte a la defausse",
      addToDiscardCount_one: "Ajoute {{count}} carte a la defausse",
      addToDiscardCount_other: "Ajoute {{count}} cartes a la defausse",
      addThisCardToDiscard_one:
        "Ajoute {{count}} copie de cette carte a votre defausse",
      addThisCardToDiscard_other:
        "Ajoute {{count}} copies de cette carte a votre defausse",
      moveRandomNonClogDiscardToHand:
        "Remonte {{value}} carte(s) aleatoire(s) non statut/malediction de votre defausse vers votre main",
      freezeHandCards: "Gele {{value}} carte(s) en main",
      nextDrawToDiscardThisTurn:
        "Votre prochaine pioche va en defausse ce tour-ci",
      disableInkPowerThisTurn:
        "Desactive le pouvoir d'encre {{power}} ce tour-ci",
      increaseCardCostThisTurn: "Les cartes coutent +{{value}} ce tour-ci",
      increaseCardCostNextTurn:
        "Les cartes coutent +{{value}} au prochain tour",
      reduceDrawThisTurn: "Pioche -{{value}} ce tour-ci",
      reduceDrawNextTurn: "Pioche -{{value}} au prochain tour",
      forceDiscardRandom: "Defausse {{value}} carte(s) aleatoire(s)",
      whenRandomlyDiscarded:
        "Si cette carte est defaussee aleatoirement : {{effects}}",
      upgradeRandomCardInHand: "Ameliore une carte aleatoire en main",
    },
  },
  buff: {
    durationNote_one: "Dure {{count}} tour.",
    durationNote_other: "Dure {{count}} tours.",
    POISON: {
      label: "Poison",
      description:
        "Inflige {{stacks}} degats en fin de tour, puis diminue de 1.",
    },
    WEAK: {
      label: "Faible",
      description: "Reduit les degats infliges de 25%.",
    },
    VULNERABLE: {
      label: "Vulnerable",
      description: "Augmente les degats subis de 50%.",
    },
    STUN: {
      label: "Etourdi",
      description: "Passe son prochain tour.",
    },
    STUN_IMMUNITY: {
      label: "Anti-stun",
      description: "Ne peut pas etre etourdi ce tour-ci.",
    },
    STRENGTH: {
      label: "Force",
      description: "Augmente tous les degats infliges de {{stacks}}.",
    },
    FOCUS: {
      label: "Concentration",
      description: "Augmente l'armure gagnee de {{stacks}}.",
    },
    THORNS: {
      label: "Epines",
      description: "Inflige {{stacks}} degats aux attaquants.",
    },
    BLEED: {
      label: "Saignement",
      description:
        "Inflige {{stacks}} degats en fin de tour (ne diminue pas, expire par duree).",
    },
    WARD: {
      label: "Garde",
      description: "Annule le prochain degat subi.",
    },
    EXHAUST_ENERGY: {
      label: "Flux de braise",
      description:
        "Chaque fois qu'une de vos cartes est epuisee, gagnez 1 energie.",
    },
    POISON_BURST: {
      label: "Rite venimeux",
      description:
        "Chaque fois que vos cartes appliquent 6 Poison au total, inflige 5 degats a tous les ennemis.",
    },
    STONEBOUND: {
      label: "Petrifie",
      description: "Ne peut pas gagner d'armure.",
    },
  },
  reward: {
    victory: "Victoire!",
    gold: "Or",
    chooseReward: "Choisissez une recompense:",
    chooseRewardCardOrRelic: "Choisissez votre recompense: carte ou relique",
    chooseRewardCard: "Choisissez votre recompense: carte",
    chooseRewardRelic: "Choisissez votre recompense: relique",
    chooseRewardAlly: "Choisissez votre recompense: allie",
    noRewardChoices: "Aucune recompense disponible.",
    chooseCardToAdd: "Choisissez une carte a ajouter a votre deck:",
    continue: "Continuer",
    skip: "Passer",
    vitality: "Vitalite",
    maxHp: "PV max",
    maxHpDescription: "Augmente votre sante maximale de facon permanente",
    ally: "Allie",
    firstRewardTutorial: {
      kicker: "Tutoriel recompense",
      title: "Renforcer ton deck",
      description:
        "Apres un combat, choisis une recompense qui sert ton plan: carte, relique ou allie selon les options.",
      tip: "Au debut, privilegie les cartes simples et efficaces plutot que les effets trop situationnels.",
      gotIt: "Compris",
    },
    target: {
      allEnemies: "tous les ennemis",
      lowestHpEnemy: "ennemi avec le moins de PV",
      allyPriority: "allie prioritaire",
      self: "soi-meme",
      player: "joueur",
    },
    effect: {
      damage: "degats {{value}}",
      damageEqualBlock: "degats egaux a votre armure",
      damagePerDebuff: "degats {{value}} par {{buff}}",
      damageIfTargetHasDebuff: "si la cible a deja {{buff}}: degats {{value}}",
      damagePerThisCardPlayed:
        "degats {{value}} par fois que cette carte a ete jouee ce combat",
      damagePerCurrentInk: "degats {{value}} par encre actuelle, retire tout",
      damagePerClogInDiscard:
        "degats {{value}} par statut/malediction defausse",
      damagePerExhaustedCard: "degats {{value}} par carte epuisee",
      damagePerDrawnThisTurn: "degats {{value}} par carte piochee ce tour",
      damageBonusIfUpgradedInHand:
        "si cette carte est amelioree en main : +{{value}} degats",
      heal: "soin {{value}}",
      block: "armure {{value}}",
      blockPerCurrentInk: "armure {{value}} par encre actuelle, retire tout",
      blockPerDebuff: "armure {{value}} par {{buff}}",
      blockPerExhaustedCard: "armure {{value}} par carte epuisee",
      applyBuffPerExhaustedCard: "gagne {{value}} {{buff}} par carte epuisee",
      retriggerThornsOnWeakAttack: "epines retrigger contre faible +{{value}}",
      drawCards: "pioche {{value}}",
      doublePoison: "double le poison",
      gainInk: "gagne {{value}} encre",
      gainEnergy: "gagne {{value}} energie",
      gainFocus: "gagne {{value}} concentration",
      gainStrength: "gagne {{value}} force",
      applyBuff: "buff {{buff}} {{value}}",
      applyDebuff: "debuff {{buff}} {{value}}",
      drainInk: "retire {{value}} encre",
      exhaust: "epuisement",
      moveRandomNonClogDiscardToHand:
        "remonte {{value}} carte non clog de la defausse",
      freezeHandCards: "gele {{value}} carte(s) en main",
      nextDrawToDiscardThisTurn:
        "votre prochaine pioche va en defausse ce tour",
      increaseCardCostThisTurn: "les cartes coutent +{{value}} ce tour",
      increaseCardCostNextTurn:
        "les cartes coutent +{{value}} au prochain tour",
      reduceDrawThisTurn: "pioche -{{value}} ce tour",
      reduceDrawNextTurn: "pioche -{{value}} au prochain tour",
      forceDiscardRandom: "defausse aleatoire {{value}}",
      fallback: "{{type}} {{value}}",
    },
    resources: {
      PAGES: "Pages",
      RUNES: "Runes",
      LAURIERS: "Lauriers",
      GLYPHES: "Glyphes",
      FRAGMENTS: "Fragments",
      OBSIDIENNE: "Obsidienne",
      AMBRE: "Ambre",
      SCEAUX: "Sceaux",
      MASQUES: "Masques",
    },
  },
  gameError: {
    title: "Une erreur est survenue",
    description:
      "Une erreur est survenue dans la partie. Votre progression a ete sauvegardee automatiquement.",
    tryAgain: "Reessayer",
    backToMenu: "Retour au menu",
  },
  run: {
    loading: "Chargement de la partie...",
    notFound: "Run introuvable",
    freeUpgradeTitle: "Amelioration gratuite (Manuel de revision)",
    freeUpgradeSubtitle:
      "Choisis une carte non amelioree. Survole pour voir l'amelioration.",
    victoryTitle: "Victoire !",
    victorySubtitle:
      "Vous avez conquis les {{floor}} etages de la Bibliotheque Interdite !",
    defeatTitle: "Defaite",
    defeatSubtitle: "Votre histoire s'arrete ici...",
    abandonedTitle: "Run abandonnee",
    abandonedSubtitle: "Vous avez quitte cette aventure.",
    goldEarned: "Or gagne : {{gold}}",
    goldSimple: "Or : {{gold}}",
    deckSize: "Taille du deck : {{count}} cartes",
    relicCount: "Reliques : {{count}}",
    reachedRoom: "Atteint : Salle {{room}}/{{total}}",
    unlockCount_one: "{{count}} debloquage",
    unlockCount_other: "{{count}} debloquages",
    resourcesGained: "Ressources gagnees pendant ce run",
    resourceModifierBonus:
      "C'etait votre premiere victoire sur la difficulte {{level}}. Les ressources sont creditees a {{percent}}%.",
    resourceModifierReduced:
      "La difficulte {{level}} a deja ete validee. Seuls {{percent}}% des ressources sont credites sur les runs repetes.",
    cardsUnlocked: "Cartes debloquees pendant ce run",
    relicsUnlocked: "Reliques debloquees pendant ce run",
    newBestiaryEntryTitle: "Nouvelle entree du Bestiaire",
    newBestiaryEntrySingle: "{{name}} ajoute au Bestiaire",
    newBestiaryEntryMultiple:
      "{{count}} nouvelles entrees ajoutees au Bestiaire",
    none: "Aucune",
    backToLibrary: "Bibliotheque",
  },
  layout: {
    rotate: "TOURNE",
    rotateDevice: "Tourne ton appareil",
    rotateHint: "Panlibrarium necessite le mode paysage",
    floor: "Etage {{floor}}",
    room: "Salle",
    time: "Temps {{value}}",
    hp: "PV",
    gold: "Or",
    viewDeck: "Voir le deck",
    deck: "Deck",
    fullscreen: "Plein ecran",
    exitFullscreen: "Quitter le plein ecran",
    showRelics: "Voir les reliques",
    relics: "Reliques",
    menu: "Menu",
    mute: "Couper le son",
    unmute: "Remettre le son",
    abandonConfirm: "Terminer ce run maintenant ?",
    abandonRun: "Terminer le run",
    yourRelics: "Vos reliques",
    noRelicsYet: "Aucune relique pour le moment.",
  },
  biomeSelect: {
    floorCleared: "Etage {{floor}} termine",
    title: "Choisis ton destin",
    subtitle: "Selectionne le royaume a explorer ensuite",
    enemies: "Ennemis",
    enterRealm: "Entrer dans ce royaume",
    floorProgress: "Etage {{floor}} sur {{total}}",
    biomes: {
      LIBRARY: {
        name: "La Bibliotheque Interdite",
        description:
          "Des tomes antiques et des creatures d'encre hantent des rayonnages sans fin.",
        enemyPreview:
          "Gelatines d'encre, Spectres des tomes, Gardien des chapitres",
        flavor: "Les pages murmurent un savoir defendu...",
      },
      VIKING: {
        name: "Le Nord gele",
        description:
          "Des guerriers nordiques et des betes mythiques parcourent des halls pris par la glace.",
        enemyPreview: "Draugr, Vierges au bouclier, Fenrir",
        flavor: "Le Valhalla attend ceux qui en sont dignes.",
      },
      GREEK: {
        name: "Le Pantheon labyrinthique",
        description:
          "Des monstres olympiens gardent les tresors du monde antique.",
        enemyPreview: "Harpies, Cyclopes, Meduse",
        flavor: "Les dieux jouent avec la vie des mortels.",
      },
      EGYPTIAN: {
        name: "Les Sables eternels",
        description:
          "Des gardiens immortels protegent les secrets des pharaons.",
        enemyPreview: "Nuées de scarabees, Gardes d'Anubis, Avatar de Ra",
        flavor: "La mort n'est qu'un commencement.",
      },
      LOVECRAFTIAN: {
        name: "Le Vide exterieur",
        description: "Des horreurs eldritch venues d'au-dela de la realite.",
        enemyPreview: "Profonds, Cultistes du vide, Eclat de Nyarlathotep",
        flavor: "Les etoiles s'alignent selon des motifs indicibles.",
      },
      AZTEC: {
        name: "Le Temple d'obsidienne",
        description:
          "Des guerriers jaguar et des serpents a plumes reclament leur tribut.",
        enemyPreview: "Jaguar solaire, Pretre de sang, Echo de Tezcatlipoca",
        flavor: "Le cinquieme soleil doit etre nourri.",
      },
      CELTIC: {
        name: "L'Autre-Monde voile de brume",
        description:
          "Des creatures feeriques et des esprits druidiques vivent au-dela du voile.",
        enemyPreview: "Banshee, Druide epineux, Ombre de Dagda",
        flavor: "Les anciennes voies ont la memoire longue.",
      },
      RUSSIAN: {
        name: "La Foret d'hiver",
        description:
          "Des esprits slaves et des demons sylvestres rodent dans une nuit eternelle.",
        enemyPreview: "Sorciere de givre, Lechi, Kochei l'Immortel",
        flavor: "La maison de Baba Yaga tourne sur ses pattes de poulet.",
      },
      AFRICAN: {
        name: "La Savane des esprits",
        description:
          "Des orishas et des betes ancestrales parcourent les plaines sacrees.",
        enemyPreview: "Meute d'hyenes, Chasseur masque, Anansi le Tisseur",
        flavor: "Les ancetres veillent sur ceux qui se souviennent.",
      },
    },
  },
  deckViewer: {
    title: "Votre Deck",
    cardsCount_one: "{{count}} carte",
    cardsCount_other: "{{count}} cartes",
  },
  inkGauge: {
    ink: "ENCRE",
    powerTooltip: "{{description}} ({{cost}} encre)",
    powers: {
      // Scribe
      CALLIGRAPHIE: {
        label: "Calligraphie",
        desc: "Ameliore une carte aleatoire en main (ce combat)",
      },
      ENCRE_NOIRE: {
        label: "Encre Noire",
        desc: "Inflige encre x2 degats a tous les ennemis",
      },
      SEAL: {
        label: "Sceau",
        desc: "Gagne 8 armure",
      },
      // Bibliothecaire
      VISION: {
        label: "Vision",
        desc: "Pioche 2 cartes",
      },
      INDEX: {
        label: "Index",
        desc: "Recupere une carte de la defausse",
      },
      SILENCE: {
        label: "Chhhut",
        desc: "Un ennemi passe son prochain tour. Les elites et boss resistent 1 tour ensuite",
      },
      // Legacy
      REWRITE: {
        label: "Reecriture",
        desc: "Recupere une carte de la defausse",
      },
      LOST_CHAPTER: {
        label: "Chapitre perdu",
        desc: "Pioche 2 cartes",
      },
    },
  },
  characters: {
    scribe: {
      name: "Le Scribe",
      description:
        "Maître de l'encre et du verbe. Améliore ses cartes et frappe avec l'éclat de l'encre.",
    },
    bibliothecaire: {
      name: "La Bibliothécaire",
      description:
        "Gardienne des savoirs. Manipule la pioche et peut réduire ses ennemis au silence.",
    },
  },
  combat: {
    noCardsInHand: "Aucune carte en main",
    enemy: "Ennemi",
    summonOne: "{{summoner}} invoque {{target}} !",
    summonMany: "{{summoner}} invoque des renforts !",
    yourTurn: "Votre tour",
    enemyTurn: "Tour ennemi",
    turn: "Tour",
    drawPile: "Pioche",
    discardPile: "Defausse",
    exhaustPile: "Epuisement",
    debugTitle: "Debug apparition ennemi",
    debugPlanned: "Prevu",
    debugThematic: "Unite thematique presente",
    drawDebugTitle: "Debug pioche",
    drawDebugSummary:
      "Main {{hand}}/{{max}} - Pioche/tour {{draw}} - Overflow en attente {{overflow}}",
    drawDebugNoEvents: "Aucun evenement de pioche.",
    yes: "OUI",
    no: "NON",
    chooseAllyFor: "Choisissez un allie pour ",
    chooseTargetFor: "Choisissez une cible pour ",
    tapSelfOrAlly:
      "Retapez la carte pour l'auto-cast, ou cliquez un allie pour le cibler",
    tapToPlay: "Retapez la carte selectionnee pour la jouer",
    playCardCta: "Jouer",
    chooseTargetCta: "Choisir une cible",
    chooseEnemyFor: "Choisissez un ennemi pour ",
    hp: "PV",
    spd: "VIT",
    block: "Armure",
    noAbility: "Aucune capacite",
    activeEffects: "Effets actifs",
    deadInCombat: "Mort au combat",
    next: "Suivant",
    devChooseEnemy: "DEV : choisissez un ennemi a tuer",
    player: "Joueur",
    endTurn: "Fin du tour",
    cancelKill: "[DEV] Annuler",
    devKill: "[DEV] Tuer",
    draw: "Pioche",
    discard: "Defausse",
    exhaust: "Epuisement",
    cardsCount_one: "{{count}} carte",
    cardsCount_other: "{{count}} cartes",
    drawOrderMasked: "(ordre de pioche masque)",
    selectRewrite: "Selectionnez une carte a recuperer avec Reecriture",
    noCardsInPile: "Aucune carte dans cette pile.",
    handOverflowTitle: "Main surchargee",
    handOverflowSubtitle:
      "Vous avez depasse la limite de main. Choisissez {{count}} carte(s) a epuiser.",
    handOverflowHint:
      "Les depassements de pioche causes par les ennemis sont epuises automatiquement.",
    section: "Combat",
    energy: "Energie",
    ink: "Encre",
    inventory: "Inventaire",
    inventoryEmpty: "Inventaire vide",
    energyShort: "EN",
    you: "Vous",
    allEnemies: "Tous les ennemis",
    allAllies: "Tous les allies",
    ally: "Allie",
    firstCombatTutorial: {
      kicker: "Tutoriel combat",
      stepCounter: "Etape {{current}} / {{total}}",
      previous: "Precedent",
      next: "Suivant",
      done: "Terminer",
      skip: "Passer",
      steps: {
        cards: {
          title: "Cartes en main",
          description:
            "Chaque carte a un cout en energie et un effet. Lis bien attaque/skill/statut avant de jouer.",
        },
        energy: {
          title: "Energie par tour",
          description:
            "Tu depenses ton energie pour jouer tes cartes. Elle se recharge au debut de ton prochain tour.",
        },
        armor: {
          title: "Armure (bloc)",
          description:
            "Le badge 🛡 indique l'armure actuelle. Elle absorbe les degats recus avant vos PV.",
        },
        incomingDamage: {
          title: "Degats entrants",
          description:
            "Les intentions ennemies et les badges ⚔/🛡 montrent les degats prevus au prochain tour.",
        },
        ink: {
          title: "Encre",
          description:
            "La jauge d'encre sert a activer les variantes encrees des cartes et vos pouvoirs speciaux.",
        },
        inkPowers: {
          title: "Pouvoirs d'encre",
          description:
            "Je te donne assez d'encre pour ca: utilise maintenant ton pouvoir d'encre. Ici, il ameliore une carte en main pour ce combat.",
        },
        inkedCard: {
          title: "Carte encree",
          description:
            "Le pouvoir vient d'ameliorer une carte: une carte amelioree a des chiffres renforces, et parfois un cout ou un effet meilleur pour ce combat. Repere-la a son habillage dore. Cliquer sur la carte joue sa version normale; le bouton Encre en bas joue sa version + Encre. Je te redonne de l'encre: utilise maintenant le bouton Encre de la carte surlignee dans ta main.",
        },
        deckCycle: {
          title: "Pioche / Defausse / Epuise",
          description:
            "Les cartes jouees vont en defausse. Quand la pioche est vide, la defausse est melangee. Epuise = retire pour ce combat.",
        },
        endTurn: {
          title: "Finir son tour",
          description:
            "Quand tu n'as plus d'action utile, termine maintenant ton tour. Les ennemis joueront ensuite selon leurs intentions.",
        },
      },
    },
  },
  enemyCard: {
    boss: "Boss",
    elite: "Elite",
    acting: "Agit",
    blk: "BLK",
    dmg: "DMG",
    calculated: "Calcule : {{from}} -> {{to}} ({{modifiers}})",
    incoming: "Degats entrants",
    intentHidden: "Intention cachee",
    freeze: "Gele",
    nextDrawDiscard: "Prochaine pioche en defausse",
    lockInk: "Bloque encre {{power}}",
    cardCostUp: "Cartes +{{value}} cout",
    drawDown: "Pioche -{{value}}",
    randomDiscard: "Defausse aleatoire {{value}}",
    summon: "Invoque",
    reinvokeEnemy: "Retablit {{enemy}}",
    addCardToDrawNamed: "Pioche +{{value}} {{card}}",
    addCardToDiscardNamed: "Defausse +{{value}} {{card}}",
    drainAllInk: "Vide toute l'encre",
    selfDamage: "Perd {{value}} PV",
    alliesGainBlock: "Allies +{{value}} BLK",
    alliesGainBuff: "Allies +{{value}} {{buff}}",
    alliesGainThorns: "Allies +{{value}} Epines",
    redactCardCost: "Redige {{value}} carte : +1 cout",
    redactCardText: "Redige {{value}} carte : upgrade/encre coupes",
    redactCardFlexible: "Redige {{value}} carte : cout ou texte",
    restoreCostRedactionsOnDefeat:
      "Detruire : restaure les cartes a cout augmente",
    restoreTextRedactionsOnDefeat:
      "Detruire : restaure les cartes au texte redige",
    bonusDamageFlat: "+{{bonus}} bonus",
    conditionalBonusVsDebuffed: "+{{bonus}} si le joueur est affaibli",
    conditionalBonusVsLowInk: "+{{bonus}} si <= {{threshold}} encre",
    conditionalBonusPerCurse: "+{{perCurse}}/maled. (actuel +{{total}})",
    conditionalBonusPerHunt:
      "+{{perPip}}/chasse (reste {{remaining}}, actuel +{{total}})",
    conditionalBonusPerBleed: "+{{perBleed}}/saign. (actuel +{{total}})",
    conditionalBonusPerAntler: "+{{perAntler}}/andouiller (actuel +{{total}})",
    cashOutPlayerBleed: "Convertit Saignement x{{bleed}} ({{damage}} DMG)",
    phase2Badge: "P2",
    phase2Summon: "Phase 2 (<50% PV) : invoque {{label}}",
    phase2FenrirHunt: "HUNT passe a {{value}}",
    phase2HelRotate: "Change de stance a chaque tour",
    phase2MedusaDoubleGaze: "Phase 2 : revele un deuxieme pattern interdit",
    phase2TezcatlipocaDoubleEcho: "Phase 2 : stocke deux echos du miroir",
    phase2RaChargeRate:
      "Phase 2 : gagne {{value}} SUN chaque fois que tu gardes de l'encre",
    phase2OsirisThreshold:
      "Phase 2 : le seuil de Maat tombe a {{value}} et les verdicts deviennent plus severes",
    phase2SoundiataDoubleVerse:
      "Phase 2 : un deuxieme vers se superpose au premier",
    phase2NyarlathotepDoubleProphecy:
      "Phase 2 : deux propheties taboues sont actives en meme temps",
    phase2ShubDoubleBrood:
      "Phase 2 : Spawn Eruption peut entretenir deux nids a la fois",
    phase2DagdaFastBrew: "Phase 2 : le chaudron commence precharge a 1/2",
    phase2CernunnosFastRegrow:
      "Phase 2 : les andouillers repoussent de {{value}} apres chaque action",
    phase2AnansiThreeStepPattern:
      "Phase 2 : les patterns du metier passent a 3 etapes",
    phase2AnansiDoubleOutcome:
      "Phase 2 : une toile complete ajoute aussi Binding Curse",
    phase2QuetzalcoatlFastKnockdown:
      "Phase 2 : la chute demande seulement {{value}} hit(s)",
    phase2QuetzalcoatlBleedOnMiss:
      "Phase 2 : rater la chute ajoute {{value}} Saignement",
    tezcatlipoca: {
      mirrorLabel: "Miroir d'obsidienne",
      attackDetail: "Sa prochaine action renverra {{value}} degats du miroir.",
      blockDetail: "Sa prochaine action renverra {{value}} blocage du miroir.",
      inkDetail: "Sa prochaine action ajoute {{value}} Ink Burn a ta pioche.",
      hexDetail:
        "Sa prochaine action augmente les cartes de +{{value}} cout au prochain tour.",
      intentAttackEcho: "Echo : +{{value}} degats miroir",
      intentBlockEcho: "Echo : +{{value}} blocage miroir",
      intentInkEcho: "Echo : pioche +{{value}} Ink Burn",
      intentHexEcho: "Echo : cartes +{{value}} cout au prochain tour",
    },
    ra: {
      sunLabel: "Cycle solaire",
      sunDetail:
        "{{charge}}/{{max}} SUN charges. Finir ton tour avec de l'encre non depensee ajoute {{value}} SUN.",
      sunReadyDetail:
        "Solar Judgment est pret. Divine Scorch vide toute l'encre et gagne +{{bonus}} degats.",
      eclipseLabel: "Fenetre d'eclipse",
      eclipseDetail: "Briser Solar Barrier retire 1 SUN avant l'action de Ra.",
      chargeIntent: "Fin de tour avec encre : +{{value}} SUN",
      eclipseIntent: "Brise Solar Barrier : -1 SUN",
    },
    osiris: {
      scalesLabel: "Balances de Maat",
      balancedDetail:
        "{{damage}} degats contre {{block}} armure ce tour. Reste sous {{threshold}} d'ecart pour eviter un verdict.",
      attackVerdictLabel: "Verdict d'attaque",
      attackVerdictShort: "+{{bonus}} degats et {{weak}} Faible",
      attackVerdictDetail:
        "{{damage}} degats contre {{block}} armure. Sa prochaine action gagne +{{bonus}} degats et applique {{weak}} Faible.",
      blockVerdictLabel: "Verdict de defense",
      blockVerdictShort: "+{{bonus}} armure et {{vulnerable}} Vulnerable",
      blockVerdictDetail:
        "{{damage}} degats contre {{block}} armure. Sa prochaine action gagne +{{bonus}} armure et applique {{vulnerable}} Vulnerable.",
    },
    nyarlathotep: {
      prophecyLabel: "Prophetie noire",
      spentLabel: "Prophetie consommee",
      spentDetail:
        "{{omen}} s'est deja declenchee ce tour. {{card}} est deja en route.",
      drawDetail:
        "La premiere pioche provoquee par le joueur ce tour ajoute {{card}} a ta pioche.",
      inkDetail:
        "La premiere depense d'encre ce tour ajoute {{card}} a ta pioche.",
      attackDetail:
        "La premiere carte ATTACK ce tour ajoute {{card}} a ta pioche.",
      skillDetail:
        "La premiere carte SKILL ce tour ajoute {{card}} a ta pioche.",
      phaseTwoDetail: "Cette deuxieme prophetie n'apparait qu'en phase 2.",
      intentDraw: "Prophetie DRAW : ajoute {{card}}",
      intentInk: "Prophetie INK : ajoute {{card}}",
      intentAttack: "Prophetie ATTACK : ajoute {{card}}",
      intentSkill: "Prophetie SKILL : ajoute {{card}}",
    },
    shub: {
      broodLabel: "Cycle du couvain",
      broodDetail:
        "{{count}} nid(s) sont actifs sur {{max}}. Prochaine eclosion dans {{timer}} action(s) de Shub. Eldritch Veil en consomme un pour +{{heal}} PV et {{poison}} Poison.",
      broodEmptyDetail:
        "Aucun nid actif. Spawn Eruption peut remplir jusqu'a {{max}} nid(s). Eldritch Veil en consomme un pour +{{heal}} PV et {{poison}} Poison.",
      nestLabel: "Nid du couvain",
      nestDetail:
        "S'il survit encore {{timer}} action(s) de Shub, ce nid eclot en Shoggoth Spawn.",
    },
    dagda: {
      brewLabel: "Le chaudron",
      feastDetail:
        "FEAST est a {{progress}}/{{length}}. S'il se termine, Dagda se soigne de {{heal}} et gagne +{{strength}} Force. Brise le chaudron avant la resolution.",
      famineDetail:
        "FAMINE est a {{progress}}/{{length}}. S'il se termine, il ajoute {{cards}} et applique {{weak}} Faible pendant {{duration}} tour(s). Brise le chaudron avant la resolution.",
      cauldronDownLabel: "Chaudron brise",
      cauldronDownDetail:
        "Dagda n'a plus de chaudron en jeu. Cauldron Steam peut le restaurer.",
      cauldronLabel: "Chaudron de Dagda",
      cauldronDetail:
        "{{brew}} mijote ({{progress}}/{{length}}). Detruis le chaudron avant la resolution.",
    },
    cernunnos: {
      crownLabel: "Couronne d'andouillers",
      crownDetail:
        "{{layers}}/{{max}} couche(s) restent. Les hits sont limites a {{cap}} tant que la couronne tient. Ancient Wrath gagne actuellement +{{wrath}} degats.",
      exposedLabel: "EXPOSE",
      exposedDetail:
        "La couronne est brisee. Cernunnos subit +{{bonus}}% degats jusqu'a sa prochaine action, puis regagne {{regrow}} couche(s).",
    },
    soundiata: {
      verseLabel: "Vers epique",
      rallyDetail:
        "RALLY est a {{progress}}/{{length}}. S'il se termine, tous les ennemis gagnent +{{value}} Force. Brise-le avec {{interrupt}}/{{threshold}} degats sur Soundiata ou Mask Hunter ce tour.",
      shieldDetail:
        "SHIELD est a {{progress}}/{{length}}. S'il se termine, tous les ennemis gagnent +{{value}} armure. Brise-le avec {{interrupt}}/{{threshold}} degats sur Soundiata ou Mask Hunter ce tour.",
      warDetail:
        "WAR est a {{progress}}/{{length}}. S'il se termine, tous les ennemis gagnent +{{value}} Epines. Brise-le avec {{interrupt}}/{{threshold}} degats sur Soundiata ou Mask Hunter ce tour.",
      phaseTwoDetail: "Ce vers superpose n'apparait qu'en phase 2.",
    },
    anansi: {
      loomLabel: "Le Metier",
      loomDetail:
        "La combinaison {{pattern}} est active ({{progress}}/{{length}}). L'ordre n'a pas d'importance. Une carte jouee avec de l'encre compte comme son type natif plus INK. La completer capture la derniere carte jouee et ajoute Shrouded Omen.",
      loomPhaseTwoDetail:
        "La combinaison {{pattern}} est active ({{progress}}/{{length}}). L'ordre n'a pas d'importance. Une carte jouee avec de l'encre compte comme son type natif plus INK. La completer capture la derniere carte jouee et ajoute Shrouded Omen plus Binding Curse.",
      stalledLabel: "Metier cale",
      stalledDetail:
        "Tu as casse la combinaison ce tour. Si le motif demandait de l'encre, Anansi ajoute quand meme un Shrouded Omen. Le metier n'attrapera plus de carte avant le prochain tour.",
      webbedLabel: "Carte capturee",
      webbedDetail:
        "{{count}} carte(s) sont prises dans la toile. A la prochaine pioche, elles entrent en main gelees jusqu'a etre rejouees.",
      intentPattern:
        "Metier {{pattern}} ({{progress}}/{{length}}, ordre libre) : a la completion, capture la derniere carte + Shrouded Omen",
      intentPatternPhaseTwo:
        "Metier {{pattern}} ({{progress}}/{{length}}, ordre libre) : a la completion, capture la derniere carte + Omen + Binding Curse",
    },
    quetzalcoatl: {
      airborneLabel: "EN VOL",
      airborneDetail:
        "Les hits allies sont limites a {{cap}} degats tant que Quetzalcoatl est en l'air.",
      groundedLabel: "AU SOL",
      groundedDetail:
        "Quetzalcoatl est projete au sol, subit +{{bonus}}% degats, et prepare Solar Dive.",
      counterLabel: "Chute",
      counterDetail:
        "{{hits}}/{{threshold}} hits ont touche ce tour. Atteins le seuil pour le faire tomber.",
      counterPhaseTwoDetail:
        "{{hits}}/{{threshold}} hits ont touche ce tour. En phase 2, rater la chute ajoute {{bleed}} Saignement.",
    },
    fenrir: {
      huntLabel: "La chasse",
      huntDetail:
        "{{remaining}}/{{max}} marqueurs restants. Fenrir gagne +{{bonus}} degats ce tour.",
      huntBrokenDetail: "La chasse est brisee. Fenrir ne gagne plus de bonus.",
      phaseTwoHowlDetail:
        "Si la chasse tient, Pack Howl invoque un Draugr ou ajoute Saignement.",
    },
    helQueen: {
      lifeLabel: "VIE",
      deathLabel: "MORT",
      lifeDetail:
        "Applique {{bleed}} Saignement apres chaque action. Passe en {{next}} dans {{turns}} tour(s).",
      deathDetail:
        "Convertit le Saignement et peut retablir un Draugr. Passe en {{next}} dans {{turns}} tour(s).",
      deathPhaseTwoDetail:
        "Convertit le Saignement, peut retablir un Draugr et applique {{weak}} Faible. Passe en {{next}} dans {{turns}} tour(s).",
    },
    medusa: {
      gazeLabel: "Regard interdit",
      gazeDetail:
        "Ne complete pas {{pattern}} ce tour ({{progress}}/{{length}}). Sinon, la derniere carte devient Petrifiee et coute +{{petrify}}.",
    },
    hydra: {
      headsLabel: "Tetes d'Hydre",
      headsDetail:
        "{{alive}}/{{total}} tetes restent actives. Tue une tete puis touche le corps dans le meme tour pour la cauteriser.",
      regrowLabel: "Repousse",
      regrowDetail:
        "{{count}} tete(s) repousseront au debut du tour ennemi si le corps n'est pas touche ce tour.",
      cauterizedLabel: "Cauterisee",
      cauterizedDetail:
        "{{count}} tete(s) sont cauterisees et ne repousseront plus.",
    },
    babaYaga: {
      teethLabel: "CROC",
      bonesLabel: "OS",
      hearthLabel: "FOYER",
      curseLabel: "MALEDICTION",
      teethDetail:
        "Offre {{threshold}} attaques ce tour ({{progress}}/{{threshold}}) ou la cabane gagne de la Force. Se tourne vers {{next}} dans {{turns}} tour(s).",
      bonesDetail:
        "Offre {{threshold}} armure ce tour ({{progress}}/{{threshold}}) ou la cabane gagne du blocage. Se tourne vers {{next}} dans {{turns}} tour(s).",
      hearthDetail:
        "Offre {{threshold}} encre depensee ce tour ({{progress}}/{{threshold}}) ou la cabane gele ta main. Se tourne vers {{next}} dans {{turns}} tour(s).",
      curseDetail:
        "Offre 1 attaque, 6 armure et 1 encre depensee ce tour (ATQ {{attacks}}, BLK {{block}}, INK {{ink}}) ou la cabane gele 2 cartes et augmente les couts au prochain tour. Se tourne vers {{next}} dans {{turns}} tour(s).",
    },
    koschei: {
      immortalLabel: "Mort cachee",
      hiddenDeathLabel: "La mort cachee",
      stageDetail:
        "Kostchei ne peut pas mourir tant que {{vessel}} reste cache.",
      stagePhaseTwoDetail:
        "Kostchei ne peut pas mourir tant que {{vessel}} reste cache. En phase 2, le prochain receptacle brise est rescelle une fois.",
      resealDetail: "Kostchei rescelle {{vessel}} lors de sa prochaine action.",
      mortalLabel: "MORTEL",
      mortalDetail: "L'aiguille est brisee. Kostchei peut enfin etre acheve.",
    },
    chapterGuardian: {
      martialLabel: "Lien martial",
      martialDetail:
        "Brise: joue {{threshold}} attaques ce tour ({{progress}}/{{threshold}}). Tes coups sont limites a {{cap}} degats tant qu'il tient.",
      scriptLabel: "Lien du script",
      scriptDetail:
        "Punition: ton premier gain d'armure chaque tour donne +{{punish}} BLK au boss. Brise: gagne {{threshold}} armure ce tour ({{progress}}/{{threshold}}).",
      inkLabel: "Lien d'encre",
      inkDetail:
        "Punition: ta premiere depense d'encre chaque tour ajoute {{card}}. Brise: depense {{threshold}} encre ce tour ({{progress}}/{{threshold}}).",
      openLabel: "Chapitre ouvert",
      openDetail:
        "Tous les liens sont brises. Le Gardien subit x{{multiplier}} degats jusqu'a la fin de ton tour.",
      rebindLabel: "Reliure imminente",
      rebindDetail: "Sa prochaine action restaure tous les liens.",
    },
  },
  playerStats: {
    block: "Armure",
    strength: "Force",
    focus: "Concentration",
    blockTooltip:
      "Absorbe les degats entrants ce tour. Reinitialise au debut de votre tour.",
    strengthTooltip: "Augmente tous les degats infliges de {{value}}.",
    focusTooltip: "Augmente l'armure gagnee de {{value}}.",
    attackBonusBadge: "ATQ +{{value}}",
    attackBonusTooltip:
      "Vos cartes Attaque infligent {{value}} degat(s) supplementaire(s).",
    extraCardCost: "Cartes +{{value}} cout",
    drawPenalty: "Pioche -{{value}}",
    nextDrawDiscard: "Prochaine pioche en defausse",
    inkPowerLocked: "Pouvoir d'encre bloque",
  },
  cardPicker: {
    cancel: "Annuler",
    noCards: "Aucune carte disponible.",
  },
  preBoss: {
    label: "Antichambre",
    title: "L'Antichambre",
    flavorText:
      "Les torches vacillent sans raison. La salle suivante pese deja sur l'air — dense, patiente, immobile.",
    subtitle: "Une seule voie. Choisis-la avec soin.",
    hp: "PV : {{current}}/{{max}}",
    healTitle: "Vasque de restauration",
    healDesc:
      "L'eau qui coule sur ces pierres porte l'odeur de l'encre. Quelque chose d'ecrit dans ces murs peut encore vous refermer.",
    upgradeTitle: "Table du copiste",
    upgradeDesc:
      "Un etabli charge d'outils d'enlumineur. Parfaire une carte avant l'epreuve finale.",
    upgradeHint: "Survole une carte pour voir l'amelioration",
    upgradeAction: "Parfaire",
    huntTitle: "Le defi du gardien",
    huntDesc:
      "Un adversaire veille a l'entree. Le vaincre libere un fragment de relique perdue.",
  },
  special: {
    healTitle: "Source de soin",
    healDesc:
      "Entre deux rangees de grimoires, une vasque de pierre affleure le sol. L'eau qui s'en ecoule porte l'odeur de l'encre et du vieux parchemin. On dit que les mots des livres detruits s'y sont dissous — et qu'en boire, c'est laisser quelque chose d'ecrit vous recoudre de l'interieur.",
    currentHp: "Actuel : {{current}}/{{max}}",
    healAction: "Soigner",
    healChoiceHint:
      "Choisissez entre vous soigner gratuitement ou purifier une carte contre un lourd sacrifice de PV.",
    healPurgeAction: "Purifier une carte",
    upgradeTitle: "Enclume enchantee",
    upgradeHint: "Survole une carte pour voir l'amelioration",
    upgradeAction: "Ameliorer",
    eventLabel: "Evenement",
    relicLabel: "Relique revilee",
    eventStats: "PV : {{current}}/{{max}} - Or : {{gold}}",
    purgePickerTitle: "Choisissez une carte a retirer",
    purgePickerSubtitle:
      "Cette carte sera definitivement supprimee de votre deck.",
    eventContinue: "Continuer",
    eventPurgeAction: "Choisir une carte a retirer",
    eventRewardPickerTitle: "Choisissez 1 carte",
    eventRewardPickerSubtitle:
      "Le scriptorium vous propose des cartes alignees avec l'archetype choisi.",
  },
  startMerchant: {
    kicker: "Pre-run",
    title: "Marchand des origines",
    subtitle: "Echange tes ressources de bibliotheque contre des bonus de run.",
    noResources: "Aucune ressource disponible",
    cost: "Cout",
    bought: "Achete",
    trade: "Echanger",
    insufficient: "Ressources insuffisantes",
    bonusGoldName: "Bourse d'eclaireur",
    bonusGoldDescription: "+{{amount}} or pour ce run",
    bonusMaxHpName: "Benediction de cuir",
    bonusMaxHpDescription: "+{{amount}} PV max pour ce run",
    continue: "Continuer l'aventure",
    offerType: {
      CARD: "Carte",
      RELIC: "Relique",
      USABLE_ITEM: "Consommable",
      ALLY: "Allie",
      BONUS_GOLD: "Bonus or",
      BONUS_MAX_HP: "Bonus PV max",
      default: "Offre",
    },
  },
  // Alias de compatibilite pour une ancienne faute de frappe de cle i18n.
  startMarchant: {
    bonusGoldName: "Bourse d'eclaireur",
    bonusGoldDescription: "+{{amount}} or pour ce run",
    bonusMaxHpName: "Benediction de cuir",
    bonusMaxHpDescription: "+{{amount}} PV max pour ce run",
  },
  shop: {
    title: "Marchand",
    gold: "Or",
    itemName: {
      heal: "Soin",
      maxHp: "PV max",
      purge: "Purge",
      bloodPurge: "Purge de sang",
      ally: "Allié",
    },
    itemDescription: {
      heal: "Restaure {{amount}} PV",
      maxHp: "+{{amount}} PV max",
      purge: "Retire 1 carte de votre deck definitivement.",
      bloodPurge: "Retire 1 carte de votre deck en sacrifiant {{amount}} PV.",
    },
    energyCost: "{{cost}} energie",
    sold: "VENDU",
    soldOut: "RUPTURE",
    inventoryFull: "Inventaire plein",
    priceGold: "{{price}} or",
    priceHp: "{{price}} PV",
    requiresMoreHp: "Pas assez de PV pour ce sacrifice",
    purgesLeft: "Purges restantes : {{count}}",
    reroll: "Relancer la boutique ({{price}} or)",
    autoRestock:
      "Besace du negociant : reapprovisionnement auto, {{count}} charge restante.",
    leave: "Quitter la boutique",
    purgePickerTitle: "Purge - choisissez une carte a retirer",
    purgePickerSubtitle:
      "Cette carte sera definitivement supprimee de votre deck.",
  },
  rules: {
    quickGuide: "Guide rapide",
    back: "Retour",
    close: "Fermer",
    gameTitle: "Panlibrarium",
    pageTitle: "Regles du jeu",
    sections: {
      overview: {
        title: "Apercu",
        emoji: "📚",
        text: "Panlibrarium est un roguelike deck-builder: vous progressez salle apres salle, vous renforcez votre deck, puis vous affrontez un boss de biome. Chaque decision compte: cartes choisies, reliques, gestion de vos ressources et ordre des combats. Le but est de survivre aux 5 etages et vaincre les boss.",
      },
      runStructure: {
        title: "Structure d'une partie",
        emoji: "🧭",
        bullets: [
          "Une run se compose de 5 etages.",
          "Chaque etage contient 10 salles, avec progression de gauche a droite.",
          "La difficulte monte progressivement jusqu'au combat de boss.",
          "Apres un boss, vous passez au biome suivant avec de nouveaux ennemis et themes.",
        ],
      },
      combat: {
        title: "Le combat",
        emoji: "⚔️",
        intro:
          "Le combat repose sur l'energie, la main, la pioche et la defausse. Vous jouez vos cartes pendant votre tour, puis les ennemis agissent.",
        turnTitle: "Deroule d'un tour",
        steps: [
          "Debut de tour: energie restauree (3), effets des reliques appliques.",
          "Tour joueur: jouer des cartes depuis la main (cout en energie).",
          "Fin de tour: la main est defaussee, puis phase ennemie.",
          "Phase ennemie: attaques par ordre de vitesse.",
        ],
      },
      cardTypes: {
        title: "Types de cartes",
        emoji: "🃏",
        attack: "Attaque",
        attackDesc: "inflige des degats.",
        skill: "Competence",
        skillDesc: "defense, pioche, gain de ressources, utilitaires.",
        power: "Pouvoir",
        powerDesc: "effets persistants, souvent tres puissants.",
        upgradesPrefix: "Les cartes peuvent etre",
        upgradesKey: "ameliorees",
        upgradesSuffix: "pour augmenter leurs effets ou reduire leur cout.",
      },
      ink: {
        title: "L'encre",
        emoji: "🖋️",
        bullets: [
          "L'encre est la ressource secondaire du combat (max 5 par defaut).",
          "Ce maximum peut etre augmente via certaines reliques.",
          "Marquer une carte avec de l'encre (cout variable) amplifie son effet.",
          "Vous pouvez utiliser 1 pouvoir d'encre par tour.",
        ],
        tableHeaders: {
          power: "Pouvoir",
          cost: "Cout",
          effect: "Effet",
        },
        rows: [
          {
            power: "Reecriture",
            cost: "3 encre",
            effect: "Reprendre une carte de la defausse en main.",
          },
          {
            power: "Chapitre Perdu",
            cost: "2 encre",
            effect: "Piocher 2 cartes supplementaires.",
          },
          {
            power: "Sceau",
            cost: "2 encre",
            effect: "Gagner 8 armure immediatement.",
          },
        ],
      },
      rooms: {
        title: "Les salles",
        emoji: "🚪",
        tableHeaders: {
          room: "Salle",
          content: "Contenu",
          reward: "Recompense",
        },
        rows: [
          {
            room: "Combats",
            content: "1 a 4 ennemis",
            reward: "Or + 3 cartes a choisir",
          },
          {
            room: "Elite",
            content: "1 ennemi elite (des salle 3)",
            reward: "Or bonus + relique",
          },
          {
            room: "Marchand",
            content: "Boutique: cartes, reliques, soins, purge",
            reward: "-",
          },
          {
            room: "Speciale",
            content: "Soin 30% PV, amelioration carte, ou evenement",
            reward: "-",
          },
          {
            room: "Pre-boss",
            content: "Combat elite",
            reward: "Acces boss",
          },
          {
            room: "Boss",
            content: "Boss du biome",
            reward: "3 reliques a choisir",
          },
        ],
      },
      buffs: {
        title: "Buffs et Debuffs",
        emoji: "📊",
        tableHeaders: {
          effect: "Effet",
          impact: "Impact",
        },
        rows: [
          {
            effect: "Force",
            impact: "Augmente les degats infliges.",
          },
          {
            effect: "Concentration",
            impact: "Renforce certains effets utilitaires et de cartes.",
          },
          {
            effect: "Vulnerable",
            impact: "Vous subissez plus de degats.",
          },
          {
            effect: "Faible",
            impact: "Vos attaques infligent moins de degats.",
          },
          {
            effect: "Poison",
            impact: "Degats progressifs a chaque tour.",
          },
        ],
      },
      tips: {
        title: "Conseils de depart",
        emoji: "💡",
        bullets: [
          "Gardez un deck compact au debut: moins de cartes, plus de coherence.",
          "Priorisez les cartes de defense avant le premier boss.",
          "Depensez l'encre quand l'impact est decisif, pas automatiquement.",
          "Le marchand est ideal pour purger les cartes faibles et stabiliser votre plan.",
        ],
      },
    },
  },
  events: {
    scriptorium_catalog: {
      title: "Le Catalogue du Scriptorium",
      flavorText:
        "Un pupitre rotatif presente trois index relies par des fils d'encre. Chacun ouvre un rayon different du Scriptorium, comme si les cartes y attendaient deja votre decision.",
      description:
        "Choisissez une discipline. Le Scriptorium vous proposera ensuite trois cartes coherentes avec cet axe.",
      choices: [
        {
          label: "Ouvrir les traites defensifs",
          description: "Recevez 3 cartes orientees Block.",
          outcomeText:
            "Les rayons coulissent avec un bruit de chaines bien huilees. Des pages de garde, des sceaux et des bastions de papier se presentent a vous.",
        },
        {
          label: "Consulter les manuscrits de restauration",
          description: "Recevez 3 cartes orientees Heal.",
          outcomeText:
            "Une odeur de baume, d'herbes seches et d'encre claire remonte des etageres. Les ouvrages qui guerissent ont ete sortis pour vous.",
        },
        {
          label: "Suivre les marges d'encre vive",
          description: "Recevez 3 cartes orientees Ink.",
          outcomeText:
            "Les filaments noirs se mettent a briller. Les pages choisies pulsent deja d'une energie liquide, pretes a nourrir votre encre.",
        },
      ],
    },
    scarlet_index: {
      title: "L'Index Ecarlate",
      flavorText:
        "Une table de consultation est couverte de fiches rouges. Certaines sont tachees de sang, d'autres noircies jusqu'au bord. Toutes semblent pointer vers des manieres plus brutales de raconter une histoire.",
      description:
        "Choisissez une ligne de lecture agressive. L'index ecarlate vous ouvrira ensuite trois cartes adaptees.",
      choices: [
        {
          label: "Suivre les annotations sanglantes",
          description: "Recevez 3 cartes orientees Bleed.",
          outcomeText:
            "Les fiches se superposent en une piste nette. La douleur devient une methode, et l'index vous remet des pages qui savent la prolonger.",
        },
        {
          label: "Explorer les pages consumees",
          description: "Recevez 3 cartes orientees Exhaust.",
          outcomeText:
            "Les coins brules s'effritent sous vos doigts. Ce qui disparait vite laisse parfois la trace la plus utile, et le Scriptorium semble d'accord.",
        },
        {
          label: "Chercher les reserves d'encre ferreuse",
          description: "Recevez 3 cartes orientees Ink.",
          outcomeText:
            "L'encre y est plus lourde, presque metallique. Les cartes extraites de ce rayon promettent une puissance breve, mais dense.",
        },
      ],
    },
    war_ledger: {
      title: "Le Registre de Guerre",
      flavorText:
        "Sous une cloche de verre repose un registre massif, rempli de campagnes annotees, de retraits ordonnes et de blessures converties en doctrine. En l'ouvrant, vous sentez trois strategies possibles tirer sur la reliure.",
      description:
        "Choisissez un plan de bataille. Le registre vous proposera ensuite trois cartes dans cette direction.",
      choices: [
        {
          label: "Etudier les lignes de boucliers",
          description: "Recevez 3 cartes orientees Block.",
          outcomeText:
            "Le registre s'ouvre sur des formations patientes et denses. Les cartes qui emergent parlent de tenue, de garde et de murs qui refusent de ceder.",
        },
        {
          label: "Relire les campagnes d'attrition",
          description: "Recevez 3 cartes orientees Bleed.",
          outcomeText:
            "Des cartes de blessures lentes, de pressions repetees et de coupures methodiques glissent hors des pages. Rien ici n'est rapide; tout y est fatal.",
        },
        {
          label: "Examiner les doctrines de sacrifice",
          description: "Recevez 3 cartes orientees Exhaust.",
          outcomeText:
            "Certaines manoeuvres ne servent qu'une fois. Le registre les classe pourtant parmi les plus importantes, et vous en confie trois exemples.",
        },
      ],
    },
    mysterious_tome: {
      title: "Le Tome Scelle",
      flavorText:
        "Derriere une vitrine brisee, un tome aux pages noires vous observe. L'encre a l'interieur bouge d'elle-meme, cherchant un lecteur depuis des decennies.",
      description: "Osez-vous l'ouvrir ?",
      choices: [
        {
          label: "Decacheter le tome",
          description: "Perdez 10 PV, gagnez 50 or.",
          outcomeText:
            "Vos doigts saignent sur les pages. Le tome boit, satisfait. Vingt pieces tombent d'entre les feuilles — le prix d'un autre lecteur, autrefois.",
        },
        {
          label: "Refermer la vitrine",
          description: "Rien ne se passe.",
          outcomeText:
            "Le tome se ferme dans un claquement sec. A travers le verre, vous voyez les pages se retourner, cherchant une autre victime.",
        },
      ],
    },
    ink_fountain: {
      title: "La Fontaine d'Encre",
      flavorText:
        "Au centre de la salle, une vasque de marbre noir deborde d'une encre lumineuse. Elle murmure dans une langue que vous n'avez jamais apprise — et pourtant, vous comprenez chaque mot.",
      description: "Que faites-vous de cette encre ?",
      choices: [
        {
          label: "Boire a la vasque",
          description: "Gagnez 5 PV et 25 or.",
          outcomeText:
            "L'encre est froide, etrangement douce. Elle rouvre vos blessures d'un cote et les referme de l'autre. Des mots anciens brillent un instant dans vos veines.",
        },
        {
          label: "Puiser dans votre bourse",
          description: "Gagnez 75 or.",
          outcomeText:
            "L'encre solidifie au contact de l'air en pieces d'or parfaitement rondes. Un marche equitable pour la Bibliotheque — elle reprend toujours ce qu'elle donne.",
        },
      ],
    },
    wandering_scribe: {
      title: "Le Scribe Errant",
      flavorText:
        "Un vieillard voute erre entre les rayons, sa plume grattant le vide. Il ne semble pas vous voir — jusqu'a ce qu'il se retourne brusquement : « Je peux te reecrire. Pour un prix. »",
      description: "Ses services ont un cout. Ses soins, aussi.",
      choices: [
        {
          label: "Payer ses services (30 or)",
          description: "Perdez 30 or, gagnez 20 PV max.",
          outcomeText:
            "Il trace des runes dans votre paume. Elles brulent, puis disparaissent. Vous vous sentez plus solide — plus difficile a effacer.",
        },
        {
          label: "Accepter ses soins",
          description: "Gagnez 10 PV.",
          outcomeText:
            "Il vous tamponne les blessures avec une encre etrange et repart sans un mot, sa plume reprenant son mouvement perpetuel.",
        },
      ],
    },
    ancient_sarcophagus: {
      title: "Le Sarcophage des Mots",
      flavorText:
        "Le sarcophage est debout, ses inscriptions luisant d'une lumiere d'outre-monde. Le couvercle tremble legerement, comme si quelque chose a l'interieur cherchait a sortir — ou a vous faire entrer.",
      description:
        "L'essence a l'interieur peut vous fortifier... a quel prix ?",
      choices: [
        {
          label: "Absorber l'essence",
          description: "Gagnez 20 PV max.",
          outcomeText:
            "L'energie ancienne vous enveloppe. Quelque chose de vieux s'installe en vous — bienveillant, pour l'instant.",
        },
        {
          label: "Prendre le risque",
          description: "Gagnez 30 PV max, perdez 15 PV.",
          outcomeText:
            "L'essence vous traverse comme un courant. Elle prend plus qu'elle ne donne dans l'immediat — mais les cicatrices virent au violet, signe d'une transformation profonde.",
        },
        {
          label: "Laisser scelle",
          description: "Rien ne se passe.",
          outcomeText:
            "Vous vous eloignez. Derriere vous, le couvercle cesse de trembler. Ce n'etait peut-etre pas si urgent, finalement.",
        },
      ],
    },
    whispering_idol: {
      title: "L'Idole Chuchotante",
      flavorText:
        "L'idole est a peine plus grande que votre main, taillee dans un marbre couleur de cendre. Quand elle parle, toute la salle s'arrete de respirer. « Tu veux de l'or, dit-elle. Tout le monde veut de l'or. Mais moi, je veux quelque chose de toi. »",
      description: "Un pacte de richesse maudite vous est propose.",
      choices: [
        {
          label: "Accepter le pacte",
          description: "Gagnez 90 or. Ajoutez Parchemin Maudit a votre deck.",
          outcomeText:
            "L'or tombe de nulle part. Le pacte est scelle d'une encre noire qui tatoue votre poignet une fraction de seconde avant de disparaitre.",
        },
        {
          label: "Forcer le destin",
          description: "Gagnez 140 or. Ajoutez 2 Regrets Hantes a votre deck.",
          outcomeText:
            "L'idole rit — ou du moins, quelque chose qui y ressemble. Elle vous donne plus que demande. Elle prend aussi plus que prevu.",
        },
        {
          label: "Refuser",
          description: "Vous repartez sans rien.",
          outcomeText:
            "L'idole se tait. Vous sentez son regard dans votre dos jusqu'a ce que vous quittiez la salle — et encore apres.",
        },
      ],
    },
    ruthless_scrivener: {
      title: "Le Copiste Implacable",
      flavorText:
        "Assis a son pupitre, il revise un manuscrit avec une precision chirurgicale, bifant des passages entiers sans hesiter. En vous voyant entrer, il leve des yeux pales comme du papier : « Votre deck est trop verbeux. Je peux le corriger. »",
      description:
        "La purge coute du sang. Mais un deck allege vaut parfois le prix.",
      choices: [
        {
          label: "Payer en sang",
          description:
            "Perdez 10 PV. Retirez definitivement 1 carte de votre deck.",
          outcomeText:
            "Il opere avec sa plume comme avec un scalpel. Une douleur vive, puis le soulagement etrange de savoir qu'une voix inutile a ete reduite au silence.",
        },
        {
          label: "Refuser et repartir",
          description: "Rien ne se passe.",
          outcomeText:
            "Il hausse les epaules et reprend son manuscrit. « Revenez quand vous serez pret a etre edite. » Il ne vous regarde pas partir.",
        },
      ],
    },
    loyal_scribe: {
      title: "Apprenti Scribe Egare",
      flavorText:
        "Un jeune apprenti s'est perdu dans les meandres de la Bibliotheque depuis la Censure. Ses mains sont tachees d'encre jusqu'aux coudes, et il porte sous le bras une pile de grimoires qu'il essaie de sauver.",
      description:
        "Il cherche un protecteur. Ses connaissances des textes anciens pourraient vous etre precieuses.",
      choices: [
        {
          label: "L'accueillir",
          description: "L'Apprenti Scribe rejoint votre groupe.",
          outcomeText:
            "Il vous suit avec un melange de soulagement et de peur. Son savoir sera utile — a condition qu'il survive assez longtemps pour en faire la demonstration.",
        },
        {
          label: "Refuser",
          description: "Vous continuez seul.",
          outcomeText:
            "Il vous regarde vous eloigner sans un mot. Vous esperez qu'il trouvera un autre voyageur avant que les ombres de la Bibliotheque ne le rattrapent.",
        },
      ],
    },
    wandering_knight: {
      title: "Chevalier des Mots",
      flavorText:
        "Il se tient debout dans la penombre, son armure couverte de runes gravees a la main. Sa bibliotheque a brule — ou pire, a ete censuree. Il cherche un nouveau serment a preter, une cause qui merite d'etre defendue.",
      description:
        "Sa ward-magie peut vous proteger. Son serment vous lierait l'un a l'autre.",
      choices: [
        {
          label: "Accepter son serment",
          description: "Le Chevalier des Mots rejoint votre groupe.",
          outcomeText:
            "Il pose un genou a terre, sa main sur l'un de vos grimoires comme serment. Quelque chose de chaud traverse vos veines — sa loyaute, imprimee dans l'encre de son armure.",
        },
        {
          label: "Decliner",
          description: "Vous continuez votre chemin.",
          outcomeText:
            "Il hoche la tete, sans amertume. « Je trouverai une autre cause digne de moi. » Vous esperez que c'est vrai.",
        },
      ],
    },
    ink_familiar_encounter: {
      title: "Familier d'Encre",
      flavorText:
        "Quelque chose vous observe depuis l'ombre entre deux etageres — une silhouette a peine plus grande qu'un chat, faite entierement d'encre vivante qui pulse doucement. Ses yeux, deux points d'encre brillante, ne vous quittent pas.",
      description:
        "Il cherche un maitre. L'encre qui le compose reagit a votre presence.",
      choices: [
        {
          label: "L'apprivoiser",
          description: "Le Familier d'Encre rejoint votre groupe.",
          outcomeText:
            "Il s'approche lentement, renifle votre main, puis s'enroule autour de votre avant-bras comme un tatouage vivant. Il est a vous — et d'une certaine facon, vous etes a lui.",
        },
        {
          label: "L'ignorer",
          description: "Vous continuez votre chemin.",
          outcomeText:
            "Il vous suit du regard jusqu'a ce que vous disparaissiez au detour d'une etagere. L'encre fremit. Puis le silence.",
        },
      ],
    },
    mirror_of_bronze: {
      title: "Le Miroir de Bronze",
      flavorText:
        "Le miroir de bronze poli trône entre deux colonnes de marbre. Il ne reflete pas votre visage — mais celui de quelqu'un que vous auriez pu etre. La silhouette sourit. Elle tend la main depuis l'autre cote du metal froid.",
      description:
        "Que repondez-vous a ce qui vous regarde depuis l'autre cote ?",
      choices: [
        {
          label: "Tendre la main en retour",
          description: "Gagnez 20 PV max. Perdez 15 PV.",
          outcomeText:
            "Vos doigts traversent le metal froid. La silhouette prend quelque chose de vous — de la vitalite brute — et en echange, grave de nouvelles lignes sur votre corps. Vous sortez avec plus de capacite et moins de certitudes.",
        },
        {
          label: "Briser le miroir",
          description: "Gagnez 90 or. Ajoutez Regret Hante a votre deck.",
          outcomeText:
            "Le bronze vole en eclats. Les morceaux saignent quelques instants avant de se solidifier en pieces d'or. La silhouette disparait avec un rire qui ressemble etrangement a de la reconnaissance. Les regrets restent.",
        },
        {
          label: "Regarder sans agir",
          description: "Rien ne se passe.",
          outcomeText:
            "Vous observez jusqu'a ce que la silhouette se lasse de vous et se detourne. Certaines verites ne valent pas le prix de leur acquisition.",
        },
      ],
    },
    turning_house: {
      title: "La Maison qui Tourne",
      flavorText:
        "La salle pivote lentement sur elle-meme — les etageres changent de place quand vous ne les regardez pas. Dans le fauteuil au centre, une vieille femme tricote avec des aiguilles en os. Elle ne leve pas les yeux. « Assieds-toi, dit-elle. Les maisons qui tournent n'attendent pas. »",
      description: "Que demandez-vous a la gardienne de cette maison ?",
      choices: [
        {
          label: "S'asseoir et ecouter",
          description: "Gagnez 35 PV max.",
          outcomeText:
            "Elle parle pendant ce qui semble des heures — en symboles, en images, dans des langues oubliees. Vous ne comprenez pas tout. Mais quand vous vous levez, votre corps est plus capable de tenir debout.",
        },
        {
          label: "Chercher la sortie de force",
          description: "Gagnez 75 or. Perdez 15 PV.",
          outcomeText:
            "La maison resiste. Les etageres bougent. Vous trebuchez, vous cognez des angles qui ne devraient pas exister. Mais vous trouvez la sortie — avec votre or et vos bleus.",
        },
        {
          label: "Prendre un objet sur l'etagere",
          description: "Gagnez 15 PV et 15 or.",
          outcomeText:
            "La vieille femme ne reagit pas — ou fait semblant. L'objet que vous prenez semble vous choisir autant que l'inverse. Equitable, pour une maison qui tourne.",
        },
      ],
    },
    skald_fire: {
      title: "Le Feu des Skalds",
      flavorText:
        "Le brasier au centre de la salle brule depuis des siecles, sans bois ni carburant. Les flammes sont d'un bleu glacial. Quand vous approchez la main, ce n'est pas la chaleur qui mord — c'est un froid qui descend jusqu'a la moelle.",
      description: "Le feu des skalds exige un sacrifice ou un chant.",
      choices: [
        {
          label: "Plonger les mains dans le feu",
          description: "Gagnez 40 PV max. Perdez 20 PV.",
          outcomeText:
            "Le froid vous arrache un cri. Mais vos mains ressortent marquees de runes lumineuses qui s'effacent en quelques secondes. Ce que le feu a pris, il l'a rendu centuple sous une autre forme.",
        },
        {
          label: "Reciter une strophe",
          description: "Gagnez 50 or.",
          outcomeText:
            "Les flammes bleues vacillent. Elles reconnaissent les mots — ou les aiment. De l'or tombe de l'air comme une recompense pour un poeme recite dans la langue correcte au bon moment.",
        },
        {
          label: "Repartir sans un mot",
          description: "Rien ne se passe.",
          outcomeText:
            "Le feu reste indifferent. Certains brasiers attendent d'etre honores. Vous tournez le dos et repartez, intact.",
        },
      ],
    },
    blank_page: {
      title: "La Page Blanche",
      flavorText:
        "Au milieu d'un couloir vide, une page blanche est epinglee a hauteur d'yeux. Pas un mot. Pas une illustration. Et pourtant, vous avez le sentiment qu'elle vous attendait depuis le debut de votre voyage — depuis peut-etre avant.",
      description: "La page est vierge. Que faites-vous de ce vide ?",
      choices: [
        {
          label: "Ecrire ta force",
          description: "Gagnez 20 PV max.",
          outcomeText:
            "Vous saisissez une plume qui n'etait pas la un instant plus tot. Les mots sortent d'eux-memes. La page les absorbe. Quand vous relevez les yeux, vous vous sentez plus solide — comme si vous veniez de vous reecrire un peu mieux.",
        },
        {
          label: "Effacer ta faiblesse",
          description: "Perdez 10 PV. Retirez 1 carte de votre deck.",
          outcomeText:
            "La page se dechire avec un son presque humain. Les morceaux se consument dans l'air. Quelque chose dans votre deck s'allege — une voix qui parlait trop fort, reduite au silence.",
        },
        {
          label: "Tourner les talons",
          description: "Rien ne se passe.",
          outcomeText:
            "Vous repartez. Derriere vous, vous entendez quelque chose s'ecrire sur la page. Vous ne vous retournez pas.",
        },
      ],
    },
    sealed_reliquary: {
      title: "Le Reliquaire Scelle",
      flavorText:
        "Un reliquaire couvert de poussiere est pose sur un socle au centre de la piece. Il pulse d'une encre lumineuse, comme s'il attendait d'etre reclame depuis longtemps.",
      description:
        "Une relique vous est destinee parmi celles que renferme ce reliquaire.",
      choices: [
        {
          label: "Reclamer la relique",
          description: "Obtenez 1 relique.",
          outcomeText:
            "Vos doigts se referment sur l'objet. Le reliquaire se vide, apaise. Ce qu'il gardait etait pour vous — ou du moins, c'est ce qu'il veut vous faire croire.",
        },
        {
          label: "Laisser la relique",
          description: "Ne prenez rien. Continuez.",
          outcomeText:
            "Vous tournez le dos au reliquaire. Il vous regarde partir en silence. Peut-etre vous rappellera-t-il, plus loin.",
        },
      ],
    },
    // ── GREEK ──────────────────────────────────────────────────────────────
    oracle_of_delphi: {
      title: "La Pythie de Delphes",
      flavorText:
        "La Pythie est assise sur son trepied d'or au-dessus d'une crevasse dont s'echappent des vapeurs d'encre. Ses yeux sont revolses, ses levres forment des mots dans une langue de fumee. Elle ne vous regarde pas — elle regarde a travers le temps.",
      description: "Elle voit ce qui vous attend. Voulez-vous savoir ?",
      choices: [
        {
          label: "Ecouter la prophetie",
          description: "Gagnez 30 PV max.",
          outcomeText:
            "Ses mots s'impriment en vous comme une encre indelebile. Vous ne comprenez pas tout — mais quelque chose en vous s'est prepare pour ce qui vient. Votre enveloppe s'en souvient, meme si votre esprit l'oublie.",
        },
        {
          label: "Offrir un tribut (30 or)",
          description: "Perdez 30 or, gagnez 45 PV max.",
          outcomeText:
            "Elle accepte l'offrande sans la regarder. En echange, elle pose un doigt froid sur votre sternum — et une vie supplementaire s'inscrit en vous, comme une revision dans les marges d'un manuscrit deja termine.",
        },
      ],
    },
    thread_of_ariadne: {
      title: "Le Fil d'Ariane",
      flavorText:
        "Un fil d'argent est tendu dans l'obscurite du couloir, courant entre les etageres comme une veine dans un corps de pierre. A l'une de ses extremites, une femme dont les traits changent chaque fois que vous la regardez tient la bobine. « Ce fil te menera a ce dont tu as besoin. Combien veux-tu en prendre ? »",
      description:
        "Le fil peut vous guider. Mais plus vous en prenez, plus vous vous liez.",
      choices: [
        {
          label: "Prendre un peu de fil",
          description: "Gagnez 20 PV max.",
          outcomeText:
            "Le fil vous guide le long d'un chemin que vous n'auriez pas trouve seul. Il vous mene a une chambre pleine de lumiere, puis disparait. Vous avez trouve ce qu'il fallait trouver.",
        },
        {
          label: "Derouler la bobine entiere",
          description: "Gagnez 40 PV max. Perdez 15 PV.",
          outcomeText:
            "Le fil se tend — trop. Il vous traverse, reecrit quelques chapitres, en arrache d'autres. Ce que vous gagnez en endurance, vous le payez en chair. Le labyrinthe prend toujours son peage.",
        },
        {
          label: "Laisser le fil",
          description: "Rien ne se passe.",
          outcomeText:
            "La femme range sa bobine sans un mot. Les labyrinthes ont des sorties meme sans guide. Il faudra seulement chercher plus longtemps.",
        },
      ],
    },
    // ── RUSSIAN ────────────────────────────────────────────────────────────
    firebird_feather: {
      title: "La Plume de Zhar-Ptitsa",
      flavorText:
        "Une plume de feu dore est posee sur une etagere, brulant sans consumer le bois, eclairant d'une lumiere orange tous les grimoires alentour. Elle ne semble pas avoir de proprietaire — ou plutot, elle attend d'en avoir un.",
      description:
        "La plume de l'Oiseau de Feu apporte la chance a qui sait la saisir.",
      choices: [
        {
          label: "Prendre la plume",
          description: "Gagnez 25 PV et 25 or.",
          outcomeText:
            "La plume brule froid dans votre main — une contradiction qui devient une verite. Sa chaleur vous traverse, cicatrisant ce qui etait blesse, transformant ce qui n'avait pas de forme. De l'or tombe de vos poches comme effet secondaire, comme si la fortune suivait la lumiere.",
        },
        {
          label: "La contempler avant de la prendre",
          description: "Gagnez 35 PV max.",
          outcomeText:
            "Vous observez sa lumiere jusqu'a ce qu'elle s'imprime derriere vos paupieres. Quand vous la prenez enfin, quelque chose de plus profond a deja change en vous — non pas la chair, mais le texte qui vous definit.",
        },
        {
          label: "La laisser pour un autre",
          description: "Rien ne se passe.",
          outcomeText:
            "La plume continue de bruler, indifferente. Peut-etre que la prochaine personne a passer ici etait celle qui en avait vraiment besoin. Peut-etre que c'etait vous.",
        },
      ],
    },
    kostchei_needle: {
      title: "L'Aiguille de Kostchei",
      flavorText:
        "Une boite en os est ouverte sur un socle. A l'interieur : un oeuf. Dans l'oeuf : un canard. Dans le canard : un lievre. Dans le lievre : une aiguille dont la pointe brille d'un noir absolu. Une voix sans source : « Mon ame est immortelle. Je peux en preter un fragment. »",
      description:
        "Kostchei l'Immortel propose un fragment d'eternite. Ses marches ont toujours un prix cache.",
      choices: [
        {
          label: "Accepter le fragment d'immortalite",
          description: "Gagnez 50 PV max. Perdez 25 PV.",
          outcomeText:
            "L'aiguille vous pique. La douleur est breve, intense — puis vient quelque chose d'autre, plus ancien que la douleur. Votre corps apprend une nouvelle definition de lui-meme. Plus de capacite. Moins d'integrite immediate. C'est exactement ce que Kostchei avait promis.",
        },
        {
          label: "Marchander les termes",
          description: "Gagnez 25 PV max et 25 or.",
          outcomeText:
            "Il rit — le son d'une bibliotheque qui brule a l'envers. Mais il accepte. Un fragment plus petit, un prix plus petit. Quelque chose de precieux tombe de la boite en os comme par inadvertance.",
        },
        {
          label: "Refuser l'immortalite partielle",
          description: "Rien ne se passe.",
          outcomeText:
            "L'aiguille se remballe d'elle-meme dans le lievre dans le canard dans l'oeuf dans la boite. « Tu reviendras, dit la voix. Tout le monde revient. »",
        },
      ],
    },
    // ── VIKING ─────────────────────────────────────────────────────────────
    huginn_bargain: {
      title: "Le Regard de Huginn",
      flavorText:
        "Un corbeau d'une intelligence inquietante est pose sur une etagere a hauteur des yeux. Ses iris sont entierement blancs — les yeux d'Odin, depouilles de leur pupille pour voir plus loin. Il incline la tete. « Le Allfather te regarde. Il a des questions sur toi. Laisse-le voir. »",
      description:
        "Odin veut voir a travers vous. Cette vision se paye toujours.",
      choices: [
        {
          label: "Offrir un oeil",
          description: "Gagnez 45 PV max. Perdez 20 PV.",
          outcomeText:
            "Le corbeau s'approche. Ce qui suit n'est pas de la douleur — c'est une reecriture. Odin vous voit de l'interieur, et ce qu'il voit le satisfait assez pour laisser quelque chose en echange. Vous repartez avec moins d'integrite et beaucoup plus de profondeur.",
        },
        {
          label: "Offrir de l'or a la place",
          description: "Perdez 30 or, gagnez 30 PV max.",
          outcomeText:
            "Le corbeau cligne de ses yeux blancs. Odin accepte l'or — les dieux ont toujours besoin d'or, meme ceux qui pretendent le contraire. Un echange satisfaisant pour les deux parties.",
        },
        {
          label: "Refuser de se laisser voir",
          description: "Rien ne se passe.",
          outcomeText:
            "Le corbeau hause ses ailes dans ce qui ressemble a un haussement d'epaules. « Il t'a deja vu de toute facon, dit-il. Il voulait juste etre poli. »",
        },
      ],
    },
    valkyrie_verdict: {
      title: "Le Verdict de la Valkyrie",
      flavorText:
        "Une guerriere en armure tachee d'encre vous observe depuis le haut d'une etagere. Elle ecrit quelque chose dans un grand livre. Elle leve les yeux. « Je t'evalue, dit-elle simplement. Montre-moi ce que tu vaux. »",
      description:
        "Elle choisit qui merite de continuer. Montrez-lui votre valeur.",
      choices: [
        {
          label: "Defendre votre valeur en mots",
          description: "Gagnez 25 PV max.",
          outcomeText:
            "Vous parlez. Elle ecoute avec une attention absolue. Quand vous avez fini, elle note quelque chose et referme son livre. « Suffisant, dit-elle. Pour l'instant. » C'est un compliment, dans sa bouche.",
        },
        {
          label: "Lui montrer vos blessures",
          description: "Gagnez 25 PV.",
          outcomeText:
            "Elle inspecte chaque cicatrice avec la rigueur d'un architecte qui lit un plan. « Tu as survecu a tout ca. Alors tu peux survivre a ce qui vient. » Elle pose une main brievement sur votre poitrine. La douleur diminue.",
        },
        {
          label: "Refuser l'evaluation",
          description: "Rien ne se passe.",
          outcomeText:
            "Elle marque un X dans son livre et dit quelque chose de definitif. Peut-etre que vous serez reevalue plus tard. Peut-etre pas.",
        },
      ],
    },
    // ── EGYPTIAN ───────────────────────────────────────────────────────────
    anubis_scales: {
      title: "La Balance d'Anubis",
      flavorText:
        "Anubis lui-meme est debout dans la salle, sa tete de chacal tournee vers vous avec une curiosite sans emotion. Sur une balance de lapis-lazuli, une plume blanche attend. Il designe votre poitrine. « Ton coeur, dit-il. Ou ce qui en tient lieu dans la Bibliotheque. »",
      description: "Anubis juge tous les coeurs. Le votre est-il assez leger ?",
      choices: [
        {
          label: "Presenter votre deck a la balance",
          description: "Gagnez 25 PV max.",
          outcomeText:
            "La balance oscille, hesite, puis penche du cote de la plume. « Pas parfait, dit Anubis. Mais suffisant pour continuer. » Il ajoute quelque chose dans vos reserves vitales avant de vous congedier d'un geste.",
        },
        {
          label: "Offrir une carte a la balance",
          description: "Perdez 10 PV. Retirez 1 carte. Gagnez 45 PV max.",
          outcomeText:
            "La balance se stabilise dans l'equilibre parfait. Anubis incline la tete avec une satisfaction rare. Ce que vous avez donne etait ce qui alourdissait votre coeur.",
        },
        {
          label: "Fuir le jugement",
          description: "Ajoutez 2 Regrets Hantes a votre deck.",
          outcomeText:
            "Vous courez. Derriere vous, Anubis note votre nom avec soin. Les dieux des morts n'oublient jamais les noms. Les Regrets vous rattrapent avant que vous ayez atteint la porte.",
        },
      ],
    },
    thoth_archives: {
      title: "Les Archives de Thoth",
      flavorText:
        "Thoth, le scribe des dieux, est assis a un pupitre monumental, son bec d'ibis effleurant un rouleau qui se deroule a l'infini. Il leve une main sans lever les yeux. « Je suis occupe a tout noter. Mais tu peux regarder. Ou meme prendre. A ton risque. »",
      description:
        "Les archives de Thoth contiennent tout — y compris des choses que vous n'etiez pas cense voir.",
      choices: [
        {
          label: "Copier un parchemin legitimement",
          description: "Gagnez 25 PV max et 20 or.",
          outcomeText:
            "Thoth acquiesce sans lever les yeux. Vous copiez ce qui est permis. Sa connaissance s'imprime en vous comme de l'encre bien seche — permanente, legitime, a vous.",
        },
        {
          label: "Voler le rouleau principal",
          description: "Gagnez 60 or. Ajoutez 1 Regret Hante.",
          outcomeText:
            "Vos doigts se referment sur le rouleau. Thoth ecrit quelque chose dans son grand livre sans lever les yeux. Il note toujours tout. Le rouleau se transforme en or dans vos mains, mais quelque chose de sa nature reste en vous sous forme de regret.",
        },
        {
          label: "Lire par-dessus son epaule",
          description: "Gagnez 20 PV max.",
          outcomeText:
            "Il vous laisse regarder. Il note meme votre presence dans son livre. Un lecteur silencieux qui n'interrompt pas merite toujours quelque chose.",
        },
      ],
    },
    sphinx_riddle: {
      title: "L'Enigme de la Grande Sphinge",
      flavorText:
        "La Sphinge bloque un couloir entre deux etageres immenses. Elle est vivante, patiente, et tient entre ses pattes un codex qu'elle lit avec une lenteur deliberee. Elle leve les yeux. « Une enigme, dit-elle. Pas de mauvaise reponse — juste des reponses differentes. »",
      description:
        "La Sphinge pose une question a laquelle toutes les reponses sont vraies. Chacune ouvre une porte differente.",
      choices: [
        {
          label: "Repondre : l'Encre",
          description: "Gagnez 35 or.",
          outcomeText:
            "Elle sourit — pour autant qu'une sphinge puisse sourire. « L'encre cree et detruit a la fois. Oui. Voila qui te ressemble. » Elle depose des pieces d'or entre ses pattes et vous laisse passer.",
        },
        {
          label: "Repondre : la Memoire",
          description: "Gagnez 25 PV max.",
          outcomeText:
            "« La memoire survit a tout, dit-elle. Meme a la censure. Oui. » Elle pose une patte sur votre epaule une fraction de seconde — juste assez pour que quelque chose de sa propre permanence deteigne sur vous.",
        },
        {
          label: "Garder le silence",
          description: "Rien ne se passe.",
          outcomeText:
            "Elle attend une heure entiere. Puis elle reprend son codex. « Le silence est aussi une reponse, dit-elle. Pas la plus utile, mais la plus honnete. » Elle s'ecarte et vous laisse passer.",
        },
      ],
    },
    // ── LOVECRAFTIAN ───────────────────────────────────────────────────────
    forbidden_lexicon: {
      title: "Le Lexique Interdit",
      flavorText:
        "Le Bibliothecaire n'a pas de visage — ou plutot, il en a trop, qui se succedent trop vite pour etre comptes. Il tient un lexique dont les mots changent quand vous le regardez. « Ce que tu peux lire dans ce livre ne peut pas etre vu deux fois, dit-il. Choisis ta dose. »",
      description:
        "Le Bibliothecaire propose une connaissance qui ne peut etre vue qu'une fois. Le prix se paye en clarte mentale.",
      choices: [
        {
          label: "Lire le passage interdit",
          description: "Gagnez 50 or. Ajoutez 1 Regret Hante.",
          outcomeText:
            "Les mots entrent par les yeux et sortent autrement. Ce que vous comprenez n'a pas de traduction. Ce que vous retenez, c'est de l'or. Ce que vous perdez se nomme lui-meme « regret » faute d'un meilleur terme.",
        },
        {
          label: "Lire avec les paupieres mi-closes",
          description: "Gagnez 25 PV max.",
          outcomeText:
            "Un apercu. Suffisamment pour que quelque chose change en vous. Pas assez pour que vous sachiez precisement quoi. Le Bibliothecaire note dans son registre sans visage : « lecture partielle ».",
        },
        {
          label: "Fermer le livre",
          description: "Rien ne se passe.",
          outcomeText:
            "Le Bibliothecaire range le lexique dans un espace qui n'existait pas avant qu'il en ait besoin. « Tu reviendras peut-etre, dit-il. Tout le monde revient. »",
        },
      ],
    },
    deep_echo: {
      title: "L'Echo des Abysses",
      flavorText:
        "Un son qui n'est pas tout a fait un son vient d'en dessous — a travers le plancher de la Bibliotheque, a travers des kilometres de pierre et d'encre. Ce n'est pas un cri. Ce n'est pas un chant. C'est quelque chose qui essaie de se souvenir de comment resonner dans un espace humain.",
      description:
        "L'echo cherche une reponse. Lui en donner une pourrait etre benefique — ou simplement etrange.",
      choices: [
        {
          label: "Resonner avec l'echo",
          description: "Gagnez 30 PV max.",
          outcomeText:
            "Vous laissez le son passer par vous. Quelque chose d'aussi vieux que la premiere lettre jamais ecrite s'installe dans vos os. Votre capacite s'accroit. Le son repart satisfait d'avoir trouve un recipient assez profond.",
        },
        {
          label: "Absorber l'echo dans un grimoire",
          description: "Gagnez 20 PV et 20 or.",
          outcomeText:
            "L'echo entre dans le grimoire ouvert et devient temporairement visible — une pulsation d'encre noire qui se solidifie en quelques secondes en quelque chose d'utile. Le livre se referme. Ce qu'il contient maintenant, vous ne savez pas.",
        },
        {
          label: "Ignorer l'echo",
          description: "Rien ne se passe.",
          outcomeText:
            "L'echo s'en va chercher une autre oreille. Quelque part dans la Bibliotheque, quelqu'un d'autre entend ce bruit et prend une decision differente.",
        },
      ],
    },
    dreaming_gate: {
      title: "La Porte du Reve",
      flavorText:
        "Une porte qui n'est pas attachee a un mur est debout dans la salle. De l'autre cote de son cadre, ce n'est pas une autre piece — c'est quelque chose que la langue humaine n'a jamais nomme, qui ressemble a un ciel mais n'en est pas un, ou des etoiles qui ne sont pas des etoiles bougent comme de l'ecriture sur une page tournee trop vite.",
      description:
        "La porte mene ailleurs. L'ailleurs a des effets secondaires.",
      choices: [
        {
          label: "Entrer dans la porte",
          description: "Gagnez 50 PV max. Ajoutez 2 Parchemins Maudits.",
          outcomeText:
            "Ce que vous voyez de l'autre cote ne se traduit pas. Mais votre corps traduit l'experience en capacite. Le prix : deux fragments de cette vision se coincent dans votre deck, refusant de partir.",
        },
        {
          label: "Regarder depuis le seuil",
          description: "Gagnez 25 PV max.",
          outcomeText:
            "Un apercu depuis l'embrasure — assez pour agrandir ce que vous pouvez contenir, pas assez pour perdre le fil de ce que vous etes. La porte se ferme d'elle-meme quand vous reculez.",
        },
        {
          label: "Sceller la porte",
          description: "Rien ne se passe.",
          outcomeText:
            "Vous scellez la porte avec ce qui vous tombe sous la main. Elle s'ouvre quelques minutes plus tard dans une autre partie de la Bibliotheque. Certaines portes ne peuvent pas etre scellees.",
        },
      ],
    },
    // ── AZTEC ──────────────────────────────────────────────────────────────
    quetzalcoatl_blessing: {
      title: "La Benediction de Quetzalcoatl",
      flavorText:
        "Un serpent couvert de plumes vertes et d'or serpente entre les etageres, trop grand pour cette salle, et pourtant la. Il s'arrete devant vous, sa tete a hauteur de votre poitrine. Sur sa langue fourchue, des glyphes naissent et disparaissent. « Scribe, dit-il. Tu meritertes une marque. »",
      description:
        "Le Serpent Plumeux offre un glyphe de puissance. Le sang amplifie toujours le don.",
      choices: [
        {
          label: "Accepter la benediction",
          description: "Gagnez 30 PV max.",
          outcomeText:
            "Il trace un glyphe sur votre front avec la pointe de sa langue. Ca ne brule pas — ca grave. Quelque chose de nouveau est inscrit dans votre existence. Quetzalcoatl repart en silence, satisfait d'avoir transmis quelque chose d'ancien.",
        },
        {
          label: "Offrir votre sang pour plus de puissance",
          description: "Gagnez 45 PV max. Perdez 15 PV.",
          outcomeText:
            "Vous posez une paume ouverte devant lui. Il trace le glyphe dans votre sang. C'est plus profond que la chair — une inscription dans quelque chose de plus fondamental. Le prix est visible. L'echange est juste.",
        },
        {
          label: "S'incliner et decliner respectueusement",
          description: "Gagnez 10 PV.",
          outcomeText:
            "Il incline la tete, respectueux en retour. Un refus poli merite un don poli — une petite guerison, offerte sans commentaire. Puis il repart dans les couloirs, plus grand que les etageres.",
        },
      ],
    },
    obsidian_altar: {
      title: "L'Autel d'Obsidienne",
      flavorText:
        "L'autel est taille dans un bloc d'obsidienne qui absorbe la lumiere plutot qu'il ne la reflechit. La Pretresse du Codex est debout derriere, vetue de plumes et d'encre sechee. Elle tient un couteau de verre volcanique. « Tout connaisseur sait que la connaissance se paye. Que donneras-tu ? »",
      description:
        "La Pretresse du Codex reclame un sacrifice. Ce qu'elle donne en retour vaut le prix.",
      choices: [
        {
          label: "Sacrifier une carte a l'autel",
          description:
            "Perdez 10 PV. Retirez 1 carte. Gagnez 20 PV max et 40 or.",
          outcomeText:
            "Le couteau d'obsidienne coupe proprement. La carte brule sur l'autel en une flamme bleue. La Pretresse note le sacrifice dans son codex, satisfaite. Ce que vous perdez etait ce qui vous alourdissait.",
        },
        {
          label: "Offrir de l'or a la place",
          description: "Perdez 30 or, gagnez 25 PV max.",
          outcomeText:
            "Elle accepte l'or avec une legere deception. L'or n'est pas le sacrifice prefere de l'autel. Mais c'est une offrande acceptable. Elle ecrit votre nom dans le codex — a l'encre ordinaire.",
        },
        {
          label: "Reculer devant l'autel",
          description: "Perdez 15 PV.",
          outcomeText:
            "La Pretresse dit quelque chose dans une langue que vous ne connaissez pas. Ce n'est pas une malediction — c'est pire. C'est de la deception. L'obsidienne vous effleure au passage. Certains autels reagissent au manque de respect.",
        },
      ],
    },
    xolotl_crossing: {
      title: "La Traversee de Xolotl",
      flavorText:
        "Un chien sans poil, a la peau bleue tachee de la couleur de la nuit, est assis dans le couloir et vous regarde avec des yeux qui ont vu l'envers de toutes les choses. C'est Xolotl — le guide des morts. « Je peux te montrer le chemin le plus court, dit-il. Si tu m'accompagnes. »",
      description:
        "Xolotl guide les ames a travers ce que les vivants ne voient pas. Un privilege rare.",
      choices: [
        {
          label: "Suivre le guide des morts",
          description: "Gagnez 25 PV et 20 or.",
          outcomeText:
            "Il trotte devant vous a travers des couloirs que vous n'aviez pas remarques. Certaines portes s'ouvrent d'elles-memes. Quand il s'arrete, vous etes ailleurs — soigne et plus riche, sans avoir compris comment.",
        },
        {
          label: "Lui confier un de vos secrets",
          description: "Gagnez 35 PV max.",
          outcomeText:
            "Il penche la tete et ecoute. Ce qu'il fait de votre secret, vous ne savez pas. Mais en echange, il vous confie quelque chose — non pas en mots, mais en capacite. Votre enveloppe peut contenir davantage.",
        },
        {
          label: "Choisir votre propre chemin",
          description: "Rien ne se passe.",
          outcomeText:
            "Il vous regarde partir avec la patience de quelqu'un qui sait que tout le monde revient sur ses pas. Puis il repart, peut-etre chercher une autre ame a guider.",
        },
      ],
    },
    // ── CELTIC ─────────────────────────────────────────────────────────────
    druid_memory: {
      title: "La Formule du Druide",
      flavorText:
        "Le Druide de la Memoire n'a pas de livre — ses textes sont tous dans sa tete, memorises sur des generations de druides avant lui. Il murmure en marchant, repetant des formules que personne d'autre ne peut ecrire. En vous voyant, il s'arrete. « Tu portes des grimoires. Tu sais donc ecrire. C'est mieux que rien. »",
      description:
        "Les druides gardent la connaissance vivante. Il peut vous en transmettre une partie.",
      choices: [
        {
          label: "Recevoir la formule par recitation",
          description: "Gagnez 25 PV max.",
          outcomeText:
            "Il parle pendant plusieurs minutes, les memes mots en boucle jusqu'a ce qu'ils s'impriment. Vous ne comprenez pas tout — mais quelque chose en vous change comme une page qui se tourne. La formule travaille sans que vous la compreniez.",
        },
        {
          label: "La transcrire en echange de 20 or",
          description: "Perdez 20 or, gagnez 40 PV max.",
          outcomeText:
            "Il grimace legerement en voyant la plume. « Les druides n'ecrivent pas. Mais toi, tu peux. » Vous transcrivez la formule. L'or paye sa generosite. Ce que vous avez note est plus ancre, plus profond — parce qu'ecrit et entendu a la fois.",
        },
        {
          label: "Refuser d'apprendre",
          description: "Rien ne se passe.",
          outcomeText:
            "Il hausse les epaules. « Les formules choisissent leurs porteurs. Peut-etre pas toi aujourd'hui. » Il reprend sa recitation et disparait entre les rayons.",
        },
      ],
    },
    lady_of_the_lake: {
      title: "La Dame du Lac Encre",
      flavorText:
        "Au fond d'une salle, une etendue d'encre parfaitement immobile reflete le plafond comme une eau noire. Une main emerge lentement, tenant un livre scelle par trois chaines. Une voix monte de sous la surface : « Ce livre te protegera. Si tu oses le prendre. »",
      description:
        "La Dame du Lac Encre tient quelque chose pour vous. Le prendre a un cout.",
      choices: [
        {
          label: "Plonger la main dans l'encre",
          description: "Gagnez 30 PV max. Perdez 15 PV.",
          outcomeText:
            "L'encre est froide et epaisse, comme plonger la main dans la nuit. La Dame vous laisse prendre le livre — puis prend quelque chose en echange, sans violence. Vous repartez avec plus de capacite et une blessure que vous ne pouvez pas localiser.",
        },
        {
          label: "Lui offrir 30 or",
          description: "Perdez 30 or, gagnez 25 PV max.",
          outcomeText:
            "La main disparait un instant, reapparait avec le livre tendu. L'or disparait sous la surface sans faire de bruit. Ce que vous avez paye, vous ne l'aurez pas en retour. Ce que vous avez recu, vous y tenez.",
        },
        {
          label: "Reculer doucement",
          description: "Rien ne se passe.",
          outcomeText:
            "La main reste tendue une longue minute. Puis elle se retire lentement, emportant le livre. Le lac redevient parfaitement immobile, comme si rien ne s'etait passe.",
        },
      ],
    },
    morrigan_crow: {
      title: "Le Corbeau de Morrigan",
      flavorText:
        "Le corbeau est immense — pas naturellement, mais comme si la salle autour de lui avait retreci. Il porte dans son bec une plume detachee de son propre corps. Sur cette plume : votre nom, ecrit en sang seche. Il pose la plume a vos pieds. « Je suis venu voir ton futur. Et te proposer d'en changer. »",
      description:
        "Morrigan voit votre mort. Elle propose de la retarder — a condition de la regarder en face.",
      choices: [
        {
          label: "Regarder votre propre fin",
          description: "Gagnez 50 PV max. Perdez 20 PV.",
          outcomeText:
            "Ce que vous voyez n'est pas traduisible. Mais votre corps reagit a la vision comme a une alarme — en se fortifiant, en s'epaississant, en apprenant a durer plus longtemps. La douleur du present vaut le futur qu'elle repousse.",
        },
        {
          label: "Interpreter les presages de richesse",
          description: "Gagnez 40 or.",
          outcomeText:
            "Le corbeau montre autre chose aussi — des eclats d'or dans votre avenir proche. Morrigan voit tout : la mort, mais aussi ce qui la precede. Vous choisissez de ne regarder que cette partie-la.",
        },
        {
          label: "Chasser le corbeau",
          description: "Rien ne se passe.",
          outcomeText:
            "Il s'envole avec votre plume. Les propheties se realisent avec ou sans le consentement des interesses. Il aurait peut-etre ete preferable de savoir.",
        },
      ],
    },
    // ── AFRICAN ────────────────────────────────────────────────────────────
    anansi_story: {
      title: "L'Histoire d'Anansi",
      flavorText:
        "Entre les fils d'une toile geante qui court de rayon en rayon comme un second plafond, Anansi l'Araignee est suspendu dans son corps d'homme-araignee, lisant sept livres simultanement. Il descend lentement. « Toute connaissance est une histoire, dit-il. Et toute histoire a un echange au coeur. »",
      description:
        "Anansi tisse des recits comme d'autres tissent des filets. Ce qu'il offre a toujours plusieurs sens.",
      choices: [
        {
          label: "Lui raconter votre voyage",
          description: "Gagnez 30 PV max.",
          outcomeText:
            "Il ecoute avec tous ses yeux. Quand vous avez fini, il sourit. « Une bonne histoire. Pas la meilleure que j'ai entendue. Mais honnete. » Il tisse quelque chose dans votre existence avant de remonter a son plafond.",
        },
        {
          label: "Ecouter une de ses histoires",
          description: "Gagnez 15 PV et 15 or.",
          outcomeText:
            "Son histoire commence simplement, puis devient complexe, puis ironique, puis profonde, puis elle se retourne et revele quelque chose que vous ne saviez pas sur vous-meme. Vous partez avec moins de blessures et plus d'or.",
        },
        {
          label: "Refuser l'echange",
          description: "Rien ne se passe.",
          outcomeText:
            "Il vous regarde partir avec l'amusement de quelqu'un qui sait comment l'histoire se termine. « Tu reviendras, dit-il. Les bons personnages reviennent toujours. »",
        },
      ],
    },
    griot_song: {
      title: "Le Chant du Griot",
      flavorText:
        "Le Griot des Pages est assis entre les rayons, sa kora appuyee contre une etagere, des pages volantes tournant autour de lui comme des oiseaux qui auraient oublie comment voler. Quand il chante, les mots de tous les livres autour de lui vibrent legerement dans leur reliure.",
      description:
        "Le chant du griot guerit ce que les medicaments ne peuvent pas atteindre. Il chante pour qui prend le temps d'ecouter.",
      choices: [
        {
          label: "Ecouter la melodie complete",
          description: "Gagnez 30 PV.",
          outcomeText:
            "La melodie prend du temps. Elle suit vos cicatrices, les adresse une par une. Quand elle se tait, vous etes moins blesse. Pas entierement — mais significativement.",
        },
        {
          label: "Fredonner avec lui",
          description: "Gagnez 25 PV et 15 or.",
          outcomeText:
            "Il sourit en vous entendant essayer. Votre voix n'est pas belle — mais elle est sincere, et le griot recompense toujours la sincerite. La guerison s'accompagne d'un petit tresor tire de nulle part.",
        },
        {
          label: "Partir rapidement",
          description: "Gagnez 10 PV.",
          outcomeText:
            "Il chante quand meme quelques mesures dans votre direction. Meme une ecoute distraite merite quelque chose. Vous partez un peu moins blesse.",
        },
      ],
    },
    scribe_1_first_meeting: {
      title: "Le Scribe Efface",
      flavorText:
        "Entre deux rayons, presque invisible. Pas un fantome — quelque chose entre un homme et une annotation dans les marges. Il ecrit dans l'air, mais sa plume ne laisse aucune trace.",
      description: "Il ne semble pas vous voir. Ou ne veut pas etre vu.",
      choices: [
        {
          label: "L'observer en silence",
          description: "Le regarder sans intervenir.",
          outcomeText:
            "Il continue d'ecrire dans le vide. Vous repartez avec la certitude d'avoir manque quelque chose, sans savoir quoi.",
        },
        {
          label: "Lui adresser la parole",
          description: "Tenter le contact.",
          outcomeText:
            "Il sursaute. Ouvre la bouche. La referme. L'ouvre encore. « Il y avait un mot, dit-il finalement. Je ne retrouve plus lequel. » Vous ne savez pas quoi repondre a ca.",
        },
        {
          label: "L'ignorer et passer",
          description: "Ce n'est pas votre affaire.",
          outcomeText:
            "Il disparait de votre champ de vision avant meme que vous ayez tourne le dos. Rien ne s'est passe. Et pourtant.",
        },
      ],
    },
    scribe_2_lost_words: {
      title: "Les Pages Dechirées",
      flavorText:
        "Il est assis par terre, entoure de pages qu'il a lui-meme arrachees, essayant de les reassembler. Il ne leve pas les yeux quand vous approchez.",
      description:
        "Les fragments ne correspondent a rien. Il cherche quelque chose qu'il a perdu lui-meme.",
      choices: [
        {
          label: "L'aider a rassembler les pages",
          description: "Tendre la main.",
          outcomeText:
            "Il vous laisse faire sans protester. Les pages ne s'assemblent pas — les fragments ne correspondent a rien. Mais il vous regarde faire avec quelque chose qui ressemble a de la gratitude.",
        },
        {
          label: "Regarder sans intervenir",
          description: "Observer de loin.",
          outcomeText:
            "Les pages sont couvertes d'une ecriture qui ressemble vaguement a la votre. Vous decidez que c'est une coincidence.",
        },
        {
          label: "Lui dire que c'est inutile",
          description: "Etre direct.",
          outcomeText:
            "Il s'arrete. Vous regarde. « Tu as peut-etre raison, dit-il. Mais je dois essayer quand meme. » Il reprend. Vous partez.",
        },
      ],
    },
    scribe_3_familiar_face: {
      title: "Le Visage Connu",
      flavorText:
        "Il vous arrete dans un couloir — cette fois, c'est lui qui a l'initiative. « Je te connais, dit-il. Pas de ce run. De l'autre. Ou peut-etre... du prochain. »",
      description:
        "Il parle de vous comme d'un personnage recurrent. Il n'a pas tort.",
      choices: [
        {
          label: "Jouer le jeu",
          description: "Hocher la tete.",
          outcomeText:
            "Votre acquiescement le detend. « Je savais. Les bons Archivistes reviennent toujours. » Il dit 'bons' d'une facon etrange, comme si le mot avait un prix.",
        },
        {
          label: "Le corriger : vous ne vous etes jamais vus",
          description: "Etre honnete.",
          outcomeText:
            "Il reflechit. « Non, dit-il. Peut-etre que tu as raison. Peut-etre que c'etait quelqu'un d'autre. » Il hoche la tete comme si c'etait une reponse satisfaisante. Ce n'en est pas une.",
        },
        {
          label: "Partir sans repondre",
          description: "Ne pas s'arreter.",
          outcomeText:
            "Il ne dit rien. Vous sentez son regard dans votre dos pendant tout le couloir suivant.",
        },
      ],
    },
    scribe_4_torn_pages: {
      title: "L'Encre Effacee",
      flavorText:
        "Il vous montre une page. De pres, on distingue les traces — quelque chose etait la. Pas une tache : une ecriture deliberement effacee. Quelqu'un a pris le temps de tout retirer.",
      description: "Ces pages ont ete censurees. Pas par accident.",
      choices: [
        {
          label: "Essayer de lire les traces",
          description: "Regarder de plus pres.",
          outcomeText:
            "Avec assez de lumiere et d'attention, quelques mots ressortent. Des noms. Des lieux. Et un titre qui revient plusieurs fois : Archiviste Principal. Vous relevez les yeux. Il attend.",
        },
        {
          label: "Lui demander qui a fait ca",
          description: "Poser la question.",
          outcomeText:
            "« Quelqu'un qui croyait que certaines histoires etaient trop dangereuses. » Il replie la page soigneusement. « Quelqu'un qui se croyait raisonnable. »",
        },
        {
          label: "Detourner le regard",
          description: "Ne pas regarder.",
          outcomeText:
            "Il replie la page sans un mot. Il ne vous en voudra pas. Il ne s'y attend pas.",
        },
      ],
    },
    scribe_5_the_name: {
      title: "Le Prenom Perdu",
      flavorText:
        "Il vous aborde en murmurant quelque chose. Une syllabe. Puis deux. Il essaie de reconstituer quelque chose d'essentiel qu'il a perdu avant de savoir qu'il l'avait.",
      description:
        "Il cherche son nom. Ce qui reste d'un homme quand le nom s'en va.",
      choices: [
        {
          label: "L'encourager a chercher",
          description: "Rester avec lui.",
          outcomeText:
            "Vous attendez. Il essaie. « E... » Il s'arrete. « Il me semble que ca commencait par un E. Ou peut-etre que c'est quelqu'un d'autre. » Il sourit, defait. Vous restez la jusqu'a ce qu'il renonce.",
        },
        {
          label: "Attendre en silence",
          description: "Laisser le silence faire son travail.",
          outcomeText:
            "Le silence entre vous deux est confortable. Il finit par renoncer pour ce soir — si ce lieu a des soirs. « Merci d'etre reste », dit-il sans explication.",
        },
        {
          label: "Lui dire que ca n'a plus d'importance",
          description: "Clore le sujet.",
          outcomeText:
            "Il vous regarde longuement. « C'est vrai, finit-il par dire. Et c'est peut-etre le probleme. » Il part avant vous.",
        },
      ],
    },
    scribe_6_the_warning: {
      title: "Ce qui Vous Attend",
      flavorText:
        "Il vous intercepte avec une urgence inhabituelle. Son visage est plus net que d'habitude, plus present. « Je me souviens de quelque chose, dit-il. Je dois te le dire avant que ca parte. »",
      description:
        "Il a quelque chose de precis a transmettre. Une derniere fois.",
      choices: [
        {
          label: "Ecouter attentivement",
          description: "Lui donner toute votre attention.",
          outcomeText:
            "Il vous parle d'une force — pas un ennemi, une direction. Quelque chose qui s'est decide a tout simplifier. « Les histoires simples ne blessent personne, dit cette chose. Elle a tort. Les histoires simples n'existent pas. » Il vous regarde comme si vous deviez comprendre quelque chose de plus.",
        },
        {
          label: "Ecouter sans repondre",
          description: "Absorber sans commenter.",
          outcomeText:
            "Il parle. Vous absorbez. Vous n'etes pas sur de tout comprendre, mais le ton suffit. Quelque chose de grave arrive.",
        },
        {
          label: "Lui dire qu'il delire",
          description: "Rejeter ses mots.",
          outcomeText:
            "Son regard se vide un instant. « Oui, dit-il. Peut-etre. » Il repart. Ce soir-la, vous ne dormez pas — si ce lieu permet le sommeil.",
        },
      ],
    },
    scribe_7_the_other: {
      title: "Celui qui a Commence",
      flavorText:
        "Sans preambule : « Il y avait un Archiviste avant toi. Avant moi aussi, je crois. Il a decide que certaines histoires etaient trop... compliquees. » Une pause. « Il faut le retrouver. »",
      description:
        "Il parle de quelqu'un sans realiser qu'il parle de lui-meme.",
      choices: [
        {
          label: "Lui demander d'en dire plus",
          description: "Creuser.",
          outcomeText:
            "Il cherche. Le souvenir est fragmente. « Il s'appelait... » Il s'arrete. Quelque chose dans ses yeux change — une seconde de panique, puis ca se referme. « Je ne me souviens plus. Desole. » Vous le croyez.",
        },
        {
          label: "Observer sa reaction",
          description: "Le regarder parler de lui-meme.",
          outcomeText:
            "Ce qui est frappant, c'est qu'il parle de cet homme avec de la colere. Pas de la culpabilite. Pas encore.",
        },
        {
          label: "Couper court",
          description: "Pas le temps pour ca.",
          outcomeText:
            "Il s'arrete a mi-phrase. Hoche la tete. « Tu as raison. On n'a peut-etre pas le temps. » Mais il avait quelque chose a finir. Il ne finira pas aujourd'hui.",
        },
      ],
    },
    scribe_8_the_truth: {
      title: "L'Archiviste d'Avant",
      flavorText:
        "Sa voix est stable. Plus stable que toutes les fois precedentes. « Je me souviens de mon role. Pas de mon nom encore. Mais mon role : Archiviste Principal du Panlibrarium. Avant toi. »",
      description: "Il sait ce qu'il etait. Pas encore ce qu'il a fait.",
      choices: [
        {
          label: "Lui dire que vous le croyez",
          description: "Lui accorder votre confiance.",
          outcomeText:
            "Il ferme les yeux une seconde. « C'est plus que ce que j'esperais. » Vous ne savez pas exactement a quoi vous croyez. Mais vous y croyez quand meme.",
        },
        {
          label: "Garder votre distance",
          description: "Rester prudent.",
          outcomeText:
            "Ce n'est pas de la mefiance — c'est de la prudence. Il comprend. « Tu as raison d'attendre, dit-il. Je n'ai pas encore tout dit. »",
        },
        {
          label: "L'accuser : c'est lui qui a tout casse",
          description: "Dire ce que vous pensez.",
          outcomeText:
            "Il palit. Ou plutot, ce qui lui sert de presence se contracte. « Je n'exclus pas cette possibilite », dit-il apres un silence. Ce n'est pas un deni.",
        },
      ],
    },
    scribe_9_the_choice: {
      title: "Ce que Tu Ferais",
      flavorText:
        "« Supposons, dit-il, que tu aies lu toutes les histoires. Que tu saches lesquelles rendent les gens violents. Lesquelles leur donnent de mauvaises idees. Des idees dangereuses. Qu'est-ce que tu ferais ? »",
      description:
        "Il ne pose pas une question rhetorique. Il veut vraiment savoir.",
      choices: [
        {
          label: "Rien. Les histoires s'appartiennent.",
          description: "Defendre la liberte des recits.",
          outcomeText:
            "Il hoche la tete lentement. « C'est ce que j'aurais dit, autrefois. » Une pause. « Avant de voir ce que certaines histoires faisaient aux gens. » Mais il n'a pas l'air de vous contredire.",
        },
        {
          label: "Ca depend de l'histoire.",
          description: "Etre nuance.",
          outcomeText:
            "« Une reponse raisonnable, dit-il. C'est exactement comme ca que ca commence. »",
        },
        {
          label: "Les effacer. Proteger les lecteurs.",
          description: "Choisir la censure.",
          outcomeText:
            "Quelque chose dans son visage change — pas de la satisfaction, de la douleur. « Oui, dit-il. C'est ce que j'aurais dit aussi. »",
        },
      ],
    },
    scribe_10_the_reveal: {
      title: "Ce qui ne Peut pas etre Efface",
      flavorText:
        "Il est entierement la. Lucide, stable, effrayant dans sa clarte. « Je suis celui dont je t'ai parle. L'Archiviste qui a commence. Je t'ai cherche pendant toutes ces rencontres parce que je ne me souvenais pas encore. Maintenant oui. »",
      description: "Il sait. Il dit tout. Il a quelques minutes.",
      choices: [
        {
          label: "Lui dire que vous le saviez",
          description: "Lui offrir cette grace.",
          outcomeText:
            "Vous mentiez — vous le suspectez, mais vous ne le saviez pas vraiment. Il sourit. « Peu importe. Maintenant tu dois aller plus loin que moi. Ce que tu trouveras la-bas, c'est ce que je suis devenu. Tue-le si tu peux. Ou... non. Ecoute-le d'abord. »",
        },
        {
          label: "Rester silencieux",
          description: "Laisser le poids de la verite exister.",
          outcomeText:
            "Il n'attend pas de reponse. Il sait que certaines verites n'appellent pas de mots. Il disparait lentement — litteralement, pas par metaphore. Son encre se dissout. « Bonne chance, Archiviste. »",
        },
        {
          label: "Lui tourner le dos",
          description: "Ne pas vouloir entendre.",
          outcomeText:
            "Il ne vous rappelle pas. Quand vous regardez derriere vous, il n'est plus la. Dans le couloir vide, une page flotte encore — couverte d'une ecriture que vous reconnaissez maintenant comme la sienne.",
        },
      ],
    },
    nyame_trial: {
      title: "L'Epreuve de Nyame",
      flavorText:
        "Le plafond de la salle est une fenetre sur quelque chose qui ressemble a un ciel — et dans ce ciel, un oeil immense vous regarde. Nyame, le dieu du ciel, a lu tous les livres de la Bibliotheque depuis son plafond depuis le premier jour. Il vous a vus arriver. « Une epreuve, dit la voix d'en haut. Pour mesurer si tu meritertes de continuer. »",
      description:
        "Nyame juge depuis son ciel. Son epreuve est difficile mais juste.",
      choices: [
        {
          label: "Accepter l'epreuve",
          description: "Gagnez 40 PV max. Perdez 20 PV.",
          outcomeText:
            "Ce que l'epreuve demande, vous le payez en chair. Ce qu'elle donne en retour, vous le portez dans votre enveloppe comme une revision profonde. Nyame fait une note dans ses propres archives. Vous avez passe. Pas facilement — mais passe.",
        },
        {
          label: "Offrir de l'or pour une epreuve allégee",
          description: "Perdez 40 or, gagnez 30 PV max.",
          outcomeText:
            "La voix se tait un moment. « L'or ne dispense pas de l'epreuve. Mais il paye pour une version plus courte. » Une lumiere breve. Une douleur breve. Un gain reel.",
        },
        {
          label: "Ignorer le regard et avancer",
          description: "Rien ne se passe.",
          outcomeText:
            "L'oeil vous suit jusqu'a la prochaine salle. Nyame note quelque chose dans ses archives. Peut-etre pour une prochaine occasion. Peut-etre pour ne jamais l'oublier.",
        },
      ],
    },
  },
} as const;
