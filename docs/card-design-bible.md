# Card Design Bible â€” RogueNext

> **Document de rÃ©fÃ©rence** pour la conception des cartes par personnage et par biome.
> Consulter ce fichier avant toute implÃ©mentation pour rester cohÃ©rent.

---

## 1. RÃ¨gles GÃ©nÃ©rales

### Structure d'une carte (CardDefinition)

```
id:           string â€” snake_case anglais (ex: "heavy_strike")
name:         string â€” anglais dans cards.ts, franÃ§ais dans fr.ts
type:         ATTACK | SKILL | POWER
energyCost:   0â€“3
targeting:    SINGLE_ENEMY | ALL_ENEMIES | SELF
rarity:       COMMON | UNCOMMON | RARE
description:  anglais, fidÃ¨le aux effets rÃ©els
effects:      Effect[]
onRandomDiscardEffects?: Effect[]
inkedVariant: null | { description, effects, inkMarkCost: 2â€“3 }
upgrade:      null | { description, effects, onRandomDiscardEffects?, energyCost? }
biome:        BiomeType
```

Mise a jour schema reel au 12 mars 2026:

- `type` reel: `ATTACK` | `SKILL` | `POWER` | `STATUS` | `CURSE`
- `inkCost` fait partie du schema reel, en plus de `energyCost`
- `targeting` reel: `SINGLE_ENEMY` | `ALL_ENEMIES` | `SELF` | `SINGLE_ALLY` | `ALL_ALLIES`
- `rarity` reelle: `STARTER` | `COMMON` | `UNCOMMON` | `RARE`
- `onRandomDiscardEffects` existe pour les cartes qui veulent etre recompensees quand elles sont jetees par `FORCE_DISCARD_RANDOM`
- `isCollectible: false` retire une carte du pool actif, sans la sortir forcement de la collection

### Effets disponibles (EffectType)

| Effet                         | Usage                                 |
| ----------------------------- | ------------------------------------- |
| `DAMAGE`                      | DÃ©gÃ¢ts selon targeting                |
| `BLOCK`                       | Bloque les dÃ©gÃ¢ts du tour             |
| `HEAL`                        | Restaure des PV                       |
| `DRAW_CARDS`                  | Pioche X cartes                       |
| `GAIN_ENERGY`                 | +X Ã©nergie ce tour                    |
| `GAIN_INK`                    | +X encre                              |
| `GAIN_STRENGTH`               | +X Force permanente                   |
| `APPLY_DEBUFF`                | Applique buff/debuff (voir liste)     |
| `EXHAUST`                     | Exhauste la carte                     |
| `ADD_CARD_TO_DISCARD`         | Ajoute une carte statut Ã  la dÃ©fausse |
| `UPGRADE_RANDOM_CARD_IN_HAND` | AmÃ©liore une carte alÃ©atoire en main  |
| `DAMAGE_EQUAL_BLOCK`          | DÃ©gÃ¢ts = block actuel                 |
| `DAMAGE_PER_CURRENT_INK`      | DÃ©gÃ¢ts selon l'encre actuelle, puis vide l'encre |
| `DAMAGE_PER_CLOG_IN_DISCARD`  | DÃ©gÃ¢ts selon les statuts/malÃ©dictions en dÃ©fausse |
| `DAMAGE_PER_EXHAUSTED_CARD`   | DÃ©gÃ¢ts selon les cartes dÃ©jÃ  Ã©puisÃ©es |
| `DAMAGE_PER_DRAWN_THIS_TURN`  | DÃ©gÃ¢ts selon le nombre de cartes piochÃ©es ce tour |

| `RETRIGGER_THORNS_ON_WEAK_ATTACK` | Les Epines se redeclenchent contre un attaquant Affaibli |
| `BLOCK_PER_CURRENT_INK` | Armure selon l'encre actuelle, puis vide l'encre |
| `BLOCK_PER_EXHAUSTED_CARD` | Armure selon les cartes deja epuisees |
| `APPLY_BUFF_PER_EXHAUSTED_CARD` | Buff selon les cartes deja epuisees |
| `MOVE_RANDOM_NON_CLOG_DISCARD_TO_HAND` | Remonte une vraie carte depuis une defausse polluee |

### Buffs/Debuffs disponibles (BuffType)

Etat reel engine au 12 mars 2026 pour les effets:

| Famille | Effets |
| ------- | ------ |
| Core combat | `DAMAGE`, `BLOCK`, `HEAL`, `DRAW_CARDS`, `GAIN_ENERGY`, `GAIN_INK`, `GAIN_STRENGTH`, `GAIN_FOCUS`, `APPLY_BUFF`, `APPLY_DEBUFF`, `EXHAUST` |
| Payoff / conversion | `DAMAGE_EQUAL_BLOCK`, `DOUBLE_POISON`, `DAMAGE_PER_DEBUFF`, `DAMAGE_PER_CURRENT_INK`, `DAMAGE_PER_CLOG_IN_DISCARD`, `DAMAGE_PER_EXHAUSTED_CARD`, `DAMAGE_PER_DRAWN_THIS_TURN`, `BLOCK_PER_CURRENT_INK`, `BLOCK_PER_DEBUFF`, `BLOCK_PER_EXHAUSTED_CARD`, `APPLY_BUFF_PER_DEBUFF`, `APPLY_BUFF_PER_EXHAUSTED_CARD`, `RETRIGGER_THORNS_ON_WEAK_ATTACK`, `DRAIN_INK` |
| Clog / disruption | `ADD_CARD_TO_DRAW`, `ADD_CARD_TO_DISCARD`, `MOVE_RANDOM_NON_CLOG_DISCARD_TO_HAND`, `FREEZE_HAND_CARDS`, `NEXT_DRAW_TO_DISCARD_THIS_TURN`, `DISABLE_INK_POWER_THIS_TURN`, `INCREASE_CARD_COST_THIS_TURN`, `INCREASE_CARD_COST_NEXT_TURN`, `REDUCE_DRAW_THIS_TURN`, `REDUCE_DRAW_NEXT_TURN`, `FORCE_DISCARD_RANDOM` |
| Utility / setup | `DAMAGE_BONUS_IF_UPGRADED_IN_HAND`, `UPGRADE_RANDOM_CARD_IN_HAND` |

Liste reelle des buffs:

- `STRENGTH` Â· `FOCUS` Â· `VULNERABLE` Â· `WEAK` Â· `POISON` Â· `THORNS` Â· `BLEED` Â· `STUN` Â· `STUN_IMMUNITY`

`VULNERABLE` Â· `WEAK` Â· `POISON` Â· `BLEED` Â· `STUN` Â· `STRENGTH` Â· `THORNS`
âš ï¸ **MADNESS n'est pas un BuffType** â€” utiliser VULNERABLE avec flavor "Folie"

### MÃ©caniques spÃ©ciales

- **Perte de PV** (utilisÃ©e par `blood_offering`, `jaguars_blood`) : mÃ©canique existante, flaggÃ©e `LOSE_HP` dans ce doc â€” rÃ©utiliser la mÃªme implÃ©mentation
- **+1 STR/tour** (utilisÃ©e par `ancestral_drum`) : mÃ©canique POWER existante â€” rÃ©utiliser

### Distribution par pool de 10 cartes

| CritÃ¨re | Objectif                                |
| ------- | --------------------------------------- |
| RaretÃ©s | 3â€“4 COMMON Â· 4â€“5 UNCOMMON Â· 2â€“3 RARE    |
| Types   | 3â€“4 ATTACK Â· 4â€“5 SKILL Â· 1â€“2 POWER      |
| CoÃ»ts   | ~60% Ã  1e Â· 1â€“2 Ã  0e/2e Â· 0â€“1 Ã  2e RARE |

### Variante EncrÃ©e

- `inkMarkCost: 2` standard, `3` pour cartes puissantes
- Boost de 30â€“50% par rapport Ã  la version normale
- ~50% des cartes ont une variante encrÃ©e

### Unlock par raretÃ© (rÃ¨gle gÃ©nÃ©rale)

- **COMMON** â†’ `BIOME_FIRST_ENTRY`
- **UNCOMMON** â†’ `BIOME_ELITE_KILLS count:1â€“3`
- **RARE** â†’ `BIOME_BOSS_KILLS count:1â€“2`

### Ce qu'on veut obtenir

- Un pool ou chaque biome a une vraie identite, sans devenir un silo ferme.
- Des decks avec de vraies routes de construction, pas juste une pile de bonnes cartes.
- Des commons qui ouvrent un build, des uncommons qui le stabilisent, des rares qui le font exploser.
- Des cartes marquee qui changent la forme du tour, pas seulement des variantes `+2`.
- Un pool manuel lisible, avec peu de doublons exacts et de vrais ponts entre builds.

### Grille de builds transverses

Rappel de cadrage actuel:

- Les 8 tags audites pour la couverture biomee sont: `vulnerable`, `weak`, `poison`, `bleed`, `ink`, `draw`, `discard`, `exhaust`
- Le build `block / armure` reste important, mais n'entre pas dans la matrice d'audit minimale
- La couverture se juge uniquement sur le pool actif manuel, donc hors bestiary genere

### Liste de builds cibles

| Build | Ce qu'on cherche | Reference / direction |
| ----- | ---------------- | --------------------- |
| `block / armure` | survivre puis convertir la defense en payoff | `bastion_crash`, `shield_of_athena` |
| `poison` | stack, acceleration, propagation, maintien | `venom_echo`, AOE poison |
| `bleed` | attrition offensive puis cash-out | `scribes_judgment`, `final_chapter` |
| `vulnerable` | marquer puis exploiter une cible deja ouverte | `titans_wrath`, `fates_decree` |
| `weak` | casser le tempo adverse et le convertir en defense et riposte | `winter_inscription`, `wild_gale`, `frost_witch` |
| `ink` | produire puis depenser l'encre comme ressource | cartes a `inkCost`, `DRAIN_INK`, `DAMAGE_PER_CURRENT_INK` |
| `draw` | ouvrir une fenetre combo plutot que juste cycler | `written_prophecy`, `DAMAGE_PER_DRAWN_THIS_TURN` |
| `discard / clog` | risque-recompense, pollution, disruption | `curator_pact`, `xipe_shield`, `ogham_inscription` |
| `exhaust` | gros swing court terme contre tempo futur | `odin_script`, `curator_pact` |

- Chaque biome garde **2 a 3 builds signatures** plus denses que le reste.
- En plus de cette signature, chaque biome doit offrir **au moins 1 carte active non-bestiary** pour chacun des tags suivants :
  `vulnerable` Â· `weak` Â· `poison` Â· `bleed` Â· `ink` Â· `draw` Â· `discard` Â· `exhaust`
- Le bestiaire genere ne compte pas pour valider cette couverture.
- Le tag `discard` couvre aussi les cartes de clog / disruption de defausse :
  `ADD_CARD_TO_DISCARD` Â· `FORCE_DISCARD_RANDOM` Â· `NEXT_DRAW_TO_DISCARD_THIS_TURN`
- Hors bestiary, eviter plus de **2 cartes** avec exactement la meme signature mecanique
  (`type + cost + targeting + familles d'effets`), sauf cycle volontaire documente.

### Anatomie d'un build original

- Chaque build doit contenir au moins 4 roles :
  `enabler` (j'applique le statut / la ressource), `scaler` (j'augmente la pression),
  `payoff` (je convertis le build en gros swing), `bridge` (je relie le build a une autre ressource)
- Les **rares** doivent etre en priorite des `payoffs` ou des `bridges`, pas juste des commons avec plus de chiffres.
- Une carte de build originale doit changer la **forme du tour**, pas seulement la valeur numerique.
- Reference actuelle a conserver :
  `bastion_crash` pour le build armure, `venom_echo` pour le build poison

### Payoffs attendus par build

- `block / armure`
  garder un payoff de conversion type `block -> degats`, et eviter d'empiler seulement du block brut
- `poison`
  garder un payoff d'acceleration type `double / triple poison`, puis privilegier propagation, maintien ou conversion
- `bleed`
  il faut au moins un payoff de `cash-out` ou d'execution; eviter de dupliquer `degats + bleed`
- `vulnerable`
  il faut une vraie carte `exploit` qui recompense une cible deja vulnerable, pas seulement plus de stacks
- `weak`
  il faut une carte de controle qui transforme `weak` en tempo ou defense reelle
- `ink`
  utiliser `inkCost` et `DRAIN_INK` comme vraies cartes qui **depensent** l'encre, pas seulement des gains d'encre
- `draw`
  la pioche doit mener a du tempo, de l'upgrade, ou une grosse fenetre combo, pas juste `draw 2`
- `discard`
  la defausse / clog doit etre un vrai build risque-recompense, pas seulement un malus isole
- `exhaust`
  l'epuisement doit servir de monnaie de puissance ou de timing, pas juste de mot-cle de balance

### Anti-redondance pratique

