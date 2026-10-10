# Illustrations des ennemis et des boss

Les **101 définitions actives d’ennemis**, dont **18 boss**, disposent désormais d’un portrait peint en combat. La passe couvre aussi les élites et les cibles secondaires des boss : têtes de l’Hydre, objets, invocations et autres entités ciblables.

La [galerie complète](enemy-art-2026-10-10/galerie.html) permet de rechercher une créature, filtrer les boss ou un univers et ouvrir chaque illustration entière. Elle fonctionne localement dans un navigateur depuis le dépôt.

## Direction artistique et couverture

**61 illustrations nouvelles** complètent les **40 peintures des cartes du bestiaire** réutilisées pour représenter les mêmes créatures. Chaque définition possède une image distincte ; le partage avec les cartes conserve leur identité visuelle sans dupliquer les fichiers.

Les portraits reprennent les textures peintes, les éclairages et les palettes des neuf univers. Les boss ont une silhouette dominante et un traitement plus imposant. Les noms, intentions, points de vie et statuts restent rendus par l’interface. La tête centrale de l’Hydre a été retouchée pour présenter une seule tête et se distinguer du boss complet.

Les nouvelles peintures ont été générées avec l’outil intégré **image_gen**, puis examinées individuellement ou sur planches de contrôle. La [direction artistique](enemy-art-2026-10-10/direction.json), les [sujets](enemy-art-2026-10-10/subjects.json) et les fichiers de métadonnées par identifiant conservent les prompts exacts, le mode de génération et les chemins des PNG originaux. Exemple : [Fenrir](enemy-art-2026-10-10/fenrir.json). Les originaux sont conservés dans le cache local de génération ; le jeu utilise les WebP présents dans le dépôt.

## Intégration et formats

Les portraits sont raccordés aux vues de combat sur ordinateur et mobile, aux fiches d’ennemis et au bestiaire. Le cadrage centré remplit les emplacements ; la galerie affiche la composition complète. Sur les écrans compacts, les résumés des ennemis utilisent une peinture atténuée pour préserver la lecture des intentions. Une erreur de chargement déclenche l’ancienne illustration SVG.

| Usage | Dimensions | Fichier |
| --- | --- | --- |
| Portrait mobile et résumé compact | 288 × 192 | `<id>-thumb.webp` |
| Combat sur ordinateur et galerie | 768 × 512 | `<id>.webp` |
| Illustration entière dans la galerie | 1 536 × 1 024 | `<id>-full.webp` |

Les [183 nouveaux fichiers](../public/images/enemies/painted-v1) représentent **24,3 Mo** au total, toutes tailles confondues. Les images sont chargées lors de leur affichage ; les versions entières de la galerie ne sont demandées qu’à leur ouverture. Le service worker exclut les peintures du préchargement et conserve à la demande au maximum 120 fichiers du nouveau lot pendant 30 jours. Les images partagées avec les cartes conservent leur cache existant.

La [table d’association](../src/lib/enemy-art.generated.ts) couvre exactement les définitions actives. Le [contrôle des fichiers](enemy-art-2026-10-10/asset-validation.json) vérifie les 303 variantes utilisées, leurs dimensions, le format WebP, l’existence des SVG de secours et 101 empreintes de portraits distinctes. Le [rapport de couverture](enemy-art-2026-10-10/coverage.json) ne signale aucun manque.

## Vérifications

- 631 tests réussis dans 52 fichiers, dont les contrôles du composant de portrait et du choix des ressources.
- ESLint, typage TypeScript et compilation de production réussis.
- Contrôles de combat dans Chromium : les 18 boss sur ordinateur et téléphone, puis Fenrir et l’Hydre sur petit écran et en paysage. Vérification du chargement des peintures, de l’absence de débordement horizontal et du retour au SVG. [Résultats et dimensions](enemy-art-2026-10-10/browser-results.json).
- Galerie contrôlée sur ordinateur et téléphone : 101 entrées, filtre de 18 boss, recherche, filtre par univers, grande image et fermeture par Échap. [Résultats](enemy-art-2026-10-10/gallery-results.json).
- Les 11 contrôles interactifs existants sont rejoués : lecture des cartes, défilement tactile, pouvoirs, ciblage d’une attaque, mouvement réduit et visibilité des points de vie. [Résultats](visual-2026-10-09/interaction-results.json).
- Le service worker compilé confirme l’exclusion des peintures du préchargement et le cache des ennemis. [Résultats](enemy-art-2026-10-10/pwa-results.json).

Les contrôles visuels utilisent les composants React et le reducer du jeu dans le banc local, avec des adaptateurs de navigation, d’image Next et de déconnexion. Ils ne couvrent pas les pages privées avec authentification ni Safari iOS ou Chrome Android sur appareil réel. La fluidité et la consommation mémoire sur téléphone modeste restent à mesurer.

## Maintenance

Après une nouvelle génération ou une retouche acceptée :

```powershell
node node_modules/tsx/dist/cli.mjs scripts/enemy-art-catalog.ts
node scripts/prepare-enemy-art.mjs
node node_modules/tsx/dist/cli.mjs scripts/check-enemy-art.ts
node node_modules/tsx/dist/cli.mjs scripts/enemy-art-gallery.ts
```

La conversion reconstruit les trois tailles lorsque les métadonnées changent, ainsi que les associations et le rapport de couverture. Les fichiers de contrôle du navigateur se trouvent dans le même dossier que la galerie. Le banc de combat accepte désormais `enemyIds` pour sélectionner explicitement les adversaires.
