# Passe autonome — 12 octobre 2026

Référence initiale : `6cadec1`. Les douze lots demandés sont traités ci-dessous. Les essais navigateur utilisent Edge/Chromium émulé ; le Redmi Note 11 Pro 5G et Safari/iPhone physiques restent à tester.

| Ordre | Lot | Résultat et preuve |
| --- | --- | --- |
| 1 | Marchand et événements | Disponibilités communes UI/moteur : or, PV, deck minimal, soin, doublons, inventaire et places d’alliés. Motifs visibles, coûts affichés, sortie tactile accessible. [Marchand](validation-2026-10-12/shop-mobile.json), [événement](validation-2026-10-12/event-mobile.json). |
| 2 | Parcours automatisés | 108 tentatives, quatre personnages × neuf biomes forcés : 108 victoires en D0/méta average et 5 400 états de salle sérialisés puis validés. Couverture technique, pas taux de victoire débutant. [Parcours](validation-2026-10-12/journeys.json). |
| 3 | Sauvegarde et reprise | Conflits, réseau incertain, pagehide et doublons couverts. Purge du marchand reprise sans second paiement. Nouveau point persistant pour les purges d’événement, auparavant perdues entre paiement et sélection. [Reprise](validation-2026-10-12/event-purge-resume.json). |
| 4 | Mobile et PWA | Sélecteur de cartes adapté à la largeur, texte entier, défilement de la fenêtre. Neuf formats, cinq ennemis/deux alliés, puis main de dix cartes : inspection, gestes, ciblage, fin de tour, reprise. [Combat](validation-2026-10-12/checks.json), [cartes](validation-2026-10-12/combat-checks.json). PWA : recette live ci-dessous. |
| 5 | Performances | 13 269 982 octets de musique retirés du préchargement PWA ; cache de quatre pistes avec requêtes partielles. Décors adaptés au paysage mobile. Écrans secondaires du jeu chargés à leur utilisation. [Mesures](validation-2026-10-12/performance.json). |
| 6 | Accessibilité | Jouer/Lire/Encre séparés : suppression des boutons imbriqués signalés sur la main mobile. Zéro violation automatique détectée sur combat, Bibliothèque, Collection et Manuel après correction. Contrastes sur peintures parfois indéterminés. [Axe](validation-2026-10-12/accessibility.json). |
| 7 | Cartes et effets | Contrat transversal sur cartes normales/encrées et branches A/B : format sauvegardable, ressources non négatives, aucune mutation de l’entrée ni duplication d’instances. Contrôles spécialisés conservés. [Cartes](validation-2026-10-12/cards.md), [reliques](validation-2026-10-12/relics.md). |
| 8 | Équilibrage | Campagne de 2 040 parties : 13 orientations D0–D5, quatre départs sans méta et 12 orientations sans cartes offensives Armure/Épines en D0–D2. Griot Rythme D5 : 0/20 puis 5/60 nouvelles graines ; les 30 graines historiques reproduisent 4/30. Cette faiblesse reste ouverte. État final dans [les résultats](validation-2026-10-12/RESULTATS.md). |
| 9 | Diversité | 237 cartes collectables, 39 propres et 90 accessibles par personnage à déblocages complets. Branches, synergies, fréquences d’offres et choix consignés. [Catalogue](validation-2026-10-12/builds.json), [offres](validation-2026-10-12/signatures.md), [sélections](validation-2026-10-12/draft-summary.json). |
| 10 | Méta-progression | 45 histoires : coûts positifs, prérequis existants, aucun cycle, coûts cumulés et plafonds calculés. Un déblocage dupliqué ne cumule plus son bonus. Estimations de combats équivalents explicites. [Méta](validation-2026-10-12/meta.json). |
| 11 | Textes | 2 699 entrées effectives FR/EN concordantes, variables identiques, aucune clé littérale appelée sans ressource/fallback. Pluriels et textes du catalogue pris en compte. Bazar traduit ; signes de coût dédoublonnés. [Traductions](validation-2026-10-12/translations.json). |
| 12 | Finitions et publication | Audio muet sans allocation/chargement inutile, reprise du thème courant, nettoyage et refus d’autoplay gérés. 348 sources graphiques référencées présentes ; en-têtes de 1 165 médias valides. Suivi, tests/build/lint et publication. [Médias](validation-2026-10-12/assets.json). |

## Validation technique

