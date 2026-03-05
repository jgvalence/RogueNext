# Card Design Bible — RogueNext

> **Document de référence** pour la conception des cartes par personnage et par biome.
> Consulter ce fichier avant toute implémentation pour rester cohérent.

---

## 1. Règles Générales

### Structure d'une carte (CardDefinition)

```
id:           string — snake_case anglais (ex: "heavy_strike")
name:         string — anglais dans cards.ts, français dans fr.ts
type:         ATTACK | SKILL | POWER
energyCost:   0–3
targeting:    SINGLE_ENEMY | ALL_ENEMIES | SELF
rarity:       COMMON | UNCOMMON | RARE
description:  anglais, fidèle aux effets réels
effects:      Effect[]
inkedVariant: null | { description, effects, inkMarkCost: 2–3 }
upgrade:      null | { description, effects, energyCost? }
biome:        BiomeType
```

### Effets disponibles (EffectType)

| Effet                         | Usage                                 |
| ----------------------------- | ------------------------------------- |
| `DAMAGE`                      | Dégâts selon targeting                |
| `BLOCK`                       | Bloque les dégâts du tour             |
| `HEAL`                        | Restaure des PV                       |
| `DRAW_CARDS`                  | Pioche X cartes                       |
| `GAIN_ENERGY`                 | +X énergie ce tour                    |
| `GAIN_INK`                    | +X encre                              |
| `GAIN_STRENGTH`               | +X Force permanente                   |
| `APPLY_DEBUFF`                | Applique buff/debuff (voir liste)     |
| `EXHAUST`                     | Exhauste la carte                     |
| `ADD_CARD_TO_DISCARD`         | Ajoute une carte statut à la défausse |
| `UPGRADE_RANDOM_CARD_IN_HAND` | Améliore une carte aléatoire en main  |
| `DAMAGE_EQUAL_BLOCK`          | Dégâts = block actuel                 |

### Buffs/Debuffs disponibles (BuffType)

`VULNERABLE` · `WEAK` · `POISON` · `BLEED` · `STUN` · `STRENGTH` · `THORNS`
⚠️ **MADNESS n'est pas un BuffType** — utiliser VULNERABLE avec flavor "Folie"

### Mécaniques spéciales

- **Perte de PV** (utilisée par `blood_offering`, `jaguars_blood`) : mécanique existante, flaggée `LOSE_HP` dans ce doc — réutiliser la même implémentation
- **+1 STR/tour** (utilisée par `ancestral_drum`) : mécanique POWER existante — réutiliser

### Distribution par pool de 10 cartes

| Critère | Objectif                                |
| ------- | --------------------------------------- |
| Raretés | 3–4 COMMON · 4–5 UNCOMMON · 2–3 RARE    |
| Types   | 3–4 ATTACK · 4–5 SKILL · 1–2 POWER      |
| Coûts   | ~60% à 1e · 1–2 à 0e/2e · 0–1 à 2e RARE |

### Variante Encrée

- `inkMarkCost: 2` standard, `3` pour cartes puissantes
- Boost de 30–50% par rapport à la version normale
- ~50% des cartes ont une variante encrée

### Unlock par rareté (règle générale)

- **COMMON** → `BIOME_FIRST_ENTRY`
- **UNCOMMON** → `BIOME_ELITE_KILLS count:1–3`
- **RARE** → `BIOME_BOSS_KILLS count:1–2`

---

## 2. Profils des Personnages

### Le Scribe (`id: "scribe"`)

- **Pouvoirs Ink** : CALLIGRAPHIE (slot 1) · ENCRE_NOIRE (slot 2) · SEAL (slot 3)
- **Thème** : l'encre comme arme, l'écriture active, les mots qui blessent
- **Mécanique signature** : génération d'encre, attaques puissantes, force via écriture
- **Archétype** : damage dealer + ink builder
- **Ses cartes doivent** : générer de l'encre OU infliger des debuffs offensifs OU gagner de la Force

### La Bibliothécaire (`id: "bibliothecaire"`)

- **Pouvoirs Ink** : VISION (slot 1) · INDEX (slot 2) · SILENCE (slot 3)
- **Thème** : savoir interdit, contrôle, archivage, manipulation
- **Mécanique signature** : pioche + debuffs massifs + encre via connaissance
- **Archétype** : controller + setup
- **Ses cartes doivent** : piocher OU appliquer VULNERABLE/WEAK à TOUS OU soigner OU manipuler la pioche

---

## 3. Profils des Biomes

| Biome        | Vibe                                | Mécaniques dominantes                   |
| ------------ | ----------------------------------- | --------------------------------------- |
| LIBRARY      | Atelier, parchemins, encre          | Ink generation, versatile               |
| VIKING       | Saga, combat brutal, runes          | Force scaling, BLEED, WEAK              |
| GREEK        | Philosophie, mythologie, labyrinthe | Debuffs multiples, AOE, VULNERABLE      |
| EGYPTIAN     | Hiéroglyphes, dieux, momies         | POISON+BLEED combo, ink sacred          |
| LOVECRAFTIAN | Folie cosmique, pactes interdits    | VULNERABLE (= "Folie"), BLEED, HP-trade |
| AZTEC        | Sacrifice, soleil, sang             | Lose HP for power, POISON, BLEED        |
| CELTIC       | Nature, druides, enluminures        | Heal, POISON, Draw, regen               |
| RUSSIAN      | Contes, froid, résistance           | WEAK, Block massif, traps               |
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

> Date de reference: mars 2026

### Collection (page /library/collection)

- Filtre actuel: exclut uniquement `STATUS` et `CURSE`
- Inclut aussi les cartes marquees `isCollectible: false`
- Total affiche: **274** cartes

| Biome        | Neutres |  Scribe | Bibliothecaire | Total Collection |
| ------------ | ------: | ------: | -------------: | ---------------: |
| LIBRARY      |      10 |      17 |             22 |               49 |
| VIKING       |       5 |      12 |             11 |               28 |
| GREEK        |       5 |      11 |             12 |               28 |
| EGYPTIAN     |       5 |      11 |             13 |               29 |
| LOVECRAFTIAN |       5 |      10 |             13 |               28 |
| AZTEC        |       5 |      12 |             11 |               28 |
| CELTIC       |       5 |      13 |             10 |               28 |
| RUSSIAN      |       5 |      12 |             11 |               28 |
| AFRICAN      |       5 |      11 |             12 |               28 |
| **TOTAL**    |  **50** | **109** |        **115** |          **274** |

### Pool actif (recompenses / marchand)

- Regle metier: `isCollectible !== false`
- Cible appliquee: **50 neutres** + **10 Scribe/10 Bibliothecaire par biome**
- Total actif: **230** cartes

| Biome        | Neutres | Scribe | Bibliothecaire | Total Actif |
| ------------ | ------: | -----: | -------------: | ----------: |
| LIBRARY      |      10 |     10 |             10 |          30 |
| VIKING       |       5 |     10 |             10 |          25 |
| GREEK        |       5 |     10 |             10 |          25 |
| EGYPTIAN     |       5 |     10 |             10 |          25 |
| LOVECRAFTIAN |       5 |     10 |             10 |          25 |
| AZTEC        |       5 |     10 |             10 |          25 |
| CELTIC       |       5 |     10 |             10 |          25 |
| RUSSIAN      |       5 |     10 |             10 |          25 |
| AFRICAN      |       5 |     10 |             10 |          25 |
| **TOTAL**    |  **50** | **90** |         **90** |     **230** |

