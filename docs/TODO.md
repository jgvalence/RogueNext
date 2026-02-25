# Panlibrarium - TODO

## Fait

### Gameplay core

- [x] Combat loop complet (joueur/ennemis, energie, block, pioche, defausse)
- [x] Systeme Ink + powers (REWRITE, LOST_CHAPTER, SEAL)
- [x] Variantes Inked
- [x] Buffs/debuffs principaux (POISON, STRENGTH, WEAK, VULNERABLE, FOCUS, THORNS)
- [x] RNG seedee reproductible

### Progression run

- [x] 5 etages (`MAX_FLOORS = 5`)
- [x] Difficulte croissante par etage
- [x] HP ennemis scales par floor
- [x] Chance elite augmente par floor
- [x] Taille des groupes ennemis augmente par floor
- [x] Selection ennemis ponderee par difficulte (`tier`) + etage

### Contenu

- [x] Cartes lootables pour tous les biomes (LIBRARY + 8 biomes)
- [x] Ennemis pour tous les biomes (normaux + elite + boss)
- [x] Multi-boss (deux boss par biome, choix aleatoire)
- [x] Relique unique par boss (18 reliques boss-specifiques, garanties en recompense)
- [x] IA boss conditionnelle (poids conditionnels par situation, phase 2 differenciee)
- [x] Buff BLEED (saignement, expire par duree uniquement, distinct du POISON)
- [x] 24 nouveaux ennemis (2 normaux + 1 elite par biome hors LIBRARY)
- [x] 23 nouvelles cartes (7 ALWAYS LIBRARY + 8 COMMON biome + 8 UNCOMMON biome)
- [x] Unlocks progressifs tier 2 (BIOME_ELITE_KILLS count:2, BIOME_BOSS_KILLS count:2)
- [x] 8 nouvelles reliques a mecaniques reactives (turn-start, turn-end, card-played)

### Meta progression (Bibliotheque)

- [x] 45 histoires (9 biomes x 5)
- [x] Ressources biome + accumulation en fin de run
- [x] Gain ressources scale: normal < elite (x2) < boss (x4)
- [x] Bonus victoire run x1.5
- [x] `HEAL_AFTER_COMBAT` implemente
- [x] Bonus defensifs ajoutes: regen par tour + reduction premier hit

### Unlock cartes

- [x] Systeme cartes lock/unlock entre runs
- [x] Conditions supportees:
  - premiere entree biome
  - kill elite biome
  - kill boss biome
  - nb de runs completes par biome
  - unlock via histoire (arbre de competences)
- [x] Rewards cartes filtrees par cartes debloquees
- [x] Shop cartes filtre selon cartes debloquees

### Difficulte et Run Conditions

- [x] 4 niveaux de difficulte (0-3), debloquables apres 1/3/5 victoires
- [x] Difficulte filtre cartes/reliques disponibles
- [x] 10 Run Conditions (modificateurs de run) avec unlock progressif
- [x] Conditions modifient: or de depart, HP max, cartes de depart, regles de map

### Systeme audio

- [x] Musique de fond par zone
- [x] SFX (jouer carte, hit, victoire...)
- [x] Toggle mute

### UI / admin / divers

- [x] Bouton `Dev Kill` visible uniquement pour role `ADMIN`
- [x] Ecran biome select entre floors + transitions
- [x] Choix de biome a l'ouverture du run (LIBRARY + 1 aleatoire)
- [x] Evenement relic garanti une fois par run (Sealed Reliquary)
- [x] HUD rewards ressources
- [x] Menu in-game (abandon run, mute, regles, logout)
- [x] Support mobile + fullscreen (detection orientation, prompt rotation)
- [x] Modal inspection deck complet
- [x] Systeme tooltips (descriptions buffs au survol)
- [x] Apercu upgrade carte au survol

## A faire

### Equilibrage

- [ ] Passer d'un calibrage "fonctionnel" a un calibrage fin biome par biome (HP, degats, frequences)
- [ ] Ajuster les vitesses de progression des unlocks cartes (trop lent/trop rapide selon biome)
- [ ] Verifier la courbe difficulte floors 4-5 en conditions reelles

### Contenu cartes/enemies

- [ ] Enrichir le pool de cartes STATUS/CURSE (types implementes, peu de cartes)
- [ ] Enrichir les patterns conditionnels de boss (IA plus contextuelle)
- [ ] Ajouter des synergies inter-biomes plus marquees

### Meta progression

- [ ] Ajouter des personnages jouables supplementaires (decks/stats differents)
- [ ] Eventuelles histoires dediees a l'unlock de cartes precises (au lieu de regles generiques seulement)

### UX / technique

- [ ] Historique de runs
- [ ] Minimap de progression de floor
- [ ] Tutoriel/onboarding
- [ ] Option vitesse/skip animations
