# Panlibrarium audit complet et feuille de route

> Les constats de cet audit portent sur la version avant correction. Le [suivi des corrections du 9 octobre](CORRECTIONS_AUDIT_2026-10-09.md) indique les changements effectivement livres, leurs tests et les limites encore ouvertes.

Audit réalisé le **9 octobre 2026** sur le répertoire de travail de **Panlibrarium / RogueNext**, y compris les modifications locales déjà présentes. Destinataire : conception et développement du jeu.

**Verdict : une alpha riche, avec une vraie identité de deckbuilder, mais une fiabilité et un équilibrage encore insuffisamment établis pour une bêta largement ouverte.** L’Encre, les personnages et les énigmes de boss constituent le cœur à préserver. La priorité est de rendre les règles, les sauvegardes et les mesures fiables, puis de travailler les premières parties, les écarts de difficulté et la lisibilité. Ajouter immédiatement davantage de cartes ou de biomes disperserait l’effort.

Cet audit couvre le combat, la difficulté, les builds, les personnages, les cartes, les reliques, les objets, les alliés, les ennemis, les 18 boss, les routes, l’économie, la progression, la narration, la rejouabilité, les graphismes, le son, l’ergonomie et la qualité technique. Les tâches proposées figurent dans un backlog ordonné, avec critères de validation.

## 1 Portée et niveau de preuve

Trois niveaux sont employés : **confirmé** pour un comportement lu dans le code ou reproduit ; **signal** pour un résultat de simulation qui demande une interprétation ; **proposition** pour une décision de design à tester.

Vérifications réalisées :

- Lecture croisée du moteur, des données, des écrans, de la persistance et des audits existants.
- Suite de **586 tests sur 45 fichiers**, tous réussis.
- Lint réussi avec avertissements de hooks et dépréciation de la commande.
- Vérification TypeScript réussie sur le projet avant ajout des outils documentaires de cet audit.
- Exécution des cinq audits existants : cartes, reliques, déblocages, histoires et cadence des cartes signatures.
- **31 scénarios de 100 runs**, soit **3 100 runs comparatifs**, avec le simulateur existant inchangé. Six scénarios ont ensuite été rejoués en mode détaillé, soit 600 runs supplémentaires de diagnostic, sans constituer de nouveaux échantillons indépendants. Une simulation pilote de 100 runs a également été réalisée.
- Deux reproductions ciblées des défauts de sauvegarde, toutes deux concluantes.
- Inspection visuelle de rendus statiques des vrais composants et des SVG du jeu : planche de cartes et ennemis, combat desktop et variante mobile.
- Tentative de build de production : échec de récupération des polices Google Fonts dans cet environnement à accès réseau restreint. Ce résultat ne démontre pas une erreur de compilation du moteur, mais ne permet pas de certifier le build de production actuel.

**Limites déterminantes.** Il ne s’agit pas d’un playtest humain complet dans l’application authentifiée. Les rendus sont isolés, sans navigation, hydratation React ni validation tactile sur appareil réel ; ils utilisent des polices de remplacement. La durée réelle, le plaisir, la fatigue, le son perçu, la reprise avec une vraie base et la performance mobile restent à mesurer. Aucune donnée de joueurs en production n’a été consultée. Les probabilités publiées ici décrivent le robot et ses scénarios, pas les chances de victoire d’un joueur.

Référence Git : `83102adf2033524090a0c1f8b34cd514f390b0d8`, **augmentée de nombreuses modifications locales**. Le commit seul ne reproduit donc pas cet état.

## 2 Synthèse et décisions immédiates

| Domaine | Diagnostic | Décision |
| --- | --- | --- |
| Identité et intérêt | L’Encre, la bibliothèque et les mythologies donnent une direction distincte | Montrer plus tôt les décisions propres à l’Encre |
| Combat | Moteur riche, nombreuses interactions, tests utiles | Stabiliser la vérité des règles et des aperçus |
| Difficulté | Rupture forte entre D0 et D1 ; empilement de contraintes en haut de l’échelle | Recalibrer par acte, personnage et profil réel |
| Builds | Diversité présente ; mesures actuelles trop biaisées pour un classement fiable | Corriger le simulateur avant les nerfs globaux |
| Ennemis et boss | 18 boss avec mécaniques spécifiques ; bon potentiel tactique | Améliorer contre-jeu, pédagogie et visibilité |
| Progression | Beaucoup de déblocages, mais forte influence des bonus et pénalité de répétition | Récompenser l’expérimentation |
| Graphismes | Interface cohérente, illustrations provisoires, cartes peu différenciées | Prioriser les cartes de départ et les objets de boss |
| Mobile | Dispositifs spécifiques présents, mais informations réparties entre gestes et panneaux | Tester les combats encombrés et les erreurs de ciblage |
| Narration | Univers porteur, textes de bestiaire répétitifs, conclusion encore incomplète | Finir un arc court avant d’étendre les systèmes |
| Fiabilité | Deux défauts de sauvegarde reproduits ; finalisation fragile | Bloquant avant une ouverture plus large |

**Les huit décisions les plus utiles :**

1. Corriger la collision de l’identifiant `ink_surge`.
2. Fiabiliser l’accusé de sauvegarde, la détection des modifications et la finalisation d’une run.
3. Construire des profils de simulation à partir des vraies histoires et des vrais déblocages.
4. Revoir le passage D0 vers D1 avant de retoucher tous les dégâts.
5. Remplacer ou contextualiser explicitement la défaite forcée du tutoriel.
6. Revoir la réduction globale à 20 % des ressources après une première victoire.
7. Rendre les intentions, les coûts et le contre-jeu des boss lisibles sans recherches dans plusieurs panneaux.
8. Donner une identité visuelle aux cartes les plus fréquentes et aux entités qui portent les énigmes des boss.

## 3 Contenu réellement présent

| Élément | Volume observé | Précision |
| --- | --- | --- |
| Personnages | 4 | Scribe, Bibliothécaire, Griot, Fou |
| Biomes | 9 | Bibliothèque et 8 mythologies |
| Définitions de cartes fusionnées | 276 entrées | **275 identifiants uniques**, en raison de `ink_surge` |
| Catalogue analysé par audit:cards | 260 entrées | Le script examine le catalogue lootable, pas le catalogue fusionné |
| Cartes jouables de ce catalogue | 251 | Selon la définition du script existant |
| Cartes actives de ce catalogue | 237 | Dont 40 de bestiaire et 197 hors bestiaire |
| Reliques | 194 | 29 communes, 64 inhabituelles, 71 rares, 30 de rareté boss |
| Reliques disponibles initialement | 40 | Selon l’audit de déblocage des reliques |
| Définitions ennemies | 101 | 54 normales non scriptées, 19 élites, 18 boss, 10 entités scriptées |
| Alliés | 8 | Cap de 3 emplacements |
| Objets utilisables | 12 | Cap initial de 3 objets |
| Histoires permanentes | 45 | 5 par biome |
| Conditions de run | 50 | Incluent les modes et 18 conditions dérivées des boss |
| Structure standard | 3 étages de 16 profondeurs | Les nœuds alternatifs ne sont pas tous parcourus |
| Illustrations de cartes enregistrées | 3 | Frappe, Défense et Afflux d’encre |

Le volume est suffisant pour tester une expérience durable. Le chantier principal est la qualité des choix, leur accessibilité et leur cohérence. **Une signature mécanique distincte n’est pas une preuve de puissance équilibrée ni d’intérêt en partie.** Les scripts anti-doublons apportent une garantie utile mais limitée.

Les catalogues exhaustifs associés à cet audit sont `cartes.csv`, `reliques.csv` et `ennemis.csv`, dans `docs/audit-2026-10-09/`. Ils servent à filtrer le contenu ; ils ne constituent pas une note individuelle de chaque combinaison.

## 4 Problèmes confirmés à traiter en premier

### Collision de définition de carte

**Confirmé — priorité P0.** `ink_surge` est défini dans `starter-deck.ts` comme une compétence de départ qui donne 3 Encre. Le même identifiant apparaît dans `cards.ts` comme une carte inhabituelle qui donne 2 Encre, améliore une carte aléatoire et pioche une carte, avec une variante encrée.

`allCardDefinitions` concatène les deux catalogues. `buildCardDefsMap` conserve la dernière définition pour un identifiant donné. La version lootable prend donc la place de la version de départ lors de la résolution par registre. Un accès par recherche dans le tableau peut au contraire retrouver la première version.

**Conséquence :** le même nom peut désigner des effets différents selon le chemin utilisé ; tous les decks de départ comprennent cet identifiant. L’équilibrage de l’Encre ne repose pas sur une définition univoque.

**À faire :** décider de la définition canonique, renommer l’autre si les deux cartes sont voulues, traiter les sauvegardes et déblocages concernés, puis ajouter une vérification d’unicité sur le catalogue fusionné. Ne pas simplement changer l’ordre des tableaux.

Sources : `src/game/data/starter-deck.ts`, `src/game/data/cards.ts`, `src/game/data/index.ts` ; reproduction dans `content-diagnostics.json`.

### Sauvegarde annoncée implicitement réussie malgré une erreur

**Confirmé par reproduction — priorité P0.** Les Server Actions renvoient les erreurs métier sous la forme `{ success: false, ... }`. Le hook `useAutoSave` considère la promesse résolue comme un succès et met à jour son repère de dernière sauvegarde sans vérifier `success` ni `data.saved`.

**Conséquence :** une erreur de base ou un refus d’enregistrement peut empêcher une nouvelle tentative pour le même état. Le joueur n’a pas de garantie que sa dernière action est conservée.

**À faire :** vérifier le résultat, conserver un état « à sauvegarder » jusqu’à confirmation, afficher les échecs et prévoir une reprise avec temporisation. Une requête résolue n’est pas un enregistrement confirmé.

Sources : `src/app/game/_hooks/use-auto-save.ts`, `src/lib/errors/handlers.ts` ; `reproduce-autosave.audit.tsx`.

### Modifications importantes absentes de la clé de sauvegarde

**Confirmé par reproduction — priorité P0.** La clé de déduplication du hook ne couvre pas tout l’état jouable. Une modification de l’Encre seule n’y apparaît pas. Le contenu des cartes, les améliorations, plusieurs états, objets et autres valeurs ne sont pas entièrement représentés non plus.

**Conséquence :** une action peut rester non persistée jusqu’à une autre modification qui change la clé. Le mécanisme `pagehide` atténue certains cas, sans assurer une sauvegarde en cas de fermeture brutale ; il réutilise aussi une condition de déduplication.

