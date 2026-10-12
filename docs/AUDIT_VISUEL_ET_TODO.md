# Audit visuel et TODO

## Suivi actuel — 11 octobre 2026

Complément du 12 octobre : [animations de combat distinctes](ANIMATIONS_COMBAT_2026-10-12.md), impacts par frappe/cible, poison et saignement, armure, soin, pioche, améliorations et pouvoirs d’encre. Les retours perceptifs sur appareil physique restent à recueillir.

Passe complémentaire : [champ de bataille mobile](PASSE_COMBAT_MOBILE_2026-10-11.md), avec portrait du héros, illustrations ennemies bornées et plus nettes, regroupement des intentions et défilement tactile des rencontres chargées. Redmi Note 11 Pro 5G identifié comme appareil du joueur ; recette physique encore ouverte.

Retour mobile traité : voir le [correctif de lisibilité du combat et des récompenses](CORRECTIF_MOBILE_2026-10-11.md), avec essais en portrait et paysage de faible hauteur. La recette sur téléphone physique reste ouverte.

La [TODO centrale](TODO.md) fait foi pour les priorités ouvertes. Le diagnostic et les cases de l’audit initial sont conservés plus bas comme historique : ils ne décrivent pas tous la version livrée.

| Lot | État confirmé | Suite |
| --- | --- | --- |
| Cartes et ouverture en grand | [275 illustrations intégrées](ILLUSTRATIONS_CARTES_2026-10-10.md), formats adaptés et lecture de l’image entière | Lisibilité des textes, gestes et contrastes sur téléphone réel |
| Ennemis et boss | [101 portraits, dont 18 boss](ILLUSTRATIONS_ENNEMIS_BOSS_2026-10-10.md), y compris les entités secondaires | Lisibilité des rencontres chargées et coût sur téléphone modeste |
| Carte, marchand, repos, atelier et événements | [45 scènes couvrant les 50 événements](ILLUSTRATIONS_LIEUX_2026-10-10.md), déjà intégrées | États particuliers des choix et achats, compréhension sans hover |
| Combat et parcours | [Recette navigateur bureau/mobile émulé](PASSE_FINALE_EQUILIBRAGE_ET_RECETTE_2026-10-10.md), réglages de vitesse et mouvement réduit présents | Appareils physiques, accessibilité et finition des feedbacks |
| Bibliothèque, méta-progression et pages du menu | [Refonte implémentée le 11 octobre](REFONTE_MENUS_2026-10-11.md) : UI-01 à UI-05 | Compléments de recette UI-06, appareils physiques et performances |

### Bibliothèque, méta-progression et pages du menu

**Périmètre réalisé à la demande du joueur.** La [passe du 11 octobre](REFONTE_MENUS_2026-10-11.md) reprend l’identité de bibliothèque fantastique entre l’accueil, les investissements permanents et les expéditions. Les critères de conception ci-dessous sont conservés ; les preuves et limites de recette sont dans le rapport.

L’accueil et le cadre commun réutilisent `panlibrarium-v2.webp`. La Bibliothèque possède désormais des rayonnages illustrés, neuf ressources nommées et des tomes lisibles par biome. Les règles des prérequis et du plafonnement sont conservées ; leur présentation et leur consultation ont été reprises.

#### UI-01 — Cadre commun

- [x] Définir une composition commune : titre et repère de lieu, navigation/retour, action principale, contenu et informations secondaires.
- [x] Harmoniser typographie, matières, cadres, espacements, icônes et boutons avec les cartes et les lieux existants ; garder des surfaces calmes derrière les textes longs.
- [x] Prévoir les états normal, survol, focus, pressé, indisponible et en attente, avec une raison lisible lorsqu’une action est bloquée.
- [x] Harmoniser chargement, erreur et réessai, liste vide et retour à la page précédente ; conserver les filtres utiles lors du retour d’une fiche.
- [x] Réutiliser les décors et composants existants lorsque leur composition convient. Lister les illustrations réellement manquantes après le prototype, avant toute nouvelle génération.

