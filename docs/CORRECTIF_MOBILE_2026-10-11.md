# Lisibilité mobile et récompenses — 11 octobre 2026

Suite aux trois captures envoyées depuis un téléphone en paysage, cette passe corrige le combat et le choix des cartes. Elle complète la refonte des menus, dont la recette ne couvrait pas suffisamment ces écrans en faible hauteur.

## Corrections

- Main tactile : cartes de 168 à 180 px de large, effets visibles à 13 px, boutons de lecture et d’Encre de 44 px, défilement horizontal sans chevauchement. Les descriptions longues restent consultables intégralement dans « Lire ».
- Paysage : ennemis et résumé du joueur côte à côte, pour conserver la place des cartes et de la fin de tour. Sur les écrans de moins de 360 px de haut, le combat peut défiler verticalement plutôt que couper les commandes.
- Lecture : véritable fenêtre avec gestion du focus, corps défilant et actions persistantes. Sur téléphone en paysage, illustration et effets se placent côte à côte. Les effets intègrent le bonus d’attaque affiché par le combat.
- Récompenses : cartes de lecture à hauteur naturelle, texte à 14 px, aucun défilement interne ni effet masqué par une hauteur fixe. Résumé de victoire compact, choix disposés en lignes adaptées à la largeur, actions de relance et de passage persistantes.
- Confirmation identique au toucher, à la souris et au clavier : une seule action « Choisir cette carte ». Les aperçus A/B sont retirés des récompenses. **Le moteur ajoutait déjà une carte non améliorée** : la fenêtre générique affichait deux branches dont le paramètre était ignoré. Il n’y a pas de réduction de puissance des récompenses.
- Améliorations réelles : consultation de la carte actuelle puis de chaque branche A/B à taille lisible ; seule une branche améliorée peut être validée.
- Illustrations : bouton d’agrandissement compact avec libellé accessible ; visionneuse au-dessus des fenêtres de carte.

## Validation

- Suite complète : **662 tests, 60 fichiers, tous réussis**. Quatre nouveaux cas vérifient la confirmation de base, le retour sans sélection, les vraies branches d’amélioration et l’ajout non amélioré par le réducteur.
- Compilation de production réussie, avec vérification TypeScript et lint. Les parcours de combat et de récompense ont également été rejoués sur ce build.
- Le contrôle global `antd:first:check` signale encore des écarts déjà présents dans le dépôt. Comparaison des 125 fichiers JSX/TSX suivis avec la révision précédente : aucune primitive native ajoutée. Les nouveaux boutons de cette passe utilisent les composants Rogue/AntD ; la dette du contrôle global n’est pas masquée par une mise à jour de sa référence.
- Combat tactile : 844 × 390, 667 × 375, 390 × 844, 320 × 568 et 568 × 320 ; contrôle complémentaire ordinateur 1440 × 900. Lecture sans jouer, accès aux commandes, rotation, défilement de main sans jouer par accident et passage de tour.
- Parcours réel local : préparation, carte du monde, combat joué via les commandes du jeu, récompense, sélection et conservation de la carte de base après rechargement.
- Récompenses : quatre formats, absence de défilement interne, retour sans perdre le choix et confirmation unique. Ouverture puis fermeture de l’illustration au-dessus de la confirmation.
- Ennemis nombreux : scène de cinq ennemis sur le seul compte QA de la base isolée ; ciblage du cinquième, dégâts sur lui seul. Cette scène synthétique ne constitue pas une mesure d’équilibrage.
- Preuves : [récompenses](mobile-2026-10-11/reward-checks.json), [combat](mobile-2026-10-11/combat-checks.json), [ciblage multiple](mobile-2026-10-11/multi-target.json). Les captures finales proviennent du build de production local ; seules les deux captures `multi` de la scène synthétique proviennent du serveur de développement.

## Limites conservées

Les essais utilisent Chromium avec émulation tactile. La recette physique Android et iPhone/Safari, l’installation iOS et les performances sur téléphone modeste restent ouvertes dans [TODO.md](TODO.md). Les descriptions de main sont volontairement résumées à quelques lignes ; « Lire » donne accès au texte complet. Aucun équilibrage, aucune annulation de partie et aucun changement des règles de sauvegarde dans cette passe.
