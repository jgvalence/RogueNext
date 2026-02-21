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
12. [Schéma de la base de données](#12-schéma-de-la-base-de-données)
13. [Ce que tu dois retenir](#13-ce-que-tu-dois-retenir)

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
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Layout racine (QueryProvider, Toaster)
│   ├── globals.css             # Styles globaux (Tailwind)
│   ├── api/
│   │   ├── auth/[...nextauth]/ # Endpoint NextAuth (GET + POST)
│   │   └── example/route.ts   # Exemple d'API Route
│   └── (pages)/                # Tes pages (game, auth, etc.)
│
├── server/
│   └── actions/
│       ├── run.ts              # Actions du jeu (createRun, saveState...)
│       └── example.ts          # Modèle d'action à copier
│
├── lib/
│   ├── auth/
│   │   ├── config.ts           # Config NextAuth (providers, callbacks)
│   │   └── helpers.ts          # requireAuth(), requireRole(), can()...
│   ├── db/
│   │   └── prisma.ts           # Singleton Prisma Client
│   ├── errors/
│   │   ├── types.ts            # Classes d'erreurs (UnauthorizedError, etc.)
│   │   └── handlers.ts         # handleServerActionError(), success()
│   ├── query/
│   │   ├── client.ts           # Config QueryClient (staleTime, retry...)
│   │   └── provider.tsx        # <QueryProvider> wrappant toute l'app
│   ├── utils/
│   │   ├── cn.ts               # cn() — merge classes Tailwind
│   │   └── format.ts           # formatPrice(), formatDate()...
│   └── env.ts                  # Variables d'env validées par Zod
│
├── components/
│   └── ui/
│       ├── button.tsx          # Button avec variants CVA
│       ├── card.tsx            # Card + sous-composants
│       └── input.tsx           # Input avec label et erreur
│
├── game/                       # Logique du jeu (hors scope apprentissage)
│   ├── engine/                 # Moteur (run, combat, rng...)
│   ├── schemas/                # Types Zod du state de jeu
│   └── data/                   # Définitions cartes/ennemis
│
└── test/
    └── setup.ts                # Config Vitest + mocks Next.js
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
        ├── 3. Logique métier (crée le state initial du jeu)
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

**Pour les variables d'environnement :**

```typescript
// src/lib/env.ts
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(), // doit être une URL valide
    NEXTAUTH_SECRET: z.string().min(32), // min 32 caractères
    GOOGLE_CLIENT_ID: z.string().optional(), // peut être absent
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  // ...
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

**Singleton browser vs serveur :**

```typescript
export function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient(); // Serveur → nouvelle instance par requête
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient; // Browser → singleton persistant
  }
}
```

### Le Provider dans le layout

```typescript
// src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryProvider>  {/* Rend useQuery disponible partout */}
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
```

### Utilisation typique (ce que tu écriras)

```typescript
// Dans un Client Component
"use client";
import { useQuery, useMutation } from "@tanstack/react-query";

function GamePage() {
  // Lecture
  const { data, isLoading, error } = useQuery({
    queryKey: ["activeRun"],           // clé unique pour le cache
    queryFn: () => getActiveRunAction(), // la Server Action qui fetch
  });

  // Mutation
  const { mutate, isPending } = useMutation({
    mutationFn: createRunAction,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["activeRun"] });
      }
    },
  });

  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur</div>;
  // ...
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
    // Appelé à la création du JWT → on y stocke id et role
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    // Appelé à chaque accès à la session → on expose id et role
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
});
```

**Pourquoi JWT et pas sessions DB ?** JWT = stateless, pas de table `sessions` à interroger à chaque requête. Contraepartie : impossible de révoquer un token avant son expiration.

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

**Usage dans une Server Action :**

```typescript
const user = await requireAuth(); // → UserObject ou throw 401
await requireRole(UserRole.ADMIN); // → UserObject ou throw 403
await requireOwnership(run.userId); // → UserObject ou throw 403
```

### Module augmentation TypeScript

```typescript
// Étend les types de NextAuth pour inclure id et role
declare module "next-auth" {
  interface Session {
    user: { id: string; role: UserRole } & DefaultSession["user"];
  }
}
// Grâce à ça, session.user.id et session.user.role sont typés
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