### Bestiaire

- Cartes bestiaire visibles en Collection: **40**
- Cartes bestiaire actives (collectibles): **40**

> Les sections 5 a 12 restent le design detaille par biome/personnage.

---

## 5. VIKING — 10 Scribe + 10 Bibliothécaire

**Vibe Scribe** : écrire la saga en la vivant, runes-armes, poésie de bataille
**Vibe Bibliothécaire** : étudier les sagas depuis les archives, défense tactique, malédictions runiques

### VIKING — Scribe (3 existantes + 7 nouvelles)

| #   | ID                   | Name (EN)          | Nom (FR)                | Type   | Coût | Rareté   | Description                                              | Inked                             | Upgrade                   |
| --- | -------------------- | ------------------ | ----------------------- | ------ | ---- | -------- | -------------------------------------------------------- | --------------------------------- | ------------------------- |
| 1   | `berserker_charge`   | _(existante)_      | Charge du Berserker     | ATTACK | 2e   | UNCOMMON | 14 dmg + STR 1                                           | —                                 | —                         |
| 2   | `rune_strike`        | _(existante)_      | Frappe Runique          | ATTACK | 1e   | COMMON   | 7 dmg + WEAK 1                                           | —                                 | —                         |
| 3   | `saga_of_blood`      | _(existante)_      | Saga de Sang            | POWER  | 2e   | RARE     | +1 STR/kill                                              | —                                 | —                         |
| 4   | `iron_verse`         | Iron Verse         | Vers de Fer             | ATTACK | 1e   | COMMON   | Deal 8 dmg. Apply 2 BLEED.                               | 11 dmg + 3 BLEED (cost 2)         | 11 dmg + 2 BLEED          |
| 5   | `frost_rune_shield`  | Frost Rune         | Rune de Givre           | SKILL  | 1e   | COMMON   | Gain 8 block. Apply 1 WEAK.                              | 11 block + 2 WEAK (cost 2)        | 11 block + 1 WEAK         |
| 6   | `scald_cry`          | Scald Cry          | Cri du Scalde           | SKILL  | 1e   | UNCOMMON | Gain 2 ink. Draw 1 card. Gain 1 strength.                | —                                 | 3 ink + draw 1 + STR 1    |
| 7   | `rune_storm`         | Rune Storm         | Tempête Runique         | ATTACK | 2e   | UNCOMMON | Deal 10 dmg to ALL. Apply 2 BLEED to ALL.                | 14 dmg + 3 BLEED ALL (cost 3)     | 14 dmg + 2 BLEED ALL      |
| 8   | `battle_inscription` | Battle Inscription | Inscription de Bataille | SKILL  | 1e   | UNCOMMON | Gain 6 block. Gain 1 ink. Upgrade 1 random card in hand. | —                                 | 8 block + 1 ink + upgrade |
| 9   | `odin_script`        | Odin's Script      | Runes d'Odin            | SKILL  | 1e   | RARE     | Gain 4 ink. Draw 2 cards. Exhaust.                       | 5 ink + draw 3 + exhaust (cost 2) | 4 ink + draw 3 + exhaust  |
| 10  | `epic_saga`          | Epic Saga          | Épopée                  | POWER  | 2e   | RARE     | Gain 3 strength. Gain 2 ink. Exhaust.                    | —                                 | 3 STR + 3 ink + exhaust   |

### VIKING — Bibliothécaire (3 existantes + 7 nouvelles)

| #   | ID                | Name (EN)       | Nom (FR)               | Type   | Coût | Rareté   | Description                                                | Inked                                | Upgrade                              |
| --- | ----------------- | --------------- | ---------------------- | ------ | ---- | -------- | ---------------------------------------------------------- | ------------------------------------ | ------------------------------------ |
| 1   | `shield_wall`     | _(existante)_   | Mur de Boucliers       | SKILL  | 1e   | COMMON   | 10 block                                                   | —                                    | —                                    |
| 2   | `mjolnir_echo`    | _(existante)_   | Écho de Mjolnir        | ATTACK | 2e   | UNCOMMON | 8 AOE + WEAK 1 ALL                                         | —                                    | —                                    |
| 3   | `valkyries_dive`  | _(existante)_   | Plongeon des Walkyries | ATTACK | 1e   | UNCOMMON | 8 dmg. Exhaust.                                            | —                                    | —                                    |
| 4   | `nordic_treatise` | Nordic Treatise | Traité Nordique        | SKILL  | 1e   | COMMON   | Gain 6 block. Draw 1 card.                                 | 8 block + draw 2 (cost 2)            | 9 block + draw 1                     |
| 5   | `rune_curse`      | Rune Curse      | Malédiction Runique    | SKILL  | 1e   | UNCOMMON | Apply 2 WEAK to ALL. Apply 1 VULNERABLE to ALL.            | —                                    | 2 WEAK ALL + 2 VULN ALL              |
| 6   | `saga_archive`    | Saga Archive    | Archive des Sagas      | SKILL  | 1e   | UNCOMMON | Draw 2 cards. Gain 1 energy. Exhaust.                      | Draw 3 + 2 energy + exhaust (cost 2) | Draw 3 + 1 energy + exhaust          |
| 7   | `norn_prophecy`   | Norn Prophecy   | Prophétie des Nornes   | SKILL  | 1e   | UNCOMMON | Gain 2 ink. Apply 3 VULNERABLE to target. Draw 1 card.     | —                                    | 2 ink + 4 VULN + draw 1              |
| 8   | `ancient_ward`    | Ancient Ward    | Ward Ancestral         | SKILL  | 2e   | UNCOMMON | Gain 14 block. Draw 1 card.                                | 18 block + draw 2 (cost 3)           | 18 block + draw 1                    |
| 9   | `saga_keeper`     | Saga Keeper     | Gardienne des Sagas    | POWER  | 2e   | RARE     | Gain 3 strength. Draw 2 cards. Exhaust.                    | —                                    | 3 STR + draw 3 + exhaust             |
| 10  | `valhalla_codex`  | Valhalla Codex  | Codex du Valhalla      | POWER  | 2e   | RARE     | Gain 2 strength. Apply 2 WEAK to ALL. Gain 2 ink. Exhaust. | —                                    | 2 STR + 3 WEAK ALL + 2 ink + exhaust |

---

## 6. GREEK — 10 Scribe + 10 Bibliothécaire

**Vibe Scribe** : philosophie écrite comme arme, vers épiques, puissance olympienne
**Vibe Bibliothécaire** : Bibliothèque d'Alexandrie, oracle, pièges labyrinthiques

### GREEK — Scribe (2 existantes + 8 nouvelles)

