# Audit des cartes et plan de diversification

> Suivi du 11 octobre 2026 : les nouvelles différenciations de cartes et branches sont livrées dans la [passe finale](PASSE_FINALE_EQUILIBRAGE_ET_RECETTE_2026-10-10.md). Les [275 illustrations](ILLUSTRATIONS_CARTES_2026-10-10.md) sont intégrées. Restent l’observation des choix humains et la lisibilité, ainsi que l’harmonisation de la page Collection ; voir BAL-02 et UI-04 dans la [TODO active](TODO.md). Les chiffres et anciens problèmes d’accès à la base ci-dessous sont datés, pas un état actuel de la production.

Date de l'audit : 4 août 2026

Mise à jour du 9 octobre 2026 : le catalogue global contient 275 IDs uniques ; la collision `ink_surge` est supprimée et contrôlée par test. Chaque combat normal gagné propose désormais un draft, quelle que soit la taille du deck. Les mesures historiques de cadence et de taille finale ne décrivent donc plus la version actuelle. Voir le [suivi des corrections](CORRECTIONS_AUDIT_2026-10-09.md).

## Objectif

Cet audit évalue si le volume actuel de cartes produit suffisamment de décisions différentes, en prenant notamment _Slay the Spire_ et _Beneath Oresa_ comme points de comparaison.

Le but n'est pas de rendre toutes les cartes complexes. Les cartes simples sont nécessaires pour donner des repères, stabiliser les decks et rendre les synergies lisibles. Le travail recommandé consiste plutôt à réduire les répétitions fonctionnelles et à faire de l'Encre, des personnages et des biomes de véritables sources de mécaniques distinctes.

## Diagnostic initial — historique

Les chiffres de cette section décrivent l'état avant les passes de diversification. Ils sont conservés pour mesurer le chemin parcouru et ne représentent plus le catalogue actuel.

Panlibrarium possède un volume de cartes déjà important, mais le nombre de décisions mécaniquement différentes est inférieur à ce que ce volume suggère.

- 197 cartes actives hors bestiaire ont été analysées.
- 137 cartes, soit 69,5 %, reposent uniquement sur des combinaisons d'effets élémentaires : dégâts, Blocage, pioche, Encre, Force, Focus, soin, affaiblissements et Épuisement.
- 120 cartes, soit 61 %, sont essentiellement des assemblages de dégâts, Blocage, statuts, pioche et valeurs numériques.
- 16 groupes partagent la même structure mécanique lorsque les nombres sont ignorés.
- 138 cartes possèdent une variante encrée.
- 137 variantes encrées sur 138 conservent exactement la même structure que la carte normale.
- 197 cartes possèdent une amélioration.
- 188 améliorations sur 197 conservent exactement la même structure mécanique.
- Une seule variante encrée introduit actuellement une famille d'effet différente.
- Neuf améliorations seulement changent réellement le fonctionnement de la carte.

Le problème principal n'est donc pas la présence de doublons textuels exacts. Il s'agit de la répétition du modèle :

> Inflige X, applique Y, gagne Z ; l'amélioration et la variante encrée augmentent X, Y ou Z.

## État actuel vérifié — passe builds du 9 octobre 2026

- 197 cartes collectables actives hors bestiaire, budget inchangé.
- 39 cartes propres et 10 maîtrises pour chacun des quatre personnages, auxquelles s'ajoutent 41 cartes neutres : 90 cartes accessibles après tous les déblocages.
- 99 cartes simples sur 197, soit 50,3 %, dans la cible de 45 à 55 %.
- 118 variantes Encrées transformatrices sur 138 ; 20 variantes uniquement numériques.
- 0 branche A uniquement numérique, 0 branche B uniquement numérique et 0 paire A/B invalide.
- Aucun doublon mécanique exact dans le pool actif.
- Une seule ressemblance intentionnelle documentée : `frost_nail` et la maîtrise du Loup d'hiver.

Ce statut est recalculé par `npm run audit:cards` et `npm run audit:builds`. La suite complète compte 626 tests réussis et le build de production passe. Le [rapport builds et diversité](EQUILIBRAGE_BUILDS_2026-10-09.md) détaille les corrections de ciblage, la préservation des mécaniques à l’amélioration, la conservation en main et les limites des simulations. Les comparaisons et recommandations historiques qui suivent ne constituent pas une nouvelle mesure de la version actuelle.