#### UI-02 — Bibliothèque et progression permanente

Route : `/library`. Composants : [LibraryClient](../src/app/library/_components/LibraryClient.tsx), [ResourceBar](../src/app/library/_components/ResourceBar.tsx), [BiomeSection](../src/app/library/_components/BiomeSection.tsx), [HistoireSlot](../src/app/library/_components/HistoireSlot.tsx), [HistoireModal](../src/app/library/_components/HistoireModal.tsx).

- [x] Composer la Bibliothèque comme un lieu : rayonnages ou tomes par biome, ambiance peinte et éclairage cohérent, sans masquer les informations de progression.
- [x] Rendre les ressources possédées, les dépenses possibles et la progression par biome faciles à comparer ; proposer une présentation compacte accessible sur mobile.
- [x] Distinguer clairement les histoires acquises, achetables, bloquées par leurs prérequis et bloquées par le coût, avec symbole et texte en plus de la couleur.
- [x] Montrer les liens entre histoires et permettre de retrouver le prérequis manquant ; éviter un arbre miniature illisible sur téléphone.
- [x] Recomposer la fiche d’histoire : illustration/identité du tome, récit, coût possédé/requis, prérequis et conséquence concrète du déblocage.
- [x] Mettre en évidence le **gain réellement appliqué** après plafonnement des bonus, en réutilisant le calcul existant. Distinguer bonus de combat, carte/relique débloquée et progression narrative.
- [x] Donner un feedback de déblocage bref : ressources mises à jour, histoire restaurée, branche disponible ; prévoir mouvement réduit, échec réseau et achat en attente.
- [x] Réintégrer le guidage du premier achat dans la nouvelle composition, puis vérifier reprise et persistance après rechargement.

Critère de clôture : sur bureau et téléphone, un joueur peut identifier ce qu’il possède, ce qu’il peut acheter, ce qui lui manque et ce que l’achat apporte. Un achat n’est enregistré qu’une fois et reste visible après rechargement. La refonte graphique ne change pas à elle seule les coûts ou bonus d’équilibrage.

#### UI-03 à UI-05 — Pages accessibles depuis le menu

| Lot | Page | Travail prévu | Vérification attendue |
| --- | --- | --- | --- |
| UI-03 | Accueil `/` | Intégrer le décor existant au cadre commun ; hiérarchie Jouer/reprendre, Bibliothèque et liens secondaires ; cohérence des commandes | États connecté/déconnecté et partie en cours compréhensibles ; bandeaux d’installation/mise à jour sans masquer les actions |
| UI-03 | Connexion et inscription `/auth/signin`, `/auth/signup` | Portail visuel cohérent, formulaires et erreurs lisibles, retour clair | Clavier mobile, saisie, erreur, attente et redirection vers le jeu fonctionnent |
| UI-04 | Collection `/library/collection` | Codex cohérent avec la Bibliothèque : filtres, cartes découvertes/verrouillées, fiche et illustration agrandie | Filtres et informations accessibles au toucher et au clavier ; image ouverte sans action involontaire |
| UI-04 | Bestiaire `/library/bestiary` | Réutiliser les portraits peints ; hiérarchiser créature, maîtrise, paliers de lore et récompenses | Comprendre ce qui est découvert, ce qui reste à débloquer et comment progresser |
| UI-05 | Historique `/runs` | Journal d’expéditions : résultat, personnage, difficulté, durée, deck et détails | Liste vide, longue liste, erreur et détail de partie lisibles sur petit écran |
| UI-05 | Classement `/leaderboard` | Présentation cohérente, filtres et détails lisibles | Règles de classement et statut non certifié compréhensibles ; aucune apparence de certification nouvelle |
| UI-05 | Règles `/rules` | Manuel illustré avec navigation par sujet et exemples réutilisant les cartes/icônes | Trouver une règle sans parcourir toute la page ; textes français/anglais et petits écrans lisibles |

Les réglages accessibles depuis les menus de partie doivent conserver la même présentation des contrôles. La page d’administration `/admin/stats` reste un outil interne, hors du lot artistique destiné aux joueurs.

