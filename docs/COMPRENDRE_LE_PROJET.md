# RogueNext — Comprendre l'architecture

> Le jeu n'est qu'un prétexte. L'objectif est de maîtriser Next.js 15, les Server Actions, Zod, React Query, NextAuth, et Prisma dans un vrai projet structuré.

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Structure des dossiers](#2-structure-des-dossiers)
3. [Le flux de données de bout en bout](#3-le-flux-de-données-de-bout-en-bout)
4. [Zod — Validation des données](#4-zod--validation-des-données)
5. [Server Actions — Mutations sans API](#5-server-actions--mutations-sans-api)
6. [React Query — État serveur côté client](#6-react-query--état-serveur-côté-client)
7. [NextAuth v5 — Authentification](#7-nextauth-v5--authentification)
8. [Gestion des erreurs](#8-gestion-des-erreurs)
9. [Prisma — Accès à la base de données](#9-prisma--accès-à-la-base-de-données)
10. [Variables d'environnement typées](#10-variables-denvironnement-typées)
11. [Les composants UI](#11-les-composants-ui)
12. [i18n — Internationalisation](#12-i18n--internationalisation)
13. [La logique du jeu (game/)](#13-la-logique-du-jeu-game)
14. [État du jeu côté client (game-provider)](#14-état-du-jeu-côté-client-game-provider)
15. [Meta-progression et déblocage](#15-meta-progression-et-déblocage)
16. [Difficulté et conditions de run](#16-difficulté-et-conditions-de-run)
17. [Schéma de la base de données](#17-schéma-de-la-base-de-données)
18. [Ce que tu dois retenir](#18-ce-que-tu-dois-retenir)

---

## 1. Vue d'ensemble

Ce projet suit une architecture **server-first** avec Next.js App Router. Le principe de base :

```
Navigateur (Client)
    │
    ▼
Next.js App Router
    ├── Server Components  →  rendu HTML côté serveur, accès direct à la DB
    └── Client Components  →  interactivité, state local, formulaires
            │
            ▼ (Server Actions ou fetch)
    Logique serveur
            │
            ▼
    Prisma → PostgreSQL
```

**Règle d'or :** tout ce qui peut être rendu sur le serveur l'est. Un Client Component (`"use client"`) n'est créé que quand on a besoin d'interactivité (état, événements, hooks).

---

## 2. Structure des dossiers

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Layout racine (i18n, QueryProvider, Toaster)
│   ├── page.tsx                  # Page d'accueil
│   ├── globals.css               # Styles globaux (Tailwind)
│   ├── manifest.ts               # PWA manifest
│   ├── middleware.ts             # Auth middleware (protection de routes)
│   ├── api/
│   │   ├── auth/[...nextauth]/   # Endpoint NextAuth (GET + POST)
│   │   └── example/route.ts     # Exemple d'API Route
│   ├── (auth)/                   # Pages d'authentification
│   │   ├── signin/page.tsx
│   │   └── signup/page.tsx
│   ├── game/                     # Interface de jeu
│   │   ├── layout.tsx            # Layout commun de jeu
│   │   ├── page.tsx              # Lobby du jeu
│   │   ├── error.tsx             # Error boundary
│   │   ├── [runId]/page.tsx      # Page d'un run en cours
│   │   ├── _providers/
│   │   │   └── game-provider.tsx # État global du jeu (useReducer)
│   │   ├── _hooks/
│   │   │   └── use-auto-save.ts  # Auto-sauvegarde des runs
│   │   └── _components/          # Composants UI du jeu
│   │       ├── shared/           # Composants transversaux
│   │       │   ├── buff-meta.ts  # État partagé pour les buffs
│   │       │   ├── BuffPill.tsx
│   │       │   ├── CardPickerModal.tsx
│   │       │   ├── CardUpgradePreview.tsx
│   │       │   ├── DeckViewerModal.tsx
│   │       │   ├── EnergyOrb.tsx
│   │       │   ├── GameLayout.tsx
│   │       │   ├── HpBar.tsx
│   │       │   ├── parse-description.tsx
│   │       │   ├── RulesModal.tsx
│   │       │   ├── Tooltip.tsx
│   │       │   └── UpgradePreviewPortal.tsx
│   │       ├── combat/           # Vue de combat
│   │       │   ├── CombatView.tsx
│   │       │   ├── DamageNumber.tsx
│   │       │   ├── EnemyCard.tsx
│   │       │   ├── GameCard.tsx
│   │       │   ├── HandArea.tsx
│   │       │   ├── InkGauge.tsx
│   │       │   └── PlayerStats.tsx
│   │       ├── map/              # Carte du donjon
│   │       │   └── FloorMap.tsx
│   │       ├── merchant/         # Boutique
│   │       │   ├── ShopView.tsx
│   │       │   └── StartMerchantView.tsx
│   │       ├── rewards/          # Écran de récompenses
│   │       │   └── RewardScreen.tsx
│   │       ├── special/          # Salles spéciales (événements)
│   │       │   └── SpecialRoomView.tsx
│   │       ├── biome/            # Sélection de biome
│   │       │   └── BiomeSelectScreen.tsx
│   │       ├── preboss/          # Salle pré-boss
│   │       │   └── PreBossRoomView.tsx
│   │       ├── run-difficulty/   # Sélection de difficulté
│   │       │   └── RunDifficultySelectScreen.tsx
│   │       ├── run-condition/    # Sélection de condition de run
│   │       │   └── RunConditionSelectScreen.tsx
│   │       └── run-setup/        # Écran de préparation du run
│   │           └── RunSetupScreen.tsx
│   ├── leaderboard/              # Classement global
│   │   ├── page.tsx
│   │   └── _components/
│   │       └── LeaderboardClient.tsx
│   ├── library/                  # Page bibliothèque (meta-progression)
│   │   ├── page.tsx
│   │   ├── collection/page.tsx
│   │   └── _components/          # BiomeSection, CardCollectionClient...
│   └── rules/                    # Page des règles
│       └── page.tsx
│
├── server/
│   └── actions/
│       ├── run.ts                # Actions de run (createRun, saveState...)
│       ├── auth.ts               # Actions d'authentification
│       ├── game-data.ts          # Lecture des données de jeu (cartes, ennemis...)
│       ├── progression.ts        # Meta-progression utilisateur
│       └── example.ts            # Modèle d'action à copier
│
├── lib/
│   ├── auth/
│   │   ├── config.ts             # Config NextAuth
│   │   └── helpers.ts            # requireAuth(), requireRole(), can()...
│   ├── db/
│   │   └── prisma.ts             # Singleton Prisma Client
│   ├── errors/
│   │   ├── types.ts              # Classes d'erreurs (UnauthorizedError, etc.)
│   │   └── handlers.ts           # handleServerActionError(), success()
│   ├── i18n/
│   │   ├── index.ts              # Config i18next + détection de langue
│   │   ├── card-text.ts          # Localisation des cartes
│   │   ├── entity-text.ts        # Localisation des entités (ennemis, alliés)
│   │   ├── stories.ts            # Localisation des histoires
│   │   └── messages/
│   │       ├── fr.ts             # Traductions françaises (langue par défaut)
│   │       └── en.ts             # Traductions anglaises
│   ├── query/
│   │   ├── client.ts             # Config QueryClient (staleTime, retry...)
│   │   ├── provider.tsx          # <QueryProvider> wrappant toute l'app
│   │   ├── game-keys.ts          # Factory de query keys
│   │   └── hooks/
│   │       └── use-game-data.ts  # Hooks React Query pour les données de jeu
│   ├── utils/
│   │   ├── cn.ts                 # cn() — merge classes Tailwind
│   │   ├── format.ts             # formatPrice(), formatDate()...
│   │   └── file-upload.ts        # Helpers upload de fichiers
│   ├── assets.ts                 # Chemins vers les assets (images, sons)
│   ├── env.ts                    # Variables d'env validées par Zod
│   ├── music.ts                  # Gestion de la musique
│   └── sound.ts                  # Gestion des effets sonores
│
├── components/
│   ├── ui/
│   │   ├── button.tsx            # Button avec variants CVA
│   │   ├── card.tsx              # Card + sous-composants
│   │   └── input.tsx             # Input avec label et erreur
│   ├── auth/
│   │   └── LogoutButton.tsx
│   ├── home/
│   │   └── HomeContent.tsx
│   ├── rules/
│   │   └── RulesContent.tsx
│   ├── shared/
│   │   ├── GlobalLanguageDock.tsx  # Sélecteur de langue flottant
│   │   └── LanguageSwitcher.tsx
│   └── providers/
│       └── I18nProvider.tsx      # Provider React pour i18next
│
├── game/                          # Logique du jeu (pure, sans effets de bord)
│   ├── constants.ts               # Constantes globales du jeu
│   ├── engine/                    # Fonctions pures du moteur (22 fichiers)
│   │   ├── buffs.ts               # Application et tick des buffs
│   │   ├── card-unlocks.ts        # Déblocage de cartes (meta-progression)
│   │   ├── card-upgrades.ts       # Amélioration de cartes
│   │   ├── cards.ts               # Logique de jeu des cartes
│   │   ├── combat.ts              # Init et gestion du combat
│   │   ├── damage.ts              # Calcul des dégâts
│   │   ├── deck.ts                # Pioche, défausse, mélange
│   │   ├── difficulty.ts          # Modificateurs de difficulté
│   │   ├── effects.ts             # Résolution des effets
│   │   ├── enemies.ts             # IA et capacités ennemies
│   │   ├── enemy-intent-preview.ts # Preview de l'intention ennemie
│   │   ├── incoming-damage.ts     # Calcul des dégâts entrants (pour la UI)
│   │   ├── ink.ts                 # Pouvoirs d'encre (REWRITE, LOST_CHAPTER, SEAL)
│   │   ├── items.ts               # Objets utilisables (potions...)
│   │   ├── loot.ts                # Génération de butin
│   │   ├── merchant.ts            # Boutique et prix
│   │   ├── meta.ts                # Bonus de meta-progression
│   │   ├── relics.ts              # Effets des reliques
│   │   ├── rewards.ts             # Récompenses post-combat
│   │   ├── rng.ts                 # PRNG déterministe (mulberry32)
│   │   ├── run-conditions.ts      # Conditions de run
│   │   └── run.ts                 # Init du run, sélection des salles, événements
│   ├── data/                      # Données statiques du jeu (9 fichiers)
│   │   ├── index.ts               # Exports + lookup maps
│   │   ├── allies.ts              # 3 alliés persistants
│   │   ├── biomes.ts              # 9 biomes
│   │   ├── cards.ts               # 99 cartes
│   │   ├── combat-doctrine.ts     # Règles d'équilibrage combat
│   │   ├── enemies.ts             # 90 ennemis répartis sur 9 biomes
│   │   ├── histoires.ts           # Histoires débloquables (meta-progression)
│   │   ├── relics.ts              # 51 reliques (COMMON à BOSS rarity)
│   │   └── starter-deck.ts        # Deck de départ du joueur
│   ├── schemas/                   # Schémas Zod de validation du state (9 fichiers)
│   │   ├── index.ts
│   │   ├── enums.ts               # Tous les enums du jeu
│   │   ├── cards.ts               # CardDefinition, CardInstance...
│   │   ├── effects.ts             # Effect (type, value, buff, duration)
│   │   ├── entities.ts            # PlayerState, EnemyState, AllyState, BuffInstance
│   │   ├── items.ts               # UsableItemDefinition, UsableItemInstance
│   │   ├── combat-state.ts        # CombatState complet
│   │   ├── run-state.ts           # RunState complet
│   │   └── meta.ts                # ComputedMetaBonuses
│   └── __tests__/                 # Tests unitaires Vitest
│       ├── difficulty.test.ts
│       ├── engine.test.ts
│       ├── run-conditions.test.ts
│       └── schemas.test.ts
│
└── test/
    └── setup.ts                   # Config Vitest + mocks Next.js
```

---

## 3. Le flux de données de bout en bout

Voici ce qui se passe quand un utilisateur clique "Nouvelle partie" :

```
[Bouton "Nouvelle partie" — Client Component]
        │
        │  appelle
        ▼
[createRunAction() — src/server/actions/run.ts]
        │
        ├── 1. Zod valide l'input (seed optionnel)
        ├── 2. requireAuth() vérifie la session JWT
        ├── 3. Logique métier (crée le RunState initial)
        ├── 4. prisma.run.create() → INSERT en DB
        ├── 5. revalidatePath("/game") → invalide le cache Next.js
        └── 6. return success({ runId, state })
        │
        ▼
[Composant client reçoit le résultat]
        │
        ├── Si result.success → navigate vers /game/[runId]
        └── Si !result.success → affiche result.error.message
```

Une fois en jeu, le flux est différent — les actions se passent **côté client** :

```
[Clic sur une carte — Client Component]
        │
        ▼
[dispatch({ type: "PLAY_CARD", ... }) — game-provider.tsx]
        │
        ▼
[gameReducer() — logique pure côté client]
        │
        ├── playCard() → effets, dégâts, buffs
        ├── Nouveau RunState
        └── Mise à jour du state React (via useReducer)
        │
        ▼ (en arrière-plan, toutes les X secondes)
[use-auto-save.ts → saveRunStateAction() → prisma.run.update()]
```

**Point important :** pendant le combat, tout tourne côté client. La sauvegarde en DB est asynchrone et non-bloquante.

---

## 4. Zod — Validation des données

### Principe

Zod permet de valider des données à l'exécution (runtime) tout en inférant automatiquement les types TypeScript. Plus besoin de dupliquer les types et les validations.

### Comment c'est utilisé ici

**Dans une Server Action :**

```typescript
// src/server/actions/run.ts

// 1. On définit le schéma
const createRunSchema = z.object({
  seed: z.string().optional(),
});

// 2. On infère le type depuis le schéma (pas de type manuel)
export async function createRunAction(input: z.infer<typeof createRunSchema>) {
  // 3. On valide au runtime (peut lever une ZodError)
  const validated = createRunSchema.parse(input);
  // validated.seed est maintenant string | undefined — TypeScript le sait
}
```

**Pour les schémas du jeu** (dans `src/game/schemas/`) :

```typescript
// src/game/schemas/run-state.ts
export const RunStateSchema = z.object({
  runId: z.string(),
  floor: z.number().int().min(1),
  gold: z.number().int().min(0),
  deck: z.array(CardInstanceSchema),
  // ...
});

export type RunState = z.infer<typeof RunStateSchema>;
// RunState est inféré automatiquement — pas de doublon
```

**Pour les variables d'environnement :**

```typescript
// src/lib/env.ts
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(), // doit être une URL valide
    NEXTAUTH_SECRET: z.string().min(32), // min 32 caractères
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
});
// Si DATABASE_URL est manquante → crash immédiat au démarrage, pas en prod
```

### Ce que tu dois apprendre avec Zod

| Méthode                  | Usage                                         |
| ------------------------ | --------------------------------------------- |
| `z.object({})`           | Valider un objet                              |
| `z.string().min(n)`      | String avec longueur min                      |
| `z.string().email()`     | Email valide                                  |
| `z.string().url()`       | URL valide                                    |
| `z.enum(["A", "B"])`     | Valeur parmi une liste                        |
| `z.optional()`           | Champ non obligatoire                         |
| `.parse(data)`           | Valide et lance une erreur si invalide        |
| `.safeParse(data)`       | Valide et retourne `{ success, data, error }` |
| `z.infer<typeof schema>` | Inférer le type TypeScript                    |

---

## 5. Server Actions — Mutations sans API

### C'est quoi

Une Server Action est une fonction `async` qui s'exécute **uniquement sur le serveur**, mais qu'on peut appeler depuis un Client Component comme si c'était une fonction normale. Next.js génère automatiquement un endpoint HTTP derrière.

La directive `"use server"` en haut du fichier marque toutes les fonctions comme des Server Actions.

### La structure type dans ce projet

```typescript
// src/server/actions/run.ts
"use server";

export async function saveRunStateAction(input: z.infer<typeof saveRunStateSchema>) {
  try {
    // Étape 1 — Validation Zod
    const validated = saveRunStateSchema.parse(input);

    // Étape 2 — Authentification
    const user = await requireAuth(); // lance UnauthorizedError si pas connecté

    // Étape 3 — Autorisation (l'utilisateur possède-t-il cette ressource ?)
    const run = await prisma.run.findUnique({ where: { id: validated.runId } });
    if (!run || run.userId !== user.id) {
      throw new Error("Run not found or access denied");
    }

    // Étape 4 — Logique métier + DB
    await prisma.run.update({ ... });

    // Étape 5 — Invalider le cache si besoin
    // revalidatePath("/game");

    // Étape 6 — Retourner le succès
    return success({ saved: true });

  } catch (error) {
    // Capture toutes les erreurs et les formate proprement
    return handleServerActionError(error);
  }
}
```

### Les actions disponibles

| Fichier          | Actions                                                                              |
| ---------------- | ------------------------------------------------------------------------------------ |
| `run.ts`         | `createRunAction`, `saveRunStateAction`, `loadRunAction`, `abandonRunAction`         |
| `auth.ts`        | `signInAction`, `signUpAction`                                                       |
| `game-data.ts`   | `getCardDefinitionsAction`, `getEnemyDefinitionsAction`, `getRelicDefinitionsAction` |
| `progression.ts` | `getUserProgressionAction`, `updateProgressionAction`                                |

### Le type de retour : `ActionResult<T>`

```typescript
// src/lib/errors/handlers.ts
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: ErrorCode; message: string; ... } };
```

Côté client, on teste toujours `result.success` avant d'utiliser `result.data` :

```typescript
const result = await createRunAction({ seed: "abc" });

if (result.success) {
  console.log(result.data.runId); // TypeScript sait que data existe
} else {
  console.error(result.error.message); // TypeScript sait que error existe
}
```

### Server Actions vs API Routes

|              | Server Action                   | API Route                             |
| ------------ | ------------------------------- | ------------------------------------- |
| Usage        | Formulaires, mutations internes | Webhooks, endpoints publics, fichiers |
| Appel        | Fonction TypeScript directe     | `fetch("/api/...")`                   |
| CSRF         | Protégé automatiquement         | À gérer manuellement                  |
| Type-safety  | Totale (TypeScript end-to-end)  | Partielle (côté client non typé)      |
| Revalidation | `revalidatePath()` intégré      | Manuelle                              |

---

## 6. React Query — État serveur côté client

### Pourquoi React Query

React Query gère le **cache de l'état serveur** côté client. Sans React Query, chaque composant qui a besoin des données d'une API doit gérer lui-même : loading, error, refetch, cache, déduplication des requêtes. React Query fait tout ça automatiquement.

### La configuration dans ce projet

```typescript
// src/lib/query/client.ts
const defaultOptions = {
  queries: {
    staleTime: 60 * 1000, // données "fraîches" pendant 1 minute
    gcTime: 5 * 60 * 1000, // supprimées du cache après 5 min inutilisées
    retry: 1, // 1 retry en cas d'échec
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000), // backoff expo
    refetchOnWindowFocus: false, // pas de refetch quand on revient sur l'onglet
  },
};
```

### Les query keys centralisées

```typescript
// src/lib/query/game-keys.ts
export const gameKeys = {
  all: ["game"] as const,
  cards: () => [...gameKeys.all, "cards"] as const,
  enemies: () => [...gameKeys.all, "enemies"] as const,
  run: (runId: string) => [...gameKeys.all, "run", runId] as const,
};

// Utilisation
useQuery({ queryKey: gameKeys.cards(), queryFn: getCardDefinitionsAction });
```

Centraliser les query keys évite les incohérences lors de l'invalidation du cache.

### Utilisation typique

```typescript
// Dans un Client Component
"use client";
import { useQuery, useMutation } from "@tanstack/react-query";

function GamePage() {
  // Lecture
  const { data, isLoading, error } = useQuery({
    queryKey: gameKeys.cards(),
    queryFn: () => getCardDefinitionsAction(),
  });

  // Mutation
  const { mutate, isPending } = useMutation({
    mutationFn: createRunAction,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: gameKeys.all });
      }
    },
  });
}
```

---

## 7. NextAuth v5 — Authentification

### Architecture

```
Navigateur               Serveur
    │                       │
    │  POST /api/auth/signin │
    ├──────────────────────► │
    │                   authorize()  ← vérifie email/password en DB
    │                   jwt callback ← injecte id + role dans le token
    │ ◄──────────────────────│
    │  Cookie JWT (httpOnly) │
    │                       │
    │  Requête suivante      │
    ├──────────────────────► │
    │                   session callback ← lit le JWT, retourne session
    │ ◄──────────────────────│
    │  session.user.id + role│
```

### La configuration `config.ts`

```typescript
// src/lib/auth/config.ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" }, // JWT stocké en cookie, pas de table sessions

  providers: [
    Credentials({
      async authorize(credentials) {
        // 1. Cherche l'user en DB
        const user = await prisma.user.findUnique({ where: { email } });
        // 2. Vérifie le mot de passe (bcryptjs)
        const ok = await compare(password, user.password);
        // 3. Retourne l'user (ou null si échec)
        return ok ? { id, email, role } : null;
      },
    }),
    // Google et GitHub si les env vars sont présentes
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
});
```

### Le middleware de protection de routes

```typescript
// src/middleware.ts
// Protège automatiquement les routes /game et /library
// Redirige vers /signin si pas authentifié
export { auth as middleware } from "@/lib/auth/config";
export const config = {
  matcher: ["/game/:path*", "/library/:path*"],
};
```

### Les helpers d'autorisation `helpers.ts`

```typescript
// src/lib/auth/helpers.ts

// Récupère la session (avec cache React pour ne pas re-fetch dans le même render)
export const getSession = cache(async () => auth());

// Lance une UnauthorizedError si pas connecté
export async function requireAuth() { ... }

// Lance une ForbiddenError si le rôle ne correspond pas
export async function requireRole(...roles: UserRole[]) { ... }

// Admin peut tout, sinon vérifie que l'user est le propriétaire
export async function requireOwnership(resourceUserId: string) { ... }
```

---

## 8. Gestion des erreurs

### Deux types d'erreurs

| Type                | Exemples             | `isOperational` | Comportement                  |
| ------------------- | -------------------- | --------------- | ----------------------------- |
| **Opérationnelles** | 404, 403, validation | `true`          | Message affiché à l'user      |
| **Techniques**      | Bug, crash DB        | `false`         | Log Sentry, message générique |

### La hiérarchie des classes

```
Error (native JS)
└── AppError (base — code, statusCode, isOperational)
    ├── UnauthorizedError  (401)
    ├── ForbiddenError     (403)
    ├── NotFoundError      (404)
    ├── ValidationError    (400)
    ├── ConflictError      (409)
    ├── RateLimitError     (429)
    ├── InternalError      (500, isOperational=false)
    ├── DatabaseError      (500, isOperational=false)
    ├── InvalidGameStateError  (400)
    └── InsufficientResourceError (400)
```

### Le handler dans les actions

```typescript
// src/lib/errors/handlers.ts
export function handleServerActionError(error: unknown) {
  // AppError → retourne le message tel quel
  if (error instanceof AppError) {
    return { success: false, error: { code, message, field } };
  }
  // ZodError → formate les issues de validation
  if (error instanceof ZodError) {
    return { success: false, error: { code: "VALIDATION_ERROR", issues } };
  }
  // Prisma P2002 (unique) → ConflictError
  // Prisma P2025 (not found) → NotFoundError
  if (error instanceof Prisma.PrismaClientKnownRequestError) { ... }
  // Tout le reste → InternalError (message générique en prod)
  return { success: false, error: { code: "INTERNAL_ERROR", message: ... } };
}
```

---

## 9. Prisma — Accès à la base de données

### Le singleton

```typescript
// src/lib/db/prisma.ts
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: [...] });

// En dev, on réutilise l'instance entre les hot-reloads
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Pourquoi ?** Sans ça, chaque hot-reload en développement créerait une nouvelle connexion DB → épuisement du pool de connexions.

### Utilisation

```typescript
// Lire
const run = await prisma.run.findFirst({
  where: { userId: user.id, status: "IN_PROGRESS" },
  orderBy: { updatedAt: "desc" },
});

// Créer
const run = await prisma.run.create({
  data: { userId: user.id, seed, state: runState, status: "IN_PROGRESS" },
});

// Mettre à jour
await prisma.run.update({
  where: { id: runId },
  data: { status: "VICTORY", endedAt: new Date() },
});
```

---

## 10. Variables d'environnement typées

### La solution avec `@t3-oss/env-nextjs` + Zod

```typescript
// src/lib/env.ts
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(), // URL valide requise
    NEXTAUTH_SECRET: z.string().min(32), // Min 32 chars
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
});

// Utilisation — env.DATABASE_URL est de type string (pas string | undefined)
const db = new PrismaClient({ datasourceUrl: env.DATABASE_URL });
```

Si une variable obligatoire est absente ou invalide au démarrage → **crash immédiat avec un message clair** plutôt qu'une erreur obscure en production.

---

## 11. Les composants UI

### CVA — Class Variance Authority

CVA permet de créer des composants avec des variantes de style déclaratives :

```typescript
// src/components/ui/button.tsx
const buttonVariants = cva(
  "base-classes-communes",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white",
        destructive: "bg-red-600 text-white",
        outline: "border border-gray-300",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-sm",
        lg: "h-12 px-6",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

// Utilisation
<Button variant="destructive" size="lg" isLoading={pending}>
  Supprimer
</Button>
```

### `cn()` — Merge de classes Tailwind

```typescript
// src/lib/utils/cn.ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Pourquoi ? Tailwind génère des conflits si on concatène naïvement :
// "px-4 px-8" → imprévisible
// cn("px-4", "px-8") → "px-8" (tailwind-merge résout le conflit)
```

### Composants UI spécifiques au jeu

| Composant              | Rôle                                                              |
| ---------------------- | ----------------------------------------------------------------- |
| `DeckViewerModal`      | Modale plein écran pour voir toutes les cartes du deck            |
| `CardPickerModal`      | Sélection d'une carte à supprimer (purge marchand + événement)    |
| `Tooltip`              | Tooltip via portail React (`z-[9999]`) — hover sur les buffs      |
| `UpgradePreviewPortal` | Prévisualisation de l'amélioration d'une carte (portail)          |
| `HpBar`                | Barre de HP animée (joueur et ennemis)                            |
| `InkGauge`             | Jauge d'encre avec animation                                      |
| `EnergyOrb`            | Orbe d'énergie stylisée                                           |
| `BuffPill`             | Badge d'affichage d'un buff (icône + stacks) avec tooltip         |
| `parse-description`    | Entoure les noms de buffs dans les descriptions avec des Tooltips |

---

## 12. i18n — Internationalisation

### Architecture

Le projet supporte le français (défaut) et l'anglais via **i18next** + **react-i18next**.

```typescript
// src/lib/i18n/index.ts
i18n
  .use(LanguageDetector) // Détecte la langue du navigateur
  .use(initReactI18next) // Intègre avec React
  .init({
    lng: "fr", // Langue par défaut
    fallbackLng: "fr",
    resources: { fr: { translation: fr }, en: { translation: en } },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"], // Mémorise le choix
    },
  });
```

### Le Provider dans le layout

```typescript
// src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <I18nProvider>          {/* Rend useTranslation disponible */}
          <QueryProvider>
            {children}
            <GlobalLanguageDock />  {/* Dock de sélection de langue */}
            <Toaster />
          </QueryProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
```

### Utilisation dans les composants

```typescript
// Dans n'importe quel Client Component
"use client";
import { useTranslation } from "react-i18next";

function CombatView() {
  const { t } = useTranslation();
  return <button>{t("combat.endTurn")}</button>;
}
```

### Localisation spécifique au jeu

Les noms de cartes, ennemis et histoires ont leurs propres helpers :

```typescript
// src/lib/i18n/card-text.ts
export function getCardName(card: CardDefinition, t: TFunction): string;
export function getCardDescription(card: CardDefinition, t: TFunction): string;

// src/lib/i18n/entity-text.ts
export function getEnemyName(enemy: EnemyDefinition, t: TFunction): string;
```

---

## 13. La logique du jeu (game/)

### Principes fondamentaux

Tout le code dans `src/game/` est **pur** : les fonctions prennent un état et retournent un nouvel état, sans effets de bord, sans appels réseau, sans accès à la DB. Cela rend le jeu testable et déterministe.

```typescript
// Exemple : jouer une carte
// src/game/engine/cards.ts
export function playCard(
  state: RunState,
  cardId: string,
  targetId: string,
  cardDefs: Map<string, CardDefinition>
): RunState {
  // Prend un état, retourne un NOUVEL état — jamais de mutation
  const newState = { ...state };
  // ... logique pure
  return newState;
}
```

### Le RNG déterministe

```typescript
// src/game/engine/rng.ts
// Algorithme mulberry32 — même seed = même séquence
const rng = new RNG(seed);
rng.next(); // float [0, 1)
rng.nextInt(1, 6); // entier [1, 6]
rng.shuffle(array); // mélange in-place déterministe
rng.pick(array); // choisit un élément aléatoirement
```

### Données statiques du jeu

| Fichier              | Contenu                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `cards.ts`           | **99 cartes** (starter, communes, peu communes, rares, boss rewards)    |
| `enemies.ts`         | **90 ennemis** répartis sur 9 biomes + élites + boss (2 par biome)      |
| `relics.ts`          | **51 reliques** (COMMON, UNCOMMON, RARE, BOSS — `sourceBossId?`)        |
| `allies.ts`          | **3 alliés** persistants (Scribe Apprentice, Ward Knight, Ink Familiar) |
| `biomes.ts`          | 9 biomes (LIBRARY + 8 thématiques)                                      |
| `histoires.ts`       | Histoires débloquables (meta-progression)                               |
| `combat-doctrine.ts` | Règles d'équilibrage utilisées lors de la génération des salles         |
| `starter-deck.ts`    | 5 cartes du deck de départ                                              |

### Constantes importantes

```typescript
// src/game/constants.ts
GAME_CONSTANTS = {
  // Structure du donjon
  ROOMS_PER_FLOOR: 16, // 15 salles + 1 boss (index 15)
  BOSS_ROOM_INDEX: 15,
  MAX_FLOORS: 3,
  AVAILABLE_BIOMES: [
    "VIKING",
    "GREEK",
    "EGYPTIAN",
    "LOVECRAFTIAN",
    "AZTEC",
    "CELTIC",
    "RUSSIAN",
    "AFRICAN",
  ],

  // Entités
  MAX_ALLIES: 3,
  MAX_USABLE_ITEMS: 3,
  MAX_ENEMIES: 4,
  MAX_HAND_SIZE: 13,

  // Stats du joueur au départ
  STARTING_HP: 60,
  STARTING_ENERGY: 3,
  STARTING_INK_MAX: 5,
  STARTING_DRAW_COUNT: 4,
  STARTING_GOLD: 0,

  // Récompenses & Boutique
  CARD_REWARD_CHOICES: 3,
  ROOM_CHOICES: 3,

  // Pouvoirs d'encre
  INK_POWER_COSTS: {
    REWRITE: 3, // Rejouer la dernière carte
    LOST_CHAPTER: 2, // Piocher 2 cartes
    SEAL: 2, // Gagner 8 blocs
  },
  SEAL_BLOCK_AMOUNT: 8,
  LOST_CHAPTER_DRAW: 2,

  // Or
  GOLD_REWARD_BASE: 10,
  GOLD_REWARD_VARIANCE: 6,
  GOLD_PER_EXTRA_ENEMY: 5,
  ELITE_GOLD_BONUS: 18,
  BOSS_GOLD_MULTIPLIER: 2,

  // Salles de soin
  HEAL_ROOM_PERCENT: 0.3, // Soigne 30% du max HP
} as const;
```

### Les fichiers moteur clés

| Fichier                   | Rôle                                                                   |
| ------------------------- | ---------------------------------------------------------------------- |
| `effects.ts`              | Résout les `Effect[]` d'une carte ou capacité ennemie (21 KB, central) |
| `enemies.ts`              | IA ennemie, intention preview, boss phases (35 KB)                     |
| `run.ts`                  | Init run, génération des salles, événements (`EVENTS[]`) (44 KB)       |
| `merchant.ts`             | `generateShopInventory()`, `buyShopItem()`, `ShopItem` type (22 KB)    |
| `relics.ts`               | `applyRelicsOnCombatStart()`, effets passifs des reliques (16 KB)      |
| `card-unlocks.ts`         | Gestion des déblocages de cartes par biome/progression (16 KB)         |
| `enemy-intent-preview.ts` | Calcule les dégâts entrants affichés au-dessus des ennemis             |
| `incoming-damage.ts`      | Calcule précisément les dégâts que le joueur va recevoir (pour la UI)  |

### L'IA ennemie : `conditionalWeights`

Les ennemis utilisent un système de poids pour choisir leur capacité. Les `conditionalWeights` permettent de modifier le comportement selon le contexte :

```typescript
// src/game/schemas/entities.ts
type AbilityCondition =
  | { type: "PLAYER_HP_BELOW_PCT"; threshold: number }
  | { type: "ENEMY_HP_BELOW_PCT"; threshold: number }
  | { type: "PLAYER_HAS_DEBUFF"; buff: BuffType }
  | { type: "PLAYER_INK_ABOVE"; value: number }
  | { type: "TURN_MULTIPLE"; n: number }
  | { type: "ALLY_ALIVE" };
// ...

type EnemyAbility = {
  name: string;
  weight: number; // Poids de base
  effects: Effect[];
  conditionalWeights?: {
    // Modificateurs contextuels (optionnel)
    condition: AbilityCondition;
    weight: number;
  }[];
};
```

La fonction `getNextIntentIndex()` dans `enemies.ts` évalue ces conditions à chaque tour pour ajuster les poids.

### Les tests unitaires

Des tests Vitest dans `src/game/__tests__/` couvrent les cas critiques :

- `difficulty.test.ts` — Calculs des modificateurs de difficulté
- `engine.test.ts` — Fonctions pures du moteur
- `run-conditions.test.ts` — Conditions de run
- `schemas.test.ts` — Validation des schémas Zod

---

## 14. État du jeu côté client (game-provider)

### Architecture

Pendant une partie, l'état du jeu vit dans un `useReducer` côté client. Cela évite des allers-retours serveur à chaque action de combat.

```typescript
// src/app/game/_providers/game-provider.tsx
const [state, dispatch] = useReducer(gameReducer, initialState);

// GameContextValue expose :
// - state: RunState           — tout l'état du run
// - dispatch                  — pour déclencher des actions
// - cardDefs: Map<string, CardDefinition>   — lookup rapide
// - enemyDefs: Map<string, EnemyDefinition>
// - allyDefs: Map<string, AllyDefinition>
// - rng: RNG                  — générateur déterministe partagé
// - rewards: CombatRewards | null
```

### Les actions disponibles (GameAction union)

```typescript
// Lifecycle du run
dispatch({ type: "LOAD_RUN", payload: { runState } });
dispatch({ type: "CHOOSE_BIOME", payload: { biome } });
dispatch({ type: "APPLY_DIFFICULTY", payload: { difficultyLevel } });
dispatch({ type: "APPLY_RUN_CONDITION", payload: { conditionId } });
dispatch({ type: "APPLY_HEAL_ROOM" });
dispatch({ type: "ADVANCE_ROOM" });

// Combat
dispatch({ type: "START_COMBAT", payload: { enemyIds } });
dispatch({ type: "PLAY_CARD", payload: { instanceId, targetId, useInked } });
dispatch({ type: "END_TURN" });
dispatch({ type: "BEGIN_ENEMY_TURN" });
dispatch({ type: "EXECUTE_ENEMY_STEP", payload: { enemyInstanceId } });
dispatch({ type: "FINALIZE_ENEMY_TURN" });
dispatch({ type: "RESOLVE_HAND_OVERFLOW_EXHAUST", payload: { cardInstanceId } });

// Objets & Pouvoirs
dispatch({ type: "USE_USABLE_ITEM", payload: { itemInstanceId, targetId } });
dispatch({ type: "USE_INK_POWER", payload: { power, targetId } });

// Cartes
dispatch({ type: "PICK_CARD_REWARD", payload: { definitionId } });
dispatch({ type: "SKIP_CARD_REWARD" });
dispatch({ type: "UPGRADE_CARD", payload: { cardInstanceId } });
dispatch({ type: "APPLY_FREE_UPGRADE", payload: { cardInstanceId } });
dispatch({ type: "MARK_FREE_UPGRADE_USED" });
dispatch({ type: "REMOVE_CARD_FROM_DECK", payload: { cardInstanceId } });

// Récompenses
dispatch({ type: "COMPLETE_COMBAT", payload: { goldReward, biomeResources?, usableItemDropDefinitionId? } });
dispatch({ type: "PICK_RELIC_REWARD", payload: { relicId } });
dispatch({ type: "PICK_ALLY_REWARD", payload: { allyId } });
dispatch({ type: "GAIN_MAX_HP", payload: { amount } });

// Marchand
dispatch({ type: "BUY_SHOP_ITEM", payload: { item } });
dispatch({ type: "REROLL_SHOP" });
dispatch({ type: "BUY_START_MERCHANT_OFFER", payload: { offer } });
dispatch({ type: "COMPLETE_START_MERCHANT" });

// Événements & Dev
dispatch({ type: "APPLY_EVENT", payload: { event, choiceIndex } });
dispatch({ type: "CHEAT_KILL_ENEMY", payload: { enemyInstanceId } });
```

### La sauvegarde automatique

```typescript
// src/app/game/_hooks/use-auto-save.ts
// S'abonne au state, sauvegarde en DB toutes les X secondes
// Et avant de quitter la page (beforeunload)
useAutoSave(state); // → saveRunStateAction() en arrière-plan
```

### La structure du RunState

```
RunState
├── runId, floor, room, seed
├── gold, hp, maxHp, energy
├── inkCurrent, inkMax
├── deck: CardInstance[]         ← deck maître (persiste entre les combats)
├── relics: RelicInstance[]
├── allies: AllyState[]          ← alliés persistants (persistent entre les combats)
├── usableItems: UsableItemInstance[]
├── biome: BiomeType
├── difficulty: number           ← niveau 0-4
├── activeCondition?: RunConditionId
├── rooms: RoomConfig[]          ← plan du run généré au début
├── combat?: CombatState         ← null hors combat
│   ├── drawPile, hand, discardPile, exhaustPile
│   ├── enemies: EnemyState[]
│   ├── player: PlayerState      ← buffs, block, etc.
│   └── turnNumber
└── phase: "BIOME_SELECT" | "COMBAT" | "MERCHANT" | "REWARD" | ...
```

---

## 15. Meta-progression et déblocage

### Principe

La meta-progression persiste **entre les runs**. Elle comprend :

- Les **ressources par biome** (pages, runes, fragments...) — gagnées en combat
- Les **histoires** débloquées
- Les **statistiques** de run (victoires, défaites)

### Le stockage

```typescript
// prisma/schema.prisma → UserProgression
model UserProgression {
  userId           String  @unique
  resources        Json    // Partial<Record<BiomeResource, number>>
  unlockedStoryIds Json    // string[]
  totalRuns        Int
  wonRuns          Int
  lostRuns         Int
  abandonedRuns    Int
  winsByDifficulty Json    // Record<difficultyLevel, victories>
  bestTimeByDifficultyMs Json
}
```

### Les bonus de meta (ComputedMetaBonuses)

```typescript
// src/game/engine/meta.ts
// Calcule des bonus à partir des ressources accumulées
// Exemple : 10 pages → +5% de HP de départ
export function computeMetaBonuses(
  resources: BiomeResources
): ComputedMetaBonuses;
```

### Le déblocage de cartes

```typescript
// src/game/engine/card-unlocks.ts
// Une carte est "débloquée" si le joueur a accumulé assez de ressources
// du biome associé à cette carte
export function getUnlockedCardIds(resources: BiomeResources): string[];
```

---

## 16. Difficulté et conditions de run

### Les niveaux de difficulté (0–4)

Avant chaque run, le joueur choisit un niveau de difficulté. Chaque niveau applique des **modificateurs** au jeu :

```typescript
// src/game/engine/difficulty.ts
export function getDifficultyModifiers(level: number): DifficultyModifiers {
  // Retourne des multiplicateurs applicables aux ennemis, récompenses, etc.
  // Niveau 0 = facile, niveau 4 = très difficile
}
```

La difficulté est sélectionnée dans `RunDifficultySelectScreen.tsx` et appliquée via :

```typescript
dispatch({ type: "APPLY_DIFFICULTY", payload: { difficultyLevel } });
```

### Les conditions de run

Une condition de run est une **contrainte ou un bonus thématique** qui modifie les règles pendant toute la partie (ex: "tu ne peux jouer qu'une carte par tour", "chaque ennemi a +20% de HP") :

```typescript
// src/game/engine/run-conditions.ts
export const RUN_CONDITIONS: RunCondition[] = [...];

export function applyRunConditionToState(
  state: RunState,
  conditionId: string
): RunState;
```

La condition est sélectionnée dans `RunConditionSelectScreen.tsx` et appliquée via :

```typescript
dispatch({ type: "APPLY_RUN_CONDITION", payload: { conditionId } });
```

### L'écran de setup

`RunSetupScreen.tsx` orchestre le flux de préparation d'un run :

1. Sélection du biome → `CHOOSE_BIOME`
2. Sélection de la difficulté → `APPLY_DIFFICULTY`
3. Sélection de la condition → `APPLY_RUN_CONDITION`

---

## 17. Schéma de la base de données

```
User ─────────────────────────────────────────────────────
  id (cuid), email (unique), name, image
  password (null si OAuth), role (USER|ADMIN|MODERATOR)
  └──► Account[]           (liens OAuth : Google, GitHub...)
  └──► Session[]           (sessions NextAuth)
  └──► Run[]               (parties de jeu)
  └──► UserProgression     (meta-progression : ressources, histoires, stats)

Run ───────────────────────────────────────────────────────
  id, userId (→ User)
  seed (pour reproducibilité), floor, room, gold
  state (Json) ← tout le RunState sérialisé
  status (IN_PROGRESS|VICTORY|DEFEAT|ABANDONED)
  startedAt, endedAt

UserProgression ────────────────────────────────────────────
  userId (→ User, unique)
  resources (Json)              ← ressources par biome (pages, runes, etc.)
  unlockedStoryIds (Json)       ← IDs des histoires débloquées
  totalRuns, wonRuns, lostRuns, abandonedRuns
  winsByDifficulty (Json)       ← Record<difficultyLevel, victories>
  bestTimeByDifficultyMs (Json) ← Record<difficultyLevel, time_ms>

CardDefinition, EnemyDefinition, RelicDefinition, AllyDefinition
  ← Templates statiques (données de référence)
  ← Champs effets stockés en Json pour flexibilité
```

---

## 18. Ce que tu dois retenir

### Les patterns à maîtriser (dans l'ordre d'importance)

**1. Server Action avec Zod + Auth + Error handling**

```
zod.parse(input) → requireAuth() → logique métier → success() / handleServerActionError()
```

Voir : [src/server/actions/run.ts](../src/server/actions/run.ts)

**2. État client avec useReducer (game-provider)**

```
dispatch({ type: "ACTION" }) → gameReducer() → nouveau state → re-render
```

Voir : [src/app/game/\_providers/game-provider.tsx](../src/app/game/_providers/game-provider.tsx)

**3. Fonctions pures du moteur**

```
(state: RunState, ...params) => RunState  — jamais de mutation, jamais d'effets de bord
```

Voir : [src/game/engine/](../src/game/engine/)

**4. Lecture côté client avec React Query**

```
useQuery({ queryKey: gameKeys.cards(), queryFn: serverAction }) → { data, isLoading, error }
```

**5. i18n dans les composants**

```
const { t } = useTranslation() → t("clé.de.traduction")
```

**6. Protection de route**

```
const user = await requireAuth() // dans une action ou un Server Component
```

### Questions à te poser sur chaque fichier

- Ce composant est-il Server ou Client ? (y a-t-il `"use client"` ?)
- Où est validé l'input ? (Zod)
- Où est vérifiée l'authentification ? (requireAuth)
- Qui gère les erreurs ? (handleServerActionError)
- Est-ce que le cache est invalidé après la mutation ? (revalidatePath ou queryClient.invalidateQueries)
- Ce texte est-il traduit ? (t() ou helper i18n)

### Fichiers de référence

| Ce que tu veux apprendre        | Fichier                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| Server Action complète          | [src/server/actions/run.ts](../src/server/actions/run.ts)                                  |
| Modèle d'action à copier        | [src/server/actions/example.ts](../src/server/actions/example.ts)                          |
| État global du jeu (reducer)    | [src/app/game/\_providers/game-provider.tsx](../src/app/game/_providers/game-provider.tsx) |
| Fonction pure du moteur         | [src/game/engine/cards.ts](../src/game/engine/cards.ts)                                    |
| Schémas Zod du state            | [src/game/schemas/run-state.ts](../src/game/schemas/run-state.ts)                          |
| Config NextAuth                 | [src/lib/auth/config.ts](../src/lib/auth/config.ts)                                        |
| Helpers d'auth (requireAuth...) | [src/lib/auth/helpers.ts](../src/lib/auth/helpers.ts)                                      |
| Classes d'erreurs               | [src/lib/errors/types.ts](../src/lib/errors/types.ts)                                      |
| Handler d'erreurs               | [src/lib/errors/handlers.ts](../src/lib/errors/handlers.ts)                                |
| Config React Query              | [src/lib/query/client.ts](../src/lib/query/client.ts)                                      |
| Query keys centralisées         | [src/lib/query/game-keys.ts](../src/lib/query/game-keys.ts)                                |
| Config i18n                     | [src/lib/i18n/index.ts](../src/lib/i18n/index.ts)                                          |
| Traductions françaises          | [src/lib/i18n/messages/fr.ts](../src/lib/i18n/messages/fr.ts)                              |
| Validation env vars             | [src/lib/env.ts](../src/lib/env.ts)                                                        |
| Schéma DB                       | [prisma/schema.prisma](../prisma/schema.prisma)                                            |
| Données de cartes               | [src/game/data/cards.ts](../src/game/data/cards.ts)                                        |
| Données d'ennemis               | [src/game/data/enemies.ts](../src/game/data/enemies.ts)                                    |
| Données de reliques             | [src/game/data/relics.ts](../src/game/data/relics.ts)                                      |
| Meta-progression                | [src/game/engine/meta.ts](../src/game/engine/meta.ts)                                      |
| Difficulté                      | [src/game/engine/difficulty.ts](../src/game/engine/difficulty.ts)                          |
| Conditions de run               | [src/game/engine/run-conditions.ts](../src/game/engine/run-conditions.ts)                  |
| IA ennemie                      | [src/game/engine/enemies.ts](../src/game/engine/enemies.ts)                                |
