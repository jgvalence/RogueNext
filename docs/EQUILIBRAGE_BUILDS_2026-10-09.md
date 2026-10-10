# Équilibrage des builds et diversité des cartes

> Mise à jour du 10 octobre : consulter la [passe d’équilibrage avancé](EQUILIBRAGE_AVANCE_2026-10-10.md) pour les règles actuelles et les mesures D0–D5. Elle corrige également une action irréalisable de l’ancien simulateur au marchand ; ses résultats remplacent les anciens taux de victoire pour juger la difficulté actuelle.

Cette passe corrige les conditions de fonctionnement et d’assemblage des builds, puis compare leurs résultats. Le jeu disposait déjà d’un grand nombre d’effets ; ses principaux problèmes étaient la perte de synergies à l’amélioration, des erreurs de ciblage, une répartition inégale des maîtrises et certaines ressources dont la contrepartie n’était pas réellement payée.

Les modifications sont locales. Les nouvelles parties portent la version de règles `2026-10-09.2`. Aucun personnage, aucune carte supplémentaire et aucune migration de base ne sont ajoutés. Les identifiants existants sont conservés.

## Ce qui change concrètement

| Sujet | Avant | Maintenant |
| --- | --- | --- |
| Profondeur totale des pools | Scribe 100, Bibliothécaire 101, Griot 81, Fou 81 cartes actives accessibles après déblocage complet | 90 par personnage : 39 propres hors bestiaire, 10 maîtrises, 41 neutres |
| Maîtrises du bestiaire | Répartition par somme des caractères de l’identifiant, presque uniquement entre Scribe et Bibliothécaire | Attribution explicite selon la mécanique, 10 par personnage |
| Mécaniques particulières à l’amélioration A | 52 effets hors Épuisement disparaissaient du catalogue résolu | Aucun de ces effets ne disparaît ; les formes encrées conservent aussi ces mécaniques |
| Branches offensives sur soi | Six branches générées ajoutaient des dégâts à des cartes ciblant le joueur | Les effets proposés respectent le ciblage de la carte |
| Forme encrée améliorée | L’aperçu et le moteur n’ajoutaient pas toujours les mêmes effets de branche | Composition commune aux deux chemins ; les ajouts multiples sont traités |
| Masque de bois | Appliquait Faible au joueur | Donne son Armure au joueur et applique Faible aux ennemis |
| Propagation des altérations | Ajoutait toute la concentration de la cible, permettant une multiplication par rebonds | Met les autres ennemis au niveau de la concentration transmise, sans additionner leurs charges existantes |
| Dette d’Énergie | Le montant dépassant l’Énergie du prochain tour était effacé | Le reliquat reste dû et est remboursé aux tours suivants ; affichage de la dette en combat |
| Récompense d’Énergie exacte | Vérifiée après les effets, donc parfois annulée par le remboursement d’Énergie de la carte elle-même | Vérifiée immédiatement après le paiement du coût |
| Conservation en main | Certains ajouts utilisaient le gel, qui rend la carte injouable | Nouvel effet de conservation d’une autre carte aléatoire, jouable, signalée dans la main et gardée une seule fin de tour |
| Archétype du deck | Pouvait inclure les effets d’une amélioration non choisie et ignorer certains nouveaux effets | Tient compte de la branche réellement choisie et reconnaît notamment doublement, propagation, rythme et archivage |

Les deux suppressions d’Épuisement encore signalées par l’outil concernent **Rituel interdit** et **Concentration totale**. Elles restent des transformations volontaires sur des cartes payant de l’Énergie. Elles ne sont pas assimilées aux pertes involontaires de mécanique.

La conservation concerne les ajouts de **Chant de la Gardienne**, de la forme encrée de **Labyrinthe** et le recours correspondant des branches automatiques. Elle ne remplace pas le gel utilisé volontairement par les ennemis. Elle exclut la carte jouée et les cartes d’encombrement, persiste dans une sauvegarde, puis s’efface après la fin de tour concernée.

## Cartes et effets retravaillés