**À faire :** préférer une révision monotone de l’état persistant ou une sérialisation canonique explicitement définie. Protéger aussi contre les réponses réseau reçues dans le désordre et les écritures concurrentes de deux onglets.

La reproduction jointe établit précisément le cas « Encre seule ». Les autres champs cités demandent leurs scénarios de régression propres.

### Fin de run partiellement validée

**Risque établi par le flux de code — priorité P0.** `endRunForUser` marque d’abord la run terminée, puis synchronise la progression, crée les snapshots et le résumé, et supprime la run. Ces étapes ne forment pas une transaction unique. Une nouvelle tentative s’arrête si la run est déjà terminale.

**Conséquence possible en cas de panne intermédiaire :** récompenses, statistiques et historique divergent, et le nouvel appel ne répare pas l’opération. La création d’une nouvelle run supprime aussi des enregistrements terminés.

**À faire :** rendre la finalisation atomique ou durablement reprise avec un identifiant unique et des étapes idempotentes. Conserver la source jusqu’à confirmation de tous les effets. Valider par injection d’échecs à chaque étape.

Sources : `src/server/services/run/run-lifecycle.service.ts`, `run-persistence.service.ts`, `run-progression-sync.service.ts`. Aucune panne réelle de production n’est affirmée ici.

### Frontière de confiance insuffisante pour le classement

**Confirmé dans les entrées serveur — P0 avant toute compétition publique.** Les deux entrées de sauvegarde acceptent `state: z.any()`. La fin de run accepte notamment statut, ressources et compteurs fournis par le client. Le contrôle de propriété de la run existe ; il ne valide pas la légitimité du résultat.

**Conséquence :** les classements et les mesures de progression ne disposent pas d’une preuve suffisante de partie légitime. Les ressources reçues ne sont pas limitées à un catalogue de clés et de montants autorisés dans ces entrées.

**À faire :** validation de schéma, bornes, version et invariants, puis décisions serveur faisant autorité ou vérification d’un journal d’actions pour les résultats classés. Un schéma valide seul ne protège pas contre un état inventé mais plausible.

Sources : `src/server/actions/run.ts`, `src/app/api/run/save/route.ts`, `run-progression-sync.service.ts`.

## 5 Difficulté et résultats comparatifs

### Courbe des multiplicateurs

Les multiplicateurs généraux actuels sont :

| Difficulté | PV ennemis | Dégâts ennemis | Autres contraintes notables |
| --- | --- | --- | --- |
| D0 | ×1 avant rampe spéciale | ×1 avant rampe spéciale | Rampe réduite, récupération de 3 PV après combats normaux à l’étage 1 |
| D1 | ×1,12 | ×1,10 | Davantage de perturbation |
| D2 | ×1,24 | ×1,20 | Perturbation accrue |
| D3 | ×1,56 | ×1,30 | Intentions boss et élites cachées chaque troisième tour, davantage d’élites |
| D4 | ×1,62 | ×1,36 | 5 % de pénétration du blocage, soins moins fréquents, événements plus risqués, prix accrus |
| D5 | ×1,70 | ×1,44 | Blocage initial ennemi, relique d’élite non garantie, contraintes économiques renforcées |

La D0 applique en plus ×0,56 / ×0,65 à l’étage 1, ×0,68 / ×0,72 à l’étage 2 et ×0,80 / ×0,82 à l’étage 3, respectivement aux PV et aux dégâts. La croissance commune par étage est ×(1 + 0,15 × étages supplémentaires) pour les PV et ×(1 + 0,18 × étages supplémentaires) pour les dégâts.

**Le passage D0 vers D1 double ainsi les PV à l’étage 1 et augmente les dégâts de près de 69 %, à ennemi comparable.** Il ne s’agit pas d’un simple supplément de 12 % et 10 %. C’est le principal saut structurel de l’échelle.

Autre anomalie : la pénétration de blocage vaut 5 % en D4 mais revient à 0 en D5. Cela ne prouve pas que D5 soit plus facile, mais rend cette règle non monotone et contredit le commentaire « D4+ ».

Sources : `difficulty.ts:getDiff0FloorRamp/getDifficultyModifiers`, `combat.ts:initCombat`.

### Résultats par personnage

Scénario : D0, stratégie de draft « mixed », biomes aléatoires hors Bibliothèque, 100 runs par cellule. « Average » et « strong » désignent les presets du script, pas des profils humains validés.

| Personnage | Aucune méta | Preset average | Preset strong |
| --- | --- | --- | --- |
| Scribe | 33 % | 92 % | 97 % |
| Bibliothécaire | 36 % | 69 % | 72 % |
| Griot | 16 % | 84 % | 83 % |
| Fou | 28 % | 40 % | 40 % |

**Signal :** l’influence de la méta est très forte et inégale. L’écart du Scribe est de 59 points entre les presets none et average. Le Griot progresse de 68 points. Le Fou n’utilise pas efficacement les mêmes gains avec ce robot.

**Interprétation prudente :** le robot peut activer Pacte de sang sans jugement tactique, dépenser l’Encre avant de jouer sa main et privilégier la rareté. Il ne représente pas un expert de chaque personnage. Il serait erroné de déduire « il faut renforcer le Fou de 50 % » de ce tableau.

### Résultats par difficulté

Scénario : Scribe, preset strong, stratégie mixed, 100 runs par difficulté.

| Difficulté | Victoires |
| --- | --- |
| D0 | 97 / 100 |
| D1 | 53 / 100 |
| D2 | 26 / 100 |
| D3 | 2 / 100 |
| D4 | 1 / 100 |
| D5 | 0 / 100 |

Deux transitions demandent une attention particulière : **D0 vers D1**, puis **D2 vers D3**. Cette dernière cumule une augmentation des PV de 25,8 % par rapport à D2, une hausse des dégâts et une perte périodique d’information.

À 100 runs, l’incertitude d’échantillonnage peut approcher ±10 points autour de 50 %, sous une approximation binomiale. Les biais du robot s’y ajoutent. Zéro victoire ne démontre pas qu’une difficulté est impossible.

### Ce que le simulateur ne permet pas encore de conclure

1. Le preset `max` est obsolète : il inclut notamment +35 PV, +6 Force et +1 énergie, tandis que les 45 histoires actuelles agrégées donnent +15 PV, +2 Force et aucune énergie permanente.
2. Le preset `strong` inclut +5 blocage initial et 35 de conservation d’épuisement. L’agrégation réelle de toutes les histoires donne 0 pour ces deux champs.
3. Les 194 reliques sont disponibles par défaut à la création utilisée par le simulateur, contre 40 initialement selon l’audit de progression.
4. Le script force 237 cartes débloquées, puis `advanceFloor` recalcule les déblocages. Le commentaire « pool complet » ne décrit donc pas durablement le scénario. Pour le Scribe entrant en Viking dans la sonde, le registre revient à 50 IDs toutes appartenances confondues ; ce nombre n’est pas celui des offres accessibles au personnage.
5. Le scénario aléatoire démarre dans un biome hors Bibliothèque, alors que le parcours D0 normal impose une ouverture en Bibliothèque. Les chemins sont choisis aléatoirement ; les événements et plusieurs salles spéciales sont sautés.
6. Le robot prend toujours une carte proposée. Il ne représente pas la décision de refuser une récompense.
7. Il prend carte et relique lors des élites, alors que l’interface propose un choix entre les catégories.
8. Les potions d’énergie ou de pioche sont utilisées après la boucle de jeu des cartes, sans deuxième boucle pour exploiter le gain immédiat.
9. La sélection de cible peut viser un ennemi pour une carte `SINGLE_ALLY`. Les cibles d’énigmes non agressives sont désavantagées par sa priorité aux menaces.
10. Le compteur de tours n’inclut pas de la même façon les tours conclus par une victoire immédiate. Les « PV restants après défaite » proviennent de l’état de run précédent, pas nécessairement du dernier état du combat.

Les 600 relectures détaillées n’ont trouvé **aucune défaite à la limite de 60 tours** dans les six scénarios examinés. Il ne faut donc pas attribuer les écarts observés à des timeouts sur cette seule base.

**Recommandation :** ne plus utiliser les anciennes marges « le vrai taux est 5 à 10 points plus haut » comme correction automatique. Les biais vont dans plusieurs directions et leur taille n’est pas mesurée.

### Recalibrage recommandé

Conserver D0 comme apprentissage, mais faire de D1 une continuité explicite. Une expérimentation raisonnable serait de conserver une partie de la rampe par étage en D1, puis de diminuer progressivement cette aide. Les nouvelles valeurs doivent être évaluées après correction du simulateur.

Séparer les leviers : un palier augmente d’abord la pression ; un autre introduit un comportement supplémentaire. Éviter de renforcer simultanément PV, dégâts, contrôle, économie et dissimulation d’information sans mesure intermédiaire.

Pour les difficultés élevées, préférer des variantes de patterns annoncées à la suppression générale de l’intention. Si les intentions cachées restent, afficher au moins la famille du danger et une possibilité de contre-jeu.

Les objectifs humains proposés sont : D0 permettant un apprentissage sans grind préalable ; progression visible dès les premières tentatives ; chaque personnage gagnable par un joueur expérimenté sur profil neuf. Les pourcentages cibles doivent être fixés après une première cohorte, séparée par expérience et par méta.


## 6 Personnages et équilibre des builds

### Identité des quatre personnages

| Personnage | Promesse actuelle | Risque principal | Travail recommandé |
| --- | --- | --- | --- |
| Scribe | Amélioration des cartes, annotation, conversion de l’Encre | Polyvalence qui peut réunir fiabilité, défense et dégâts sans sacrifice suffisant | Mesurer le coût réel des améliorations temporaires et l’avantage obtenu dès le premier cycle |
| Bibliothécaire | Pioche, récupération, ordre du deck et contrôle | Complexité de planification ; troisième pouvoir inaccessible sans capacité d’Encre supplémentaire | Montrer la prochaine séquence utile, clarifier les prérequis de Silence |
| Griot | Poison, saignement, rythme et conversion des afflictions | Faible démarrage sans soutien ; ressemblance entre les deux dégâts dans le temps | Enseigner une chaîne simple application puis exploitation, avec une défense de transition |
| Fou | Conversion PV et Encre, dette, défausse et explosions de dégâts | Suicide involontaire et dette peu anticipée ; robot particulièrement peu adapté | Afficher les PV après paiement et l’énergie du prochain tour avant validation |