- Dans un meme biome, une seule carte peut rester `baseline pure` pour une signature donnee.
- Si deux cartes partagent deja `type + cout + cible + famille d'effets`, il faut differencier au moins un axe :
  `AOE`, `self-cost`, `exhaust`, `ink spend`, `draw`, `upgrade`, `status injection`, `focus`, `block conversion`
- Les clusters suivants doivent etre casses en priorite quand on refait une passe :
  `BLOCK`, `BLOCK+GAIN_INK`, `DRAW+GAIN_INK`, `DAMAGE+DEBUFF`, `GAIN_STRENGTH+GAIN_INK+EXHAUST`
- Une bonne rework ne consiste pas a changer `8` en `10`, mais a changer le **role** de la carte dans le deck.

### Regles techniques de resolution

- Un effet `UPGRADE_RANDOM_CARD_IN_HAND` ne peut jamais cibler la carte en train de se resoudre.
- Donc une carte `upgrade + exhaust` doit toujours ameliorer une **autre** carte en main, ou ne rien faire si elle est seule.
- Un effet `MOVE_RANDOM_NON_CLOG_DISCARD_TO_HAND` ne remonte jamais un `STATUS` ou une `CURSE`; il sert a rejouer les vraies cartes a travers la pollution.
- Les effets `onRandomDiscardEffects` se declenchent seulement sur une vraie defausse aleatoire (`FORCE_DISCARD_RANDOM`), pas sur la defausse de fin de tour.

---

## 2. Profils des Personnages

### Le Scribe (`id: "scribe"`)

- **Pouvoirs Ink** : CALLIGRAPHIE (slot 1) Â· ENCRE_NOIRE (slot 2) Â· SEAL (slot 3)
- **ThÃ¨me** : l'encre comme arme, l'Ã©criture active, les mots qui blessent
- **MÃ©canique signature** : gÃ©nÃ©ration d'encre, attaques puissantes, force via Ã©criture
- **ArchÃ©type** : damage dealer + ink builder
- **Ses cartes doivent** : gÃ©nÃ©rer de l'encre OU infliger des debuffs offensifs OU gagner de la Force

### La BibliothÃ©caire (`id: "bibliothecaire"`)

- **Pouvoirs Ink** : VISION (slot 1) Â· INDEX (slot 2) Â· SILENCE (slot 3)
- **ThÃ¨me** : savoir interdit, contrÃ´le, archivage, manipulation
- **MÃ©canique signature** : pioche + debuffs massifs + encre via connaissance
- **ArchÃ©type** : controller + setup
- **Ses cartes doivent** : piocher OU appliquer VULNERABLE/WEAK Ã  TOUS OU soigner OU manipuler la pioche

---

## 3. Profils des Biomes

| Biome        | Vibe                                | MÃ©caniques dominantes                   |
| ------------ | ----------------------------------- | --------------------------------------- |
| LIBRARY      | Atelier, parchemins, encre          | Ink generation, versatile               |
| VIKING       | Saga, combat brutal, runes          | Force scaling, BLEED, WEAK              |
| GREEK        | Philosophie, mythologie, labyrinthe | Debuffs multiples, AOE, VULNERABLE      |
| EGYPTIAN     | HiÃ©roglyphes, dieux, momies         | POISON+BLEED combo, ink sacred          |
| LOVECRAFTIAN | Folie cosmique, pactes interdits    | VULNERABLE (= "Folie"), BLEED, HP-trade |
| AZTEC        | Sacrifice, soleil, sang             | Lose HP for power, POISON, BLEED        |
| CELTIC       | Nature, druides, enluminures        | Heal, POISON, Draw, regen               |
| RUSSIAN      | Contes, froid, rÃ©sistance           | WEAK, Block massif, traps               |
| AFRICAN      | Griots, esprits, rythme             | VULNERABLE combos, Force, storytelling  |

### Signature mecanique par biome (cartes)

| Biome        | Vibe gameplay                          | Mecaniques les plus presentes dans les cartes                                            |
| ------------ | -------------------------------------- | ---------------------------------------------------------------------------------------- |
| LIBRARY      | Polyvalent, base systeme               | **Encre**, **pioche**, attaques simples, debuffs legers, block utilitaire                |
| VIKING       | Pression offensive, runes de guerre    | **BLEED**, **WEAK/faible**, gain de **force**, AOE agressive, block secondaire           |
| GREEK        | Controle tactique, set-up              | **VULNERABLE/faiblesse defense**, debuffs multiples, AOE, pioche de setup, block moyen   |
| EGYPTIAN     | Attrition sacree, maledictions ecrites | **POISON + BLEED**, generation d'**encre**, debuffs, sustain ponctuel (soin/block)       |
| LOVECRAFTIAN | Corruption et risque                   | **VULNERABLE** (folie), **BLEED**, effets de trade (cout HP/exhaust), burst conditionnel |
| AZTEC        | Sacrifice pour puissance               | **Perte de PV -> puissance**, **BLEED**, **POISON**, burst mono-cible, gain de force     |
| CELTIC       | Endurance et tempo nature              | **Soin**, **block/armure**, **pioche**, **POISON** progressif, debuffs defensifs         |
| RUSSIAN      | Controle defensif, usure               | **WEAK/faible**, **block/armure** eleve, debuffs de tempo, pioche utilitaire             |
| AFRICAN      | Rythme, momentum, oralite              | **VULNERABLE** en combo, gain de **force**, **pioche**, **encre**, pression multi-cibles |

---

## 4. Etat Actuel (Collection vs Pool Actif)

> Date de reference verifiee: 11 mars 2026
> Source: `src/game/data/cards.ts` via `npm run audit:cards`
> Audit detaille: `docs/card-pool-audit-2026-03-11.md`

### Collection (page /library/collection)

- Filtre actuel: exclut uniquement `STATUS` et `CURSE`
- Inclut aussi les cartes marquees `isCollectible: false`
- Total affiche: **232** cartes

| Biome        | Neutres |  Scribe | Bibliothecaire | Total Collection |
| ------------ | ------: | ------: | -------------: | ---------------: |
| LIBRARY      |       1 |      16 |             15 |               32 |
| VIKING       |       5 |      10 |             10 |               25 |
| GREEK        |       5 |      10 |             10 |               25 |
| EGYPTIAN     |       5 |      10 |             10 |               25 |
| LOVECRAFTIAN |       5 |      10 |             10 |               25 |
| AZTEC        |       5 |      11 |              9 |               25 |
| CELTIC       |       5 |      10 |             10 |               25 |
| RUSSIAN      |       5 |      10 |             10 |               25 |
| AFRICAN      |       5 |      10 |             10 |               25 |
| **TOTAL**    |  **41** |  **97** |         **94** |          **232** |

### Pool actif (recompenses / marchand)

- Regle metier: `isCollectible !== false`
- Le quota theorique du bible n'est plus parfaitement respecte partout
- Total actif: **221** cartes

| Biome        | Neutres | Scribe | Bibliothecaire | Total Actif |
| ------------ | ------: | -----: | -------------: | ----------: |
| LIBRARY      |       1 |     10 |             10 |          21 |
| VIKING       |       5 |     10 |             10 |          25 |
| GREEK        |       5 |     10 |             10 |          25 |
| EGYPTIAN     |       5 |     10 |             10 |          25 |
| LOVECRAFTIAN |       5 |     10 |             10 |          25 |
| AZTEC        |       5 |     11 |              9 |          25 |
| CELTIC       |       5 |     10 |             10 |          25 |
| RUSSIAN      |       5 |     10 |             10 |          25 |
| AFRICAN      |       5 |     10 |             10 |          25 |
| **TOTAL**    |  **41** |  **91** |         **89** |         **221** |

### Couverture actuelle des builds (pool actif hors bestiary)

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

### Etat design au 12 mars 2026

- La couverture minimale des builds audites est maintenant satisfaite dans tous les biomes.
- Les gros clusters de similarite ont ete casses; l'audit brut ne remonte plus de hotspot `>= 3 cartes` partageant la meme signature.
- Le prochain sujet n'est plus la couverture brute ni la casse de signatures, mais la qualite des routes de deck build par build.
- Reworks de reference recents:
  `annotated_thesis`, `firebird_script`, `sacred_ink_burst`, `illuminated_shield`, `baobab_shield`, `leshy_ward`, `calendric_ward`, `quetzal_shield`, `desert_wisdom`, `frost_rune_shield`, `written_prophecy`, `titans_wrath`, `scribes_judgment`, `winter_inscription`, `wild_gale`, `spider_web`, `frost_witch`, `epic_saga`, `olympian_scripture`, `void_scripture`, `folk_epic`, `ink_surge`, `eye_of_ra`, `book_of_ra`, `void_librarian`, `norn_prophecy`, `anansis_web`, `forbidden_index`, `sphinx_riddle`, `sacrificial_word`, `snowstorm_trap`, `morrigan_curse`, `iron_bard`, `koschei_strike`, `buffalo_charge`, `celtic_illumination`, `embalmed_tome`, `pythian_codex`, `ancestor_archive`, `folklore_archive`, `saga_archive`, `scald_cry`, `bardic_verse`, `byliny_verse`, `matryoshka_lore`, `gorgons_gaze`, `madness_spike`, `jaguars_blood`, `frost_nail`, `iron_verse`, `logos_strike`, `kells_strike`, `drum_strike`, `death_scroll`, `void_shield`, `sacred_papyrus`, `fur_binding`, `fairy_veil`, `sealed_tome`, `shield_of_athena`, `olympian_guard`, `nordic_treatise`, `healing_rhythm`, `cauldron_lore`, `druids_breath`, `herb_lore`, `selkie_song`, `temple_archive`, `osiris_archive`, `funerary_rite`, `folk_curse`, `cosmic_archive`, `curator_pact`, `canopic_ward`, `odin_script`, `philosophers_quill`, `hermes_dash`, `xipe_shield`, `ogham_inscription`, `iron_samovar`, `trickster_snare`, `ink_of_ancestors`, `final_chapter`

### TODO / Priorites de travail

| Priorite | Statut | Chantier | Cible concrete |
| -------- | ------ | -------- | -------------- |
| `P0` | `DONE` | couverture minimale des 8 builds dans tous les biomes | termine |
| `P0` | `DONE` | premiere branche `weak/thorns` | `wild_gale`, `spider_web`, `frost_witch` |
| `P1` | `DONE` | casser le noyau rare `GAIN_STRENGTH+GAIN_INK+EXHAUST` | `epic_saga`, `olympian_scripture`, `void_scripture`, `folk_epic` |
| `P2` | `DONE` | casser le noyau `DRAW+GAIN_INK` puis `DRAW+GAIN_INK+GAIN_STRENGTH` | `ink_surge`, `eye_of_ra`, `book_of_ra`, `scald_cry`, `bardic_verse`, `byliny_verse`, `matryoshka_lore` |
| `P3` | `DONE` | casser les attaques `DAMAGE+DEBUFF` trop plates | `gorgons_gaze`, `madness_spike`, `jaguars_blood`, `frost_nail`, `iron_verse`, `logos_strike`, `kells_strike`, `drum_strike`, `death_scroll` |
| `P4` | `DONE` | finir les familles defensives derivees de `BLOCK` | `annotated_thesis`, `firebird_script`, `calendric_ward`, `sacred_ink_burst`, `illuminated_shield`, `quetzal_shield`, `baobab_shield`, `desert_wisdom`, `leshy_ward` |
| `P5` | `DONE` | casser les supports trop plats `DRAW+GAIN_INK+HEAL` puis `DRAW+HEAL` | `healing_rhythm`, `cauldron_lore`, `druids_breath`, `herb_lore`, `selkie_song`, `temple_archive`, `osiris_archive`, `funerary_rite` |
| `P6` | `DONE` | casser le paquet `DRAW+GAIN_INK+VULNERABLE` puis `AOE VULNERABLE+DRAW` | `eye_of_ra`, `book_of_ra`, `void_librarian`, `norn_prophecy`, `anansis_web`, `forbidden_index`, `sphinx_riddle` |
| `P7` | `DONE` | casser les attaques `AOE VULNERABLE+DAMAGE` puis `2-cost BLEED+DAMAGE` | `sacrificial_word`, `snowstorm_trap`, `morrigan_curse`, `iron_bard`, `koschei_strike`, `buffalo_charge` |
| `P8` | `DONE` | casser les noyaux `DRAW+EXHAUST+GAIN_INK` et `DRAW+EXHAUST+GAIN_ENERGY` | `celtic_illumination`, `embalmed_tome`, `pythian_codex`, `ancestor_archive`, `folklore_archive`, `saga_archive` |
| `P9` | `DONE` | audit build par build des cartes signature | matrice `enabler / scaler / payoff / bridge / filler` pour `vulnerable`, `weak/thorns`, `poison`, `bleed`, `ink`, `draw`, `discard`, `exhaust` |
| `P10` | `DONE` | poser les cartes signature encore trop faibles | phase 1 `weak/thorns`, phase 2 `ink`, phase 3 `discard/clog`, phase 4 `exhaust`, phase 5 `vulnerable`, phase 6 `draw`, phase 7 `weak/thorns` suivi, phase 8 `discard/clog` suivi, phase 9 `ink` suivi, phase 10 `exhaust` suivi, phase 11 `draw` suivi, phase 12 `inkCost`, phase 13 `discard/clog` replay, phase 14 `exhaust` durable |
| `P11` | `IN PROGRESS` | playtests et tuning build par build | phase 1 audit de cadence, phase 2 biais d'offre cible, phase 3 playtests manuels sur `curator_pact`, `saga_keeper`, `book_of_the_dead`, `written_prophecy`, `fates_decree` |