| Carte ou interaction | Rôle désormais recherché | Contrepartie ou choix |
| --- | --- | --- |
| `poison_herb` — Herbe empoisonnée | Poser du Poison et convertir la concentration en défense | Ne double plus le Poison ; ce rôle reste notamment à Transe vaudou |
| `iron_bard` — Barde de Fer | Attaque lourde de Saignement, Armure proportionnelle et propagation à moitié de concentration | Perd la pioche ; se distingue de Battement du Griot, qui fait tourner la main et entretient le rythme |
| `star_chart` — Carte des Étoiles | Armure et Encre, avec gain supplémentaire en alternant Attaque et Compétence | Ne duplique plus le rôle de Page noire, qui applique Faible à tous les ennemis |
| `ink_flow` — Flux d’encre, forme encrée | Préparer une amélioration temporaire dans la main | Produit 3 Encre en payant 1 Encre, au lieu de 5 auparavant ; la forme normale produit 3 sans ce paiement |
| `frost_rune_shield`, forme encrée | Ajouter une protection qui annule un coup | Conserve les valeurs de Blocage de base au lieu de simplement augmenter tous les chiffres ; coûte 2 Encre |
| `saga_of_blood`, forme encrée | Convertir les cartes épuisées en Armure | Ne convertit plus cette pile en dégâts dirigés contre le joueur |
| `blood_codex` | Convertir l’Épuisement en protection autour d’un sacrifice | Remplace un effet de dégâts par altérations inopérant sur sa cible personnelle |
| `adrenaline_pure`, amélioration A | Une accélération ponctuelle de 3 Énergie | Reste épuisée après usage ; ne devient plus une source gratuite répétable de 2 Énergie |
| `pacte_final`, amélioration A | Un tour de préparation à 6 Force et 3 cartes piochées | Reste épuisé après usage ; suppression du moteur gratuit répétable |
| `anansis_web`, forme encrée | Contrôle des ennemis et Épines pour le joueur | Les bonus positifs d’une carte offensive vont au camp ami, comme le Blocage et le soin |
| Dégâts proportionnels au Poison et au Saignement en zone | Chaque ennemi subit des dégâts selon ses propres charges | Ne reste plus sans effet lorsque la variante cible tous les ennemis |

Le Rythme vérifie effectivement l’alternance **Attaque ↔ Compétence**. Un Pouvoir ne constitue plus une alternance valide à la place d’une de ces deux catégories. La réserve d’Encre vide est décrite comme telle, au lieu d’être annoncée comme pleine dans certains textes de génération.

## Directions de construction par personnage

Ces directions décrivent des moteurs disponibles et testables. Elles ne constituent pas un classement de builds optimaux ni une promesse de viabilité identique à toutes les difficultés.

| Personnage | Direction | Préparation | Façon d’en tirer avantage |
| --- | --- | --- | --- |
| Scribe | Encre et annotation | Flux d’encre, Annotation, Afflux d’encre | Améliorations temporaires, variantes encrées et attaques qui valorisent une main améliorée |
| Scribe | Épuisement et tempo | Pactes, attaques épuisables, circulation du deck | Formes qui convertissent les cartes épuisées en protection ou en dégâts ; distinction entre survivre et dépenser ses ressources pour conclure |
| Scribe | Enchaînement de cartes | Pioche, Encre et copies | Préparer la séquence avant les attaques à rendement variable ; ne pas confondre pioche abondante et Énergie disponible |
| Bibliothécaire | Pioche et archivage | Archivage, remise au-dessus de la pioche, récupération | Préparer le tour suivant et exploiter le passage dans le deck ; l’archivage garde son effet à l’amélioration |
| Bibliothécaire | Défense et altérations | Blocage, Faible, Vulnérable et Épines | Gagner le temps nécessaire pour installer les cartes de fin de combat |
| Bibliothécaire | Défausse et Épuisement | Manipulation de défausse, cartes épuisables, maîtrise de Legba | Réduire les cartes inutiles et convertir les cartes dépensées en tempo |
| Griot | Poison | Applications répétées et défense par concentration | Doublement spécialisé, dégâts proportionnels et propagation sans multiplication gratuite |
| Griot | Saignement | Applications, Battement du Griot, cartes défensives | Choisir entre circulation, protection et attaque de finition plutôt que prendre toutes les variantes d’une même attaque |
| Griot | Rythme | Alterner une attaque et une compétence de rythme | Produire Encre et pioche sans sacrifier systématiquement la défense |
| Fou | Dette et accélération | Emprunts, cartes gratuites et préparation du tour | Conclure avant le remboursement ou prévoir les tours moins riches en Énergie |
| Fou | Encre et décharge | Produire l’Encre, choisir quand la vider | Transformer la réserve en dégâts ; arbitrer entre pouvoirs, variantes et décharge |
| Fou | Force, défausse et sacrifice | Force, effets de défausse, cartes encombrantes et Épuisement | Profiter des contreparties du deck ; les bursts gratuits ne deviennent pas des moteurs sans fin par une simple amélioration |

