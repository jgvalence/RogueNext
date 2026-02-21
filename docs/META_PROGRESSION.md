# Panlibrarium - Meta progression: La Bibliotheque

## Etat actuel (mis a jour)

Ce document decrit l'etat reel implemente dans le code.

## Ressources

Chaque combat donne la ressource principale du biome.

Scaling actuel:
- Normal: base
- Elite: x2
- Boss: x4
- Bonus run gagne: x1.5 sur le total en fin de run
- Bonus cross-biome: 25% de chance de gagner +1 ressource d'un autre biome

## Histoires et bonus

- 45 histoires (9 biomes x 5)
- Bonus permanents agreges via `computeMetaBonuses()`
- Application des bonus en debut de combat via `applyMetaBonusesToCombat()`

Bonus notables maintenant actifs:
- `HEAL_AFTER_COMBAT` (heal applique a chaque fin de combat)
- `STARTING_REGEN` (regen en debut de tour)
- `FIRST_HIT_DAMAGE_REDUCTION` (reduction sur le premier hit subi du combat)
- Ink per card separe en:
  - `INK_PER_CARD_CHANCE`
  - `INK_PER_CARD_VALUE`

## Difficulte et floors

- 5 floors (`MAX_FLOORS = 5`)
- Difficulte croissante:
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
- Schemas run/meta: `src/game/schemas/run-state.ts`, `src/game/schemas/meta.ts`
- Server actions progression/run: `src/server/actions/progression.ts`, `src/server/actions/run.ts`

## Prochaines etapes recommandees

- Equilibrer finement la vitesse de debloquage des cartes par biome
- Ajouter un UI de "pourquoi cette carte est lock" (condition manquante)
- Ajouter des unlocks cartes explicites achetables dans la Bibliotheque (si souhaite)
