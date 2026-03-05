# Audit AntD - RogueNext

Date: 2026-03-05
Scope: `src/app`, `src/components`, `src/lib`

## Objectif

Passer en mode **AntD-first**:

- utiliser AntD des que possible sur toutes les pages
- appliquer les valeurs du design system de facon centralisee
- reduire au maximum la repetition de composants et de classes Tailwind

## Etat actuel (mesures)

- Pages app: `10` (`src/app/**/page.tsx`)
- Fichiers qui referencent AntD: `4`
  - `src/app/layout.tsx`
  - `src/components/providers/AntdProvider.tsx`
  - `src/lib/design-system/antd-theme.ts`
  - `src/app/game/_components/run-setup/RunSetupScreen.tsx`
- Fichiers avec composants HTML natifs:
  - `<button`: `28` fichiers (`85` occurrences)
  - `<input`: `4` fichiers (`7` occurrences)
  - `<select`: `2` fichiers (`9` occurrences)
  - `<table`: `2` fichiers (`4` occurrences au total, dont 3 dans Rules)

Hotspots principaux (`<button`):

- `src/app/game/_components/combat/CombatView.tsx`: 26
- `src/app/game/_components/shared/GameLayout.tsx`: 10
- `src/app/game/_components/run-setup/RunSetupScreen.tsx`: 6
- `src/app/game/_components/special/SpecialRoomView.tsx`: 6
- `src/app/game/_components/rewards/RewardScreen.tsx`: 5

Hotspots filtres formulaires:

- `src/app/library/_components/CardCollectionClient.tsx`: 7 `<select>`, 2 `<input>`
- `src/app/library/_components/BestiaryClient.tsx`: 2 `<select>`
- `src/app/auth/signup/page.tsx`: 3 `<input>`
- `src/app/auth/signin/page.tsx`: 2 `<input>`

## Ce qui est deja en place

- Provider global AntD et reset CSS:
  - `src/components/providers/AntdProvider.tsx`
  - `src/app/layout.tsx`
- Theme AntD centralise:
  - `src/lib/design-system/antd-theme.ts` (palette + tokens)
- Premiere migration concrete:
  - `RunSetupScreen` utilise deja `Button`, `Tag`, `Tooltip` AntD

## Ecarts par route

| Route                 | Statut             | Ecart principal                                  | Priorite |
| --------------------- | ------------------ | ------------------------------------------------ | -------- |
| `/`                   | Faible AntD        | Menu full custom (`Link` stylises)               | P2       |
| `/auth/signin`        | Non AntD           | Form custom (`input/button`)                     | P1       |
| `/auth/signup`        | Non AntD           | Form custom (`input/button`)                     | P1       |
| `/game`               | Partiel            | Bouton retry natif                               | P2       |
| `/game/[runId]`       | Partiel (complexe) | Beaucoup de UI custom (combat, modals, tooltips) | P2/P3    |
| `/leaderboard`        | Non AntD           | Table et badges custom                           | P1       |
| `/library`            | Non AntD           | Header, navigation, modal custom                 | P1       |
| `/library/bestiary`   | Non AntD           | Filtres `select`, cards et tags custom           | P1       |
| `/library/collection` | Non AntD           | Tabs, filtres, cards, badges custom              | P1       |
| `/rules`              | Non AntD           | Boutons, collapses et tables custom              | P2       |

## Ecarts transverses (repetition)

1. Repetition de patterns de base (`rounded border px py text-sm ...`) dans de nombreux composants.
2. Multiplication de variantes "chip/badge/tag" non unifiees.
3. Modal/tooltip maison dans plusieurs zones (library + game).
4. Form controls heterogenes (`input/select/button`) sans abstraction commune.
5. `src/components/ui/button.tsx`, `card.tsx`, `input.tsx` existent mais ne sont pas utilises.

## Cible architecture (AntD-first + faible repetition)

### Regles

1. Tout nouveau composant d'interface doit passer par des wrappers `Rogue*`.
2. Pas de nouveau `<button>/<input>/<select>/<table>` direct sauf exception justifiee.
3. Pas de nouvelle couleur en dur hors tokens (`roguePalette` / CSS vars).
4. Pas d'import AntD brut dans les features (sauf wrappers et cas rares valides).

### Wrappers a creer (source unique)

Dossier cible: `src/components/ui/rogue/`