## Comparaison avec les références

### Slay the Spire

La force des cartes de _Slay the Spire_ ne vient pas uniquement de leur nombre. Beaucoup d'entre elles changent la manière d'évaluer la main, la pioche, le tour ou le deck entier :

- coût variable ou temporairement modifié ;
- conservation entre les tours ;
- génération et transformation de cartes ;
- manipulation de la pioche, de la défausse et de l'Épuisement ;
- effets dépendant de la séquence de cartes jouées ;
- cartes volontairement négatives converties en ressources ;
- pouvoirs qui modifient durablement les règles du combat ;
- cartes médiocres seules mais centrales dans un moteur précis.

Panlibrarium possède déjà quelques cartes de cette nature, notamment `matryoshka_lore`, `recursive_scratch`, `winter_inscription`, les effets dépendant de l'Encre actuelle et les cartes liées aux cartes épuisées. Elles restent cependant minoritaires.

### Beneath Oresa

Deux idées de _Beneath Oresa_ sont particulièrement intéressantes :

- le positionnement tactique ;
- les améliorations divergentes qui imposent de choisir entre deux directions.

Le positionnement demanderait une reconstruction trop importante du système de combat et n'est pas recommandé actuellement.

Les améliorations divergentes sont en revanche très adaptées à Panlibrarium. Le jeu possède déjà quatre états potentiels pour une carte : normale, améliorée, encrée et encrée améliorée. Ces états devraient plus souvent changer la fonction de la carte au lieu d'augmenter uniquement ses valeurs.

Orientation recommandée :

- amélioration normale : fiable, économique et généraliste ;
- variante encrée : spécialisée, transformatrice ou risquée ;
- variante encrée améliorée : renforce le nouveau rôle, pas seulement les nombres.

## Volume accessible par personnage — diagnostic initial

En comptant les cartes neutres actives hors bestiaire :

| Personnage     | Cartes accessibles approximatives |
| -------------- | --------------------------------: |
| Scribe         |                               113 |
| Bibliothécaire |                               110 |
| Griot          |                                49 |
| Fou            |                                48 |

Les quatre personnages disposent maintenant de 20 cartes dans leur pool initial, mais leur profondeur à long terme reste très différente.

Le Griot et le Fou rencontrent surtout les cartes neutres des biomes, car la majorité des cartes de biome sont réservées au Scribe ou au Bibliothécaire. Après plusieurs runs, ils risquent donc de reconstruire plus souvent les mêmes familles de decks.

Le nombre total de cartes ne doit pas sensiblement augmenter. Il faut réécrire, remplacer ou réattribuer les cartes génériques existantes afin d'obtenir une parité stricte entre les quatre personnages. Une nouvelle carte à mécanique forte doit normalement prendre la place d'une carte faible ou redondante.

État actuel : chaque personnage possède 39 cartes propres et accède aux mêmes 41 cartes neutres, soit 80 cartes hors bestiaire.

## Règles cardinales retenues

1. Le pool total reste globalement à sa taille actuelle.
2. Les quatre personnages disposent du même nombre de cartes propres et du même nombre total de cartes accessibles.
3. Une nouvelle carte doit apporter une mécanique nouvelle, forte et structurante ; une variation numérique ne justifie pas une création.
4. Chaque carte doit proposer deux évolutions permanentes, mutuellement exclusives et mécaniquement différentes.
5. Les variantes encrées restent un axe distinct des deux évolutions permanentes.
6. La méthode par défaut est le remplacement : une création entre dans le pool en prenant la place d'une carte générique ou redondante.

## Biomes à retravailler — diagnostic initial

Nombre de cartes composées uniquement d'effets élémentaires :

| Biome        | Cartes élémentaires | Total | Proportion |
| ------------ | ------------------: | ----: | ---------: |
| African      |                  18 |    20 |       90 % |
| Aztec        |                  17 |    20 |       85 % |
| Library      |                  27 |    36 |       75 % |
| Celtic       |                  15 |    20 |       75 % |
| Greek        |                  14 |    20 |       70 % |
| Viking       |                  13 |    20 |       65 % |
| Egyptian     |                  13 |    20 |       65 % |
| Russian      |                  11 |    20 |       55 % |
| Lovecraftian |                   9 |    21 |       43 % |