Le Griot conserve un pool initial de **20 cartes**, mais les compléments comportent maintenant **Cri du Scalde, Battement du Griot et Carte des Étoiles**. Le rythme dispose ainsi de cartes d’attaque et de compétence avant les améliorations. Le Papyrus sacré et sa défense liée au Poison restent déjà accessibles dans son pool de base.

La redistribution des maîtrises ouvre notamment le rite de Poison d’Anubis au Griot, les interactions d’encombrement de l’Hybride au Fou, l’annotation du Cyclope au Scribe et l’Énergie d’Épuisement de Legba au Bibliothécaire. Les anciennes cartes possédées dans une partie ne sont pas supprimées : ce sont les filtres de disponibilité des futures offres qui utilisent les nouvelles attributions.

## Diversité mesurée

- **275 identifiants** dans le catalogue complet ; **237 cartes actives collectables hors départ**, dont 197 hors bestiaire et 40 maîtrises. Le volume reste inchangé.
- **39 cartes propres hors bestiaire et 10 maîtrises par personnage**, plus les 41 neutres communes ; 90 cartes accessibles après tous les déblocages et 20 dans chaque pool initial.
- **99 cartes simples sur 197**, soit 50,3 %. La lisibilité des communes reste un objectif ; toutes les cartes n’ont pas besoin d’un moteur autonome.
- **46 familles d’effets utilisées dans les formes normales du pool hors bestiaire**. Ce chiffre mesure le vocabulaire mécanique, pas le nombre de builds.
- **8 groupes de formes normales structurellement proches**, contre 10 avant cette passe. L’analyse ignore les valeurs ; une ressemblance entre deux cartes de personnages différents n’implique pas qu’elles soient interchangeables dans une partie.
- **20 variantes encrées uniquement numériques sur 138**. Les autres changent de structure ou de ciblage selon le contrôle du catalogue.
- **Aucun doublon mécanique exact**, aucune paire de branches identiques, aucune branche résolue uniquement numérique selon le contrôle existant. Ces critères vérifient une différence de structure ; ils ne suffisent pas à démontrer que chaque choix est intéressant.

L’outil supplémentaire sépare, pour douze directions, les cartes qui **préparent** une mécanique de celles qui **en tirent avantage**. Une carte peut remplir plusieurs rôles. Pour l’Encre, les consommateurs incluent les variantes encrées : il s’agit donc d’un indicateur large, pas seulement des cartes qui augmentent avec la réserve d’Encre. La couverture détaillée porte sur le pool hors bestiaire et distingue les cartes du pool initial des cartes à débloquer.

La parité du nombre de cartes ne garantit ni une même puissance, ni une même répartition de raretés, ni une même fréquence d’apparition. Les prérequis de maîtrise et l’exposition aux biomes continuent de compter.

## Comparaison des builds

**4 000 parties simulées sans erreur d’exécution dans les séries finales :** 1 520 avant, 1 520 après, puis 960 essais supplémentaires de D2 à D5. La comparaison D0/D1 comprend 40 parties par cellule ; le contrôle D2–D5 en comprend 30. Les séries de diagnostic intermédiaires ne sont pas comptées dans ce total.

Avec le profil intermédiaire `average`, les préférences spécialisées donnent les résultats suivants. Chaque cellule montre le taux de victoire **avant → après** ; les résultats des préférences mixtes sont disponibles dans le tableau complet lié ci-dessous.

