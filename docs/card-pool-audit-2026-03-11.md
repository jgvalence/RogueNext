# Card Pool Audit — 2026-03-11

Audit verifie directement sur [src/game/data/cards.ts](/c:/Projects/RogueNext/src/game/data/cards.ts).

## Constats

- Le [card-design-bible.md](/c:/Projects/RogueNext/docs/card-design-bible.md) n'etait plus a jour sur les chiffres du pool.
- Le pool actif actuel contient **221** cartes jouables, pas **230**.
- Le pool jouable total hors `STATUS`/`CURSE` contient **232** cartes, pas **274**.
- Les builds `ink`, `draw` et `exhaust` existent deja dans tous les biomes.
- Une premiere passe de rework a deja sorti plusieurs cartes des clusters generiques:
  `frost_rune_shield`, `written_prophecy`, `titans_wrath`, `scribes_judgment`, `winter_inscription`, `folk_curse`, `cosmic_archive`.
- Une deuxieme passe a termine la couverture biomee des 8 builds avec:
  `curator_pact`, `canopic_ward`, `odin_script`, `philosophers_quill`, `hermes_dash`, `xipe_shield`, `ogham_inscription`, `iron_samovar`, `trickster_snare`, `ink_of_ancestors`.
- Une troisieme passe a commence a poser des signatures de build avec un premier package `weak/thorns`:
  `wild_gale`, `spider_web`, `frost_witch`.
- Une quatrieme passe a casse le noyau rare `GAIN_STRENGTH+GAIN_INK+EXHAUST` avec:
  `epic_saga`, `olympian_scripture`, `void_scripture`, `folk_epic`.
- Une cinquieme passe a casse les noyaux `DRAW+GAIN_INK` et `DRAW+GAIN_INK+GAIN_STRENGTH` avec:
  `ink_surge`, `eye_of_ra`, `book_of_ra`, `scald_cry`, `bardic_verse`, `byliny_verse`, `matryoshka_lore`.
- Une sixieme passe a casse le gros noyau `DAMAGE+DEBUFF` avec:
  `gorgons_gaze`, `madness_spike`, `jaguars_blood`, `frost_nail`, `iron_verse`, `logos_strike`, `kells_strike`, `drum_strike`, `death_scroll`.
- Une septieme passe a casse les gros noyaux `BLOCK` et `BLOCK+DRAW_CARDS` avec:
  `void_shield`, `sacred_papyrus`, `baobab_shield`, `fur_binding`, `fairy_veil`, `sealed_tome`, `shield_of_athena`, `olympian_guard`, `calendric_ward`, `nordic_treatise`.
- Une huitieme passe a casse les noyaux `DRAW+GAIN_INK+HEAL` et `DRAW+HEAL` avec:
  `healing_rhythm`, `cauldron_lore`, `druids_breath`, `herb_lore`, `selkie_song`, `temple_archive`, `osiris_archive`, `funerary_rite`.
- Une neuvieme passe a casse les noyaux `DRAW+GAIN_INK+VULNERABLE` et `AOE VULNERABLE+DRAW` avec:
  `eye_of_ra`, `book_of_ra`, `void_librarian`, `norn_prophecy`, `anansis_web`, `forbidden_index`, `sphinx_riddle`.
- Une dixieme passe a casse les noyaux `AOE VULNERABLE+DAMAGE` et `2-cost BLEED+DAMAGE` avec:
  `sacrificial_word`, `snowstorm_trap`, `morrigan_curse`, `iron_bard`, `koschei_strike`, `buffalo_charge`.
- Une onzieme passe a casse les noyaux `DRAW+EXHAUST+GAIN_INK` et `DRAW+EXHAUST+GAIN_ENERGY` avec:
  `celtic_illumination`, `embalmed_tome`, `pythian_codex`, `ancestor_archive`, `folklore_archive`, `saga_archive`.
- Une douzieme passe a fini le nettoyage des sous-familles defensives restantes avec:
  `annotated_thesis`, `firebird_script`, `sacred_ink_burst`, `illuminated_shield`, `baobab_shield`, `leshy_ward`, `calendric_ward`, `quetzal_shield`, `desert_wisdom`.
