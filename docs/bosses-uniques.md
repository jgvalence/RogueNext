# Bosses uniques - roadmap

## But

On veut que chaque boss sorte du schema actuel "gros sac de PV + kit d'abilities + phase 2 heal/strength/summon".

La cible, c'est ce qu'on a deja reussi sur les 2 boss de `LIBRARY`:

- une mecanique coeur propre au boss
- un contre-jeu que le joueur comprend vite
- une phase 2 qui renforce la meme idee au lieu de changer de combat
- une lisibilite UI reelle: markers, chips, previews, objets de board, etc.

## Pourquoi Library marche

### `chapter_guardian` - reference "boss systemique"

- Le combat ne repose pas seulement sur des chiffres: il repose sur 3 reliures a casser.
- Chaque reliure parle un langage du joueur:
  - `ATK`: jouer des attaques
  - `BLK`: gagner du block
  - `INK`: depenser de l'ink
- Le joueur voit sa progression, l'etat `OPEN`, puis le tour force `REBIND`.
- La phase 2 garde la meme structure et augmente la violence du systeme.

### `the_archivist` - reference "boss board + hand"

- Le boss vit avec 2 adds scriptes (`Black Inkwell`, `Pale Inkwell`).
- Chaque add porte une fonction lisible:
  - l'un redige le cout
  - l'autre redige le texte
- Tuer un add retire la pression associee.
- La phase 2 reactive le meme puzzle au lieu d'ajouter juste plus de degats.

## Regles qu'on veut appliquer a tous les boss

- 1 boss = 1 gimmick coeur. Pas 3 mini-gimmicks mal relies.
- Le gimmick doit etre lie au biome et a la fantasy du boss, pas juste a son type de degats.
- Le contre-jeu doit utiliser des verbes existants du joueur:
  - attaquer
  - bloquer
  - depenser l'ink
  - tuer un add
  - changer son ordre de cartes
  - burst au bon moment
- La phase 2 doit escalader le gimmick coeur, pas seulement ajouter `heal + strength + summon`.
- Si la mecanique compte, elle doit etre visible:
  - marker d'etat
  - preview d'intent
  - compteur
  - objet de board
  - stance/facing claire
- Si une mecanique demande un vrai etat, on assume un module moteur dedie, comme pour `chapter_guardian.ts` et `archivist.ts`.

## Fiche cible par boss

Pour chaque boss, on veut pouvoir remplir ces 6 points:

- `Actuel`: ce que le kit fait deja.
- `Direction`: la vraie promesse du combat.
- `Contre-jeu`: ce que le joueur doit comprendre et faire.
- `Phase 2`: comment le systeme monte en pression.
- `UI`: ce qu'il faut afficher.
- `Moteur/tests`: ce qu'il faut script-er et verifier.

## Carte rapide des mecaniques coeur

Index volontairement grossier pour eviter les doublons de fantasy ou de contre-jeu pendant les prochains protos.

- `chapter_guardian`: quotas de tour `ATK / BLK / INK`, fenetre `OPEN`, puis `REBIND`.
- `the_archivist`: adds fonctionnels, redaction du cout et du texte, choix de cible boss vs inkwells.
- `fenrir`: compteur de chasse a casser avec des hits multiples avant son tour.
- `hel_queen`: alternance de stances `LIFE / DEATH`, pose puis cash-out de `BLEED`.
- `medusa`: pattern interdit d'ordre de cartes; la punition tombe si le joueur complete la sequence defendue.
- `hydra_aspect`: adds persistants; tuer une tete ne suffit pas, il faut aussi toucher le corps.
- `ra_avatar`: l'ink non depensee charge une menace differ ee (`SUN -> Solar Judgment`).
- `osiris_judgment`: jugement de la forme du tour (`degats` vs `block`) plutot que lecture d'ordre.
- `nyarlathotep_shard`: action taboue / prophetie qui se declenche la premiere fois que le joueur fait le verbe interdit.
- `shub_spawn`: objets de board a timer (`nids/oeufs`) entre `hatch` et `consume`.
- `tezcatlipoca_echo`: miroir des gros plays du joueur, renvoi d'echos au tour suivant.
- `quetzalcoatl_wrath`: stance `AIRBORNE / GROUNDED`, ouverture par multi-hit, fenetre de burst.
- `dagda_shadow`: objet de board / chaudron a casser avant resolution.
- `cernunnos_shade`: couches d'andouillers / couronne qui punissent les gros hits frontaux.
- `baba_yaga_hut`: lecture de tour contextuelle selon la face active (`TEETH / BONES / HEARTH / CURSE`).
- `koschei_deathless`: immortalite conditionnelle, chaine d'objets a casser dans l'ordre.
- `soundiata_spirit`: vers visibles qui buffent toute l'armee si on ne les interrompt pas a temps, avec `Mask Hunter` pour porter la pression de board.
- `anansi_weaver`: combinaison-cible du tour; l'ordre n'importe pas, une carte jouee avec de l'encre compte comme son type natif plus `INK`, et completer le set capture une carte puis pollue le deck.