Priorité : African, Aztec, Library et Celtic.

Lovecraftian et Russian sont actuellement les biomes les plus distincts mécaniquement et peuvent servir de référence interne.

## Groupes de redondance détectés

L'audit automatique détecte les groupes suivants lorsque les valeurs numériques sont ignorées.

1. `heavy_strike`, `mythic_blow`, `double_ou_rien`
2. `final_chapter`, `scribes_judgment`
3. `brace`, `ancient_ward`
4. `berserker_charge`, `bear_claw`
5. `valkyries_dive`, `codex_strike`
6. `madness_spike`, `spell_inscription`
7. `void_touch`, `titans_wrath`
8. `jaguars_blood`, `buffalo_charge`
9. `frost_nail`, `bestiary_normal_winter_wolf`
10. `rune_storm`, `necrotic_words`
11. `sacrificial_word`, `ancient_manuscript`
12. `iron_bard`, `drum_strike`
13. `blizzard_verse`, `labyrinth_trap`
14. `obsidian_ward`, `plague_of_words`
15. `danse_des_esprits`, `venin_du_serpent`
16. `eclair_ephemere`, `tempete_d_encre`

Une ressemblance entre cartes de personnages différents n'est pas toujours problématique. Elle devient prioritaire lorsque les cartes sont disponibles pour le même personnage, occupent le même rôle, ou apparaissent dans un pool personnel déjà limité.

## Recommandations par groupe

### Attaques lourdes

Cartes : `heavy_strike`, `mythic_blow`, `double_ou_rien`.

- Conserver `heavy_strike` comme attaque lourde simple.
- Faire dépendre `mythic_blow` des cartes améliorées en main ou dans le deck.
- Transformer `double_ou_rien` en véritable pari : condition de dernière carte, contrepartie en PV, résultat différé ou choix entre encaisser et relancer.

### Finishers Bleed

Cartes : `final_chapter`, `scribes_judgment`.

- Conserver `final_chapter` comme finisher Bleed direct.
- Faire consommer le Bleed à `scribes_judgment`, déclencher ses futurs dégâts immédiatement ou produire un effet secondaire selon la quantité consommée.

### Blocage et pioche

Cartes : `brace`, `ancient_ward`.

- Conserver `brace` comme outil simple de tempo.
- Faire conserver du Blocage à `ancient_ward`, protéger la prochaine carte piochée ou replacer une carte de la défausse sur la pioche.

### Dégâts et Force

Cartes : `berserker_charge`, `bear_claw`.

- Faire dépendre `bear_claw` de Weak, des Épines ou d'une carte défensive.
- Garder `berserker_charge` comme montée en puissance offensive ou la lier aux attaques jouées dans le tour.

### AoE et Bleed

Cartes : `rune_storm`, `necrotic_words`.

- Faire progresser `rune_storm` après un mélange de pioche ou selon les cartes épuisées.
- Faire transformer à `necrotic_words` une carte parasite, une malédiction ou un sacrifice en Bleed de zone.

### Bleed et Force

Cartes : `jaguars_blood`, `buffalo_charge`.

- Donner au Jaguar une logique de sacrifice, de chasse ou d'exécution.
- Donner au Buffle une logique d'élan selon les attaques précédentes du tour.

### Bleed et pioche

Cartes : `iron_bard`, `drum_strike`.

- Conserver `iron_bard` comme carte de valeur polyvalente.
- Donner à `drum_strike` une mécanique de rythme, d'alternance ou de refrain.

### AoE, Weak et Blocage

Cartes : `blizzard_verse`, `labyrinth_trap`.

- Conserver `blizzard_verse` comme contrôle immédiat.
- Transformer `labyrinth_trap` en effet différé déclenché lors de la prochaine attaque ennemie ou lorsqu'une condition est remplie.

### AoE et Poison

Cartes : `obsidian_ward`, `plague_of_words`.

- Faire convertir du Blocage en Poison à `obsidian_ward`, ou récompenser la défense contre des ennemis empoisonnés.
- Faire propager le Poison à `plague_of_words` lorsqu'un ennemi meurt.

### Griot

Cartes : `danse_des_esprits`, `venin_du_serpent`.

- Conserver une attaque Poison simple.
- Transformer l'autre en propagation, conversion Poison/Bleed, rythme ou préparation de refrain.

### Fou

