# État du jeu — actualisé le 12 octobre 2026

## État actuel et priorités

Le [premier étage en D0](d0-opening-2026-10-12/RESULTATS.md) bénéficie d’une baisse très légère du coefficient de dégâts ennemis (0,65 → 0,63), sans modifier les PV, D1–D5 ni les étages suivants. Les comparaisons sans méta mesurent environ un PV supplémentaire après le premier boss ; elles ne démontrent pas une hausse du taux de victoire final. Version des règles des nouvelles parties : `2026-10-12.1`.

Le [tutoriel mobile du 12 octobre](TUTORIEL_MOBILE_2026-10-12.md) a été simplifié après un retour de compréhension : sept étapes, gestes tactiles explicites, commandes directes et reprise sans redemander les actions déjà accomplies. Huit tests ciblés et 28 contrôles mobiles passent ; la compréhension par une nouvelle personne reste à retester sur téléphone physique.

La [passe autonome du 12 octobre](PASSE_AUTONOME_2026-10-12.md) complète les marchands/événements, la persistance, les cas mobiles encombrés, l’accessibilité, le chargement PWA/audio et les contrats de contenu. **685 tests passent**. Les 108 parcours couvrent les quatre personnages et neuf biomes ; 2 040 simulations de confirmation et 90 vérifications supplémentaires documentent l’équilibre. Tous les builds testés gagnent en D0–D2, y compris les séries sans cartes offensives Armure/Épines. Griot Rythme reste irrégulier en D5 : 0/20 puis 5/60 nouvelles graines ; le rejeu historique retrouve 4/30. [Mesures complètes](validation-2026-10-12/RESULTATS.md).

La [passe visuelle du combat mobile](PASSE_COMBAT_MOBILE_2026-10-11.md) ajoute la présence du héros, stabilise les portraits ennemis et regroupe leurs intentions. Neuf formats tactiles émulés couvrent notamment des proportions proches du Redmi Note 11 Pro 5G du joueur ; la validation physique reste ouverte.

Le [correctif mobile du 11 octobre](CORRECTIF_MOBILE_2026-10-11.md) complète la refonte : effets de la main visibles, lecture sans texte tronqué, combat adapté au paysage et confirmation des récompenses sans faux choix d’amélioration A/B. Le moteur donnait déjà la carte de base. Les essais tactiles émulés ne remplacent pas la recette sur appareils physiques.

La liste active est [TODO.md](TODO.md). La [passe finale du 10 octobre](PASSE_FINALE_EQUILIBRAGE_ET_RECETTE_2026-10-10.md) remplace les anciens chiffres d’équilibrage ci-dessous : 3 540 simulations finales, des victoires observées pour les 13 orientations D0–D5, et des parcours navigateur complets avec contrôles de persistance. Cela ne prouve pas des taux de victoire humains ni une validation sur téléphone physique.

Les peintures des [cartes](ILLUSTRATIONS_CARTES_2026-10-10.md), [ennemis/boss](ILLUSTRATIONS_ENNEMIS_BOSS_2026-10-10.md) et [lieux/événements](ILLUSTRATIONS_LIEUX_2026-10-10.md) sont intégrées et publiées. L’historique, les tutoriels et les vitesses de combat existent déjà.

Le jeu a été publié sur GitHub/Vercel, avec installation et mise à jour PWA vérifiées dans Chromium. Le correctif `e0e0d3e` du 11 octobre complète les statistiques absentes des anciennes sauvegardes côté serveur et client : l’erreur `combatsStarted` a été reproduite puis corrigée sur une copie de sauvegarde en production, sans annulation de partie réelle. Six tests de non-régression ont été ajoutés ; les 26 tests ciblés moteur/persistance, le lint et le build ont passé pour ce correctif. Les décomptes de tests des sections historiques ne sont pas ceux de cette version.

La [refonte de la Bibliothèque et des menus du 11 octobre](REFONTE_MENUS_2026-10-11.md) est implémentée : rayonnages illustrés, tomes consultables, navigation commune, collection tactile, recherche du bestiaire, détails des chroniques et sommaire du manuel. Prochains travaux : essais humains et Android/iPhone réels, puis écarts entre builds, lisibilité, performances et finitions audio/visuelles. Les limites et preuves de cette passe sont conservées dans son rapport.

