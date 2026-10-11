# Audit des reliques et plan de diversification

> Suivi du 11 octobre 2026 : utiliser la [TODO centrale](TODO.md) pour les priorités et la [passe finale](PASSE_FINALE_EQUILIBRAGE_ET_RECETTE_2026-10-10.md) pour les mesures récentes du simulateur corrigé. Les résultats ci-dessous restent datés ; le choix et le plaisir d’utilisation des reliques nécessitent encore des parties humaines.

Date de l'audit : 4 aout 2026

Actualisation du 9 octobre 2026 : le simulateur applique désormais un pool de reliques explicitement débloquées et l’exclusivité carte/relique des récompenses d’élite. Les résultats de l’ancien simulateur ne valident pas les valeurs actuelles. Voir le [suivi global et ses limites](CORRECTIONS_AUDIT_2026-10-09.md).

## Objectif

Cet audit evalue les reliques de Panlibrarium selon cinq axes : interet des decisions, originalite, equilibre, soutien des builds et cadence de deblocage. _Slay the Spire_ sert de reference de philosophie, sans chercher a reproduire exactement son catalogue.

L'objectif n'est pas que chaque relique soit complexe. Une bonne collection a besoin de bonus simples, mais les reliques rares et de boss doivent plus souvent modifier la facon de construire ou de jouer une run.

## Etat mesure

- 194 reliques au total.
- 29 communes, 64 inhabituelles, 71 rares et 30 de boss apres la passe de reclassification.
- 40 reliques disponibles au debut de la progression.
- 27 reliques liees a un boss precis.
- 126 reliques possedent au moins un tag d'archetype.
- 107 reliques utilisent une condition de maitrise d'ennemi.
- 20 reliques utilisent une victoire de difficulte avec un personnage : 5 pour chacun des quatre personnages.
- 60 descriptions reposent sur un effet de debut de combat, 10 sur un debut de tour et 9 sur une fin de tour.
- 40 descriptions contiennent un signal de condition de jeu.
- 26 descriptions contiennent un signal explicite de contrepartie. Ces deux derniers chiffres sont des estimations lexicales, pas une preuve d'equilibre.

Ces valeurs sont produites par `npm run audit:relics`.

## Diagnostic general

Le catalogue contient deja beaucoup de bonnes idees. Les reliques les plus recentes demandent souvent au joueur de modifier son comportement : vider ou conserver sa main, alterner les types de cartes, depenser exactement son Energie, atteindre un rythme, exploiter une defausse ou preparer un tour.

Le principal probleme n'est donc pas un manque global d'idees. Il existe plutot une fracture entre :

- un ancien noyau passif, essentiellement compose de stats de depart ou de ressources automatiques ;
- un catalogue recent, plus conditionnel, thematique et interactif.

Avec 194 reliques, ajouter massivement du contenu rendrait la collection plus difficile a lire. La priorite doit etre la reecriture ou la reattribution des reliques faibles et redondantes.

## Comparaison avec Slay the Spire

Les meilleures reliques de _Slay the Spire_ remplissent generalement au moins une de ces fonctions :

- changer la valeur relative de certaines cartes ;
- encourager un ordre de jeu precis ;
- rendre viable un archetype auparavant marginal ;
- offrir une grande puissance avec une contrepartie structurante ;
- modifier l'economie, la route ou le risque accepte ;
- creer un moment attendu, par exemple tous les trois combats ou toutes les dix cartes.

Panlibrarium couvre deja plusieurs de ces fonctions. Ses reliques de biome, ses compteurs de cartes et ses interactions avec l'Encre lui donnent une identite propre.

Il reste cependant trop de reliques dont l'effet complet peut se resumer par :

> Commencez le combat avec X Blocage, Force, Epines ou Encre.

Ces reliques ne sont pas mauvaises en soi. Elles deviennent problematiques lorsqu'elles occupent aussi les raretes haute et boss, car elles n'engendrent aucune nouvelle decision pendant la run.

## Repartition des raretes

| Rarete       | Nombre | Part approximative |
| ------------ | -----: | -----------------: |
| Commune      |     29 |               15 % |
| Inhabituelle |     64 |               33 % |
| Rare         |     71 |               37 % |
| Boss         |     30 |               15 % |

