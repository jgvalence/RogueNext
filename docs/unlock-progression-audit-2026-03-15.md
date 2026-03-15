# Audit unlock progression - 2026-03-15

## Objectif

Verifier que:

- quelques cartes, reliques et options de run tombent des les premieres runs
- les builds signatures ne sont pas bloques par une carte marquee trop tardive
- l'endgame garde quand meme quelques objectifs aspirational

## Constats avant pass

### Cartes

Les unlocks de base etaient globalement sains:

- commons: `BIOME_FIRST_ENTRY`
- uncommons: `elite 1-3`
- rares: `boss 1-2`

Mais plusieurs cartes signature de build arrivaient trop tard:

- `final_chapter`: `LIBRARY boss 2 + elite 2`
- `curator_pact`: `LIBRARY runs 2 + story le_codex_infini`
- `fates_decree`: `GREEK boss 2`
- `book_of_the_dead`: `EGYPTIAN boss 2`
- `cosmic_archive`: `LOVECRAFTIAN boss 2`
- `folk_epic`: `RUSSIAN boss 2`

Constat design:

- les builds existaient sur le papier
- mais certains payoffs / bridges iconiques n'arrivaient qu'assez tard, donc les runs early-mid voyaient surtout les enablers

### Reliques

Les reliques de mastery ennemi etaient deja sur une cadence saine:

- normals: `5 kills`
- elites: `3 kills`
- bosses: `2 kills`

Le vrai sujet etait les reliques purement basees sur:

- `totalRuns`
- `wonRuns`
- `bestGoldInSingleRun`

Plusieurs restaient dans une zone `8-14 runs` / `5-8 wins`, trop tardive pour donner un vrai sentiment de progression entre les premieres runs.

### Conditions de run

La base early etait correcte avec plusieurs conditions deja visibles au depart.

Le trou etait plutot au milieu:

- peu de renouvellement supplementaire entre `runs 3-5`
- les starts speciaux de boss demandaient `3 kills` de boss, donc arrivaient tard par rapport aux reliques boss mastery a `2 kills`

## Pass applique

### Cartes

Objectif retenu:

- les rares signatures de build doivent etre visibles au `premier boss clear` du biome quand elles portent un build
- les bridges importants ne doivent pas attendre `elite 3` si ce n'est pas necessaire

Changements principaux:

- `final_chapter` -> `LIBRARY boss 1 + elite 1`
- `curator_pact` -> `LIBRARY boss 1 + story grimoire_des_index`
- `fates_decree` -> `GREEK boss 1`
- `book_of_the_dead` -> `EGYPTIAN boss 1`
- `cosmic_archive` -> `LOVECRAFTIAN boss 1`
- `folk_epic` -> `RUSSIAN boss 1`
- `battle_inscription` -> `VIKING elite 2`
- `sacred_ink_burst` -> `EGYPTIAN elite 2`

### Reliques

Objectif retenu:

- garder les mastery combat tres tot
- rapprocher les reliques "compte joueur" du midgame
- laisser les reliques globales / difficulty milestones en endgame

Changements principaux:

- `library_catalog_discount`: `8 -> 5 runs`
- `library_midnight_press`: `5 -> 3 wins`
- `viking_skald_ledger`: `10 -> 6 runs`
- `greek_oracle_drachma`: `12 -> 7 runs`
- `greek_stoa_treatise`: `6 -> 4 wins`
- `egypt_tomb_ledger`: `9 -> 6 runs`
- `egypt_golden_canopic`: `300 -> 240 gold`
- `love_forbidden_contract`: `8 -> 5 wins`
- `aztec_codex_market`: `14 -> 8 runs`
- `aztec_blood_calendar`: `7 -> 4 wins`
- `celtic_grove_compass`: `11 -> 7 runs`
- `russian_frost_ledger`: `9 -> 6 runs`
- `african_griot_archive`: `12 -> 7 runs`
- `african_sunbird_refrain`: `7 -> 4 wins`

### Conditions de run

Objectif retenu:

- garder une base immediate
- densifier les unlocks entre `runs 3-5`
- faire arriver les starts de boss au meme moment que la mastery boss de base

Changements principaux:

- `fractured_archive`: `4/1 -> 3/1`
- `chaos_draft`: `4/1 -> 3/1`
- `cursed_compendium`: `4 -> 3 runs`
- `crystal_loan`: `4/1 -> 3/1`
- `inkwell_bargain`: `5/2 -> 4/1`
- `forged_lexicon`: `5/2 -> 4/1`
- `eventful_routes`: `5 -> 4 runs`
- `severed_index`: `5/2 -> 4/2`
- `merciless_routes`: `7/3 -> 6/2`
- `grim_shortcuts`: `7/3 -> 6/2`
- `fateful_manuscript`: `8/3 -> 7/2`
- `boss_rush`: `8/3 -> 7/3`
- `boss_start_option_*`: `3 -> 2 kills` du boss

## Ligne de design retenue

- debut de progression: quelques unlocks visibles tres vite
- early-mid: les builds signatures deviennent jouables sans attendre le second boss clear d'un biome
- endgame: les objectifs de difficulte et les reliques globales gardent leur role de prestige

## Risques a surveiller en playtest

- `curator_pact` trop present trop tot si la route Library devient trop deterministe
- `book_of_the_dead` et `cosmic_archive` trop visibles si leurs builds deviennent les meilleurs spikes du midgame
- les starts speciaux de boss peuvent devenir trop nombreux trop vite si un joueur farm un biome unique

## Validation cible

- verifier qu'un joueur debloque quelques reliques et conditions avant la run `5`
- verifier que les builds `vulnerable`, `discard/clog`, `exhaust`, `ink` et `weak/thorns` ont tous au moins un vrai payoff accessible avant la phase endgame