## Zones de recouvrement a surveiller

- `Medusa` et `Anansi` lisent tous deux la forme du tour, mais pas de la meme facon.
  `Medusa` = pattern interdit a ne pas completer dans un ordre donne.
  `Anansi` = combinaison annoncee a casser ou completer, avec ordre libre.
- `Chapter Guardian`, `Baba Yaga` et `Osiris` lisent tous la forme du tour, mais sur trois axes differents.
  `Chapter Guardian` = quotas systemiques simultanes.
  `Baba Yaga` = exigence contextuelle qui tourne selon la face.
  `Osiris` = balance entre deux ressources produites (`degats` / `block`).
- `Fenrir`, `Quetzalcoatl` et `Cernunnos` recompensent tous les hits repetes, mais avec des promesses distinctes.
  `Fenrir` = casser une jauge avant son action.
  `Quetzalcoatl` = ouvrir une stance vulnerable.
  `Cernunnos` = denuder une couronne anti-gros-hit.
- `Archivist`, `Hydra`, `Koschei`, `Shub Spawn` et `Dagda` passent tous par des cibles annexes ou des objets de board.
  La difference a garder nette:
  `Archivist` = adds fonctionnels persistants.
  `Hydra` = adds anatomiques lies au corps.
  `Koschei` = chaine de receptacles de mort.
  `Shub` = timers de hatch/consume.
  `Dagda` = unique objet a interrompre.
- `Ra` et `Tezcatlipoca` punissent tous deux les gros tours ou les tours "mal laisses", mais l'angle doit rester different.
  `Ra` = sanction d'une ressource non depensee en fin de tour.
  `Tezcatlipoca` = reflet differe des plays les plus marquants.

## Roadmap par boss

### LIBRARY

#### `chapter_guardian` [REFERENCE / DONE / VALIDATED]

- `Actuel`: 3 bindings, fenetre `OPEN`, tour force `REBIND`, vrai etat moteur, vrais markers UI.
- `Direction`: ne pas rework, seulement tuner si besoin.
- `Contre-jeu`: casser `ATK`, `BLK`, `INK`, puis profiter de la fenetre.
- `Phase 2`: deja bonne, car elle garde la meme logique.
- `UI`: deja exemplaire.
- `Moteur/tests`: deja exemplaire.
- `Validation`: valide.

#### `the_archivist` [REFERENCE / DONE / VALIDATED]

- `Actuel`: redactions de cartes via 2 inkwells, retours d'adds, vrais overlays de cartes et previews.
- `Direction`: ne pas rework, seulement tuner si besoin.
- `Contre-jeu`: choisir entre boss pressure et suppression des inkwells.
- `Phase 2`: deja bonne, car elle renforce le meme puzzle.
- `UI`: deja exemplaire.
- `Moteur/tests`: deja exemplaire.
- `Validation`: valide.

### VIKING

#### `fenrir` [IMPLEMENTED / VALIDATED]

- `Actuel`: `The Hunt` est implemente. Fenrir commence chaque tour joueur avec `3` pips de chasse, puis `4` en phase 2. Chaque hit reussi sur Fenrir retire `1` pip. Les pips restants donnent actuellement `+2` degats chacun sur sa prochaine action.
- `Direction`: garder un boss de poursuite lisible, qui punit les tours mono-gros-hit et recompense les hits multiples / chip / allies.
- `Contre-jeu`: casser la chasse avant son tour en multipliant les impacts au lieu de lui laisser conserver son elan.
- `Phase 2`: la chasse passe a `4` pips. `Pack Howl` ne gagne son extra que si la chasse tient encore: il invoque un `draugr`, ou applique `BLEED` si le board est deja plein.
- `UI`: marker `HUNT x/y`, chip de degats `+2/hunt`, preview phase 2 sur la montee a `4`.
- `Moteur/tests`: state dedie dans `src/game/engine/fenrir.ts`, hooks sur les hits dans `effects.ts`, tests dedies dans `src/game/__tests__/viking-bosses.test.ts` + checks UI.
- `Note de tuning`: version volontairement simple et lisible. A surveiller si `+2/pip` est trop soft ou si `Pack Howl` n'est pas assez determinant hors phase 2.
- `Validation`: valide.

#### `hel_queen` [IMPLEMENTED / VALIDATED]