- Resultat de `P2`:
  les noyaux bruts `DRAW+GAIN_INK` et `DRAW+GAIN_INK+GAIN_STRENGTH` ont disparu de l'audit
  il reste en revanche un package plus etroit `DRAW+GAIN_INK+VULNERABLE`
  (`eye_of_ra`, `book_of_ra`, `void_librarian`, `norn_prophecy`) a surveiller plus tard si ce sous-build devient trop uniforme

- Resultat de `P3`:
  les gros noyaux `ATTACK|1|SINGLE_ENEMY|APPLY_DEBUFF + DAMAGE` ont disparu des hotspots
  les attaques de statut sont maintenant reparties entre `bridge` (`logos_strike`, `kells_strike`, `drum_strike`, `madness_spike`, `jaguars_blood`)
  et `payoff` (`frost_nail`, `iron_verse`, `death_scroll`)
  il reste seulement deux sous-familles plus etroites a surveiller plus tard:
  `ATTACK|1|ALL_ENEMIES|APPLY_DEBUFF:VULNERABLE+DAMAGE` et `ATTACK|2|SINGLE_ENEMY|APPLY_DEBUFF:BLEED+DAMAGE`

- Resultat de `P4`:
  les derniers sous-clusters defensifs `BLOCK+DRAW+GAIN_INK`, `BLOCK+GAIN_INK` et `BLOCK+HEAL` ont disparu de l'audit
  la defense est maintenant davantage repartie entre `qualite de main` (`annotated_thesis`),
  `tempo offensif` (`firebird_script`),
  `payoff de debuff` (`calendric_ward`, `leshy_ward`, `desert_wisdom`),
  `setup de statut` (`quetzal_shield`, `sacred_ink_burst`)
  et `sustain / riposte` (`illuminated_shield`, `baobab_shield`, `fairy_veil`, `nordic_treatise`)
  l'audit brut n'affiche plus de hotspot de similarite `>= 3 cartes`

- Resultat de `P5`:
  les noyaux `DRAW+GAIN_INK+HEAL` et `DRAW+HEAL` ont disparu de l'audit
  le sustain est maintenant davantage reparti entre `tempo offensif` (`healing_rhythm`, `funerary_rite`),
  `bridge de statut` (`cauldron_lore`, `herb_lore`),
  `qualite de main` (`temple_archive`, `osiris_archive`)
  et `sustain defensif actif` (`druids_breath`, `selkie_song`)

- Resultat de `P6`:
  les noyaux `DRAW+GAIN_INK+VULNERABLE` et `AOE VULNERABLE+DRAW` ont disparu de l'audit
  le package `vulnerable` est maintenant davantage reparti entre `combo quality` (`eye_of_ra`),
  `burst bridge` (`book_of_ra`, `anansis_web`),
  `focus-backed setup` (`norn_prophecy`, `sphinx_riddle`)
  et `setup a risque / clog` (`void_librarian`, `forbidden_index`)

- Resultat de `P7`:
  les noyaux `AOE VULNERABLE+DAMAGE` et `2-cost BLEED+DAMAGE` ont disparu de l'audit
  les attaques lourdes sont maintenant davantage reparties entre `tempo ressource` (`sacrificial_word`, `snowstorm_trap`),
  `tempo sustain` (`morrigan_curse`),
  `bridge bleed` (`iron_bard`, `buffalo_charge`)
  et `payoff bleed` (`koschei_strike`)

- Resultat de `P8`:
  les noyaux `DRAW+EXHAUST+GAIN_INK` et `DRAW+EXHAUST+GAIN_ENERGY` ont disparu de l'audit
  les bursts `draw + exhaust` sont maintenant davantage repartis entre `setup de statut` (`celtic_illumination`, `embalmed_tome`, `ancestor_archive`),
  `qualite de main` (`pythian_codex`),
  `tempo focus` (`folklore_archive`)
  et `tempo strength` (`saga_archive`)

- Resultat de `P9`:
  le prochain sujet n'est plus "quelles signatures se ressemblent", mais "quels builds ont deja une vraie raison d'exister"
  `poison` et `bleed` ont maintenant un noyau assez lisible
  `weak/thorns` a depuis gagne un payoff reactif et un payoff simple, donc n'est plus bloque sur une seule carte
  `draw`, `vulnerable` et `discard/clog` ont maintenant leurs cartes signature principales
  les deux derniers trous de structure a traiter sont alors `discard/clog` (rejouement depuis la pollution) et `exhaust` (scaling durable)

- Resultat de `P10` phase 1:
  `folk_epic` est devenu le premier vrai payoff declencheur du package `weak/thorns`
  le build `weak/thorns` ne repose plus uniquement sur `frost_witch` pour exister comme branche reactive

- Resultat de `P10` phase 2:
  `pythian_codex` est devenu un vrai cash-out `ink`, avec une depense totale de l'encre en burst cible
  le build `ink` ne repose plus uniquement sur la generation; il a maintenant un payoff lisible et build-around
  l'audit compte desormais les vraies depenses d'encre via `inkCost`, `DRAIN_INK` et `DAMAGE_PER_CURRENT_INK`

- Resultat de `P10` phase 3:
  `void_scripture` est devenu un vrai cash-out `discard/clog`, qui convertit les statuts et maledictions deja accumules en burst cible
  le build `discard/clog` n'est plus seulement un build de cout; il a maintenant une vraie recompense marquee

- Resultat de `P10` phase 4:
  `odin_script` est devenu un vrai payoff `exhaust`, qui convertit la pile d'epuisement en degats immediats
  le build `exhaust` n'est plus un simple mot-cle de cout; il a maintenant un finisher lisible

- Resultat de `P10` phase 5:
  `fates_decree` est devenu un vrai payoff `vulnerable`, avec un finisher AOE qui transforme directement les stacks deja poses en burst
  le build `vulnerable` ne repose plus uniquement sur `titans_wrath`; il a maintenant aussi une carte marquee de fermeture de combat

- Resultat de `P10` phase 6:
  `written_prophecy` est devenu un vrai payoff `draw`, avec un burst indexe sur la pioche du tour et une legere contrainte de disruption
  le build `draw` n'est plus seulement un moteur de fluidite; il a maintenant une carte qui convertit la fenetre combo en degats immediats

- Resultat de `P10` phase 7:
  `winter_inscription` est devenu une vraie carte signature simple du package `weak/thorns`, avec un payoff commun qui convertit directement `Weak` en `Thorns`
  le build `weak/thorns` ne repose plus seulement sur un payoff rare reactif; il a maintenant aussi une carte simple, lisible et build-around

- Resultat de `P10` phase 8:
  `matryoshka_lore` est devenue une vraie carte signature `discard/clog`, avec une recompense directe quand elle est jetee aleatoirement
  le build `discard/clog` ne repose plus seulement sur `void_scripture` comme cash-out; il a aussi une carte qu'on veut vraiment voir passer par la pollution

- Resultat de `P10` phase 9:
  `battle_inscription` est devenue un vrai spender defensif `ink`, qui convertit l'encre stockee en block tout en gardant un angle `upgrade`
  le build `ink` ne repose plus seulement sur un cash-out offensif; il a maintenant aussi une depense defensive lisible

- Resultat de `P10` phase 10:
  `cosmic_archive` est devenue un vrai payoff defensif `exhaust`, qui convertit la pile d'epuisement en block et en focus
  le build `exhaust` ne repose plus seulement sur `odin_script` comme finisher offensif; il a maintenant aussi une vraie fermeture defensive

- Resultat de `P10` phase 11:
  `olympian_scripture` est devenue une vraie carte `draw/sequence`, qui convertit `draw + upgrade` en burst cible et en fenetre de tempo
  le build `draw` ne repose plus seulement sur `written_prophecy`; il a maintenant aussi une deuxieme carte marquee plus combo que purement volumique

- Resultat de `P10` phase 12:
  `book_of_the_dead` est devenue la premiere vraie carte marquee a `inkCost`, avec un swing de setup `0 energie / 2 encre`
  le build `ink` ne repose plus seulement sur des depenses implicites; il a maintenant aussi une vraie carte dont le cout en encre fait partie de l'identite

- Resultat de `P10` phase 13:
  `curator_pact` est devenue la vraie carte de replay `discard/clog`, qui remonte une vraie carte depuis une defausse polluee tout en reinjectant du clog
  le build `discard/clog` ne repose plus seulement sur un cash-out et une carte qu'on veut jeter; il a maintenant aussi une recursion marquee

- Resultat de `P10` phase 14:
  `saga_keeper` est devenue un vrai payoff `exhaust` durable, qui transforme la pile d'epuisement en `Strength` persistante plutot qu'en simple burst
  le build `exhaust` ne repose plus seulement sur `odin_script` et `cosmic_archive`; il a maintenant aussi une carte de scaling long terme

- Resultat de `P11` phase 1:
  le script `audit:signatures` mesure maintenant la frequence d'apparition des cartes signature a suivre dans les rewards et chez le marchand
  baseline mesuree avant tuning:
  `curator_pact` `normal 9.35% / elite 0% / merchant 2.13%`
  `saga_keeper` `normal 2.27% / elite 19.73% / merchant 0.73%`
  `book_of_the_dead` `normal 1.8% / elite 33.5% / merchant 0.38%`
  `written_prophecy` `normal 4.98% / elite 0% / merchant 1.88%`
  `fates_decree` `normal 1.68% / elite 25.5% / merchant 0.68%`
  lecture: les rares signatures restaient trop invisibles en rewards normaux et surtout chez le marchand, alors que les rewards elite etaient deja corrects

- Resultat de `P11` phase 2:
  un biais d'offre cible a ete ajoute pour remonter la cadence des signatures sans toucher aux rewards elite
  `NORMAL_REWARD` booste seulement les signatures du biome courant: `written_prophecy x1.5`, `saga_keeper x2.5`, `book_of_the_dead x3`, `fates_decree x3`
  `MERCHANT` booste les signatures les plus importantes a vendre: `curator_pact x1.75`, `written_prophecy x2.25`, `saga_keeper x4`, `book_of_the_dead x5`, `fates_decree x4`
  `ELITE_REWARD` reste inchange pour ne pas gonfler artificiellement les rares deja bien visibles sur cette source

- Resultat de `P11` phase 3:
  cadence mesuree apres tuning:
  `curator_pact` `normal 9.35% / elite 0% / merchant 3.62%`
  `saga_keeper` `normal 5.7% / elite 19.73% / merchant 3.08%`
  `book_of_the_dead` `normal 5.97% / elite 33.5% / merchant 3.95%`
  `written_prophecy` `normal 7.88% / elite 0% / merchant 3.8%`
  `fates_decree` `normal 5.78% / elite 25.5% / merchant 2.05%`
  lecture: la cadence des signatures rares est maintenant assez visible en reward normal et chez le marchand sans gonfler davantage les elites

- La regle reste la meme:
  ne pas commencer par les chiffres; d'abord corriger le **role** des cartes dans le deck
- Le format de travail a suivre:
  audit **build par build**
  classement `enabler / scaler / payoff / bridge / filler`
  puis rework cible des cartes `filler`

### Regle de signature par build

- Chaque build doit avoir au moins `1 carte signature payoff`
- Chaque build doit avoir au moins `1 carte signature bridge`
- Une bonne carte signature doit faire dire:
  "je peux build ma run autour de ca"
- Une carte signature doit changer la forme du tour, pas juste etre une carte plus efficace

### Wishlist par build

| Build | Carte signature payoff voulue | Carte signature bridge voulue |
| ----- | ----------------------------- | ----------------------------- |
| `block / armure` | convertir le block en burst, multi-hit ou AOE | garder/transporter une partie du block ou convertir block -> tempo |
| `poison` | tick immediat, acceleration, propagation sur kill | relier poison a draw, AOE, ou control |
| `bleed` | execution / cash-out / finisher | relier bleed a defense, contre-attaque ou vitesse de tour |
| `vulnerable` | gros burst sur cible deja ouverte | rebond, spread, ou conversion vers un autre build |
| `weak` | punir un ennemi Weak quand il agit | relier Weak a block, thorns, ou card advantage |
| `ink` | depenser toute l'encre ou franchir un seuil d'encre pour scaler | relier ink a exhaust, draw, ou debuff |
| `draw` | grosse combo window / gratuite / duplication de tour | relier draw a upgrade, ink, ou payoff de sequence |
| `discard / clog` | transformer les cartes mortes / curses en avantage reel | relier discard a draw, strength, ou pollution adverse |
| `exhaust` | grosse puissance immediate indexee sur l'exhaust | relier exhaust a ink, discard, ou scaling long terme |

