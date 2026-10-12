# Animations de combat — 12 octobre 2026

Cette passe rend les actions reconnaissables sur le champ de bataille, sur ordinateur et mobile.

## Changements

- Attaque : slash lumineux, impact et liaison entre source et cible. Les frappes multiples produisent plusieurs impacts ; les attaques de zone touchent visuellement chaque cible visible.
- Poison : gouttes et bulles vertes. Application des charges et dégâts de fin de tour portent des libellés distincts.
- Saignement : entailles et goutte rouge, avec dégâts périodiques séparés du poison.
- Armure : bouclier bleu ; soin : croix verte ; pioche : cartes ; amélioration : étoile ; renfort/affaiblissement : chevrons ; compétence et encre : runes.
- Les indications affichent les quantités réellement résolues, y compris les dégâts absorbés et les soins plafonnés. Un effet spécifique remplace la rune générique de compétence sur la même cible.
- Sons distincts, soumis aux réglages existants. Suppression des anciens déclenchements audio et chiffres de dégâts en double sur mobile.
- Durée de référence de 720 ms et décalage de 100 ms entre effets sur une même cible, adaptés à la vitesse de combat. Les effets restent non interactifs et fonctionnent en plein écran.
- Le mode de réduction des mouvements conserve les pictogrammes et libellés statiques, sans trajectoire animée. La fin du combat attend le dernier effet avant les récompenses ou la défaite.

## Fiabilité

Le moteur produit un journal de présentation borné à 64 événements, sans tirage aléatoire supplémentaire. Les anciennes sauvegardes sans ce champ restent compatibles ; ouvrir une sauvegarde ne rejoue pas ses effets passés. Les temporisateurs sont nettoyés au démontage.

La résolution de fin de tour est commune au mode animé et au simulateur. Les valeurs de cartes, dégâts, ennemis et difficultés ne sont pas modifiées par cette passe ; la version des règles reste `2026-10-12.2`.

## Validation

- Suite complète : **703 tests réussis dans 67 fichiers**.
- Vérification complémentaire après les ajustements plein écran/force : **17 tests réussis dans 4 fichiers**.
- TypeScript et ESLint : réussis. Compilation de production réussie, code de sortie 0, 15 pages statiques générées et service worker produit.
- Recette navigateur : voir [les contrôles et captures](animations-combat-2026-10-12/checks.json). Formats 393 × 873, 873 × 393 et 1440 × 900 ; doubles frappes, poison appliqué, armure en mouvement réduit, soin, attaque de zone et poison en fin de tour.
- La recette utilise une partie locale réservée au test, avec davantage de PV ennemis et d’énergie pour enchaîner les effets. Elle ne constitue pas une mesure d’équilibrage.

## Suite du suivi

VIS-03 reste ouvert pour apprécier le confort, les volumes et les performances sur appareils physiques, notamment le Redmi Note 11 Pro 5G. Cette passe ne clôture pas les autres éléments de dette technique du point 12, ni toute l’harmonisation des icônes et transitions des menus.