Les quatre decks commencent à **11 cartes**, avec les mêmes bases de PV et d’énergie. La diversité vient surtout des cartes, de la relique de départ et des pouvoirs. C’est une base lisible à conserver.

**Silence coûte 6 Encre, pour une capacité initiale de 5.** Les histoires seules n’augmentent pas cette capacité dans l’agrégation actuelle. Certaines reliques peuvent la relever. Ce n’est pas nécessairement un bug, mais le pouvoir débloqué doit annoncer ce prérequis ; sinon le joueur peut interpréter son inutilisabilité comme une erreur.

**Pacte de sang peut tuer le Fou.** Sa condition d’usage vérifie la place disponible en Encre, sans exiger plus de 6 PV. Le paiement peut ramener les PV à zéro. Il faut choisir explicitement : autoriser le sacrifice avec avertissement clair et intentionnel, ou interdire le paiement fatal. Le robot utilise ce pouvoir dès qu’il est légal, ce qui biaise fortement son évaluation du personnage.

Sources : `characters.ts`, `constants.ts`, `ink.ts`, `meta.ts`.

### Résultats exploratoires par stratégie de draft

Scénario : Scribe, D2, preset strong, biomes aléatoires, 100 runs par stratégie.

| Stratégie du robot | Victoires | Lecture prudente |
| --- | --- | --- |
| Encre | 38 % | Meilleur résultat de cet échantillon ; l’Encre ne semble pas universellement faible |
| Armure | 31 % | Solide, mais pas première sur ce scénario |
| Saignement | 26 % | Résultat comparable au mélange dans cet échantillon |
| Mixte | 26 % | Référence du robot |
| Pioche | 21 % | Dépend de la qualité du séquençage et de la conversion en énergie |
| Poison | 13 % | Signal défavorable à examiner avec un personnage et une politique adaptés |

L’écart Encre–Poison est de **25 points**. Il mérite un test ciblé, sans démontrer que toutes les cartes Poison sont trop faibles. Le Scribe n’est pas le personnage représentatif de tous les archétypes. Les étiquettes « armor » ou « poison » sont des préférences de sélection, pas la garantie d’un deck effectivement constitué autour de cet axe.

### Audit qualitatif des archétypes

| Axe | Intérêt tactique | Point de vigilance | Ajustement à tester |
| --- | --- | --- | --- |
| Armure et riposte | Convertir une défense en tempo ou en dégâts | Défense qui couvre trop de situations ; combats inutilement longs | Donner aux ennemis des fenêtres de pression lisibles plutôt qu’une taxe globale opaque |
| Force et multiattaque | Récompense immédiate de la préparation | Bonus permanents particulièrement rentables sur plusieurs impacts | Mesurer les tours d’explosion et le nombre d’impacts, pas seulement le total de Force |
| Poison | Accumuler une menace et survivre jusqu’à son effet | Décroissance des charges, combats rapides, nettoyage ou phases | Rendre disponibles application, protection et exploitation dès le début d’un parcours |
| Saignement | Pression dans la durée, combinaison avec les conversions | Identité peu claire si présenté comme un second Poison | Expliquer que les charges ne décroissent pas comme le Poison et que la durée importe |
| Encre | Arbitrer entre stockage, variante de carte et pouvoir | Toutes les dépenses ne se valent pas ; prérequis de capacité | Afficher le gain marginal exact du mode encré et l’Encre restante |
| Pioche | Préparer une séquence et trouver les réponses | Piocher sans énergie, déborder la main, excès de microdécisions | Mesurer cartes réellement jouées après pioche et tours sans solution |
| Épuisement | Épurer le cycle et alimenter des cartes de conversion | Dépendance à quelques pièces et risque de mal comprendre la perte | Prévisualiser la pile d’épuisement et l’effet de la branche d’amélioration |
| Défausse | Transformer un coût en avantage | Défausse aléatoire subie ; couverture inégale selon les biomes | Garantir un socle neutre utile et des cartes de conversion accessibles |
| Alliés | Modifier le ciblage, soutenir, absorber la pression | Accès méta, mort permanente, contrôle limité de leurs actions | Afficher prochaine action et cible, puis mesurer leur coût de remplacement |
| Soin et endurance | Échanger du tempo contre la survie à l’échelle de la run | Peut effacer l’attrition ou encourager des combats prolongés | Comparer soin net par combat et coût en cartes et énergie |
| Amélioration temporaire | Faire évoluer une main au cours du combat | Effet aléatoire difficile à planifier, surtout au départ | Prévisualiser les cibles possibles et la durée de l’amélioration |

L’audit de cartes repère une lacune de défausse dans le pool African. **Chaque biome n’a pas besoin de prendre en charge tous les builds.** Le bon critère est la présence de routes de transition raisonnables et d’une solution de repli, pas une symétrie artificielle des catalogues.

### Mesures indispensables avant équilibrage fin

Pour chaque axe, relever : apparition des pièces de départ, nombre de choix réellement compatibles, puissance avant première relique importante, puissance à la première élite, viabilité contre chaque famille de boss, dépendance aux améliorations, coût de transition, taux de refus des récompenses et durée des combats.

Comparer les builds dans leur personnage pertinent et dans au moins trois profils : neuf, intermédiaire réellement réalisable, complet calculé par le moteur. Ajouter des politiques de jeu distinctes et vérifier qu’un résultat n’est pas seulement l’affinité du robot pour un ordre de cartes.

**Direction :** rendre les builds faibles plus fiables à assembler avant d’augmenter leurs multiplicateurs. Une augmentation de dégâts ne corrige pas une pièce essentielle presque jamais proposée.

## 7 Cartes et reliques

### Qualité des choix de cartes

Les récompenses normales proposent deux cartes, avec un mécanisme qui cherche à différencier fortement la seconde de la première. La cohérence de build reçoit aussi une pondération, plafonnée à +25 %.

**Atout :** les choix ne sont pas deux quasi-copies et les biomes peuvent créer des ponts. **Risque de design :** maximiser le contraste peut opposer une carte pertinente à une carte hors sujet. Il faut mesurer la fréquence des offres où aucune carte n’aide le deck, surtout après l’étage 1.

À partir de 17 cartes, les récompenses normales sont proposées sur une profondeur sur deux selon une règle déterministe ; à partir de 22, sur une profondeur sur cinq. Cela freine le gonflement du deck, mais réduit aussi la fréquence des décisions de construction. Le joueur ne doit pas découvrir silencieusement que prendre une carte supprime des drafts futurs.

Proposition : rendre la cadence compréhensible et tester une alternative où le draft reste présent, avec refus clairement valorisé ou choix de correction. Ne pas ajouter un bouton qui transforme systématiquement le refus en gain obligatoire : cela créerait une nouvelle routine à cliquer.

**Ordre de travail pour le catalogue :**

1. Corriger les IDs, descriptions et aperçus qui peuvent annoncer des effets différents.
2. Stabiliser les 11 cartes initiales de chaque personnage et les premiers choix.
3. Vérifier les cartes communes qui amorcent un build.
4. Vérifier les cartes qui convertissent la préparation en dégâts, défense ou économie.
5. Examiner les cartes rares conditionnelles et les branches d’amélioration.
6. Traiter les doublons ressentis seulement après observation des usages.

La taille finale du deck tourne, dans les scénarios D0, autour de 25 à 30 cartes. Ce n’est pas excessif par définition, mais une pièce unique a moins de chances d’apparaître : avec une main initiale uniforme de 5 cartes, une carte donnée est présente avec une probabilité de 5/11 dans un deck de 11 et de 5/30 dans un deck de 30, hors pioche supplémentaire et règles d’ouverture. La cohérence exige donc de la redondance utile, du tri ou une réduction du deck.

### Accès aux cartes signatures

Le script de cadence effectue 4 000 tirages par cible. Exemples mesurés :

| Carte | Offre normale | Offre d’élite | Marchand |
| --- | --- | --- | --- |
| curator_pact | 10,90 % | 10,72 % | 4,95 % |
| saga_keeper | 2,15 % | 0,68 % | 1,00 % |
| book_of_the_dead | 2,38 % | 0,75 % | 1,25 % |
| written_prophecy | 12,83 % | 8,13 % | 7,17 % |
| fates_decree | 2,45 % | 0,60 % | 1,10 % |

Ce sont des probabilités dans le contexte du script, **pas des probabilités d’obtention par run**. Les tailles d’offres et les règles de rareté diffèrent entre sources. La fréquence plus faible de certaines signatures chez une élite doit néanmoins être expliquée au regard de la promesse de récompense.

Tester un accès ciblé occasionnel — événement, choix de chapitre ou marchand spécialisé — pour les signatures nécessaires à une expérience promise. Ne pas garantir la même rare à chaque partie.

### Reliques

L’audit compte **126 reliques portant des tags d’archétype**, dont 32 Blocage, 29 Pioche, 28 Encre, 27 Force, 20 Soin, 7 Poison et 6 Saignement. Ces catégories se chevauchent. L’écart de couverture est un signal sur le soutien offert aux axes, pas une mesure directe de puissance.

Les 194 reliques ont une référence moteur et les 30 de rareté boss sont reconnues comme interactives par l’heuristique existante. Cela ne prouve ni la bonne exécution de chaque déclencheur ni un choix intéressant dans tous les decks.

Le nombre élevé de reliques de début de combat peut rendre les premiers tours très différents selon la méta et les acquisitions. Comparer l’effet sur le premier tour, sur les combats courts et sur les boss longs.

Recommandations :

- Relier chaque relique à une décision observable : quel ordre, quel risque ou quelle cible change-t-elle ?
- Afficher un récapitulatif du déclenchement quand plusieurs reliques agissent ensemble.
- Permettre une consultation rapide de la source d’un bonus.
- Donner aux reliques de boss une contrepartie ou une transformation lisible, sans pénaliser arbitrairement un build déjà fragile.
- Éviter de conditionner la viabilité d’un axe à une relique que sa propre faiblesse empêche de débloquer.
- Comparer les reliques par taux de choix lorsqu’elles sont proposées, puis par résultat à contexte comparable. Le taux de présence dans les victoires seul favorise les objets acquis tard.

Sources : `rewards.ts`, `card-offers.ts`, `relics.ts`, résultats `cards.txt`, `relics.txt`, `signatures.txt`.

## 8 Ennemis et composition des rencontres

