# Audit visuel V1 - combat et cartes

## Scope

Audit base sur la lecture des composants suivants :

- `src/app/game/_components/combat/GameCard.tsx`
- `src/app/game/_components/combat/HandArea.tsx`
- `src/app/game/_components/combat/EnemyCard.tsx`
- `src/app/game/_components/combat/CombatView.tsx`
- `src/app/game/_components/combat/combat-battlefield.tsx`
- `src/app/game/_components/combat/combat-player-zone.tsx`
- `src/app/game/_components/combat/combat-desktop-grid.tsx`
- `src/app/game/_components/combat/combat-mobile-grid.tsx`
- `src/app/game/_components/combat/use-combat-visual-effects.ts`
- `src/app/game/_components/combat/DamageNumber.tsx`
- `tailwind.config.ts`
- `src/app/globals.css`

## Verdict court

La base visuelle est deja solide pour une V1 :

- il y a deja du feedback de combat
- il y a deja des animations utiles
- les etats gameplay importants sont exposes
- le jeu a deja une palette dark fantasy / archive coherente

Le manque principal n'est pas une feature. C'est un manque de **signature visuelle**.

Aujourd'hui, le combat est lisible et fonctionnel, mais il ne vend pas encore assez :

- la valeur des cartes
- l'identite propre de chaque biome
- l'impact des actions
- une sensation "premium" sur les elements les plus regardes

## Ce qui fonctionne deja

### 1. Le socle motion existe deja

Le projet a deja les briques utiles :

- `animate-card-play`
- `animate-card-discard`
- `animate-enemy-acting`
- `animate-enemy-attack`
- `animate-enemy-summon-enter`
- `animate-float-up`
- reshuffle burst entre defausse et pioche
- player hit flash

Conclusion : il ne faut pas reinventer le systeme. Il faut le **raffiner**.

### 2. Le layout combat est clair

Le split battlefield / player zone est bon.

- les ennemis sont bien separes de la main
- les ressources joueur sont visibles
- les overlays sont deja en place
- le flow desktop/mobile existe deja

Conclusion : le probleme n'est pas architectural. Il est surtout dans le rendu.

### 3. Les etats gameplay sont deja exposes

Sur les cartes, on voit deja :

- cout
- type
- upgrade
- variant inked
- frozen
- selection
- bonus d'attaque

Sur les ennemis, on voit deja :

- HP
- block
- buffs
- intent
- incoming damage
- boss / elite

Conclusion : le contenu visuel existe deja, mais la hierarchie est encore faible.

## Findings prioritaires

### P0 - Les cartes n'ont pas encore un rendu "hero asset"

### Constat

`GameCard.tsx` fait deja beaucoup de choses, mais la carte reste visuellement compacte et un peu utilitaire :

- art tres petite par rapport a la hauteur totale
- beaucoup de micro-textes en `8px` / `9px` / `10px`
- plusieurs badges empiles dans peu d'espace
- la rarete est surtout exprimee par une couleur de texte
- la frame reste proche d'un simple panneau sombre avec bordure coloree
- le bouton inked compete avec la description au lieu de prolonger naturellement la carte

### Impact

La carte est l'objet le plus regarde du jeu. Si elle n'a pas assez de presence :

- la main parait "petite"
- les recompenses paraissent moins desirables
- les upgrades semblent moins excitants
- l'UX reste plus proche d'un prototype avance que d'un jeu fini

### A ajouter

- Refaire la frame de carte en 3 zones plus nettes :
  - tete: cout + nom + type
  - art: plus haute, avec vignette et overlay leger
  - corps: description plus stable
- Donner une vraie grammaire de rarete :
  - `STARTER`: sobre
  - `COMMON`: neutre
  - `UNCOMMON`: liseres et reflets
  - `RARE`: frame plus noble, foil/glow discret
- Refaire le cout comme un vrai medaillon/gemme au lieu d'un petit badge coin superieur
- Donner a l'etat `upgraded` une lecture immediate meme sans lire le `+`
- Integrer la variante inked comme une zone secondaire de carte, pas comme un bouton rajoute
- Reduire le bruit visuel des badges secondaires

