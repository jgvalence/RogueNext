"""Render the report from completed matrices, never from partial console output."""
import json
from pathlib import Path

root = Path(__file__).parent
stages = {stage: json.loads((root / f'matrix-{stage}.json').read_text(encoding='utf-8'))['rows']
          for stage in ['calibrated-before', 'after', 'no-armor', 'confirmation']}
assert all(not r['errors'] and r['exitCode'] == 0 for rows in stages.values() for r in rows)
assert [len(rows) for rows in stages.values()] == [69, 69, 36, 13]
names = {'scribe': 'Scribe', 'bibliothecaire': 'Bibliothécaire', 'griot': 'Griot', 'fou': 'Fou'}
builds = {'ink': 'Encre', 'upgrade': 'Annotation', 'exhaust': 'Épuisement', 'draw': 'Pioche', 'archive': 'Archives', 'armor': 'Armure', 'poison': 'Poison', 'bleed': 'Saignement', 'rhythm': 'Rythme', 'debt': 'Dette', 'strength': 'Force', 'discard': 'Défausse'}

def row(stage, char, build, difficulty, meta=None):
    return next(r for r in stages[stage] if r['character'] == char and r['build'] == build and r['difficulty'] == difficulty and (meta is None or r['meta'] == meta))

def result(stage, char, build, difficulty, meta=None):
    r = row(stage, char, build, difficulty, meta)
    return f"{r['wins']}/{r['n']}"

paths = [(r['character'], r['build']) for r in stages['after'] if r['difficulty'] == 2]
text = '''# Équilibrage avancé — 10 octobre 2026

Les douze orientations autres que l’armure testées terminent D0, D1 et D2. La série indépendante le confirme même en interdisant de jouer les cartes ou variantes qui convertissent le bouclier en dégâts ou accordent des épines. La facilité varie encore beaucoup selon l’orientation et la progression méta.

Cette passe combine 5 610 parties simulées : 2 070 avant, 2 070 après, 1 080 avec la restriction sur les cartes armure et 390 supplémentaires en D4. Aucun échec technique dans ces matrices. Les données détaillées, decks finaux et causes de défaite sont conservés dans `docs/rooms-balance-2026-10-10/`.

## Changements appliqués

- Récompenses de combat ordinaire : trois cartes proposées au lieu de deux, auxquelles s’ajoutent les bonus méta. On choisit toujours une seule carte. Les récompenses d’élite et de boss gardent leurs règles propres.
- Progression des PV et dégâts ennemis adoucie à partir de D2. Les deux multiplicateurs qui se cumulaient — rampe par étage et difficulté — produisaient une hausse trop brutale.
- Fréquence des capacités perturbatrices moins élevée à partir de D2 ; réduction de la raréfaction des salles de soin en D3–D5.
- Règles particulières conservées : intentions masquées en D3, pénétration limitée du bouclier en D4, armure initiale et reliques d’élite plus rares en D5.
- Version des règles analytiques : `2026-10-10.1`.

L’armure conserve son identité. Les changements donnent plus de temps et plus de choix aux autres constructions, sans supprimer leur besoin de défense.

## D0, D1 et D2 sans cartes offensives armure

Chaque case correspond à trente parties. D0 et D1 utilisent le profil méta `average` ; D2 utilise `strong`. Il s’agit de préférences de construction dans les récompenses réellement proposées, sans injection de cartes dans le deck de départ.

| Personnage | Orientation | D0 | D1 | D2 |
|---|---|---:|---:|---:|
'''
for char, build in paths:
    if build != 'armor':
        text += f"| {names[char]} | {builds[build]} | " + ' | '.join(result('no-armor', char, build, d) for d in [0, 1, 2]) + ' |\n'

text += '''
La restriction porte sur les effets des cartes jouées, y compris leurs améliorations et variantes encrées. Les cartes de blocage ordinaires, les pouvoirs, les alliés et les reliques restent disponibles. Ce test ne démontre donc pas des victoires sans aucune défense ni aucun effet d’épines provenant d’une autre source.

La carte de départ commune `ink_surge` comporte une variante avec des épines : vérifier seulement la présence de cartes dans le deck aurait classé tous les decks dans l’armure. Le test contrôle les formes jouables et refuse ces effets ; il autorise la forme normale de cette carte. La politique évite également les nouvelles cartes dont la forme normale possède une synergie offensive armure.

## Comparaison D2 avant / après

Les deux colonnes utilisent les mêmes graines de départ et la même politique de jeu corrigée, sans la restriction armure. Le choix supplémentaire peut modifier la suite des tirages : les parcours ne sont donc pas identiques action par action.

| Personnage | Orientation | Avant | Après |
|---|---|---:|---:|
'''
for char, build in paths:
    text += f"| {names[char]} | {builds[build]} | {result('calibrated-before', char, build, 2)} | {result('after', char, build, 2)} |\n"

text += '''
## Début de progression, sans bonus méta

Ces essais D0 utilisent une préférence mixte, trente parties par personnage. Le Griot reste nettement moins accueillant que les autres avec ce pilote et ce profil.

| Personnage | Avant | Après |
|---|---:|---:|
'''
for char in names:
    text += f"| {names[char]} | {result('calibrated-before', char, 'mixed', 0, 'none')} | {result('after', char, 'mixed', 0, 'none')} |\n"