- `Actuel`: `Half-World` est implemente. Hel commence en `LIFE`, alterne ensuite entre `LIFE` et `DEATH`, pose du `BLEED` en `LIFE`, puis convertit le saignement restant en vraie punition en `DEATH` tout en pouvant relever un `draugr` mort.
- `Direction`: en faire un boss de tempo et de gestion de statut, pas juste un boss a gros chiffre. Le joueur doit lire la stance et preparer le tour `DEATH`.
- `Contre-jeu`: arriver aux tours `DEATH` avec peu de `BLEED`, ou assez de block pour absorber la sentence, et gerer le board si un `draugr` peut revenir.
- `Phase 2`: alternance acceleree a `1` tour par stance. Les tours `DEATH` ajoutent aussi `WEAK`.
- `UI`: badge `LIFE/DEATH`, compteur avant bascule, chip de cash-out du bleed, preview de reanimation de `draugr`.
- `Moteur/tests`: state dedie dans `src/game/engine/hel-queen.ts`, cycle de stance script-e, cash-out du bleed, rez de `draugr`, tests dedies dans `src/game/__tests__/viking-bosses.test.ts` + checks UI.
- `Note de tuning`: cash-out actuel a `3` degats par stack de `BLEED`, en plus de l'action de base. A surveiller si la pression `DEATH` devient trop punitive en phase 2.
- `Validation`: valide.

### GREEK

#### `medusa` [IMPLEMENTED / VALIDATED]

- `Actuel`: `The Gaze` est implemente. Medusa revele chaque tour joueur un pattern interdit a `2` etapes (`ATTACK -> ATTACK`, `SKILL -> ATTACK`, etc.). Si le joueur complete ce pattern, la derniere carte jouee devient `Petrified` et coute plus cher lors de son prochain play.
- `Direction`: garder un boss de lecture d'ordre de cartes, ou la punition vient de la sequence du tour plutot que d'un simple debuff numerique.
- `Contre-jeu`: varier l'ordre des plays, jeter une petite carte dans le pattern si besoin, ou accepter une petrification sur une carte peu critique pour garder le tempo.
- `Phase 2`: Medusa active `2` patterns simultanes au lieu d'un seul et la punition de petrification passe a `+2` cout au lieu de `+1`.
- `UI`: markers `GAZE` avec pattern et progression, badge `Petrified` sur la carte concernee, cout de carte majore dans la main, chip de preview `P2` explicitant le second pattern.
- `Moteur/tests`: module dedie dans `src/game/engine/medusa.ts`, stockage combat-only des cartes petrifiees, hooks dans `cards.ts`, checks UI dans `combat-view-helpers.test.ts`, tests moteur dans `src/game/__tests__/greek-bosses.test.ts`.
- `Note de tuning`: la version actuelle est tres lisible. Il faudra surveiller si `+1/+2` cout suffit a rendre la petrification significative, ou s'il faut ajouter une pression secondaire sur certaines cartes clefs.
- `Validation`: valide.

#### `hydra_aspect` [IMPLEMENTED / VALIDATED]

- `Actuel`: `Heads` est implemente. L'Hydra combat avec des tetes scriptes sur le board. Tuer une tete ne suffit pas: si le corps n'est pas touche dans le meme tour, la tete passe en `pending regrow` puis revient; si le corps est touche, la tete est `cauterized` et ne repousse pas.
- `Direction`: garder un boss de priorite de cibles et de tempo, ou le joueur doit partager ses actions entre adds et corps au lieu de juste burst une barre de PV.
- `Contre-jeu`: arbitrer entre tuer une tete, garantir le hit sur le corps dans le meme tour pour la sceller, ou accepter une repousse afin de conserver du degat sur le boss.
- `Phase 2`: une tete centrale supplementaire s'ouvre, ce qui augmente le nombre de lanes a gerer sans changer la logique coeur du combat.
- `UI`: markers `HEAD`, `REGROW`, `SEAR`, preview des tetes qui vont revenir dans l'intent, et presence reelle des tetes sur le board.
- `Moteur/tests`: module dedie dans `src/game/engine/hydra.ts`, adds scriptes `hydra_head_left/right/center`, hooks sur les degats amis dans `effects.ts` et `ink.ts`, tests moteur dans `src/game/__tests__/greek-bosses.test.ts`, checks UI dans `combat-view-helpers.test.ts`.
- `Note de tuning`: la logique marche, mais il faudra surveiller la densite de board en phase 2 et verifier si la tete centrale a `22 HP` cree une vraie escalade sans rendre le fight trop long.
- `Validation`: valide.

### EGYPTIAN

#### `ra_avatar` [IMPLEMENTED / VALIDATED]

