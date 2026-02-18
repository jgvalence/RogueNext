# Panlibrarium — Game Specs (v0.1)

## 0) Pitch

Panlibrarium est un deck-builder roguelike (inspiré Slay the Spire) où un explorateur traverse des livres de mythologie (Viking, Grec, Égyptien, Aztèque, Lovecraft...).
Le joueur progresse salle par salle, combat des ennemis, recrute jusqu'à 3 alliés, améliore son deck, obtient de l'or et des artefacts.
Mécanique signature : **Jauge d’Encre** + cartes **Marquées à l’encre** (réécriture du récit).

---

## 1) Structure d’un run

- Un run est composé de `N_FLOORS` étages (MVP: 3).
- Chaque étage comporte `ROOMS_PER_FLOOR = 10` salles.
- La salle 10 est toujours un **Boss**.
- Après avoir terminé une salle, le joueur choisit la prochaine salle parmi `1..3` options (sauf transitions spéciales).
- Types de salles :
  - Combat
  - Marchand
  - Spéciale (événement, soin, amélioration, malédiction, etc.)

### Progression de difficulté

- À chaque nouvel étage : ennemis plus forts (PV/attaque/capacités).
- Au sein d’un étage : légère augmentation par salle (ex: multiplicateur sur PV ou fréquence de capacités).

---

## 2) Entités et Terminologie

### 2.1 Joueur

- Le joueur contrôle un personnage principal + jusqu’à 3 alliés.
- Le joueur possède un deck, une main, une pioche, une défausse, énergie, PV, et encre.

### 2.2 Alliés (max 3)

- Chaque allié a :
  - `currentHp`, `maxHp`, `speed`
  - une ou plusieurs `abilities` (déclenchées selon conditions)
- Les alliés agissent automatiquement pendant la phase "Alliés/Ennemis" selon l’initiative.

### 2.3 Ennemis (1 à 4)

- Chaque ennemi a :
  - `currentHp`, `maxHp`, `speed`
  - `abilities` (attaques, buffs, debuffs, drain d’encre, etc.)
- Les ennemis agissent selon l’initiative pendant la phase "Alliés/Ennemis".

---

## 3) Combat — Boucle de tour

Le combat continue tant que :

- (condition victoire) tous les ennemis ont `currentHp <= 0`
- (condition défaite) le joueur a `currentHp <= 0` (MVP), ou règle alternative : si le joueur meurt même si des alliés survivent -> défaite.

### 3.1 Préparation de combat

- Le joueur démarre le combat avec :
  - `energyCurrent = energyMaxCurrent`
  - `drawPile` rempli (deck mélangé)
  - `discardPile` vide
  - `hand` vide
- Début combat : pioche `drawCount` cartes

### 3.2 Tour Joueur

1. Pioche : si c’est un nouveau tour, piocher jusqu’à `handSizeCurrent` (ou piocher `drawCount` selon design).
2. Jouer des cartes :
   - Une carte coûte `energyCost` (soustrait de `energyCurrent`)
   - Certaines cartes coûtent aussi `inkCost` (soustrait de `inkCurrent`)
   - Les cartes peuvent cibler : un ennemi, tous les ennemis, un allié, tous les alliés, soi-même.
3. Fin du tour joueur :
   - Défausser toutes les cartes restantes en main (sauf cartes "retain" si plus tard)
   - `energyCurrent` revient à `energyMaxCurrent`
   - Appliquer règles de block (ex: `block` retombe à 0)
   - Piocher pour le tour suivant (au début du prochain tour)

### 3.3 Phase Alliés & Ennemis (Initiative)

- Après le tour joueur, tous les alliés et ennemis agissent dans l’ordre de `speed` décroissant (ou croissant, à décider).
- Chaque entité exécute son action du tour (attaque, buff, debuff, capacité spéciale).
- Fin de round :
  - Appliquer DOT (poison, brûlure…), triggers fin de round, etc.

### 3.4 Pioche / Défausse / Mélange

- Si `drawPile` est vide :
  - Mélanger `discardPile` => nouveau `drawPile`
  - Vider `discardPile`
- Les cartes jouées vont dans `discardPile` (sauf cartes "exhaust" si plus tard).

---

## 4) Cartes — Types et règles

### 4.1 Types de cartes (MVP)

- `ATTACK` : dégâts
- `SKILL` : armure, pioche, énergie, soin, buffs
- `POWER` : effets persistants (optionnel MVP)

### 4.2 Champs d’une carte (structure)

- `id`, `name`, `type`
- `energyCost`
- `inkCost` (optionnel)
- `targeting` (SINGLE_ENEMY | ALL_ENEMIES | SELF | SINGLE_ALLY | ALL_ALLIES)
- `rarity` (COMMON | UNCOMMON | RARE)
- `effect` (décrit en données : JSON ou DSL)
- `inkedVariant` (optionnel) : version "Marquée à l’encre"

---

