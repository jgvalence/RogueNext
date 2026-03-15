# Card Pool Audit - 2026-03-15

Audit verifie directement sur [cards.ts](/c:/Projects/RogueNext/src/game/data/cards.ts) via [audit-card-pool.ts](/c:/Projects/RogueNext/scripts/audit-card-pool.ts).

## Constats

- Le pool a encore bouge depuis l'audit du 11 mars 2026.
- Le total jouable hors `STATUS` / `CURSE` est maintenant de **236** cartes.
- Le pool actif `isCollectible !== false` est maintenant de **222** cartes.
- Le pool actif manuel hors bestiaire est de **182** cartes.
- Le bestiaire actif contient **40** cartes, bien rattachees a des biomes via `card.biome`.
- Le bestiaire ne remonte plus ni doublon mecanique exact, ni pattern repete.
- Le pool global n'a plus de doublon mecanique exact.
- Le pool manuel ne remonte plus de hotspot de similarite a **3 cartes ou plus**.
- Les cartes `Focus` rejouables ont ete nettoyees: il ne reste plus que **2 exceptions volontaires** hors `POWER`, `sphinx_riddle` et `norn_prophecy`.

## Totaux

| Segment | Quantite |
| --- | ---: |
| Definitions totales | 245 |
| Cartes jouables hors `STATUS` / `CURSE` | 236 |
| Pool actif (`isCollectible !== false`) | 222 |
| Pool actif manuel hors bestiaire | 182 |
| Cartes bestiaire actives | 40 |

## Collection jouable par biome

Ces chiffres incluent les cartes bestiaire.

| Biome | Neutres | Scribe | Bibliothecaire | Total |
| --- | ---: | ---: | ---: | ---: |
| LIBRARY | 1 | 16 | 15 | 32 |
| VIKING | 5 | 10 | 10 | 25 |
| GREEK | 5 | 10 | 10 | 25 |
| EGYPTIAN | 5 | 10 | 10 | 25 |
| LOVECRAFTIAN | 6 | 10 | 10 | 26 |
| AZTEC | 8 | 11 | 9 | 28 |
| CELTIC | 5 | 10 | 10 | 25 |
| RUSSIAN | 5 | 10 | 10 | 25 |
| AFRICAN | 5 | 10 | 10 | 25 |
| **TOTAL** | **45** | **97** | **94** | **236** |

## Pool actif par biome

Ces chiffres incluent les cartes bestiaire.

| Biome | Neutres | Scribe | Bibliothecaire | Total |
| --- | ---: | ---: | ---: | ---: |
| LIBRARY | 1 | 10 | 10 | 21 |
| VIKING | 5 | 10 | 10 | 25 |
| GREEK | 5 | 10 | 10 | 25 |
| EGYPTIAN | 5 | 10 | 10 | 25 |
| LOVECRAFTIAN | 6 | 10 | 10 | 26 |
| AZTEC | 5 | 11 | 9 | 25 |
| CELTIC | 5 | 10 | 10 | 25 |
| RUSSIAN | 5 | 10 | 10 | 25 |
| AFRICAN | 5 | 10 | 10 | 25 |
| **TOTAL** | **42** | **91** | **89** | **222** |

## Pool actif manuel par biome

Ces chiffres excluent les cartes bestiaire et servent de reference pour la couverture des builds.

| Biome | Neutres | Scribe | Bibliothecaire | Total |
| --- | ---: | ---: | ---: | ---: |
| LIBRARY | 1 | 10 | 10 | 21 |
| VIKING | 5 | 8 | 7 | 20 |
| GREEK | 5 | 8 | 7 | 20 |
| EGYPTIAN | 5 | 6 | 9 | 20 |
| LOVECRAFTIAN | 6 | 8 | 7 | 21 |
| AZTEC | 5 | 8 | 7 | 20 |
| CELTIC | 5 | 8 | 7 | 20 |
| RUSSIAN | 4 | 8 | 8 | 20 |
| AFRICAN | 5 | 8 | 7 | 20 |
| **TOTAL** | **41** | **72** | **69** | **182** |

## Bestiaire actif par biome