Le jeu distingue des rôles d’assaut, soutien, contrôle, tank et hybride. Les rencontres utilisent un budget de danger, des pondérations et une recherche d’unité thématique dans les groupes. L’IA dispose de poids conditionnels et d’une pénalité de répétition. C’est une base plus intéressante qu’une simple augmentation des PV.

| Biome | Normaux | Élites | Identité déclarée | Risque à examiner |
| --- | --- | --- | --- | --- |
| Bibliothèque | 5 | 3 | Perturbation du deck et de l’Encre | Surcharge de règles dans le biome d’apprentissage |
| Viking | 6 | 2 | Pression et tempo offensif | Gros écarts selon le premier tour et le blocage disponible |
| Greek | 6 | 2 | Fenêtres offensives et tactique | Combats puzzle qui demandent des réponses non annoncées |
| Egyptian | 7 | 2 | Attrition, garde et malédictions | Addition de soins, blocage et pollution qui allonge les combats |
| Lovecraftian | 6 | 2 | Perturbation, invocations, malédictions | Retrait de possibilités d’agir plutôt que décisions nouvelles |
| Aztec | 6 | 2 | Rituels et pression offensive | Pics combinés ; biome le plus défavorable au robot testé |
| Celtic | 6 | 2 | Endurance et riposte | Répétition de tours défensifs |
| Russian | 6 | 2 | Froid, ralentissement et ressources | Pioche dégradée et énigmes multicibles |
| African | 6 | 2 | Coordination et soutien du groupe | Soutien ou cible clé perdu hors écran sur mobile |

**Point de design :** le contrôle doit créer un problème auquel répondre. Une combinaison « pioche réduite + coût accru + cartes gelées » peut supprimer une bonne partie de la décision. Mesurer les tours où le joueur possède de l’énergie mais aucune action raisonnable, en distinguant erreur antérieure et verrou imposé.

Prévoir pour chaque ennemi ordinaire une fonction immédiatement reconnaissable, un signe avant le danger et un choix de priorité. Les élites doivent tester une compétence ou une faiblesse du deck et offrir une récompense cohérente avec leur coût en PV.

À tester par génération massive de cartes : cumul des perturbations, répétition du même groupe, longueur des séquences de combats, budget après substitution thématique et existence effective des routes de récupération.

L’ancien TODO décrit la Bibliothèque comme triviale et ses boss comme peu complexes. **Ce constat n’est plus une base valable :** le Gardien des chapitres et l’Archiviste disposent désormais de mécaniques spécialisées.

## 9 Audit des 18 boss

Les PV ci-dessous sont les **valeurs de base des définitions**, avant multiplicateurs d’étage et de difficulté. Ils ne sont pas comparables isolément : invocations, protections, soins et fenêtres de vulnérabilité modifient la durée effective.

| Boss | PV de base | Mécanique examinée | Recommandation prioritaire |
| --- | --- | --- | --- |
| Gardien des chapitres | 150 | Trois reliures : attaques, blocage et Encre ; chapitre ouvert puis reconstitution | Afficher les trois objectifs et leur progression ; enseigner chaque geste avant la rencontre |
| Archiviste | 144 | Encriers, censure du coût ou du texte, seconde phase | Rendre les encriers identifiables et annoncer exactement ce que leur destruction rétablit |
| Fenrir | 170 | Chasse réduite par les coups ; pression et meute | Montrer pourquoi un coup réduit la menace et comment cette réduction affecte les dégâts annoncés |
| Hel | 175 | Alternance Vie et Mort, saignement, réanimation | Montrer la prochaine posture et le moment de la conversion du saignement |
| Méduse | 122 | Séquences de gestes et pétrification des cartes | Prévisualiser la progression de la séquence avant de jouer ; éviter le coût surprise |
| Hydre | 118 | Têtes, états intermédiaires, cautérisation | Rendre explicite la différence entre tête éliminée et tête définitivement neutralisée |
| Avatar de Râ | 165 | Charge solaire, barrière et jugement | Mettre la jauge et la manière de la contrer à côté de l’intention |
| Jugement d’Osiris | 170 | Comparaison dégâts et blocage, verdict | Afficher un verdict prévisionnel qui se met à jour après chaque carte |
| Fragment de Nyarlathotep | 188 | Prophéties déclenchées par certains gestes | Annoncer quel prochain geste déclenchera quelle conséquence ; limiter les sanctions illisibles |
| Rejeton de Shub | 198 | Nids, éclosion, consommation, soin et Poison | Montrer la priorité des nids et le compte à rebours ; tester les decks sans dégâts de zone |
| Écho de Tezcatlipoca | 152 | Miroirs mémorisant des familles d’effets | Afficher l’effet mémorisé et sa valeur sans exiger de retenir toute la séquence |
| Courroux de Quetzalcoatl | 162 | Vol avec plafond de dégâts, chute et vulnérabilité | Signaler le nombre de coups pour le faire tomber ; offrir une voie viable aux attaques lourdes |
| Ombre du Dagda | 132 | Chaudron, préparation Festin ou Famine | Donner une silhouette propre au chaudron et annoncer le résultat de la préparation |
| Ombre de Cernunnos | 135 | Couches de ramure, plafond de dégâts, repousse | Clarifier les coups nécessaires et la repousse ; mesurer la pénalité des decks à peu d’impacts |
| Hutte de Baba Yaga | 122 | Faces tournantes et objectifs d’apaisement | Montrer la face suivante et les seuils dès le début du tour |
| Koschei | 148 | Coffre, œuf, aiguille et immortalité | Afficher la chaîne d’objets et indiquer que frapper le boss ne suffit pas |
| Esprit de Soundiata | 169 | Versets préparés et interruption par dégâts | Montrer les seuils d’interruption et le bénéfice attendu |
| Anansi | 162 | Motifs d’attaque, compétence et Encre ; cartes entoilées | Présenter la séquence comme un objectif visible ; signaler la carte libérable et la sanction |

**Constat transversal :** beaucoup de boss demandent une variété de gestes ou plusieurs impacts dans un même tour. Cette famille de contraintes peut pénaliser plusieurs fois les decks lents et spécialisés. L’équilibrage doit examiner la couverture de réponses d’un deck, pas seulement son dégât moyen.

Le Gardien demande notamment 3 attaques, 12 blocage et 3 Encre dépensée pour ses différentes reliures. Quetzalcoatl plafonne à 8 les dégâts concernés en vol et reçoit ×1,5 au sol. Cernunnos utilise également un plafond de 8 et une vulnérabilité ×1,5. Il faut différencier le rythme et le contre-jeu de ces rencontres pour éviter deux variantes du même test d’impacts.

**Problème visuel confirmé :** 10 entités scriptées n’ont pas de fichier à l’adresse retournée par le registre d’images : les deux encriers de l’Archiviste, les trois têtes de l’Hydre, le nid de Shub, le chaudron du Dagda et les trois objets de Koschei. Les mécanismes de secours de l’interface évitent certains affichages cassés, mais ne leur donnent pas une identité visuelle propre. Ces objets sont prioritaires parce qu’ils expliquent comment gagner.

**Critères de qualité proposés pour chaque boss :**

- Le joueur peut expliquer la menace et une réponse après avoir consulté l’écran.
- La transition de phase est annoncée et les dégâts prévus restent exacts.
- Aucun archétype promu au joueur ne dépend d’une unique carte rare pour avoir une réponse.
- Le combat récompense au moins deux plans viables ou une adaptation accessible.
- Les nouvelles entités, leur mort, leur réapparition et leurs états sont sauvegardés correctement.
- Le combat reste compréhensible à 4 ennemis et 3 alliés, sur mobile.
- Les tests couvrent jeu normal, variantes encrées, dégâts dans le temps, alliés et effets de reliques.

Il ne faut pas supprimer les énigmes : ce sont des moments distinctifs du jeu. Il faut rendre leur lecture et leurs solutions accessibles.

### Signaux comparatifs par biome

Scénario artificiel : Scribe, D2, preset strong, mixed, **même biome imposé aux trois étages**, 100 runs chacun.

| Biome | Victoires |
| --- | --- |
| Greek | 41 % |
| Celtic | 36 % |
| Egyptian | 32 % |
| African | 27 % |
| Lovecraftian | 26 % |
| Viking | 18 % |
| Russian | 17 % |
| Bibliothèque | 15 % |
| Aztec | 8 % |

Ces chiffres concernent des **parcours complets**, pas le taux de victoire contre un boss donné. La répétition forcée d’un biome influence aussi les récompenses et déblocages. Ils suggèrent de commencer les observations ciblées par Aztec, Bibliothèque et Russian, sans conclure que leurs boss seuls expliquent tout.

Sources : fichiers `src/game/data/enemy-bosses/`, modules spécialisés `src/game/engine/`, `inventory.json`, `matrix.json`.

## 10 Routes et rythme des runs

La carte possède de vraies connexions, des voies à risque différent et des contraintes de génération. Le validateur recherche notamment des parcours sûrs, équilibrés et avides, avec accès au marchand et aux salles de soutien. C’est à conserver.

**Vigilance technique :** après 128 essais, la génération renvoie un candidat sans garantir qu’il passe encore le validateur. Ce repli doit être testé et comptabilisé. Il ne suffit pas que les critères existent pour certifier toutes les cartes produites.

Sur D0 avec méta forte, le Scribe parcourt en moyenne environ 32 combats dans les simulations. Le nombre d’actions total, les animations et les passages de menus peuvent produire une session longue. Les compteurs du robot ne donnent pas une durée humaine.

Propositions de rythme :

- Définir une fourchette de durée cible pour une run standard, puis mesurer médiane et sessions lentes.
- Faire de la première élite un engagement lisible plutôt qu’une surprise de génération.
- Donner au joueur une occasion de réparer son deck avant le premier boss.
- Vérifier qu’une route sûre coûte quelque chose en puissance et qu’une route risquée paie réellement ce risque.
- Réduire les confirmations sans décision, surtout aux récompenses et transitions.
- Donner au changement de biome une fonction : nouvelle menace, récompenses pertinentes, respiration narrative.
- Afficher l’avancement de la run en chapitres et rencontres significatives plutôt qu’une accumulation de compteurs.

**Mode infini :** après l’étage standard maximal, les PV augmentent de ×1,85 par étage supplémentaire et les dégâts de ×1,6, en plus des autres facteurs. À trois étages supplémentaires, ces seuls multiplicateurs valent environ ×6,33 et ×4,10. Ce mode ressemble à une course de survie vers une limite brutale. Le présenter ainsi ou revoir la progression si l’objectif est une exploration prolongée.

