# Passe visuelle du combat mobile — 11 octobre 2026

Suite au [correctif des cartes et récompenses](CORRECTIF_MOBILE_2026-10-11.md), reprise de la scène : les ennemis étaient agrandis en portrait, recadrés en bandeaux en paysage, et le héros n'avait pas de portrait mobile.

## Changements

- Portrait du personnage sélectionné, nom, PV, armure et effets regroupés. Les alliés conservent leurs commandes et disposent également d'un portrait.
- Illustrations ennemies au format de carte, au lieu des miniatures, affichées entièrement. Taille bornée pour un ennemi seul ; images compactes dans les rencontres chargées.
- Nom, PV, armure et intentions regroupés sous l'image en portrait et à côté en paysage. Les intentions cachées restent cachées, avec un libellé explicite.
- Une seule représentation interactive de chaque ennemi : suppression de la liste de texte qui remplaçait leurs portraits sur les écrans courts. Défilement visible et indication de consultation des ennemis supplémentaires.
- Décor assombri ; cadre et badge de boss ; contour et repère de ciblage ; conservation des dégâts flottants, apparitions, morts et flashs. Respect du mouvement réduit.
- Fiches du héros, des alliés et des ennemis limitées à la hauteur disponible, avec contenu défilant et boutons tactiles de 44 px minimum.
- En paysage court, les cartes conservent leurs effets résumés et leur bouton de lecture. Sur les très faibles hauteurs et lors des explications de boss, le combat peut défiler verticalement pour garder les commandes accessibles.

## Validation

- Suite complète : **664 tests, 60 fichiers, tous réussis**. Cas ajoutés : héros correspondant au personnage choisi, inspection et ciblage sans doublons, ennemi mort non ciblable, intention d'élite cachée en D3.
- Le joueur utilise un **Redmi Note 11 Pro 5G**. Profils CSS complémentaires : 393 × 873 et 873 × 393, puis 393 × 740 et 873 × 340 avec hauteur réduite. Ce sont des approximations de recette, pas une mesure du navigateur du téléphone réel.
- Autres formats tactiles : 390 × 844, 844 × 390, 667 × 375, 320 × 568 et 568 × 320.
- [Contrôles navigateur](battlefield-mobile-2026-10-11/checks.json) : cinq ennemis et deux alliés dans le compte QA isolé ; consultation de chaque ennemi et du héros sans jouer ; images chargées ; fin de tour accessible ; absence de débordement horizontal de la page.
- Balayage des ennemis avec une attaque sélectionnée sans la jouer ; ciblage du cinquième, dégâts sur lui seul et conservation après rechargement.
- Compilation de production, lint et TypeScript validés. [Recette des cartes sur ce build](battlefield-mobile-2026-10-11/combat-checks.json) : lecture sans jouer, actions accessibles, balayage de main sans jouer et passage de tour réel. Contrôle complémentaire sur ordinateur 1440 × 900.
- Les captures de ce dossier proviennent du build de production local, sans les commandes de développement. Les neuf contrôles détaillés des rencontres chargées ont été effectués avant compilation ; les mêmes scènes ont ensuite été revues visuellement sur ce build.

Les scènes synthétiques servent à vérifier l'interface, pas l'équilibrage. La recette physique Redmi, Android/iPhone, les performances et les interruptions système restent ouvertes dans [TODO.md](TODO.md). Aucune illustration générée, aucun changement d'équilibrage ni annulation de partie dans cette passe.
