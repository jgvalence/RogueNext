# Panlibrarium (RogueNext)

Deck-builder roguelike web inspiré de *Slay the Spire*. Le joueur traverse des livres de mythologie, construit son deck et utilise l'Encre pour réécrire ses cartes.

## État du projet

Le jeu dispose d'une boucle de run jouable, de 9 biomes, de quatre personnages, d'une méta-progression, de sauvegardes, de plusieurs niveaux de difficulté et de boss à mécaniques propres.

L'état détaillé, les limites connues et les priorités sont documentés dans [docs/ETAT_DU_JEU.md](docs/ETAT_DU_JEU.md). Les tâches encore ouvertes sont dans [docs/TODO.md](docs/TODO.md).

## Lancer le projet

Prérequis : Node.js 18+, npm 9+ et une base PostgreSQL.

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Sous PowerShell, remplacer `cp` par `Copy-Item`.

## Vérifications

```bash
npm run type-check
npm run test
npm run build
npm run audit:cards
npm run audit:relics
npm run audit:stories
```

La [passe finale du 10 octobre 2026](docs/PASSE_FINALE_EQUILIBRAGE_ET_RECETTE_2026-10-10.md) détaille l'équilibrage, les simulations et la recette bureau/mobile. Les tests de publication comprennent également l'installation et la mise à jour PWA.

## Jouer et installer la PWA

Le jeu est disponible sur [rogue-next.vercel.app](https://rogue-next.vercel.app).

- Sur Chrome ou Edge, utiliser « Installer le jeu » lorsque le navigateur le propose, ou son menu d'installation.
- Sur iPhone/iPad, ouvrir le jeu dans Safari puis utiliser Partager → Sur l'écran d'accueil.
- Une connexion est nécessaire pour se connecter, démarrer une partie et synchroniser les sauvegardes.
- Les mises à jour sont recherchées au retour dans l'application et périodiquement. Le bouton « Mettre à jour » apparaît hors expédition ; aucun combat n'est rechargé automatiquement.

Le service worker et le manifeste sont générés à la compilation. `/api/version` expose la révision Git déployée et la version des règles pour vérifier une publication.

## Documentation utile

- [Comprendre le projet](docs/COMPRENDRE_LE_PROJET.md) : architecture technique et flux principaux.
- [Spécification du jeu](docs/PROJECT_DOC.md) : vision et règles générales.
- [Bible des cartes](docs/card-design-bible.md) : conventions de conception.
- [Méta-progression](docs/META_PROGRESSION.md) : ressources, histoires et bonus permanents.
- [Design narratif](docs/evolution-histoire.md) et [mythologies](docs/mythologie.md).
- [Design system](docs/design-system-antD.md) et [audit visuel](docs/visual.md).
- [Assets](docs/ASSETS.md) et [crédits audio](docs/AUDIO_CREDITS.md).

Le code du jeu se trouve principalement dans `src/game`, l'interface dans `src/app/game`, les services de persistance dans `src/server`, et le schéma de données dans `prisma`.