## 11 Économie et méta progression

### La pénalité de répétition décourage les essais

**Confirmé — priorité P1.** Après une victoire déjà enregistrée à une difficulté, le multiplicateur de ressources des runs suivantes à ce niveau passe à **0,20**, y compris pour une défaite ou un abandon. La première victoire à un niveau non déjà gagné reçoit ×1,25.

La vérification utilise les victoires **globales par difficulté**, tandis que les déblocages de difficulté sont suivis par personnage. Un nouveau personnage peut donc devoir rejouer D0 avec une récompense réduite parce qu’un autre personnage l’a déjà gagné.

**Impact de design :** le système pousse à monter la difficulté alors que le joueur peut vouloir apprendre un autre personnage ou tester une combinaison. Cela entre en conflit avec la promesse de rejouabilité.

Proposition : conserver une récompense de base intéressante et donner un bonus de première victoire distinct, éventuellement par personnage. Encourager de nouvelles routes, boss ou styles avec des bonus positifs. Si une réduction anti-farm reste nécessaire, la mesurer et éviter qu’elle transforme la répétition volontaire en progression quasi nulle.

### Bonus permanents

Les plafonds actuels limitent certaines accumulations, mais +1 pioche, +1 carte d’ouverture, +2 Force, +15 PV, du soin et des pouvoirs supplémentaires changent simultanément la fiabilité, la survie et le rythme. Le fait de plafonner chaque valeur ne garantit pas un faible effet combiné.

Le calcul réel avec les 45 histoires donne notamment : +15 PV, +2 Force, +1 bonus d’attaque, +1 pioche, +1 carte d’ouverture, 5 Encre au départ, +1 régénération, 5 % de soin après combat et +4 soin fixe, 3 places d’alliés, +55 or, +4 chance de butin. Les plafonds et avantages doivent être jugés ensemble.

Les descriptions d’histoires passent leur audit textuel actuel. Il reste à vérifier la valeur **marginale** affichée lorsqu’un plafond rend un nouveau bonus partiellement ou totalement redondant.

Direction recommandée : plus de choix, de variantes et de conditions ; moins d’accumulation obligatoire de statistiques pour débloquer une expérience équilibrée. Les parties neuves doivent permettre de comprendre un échec sans conclure « il me manque seulement des heures de farm ».

### Marchand et ressources

Le marchand propose soins, PV, cartes, reliques, alliés, potions et purges ; il possède une relance croissante. Les coûts sont majorés en D4 et D5. Le marchand de départ dépense des ressources de progression permanente, parfois avec un coût proportionnel aux réserves.

Ce dernier système crée un arbitrage intéressant mais sensible : acheter une aide temporaire peut retarder une histoire permanente. Afficher le coût et son effet sur les prochains déblocages. Éviter qu’un joueur qui économise ait seulement l’impression que les prix montent parce qu’il a plus de ressources.

Les réserves d’or finales du robot ne suffisent pas à déclarer l’or inutile : sa politique d’achat est incomplète. Mesurer chez les joueurs le pourcentage d’or dépensé, les achats refusés faute de fonds, les purges et les relances.

### Objets et alliés

Les 12 objets et 8 alliés constituent déjà une offre suffisante. La priorité est leur usage effectif.

Pour les objets : afficher la cible, le gain immédiat, les pertes par dépassement de capacité et la possibilité de les utiliser avant une situation fatale. Mesurer les défaites avec trois objets inutilisés.

Pour les alliés : rendre visibles l’action suivante, la cible de l’ennemi, la persistance des PV et le caractère permanent de la mort. Comparer le prix d’un allié à son bénéfice sur plusieurs combats, sans ignorer la probabilité qu’il meure immédiatement. Ne pas augmenter globalement leurs PV avant d’avoir étudié le ciblage.


## 12 Intérêt et rejouabilité

L’intérêt potentiel repose sur trois échelles de décision : résoudre la main actuelle, construire un deck au fil des chapitres, puis choisir les prochains déblocages. L’Encre relie ces échelles à l’identité de l’univers. Les boss peuvent transformer une suite de combats en rencontres mémorables.

**Ce qui peut donner envie de relancer :** maîtriser un personnage, essayer une autre utilisation de l’Encre, rencontrer un boss encore inconnu, former une combinaison de reliques, poursuivre une histoire et sélectionner une condition de départ différente.

**Ce qui peut faire abandonner :** perdre sa progression, ne pas comprendre pourquoi une action a échoué, devoir gagner des bonus permanents pour retrouver une difficulté raisonnable, ne pas voir les pièces du build choisi, ou revoir de longs combats déjà résolus mentalement.

### Événements risqués presque absents avant D4

**Confirmé dans le tirage.** `pickEvent` sépare les événements sûrs et risqués. En dessous de D4, il tire dans le pool sûr dès que celui-ci est non vide. Les événements explicitement classés risqués n’ont donc aucune chance dans ce cas. En D4 et D5, une branche les sélectionne avec 70 % de probabilité lorsque le pool existe.

Cela enlève une partie des dilemmes aux difficultés basses et introduit brutalement une autre économie narrative aux difficultés hautes. Recommandation : faire varier un poids de risque progressivement, tout en conservant une possibilité de refuser le pacte. Un événement qui offre un choix risqué n’a pas besoin d’être réservé aux joueurs avancés si ses conséquences sont claires.

Sources : `run-events.ts:RISKY_EVENT_IDS/pickEvent`. Les tirages de contrôle sont archivés dans `content-diagnostics.json` ; ils servent à vérifier la branche du tirage, pas la cadence par biome dans une vraie run.

### Promesse à renforcer

Formuler une promesse concrète : « Votre Encre vous permet de réécrire votre manière de jouer. » Le premier quart d’heure doit contenir une décision où conserver l’Encre, encrer une carte et utiliser un pouvoir conduisent à trois conséquences compréhensibles.

Donner à chaque personnage deux ou trois directions accessibles, puis permettre les hybridations. Une bibliothèque de 275 IDs uniques n’est utile que si le joueur peut reconnaître des familles, anticiper une combinaison et retrouver ses choix.

Introduire de nouvelles conditions ou des défis partagés après stabilisation du parcours standard. Les succès cosmétiques, les fins et la maîtrise des boss peuvent soutenir la rejouabilité sans augmenter la puissance permanente. Les classements demandent d’abord une intégrité serveur suffisante.

## 13 Tutoriel et apprentissage

Un tutoriel existe déjà. Le TODO qui le présente comme absent doit être corrigé. Des aides dédiées au premier combat, à l’Encre et à la progression sont implémentées.

**Point sensible confirmé :** la première run prévoit un choix d’élite imposé, puis une action qui force la défaite. Dans `CombatView`, l’activation correspondante déclenche cette perte après un délai de 1 400 ms ajusté à la vitesse de combat lorsque les conditions sont réunies.

Le problème de design n’est pas l’existence d’un prologue scénarisé. C’est le risque de présenter une défaite imposée comme le résultat des décisions du joueur, tout en liant la leçon à un gain permanent. Cela peut enseigner que le jeu exige des morts artificielles pour progresser.

**Direction recommandée :** soit rendre le prologue explicitement narratif, court et rejouable à la demande ; soit utiliser un combat difficile mais réellement jouable, puis accorder la leçon de bibliothèque sans exiger une défaite. Donner une sortie claire à ceux qui connaissent déjà le genre.

Ordre pédagogique proposé :

1. Voir une intention et bloquer une attaque.
2. Comprendre le coût en énergie et la fin du tour.
3. Générer de l’Encre puis choisir entre deux dépenses.
4. Comprendre la défausse et le retour des cartes.
5. Prendre ou refuser une récompense.
6. Choisir une route selon les PV et la construction du deck.
7. Améliorer ou retirer une carte.
8. Lire un objectif de boss et constater visuellement qu’il a été résolu.
9. Comprendre ce qui est conservé après la run.

Ne pas essayer d’expliquer alliés, variantes, toutes les altérations, histoires, conditions, raretés et difficulté sur le même écran. Chaque leçon doit s’appuyer sur une action utile.

Critère proposé : lors des tests débutants, 8 joueurs sur 10 peuvent expliquer le danger du prochain tour et le coût total d’une carte encrée sans aide extérieure. C’est un objectif à vérifier, pas un résultat acquis.

## 14 Graphismes et direction artistique

### Ce que les rendus montrent

La palette sombre, les bordures colorées par type, les décors de biome et l’organisation du combat donnent une cohérence. Les cartes restent l’objet central. Le desktop montre une hiérarchie identifiable entre unités, main, ressources et fin de tour.

Les SVG d’ennemis sont simples et souvent expressifs, parfois très proches d’un pictogramme ou d’un personnage cartoon. Leurs formes arrondies et leurs couleurs franches contrastent avec une interface qui évoque une bibliothèque occulte. Cette différence peut devenir un style volontaire, mais elle manque actuellement d’une règle artistique commune.

**Choix de direction à trancher :** conserver un conte illustré expressif, ou aller vers des gravures et manuscrits plus inquiétants. Dans les deux cas, définir contours, ombres, proportions, palette et texture, puis appliquer ces règles aux éléments les plus vus.

### Cartes

Trois illustrations sont enregistrées pour 275 identifiants uniques, soit environ **1,1 % de couverture par ID**. Les autres cartes utilisent des symboles de type comme « // », « [] » ou « ++ ». Ce secours distingue la catégorie, pas la carte. La reconnaissance devient surtout textuelle.

Priorité d’illustration :

1. Cartes de départ uniques aux personnages et cartes initiales les plus fréquentes.
2. Cartes qui amorcent les builds et leurs principales conversions.
3. Signatures rares.
4. Malédictions et statuts, avec des silhouettes immédiatement différentes.
5. Reste du catalogue selon la fréquence de rencontre.

Ne pas produire 275 images avant de valider une série de 12 à 20 cartes dans la main réelle. Il faut vérifier la reconnaissance à petite taille et l’unité du style.

Les cartes disposent de cadres détaillés, de badges, de texte et parfois de défilement interne. Le risque est de consacrer beaucoup d’espace à un visuel générique tout en compressant l’effet utile. Réduire les informations répétées et réserver la surface aux éléments qui changent la décision.

### Unités et boss

Donner une échelle, une pose et un signe distinctif aux boss. Les transformations de phase doivent être visibles sur l’unité, pas seulement dans un badge ou un flash.