## Historique des constats

Les sections suivantes conservent les bilans de leurs dates respectives. Pour décider du prochain travail, utiliser la TODO actuelle ci-dessus.

## Actualisation du 9 octobre 2026

La [passe graphique](PASSE_GRAPHIQUE_2026-10-09.md) ajoute neuf décors illustrés, des portraits et gravures de cartes, ainsi que la présentation du combat en portrait sur téléphone. Elle fournit les captures et les contrôles interactifs associés.

Les défauts de sauvegarde, de finalisation, de collision du catalogue et plusieurs règles de progression ont été corrigés. La version locale passe 626 tests, TypeScript, ESLint et le build de production sans polices téléchargées. Le [suivi des 44 actions](CORRECTIONS_AUDIT_2026-10-09.md) décrit la première passe. La [passe builds et diversité](EQUILIBRAGE_BUILDS_2026-10-09.md) ajoute les corrections d’effets, 90 cartes accessibles par personnage après tous les déblocages, et une comparaison de 4 000 parties simulées. Le classement reste non certifié ; reprise sur base isolée, équilibre humain et mobile réel restent à valider. Les chiffres du 3 août ci-dessous sont historiques.

## Verdict historique du 3 août

Panlibrarium est une alpha avancée jouable. Les systèmes structurants sont présents, le volume de contenu est déjà important et les contrôles automatisés sont de nouveau verts. Le principal frein avant une bêta est désormais la validation humaine de l'équilibrage et de l'ergonomie sur appareils réels.

## Ce qui est en place

- Boucle complète de run : préparation, choix du biome et de la difficulté, carte, combats, salles spéciales, marchand, récompenses, boss et écran de fin.
- Combat deck-builder avec énergie, encre, blocage, buffs/debuffs, alliés, reliques, objets, cartes améliorées et variantes encrées.
- 9 biomes : Library, Viking, Greek, Egyptian, Lovecraftian, Aztec, Celtic, Russian et African.
- 18 boss de biome, avec modules et mécaniques spécialisées.
- Quatre personnages jouables (`scribe`, `bibliothecaire`, `griot` et `fou`) et plusieurs conditions de run à débloquer.
- Méta-progression par histoires, ressources de biome, maîtrise des ennemis et déblocages de cartes/reliques.
- Sauvegarde et reprise des runs, historique, classement, authentification et administration statistique.
- Bibliothèque avec collection de cartes, bestiaire et progression narrative.
- Interface responsive desktop/mobile, PWA, i18n français/anglais, musique et effets de combat.

## Contenu mesuré depuis le code

L'audit automatisé du 3 août 2026 remonte :

- 260 définitions de cartes ;
- 251 cartes jouables ;
- 237 cartes actives, dont 40 cartes de bestiaire ;
- 197 cartes actives hors bestiaire ;
- 194 définitions de reliques ;
- aucun doublon exact détecté dans les cartes ou les descriptions de reliques ;
- une couverture globalement complète des axes de build, avec une lacune `discard` dans le pool African.

## Santé technique

- `npm run type-check` : OK.
- `npm run audit:cards -- --json` : OK.
- `npm run audit:relics` : OK.
- `npm run test` : OK, 538 tests sur 538.
- `npm run audit:stories` : OK ; les 10 descriptions anglaises précédemment incohérentes ont été corrigées.
- `npm run build` : OK. Le build est lent (environ 3 minutes de compilation) et remonte encore des avertissements ESLint sur certaines dépendances de hooks, mais aucune erreur bloquante.

## Niveau de maturité par domaine

