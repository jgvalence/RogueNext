# Passe graphique — interface, illustrations, décors et mobile

**Complément du 10 octobre :** les 275 cartes disposent maintenant d’une illustration individuelle et d’une vue agrandie. Voir la [passe complète des illustrations](ILLUSTRATIONS_CARTES_2026-10-10.md). Le compte rendu ci-dessous conserve l’état de la première passe du 9 octobre.

La passe est intégrée dans le projet local. Elle porte sur l’accueil, le prologue, la préparation d’expédition, les cartes, le marchand et le combat. Elle ne modifie pas les règles d’équilibrage et ne constitue pas un déploiement.

## Changements visibles

| Domaine | Changements |
| --- | --- |
| Accueil et prologue | Illustration du Panlibrarium, architecture de bibliothèque, lumière dorée et Encre bleutée ; sous-titre visible ; titre adapté aux petits écrans ; liens accessibles au clavier. |
| Décors | Neuf scènes illustrées : bibliothèque, fjord nordique, sanctuaire grec, temple égyptien, ruines cosmiques, temple mésoaméricain, forêt celtique, hiver slave et sanctuaire de savane. |
| Cartes | Les 17 fichiers d’illustrations existants restent disponibles. Les cartes sans illustration dédiée reçoivent une gravure calculée selon leurs effets, leur biome et leur identifiant. Douze motifs : lame, bouclier, livre, plume, fiole, sang, flamme, œil, sablier, tambour, fils et couronne. |
| Personnages et alliés | Quatre variantes de portraits vectoriels pour les personnages. Les alliés reçoivent des silhouettes de lecteur, gardien ou familier, à la place de l’étoile générique. Les variantes sont partagées entre plusieurs alliés ; il ne s’agit pas de huit illustrations originales indépendantes. |
| Interface | Typographie de titres inspirée du livre, cadres moins arrondis, fonds de lecture plus sombres, mise en valeur des illustrations, adaptation spécifique aux ordinateurs de faible hauteur. |
| Marchand | Portrait vectoriel, présentation compacte sur téléphone, grandes cartes lisibles et défilables. Un bouton « Acheter » distinct sépare la lecture de l’achat et conserve les états vendu ou trop cher. |
| Clavier | Focus visible sur les liens d’accueil ; cartes de la main mobile activables au clavier ; infobulles accessibles au focus ; fermeture de l’aperçu par Échap. |

Les gravures des cartes constituent un vocabulaire partagé, pas 275 illustrations uniques. Les sprites d’ennemis et de boss existants sont conservés. Leur remplacement complet par des peintures assorties aux décors dépasse cette passe.

## Mobile

### Complément : dessin des cartes et commandes

La seconde passe traite les composants eux-mêmes : cartes à cadre de métal vieilli et tranche de reliure, coût dans un médaillon, règles sur parchemin, encart d’Encre séparé. Les badges des grandes cartes sont regroupés sous le titre pour lui laisser davantage de place. La sélection, les couleurs de type, les symboles de rareté et les états de combat restent présents.

Les composants partagés `RogueButton`, `RogueCard` et `RogueModal` portent désormais le même style : action principale dorée, action secondaire sombre, danger bordeaux, état désactivé distinct, cadres et titres de fenêtres assortis. La commande de fin de tour et les piles du combat sont harmonisées. Le fonctionnement des commandes et les règles du jeu restent identiques.

Captures : [cartes et boutons](visual-2026-10-09/interface-desktop.png), [interface sur téléphone](visual-2026-10-09/interface-mobile.png), [fenêtre mobile](visual-2026-10-09/interface-modal-mobile.png). Le banc visuel dispose d’un écran `screen=interface` pour examiner les états normal, principal, dangereux, désactivé et chargement.

Cette passe ne crée pas de nouvelles peintures individuelles pour les cartes : les illustrations existantes et les douze gravures partagées sont toujours utilisées. La refonte du cadre est distincte de la production d’une illustration originale par carte.

