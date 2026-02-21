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
- [x] Multi-boss (un boss par biome)

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

### UI / admin / divers

- [x] Bouton `Dev Kill` visible uniquement pour role `ADMIN`
- [x] Ecran biome select entre floors
- [x] HUD rewards ressources

## A faire

### Equilibrage

- [ ] Passer d'un calibrage "fonctionnel" a un calibrage fin biome par biome (HP, degats, frequences)
- [ ] Ajuster les vitesses de progression des unlocks cartes (trop lent/trop rapide selon biome)
- [ ] Verifier la courbe difficulte floors 4-5 en conditions reelles

### Contenu cartes/enemies

- [ ] Ajouter des cartes statut/malediction
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