Les 10 entités scriptées sans image dédiée sont plus urgentes que des variantes décoratives d’ennemis déjà reconnaissables. Le coffre, l’œuf, l’aiguille, les nids, les têtes et les encriers expliquent les objectifs du combat.

### Décors et écrans hors combat

Les décors partagent une structure visuelle proche et changent notamment de couleur et d’ornement. C’est économique et cohérent pour une alpha ; la prochaine passe doit donner à chaque biome une silhouette spatiale distincte : architecture, sol, profondeur et lumière.

Marchand, événement, préparation du boss et fin de run doivent devenir des lieux ou des moments reconnaissables. Une illustration réutilisable de qualité par type d’écran apporte davantage qu’une accumulation de bordures et de particules.

**Ne pas faire de l’animation une priorité automatique.** Le jeu possède déjà du tilt de cartes, des effets de zone, des animations de dégâts et de transition dans plusieurs composants. Les anciennes lignes du TODO qui les déclarent tous absents sont à réconcilier. Mesurer ce qui manque à la compréhension avant d’ajouter du mouvement.

Captures : `visual.png`, `combat-desktop.png`, `combat-mobile.png`. Ce sont des rendus statiques isolés, pas la validation des écrans complets sur appareil réel.

## 15 Ergonomie et accessibilité

### Informations nécessaires à la décision

Toujours rendre accessibles : énergie, Encre et capacité, coût total de l’action, PV, blocage, dégâts entrants, cible ennemie, intention, condition d’activation, dette du prochain tour et changements persistants.

Quand une action devient impossible, en donner la raison précise : coût, cible, gel, pétrification, toile, pouvoir déjà utilisé ou capacité maximale. Un bouton grisé ne suffit pas.

Pour les effets complexes, séparer « effet maintenant », « état après action » et « conséquence au prochain tour ». Proposer un détail, sans imposer un paragraphe long sur chaque carte.

### Mobile

Le mobile a une vraie interface dédiée, des panneaux de détail, des interactions tactiles et une rangée ennemie défilante. Les portraits utilisent une largeur minimale proche de 46 % ; avec trois ou quatre ennemis, certains sont donc hors du champ visible.

**Risque confirmé par la structure, impact à mesurer :** un soutien dangereux ou une cible d’énigme peut être oublié hors écran. Afficher un indicateur de nombre d’ennemis, les dangers hors champ et une synthèse des intentions. Le total des dégâts seul ne représente pas une invocation ou une perturbation de main.

La main compacte et l’appui long demandent un apprentissage. Vérifier que le joueur distingue consulter une carte, la sélectionner, l’encrer et la jouer. Mesurer les actions involontaires et les annulations, pas seulement l’absence de débordement CSS.

Les captures isolées ne suffisent pas à conclure à un défaut précis de largeur dans l’application complète. La validation doit inclure le cadre parent, les safe areas, l’hydratation et les gestes réels.

### Clavier et lisibilité

Dans les composants examinés, plusieurs interactions de carte ou d’unité reposent sur des conteneurs et clics sans parcours clavier équivalent évident. Les libellés de certaines icônes existent, mais cela ne constitue pas une validation d’accessibilité de bout en bout.

Priorités : sélection de carte au clavier, navigation entre cibles, annulation, fin du tour, lecture des intentions au focus et retour de focus après un panneau. Éviter un raccourci de fin de tour trop facile à déclencher par accident.

Certaines tailles de texte de `GameCard` descendent à 6–9 px dans les petites variantes. Ces variantes ne sont pas toutes utilisées de la même façon en combat mobile ; elles restent à vérifier dans la collection, les récompenses et le marchand. Proposer une lecture agrandie immédiate et une échelle d’interface.

Les couleurs ne doivent pas être le seul code des attaques, malédictions ou valeurs modifiées. Associer forme, icône et texte. Le CSS respecte déjà `prefers-reduced-motion` ; compléter le contrôle par une option explicite pour les flashes et secousses si nécessaire.

### Fin de run

L’écran doit expliquer une cause de défaite utile et montrer ce qui a fonctionné : manque de défense, objectif de boss ignoré, dette, objets inutilisés ou deck trop peu cohérent. Ne pas inventer une cause unique à partir du premier ennemi vivant.

Les abandons doivent être distingués des défaites et retrouver leur place dans l’historique. La page d’historique existe, mais elle lit les snapshots PvP ; les abandons et fins sans snapshot n’y sont pas représentés de la même manière que dans les résumés de runs.

## 16 Son et sensation de jeu

Les effets sont synthétisés avec Web Audio ; il est donc incorrect de les déclarer absents parce qu’il manque des fichiers audio unitaires. Quatre fichiers musicaux couvrent combat, élite, boss et carte, avec la carte également utilisée au menu. Des fondus, de la vibration et des réglages d’activation existent.

Leur qualité perceptive n’a pas été évaluée à l’écoute. Les priorités proposées sont :

- Distinguer carte jouée, impact bloqué, perte réelle de PV, gain d’Encre et résolution d’un objectif.
- Réserver les sons les plus forts aux événements importants.
- Limiter le cumul de sons sur attaques multiples, invocations et effets de zone.
- Donner une ponctuation sonore aux transitions de phase.
- Prévoir des réglages séparés musique et effets, et vérifier leur persistance ; le bouton examiné dans le layout coupe actuellement les deux ensemble.
- Tester l’autoplay, la reprise après mise en arrière-plan et les appareils sans vibration.

L’impact d’une attaque repose sur une chaîne cohérente : anticipation, action, réaction de la cible, nombre, son. Une grande quantité d’effets peut masquer cette chaîne. Prioriser une synchronisation nette.

## 17 Narration et univers

La bibliothèque qui traverse des mythologies constitue une structure forte : elle justifie les chapitres, les cartes, l’Encre, les histoires et la collection. Les boss spécialisés donnent une manière de raconter par les règles.

Le bestiaire utilise encore des textes générés à partir du biome, du rôle et de quelques capacités. En français, plusieurs entrées suivent le même moule. Le troisième palier promet davantage de profondeur mais reste largement répétitif. Cela réduit l’intérêt de la maîtrise après la curiosité initiale.

Proposition pour chaque ennemi important : une entrée d’ambiance, une entrée qui éclaire son comportement, une entrée qui révèle quelque chose de la bibliothèque ou du chapitre. Commencer par les ennemis de Bibliothèque et les 18 boss.

Les catégories de mythologie ne sont pas de même échelle. Le chapitre « African » rassemble plusieurs traditions sous une dénomination très large, tandis que d’autres sont plus spécifiques. Définir pour chaque livre son périmètre et sa voix narrative, et documenter les références utilisées au moment de l’écriture. L’enjeu est une meilleure cohérence et des personnages moins interchangeables.

Le Censeur et plusieurs conclusions narratives sont encore décrits comme travaux futurs dans le TODO ; l’existence d’un SVG ne signifie pas que le boss final est jouable. Prioriser un arc de fin cohérent et une conclusion courte à la run standard. Les statistiques mythiques, quêtes, sceaux et fins multiples peuvent ensuite enrichir cette conclusion.

L’attitude envers le Scribe peut soutenir la continuité des runs, à condition que les choix aient un effet compréhensible. Éviter de multiplier des variables cachées dont le joueur ne constate jamais les conséquences.

Sources : `run-events.ts`, `enemy-text-resources.ts`, `histoires.ts`, `docs/TODO.md`, `docs/evolution-histoire.md`.

## 18 Qualité technique et mesure

### Points solides

Le moteur est séparé de l’interface, les états ont des schémas, les boss disposent de modules et de tests, la sauvegarde possède des checkpoints, et la télémétrie conserve déjà de nombreux éléments utiles. Les 586 tests réussis constituent une bonne protection contre les régressions couvertes.

### Risques au-delà des tests actuels

Les défauts de sauvegarde et la collision de carte montrent les limites de la couverture existante. Il manque notamment une garantie globale d’unicité des définitions, des tests d’erreurs retournées comme données, des scénarios de reprise à étapes interrompues et des contrôles de cohérence entre simulateur et interface.

Le moteur synchronise de nombreux états de boss dans plusieurs points d’entrée. Cette richesse augmente le risque qu’un nouveau type de dégâts ou une dépense d’Encre ne déclenche pas les mêmes règles selon sa source. Priorité à des contrats de comportement partagés et à des tests transversaux, plutôt qu’à une refonte totale.

Le build dépend actuellement de polices récupérées sur le réseau. Des polices locales rendraient la construction plus reproductible et éviteraient cette dépendance lors des tests hors ligne. La tentative actuelle a échoué pour cette récupération ; le dernier ancien build réussi documenté ne certifie pas l’état local d’aujourd’hui.

La PWA active une mise en cache de navigation agressive et le rechargement au retour en ligne. Tester mise à jour, ancienne version de sauvegarde, reconnexion et changement de compte. La présence d’une PWA ne signifie pas que les écritures serveur sont disponibles hors ligne.

La commande `npm run lint` passe avec des avertissements, notamment sur les dépendances de hooks React. Le runner signale que `next lint` est déprécié. Prévoir une entrée ESLint directe et traiter les avertissements qui touchent la sauvegarde, les résultats de combat et les animations, sans désactiver les règles globalement.

### Télémétrie exploitable

Le tableau d’administration a déjà des taux par difficulté, personnage, biome, condition et archétype. Il conserve aussi des compteurs d’Encre et de cartes. Les problèmes sont désormais la définition des mesures et leurs dénominateurs.

**Corrections prioritaires :**

- `defeatEnemyId` est pris comme le premier ennemi vivant dans le hook de défaite. Ce n’est pas forcément celui qui a porté le coup fatal, ni la cause de l’échec. Le renommer « ennemi présent à la défaite » ou enregistrer une vraie source de dommage.
- Le biome d’un résumé est le biome de fin de run. Un taux global par ce champ n’est pas un taux de survie par biome traversé ; utiliser les combats et les entrées d’acte.
- `deriveRunBuildArchetype` s’appuie sur les tags explicites et seulement six étiquettes. Les autres fonctions infèrent aussi les tags à partir des effets. Harmoniser les définitions, et conserver les axes secondaires.
- Les PV perdus entre début et fin ne comptent pas tous les dégâts reçus lorsqu’un soin intervient. Distinguer dégâts bruts subis, PV nets perdus, soin et blocage.
- Plusieurs gains d’Encre sont écrits directement dans l’état, comme Pacte de sang. Vérifier l’exhaustivité des compteurs, au lieu d’assimiler les appels à `gainInk` à toute la production.
- Enregistrer les cartes et reliques proposées, celles choisies et celles refusées. Sans les offres, la popularité d’une carte ne mesure pas son attractivité.
- Ajouter version de règles, profil de déblocages et motif d’abandon aux comparaisons.
- Conserver les volumes de chaque cellule et distinguer petits échantillons, nouveaux joueurs et habitués.
- Éviter de charger tous les résumés de télémétrie sans borne à mesure que le nombre de runs augmente.