| #   | ID                   | Name (EN)           | Nom (FR)            | Type   | Coût | Rareté   | Description                             | Inked                             | Upgrade                  |
| --- | -------------------- | ------------------- | ------------------- | ------ | ---- | -------- | --------------------------------------- | --------------------------------- | ------------------------ |
| 1   | `heros_challenge`    | _(existante)_       | Défi du Héros       | ATTACK | 1e   | UNCOMMON | —                                       | —                                 | —                        |
| 2   | `olympian_cleave`    | _(existante)_       | Couperet Olympien   | ATTACK | 1e   | UNCOMMON | 6 AOE + VULN 1 ALL                      | —                                 | —                        |
| 3   | `logos_strike`       | Logos Strike        | Frappe Logos        | ATTACK | 1e   | COMMON   | Deal 8 dmg. Apply 1 VULNERABLE.         | 12 dmg + 2 VULN (cost 2)          | 11 dmg + 1 VULN          |
| 4   | `philosophers_quill` | Philosopher's Quill | Plume du Philosophe | SKILL  | 1e   | COMMON   | Gain 2 ink. Draw 1 card.                | 3 ink + draw 2 (cost 2)           | 3 ink + draw 1           |
| 5   | `epic_simile`        | Epic Simile         | Comparaison Épique  | ATTACK | 1e   | COMMON   | Deal 5 dmg to ALL. Apply 1 WEAK to ALL. | 7 dmg ALL + 2 WEAK ALL (cost 2)   | 7 dmg ALL + 1 WEAK ALL   |
| 6   | `hermes_dash`        | Hermes Dash         | Élan d'Hermès       | ATTACK | 0e   | UNCOMMON | Deal 5 dmg. Gain 1 ink. Exhaust.        | 8 dmg + 2 ink + exhaust (cost 2)  | 7 dmg + 1 ink + exhaust  |
| 7   | `written_prophecy`   | Written Prophecy    | Prophétie Écrite    | SKILL  | 1e   | UNCOMMON | Draw 2 cards. Gain 2 ink. Exhaust.      | Draw 3 + 3 ink + exhaust (cost 2) | Draw 3 + 2 ink + exhaust |
| 8   | `titans_wrath`       | Titan's Wrath       | Colère des Titans   | ATTACK | 2e   | UNCOMMON | Deal 14 dmg. Apply 2 VULNERABLE.        | 20 dmg + 3 VULN (cost 3)          | 18 dmg + 2 VULN          |
| 9   | `ares_verse`         | Ares Verse          | Vers d'Arès         | SKILL  | 1e   | UNCOMMON | Gain 6 block. Gain 2 strength.          | —                                 | 8 block + 2 STR          |
| 10  | `olympian_scripture` | Olympian Scripture  | Écriture Olympienne | POWER  | 2e   | RARE     | Gain 3 strength. Gain 3 ink. Exhaust.   | —                                 | 3 STR + 4 ink + exhaust  |

### GREEK — Bibliothécaire (3 existantes + 7 nouvelles)

| #   | ID                 | Name (EN)        | Nom (FR)              | Type  | Coût | Rareté   | Description                                     | Inked                             | Upgrade                  |
| --- | ------------------ | ---------------- | --------------------- | ----- | ---- | -------- | ----------------------------------------------- | --------------------------------- | ------------------------ |
| 1   | `labyrinth`        | _(existante)_    | Labyrinthe            | SKILL | 2e   | RARE     | —                                               | —                                 | —                        |
| 2   | `olympian_guard`   | _(existante)_    | Garde Olympienne      | SKILL | 1e   | UNCOMMON | —                                               | —                                 | —                        |
| 3   | `gorgons_gaze`     | _(existante)_    | Regard de la Gorgone  | SKILL | 1e   | UNCOMMON | WEAK 2 + VULN 1 target                          | —                                 | —                        |
| 4   | `oracle_scroll`    | Oracle Scroll    | Parchemin de l'Oracle | SKILL | 1e   | COMMON   | Draw 2 cards. Apply 1 WEAK to target.           | Draw 3 + 2 WEAK (cost 2)          | Draw 2 + 2 WEAK          |
| 5   | `shield_of_athena` | Shield of Athena | Bouclier d'Athéna     | SKILL | 1e   | COMMON   | Gain 10 block.                                  | 14 block (cost 2)                 | 14 block                 |
| 6   | `sphinx_riddle`    | Sphinx Riddle    | Énigme du Sphinx      | SKILL | 1e   | UNCOMMON | Apply 3 VULNERABLE to ALL. Draw 1 card.         | —                                 | 4 VULN ALL + draw 1      |
| 7   | `apollos_archive`  | Apollo's Archive | Archives d'Apollon    | SKILL | 1e   | UNCOMMON | Gain 1 energy. Gain 2 ink.                      | —                                 | 1 energy + 3 ink         |
| 8   | `labyrinth_trap`   | Labyrinth Trap   | Piège du Labyrinthe   | SKILL | 1e   | UNCOMMON | Apply 2 WEAK to ALL. Apply 2 VULNERABLE to ALL. | —                                 | 3 WEAK ALL + 2 VULN ALL  |
| 9   | `pythian_codex`    | Pythian Codex    | Codex de Pythie       | SKILL | 1e   | RARE     | Draw 3 cards. Gain 3 ink. Exhaust.              | Draw 4 + 4 ink + exhaust (cost 2) | Draw 4 + 3 ink + exhaust |
| 10  | `fates_decree`     | Fate's Decree    | Décret des Moires     | POWER | 2e   | RARE     | Draw 2 cards. Gain 2 strength. Exhaust.         | —                                 | Draw 3 + 2 STR + exhaust |

---

## 7. EGYPTIAN — 10 Scribe + 10 Bibliothécaire

**Vibe Scribe** : le scribe hiéroglyphe par excellence — encre sacrée, sorts inscrits, jugement d'Anubis
**Vibe Bibliothécaire** : garder les rouleaux interdits, malédictions de papyrus, sagesse des morts

### EGYPTIAN — Scribe (4 existantes + 6 nouvelles)

| #   | ID                  | Name (EN)         | Nom (FR)                     | Type   | Coût | Rareté   | Description                                     | Inked                              | Upgrade                   |
| --- | ------------------- | ----------------- | ---------------------------- | ------ | ---- | -------- | ----------------------------------------------- | ---------------------------------- | ------------------------- |
| 1   | `anubis_strike`     | _(existante)_     | Frappe d'Anubis              | ATTACK | 1e   | UNCOMMON | 8 dmg + BLEED 2                                 | —                                  | —                         |
| 2   | `canopic_ward`      | _(existante)_     | Garde Canope                 | SKILL  | 1e   | UNCOMMON | 7 block + 1 ink                                 | —                                  | —                         |
| 3   | `eye_of_ra`         | _(existante)_     | Œil de Râ                    | SKILL  | 1e   | RARE     | Draw 3 + 2 ink                                  | —                                  | —                         |
| 4   | `sand_whip`         | _(existante)_     | Fouet de Sable               | ATTACK | 1e   | COMMON   | 5 dmg ALL                                       | —                                  | —                         |
| 5   | `hieroglyph_strike` | Hieroglyph Strike | Frappe Hiéroglyphe           | ATTACK | 1e   | COMMON   | Deal 8 dmg. Gain 1 ink.                         | 12 dmg + 2 ink (cost 2)            | 11 dmg + 1 ink            |
| 6   | `sacred_papyrus`    | Sacred Papyrus    | Papyrus Sacré                | SKILL  | 1e   | COMMON   | Gain 9 block.                                   | 13 block (cost 2)                  | 13 block                  |
| 7   | `spell_inscription` | Spell Inscription | Inscription de Sort          | ATTACK | 2e   | UNCOMMON | Deal 12 dmg. Apply 3 POISON.                    | 16 dmg + 4 POISON (cost 3)         | 16 dmg + 3 POISON         |
| 8   | `book_of_ra`        | Book of Ra        | Livre de Râ                  | SKILL  | 1e   | UNCOMMON | Gain 3 ink. Draw 2 cards.                       | —                                  | 3 ink + draw 3            |
| 9   | `sacred_ink_burst`  | Sacred Ink Burst  | Jaillissement d'Encre Sacrée | SKILL  | 1e   | UNCOMMON | Gain 3 ink. Gain 6 block.                       | 4 ink + 9 block (cost 2)           | 3 ink + 8 block           |
| 10  | `scribes_judgment`  | Scribe's Judgment | Jugement du Scribe           | ATTACK | 2e   | RARE     | Deal 15 dmg. Apply 2 BLEED. Apply 2 VULNERABLE. | 20 dmg + 3 BLEED + 3 VULN (cost 3) | 20 dmg + 2 BLEED + 2 VULN |

