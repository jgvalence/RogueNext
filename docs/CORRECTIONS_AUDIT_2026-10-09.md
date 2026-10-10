# Corrections de l’audit de Panlibrarium

> Suivi de la première passe, conservé avec ses mesures (610 tests, règles `2026-10-09.1`). La [passe suivante sur les builds et la diversité](EQUILIBRAGE_BUILDS_2026-10-09.md) documente les règles `2026-10-09.2`, 626 tests et 4 000 parties simulées supplémentaires dans son protocole avant/après.

Cette passe corrige les défauts de sauvegarde, la collision de cartes, plusieurs règles de progression, le simulateur et une partie importante des problèmes de lisibilité relevés dans [l’audit complet](AUDIT_COMPLET_DU_JEU_2026-10-09.md). Les changements sont dans le projet local. Ils ne constituent pas un déploiement.

Les corrections automatiques passent **610 tests dans 49 fichiers**, le typage TypeScript et ESLint. Le build de production fonctionne sans téléchargement de polices Google. Les scénarios réseau et les transactions sont testés avec des doubles de test ; la reprise de bout en bout sur une base PostgreSQL isolée reste à valider. La base configurée est distante et aucun PostgreSQL local ni Docker n’est disponible dans cet environnement.

Il reste deux limites majeures : **le moteur client ne certifie pas les scores d’un classement compétitif**, et **les simulations ne remplacent pas les parties humaines pour valider l’équilibrage**. Les tâches de création de contenu supplémentaire A39 à A44 sont des extensions du jeu, pas des défauts que cette passe prétend avoir réparés.

## Sauvegarde et progression

- Une sauvegarde n’est confirmée que si la réponse contient effectivement `success: true` et `saved: true`.
- Toutes les modifications du snapshot sont prises en compte, y compris Encre, améliorations, inventaire et alliés. Les transitions importantes sont envoyées immédiatement ; les autres modifications sont regroupées sur deux secondes.
- Une file par partie sérialise sauvegardes, envois de fermeture et finalisation. Chaque écriture confirmée avance `saveRevision`.
- Le serveur compare atomiquement le snapshot précédent avant de remplacer son contenu. Un onglet ancien ne peut donc plus écraser silencieusement un état plus récent.
- La reprise accepte la date de début normalisée des anciennes sauvegardes et plusieurs étages joués avant reconnexion. Un ancien onglet en retard d’un étage est traité comme un conflit de révision.
- Après une réponse réseau perdue, le client renvoie d’abord exactement le snapshot incertain. Le serveur reconnaît sa répétition avant que le client n’envoie les actions suivantes.
- Un bandeau distingue hors ligne, échec et conflit. Les échecs temporaires sont réessayés ; un conflit nécessite de recharger l’état confirmé. Fermer la page avant confirmation peut toujours perdre les actions locales non reçues, notamment lorsque le navigateur refuse un gros envoi `keepalive`.
- La fin de partie regroupe dernier snapshot, statut, ressources, statistiques, résumé et snapshot de deck dans une transaction sérialisable. Une répétition d’une finalisation déjà confirmée ne recrédite rien.
- Le retour à la bibliothèque attend cette confirmation, même lorsqu’une première finalisation est déjà en cours.
- Une nouvelle partie finalise les anciennes parties actives comme abandonnées dans la même transaction que sa création. Les snapshots terminés sont conservés pour l’historique.
- Les ressources et le deck de fin proviennent du snapshot confirmé. Les anciens champs de totaux libres ne font plus autorité. Des helpers de progression ont été retirés du module `use server` pour ne plus être exposés comme actions publiques.

Les snapshots sont validés par schéma, taille, bornes, identité, cartes et ennemis connus, unicité des cartes du deck et clés de ressources autorisées. Cela protège le stockage et certaines incohérences ; cela ne prouve pas que les actions du joueur ont été légalement exécutées. Le classement affiche désormais cette limite.

## Règles du jeu modifiées