| Personnage | Préférence | D0 | D1 |
| --- | --- | ---: | ---: |
| Scribe | Encre | 80 → 85 % | 37,5 → 47,5 % |
| Scribe | Annotation | 80 → 80 % | 37,5 → 42,5 % |
| Scribe | Épuisement | 97,5 → 92,5 % | 60 → 57,5 % |
| Bibliothécaire | Pioche | 55 → 67,5 % | 35 → 32,5 % |
| Bibliothécaire | Archivage | 70 → 72,5 % | 22,5 → 32,5 % |
| Bibliothécaire | Armure | 87,5 → 92,5 % | 75 → 67,5 % |
| Griot | Poison | 47,5 → 70 % | 15 → 27,5 % |
| Griot | Saignement | 67,5 → 72,5 % | 25 → 25 % |
| Griot | Rythme | 35 → 57,5 % | 15 → 22,5 % |
| Fou | Encre | 42,5 → 77,5 % | 25 → 47,5 % |
| Fou | Dette | 72,5 → 97,5 % | 37,5 → 67,5 % |
| Fou | Force | 32,5 → 60 % | 22,5 → 35 % |
| Fou | Défausse | 50 → 70 % | 25 → 52,5 % |

**Le signal principal est une amélioration du fonctionnement, pas une égalité des builds.** Le Griot reste en retrait en D1 pour ce robot. L’Armure du Bibliothécaire et la Dette du Fou obtiennent les meilleurs résultats de leur personnage dans cet échantillon. La correction du remboursement n’empêche pas la Dette d’être très forte lorsque le burst conclut le combat avant les tours suivants : c’est un point à observer en priorité avec des joueurs.

Sans histoires, la préférence mixte en D0 passe de **40 à 40 % pour le Scribe, 30 à 60 % pour le Bibliothécaire, 10 à 17,5 % pour le Griot et 45 à 65 % pour le Fou**. Les différences de plusieurs dizaines de points appellent une validation ; les petites variations de quelques points ne permettent pas de conclure. Par exemple, 27 victoires sur 40 donnent un intervalle de Wilson à 95 % d’environ **52 à 80 %** pour ce protocole.

La densité réelle du deck reste un sujet : seuls **26,4 % des choix de cartes du Griot Rythme en D1** portent ce rôle dans leur forme normale, et **22,4 % des choix du Fou Défausse** correspondent à cette préférence. Les améliorations ultérieures ne sont pas incluses dans ce compteur. Il ne faut donc pas présenter ces lignes comme des essais de moteurs purs et parfaitement assemblés.

Le contrôle avancé utilise le profil `strong`, deux préférences par personnage et une autre série de graines. **D2 : 52 victoires sur 240 ; D3 : 7 sur 240 ; D4 et D5 : aucune sur 480.** Cela ne prouve pas que ces difficultés soient impossibles pour un joueur, mais la viabilité avancée des directions testées n’est pas établie. Une refonte ou une validation humaine de cette progression reste nécessaire avant de déclarer l’équilibre terminé.

La comparaison principale utilise **les mêmes paramètres, graines et règles de décision du robot** avant et après les changements de jeu. Le nouveau robot évalue les effets, choisit une amélioration selon sa préférence de construction et exporte les offres, les choix et les résultats de chaque partie. Il n’attribue plus un bonus parce qu’un nom contient « poison », « tome » ou « blood », ni parce qu’une carte est simplement rare.

Le robot garde toutefois une politique de combat générique, des préférences de reliques incomplètes pour certaines directions, des choix simplifiés d’événements et une tendance à accepter beaucoup de cartes. Il connaît les intentions calculées, même dans les difficultés qui les cachent au joueur. **Les résultats D3–D5 ne mesurent donc pas le coût humain de l’information cachée.** Les profils de méta synthétiques ne reproduisent pas un compte possédant toutes les maîtrises ; les effets de leur redistribution sont contrôlés par catalogue et tests, pas validés par une population de comptes avancés.

