# Audit Refactor (2026-03-06)

## Objectif

- Identifier les fichiers trop gros/complexes.
- Prioriser les decoupages.
- Verifier les points sensibles des hooks et de la couche services/actions.

## Top fichiers volumineux (hors lockfiles)

1. `src/game/data/cards.ts` (~6252 lignes)
2. `src/game/data/enemies.ts` (~3861 lignes)
3. `src/lib/i18n/messages/en.ts` (~2908 lignes)
4. `src/lib/i18n/messages/fr.ts` (~2893 lignes)
5. `src/game/engine/relics.ts` (~1996 lignes)
6. `src/game/engine/run-events.ts` (~1831 lignes)
7. `src/game/engine/run.ts` (~1161 lignes, avant ~3081)
8. `src/game/engine/enemies.ts` (~1148 lignes)

## Changements effectues

- `CombatView` decoupe en modules:
  - helpers purs: `src/app/game/_components/combat/combat-view-helpers.tsx` (~523 lignes)
  - badges UI: `src/app/game/_components/combat/combat-badges.tsx`
- overlays tutoriel/mobile:
  - `src/app/game/_components/combat/first-combat-tutorial.tsx` (~83 lignes)
  - `src/app/game/_components/combat/combat-mobile-drawers.tsx` (~142 lignes)
  - `src/app/game/_components/combat/combat-mobile-info-panel.tsx` (~457 lignes)
  - `src/app/game/_components/combat/combat-mobile-grid.tsx` (~307 lignes)
  - `src/app/game/_components/combat/combat-desktop-grid.tsx` (~438 lignes)
  - `src/app/game/_components/combat/combat-player-zone.tsx` (~311 lignes)
  - `src/app/game/_components/combat/combat-overlays.tsx` (~193 lignes)
  - types partages: `src/app/game/_components/combat/combat-view-types.ts`
- logique interaction extraite: `src/app/game/_components/combat/use-combat-interactions.ts` (~523 lignes)
- `CombatView` phase 5 finalisee:
  - selection/ciblage cartes-items: `src/app/game/_components/combat/use-combat-selection.ts` (~240 lignes)
  - overlays mobile: `src/app/game/_components/combat/use-combat-mobile-panels.ts` (~167 lignes)
  - gestion des piles: `src/app/game/_components/combat/use-combat-pile-overlay.ts` (~60 lignes)
  - `src/app/game/_components/combat/use-combat-interactions.ts` recentre sur l'orchestration (~214 lignes)
  - objectif atteint: aucun hook UI combat > ~250 lignes
- nettoyage: suppression du hook mort `src/app/game/_components/combat/use-combat-view-controller.ts`
- `CombatView` passe de ~3084 a ~454 lignes.
- `CombatView` retire de la liste des fichiers trop volumineux.
- `GameProvider` decoupe:
  - reducer metier extrait vers `src/app/game/_providers/game-reducer.ts`
  - `src/app/game/_providers/game-provider.tsx` recentre sur le wiring React/context.
- Nettoyage hooks:
  - suppression des disable `exhaustive-deps` sur:
    - `src/app/game/page.tsx`
    - `src/app/game/_providers/game-provider.tsx`
- Type-check valide apres chaque etape.
- `[runId]/page.tsx` decoupe:
  - ecran de fin factorise: `src/app/game/_components/run-end/RunOutcomeScreen.tsx`
  - logique de phase extraite: `src/app/game/_services/run-phase.ts`
  - resume de fin de run extrait en hook: `src/app/game/_hooks/use-run-outcome-summary.ts`
  - flux tour ennemi extrait: `src/app/game/_hooks/use-combat-turn-flow.ts`
  - effet fin de combat extrait: `src/app/game/_hooks/use-combat-outcome.ts`
  - handlers rewards extraits: `src/app/game/_hooks/use-reward-phase-handlers.ts` (~88 lignes)
  - navigation room/setup extraite: `src/app/game/_hooks/use-run-room-actions.ts`
  - debug combat dev extrait: `src/app/game/_hooks/use-combat-debug-info.ts`
  - handlers de vues merchant/special/pre-boss + fin de run extraits: `src/app/game/_hooks/use-run-phase-view-handlers.ts`
  - dernier `react-hooks/exhaustive-deps` retire de `src/app/game/_hooks/use-combat-outcome.ts` (~139 lignes)