- `Actuel`: `Solar Cycle` est implemente. Ra gagne `1 SUN` quand le joueur finit son tour avec de l'ink non depensee, puis `2 SUN` en phase 2. A `SUN 3/3`, son prochain intent est force sur `Divine Scorch`, qui devient `Solar Judgment`: l'action vide toute l'ink restante et ajoute un bonus plat de degats.
- `Direction`: garder un boss qui punit les fins de tour "passives" avec de l'encre gardee, au lieu d'etre juste un autre boss a drain d'ink.
- `Contre-jeu`: depenser l'ink avant end-turn, ou casser `Solar Barrier` pour retirer `1 SUN` et repousser le jugement.
- `Phase 2`: la meme mecanique s'accelere. Ra charge deux fois plus vite au lieu de changer de puzzle.
- `UI`: markers `SUN x/3`, etat `judgment ready`, marker `ECLIPSE` quand la barriere peut encore faire tomber une charge, preview d'intent sur le gain de charge, le drain total d'ink et le bonus de `Solar Judgment`.
- `Moteur/tests`: state dedie dans `src/game/engine/ra-avatar.ts`, hooks sur end-turn et casse de block dans `combat.ts`, `effects.ts` et `ink.ts`, previews/UI dans `enemy-intent-preview.ts` et `combat-view-helpers.tsx`, regressions dans `src/game/__tests__/egyptian-bosses.test.ts` + checks UI.
- `Note de tuning`: les valeurs actuelles sont `3 SUN`, `+10` degats de jugement en phase 1 et `+14` en phase 2. A surveiller si la barriere a `18 BLK` donne trop souvent un "safe reset" ou si, au contraire, le rythme `2 SUN/tour` en phase 2 devient trop rapide pour les decks lents.
- `Validation`: valide.

#### `osiris_judgment` [IMPLEMENTED / VALIDATED]

- `Actuel`: `Scales of Maat` est implemente. Osiris compare les `degats infliges` au `block gagne` pendant le tour joueur. Si l'ecart atteint le seuil (`8` en phase 1, `5` en phase 2), il prepare un verdict correspondant pour sa prochaine action.
- `Direction`: garder un boss de jugement lisible, qui fait vraiment lire la forme du tour joueur au lieu de seulement punir l'ink basse.
- `Contre-jeu`: construire des tours plus equilibres quand possible, ou accepter volontairement un verdict d'attaque ou de defense pour garder le tempo.
- `Phase 2`: les balances deviennent plus strictes et les verdicts montent en violence: plus de degats sur le verdict `ATTACK`, plus de block sur le verdict `BLOCK`, et debuffs plus forts.
- `UI`: marker `MAAT damage/block`, badge de verdict probable, recap du tour en cours, preview d'intent sur le bonus de degats ou le surplus de block/debuffs, et chip de phase 2 sur le seuil qui tombe a `5`.
- `Moteur/tests`: state dedie dans `src/game/engine/osiris-judgment.ts`, hooks sur degats reels et gains de block dans `effects.ts` et `ink.ts`, integration des verdicts dans `boss-mechanics/egyptian.ts`, regressions dans `src/game/__tests__/egyptian-bosses.test.ts` + checks UI.
- `Note de tuning`: les valeurs actuelles sont `threshold 8 -> 5`, `+8/+12` degats sur verdict `ATTACK`, `+12/+18` block sur verdict `BLOCK`, et `2 -> 3` stacks de debuff en phase 2. A surveiller si les decks tres offensifs mangent trop souvent un double `Weak` via `Feather Judgment`, ou si les decks controle peuvent ignorer trop facilement le verdict `BLOCK`.
- `Validation`: valide.

### LOVECRAFTIAN

#### `nyarlathotep_shard` [IMPLEMENTED / VALIDATED]

- `Actuel`: `Prophecy` est implemente. Nyarlathotep revele chaque tour joueur `1` action taboue parmi `DRAW`, `INK`, `ATTACK` et `SKILL`. La premiere fois que le joueur la commet, il ajoute la malediction associee a la pioche (`Haunting Regret`, `Ink Burn`, `Echo Curse` ou `Hexed Parchment`).
- `Direction`: garder un boss de tabou et de reroutage de tour, ou la vraie pression vient de l'action qu'on n'ose pas faire trop tot.
- `Contre-jeu`: lire la prophetie, eviter si possible le verbe interdit, ou accepter volontairement la punition la moins grave pour conserver le tempo du tour.
- `Phase 2`: Nyarlathotep passe a `2` propheties simultanees et fait entrer un `Void Tendril` en support.
- `UI`: markers `OMEN` sur chaque prophetie, etat consomme/non consomme, chips d'intent qui rappellent les propheties encore actives.
- `Moteur/tests`: state dedie dans `src/game/engine/nyarlathotep.ts`, hooks sur pioche volontaire, depense d'encre et cartes `ATTACK/SKILL`, tests dedies dans `src/game/__tests__/lovecraftian-bosses.test.ts` + checks UI dans `src/app/game/_components/combat/combat-view-helpers.test.ts`.
- `Note de tuning`: les punitions actuelles ajoutent `1` carte specifique a la pioche par prophetie declenchee. A surveiller si `DRAW` est trop free pour des decks sans pioche active, ou si `2` propheties en phase 2 enferment trop les decks combo.
- `Validation`: valide.