### EGYPTIAN — Bibliothécaire (2 existantes + 8 nouvelles)

| #   | ID                 | Name (EN)        | Nom (FR)               | Type   | Coût | Rareté   | Description                                                      | Inked                             | Upgrade                              |
| --- | ------------------ | ---------------- | ---------------------- | ------ | ---- | -------- | ---------------------------------------------------------------- | --------------------------------- | ------------------------------------ |
| 1   | `pharaohs_curse`   | _(existante)_    | Malédiction du Pharaon | ATTACK | 2e   | UNCOMMON | 12 dmg + POISON 2 + BLEED 1                                      | —                                 | —                                    |
| 2   | `solar_hymn`       | _(existante)_    | Hymne Solaire          | POWER  | 1e   | RARE     | —                                                                | —                                 | —                                    |
| 3   | `death_scroll`     | Death Scroll     | Parchemin de Mort      | ATTACK | 1e   | COMMON   | Deal 7 dmg. Apply 3 POISON.                                      | 10 dmg + 4 POISON (cost 2)        | 10 dmg + 3 POISON                    |
| 4   | `mummy_ward`       | Mummy Ward       | Garde de Momie         | SKILL  | 1e   | COMMON   | Gain 8 block. Apply 1 WEAK to ALL.                               | 11 block + 2 WEAK ALL (cost 2)    | 11 block + 1 WEAK ALL                |
| 5   | `plague_of_words`  | Plague of Words  | Plaie de Mots          | ATTACK | 1e   | UNCOMMON | Deal 4 dmg to ALL. Apply 3 POISON to ALL.                        | 6 dmg ALL + 4 POISON ALL (cost 2) | 6 dmg ALL + 3 POISON ALL             |
| 6   | `osiris_archive`   | Osiris Archive   | Archives d'Osiris      | SKILL  | 1e   | UNCOMMON | Draw 2 cards. Heal 3. Gain 1 ink.                                | —                                 | Draw 2 + heal 5 + 1 ink              |
| 7   | `funerary_rite`    | Funerary Rite    | Rite Funéraire         | SKILL  | 1e   | UNCOMMON | Heal 6. Apply 1 VULNERABLE to target. Draw 1 card.               | —                                 | Heal 8 + 2 VULN + draw 1             |
| 8   | `desert_wisdom`    | Desert Wisdom    | Sagesse du Désert      | SKILL  | 1e   | UNCOMMON | Gain 9 block. Heal 3.                                            | 12 block + heal 5 (cost 2)        | 12 block + heal 3                    |
| 9   | `embalmed_tome`    | Embalmed Tome    | Tome Embaumé           | SKILL  | 1e   | RARE     | Gain 4 ink. Draw 2 cards. Exhaust.                               | 5 ink + draw 3 + exhaust (cost 2) | 4 ink + draw 3 + exhaust             |
| 10  | `book_of_the_dead` | Book of the Dead | Livre des Morts        | POWER  | 2e   | RARE     | Gain 2 strength. Apply 1 VULNERABLE to ALL. Gain 2 ink. Exhaust. | —                                 | 2 STR + 2 VULN ALL + 2 ink + exhaust |

---

## 8. LOVECRAFTIAN — 10 Scribe + 10 Bibliothécaire

**Vibe Scribe** : scribe qui a écrit des textes interdits et en subit les conséquences — encre corrompue
**Vibe Bibliothécaire** : gardienne des textes scellés, connaissance comme arme cosmique

### LOVECRAFTIAN — Scribe (3 existantes + 7 nouvelles)

| #   | ID                   | Name (EN)          | Nom (FR)            | Type   | Coût | Rareté   | Description                                         | Inked                              | Upgrade                              |
| --- | -------------------- | ------------------ | ------------------- | ------ | ---- | -------- | --------------------------------------------------- | ---------------------------------- | ------------------------------------ |
| 1   | `madness_spike`      | _(existante)_      | Pic de Démence      | ATTACK | 1e   | UNCOMMON | 5 dmg + VULN 2 (flavor: Madness)                    | —                                  | —                                    |
| 2   | `void_touch`         | _(existante)_      | Toucher du Néant    | ATTACK | 1e   | UNCOMMON | 10 dmg + BLEED 2                                    | —                                  | —                                    |
| 3   | `starborn_omen`      | _(existante)_      | Présage Stellaire   | ATTACK | 2e   | UNCOMMON | 12 dmg + WEAK 3 ALL                                 | —                                  | —                                    |
| 4   | `void_quill`         | Void Quill         | Plume du Néant      | ATTACK | 1e   | COMMON   | Deal 10 dmg. Add 1 Dazed to discard.                | —                                  | Deal 13 dmg. Add 1 Dazed to discard. |
| 5   | `cursed_inscription` | Cursed Inscription | Inscription Maudite | ATTACK | 1e   | COMMON   | Deal 6 dmg. Apply 3 POISON.                         | 9 dmg + 4 POISON (cost 2)          | 9 dmg + 3 POISON                     |
| 6   | `black_page`         | Black Page         | Page Noire          | SKILL  | 1e   | COMMON   | Gain 2 ink. Apply 1 WEAK to ALL.                    | 3 ink + 2 WEAK ALL (cost 2)        | 3 ink + 1 WEAK ALL                   |
| 7   | `forbidden_verse`    | Forbidden Verse    | Vers Interdit       | ATTACK | 2e   | UNCOMMON | Deal 12 dmg. Apply 2 BLEED. Apply 1 WEAK.           | 16 dmg + 3 BLEED + 2 WEAK (cost 3) | 16 dmg + 2 BLEED + 1 WEAK            |
| 8   | `eldritch_script`    | Eldritch Script    | Écriture Abyssale   | SKILL  | 1e   | UNCOMMON | Gain 3 ink. Apply 1 VULNERABLE to ALL. Draw 1 card. | —                                  | 3 ink + 2 VULN ALL + draw 1          |
| 9   | `necrotic_words`     | Necrotic Words     | Mots Nécrotiques    | ATTACK | 1e   | UNCOMMON | Deal 5 dmg to ALL. Apply 2 BLEED to ALL.            | 7 dmg ALL + 3 BLEED ALL (cost 2)   | 7 dmg ALL + 2 BLEED ALL              |
| 10  | `void_scripture`     | Void Scripture     | Écriture du Néant   | POWER  | 2e   | RARE     | Gain 3 strength. Gain 3 ink. Exhaust.               | —                                  | 4 STR + 3 ink + exhaust              |