Sa politique de combat classe encore les cartes en partie selon Attaque/Compétence/Pouvoir. Une compétence offensive du Griot peut ainsi être préférée alors qu’une vraie défense serait nécessaire. Ce biais limite particulièrement l’interprétation des écarts entre personnages. Les résultats de l’ancien simulateur, qui choisissait surtout selon la rareté et le nom, ne sont pas directement comparables à ceux de cette passe.

La part de cartes choisies correspondant à la préférence permet de vérifier si le robot a réellement assemblé cette direction. Elle est conditionnée par les offres reçues. Un taux de victoire ne mesure pas isolément la puissance d’une carte, et une préférence appelée « Poison » ne signifie pas que le deck final soit exclusivement construit autour du Poison.

## Vérifications et fichiers reproductibles

```powershell
npm run audit:cards
npm run audit:builds -- docs/balance-2026-10-09/catalogue-after.json
npm test
npm run type-check
npm run lint
npm run build
python docs/balance-2026-10-09/run-matrix.py after
python docs/balance-2026-10-09/run-matrix.py stress
node --import tsx scripts/analyze-build-results.ts
```

Le fichier `catalogue-before.json` et les résultats `before-*.json` conservent l’état antérieur à cette passe. Relancer l’option `before` sur le code actuel écraserait cette référence : elle ne restaure pas l’ancien moteur. Les exports `after-*.json` contiennent les mesures finales ; `matrix-candidate-before-debt-fix.json` conserve seulement une étape de diagnostic et ne sert pas au bilan final.

Les [données du catalogue](balance-2026-10-09/catalogue-after.json), les [comparaisons détaillées](balance-2026-10-09/comparison.md) et les [résultats structurés](balance-2026-10-09/comparison.json) accompagnent ce document. Les tests couvrent les erreurs de cible, les mécaniques préservées, l’aperçu encré, les rebonds d’altérations, l’Épuisement, le paiement de dette sur plusieurs tours, la conservation et la parité complète des pools.

La suite complète passe **626 tests dans 50 fichiers**. Le typage TypeScript, ESLint, les deux audits de cartes/builds et le build de production sont contrôlés séparément ; leurs journaux sont conservés dans le même répertoire. Le contrôle AntD-first supplémentaire conserve la dette préexistante décrite dans le précédent suivi ; les nouveaux marqueurs n’ajoutent pas de primitive interdite.

Les captures [mobile](balance-2026-10-09/combat-mobile.png) et [desktop](balance-2026-10-09/combat-desktop.png) montrent les marqueurs de conservation et de dette dans un combat chargé rendu statiquement. Elles ne remplacent pas une partie tactile sur téléphone.

## Prochaines décisions d’équilibrage

1. **Valider le rythme du Griot avec des joueurs.** Vérifier que l’alternance se comprend, que le choix défensif est visible et que les builds Poison et Saignement gardent des raisons différentes d’être choisis.
2. **Mesurer la dette du Fou sur plusieurs combats.** Comparer gain du tour d’emprunt, Énergie réellement remboursée, tours pauvres et morts après un emprunt. Un burst qui termine le combat évite légitimement les remboursements suivants ; ce bénéfice doit rester payé par le risque dans les combats plus longs.
3. **Distinguer les branches utilisées.** Les structures sont différentes, mais certaines branches automatiques restent proches entre cartes d’un personnage. Les séquences de jeu et les taux de choix sont plus utiles qu’un objectif artificiel de zéro ressemblance.
4. **Tester la progression avancée avec les maîtrises débloquées.** L’égalité à 90 cartes corrige une asymétrie de catalogue ; elle ne prouve pas l’égalité de fréquence des moteurs complets. Tester les reliques associées et les boss qui contrent chaque direction.
5. **Ajuster les nombres après ces observations.** Modifier d’abord la pièce qui manque ou domine dans une séquence précise, puis vérifier son impact sur les autres directions. Éviter un bonus global à toutes les cartes d’un personnage sur la seule base du robot.

Cette passe apporte donc des corrections jouables et une base de comparaison plus solide. L’intérêt ressenti des choix, le niveau de difficulté recherché et la viabilité humaine de toutes les directions restent des critères de validation distincts des tests automatiques.