### Fichiers

- `src/app/game/_components/combat/GameCard.tsx`
- `src/app/game/_components/combat/HandArea.tsx`

### P0 - Les biomes ne colorent pas assez le combat

### Constat

Le biome existe via les backgrounds, mais dans `combat-battlefield.tsx` la scene reste dominee par le meme bain bleu/cyan pour tout le monde :

- fond de biome a `opacity-20`
- overlays globaux tres similaires quel que soit le biome
- player zone quasi identique dans tous les biomes
- draw/discard/end turn gardent le meme langage visuel

Resultat : on change de biome en logique, mais pas assez en sensation.

### Impact

Tu perds une partie de la "vibe" que tu veux faire passer run apres run.

### A ajouter

- Creer des tokens visuels par biome :
  - accent principal
  - accent secondaire
  - glow
  - overlay battlefield
  - teinte de panel
- Monter la presence du fond biome sans nuire a la lisibilite
- Teinter certains elements du HUD combat avec le biome courant :
  - contour du battlefield
  - bandeau de tour
  - player zone
  - highlights de selection
- Ajouter un leger layer d'atmosphere par biome :
  - poussieres de sable pour `EGYPTIAN`
  - brume froide pour `VIKING`
  - grain cosmique / scanline subtile pour `LOVECRAFTIAN`
  - particules feuilles / cendres / pollen selon biome

### Fichiers

- `src/app/game/_components/combat/combat-battlefield.tsx`
- `src/app/game/_components/combat/combat-player-zone.tsx`
- `src/app/game/_components/combat/CombatView.tsx`
- `src/app/globals.css`

### P1 - Le feedback d'impact existe, mais reste trop generique

### Constat

Les animations sont la, mais le ressenti d'impact peut monter d'un cran :

- `DamageNumber.tsx` est minimal
- l'attaque ennemie est une translation generique
- la carte jouee vole vers le centre de la ligne ennemie, pas vers une cible precise
- pas de micro-flash directionnel ou d'impact shape sur la cible
- peu de difference perceptible entre une petite action et une grosse action

### Impact

Le combat repond, mais ne "frappe" pas encore assez.

### A ajouter

- Faire voyager la carte jouee vers la cible reelle quand une cible existe
- Ajouter un flash d'impact sur la cible :
  - slash rouge pour degats
  - pulse cyan pour ink
  - eclat jaune pour block / shield break
- Enrichir les `DamageNumber` :
  - taille variable selon l'ampleur
  - wobble court a l'apparition
  - meilleure couleur pour crit / gros degats si ce concept existe plus tard
- Ajouter un mini shake de panel ou screen punch tres court sur gros hit / boss hit
- Differencier visuellement :
  - damage
  - poison / bleed tick
  - heal
  - gain de block

### Fichiers

- `src/app/game/_components/combat/HandArea.tsx`
- `src/app/game/_components/combat/DamageNumber.tsx`
- `src/app/game/_components/combat/EnemyCard.tsx`
- `src/app/game/_components/combat/use-combat-visual-effects.ts`
- `tailwind.config.ts`

### P1 - Le langage visuel desktop/mobile n'est pas encore assez unifie

### Constat

Le desktop utilise des cartes d'ennemis riches (`EnemyCard.tsx`) alors que le mobile passe sur des tuiles beaucoup plus compactes dans `combat-mobile-grid.tsx`.

Ce choix est logique pour l'espace, mais le style change beaucoup :

- desktop: vraie presence carte
- mobile: resume utilitaire

### Impact

Le jeu peut sembler plus "cheap" sur mobile que sur desktop, meme si la logique UX est bonne.

### A ajouter

- Garder une silhouette de carte ou au moins une frame plus marquee sur mobile
- Unifier les codes d'art, de badges, de HP, de bordure boss/elite
- Augmenter la sensation de "piece de jeu" sur mobile, meme en version compacte
- Faire en sorte que mobile soit une declinaison du desktop, pas un autre langage