| Domaine | État | Commentaire |
| --- | --- | --- |
| Boucle de jeu | Avancée | Parcours complet implémenté et persistant. |
| Contenu | Avancé | Gros pools de cartes, reliques, ennemis, boss et histoires. |
| Boss | Avancé | Mécaniques propres présentes pour tous les biomes. |
| Méta-progression | Avancée | Bonus verticaux plafonnés pour préserver l'apprentissage en difficulté 0. |
| UI desktop | Jouable | Lisible et structurée ; signature visuelle encore perfectible. |
| UI mobile/PWA | Jouable | Travail récent important ; tests de grille mobile au vert. |
| Équilibrage | En cours | Simulation disponible, playtests humains encore nécessaires. |
| Qualité automatisée | Saine | Typage, 538 tests, audits de contenu et build passent. |
| Documentation | Assainie | Références vivantes conservées, snapshots et template retirés. |

## Priorités recommandées

1. Faire des playtests ciblés sur la courbe de difficulté, les écarts entre builds et les floors 2–3.
2. Vérifier l'ergonomie mobile sur appareils réels, en particulier les combats encombrés et les safe areas iOS.
3. Renforcer l'identité visuelle des cartes et des biomes sans sacrifier la lisibilité actuelle.
4. Traiter progressivement les avertissements de dépendances React remontés par le build.
5. Valider le parcours complet avec une base propre avant de considérer une bêta.

## Passe d'équilibrage du 3 août 2026

- Deck initial : 11 cartes pour chacun des quatre personnages, avec des compositions rééquilibrées.
- Pool initial de récompenses : exactement 20 cartes par personnage (anciennement Scribe 8, Bibliothécaire 6, Griot 9 et Fou 8).
- Départ : 68 PV, 5 cartes piochées par tour et 30 or.
- Difficulté 0 : montée en puissance plus douce sur les trois étages, surtout pendant l'acte I.
- Récompenses normales : 2 choix plus lisibles ; le second maximise désormais le contraste d'archétype, de type, de cible et de coût avec le premier.
- La diminution des drafts aux seuils de 17 puis 22 cartes a été supprimée le 9 octobre : chaque victoire normale propose maintenant un draft avec possibilité de passer.
- Tailles finales simulées avec une méta moyenne : Scribe 29,0 ; Bibliothécaire 25,2 ; Griot 28,1 ; Fou 27,3 cartes, contre environ 41 avant la passe.
- Méta : plafonnement des cumuls de statistiques ; le bonus permanent de +1 énergie est remplacé par 2 Ink au début du combat.
- Acte I : aucune élite optionnelle dans les cinq premières salles, une salle de correction précoce et 3 PV récupérés après les combats normaux en difficulté 0.
- Confort : vitesse persistante ×1, ×1,5 ou ×2 appliquée aux tours ennemis, cartes, dégâts, buffs, morts, invocations, mélanges, transitions et animations CSS.
- Le simulateur utilise maintenant les pouvoirs d'Encre des personnages ; les quatre personnages gagnent des runs sans méta en difficulté 0 dans les échantillons automatisés.

## Télémétrie d'équilibrage

Chaque fin de run conserve désormais le deck final, les reliques, les boss vaincus, la condition de départ, un snapshot de la méta et des compteurs agrégés. Ceux-ci couvrent les combats et leurs tours, les PV perdus, les cartes jouées/ajoutées, les récompenses refusées, les retraits et améliorations, les achats, objets, relances, variantes encrées, Encre générée/dépensée et pouvoirs d'Encre utilisés. Un résumé par combat conserve également les ennemis, l'étage, le type de rencontre et les PV avant/après.

Le tableau `/admin/stats` expose les taux de victoire par difficulté, personnage, archétype, biome et condition de départ, ainsi que l'utilisation globale de l'Encre, les pouvoirs associés et les cartes les plus jouées.

## Documents de référence

- `TODO.md` reste la liste opérationnelle des travaux ouverts.
- `PROJECT_DOC.md` décrit la vision et les règles générales.
- `COMPRENDRE_LE_PROJET.md` explique l'architecture actuelle.
- `card-design-bible.md`, `META_PROGRESSION.md`, `evolution-histoire.md` et `mythologie.md` portent les décisions de design encore utiles.
- Les scripts `audit:*` sont la source de vérité pour les métriques de contenu ; éviter de recréer des snapshots Markdown datés.
