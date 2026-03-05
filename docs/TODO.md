# Panlibrarium - TODO

## Fait

### Gameplay core

- [x] Combat loop complet (joueur/ennemis, energie, block, pioche, defausse)
- [x] Systeme Ink + powers (REWRITE, LOST_CHAPTER, SEAL)
- [x] Variantes Inked
- [x] Buffs/debuffs principaux (POISON, STRENGTH, WEAK, VULNERABLE, FOCUS, THORNS)
- [x] Buff BLEED (saignement, expire par duree uniquement, distinct du POISON)
- [x] RNG seedee reproductible
- [x] Preview degats entrants (affichage des intentions ennemies avec estimation de degats)

### Progression run

- [x] 5 etages (`MAX_FLOORS = 5`)
- [x] Difficulte croissante par etage
- [x] HP ennemis scales par floor
- [x] Chance elite augmente par floor
- [x] Taille des groupes ennemis augmente par floor
- [x] Selection ennemis ponderee par difficulte (`tier`) + etage

### Contenu

- [x] Cartes lootables pour tous les biomes (LIBRARY + 8 biomes)
- [x] Ennemis pour tous les biomes (normaux + elite + boss)
- [x] Multi-boss (deux boss par biome, choix aleatoire)
- [x] Relique unique par boss (18 reliques boss-specifiques, debloquees apres 3 victoires sur ce boss)
- [x] Cartes bestiaire: 1 carte biome par ennemi normal (unlock a 15 kills) + 1 carte rare par elite (unlock a 5 kills)
- [x] IA boss conditionnelle (poids conditionnels par situation, phase 2 differenciee)
- [x] 24+ ennemis supplementaires (2 normaux + 1 elite par biome hors LIBRARY, + Wadjet Guardian)
- [x] 23+ nouvelles cartes (7 ALWAYS LIBRARY + 8 COMMON biome + 8 UNCOMMON biome)
- [x] Unlocks progressifs tier 2 (BIOME_ELITE_KILLS count:2, BIOME_BOSS_KILLS count:2)
- [x] 8 nouvelles reliques a mecaniques reactives (turn-start, turn-end, card-played)
- [x] Renames lore : Judgment of Osiris, Apep Scion / Wadjet Guardian, Flayed Cultist, Snow Maiden

### Meta progression (Bibliotheque)

- [x] 45 histoires (9 biomes x 5)
- [x] Ressources biome + accumulation en fin de run
- [x] Gain ressources scale: normal < elite (x2) < boss (x4)
- [x] Bonus victoire run x1.5
- [x] `HEAL_AFTER_COMBAT` implemente
- [x] Bonus defensifs ajoutes: regen par tour + reduction premier hit

### Unlock cartes

- [x] Systeme cartes lock/unlock entre runs
- [x] Conditions supportees:
  - premiere entree biome
  - kill elite biome
  - kill boss biome
  - nb de runs completes par biome
  - kills par ennemi (ID precis)
  - unlock via histoire (arbre de competences)
- [x] Rewards cartes filtrees par cartes debloquees
- [x] Shop cartes filtre selon cartes debloquees

### Difficulte et Run Conditions

