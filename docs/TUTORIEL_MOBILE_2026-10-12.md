# Tutoriel mobile — 12 octobre 2026

Retour reçu : une nouvelle joueuse ne comprend pas le tutoriel sur mobile, sans étape de blocage identifiée. La passe reprend donc tout le premier combat. Elle ne modifie ni les coûts, ni les cartes, ni l’équilibrage.

## Corrections

- Sept étapes au lieu de neuf, textes FR/EN plus courts : objectif du combat, cartes et énergie, dégâts annoncés et armure, Encre, utilisation d’un pouvoir, utilisation d’une carte encrée, fin du tour.
- Instructions tactiles explicites : lire sans jouer, sélectionner puis viser un ennemi, confirmer les cartes sans cible, faire défiler la main.
- Le guide cite le pouvoir et la carte réellement disponibles. « Ouvrir les pouvoirs » ouvre le panneau ; « Montrer la carte » la retrouve dans la main ; la dernière action termine réellement le tour.
- Le guide dispose de sa place dans la composition. En paysage, il occupe une colonne à gauche ; en portrait, il précède le champ de bataille. Les petits écrans peuvent défiler verticalement. Corps de texte de 14 px minimum et boutons de 44 px minimum ; marge réservée à la barre de défilement.
- Reprise corrigée : après un rechargement, un pouvoir ou une carte encrée déjà utilisé ne doit plus être rejoué. Le guide reste fermé après le premier tour. Cela évite notamment de demander un pouvoir déjà dépensé et indisponible.
- Les indications avant le combat utilisent le libellé réel « Archiviste » et le parcours de lancement. Quitter l’aide reste possible.

## Validation

- TypeScript et ESLint : réussis.
- Huit tests ciblés : cinq tests d’interface/reprise et trois tests du premier combat dans le moteur, tous réussis. La suite complète n’a pas été relancée pour cette passe ; ses résultats précédents restent dans le rapport autonome.
- Recette locale : 28 contrôles de présentation, soit sept étapes en 393 × 873, 873 × 393, 873 × 340 et 320 × 568. Pouvoir, carte encrée et fin du tour exécutés par interactions tactiles. Trois rechargements avec lecture de la sauvegarde serveur réussis, sans exception JavaScript. Le scénario local utilise un compte de test isolé et un premier combat préparé par le reducer réel.
- Les contrôles vérifient le débordement horizontal, la taille du texte et des boutons, la présence du guide à l’écran et son absence de chevauchement avec la main. Ils ne prouvent pas la compréhension des explications.
- Compilation de production locale et déploiement Vercel réussis. La version publiée `3c10a91` inclut les correctifs `a67da06` et `1465131`.
- Recette publique avec un compte neuf, inscription et préparation de l’expédition par l’interface : les 28 contrôles et les trois rechargements passent également. Les captures et mesures liées ci-dessous proviennent de ce parcours public. Le compte QA est supprimé après validation.
- PWA : nouvelle empreinte du service worker, version serveur attendue, en-tête `no-store` et aucune erreur d’installabilité Chromium. [Preuve de publication et PWA](tutorial-mobile-2026-10-12/live-pwa.json). La notification de mise à jour est volontairement masquée pendant le combat ; cela évite d’interrompre une expédition.

Preuves : [mesures et actions](tutorial-mobile-2026-10-12/checks.json), [portrait](tutorial-mobile-2026-10-12/inkedCard-393x873.png), [paysage](tutorial-mobile-2026-10-12/inkedCard-873x393.png). Le [script de recette](tutorial-mobile-2026-10-12/verify.mjs) se lance depuis la racine avec un navigateur CDP sur le port 9224, connecté à un compte de test au tout début du premier combat. Il joue ce tour et modifie uniquement la partie de ce compte.

## Ce qui reste humain

Faire reprendre le parcours par une personne découvrant le jeu, sans explication orale, notamment sur le Redmi Note 11 Pro 5G physique. Observer si elle sait lire une carte, anticiper les dégâts, utiliser l’Encre et terminer son tour. QA-01, QA-02 et TXT-01 restent ouverts : une recette automatisée ne remplace pas cette observation.
