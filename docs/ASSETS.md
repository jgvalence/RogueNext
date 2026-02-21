# Asset Download Guide

All asset paths are configured in `src/lib/assets.ts` and `src/lib/sound.ts`.
Drop files into `public/` following the structure below — no code changes needed.

---

## Images

### Enemy art — `public/images/enemies/`

**Source:** [Kenney Roguelike/RPG Pack](https://kenney.nl/assets/roguelike-rpg-pack) (CC0)

| File name             | Suggested sprite from Kenney pack  |
|-----------------------|------------------------------------|
| `ink_slime.webp`      | `slime.png`                        |
| `paper_golem.webp`    | `golem.png`                        |
| `ink_wraith.webp`     | `ghost.png`                        |
| `page_knight.webp`    | `knight.png`                       |
| `blot_beast.webp`     | `demon.png`                        |
| `ink_archon.webp`     | `wizard.png`                       |
| `tome_colossus.webp`  | `ogre.png`                         |
| `venom_wyrm.webp`     | `dragon.png`                       |
| `the_censor.webp`     | `lich.png` (or any boss sprite)    |

Convert PNGs to WebP: `cwebp input.png -q 90 -o output.webp`

---

### Card art — `public/images/cards/`

**Source:** [Pixel Dungeon Card Set on itch.io](https://itch.io/) — search "card art pixel" (many CC0 packs)

| File name        | Description            |
|------------------|------------------------|
| `strike.webp`    | Sword / attack icon    |
| `defend.webp`    | Shield / block icon    |
| `ink_surge.webp` | Magic / ink swirl icon |

---

### Backgrounds — `public/images/backgrounds/`

**Source:** [Free dungeon backgrounds on OpenGameArt](https://opengameart.org/) — search "dungeon background"

| File name      | Description       |
|----------------|-------------------|
| `combat.webp`  | Dark dungeon room |
| `map.webp`     | Overworld / map   |

---

### Player avatar — `public/images/player/`

| File name     | Description          |
|---------------|----------------------|
| `avatar.webp` | Hero portrait (64px) |

---

## Sounds

All sound files should be `.ogg` (best browser compatibility).

### UI — `public/sounds/ui/`

**Source:** [Freesound.org](https://freesound.org) (filter: CC0)

| File name        | Search terms                  |
|------------------|-------------------------------|
| `card_play.ogg`  | "card flip", "whoosh soft"    |
| `card_draw.ogg`  | "paper slide", "card draw"    |
| `button_click.ogg` | "ui click", "button click"  |

### Combat — `public/sounds/combat/`

| File name          | Search terms                      |
|--------------------|-----------------------------------|
| `player_hit.ogg`   | "player hurt", "hit grunt"        |
| `enemy_attack.ogg` | "sword swing", "attack whoosh"    |
| `enemy_hit.ogg`    | "hit impact", "flesh hit"         |
| `enemy_death.ogg`  | "monster death", "creature die"   |

### Results — `public/sounds/result/`

| File name       | Search terms                     |
|-----------------|----------------------------------|
| `victory.ogg`   | "victory fanfare", "level up"    |
| `defeat.ogg`    | "defeat sting", "game over"      |

### Music — `public/sounds/music/`

**Source:** [Soundimage.org](https://soundimage.org) — free, no attribution required

| File name         | Description              |
|-------------------|--------------------------|
| `combat.ogg`      | Tense dungeon loop       |
| `exploration.ogg` | Ambient exploration loop |

---

## Quick setup (bash)

```bash
# Create all directories
mkdir -p public/images/{enemies,cards,backgrounds,player}
mkdir -p public/sounds/{ui,combat,result,music}
```

## Notes

- Images that fail to load fall back to emoji placeholders automatically (no crash).
- Sounds that fail to load are silently ignored (`SOUNDS_ENABLED = true` in `src/lib/sound.ts`).
- To globally mute sounds during development, set `SOUNDS_ENABLED = false` in `src/lib/sound.ts`.
- To swap any asset, update only its path in `src/lib/assets.ts` or `src/lib/sound.ts`.