La pyramide initiale etait fortement inversee. La premiere passe a ramene les rares de 87 a 71 et les communes de 16 a 28, sans changer le total. Les rares restent nombreuses parce que chaque biome possede une couche de reliques specialisees ; leur taux de rencontre reste aussi limite par les ponderations de recompense.

Consequences probables :

- le mot « rare » perd une partie de sa valeur ;
- les pools rares deviennent difficiles a apprendre ;
- une relique rare mediocre parait plus decevante ;
- les reliques communes simples sont trop peu nombreuses pour former un socle stable ;
- le joueur rencontre difficilement plusieurs fois la meme rare et apprend moins bien sa valeur.

Il n'est pas necessaire de supprimer 50 reliques. Une partie du probleme peut etre corrigee en reclassant les raretes selon la complexite et la puissance reelles.

## Forces actuelles

### Acquisition

- Les elites donnent une relique, ce qui rend leur risque lisible.
- Les boss proposent trois choix et garantissent leur relique specifique lorsqu'elle est disponible.
- Les offres sont ponderees par les archetypes dominants du deck.
- Les boutiques et certains evenements donnent d'autres voies d'acquisition.
- Les reliques de maitrise lient naturellement le bestiaire et la progression.

### Soutien des builds

Repartition actuelle des tags :

| Archetype | Reliques |
| --------- | -------: |
| Blocage   |       32 |
| Pioche    |       29 |
| Encre     |       28 |
| Force     |       27 |
| Soin      |       20 |
| Poison    |        7 |
| Bleed     |        6 |

Le socle Encre, Blocage, Pioche et Force est solide. Poison et Bleed ont moins de reliques, mais leurs multiplicateurs peuvent etre tres puissants ; leur faible nombre ne signifie donc pas necessairement qu'ils sont faibles.

### Reliques interactives reussies

Les directions suivantes sont particulierement prometteuses :

- bonus lorsque la main devient vide ou reste volontairement pleine ;
- recompenses apres un nombre precis de cartes ;
- effets lies a la premiere Attaque ou Competence du tour ;
- depense de toute l'Energie ;
- duplication conditionnelle d'une prochaine carte ;
- choix au debut du combat ;
- modification des boutiques, boss, potions ou routes ;
- effets cycliques selon le numero du tour.

Ce sont ces reliques qui rapprochent le plus le jeu de la qualite decisionnelle de _Slay the Spire_.

## Problemes prioritaires

### 1. Dominance stricte

Certaines reliques partagent la meme rarete et le meme role, avec une version manifestement meilleure :

- `bookmark` donne +1 pioche chaque tour sans contrepartie ;
- `blighted_compass` donne le meme bonus mais ajoute Weak au debut du combat ;
- `archon_ink_crown` donne 3 Epines au debut du combat ;
- `briar_codex`, de meme rarete, n'en donne que 2.

Une condition de deblocage plus tardive ne suffit pas a rendre agreable une relique strictement dominee lorsqu'elles peuvent ensuite apparaitre dans le meme pool.

### 2. Reliques de boss trop passives (corrige)

Avant la passe finale, plusieurs recompenses de boss ressemblaient a des versions numeriquement superieures de reliques ordinaires :

- `dagdas_club` : Epines de depart ;
- `obsidian_mirror` : Force de depart ;
- `wolf_fang` : Force et Blocage de depart ;
- `shub_idol` : Force et Encre de depart ;
- `hels_crown` et `hydra_scale` : deux repartitions tres proches de Force et Epines.

Une relique de boss devrait idealement rappeler le combat vaincu et modifier la suite de la run. Un simple paquet de stats est utile, mais rarement memorable.

La passe finale a applique ce standard aux 30 reliques de boss. L'audit les reconnait maintenant toutes comme decisionnelles, conditionnelles ou assorties d'une contrepartie structurante.

### 3. Puissance passive potentiellement excessive

Certaines reliques meritent une verification numerique prioritaire :

- `bookmark` : +1 pioche chaque tour pour une inhabituelle ;
- `spectral_inkwell` : 2 Encre chaque tour pour une inhabituelle ;
- `arcane_reservoir` : 3 Encre chaque tour ;
- `energy_crystal` : +1 Energie chaque tour sans contrepartie ;
- `philosophers_tome` : +6 Force, +5 regeneration et +5 Encre au debut du combat ;
- `eternal_flow` : +3 Encre, +2 Blocage et +1 Force chaque tour.