- **685 tests, 63 fichiers**, sans échec : [journal](validation-2026-10-12/tests-final.log).
- TypeScript, ESLint et compilation passent : [build](validation-2026-10-12/build-final.log).
- Les scènes encombrées et la purge déjà payée sont des fixtures locales synthétiques, distinctes des parcours normaux. La sauvegarde QA locale est restaurée après recette ; aucune partie d’un joueur n’est annulée.
- Le contrôle historique `antd:first:check` échoue encore sur 25 primitives dans 12 fichiers préexistants non modifiés par cette passe. Cette dette est suivie dans TECH-02 ; la baseline reste inchangée.

## Performances mesurées

Le JavaScript initial annoncé par Next passe de **779 à 768 Ko** : gain modeste. Le combat s’affiche en 0,75 puis 0,76 s sans ralentissement, et en 9,43 puis 10,30 s avec CPU ×4 et réseau 1,6 Mbit/s / 150 ms. **Aucun gain de latence fiable n’est établi** par ces deux mesures sur un poste occupé par d’autres contrôles.

Après douze ouvertures/fermetures de la fiche héros, le tas JavaScript après GC passe de 12,44 à 12,98 Mo sans ralentissement, et de 10,65 à 11,84 Mo avec ralentissement. Cette série courte ne démontre ni une fuite, ni son absence sur une session longue. Les temps de clic incluent les délais du pilote et ne mesurent pas l’INP.

Le gain certain concerne le poids d’installation initial : les musiques ne sont plus toutes préchargées. Les peintures restent chargées à la demande avec des caches bornés. Un volume à zéro n’ouvre plus de piste ni de contexte de synthèse.

## Limites

Les mesures ne remplacent pas le confort de jeu, la qualité littéraire des traductions, la lisibilité artistique, la perception des volumes ou une expédition sur téléphone réel. Les contrastes indéterminés restent à regarder. Le pilote d’équilibrage simplifie trajets, événements et effets conditionnels ; vingt parties par case restent un petit échantillon. Les intervalles statistiques sont fournis. Aucune hausse de puissance n’est fondée uniquement sur un rejet du pilote.

Extensions narratives, nouveaux personnages et classement certifié restent des évolutions à arbitrer.

## Reproduire

`npm run validate:journeys`, `npm run validate:balance` (ou `node scripts/validate-balance.mjs --resume` pour cette campagne datée), `npm run audit:cards`, `npm run audit:builds`, `npm run audit:progress`, `npm run audit:text`, `npm run audit:assets`, puis `node scripts/summarize-validation.mjs`.

Un disque plein a interrompu l’écriture de résultats. Après nettoyage des caches générés, les cas incomplets ont été rejoués avec leurs graines d’origine ; aucune graine perdante n’a été remplacée pour améliorer les chiffres.

## Publication

Correctifs publiés sur `main` : **`e008657b1c96380010cb8f57b2360e3a0963ba9f`**. Vercel confirme une compilation/déploiement réussis ; `/api/version` sert cette révision sur [le jeu](https://rogue-next.vercel.app). Le commit documentaire qui ajoute ces preuves ne modifie pas le code testé.

- [Menus en production](validation-2026-10-12/live-menus.json) : inscription, Bibliothèque, Collection, Bestiaire, historique, règles, classement, création et reprise de la même expédition.
- [Combat tactile](validation-2026-10-12/live-combat.json) : quatre formats, héros/ennemis visibles, peintures chargées et inspection sans jouer de carte. Un combat normal gagné via les commandes de l’interface.
- [Récompenses](validation-2026-10-12/live-rewards.json) : quatre formats, cartes sans défilement interne, confirmation unique sans faux choix A/B, illustration consultable. Ajout d’une carte de base puis [rechargement frais](validation-2026-10-12/live-persistence.json) : même expédition, deck de douze cartes identique.
- [PWA](validation-2026-10-12/live-pwa.json) : manifeste valide, zéro erreur d’installabilité Chromium, nouveau service worker et en-tête `no-store`. Avis observé puis [bouton « Mettre à jour » utilisé](validation-2026-10-12/live-pwa-update.json). Service worker activé, page contrôlée et aucune musique dans le précache.

Aucune exception JavaScript dans ces scénarios. Le compte QA jetable et sa partie ont été supprimés après les essais. L’installation et l’usage sur Redmi/iPhone physiques restent dans QA-01.