#### UI-06 — Recette commune et ordre

- [ ] Captures avant/après pour chaque route et ses états importants, en bureau, 320 px, 390 px et paysage.
- [x] Navigation au clavier et focus visible/restauré vérifiés ; noms des filtres et contraste sur décor revus visuellement. Cela ne constitue pas un audit WCAG complet.
- [ ] Navigation tactile sans hover obligatoire ; boutons accessibles, textes longs FR/EN, défilement des fenêtres et safe areas.
- [x] Compte neuf, progression intermédiaire et progression avancée ; ressources insuffisantes, prérequis manquants et bonus déjà plafonné.
- [ ] Chargement lent, image indisponible, erreur serveur, réessai et rechargement après déblocage.
- [ ] Mesure de fluidité et mémoire sur téléphone modeste ; respect du mouvement réduit et coexistence avec les bandeaux PWA.
- [ ] Essais sur Android et iPhone physiques. Les captures en émulation ne clôturent pas ce point.

Ordre : **cadre commun → Bibliothèque et fiche d’histoire → accueil/authentification → collection/bestiaire → historique/classement/règles**, avec recette à chaque étape. Réutiliser les identifiants UI-01 à UI-06 de [TODO.md](TODO.md) pour éviter deux listes de statuts contradictoires.

## Audit initial — historique conservé

La [passe graphique appliquée le 9 octobre 2026](PASSE_GRAPHIQUE_2026-10-09.md) ajoute neuf décors illustrés, des gravures pour les cartes sans image, des portraits et une présentation en portrait sur téléphone. Ce rapport contient les captures et les contrôles ; l’audit ci-dessous conserve sa liste historique.

Mise à jour du 9 octobre 2026 : les dix entités secondaires de boss manquantes et les cartes de départ disposent maintenant d’illustrations. Les scènes de biome, la vue d’ensemble mobile, la taille du texte, les volumes séparés et l’épilogue ont été ajoutés. Voir le [suivi des corrections](CORRECTIONS_AUDIT_2026-10-09.md) pour les preuves et les validations encore ouvertes. La défaite automatique du tutoriel est supprimée ; les remarques historiques ci-dessous ne constituent pas un état actuel de cette mécanique.

## Objectif

Faire en sorte que chaque phase ressemble à un lieu traversé dans un jeu, et non à un menu posé sur un fond sombre.

Le jeu possède déjà une direction cohérente : bibliothèque occulte, manuscrits vivants, encre, palette sombre, accents ambrés, biomes différenciés et cartes lisibles. La prochaine passe ne doit pas remplacer cette identité, mais lui donner davantage de profondeur, d'incarnation et de mise en scène.

## Diagnostic général

Le combat ressemble déjà à une scène de deckbuilder. Le marchand et les salles de choix ressemblent encore davantage à des interfaces habillées.

Il existe actuellement deux niveaux de finition :

- le combat possède un décor, des personnages et des effets ;
- le marchand et les événements reposent principalement sur du texte, des cadres, des dégradés et des symboles typographiques.

Le principal chantier n'est donc pas une refonte complète de l'interface. Il faut surtout :

1. donner une présence physique aux lieux et aux personnages ;
2. renforcer la hiérarchie entre informations vitales et informations secondaires ;
3. rendre les décisions compréhensibles en une seconde ;
4. ajouter des réactions visuelles et sonores aux actions importantes ;
5. réduire l'impression de grille ou de fiche lorsque celle-ci n'est pas nécessaire.

## Principes à conserver

- La palette sombre et les accents ambrés.
- La typographie narrative actuelle.
- Les identités colorées des types de cartes et des biomes.
- La structure générale du combat : champ de bataille au-dessus, main et actions en dessous.
- Les intentions ennemies, dégâts entrants, PV, énergie et coûts toujours immédiatement lisibles.
- Les cartes comme principal objet de jeu.
- La compatibilité desktop et mobile.
- Une interface sobre : la profondeur ne doit pas devenir du bruit.

