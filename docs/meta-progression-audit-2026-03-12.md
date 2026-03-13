# Audit meta progression - 2026-03-12

## Scope

Audit base sur l'etat reel du code dans:

- `src/game/data/histoires.ts`
- `src/game/engine/meta.ts`
- `src/game/engine/difficulty.ts`
- `src/game/engine/rewards.ts`
- `src/game/engine/loot.ts`
- `src/game/constants.ts`

## Snapshot

- 45 histoires, soit 9 biomes x 5 noeuds.
- Grille de cout moins rigide qu'au depart:
  - onboarding et noeuds simples encore proches de `11/14`
  - plusieurs tier 2 et tier 3 ont maintenant des couts individualises
  - les cross-cost `PAGES` les plus favorises ont ete remontes a `12-14`
- Economie meta actuelle:
  - Pages: biome `LIBRARY` a `x1.5`
  - autres biomes: `x0.7`
  - victoire: multiplicateur `x1.25`
  - re-clear d'une difficulte deja validee: multiplicateur final `x0.7`
- Baseline de run:
  - `3` energie
  - `4` draw par tour
  - `60` HP

## Mise a jour post-pass

Le pass applique le 2026-03-12 a deja corrige les points suivants:

- `EXTRA_ENERGY_MAX` est maintenant cappe a `+1` total.
- `grimoire_des_index` est passe a `+1` carte en main de depart.
- `LIBRARY` n'a plus `+2 draw` total; `le_codex_infini` est passe sur `LOOT_LUCK`.
- `EXTRA_CARD_REWARD_CHOICES` a ete reduit a `+1` total.
- `LOVECRAFTIAN` n'est plus un triple empilement de `EXHAUST_KEEP_CHANCE`.
- `AZTEC` a maintenant un vrai capstone de puissance.
- `CELTIC` n'est plus un simple empilement de block et gagne un capstone de sustain.
- Le sustain post-combat a encore ete reduit:
  - `rite_du_soleil_noir` n'ajoute plus de soin post-combat
  - `le_chaudron_de_dagda` passe de `8%` a `5%`
- Les `ALLY_SLOTS` restent capes a `3`, mais sont maintenant repartis sur plusieurs arbres.
- Les principales descriptions de stories en decalage avec le code ont ete corrigees.
- Un audit automatique simple existe maintenant pour verifier la coherence description/code.

## Redondance

### Bonus les plus repetes

- `STARTING_BLOCK`: 3 histoires, pour un total de `+11` block.
- `EXTRA_CARD_REWARD_CHOICES`: 1 histoire, total `+1`.
- `ALLY_SLOTS`: 3 histoires, total `+3`.
- `STARTING_REGEN`: 3 histoires, total `+3`.
- Les `ALLY_SLOTS` sont desormais repartis entre `AFRICAN` et `GREEK`, avec cap moteur a `3`.
- `LOOT_LUCK`: 3 histoires, total `+4`.
- `EXHAUST_KEEP_CHANCE`: 2 histoires, total `+50%`.
- `EXTRA_HP`: 3 histoires, total `+35` HP.

### Constats

- La branche celtique a maintenant une identite plus nette:
  - block en tier 1
  - regen en tier 1 / tier 2
  - sustain post-combat en tier 3
- La branche africaine est moins lineaire qu'avant:
  - unlock d'allie en tier 1
  - regen en tier 2
  - capstone allies en tier 3
- La branche grecque contribue maintenant aussi a l'axe allies via `le_banquet`.
- La branche lovecraftienne est moins polarisante:
  - noyau Exhaust conserve
  - mais un noeud de `FOCUS` ouvre un angle plus large
- `AZTEC` n'est plus du sustain pur:
  - le capstone convertit maintenant le theme sacrifice en puissance immediate

## Puissance

### Le cluster le plus fort: economie d'action

La branche `LIBRARY` reste forte, mais le cluster est moins explosif qu'avant:

- `+1 draw` total
- `+1 energie max`
- `+1 carte en main de depart`

Sur une baseline a `3` energie / `4` draw, ces bonus ont un impact beaucoup plus fort que:

- `+3 block`
- `+10 HP`
- `+20 gold`
- `+1 degats d'attaque`

