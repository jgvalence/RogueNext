# Panlibrarium — suivi des travaux

Dernière consolidation : **12 octobre 2026**. Ce fichier est la liste de référence des travaux ouverts. Les audits datés conservent leurs mesures historiques ; une ancienne case ouverte ne doit pas relancer un chantier déjà livré.

La référence de production avant la refonte des menus est `e0e0d3e` : reprise des anciennes sauvegardes corrigée, sans annulation des parties. La nouvelle passe est détaillée dans [son rapport](REFONTE_MENUS_2026-10-11.md). Les cases non cochées ci-dessous sont le travail restant.

La [passe autonome du 12 octobre](PASSE_AUTONOME_2026-10-12.md) traite les douze lots techniques : 685 tests, 108 parcours et 2 130 simulations d’équilibrage (dont 30 rejeux historiques). Les chiffres détaillés sont dans [les résultats](validation-2026-10-12/RESULTATS.md). Griot Rythme reste faible en D5 : 0/20 puis 5/60 nouvelles graines ; les anciennes graines reproduisent 4/30. Aucun équilibrage parfait n’est revendiqué.

## Où trouver le détail

Passe complémentaire : [présentation du combat mobile](PASSE_COMBAT_MOBILE_2026-10-11.md) — héros visible, portraits ennemis bornés et plus nets, intentions regroupées et ciblage tactile. Le téléphone communiqué par le joueur est un Redmi Note 11 Pro 5G ; la validation sur cet appareil physique reste à faire.


Correctif après retours mobiles : [combat, lecture des cartes et récompenses](CORRECTIF_MOBILE_2026-10-11.md). Les cartes minuscules en paysage et les faux choix A/B des récompenses sont corrigés ; la validation physique QA-01 reste ouverte.