## Règles de hiérarchie

### Informations toujours visibles

Ces informations ne doivent jamais dépendre uniquement d'un hover, car elles sont nécessaires pour décider :

- PV actuels et maximums ;
- armure ;
- intention ennemie ;
- dégâts entrants ;
- énergie et encre ;
- coût des cartes ;
- disponibilité d'une action ;
- coût et récompense principaux d'un choix ;
- or disponible et prix chez le marchand.

### Informations compactables en icônes

Ces informations peuvent être représentées par une icône accompagnée d'un tooltip sur desktop et d'un panneau au toucher sur mobile :

- détails des buffs et debuffs ;
- description complète d'une capacité ;
- origine ou famille d'un effet ;
- explication d'une mécanique connue ;
- statistiques secondaires d'un allié ou ennemi ;
- texte complet d'une relique ;
- détails d'un objet marchand.

Chaque icône doit conserver un libellé accessible. Aucune information ne doit devenir inaccessible sur écran tactile.

## Combat

### État actuel

Le combat est l'écran qui ressemble le plus à un jeu : décors propres aux biomes, illustrations ennemies, intentions, ciblage, états et feedbacks sont déjà présents.

Cependant, les unités sont encore très enfermées dans des rectangles. Au premier regard, elles peuvent être perçues comme des fiches de statistiques plutôt que comme des acteurs présents sur un champ de bataille.

### Direction recherchée

Voir d'abord les personnages et comprendre ensuite leurs données.

Le champ de bataille doit donner l'impression d'un espace avec un avant-plan, un sol et une profondeur, sans perdre la précision tactique du deckbuilder.

### Profondeur et sol

- Ajouter une zone de sol distincte du fond : table, dalle, parchemin, pierre, sable, herbe ou plancher selon le biome.
- Ajouter une ombre de contact elliptique sous chaque personnage.
- Faire varier légèrement l'échelle et la position verticale des unités pour suggérer la profondeur.
- Ajouter une ligne d'horizon ou une transition fond/sol discrète.
- Utiliser un éclairage coloré cohérent avec chaque biome.
- Ajouter quelques particules atmosphériques lentes et peu contrastées : poussière, cendres, encre, neige, spores ou braises.
- Conserver les effets décoratifs derrière les informations et respecter `prefers-reduced-motion`.

### Personnages moins « fiches »

- Agrandir la zone d'illustration des ennemis et alliés.
- Réduire le fond opaque permanent autour de chaque unité.
- Remplacer la grande fiche par une composition en couches : illustration, ombre, PV, intention et petits états.
- Laisser le portrait ou la silhouette dépasser légèrement du cadre fonctionnel.
- Afficher le nom de façon plus discrète tant que l'unité n'est pas survolée ou sélectionnée.
- Regrouper les états secondaires en icônes compactes.
- Sur desktop, afficher le détail complet au hover ou au focus clavier.
- Sur mobile, ouvrir le panneau de détail au toucher sans empêcher le ciblage.
- Conserver directement visibles l'intention, les PV, l'armure et les dégâts entrants.

### Hiérarchie et bruit visuel

Les trois informations dominantes doivent être :

1. ce que les ennemis vont faire ;
2. quelles cartes peuvent être jouées ;
3. combien de PV, d'énergie et d'encre sont disponibles.

Les piles, l'inventaire, les effets secondaires et les contrôles de vitesse peuvent être visuellement atténués tant qu'ils ne sont pas sollicités.

### Feedbacks

- Renforcer légèrement l'impact d'une attaque avec déplacement court, flash local et ombre.
- Matérialiser clairement la source et la cible d'un effet.
- Donner une animation distincte au gain d'armure, au soin, au poison et à l'encre.
- Garder les animations courtes et compatibles avec le contrôle de vitesse existant.
- Éviter les secousses globales répétées qui nuiraient à la lisibilité.

## Marchand

### État actuel

Le marchand est lisible et fonctionnel, mais sa composition reste proche d'une boutique d'application : titre, montant d'or, grille de produits et boutons.

