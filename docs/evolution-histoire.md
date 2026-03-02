# Évolution — Histoire & Design Narratif

> Document de travail. Rassemble les ajustements lore, la vision narrative et la structure en chapitres pour RogueNext / Panlibrarium.

---

## Table des matières

1. [Ajustements lore (mythologie)](#1-ajustements-lore-mythologie)
2. [La métahistoire — Panlibrarium](#2-la-métahistoire--panlibrarium)
3. [Les trois couches narratives](#3-les-trois-couches-narratives)
4. [Chapitres = Difficultés](#4-chapitres--difficultés)
5. [Principes mythiques → mécaniques](#5-principes-mythiques--mécaniques)
6. [Formats narratifs à implémenter](#6-formats-narratifs-à-implémenter)
7. [Exemples d'events](#7-exemples-devents)
8. [Structure en 9 beats (histoire globale)](#8-structure-en-9-beats-histoire-globale)
9. [Boss final — Le Censeur](#9-boss-final--le-censeur)

---

## 1. Ajustements lore (mythologie)

Corrections de précision mythologique à apporter au fichier `mythologie.md` et aux données du jeu.

### 1.1 — Égypte : "Eye of Osiris" → "Judgment of Osiris"

**Problème :** "Eye" renvoie à l'Œil d'Horus / Wedjat (protection, restauration), pas au jugement des morts.

**Scène canonique égyptienne :** la Pesée du Cœur dans la Salle des Deux Vérités — le cœur du défunt pesé face à la plume de Maât, en présence d'Osiris.

**Changements :**

| Avant                    | Après                                                    |
| ------------------------ | -------------------------------------------------------- |
| `Eye of Osiris` _(boss)_ | `Judgment of Osiris` _(boss)_ ou `Weighing of the Heart` |
| Source : "Osiris + Maât" | Source : Osiris, Maât, Anubis (peseur), Thot (scribe)    |

> **Note :** garder "Maât" comme concept central dans les descriptions — la plume, l'ordre cosmique, l'équilibre. Ça nourrit la mécanique `maatBalance` (voir section 5).

---

### 1.2 — Égypte : "Desert Cobra | Apep / Ouadjyt" — séparer deux entités

**Problème :** Apep (Apophis) et Wadjet sont deux entités opposées :

- **Apep / Apophis** — serpent du chaos primordial, ennemi de Râ, force d'entropie cosmique
- **Wadjet / Ouadjyt** — déesse cobra protectrice, liée à la royauté et à l'Œil d'Horus

**Changement :** Les traiter comme deux ennemis distincts (ou deux variantes d'un slot "serpent" selon l'acte).

| Ennemi            | Source  | Rôle suggéré                                  |
| ----------------- | ------- | --------------------------------------------- |
| `Apep Scion`      | Apophis | Ennemi chaos — attaque les mécaniques d'ordre |
| `Wadjet Guardian` | Wadjet  | Ennemi protecteur — défend, contre-attaque    |

---

### 1.3 — Aztèque : "Blood Cultist | Tlacaxipehualiztli" — un festival, pas une entité

**Problème :** Tlacaxipehualiztli est une période rituelle ("Dépouillement des Hommes"), pas un être ou un titre.

**Changement :**

| Avant                                         | Après                                                     |
| --------------------------------------------- | --------------------------------------------------------- |
| `Blood Cultist` / Source : Tlacaxipehualiztli | `Flayed Cultist` ou `Xipe Totec Zealot`                   |
| —                                             | Source : Tlacaxipehualiztli (festival), Xipe Totec (dieu) |

> Xipe Totec : dieu du renouveau, de l'agriculture, revêtu de peau humaine. Excellent enemi mécanique — vie régénérée, armure-peau, etc.

---

### 1.4 — Slave : "Frost Witch | Snegurochka" — pas une sorcière

**Problème :** Snegurochka = "Jeune Fille des Neiges", figure douce de conte / tradition du Nouvel An. Baba Yaga est la vraie figure de sorcière.

**Changement :**

| Avant                                | Après                                                                                               |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `Frost Witch` / Source : Snegurochka | `Snow Maiden` / Source : Snegurochka                                                                |
| —                                    | Nouvelle entrée : `Morana` (déesse slave de l'hiver et de la mort) si on veut une sorcière de glace |

> **Morana / Mara** — déesse slave du froid mortel et de la nuit d'hiver. Très forte pour un ennemi élite ou un boss alternatif.

---

### 1.5 — Africain : Eshu/Elegba vs Papa Legba — attention au mélange

**Problème :** deux figures issues de traditions différentes :

- **Eshu / Elegba** — orisha Yoruba (Nigeria), maître des carrefours, du langage, trickster divin
- **Papa Legba** — lwa Vodou (diaspora haïtienne), gardien des portes entre les mondes

Les deux sont légitimes, mais les fusionner sans précision crée du flou culturel.

**Options :**

**Option A** _(court terme)_ — Clarifier dans la note du biome : "AFRICAN inclut les traditions yoruba et leurs héritages diasporiques (Vodou)."

**Option B** _(long terme)_ — Séparer en deux biomes :

- `YORUBA` / `AKAN` — traditions d'Afrique de l'Ouest
- `VODUN` — diaspora (Haïti, Louisiane) avec ses propres figures

> Pour l'instant, Option A suffit. Documenter l'intention pour une future expansion.

---

## 2. La métahistoire — Panlibrarium

### Concept central

**Le Panlibrarium** est une bibliothèque universelle qui contient toutes les histoires jamais écrites — mythes, épopées, légendes, contes populaires. Chaque biome est un _Tome_ vivant.

Mais quelque chose corrompt les Tomes.

Les histoires s'effacent. Des pages disparaissent. Des personnages oublient leur rôle. Des héros deviennent des monstres sans raison. L'encre elle-même se rebelle.

Le joueur incarne un **Archiviste** — un gardien du Panlibrarium — qui plonge dans les Tomes corrompus pour les restaurer. Chaque run est une mission de préservation.

### L'encre comme ressource diégétique

Le mécanisme d'encre existant (`Ink gauge`) devient narrativement central :

> "L'encre, c'est ce qui maintient les histoires en vie. Sans elle, les personnages s'effacent. Avec trop, ils débordent de leurs pages."

- **Ink faible** → les ennemis commencent à "glitcher", perdre leur forme
- **Ink débordant** → les histoires se contaminent entre elles (ennemis croisés : un Draugr avec des runes aztèques, un Jaguar avec une armure grecque)

### L'antagoniste : la Censure

Ce qui corrompt le Panlibrarium, c'est **la Censure** — pas une personne, une force. L'idée que certaines histoires sont trop dangereuses, trop subversives, trop libres pour exister.

La Censure n'efface pas au hasard : elle cible les histoires de résistance, de transgression, de tricksters, de chaos créateur. Elle veut un Panlibrarium "propre", "ordonné", "sûr".

> Ce faisant, elle détruit exactement ce qui rend les histoires vivantes.

---

## 3. Les trois couches narratives

### Couche A — Cadre (métahistoire)

Simple, forte, compatible avec la rejouabilité :

- Tu es un Archiviste
- Tu plonges dans des Tomes corrompus
- Chaque run = une nouvelle tentative de restauration
- Tu peux échouer — le Tome se referme, tu recommences

Ce cadre explique naturellement pourquoi tu "recommences" — chaque run est un plongeon différent dans les mêmes Tomes, mais les chemins changent parce que la corruption change.

### Couche B — Histoire du run (events + choix)

Chaque run a sa propre micro-narration :

- **Events** : rencontres textuelles avec choix et conséquences
- **Quêtes de run** : serments, prophéties, contrats (voir section 6)
- **PNJ récurrents** : personnages qui traversent les Tomes et te reconnaissent
- **Flags** : tes choix laissent des traces (`mirror_saved`, `oath_broken`, `hubris_3`)

### Couche C — Micro-lore ambiant

La sauce qui imprègne tout sans jamais bloquer le gameplay :

- **Flavor texts** sur les cartes et reliques
- **Codex** qui se remplit (ennemis, boss, dieux, concepts mythiques)
- **Annotations** : l'Archiviste précédent a laissé des notes dans les marges
- **Dialogues de boss** qui varient selon ton hubris / réputation / serments

---

## 4. Chapitres = Difficultés

Chaque niveau de difficulté est un **Chapitre** de l'histoire du Panlibrarium. La corruption s'approfondit à chaque chapitre.

### Vue d'ensemble

| Chapitre | Difficulté   | Thème narratif                           | État du Panlibrarium                                        |
| -------- | ------------ | ---------------------------------------- | ----------------------------------------------------------- |
| I        | Découverte   | Premier plongeon, anomalie détectée      | Corruption légère — quelques pages arrachées                |
| II       | Perturbation | La corruption s'étend                    | Tomes entiers contaminés — croisements begin                |
| III      | Corruption   | Les Tomes se contaminent mutuellement    | Ennemis hybrides — les histoires se mélangent               |
| IV       | Effacement   | La Censure agit activement               | Des biomes entiers disparaissent — le Panlibrarium rétrécit |
| V        | Amnésie      | Dernière chance avant l'effacement total | Seul l'Archiviste se souvient                               |

### Boss par chapitre et biome

Chaque chapitre propose 2 boss par biome (tirés aléatoirement du pool). À mesure que les chapitres avancent, les boss gagnent des mécaniques supplémentaires liées à la Censure.

**Chapitre I — Les Tomes s'éveillent**

| Biome    | Boss 1              | Boss 2             | Mécanique chapitre |
| -------- | ------------------- | ------------------ | ------------------ |
| LIBRARY  | Archiviste Corrompu | Golem d'Encre      | Tutoriel — basique |
| VIKING   | Fenrir              | Hel                | Standard           |
| GREEK    | Méduse              | Aspect de l'Hydre  | Standard           |
| EGYPTIAN | Avatar de Râ        | Judgment of Osiris | Standard           |
| _..._    |                     |                    |                    |

**Chapitre III — Corruption avancée**

Les boss commencent à "fuir" de leurs Tomes d'origine. Un boss Viking peut apparaître dans un biome Grec avec des mécaniques mélangées. La corruption est visible dans leurs designs et dialogues.

**Chapitre V — Effacement**

Tous les boss ont une phase "Censuré" — une forme altérée où ils perdent leur identité mythologique et deviennent des entités grises, sans nom, sans histoire. C'est ça la vraie menace.

---

## 5. Principes mythiques → mécaniques

Chaque biome a 1–2 principes mythiques transformés en mécaniques persistantes dans le run.

### GREEK — Hubris / Némésis

```
hubris : compteur 0-10
```

- Augmente quand tu fais des choix "greedy" (puissance immédiate, richer rewards)
- Au-dessus de 5 : les élites ont des buffs supplémentaires
- Au-dessus de 8 : modification du boss (mécanique punitive débloquée)
- Events hubris : le miroir, l'oracle, l'offre divine

### EGYPTIAN — Maât / Balance du Cœur

```
maatBalance : -5 à +5
```

- Choix équilibrés → +1 (soin d'un ennemi blessé, refus d'un loot excessif)
- Choix violents ou chaotiques → -1
- Checks lors d'events : "le cœur est trop lourd" (seuil négatif → malus)
- Lié au boss `Judgment of Osiris` : la pesée du cœur devient un vrai check mécanique

### VIKING — Serment / Renom

```
activeOath : { type, condition, reward, wyrd }
```

- Au début du biome : possibilité de prêter serment ("Je vengerai les Einherjar", "Je ne fuirai aucun élite")
- Serment tenu → `boon` (bonus permanent pour le run)
- Serment brisé → `wyrd` (malédiction narrative : un ennemi te traque, un buff est retiré)
- Le Renom débloque des dialogues avec la Valkyrie récurrente

### LOVECRAFTIAN — Savoir / Folie

```
insight : 0-10
```

- Chaque carte très puissante apprise, chaque relique cosmique +1 insight
- Seuils de déverrouillage : à 3, 6, 9 → nouvelles options d'event et de commerce
- Mais : chaque seuil ajoute aussi des `Parasite Cards` au deck et fait apparaître des variantes d'ennemis plus complexes
- À 10 : le run bascule en mode "Outer Truth" (modificateur global)

### AZTEC — Sacrifice / Dette Solaire

```
solarDebt : 0-7
```

- Certains pouvoirs puissants coûtent du "sang" (HP sacrifiés volontairement)
- La dette solaire monte si tu refuses de payer — les dieux exigent
- Trop haute → le soleil "s'éteint" (modificateur : ennemis en mode nocturne, plus forts)

### AFRICAN — Récit / Mémoire d'Anansi

```
storiesKept : compteur
```

- Anansi est le gardien des histoires — chaque fois que tu "préserves" un element narratif (event pacifiste, codex complété), +1
- Déblocage d'options dans son event récurrent
- Lié au boss : Anansi te juge selon ce compteur

---

## 6. Formats narratifs à implémenter

Classés par priorité d'implémentation.

### P1 — Events (livre-jeu)

Court texte + 2-4 choix + conséquences mécaniques et lore.

Structure d'un event :

```typescript
interface NarrativeEvent {
  id: string;
  biome: Biome | "ANY";
  chapter?: number; // undefined = tous chapitres
  title: string;
  text: string;
  choices: EventChoice[];
  flags?: {
    // flags requis pour apparaître
    requires?: string[];
    excludes?: string[];
  };
}
```

### P2 — Quêtes de run (Serments / Prophéties)

Au début d'un biome ou d'un run : une quête optionnelle apparaît.

```typescript
interface RunQuest {
  id: string;
  biome: Biome;
  title: string; // "La Prophétie de l'Hydre"
  description: string; // ce qui t'est demandé
  condition: QuestCondition; // ex: { type: 'kill_elites', count: 2 }
  reward: QuestReward;
  conclusionText: string; // texte affiché à la complétion
}
```

### P3 — PNJ récurrents

Quelques personnages traversent les biomes, avec des variations selon tes flags :

| PNJ                  | Apparitions                | Rôle                                                                |
| -------------------- | -------------------------- | ------------------------------------------------------------------- |
| **Le Scribe Effacé** | LIBRARY, LOVECRAFTIAN, fin | Ancien Archiviste, perd ses souvenirs — te guide et t'alerte        |
| **La Valkyrie**      | VIKING, GREEK (guest)      | Te reconnaît selon ton Renom, offre des deals ou des avertissements |
| **Anansi**           | AFRICAN, puis tout biome   | Trickster — events à choix moraux complexes, toujours double sens   |
| **L'Inquisiteur**    | Ch. III+ dans tous biomes  | Agent de la Censure — boss optionnel ou marchand corrompu           |

### P4 — Boss avec forme variable

Le boss a une forme alternative débloquée / modifiée selon tes choix de run.

Exemple : **Judgment of Osiris**

- `maatBalance >= 3` → phase dialogue disponible : Osiris reconnaît un cœur équilibré, offre une alternative à la violence
- `maatBalance <= -3` → le boss commence avec un buff "Cœur Corrompu", mécanique de pénalité renforcée

### P5 — Codex (Vérité Fragmentée)

Textes courts débloqués après chaque rencontre notable :

- Pages arrachées (lore fragmenté intentionnellement)
- Marginalia : annotations d'un Archiviste précédent
- Contradictions : deux sources qui ne s'accordent pas → mystery hook

### P6 — Métaprogression narrative (Sceaux)

Après certains boss : récupération d'un **Sceau de Tome**.

Chaque Sceau révèle un fragment de vérité sur la Censure et l'antagoniste final.

```
Sceau 1 : "Des pages ont été arrachées avant toi."
Sceau 2 : "Les arracheurs portent des gants blancs."
Sceau 3 : "Ils disent agir pour protéger les lecteurs."
Sceau 4 : "Il y a un Bibliothécaire au-delà des Tomes."
Sceau 5 : "Le Bibliothécaire était autrefois comme toi."
```

---

## 7. Exemples d'events

### Event grec : "Le Miroir de Bronze"

> _Tu trouves un miroir poli, trop parfait. Une inscription court sur le cadre : "Regarde-toi et juge."_

| Choix                         | Effet mécanique                                      | Effet lore                                    |
| ----------------------------- | ---------------------------------------------------- | --------------------------------------------- |
| "Je me contemple."            | +1 hubris, +1 carte rare, ajoute malédiction `Stare` | Tu as vu quelque chose que tu n'aurais pas dû |
| "Je brise le miroir."         | -1 hubris, relique `Shards of Humility`              | L'oracle se tait pour ce run                  |
| "Je le recouvre et le range." | +1 maatBalance, rien immédiatement                   | Flag `mirror_saved` → event de suivi possible |

---

### Event slave : "La Maison qui Tourne"

> _Une isba sur pattes de poule tourne lentement dans la clairière. La porte s'ouvre. Une voix : "Entre ou passe. Mais ne reste pas entre les deux."_

| Choix                          | Effet mécanique                                 | Effet lore                            |
| ------------------------------ | ----------------------------------------------- | ------------------------------------- |
| "J'entre."                     | Combat Baba Yaga (version réduite) ou deal rare | Elle t'évalue — respect ou dévoration |
| "Je passe sans m'arrêter."     | Rien immédiatement, flag `refused_baba`         | Elle se souviendra                    |
| "Je salue et demande conseil." | +1 carte de soutien, -5 HP                      | L'hospitalité slave a un prix         |

---

### Event de la Censure (Ch. III+) : "La Page Blanche"

> _Une page flotte dans l'air. Elle était écrite — tu peux voir les traces d'encre effacée. Au centre, un mot reste : "OUBLIE."_

| Choix                          | Effet mécanique                                               | Effet lore                              |
| ------------------------------ | ------------------------------------------------------------- | --------------------------------------- |
| "Je tente de relire l'effacé." | -5 HP, mais fragment Codex débloqué                           | Tu résistes à la Censure                |
| "J'accepte l'oubli."           | Une carte aléatoire du deck est retirée (permanente), gain or | La Censure progresse                    |
| "Je brûle la page."            | +1 insight, +1 hubris                                         | Tu détruis avant qu'elle ne te détruise |

---

## 8. Structure en 9 beats (histoire globale)

Histoire complète sur l'ensemble des chapitres, data-driven, sans cutscenes.

| Beat  | Moment               | Contenu                                                                                                                                                                                                                |
| ----- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | Chapitre I — LIBRARY | Anomalie dans l'encre. Le Scribe Effacé t'accueille et t'alerte. Premier Tome corrompu.                                                                                                                                |
| **2** | Premier boss tué     | Tu récupères un Fragment d'Index — preuve que des pages ont été arrachées _de l'intérieur_.                                                                                                                            |
| **3** | Fin Chapitre I       | Premier Sceau. Révélation : la corruption n'est pas naturelle. Quelqu'un fait ça.                                                                                                                                      |
| **4** | Chapitre II — milieu | Le Scribe Effacé réapparaît, encore plus fragmenté. Il t'a reconnu — ou croit te reconnaître. L'Inquisiteur apparaît pour la première fois.                                                                            |
| **5** | Fin Chapitre II      | Sceau 2-3. Tu comprends que les "arracheurs" sont organisés. Le Panlibrarium rétrécit.                                                                                                                                 |
| **6** | Chapitre III         | Ennemis hybrides (Tomes contaminés). Choix moral majeur : aider un biome en se sacrifiant, ou continuer. L'Inquisiteur te propose un deal.                                                                             |
| **7** | Chapitre IV          | Sceau 4-5. Tu sais qu'il y a un Bibliothécaire. Les biomes commencent à "s'éteindre" (zones grises).                                                                                                                   |
| **8** | Avant le boss final  | Le Scribe Effacé révèle la vérité : il était l'Archiviste avant toi. C'est lui qui a commencé la Censure — pour "protéger" les lecteurs d'histoires trop dangereuses. Il a perdu ses souvenirs en s'effaçant lui-même. |
| **9** | Boss final           | Le Censeur. Choix d'ending selon tes flags.                                                                                                                                                                            |

---

## 9. Boss final — Le Censeur

### Identité

**Le Grand Bibliothécaire / Le Censeur**

Pas un dieu. Pas un démon. Un Archiviste — comme toi.

Il a décidé un jour que certaines histoires étaient trop violentes, trop chaotiques, trop irrévérencieuses. Il a commencé à "nettoyer" le Panlibrarium. Puis il n'a plus pu s'arrêter.

Il se souvient de toi — parce qu'il était toi, dans une autre run, dans un autre temps.

> _"Je fais ce que tu ferais si tu voyais ce que j'ai vu. Les histoires ne sont pas innocentes. Elles créent des dieux. Elles appellent des monstres. Je les protège d'elles-mêmes."_

### Arène

La Salle Centrale du Panlibrarium — un espace entre tous les Tomes. Des pages brûlent. Des étagères s'effondrent. Les biomes s'y superposent en fragments.

### Mécaniques (vision)

**Phase 1 — L'Éditeur**

- Il "censure" tes cartes : les retire temporairement du deck, les "blanchit"
- Tes reliques perdent leurs effets l'une après l'autre
- Il parle pendant le combat — ses dialogues changent selon tes flags

**Phase 2 — L'Effacement**

- Il commence à s'effacer lui-même — ses PV sont cachés
- Chaque attaque qui le touche révèle un fragment de son histoire
- Si `storiesKept` est haut : Anansi intervient (soutien narratif)
- Si `hubris` est haut : Némésis s'active (il est renforcé)
- Si `maatBalance` est positif : une balance apparaît — mécanique de jugement disponible

**Phase 3 — Le Manuscrit**

- Il devient le Tome lui-même
- Il faut "lire" ses attaques pour les prévoir (mécanique d'identification d'intent étendue)
- Ending déterminé ici selon les sceaux récupérés et les flags majeurs

### Endings (vision)

| Condition                                     | Ending                                                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Tous sceaux + `mirror_saved` + serments tenus | **Restauration** — le Bibliothécaire se souvient, les histoires reviennent                   |
| Victoire sans sceaux                          | **Silence** — tu gagnes, mais le Panlibrarium reste vide. Tu ne sais pas ce que tu as sauvé. |
| `hubris >= 8` à la victoire                   | **Réécriture** — tu prends sa place. Même fauteuil. Même logique.                            |
| Mort en Chapitre V                            | **Effacement** — tu rejoins les pages perdues. Le Scribe Effacé gagne un fragment de plus.   |

---

## Notes de développement

### Philosophie de design narratif

> Ne pas raconter l'histoire **au** joueur. Laisser le joueur **découvrir** l'histoire à travers ses choix.

Chaque run est une histoire différente parce que le joueur fait des choix différents. La métanarration existe pour que ces choix aient du poids au-delà du mécanique.

La Censure comme antagoniste est thématiquement cohérente avec le Panlibrarium : l'ennemi final, c'est celui qui voudrait que les histoires soient "sûres". Ce jeu dit le contraire.

---

## 10. Roadmap — Dans quel ordre faire les choses

> Chaque phase est indépendante et livrable. Ne pas sauter une phase sans avoir livré la précédente — chaque phase valide les fondations de la suivante.

### État actuel du code (référence)

Ce qui existe déjà et est directement exploitable :

| Système                                        | État                                           | Fichier                         |
| ---------------------------------------------- | ---------------------------------------------- | ------------------------------- |
| `GameEvent` / `EVENTS`                         | ✅ Existe, ~15 events simples                  | `src/game/engine/run.ts`        |
| `event.condition: (RunState) => boolean`       | ✅ Déjà filtrable par état                     | `run.ts`                        |
| `histoireDefinitions` (45 histoires par biome) | ✅ Existe — c'est déjà du lore métaprogression | `src/game/data/histoires.ts`    |
| `difficulty.ts` (niveaux 0–4)                  | ✅ Existe, purement numérique                  | `src/game/engine/difficulty.ts` |
| `RunState`                                     | ✅ Existe, sans stats narratives               | `src/game/schemas/run-state.ts` |
| `pickEvent(rng, difficulty, runState?)`        | ✅ Sélection déjà filtrée                      | `run.ts`                        |

Ce qui **n'existe pas encore** mais est nécessaire :

- `RunState.flags` — map de flags narratifs par run
- `RunState.hubris` / `maatBalance` / etc. — stats mythiques
- `GameEvent.biome` — filtre par biome sur les events
- ~~Nommage "Chapitre" dans l'UI de sélection de difficulté~~ ✅ fait

---

### Phase 1 — Lore quick wins _(aucune logique, données seulement)_

> Durée estimée : une session. Impact : immédiat sur la cohérence mythologique.

**1.1 Renames dans `src/game/data/enemies.ts`**

- [x] `Eye of Osiris` → `Judgment of Osiris` (boss EGYPTIAN)
- [x] `Desert Cobra` → split en `Apep Scion` (chaos) + `Wadjet Guardian` (protecteur)
- [x] `Blood Cultist` → `Flayed Cultist` (source : Xipe Totec / Tlacaxipehualiztli)
- [x] `Frost Witch` → `Snow Maiden` (source : Snegurochka, pas Baba Yaga)

**1.2 Mise à jour `docs/mythologie.md`**

- [x] Corriger les entrées correspondantes dans les tableaux
- [x] Ajouter note de biome AFRICAN : "inclut traditions Yoruba et héritages diasporiques (Vodou)"

---

### Phase 2 — Branding narratif de la difficulté _(UI seulement)_

> Durée estimée : une session. Impact : donne une identité narrative aux difficultés sans toucher à la logique.

La logique numérique (0–4) reste intacte. On ajoute seulement un label narratif dans l'UI.

| Niveau | Nom mécanique | Nom narratif                   | Sous-titre                   |
| ------ | ------------- | ------------------------------ | ---------------------------- |
| 0      | Difficulté 0  | **Chapitre I — Éveil**         | _L'anomalie dans l'encre_    |
| 1      | Difficulté 1  | **Chapitre II — Perturbation** | _Les Tomes se contaminent_   |
| 2      | Difficulté 2  | **Chapitre III — Corruption**  | _Les histoires se mélangent_ |
| 3      | Difficulté 3  | **Chapitre IV — Effacement**   | _La Censure agit_            |
| 4      | Difficulté 4  | **Chapitre V — Amnésie**       | _Dernière chance_            |

- [x] Ajouter `chapter` et `subtitle` dans les fichiers i18n (`fr.ts` / `en.ts`) pour chaque niveau
- [x] Afficher le nom de chapitre dans `RunDifficultySelectScreen.tsx` (badge + sous-titre italique)
- [x] Afficher le nom de chapitre dans le header de run (`GameLayout.tsx`, sous "Panlibrarium")

---

### Phase 3 — Système de flags + enrichissement des events _(fondation narrative)_

> C'est la phase clé. Elle débloque tout ce qui vient après. Durée : 2–3 sessions.

Le système de flags est minimal : `RunState.flags: Record<string, boolean>`.
La `condition` des events existe déjà — il suffit de la brancher.

**3.1 Ajouter `flags` à RunState**

- [ ] Ajouter `flags?: Record<string, boolean>` au schéma Zod de `RunState`
- [ ] Vérifier que les migrations DB gèrent les runs anciens (valeur par défaut `{}`)

**3.2 Helpers dans `run.ts`**

- [ ] `setFlag(state, key)` → retourne un nouveau RunState avec le flag posé
- [ ] `hasFlag(state, key)` → boolean
- [ ] Ajouter `biome?: BiomeType | 'ANY'` à l'interface `GameEvent` pour filtre biome
- [ ] Mettre à jour `pickEvent` pour filtrer par biome actif du run

**3.3 Enrichir les events existants**

- [ ] Réécrire les textes des ~15 events actuels avec flavor Panlibrarium (en français)
- [ ] Ajouter des flags sur les choix qui le méritent (`mirror_saved`, `refused_baba`, etc.)

**3.4 Nouveaux events pilotes (3 events)**

- [ ] `bronze_mirror` — Le Miroir de Bronze (GREEK, voir section 7)
- [ ] `turning_house` — La Maison qui Tourne (RUSSIAN)
- [ ] `white_page` — La Page Blanche (ANY, difficulté >= 2)

---

### Phase 4 — Première stat mythique : `hubris` _(GREEK)_

> Une seule stat pour valider le modèle. Durée : 1–2 sessions.

Commencer par `hubris` (GREEK) car :

- c'est le biome le plus riche en events possibles
- la mécanique est simple (compteur 0–10, effets à des seuils)
- facile à afficher dans l'UI sans redesign majeur

- [ ] Ajouter `hubris?: number` à `RunState` (défaut 0)
- [ ] Helper `modifyHubris(state, delta)` dans `run.ts`
- [ ] Brancher `hubris` dans les events GREEK (Le Miroir de Bronze en priorité)
- [ ] Ajouter 1 effet à seuil dans `enemies.ts` : si `hubris >= 6` lors du combat contre Medusa → buff "Nemesis" actif
- [ ] Afficher `hubris` dans l'UI (icône discrète dans les stats de run, visible seulement en biome GREEK)

---

### Phase 5 — Scribe Effacé (PNJ récurrent minimal) _(narration visible)_

> Le premier vrai personnage narratif. Durée : 1 session (texte) + 1 session (UI).

Implémenter comme des events spéciaux — pas de système PNJ complexe, juste des events avec `id` reconnaissable.

- [ ] Event `scribe_intro` : rencontre initiale en LIBRARY (obligatoire, premier run ou premier biome)
- [ ] Event `scribe_warning` : réapparition en LOVECRAFTIAN ou biome 3+ (condition : `floor >= 8`)
- [ ] Event `scribe_reveal` : avant le boss final (condition : `floor >= MAX_FLOORS - 1` + flag `scribe_seen`)
- [ ] Les textes doivent fonctionner sans flags et sans stats complexes dans un premier temps

---

### Phase 6 — `maatBalance` + boss Judgment of Osiris enrichi _(EGYPTIAN)_

> Valider le modèle sur un deuxième biome, avec un boss qui réagit. Durée : 2 sessions.

- [ ] Ajouter `maatBalance?: number` à `RunState` (range -5 à +5, défaut 0)
- [ ] 3 nouveaux events EGYPTIAN utilisant `maatBalance`
- [ ] Dans `enemies.ts` : `Judgment of Osiris` gagne une mécanique conditionnelle selon `maatBalance`
  - positif → phase dialogue, HP réduit ou debuff sur le boss
  - négatif → buff "Cœur Corrompu" sur le boss

---

### Phase 7 — Quêtes de run (serments / prophéties) _(VIKING en priorité)_

> Durée : 2–3 sessions. Nécessite les phases 3 + flags.

- [ ] Définir l'interface `RunQuest` dans `run.ts`
- [ ] Ajouter `activeQuest?: RunQuest` à `RunState`
- [ ] Implémenter `checkQuestCompletion(state)` appelé à chaque fin de combat
- [ ] 2 quêtes pilotes en VIKING (serment d'élite, serment de renom)
- [ ] UI : afficher la quête active dans le header (à côté des stats de run)

---

### Phase 8 — Sceaux de Tome (métaprogression narrative)

> Nécessite les phases 3–5. Durée : 2 sessions.

Les sceaux sont une forme de métaprogression — comme les `histoireDefinitions` mais narratifs.

- [ ] Ajouter `collectedSeals?: string[]` à `RunState`
- [ ] Générer un sceau après certains boss (logique dans `rewards.ts`)
- [ ] Écran ou modal "Fragment découvert" après réception
- [ ] 5 textes de sceaux (voir section 6 — P6)
- [ ] Afficher les sceaux collectés dans un onglet du Codex ou de l'écran de fin de run

---

### Phase 9 — Boss final : Le Censeur _(objectif long terme)_

> Nécessite toutes les phases précédentes. Durée : plusieurs sessions.

- [ ] Créer l'entrée boss `the_censor` dans `enemies.ts`
- [ ] Implémenter la Phase 1 (censure des cartes) — mécanique custom
- [ ] Implémenter la Phase 2 (HP cachés, révélation par dommages)
- [ ] Brancher les flags majeurs sur les mécaniques de phase 2
- [ ] Implémenter les 4 endings via flags dans l'écran de victoire
- [ ] Textes de dialogue dynamiques selon `hubris`, `maatBalance`, `storiesKept`

---

### Vue synthétique

```
Phase 1  ✅ Lore renames (enemies.ts, mythologie.md)          [données]
Phase 2  ✅ Branding chapitres dans l'UI difficulté           [UI seulement]
Phase 3     flags + events enrichis + 3 events pilotes        [fondation]
Phase 4     hubris (GREEK)                                    [première stat]
Phase 5     Scribe Effacé (3 events PNJ)                      [narration visible]
Phase 6     maatBalance + boss réactif (EGYPTIAN)             [validation modèle]
Phase 7     Quêtes de run — serments (VIKING)                 [format quest]
Phase 8     Sceaux de Tome (métaprogression narrative)        [macro-histoire]
Phase 9     Boss final — Le Censeur                           [endgame]
```

> **Règle d'or :** chaque phase doit être jouable et satisfaisante en elle-même. Ne jamais attendre la Phase 9 pour que le jeu "ait du sens".

---

_Document créé le 2026-03-02. À enrichir au fil du développement._