Cartes : `eclair_ephemere`, `tempete_d_encre`.

- Conserver une décharge immédiate qui consomme toute l'Encre.
- Transformer l'autre en pari différé, surcharge, stockage d'Encre ou redistribution de dégâts.

## Identités mécaniques recommandées

### Scribe : réécriture et annotation

- Modifier temporairement la prochaine carte.
- Recopier la dernière carte jouée avec une pénalité.
- Annoter une carte pour le reste du combat.
- Récompenser les cartes améliorées en main.
- Déplacer précisément une carte entre main, pioche et défausse.
- Écrire maintenant une carte reçue au prochain tour.

### Bibliothécaire : classement et prévision

- Regarder et réorganiser les prochaines cartes.
- Archiver temporairement une carte hors du deck.
- Déclencher un effet lorsque la pioche est vide.
- Marquer une carte pour la conserver entre les tours.
- Déclencher ou jouer la carte au sommet de la pioche.
- Indexer plusieurs cartes partageant un type ou un mot-clé.

### Griot : rythme et narration

- Récompenser l'alternance entre Attaque et Compétence.
- Déclencher un refrain toutes les trois cartes.
- Répéter une partie de l'effet précédent.
- Commencer une histoire puis choisir sa conclusion.
- Transmettre Poison ou Bleed à un nouvel ennemi.
- Conserver un rythme entre les tours tant que la séquence n'est pas brisée.

### Fou : pari et instabilité

- Choisir entre un effet sûr et un effet risqué.
- Faire varier le coût ou l'effet au fil des tours.
- Récompenser la dépense exacte de toute l'énergie ou de toute l'Encre.
- Produire des résultats variables avec une garantie minimale.
- Accorder une récompense immédiate contre une dette future.
- Miser des PV, de l'Encre ou une carte de la main.

### Encre : transformation plutôt qu'amplification

- Modifier la cible d'une carte.
- Retarder son effet.
- Inverser dégâts et Blocage.
- Rendre un effet permanent pour le combat.
- Copier une partie du texte d'une autre carte.
- Récompenser la dépense exacte de la jauge.
- Conserver l'Encre en échange d'un effet plus faible.
- Autoriser une surcharge avec une conséquence négative.

## Identités mécaniques par biome

| Biome        | Direction recommandée                                                           |
| ------------ | ------------------------------------------------------------------------------- |
| Viking       | Sagas qui progressent après mélange, Épuisement ou survie à plusieurs tours.    |
| Greek        | Hubris : avantage très puissant suivi d'une vulnérabilité ou d'une dette.       |
| Egyptian     | Embaumement : archiver une carte puis la ramener transformée ou améliorée.      |
| Lovecraftian | Puissance contre cartes parasites, perte de contrôle ou conséquences différées. |
| Aztec        | Sacrifice de PV, cartes ou buffs pour accomplir un rituel.                      |
| Celtic       | Croissance, Épines et effets revenant plusieurs tours après.                    |
| Russian      | Cartes gigognes générant des versions plus petites ou successives.              |
| African      | Rythme, appel/réponse et transmission d'effets entre cartes.                    |

## Cibles de design

- Ramener la proportion de cartes simples entre 45 et 55 %.
- Faire changer réellement la fonction de 20 à 30 % des variantes encrées.
- Donner exactement deux évolutions mécaniquement différentes à chaque carte collectible.
- Éviter plus d'une ou deux cartes presque équivalentes dans le pool d'un même personnage.
- Réécrire environ 25 cartes avant d'augmenter fortement le volume total.
- Rééquilibrer les pools du Griot et du Fou par remplacement, réattribution ou échange, sans croissance nette importante.
- Donner deux évolutions réellement différentes à chaque carte, y compris aux communes.
- Préserver des cartes simples communes afin de conserver la lisibilité et la stabilité du premier acte.

# TODO

## P0 — Outillage et garde-fous