Prisma génère un client entièrement typé depuis le schéma. Pas de SQL manuel :

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

### Le problème sans `env.ts`

```typescript
// Mauvais — peut planter en prod si la var est absente
const url = process.env.DATABASE_URL; // string | undefined
```

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
  // ...
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
  "base-classes-communes",  // classes toujours appliquées
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
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Pourquoi ? Tailwind génère des conflits si on concatène naïvement :
// "px-4 px-8" → px-4 et px-8 sont tous les deux appliqués → imprévisible
// cn("px-4", "px-8") → "px-8" (tailwind-merge résout le conflit)
```

---

## 12. Schéma de la base de données

```
User ────────────────────────────────────────────────
  id (cuid), email (unique), name, image
  password (null si OAuth), role (USER|ADMIN|MODERATOR)
  └──► Account[]  (liens OAuth : Google, GitHub...)
  └──► Session[]  (sessions NextAuth)
  └──► Run[]      (parties de jeu)

Run ─────────────────────────────────────────────────
  id, userId (→ User)
  seed (pour reproducibilité), floor, room, gold
  state (Json) ← tout le state du jeu sérialisé
  status (IN_PROGRESS|VICTORY|DEFEAT|ABANDONED)

CardDefinition, EnemyDefinition, RelicDefinition, AllyDefinition
  ← Templates statiques du jeu (données de référence)
  ← Champs effets stockés en Json pour flexibilité
```

---

## 13. Ce que tu dois retenir

### Les patterns à maîtriser (dans l'ordre d'importance)

**1. Server Action avec Zod + Auth + Error handling**

```
zod.parse(input) → requireAuth() → logique métier → success() / handleServerActionError()
```

Voir : [src/server/actions/run.ts](../src/server/actions/run.ts)

**2. Lecture côté client avec React Query**

```
useQuery({ queryKey, queryFn: serverAction }) → { data, isLoading, error }
```

**3. Mutation avec React Query**

```
useMutation({ mutationFn }) → { mutate, isPending }
```

**4. Protection de route avec requireAuth()**

```
const user = await requireAuth() // dans une action ou un Server Component
```

**5. Variables d'env validées**

```
import { env } from "@/lib/env" // jamais process.env directement
```

### Questions à te poser sur chaque fichier

- Ce composant est-il Server ou Client ? (y a-t-il `"use client"` ?)
- Où est validé l'input ? (Zod)
- Où est vérifiée l'authentification ? (requireAuth)
- Qui gère les erreurs ? (handleServerActionError / handleApiError)
- Est-ce que le cache est invalidé après la mutation ? (revalidatePath)

### Fichiers de référence

| Ce que tu veux apprendre        | Fichier                                                           |
| ------------------------------- | ----------------------------------------------------------------- |
| Server Action complète          | [src/server/actions/run.ts](../src/server/actions/run.ts)         |
| Modèle d'action à copier        | [src/server/actions/example.ts](../src/server/actions/example.ts) |
| Config NextAuth                 | [src/lib/auth/config.ts](../src/lib/auth/config.ts)               |
| Helpers d'auth (requireAuth...) | [src/lib/auth/helpers.ts](../src/lib/auth/helpers.ts)             |
| Classes d'erreurs               | [src/lib/errors/types.ts](../src/lib/errors/types.ts)             |
| Handler d'erreurs               | [src/lib/errors/handlers.ts](../src/lib/errors/handlers.ts)       |
| Config React Query              | [src/lib/query/client.ts](../src/lib/query/client.ts)             |
| Validation env vars             | [src/lib/env.ts](../src/lib/env.ts)                               |
| Schéma DB                       | [prisma/schema.prisma](../prisma/schema.prisma)                   |
| API Route exemple               | [src/app/api/example/route.ts](../src/app/api/example/route.ts)   |