### LOVECRAFTIAN — Bibliothécaire (3 existantes + 7 nouvelles)

| #   | ID                  | Name (EN)         | Nom (FR)                | Type   | Coût | Rareté   | Description                                            | Inked                               | Upgrade                    |
| --- | ------------------- | ----------------- | ----------------------- | ------ | ---- | -------- | ------------------------------------------------------ | ----------------------------------- | -------------------------- |
| 1   | `forbidden_whisper` | _(existante)_     | Murmure Interdit        | SKILL  | 1e   | UNCOMMON | VULN 3 ALL (flavor: Madness)                           | —                                   | —                          |
| 2   | `void_shield`       | _(existante)_     | Bouclier du Néant       | SKILL  | 1e   | UNCOMMON | 9 block / upgrade: 13 block + draw 1                   | —                                   | —                          |
| 3   | `eldritch_pact`     | _(existante)_     | Pacte Abyssal           | POWER  | 2e   | RARE     | STR/HP trade                                           | —                                   | —                          |
| 4   | `sealed_tome`       | Sealed Tome       | Tome Scellé             | SKILL  | 1e   | COMMON   | Gain 9 block.                                          | 13 block (cost 2)                   | 13 block                   |
| 5   | `library_horror`    | Library Horror    | Horreur Bibliothécaire  | SKILL  | 1e   | COMMON   | Apply 2 WEAK to ALL. Apply 1 VULNERABLE to ALL.        | —                                   | 2 WEAK ALL + 2 VULN ALL    |
| 6   | `readers_pact`      | Reader's Pact     | Pacte du Lecteur        | SKILL  | 1e   | UNCOMMON | Gain 3 ink. Gain 1 energy. Exhaust.                    | 4 ink + 2 energy + exhaust (cost 2) | 4 ink + 1 energy + exhaust |
| 7   | `forbidden_index`   | Forbidden Index   | Index Interdit          | SKILL  | 1e   | UNCOMMON | Draw 3 cards. Apply 1 VULNERABLE to ALL.               | —                                   | Draw 3 + 2 VULN ALL        |
| 8   | `void_librarian`    | Void Librarian    | Bibliothécaire du Néant | SKILL  | 1e   | UNCOMMON | Gain 2 ink. Apply 3 VULNERABLE to target. Draw 1 card. | —                                   | 2 ink + 4 VULN + draw 1    |
| 9   | `necronomicon_page` | Necronomicon Page | Page du Nécronomicon    | ATTACK | 2e   | RARE     | Deal 12 dmg to ALL. Apply 3 VULNERABLE.                | 16 dmg ALL + 4 VULN (cost 3)        | 16 dmg ALL + 3 VULN        |
| 10  | `cosmic_archive`    | Cosmic Archive    | Archives Cosmiques      | POWER  | 2e   | RARE     | Gain 2 strength. Gain 3 ink. Exhaust.                  | —                                   | 3 STR + 3 ink + exhaust    |

---

## 9. AZTEC — 10 Scribe + 10 Bibliothécaire

**Vibe Scribe** : codices brûlés — préserver la puissance par le sacrifice, encre de sang
**Vibe Bibliothécaire** : étudier les codices survivants, astronomie sacrée, serpent à plumes

### AZTEC — Scribe (3 existantes + 7 nouvelles)

> ⚠️ Cartes avec "Lose HP" — réutiliser le mécanisme de `blood_offering`/`jaguars_blood`

| #   | ID                   | Name (EN)          | Nom (FR)           | Type   | Coût | Rareté   | Description                                      | Inked                              | Upgrade                            |
| --- | -------------------- | ------------------ | ------------------ | ------ | ---- | -------- | ------------------------------------------------ | ---------------------------------- | ---------------------------------- |
| 1   | `jaguars_blood`      | _(existante)_      | Sang du Jaguar     | ATTACK | 2e   | RARE     | 14 dmg, lose 4 HP                                | —                                  | —                                  |
| 2   | `obsidian_jab`       | _(existante)_      | Coup d'Obsidienne  | ATTACK | 1e   | COMMON   | 9 dmg                                            | —                                  | —                                  |
| 3   | `blood_offering`     | _(existante)_      | Offrande de Sang   | SKILL  | 1e   | UNCOMMON | lose 6 HP + 2 STR                                | —                                  | —                                  |
| 4   | `obsidian_quill`     | Obsidian Quill     | Plume d'Obsidienne | SKILL  | 1e   | COMMON   | Gain 2 ink. Deal 4 dmg to target.                | 3 ink + 7 dmg (cost 2)             | 3 ink + 4 dmg                      |
| 5   | `codex_strike`       | Codex Strike       | Frappe du Codex    | ATTACK | 1e   | COMMON   | Deal 8 dmg. Apply 2 BLEED.                       | 11 dmg + 3 BLEED (cost 2)          | 11 dmg + 2 BLEED                   |
| 6   | `sacrificial_word`   | Sacrificial Word   | Mot Sacrificiel    | ATTACK | 1e   | UNCOMMON | Deal 5 dmg to ALL. Lose 3 HP.                    | —                                  | 7 dmg ALL, lose 3 HP               |
| 7   | `xipe_shield`        | Xipe Shield        | Bouclier de Xipe   | SKILL  | 1e   | UNCOMMON | Gain 8 block. Apply 2 VULNERABLE to ALL.         | —                                  | 8 block + 3 VULN ALL               |
| 8   | `sun_codex`          | Sun Codex          | Codex Solaire      | SKILL  | 1e   | UNCOMMON | Gain 3 ink. Draw 1 card. Gain 1 strength.        | —                                  | 3 ink + draw 2 + 1 STR             |
| 9   | `hummingbird_strike` | Hummingbird Strike | Frappe du Colibri  | ATTACK | 2e   | RARE     | Deal 15 dmg. Gain 2 strength. Lose 6 HP.         | 20 dmg + 3 STR, lose 6 HP (cost 3) | 20 dmg + 2 STR, lose 6 HP          |
| 10  | `blood_codex`        | Blood Codex        | Codex de Sang      | POWER  | 2e   | RARE     | Gain 3 strength. Gain 3 ink. Lose 8 HP. Exhaust. | —                                  | 3 STR + 4 ink, lose 8 HP + exhaust |

### AZTEC — Bibliothécaire (3 existantes + 7 nouvelles)