- [x] Étendre `npm run audit:cards` avec le taux de cartes composées uniquement d'effets élémentaires.
- [x] Afficher ce taux par personnage et par biome.
- [x] Mesurer séparément les ressemblances de la carte normale, de l'amélioration et de la variante encrée.
- [x] Détecter les variantes encrées qui ne changent que les valeurs.
- [x] Détecter les améliorations qui ne changent que les valeurs.
- [x] Ajouter une liste d'exceptions documentées pour les répétitions intentionnelles.
- [x] Ajouter une vérification empêchant deux nouvelles cartes rares d'avoir la même signature dans le même pool de personnage.
- [x] Ajouter un contrôle bloquant toute différence de taille entre les pools des quatre personnages.
- [x] Ajouter un budget de cartes total et faire échouer l'audit en cas de croissance non explicitement autorisée.
- [x] Vérifier que chaque carte collectible possède exactement deux branches d'évolution.
- [x] Vérifier que les deux branches n'ont pas la même signature mécanique normalisée.

Critère de fin : l'audit produit automatiquement les chiffres utilisés dans ce document et échoue sur une nouvelle redondance rare non justifiée.

## P1 — Corriger les redondances les plus fortes

- [x] Différencier `heavy_strike`, `mythic_blow` et `double_ou_rien`.
- [x] Différencier `final_chapter` et `scribes_judgment`.
- [x] Différencier `brace` et `ancient_ward`.
- [x] Différencier `berserker_charge` et `bear_claw`.
- [x] Différencier `valkyries_dive` et `codex_strike`.
- [x] Différencier `madness_spike` et `spell_inscription`.
- [x] Différencier `void_touch` et `titans_wrath`.
- [x] Différencier `jaguars_blood` et `buffalo_charge`.
- [x] Documenter la ressemblance intentionnelle entre `frost_nail` et `bestiary_normal_winter_wolf`.
- [x] Différencier `rune_storm` et `necrotic_words`.
- [x] Différencier `sacrificial_word` et `ancient_manuscript`.
- [x] Différencier `iron_bard` et `drum_strike`.
- [x] Différencier `blizzard_verse` et `labyrinth_trap`.
- [x] Différencier `obsidian_ward` et `plague_of_words`.
- [x] Différencier `danse_des_esprits` et `venin_du_serpent`.
- [x] Différencier `eclair_ephemere` et `tempete_d_encre`.
- [x] Mettre à jour les descriptions françaises et anglaises via la génération localisée à partir des effets.
- [x] Ajouter ou adapter les tests moteur de chaque nouvelle mécanique.

Critère de fin : aucun des groupes ci-dessus ne partage encore une signature complète sans justification explicite.

## P2 — Faire de l'Encre un choix mécanique

- [x] Faire changer de fonction à au moins 10 cartes communes ou inhabituelles en variante Encrée.
- [x] Faire changer fortement de fonction à au moins 10 cartes rares en variante Encrée.
- [x] Couvrir changement de cible, retard, copie, conversion, surcharge, dépense exacte et effet permanent de combat.
- [x] Inclure des transformations contextuelles et des contreparties, plutôt que des variantes toujours strictement meilleures.
- [x] Afficher les effets et contreparties localisés dans l'interface.
- [x] Enregistrer Encre générée, Encre dépensée, cartes Encrées et pouvoirs utilisés dans la télémétrie.

Critère de fin : au moins 25 variantes encrées changent leur structure mécanique et leur choix dépend du contexte du combat.

## P3 — Améliorations divergentes

- [x] Définir le modèle de données pour deux améliorations possibles sans casser les sauvegardes existantes.
- [x] Concevoir deux chemins pour toutes les cartes rares.
- [x] Concevoir deux chemins pour toutes les cartes inhabituelles.
- [x] Concevoir deux chemins courts mais mécaniquement distincts pour toutes les cartes communes.
- [x] Concevoir deux chemins pour les cartes de départ sans rendre le premier acte illisible.
- [x] Adapter les écrans d'amélioration pour montrer les deux résultats.
- [x] Adapter les événements, reliques et bonus gratuits qui améliorent une carte.
- [x] Définir comment l'amélioration choisie interagit avec la variante encrée.
- [x] Ajouter la migration de sauvegarde nécessaire.

Critère de fin : chaque carte collectible offre exactement deux évolutions mutuellement exclusives avec des signatures mécaniques différentes.

## P4 — Renforcer les personnages

### Scribe

- [x] Ajouter ou convertir au moins trois cartes autour de l'annotation.
- [x] Ajouter ou convertir au moins trois cartes autour de la copie/réécriture.
- [x] Ajouter une carte récompensant les cartes améliorées en main.

### Bibliothécaire