### P9 - Audit build par build

| Build | Enabler(s) actuels | Scaler(s) actuels | Payoff actuel | Bridge actuel | Filler / trou principal | Verdict | Priorite |
| ----- | ------------------ | ----------------- | ------------- | ------------- | ----------------------- | ------- | -------- |
| `vulnerable` | `book_of_ra`, `ancestor_archive`, `snowstorm_trap` | `titans_wrath`, `calendric_ward`, `desert_wisdom`, `fates_decree` | `fates_decree`, `titans_wrath` | `book_of_ra` | il peut encore gagner un payoff plus mobile ou un spread/rebond plus malin, mais le finisher iconique existe maintenant | build maintenant lisible entre setup et fermeture | `MEDIUM` |
| `weak/thorns` | `spider_web`, `quetzal_shield` | `wild_gale`, `leshy_ward`, `frost_witch` | `folk_epic`, `frost_witch`, `winter_inscription` | `wild_gale` | le package a maintenant son payoff rare et son payoff simple; il pourrait encore gagner plus tard un troisieme angle plus tempo, mais ce n'est plus un trou prioritaire | build maintenant lisible entre setup, payoff simple et payoff reactif | `MEDIUM` |
| `poison` | `rune_curse`, `celtic_illumination`, cartes `damage + poison` | `venom_echo` | `venom_echo` | `sacred_ink_burst` | peu de propagation / execution vraiment marquee | build deja coherent et jouable | `MEDIUM` |
| `bleed` | `iron_bard`, `buffalo_charge`, cartes `damage + bleed` | `frost_rune_shield` | `final_chapter`, `scribes_judgment` | `frost_rune_shield` | pourrait encore gagner un payoff non-attaque tres fort | build le plus sain apres `poison` | `LOW` |
| `ink` | `ink_surge`, `book_of_ra` | `pythian_codex`, `battle_inscription`, `book_of_the_dead` | `pythian_codex`, `book_of_the_dead` | `ink_surge` | le build a maintenant un spender offensif, un spender defensif et une vraie carte `inkCost`; il pourrait plus tard gagner un deuxieme angle `inkCost` si besoin, mais ce n'est plus un trou prioritaire | build maintenant lisible entre generation, depense fixe et depense scalable | `LOW` |
| `draw` | `ink_surge`, `annotated_thesis`, `written_prophecy` | `written_prophecy`, `olympian_scripture`, `saga_archive` | `written_prophecy`, `olympian_scripture` | `ink_surge`, `annotated_thesis` | le build a maintenant un burst volumique et une carte `sequence/combo`; il pourrait plus tard gagner une carte vraiment gratuite ou de duplication de tour, mais ce n'est plus un trou prioritaire | build maintenant lisible entre combo upgrade et burst de main | `LOW` |
| `discard / clog` | `matryoshka_lore`, `ink_of_ancestors`, `xipe_shield`, `fur_binding` | `void_scripture`, `matryoshka_lore` | `void_scripture` | `matryoshka_lore`, `curator_pact` | le build a maintenant un cash-out, une carte qu'on veut jeter, et une recursion marquee; la prochaine amelioration viendra plutot d'un angle plus durable ou d'une pollution adverse si besoin | build maintenant lisible entre cash-out, carte jetable et replay depuis la discard | `LOW` |
| `exhaust` | `curator_pact`, `ancestor_archive`, `saga_archive` | `odin_script`, `cosmic_archive`, `saga_keeper` | `odin_script`, `cosmic_archive`, `saga_keeper` | `ancestor_archive`, `saga_archive` | le build a maintenant burst, defense et scaling durable; la prochaine amelioration viendra plutot d'un bridge plus transverse si besoin | build maintenant lisible entre burst, tenue defensive et scaling long terme | `LOW` |

### Lecture P10

- `weak/thorns` a maintenant aussi une carte signature simple avec `winter_inscription`; la branche n'est plus dependante d'un seul payoff rare.
- `ink` a maintenant un vrai cash-out avec `pythian_codex`, un spender defensif avec `battle_inscription` et une vraie carte marquee a `inkCost` avec `book_of_the_dead`; la prochaine amelioration viendra plutot d'un second angle `inkCost` si le build en a un jour besoin.
- `discard / clog` a maintenant un vrai cash-out avec `void_scripture`, une vraie carte qu'on veut jeter avec `matryoshka_lore`, et un vrai replay depuis une defausse polluee avec `curator_pact`; la prochaine amelioration viendra plutot d'un angle plus durable ou d'une pollution adverse si besoin.
- `exhaust` a maintenant un vrai finisher avec `odin_script`, un payoff defensif avec `cosmic_archive` et un payoff durable avec `saga_keeper`; la prochaine amelioration viendra plutot d'un bridge plus transverse si le build en a encore besoin.
- `vulnerable` a maintenant son finisher iconique avec `fates_decree`; la prochaine amelioration viendra plutot d'une carte de spread/rebond plus maligne ou d'un payoff moins terminal.
- `draw` a maintenant son payoff de burst avec `written_prophecy` et sa carte `sequence/combo` avec `olympian_scripture`; la prochaine amelioration viendra plutot d'un angle plus gratuit ou de duplication de tour si besoin.
- `P11` a maintenant pose la mesure de cadence et un premier tuning systemique des offres; les prochaines priorites sont donc des playtests manuels et du tuning numerique, surtout sur `curator_pact`, `saga_keeper`, `book_of_the_dead`, `written_prophecy` et `fates_decree`.

### Cartes signature actuelles retenues

| Build | Role | Carte | Biome | Effet cle actuel |
| ----- | ---- | ----- | ----- | ---------------- |
| `vulnerable` | `payoff` | `fates_decree` | `GREEK` | `Deal 3 damage to ALL enemies. Deal 3 damage per Vulnerable on enemies. Exhaust.` |
| `vulnerable` | `bridge` | `book_of_ra` | `EGYPTIAN` | `Gain 2 ink. Draw 1 card. Apply 2 Vulnerable. Gain 1 Strength.` |
| `weak/thorns` | `payoff` | `folk_epic` | `RUSSIAN` | `Gain 6 block. Gain 2 Thorns. Weak attackers trigger your Thorns 1 extra time this combat. Exhaust.` |
| `weak/thorns` | `bridge` | `wild_gale` | `CELTIC` | `Draw 1 card. Gain 1 Thorns per Weak on enemies.` |
| `poison` | `payoff` | `venom_echo` | `LIBRARY` | `Double Poison on target. Exhaust.` |
| `poison` | `bridge` | `sacred_ink_burst` | `EGYPTIAN` | `Gain 3 ink. Gain 6 block. Deal 2 damage per Poison on target.` |
| `bleed` | `payoff` | `final_chapter` | `LIBRARY` | `Deal 10 damage. Deal 4 damage per Bleed on target. Exhaust.` |
| `bleed` | `bridge` | `frost_rune_shield` | `VIKING` | `Gain 5 block. Gain 2 block per Bleed on enemies.` |
| `ink` | `payoff` | `pythian_codex` | `GREEK` | `Deal 4 damage per current Ink to target. Upgrade 1 random card in hand. Drain all Ink. Exhaust.` |
| `ink` | `payoff / inkCost` | `book_of_the_dead` | `EGYPTIAN` | `Draw 1 card. Gain 2 Strength. Apply 2 Vulnerable to ALL enemies. Exhaust. (0 energy, 2 ink)` |
| `ink` | `bridge` | `ink_surge` | `LIBRARY` | `Gain 2 Ink. Upgrade 1 random card in hand. Draw 1 card.` |
| `draw` | `payoff` | `written_prophecy` | `GREEK` | `Draw 2 cards. Deal 2 damage. Deal 2 damage per card drawn this turn. Your next draw goes to discard this turn. Exhaust.` |
| `draw` | `payoff / sequence` | `olympian_scripture` | `GREEK` | `Draw 3 cards. Upgrade 1 random card in hand. Gain 1 energy. Deal 4 damage. If you have an upgraded card in hand, deal 8 more damage. Exhaust.` |
| `draw` | `bridge` | `annotated_thesis` | `LIBRARY` | `Gain 6 block. Draw 1 card. Upgrade 1 random card in hand.` |
| `discard / clog` | `payoff` | `void_scripture` | `LOVECRAFTIAN` | `Add 1 Haunting Regret to your discard. Draw 2 cards. Deal 5 damage. Deal 5 damage per Status/Curse in your discard. Exhaust.` |
| `discard / clog` | `bridge / replay` | `curator_pact` | `LIBRARY` | `Gain 1 energy. Return 1 random non-Status/Curse card from your discard to your hand. Add 1 Hexed Parchment to your discard. Exhaust.` |
| `discard / clog` | `bridge / random discard` | `matryoshka_lore` | `RUSSIAN` | `Draw 2 cards. Gain 1 ink. Discard 1 random card. If randomly discarded: gain 1 energy and draw 1 card.` |
| `exhaust` | `payoff` | `odin_script` | `VIKING` | `Deal 8 damage. Deal 3 damage per card in your Exhaust pile. Add 1 Dazed to your discard. Exhaust.` |
| `exhaust` | `payoff / defense` | `cosmic_archive` | `LOVECRAFTIAN` | `Gain 6 block. Gain 3 block per card in your Exhaust pile. Gain 1 Focus. Add 1 Dazed to your discard. Exhaust.` |
| `exhaust` | `payoff / durable` | `saga_keeper` | `VIKING` | `Gain 1 Focus. Gain 1 Strength per card in your Exhaust pile. Draw 1 card. Exhaust.` |
| `exhaust` | `bridge` | `ancestor_archive` | `AFRICAN` | `Draw 2 cards. Gain 1 energy. Apply 1 Vulnerable to ALL enemies. Exhaust.` |

### Piste specifique: `weak -> thorns`

- Direction valide pour rendre `weak` plus interessant qu'un simple debuff defensif
- Role propose:
  `weak` = enabler, `thorns` = bridge, punition a l'impact = payoff
- Premiere passe posee le `11 mars 2026`:
  `wild_gale` = bridge de conversion
  `spider_web` = enabler/bridge hybride
  `frost_witch` = payoff rare
- Hook moteur ajoute:
  `APPLY_BUFF_PER_DEBUFF` pour permettre des bridges du type
  `gain THORNS par WEAK sur les ennemis`
- Cartes posees dans cette premiere passe:
  `wild_gale` = draw 1 + conversion de WEAK en THORNS
  `spider_web` = AOE weak qui nourrit la riposte
  `frost_witch` = payoff rare qui transforme un board Weak en mur de THORNS
- A viser:
  une branche `weak/thorns` forte, mais pas l'unique identite du build `weak`
- Exemples de cartes a viser:
  une carte `apply Weak + gain Thorns`
  une carte `enemies Weak trigger extra Thorns`
  une carte `gain Block or draw when a Weak enemy attacks`
- Garde-fous:
  preferer `Thorns temporaires`, `une fois par tour`, ou `sur ennemi Weak uniquement`
  eviter les boucles passives trop automatiques

### Bestiaire

- Cartes bestiaire visibles en Collection: **40**
- Cartes bestiaire actives (collectibles): **40**
- Les trous de couverture build doivent etre juges **hors bestiaire genere**

> Les sections 5 a 12 restent surtout un document d'intention biome par biome.
> Elles ne sont pas garanties synchronisees carte par carte avec `cards.ts`.
> La source de verite actuelle pour les regles globales et l'etat reel du pool est le haut de ce document + l'audit dedie.

---

## 5. VIKING â€” 10 Scribe + 10 BibliothÃ©caire

**Vibe Scribe** : Ã©crire la saga en la vivant, runes-armes, poÃ©sie de bataille
**Vibe BibliothÃ©caire** : Ã©tudier les sagas depuis les archives, dÃ©fense tactique, malÃ©dictions runiques

### VIKING â€” Scribe (3 existantes + 7 nouvelles)