#### `shub_spawn` [IMPLEMENTED / VALIDATED]

- `Actuel`: `Brood Nest` est implemente. Shub commence desormais le combat avec `1` vrai `Brood Nest` deja sur le board; `Spawn Eruption` sert ensuite a remonter le couvain jusqu'au cap. Chaque nid a un timer visible; s'il atteint `0`, il eclot en `Shoggoth Spawn`. `Eldritch Veil` peut au contraire consommer un nid pour soigner Shub et etendre le poison.
- `Direction`: garder un boss de board pressure et de priorites, ou l'enjeu n'est pas seulement le corps du boss mais aussi le cycle du couvain.
- `Contre-jeu`: tuer les nids a temps, accepter parfois de retarder le body pour ne pas laisser eclore un `Shoggoth Spawn`, ou punir Shub quand il prend un tour de consommation.
- `Phase 2`: Shub peut maintenir `2` nids en meme temps au lieu d'un seul.
- `UI`: marker `BROOD` sur le boss, timer `HATCH` visible sur chaque nid, chips d'intent qui explicitent `nest summon`, `hatch` et `consume`.
- `Moteur/tests`: module dedie dans `src/game/engine/shub-spawn.ts`, entite script-ee `shub_brood_nest`, progression des timers, consommation / eclosion, tests dedies dans `src/game/__tests__/lovecraftian-bosses.test.ts` + checks UI dans `src/app/game/_components/combat/combat-view-helpers.test.ts`.
- `Note de tuning`: il faudra surveiller la durabilite du nid a `18 HP` et le couple `consume heal 12/16` + `poison 4/6`, surtout quand la phase 2 arrive avec deux nids actifs.
- `Validation`: valide.

### AZTEC

#### `tezcatlipoca_echo` [IMPLEMENTED / VALIDATED]

- `Actuel`: `Obsidian Mirror` est implemente. Tezcatlipoca memorise les plus gros plays du tour joueur sous forme d'echos `ATTACK`, `BLOCK`, `INK` ou `HEX`, puis les rejoue a sa prochaine action.
- `Direction`: garder un boss de reflet et de lecture de tempo, ou le joueur doit accepter qu'un gros play laisse une vraie ombre au tour suivant.
- `Contre-jeu`: etaler sa puissance, accepter de nourrir le miroir avec une carte moyenne, ou preparer un tour defensif quand un echo `ATTACK` est stocke.
- `Phase 2`: le miroir passe de `1` slot a `2` slots, ce qui permet de renvoyer deux echos sur la meme action ennemie.
- `UI`: markers `MIRROR` avec famille/valeur stockee, chips d'intent qui explicitent le type d'echo a venir (`mirror damage`, `mirror block`, `Ink Burn`, tax de cout).
- `Moteur/tests`: state dedie dans `src/game/engine/tezcatlipoca.ts`, capture des cartes jouees dans `cards.ts`, replay d'echo dans `boss-mechanics/aztec.ts`, tests dedies dans `src/game/__tests__/aztec-bosses.test.ts` + checks UI dans `src/app/game/_components/combat/combat-view-helpers.test.ts`.
- `Note de tuning`: les valeurs d'echo sont volontairement capees a `12` pour eviter qu'un unique gros play transforme Tez en one-shot. A surveiller si les echos `INK` / `HEX` sont trop discrets face aux echos `ATTACK`.
- `Validation`: valide.

#### `quetzalcoatl_wrath` [IMPLEMENTED / VALIDATED]