| Sujet | Comportement actuel |
| --- | --- |
| `ink_surge` | Une seule définition canonique. L’ID existant est conservé pour les sauvegardes. Le constructeur du catalogue refuse désormais toute collision. |
| D0 vers D1 | L’atténuation introductive disparaît progressivement avec la difficulté, au lieu de disparaître brutalement dès D1. Au premier étage, le facteur de PV passe de 0,56 à 0,7392, soit +32 %, et celui des dégâts de 0,65 à 0,814, soit environ +25,2 %, avant arrondis. |
| D3 | Intentions des boss et élites cachées tous les trois tours ; la description l’annonce explicitement. |
| D4 et D5 | Les deux paliers conservent 5 % de pénétration d’armure. D5 ajoute ses autres contraintes au lieu de retirer discrètement cette règle de D4. |
| Ressources de répétition | Rejouer une difficulté rapporte 100 % des ressources normales. La première victoire globale à cette difficulté conserve son bonus de 25 %. |
| Première partie | Le choix de route est libre et la défaite automatique est supprimée. L’ancienne action de défaite forcée n’a plus d’effet. Après la première véritable victoire du tutoriel, le budget de Pages permet de poursuivre l’apprentissage dans la bibliothèque. |
| Pacte de sang | Exige strictement plus de 6 PV et une jauge non pleine. Le pouvoir ne peut plus tuer son utilisateur ; l’infobulle montre les PV après paiement. |
| Pouvoirs | Les pouvoirs du Griot et du Fou sont présents dans la jauge. Un pouvoir dont le coût dépasse la capacité d’Encre explique ce prérequis. |
| Drafts | Chaque combat normal gagné propose un choix de cartes. Le joueur choisit de passer ; les seuils cachés de 17 et 22 cartes ne suppriment plus des drafts. |
| Événements | Quand un pool risqué est admissible, son poids vaut 20/30/40/50/60/70 % de D0 à D5. Les conditions propres au biome et à l’événement restent appliquées. |
| Histoires | La fenêtre d’achat affiche le gain marginal réel après plafonnement et signale un plafond déjà atteint. |

Ces règles constituent une nouvelle base de réglage, pas une garantie de victoire comparable entre les quatre personnages. En particulier, une hausse graduelle des statistiques ne garantit pas une hausse graduelle du taux de victoire : effets de seuil, contrôles et composition des rencontres restent déterminants.

## Simulateur et mesures

Le simulateur dérive maintenant ses bonus d’histoires réelles, avec leurs prérequis. Il applique les déblocages de cartes et de reliques, les choix exclusifs carte/relique des élites, les objets gagnés, les cibles alliées et la résolution des mains en dépassement. Les objets de pioche et d’énergie sont utilisés avant de jouer les cartes. Les tours remportés immédiatement sont comptés ; les PV de défaite sont bornés à zéro. Les arguments `--build valeur` et `--build=valeur` sont tous deux correctement interprétés.

Une matrice de **960 parties** compare les quatre personnages, les profils `none` et `average`, D0/D1 et deux préférences de construction. Chaque cellule ne contient que **30 parties**. `none` représente zéro histoire, avec le minimum de parties antérieures permettant le personnage ; `average` est un profil synthétique d’histoires accessibles. Il ne reproduit pas toutes les maîtrises et visites d’un vrai compte.

| Personnage | Sans histoires D0 mixte | Intermédiaire D0 mixte | Intermédiaire D1 mixte |
| --- | ---: | ---: | ---: |
| Scribe | 36,7 % | 53,3 % | 30,0 % |
| Bibliothécaire | 13,3 % | 36,7 % | 13,3 % |
| Griot | 3,3 % | 30,0 % | 3,3 % |
| Fou | 23,3 % | 46,7 % | 23,3 % |

Les préférences secondaires sont Encre pour Scribe, Bibliothécaire et Fou, Poison pour Griot. Le [JSON complet](audit-2026-10-09/corrections-matrix.json) conserve les 32 cellules et leurs codes de sortie. Le robot reste générique, prend des décisions simplifiées et ne résout pas tous les événements à choix particuliers. Ces résultats signalent notamment une difficulté persistante du Griot pour ce robot ; ils ne justifient pas à eux seuls un bonus arbitraire à toutes ses cartes.

