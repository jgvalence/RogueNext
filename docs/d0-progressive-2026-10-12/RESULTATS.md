# D0 étage 1 — réduction progressive des dégâts

Cette passe remplace la [baisse uniforme précédente](../d0-opening-2026-10-12/RESULTATS.md), jugée trop faible. Elle concerne uniquement les dégâts ennemis au premier étage en Archiviste (D0), pour tous les personnages, avec ou sans achats de méta-progression.

Sur un étage de 16 salles, la réduction commence à **12,5 %** et diminue de **0,5 point par salle**, pour finir à **5 % sur le boss**. Elle se calcule par rapport au réglage antérieur aux deux passes du jour (coefficient 0,65), sans cumul avec l’ancienne valeur 0,63.

| Salle affichée | Réduction avant arrondi | Coefficient final de dégâts |
| --- | --- | --- |
| 1 | 12,5 % | 0,56875 |
| 4 | 11 % | 0,5785 |
| 8 | 9 % | 0,5915 |
| 12 | 7 % | 0,6045 |
| 15 | 5,5 % | 0,61425 |
| 16 — boss | 5 % | 0,6175 |

La position est normalisée à la longueur réelle de la carte : les étages raccourcis ou allongés gardent les mêmes réductions de départ et de boss. Les salles non combattantes comptent dans la progression. Les élites et renforts utilisent le coefficient du combat où ils apparaissent.

Les PV ennemis, les récompenses, D1–D5 et les étages suivants restent inchangés. Les nombres sont arrondis à l’entier par les règles existantes : toutes les attaques ne perdent donc pas des dégâts. Une attaque de base 20, sans autre bonus, passe par exemple de 13 à 11 dégâts en première salle et à 12 au boss. Une attaque de base 7 passe de 5 à 4.

## Mesures sans méta

120 simulations supplémentaires, 30 par personnage, graines `d0-opening-1012`, profil `mixed`, aucune histoire achetée ni carte ajoutée artificiellement. Le [script](compare.mjs) reprend la méthode précédente et utilise le moteur réel. Comparaison avec les 120 essais du réglage uniforme conservés dans le dossier précédent :

| Personnage | PV après le premier boss, uniforme → progressif | Pertes nettes cumulées en combat à l’étage 1, uniforme → progressif | Victoires complètes, uniforme → progressif |
| --- | --- | --- | --- |
| Scribe | 62,50 → 62,57 | 15,00 → 14,87 | 21/30 → 19/30 |
| Bibliothécaire | 69,53 → 69,40 | 7,10 → 6,67 | 28/30 → 27/30 |
| Griot | 65,93 → 66,27 | 10,60 → 10,13 | 13/30 → 14/30 |
| Fou | 62,63 → 62,83 | 15,87 → 15,50 | 22/30 → 20/30 |

Les 120 parties passent le premier boss, sans erreur moteur. L’amélioration sur ce pilote est modeste, et les victoires finales n’augmentent pas globalement. Les pertes nettes par combat intègrent les soins pendant le combat ; elles ne représentent pas les dégâts bruts. Les changements d’actions peuvent modifier la consommation d’aléatoire et la suite d’une partie malgré une même graine.

Cette courbe réduit davantage les coups non bloqués du début, mais **ne démontre pas encore une baisse de frustration humaine**. Le pilote utilise les ressources et défend déjà efficacement. La recette avec des débutants reste ouverte ; on ne modifie pas davantage les chiffres uniquement pour augmenter les résultats du pilote.

## Validation et compatibilité

- 367 tests réussis dans six fichiers, dont la progression salle par salle et l’initialisation de combats normaux, élites et boss sur des cartes de 8, 16 et 20 salles.
- Intentions affichées et dégâts réellement infligés vérifiés ensemble ; PV ennemis et périmètre hors D0/étage 1 protégés par les tests.
- TypeScript et ESLint réussis.
- Règles des nouvelles parties : `2026-10-12.2`. Les combats déjà sauvegardés conservent leur coefficient jusqu’à leur fin ; les prochains combats concernés prennent la nouvelle courbe. Aucune sauvegarde annulée.

Résultats bruts : fichiers `after-<personnage>.json`, journaux `.log` et synthèses `-summary.json` de ce dossier. Référence avant cette passe : commit `c19f987`.