- [x] Ajouter une prévisualisation/réorganisation du sommet de la pioche.
- [x] Ajouter une mécanique d'Archive temporaire.
- [x] Ajouter des effets dépendant de la carte au sommet ou d'une pioche vide.

### Griot

- [x] Implémenter un état de Rythme ou de Refrain persistant pendant le combat.
- [x] Convertir au moins trois cartes existantes vers cette mécanique.
- [x] Remplacer ou réattribuer des cartes pour donner au Griot une présence équilibrée dans chaque biome sans augmenter le pool total.
- [x] Créer au moins une interaction de propagation Poison/Bleed.

### Fou

- [x] Implémenter une mécanique de Pari ou de Dette lisible.
- [x] Convertir au moins trois cartes existantes vers cette mécanique.
- [x] Remplacer ou réattribuer des cartes pour donner au Fou une présence équilibrée dans chaque biome sans augmenter le pool total.
- [x] Créer plusieurs cartes récompensant une dépense exacte d'Encre ou d'énergie.

Critère de fin : chaque personnage possède au moins deux moteurs de deck qui ne peuvent pas être reproduits par de simples cartes neutres.

## P5 — Renforcer les biomes

- [x] African : créer rythme, appel/réponse et transmission d'effets.
- [x] Aztec : créer sacrifices et rituels avec paiements explicites.
- [x] Library : remplacer plusieurs cartes génériques par des cartes enseignant Encre, annotation et classement.
- [x] Celtic : renforcer croissance différée et Épines.
- [x] Viking : renforcer les Sagas liées aux mélanges et à l'Épuisement.
- [x] Greek : introduire Hubris et contreparties différées.
- [x] Egyptian : introduire l'Embaumement/Archive temporaire.
- [x] Russian : renforcer les cartes gigognes et transformations successives.
- [x] Lovecraftian : conserver sa variété actuelle et vérifier sa lisibilité automatique.

Critère de fin : chaque biome possède au moins une question tactique et une famille de cartes immédiatement reconnaissables.

## P6 — Équilibrage et validation

- [x] Relancer l'audit après les lots de cartes retravaillées.
- [x] Vérifier les tailles de pools accessibles pour les quatre personnages.
- [x] Vérifier que les quatre tailles de pool sont strictement identiques.
- [x] Vérifier que le nombre total de cartes n'a pas augmenté hors exception validée.
- [x] Simuler D0 sans méta, avec méta moyenne et avec méta complète.
- [ ] Comparer la fréquence de sélection des cartes avant/après leur réécriture.
- [ ] Identifier les cartes jamais choisies, toujours choisies ou presque toujours retirées.
- [x] Vérifier par les tests moteur que les nouvelles mécaniques fonctionnent sans relique précise.
- [ ] Vérifier la lisibilité mobile des textes plus complexes.
- [x] Limiter la densité mécanique avec un budget automatique maximal de quatre familles avancées par état de carte.
- [ ] Faire des playtests humains ciblés sur Griot, Fou, African et Aztec.

Critère de fin : les nouvelles cartes créent davantage de constructions viables sans augmenter fortement la longueur des textes ou le taux de victoire global.

## Ordre d'exécution recommandé

1. P0 — Outillage.
2. P1 — Seize groupes redondants.
3. P2 — Variantes encrées.
4. P4 — Identités Griot et Fou.
5. P5 — African et Aztec, puis les autres biomes.
6. P3 — Améliorations divergentes, traité comme chantier autonome.
7. P6 — Validation continue et bilan final.

Les améliorations divergentes sont volontairement placées après les premières réécritures : elles touchent le modèle de données, l'interface et les sauvegardes. Les cartes doivent d'abord posséder des identités suffisamment solides pour que deux chemins d'amélioration aient un sens.

## Commandes de contrôle

```bash
npm run audit:cards -- --json
npm run type-check
npm run test
npm run build
```

## Bilan de la passe realisee (4 aout 2026)

Cette passe est implementee dans le jeu, et pas seulement documentee.

