# Premier étage D0 — assouplissement léger du 12 octobre 2026

Le coefficient de dégâts ennemis passe de **0,65 à 0,63**, soit une réduction relative de **3,08 % avant arrondi**, uniquement en D0 (Archiviste), étage 1. Certaines attaques perdent un point, d’autres restent identiques. Exemple : une attaque de base 7 passait à 5 dégâts ; elle passe à 4. Les PV ennemis, les récompenses, les étages suivants et D1–D5 ne changent pas. Le réglage s’applique aussi aux élites et au boss de cet étage, avec ou sans méta-progression.

La rampe partagée avec les autres difficultés conserve ses valeurs : l’exception est limitée à D0/étage 1. Le coefficient est fixé à l’initialisation d’un combat ; un combat déjà sauvegardé conserve donc son ancienne valeur et le prochain combat concerné utilise la nouvelle. Aucune partie n’est annulée. Les nouvelles parties portent la version de règles `2026-10-12.1` ; les anciennes conservent leur étiquette historique.

## Comparaison avant/après

120 parties avant et 120 après, 30 par personnage, mêmes graines `d0-opening-1012`, aucune histoire achetée, aucun ajout artificiel de carte, profil de choix `mixed`. Personnages supposés accessibles. Le [script](compare.mjs) utilise le moteur réel et valide les sauvegardes à chaque salle. Tous les essais atteignent le deuxième étage ; aucune erreur moteur.

| Personnage | PV moyens après le premier boss, avant → après | Pertes nettes de PV cumulées dans les combats de l’étage 1, avant → après | Victoires complètes, avant → après |
| --- | --- | --- | --- |
| Scribe | 61,53 → 62,50 | 16,40 → 15,00 | 22/30 → 21/30 |
| Bibliothécaire | 68,70 → 69,53 | 7,77 → 7,10 | 29/30 → 28/30 |
| Griot | 64,97 → 65,93 | 12,07 → 10,60 | 15/30 → 13/30 |
| Fou | 61,63 → 62,63 | 16,97 → 15,87 | 23/30 → 22/30 |

Les pertes nettes par combat sont calculées entre les PV d’entrée et de sortie, plafonnées à zéro : ce n’est pas un compteur de dégâts bruts, les soins en combat peuvent les compenser. Les PV après boss sont ceux de fin du combat, avant les éventuels soins de transition d’étage.

**Interprétation :** le confort du premier étage augmente légèrement sur ce pilote. Les victoires finales n’augmentent pas dans cet échantillon. Les décisions du pilote et la consommation d’aléatoire peuvent diverger après un changement de dégâts ; conserver la même graine ne garantit pas des combats et récompenses identiques jusqu’au bout. Ces séries ne mesurent ni le taux de victoire humain, ni la tolérance réelle aux erreurs d’un débutant. Ce correctif ne clôt pas la recette humaine sans méta.

## Vérifications

- 365 tests réussis dans six fichiers : moteur, difficulté, régressions d’audit, intentions, premier combat et nouveau périmètre D0.
- Test d’intégration : dégâts annoncés et dégâts effectivement reçus concordent avec le nouveau coefficient.
- Matrice de non-régression : PV inchangés partout, dégâts inchangés hors D0/étage 1, progression D0 → D1 toujours couverte.
- TypeScript et ESLint contrôlés avant publication.

Les fichiers `before/after-<personnage>.json`, `.log` et `-summary.json` conservent les résultats et les combats utilisés pour les calculs. La série « avant » correspond au jeu au commit `4a3107d` ; la série « après » ne change que le coefficient ciblé et la version des règles.