Les **3 500 cartes générées** couvrent les neuf biomes, les six difficultés et les sept configurations de génération concernées. Aucune carte invalide ni recours au repli sur cet échantillon. Les tests déclenchent aussi volontairement le repli pour chaque configuration : le cas sans marchand est accepté selon ses propres règles. Les [mesures détaillées](audit-2026-10-09/corrections-map-sample.json) précisent les nombres d’essais.

## Interface, graphismes, son et narration

- Dix illustrations vectorielles distinctes complètent les entités secondaires des boss : encriers, têtes de l’Hydre, nid, chaudron, coffre, œuf et aiguille. Les tests vérifient les chemins effectifs, y compris les alias d’images existants.
- Treize nouvelles illustrations complètent les seize cartes de départ distinctes. Elles apparaissent aussi dans la main compacte sur mobile.
- Un panneau d’aide par boss rassemble son objectif et les marqueurs de mécanique déjà calculés par le jeu. Les dix-huit boss possèdent un texte tactique français et anglais.
- Les neuf biomes reçoivent des silhouettes d’architecture et de sol distinctes en SVG, placées aux bords du champ de bataille pour préserver la lecture des cibles.
- Quand trois ennemis ou plus sont vivants, une vue d’ensemble permet de les sélectionner et montre leurs intentions. Elle respecte les intentions cachées. Sur un écran bas, elle remplace le rail de grands portraits ; les alliés et le joueur se partagent une rangée.
- Les cartes et ennemis interactifs sont accessibles au clavier. Entrée/Espace activent les cartes ; Échap annule le ciblage et restitue le focus à la carte ou à l’objet lorsque cet élément existe encore. Le parcours complet avec lecteur d’écran reste à tester.
- Un réglage persistant agrandit les petites tailles de texte. Il complète les détails accessibles au toucher et au focus ; ce n’est pas une certification d’accessibilité.
- Deux réglages persistants séparent musique et effets. Une protection limite les répétitions du même effet sonore à moins de 45 ms d’intervalle. L’écoute sur appareils réels reste nécessaire pour valider le mix.
- Le bestiaire prioritaire français possède des entrées distinctes pour les huit ennemis ordinaires de Bibliothèque et les dix-huit boss. Le chantier littéraire anglais complet reste ouvert.
- Une victoire standard possède un épilogue et une conséquence narrative, sans imposer un nouveau système de quêtes.

Les captures [desktop](audit-2026-10-09/corrected-combat-desktop.png) et [mobile paysage](audit-2026-10-09/corrected-combat-landscape.png) proviennent du composant de combat rendu statiquement. Elles servent au contrôle de disposition et des assets ; elles ne valident pas les gestes tactiles, le navigateur iOS, le menu global ni une partie authentifiée. Le jeu conserve sa demande de rotation en paysage sur téléphone.

## Statistiques et historique

Le résumé conserve une version de règles (`2026-10-09.1`), les offres de cartes/reliques des combats et leurs choix, ainsi que des informations sur les tours commencés sans carte jouable, les alliés perdus et les objets restants. L’expérience au début de la partie permet de former des cohortes avec version, personnage, difficulté et niveau de méta. Les offres d’événements et de marchands ne sont pas incluses dans ce journal de drafts.

L’administration distingue les abandons des défaites dans les nouvelles cohortes et affiche leurs volumes. La télémétrie détaillée est limitée aux 2 000 derniers résumés ; les agrégats historiques globaux restent séparés. Les anciennes données sont étiquetées `legacy` au lieu d’être attribuées à la version actuelle.

Le compteur de dégâts reste une **perte nette de PV entre entrée et sortie du combat**, pas la somme brute des coups reçus. Les compteurs d’Encre restent ceux des chemins instrumentés ; leur exhaustivité sur tous les effets de reliques n’est pas revendiquée. L’ennemi encore vivant n’est plus présenté comme la cause fatale. Les boss vaincus sont dérivés des combats gagnés de cette partie et non des maîtrises cumulées du compte.

L’historique utilise les snapshots canoniques des parties terminées, y compris les abandons. Les anciens snapshots de deck servent de complément de compatibilité lorsqu’aucun historique canonique correspondant n’est disponible.