- Une treizieme passe a lance `P10` avec un premier payoff reactif `weak/thorns`:
  `folk_epic`.
- Une quatorzieme passe a donne au build `ink` son premier vrai cash-out avec:
  `pythian_codex`.
- Une quinzieme passe a donne au build `discard/clog` son premier vrai cash-out avec:
  `void_scripture`.
- Une seizieme passe a donne au build `exhaust` son premier vrai finisher avec:
  `odin_script`.
- Une dix-septieme passe a donne au build `vulnerable` son premier vrai finisher AOE avec:
  `fates_decree`.
- Une dix-huitieme passe a donne au build `draw` son premier vrai payoff de burst avec:
  `written_prophecy`.
- Une dix-neuvieme passe a donne au build `weak/thorns` sa deuxieme vraie carte marquee simple avec:
  `winter_inscription`.
- Une vingtieme passe a donne au build `discard/clog` sa premiere vraie carte qu'on veut voir etre jetee avec:
  `matryoshka_lore`.
- Une vingt-et-unieme passe a donne au build `ink` un deuxieme vrai spender avec:
  `battle_inscription`.
- Une vingt-deuxieme passe a donne au build `exhaust` un vrai payoff defensif avec:
  `cosmic_archive`.
- Une vingt-troisieme passe a donne au build `draw` sa deuxieme vraie carte marquee combo avec:
  `olympian_scripture`.
- Une vingt-quatrieme passe a donne au build `ink` sa premiere vraie carte marquee a `inkCost` avec:
  `book_of_the_dead`.
- Une vingt-cinquieme passe a donne au build `discard/clog` un vrai replay depuis la discard polluee avec:
  `curator_pact`.
- Une vingt-sixieme passe a donne au build `exhaust` un vrai payoff de scaling durable avec:
  `saga_keeper`.
- Une vingt-septieme passe a lance `P11` avec un script de mesure de cadence sur les signatures les plus importantes:
  `curator_pact`, `saga_keeper`, `book_of_the_dead`, `written_prophecy`, `fates_decree`.
- Une vingt-huitieme passe a ajoute un biais d'offre cible pour remonter la cadence des signatures rares dans les rewards normaux et chez le marchand, sans gonfler les rewards elite:
  `written_prophecy`, `curator_pact`, `saga_keeper`, `book_of_the_dead`, `fates_decree`.
- La regle "au moins 1 carte active non-bestiary par biome pour chacun des 8 tags" est maintenant satisfaite.
- Les gros noyaux `BLOCK+GAIN_INK`, `GAIN_STRENGTH+GAIN_INK+EXHAUST`, `DRAW+GAIN_INK`, `DRAW+GAIN_INK+GAIN_STRENGTH`, `DAMAGE+DEBUFF`, `BLOCK`, `BLOCK+DRAW_CARDS`, `BLOCK+DRAW+GAIN_INK` et `BLOCK+HEAL` ont maintenant ete casses.
- L'audit brut ne remonte plus de hotspot de similarite `>= 3 cartes`; les prochaines passes doivent donc se faire build par build plutot que signature par signature.

## Totaux reels

| Segment | Neutral | Scribe | Bibliothecaire | Total |
| --- | --- | --- | --- | --- |
| Collection jouable | 41 | 97 | 94 | 232 |
| Pool actif | 41 | 91 | 89 | 221 |

## Repartition reelle par biome

### Collection jouable

| Biome | Neutral | Scribe | Bibliothecaire | Total |
| --- | --- | --- | --- | --- |
| LIBRARY | 1 | 16 | 15 | 32 |
| VIKING | 5 | 10 | 10 | 25 |
| GREEK | 5 | 10 | 10 | 25 |
| EGYPTIAN | 5 | 10 | 10 | 25 |
| LOVECRAFTIAN | 5 | 10 | 10 | 25 |
| AZTEC | 5 | 11 | 9 | 25 |
| CELTIC | 5 | 10 | 10 | 25 |
| RUSSIAN | 5 | 10 | 10 | 25 |
| AFRICAN | 5 | 10 | 10 | 25 |

### Pool actif

