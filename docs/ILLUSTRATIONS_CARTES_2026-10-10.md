# Illustrations de toutes les cartes — 10 octobre 2026

Les **275 cartes du catalogue ont chacune leur illustration**, intégrée dans le jeu local. Cette passe couvre les cartes de départ, les neuf univers, les statuts et les 40 cartes du bestiaire. Les variantes améliorées d’une même carte conservent son illustration pour rester reconnaissables.

Ouvrir la [galerie complète](card-art-2026-10-10/galerie.html) dans un navigateur : recherche par nom ou identifiant, filtre par univers, clic pour voir l’image entière, fermeture par Échap.

## Affichage dans le jeu

Les illustrations sont des compositions au format **3:2**, avec le sujet principal proche du centre. La fenêtre d’illustration d’une carte remplit son cadre : selon la taille de carte et l’écran, une partie des bords peut être recadrée. Le texte, le coût et les autres commandes restent dans l’interface, hors de l’image.

- Sur ordinateur, survoler une carte de la main ou lui donner le focus au clavier révèle le bouton **Illustration ↗**.
- Sur téléphone, **Lire**, puis **Illustration ↗**, ouvre la peinture entière.
- Les grandes cartes des autres écrans utilisent le même composant et la même commande.
- L’agrandissement affiche toute la composition, sans découpe, à la taille disponible. Il se ferme par le bouton, la croix ou Échap.
- Ouvrir ou toucher l’illustration ne joue pas la carte. Fermer l’image sur mobile conserve l’aperçu de lecture.
- Si l’image échoue à charger, la gravure vectorielle reste disponible comme secours.

## Couverture et direction artistique

Peinture de fantasy sombre, matières de papier, métal et pierre, contrastes lumineux et palettes propres aux univers. Les images sont produites individuellement avec le **skill imagegen, en mode outil intégré `image_gen`**. Les sources originales sont conservées ; les WebP utilisés par le jeu sont présents dans le dépôt.

| Univers                         | Illustrations |
| ------------------------------- | ------------: |
| Bibliothèque et cartes communes |            71 |
| Sagas nordiques                 |            25 |
| Grèce                           |            25 |
| Égypte                          |            25 |
| Abîmes cosmiques                |            26 |
| Monde aztèque                   |            28 |
| Forêts celtiques                |            25 |
| Contes slaves                   |            25 |
| Traditions africaines           |            25 |
| **Total**                       | **275 / 275** |

La [direction artistique](card-art-2026-10-10/direction.json), le [catalogue](card-art-2026-10-10/catalog.json) et les prompts exacts sont conservés dans [card-art-2026-10-10](card-art-2026-10-10). Chaque fichier `<identifiant>.json` contient le prompt, le chemin source et le mode de génération. Une retouche de `curse_word` retire des lettres flottantes ; son prompt de retouche et les deux sources sont documentés.

## Tailles et chargement

Les 825 fichiers se trouvent dans [public/images/cards/painted-v1](../public/images/cards/painted-v1).

| Usage                     | Fichier           | Dimensions    | Poids moyen |
| ------------------------- | ----------------- | ------------- | ----------: |
| Main et petites cartes    | `<id>-thumb.webp` | 288 × 192     |     13,8 ko |
| Grandes cartes et galerie | `<id>.webp`       | 768 × 512     |     94,0 ko |
| Illustration entière      | `<id>-full.webp`  | 1 536 × 1 024 |    265,1 ko |

Le lot complet occupe environ **102,6 Mo**, toutes tailles confondues. Ce volume n’est pas téléchargé à l’ouverture du jeu : les images sont chargées à mesure de leur affichage et la grande version seulement à l’ouverture de l’agrandissement. Le service worker exclut ce dossier du préchargement et utilise un cache à la demande limité à 180 fichiers, avec une expiration de 30 jours.

La [table d’association générée](../src/lib/card-art.generated.ts) couvre exactement les 275 définitions actives. Le [contrôle des fichiers](card-art-2026-10-10/asset-validation.json) confirme les dimensions, le format WebP, les destinations et l’absence d’images identiques par empreinte SHA-256.

## Vérifications

- 629 tests réussis dans 51 fichiers, dont trois tests du composant d’illustration : secours en cas d’erreur, chargement de la grande version à l’ouverture et maintien de la fenêtre lorsque le survol se termine.
- ESLint réussi.
- Six scénarios dédiés au lecteur d’illustrations réussis : 390 × 844, 320 × 568, 844 × 390, 1280 × 900, main de bureau à la souris et main de bureau au clavier. Les contrôles vérifient notamment les dimensions réelles, l’absence de débordement, Échap et l’absence de jeu accidentel. [Résultats](card-art-2026-10-10/browser-results.json).
- Galerie vérifiée à 1440 × 1000 et 390 × 844 : 275 entrées, recherche, filtre par univers, image entière et Échap. [Résultats](card-art-2026-10-10/gallery-results.json).

Les captures et les contrôles interactifs utilisent Chromium et les composants React réels dans le banc local. Celui-ci remplace les adaptateurs de navigation, d’image Next et de déconnexion ; le combat utilise le véritable reducer. Ces contrôles ne valident pas les transactions distantes, les pages privées avec authentification, ni Safari iOS ou Chrome Android sur appareil réel.

## Maintenance

Après une nouvelle génération ou une retouche acceptée, exécuter :

```powershell
node scripts/prepare-card-art.mjs
node scripts/check-card-art.mjs
node node_modules/tsx/dist/cli.mjs scripts/card-art-gallery.ts
```

La conversion conserve les originaux et régénère les trois tailles lorsqu’un fichier de métadonnées a changé. Elle reconstruit la table d’association et le rapport de couverture. Le jeu déployé utilise uniquement les fichiers du dépôt ; les chemins du cache de génération servent à retrouver et reconvertir les sources sur cette machine.

Les portraits de créatures produits ici illustrent les **cartes du bestiaire**. Depuis la [passe des ennemis et boss](ILLUSTRATIONS_ENNEMIS_BOSS_2026-10-10.md), 40 de ces peintures représentent également les mêmes créatures sur le terrain de combat ; 61 nouvelles illustrations complètent les 101 portraits nécessaires.
