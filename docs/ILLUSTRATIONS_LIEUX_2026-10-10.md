# Lieux, carte et événements — 10 octobre 2026

45 illustrations sont intégrées : carte d’expédition, marchand, repos, atelier et 41 scènes couvrant les 50 événements. Les dix rencontres du Scribe effacé partagent son illustration pour conserver l’identité du personnage.

## Consulter les visuels

- [Galerie des 45 illustrations](rooms-balance-2026-10-10/gallery.html), avec ouverture en grand.
- [Carte sur mobile](rooms-balance-2026-10-10/map-390.png).
- [Marchand sur ordinateur](rooms-balance-2026-10-10/shop-1440.png).
- [Événement sur mobile](rooms-balance-2026-10-10/event-ink_fountain-390.png).

## Intégration

La carte utilise un atlas peint derrière le trajet ; les choix de salles présentent les lieux ou les ennemis à venir. Le marchand possède sa scène et son portrait dans l’étal. Le repos, l’atelier et chaque événement affichent une illustration centrale et un fond assombri pour garder le texte lisible. L’illustration accompagne également le résultat du choix d’événement.

Les fichiers sont dans `public/images/rooms/painted-v1/`. Chaque scène existe en WebP, au ratio 3:2 :

| Usage | Dimensions |
|---|---|
| Illustration mobile | 480 × 320 |
| Illustration courante / fond mobile | 960 × 640 |
| Fond large / fichier complet | 1536 × 1024 |

Certaines surfaces recadrent l’image au centre pour s’adapter à l’écran. Les fichiers complets restent accessibles dans la galerie. Un décor de secours apparaît si une image ne charge pas. Les 135 fichiers représentent environ 17,4 Mio ; ils sont mis en cache au fil de la consultation, sans être tous téléchargés à l’installation de la PWA.

## Production et traçabilité

Génération effectuée avec le mode intégré `image_gen`, à partir des textes réels des événements. Direction artistique : peinture à l’huile et gouache, bleu encre, laiton ancien, lumière ambre, scènes de bibliothèque fantastique.

La [direction artistique](rooms-balance-2026-10-10/art-direction.json) conserve les consignes communes. Chaque fichier `<scene>.json` du même dossier contient le prompt final, le mode utilisé et le chemin de son PNG source. Les [textes des 50 événements](rooms-balance-2026-10-10/events.json) et la [correspondance avec leurs images](rooms-balance-2026-10-10/asset-check.json) sont conservés.

Après la demande de recentrage sur l’équilibrage, aucune nouvelle série d’images n’a été lancée ; cette intégration utilise la série déjà produite.

## Vérifications

- 135 WebP présents, dimensions vérifiées, couverture des 50 événements.
- 70 scénarios dans Edge : carte, marchand, repos, atelier et événement à 1440, 390, 320 et 844 pixels de largeur ; puis les 50 événements sur mobile.
- Aucun débordement horizontal de la page ni erreur JavaScript dans ces scénarios. Le graphe de la carte conserve son défilement horizontal interne sur petit écran.
- Images chargées et décor de secours testé : [résultats navigateur](rooms-balance-2026-10-10/browser-results.json).
- Compilation de production réussie ; exclusion des illustrations du préchargement PWA vérifiée.

Ces contrôles utilisent les vrais composants dans un aperçu local. Ils ne constituent pas un parcours complet avec authentification et sauvegarde serveur.

Reproduction : `node scripts/prepare-room-art.mjs`, puis `node scripts/check-room-art.mjs`. Le premier script nécessite les PNG sources indiqués dans les métadonnées ; les WebP intégrés au jeu sont déjà présents.