| #   | ID                  | Name (EN)         | Nom (FR)            | Type   | Coût | Rareté   | Description                                     | Inked                              | Upgrade                      |
| --- | ------------------- | ----------------- | ------------------- | ------ | ---- | -------- | ----------------------------------------------- | ---------------------------------- | ---------------------------- |
| 1   | `eclipse_vow`       | _(existante)_     | Vœu d'Éclipse       | SKILL  | 1e   | UNCOMMON | 5 block + 3 POISON                              | —                                  | —                            |
| 2   | `sun_ritual`        | _(existante)_     | Rituel Solaire      | POWER  | 2e   | RARE     | soin à chaque attaque                           | —                                  | —                            |
| 3   | `jaguar_pounce`     | _(existante)_     | Bond du Jaguar      | ATTACK | 1e   | UNCOMMON | 5 dmg + 3 BLEED                                 | —                                  | —                            |
| 4   | `calendric_ward`    | Calendric Ward    | Garde du Calendrier | SKILL  | 1e   | COMMON   | Gain 8 block. Draw 1 card.                      | 11 block + draw 2 (cost 2)         | 11 block + draw 1            |
| 5   | `poison_herb`       | Poison Herb       | Herbe Empoisonnée   | SKILL  | 1e   | COMMON   | Apply 3 POISON to target.                       | 5 POISON (cost 2)                  | 4 POISON                     |
| 6   | `star_chart`        | Star Chart        | Carte des Étoiles   | SKILL  | 1e   | UNCOMMON | Gain 2 ink. Apply 2 WEAK to ALL.                | —                                  | 2 ink + 3 WEAK ALL           |
| 7   | `quetzal_shield`    | Quetzal Shield    | Bouclier de Quetzal | SKILL  | 1e   | UNCOMMON | Gain 7 block. Gain 2 ink.                       | 10 block + 3 ink (cost 2)          | 10 block + 2 ink             |
| 8   | `temple_archive`    | Temple Archive    | Archives du Temple  | SKILL  | 1e   | UNCOMMON | Draw 2 cards. Heal 4.                           | —                                  | Draw 3 + heal 4              |
| 9   | `obsidian_ward`     | Obsidian Ward     | Garde d'Obsidienne  | ATTACK | 2e   | RARE     | Deal 10 dmg to ALL. Apply 2 POISON to ALL.      | 14 dmg ALL + 3 POISON ALL (cost 3) | 14 dmg ALL + 2 POISON ALL    |
| 10  | `feathered_serpent` | Feathered Serpent | Serpent à Plumes    | POWER  | 2e   | RARE     | Apply 2 VULNERABLE to ALL. Gain 3 ink. Exhaust. | —                                  | 3 VULN ALL + 3 ink + exhaust |

---

## 10. CELTIC — 10 Scribe + 10 Bibliothécaire

**Vibe Scribe** : enlumineur de manuscrits (Book of Kells), barde guerrier, calligraphie magique
**Vibe Bibliothécaire** : gardienne des traditions orales druidiques, contes de fées comme savoir

### CELTIC — Scribe (2 existantes + 8 nouvelles)

| #   | ID                    | Name (EN)           | Nom (FR)               | Type   | Coût | Rareté   | Description                                                        | Inked                             | Upgrade                          |
| --- | --------------------- | ------------------- | ---------------------- | ------ | ---- | -------- | ------------------------------------------------------------------ | --------------------------------- | -------------------------------- |
| 1   | `thorn_slash`         | _(existante)_       | Taillade d'Épines      | ATTACK | 1e   | UNCOMMON | 5 dmg + 2 POISON                                                   | —                                 | —                                |
| 2   | `wild_gale`           | _(existante)_       | Vent Sauvage           | ATTACK | 2e   | UNCOMMON | 12 dmg + 3 WEAK ALL                                                | —                                 | —                                |
| 3   | `kells_strike`        | Kells Strike        | Frappe de Kells        | ATTACK | 1e   | COMMON   | Deal 8 dmg. Apply 2 POISON.                                        | 11 dmg + 3 POISON (cost 2)        | 11 dmg + 2 POISON                |
| 4   | `bardic_verse`        | Bardic Verse        | Vers du Barde          | SKILL  | 1e   | COMMON   | Gain 2 ink. Draw 1 card. Gain 1 strength.                          | —                                 | 3 ink + draw 1 + 1 STR           |
| 5   | `illuminated_shield`  | Illuminated Shield  | Bouclier Enluminé      | SKILL  | 1e   | COMMON   | Gain 8 block. Gain 1 ink.                                          | 11 block + 2 ink (cost 2)         | 11 block + 1 ink                 |
| 6   | `iron_bard`           | Iron Bard           | Barde de Fer           | ATTACK | 2e   | UNCOMMON | Deal 12 dmg. Apply 3 BLEED.                                        | 16 dmg + 4 BLEED (cost 3)         | 16 dmg + 3 BLEED                 |
| 7   | `triquetra_mark`      | Triquetra Mark      | Marque de la Triquètre | SKILL  | 1e   | UNCOMMON | Apply 2 VULNERABLE to target. Apply 2 WEAK to target. Draw 1 card. | —                                 | 3 VULN + 2 WEAK + draw 1         |
| 8   | `ogham_inscription`   | Ogham Inscription   | Inscription Oghamique  | SKILL  | 1e   | UNCOMMON | Gain 3 ink. Gain 6 block.                                          | 4 ink + 9 block (cost 2)          | 3 ink + 9 block                  |
| 9   | `celtic_illumination` | Celtic Illumination | Enluminure Celtique    | SKILL  | 1e   | RARE     | Gain 4 ink. Draw 2 cards. Exhaust.                                 | 5 ink + draw 3 + exhaust (cost 2) | 4 ink + draw 3 + exhaust         |
| 10  | `green_man_verse`     | Green Man Verse     | Vers de l'Homme Vert   | POWER  | 2e   | RARE     | Gain 2 strength. Gain 2 ink. Heal 4. Exhaust.                      | —                                 | 3 STR + 2 ink + heal 4 + exhaust |

### CELTIC — Bibliothécaire (3 existantes + 7 nouvelles)

| #   | ID                   | Name (EN)          | Nom (FR)                    | Type   | Coût | Rareté   | Description                                   | Inked                     | Upgrade                          |
| --- | -------------------- | ------------------ | --------------------------- | ------ | ---- | -------- | --------------------------------------------- | ------------------------- | -------------------------------- |
| 1   | `druids_breath`      | _(existante)_      | Souffle du Druide           | SKILL  | 1e   | COMMON   | Heal 6 + draw 1                               | —                         | —                                |
| 2   | `ancient_grove`      | _(existante)_      | Bosquet Ancien              | POWER  | 2e   | RARE     | regen + draw par tour                         | —                         | —                                |
| 3   | `faerie_fire`        | _(existante)_      | Feu Féerique                | ATTACK | 1e   | UNCOMMON | 4 AOE + 2 WEAK ALL                            | —                         | —                                |
| 4   | `herb_lore`          | Herb Lore          | Connaissance des Herbes     | SKILL  | 1e   | COMMON   | Heal 8. Apply 1 WEAK to target.               | Heal 12 + 2 WEAK (cost 2) | Heal 11 + 1 WEAK                 |
| 5   | `fairy_veil`         | Fairy Veil         | Voile des Fées              | SKILL  | 1e   | COMMON   | Gain 10 block.                                | 14 block (cost 2)         | 14 block                         |
| 6   | `morrigan_curse`     | Morrigan Curse     | Malédiction de la Morrigane | SKILL  | 1e   | UNCOMMON | Apply 3 VULNERABLE to ALL. Draw 1 card.       | —                         | 4 VULN ALL + draw 1              |
| 7   | `cauldron_lore`      | Cauldron Lore      | Savoir du Chaudron          | SKILL  | 1e   | UNCOMMON | Draw 2 cards. Heal 3. Gain 1 ink.             | —                         | Draw 2 + heal 5 + 1 ink          |
| 8   | `selkie_song`        | Selkie Song        | Chant des Selkies           | SKILL  | 1e   | UNCOMMON | Heal 5. Draw 2 cards.                         | Heal 7 + draw 3 (cost 2)  | Heal 7 + draw 2                  |
| 9   | `ancient_manuscript` | Ancient Manuscript | Manuscrit Ancien            | SKILL  | 1e   | UNCOMMON | Gain 3 ink. Apply 2 VULNERABLE to ALL.        | —                         | 3 ink + 3 VULN ALL               |
| 10  | `world_tree`         | World Tree         | L'Arbre Monde               | POWER  | 2e   | RARE     | Gain 2 strength. Heal 6. Gain 2 ink. Exhaust. | —                         | 3 STR + heal 6 + 2 ink + exhaust |