Validation de ce complément : les trois tests existants de `GameCard` et `ShopView`, TypeScript, ESLint et le build de production passent. Les 25 scénarios visuels et les 11 contrôles interactifs ont été rejoués ; deux vues supplémentaires vérifient les composants, le focus, l’état désactivé et l’ouverture/fermeture de fenêtre. Voir [les résultats des composants](visual-2026-10-09/interface-results.json) et [le journal du build](visual-2026-10-09/interface-build.txt).

### Adaptations de la première passe

Le blocage imposant de tourner l’appareil est retiré de l’accueil, de la bibliothèque et de la partie. Le combat dispose maintenant d’une présentation en portrait : portraits ennemis sur deux colonnes, état du joueur prioritaire, alliés compacts et main parcourable horizontalement.

- Sur les écrans courts, le résumé des ennemis remplace leurs grands portraits. Les deux présentations ne s’empilent plus inutilement.
- La main utilise le défilement tactile horizontal. Un glissement ne joue pas de carte.
- Le bouton **Lire** ouvre un aperçu avec description défilable, fermeture explicite et fermeture par Échap. L’appui long reste disponible.
- Le bouton **Encre / Pouvoirs** ouvre un panneau lisible affichant le nom, le coût et la description des pouvoirs, y compris ceux qui sont momentanément indisponibles.
- Le mode paysage conserve une main compacte sans chevauchement entre ses cartes.
- Les commandes importantes et les PV restent accessibles dans les scénarios contrôlés en 320 × 568 et 667 × 375.

Les libellés longs peuvent être abrégés dans les résumés compacts. Le détail reste accessible par toucher ; cette passe ne prétend pas afficher toutes les descriptions simultanément dans 375 pixels de hauteur. Les illustrations, commandes et fenêtres respectent le mode de mouvement réduit déjà présent dans le projet.

## Illustrations et poids

Les neuf scènes ont été produites avec le **skill imagegen et l’outil intégré `image_gen`**, puis converties en WebP. Les [prompts exacts et destinations](visual-2026-10-09/image-prompts.json) sont conservés. Les fichiers utilisés par le jeu se trouvent dans [public/images/scenes](../public/images/scenes).

- Versions de bureau : 1 600 × 900, environ 136 à 259 ko par décor.
- Versions mobiles : 800 × 450, environ 41 à 82 ko par décor.
- Le combat sélectionne la version mobile via `<picture>` sous 1 024 pixels de largeur.
- Un échec de chargement du décor peint déclenche le retour à l’ancien SVG du biome.
- Les portraits et gravures sont du SVG natif, sans nouvelle requête d’image par carte.
- Aucune police distante ou bibliothèque graphique supplémentaire n’est ajoutée.

Les neuf scènes ne sont pas toutes téléchargées pour afficher un combat. Les images finales sont dans le dépôt ; le jeu ne dépend pas du répertoire de génération de Codex.

## Captures

| Écran | Aperçu |
| --- | --- |
| Accueil | [Bureau](visual-2026-10-09/home-desktop.png) · [Téléphone](visual-2026-10-09/home-mobile.png) |
| Préparation | [Bureau](visual-2026-10-09/setup-desktop.png) · [Téléphone](visual-2026-10-09/setup-mobile.png) |
| Combat chargé | [Bureau](visual-2026-10-09/combat-desktop.png) · [Portrait](visual-2026-10-09/combat-portrait.png) · [Paysage court](visual-2026-10-09/combat-short.png) |
| Petit écran | [320 × 568](visual-2026-10-09/combat-small.png) · [1024 × 600](visual-2026-10-09/combat-compact-desktop.png) |
| Lecture et pouvoirs | [Carte](visual-2026-10-09/card-reading-mobile.png) · [Pouvoirs d’Encre](visual-2026-10-09/ink-powers-mobile.png) |
| Marchand | [Bureau](visual-2026-10-09/shop-desktop.png) · [Téléphone](visual-2026-10-09/shop-mobile.png) |
| Gravures | [Galerie de cartes](visual-2026-10-09/cards.png) |
| Décors | [Égypte](visual-2026-10-09/egyptian.png) · [Grèce](visual-2026-10-09/greek.png) · [Forêt celtique](visual-2026-10-09/celtic.png) · [Ruines cosmiques](visual-2026-10-09/lovecraftian.png) |