Oui: les cartes bestiaire sont bien liees a des biomes. Elles gardent un `card.biome`, et l'audit montre aujourd'hui une repartition de `5` cartes actives par biome non-LIBRARY, `0` en LIBRARY.

| Biome | Neutres | Scribe | Bibliothecaire | Total |
| --- | ---: | ---: | ---: | ---: |
| LIBRARY | 0 | 0 | 0 | 0 |
| VIKING | 0 | 2 | 3 | 5 |
| GREEK | 0 | 2 | 3 | 5 |
| EGYPTIAN | 0 | 4 | 1 | 5 |
| LOVECRAFTIAN | 0 | 2 | 3 | 5 |
| AZTEC | 0 | 3 | 2 | 5 |
| CELTIC | 0 | 2 | 3 | 5 |
| RUSSIAN | 1 | 2 | 2 | 5 |
| AFRICAN | 0 | 2 | 3 | 5 |
| **TOTAL** | **1** | **19** | **20** | **40** |

## Couverture des builds par biome

Le tableau ci-dessous utilise le pool actif manuel hors bestiaire, pour ne pas masquer les trous de design.

| Biome | Vulnerable | Weak | Poison | Bleed | Ink | Draw | Discard | Exhaust | Manques |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| LIBRARY | 2 | 1 | 1 | 1 | 3 | 6 | 1 | 6 | aucun |
| VIKING | 1 | 4 | 1 | 6 | 2 | 7 | 1 | 6 | aucun |
| GREEK | 5 | 4 | 1 | 1 | 5 | 9 | 1 | 5 | aucun |
| EGYPTIAN | 6 | 2 | 5 | 1 | 11 | 7 | 1 | 4 | aucun |
| LOVECRAFTIAN | 6 | 3 | 2 | 2 | 7 | 4 | 10 | 7 | aucun |
| AZTEC | 2 | 3 | 2 | 4 | 8 | 3 | 1 | 2 | aucun |
| CELTIC | 3 | 2 | 6 | 1 | 8 | 11 | 1 | 3 | aucun |
| RUSSIAN | 2 | 7 | 1 | 1 | 5 | 5 | 3 | 4 | aucun |
| AFRICAN | 8 | 2 | 1 | 2 | 7 | 12 | 1 | 5 | aucun |

## Totaux des tags de build

Ces chiffres portent sur les **182 cartes actives manuelles hors bestiaire**. Les tags se chevauchent: une meme carte peut compter dans plusieurs builds.

| Total cartes | Vulnerable | Weak | Poison | Bleed | Ink | Draw | Discard | Exhaust |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 182 | 35 | 28 | 20 | 19 | 56 | 64 | 20 | 42 |

## Redondances restantes

### Doublons exacts

- Aucun doublon mecanique exact dans le pool actif global.
- Aucun doublon mecanique exact dans le bestiaire actif.

### Bestiaire

- Aucun pattern bestiaire repete n'apparait encore dans l'audit.
- Le pass bestiaire est donc propre sur le critere "pas de clones manifestes".

### Hotspots manuels encore visibles

- Aucun pattern manuel ne remonte encore a `3` cartes ou plus.
- Les redondances restantes sont maintenant des **paires**, pas des familles trop visibles.
- Les paires les plus nettes restantes sont surtout:
  `heavy_strike` / `mythic_blow`,
  `final_chapter` / `scribes_judgment`,
  `brace` / `ancient_ward`,
  `berserker_charge` / `bear_claw`.

## Lecture design

- La couverture minimale des 8 tags est toujours satisfaite dans tous les biomes sur le pool manuel.
- Le vrai angle de travail n'est plus le bestiaire.
- Le vrai sujet restant est surtout la desirabilite des routes de deck et, au besoin, le nettoyage de quelques paires encore proches.
- Les cartes `Focus` rejouables sont maintenant limitees a `sphinx_riddle` et `norn_prophecy`; les autres sources `Focus` non-POWER sont passees en `Exhaust` ou ont perdu `Focus`.
- Les tags les plus denses du pool manuel restent `draw`, `ink` et `exhaust`.
- Les tags les moins denses restent `bleed` et `discard`; ce n'est pas un probleme en soi, mais il faut que leurs payoffs restent memorables.

## Commandes utiles

```bash
npm run audit:cards
npm run audit:cards -- --json
```
