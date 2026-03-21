# Panlibrarium - Meta progression: La Bibliotheque

## Etat actuel (mis a jour)

Ce document decrit l'etat reel implemente dans le code.

## Ressources

Chaque combat donne la ressource principale du biome.

Scaling actuel:

- Normal: base
- Elite: ~x1.35
- Boss: ~x2.2
- Multiplicateur biome:
  - `LIBRARY`: x1.5
  - autres biomes: x0.7
- Bonus run gagne: x1.25 sur les ressources gagnees
- Re-clear d'une difficulte deja validee: multiplicateur final x0.7
- Bonus cross-biome: 25% de chance de gagner +1 ressource d'un autre biome

## Histoires et bonus

- 45 histoires (9 biomes x 5)
- Les couts ne suivent plus une matrice strictement fixe:
  - les noeuds les plus puissants ont ete remontes
  - certains tier 2 plus modestes ont ete legerement abaisses
  - les cross-cost `PAGES` les plus favorises ont ete augmentes
- Bonus permanents agreges via `computeMetaBonuses()`
- Application des bonus en debut de combat via `applyMetaBonusesToCombat()`

Bonus notables maintenant actifs:

- `HEAL_AFTER_COMBAT` (heal applique a chaque fin de combat)
- `STARTING_REGEN` (regen en debut de tour)
- `STARTING_FOCUS`
- `FIRST_HIT_DAMAGE_REDUCTION` (reduction sur le premier hit subi du combat)
- `ALLY_SLOTS` (capes a 3 au total)
- `LOOT_LUCK`
- Ink per card separe en:
  - `INK_PER_CARD_CHANCE`
  - `INK_PER_CARD_VALUE`

## Difficulte de run (entre runs)

Systeme de difficulte progressif entre runs:

- 6 niveaux (0-5), niveau 0 toujours disponible
- Unlock progressif: gagner a la difficulte max actuelle debloque la suivante
- Deblocage suivi par personnage, avec retrocompat pour le Scribe
- Plus de gating cartes/reliques par difficulte
- Paliers gameplay notables:
  - diff 3: intents d'elite/boss caches tous les 3 tours, bosses avec block de depart par floor, debuffs boss qui bypass le block
  - diff 4: memes regles etendues aux elites, +1 stack sur les debuffs de boss
  - diff 5: plus de pression sur elites/packs/events, debuffs de tous les ennemis qui bypass le block, elites pouvant ne pas drop de relique
- Fichier: `src/game/engine/difficulty.ts`

## Run Conditions (modificateurs de run)

Etat reel au 15 mars 2026:

- `51` conditions definies au total, en comptant les variantes `boss_start_option_*`
- `8` conditions immediatement disponibles au tout debut
- progression ensuite par paliers de `1-7 runs`, `1-3 victoires`, loot de carte specifique, ou `2 kills` d'un boss pour les starts de boss
- cadence volontairement plus front-loaded qu'avant:
  - premiers nouveaux starts des `runs 1-3`
  - milieu de progression renforce entre `runs 3-5`
  - quelques conditions restent plus aspirationales (`boss_rush`, `fateful_manuscript`, starts de boss multiples)

Exemples de conditions de base toujours visibles tres tot:

- `quiet_pockets`
- `tempered_flesh`
- `open_grimoire`
- `inked_beginning`
- `battle_manual`
- `packed_supplies`

Exemples de conditions qui arrivent maintenant plus vite:

- `fractured_archive`: `3 runs + 1 win`
- `chaos_draft`: `3 runs + 1 win`
- `cursed_compendium`: `3 runs`
- `inkwell_bargain`: `4 runs + 1 win`
- `boss_start_option_*`: `2 kills` du boss correspondant

Fichier: `src/game/engine/run-conditions.ts`

## Floors et difficulte en combat

- 3 floors (`MAX_FLOORS = 3`)
- Difficulte croissante par floor:
  - HP ennemis scale avec le floor
  - chance elite augmente avec le floor
  - taille max des packs augmente avec le floor
  - selection ennemis ponderee par `tier` + floor

## Progression cartes lock/unlock

Systeme implemente pour ajouter de la progression entre runs.

Conditions supportees:

- Premiere entree dans un biome
- Kill d'elite du biome
- Kill du boss du biome
- Nombre de runs completes dans un biome
- Deblocage conditionne par certaines histoires (arbre meta)
- Kills d'ennemis specifiques pour les cartes bestiaire

Cadence de design actuelle:

- les commons d'ouverture restent en `BIOME_FIRST_ENTRY`
- les uncommons de build importants doivent plutot arriver a `elite 1-2`, pas `elite 3` par defaut
- les rares signatures de build doivent plutot etre visibles au `premier boss clear` du biome que tres tard dans le metagame
- seules quelques cartes Library / meta restent volontairement plus composees via `ALL_OF`

Ce principe a ete renforce dans le pass du `2026-03-15` pour eviter qu'un build reste injouable faute d'une seule carte marquee trop tardive.

## Progression reliques

Cadence actuelle:

- reliques de mastery ennemi: `5 kills` sur normal, `3 kills` sur elite, `2 kills` sur boss
- reliques purement "progression de compte": cadence resserree sur `5-8 runs` ou `3-5 wins` selon l'impact
- reliques vraiment endgame conservees:
  - milestones de difficulte
  - reliques globales type `global_codex_prime`
  - objectifs tres hauts type `global_labyrinth_spiral`

L'objectif est d'avoir quelques reliques debloquees des les premieres runs sans vider toute la collection trop tot.

Effet gameplay:

- Rewards cartes filtrees par cartes debloquees
- Shop cartes filtre par cartes debloquees

Persistance:

- Les compteurs d'unlock sont persistes entre runs (dans la progression utilisateur)
- Snapshot des unlocks stocke dans le `RunState` pour coherence pendant un run

## Couverture contenu biome

Etat actuel:

- Tous les biomes ont des cartes lootables
- Tous les biomes ont des ennemis (normaux + elite + boss)

## Fichiers techniques principaux

- Meta engine: `src/game/engine/meta.ts`
- Run flow: `src/game/engine/run.ts`
- Rewards: `src/game/engine/rewards.ts`
- Shop: `src/game/engine/merchant.ts`
- Unlock cartes: `src/game/engine/card-unlocks.ts`
- Difficulte: `src/game/engine/difficulty.ts`
- Run Conditions: `src/game/engine/run-conditions.ts`
- Schemas run/meta: `src/game/schemas/run-state.ts`, `src/game/schemas/meta.ts`
- Server actions progression/run: `src/server/actions/progression.ts`, `src/server/actions/run.ts`

## Prochaines etapes recommandees

- Equilibrer finement la vitesse de debloquage des cartes par biome
- Ajouter un UI de "pourquoi cette carte est lock" (condition manquante)
- Ajouter des unlocks cartes explicites achetables dans la Bibliotheque (si souhaite)