| #   | ID                   | Name (EN)          | Nom (FR)                | Type   | CoÃ»t | RaretÃ©   | Description                                              | Inked                             | Upgrade                   |
| --- | -------------------- | ------------------ | ----------------------- | ------ | ---- | -------- | -------------------------------------------------------- | --------------------------------- | ------------------------- |
| 1   | `berserker_charge`   | _(existante)_      | Charge du Berserker     | ATTACK | 2e   | UNCOMMON | 14 dmg + STR 1                                           | â€”                                 | â€”                         |
| 2   | `rune_strike`        | _(existante)_      | Frappe Runique          | ATTACK | 1e   | COMMON   | 7 dmg + WEAK 1                                           | â€”                                 | â€”                         |
| 3   | `saga_of_blood`      | _(existante)_      | Saga de Sang            | POWER  | 2e   | RARE     | +1 STR/kill                                              | â€”                                 | â€”                         |
| 4   | `iron_verse`         | Iron Verse         | Vers de Fer             | ATTACK | 1e   | COMMON   | Deal 8 dmg. Apply 2 BLEED.                               | 11 dmg + 3 BLEED (cost 2)         | 11 dmg + 2 BLEED          |
| 5   | `frost_rune_shield`  | Frost Rune         | Rune de Givre           | SKILL  | 1e   | COMMON   | Gain 8 block. Apply 1 WEAK.                              | 11 block + 2 WEAK (cost 2)        | 11 block + 1 WEAK         |
| 6   | `scald_cry`          | Scald Cry          | Cri du Scalde           | SKILL  | 1e   | UNCOMMON | Gain 2 ink. Draw 1 card. Gain 1 strength.                | â€”                                 | 3 ink + draw 1 + STR 1    |
| 7   | `rune_storm`         | Rune Storm         | TempÃªte Runique         | ATTACK | 2e   | UNCOMMON | Deal 10 dmg to ALL. Apply 2 BLEED to ALL.                | 14 dmg + 3 BLEED ALL (cost 3)     | 14 dmg + 2 BLEED ALL      |
| 8   | `battle_inscription` | Battle Inscription | Inscription de Bataille | SKILL  | 1e   | UNCOMMON | Gain 5 block. Gain 3 block per current Ink. Upgrade 1 random card in hand. Drain all Ink. | â€” | Gain 7 block. Gain 3 block per current Ink. Upgrade 1 random card in hand. Drain all Ink. |
| 9   | `odin_script`        | Odin's Script      | Runes d'Odin            | SKILL  | 1e   | RARE     | Deal 8 damage. Deal 3 damage per card in your Exhaust pile. Add 1 Dazed to your discard. Exhaust. | â€” | Deal 10 damage. Deal 4 damage per card in your Exhaust pile. Add 1 Dazed to your discard. Exhaust. |
| 10  | `epic_saga`          | Epic Saga          | Ã‰popÃ©e                  | POWER  | 2e   | RARE     | Gain 3 strength. Gain 2 ink. Exhaust.                    | â€”                                 | 3 STR + 3 ink + exhaust   |

### VIKING â€” BibliothÃ©caire (3 existantes + 7 nouvelles)

| #   | ID                | Name (EN)       | Nom (FR)               | Type   | CoÃ»t | RaretÃ©   | Description                                                | Inked                                | Upgrade                              |
| --- | ----------------- | --------------- | ---------------------- | ------ | ---- | -------- | ---------------------------------------------------------- | ------------------------------------ | ------------------------------------ |
| 1   | `shield_wall`     | _(existante)_   | Mur de Boucliers       | SKILL  | 1e   | COMMON   | 10 block                                                   | â€”                                    | â€”                                    |
| 2   | `mjolnir_echo`    | _(existante)_   | Ã‰cho de Mjolnir        | ATTACK | 2e   | UNCOMMON | 8 AOE + WEAK 1 ALL                                         | â€”                                    | â€”                                    |
| 3   | `valkyries_dive`  | _(existante)_   | Plongeon des Walkyries | ATTACK | 1e   | UNCOMMON | 8 dmg. Exhaust.                                            | â€”                                    | â€”                                    |
| 4   | `nordic_treatise` | Nordic Treatise | TraitÃ© Nordique        | SKILL  | 1e   | COMMON   | Gain 6 block. Draw 1 card.                                 | 8 block + draw 2 (cost 2)            | 9 block + draw 1                     |
| 5   | `rune_curse`      | Rune Curse      | MalÃ©diction Runique    | SKILL  | 1e   | UNCOMMON | Apply 2 WEAK to ALL. Apply 1 VULNERABLE to ALL.            | â€”                                    | 2 WEAK ALL + 2 VULN ALL              |
| 6   | `saga_archive`    | Saga Archive    | Archive des Sagas      | SKILL  | 1e   | UNCOMMON | Draw 2 cards. Gain 1 energy. Exhaust.                      | Draw 3 + 2 energy + exhaust (cost 2) | Draw 3 + 1 energy + exhaust          |
| 7   | `norn_prophecy`   | Norn Prophecy   | ProphÃ©tie des Nornes   | SKILL  | 1e   | UNCOMMON | Gain 2 ink. Apply 3 VULNERABLE to target. Draw 1 card.     | â€”                                    | 2 ink + 4 VULN + draw 1              |
| 8   | `ancient_ward`    | Ancient Ward    | Ward Ancestral         | SKILL  | 2e   | UNCOMMON | Gain 14 block. Draw 1 card.                                | 18 block + draw 2 (cost 3)           | 18 block + draw 1                    |
| 9   | `saga_keeper`     | Saga Keeper     | Gardienne des Sagas    | POWER  | 2e   | RARE     | Gain 1 focus. Gain 1 strength per card in your Exhaust pile. Draw 1 card. Exhaust. | -- | Gain 1 focus. Gain 1 strength per card in your Exhaust pile. Draw 2 cards. Exhaust. |
| 10  | `valhalla_codex`  | Valhalla Codex  | Codex du Valhalla      | POWER  | 2e   | RARE     | Gain 2 strength. Apply 2 WEAK to ALL. Gain 2 ink. Exhaust. | â€”                                    | 2 STR + 3 WEAK ALL + 2 ink + exhaust |

---

## 6. GREEK â€” 10 Scribe + 10 BibliothÃ©caire

**Vibe Scribe** : philosophie Ã©crite comme arme, vers Ã©piques, puissance olympienne
**Vibe BibliothÃ©caire** : BibliothÃ¨que d'Alexandrie, oracle, piÃ¨ges labyrinthiques

### GREEK â€” Scribe (2 existantes + 8 nouvelles)

| #   | ID                   | Name (EN)           | Nom (FR)            | Type   | CoÃ»t | RaretÃ©   | Description                             | Inked                             | Upgrade                  |
| --- | -------------------- | ------------------- | ------------------- | ------ | ---- | -------- | --------------------------------------- | --------------------------------- | ------------------------ |
| 1   | `heros_challenge`    | _(existante)_       | DÃ©fi du HÃ©ros       | ATTACK | 1e   | UNCOMMON | â€”                                       | â€”                                 | â€”                        |
| 2   | `olympian_cleave`    | _(existante)_       | Couperet Olympien   | ATTACK | 1e   | UNCOMMON | 6 AOE + VULN 1 ALL                      | â€”                                 | â€”                        |
| 3   | `logos_strike`       | Logos Strike        | Frappe Logos        | ATTACK | 1e   | COMMON   | Deal 8 dmg. Apply 1 VULNERABLE.         | 12 dmg + 2 VULN (cost 2)          | 11 dmg + 1 VULN          |
| 4   | `philosophers_quill` | Philosopher's Quill | Plume du Philosophe | SKILL  | 1e   | COMMON   | Gain 2 ink. Draw 1 card.                | 3 ink + draw 2 (cost 2)           | 3 ink + draw 1           |
| 5   | `epic_simile`        | Epic Simile         | Comparaison Ã‰pique  | ATTACK | 1e   | COMMON   | Deal 5 dmg to ALL. Apply 1 WEAK to ALL. | 7 dmg ALL + 2 WEAK ALL (cost 2)   | 7 dmg ALL + 1 WEAK ALL   |
| 6   | `hermes_dash`        | Hermes Dash         | Ã‰lan d'HermÃ¨s       | ATTACK | 0e   | UNCOMMON | Deal 5 dmg. Gain 1 ink. Exhaust.        | 8 dmg + 2 ink + exhaust (cost 2)  | 7 dmg + 1 ink + exhaust  |
| 7   | `written_prophecy`   | Written Prophecy    | ProphÃ©tie Ã‰crite    | SKILL  | 1e   | UNCOMMON | Draw 2. Deal 2. Deal 2 per card drawn this turn. Next draw to discard. Exhaust. | Draw 3 + 3 dmg + 3 per draw + next draw to discard + exhaust (cost 2) | Draw 3 + 2 dmg + 2 per draw + next draw to discard + exhaust |
| 8   | `titans_wrath`       | Titan's Wrath       | ColÃ¨re des Titans   | ATTACK | 2e   | UNCOMMON | Deal 14 dmg. Apply 2 VULNERABLE.        | 20 dmg + 3 VULN (cost 3)          | 18 dmg + 2 VULN          |
| 9   | `ares_verse`         | Ares Verse          | Vers d'ArÃ¨s         | SKILL  | 1e   | UNCOMMON | Gain 6 block. Gain 2 strength.          | â€”                                 | 8 block + 2 STR          |
| 10  | `olympian_scripture` | Olympian Scripture  | Ã‰criture Olympienne | SKILL  | 2e   | RARE     | Draw 3 cards. Upgrade 1 random card in hand. Gain 1 energy. Deal 4 damage. If you have an upgraded card in hand, deal 8 more damage. Exhaust. | â€” | Draw 4 cards. Upgrade 1 random card in hand. Gain 1 energy. Deal 5 damage. If you have an upgraded card in hand, deal 10 more damage. Exhaust. |

### GREEK â€” BibliothÃ©caire (3 existantes + 7 nouvelles)

| #   | ID                 | Name (EN)        | Nom (FR)              | Type  | CoÃ»t | RaretÃ©   | Description                                     | Inked                             | Upgrade                  |
| --- | ------------------ | ---------------- | --------------------- | ----- | ---- | -------- | ----------------------------------------------- | --------------------------------- | ------------------------ |
| 1   | `labyrinth`        | _(existante)_    | Labyrinthe            | SKILL | 2e   | RARE     | â€”                                               | â€”                                 | â€”                        |
| 2   | `olympian_guard`   | _(existante)_    | Garde Olympienne      | SKILL | 1e   | UNCOMMON | â€”                                               | â€”                                 | â€”                        |
| 3   | `gorgons_gaze`     | _(existante)_    | Regard de la Gorgone  | SKILL | 1e   | UNCOMMON | WEAK 2 + VULN 1 target                          | â€”                                 | â€”                        |
| 4   | `oracle_scroll`    | Oracle Scroll    | Parchemin de l'Oracle | SKILL | 1e   | COMMON   | Draw 2 cards. Apply 1 WEAK to target.           | Draw 3 + 2 WEAK (cost 2)          | Draw 2 + 2 WEAK          |
| 5   | `shield_of_athena` | Shield of Athena | Bouclier d'AthÃ©na     | SKILL | 1e   | COMMON   | Gain 10 block.                                  | 14 block (cost 2)                 | 14 block                 |
| 6   | `sphinx_riddle`    | Sphinx Riddle    | Ã‰nigme du Sphinx      | SKILL | 1e   | UNCOMMON | Apply 3 VULNERABLE to ALL. Draw 1 card.         | â€”                                 | 4 VULN ALL + draw 1      |
| 7   | `apollos_archive`  | Apollo's Archive | Archives d'Apollon    | SKILL | 1e   | UNCOMMON | Gain 1 energy. Gain 2 ink.                      | â€”                                 | 1 energy + 3 ink         |
| 8   | `labyrinth_trap`   | Labyrinth Trap   | PiÃ¨ge du Labyrinthe   | SKILL | 1e   | UNCOMMON | Apply 2 WEAK to ALL. Apply 2 VULNERABLE to ALL. | â€”                                 | 3 WEAK ALL + 2 VULN ALL  |
| 9   | `pythian_codex`    | Pythian Codex    | Codex de Pythie       | SKILL | 1e   | RARE     | Deal 4 damage per current Ink. Upgrade 1 random card in hand. Drain all Ink. Exhaust. | â€” | Deal 5 damage per current Ink. Upgrade 1 random card in hand. Drain all Ink. Exhaust. |
| 10  | `fates_decree`     | Fate's Decree    | DÃ©cret des Moires     | ATTACK | 2e   | RARE     | Deal 3 to ALL. Deal 3 per Vulnerable on enemies. Exhaust. | â€” | Deal 5 to ALL. Deal 3 per Vulnerable on enemies. Exhaust. |

---

## 7. EGYPTIAN â€” 10 Scribe + 10 BibliothÃ©caire

**Vibe Scribe** : le scribe hiÃ©roglyphe par excellence â€” encre sacrÃ©e, sorts inscrits, jugement d'Anubis
**Vibe BibliothÃ©caire** : garder les rouleaux interdits, malÃ©dictions de papyrus, sagesse des morts

### EGYPTIAN â€” Scribe (4 existantes + 6 nouvelles)

