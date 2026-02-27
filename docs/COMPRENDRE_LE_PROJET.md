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
15. [Schéma de la base de données](#15-schéma-de-la-base-de-données)
16. [Ce que tu dois retenir](#16-ce-que-tu-dois-retenir)

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
│   │       ├── combat/           # Vue de combat
│   │       ├── map/              # Carte du donjon
│   │       ├── merchant/         # Boutique
│   │       ├── rewards/          # Écran de récompenses
│   │       ├── special/          # Salles spéciales (événements)
│   │       ├── biome/            # Sélection de biome
│   │       ├── preboss/          # Salle pré-boss
│   │       ├── run-difficulty/   # Sélection de difficulté
│   │       └── run-condition/    # Sélection de condition de run
│   ├── library/                  # Page bibliothèque (meta-progression)
│   │   ├── page.tsx
│   │   └── collection/page.tsx
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
│   ├── engine/                    # Fonctions pures du moteur
│   │   ├── buffs.ts               # Application et tick des buffs
│   │   ├── card-unlocks.ts        # Déblocage de cartes
│   │   ├── card-upgrades.ts       # Amélioration de cartes
│   │   ├── cards.ts               # Logique de jeu des cartes
│   │   ├── combat.ts              # Init et gestion du combat
│   │   ├── damage.ts              # Calcul des dégâts
│   │   ├── deck.ts                # Pioche, défausse, mélange
│   │   ├── difficulty.ts          # Modificateurs de difficulté
│   │   ├── effects.ts             # Résolution des effets
│   │   ├── enemies.ts             # IA et capacités ennemies
│   │   ├── ink.ts                 # Pouvoirs d'encre (REWRITE, LOST_CHAPTER, SEAL)
│   │   ├── items.ts               # Objets utilisables (potions...)
│   │   ├── loot.ts                # Génération de butin
│   │   ├── merchant.ts            # Boutique et prix
│   │   ├── meta.ts                # Bonus de meta-progression
│   │   ├── relics.ts              # Effets des reliques
│   │   ├── rewards.ts             # Récompenses post-combat
│   │   ├── rng.ts                 # PRNG déterministe (mulberry32)
│   │   ├── run-conditions.ts      # Conditions de run
│   │   └── run.ts                 # Init du run, sélection des salles
│   ├── data/                      # Données statiques du jeu
│   │   ├── index.ts               # Exports + lookup maps
│   │   ├── allies.ts              # 3 alliés
│   │   ├── biomes.ts              # 9 biomes
│   │   ├── cards.ts               # 73 cartes
│   │   ├── combat-doctrine.ts     # Règles d'équilibrage combat
│   │   ├── enemies.ts             # 57 ennemis
│   │   ├── histoires.ts           # Histoires (meta-progression)
│   │   ├── relics.ts              # 14 reliques
│   │   └── starter-deck.ts        # Deck de départ
│   └── schemas/                   # Schémas Zod de validation du state
│       ├── index.ts
│       ├── enums.ts               # Tous les enums du jeu
│       ├── cards.ts               # CardDefinition, CardInstance...
│       ├── effects.ts             # Effect (type, value, buff, duration)
│       ├── entities.ts            # PlayerState, EnemyState, AllyState, BuffInstance
│       ├── items.ts               # UsableItemDefinition, UsableItemInstance
│       ├── combat-state.ts        # CombatState complet
│       ├── run-state.ts           # RunState complet
│       └── meta.ts                # ComputedMetaBonuses
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
[dispatch({ type: "PLAY_CARD", cardId }) — game-provider.tsx]
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

| Fichier           | Contenu                                                       |
| ----------------- | ------------------------------------------------------------- |
| `cards.ts`        | 73 cartes (4 starter, 21 communes, 27 peu communes, 21 rares) |
| `enemies.ts`      | 57 ennemis répartis sur 9 biomes + élites + boss              |
| `relics.ts`       | 14 reliques (COMMON à BOSS rarity)                            |
| `allies.ts`       | 3 alliés (Scribe Apprentice, Ward Knight, Ink Familiar)       |
| `biomes.ts`       | 9 biomes (LIBRARY + 8 autres)                                 |
| `histoires.ts`    | Histoires débloquables (meta-progression)                     |
| `starter-deck.ts` | Deck de départ du joueur                                      |

### Constantes importantes

```typescript
// src/game/constants.ts
GAME_CONSTANTS = {
  ROOMS_PER_FLOOR: 10, // 9 salles + 1 boss
  MAX_FLOORS: 5, // Profondeur du donjon
  MAX_ALLIES: 3,
  MAX_ENEMIES: 4,
  STARTING_HP: 60,
  STARTING_ENERGY: 3,
  STARTING_INK_MAX: 5, // Resource "encre"
  STARTING_DRAW_COUNT: 4, // Cartes piochées par tour
  INK_POWER_COSTS: {
    REWRITE: 3, // Rejouer la dernière carte
    LOST_CHAPTER: 2, // Piocher 2 cartes
    SEAL: 2, // Gagner 8 blocs
  },
  CARD_REWARD_CHOICES: 3,
};
```

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
// Exemples d'actions dans le reducer
dispatch({ type: "PLAY_CARD", cardId, targetId });
dispatch({ type: "END_TURN" });
dispatch({ type: "USE_INK_POWER", power: "REWRITE" });
dispatch({ type: "SELECT_CARD_REWARD", cardId });
dispatch({ type: "BUY_SHOP_ITEM", itemIndex });
dispatch({ type: "CHOOSE_BIOME", biome });
dispatch({ type: "CHOOSE_DIFFICULTY", level: 2 });
dispatch({ type: "SELECT_RUN_CONDITION", conditionId });
dispatch({ type: "HANDLE_EVENT_CHOICE", choiceIndex });
// + ~40 autres actions
```

### La sauvegarde automatique

```typescript
// src/app/game/_hooks/use-auto-save.ts
// S'abonne au state, sauvegarde en DB toutes les X secondes
// Et avant de quitter la page (beforeunload)
useAutoSave(state); // → saveRunStateAction() en arrière-plan
```

---

## 15. Schéma de la base de données

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
  resources (Json) ← ressources par biome (pages, runes, etc.)
  unlockedStories (String[]) ← histoires débloquées
  highestDifficultyWon (Int) ← difficulté max gagnée (0-4)
  totalWins, totalRuns

CardDefinition, EnemyDefinition, RelicDefinition, AllyDefinition
  ← Templates statiques (données de référence)
  ← Champs effets stockés en Json pour flexibilité
```

---

## 16. Ce que tu dois retenir

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