Un graphique global de victoire peut donner une fausse direction si les joueurs expérimentés possèdent plus de méta et sélectionnent certains personnages. Toute décision de balance doit comparer des contextes proches.


## 19 Feuille de route priorisée

**P0** : bloque la confiance dans la sauvegarde, les règles ou les résultats classés ; à résoudre avant élargissement des tests. **P1** : bloque la qualité des premières parties et la validation de la balance. **P2** : augmente nettement la profondeur ou la finition après stabilisation. **P3** : extension à différer.

Charges indicatives par tâche : **S** jusqu’à une journée de travail concentré, **M** deux à quatre, **L** cinq à dix, **XL** au-delà. Ce sont des ordres de grandeur, hors retours de playtest et production artistique ; ils ne forment pas un engagement de calendrier.

### Lot 1 Fiabilité des règles et des données

- [ ] **A01 — P0 — M — Moteur. Unifier ink_surge.** Une définition par ID dans le catalogue fusionné ; cartes de départ et lootables cohérentes ; sauvegardes et déblocages anciens traités. Ajouter une validation qui échoue sur toute collision. Dépendance : aucune.
- [ ] **A02 — P0 — M — Client. Vérifier les accusés de sauvegarde.** Une réponse `success:false` ou `saved:false` ne marque jamais l’état comme sauvegardé ; l’utilisateur voit le problème et peut réessayer. Reproductions réseau et métier incluses.
- [ ] **A03 — P0 — M — Client et serveur. Versionner les snapshots.** Toute action persistante change une révision ; une écriture ancienne ne peut pas écraser une plus récente ; tests Encre seule, amélioration, inventaire, alliés et deux onglets. À faire avec A02.
- [ ] **A04 — P0 — L — Serveur. Rendre la fin de run atomique ou récupérable.** Chaque panne injectée entre statut, progression, résumé et nettoyage se répare sans perte ni double gain ; une seule finalisation logique par run.
- [ ] **A05 — P0 pour classement — L à XL — Serveur. Valider les résultats reçus.** Schéma, bornes, clés autorisées et invariants ; résultat classé issu d’un état vérifiable ; contrôle de propriété conservé. Une simple validation de forme ne suffit pas.
- [ ] **A06 — P0 pour équilibrage — L — Outils. Rétablir la fidélité du simulateur.** Profils dérivés d’histoires réelles, déblocages explicites, mêmes choix exclusifs de récompenses que l’interface, objets exploitables, cibles correctes, causes de défaite et compteurs fiables. Dépend d’A01.

**Sortie du lot :** aucune collision globale, aucune perte ou duplication dans les scénarios d’échec prévus, résultats de simulation explicitement reproductibles. La suite existante doit rester verte et les sondes d’audit doivent être converties en tests du comportement corrigé, avec assertions inversées.

### Lot 2 Premières parties et équilibre

- [ ] **A07 — P1 — M — Design et moteur. Lisser D0 vers D1.** Courbes par étage documentées, puis comparaison de cohortes proches ; disparition du doublement soudain des PV au premier étage sauf décision explicitement assumée. Dépend d’A06.
- [ ] **A08 — P1 — M — Design. Séparer les contraintes de D3 à D5.** Décider de la règle des intentions cachées et de la pénétration D4/D5 ; chaque palier a une difficulté et une promesse compréhensibles.
- [ ] **A09 — P1 — M — Progression. Revoir les ressources de répétition.** Essayer un nouveau personnage après une victoire avec un autre ne détruit pas son rythme de progression ; bonus de première victoire et récompense normale séparés.
- [ ] **A10 — P1 — M — Onboarding. Revoir la défaite forcée.** Prologue clairement annoncé ou parcours réellement jouable ; possibilité de passer l’aide ; aucun message n’attribue au joueur une perte imposée.
- [ ] **A11 — P1 — M — Combat. Clarifier Pacte de sang et les prérequis des pouvoirs.** PV après paiement visibles ; règle de sacrifice fatal explicite ; Silence explique capacité nécessaire et moyen d’y accéder.
- [ ] **A12 — P1 — L — Balance. Établir une matrice personnage et build.** Chaque personnage possède au moins deux directions accessibles testées sur profil neuf et intermédiaire ; résultats séparés de ceux du robot générique. Dépend d’A06.
- [ ] **A13 — P1 — M — Récompenses. Mesurer les offres inutiles et les signatures.** Journal des offres ; taux de refus et d’assemblage ; aucune expérience promise ne dépend d’une seule carte rarement vue sans alternative.
- [ ] **A14 — P1 — M — Récompenses. Clarifier les paliers de taille du deck.** Le joueur comprend la cadence des drafts ; comparaison avec une alternative ; aucune baisse silencieuse de choix n’est conservée sans justification.
- [ ] **A15 — P1 — S à M — Événements. Réintroduire des dilemmes avant D4.** Les pools risqués ont un poids intentionnel aux difficultés basses ; refuser un coût reste possible ; tests par biome et difficulté.
- [ ] **A16 — P1 — M — Ennemis. Mesurer les tours sans décision.** Cas de contrôle combiné identifiés ; une réponse accessible existe ; les tests couvrent gel, coût, pioche et défausse ensemble.
- [ ] **A17 — P1 — L — Boss et UI. Unifier les panneaux de mécanique.** Pour les 18 boss : objectif, progression, conséquence et prochain changement visibles ; validation avec joueurs qui ne connaissent pas le boss.
- [ ] **A18 — P1 — M — Art. Illustrer les 10 entités de boss manquantes.** Chaque cible d’énigme a un visuel distinct à petite taille ; aucun chemin d’image manquant pour ces IDs.
- [ ] **A19 — P1 — L — Mobile. Rendre les dangers hors champ visibles.** Combat à 4 ennemis et 3 alliés compréhensible ; indication des menaces non affichées ; fin du tour, ciblage et détails accessibles sans geste ambigu.
- [ ] **A20 — P1 — M — Données. Corriger les dénominations de télémétrie.** Cause de défaite, biome parcouru, archétype, PV perdus et Encre ont une définition documentée et un test de référence.
- [ ] **A21 — P1 — M — Infrastructure. Valider construction et reprise réelles.** Build reproductible, base de test propre, création/reprise/fin/reconnexion vérifiées ; traiter la dépendance aux polices et la commande lint.
- [ ] **A22 — P1 — S — Documentation. Réconcilier les TODO existants.** Retirer les constats devenus faux, conserver les actions ouvertes et référencer les preuves de cet audit. Ce rapport n’a pas modifié les TODO existants.

**Sortie du lot :** parcours complet testé par des débutants et des habitués, défauts de compréhension les plus fréquents corrigés, écarts de difficulté expliqués, aucun personnage dépendant d’un grind imposé pour être évalué.

### Lot 3 Lisibilité et profondeur

- [ ] **A23 — P2 — L — Accessibilité. Ajouter le parcours clavier complet.** Choisir une carte, une variante, une cible, annuler, finir le tour et fermer les panneaux sans souris ; focus visible et restauré.
- [ ] **A24 — P2 — M — UI. Améliorer le texte et la taille de lecture.** Échelle d’interface ou agrandissement fiable ; pas d’information essentielle limitée à un minuscule badge ou à la couleur.
- [ ] **A25 — P2 — L — Art. Produire une série cohérente de cartes.** Pilote de 12 à 20 illustrations validé dans la main, puis extension aux cartes fréquentes ; reconnaissance mesurée.
- [ ] **A26 — P2 — L — Art. Donner une silhouette de scène à chaque biome.** Au-delà de la couleur, architecture et sol distincts ; budgets de poids et de lisibilité respectés.
- [ ] **A27 — P2 — M à L — Présentation. Mettre en scène marchand, événements et fin de run.** Chaque type d’écran est identifiable ; les coûts et récompenses restent prioritaires.
- [ ] **A28 — P2 — M — Son. Finaliser le mix et les réglages.** Musique et effets séparés, niveaux persistants, aucun empilement agressif en attaques multiples.
- [ ] **A29 — P2 — M — Alliés et objets. Mesurer leur valeur et leur compréhension.** Cibles et persistance visibles ; taux de non-usage et morts rapides suivis ; ajustements appuyés sur les rencontres.
- [ ] **A30 — P2 — M — Carte. Garantir les propriétés du repli de génération.** Même après le nombre maximal d’essais, une carte valide est renvoyée ; le taux de repli est mesuré sur plusieurs milliers de graines.
- [ ] **A31 — P2 — M — Historique. Utiliser une source de run canonique.** Victoire, défaite et abandon apparaissent de façon cohérente ; deck, reliques, difficulté et durée correspondent au dernier état confirmé.
- [ ] **A32 — P2 — L — Narration. Écrire le bestiaire prioritaire.** Entrées réellement distinctes pour les ennemis de Bibliothèque et les boss ; chaque palier apporte une information nouvelle.
- [ ] **A33 — P2 — L à XL — Narration et boss. Donner une conclusion à la run standard.** Arc court, confrontation ou dénouement et conséquence mémorable ; ne pas bloquer cette conclusion sur quatre nouveaux systèmes.
- [ ] **A34 — P2 — M — Progression. Montrer la valeur marginale des histoires.** Le joueur sait ce qu’il gagnera réellement compte tenu des plafonds ; coûts et prérequis cohérents.
- [ ] **A35 — P2 — M — Performance. Mesurer les scènes chargées.** Résolution d’effets multiples, grand deck, longues listes et PWA testées sur matériel cible ; budget de latence fixé puis respecté.
- [ ] **A36 — P2 — M — Maintenabilité. Partager les contrats de déclenchement.** Les effets d’Encre, dégâts, reliques, alliés et altérations interagissent avec les boss de manière cohérente ; tests transversaux avant refactor.
- [ ] **A37 — P2 — M — Analytics. Ajouter les offres et les cohortes.** Comparaison par version, méta, expérience, personnage et difficulté, avec volumes affichés ; abandon séparé.
- [ ] **A38 — P2 — M — PWA. Vérifier changement de version et reconnexion.** Aucun état obsolète appliqué silencieusement ; comportement hors ligne annoncé ; sauvegarde reprise sans double action.