| Biome | Neutral | Scribe | Bibliothecaire | Total |
| --- | --- | --- | --- | --- |
| LIBRARY | 1 | 10 | 10 | 21 |
| VIKING | 5 | 10 | 10 | 25 |
| GREEK | 5 | 10 | 10 | 25 |
| EGYPTIAN | 5 | 10 | 10 | 25 |
| LOVECRAFTIAN | 5 | 10 | 10 | 25 |
| AZTEC | 5 | 11 | 9 | 25 |
| CELTIC | 5 | 10 | 10 | 25 |
| RUSSIAN | 5 | 10 | 10 | 25 |
| AFRICAN | 5 | 10 | 10 | 25 |

## Couverture des builds par biome

Le tableau ci-dessous utilise le pool actif **hors bestiaire genere**, pour ne pas masquer les trous du design manuel.

| Biome | Vulnerable | Weak | Poison | Bleed | Ink | Draw | Discard | Exhaust | Manques |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LIBRARY | 2 | 1 | 1 | 1 | 3 | 6 | 1 | 5 | aucun |
| VIKING | 1 | 3 | 1 | 6 | 2 | 7 | 1 | 5 | aucun |
| GREEK | 6 | 4 | 1 | 1 | 4 | 8 | 1 | 5 | aucun |
| EGYPTIAN | 6 | 2 | 5 | 1 | 9 | 7 | 1 | 4 | aucun |
| LOVECRAFTIAN | 7 | 3 | 2 | 2 | 7 | 4 | 7 | 4 | aucun |
| AZTEC | 2 | 3 | 2 | 3 | 8 | 3 | 1 | 2 | aucun |
| CELTIC | 3 | 2 | 6 | 1 | 8 | 11 | 1 | 3 | aucun |
| RUSSIAN | 2 | 7 | 1 | 1 | 5 | 5 | 3 | 3 | aucun |
| AFRICAN | 8 | 2 | 1 | 2 | 7 | 12 | 1 | 4 | aucun |

## Redondances les plus visibles

Ces groupes excluent aussi le bestiaire genere.

Aucun groupe de similarite `>= 3 cartes` n'apparait encore dans l'audit brut au 11 mars 2026.

Les redondances restantes sont maintenant surtout des **paires** de cartes ou des familles conceptuelles:

- plusieurs builds ont encore assez d'`enablers`, mais pas toujours assez de `payoffs` ou de `bridges` vraiment memorables
- `weak/thorns`, `vulnerable`, `draw`, `discard/clog`, `ink` et `exhaust` ont maintenant leurs cartes signature principales; la suite logique n'est plus une passe de structure, mais une passe de `P11` sur cadence, fiabilite et chiffres
- `P11` a maintenant pose la mesure de cadence et un premier tuning systemique des offres; la suite logique est donc un vrai playtest de desirabilite et un tuning numerique plus fin, pas une nouvelle passe de structure

## P11 - Cadence des signatures

Le script [audit-signature-cadence.ts](/c:/Projects/RogueNext/scripts/audit-signature-cadence.ts) mesure aujourd'hui la frequence d'apparition des signatures cibles dans trois sources:

- reward normal
- reward elite
- marchand

### Baseline avant tuning

| Carte | Normal reward | Elite reward | Merchant |
| --- | --- | --- | --- |
| `curator_pact` | `9.35%` | `0%` | `2.13%` |
| `saga_keeper` | `2.27%` | `19.73%` | `0.73%` |
| `book_of_the_dead` | `1.8%` | `33.5%` | `0.38%` |
| `written_prophecy` | `4.98%` | `0%` | `1.88%` |
| `fates_decree` | `1.68%` | `25.5%` | `0.68%` |

Lecture:

- les rewards elite etaient deja corrects pour les rares signature
- les rewards normaux et surtout le marchand rendaient les signatures rares trop invisibles

### Apres tuning d'offres

| Carte | Normal reward | Elite reward | Merchant |
| --- | --- | --- | --- |
| `curator_pact` | `9.35%` | `0%` | `3.62%` |
| `saga_keeper` | `5.7%` | `19.73%` | `3.08%` |
| `book_of_the_dead` | `5.97%` | `33.5%` | `3.95%` |
| `written_prophecy` | `7.88%` | `0%` | `3.8%` |
| `fates_decree` | `5.78%` | `25.5%` | `2.05%` |