- `RogueButton` -> `antd/Button`
- `RogueTag` -> `antd/Tag`
- `RogueInput` -> `antd/Input`
- `RogueSelect` -> `antd/Select`
- `RogueTabs` -> `antd/Tabs`
- `RogueSegmented` -> `antd/Segmented`
- `RogueModal` -> `antd/Modal`
- `RogueTooltip` -> `antd/Tooltip`
- `RogueTable` -> `antd/Table`
- `RogueAlert` -> `antd/Alert`
- `RogueEmpty` -> `antd/Empty`
- `RogueCard` -> `antd/Card`
- `RoguePageHeader` (composant compose interne)

## TODO priorisee

### Phase 1 - Foundation (obligatoire)

- [x] Creer les wrappers `Rogue*` listes ci-dessus.
- [x] Ajouter un guide d'usage `docs/design-system-antD.md` (do/dont).
- [x] Marquer `src/components/ui/button.tsx`, `card.tsx`, `input.tsx` comme deprecies.
- [x] Ajouter une regle lint (ou script CI) qui signale les nouveaux usages directs de `<button/input/select/table>` hors exceptions.
- [x] Etendre `antd-theme.ts` (tokens typographie, espaces, states disabled/hover/focus).

### Phase 2 - Migration prioritaire Library + Leaderboard

- [x] `LibraryClient`: actions/header en `RogueButton`, `RogueCard`, `RogueTag`.
- [x] `HistoireModal`: migrer vers `RogueModal`, `RogueAlert`, `RogueButton`, `RogueTag`.
- [x] `HistoireSlot`: basculer interactions vers `RogueTooltip` + `RogueTag` si possible.
- [x] `BestiaryClient`: filtres en `RogueSelect`, cartes en `RogueCard`, etats en `RogueTag`, vide en `RogueEmpty`.
- [x] `CardCollectionClient`:
  - tabs -> `RogueTabs` ou `RogueSegmented`
  - filtres -> `RogueSelect` + `RogueInput`
  - etats -> `RogueTag`
  - sections vides -> `RogueEmpty`
- [x] `LeaderboardClient`: desktop en `RogueTable`, mobile conserve en cards mais via `RogueCard` + `RogueTag`.

### Phase 3 - Auth + Rules

- [x] `/auth/signin` et `/auth/signup`: `RogueForm` (ou `Form` AntD), `RogueInput`, `RogueButton`, `RogueAlert`.
- [x] `RulesContent`: boutons en `RogueButton`, tableaux en `RogueTable`, blocs pliables en `Collapse` via wrapper.

### Phase 4 - Game (progressif, avec prudence)

- [x] Lot A: `GameLayout` (actions shell + overlays menu/reliques) migre en `RogueButton`, `RogueModal`, `RogueTag`.
- [x] Lot A: `CardPickerModal`, `DeckViewerModal`, `RulesModal` migres vers `RogueModal` (+ actions en `RogueButton`).
- [x] Lot B: `BiomeSelectScreen`, `RunDifficultySelectScreen`, `RunConditionSelectScreen` migres en `RogueButton`/`RogueTag`.
- [x] Lot B: `StartMerchantView` et `ShopView` migres en `RogueButton`/`RogueTag` (hors logique gameplay).
- [x] Remplacer les boutons "UI shell" (menus, modals, actions secondaires) par `RogueButton`.
- [x] Unifier modales (`CardPickerModal`, `DeckViewerModal`, `RulesModal`, etc.) via `RogueModal`.
- [x] Unifier les tags/badges d'etat via `RogueTag`.
- [x] Evaluer migration du tooltip custom combat vers `RogueTooltip` (decision: conserver `Tooltip` custom sur le coeur combat, migrer les tooltips non critiques vers `RogueTooltip`).
- [x] Garder les composants ultra gameplay (carte draggable, interactions temps reel) en custom si AntD degrade l'experience.

Exceptions documentees (Phase 4):

- `src/app/game/_components/combat/CombatView.tsx`: boutons natifs conserves pour cibles/player-enemy cards et selections de cartes (`hand overflow`, `rewrite`) pour eviter une regression UX/perf.
- `src/app/game/_components/combat/HandArea.tsx`: chips de main mobile conserves en natif (interaction rapide, cadence elevee).
- `src/app/game/_components/combat/GameCard.tsx`: bouton interne conserve (carte gameplay centrale).

## Definition of done

1. Toutes les pages utilisent AntD (directement ou via wrappers) pour les primitives UI standards.
2. Les couleurs/typos/states viennent des tokens design system.
3. La repetition des classes utilitaires est reduite via wrappers composables.
4. `lint` + `type-check` passent.
5. Aucun nouveau composant natif interdit n'est introduit hors exceptions documentees.

## Proposition d'ordre d'execution

1. Phase 1 (foundation)
2. Phase 2 (library + leaderboard)
3. Phase 3 (auth + rules)
4. Phase 4 (game progressive)