### Lot 4 Extensions à différer

- [ ] **A39 — P3 — XL — Contenu. Nouveaux personnages.** Uniquement après que les quatre existants ont des usages distincts et une difficulté acceptable.
- [ ] **A40 — P3 — XL — Contenu. Nouveaux biomes ou grands pools de cartes.** Ajouter une décision nouvelle identifiable ; ne pas seulement augmenter le nombre d’objets.
- [ ] **A41 — P3 — L à XL — Narration. Quêtes, sceaux et fins multiples.** Étendre un arc déjà terminé et compréhensible.
- [ ] **A42 — P3 — M à L — Rejouabilité. Défis à graines partagées.** Comparaison avec mêmes règles, même méta et même version ; intégrité des résultats résolue.
- [ ] **A43 — P3 — M — Mode infini. Repenser la progression si nécessaire.** Promesse de survie ou de longue exploration explicitement choisie ; classement distinct.
- [ ] **A44 — P3 — L — Présentation. Finition artistique exhaustive.** Étendre la direction validée sans compromettre lisibilité, poids et cadence de production.

### Dépendances et ordre de réalisation

A01 précède A06 ; A06 précède les décisions de balance A07, A08 et A12. A02, A03 et A04 se traitent ensemble pour protéger le parcours de bout en bout. A20 précède les conclusions tirées de la télémétrie. A17 et A18 doivent avancer ensemble : les objectifs des boss et leurs cibles visuelles portent la même information.

A05 peut être proportionné au mode de diffusion, mais le classement public ne doit pas être présenté comme fiable avant sa résolution. Les travaux d’art et d’écriture peuvent avancer après fixation des règles des cartes et boss concernés.

## 20 Protocole de validation humaine

### Cohortes et déroulement

Premier cycle proposé : **12 à 16 participants**, avec débutants du deckbuilder, habitués du genre et personnes découvrant uniquement Panlibrarium. Ce nombre sert à détecter les problèmes de compréhension ; il ne permet pas d’estimer finement tous les taux de victoire.

1. Session d’onboarding de 20 à 30 minutes avec observation, sans guider les choix.
2. Une run standard ou reprise jusqu’à sa conclusion.
3. Une deuxième run avec un changement volontaire de personnage ou de build.
4. Entretien court : décision la plus intéressante, défaite comprise ou non, règles oubliées, envie de rejouer.

Utiliser ensuite une cohorte plus large ou des sessions répétées pour la balance. À titre indicatif, une marge d’environ ±5 points autour d’un taux de 50 % demande de l’ordre de 400 observations indépendantes par groupe ; plusieurs runs du même joueur ne sont pas parfaitement indépendantes.

### Matrice minimale

| Dimension | Cas à couvrir |
| --- | --- |
| Profil | Neuf, intermédiaire construit à partir d’histoires réelles, complet réel |
| Personnage | Les quatre, avec apprentissage des pouvoirs |
| Difficulté | D0 et D1 d’abord ; D2/D3 ensuite ; D4/D5 avec joueurs expérimentés |
| Boss | Les 18 via scénarios reproductibles, puis intégrés à des runs |
| Deck | Rapide, défensif, dégâts dans le temps, peu d’impacts, nombreuses cartes, main encombrée |
| Interface | Desktop 1366 × 768 et 1920 × 1080 ; mobiles autour de 360, 390 et 430 px ; paysage |
| Langue | Français et anglais |
| Entrée | Souris, tactile, clavier |
| Réseau | Normal, lent, coupure, réponse en erreur, reconnexion, deux onglets |
| Sauvegarde | Pendant combat, après récompense, après changement de biome, après changement de phase de boss, pendant fin de run |
| PWA | Installation, mise à jour, retour après arrière-plan, mode hors ligne annoncé |

### Indicateurs utiles

- Temps jusqu’au premier choix d’Encre compris.
- Proportion des joueurs capables d’annoncer les dégâts du prochain tour.
- Erreurs de ciblage et actions tactiles involontaires.
- Tours sans action raisonnable, avec leur cause.
- Répartition des défaites par acte, rencontre et cause réelle.
- Écart entre PV perdus attendus et constatés.
- Taille du deck, cartes refusées, purges et améliorations.
- Apparition et assemblage des pièces de build.
- Utilisation des pouvoirs, variantes et objets.
- Durée réelle des runs et des boss.
- Progression après défaite, temps jusqu’au prochain déblocage.
- Sauvegardes réellement confirmées, reprises réparées et doublons empêchés.
- Envie déclarée de relancer, puis relance effectivement effectuée.

### Conditions proposées pour une bêta plus large

- Les tâches P0 applicables sont closes avec tests et preuves.
- Aucun défaut de perte ou duplication de progression n’apparaît dans la campagne de reprise.
- Chaque boss a un contre-jeu explicable et des cibles lisibles.
- Les quatre personnages sont évalués sur des profils réels ; les difficultés accessibles ne reposent pas sur une correction arbitraire des chiffres du simulateur.
- Les principaux problèmes de compréhension du premier cycle de playtests sont résolus.
- Les scènes mobiles encombrées sont utilisables sur appareils réels.
- Le build, la migration, les polices, la PWA et la reprise sont validés dans un environnement proche de la diffusion.
- Les limites restantes sont connues et n’empêchent pas de juger le cœur du jeu.

## 21 Correspondance avec la documentation existante

Les anciens audits sont utiles pour comprendre les intentions, mais plusieurs affirmations doivent être remplacées :

| Ancienne affirmation ou métrique | État constaté |
| --- | --- |
| Deux personnages principaux | Quatre personnages jouables, dont deux disponibles immédiatement |
| 531 ou 538 tests | 586 tests dans la suite exécutée |
| Aucun doublon de cartes | Pas de doublon mécanique selon certains scripts, mais collision globale de l’ID ink_surge |
| 260 cartes au total | 260 entrées du catalogue lootable ; 276 entrées fusionnées pour 275 IDs |
| Tutoriel absent | Tutoriel présent, avec défaite scénarisée à réexaminer |
| Historique absent | Page présente, fondée sur les snapshots PvP |
| Vitesse absente | Réglages de vitesse et application aux animations déjà présents |
| Hover 3D et effets de zone absents | Des mécanismes de tilt et de flash de zone existent dans le code actuel |
| Bibliothèque triviale et boss simples | Boss spécialisés actuels ; 15 % dans le scénario artificiel D2 testé, ce qui ne mesure pas leur taux individuel |
| Méta max du simulateur égale aux histoires | Preset obsolète et nettement différent du calcul réel |
| Augmenter le vrai taux du robot de 5 à 10 points | Correction non établie ; biais positifs et négatifs mêlés |

Ne pas reprendre les anciennes valeurs de difficulté, taux de victoire ou nombres de cartes comme des constantes intemporelles. Conserver les règles vivantes près du code et les résultats d’expérience avec leur version et leur protocole.

## 22 Sources locales et reproduction

Le dossier `docs/audit-2026-10-09/` contient les preuves brutes et outils de lecture. Les scripts ajoutés pour cet audit n’ont pas modifié les règles du jeu.

| Sujet | Source principale |
| --- | --- |
| Catalogue et collision | src/game/data/index.ts, starter-deck.ts, cards.ts |
| Personnages et bases | src/game/data/characters.ts ; src/game/constants.ts |
| Difficulté et ressources | src/game/engine/difficulty.ts ; combat.ts ; meta.ts |
| Cartes et construction | cards.ts ; card-archetypes.ts ; card-offers.ts ; rewards.ts |
| Reliques, objets et alliés | src/game/data/relics.ts ; allies.ts ; src/game/engine/items.ts |
| Carte et rencontres | src/game/engine/run.ts ; src/game/data/combat-doctrine.ts |
| Boss | src/game/data/enemy-bosses/ ; modules spécialisés dans src/game/engine/ |
| Événements et conditions | src/game/engine/run-events.ts ; run-conditions.ts |
| Visuels et interactions | src/lib/assets.ts ; src/app/game/_components/combat/ |
| Audio | src/lib/sound.ts ; music.ts ; haptics.ts |
| Narration | src/lib/i18n/enemy-text-resources.ts ; src/game/data/histoires.ts |
| Sauvegarde | use-auto-save.ts ; src/server/actions/run.ts ; src/app/api/run/save/route.ts |
| Fin de run | src/server/services/run/run-lifecycle.service.ts ; run-persistence.service.ts ; run-progression-sync.service.ts |
| Analyse des résultats | src/game/engine/run-analytics.ts ; src/app/admin/stats/page.tsx |
| Outil de simulation | scripts/simulate.ts |
| Intentions et historique du design | docs/ETAT_DU_JEU.md ; TODO.md ; audits spécialisés existants |

Résultats : `matrix.json` et logs par scénario ; `diagnostic.json` et logs détaillés ; `inventory.json` ; `content-diagnostics.json` ; `tests.txt`, `type-check.txt`, `autosave-probes.txt`, `build.txt`, `lint.txt` ; sorties des audits existants. Les compteurs « tours » et les profils sont ceux du simulateur avec les limites exposées plus haut.

Commandes principales, depuis la racine du dépôt :

```powershell
npm run test
npm run type-check
npm run audit:cards -- --json
npm run audit:relics
npm run audit:unlocks
npm run audit:stories
npm run audit:signatures
python docs/audit-2026-10-09/run-matrix.py
python docs/audit-2026-10-09/diagnose.py
node --import tsx docs/audit-2026-10-09/inspect.ts
node --import tsx docs/audit-2026-10-09/catalog.ts
node node_modules/vitest/vitest.mjs run --config docs/audit-2026-10-09/audit-vitest.config.ts
```

**Attention aux sondes de sauvegarde :** leurs assertions décrivent les défauts constatés. Elles passent quand ces défauts sont reproduits ; ce ne sont pas des tests d’acceptation du comportement souhaité. Elles sont isolées de la suite ordinaire et doivent être inversées lors de la correction.

Les simulations se relancent avec la graine `audit-20261009`, la liste exacte des scénarios étant inscrite dans `run-matrix.py`. Refaire un échantillon après correction est nécessaire ; les pourcentages de ce rapport ne sont pas des objectifs de balance à reproduire.