Lecture:

- `ELITE_REWARD` n'a pas ete touche
- les signatures rares sont maintenant nettement plus visibles en reward normal
- le marchand peut enfin proposer ces cartes a une frequence credible sans les transformer en auto-offers

## Directions de rework

- Cluster `BLOCK`
  garder 1 baseline pure maximum, puis convertir les autres en cartes de controle, setup, ou survie conditionnelle
- Cluster `DRAW+GAIN_INK`
  ne pas laisser plusieurs simples moteurs de cycle;
  chaque version doit mener soit a combo, soit a sustain, soit a un cout/cachet particulier
- Cluster `DAMAGE+DEBUFF`
  chaque build doit avoir son payoff propre;
  les versions `apply X + hit` doivent rester des enablers, pas des cartes marquee
- Build `weak/thorns`
  `folk_epic` a pose le payoff reactif et `winter_inscription` a pose le payoff simple;
  la prochaine etape n'est plus urgente et viendra plutot d'un troisieme angle plus tempo si le build en a encore besoin
- Build `ink`
  `pythian_codex` est maintenant un vrai payoff de depense d'encre, `battle_inscription` un vrai spender defensif, et `book_of_the_dead` une vraie carte marquee a `inkCost`;
  la prochaine etape n'est plus urgente et viendra plutot d'un second angle `inkCost` si le build en a besoin
- Build `discard/clog`
  `void_scripture` est maintenant un vrai payoff de conversion du clog, `matryoshka_lore` une vraie carte qu'on veut voir etre jetee, et `curator_pact` un vrai replay depuis la discard polluee;
  la prochaine etape n'est plus urgente et viendra plutot d'un angle plus durable ou d'une pollution adverse si besoin
- Build `exhaust`
  `odin_script` est maintenant un vrai payoff offensif de pile epuisee, `cosmic_archive` un vrai payoff defensif, et `saga_keeper` un vrai payoff de scaling durable;
  la prochaine etape n'est plus urgente et viendra plutot d'un bridge plus transverse si besoin
- Build `vulnerable`
  `fates_decree` est maintenant un vrai payoff de fermeture AOE;
  la prochaine etape est plutot d'ajouter un payoff plus mobile ou une carte de spread/rebond moins terminale
- Build `draw`
  `written_prophecy` est maintenant un vrai payoff de burst indexe sur la pioche du tour et `olympian_scripture` une vraie carte `sequence/combo`;
  la prochaine etape est plutot d'ajouter plus tard un angle encore plus gratuit ou de duplication de tour si le build en a besoin

## Lecture design

- Oui, ton intuition fait du sens: il faut distinguer **signature de biome** et **accessibilite transversale des builds**.
- Aujourd'hui, les signatures de biome existent deja assez bien.
- La couche "chaque biome donne au moins une porte d'entree a chaque build" est maintenant satisfaite sur le pool actif manuel.
- Le prochain vrai sujet n'est plus la couverture, mais la **qualite** des routes de deck:
  il faut maintenant surtout verifier en playtest que les nouvelles signatures sont assez fiables et assez desirables sans devenir auto-picks.

## Regles proposees pour la prochaine passe

- Garder **2 a 3 builds signatures** par biome, avec une densite plus forte que les autres.
- Garantir **au moins 1 carte active non-bestiary** par biome pour chacun des 8 tags: `vulnerable`, `weak`, `poison`, `bleed`, `ink`, `draw`, `discard`, `exhaust`.
- Limiter les duplications exactes de signature mecanique a **2 cartes max** dans le pool manuel global, sauf cycles volontaires tres explicites.
- Reserver le bestiaire genere a des cartes-template simples, et faire porter la vraie personnalite du biome par les cartes manuelles.
- Les cartes qui ameliorent une carte en main ne doivent jamais pouvoir s'ameliorer elles-memes pendant leur propre resolution.

## Commande utile

Les scripts [audit-card-pool.ts](/c:/Projects/RogueNext/scripts/audit-card-pool.ts) et [audit-signature-cadence.ts](/c:/Projects/RogueNext/scripts/audit-signature-cadence.ts) permettent de regenerer l'audit:

```bash
npm run audit:cards
npm run audit:signatures
```
