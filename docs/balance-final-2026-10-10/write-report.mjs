import fs from 'node:fs';
const root='docs/balance-final-2026-10-10';
const read=name=>JSON.parse(fs.readFileSync(`${root}/${name}`,'utf8'));
const normal=read('matrix-04-final.json'),strict=read('matrix-04-strict.json');
const characters={scribe:'Scribe',bibliothecaire:'Bibliothécaire',griot:'Griot',fou:'Fou'};
const builds={ink:'Encre',upgrade:'Annotation',exhaust:'Épuisement',draw:'Pioche',archive:'Archives',armor:'Armure',poison:'Poison',bleed:'Saignement',rhythm:'Rythme',debt:'Dette',strength:'Force',discard:'Défausse'};
const terminal=fs.existsSync(`${root}/05-terminal-verification.json`)?read('05-terminal-verification.json'):null;
function table(data,max){return Object.keys(characters).flatMap(c=>[...new Set(data.filter(x=>x.character===c&&x.build!=='mixed').map(x=>x.build))].map(b=>`| ${characters[c]} | ${builds[b]} | ${Array.from({length:max+1},(_,d)=>data.find(x=>x.character===c&&x.build===b&&x.difficulty===d).wins+'/30').join(' | ')} |`)).join('\n');}
const report=`# Passe finale : équilibrage, diversité et recette — 10 octobre 2026

Cette passe reprend les cinq travaux demandés dans leur ordre. Le simulateur a été corrigé avant de recalibrer D3–D5. Aucune illustration supplémentaire n’a été générée.

## Résultat

Les treize couples personnage/orientation gagnent à chaque difficulté D0–D5 dans la série finale indépendante. Les douze orientations hors Armure gagnent également en D0–D2 lorsque les cartes à dégâts d’armure et à épines sont interdites. L’armure n’est donc pas un passage obligé dans les conditions mesurées.

Les écarts restent réels : Dette est la meilleure orientation D5 de cette série, Armure reste confortable, tandis que Griot Rythme/Saignement et Scribe Encre demandent davantage de précision. Il s’agit de victoires observées, pas d’une garantie pour chaque graine ni de taux de victoire humains.

## 1. Accueil du Griot sans méta

\`masque_de_bois\` passe de 1 à 0 énergie. La relique de départ \`bleeding_thistle\` accorde 3 armure à la première Attaque du tour, en conservant son saignement à la troisième Attaque. Le Griot peut mieux enchaîner sans sacrifier toute sa défense.

L’expérience appariée de 100 parties D0 sans méta passe de 23 victoires à 27 avec le masque seul, puis 45 avec les deux modifications. Cette expérience exploratoire précède les dernières corrections de fidélité du simulateur ; la confirmation indépendante finale est plus représentative du code livré.

Confirmation D0 sans méta, 30 parties par personnage : Scribe 21, Bibliothécaire 26, Griot 16 et Fou 21. Le Griot reste le départ le plus exigeant de cet échantillon. L’accueil est amélioré sans prétendre égaliser parfaitement les personnages.

## 2. Scribe Encre et Griot Rythme en D2

- \`parchemin_de_soin\` produit 2 encre dans ses formes normale et améliorée, en conservant son blocage.
- Encre noire inflige deux fois l’encre actuelle en dégâts, calculés avant de payer son coût de 4.
- \`rythme_mortel\` reçoit \`RHYTHM_REWARD\` dans ses formes normale et améliorée.
- Le troisième temps réussi de cet effet fait piocher une carte et rend une énergie. Une alternance ratée remet la séquence à zéro. Le pouvoir Refrain garde sa mécanique distincte.

Dans la série finale D2, Scribe Encre gagne 22/30 et Griot Rythme 17/30. Dans la série sans cartes offensives armure/épines, ils gagnent 30/30 et 17/30. Les graines sont différentes : ces écarts ne mesurent pas isolément la valeur de l’armure.

## Simulateur : information cachée et moteur réel

Les choix de cartes, de pouvoirs et les estimations utilisées pour les potions partagent maintenant la même observation filtrée. Quand le jeu masque une intention, par difficulté ou malédiction, le pilote remplace l’action réelle par l’aptitude de poids le plus élevé, avec départage déterministe. Il estime l’intention, sans consulter l’action secrète pour décider.

Les tests changent uniquement l’intention secrète et vérifient que les décisions restent identiques lorsqu’elle est masquée, tout en distinguant les intentions visibles. Les aperçus ont leur propre aléatoire et ne consomment pas celui de la partie.

Les actions réelles passent par le même reducer que l’interface : cartes, pouvoirs, consommables, fin de tour et débordement de main. Cela rétablit notamment le contexte précédent des reliques, le bonus d’attaque méta, la conservation à l’épuisement et la survie unique. Les pouvoirs peuvent être utilisés entre les cartes, après avoir gagné de l’encre.

Limites : le pilote reste une heuristique à un coup, avec trajet et événements simplifiés. Il sous-exploite certaines installations et ne représente pas un débutant. Les chiffres exploratoires antérieurs à ces corrections ne servent pas à affirmer la viabilité D3–D5.

## 3. Recalibrage D3–D5

Le cumul PV, dégâts, contrôle, pénétration et raréfaction des soins était trop punitif. Les paliers conservent leurs règles distinctives avec une progression moins abrupte.

| Paramètre | D3 | D4 | D5 |
|---|---:|---:|---:|
| Multiplicateur PV | 1,18 | 1,20 | 1,23 |
| Multiplicateur dégâts | 1,13 | 1,14 | 1,15 |
| Progression supplémentaire PV | 0,18 | 0,20 | 0,22 |
| Progression supplémentaire dégâts | 0,13 | 0,14 | 0,15 |
| Bonus d’élites | 0,03 | 0,06 | 0,09 |
| Poids des soins | 1 | 0,98 | 0,95 |
| Pénétration de l’armure | 0 % | 3 % | 3 % |
| Altérations supplémentaires des boss | 0 | 0 | +1 |

Les intentions des élites/boss restent masquées tous les trois tours dès D3. L’armure initiale des élites et boss reste active en D5. La probabilité de relique d’élite D5 passe à 75 %.

Comparaison appariée avec le même simulateur corrigé et les mêmes graines, 20 parties × 13 orientations × 3 difficultés :

| Difficulté | Avant | Après |
|---|---:|---:|
| D3 | 154/260 | 169/260 |
| D4 | 88/260 | 114/260 |
| D5 | 35/260 | 74/260 |

Sources : [avant corrigé](balance-final-2026-10-10/matrix-03-calibrated.json), [après](balance-final-2026-10-10/matrix-03-after.json). Cette comparaison précède les changements de diversité du point 4.

### Confirmation finale indépendante

2 460 parties sans erreur : 2 340 pour les treize orientations sur six difficultés et 120 départs sans méta. Profil méta \`average\` en D0–D1, \`strong\` en D2–D5 : ces profils sélectionnent des histoires réelles avec leurs prérequis et ne correspondent pas à un compte neuf.

| Personnage | Orientation | D0 | D1 | D2 | D3 | D4 | D5 |
|---|---|---:|---:|---:|---:|---:|---:|
${table(normal,5)}

[Matrice finale et fichiers de chaque cas](balance-final-2026-10-10/matrix-04-final.json).

### Sans cartes offensives armure/épines

1 080 parties supplémentaires sans erreur. Le filtre interdit les cartes à dégâts d’armure et épines, y compris leurs formes améliorées et encrées jouées. Le blocage défensif reste autorisé. **Les reliques et consommables restent disponibles** : le test n’élimine pas toute interaction indirecte liée à l’armure.

| Personnage | Orientation | D0 | D1 | D2 |
|---|---|---:|---:|---:|
${table(strict,2)}

[Matrice stricte](balance-final-2026-10-10/matrix-04-strict.json). Toutes ces orientations terminent D0–D2 dans les conditions mesurées.

## 4. Diversité des cartes et améliorations

L’audit porte sur 237 cartes collectables, hors cartes de départ, statuts et malédictions. Les cartes non collectables sont exclues.

| Carte | Changement |
|---|---|
| \`heavy_strike\` | Bonus si une carte améliorée est en main ; branche B liée à l’épuisement |
| \`hieroglyph_strike\` | Dépense l’encre actuelle pour infliger des dégâts supplémentaires |
| \`curse_word\` | Même ressource de finition ; branche B qui regagne de l’encre |
| \`sand_whip\` | Ajout de Faiblesse |
| \`healing_script\` | Conservation d’une carte ; branche B Archives/pioche |
| \`vulnerability_hex\` | Pioche pour faciliter son enchaînement |
| \`transe_vaudou\` | Participation au rythme |
| \`venin_du_serpent\`, \`plague_of_words\` | Branches B qui propagent les altérations |
| \`ink_surge\` | Conservation en version encrée à la place des épines hors thème |

Les groupes partageant un même motif d’effets de base passent de 13 à 9. Ce ne sont pas forcément des doublons exacts : coût, valeurs, rareté et accès diffèrent. Aucune paire A/B n’est strictement identique. Dans la série finale, le pilote choisit 4 762 améliorations A et 3 346 B.

Des cartes auparavant jamais prises le sont désormais : \`heavy_strike\` 337/2 180 offres, \`healing_script\` 277/1 414 et \`vulnerability_hex\` 176/1 508. Les populations avant/après diffèrent ; cela prouve une utilisation, sans mesurer un gain causal à conditions identiques. Une carte délaissée par l’heuristique n’est pas automatiquement mauvaise pour un humain.

[Audit avant](balance-final-2026-10-10/04-card-audit-before.json) et [audit après](balance-final-2026-10-10/04-card-audit-after.json), avec effets, branches, offres et sélections.

## 5. Recette navigateur et sauvegardes

Les tests utilisent une base PostgreSQL locale isolée et des comptes jetables. Aucune base distante n’a été modifiée. Les actions passent par les boutons, le clavier et les événements tactiles ; la lecture de React sert aux assertions, sans injection d’actions dans le reducer. Il s’agit de parcours automatisés dans Edge/Chromium, avec émulation tactile pour le mobile, pas d’essais humains sur téléphone physique ou Safari.

- **Bureau :** Scribe D0 sans méta, partie menée à la défaite à l’étage 3, salle 12, après deux boss. Carte, événements, marchand, purge et changements de royaume traversés.
- **Mobile :** Bibliothécaire D0, ${terminal?'victoire sur les trois étages et les trois boss, confirmée en base et dans l’historique':'recette en cours de finalisation'}. Toutes les histoires du compte local sont débloquées pour atteindre les écrans tardifs ; cette partie ne mesure pas l’équilibrage.
- Formats contrôlés : 320 × 568, 390 × 844, 844 × 390 et 1440 × 1000, sans débordement horizontal sur le combat vérifié.
- Illustration agrandie : image complète 1536 × 1024 avec \`object-fit: contain\`, sans jouer la carte à l’ouverture/fermeture.

### Corrections issues de cette recette

1. **Récompenses perdues au rechargement :** offres, choix restants et relances sont enregistrés avec les coordonnées de salle, y compris après le dernier boss.
2. **Carte rare absente au boss suivant :** « carte déjà choisie » dépend désormais de la récompense courante, au lieu de persister entre boss.
3. **Boutique régénérée à la reprise :** stock, ventes, réassort automatique et purge payée en attente sont enregistrés. Une purge reprise ne prélève pas une seconde fois son coût.
4. **Libellés :** D3 ne prétend plus réduire les soins ; choisir une carte de départ ne parle plus de choisir une difficulté.
5. **Petites cartes de récompense mobiles :** le bouton d’illustration utilise une icône pour éviter le texte coupé, avec son nom accessible conservé.
6. **Clôture de partie :** les offres et données temporaires de boutique sont retirées de l’état final envoyé au serveur.

### Vérifications de persistance

- Achat : or 181 → 107, carte ajoutée et stock identiques après rechargement.
- Purge : or 107 → 17, choix repris après rechargement, carte retirée, or toujours 17 au rechargement suivant.
- Combat : main, ennemis, PV, encre, deck et or conservés ; combat identique après fermeture puis réouverture d’un onglet.
- Coupure réseau : état serveur inchangé, avertissement visible, sauvegarde automatique au retour et reprise identique.
- Récompense de boss : défaut reproduit sur l’ancienne sauvegarde, puis offre préservée après deux chargements. Ce cas ancien utilise une fixture locale de migration issue de l’offre capturée, sans changer deck, or ou statistiques.
- Nouvelle partie : récompense du premier boss préservée sans fixture après rechargement.
${terminal?'- Dernier boss : récompense préservée au rechargement avant validation, puis une seule victoire, un seul résumé et un seul instantané PvP enregistrés. Le rechargement de l’historique ne redonne aucune ressource.\n':''}

Preuves : [boutique](balance-final-2026-10-10/05-shop-persistence.json), [combat et réseau](balance-final-2026-10-10/05-combat-persistence.json), [récompense migrée](balance-final-2026-10-10/05-reward-reload.json), [formats et illustration](balance-final-2026-10-10/05-mobile-layouts.json). Captures dans le même dossier.
${terminal?'Compléments : [premier boss sans fixture](balance-final-2026-10-10/05-fresh-reward-reload.json), [dernier boss](balance-final-2026-10-10/05-final-reward-reload.json), [résultats terminaux et absence de duplication](balance-final-2026-10-10/05-terminal-verification.json).':''}

## Validation et reproduction

- 644 tests passent dans 54 fichiers : intentions cachées, progression D4/D5, rythme, sauvegarde de récompenses et reprise de purge notamment.
- Compilation de production et vérification TypeScript réussies ; lint sans avertissement.
- Les 15 tests ciblés sur l’illustration, les récompenses, l’autosauvegarde et le marchand passent aussi après les dernières retouches.
- 3 540 parties finales indépendantes sans erreur. Les pilotes interrompus et expériences invalides sont exclus des totaux.
- Version des règles d’analytique : \`2026-10-10.2\`.

Exemple reproductible :

\`\`\`powershell
node --import tsx scripts/simulate.ts 30 2 null griot strong final-pass-strict-independent --build=rhythm --no-armor-payoffs --json=docs/balance-final-2026-10-10/reproduction-griot-rhythm.json
\`\`\`

\`run-series.py\` orchestre les matrices avec deux processus maximum et vérifie graine, taille et absence d’erreurs. Il reprend les JSON existants : mesurer une nouvelle version exige de nouveaux noms ou un nouveau dossier.

## Suivi

Les ajustements ne remplacent pas les retours de joueurs. Observer de vraies premières parties Griot, la satisfaction en D2, puis Griot Rythme/Saignement et Scribe Encre en D5. Les cartes à installation complexe demandent des essais humains avant un buff fondé uniquement sur le pilote.
`;
fs.writeFileSync('docs/PASSE_FINALE_EQUILIBRAGE_ET_RECETTE_2026-10-10.md',report);