---

## 11. RUSSIAN — 10 Scribe + 10 Bibliothécaire

**Vibe Scribe** : écrire les byliny (épopées russes) en les vivant, bogatyr-scribe, encre de glace
**Vibe Bibliothécaire** : garder les grimoires de contes de fées russes, pièges folkloriques, Baba Yaga

### RUSSIAN — Scribe (2 existantes + 8 nouvelles)

| #   | ID                   | Name (EN)          | Nom (FR)                    | Type   | Coût | Rareté   | Description                                                | Inked                           | Upgrade                    |
| --- | -------------------- | ------------------ | --------------------------- | ------ | ---- | -------- | ---------------------------------------------------------- | ------------------------------- | -------------------------- |
| 1   | `bear_claw`          | _(existante)_      | Griffe d'Ours               | ATTACK | 2e   | UNCOMMON | 18 dmg + BLEED 2                                           | —                               | —                          |
| 2   | `frost_nail`         | _(existante)_      | Clou de Givre               | ATTACK | 1e   | COMMON   | 8 dmg + WEAK 1                                             | —                               | —                          |
| 3   | `byliny_verse`       | Byliny Verse       | Vers de Bylina              | SKILL  | 1e   | COMMON   | Gain 2 ink. Draw 1 card. Gain 1 strength.                  | —                               | 3 ink + draw 1 + 1 STR     |
| 4   | `bogatyr_strike`     | Bogatyr Strike     | Frappe du Bogatyr           | ATTACK | 1e   | COMMON   | Deal 9 dmg. Apply 1 WEAK.                                  | 13 dmg + 2 WEAK (cost 2)        | 12 dmg + 1 WEAK            |
| 5   | `winter_inscription` | Winter Inscription | Inscription d'Hiver         | SKILL  | 1e   | COMMON   | Gain 8 block. Apply 1 WEAK to ALL.                         | 11 block + 2 WEAK ALL (cost 2)  | 11 block + 1 WEAK ALL      |
| 6   | `blizzard_verse`     | Blizzard Verse     | Vers du Blizzard            | ATTACK | 1e   | UNCOMMON | Deal 5 dmg to ALL. Apply 2 WEAK to ALL.                    | 7 dmg ALL + 3 WEAK ALL (cost 2) | 7 dmg ALL + 2 WEAK ALL     |
| 7   | `firebird_script`    | Firebird Script    | Écriture de l'Oiseau de Feu | SKILL  | 1e   | UNCOMMON | Gain 3 ink. Gain 6 block. Draw 1 card.                     | —                               | 3 ink + 8 block + draw 1   |
| 8   | `baba_yaga_deal`     | Baba Yaga's Deal   | Marché de Baba Yaga         | SKILL  | 1e   | UNCOMMON | Lose 4 HP. Gain 3 ink. Draw 2 cards. _(LOSE_HP mécanique)_ | —                               | Lose 4 HP + 4 ink + draw 2 |
| 9   | `koschei_strike`     | Koschei Strike     | Frappe de Kochtcheï         | ATTACK | 2e   | RARE     | Deal 16 dmg. Apply 3 BLEED.                                | 22 dmg + 4 BLEED (cost 3)       | 22 dmg + 3 BLEED           |
| 10  | `folk_epic`          | Folk Epic          | Épopée Populaire            | POWER  | 2e   | RARE     | Gain 3 strength. Gain 2 ink. Exhaust.                      | —                               | 4 STR + 2 ink + exhaust    |

### RUSSIAN — Bibliothécaire (2 existantes + 8 nouvelles)

| #   | ID                 | Name (EN)        | Nom (FR)                | Type  | Coût | Rareté   | Description                                                | Inked                                | Upgrade                              |
| --- | ------------------ | ---------------- | ----------------------- | ----- | ---- | -------- | ---------------------------------------------------------- | ------------------------------------ | ------------------------------------ |
| 1   | `iron_samovar`     | _(existante)_    | Samovar de Fer          | SKILL | 1e   | UNCOMMON | 9 block + 1 ink                                            | —                                    | —                                    |
| 2   | `permafrost_ward`  | _(existante)_    | Garde du Permafrost     | SKILL | 2e   | RARE     | 15 block + WEAK ALL                                        | —                                    | —                                    |
| 3   | `fur_binding`      | Fur Binding      | Reliure de Fourrure     | SKILL | 1e   | COMMON   | Gain 9 block.                                              | 13 block (cost 2)                    | 13 block                             |
| 4   | `folk_curse`       | Folk Curse       | Malédiction Folklorique | SKILL | 1e   | COMMON   | Apply 2 WEAK to ALL. Draw 1 card.                          | —                                    | 3 WEAK ALL + draw 1                  |
| 5   | `matryoshka_lore`  | Matryoshka Lore  | Savoir Matriochka       | SKILL | 1e   | UNCOMMON | Draw 2 cards. Gain 2 ink.                                  | —                                    | Draw 3 + 2 ink                       |
| 6   | `snowstorm_trap`   | Snowstorm Trap   | Piège de Blizzard       | SKILL | 1e   | UNCOMMON | Gain 2 ink. Apply 3 VULNERABLE to target. Draw 1 card.     | —                                    | 2 ink + 4 VULN + draw 1              |
| 7   | `leshy_ward`       | Leshy Ward       | Garde du Leshiy         | SKILL | 1e   | UNCOMMON | Gain 10 block. Heal 3.                                     | 14 block + heal 5 (cost 2)           | 14 block + heal 3                    |
| 8   | `zhar_ptitsa`      | Zhar-Ptitsa      | Joar-Ptitsa             | SKILL | 1e   | UNCOMMON | Gain 3 ink. Apply 2 VULNERABLE to ALL.                     | —                                    | 3 ink + 3 VULN ALL                   |
| 9   | `folklore_archive` | Folklore Archive | Archives du Folklore    | SKILL | 1e   | RARE     | Draw 3 cards. Gain 1 energy. Exhaust.                      | Draw 4 + 1 energy + exhaust (cost 2) | Draw 4 + 1 energy + exhaust          |
| 10  | `frost_witch`      | Frost Witch      | Sorcière de Givre       | POWER | 2e   | RARE     | Apply 2 WEAK to ALL. Gain 3 ink. Gain 1 strength. Exhaust. | —                                    | 3 WEAK ALL + 3 ink + 2 STR + exhaust |

---

## 12. AFRICAN — 10 Scribe + 10 Bibliothécaire