- Catalogue conserve a **197 cartes collectables actives hors bestiaire** : aucune creation nette et aucune suppression.
- Parite stricte atteinte : **39 cartes propres** pour chacun des quatre personnages, plus **41 neutres** communes. Chaque personnage accede donc a 80 cartes hors bestiaire.
- Pool de premiere run conserve a **20 recompenses** pour chaque personnage et deck initial conserve a 11 cartes.
- **63 cartes existantes reattribuees** : 31 au Griot et 32 au Fou, avec une presence de chacun dans tous les biomes.
- Les **16 groupes de redondance prioritaires** ont ete differencies. L'audit ne remonte plus aucun hotspot de trois cartes auteur partageant la meme signature.
- **Plus de 40 cartes** ont recu ou renforce une mecanique distinctive sans augmenter le catalogue.
- Le taux de cartes uniquement elementaires est passe de **69,5 % a 51,3 %** (101/197), dans la cible de 45 a 55 %.
- **119 variantes Encrees sur 138** changent maintenant de structure mecanique, soit 86 % des variantes. Les 19 variantes simples restantes sont des respirations volontaires, principalement sur des communes.
- Chaque carte collectable dispose effectivement de **deux evolutions permanentes A/B**, mutuellement exclusives et de signatures distinctes. Les anciennes sauvegardes restent compatibles : une ancienne carte amelioree utilise A par defaut.
- Les **197 branches A** et les **197 branches B** changent desormais la structure mecanique de la carte : aucune branche resolue ne se limite a augmenter les nombres ou a reduire le cout.
- Les ameliorations gratuites ou aleatoires choisissent A de facon deterministe ; les salles permettant un choix affichent les deux branches.
- Une carte Encree conserve sa transformation, puis recoit aussi la consequence mecanique de la branche B lorsque celle-ci en ajoute une.
- L'audit bloque desormais une croissance au-dela de 197 cartes, une difference de taille entre personnages, une evolution A/B identique ou une nouvelle duplication de cartes rares.
- Exception documentee : `frost_nail` et `bestiary_normal_winter_wolf` partagent volontairement leur structure, la carte de maitrise servant a enseigner le motif du Loup d'hiver.

### Validation automatique

- Audit : budget 197/197, pools 39/39/39/39, aucune branche invalide, aucune duplication rare.
- Simulation D0 sans meta, 100 runs par personnage : deck final moyen entre 22,5 et 25,4 cartes. Les resultats confirment encore un ecart d'efficacite de l'agent automatique entre personnages ; il est conserve comme signal de playtest et de reglage, pas masque par des bonus de statistiques.
- Les tests couvrent la parite, les deux evolutions de chaque carte et la conservation du choix de branche.

Les cases historiques ci-dessus constituent le plan ayant mene a cette passe. Le present bilan est la source de verite de son implementation ; les futurs changements doivent etre controles par `npm run audit:cards`.

## État consolidé de la TODO

Etat final apres la seconde passe technique :

| Lot              | Etat    | Preuve implementee                                                                                                                                                                                                          |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0 - Outillage   | Termine | L'audit mesure simplicite par biome/personnage, signatures normale/A/B/Encree, transformations uniquement numeriques, doublons rares, budget, parite, directions d'Encrage et couverture des identites.                     |
| P1 - Redondances | Termine | Les 16 groupes prioritaires ont ete differencies ; aucune duplication rare ou signature complete auteur a trois cartes ne subsiste.                                                                                         |
| P2 - Encre       | Termine | 119 variantes sur 138 changent de structure. Changement de cible, effet differe, copie, conversion, surcharge, depense exacte et effet persistant sont tous presents et controles par l'audit.                              |
| P3 - Evolutions  | Termine | Toutes les cartes collectables ont deux branches transformatrices. Les personnages utilisent leur identite et les neutres celle de leur biome. Interface, sauvegardes, ameliorations gratuites et Encrage sont compatibles. |
| P4 - Personnages | Termine | Scribe : annotation/copie. Bibliothécaire : Archive, classement, révélation/réorganisation et pioche vide. Griot : Rythme/Refrain et propagation. Fou : Pari/Dette et dépense exacte.                                       |
| P5 - Biomes      | Termine | Les cartes converties distribuent Saga/Epuisement, Hubris/Dette, Embaumement/Archive, parasites/copie, sacrifice, croissance/Epines, gigognes et rythme dans leurs biomes respectifs.                                       |
| P6 - Validation  | Partiel | Audit bloquant, 554 tests, matrice D0, typage et build sont validés. Les conclusions de sélection, retrait, lisibilité et plaisir attendent des données de runs ou une revue humaine.                                       |

### Nouvelles mecaniques moteur