- `[runId]/page.tsx` passe de ~1254 a ~599 lignes.
- `run.ts` decoupe (phase 1):
  - extraction complete du moteur d'evenements vers `src/game/engine/run-events.ts`
  - `src/game/engine/run.ts` passe de ~3081 a ~1161 lignes
  - `npm run test -- --run src/game/__tests__/engine.test.ts` vert (151 tests)
- `src/server/actions/run.ts` decoupe:
  - facade server reduite a validation/auth/revalidate (~104 lignes, avant ~674)
  - orchestration create/end extraite vers `src/server/services/run/run-lifecycle.service.ts` (~75 lignes)
  - persistance Prisma extraite vers `src/server/services/run/run-persistence.service.ts` (~133 lignes)
  - synchro meta-progression de fin de run extraite vers `src/server/services/run/run-progression-sync.service.ts` (~248 lignes)
  - construction/hydratation d'etat extraite vers `src/server/services/run/run-state.service.ts` (~281 lignes)
  - helpers de normalisation isoles dans `src/server/services/run/run-state-helpers.ts` (~46 lignes)
- `npm run type-check` vert apres le split de `use-combat-interactions`
- `npm run type-check` vert apres le split des actions/services run

## Hooks: points a surveiller

- plus aucun `react-hooks/exhaustive-deps` desactive dans `src/app/game`

## Services / Actions: etat actuel

- `src/server/actions/run.ts` n'est plus un point chaud structurel:
  - l'action garde la validation Zod, l'authentification et `revalidatePath`
  - la logique metier est repartie entre services `run-*`
- point a garder a l'oeil:
  - `src/server/services/run/run-state.service.ts` reste le plus dense de ce sous-ensemble (~281 lignes) mais reste dans la cible de service

## Reste a faire (priorites)

### P0 (prochaines sessions, impact direct)

1. smoke test manuel combat -> rewards -> map
   - verifier qu'une victoire ouvre toujours les rewards une seule fois
   - verifier qu'une defaite ferme correctement le flux et ouvre l'ecran DEFEAT une seule fois
2. smoke test manuel create/save/reload/end run
   - verifier qu'une sauvegarde auto ne ressuscite pas une run terminee
   - verifier qu'une nouvelle run abandonne bien l'ancienne et garde une seule run active

### P1 (dette structurelle metier)

1. `src/game/engine/run.ts` + `src/game/engine/run-events.ts`
   - separer:
     - `run.ts`: transitions de phase / progression map
     - `run-events.ts`: segmenter les catalogues d'evenements par biome/theme
     - logique rewards / fin de combat en modules dedies
   - garder `run.ts` comme facade d'orchestration
2. `src/game/engine/enemies.ts` + `src/game/engine/effects.ts`
   - identifier les sous-domaines extractibles sans changer la logique:
     - intentions / phase-2 boss / helpers IA
     - effets utilitaires reutilisables par type d'effet

### P2 (maintenance long terme)

1. i18n (`fr.ts`, `en.ts`)
   - split par domaines (`combat`, `run`, `rewards`, `library`, etc.)
   - conserver les memes cles via un index aggregateur
2. data massives (`cards.ts`, `enemies.ts`)
   - split par biome/type + exports agreges
   - ajouter un check de duplication d'ID au build/test

## Definition of done (par chantier)

- Aucun changement fonctionnel attendu: refactor structurel uniquement.
- `npm run type-check` vert apres chaque sous-etape.
- Tests cibles sur setup/combat/rewards/map (ou smoke test manuel si pas de tests auto).
- Taille cible:
  - composant UI: idealement 150-350 lignes, alerte > 500
  - hook: 60-200 lignes
  - service: 80-300 lignes
- Pas de nouveau `eslint-disable react-hooks/exhaustive-deps` introduit.

## Risques et garde-fous

- Garder les memes IDs/cles i18n.
- Ne pas modifier la logique metier pendant les splits (refactor structurel uniquement).
- Verifier a chaque etape:
  - `npm run type-check`
  - tests cibles des phases combat/setup/reward/map.