text += '''
## Difficultés élevées

Trente parties par case, méta `strong`. D4 emploie une graine indépendante. Ces résultats ne valident pas toutes les orientations en D4–D5 : les zéros ci-dessous restent des points à traiter, sans prouver une impossibilité absolue.

| Personnage | Orientation | D3 après | D4 | D5 après |
|---|---|---:|---:|---:|
'''
for char, build in paths:
    text += f"| {names[char]} | {builds[build]} | {result('after', char, build, 3)} | {result('confirmation', char, build, 4)} | {result('after', char, build, 5)} |\n"

text += '''
## Diversité du catalogue

Le contrôle du catalogue recense 275 définitions, dont 237 cartes actives collectables hors cartes de départ, statuts et malédictions. Chaque personnage possède 39 cartes propres dans le catalogue manuel et accède à 90 cartes collectables au total. Aucun ajout nuisible détecté dans les branches générées ou les variantes encrées selon les vérifications de ciblage de l’audit.

Cette égalité de quantité ne signifie pas une égalité de puissance. Les résultats mesurent treize couples personnage/orientation, dont deux orientations Encre sur des personnages différents. Le troisième choix de récompense améliore les possibilités de sélection ; aucun effet nouveau n’a été ajouté artificiellement pour augmenter le nombre de cartes pendant cette passe.

L’audit relève aussi deux améliorations explicites qui retirent l’épuisement (`rituel_interdit`, `concentration_totale`) et des motifs d’effets répétés. Ils restent visibles dans [le relevé du catalogue](rooms-balance-2026-10-10/build-catalog.json) ; ils ne sont pas assimilés automatiquement à des erreurs.

## Fiabilité et limites des simulations

Le pilote compare les effets via des aperçus isolés du moteur : dégâts réels, blocage, poison, saignement, pioche, énergie et pouvoirs persistants. Une Compétence offensive n’est plus assimilée à une carte défensive. Les aperçus ne consomment pas le flux aléatoire de la partie.

Une erreur de l’ancien simulateur a été retirée : il achetait des améliorations au marchand alors que cette action n’existe pas dans le jeu. Il peut maintenant choisir le soin légal avant un boss quand ses PV sont bas. Les premières mesures `before-*` étaient exploratoires et ne servent pas à la comparaison publiée ; celle-ci utilise `calibrated-before-*`.

Les profils méta proviennent de vraies histoires avec leurs prérequis : `average` sélectionne les 25 premières histoires classées par palier, `strong` les 35 premières, puis complète leurs prérequis. Ce ne sont pas des comptes humains suivis dans le temps. Les résultats D2 supposent cette progression et ne démontrent pas la même facilité sur un compte neuf.

Le pilote reste une heuristique à un coup : trajet aléatoire parmi les salles accessibles, choix d’événements simplifiés, pas de stratégie humaine à long terme. Les cartes à installation complexe peuvent être sous-exploitées. En D3–D5, la sélection de cartes estime les intentions masquées ; d’autres décisions du pilote, comme certaines utilisations de potions ou de pouvoirs, ne simulent pas parfaitement cette information cachée. Les résultats de ces niveaux demandent donc davantage de prudence.

Trente parties par orientation donnent des indications, pas des probabilités humaines précises. La série sans cartes armure utilise des graines différentes : ses écarts avec la série normale ne mesurent pas isolément la valeur de l’armure.

## Priorités restantes

| Priorité | Travail | Critère de validation |
|---|---|---|
| P1 | Réduire l’écart d’accueil du Griot sans méta ; examiner les premières morts et l’accès à ses outils de tempo | Nouvelle série indépendante et parties humaines débutantes, avec comparaison aux trois autres personnages |
| P1 | Approfondir Griot Rythme et Scribe Encre en D2 | Déterminer si les pertes viennent du pilote, des offres ou d’un manque réel de puissance avant un nouveau buff |
| P1 | Revoir les voies fragiles en D4–D5, en particulier Griot Saignement/Rythme et Scribe Encre | Pilote respectant toutes les intentions masquées, puis victoires reproductibles sur plusieurs séries |
| P2 | Mesurer la variété des cartes effectivement choisies et des branches d’amélioration | Suivre les cartes délaissées, les offres et la composition des decks, plutôt que seulement leur nombre |

## Vérifications et reproduction

635 tests passent dans 53 fichiers. Lint sans avertissement, vérification TypeScript et compilation de production réussis. Les tests couvrent notamment la progression combinée de difficulté, les récompenses supplémentaires, les décisions défensives du simulateur et l’interdiction des effets offensifs armure.

Les [visuels des lieux](ILLUSTRATIONS_LIEUX_2026-10-10.md) ont été intégrés et vérifiés séparément : 45 illustrations, 50 événements couverts et 70 scénarios navigateur.

Exemple reproductible du test strict :

```powershell
node --import tsx scripts/simulate.ts 30 2 null griot strong advanced-balance-20261010-no-armor-independent --build=poison --no-armor-payoffs --json=docs/rooms-balance-2026-10-10/recheck-griot-poison.json
```

Matrices : [avant corrigé](rooms-balance-2026-10-10/matrix-calibrated-before.json), [après](rooms-balance-2026-10-10/matrix-after.json), [sans cartes offensives armure](rooms-balance-2026-10-10/matrix-no-armor.json), [D4 indépendant](rooms-balance-2026-10-10/matrix-confirmation.json). Les JSON individuels contiennent les résultats de chaque partie et les decks finaux. Le script `run-matrix.py` reprend les fichiers existants ; utiliser un nouveau dossier ou de nouveaux noms pour mesurer une future version sans mélanger les résultats.
'''
(root.parent / 'EQUILIBRAGE_AVANCE_2026-10-10.md').write_text(text, encoding='utf-8')
print('Report written from 5,610 completed runs.')
