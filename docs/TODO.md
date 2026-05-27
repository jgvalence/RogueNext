# Panlibrarium - TODO

> Tout ce qui est complété a été retiré. Ne reste que l'ouvert.

---

## Equilibrage

### Playtest requis

- [ ] Verifier en playtest la nouvelle cadence d'unlocks (early runs, builds signatures, starts speciaux)
- [ ] Verifier la courbe difficulte floors 2-3 en conditions reelles
- [ ] Verifier en playtest la nouvelle repartition des `ALLY_SLOTS` entre arbres (cap cible `3`)
- [ ] Verifier en playtest le nouveau cluster meta `LIBRARY` (`draw`, `energy`, `opening hand`) apres les nerfs
- [ ] Verifier si `RUSSIAN` tier 2 reste trop fade apres le pass couts/identite

### Problemes identifies par le simulateur (scripts/simulate.ts)

> Baseline conservatrice (events skippés, navigation non-stratégique) — les vraies valeurs sont ~5-10pp plus hautes.
> Limites simulateur : GREEK et RUSSIAN sous-evalues de ~10-15pp (mecanique multi-cibles + boss phases).
> Cibles visées : diff 0 minimal meta = ~20% (new player clears floor 3) ; diff 0 average meta = ~45% ; diff 2 = ~25-30% (max) toutes builds.

- [x] **Diff 0 inaccessible nouveaux joueurs** — floor ramp implémenté : floor 1 à 0.70×HP/0.80×dmg, floor 2 à 0.88×HP/0.90×dmg, floor 3 intact. Résultat : minimal meta 19% wins, 70% défaites sur floor 3 ; average meta 44%.
- [x] **Build ink structurellement faible** — spectral_inkwell 1→2 ink/tour, ink_stamp 3→4 ; rage_of_ages, ancient_grove, griot_legacy génèrent 1 ink en jouant une carte POWER
- [x] **Recalibration difficulté prestige (diff 3/4/5)** — HP/DMG/disruption ajustés pour cibles 15-20% / 5-10% / 1-5% (meta max, build armor). `blockPenetrationFraction` 5% à diff 4 pour nerf ciblé armor sans pénaliser DOT. Résultats : armor diff3=26.7% diff4=6.7% diff5=1.7%.
- [x] **DOT sous-évalué** — tick POISON/BLEED porté à 1.5× par stack (base). Bonus reliques +1.0 (scarab_idol, briar_seed, venom_grimoire, hemorrhage_codex). Gap armor/DOT structurel accepté — DOT viable en meta max diff 3 uniquement.
- [ ] **Build armor dominant** — nerf partiel via blockPenetrationFraction diff 4. Gap résiduel armor vs DOT à diff 4/5 accepté structurellement.
- [ ] **Spread builds trop large** — diff 1 : draw 82.5% vs ink 58.5% (24pp) ; cible : tous les builds dans un couloir de ±10pp
- [ ] **Falaise difficulte 1 → 2** — winrate mixed : 76% → 46% (÷1.65) ; acceptable mais à surveiller
- [ ] **LIBRARY max trivial** (99%) — structurel : boss sans mécanique complexe ; accepter ou ajouter une mécanique défensive

---

## Contenu

### Cartes / ennemis

- [ ] Verifier en playtest et affiner les routes inter-biomes existantes (desirabilite des bridges, ponts cibles si besoin)

### Personnages jouables

- [ ] Ajouter des personnages jouables supplementaires (decks/stats differents)
- [ ] Eventuelles histoires dediees a l'unlock de cartes precises (au lieu de regles generiques seulement)

### Contenu manquant

- [x] Objets utilisables — pool élargi avec 10 potions supplementaires
- [x] Previews biomes — 6 biomes sur 9 affichent "Coming soon..." dans `biomes.ts` (champ `enemyPreview`) ; rédiger les descriptions
- [x] Contenu alliés — 5 allies supplementaires ajoutes au pool
- [x] **Bazar des Reliques** — nouvelle salle spéciale (~8% de chance) : marchand propose 3 reliques, offres renouvelées après chaque échange, pas de cap. Action `EXCHANGE_RELIC` dans le reducer.

### Bestiaire

- [ ] **Monster background mythologique** — voir [docs/monster-background.md](monster-background.md)
- [ ] **Remplacer le lore bestiaire genere** — ecrire de vraies entrees uniques pour chaque ennemi et chaque palier de lore
  - Prioriser au minimum les ennemis les plus vus du biome `LIBRARY`

---

## Narration & Histoire

> Voir `docs/evolution-histoire.md` pour le detail complet de chaque phase.

### Reste de Phase 3 (reporté en Phase 4+6)

- [ ] Ajouter `flags?: Record<string, boolean>` a `RunState` (schema Zod + migration DB)
- [ ] Helpers `setFlag` / `hasFlag` dans `run.ts`

### Reste de Phase 5 (dépend du boss final)

- [ ] Hook boss final : Le Censeur reagit selon `scribeAttitude` (positif / neutre / negatif) _(Phase 9)_

### Phase 4+6 — Stats mythiques (sprint unique)

- [ ] `hubris?: number` a `RunState` (GREEK, 0-10)
- [ ] `maatBalance?: number` a `RunState` (EGYPTIAN, -5 a +5)
- [ ] Events biome-specifiques branchant ces stats
- [ ] `Judgment of Osiris` reagit a `maatBalance` (meca conditionnelle)
- [ ] Affichage discret dans l'UI pendant le run

### Phase 7 — Quetes de run (serments / propheties)

- [ ] Interface `RunQuest` + `activeQuest` dans `RunState`
- [ ] `checkQuestCompletion` a chaque fin de combat
- [ ] 2 quetes pilotes VIKING + UI header

### Phase 8 — Sceaux de Tome (metaprogression narrative)

- [ ] Stocker via le systeme `resources` existant (cles `__SEAL_X`)
- [ ] Generer un sceau apres certains boss (`rewards.ts`)
- [ ] 5 textes de sceaux revelant l'histoire de la Censure
- [ ] Affichage dans l'ecran de fin de run

### Phase 9 — Boss final : Le Censeur _(objectif long terme)_

- [ ] Entree boss `the_censor` dans `enemies.ts` (asset SVG deja prevu dans `assets.ts`)
- [ ] Mecanique "censure des cartes" (phase 1) — nouveau type d'effet engine
- [ ] HP caches reveles par les degats (phase 2)
- [ ] 4 endings selon flags majeurs + `hubris` + sceaux

---

## Dynamisme visuel

- [ ] Transitions entre écrans — aucune transition animée entre les vues (marchand, carte, événement) : tout apparaît instantanément
- [ ] Cartes en main — pas de hover 3D, pas de flottement léger au repos
- [ ] Feedback résolution d'effet AoE — les cartes ciblant `ALL_ENEMIES` ne montrent pas d'enchaînement visuel sur chaque ennemi

---

## UX / technique

- [ ] Historique de runs (query key existe, page manquante)
- [ ] Tutoriel/onboarding
- [ ] Option vitesse/skip animations
- [ ] Auth DB adapter désactivé (`src/lib/auth/config.ts:39`) — réactiver une fois le conflit `@auth/core` résolu
