# Monster Background - TODO

Objectif: enrichir chaque ennemi avec des elements mythologiques lisibles et debloquables, integres au systeme de background/unlock deja en place de facon minimale.

## Intention

- Donner au joueur une raison narrative de consulter le bestiaire.
- Relier chaque ennemi a son mythe, sa source culturelle et ses episodes connus.
- Eviter le lore generique: chaque entree doit apprendre quelque chose de concret.
- Garder un ton court, clair, exploitable en UI.

Exemple cible pour `fenrir`:

- Fenrir est un loup geant de la mythologie nordique.
- Il est le fils de Loki et de la geante Angrboda.
- Les dieux l'attachent avec le lien magique Gleipnir.
- Tyr accepte de mettre sa main dans la gueule de Fenrir comme gage; Fenrir lui arrache le bras quand il comprend la tromperie.
- Au Ragnarok, Fenrir tue Odin avant d'etre tue par Vidar.

## Systeme souhaite

- Utiliser les unlocks de background de personnage/ennemi deja presents plutot que creer un systeme separe.
- Debloquer les informations par paliers de maitrise ou de rencontres:
  - palier 1: identification courte et origine mythologique.
  - palier 2: episode ou attribut marquant.
  - palier 3: lien avec d'autres figures, symbolique, variante ou consequence dans le mythe.
- Afficher ces paliers dans le bestiaire avec etat verrouille/deverrouille.
- Garder les boss plus riches que les ennemis standards.

## Taches contenu

- [ ] Inventorier tous les ennemis actifs par biome depuis `src/game/data/enemies.ts` et `src/game/data/enemy-bosses/`.
- [ ] Definir un format de texte par ennemi: `summary`, `origin`, `mythFacts[]`, `unlockedBackground[]` ou equivalent.
- [ ] Rediger une premiere passe pour les boss majeurs:
  - [ ] `fenrir`
  - [ ] `hel_queen`
  - [ ] `medusa`
  - [ ] `hydra_aspect`
  - [ ] `osiris_eye` / boss egyptiens associes
  - [ ] `ra_avatar`
  - [ ] `quetzalcoatl_wrath`
  - [ ] `tezcatlipoca_echo`
  - [ ] `koschei_deathless`
  - [ ] `baba_yaga_hut`
  - [ ] `anansi_weaver`
  - [ ] `soundiata_spirit`
  - [ ] `dagda_shadow`
  - [ ] `cernunnos_shade`
- [ ] Rediger ensuite les ennemis standards, biome par biome.
- [ ] Verifier les faits mythologiques avant integration.
- [ ] Eviter les inventions presentees comme des faits; separer clairement adaptation du jeu et source mythologique.

## Taches implementation

- [ ] Localiser ou etendre la structure actuelle de bestiaire/background.
- [ ] Brancher les textes sur les compteurs deja existants (`enemyKillCounts`, entrees rencontrees, maitrise ennemi).
- [ ] Ajouter les cles i18n FR/EN si le contenu doit etre traduit.
- [ ] Ajouter un affichage UI par palier dans `BestiaryClient`.
- [ ] Ajouter un fallback propre pour les ennemis sans texte final.
- [ ] Ajouter un test qui signale les ennemis actifs sans background.

## Definition of done

- Tous les boss actifs ont au moins 3 paliers de background mythologique.
- Tous les ennemis standards actifs ont au moins 2 paliers.
- Le bestiaire montre ce qui est debloque et ce qui reste a decouvrir.
- Les textes distinguent clairement le mythe source et l'adaptation Panlibrarium.
