# Card Pool Audit

Generated from `src/game/data/cards.ts`.

## Totals

- All card definitions: **260**
- Playable lootable cards (excluding STATUS/CURSE): **251**
- Active reward/merchant pool (`isCollectible !== false`): **237**
- Hand-authored active cards (excluding generated bestiary): **197**
- Active bestiary cards: **40**

## Collection By Biome

Counts below include generated bestiary cards.

| Biome | Neutral | Scribe | Bibliothecaire | Griot | Fou | Total |
| --- | --- | --- | --- | --- | --- | --- |
| LIBRARY | 1 | 16 | 15 | 8 | 7 | 47 |
| VIKING | 5 | 4 | 4 | 6 | 6 | 25 |
| GREEK | 5 | 5 | 6 | 5 | 4 | 25 |
| EGYPTIAN | 5 | 6 | 4 | 6 | 4 | 25 |
| LOVECRAFTIAN | 6 | 4 | 4 | 4 | 8 | 26 |
| AZTEC | 8 | 5 | 4 | 5 | 6 | 28 |
| CELTIC | 5 | 5 | 4 | 7 | 4 | 25 |
| RUSSIAN | 4 | 4 | 8 | 4 | 5 | 25 |
| AFRICAN | 5 | 6 | 5 | 4 | 5 | 25 |

## Active Pool By Biome

Counts below include generated bestiary cards.

| Biome | Neutral | Scribe | Bibliothecaire | Griot | Fou | Total |
| --- | --- | --- | --- | --- | --- | --- |
| LIBRARY | 1 | 10 | 10 | 8 | 7 | 36 |
| VIKING | 5 | 4 | 4 | 6 | 6 | 25 |
| GREEK | 5 | 5 | 6 | 5 | 4 | 25 |
| EGYPTIAN | 5 | 6 | 4 | 6 | 4 | 25 |
| LOVECRAFTIAN | 6 | 4 | 4 | 4 | 8 | 26 |
| AZTEC | 5 | 5 | 4 | 5 | 6 | 25 |
| CELTIC | 5 | 5 | 4 | 7 | 4 | 25 |
| RUSSIAN | 4 | 4 | 8 | 4 | 5 | 25 |
| AFRICAN | 5 | 6 | 5 | 4 | 5 | 25 |

## Active Hand-Authored Pool By Biome

Counts below exclude generated bestiary cards.

| Biome | Neutral | Scribe | Bibliothecaire | Griot | Fou | Total |
| --- | --- | --- | --- | --- | --- | --- |
| LIBRARY | 1 | 10 | 10 | 8 | 7 | 36 |
| VIKING | 5 | 3 | 4 | 4 | 4 | 20 |
| GREEK | 5 | 4 | 3 | 4 | 4 | 20 |
| EGYPTIAN | 5 | 3 | 4 | 4 | 4 | 20 |
| LOVECRAFTIAN | 6 | 4 | 3 | 4 | 4 | 21 |
| AZTEC | 5 | 3 | 4 | 4 | 4 | 20 |
| CELTIC | 5 | 4 | 3 | 4 | 4 | 20 |
| RUSSIAN | 4 | 3 | 5 | 4 | 4 | 20 |
| AFRICAN | 5 | 5 | 3 | 3 | 4 | 20 |

## Active Bestiary By Biome

Bestiary cards are still attached to a biome via `card.biome`, even when they are generated from enemy unlocks.

| Biome | Neutral | Scribe | Bibliothecaire | Griot | Fou | Total |
| --- | --- | --- | --- | --- | --- | --- |
| LIBRARY | 0 | 0 | 0 | 0 | 0 | 0 |
| VIKING | 0 | 1 | 0 | 2 | 2 | 5 |
| GREEK | 0 | 1 | 3 | 1 | 0 | 5 |
| EGYPTIAN | 0 | 3 | 0 | 2 | 0 | 5 |
| LOVECRAFTIAN | 0 | 0 | 1 | 0 | 4 | 5 |
| AZTEC | 0 | 2 | 0 | 1 | 2 | 5 |
| CELTIC | 0 | 1 | 1 | 3 | 0 | 5 |
| RUSSIAN | 0 | 1 | 3 | 0 | 1 | 5 |
| AFRICAN | 0 | 1 | 2 | 1 | 1 | 5 |

## Build Coverage By Biome

Counts below use the active non-bestiary pool so generated mastery cards do not hide hand-authored gaps.

| Biome | Vulnerable | Weak | Poison | Bleed | Ink | Draw | Discard | Exhaust | Missing |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LIBRARY | 2 | 1 | 7 | 3 | 7 | 10 | 1 | 10 | none |
| VIKING | 1 | 4 | 1 | 6 | 2 | 7 | 1 | 6 | none |
| GREEK | 5 | 4 | 1 | 1 | 5 | 9 | 2 | 5 | none |
| EGYPTIAN | 6 | 3 | 5 | 1 | 11 | 7 | 1 | 4 | none |
| LOVECRAFTIAN | 6 | 3 | 2 | 2 | 7 | 4 | 11 | 7 | none |
| AZTEC | 2 | 2 | 2 | 4 | 8 | 3 | 1 | 2 | none |
| CELTIC | 3 | 2 | 6 | 1 | 9 | 11 | 1 | 3 | none |
| RUSSIAN | 2 | 7 | 1 | 1 | 5 | 5 | 3 | 4 | none |
| AFRICAN | 8 | 2 | 1 | 2 | 8 | 12 | 3 | 6 | none |

## Build Tag Totals

These totals use the active non-bestiary pool. Tags overlap: one card can count for multiple builds.

| Total Cards | Vulnerable | Weak | Poison | Bleed | Ink | Draw | Discard | Exhaust |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 197 | 35 | 28 | 26 | 21 | 62 | 68 | 24 | 47 |

## Hand-Authored Pattern Hotspots

- No repeated hand-authored patterns across 3+ cards.

## Bestiary Exact Duplicate Mechanics

- No exact duplicate mechanics detected in active bestiary cards.

## Bestiary Pattern Hotspots

- No repeated bestiary mechanic patterns detected.

## Global Exact Duplicate Mechanics

- No exact duplicate mechanics detected across active cards.

## Global Pattern Hotspots

- **2 cards** share `{"effects":[{"type":"DAMAGE","value":"#"},{"buff":"WEAK","type":"DAMAGE_PER_DEBUFF","value":"#"}],"energyCost":"#","inkCost":"#","inkedVariant":null,"onRandomDiscardEffects":[],"targeting":"SINGLE_ENEMY","type":"ATTACK","upgrade":{"effects":[{"type":"DAMAGE","value":"#"},{"buff":"WEAK","type":"DAMAGE_PER_DEBUFF","value":"#"}],"energyCost":null,"onRandomDiscardEffects":[]}}`
  frost_nail (RUSSIAN/neutral), bestiary_normal_winter_wolf (RUSSIAN/fou)

## Guardrails

- Character pools: {"scribe":39,"bibliothecaire":39,"griot":39,"fou":39}
- Simple cards: 95/197
- Numeric-only inked variants: 20
- Numeric-only legacy upgrades: 190
- Numeric-only resolved branch-A upgrades: 0
- Numeric-only resolved branch-B upgrades: 0
- Invalid dual upgrades: 0
- Stages over the readability budget: 0