Les cartes vendues possèdent une vraie présence, tandis que les autres objets sont souvent représentés par de grands caractères abstraits.

### Direction recherchée

Le joueur doit avoir l'impression de rencontrer quelqu'un dans un lieu particulier, puis de regarder ce qui est posé devant lui.

### Composition proposée

- Ajouter une silhouette ou un portrait du marchand dans le tiers supérieur.
- Ajouter une courte réplique à l'arrivée, à l'achat, à la relance et au départ.
- Installer les offres sur un comptoir, une table ou une étagère.
- Intégrer l'or et la relance à cette composition au lieu de les isoler comme de simples contrôles.
- Placer la sortie de façon stable et clairement secondaire.
- Prévoir une ambiance spécifique au marchand : lumière chaude, poussière, bougies ou objets suspendus.

### Objets

- Remplacer progressivement les caractères `♥`, `✦`, `▲`, `✕` et similaires par des icônes ou petites illustrations cohérentes.
- Créer au minimum des visuels réutilisables pour : soin, relique, suppression, amélioration de PV, objet utilisable et allié.
- Conserver le nom, le prix et l'effet principal visibles.
- Mettre les détails supplémentaires dans un tooltip desktop et un panneau tactile mobile.
- Différencier clairement une offre trop chère, indisponible et déjà vendue.

### Feedback d'achat

- Faire brièvement voyager l'objet vers le HUD ou l'inventaire.
- Ajouter un éclat et un son de pièces lors du paiement.
- Laisser l'emplacement matériellement vide ou marqué « vendu ».
- Faire réagir le marchand à l'achat et à l'impossibilité de payer.
- Donner à la relance une courte animation de remplacement des offres.

## Salles de choix et événements

### État actuel

Les salles sont élégantes et cohérentes avec l'univers, mais leur structure est très répétitive : titre, texte, statistiques et rectangles de choix. Des événements différents peuvent donc produire une sensation visuelle similaire.

### Direction recherchée

Chaque événement doit d'abord être perçu comme une situation, puis comme une décision.

### Illustrations par famille

Il n'est pas nécessaire de produire immédiatement une image unique par événement. Une bibliothèque de scènes réutilisables peut couvrir les familles principales :

- autel ou sacrifice ;
- porte, passage ou exploration ;
- manuscrit, archive ou connaissance ;
- rencontre avec un personnage ;
- reliquaire ou trésor ;
- feu, repos ou soin ;
- atelier, encrier ou amélioration ;
- corruption, malédiction ou inconnu.

La teinte, les particules et quelques éléments superposés peuvent ensuite varier selon l'événement.

### Choix courts et tranchés visuellement

Chaque choix doit séparer clairement :

- son verbe ou son intention ;
- son coût certain ;
- sa récompense certaine ;
- son risque ou sa part inconnue.

Exemples de résumés :

- `−12 PV` / `+1 relique rare` ;
- `Détruire une carte` / `Gagner 80 or` ;
- `Risque inconnu` ;
- `Quitter sans risque`.

Codes visuels suggérés :

- gain : vert, or ou cyan selon la ressource ;
- perte de PV : rouge ;
- sacrifice ou corruption : pourpre ;
- information inconnue : violet sombre ;
- action neutre ou sortie : gris clair.

La couleur ne doit jamais être le seul indicateur : utiliser aussi une icône et un libellé.

### Identité par salle

- Repos : lumière chaude, braises, respiration lente.
- Amélioration : plume, encrier, sceaux, lignes d'écriture animées.
- Événement : scène narrative centrale et ombres plus marquées.
- Bazar de reliques : comptoir, tentures et objets suspendus.
- Salle pré-boss : tension, grande porte, silhouette ou signe du boss.

## Cartes et illustrations

Le système graphique des cartes est solide, mais la majorité des cartes repose encore sur des couleurs et symboles génériques.

Une illustration unique pour chaque carte n'est pas nécessaire à court terme. Une première bibliothèque de 20 à 30 illustrations d'archétypes réutilisables apporterait déjà beaucoup de personnalité.