- `Actuel`: `Skyfall` est implemente. Quetzalcoatl commence `AIRBORNE`: les hits allies sont capes a `8` degats, mais chaque impact le rapproche de la chute. Une fois le seuil atteint, il passe `GROUNDED`, prend `+50%` degats, et prepare `Solar Dive`.
- `Direction`: garder un boss de rythme, ou il faut alterner des tours de chip pour provoquer la chute puis des tours de burst pendant la fenetre au sol.
- `Contre-jeu`: ne pas jeter un gros single-hit dans le vide; preferer les hits repetes pour forcer `GROUNDED`, puis convertir la fenetre sur `Solar Dive`.
- `Phase 2`: le seuil de knockdown passe de `3` a `2` hits et finir un tour sans l'avoir fait tomber applique `BLEED`.
- `UI`: badge `AIRBORNE / GROUNDED`, compteur `DOWN x/y`, chips de phase 2 sur le seuil reduit et le bleed en cas d'echec, preview `Solar Dive` quand la chute est forcee.
- `Moteur/tests`: state dedie dans `src/game/engine/quetzalcoatl.ts`, modificateur de degats entrants dans `effects.ts` et `ink.ts`, transitions de stance et intent force, tests dedies dans `src/game/__tests__/aztec-bosses.test.ts` + checks UI dans `src/app/game/_components/combat/combat-view-helpers.test.ts`.
- `Note de tuning`: les valeurs actuelles sont `cap 8`, `3 -> 2 hits`, et `+50%` degats au sol. A surveiller si les decks lents sans multi-hit ont trop de mal a ouvrir la fenetre `GROUNDED`.
- `Validation`: valide.

### CELTIC

#### `dagda_shadow` [IMPLEMENTED]

- `Actuel`: `The Cauldron` est implemente. Dagda commence le combat avec un vrai `dagda_cauldron` sur le board. Le chaudron prepare `FEAST` puis `FAMINE` en alternance; chaque action de Dagda fait avancer le brassage, et s'il n'est pas brise a temps il resout son effet puis repart sur la recette suivante.
- `Direction`: garder un boss de priorites de cible, ou la vraie question n'est pas seulement "combien de degats sur le body" mais "quand est-ce que je dois casser le chaudron".
- `Contre-jeu`: arbitrer entre pression sur Dagda et destruction du chaudron avant la resolution. `FEAST` donne soin + force, `FAMINE` ajoute du clog et du `WEAK`.
- `Phase 2`: le chaudron passe en mode pre-charge. Il apparait et se reset a `1/2`, donc les recettes sortent plus vite sans changer la logique coeur.
- `UI`: marker `BREW FEAST/FAMINE progress/2` sur le boss, marker dedie sur le chaudron, chips d'intent sur la resolution a venir (`heal + strength` ou `cards + weak`), chip de phase 2 sur le pre-charge.
- `Moteur/tests`: module dedie dans `src/game/engine/dagda-shadow.ts`, add script-e `dagda_cauldron`, re-summon via `Cauldron Steam`, sync des etats boss/chaudron, tests dedies dans `src/game/__tests__/celtic-bosses.test.ts` + checks UI dans `src/app/game/_components/combat/combat-view-helpers.test.ts`.
- `Note de tuning`: les valeurs actuelles sont `cauldron 20 HP`, `FEAST 14/18 heal + 2/3 strength`, et `FAMINE` qui ajoute `dazed + hexed/binding` avec `WEAK 1 -> 2`. A surveiller si le chaudron est trop facile a casser pour des decks agressifs, ou si le mode pre-charge de phase 2 devient trop oppressant pour des starts lents.

#### `cernunnos_shade` [IMPLEMENTED]

- `Actuel`: `Antler Crown` est implemente. Cernunnos commence avec `3` couches d'andouillers. Tant qu'il en reste, chaque hit ami est cape a `8` degats et retire `1` couche. A `0`, le boss devient `EXPOSED` et subit `+50%` degats.
- `Direction`: garder un boss qui punit surtout le mauvais shape de degats. Les gros single-hits sont dilues dans la couronne; les decks multi-hit ouvrent la vraie fenetre.
- `Contre-jeu`: ne pas jeter un enorme hit frontal dans une couronne intacte; preferer des petits coups repetes pour la denuder, puis convertir la fenetre `EXPOSED`.
- `Phase 2`: Cernunnos invoque `amber_hound` et sa couronne repousse plus vite apres chaque action (`+2` couches au lieu de `+1`).
- `UI`: marker `CROWN x/3`, etat `EXPOSED`, chips d'intent sur `Ancient Wrath` avec scaling `+4/andouiller`, et chip de phase 2 sur la repousse acceleree.
- `Moteur/tests`: module dedie dans `src/game/engine/cernunnos-shade.ts`, modificateur de degats entrants + regrowth hook branches dans `effects.ts` et `ink.ts`, tests dedies dans `src/game/__tests__/celtic-bosses.test.ts` + checks UI dans `src/app/game/_components/combat/combat-view-helpers.test.ts`.
- `Note de tuning`: les valeurs actuelles sont `3` couches, `cap 8`, `Ancient Wrath +4/couche`, `EXPOSED +50%`, et repousse `1 -> 2` en phase 2. A surveiller si la couronne amortit trop les decks lents sans multi-hit, ou si au contraire `EXPOSED` reste trop long a exploiter pour des decks agressifs.