- [x] 6 niveaux de difficulte (0-5), debloquables progressivement apres victoires
- [x] Difficulte filtre cartes/reliques disponibles
- [x] Run Conditions de base (modificateurs de run) avec unlock progressif
- [x] 1 option de debut de fight par boss (deblocage a 3 kills de ce boss)
- [x] Conditions modifient: or de depart, HP max, cartes de depart, regles de map
- [x] Branding narratif chapitres (Chapitre I a VI + sous-titres lore dans l'UI difficulte)

### Systeme audio

- [x] Musique de fond par zone
- [x] SFX (jouer carte, hit, victoire...)
- [x] Toggle mute

### UI / admin / divers

- [x] Bouton `Dev Kill` visible uniquement pour role `ADMIN`
- [x] Ecran biome select entre floors + transitions
- [x] Choix de biome a l'ouverture du run (LIBRARY + 1 aleatoire)
- [x] Evenement relic garanti une fois par run (Sealed Reliquary)
- [x] HUD rewards ressources
- [x] Menu in-game (abandon run, mute, regles, logout)
- [x] Support mobile + fullscreen (detection orientation, prompt rotation)
- [x] Modal inspection deck complet
- [x] Systeme tooltips (descriptions buffs au survol)
- [x] Apercu upgrade carte au survol
- [x] Ecran setup de run (choix difficulte, condition de run, marchand de depart)
- [x] Leaderboard (page + classement global)
- [x] Minimap de progression de floor (`FloorMap`)

---

## A faire

### Equilibrage

- [ ] Passer d'un calibrage "fonctionnel" a un calibrage fin biome par biome (HP, degats, frequences)
- [ ] Ajuster les vitesses de progression des unlocks cartes (trop lent/trop rapide selon biome)
- [ ] Verifier la courbe difficulte floors 4-5 en conditions reelles

### Contenu cartes/enemies

- [ ] Enrichir le pool de cartes STATUS/CURSE (types implementes, peu de cartes)
- [ ] Enrichir les patterns conditionnels de boss (IA plus contextuelle)
- [ ] Ajouter des synergies inter-biomes plus marquees

### Meta progression

- [ ] Ajouter des personnages jouables supplementaires (decks/stats differents)
- [ ] Eventuelles histoires dediees a l'unlock de cartes precises (au lieu de regles generiques seulement)

### Narration & Histoire

> Voir `docs/evolution-histoire.md` pour le detail complet de chaque phase.

- [x] **Phase 3** — Events enrichis (narration 2 phases + biomes)
  - [x] Ajouter `biome?` et `flavorText?` a l'interface `GameEvent` + mise a jour de `pickEvent` (filtre biome courant)
  - [x] Ajouter `outcomeText?` a l'interface `EventChoice`
  - [x] UI 2 phases dans `EventRoom` : CHOIX → RÉSULTAT + bouton "Continuer" (fini l'auto-advance)
  - [x] Reecrire les 11 events neutres en i18n avec flavor Panlibrarium (fr + en)
  - [x] 3 events pilotes : Miroir de Bronze (GREEK), Maison qui Tourne (RUSSIAN), Page Blanche (ANY floor>=3)
  - [x] 3 events par biome — 21 nouveaux events biome-specifiques (GREEK, RUSSIAN, VIKING, EGYPTIAN, LOVECRAFTIAN, AZTEC, CELTIC, AFRICAN)
  - [x] Personnages recurrents introduits par biome (Pythie, Ariane, Zhar-Ptitsa, Kochtchei, Huginn, Valkyrie, Anubis, Thoth, Sphinx, Bibliothecaire Sans Nom, Quetzalcoatl, Prêtresse du Codex, Xolotl, Druide, Dame du Lac, Morrigan, Anansi, Griot, Nyame)
  - [ ] Ajouter `flags?: Record<string, boolean>` a `RunState` (schema Zod + migration DB) _(reporte en Phase 4+6)_
  - [ ] Helpers `setFlag` / `hasFlag` dans `run.ts` _(reporte en Phase 4+6)_

- [x] **Phase 5** — Scribe Efface (PNJ recurrent, 10 rencontres)
  - [x] `GameEvent.once?: boolean` + `RunState.seenEventIds` — events uniques par run
  - [x] `RunState.scribeAttitude: number` — suit la posture du joueur (+1 compassion / 0 neutre / -1 hostilite)
  - [x] Chaine narrative garantie par conditions `seenEventIds.includes(...)` (ordre preserve)
  - [x] 10 events sans recompense — lore pur, attitude uniquement :
    - `scribe_1_first_meeting` — LIBRARY, fl.1-2 (decouverte)
    - `scribe_2_lost_words` — LIBRARY, fl.1-2, req. #1 (pages dechireees)
    - `scribe_3_familiar_face` — ANY, fl.2+, req. #2 (il vous croit connu)
    - `scribe_4_torn_pages` — ANY, fl.2+, req. #3 (l'encre effacee)
    - `scribe_5_the_name` — ANY, fl.3+, diff>=1, req. #4 (il cherche son nom)
    - `scribe_6_the_warning` — ANY, fl.3+, diff>=2, req. #5 (l'avertissement)
    - `scribe_7_the_other` — ANY, fl.3+, diff>=2, req. #6 (il parle de lui sans le savoir)
    - `scribe_8_the_truth` — ANY, fl.4+, diff>=3, req. #7 (l'Archiviste d'avant)
    - `scribe_9_the_choice` — ANY, fl.4+, diff>=4, req. #8 (ce que tu ferais)
    - `scribe_10_the_reveal` — ANY, fl.4+, diff>=5, req. #9 (il est le Censeur)
  - [x] Persistance metaprogression dans `UserProgression.resources` (via `endRunAction`) :
    - 10 cles `__SCRIBE_1_ATT` … `__SCRIBE_10_ATT` — reponse individuelle par rencontre
    - Encodage : 0/absent = pas vue, 1 = hostile, 2 = neutre, 3 = compassion
    - Ecrasement a chaque run (garde la reponse la plus recente)
    - `RunState.scribeChoices` — map eventId → delta (-1/0/+1) enregistre via `applyEventChoice`
  - [ ] Hook boss final : Le Censeur reagit selon `scribeAttitude` (positif / neutre / negatif) _(Phase 9)_

- [ ] **Phase 4+6** — Stats mythiques (sprint unique)
  - `hubris?: number` a `RunState` (GREEK, 0-10)
  - `maatBalance?: number` a `RunState` (EGYPTIAN, -5 a +5)
  - Events biome-specifiques branchant ces stats
  - `Judgment of Osiris` reagit a `maatBalance` (meca conditionnelle)
  - Affichage discret dans l'UI pendant le run

- [ ] **Phase 7** — Quetes de run (serments / propheties)
  - Interface `RunQuest` + `activeQuest` dans `RunState`
  - `checkQuestCompletion` a chaque fin de combat
  - 2 quetes pilotes VIKING + UI header

- [ ] **Phase 8** — Sceaux de Tome (metaprogression narrative)
  - Stocker via le systeme `resources` existant (cles `__SEAL_X`), pas dans `RunState`
  - Generer un sceau apres certains boss (`rewards.ts`)
  - 5 textes de sceaux revelant l'histoire de la Censure
  - Affichage dans l'ecran de fin de run

- [ ] **Phase 9** — Boss final : Le Censeur _(objectif long terme)_
  - Entree boss `the_censor` dans `enemies.ts` (asset SVG deja prevu dans `assets.ts`)
  - Mecanique "censure des cartes" (phase 1) — nouveau type d'effet engine
  - HP caches reveles par les degats (phase 2)
  - 4 endings selon flags majeurs + `hubris` + sceaux

### Bestiaire (Encyclopedie des ennemis)

- [x] **Systeme de decouverte** — stocker les IDs d'ennemis rencontres dans la metaprogression (DB, cle `encounteredEnemies`)
  - Enregistrer la premiere rencontre d'un ennemi en fin de combat
  - Distinguer : normal / elite / boss
- [x] **Donnees ennemis enrichies** — ajouter `loreText?`/`loreEntries?` (description narrative) a chaque entree dans `enemies.ts`
  - 3 paliers lore debloques par nombre de victoires:
    - normal: 1, 5, 15
    - elite: 1, 3, 5
    - boss: 1, 2, 3
- [x] **Page Bestiaire** — accessible depuis la Bibliotheque (hub)
  - Entrees verrouillees affichees avec silhouette + "???" avant rencontre
  - A la decouverte : nom, illustration (asset SVG existant), stats de base, description lore
  - Filtres par biome + type (normal / elite / boss)
- [x] **Notification** premiere decouverte en fin de combat ("Nouvelle entree dans le Bestiaire")

### UX / technique

- [ ] Historique de runs (query key existe, page manquante)
- [ ] Tutoriel/onboarding
- [ ] Option vitesse/skip animations
- [x] FloorMap — deduplication des salles combat en apercu
  - Si plusieurs salles combat ont le meme nombre d'ennemis, n'en afficher qu'une seule
  - Conserver toutes les salles si les nombres d'ennemis sont differents (ex: 1 ennemi vs 2 ennemis = afficher les deux)
  - Les salles non-combat (Marchand, Evenement, Pre-Boss) ne sont jamais deduplicees