| #   | ID                  | Name (EN)         | Nom (FR)                     | Type   | CoÃ»t | RaretÃ©   | Description                                     | Inked                              | Upgrade                   |
| --- | ------------------- | ----------------- | ---------------------------- | ------ | ---- | -------- | ----------------------------------------------- | ---------------------------------- | ------------------------- |
| 1   | `anubis_strike`     | _(existante)_     | Frappe d'Anubis              | ATTACK | 1e   | UNCOMMON | 8 dmg + BLEED 2                                 | â€”                                  | â€”                         |
| 2   | `canopic_ward`      | _(existante)_     | Garde Canope                 | SKILL  | 1e   | UNCOMMON | 7 block + 1 ink                                 | â€”                                  | â€”                         |
| 3   | `eye_of_ra`         | _(existante)_     | Å’il de RÃ¢                    | SKILL  | 1e   | RARE     | Draw 3 + 2 ink                                  | â€”                                  | â€”                         |
| 4   | `sand_whip`         | _(existante)_     | Fouet de Sable               | ATTACK | 1e   | COMMON   | 5 dmg ALL                                       | â€”                                  | â€”                         |
| 5   | `hieroglyph_strike` | Hieroglyph Strike | Frappe HiÃ©roglyphe           | ATTACK | 1e   | COMMON   | Deal 8 dmg. Gain 1 ink.                         | 12 dmg + 2 ink (cost 2)            | 11 dmg + 1 ink            |
| 6   | `sacred_papyrus`    | Sacred Papyrus    | Papyrus SacrÃ©                | SKILL  | 1e   | COMMON   | Gain 9 block.                                   | 13 block (cost 2)                  | 13 block                  |
| 7   | `spell_inscription` | Spell Inscription | Inscription de Sort          | ATTACK | 2e   | UNCOMMON | Deal 12 dmg. Apply 3 POISON.                    | 16 dmg + 4 POISON (cost 3)         | 16 dmg + 3 POISON         |
| 8   | `book_of_ra`        | Book of Ra        | Livre de RÃ¢                  | SKILL  | 1e   | UNCOMMON | Gain 3 ink. Draw 2 cards.                       | â€”                                  | 3 ink + draw 3            |
| 9   | `sacred_ink_burst`  | Sacred Ink Burst  | Jaillissement d'Encre SacrÃ©e | SKILL  | 1e   | UNCOMMON | Gain 3 ink. Gain 6 block.                       | 4 ink + 9 block (cost 2)           | 3 ink + 8 block           |
| 10  | `scribes_judgment`  | Scribe's Judgment | Jugement du Scribe           | ATTACK | 2e   | RARE     | Deal 15 dmg. Apply 2 BLEED. Apply 2 VULNERABLE. | 20 dmg + 3 BLEED + 3 VULN (cost 3) | 20 dmg + 2 BLEED + 2 VULN |

### EGYPTIAN â€” BibliothÃ©caire (2 existantes + 8 nouvelles)

| #   | ID                 | Name (EN)        | Nom (FR)               | Type   | CoÃ»t | RaretÃ©   | Description                                                      | Inked                             | Upgrade                              |
| --- | ------------------ | ---------------- | ---------------------- | ------ | ---- | -------- | ---------------------------------------------------------------- | --------------------------------- | ------------------------------------ |
| 1   | `pharaohs_curse`   | _(existante)_    | MalÃ©diction du Pharaon | ATTACK | 2e   | UNCOMMON | 12 dmg + POISON 2 + BLEED 1                                      | â€”                                 | â€”                                    |
| 2   | `solar_hymn`       | _(existante)_    | Hymne Solaire          | POWER  | 1e   | RARE     | â€”                                                                | â€”                                 | â€”                                    |
| 3   | `death_scroll`     | Death Scroll     | Parchemin de Mort      | ATTACK | 1e   | COMMON   | Deal 7 dmg. Apply 3 POISON.                                      | 10 dmg + 4 POISON (cost 2)        | 10 dmg + 3 POISON                    |
| 4   | `mummy_ward`       | Mummy Ward       | Garde de Momie         | SKILL  | 1e   | COMMON   | Gain 8 block. Apply 1 WEAK to ALL.                               | 11 block + 2 WEAK ALL (cost 2)    | 11 block + 1 WEAK ALL                |
| 5   | `plague_of_words`  | Plague of Words  | Plaie de Mots          | ATTACK | 1e   | UNCOMMON | Deal 4 dmg to ALL. Apply 3 POISON to ALL.                        | 6 dmg ALL + 4 POISON ALL (cost 2) | 6 dmg ALL + 3 POISON ALL             |
| 6   | `osiris_archive`   | Osiris Archive   | Archives d'Osiris      | SKILL  | 1e   | UNCOMMON | Draw 2 cards. Heal 3. Gain 1 ink.                                | â€”                                 | Draw 2 + heal 5 + 1 ink              |
| 7   | `funerary_rite`    | Funerary Rite    | Rite FunÃ©raire         | SKILL  | 1e   | UNCOMMON | Heal 6. Apply 1 VULNERABLE to target. Draw 1 card.               | â€”                                 | Heal 8 + 2 VULN + draw 1             |
| 8   | `desert_wisdom`    | Desert Wisdom    | Sagesse du DÃ©sert      | SKILL  | 1e   | UNCOMMON | Gain 9 block. Heal 3.                                            | 12 block + heal 5 (cost 2)        | 12 block + heal 3                    |
| 9   | `embalmed_tome`    | Embalmed Tome    | Tome EmbaumÃ©           | SKILL  | 1e   | RARE     | Gain 4 ink. Draw 2 cards. Exhaust.                               | 5 ink + draw 3 + exhaust (cost 2) | 4 ink + draw 3 + exhaust             |
| 10  | `book_of_the_dead` | Book of the Dead | Livre des Morts        | SKILL  | 0e+2i | RARE   | Draw 1 card. Gain 2 Strength. Apply 2 VULNERABLE to ALL enemies. Exhaust. | â€” | Draw 2 cards. Gain 2 Strength. Apply 3 VULNERABLE to ALL enemies. Exhaust. |

---

## 8. LOVECRAFTIAN â€” 10 Scribe + 10 BibliothÃ©caire

**Vibe Scribe** : scribe qui a Ã©crit des textes interdits et en subit les consÃ©quences â€” encre corrompue
**Vibe BibliothÃ©caire** : gardienne des textes scellÃ©s, connaissance comme arme cosmique

### LOVECRAFTIAN â€” Scribe (3 existantes + 7 nouvelles)

| #   | ID                   | Name (EN)          | Nom (FR)            | Type   | CoÃ»t | RaretÃ©   | Description                                         | Inked                              | Upgrade                              |
| --- | -------------------- | ------------------ | ------------------- | ------ | ---- | -------- | --------------------------------------------------- | ---------------------------------- | ------------------------------------ |
| 1   | `madness_spike`      | _(existante)_      | Pic de DÃ©mence      | ATTACK | 1e   | UNCOMMON | 5 dmg + VULN 2 (flavor: Madness)                    | â€”                                  | â€”                                    |
| 2   | `void_touch`         | _(existante)_      | Toucher du NÃ©ant    | ATTACK | 1e   | UNCOMMON | 10 dmg + BLEED 2                                    | â€”                                  | â€”                                    |
| 3   | `starborn_omen`      | _(existante)_      | PrÃ©sage Stellaire   | ATTACK | 2e   | UNCOMMON | 12 dmg + WEAK 3 ALL                                 | â€”                                  | â€”                                    |
| 4   | `void_quill`         | Void Quill         | Plume du NÃ©ant      | ATTACK | 1e   | COMMON   | Deal 10 dmg. Add 1 Dazed to discard.                | â€”                                  | Deal 13 dmg. Add 1 Dazed to discard. |
| 5   | `cursed_inscription` | Cursed Inscription | Inscription Maudite | ATTACK | 1e   | COMMON   | Deal 6 dmg. Apply 3 POISON.                         | 9 dmg + 4 POISON (cost 2)          | 9 dmg + 3 POISON                     |
| 6   | `black_page`         | Black Page         | Page Noire          | SKILL  | 1e   | COMMON   | Gain 2 ink. Apply 1 WEAK to ALL.                    | 3 ink + 2 WEAK ALL (cost 2)        | 3 ink + 1 WEAK ALL                   |
| 7   | `forbidden_verse`    | Forbidden Verse    | Vers Interdit       | ATTACK | 2e   | UNCOMMON | Deal 12 dmg. Apply 2 BLEED. Apply 1 WEAK.           | 16 dmg + 3 BLEED + 2 WEAK (cost 3) | 16 dmg + 2 BLEED + 1 WEAK            |
| 8   | `eldritch_script`    | Eldritch Script    | Ã‰criture Abyssale   | SKILL  | 1e   | UNCOMMON | Gain 3 ink. Apply 1 VULNERABLE to ALL. Draw 1 card. | â€”                                  | 3 ink + 2 VULN ALL + draw 1          |
| 9   | `necrotic_words`     | Necrotic Words     | Mots NÃ©crotiques    | ATTACK | 1e   | UNCOMMON | Deal 5 dmg to ALL. Apply 2 BLEED to ALL.            | 7 dmg ALL + 3 BLEED ALL (cost 2)   | 7 dmg ALL + 2 BLEED ALL              |
| 10  | `void_scripture`     | Void Scripture     | Ã‰criture du NÃ©ant   | SKILL  | 2e   | RARE     | Add 1 Haunting Regret to your discard. Draw 2 cards. Deal 5 damage. Deal 5 damage per Status/Curse in your discard. Exhaust. | â€” | Add 1 Haunting Regret to your discard. Draw 3 cards. Deal 5 damage. Deal 6 damage per Status/Curse in your discard. Exhaust. |

### LOVECRAFTIAN â€” BibliothÃ©caire (3 existantes + 7 nouvelles)

| #   | ID                  | Name (EN)         | Nom (FR)                | Type   | CoÃ»t | RaretÃ©   | Description                                            | Inked                               | Upgrade                    |
| --- | ------------------- | ----------------- | ----------------------- | ------ | ---- | -------- | ------------------------------------------------------ | ----------------------------------- | -------------------------- |
| 1   | `forbidden_whisper` | _(existante)_     | Murmure Interdit        | SKILL  | 1e   | UNCOMMON | VULN 3 ALL (flavor: Madness)                           | â€”                                   | â€”                          |
| 2   | `void_shield`       | _(existante)_     | Bouclier du NÃ©ant       | SKILL  | 1e   | UNCOMMON | 9 block / upgrade: 13 block + draw 1                   | â€”                                   | â€”                          |
| 3   | `eldritch_pact`     | _(existante)_     | Pacte Abyssal           | POWER  | 2e   | RARE     | STR/HP trade                                           | â€”                                   | â€”                          |
| 4   | `sealed_tome`       | Sealed Tome       | Tome ScellÃ©             | SKILL  | 1e   | COMMON   | Gain 9 block.                                          | 13 block (cost 2)                   | 13 block                   |
| 5   | `library_horror`    | Library Horror    | Horreur BibliothÃ©caire  | SKILL  | 1e   | COMMON   | Apply 2 WEAK to ALL. Apply 1 VULNERABLE to ALL.        | â€”                                   | 2 WEAK ALL + 2 VULN ALL    |
| 6   | `readers_pact`      | Reader's Pact     | Pacte du Lecteur        | SKILL  | 1e   | UNCOMMON | Gain 3 ink. Gain 1 energy. Exhaust.                    | 4 ink + 2 energy + exhaust (cost 2) | 4 ink + 1 energy + exhaust |
| 7   | `forbidden_index`   | Forbidden Index   | Index Interdit          | SKILL  | 1e   | UNCOMMON | Draw 3 cards. Apply 1 VULNERABLE to ALL.               | â€”                                   | Draw 3 + 2 VULN ALL        |
| 8   | `void_librarian`    | Void Librarian    | BibliothÃ©caire du NÃ©ant | SKILL  | 1e   | UNCOMMON | Gain 2 ink. Apply 3 VULNERABLE to target. Draw 1 card. | â€”                                   | 2 ink + 4 VULN + draw 1    |
| 9   | `necronomicon_page` | Necronomicon Page | Page du NÃ©cronomicon    | ATTACK | 2e   | RARE     | Deal 12 dmg to ALL. Apply 3 VULNERABLE.                | 16 dmg ALL + 4 VULN (cost 3)        | 16 dmg ALL + 3 VULN        |
| 10  | `cosmic_archive`    | Cosmic Archive    | Archives Cosmiques      | POWER  | 2e   | RARE     | Gain 6 block. Gain 3 block per card in your Exhaust pile. Gain 1 Focus. Add 1 Dazed to your discard. Exhaust. | â€” | Gain 8 block. Gain 4 block per card in your Exhaust pile. Gain 1 Focus. Add 1 Dazed to your discard. Exhaust. |

---

## 9. AZTEC â€” 10 Scribe + 10 BibliothÃ©caire

**Vibe Scribe** : codices brÃ»lÃ©s â€” prÃ©server la puissance par le sacrifice, encre de sang
**Vibe BibliothÃ©caire** : Ã©tudier les codices survivants, astronomie sacrÃ©e, serpent Ã  plumes

### AZTEC â€” Scribe (3 existantes + 7 nouvelles)

> âš ï¸ Cartes avec "Lose HP" â€” rÃ©utiliser le mÃ©canisme de `blood_offering`/`jaguars_blood`