| Document | Usage |
| --- | --- |
| [État du jeu](ETAT_DU_JEU.md) | Bilan actuel et limites de validation |
| [Passe finale d’équilibrage et de recette](PASSE_FINALE_EQUILIBRAGE_ET_RECETTE_2026-10-10.md) | Résultats des cinq chantiers, matrices et preuves navigateur |
| [Audit visuel et TODO](AUDIT_VISUEL_ET_TODO.md#suivi-actuel--11-octobre-2026) | Travail graphique restant, dont Bibliothèque, méta-progression et menus |
| [Audit des cartes](AUDIT_CARTES_ET_TODO.md) et [audit des reliques](AUDIT_RELIQUES_ET_TODO.md) | Conception, outils et questions à vérifier avec des joueurs |
| [Méta-progression](META_PROGRESSION.md) | Fonctionnement des ressources, histoires et bonus |

## La liste des cinq travaux : où en est-on ?

| Ordre initial | Travail | État au 11 octobre | Ce qui reste |
| --- | --- | --- | --- |
| 1 | Rendre le Griot plus accessible sans méta | Ajustements livrés : masque à 0 énergie, défense de la relique de départ. Confirmation indépendante D0 : 16 victoires sur 30, contre 21, 26 et 21 pour les autres personnages. | Observer des premières parties humaines ; le Griot reste le plus exigeant de cet échantillon. |
| 2 | Renforcer Griot Rythme et Scribe Encre en D2 | Ajustements livrés. Série finale : respectivement 17/30 et 22/30. | Mesurer le confort des enchaînements et les offres de cartes en jeu réel. |
| 3 | Reprendre D3–D5 | Progression recalibrée ; les 13 orientations testées ont des victoires dans chacune des six difficultés. | Réduire les écarts résiduels si les parties humaines les confirment, notamment Dette/Armure face à Rythme/Saignement/Encre. |
| 4 | Affiner les cartes et améliorations | Cartes et branches différenciées ; audit des 237 cartes collectables, offres et choix mesurés. | Lisibilité et intérêt des cartes complexes, choix A/B et cartes délaissées par les joueurs. |
| 5 | Tester le parcours réel bureau/mobile | Parcours navigateur complets réalisés : défaite tardive sur bureau et victoire sur trois étages en mobile émulé ; persistance contrôlée. Essais de combat/reprise et de PWA également réalisés en production. | Sessions humaines sur Android et iPhone physiques, dont Safari/PWA, performances et interruptions réelles. |
| Prérequis | Respecter les intentions cachées dans le simulateur | Corrigé pour cartes, pouvoirs et estimations de potions ; tests d’invariance et actions via le reducer du jeu. | Conserver ces contrôles lors des prochains changements du pilote. Ce correctif n’est plus à refaire. |

Les 3 540 simulations finales ne sont pas des parties humaines. Les profils méta sont `average` en D0–D1 et `strong` en D2–D5, sauf la série spécifique sans méta. Le test hors Armure interdit les cartes offensives armure/épines mais conserve les reliques et consommables. Les anciennes estimations « le joueur fera 5–10 points de mieux » ne sont pas une mesure validée.

## Bibliothèque et menus — implémentés le 11 octobre

Périmètre détaillé et critères : [audit visuel](AUDIT_VISUEL_ET_TODO.md#bibliothèque-méta-progression-et-pages-du-menu).

- [x] **UI-01 — Socle commun des pages hors expédition.** Harmoniser navigation, titres, panneaux, boutons, icônes, états de chargement/erreur/vide et retours vers l’accueil. Conserver la direction peinte, encre et laiton du jeu.
- [x] **UI-02 — Bibliothèque et méta-progression `/library`.** Donner une présence de lieu aux rayonnages/biomes ; hiérarchiser ressources, histoires disponibles, prérequis, coûts, progression et bonus réellement gagnés après plafonnement. Reprendre les fenêtres d’histoire et le feedback de déblocage.
- [x] **UI-03 — Accueil `/` et authentification.** Harmoniser les commandes et leur hiérarchie, les états connecté/déconnecté, le retour à une partie et l’installation PWA. L’accueil possède déjà un décor illustré : l’intégrer au socle commun, sans le considérer comme manquant.
- [x] **UI-04 — Collection et bestiaire.** Harmoniser `/library/collection` et `/library/bestiary`, filtres, verrouillages, maîtrise/lore, fiches et agrandissements avec la Bibliothèque ; réutiliser les illustrations existantes.
- [x] **UI-05 — Historique, classement et règles.** Harmoniser `/runs`, `/leaderboard` et `/rules`, détails de partie, longues listes, recherche/navigation et états vides. Le classement reste non certifié.
- [ ] **UI-06 — Compléments de recette.** Les 40 contrôles de pages en 1440/390/320 px et paysage, FR/EN, clavier/focus, modales, déblocages et reprise sont consignés dans le rapport. Restent les appareils physiques, safe areas iOS, mémoire/fluidité et une revue humaine des textes/contrastes. Captures après modification disponibles ; aucune série avant/après rétroactive n’est revendiquée.

Réalisation et preuves : [refonte des menus du 11 octobre](REFONTE_MENUS_2026-10-11.md). UI-06 conserve les limites de recette, notamment appareils physiques, performances et absence de série de captures avant modification.

## P1 — Validation sur appareils et avec des joueurs

- [ ] **QA-01 — Android réel et iPhone/Safari réel.** Jouer une expédition, vérifier ciblage et cartes chargées, événements, marchand, boss, récompenses, fermeture/reprise et coupure réseau. Distinguer navigateur et PWA installée ; noter appareil, version, scénario et résultat.
- [ ] **QA-02 — Premières parties sans méta.** Tester les quatre personnages dès qu’ils sont accessibles ; suivre les morts précoces, la compréhension de l’Encre, des intentions et des déblocages. Priorité au Griot.
- [ ] **BAL-01 — Confort D2 puis D3–D5.** Comparer à progression méta comparable, en priorité Griot Rythme/Saignement et Scribe Encre. Distinguer puissance des cartes, accès aux synergies et limites du pilote avant un nouveau buff.
- [ ] **BAL-02 — Diversité effectivement jouée.** Exploiter les offres, sélections, utilisations, retraits et branches A/B ; vérifier les routes inter-biomes et les synergies à installation lente. Ne pas traiter une carte ignorée par le robot comme automatiquement mauvaise.
- [ ] **META-01 — Cadence de progression.** Vérifier les premiers déblocages, bonus de Bibliothèque, places d’alliés et intérêt du palier 2 russe. Mesurer le ressenti des coûts et des prérequis dans la nouvelle UI-02.

## P2 — Finition, lisibilité et performances

- [x] **VIS-01 — Combat, recette technique.** Neuf formats, cinq ennemis et deux alliés, main de dix cartes, gestes sans jeu accidentel, inspection et ciblage vérifiés. Les effets sont couverts par les contrats moteur ; la cohérence artistique et le confort restent dans QA-01.
- [x] **VIS-02 — Marchands et événements.** Disponibilités moteur/UI unifiées, motifs et coûts visibles, purges persistantes et sans double paiement. Recette tactile et tests : [rapport du 12 octobre](PASSE_AUTONOME_2026-10-12.md).
- [ ] **VIS-03 — Audio et mouvement.** Audio muet, reprise du thème, nettoyage et mouvement réduit contrôlés le 12 octobre. Restent la comparaison humaine des volumes et la qualité perceptive des transitions/feedbacks.
- [ ] **PERF-01 — Téléphones modestes.** Chargement CPU ×4/réseau ralenti et douze cycles de fenêtres mesurés le 12 octobre ; musiques sorties du précache et écrans secondaires différés. Restent fluidité/mémoire sur longues sessions et mises à jour PWA sur appareils physiques, notamment iOS.
- [ ] **TXT-01 — Compréhension et textes.** Parité de 2 699 clés FR/EN et variables contrôlée, Bazar traduit. Reste la lecture humaine du tutoriel/prologue, de l’anglais, des cartes complexes et du lore du bestiaire.
- [x] **TECH-01 — Contrats d’effets et persistance.** Contrats transversaux des cartes normales/encrées A/B ajoutés, sérialisation après chaque salle, conflits/requêtes incertaines et purge d’événement reprise sans second coût. Les six tests des anciennes statistiques sont conservés.
- [ ] **TECH-02 — Convention AntD historique.** Le contrôle `antd:first:check` signale encore 25 primitives dans 12 fichiers préexistants non modifiés par cette passe. Refactoriser séparément les composants concernés ; baseline inchangée.

## P3 — Évolutions à arbitrer après validation

Ces pistes sont conservées du précédent backlog. Elles ne sont pas nécessaires pour considérer les cinq passes précédentes livrées.

- [ ] **NAR-01 — Narration.** Revalider le périmètre de [l’évolution narrative](evolution-histoire.md) : flags de run, Hubris/Maât, événements associés, quêtes/serments, sceaux, Censeur et fins conditionnelles. Vérifier l’existant avant chaque lot ; ne pas confondre mécaniques de cartes et statistiques narratives de run.
- [ ] **CONTENT-01 — Extensions.** Décider de personnages supplémentaires et d’histoires dédiées à des cartes seulement après les retours sur le contenu actuel.
- [ ] **ART-01 — Compléments artistiques.** Illustration dédiée au prologue, objets/reliques et éléments de décor si la nouvelle composition le justifie. Les cartes, ennemis/boss et lieux ne sont plus des lots d’illustrations entièrement à produire.
- [ ] **AUTH-01 — Adaptateur de base de données d’authentification.** Réévaluer le besoin et la compatibilité de l’adaptateur actuellement commenté si les parcours d’authentification évoluent ; l’inscription et la connexion actuelles ont été testées en production.
- [ ] **RANK-01 — Avant toute compétition certifiée.** Exécuter ou rejouer les actions côté serveur avant d’admettre les résultats dans un classement certifié. Les validations de sauvegarde actuelles ne certifient pas une partie jouée côté client.

## Livré récemment — ne pas remettre dans l’ouvert

- [x] Cinq passes initiales et simulateur : voir les réserves de validation humaine dans le tableau ci-dessus.
- [x] Illustrations des [275 cartes](ILLUSTRATIONS_CARTES_2026-10-10.md), des [101 ennemis dont 18 boss](ILLUSTRATIONS_ENNEMIS_BOSS_2026-10-10.md) et des [lieux/50 événements](ILLUSTRATIONS_LIEUX_2026-10-10.md).
- [x] Historique `/runs`, tutoriels et vitesses de combat ; ces fonctionnalités existent déjà.
- [x] Reprise des récompenses, des achats et de la purge ; finalisation sans attribution doublée dans les scénarios testés.
- [x] Publication GitHub/Vercel et installation/mise à jour PWA contrôlées dans Chromium.
- [x] Correctif `e0e0d3e` du 11 octobre : statistiques manquantes des anciennes sauvegardes complétées au chargement serveur, dans le cache client et via `LOAD_RUN`. Erreur reproduite puis reprise vérifiée en production sur un compte jetable ; aucune partie réelle annulée.

## Règle de mise à jour

Pour clore une tâche, ajouter la modification livrée, la preuve ou le scénario vérifié, et la limite éventuelle. Une simulation, un navigateur émulé et un essai humain sur téléphone sont trois validations distinctes. Les anciennes mesures restent dans leurs rapports datés ; les priorités actives restent ici.