Exemples de familles : attaque à la plume, rature, protection de pages, poison d'encre, invocation, archivage, copie, brûlure, sacrifice, folie, rythme oral et contrôle du temps.

Les cartes partageant une illustration doivent conserver un signe distinctif fort : cadrage, glyphe, couleur d'encre ou effet superposé.

## Audio et mouvement

- Ajouter des sons courts aux achats, choix, gains de reliques et améliorations.
- Associer des textures sonores différentes aux biomes et salles.
- Réserver les animations les plus fortes aux décisions importantes.
- Respecter le réglage de vitesse de combat.
- Ajouter une option de réduction des mouvements et éviter de cacher une information pendant une animation.

## Onboarding et tutoriel

Le premier contact doit expliquer le sens de l'expédition avant ses règles. Le joueur ne construit pas seulement un deck : il explore des récits fragmentés afin de retrouver les histoires perdues et restaurer la mémoire du Panlibrarium.

- [x] Ajouter un prologue en trois temps avant la première préparation de run.
- [x] Expliquer le Panlibrarium, la disparition des histoires et le rôle du joueur.
- [x] Résumer la boucle : explorer, récupérer, rapporter.
- [x] Laisser le prologue passable et ne l'afficher que pendant la première expédition.
- [x] Renforcer visuellement le panneau du tutoriel de combat.
- [x] Afficher sa progression et distinguer les étapes purement informatives des actions obligatoires.
- [x] Conserver les étapes interactives consacrées au pouvoir d'encre et à la carte encrée.
- [x] Faire passer la défaite scénarisée contre l'élite par l'écran de conclusion au lieu de rediriger immédiatement.
- [x] Ajouter des textes de défaite distincts pour un combat normal, un élite et un boss.
- [ ] Ajouter ultérieurement une illustration dédiée au prologue du Panlibrarium.
- [ ] Vérifier avec de nouveaux joueurs que le but du jeu peut être reformulé après le prologue.

## TODO priorisée

### P0 — Prototype visuel et lisibilité

- [ ] Faire une capture de référence desktop et mobile pour le combat, le marchand et au moins trois salles de choix.
- [ ] Définir précisément les informations de combat toujours visibles et celles accessibles au hover/toucher.
- [x] Prototyper une unité de combat « personnage d'abord » avec cadre allégé, ombre au sol, PV, armure et intention visibles.
- [x] Supprimer les emplacements vides visibles sur le champ de bataille desktop.
- [x] Agrandir les illustrations et les afficher comme des silhouettes posées dans la scène plutôt que comme des vignettes recadrées.
- [x] Conserver le tooltip/focus desktop détaillé pour les états secondaires de cette unité.
- [ ] Ajouter l'équivalent tactile mobile sans créer de conflit avec le ciblage.
- [x] Prototyper une couche de sol, une ligne d'horizon, un éclairage et des ombres de contact sur les biomes.
- [ ] Vérifier que la nouvelle profondeur ne réduit pas le contraste des intentions et des cibles.
- [ ] Ajouter aux choix un résumé explicite coût / récompense / risque.
- [ ] Vérifier le contraste, la navigation clavier et les libellés accessibles de toutes les icônes.

### P1 — Combat

- [x] Déployer la nouvelle présentation des unités sur les ennemis, alliés et joueur.
- [x] Créer une variante de sol cohérente pour chaque biome.
- [x] Ajouter une ligne d'horizon ou transition fond/sol discrète.
- [x] Ajouter les ombres de contact et un éclairage léger par biome.
- [x] Ajouter des particules atmosphériques légères avec mode de mouvement réduit.
- [ ] Réduire le poids visuel des panneaux, piles et commandes secondaires hors interaction.
- [ ] Harmoniser les icônes des buffs et debuffs.
- [ ] Ajouter des feedbacks distincts pour attaque, armure, soin, poison et encre.
- [ ] Tester les combats à 1, 2 et plusieurs ennemis pour éviter toute surcharge.
- [ ] Tester les hauteurs d'écran réduites et le mode paysage mobile.