- `RHYTHM_REWARD` : l'alternance Attaque/Competence construit un rythme ; chaque troisieme temps declenche un Refrain et pioche.
- `PROPAGATE_DOT` : transmet Poison et Saignement aux autres ennemis.
- `TAKE_ENERGY_DEBT` : donne de l'Energie maintenant et la retire au tour suivant.
- `EXACT_ENERGY_REWARD` et `EXACT_INK_REWARD` : recompensent une depense exacte.
- `COPY_LAST_CARD_TO_HAND` : reecrit la derniere carte jouee.
- `TOPDECK_FROM_DISCARD` : classe une carte de la defausse au sommet de la pioche.
- `ARCHIVE_AND_DRAW` : retire temporairement une carte, l'ameliore et la rend au tour suivant.
- Une variante Encree peut maintenant changer son ciblage sans modifier celui de la carte normale.

### Telemetrie exploitable

Les fins de run enregistrent maintenant, en plus des mesures precedentes :

- chaque carte jouee en mode normal ou Encre ;
- les choix de branche A/B ;
- les cartes ajoutees et retirees par identifiant ;
- les comparaisons acquisition / utilisation / suppression dans l'administration.

Cela permet d'identifier directement les cartes jamais choisies, sur-selectionnees, peu jouees apres acquisition ou souvent retirees des que des runs humains sont disponibles.

### Matrice D0 automatisee

La matrice `none` / `average` / `max` a ete executee pour les quatre personnages. Les decks finaux restent dans une plage d'environ 22,6 a 30 cartes. Le simulateur confirme que la meta augmente fortement les performances et que le Bibliothecaire est le personnage le moins bien pilote par l'agent automatique. Ces mesures sont conservees comme ligne de base ; elles ne sont pas corrigees artificiellement dans les cartes.

Les instruments nécessaires à l'analyse humaine sont en place, mais les données de runs ne peuvent pas être remplacées par l'audit structurel.

## Cloture de la passe creative

La passe creative finale remplace les choix generiques restants par trois roles lisibles :

- branche A : version fiable de la carte, avec une consequence tactique supplementaire ;
- branche B : specialisation liee au personnage ou, pour une carte neutre, a son biome ;
- Encre : changement de role sur toutes les rares et inhabituelles concernees, ainsi que sur environ la moitie des communes auparavant uniquement numeriques.

Les garde-fous font maintenant echouer l'audit si une branche A ou B redevient uniquement numerique, si deux branches deviennent identiques, si plus de 20 variantes Encrees restent uniquement numeriques, si les pools divergent ou si le budget de 197 cartes est depasse.

## Travail restant vérifié

### Code et design

Les points de code et de design de cette TODO sont terminés. Le Bibliothécaire manipule maintenant les prochaines cartes et possède un déclencheur de pioche vide, sans nouvelle carte. L'audit bloque aussi tout état de carte dépassant quatre familles mécaniques avancées.

### Données ou validation humaine nécessaires

1. Comparer les taux de sélection avant/après réécriture lorsqu'un volume suffisant de nouvelles parties existe.
2. Identifier les cartes jamais choisies, presque toujours choisies ou fréquemment retirées.
3. Vérifier la lisibilité réelle des textes complexes sur téléphone.
4. Faire des playtests ciblés sur Griot, Fou, African et Aztec.

Ces quatre points nécessitent des parties humaines et une base de télémétrie accessible. La tentative de lecture du 4 août 2026 a échoué car le serveur PostgreSQL configuré était indisponible. La TODO technique de l'audit des cartes est terminée.

## Passe des pouvoirs d'Encre

- **Scribe** : Sceau récompense désormais les cartes améliorées en main au lieu d'être un Blocage générique fixe ; Calligraphie et Encre Noire conservent leurs rôles d'annotation et de maîtrise de la jauge.
- **Bibliothécaire** : Vision révèle et inverse les trois prochaines cartes avant d'en piocher deux ; Index et Silence conservent classement et contrôle.
- **Griot** : Venin, Saignement et Gris-Gris avancent tous le Refrain. Chaque troisième pouvoir rend 1 Encre et pioche une carte ; les valeurs brutes de Poison et Saignement ont été légèrement réduites.
- **Fou** : Double Mise crée maintenant une dette d'Énergie ; Frénétique rembourse 1 Encre si le hasard défausse une carte améliorée ; Pacte de Sang conserve son pari PV contre Encre.