`grimoire_des_index` reste un bon noeud de tempo, mais l'ensemble `LIBRARY` n'offre plus le pic de `+2 draw` du pass precedent.

### Branches plutot saines

- `EGYPTIAN` est la branche la plus propre:
  - identite claire
  - peu de redondance
  - progression tier 1 -> tier 3 lisible
- `RUSSIAN` est plus saine depuis le passage du tier 3 en `LOOT_LUCK +2`

### Branches faibles ou ternes

- `RUSSIAN` tier 2:
  - `l_oiseau_de_feu` a `+20 gold` est correct mais peu marquant
  - `domovoi` reste un simple bloc defensif

### Branches tres polarisantes

- `AFRICAN`: potentiellement tres forte si les allies deviennent centraux, sinon sous-utile
  - Le probleme est maintenant moins la concentration des slots que la valeur reelle des allies run par run.
- `LOVECRAFTIAN`: encore specialisee, mais moins "morte" hors deck Exhaust qu'avant

## Cout

### Probleme principal

Le gros biais de la grille de cout a ete partiellement corrige, mais demande encore du recul.

Exemples:

- `grimoire_des_index` a ete remonte a `30`.
- les capstones forts utilisant `PAGES` ont vu leur cross-cost remonter a `12-14`.
- plusieurs noeuds modestes ont ete redescendus vers `22-24`.
- la grille n'est plus une pure matrice `11/14 - 24/26 - 72+8`.

### Probleme secondaire

Le sujet n'est plus un cross-cost fixe a `8`, mais le calibrage fin des nouveaux paliers.

Comme `PAGES` se farm a `x1.5` alors que les autres ressources se farm a `x0.7`:

- un tier 3 qui demande encore du `PAGES` doit rester sensiblement plus cher
- certains capstones non-library peuvent sans doute encore etre resserres apres playtest

Conclusion:

- la structure est meilleure qu'avant
- le vrai travail restant est maintenant du tuning, pas du derouillage structurel

## Integrite design / implementation

Les ecarts principaux releves entre descriptions et implementation ont ete corriges dans le pass du 2026-03-12.

Le point n'est plus seulement "a surveiller":

- script: `npm run audit:stories`
- test: `src/game/__tests__/story-description-audit.test.ts`

Une partie du ressenti "arbre fort/faible" peut vite etre faussee si le texte promet plus que le bonus reel; ce garde-fou couvre maintenant les formulations de base.

## Recommandations

### Priorite 1

- Verifier en playtest si `EXTRA_CARD_REWARD_CHOICES` a `+1` total reste sain ou peut encore etre remonte ailleurs.
- Valider que le nouveau cluster `LIBRARY` (`draw + energy + opening hand`) reste fort sans rendre la meta trop deterministe.
- Observer si `LOOT_LUCK` devient assez lisible pour le joueur maintenant qu'il est present a plusieurs endroits.

### Priorite 2

- Verifier en playtest si la nouvelle repartition des `ALLY_SLOTS` suffit a rendre l'axe allies attractif sans devenir automatique.
- Verifier que `AZTEC` et `LOVECRAFTIAN` ont bien gagne une identite meta plus lisible en run reel.
- Revoir eventuellement `RUSSIAN` tier 2, qui reste la zone la plus fade du tableau.

### Priorite 3

- Ajuster les nouvelles bandes de cout apres quelques runs plutot que revenir a une matrice fixe.
- Mesurer si les capstones a cross-cost `PAGES` sont encore favorises malgre le relevage.
- Verifier que l'onboarding `encyclopedie_du_savoir` -> `grimoire_des_index` reste assez lisible avec les nouveaux prix.

## Proposition de chantiers concrets

1. Pass 1: playtests cibles sur `LIBRARY`, `AFRICAN` allies, `AZTEC`, `LOVECRAFTIAN`.
2. Pass 2: ajustement fin des couts la ou le ressenti ne suit pas encore la puissance.
3. Pass 3: buff eventuel de `RUSSIAN` tier 2 si la branche reste trop terne.
4. Pass 4: continuer l'audit meta a partir des retours run reels plutot que d'un nouveau pass structurel lourd.
