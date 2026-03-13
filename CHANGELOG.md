# Changelog

## 1.1.0 - 2026-03-13

### Ajouts et ameliorations

- Refonte visuelle majeure de la zone de combat sur mobile et desktop, avec theming par biome, intentions ennemies plus lisibles, cartes retravaillees et meilleure ergonomie tactile.
- Rework de l'ecran de fin de run et des surfaces de rewards, avec presentation enrichie des ressources gagnees, cartes debloquees et reliques debloquees.
- Nouveau systeme de selection des offres de cartes pour les rewards et le marchand, avec mix biome courant / hors biome et ponderations ciblees sur certaines signatures.
- Mise a jour de la meta-progression avec nouveaux caps moteur, ajout du `STARTING_FOCUS` et redistribution de certains bonus d'histoires.
- Synchronisation de progression de fin de run corrigee pour appliquer correctement les multiplicateurs de ressources gagnees.

### Contenu et equilibrage

- Rework large du pool de cartes, des effets moteur, des textes localises et de plusieurs ennemis / histoires pour renforcer l'identite des builds et casser les noyaux trop repetitifs.
- Ajout d'un apercu plus riche des intentions ennemies, y compris bonus de degats conditionnels, effets annexes et previews de phase 2.
- Ajustements sur les rewards, la difficulte, le deck, les reliques, le tutoriel de bibliotheque et plusieurs schemas de donnees.

### Outils et qualite

- Ajout de scripts d'audit pour le pool de cartes, les descriptions d'histoires et la cadence des signatures.
- Documentation de design et d'audit etendue dans `docs/`.
- Couverture de tests renforcee sur le moteur, la meta-progression, les histoires, les textes de cartes et les helpers de combat.