Les captures proviennent d’un navigateur Chromium avec les composants React du projet. Le banc d’essai local remplace uniquement les adaptateurs de navigation, d’image Next et de déconnexion, afin de ne pas dépendre d’un compte ni d’une base distante. Le combat interactif utilise le véritable reducer du jeu. Les transactions du marchand et la navigation vers les autres pages ne sont pas validées par ce banc visuel.

## Vérifications

- **626 tests réussis dans 50 fichiers.**
- Typage TypeScript, ESLint et build de production vérifiés séparément. Le typage est exécuté après le build : les deux commandes utilisent les types générés dans `.next` et ne doivent pas se chevaucher.
- **25 scénarios de navigateur**, incluant portrait, paysage, tablette, bureau, ordinateurs de faible hauteur et les neuf décors. Les [mesures](visual-2026-10-09/browser-results.json) consignent les débordements horizontaux, images et erreurs de rendu.
- **11 contrôles interactifs réussis** : lecture sans jouer, fermeture par bouton, fermeture par Échap, défilement de grande main, glissement tactile sans jouer, panneau d’Encre, ciblage et jeu d’une attaque, mouvement réduit, PV sur petit portrait, PV sur petit paysage et décor de secours. Voir les [résultats](visual-2026-10-09/interaction-results.json).
- L’accueil a également été servi par **Next.js en mode production** et contrôlé à 390 × 844 : illustration optimisée, styles, largeur et absence d’exception de rendu. Voir la [capture de production](visual-2026-10-09/home-production-mobile.png) et ses [résultats](visual-2026-10-09/production-results.json). Ce contrôle est effectué sans connexion utilisateur, avec le seul hôte local explicitement approuvé dans l’environnement du processus d’essai ; il ne valide pas l’authentification ni les pages privées.
- Le contrôle AntD-first reste en échec sur les mêmes dix couples fichier/balise déjà signalés dans la passe précédente. Les nouvelles commandes de cette passe emploient les composants `Rogue*` ; la baseline n’a pas été modifiée pour masquer cette dette.

Les journaux sont conservés dans [visual-2026-10-09](visual-2026-10-09). Pour reproduire le banc local :

```powershell
node node_modules/tailwindcss/lib/cli.js -i src/app/globals.css -o docs/visual-2026-10-09/preview.css --minify
node docs/visual-2026-10-09/serve-preview.mjs
```

La page de contrôle est alors disponible sur `http://127.0.0.1:4318/`. Les paramètres `screen=home`, `screen=setup`, `screen=intro`, `screen=shop` et `screen=cards` permettent de changer d’écran. Le combat accepte `biome`, `enemies`, `allies`, `hand` et `character`. Les scripts de capture utilisent un navigateur local exposant son protocole de débogage sur le port 9223 ; ce serveur ne doit pas être exposé publiquement.

## À confirmer sur appareils réels

1. Vérifier Safari iOS et Chrome Android : barres du navigateur, zones sûres, clavier, appui long et défilement imbriqué.
2. Mesurer mémoire, chargement et fluidité sur un téléphone modeste, notamment avec une main longue et plusieurs invocations.
3. **Terminé le 10 octobre :** les 101 ennemis et entités ciblables, dont 18 boss, disposent de portraits peints intégrés au combat. Voir la [passe des ennemis et boss](ILLUSTRATIONS_ENNEMIS_BOSS_2026-10-10.md).
4. **Terminé le 10 octobre :** les 275 cartes disposent d’illustrations individuelles, avec affichage intégral sur demande. Les noms, symboles et règles restent dans l’interface. Voir la [passe des illustrations](ILLUSTRATIONS_CARTES_2026-10-10.md).
5. Effectuer un contrôle d’accessibilité complet : contrastes mesurés, parcours au lecteur d’écran et gestion du focus de toutes les fenêtres du jeu. Les contrôles de cette passe ne constituent pas une certification d’accessibilité.