**Vibe Scribe** : griot-scribe qui transcrit les histoires orales, tambour comme arme, force ancestrale
**Vibe Bibliothécaire** : garder les traditions orales, Anansi comme symbole du savoir, esprits ancestraux

### AFRICAN — Scribe (2 existantes + 8 nouvelles)

| #   | ID                 | Name (EN)        | Nom (FR)                    | Type   | Coût | Rareté   | Description                                                   | Inked                                          | Upgrade                               |
| --- | ------------------ | ---------------- | --------------------------- | ------ | ---- | -------- | ------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------- |
| 1   | `ancestral_drum`   | _(existante)_    | Tambour Ancestral           | POWER  | 2e   | RARE     | +1 STR/tour                                                   | —                                              | —                                     |
| 2   | `trickster_snare`  | _(existante)_    | Piège du Filou              | ATTACK | 1e   | UNCOMMON | 6 AOE + VULN 2 ALL                                            | —                                              | —                                     |
| 3   | `drum_strike`      | Drum Strike      | Coup de Tambour             | ATTACK | 1e   | COMMON   | Deal 7 dmg. Apply 1 BLEED.                                    | 10 dmg + 2 BLEED (cost 2)                      | 10 dmg + 1 BLEED                      |
| 4   | `war_dance`        | War Dance        | Danse de Guerre             | ATTACK | 1e   | COMMON   | Deal 5 dmg to ALL. Gain 1 strength.                           | 7 dmg ALL + 2 STR (cost 2)                     | 7 dmg ALL + 1 STR                     |
| 5   | `ink_of_ancestors` | Ink of Ancestors | Encre des Ancêtres          | SKILL  | 1e   | COMMON   | Gain 3 ink. Gain 6 block.                                     | 4 ink + 9 block (cost 2)                       | 3 ink + 9 block                       |
| 6   | `griot_strike`     | Griot Strike     | Frappe du Griot             | ATTACK | 1e   | UNCOMMON | Deal 8 dmg. Apply 2 VULNERABLE. Draw 1 card.                  | —                                              | 11 dmg + 2 VULN + draw 1              |
| 7   | `anansi_tale`      | Anansi's Tale    | Conte d'Anansi              | SKILL  | 1e   | UNCOMMON | Gain 2 ink. Apply 2 WEAK to ALL. Draw 1 card.                 | —                                              | 2 ink + 3 WEAK ALL + draw 1           |
| 8   | `buffalo_charge`   | Buffalo Charge   | Charge du Buffle            | ATTACK | 2e   | UNCOMMON | Deal 14 dmg. Apply 2 BLEED.                                   | 19 dmg + 3 BLEED (cost 3)                      | 19 dmg + 2 BLEED                      |
| 9   | `ancestral_verse`  | Ancestral Verse  | Vers Ancestral              | SKILL  | 1e   | RARE     | Draw 2 cards. Gain 3 ink. Apply 1 VULNERABLE to ALL. Exhaust. | Draw 3 + 4 ink + 2 VULN ALL + exhaust (cost 3) | Draw 3 + 3 ink + 1 VULN ALL + exhaust |
| 10  | `sunbird_power`    | Sunbird Power    | Pouvoir de l'Oiseau Solaire | POWER  | 2e   | RARE     | Gain 2 strength. Gain 2 ink. Draw 1 card. Exhaust.            | —                                              | 3 STR + 2 ink + draw 1 + exhaust      |

### AFRICAN — Bibliothécaire (3 existantes + 7 nouvelles)

| #   | ID                 | Name (EN)        | Nom (FR)             | Type  | Coût | Rareté   | Description                                                      | Inked                                | Upgrade                              |
| --- | ------------------ | ---------------- | -------------------- | ----- | ---- | -------- | ---------------------------------------------------------------- | ------------------------------------ | ------------------------------------ |
| 1   | `griot_legacy`     | _(existante)_    | Héritage du Griot    | POWER | 2e   | RARE     | +1 STR + draw 1                                                  | —                                    | —                                    |
| 2   | `anansis_web`      | _(existante)_    | Toile d'Anansi       | SKILL | 1e   | UNCOMMON | VULN 2 ALL + draw 1                                              | —                                    | —                                    |
| 3   | `spirit_drum`      | _(existante)_    | Tambour des Esprits  | SKILL | 1e   | COMMON   | Draw 2 + 2 block                                                 | —                                    | —                                    |
| 4   | `spider_web`       | Spider Web       | Toile d'Araignée     | SKILL | 1e   | COMMON   | Apply 2 WEAK to ALL. Gain 4 block.                               | —                                    | 3 WEAK ALL + 4 block                 |
| 5   | `baobab_shield`    | Baobab Shield    | Bouclier du Baobab   | SKILL | 1e   | COMMON   | Gain 10 block.                                                   | 14 block (cost 2)                    | 14 block                             |
| 6   | `healing_rhythm`   | Healing Rhythm   | Rythme Guérisseur    | SKILL | 1e   | UNCOMMON | Heal 6. Draw 1 card. Gain 1 ink.                                 | —                                    | Heal 8 + draw 1 + 1 ink              |
| 7   | `oral_history`     | Oral History     | Histoire Orale       | SKILL | 1e   | UNCOMMON | Draw 2 cards. Apply 2 VULNERABLE to ALL.                         | —                                    | Draw 2 + 3 VULN ALL                  |
| 8   | `trickster_lore`   | Trickster Lore   | Sagesse du Filou     | SKILL | 1e   | UNCOMMON | Gain 3 ink. Apply 3 VULNERABLE to target.                        | 4 ink + 4 VULN (cost 2)              | 3 ink + 4 VULN                       |
| 9   | `ancestor_archive` | Ancestor Archive | Archives Ancestrales | SKILL | 1e   | UNCOMMON | Draw 3 cards. Gain 1 energy. Exhaust.                            | Draw 4 + 1 energy + exhaust (cost 2) | Draw 4 + 1 energy + exhaust          |
| 10  | `cosmic_spider`    | Cosmic Spider    | Araignée Cosmique    | POWER | 2e   | RARE     | Gain 2 strength. Apply 3 VULNERABLE to ALL. Gain 2 ink. Exhaust. | —                                    | 2 STR + 4 VULN ALL + 2 ink + exhaust |

---

## 13. Recapitulatif Actuel

- Collection affichee (hors STATUS/CURSE): **274**
- Pool actif (collectible): **230**
- Neutres actifs: **50**
- Repartition neutres active: **LIBRARY 10**, autres biomes **5**
- Quota perso actif: **10 Scribe + 10 Bibliothecaire** sur chacun des 9 biomes

| Segment                                | Quantite |
| -------------------------------------- | -------: |
| Collection (visuel)                    |      274 |
| Pool actif (gameplay)                  |      230 |
| Ecart non-actif (isCollectible: false) |       44 |

---

## 14. Checklist Maintenance

### Si vous ajustez les quotas

- [ ] Mettre a jour `src/game/data/cards.ts` (`characterId`, `isCollectible`)
- [ ] Verifier la Collection vs le pool actif
- [ ] Verifier les filtres rewards/merchant (`isCollectible !== false`)

### Commandes utiles

```bash
npm run type-check
```

### Note importante

La Collection affiche toutes les cartes jouables (sauf `STATUS`/`CURSE`),
alors que le gameplay utilise le pool actif (cartes collectibles).