Ces reliques peuvent reduire l'importance du deck ou amplifier fortement l'ecart entre une progression faible et avancee.

### 4. Personnages incomplets

Le Scribe, la Bibliothecaire, le Griot et le Fou ont maintenant chacun une progression de cinq reliques personnelles, obtenues par les difficultes 1 a 5.

Avant cette passe, le Griot et le Fou n'avaient aucune serie correspondante. Cette absence :

- rend leur progression de difficulte moins gratifiante ;
- affaiblit leur identite dans le catalogue ;
- cree une inegalite de contenu plus importante que la difference de puissance d'une relique individuelle.

La correction a reattribue et reecrit dix reliques existantes, sans augmenter le total.

### 5. Lisibilite editoriale

Les noms et descriptions melangent actuellement francais et anglais. Plusieurs textes contiennent aussi des caracteres corrompus ou des formulations techniques.

Avant un equilibrage fin, chaque relique doit posseder :

- un nom francais et anglais localise ;
- une description generee ou verifiee depuis son comportement reel ;
- les memes mots-cles que les cartes ;
- une indication claire des limites « une fois par tour », compteurs et contreparties.

### 6. Audit automatique insuffisant

L'ancien audit comparait uniquement les descriptions. Deux effets differents pouvaient partager un texte proche, et deux implementations identiques pouvaient echapper au controle si leur phrase etait formulee differemment.

Il faut auditer les declencheurs et valeurs reels, pas seulement les phrases.

## Cadence de deblocage

### Ce qui fonctionne

- 40 reliques sont disponibles au debut : le pool initial est deja varie.
- Les maitrises utilisent effectivement des seuils de 5 ennemis normaux, 3 elites et 2 boss.
- Les paliers de runs, victoires, difficulte et or prolongent la progression.
- Les reliques specifiques de boss demandent de connaitre puis maitriser leur rencontre.

### Risques

- 114 reliques liees aux ennemis representent 59 % du catalogue : la progression depend beaucoup des rencontres aleatoires.
- Deux reliques peuvent demander la maitrise du meme ennemi, produisant un gros deblocage ponctuel plutot qu'une cadence reguliere.
- Les objectifs `totalRuns` recompensent aussi l'echec et sont moins satisfaisants que des accomplissements de gameplay.
- Les quatre series de maitrise arrivent progressivement avec les difficultes propres a chaque personnage.

Recommandation : conserver la maitrise comme axe principal, mais convertir quelques conditions de runs en objectifs de personnage ou d'archetype observables.

## Directions creatives recommandees

### Scribe

- recompense des cartes ameliorees ;
- annotation temporaire ;
- copie avec cout ou perte de controle ;
- interaction avec les pouvoirs Calligraphie, Encre noire et Sceau.

### Bibliothecaire

- sommet de pioche revele ;
- conservation de cartes ;
- pioche vide et remelange ;
- recuperation ciblee depuis la defausse ;
- interaction avec Vision, Index et Silence.

### Griot

- alternance Attaque/Competence ;
- Refrain tous les trois declenchements ;
- propagation Poison/Bleed ;
- repetition partielle de la carte precedente ;
- bonus qui se conserve tant que le rythme n'est pas brise.

### Fou

- dette d'Energie ;
- depense exacte de toute l'Encre ou Energie ;
- pari de PV ;
- defausse aleatoire transformee en avantage ;
- effets dont la valeur ou le cout change chaque tour.

### Biomes et boss

Une relique de boss devrait reprendre une regle reconnaissable du boss : renaissance, jugement, miroir, venin, phases, sacrifices, rythme ou manipulation du deck. Elle ne devrait pas seulement reprendre ses couleurs et donner des stats.

## Regles proposees

1. Ne pas augmenter sensiblement le total de 194 reliques.
2. Toute nouvelle relique remplace une relique faible ou redondante.
3. Une relique de boss doit changer une regle, creer une condition ou proposer une contrepartie.
4. Deux reliques de meme rarete ne doivent pas etre en relation de dominance stricte.
5. Les quatre personnages doivent posseder le meme nombre de reliques de maitrise.
6. Une relique rare doit etre puissante, structurante ou specialisee ; pas seulement numeriquement plus grande.
7. Les reliques communes peuvent rester simples et fiables.
8. Une relique ne doit pas rendre le deck presque secondaire en generant seule trop d'Energie, de pioche ou d'Encre chaque tour.
9. Les descriptions doivent provenir du comportement implemente et etre localisees.