### RUSSIAN

#### `baba_yaga_hut` [IMPLEMENTED / VALIDATED]

- `Actuel`: `The Hut Turns` est implemente. La cabane alterne entre `TEETH`, `BONES` et `HEARTH`. Le joueur doit respectivement jouer `2` attaques, gagner `8` block, ou depenser `2` ink pour eviter la punition de la face courante.
- `Direction`: garder un boss de lecture de tour, ou la bonne reponse depend de la face active plutot que d'une boucle de jeu repetitive.
- `Contre-jeu`: adapter le tour a la face courante au lieu de refaire la meme sequence. `TEETH` force l'attaque, `BONES` force le block, `HEARTH` force l'ink.
- `Phase 2`: sous 50% HP, Baba Yaga invoque `snow_maiden`, la rotation passe a une face par tour ennemi, et une face `CURSE` apparait avec une exigence mixte (`1` attaque, `6` block, `1` ink).
- `UI`: marker de face courante, progression du tour (`ATK / BLK / INK`), preview de la prochaine face, chips d'intent relies aux punitions de la face.
- `Moteur/tests`: state dedie dans `src/game/engine/baba-yaga.ts`, hooks sur attaques / block / ink dans le moteur, tests dedies dans `src/game/__tests__/russian-bosses.test.ts` + checks UI dans `src/app/game/_components/combat/combat-view-helpers.test.ts`.
- `Note de tuning`: seuils actuels lisibles mais encore a surveiller, surtout `BONES 8` et la face `CURSE`, qui peuvent etre trop permissifs pour certains decks defensifs et trop raides pour des starts lents.
- `Validation`: valide.

#### `koschei_deathless` [IMPLEMENTED / VALIDATED]

- `Actuel`: `The Hidden Death` est implemente. Koschei suit la chaine `CHEST -> EGG -> NEEDLE -> BROKEN`. Tant que l'etape `BROKEN` n'est pas atteinte, le boss ne meurt pas vraiment et revient a `1 HP`.
- `Direction`: garder un boss d'immortalite lisible qui force le joueur a quitter le body focus pour aller casser la mort cachee.
- `Contre-jeu`: sortir du tunnel vision sur le boss, casser les vaisseaux dans l'ordre (`Bone Chest`, puis `Black Egg`, puis `Hidden Needle`), puis seulement finir Koschei.
- `Phase 2`: Koschei invoque `koschei_herald`, ajoute une tax de cout au tour suivant, et gagne un `re-seal` unique qui restaure une etape intermediaire une fois avant de laisser la chaine continuer.
- `UI`: markers `IMMORTAL / MORTAL`, preview de l'etape actuelle (`Chest`, `Egg`, `Needle`), chip `reseal pending`, previews specifiques dans l'intent.
- `Moteur/tests`: state dedie dans `src/game/engine/koschei.ts`, objets scriptes, gate de mort, tests dedies dans `src/game/__tests__/russian-bosses.test.ts` avec regressions sur la resurrection a `1 HP`, les cadavres de vaisseaux qui bloquent les slots, et la transition de fin de combat.
- `Note de tuning`: la structure actuelle marche, mais il faut surveiller si le duo `Herald + tax + re-seal` rend la phase 2 trop punitive, ainsi que la durabilite relative `Chest 24 / Egg 18 / Needle 12`.
- `Validation`: valide.

### AFRICAN

#### `soundiata_spirit` [IMPLEMENTED / VALIDATED]

- `Actuel`: `Epic Verses` est implemente. Soundiata deroule des vers visibles `RALLY / SHIELD / WAR`, commence avec `Mask Hunter`, et le joueur peut interrompre chaque vers en infligeant assez de degats a Soundiata ou a son champion.
- `Direction`: garder un boss de commandement lisible, ou l'epopee buffe toute l'armee tant qu'on ne brise pas la recitation.
- `Contre-jeu`: interrompre le vers en focusant le boss ou `Mask Hunter` avant la fin du chapitre, puis arbitrer entre pression sur le body et maintien du board.
- `Phase 2`: `2` vers se chevauchent, mais l'interruption se remplit de gauche a droite: il faut casser le premier avant d'entamer le second.
- `UI`: markers de vers avec chapitre, progression et jauge d'interruption par vers; previews d'intent sur les buffs resolves.
- `Moteur/tests`: state dedie dans `src/game/engine/soundiata-spirit.ts`, ally de depart, interruption sequentielle, tests dedies dans `src/game/__tests__/african-bosses.test.ts` + checks UI dans `src/app/game/_components/combat/combat-view-helpers.test.ts`.
- `Note de tuning`: le shape actuel est nettement meilleur avec `Mask Hunter` des l'ouverture. A surveiller si la phase 2 a `2` vers reste gerable pour les decks lents sans rendre le boss trop "board tax".
- `Validation`: valide.