## 5) Mécanique Signature — Encre & Cartes marquées

### 5.1 Jauge d’Encre

- Ressource spéciale `inkCurrent` bornée par `inkMax`.
- Gagner de l’encre via :
  - `+inkPerCardPlayed` (ex: 1)
  - certains kills / événements
  - cartes dédiées (générer encre)
- Dépenser l’encre via :
  - activation de pouvoirs d’encre
  - marquage de cartes
  - coûts directs `inkCost` sur certaines cartes

### 5.2 "Marqué à l’encre"

- Certaines cartes possèdent une variante renforcée.
- Règle MVP proposée :
  - Si le joueur choisit de **marquer** une carte au moment où il la joue :
    - payer un coût `inkMarkCost` (ex: 2)
    - la carte utilise son `inkedVariant` au lieu de son effet normal
- Alternative (à décider plus tard) :
  - marquage permanent (upgrade en salle spéciale)
  - marquage temporaire "pour ce combat"
  - marquage automatique 1 fois par tour (artefact)

### 5.3 Pouvoirs d’Encre (MVP)

- Pouvoirs activables en combat, coûtent de l’encre :
  - `Rewrite`: rejouer une carte de la défausse (ou la remettre en main)
  - `LostChapter`: piocher +2
  - `Seal`: donner block au joueur / allié
- Ces pouvoirs sont traités comme des "actions" distinctes des cartes (mais peuvent être implémentés comme des cartes spéciales).

---

## 6) Récompenses et Économie

### 6.1 Récompenses post-combat

- Après une salle de combat :
  - Gain d’or `goldReward`
  - Choix d’une carte parmi 3 (skip autorisé)

### 6.2 Marchand

- Le joueur peut acheter :
  - cartes
  - artefacts
  - soins / removal (optionnel)
- MVP : achats simples (liste d’items avec prix).

### 6.3 Artefacts

- Obtenus via boss (toujours) et parfois événements.
- Effets passifs persistants sur le run :
  - +1 énergie max
  - +1 pioche
  - 1 carte marquée gratuite par combat
  - +inkMax
  - +ink gain par carte jouée
- MVP : 5-10 artefacts simples.

---

## 7) Statistiques (Player combat state)

### 7.1 Stats essentielles (MVP)

- PV :
  - `currentHp`
  - `maxHpBase`
  - `maxHpCurrent`
- Défense :
  - `block` (temporaire)
- Ressources :
  - `energyMaxBase`
  - `energyMaxCurrent`
  - `energyCurrent`
  - `inkCurrent`
  - `inkMax`
- Deck runtime :
  - `handSizeBase`
  - `handSizeCurrent`
  - `drawCount`
- Initiative :
  - `speed`
- Modificateurs :
  - `strength` (bonus dégâts)
  - `focus` (bonus buffs/skills)

### 7.2 States runtime (en combat)

- `drawPile: CardInstance[]`
- `discardPile: CardInstance[]`
- `hand: CardInstance[]`
- `entities: { player, allies[], enemies[] }`
- `turnNumber`, `rngSeed` (optionnel mais utile)

---

## 8) Données et Modèle de jeu (reco)

### 8.1 Données persistées (DB)

- `User`
- `Run` (historique, stats, seed, progression)
- `CardDefinition` (catalogue)
- `RelicDefinition` (catalogue)
- `EnemyDefinition` (catalogue)
- `AllyDefinition` (catalogue)
- Optionnel : `RunSnapshot` (si tu veux reprendre un run)

### 8.2 Données runtime (en mémoire / store)

- État complet d’un combat : piles, entités, buffs, énergie, encre.

---

## 9) MVP — Scope concret

Objectif MVP : "1 run jouable basique"

- 1 étage de 10 salles
- 6-10 cartes de base + 10-20 cartes lootables
- 5 ennemis types + 1 boss
- 0-2 alliés simples (ou alliés désactivés en MVP si besoin)
- Jauge d’encre + 2 pouvoirs d’encre + 3 cartes marquées
- 5 artefacts simples
- UI minimal : combat, choix de salles, récompenses

---

## 10) Questions à trancher (pour verrouiller v0.2)

- Pioche : `drawCount` fixe par tour OU "piocher jusqu’à handSize" ?
- Initiative : joueur agit toujours avant phase initiative, ou initiative complète inclut joueur ?
- Block : disparaît fin du tour joueur ou fin de round ?
- Marqué à l’encre : choix à chaque play OU limité (1 fois par tour / par combat) ?
- Alliés : MVP dès le début, ou v1 après ?
- Sauvegarde run : snapshots DB ou state côté client ?

---

## 11) Glossaire

- `Run` : tentative complète jusqu’à mort/victoire
- `Floor` : étage (lot de 10 salles + boss)
- `Room` : salle (combat, shop, event)
- `Ink` : ressource spéciale
- `Inked` : version améliorée d’une carte via encre
- `Relic` : artefact passif