# TODO

## P0 - Outillage et exactitude

- [x] Compter les reliques par rarete.
- [x] Compter les tags d'archetype, sources de boss et types de deblocage.
- [x] Detecter les descriptions exactes et les patrons numeriques repetes.
- [x] Construire une signature mecanique depuis les hooks moteur, pas depuis le texte.
- [x] Verifier automatiquement que chaque relique possede au moins une reference moteur.
- [ ] Verifier automatiquement que description et implementation concordent.
- [x] Detecter la dominance stricte dans une meme rarete.
- [x] Ajouter un budget total et un controle de parite des reliques personnelles.

## P1 - Corrections de coherence

- [x] Corriger `bookmark` contre `blighted_compass`.
- [x] Differencier `archon_ink_crown` et `briar_codex` par rarete et cadence.
- [x] Verifier et differencier les trois regenerations par tour.
- [x] Verifier et differencier les sources automatiques d'Encre par tour.
- [ ] Harmoniser les noms et descriptions francais/anglais.
- [x] Corriger les caracteres corrompus et noms techniques visibles dans les ressources de reliques.
- [x] Corriger les commentaires de recompense devenus differents du comportement reel.

## P2 - Reliques de boss

- [x] Transformer `dagdas_club` en mecanique de croissance d'Epines.
- [x] Transformer `obsidian_mirror` en marquage Vulnerable de la premiere cible.
- [x] Donner a `wolf_fang` une condition de chasse et d'execution.
- [x] Donner a `shub_idol` une contrepartie de proliferation de Statuts.
- [x] Differencier fortement `hels_crown` et `hydra_scale`.
- [x] Auditer les 30 reliques de boss selon le critere « change-t-elle une decision ? ».
- [x] Reprendre les reliques de boss encore classees passives par l'audit mecanique (30/30 sont maintenant decisionnelles).

## P3 - Egalite des personnages

- [x] Definir cinq reliques de maitrise pour le Griot, difficultes 1 a 5.
- [x] Definir cinq reliques de maitrise pour le Fou, difficultes 1 a 5.
- [x] Les creer par remplacement ou reattribution, sans croissance nette.
- [x] Relier plusieurs reliques de chaque personnage a son identite et a ses ressources.
- [x] Garantir par audit cinq paliers pour chacune des quatre series.

## P4 - Equilibrage

- [ ] Mesurer taux de choix, taux d'achat et taux de victoire avec/sans chaque relique.
- [ ] Mesurer l'impact de `bookmark`, `spectral_inkwell`, `arcane_reservoir` et `energy_crystal`.
- [ ] Mesurer `philosophers_tome` et `eternal_flow` separement de la metaprogression.
- [x] Verifier les multiplicateurs Poison/Bleed : maximum technique actuel de x3 avec les deux reliques cumulables ; a confirmer par telemetrie.
- [ ] Comparer la valeur moyenne des choix de boss par rarete et biome.
- [ ] Identifier les reliques presque toujours choisies ou presque toujours ignorees.

## P5 - Cadence de deblocage

- [x] Simuler le nombre de reliques disponibles apres 0, 3, 6, 10 et 20 runs.
- [x] Detecter les ennemis qui debloquent plusieurs reliques simultanement et reduire ces seuils de 26 a 19.
- [x] Remplacer quelques conditions `totalRuns` par des accomplissements (victoires ou difficulte).
- [x] Verifier qu'une relique personnelle arrive a chaque palier de difficulte pour chaque personnage.
- [x] Afficher clairement la progression 5/3/2 des maitrises dans la collection.

## P6 - Validation humaine

- [ ] Faire classer les reliques par plaisir attendu avant de jouer.
- [ ] Comparer ce classement au taux de choix reel.
- [ ] Tester si les reliques de boss sont memorables sans relire leur texte.
- [ ] Verifier la comprehension des compteurs et contreparties sur mobile.
- [ ] Effectuer une passe finale apres au moins 100 runs telemetrees.

## Ordre recommande

1. P0 pour rendre les mesures fiables.
2. P1 pour retirer les incoherences evidentes.
3. P4 et P5 avec les donnees de runs.
4. P6 avant une nouvelle extension du catalogue.

## Verdict

Le catalogue de reliques est quantitativement plus que suffisant et contient deja de tres bonnes mecaniques. Il n'a pas besoin d'une extension massive.