#### `anansi_weaver` [IMPLEMENTED / VALIDATED]

- `Actuel`: `The Loom` est implemente. Anansi annonce une combinaison libre de types de cartes; l'ordre n'a pas d'importance, et une carte jouee avec de l'encre compte comme son type natif plus `INK`. Completer la combinaison capture la derniere carte jouee et ajoute `Shrouded Omen`, puis aussi `Binding Curse` en phase 2.
- `Direction`: garder un boss de piege et de deck pressure, ou la bonne question est "quelle composition de tour je lui donne" plutot que "dans quel ordre exact je joue".
- `Contre-jeu`: casser volontairement la combinaison avec une carte hors-set, ou accepter de nourrir le metier avec une carte peu importante.
- `Phase 2`: les combinaisons passent a `3` composantes et la completion ajoute un deuxieme outcome.
- `UI`: marker `LOOM`, compteur `WEB`, badge visible sur les cartes capturees quand elles reviennent gelees en main, chips d'intent sur la combinaison active.
- `Moteur/tests`: module dedie dans `src/game/engine/anansi-weaver.ts`, stockage combat-only des cartes capturees, hooks dans `cards.ts` et `deck.ts`, tests dedies dans `src/game/__tests__/african-bosses.test.ts` + checks UI dans `src/app/game/_components/combat/combat-view-helpers.test.ts`.
- `Note de tuning`: la version actuelle se distingue mieux de Medusa depuis le passage a la combinaison libre. A surveiller si la pression `webbed + omen + curse` est suffisante sans rendre la completion purement punitive.
- `Validation`: valide.

## Definition of done pour un boss rework

- un gimmick coeur identifiable en une phrase
- un vrai etat moteur si la mecanique le demande
- un support UI dedie
- un preview propre dans `enemy-intent-preview.ts`
- des tests moteur
- des tests UI
- une note de tuning ajoutee ici une fois la version implementee

## Banque d'idees boss

Idees transverses a garder en tete pour de futurs boss, memes si elles ne sont pas encore assignees a un biome precis:

- `Boss support pur`: un boss qui fait tres peu ou pas de degats directs, mais invoque, protege, soigne ou buffe ses allies jusqu'a rendre le board ingérable.
- `Thorns temporaires`: generation de `THORNS` qui peut tomber, etre casse, expirer, ou etre consommee pour produire un autre effet.
- `Surpioche punitive`: un boss qui force de la pioche supplementaire pour pousser la main vers la limite et exploiter l'exhaust force au-dela de la taille max.
- `Deck pollution`: un boss qui cherche surtout a pourrir le deck avec des `STATUS`, `CURSE` ou cartes mortes plutot qu'a tuer vite.
- `Status uniques de boss`: cartes de statut specifiques a un boss donne, avec un gameplay propre.
- `Punition a la pioche`: status ou maledictions qui infligent des degats, drainent de l'energie, appliquent des debuffs, ou taxent l'ink au moment de la pioche.
- `Boss qui utilise tes cartes`: un boss qui copie, memorise, vole, rejoue ou retourne contre toi certaines cartes ou certains patterns de ton tour.
- `Drain d'energie`: une pression qui ne passe pas par les PV mais par la reduction du nombre d'actions disponibles au tour suivant.
- `controle`: limote le nombre de carte jouable par tour.
- `traitre`: donne des alliés au joueur qui ont des effets de debuff ou qui peuvent se retourner contre lui.

## Ordre de prototype recommande

1. `baba_yaga_hut` + `koschei_deathless` [done]
2. `medusa` + `hydra_aspect` [done]
3. `tezcatlipoca_echo` + `quetzalcoatl_wrath` [done]
4. `ra_avatar` + `osiris_judgment` [done]
5. `fenrir` + `hel_queen` [done]
6. `soundiata_spirit` + `anansi_weaver` [done]
7. `nyarlathotep_shard` + `shub_spawn` [done]
8. `dagda_shadow` + `cernunnos_shade`

## Note

Si on suit ce plan, le vrai changement n'est pas "plus de boss scripts".
Le vrai changement, c'est:

- chaque biome porte 2 fantasies de boss tres differentes
- chaque boss apprend quelque chose de lisible au joueur
- chaque phase 2 devient une escalation du meme duel, pas un simple buff numerique