### Fichiers

- `src/app/game/_components/combat/EnemyCard.tsx`
- `src/app/game/_components/combat/combat-desktop-grid.tsx`
- `src/app/game/_components/combat/combat-mobile-grid.tsx`

### P1 - La zone joueur est lisible mais trop utilitaire

### Constat

La `combat-player-zone.tsx` fonctionne tres bien, mais plusieurs elements ressemblent encore a des boutons de debug/outil :

- pioche
- defausse
- epuise
- inventaire
- bouton fin de tour

Le tout donne une impression "dashboard" plus que "table de jeu mythique".

### A ajouter

- Re-designer les piles comme des objets de table :
  - tome
  - pile de pages
  - urne / reliquaire
  - bac d'archives
- Donner au bouton fin de tour une vraie stature de CTA principal
- Ajouter de petites icones ou motifs au lieu de tout faire tenir dans du texte
- Mieux distinguer visuellement :
  - info passive
  - action primaire
  - action secondaire

### Fichiers

- `src/app/game/_components/combat/combat-player-zone.tsx`
- `src/app/game/_components/combat/InkGauge.tsx`

### P2 - La typographie est fonctionnelle, pas encore memorable

### Constat

Le systeme est lisible, mais beaucoup de labels reposent sur :

- tout en uppercase
- petites tailles
- Geist/system style neutre

### A ajouter

- Introduire une font display pour quelques endroits seulement :
  - noms de cartes
  - titres de biome
  - headers de reward / combat state
- Garder la font actuelle pour le corps et les infos utilitaires
- Eviter de multiplier les micro-labels en uppercase partout

### Note

Ce n'est pas un prerequis V1 dur. C'est un multiplicateur de finition.

## Pack polish V1 recommande

Si tu veux un pass tres rentable sans ouvrir un chantier infini, je recommande cet ordre :

### Lot 1 - Cartes

- Refonte de `GameCard.tsx`
- meilleure frame
- meilleure rarete
- meilleure hierarchie texte/art/cout
- meilleur rendu upgrade
- meilleure integration de l'etat inked

Effet attendu : gain visible immediat dans toute la boucle de jeu.

### Lot 2 - Identite biome

- variables visuelles par biome
- battlefield plus teinte
- player zone contextualisee
- 1 couche d'atmosphere par biome

Effet attendu : chaque biome commence a "sentir" different sans refaire le contenu.

### Lot 3 - Impact combat

- target-aware card play
- flashes d'impact
- damage numbers enrichis
- micro screen punch ou panel punch

Effet attendu : le combat parait plus vivant sans devenir bruyant.

### Lot 4 - Coherence mobile/desktop

- harmoniser les cartes/tuiles de combat
- conserver le meme langage visuel dans les deux vues

Effet attendu : moins de sensation de downgrade sur mobile.

## Ce que je ne prioriserais pas avant ce pass

- nouvelles grosses features narratives
- Le Censeur
- quetes de run
- stats mythiques
- skip animation

Le meilleur retour court terme est clairement dans :

- la carte
- la vibe biome
- l'impact des actions

## Shortlist de taches concretes

### P0

- Rework complet de `GameCard.tsx`
- Ajouter un theme visuel par biome au battlefield et a la player zone
- Monter la presence du fond biome

### P1

- Faire cibler l'animation de carte vers l'ennemi reel
- Refaire `DamageNumber.tsx`
- Ajouter des impacts brefs par type d'action
- Restyler draw / discard / exhaust / inventory / end turn

### P2

- Harmoniser mobile et desktop
- Ajouter une font display ciblee
- Ajouter des textures legeres / overlays premium

## Recommendation finale

Pour une V1, je ferais un **visual polish pass centre sur le combat**, pas un polish global du jeu.

La meilleure sequence est :

1. `GameCard`
2. battlefield biome
3. impact feedback
4. player zone controls

Si ces 4 points montent d'un cran, la perception generale du jeu montera beaucoup plus que avec une nouvelle feature systemique.