## Suivi des 44 actions de l’audit

**Corrigé** signifie que le comportement ou le contenu décrit est implémenté et contrôlé au niveau indiqué. **Partiel** conserve explicitement la condition de sortie non atteinte. Aucun statut ne remplace une validation humaine ou une certification de sécurité.

| Action | État | Résultat et reste à faire |
| --- | --- | --- |
| A01 Collision `ink_surge` | Corrigé | Une définition, compatibilité par ID, garde globale et test du catalogue. |
| A02 Accusés de sauvegarde | Corrigé | Erreurs visibles, accusés vérifiés, retry et tests réseau/métier. |
| A03 Révisions | Corrigé | File client, comparaison atomique, conflits et réponse perdue testés. |
| A04 Finalisation atomique | Partiel | Transaction sérialisable et tests d’échecs ; rollback réel à vérifier sur PostgreSQL isolé. |
| A05 Résultats vérifiables | Partiel | Validation et surface d’actions réduite ; classement non certifié, moteur serveur/rejeu absent. |
| A06 Simulateur | Partiel | Principales divergences corrigées ; IA générique et choix d’événements particuliers simplifiés. |
| A07 Transition D0/D1 | Partiel | Courbes lissées et testées ; taux de victoire humains à mesurer. |
| A08 Contraintes D3–D5 | Corrigé | Règles cumulatives et descriptions explicites. |
| A09 Ressources répétées | Corrigé | Répétition à 100 %, première victoire globale à 125 %. |
| A10 Défaite forcée | Corrigé | Routes jouables, aide passable, action de défaite forcée neutralisée. |
| A11 Pacte et capacité d’Encre | Corrigé | Sacrifice non fatal, gain compté, prérequis visibles. |
| A12 Matrice de builds | Partiel | 960 parties de robot ; deux directions par personnage à confirmer avec joueurs. |
| A13 Offres et signatures | Partiel | Journal et cohortes disponibles ; pas de mécanisme garanti d’assemblage ni de mesure humaine encore. |
| A14 Cadence des drafts | Corrigé | Plus de suppression cachée selon la taille du deck. |
| A15 Événements risqués | Corrigé | Pools risqués réintroduits avant D4 avec poids explicites. |
| A16 Tours sans décision | Partiel | Tours sans carte jouable instrumentés ; contre-jeu des contrôles combinés à valider rencontre par rencontre. |
| A17 Panneaux de boss | Partiel | Dix-huit objectifs et accès aux marqueurs existants ; compréhension par nouveaux joueurs à tester. |
| A18 Entités sans images | Corrigé | Dix SVG ajoutés, chemins contrôlés. |
| A19 Menaces hors champ | Partiel | Vue complète des intentions et cibles, disposition compacte ; gestes réels et safe areas à vérifier. |
| A20 Définitions de télémétrie | Corrigé | PV nets et biome de fin explicités, fausse cause fatale retirée, archétypes inférés. |
| A21 Build et reprise | Partiel | Build, typage et lint passent ; parcours authentifié/reconnexion sur base isolée à valider. |
| A22 Documentation | Corrigé | Ce suivi fait autorité pour les corrections ; valeurs de ressources et cadence documentaire mises à jour. |
| A23 Clavier | Partiel | Activation, focus visible et annulation ajoutés ; parcours complet assisté à vérifier. |
| A24 Lecture | Partiel | Agrandissement persistant ; vérification des petites résolutions et lecteurs d’écran encore nécessaire. |
| A25 Illustrations de cartes | Partiel | Pilote de seize départs couvert ; reconnaissance humaine et extension aux cartes fréquentes restent ouvertes. |
| A26 Scènes de biome | Corrigé | Neuf silhouettes de scène distinctes, dessin vectoriel léger. |
| A27 Mise en scène hors combat | Partiel | Épilogue ajouté ; refonte complète des marchands et événements non réalisée. |
| A28 Audio | Partiel | Volumes séparés et protection contre l’empilement ; mix à écouter sur appareils réels. |
| A29 Alliés et objets | Partiel | Mesures d’usage/perte et simulateur corrigés ; valeur réelle et compréhension à mesurer. |
| A30 Repli de carte | Corrigé | Repli validé, tests forcés et échantillon de 3 500 cartes. |
| A31 Historique canonique | Corrigé | Snapshots terminés conservés, abandon inclus, complément ancien compatible. |
| A32 Bestiaire prioritaire | Partiel | Textes français distincts ; extension et relecture anglaises ouvertes. |
| A33 Conclusion standard | Corrigé | Épilogue autonome affiché à la victoire. |
| A34 Bonus marginaux | Corrigé | Différence avant/après plafonds affichée. |
| A35 Performance cible | Partiel | Build mesuré, télémétrie bornée, assets légers ; pas de profilage sur téléphone réel. |
| A36 Contrats des effets | Partiel | Chemin commun corrigé pour Pacte ; refactor transversal des interactions non terminé. |
| A37 Cohortes | Corrigé | Version, expérience, méta, personnage, difficulté, volumes et abandons séparés. |
| A38 PWA et reconnexion | Partiel | Cache dynamique des routes de jeu évité, retour réseau sans rechargement automatique, erreurs visibles ; mise à jour réelle du service worker à tester. |
| A39 Personnages supplémentaires | Extension | À engager après validation des quatre personnages présents. |
| A40 Biomes et pools supplémentaires | Extension | Aucun contenu de cette taille ajouté dans cette correction. |
| A41 Quêtes et fins multiples | Extension | Épilogue standard fourni ; système de quêtes non ajouté. |
| A42 Défis comparables | Extension | Dépend toujours de la vérification des résultats. |
| A43 Mode infini | Extension | Courbe exponentielle conservée ; nouvelle promesse de mode non définie. |
| A44 Finition artistique exhaustive | Extension | Pilote réalisé ; illustration intégrale du catalogue non réalisée. |