| #   | ID                   | Name (EN)          | Nom (FR)           | Type   | CoÃ»t | RaretÃ©   | Description                                      | Inked                              | Upgrade                            |
| --- | -------------------- | ------------------ | ------------------ | ------ | ---- | -------- | ------------------------------------------------ | ---------------------------------- | ---------------------------------- |
| 1   | `jaguars_blood`      | _(existante)_      | Sang du Jaguar     | ATTACK | 2e   | RARE     | 14 dmg, lose 4 HP                                | â€”                                  | â€”                                  |
| 2   | `obsidian_jab`       | _(existante)_      | Coup d'Obsidienne  | ATTACK | 1e   | COMMON   | 9 dmg                                            | â€”                                  | â€”                                  |
| 3   | `blood_offering`     | _(existante)_      | Offrande de Sang   | SKILL  | 1e   | UNCOMMON | lose 6 HP + 2 STR                                | â€”                                  | â€”                                  |
| 4   | `obsidian_quill`     | Obsidian Quill     | Plume d'Obsidienne | SKILL  | 1e   | COMMON   | Gain 2 ink. Deal 4 dmg to target.                | 3 ink + 7 dmg (cost 2)             | 3 ink + 4 dmg                      |
| 5   | `codex_strike`       | Codex Strike       | Frappe du Codex    | ATTACK | 1e   | COMMON   | Deal 8 dmg. Apply 2 BLEED.                       | 11 dmg + 3 BLEED (cost 2)          | 11 dmg + 2 BLEED                   |
| 6   | `sacrificial_word`   | Sacrificial Word   | Mot Sacrificiel    | ATTACK | 1e   | UNCOMMON | Deal 5 dmg to ALL. Lose 3 HP.                    | â€”                                  | 7 dmg ALL, lose 3 HP               |
| 7   | `xipe_shield`        | Xipe Shield        | Bouclier de Xipe   | SKILL  | 1e   | UNCOMMON | Gain 8 block. Apply 2 VULNERABLE to ALL.         | â€”                                  | 8 block + 3 VULN ALL               |
| 8   | `sun_codex`          | Sun Codex          | Codex Solaire      | SKILL  | 1e   | UNCOMMON | Gain 3 ink. Draw 1 card. Gain 1 strength.        | â€”                                  | 3 ink + draw 2 + 1 STR             |
| 9   | `hummingbird_strike` | Hummingbird Strike | Frappe du Colibri  | ATTACK | 2e   | RARE     | Deal 15 dmg. Gain 2 strength. Lose 6 HP.         | 20 dmg + 3 STR, lose 6 HP (cost 3) | 20 dmg + 2 STR, lose 6 HP          |
| 10  | `blood_codex`        | Blood Codex        | Codex de Sang      | POWER  | 2e   | RARE     | Gain 3 strength. Gain 3 ink. Lose 8 HP. Exhaust. | â€”                                  | 3 STR + 4 ink, lose 8 HP + exhaust |

### AZTEC â€” BibliothÃ©caire (3 existantes + 7 nouvelles)

| #   | ID                  | Name (EN)         | Nom (FR)            | Type   | CoÃ»t | RaretÃ©   | Description                                     | Inked                              | Upgrade                      |
| --- | ------------------- | ----------------- | ------------------- | ------ | ---- | -------- | ----------------------------------------------- | ---------------------------------- | ---------------------------- |
| 1   | `eclipse_vow`       | _(existante)_     | VÅ“u d'Ã‰clipse       | SKILL  | 1e   | UNCOMMON | 5 block + 3 POISON                              | â€”                                  | â€”                            |
| 2   | `sun_ritual`        | _(existante)_     | Rituel Solaire      | POWER  | 2e   | RARE     | soin Ã  chaque attaque                           | â€”                                  | â€”                            |
| 3   | `jaguar_pounce`     | _(existante)_     | Bond du Jaguar      | ATTACK | 1e   | UNCOMMON | 5 dmg + 3 BLEED                                 | â€”                                  | â€”                            |
| 4   | `calendric_ward`    | Calendric Ward    | Garde du Calendrier | SKILL  | 1e   | COMMON   | Gain 8 block. Draw 1 card.                      | 11 block + draw 2 (cost 2)         | 11 block + draw 1            |
| 5   | `poison_herb`       | Poison Herb       | Herbe EmpoisonnÃ©e   | SKILL  | 1e   | COMMON   | Apply 3 POISON to target.                       | 5 POISON (cost 2)                  | 4 POISON                     |
| 6   | `star_chart`        | Star Chart        | Carte des Ã‰toiles   | SKILL  | 1e   | UNCOMMON | Gain 2 ink. Apply 2 WEAK to ALL.                | â€”                                  | 2 ink + 3 WEAK ALL           |
| 7   | `quetzal_shield`    | Quetzal Shield    | Bouclier de Quetzal | SKILL  | 1e   | UNCOMMON | Gain 7 block. Gain 2 ink.                       | 10 block + 3 ink (cost 2)          | 10 block + 2 ink             |
| 8   | `temple_archive`    | Temple Archive    | Archives du Temple  | SKILL  | 1e   | UNCOMMON | Draw 2 cards. Heal 4.                           | â€”                                  | Draw 3 + heal 4              |
| 9   | `obsidian_ward`     | Obsidian Ward     | Garde d'Obsidienne  | ATTACK | 2e   | RARE     | Deal 10 dmg to ALL. Apply 2 POISON to ALL.      | 14 dmg ALL + 3 POISON ALL (cost 3) | 14 dmg ALL + 2 POISON ALL    |
| 10  | `feathered_serpent` | Feathered Serpent | Serpent Ã  Plumes    | POWER  | 2e   | RARE     | Apply 2 VULNERABLE to ALL. Gain 3 ink. Exhaust. | â€”                                  | 3 VULN ALL + 3 ink + exhaust |

---

## 10. CELTIC â€” 10 Scribe + 10 BibliothÃ©caire

**Vibe Scribe** : enlumineur de manuscrits (Book of Kells), barde guerrier, calligraphie magique
**Vibe BibliothÃ©caire** : gardienne des traditions orales druidiques, contes de fÃ©es comme savoir

### CELTIC â€” Scribe (2 existantes + 8 nouvelles)

| #   | ID                    | Name (EN)           | Nom (FR)               | Type   | CoÃ»t | RaretÃ©   | Description                                                        | Inked                             | Upgrade                          |
| --- | --------------------- | ------------------- | ---------------------- | ------ | ---- | -------- | ------------------------------------------------------------------ | --------------------------------- | -------------------------------- |
| 1   | `thorn_slash`         | _(existante)_       | Taillade d'Ã‰pines      | ATTACK | 1e   | UNCOMMON | 5 dmg + 2 POISON                                                   | â€”                                 | â€”                                |
| 2   | `wild_gale`           | _(existante)_       | Vent Sauvage           | ATTACK | 2e   | UNCOMMON | 12 dmg + 3 WEAK ALL                                                | â€”                                 | â€”                                |
| 3   | `kells_strike`        | Kells Strike        | Frappe de Kells        | ATTACK | 1e   | COMMON   | Deal 8 dmg. Apply 2 POISON.                                        | 11 dmg + 3 POISON (cost 2)        | 11 dmg + 2 POISON                |
| 4   | `bardic_verse`        | Bardic Verse        | Vers du Barde          | SKILL  | 1e   | COMMON   | Gain 2 ink. Draw 1 card. Gain 1 strength.                          | â€”                                 | 3 ink + draw 1 + 1 STR           |
| 5   | `illuminated_shield`  | Illuminated Shield  | Bouclier EnluminÃ©      | SKILL  | 1e   | COMMON   | Gain 8 block. Gain 1 ink.                                          | 11 block + 2 ink (cost 2)         | 11 block + 1 ink                 |
| 6   | `iron_bard`           | Iron Bard           | Barde de Fer           | ATTACK | 2e   | UNCOMMON | Deal 12 dmg. Apply 3 BLEED.                                        | 16 dmg + 4 BLEED (cost 3)         | 16 dmg + 3 BLEED                 |
| 7   | `triquetra_mark`      | Triquetra Mark      | Marque de la TriquÃ¨tre | SKILL  | 1e   | UNCOMMON | Apply 2 VULNERABLE to target. Apply 2 WEAK to target. Draw 1 card. | â€”                                 | 3 VULN + 2 WEAK + draw 1         |
| 8   | `ogham_inscription`   | Ogham Inscription   | Inscription Oghamique  | SKILL  | 1e   | UNCOMMON | Gain 3 ink. Gain 6 block.                                          | 4 ink + 9 block (cost 2)          | 3 ink + 9 block                  |
| 9   | `celtic_illumination` | Celtic Illumination | Enluminure Celtique    | SKILL  | 1e   | RARE     | Gain 4 ink. Draw 2 cards. Exhaust.                                 | 5 ink + draw 3 + exhaust (cost 2) | 4 ink + draw 3 + exhaust         |
| 10  | `green_man_verse`     | Green Man Verse     | Vers de l'Homme Vert   | POWER  | 2e   | RARE     | Gain 2 strength. Gain 2 ink. Heal 4. Exhaust.                      | â€”                                 | 3 STR + 2 ink + heal 4 + exhaust |

### CELTIC â€” BibliothÃ©caire (3 existantes + 7 nouvelles)

| #   | ID                   | Name (EN)          | Nom (FR)                    | Type   | CoÃ»t | RaretÃ©   | Description                                   | Inked                     | Upgrade                          |
| --- | -------------------- | ------------------ | --------------------------- | ------ | ---- | -------- | --------------------------------------------- | ------------------------- | -------------------------------- |
| 1   | `druids_breath`      | _(existante)_      | Souffle du Druide           | SKILL  | 1e   | COMMON   | Heal 6 + draw 1                               | â€”                         | â€”                                |
| 2   | `ancient_grove`      | _(existante)_      | Bosquet Ancien              | POWER  | 2e   | RARE     | regen + draw par tour                         | â€”                         | â€”                                |
| 3   | `faerie_fire`        | _(existante)_      | Feu FÃ©erique                | ATTACK | 1e   | UNCOMMON | 4 AOE + 2 WEAK ALL                            | â€”                         | â€”                                |
| 4   | `herb_lore`          | Herb Lore          | Connaissance des Herbes     | SKILL  | 1e   | COMMON   | Heal 8. Apply 1 WEAK to target.               | Heal 12 + 2 WEAK (cost 2) | Heal 11 + 1 WEAK                 |
| 5   | `fairy_veil`         | Fairy Veil         | Voile des FÃ©es              | SKILL  | 1e   | COMMON   | Gain 10 block.                                | 14 block (cost 2)         | 14 block                         |
| 6   | `morrigan_curse`     | Morrigan Curse     | MalÃ©diction de la Morrigane | SKILL  | 1e   | UNCOMMON | Apply 3 VULNERABLE to ALL. Draw 1 card.       | â€”                         | 4 VULN ALL + draw 1              |
| 7   | `cauldron_lore`      | Cauldron Lore      | Savoir du Chaudron          | SKILL  | 1e   | UNCOMMON | Draw 2 cards. Heal 3. Gain 1 ink.             | â€”                         | Draw 2 + heal 5 + 1 ink          |
| 8   | `selkie_song`        | Selkie Song        | Chant des Selkies           | SKILL  | 1e   | UNCOMMON | Heal 5. Draw 2 cards.                         | Heal 7 + draw 3 (cost 2)  | Heal 7 + draw 2                  |
| 9   | `ancient_manuscript` | Ancient Manuscript | Manuscrit Ancien            | SKILL  | 1e   | UNCOMMON | Gain 3 ink. Apply 2 VULNERABLE to ALL.        | â€”                         | 3 ink + 3 VULN ALL               |
| 10  | `world_tree`         | World Tree         | L'Arbre Monde               | POWER  | 2e   | RARE     | Gain 2 strength. Heal 6. Gain 2 ink. Exhaust. | â€”                         | 3 STR + heal 6 + 2 ink + exhaust |

---

## 11. RUSSIAN â€” 10 Scribe + 10 BibliothÃ©caire

**Vibe Scribe** : Ã©crire les byliny (Ã©popÃ©es russes) en les vivant, bogatyr-scribe, encre de glace
**Vibe BibliothÃ©caire** : garder les grimoires de contes de fÃ©es russes, piÃ¨ges folkloriques, Baba Yaga

### RUSSIAN â€” Scribe (2 existantes + 8 nouvelles)