La passe prioritaire doit :

- continuer a reduire les relations de dominance restantes ;
- mesurer en conditions reelles les reliques de boss maintenant transformatrices ;
- valider en jeu les nouvelles series du Griot et du Fou ;
- corriger la pyramide de rarete ;
- rapprocher le noyau ancien du niveau creatif des reliques recentes ;
- mesurer la puissance passive qui contribue probablement au grand ecart entre absence de meta et progression moyenne.

Apres cette passe, les reliques pourraient devenir l'un des points forts du jeu, car elles disposent deja d'un bon systeme d'acquisition, d'une forte couverture thematique et de nombreux hooks de gameplay.

## Validation de la passe

- 194 reliques conservees : aucune inflation du catalogue.
- Repartition finale : 29 communes, 64 inhabituelles, 71 rares et 30 de boss.
- 20 reliques de maitrise : 5 pour chacun des quatre personnages.
- Aucune relique sans reference dans le moteur.
- 575 tests passent, ainsi que le typage, le build et les audits cartes/deblocages/reliques.
- Sur 50 simulations en difficulte 0 avec meta moyenne : Scribe 94 %, Bibliothecaire 58 %, Griot 88 %, Fou 38 %. Ce petit echantillon confirme que l'ecart restant entre personnages est systemique et ne doit pas etre masque en surgonflant leurs reliques de maitrise.

Les cases encore ouvertes ci-dessus demandent soit de la telemetrie de choix, soit des runs humains, soit un second outil d'analyse semantique. Elles ne correspondent pas a des reliques laissees sans implementation.

## Resultats du second audit automatique

- Les signatures mecaniques sont maintenant extraites des branches du moteur et groupees pour reveler les familles reelles, independamment de leur formulation.
- Les trois dominances numeriques detectees ont ete retirees : `slime_ink_vial`, `guardian_dune_amulet` et `wraith_torn_folio` ont maintenant une fonction, une condition ou une rarete distincte de leur concurrent direct.
- `russian_domovoi_hearth` donne maintenant 3 Encres au premier tour au lieu de dupliquer l'Encre automatique de `spectral_inkwell`.
- La courbe sans victoire ni maitrise est volontairement faible : les deblocages doivent davantage recompenser les accomplissements que l'accumulation d'echecs.
- L'audit signale 26 seuils de maitrise debloquant deux reliques simultanement. La plupart associent la relique generique du boss ou de l'ennemi a sa variante de biome ; ils restent visibles dans le rapport pour une future decision de cadence.
- L'audit individuel classe maintenant 30 reliques de boss sur 30 comme decisionnelles, conditionnelles ou dotees d'une contrepartie structurante.

## Passe finale des reliques de boss

Quatorze reliques auparavant principalement passives ont ete transformees sans augmenter le catalogue :

- `archivists_lens` recompense le premier Pouvoir du combat ;
- `cernunnos_horn` fait croitre les Epines en terminant sans Armure ;
- `deathless_bone` echange une Energie maximale contre un Statut ;
- `eye_of_maat` adapte son jugement au premier type de carte du tour ;
- `griot_drum` recompense chaque troisieme carte selon son type ;
- `guardians_seal` rembourse en Energie la depense de la derniere Encre ;
- `quetzal_feather` demande de choisir le type de la premiere carte ;
- `solar_disc` convertit l'Energie non depensee en Encre ;
- `stone_pendant` recompense l'ouverture sur une cible indemne ;
- `void_shard` donne de la Concentration avec une pollution du deck ;
- `weavers_thread` recompense chaque troisieme Competence ;
- `yaga_skull` augmente la pioche avec une dette periodique ;
- `viking_hel_signet` transforme Vulnerable en croissance d'Epines ;
- `celtic_cernunnos_antler` transforme les Epines en condition de soin actif.

Les reliques simples restantes sont conservees aux raretes commune et inhabituelle, ou possedent une fonction de respiration dans le pool. Aucune nouvelle relique ne doit etre ajoutee sans remplacement explicite.

La page dynamique `/runs` est maintenant explicitement declaree comme telle ; le build de production ne tente plus de la prerendre et termine correctement.

L'audit qualitatif des conditions et le systeme de reliques identitaires de depart sont documentes dans `docs/AUDIT_DEBLOCAGE_RELIQUES.md`.