### P1 — Marchand

- [x] Concevoir un visuel ou une silhouette du marchand.
- [x] Concevoir un décor de comptoir ou d'étagère.
- [x] Recomposer l'écran autour du marchand et du comptoir.
- [x] Créer des icônes SVG cohérentes pour soin, relique, suppression, PV max, objet et allié.
- [x] Remplacer les grands caractères typographiques provisoires.
- [x] Ajouter des réactions textuelles courtes du marchand à l'arrivée, à l'achat, à la relance et au départ.
- [x] Ajouter un feedback d'achat visuel et sonore.
- [x] Ajouter un feedback sonore court de relance et renouveler la réplique du marchand.
- [ ] Vérifier les états trop cher, inventaire plein, indisponible et vendu.
- [ ] Vérifier que les produits restent compréhensibles sans hover sur mobile.

### P1 — Salles de choix

- [ ] Définir les familles visuelles d'événements.
- [ ] Créer une première vignette pour chaque famille prioritaire.
- [ ] Associer chaque événement à une famille visuelle.
- [x] Afficher séparément les coûts explicites, gains identifiables, actions obligatoires et risques sur les choix.
- [x] Ajouter un signe lisible en plus de la couleur aux résumés de coût, gain, action et risque.
- [x] Donner une ambiance distincte au repos, à l'amélioration, à l'événement et au bazar.
- [x] Ajouter un feedback de résolution après un choix.
- [x] Donner à la salle pré-boss une grande porte, une tension propre et trois choix visuels avec conséquence annoncée.
- [ ] Vérifier que les choix les plus importants dominent visuellement sans rendre la sortie invisible.

### P2 — Bibliothèque artistique

- [ ] Définir une charte d'illustration commune : cadrage, palette, lumière et texture.
- [ ] Lister 20 à 30 familles d'illustrations de cartes réutilisables.
- [ ] Prioriser les cartes de départ et les cartes les plus fréquemment proposées.
- [ ] Créer les premières illustrations et leurs variantes de couleur ou glyphes.
- [ ] Créer une petite bibliothèque d'objets, reliques et éléments de décor.
- [ ] Documenter les règles de réutilisation afin d'éviter que deux cartes différentes paraissent identiques.

### P2 — Finition et validation

- [ ] Harmoniser les durées et courbes des animations.
- [ ] Ajouter les sons manquants et vérifier leur volume relatif.
- [x] Respecter globalement `prefers-reduced-motion` pour les animations, transitions et défilements.
- [ ] Tester `prefers-reduced-motion` sur les principaux écrans et ajuster les rares animations qui exigent une alternative statique.
- [ ] Tester navigation clavier, focus, lecteur d'écran et contrastes.
- [ ] Comparer de nouvelles captures aux captures de référence.
- [ ] Faire tester la compréhension des intentions et des choix sans explication orale.
- [ ] Vérifier les performances sur mobile avant d'étendre les particules.

## Ordre de réalisation recommandé

1. Prototyper une seule unité de combat et un seul biome avec sol.
2. Valider la lisibilité desktop et mobile.
3. Généraliser la présentation du combat.
4. Recomposer le marchand et créer ses icônes essentielles.
5. Ajouter les résumés coût/récompense aux événements.
6. Créer les vignettes par famille de salles.
7. Construire progressivement la bibliothèque d'illustrations de cartes.
8. Terminer par l'audio, les particules et les animations de finition.

## Critères de réussite

- Un joueur identifie immédiatement s'il se trouve en combat, chez le marchand, au repos, dans un atelier ou face à un événement.
- En combat, le regard va d'abord vers les personnages et leurs intentions, pas vers les cadres.
- Les informations vitales restent compréhensibles sans hover.
- Un choix révèle son coût, son gain et son risque en moins d'une seconde.
- Le marchand donne l'impression d'être un personnage et non le titre d'une grille de produits.
- Mobile et desktop donnent accès aux mêmes informations.
- Les effets renforcent l'univers sans ralentir les décisions ni masquer les données tactiques.