| #   | ID                   | Name (EN)          | Nom (FR)                    | Type   | CoÃ»t | RaretÃ©   | Description                                                | Inked                           | Upgrade                    |
| --- | -------------------- | ------------------ | --------------------------- | ------ | ---- | -------- | ---------------------------------------------------------- | ------------------------------- | -------------------------- |
| 1   | `bear_claw`          | _(existante)_      | Griffe d'Ours               | ATTACK | 2e   | UNCOMMON | 18 dmg + BLEED 2                                           | â€”                               | â€”                          |
| 2   | `frost_nail`         | _(existante)_      | Clou de Givre               | ATTACK | 1e   | COMMON   | 8 dmg + WEAK 1                                             | â€”                               | â€”                          |
| 3   | `byliny_verse`       | Byliny Verse       | Vers de Bylina              | SKILL  | 1e   | COMMON   | Gain 2 ink. Draw 1 card. Gain 1 strength.                  | â€”                               | 3 ink + draw 1 + 1 STR     |
| 4   | `bogatyr_strike`     | Bogatyr Strike     | Frappe du Bogatyr           | ATTACK | 1e   | COMMON   | Deal 9 dmg. Apply 1 WEAK.                                  | 13 dmg + 2 WEAK (cost 2)        | 12 dmg + 1 WEAK            |
| 5   | `winter_inscription` | Winter Inscription | Inscription d'Hiver         | SKILL  | 1e   | COMMON   | Gain 5 block. Gain 1 Thorns per Weak on enemies.          | 7 block + 2 Thorns per Weak (cost 2)  | 7 block + 1 Thorns per Weak      |
| 6   | `blizzard_verse`     | Blizzard Verse     | Vers du Blizzard            | ATTACK | 1e   | UNCOMMON | Deal 5 dmg to ALL. Apply 2 WEAK to ALL.                    | 7 dmg ALL + 3 WEAK ALL (cost 2) | 7 dmg ALL + 2 WEAK ALL     |
| 7   | `firebird_script`    | Firebird Script    | Ã‰criture de l'Oiseau de Feu | SKILL  | 1e   | UNCOMMON | Gain 3 ink. Gain 6 block. Draw 1 card.                     | â€”                               | 3 ink + 8 block + draw 1   |
| 8   | `baba_yaga_deal`     | Baba Yaga's Deal   | MarchÃ© de Baba Yaga         | SKILL  | 1e   | UNCOMMON | Lose 4 HP. Gain 3 ink. Draw 2 cards. _(LOSE_HP mÃ©canique)_ | â€”                               | Lose 4 HP + 4 ink + draw 2 |
| 9   | `koschei_strike`     | Koschei Strike     | Frappe de KochtcheÃ¯         | ATTACK | 2e   | RARE     | Deal 16 dmg. Apply 3 BLEED.                                | 22 dmg + 4 BLEED (cost 3)       | 22 dmg + 3 BLEED           |
| 10  | `folk_epic`          | Folk Epic          | Ã‰popÃ©e Populaire            | POWER  | 2e   | RARE     | Gain 3 strength. Gain 2 ink. Exhaust.                      | â€”                               | 4 STR + 2 ink + exhaust    |

### RUSSIAN â€” BibliothÃ©caire (2 existantes + 8 nouvelles)

| #   | ID                 | Name (EN)        | Nom (FR)                | Type  | CoÃ»t | RaretÃ©   | Description                                                | Inked                                | Upgrade                              |
| --- | ------------------ | ---------------- | ----------------------- | ----- | ---- | -------- | ---------------------------------------------------------- | ------------------------------------ | ------------------------------------ |
| 1   | `iron_samovar`     | _(existante)_    | Samovar de Fer          | SKILL | 1e   | UNCOMMON | 9 block + 1 ink                                            | â€”                                    | â€”                                    |
| 2   | `permafrost_ward`  | _(existante)_    | Garde du Permafrost     | SKILL | 2e   | RARE     | 15 block + WEAK ALL                                        | â€”                                    | â€”                                    |
| 3   | `fur_binding`      | Fur Binding      | Reliure de Fourrure     | SKILL | 1e   | COMMON   | Gain 9 block.                                              | 13 block (cost 2)                    | 13 block                             |
| 4   | `folk_curse`       | Folk Curse       | MalÃ©diction Folklorique | SKILL | 1e   | COMMON   | Apply 2 WEAK to ALL. Draw 1 card.                          | â€”                                    | 3 WEAK ALL + draw 1                  |
| 5   | `matryoshka_lore`  | Matryoshka Lore  | Savoir Matriochka       | SKILL | 1e   | UNCOMMON | Draw 2 cards. Gain 1 ink. Discard 1 random card. If randomly discarded: gain 1 energy and draw 1 card. | â€” | Draw 3 cards. Gain 1 ink. Discard 1 random card. If randomly discarded: gain 1 energy and draw 2 cards. |
| 6   | `snowstorm_trap`   | Snowstorm Trap   | PiÃ¨ge de Blizzard       | SKILL | 1e   | UNCOMMON | Gain 2 ink. Apply 3 VULNERABLE to target. Draw 1 card.     | â€”                                    | 2 ink + 4 VULN + draw 1              |
| 7   | `leshy_ward`       | Leshy Ward       | Garde du Leshiy         | SKILL | 1e   | UNCOMMON | Gain 10 block. Heal 3.                                     | 14 block + heal 5 (cost 2)           | 14 block + heal 3                    |
| 8   | `zhar_ptitsa`      | Zhar-Ptitsa      | Joar-Ptitsa             | SKILL | 1e   | UNCOMMON | Gain 3 ink. Apply 2 VULNERABLE to ALL.                     | â€”                                    | 3 ink + 3 VULN ALL                   |
| 9   | `folklore_archive` | Folklore Archive | Archives du Folklore    | SKILL | 1e   | RARE     | Draw 3 cards. Gain 1 energy. Exhaust.                      | Draw 4 + 1 energy + exhaust (cost 2) | Draw 4 + 1 energy + exhaust          |
| 10  | `frost_witch`      | Frost Witch      | SorciÃ¨re de Givre       | POWER | 2e   | RARE     | Apply 2 WEAK to ALL. Gain 3 ink. Gain 1 strength. Exhaust. | â€”                                    | 3 WEAK ALL + 3 ink + 2 STR + exhaust |

---

## 12. AFRICAN â€” 10 Scribe + 10 BibliothÃ©caire

**Vibe Scribe** : griot-scribe qui transcrit les histoires orales, tambour comme arme, force ancestrale
**Vibe BibliothÃ©caire** : garder les traditions orales, Anansi comme symbole du savoir, esprits ancestraux

### AFRICAN â€” Scribe (2 existantes + 8 nouvelles)

| #   | ID                 | Name (EN)        | Nom (FR)                    | Type   | CoÃ»t | RaretÃ©   | Description                                                   | Inked                                          | Upgrade                               |
| --- | ------------------ | ---------------- | --------------------------- | ------ | ---- | -------- | ------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------- |
| 1   | `ancestral_drum`   | _(existante)_    | Tambour Ancestral           | POWER  | 2e   | RARE     | +1 STR/tour                                                   | â€”                                              | â€”                                     |
| 2   | `trickster_snare`  | _(existante)_    | PiÃ¨ge du Filou              | ATTACK | 1e   | UNCOMMON | 6 AOE + VULN 2 ALL                                            | â€”                                              | â€”                                     |
| 3   | `drum_strike`      | Drum Strike      | Coup de Tambour             | ATTACK | 1e   | COMMON   | Deal 7 dmg. Apply 1 BLEED.                                    | 10 dmg + 2 BLEED (cost 2)                      | 10 dmg + 1 BLEED                      |
| 4   | `war_dance`        | War Dance        | Danse de Guerre             | ATTACK | 1e   | COMMON   | Deal 5 dmg to ALL. Gain 1 strength.                           | 7 dmg ALL + 2 STR (cost 2)                     | 7 dmg ALL + 1 STR                     |
| 5   | `ink_of_ancestors` | Ink of Ancestors | Encre des AncÃªtres          | SKILL  | 1e   | COMMON   | Gain 3 ink. Gain 6 block.                                     | 4 ink + 9 block (cost 2)                       | 3 ink + 9 block                       |
| 6   | `griot_strike`     | Griot Strike     | Frappe du Griot             | ATTACK | 1e   | UNCOMMON | Deal 8 dmg. Apply 2 VULNERABLE. Draw 1 card.                  | â€”                                              | 11 dmg + 2 VULN + draw 1              |
| 7   | `anansi_tale`      | Anansi's Tale    | Conte d'Anansi              | SKILL  | 1e   | UNCOMMON | Gain 2 ink. Apply 2 WEAK to ALL. Draw 1 card.                 | â€”                                              | 2 ink + 3 WEAK ALL + draw 1           |
| 8   | `buffalo_charge`   | Buffalo Charge   | Charge du Buffle            | ATTACK | 2e   | UNCOMMON | Deal 14 dmg. Apply 2 BLEED.                                   | 19 dmg + 3 BLEED (cost 3)                      | 19 dmg + 2 BLEED                      |
| 9   | `ancestral_verse`  | Ancestral Verse  | Vers Ancestral              | SKILL  | 1e   | RARE     | Draw 2 cards. Gain 3 ink. Apply 1 VULNERABLE to ALL. Exhaust. | Draw 3 + 4 ink + 2 VULN ALL + exhaust (cost 3) | Draw 3 + 3 ink + 1 VULN ALL + exhaust |
| 10  | `sunbird_power`    | Sunbird Power    | Pouvoir de l'Oiseau Solaire | POWER  | 2e   | RARE     | Gain 2 strength. Gain 2 ink. Draw 1 card. Exhaust.            | â€”                                              | 3 STR + 2 ink + draw 1 + exhaust      |

### AFRICAN â€” BibliothÃ©caire (3 existantes + 7 nouvelles)

| #   | ID                 | Name (EN)        | Nom (FR)             | Type  | CoÃ»t | RaretÃ©   | Description                                                      | Inked                                | Upgrade                              |
| --- | ------------------ | ---------------- | -------------------- | ----- | ---- | -------- | ---------------------------------------------------------------- | ------------------------------------ | ------------------------------------ |
| 1   | `griot_legacy`     | _(existante)_    | HÃ©ritage du Griot    | POWER | 2e   | RARE     | +1 STR + draw 1                                                  | â€”                                    | â€”                                    |
| 2   | `anansis_web`      | _(existante)_    | Toile d'Anansi       | SKILL | 1e   | UNCOMMON | VULN 2 ALL + draw 1                                              | â€”                                    | â€”                                    |
| 3   | `spirit_drum`      | _(existante)_    | Tambour des Esprits  | SKILL | 1e   | COMMON   | Draw 2 + 2 block                                                 | â€”                                    | â€”                                    |
| 4   | `spider_web`       | Spider Web       | Toile d'AraignÃ©e     | SKILL | 1e   | COMMON   | Apply 2 WEAK to ALL. Gain 4 block.                               | â€”                                    | 3 WEAK ALL + 4 block                 |
| 5   | `baobab_shield`    | Baobab Shield    | Bouclier du Baobab   | SKILL | 1e   | COMMON   | Gain 10 block.                                                   | 14 block (cost 2)                    | 14 block                             |
| 6   | `healing_rhythm`   | Healing Rhythm   | Rythme GuÃ©risseur    | SKILL | 1e   | UNCOMMON | Heal 6. Draw 1 card. Gain 1 ink.                                 | â€”                                    | Heal 8 + draw 1 + 1 ink              |
| 7   | `oral_history`     | Oral History     | Histoire Orale       | SKILL | 1e   | UNCOMMON | Draw 2 cards. Apply 2 VULNERABLE to ALL.                         | â€”                                    | Draw 2 + 3 VULN ALL                  |
| 8   | `trickster_lore`   | Trickster Lore   | Sagesse du Filou     | SKILL | 1e   | UNCOMMON | Gain 3 ink. Apply 3 VULNERABLE to target.                        | 4 ink + 4 VULN (cost 2)              | 3 ink + 4 VULN                       |
| 9   | `ancestor_archive` | Ancestor Archive | Archives Ancestrales | SKILL | 1e   | UNCOMMON | Draw 3 cards. Gain 1 energy. Exhaust.                            | Draw 4 + 1 energy + exhaust (cost 2) | Draw 4 + 1 energy + exhaust          |
| 10  | `cosmic_spider`    | Cosmic Spider    | AraignÃ©e Cosmique    | POWER | 2e   | RARE     | Gain 2 strength. Apply 3 VULNERABLE to ALL. Gain 2 ink. Exhaust. | â€”                                    | 2 STR + 4 VULN ALL + 2 ink + exhaust |

---

## 13. Recapitulatif Actuel

- Collection affichee (hors STATUS/CURSE): **232**
- Pool actif (collectible): **221**
- Neutres actifs: **41**
- Repartition neutres active: **LIBRARY 1**, autres biomes **5**
- Ecart actif notable: **AZTEC = 11 Scribe / 9 Bibliothecaire**
- Audit detaille et hotspots de redondance: `docs/card-pool-audit-2026-03-11.md`

| Segment                                | Quantite |
| -------------------------------------- | -------: |
| Collection (visuel)                    |      232 |
| Pool actif (gameplay)                  |      221 |
| Ecart non-actif (isCollectible: false) |       11 |

---

## 14. Checklist Maintenance

### Si vous ajustez les quotas

- [ ] Mettre a jour `src/game/data/cards.ts` (`characterId`, `isCollectible`)
- [ ] Verifier la Collection vs le pool actif
- [ ] Verifier les filtres rewards/merchant (`isCollectible !== false`)

### Commandes utiles

```bash
npm run audit:cards
npm run type-check
```

### Note importante

La Collection affiche toutes les cartes jouables (sauf `STATUS`/`CURSE`),
alors que le gameplay utilise le pool actif (cartes collectibles).