## Vérifications reproductibles

```powershell
npm test
npm run type-check
npm run lint
npm run build
npx vitest run --config docs/audit-2026-10-09/audit-vitest.config.ts
python docs/audit-2026-10-09/corrections-matrix.py
node --import tsx docs/audit-2026-10-09/corrections-map-sample.ts
```

Les journaux se trouvent dans `docs/audit-2026-10-09/corrections-{tests,typecheck,lint,build,audit-probes}.txt`. La sonde de sauvegarde initiale vérifie maintenant le comportement corrigé au lieu de vérifier la présence des défauts. Les tests de persistance couvrent propriété, écriture concurrente, retry identique, échecs de finalisation et absence de navigation prématurée.

Le contrôle supplémentaire `npm run antd:first:check` **échoue encore** sur dix couples fichier/type de composant déjà présents dans les modifications préparées avant cette passe : tableaux d’administration, boutons de combat et sélecteurs existants. La [comparaison avec l’index initial](audit-2026-10-09/corrections-antd-first.json) montre zéro primitive supplémentaire pour ces écarts. Les nouveaux contrôles utilisent AntD/Rogue ; le référentiel du contrôle n’a pas été assoupli. Cette dette de convention reste à résorber.

## Priorités restant réellement ouvertes

1. **Avant une compétition :** exécuter ou rejouer les actions côté serveur et n’admettre que ces résultats dans un classement certifié. Le schéma actuel ne suffit pas.
2. **Avant une diffusion de cette passe :** tester création, reprise, échec transactionnel, double onglet, fin de partie et changement de version PWA sur une base et un compte de test isolés.
3. **Avant d’annoncer l’équilibre validé :** parties humaines D0/D1 avec les quatre personnages, puis D3–D5 ; comparer les cohortes et les séquences de contrôle. Les écarts du robot orientent les essais.
4. **Avant une validation mobile :** jouer les combats chargés, le ciblage, les panneaux et la fin de tour sur Android et iOS ; vérifier l’agrandissement et le clavier avec les vrais menus.
5. **Ensuite :** achever les contrats transversaux d’effets, l’écriture anglaise, le mix sonore et la mise en scène hors combat. Les extensions de contenu viennent après ces validations.
