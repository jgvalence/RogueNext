# Bibliothèque et menus — 11 octobre 2026

Cette passe réalise les deux points demandés : refonte de la Bibliothèque/méta-progression et harmonisation des pages du menu. Le suivi actif reste [TODO.md](TODO.md).

## Modifications

- Cadre commun peint, navigation, repère de page active, commandes laiton, langue intégrée, lien d’évitement et focus visible. Réutilisation des illustrations existantes.
- Bibliothèque : compteurs, neuf ressources nommées, choix de rayonnage, peinture propre à chaque biome et progression lisible. Les 45 tomes restent consultables, même verrouillés ; leur état combine symbole et texte.
- Fiche de tome : coût et ressources possédées, liens vers les prérequis, gain effectif après plafonnement, erreur et réessai, verrouillage pendant l’achat et confirmation annoncée. Le tutoriel utilise une fenêtre défilable avec gestion du focus.
- Accueil : commandes harmonisées et « Reprendre l’expédition » lorsqu’une partie existe. Connexion et inscription intégrées au même décor.
- Collection : illustrations miniatures chargées à la demande, ouverture de l’image entière, consultation des cartes et améliorations par bouton sur souris, clavier et tactile. Onglet, filtres et recherche conservés dans l’onglet du navigateur.
- Bestiaire : portraits et états de découverte conservés, nouvelle recherche par nom, filtres persistants et présentation harmonisée.
- Chroniques : détails dépliables avec PV, or, deck groupé et branches d’amélioration ; temps de jeu actif lorsqu’il a été enregistré. Les anciennes parties sans durée affichent « Non enregistré ».
- Classement : présentation commune, filtres nommés et réessai ; statut **non certifié** conservé. Manuel : accès direct aux huit sujets.
- Bandeau PWA refermable avec « Plus tard ». Préférence FR/EN restaurée après le premier rendu pour éviter une divergence entre le HTML serveur et le navigateur ; changement de langue utilisable même si le stockage est bloqué.

Les coûts, bonus et règles d’équilibrage sont conservés. Les préférences d’affichage ne contiennent pas de sauvegarde de partie.

## Vérifications

Base PostgreSQL locale isolée, compte QA dédié. Les scénarios de progression utilisent des données de test ; aucune progression réelle n’a été modifiée.

- Suite complète initiale : **656 tests passés** dans 58 fichiers.
- Après correction de langue : **22 tests ciblés passés**, dont deux nouveaux tests d’hydratation/stockage ; tests PWA et traductions compris.
- Déblocage réel par action serveur : 100 → 89 Pages pour l’Encyclopédie, un seul tome enregistré malgré deux clics, puis rechargement conservant l’achat.
- Coupure réseau : erreur lisible, progression inchangée, réessai réussi et focus rendu au tome.
- Prérequis consultables, ressources insuffisantes sans bouton d’achat, bonus plafonné signalé en progression avancée.
- Tutoriel contrôlé à 390 px et en paysage ; fermeture conservée après rechargement.
- Série finale : [12 scénarios interactifs réussis](menu-2026-10-11/interactions.json), sans exception JavaScript, dont filtres persistants, image entière, améliorations A/B, historique et manuel.
- [Recette clavier et expédition](menu-2026-10-11/smoke.json) : lien d’évitement, focus contenu dans la fenêtre, fermeture Échap, préférence de mouvement réduit émulée, création d’une partie et reprise du même identifiant depuis l’accueil. Aucune exception JavaScript.
- Build de production final : **code de sortie 0**, compilation, ESLint et vérification des types compris. Une première tentative a été interrompue par le disque local plein ; seul le cache de compilation a été supprimé avant relance.

Les captures et relevés navigateur de cette passe sont conservés dans [menu-2026-10-11](menu-2026-10-11/). Ce sont des captures **après modification**, pas une série comparative avant/après.

| Page | Bureau | Mobile |
| --- | --- | --- |
| Accueil | [1440 px](menu-2026-10-11/home-1440.webp) | [390 px](menu-2026-10-11/home-390.webp) |
| Bibliothèque | [1440 px](menu-2026-10-11/library-1440.webp) | [390 px](menu-2026-10-11/library-390.webp) |
| Collection | [1440 px](menu-2026-10-11/library-collection-1440.webp) | [390 px](menu-2026-10-11/library-collection-390.webp) |
| Bestiaire | [1440 px](menu-2026-10-11/library-bestiary-1440.webp) | [390 px](menu-2026-10-11/library-bestiary-390.webp) |
| Chroniques | [1440 px](menu-2026-10-11/runs-1440.webp) | [Détail 390 px](menu-2026-10-11/historique-details-390.webp) |
| Classement | [1440 px](menu-2026-10-11/leaderboard-1440.webp) | [390 px](menu-2026-10-11/leaderboard-390.webp) |
| Manuel | [1440 px](menu-2026-10-11/rules-1440.webp) | [390 px](menu-2026-10-11/rules-390.webp) |
| Connexion | [1440 px](menu-2026-10-11/auth-signin-1440.webp) | [390 px](menu-2026-10-11/auth-signin-390.webp) |
| Inscription | [1440 px](menu-2026-10-11/auth-signup-1440.webp) | [390 px](menu-2026-10-11/auth-signup-390.webp) |

Les [28 contrôles de routes](menu-2026-10-11/routes.json) et [12 contrôles des pages publiques/authentification](menu-2026-10-11/auth.json) couvrent 1440, 390, 320 et 844 × 390 px, avec anglais à 320 px. Aucun débordement horizontal de document ni exception JavaScript n’a été relevé sur cette série ; images chargées et clés de traduction affichées brutes sont également contrôlées pour les sept routes principales. Les listes/tableaux qui le nécessitent gardent leur défilement interne.

Le formulaire de connexion a été essayé au clavier avec un mot de passe incorrect puis correct ; l’erreur et le retour à la Bibliothèque sont vérifiés. Le chargement du tutoriel de première visite est différé jusqu’au montage du navigateur pour éviter une divergence de portail au premier affichage.

La fermeture du tutoriel attend désormais l’enregistrement serveur ; une erreur laisse un réessai possible. L’aperçu des améliorations utilise le grand format des cartes et défile verticalement sur téléphone : [capture 390 px](menu-2026-10-11/collection-ameliorations-390.webp).

## Limites

L’émulation Chromium ne remplace pas des sessions sur Android et iPhone physiques. La fluidité, la mémoire, les interruptions et les gestes sur appareils modestes restent dans QA-01/PERF-01. Cette passe ne produit pas de nouvelles mesures d’équilibrage humain.
