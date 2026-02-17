# Architecture Guide

Ce document explique l'architecture du projet, les choix de design, et les patterns utilisés.

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Structure du projet](#structure-du-projet)
3. [Patterns et conventions](#patterns-et-conventions)
4. [Gestion des erreurs](#gestion-des-erreurs)
5. [Authentification et autorisation](#authentification-et-autorisation)
6. [Data fetching](#data-fetching)
7. [Base de données](#base-de-données)
8. [Sécurité](#sécurité)
9. [Performance](#performance)
10. [Testing](#testing)

## 🏗️ Vue d'ensemble

### Philosophie

Ce projet suit les principes suivants :

1. **TypeScript strict** - Maximum de sûreté de type
2. **Server-first** - Logique métier sur le serveur
3. **Validation partout** - Jamais faire confiance aux inputs
4. **Erreurs explicites** - Différencier erreurs métier vs techniques
5. **Separation of Concerns** - Chaque couche a sa responsabilité

### Architecture en couches

```
┌─────────────────────────────────────┐
│         UI Layer (Components)        │  ← Composants React
├─────────────────────────────────────┤
│      App Router (Pages/Routes)       │  ← Routes Next.js
├─────────────────────────────────────┤
│   Actions/API Handlers (Interface)   │  ← Server Actions / API Routes
├─────────────────────────────────────┤
│       Services (Business Logic)      │  ← Logique métier
├─────────────────────────────────────┤
│    Repositories (Data Access)        │  ← Accès aux données
├─────────────────────────────────────┤
│        Database (Prisma/PG)          │  ← Base de données
└─────────────────────────────────────┘
```

## 📁 Structure du projet

### Principe : Routes minces, logique dans src/server

Les routes Next.js doivent être légères et déléguer la logique métier aux services.

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Route Handlers
│   │   └── [resource]/    # Un dossier par ressource
│   └── [pages]/           # Pages de l'application
│
├── components/            # Composants React
│   ├── ui/               # Composants de base (Button, Input, etc.)
│   ├── forms/            # Composants de formulaires
│   ├── layout/           # Composants de layout (Header, Footer, etc.)
│   └── design-system/    # Design system spécifique au projet
│
├── lib/                   # Bibliothèques partagées
│   ├── auth/             # Configuration et helpers d'authentification
│   ├── db/               # Client Prisma et helpers DB
│   ├── errors/           # Système de gestion d'erreurs
│   ├── utils/            # Utilitaires (formatage, validation, etc.)
│   ├── validators/       # Schémas Zod réutilisables
│   ├── hooks/            # Custom React hooks
│   └── query/            # Configuration React Query
│
├── server/               # Code serveur
│   ├── actions/          # Server Actions (mutations)
│   ├── api/              # Logique des API handlers
│   ├── services/         # Logique métier
│   ├── repositories/     # Accès aux données (Prisma queries)
│   └── middleware/       # Middleware custom
│
├── types/                # Types TypeScript globaux
├── test/                 # Configuration et utilitaires de tests
└── styles/               # Styles globaux
```

### Conventions de nommage

**Fichiers :**

- Components : `PascalCase.tsx` (ex: `Button.tsx`)
- Utils/Hooks : `camelCase.ts` (ex: `useAuth.ts`)
- Types : `PascalCase.ts` ou `types.ts`
- Tests : `*.test.ts` ou `*.spec.ts`

**Dossiers :**

- `kebab-case` pour les routes Next.js
- `camelCase` ou `PascalCase` pour les autres

**Fonctions :**

- Server Actions : `verbNounAction` (ex: `createUserAction`)
- Services : `verbNoun` (ex: `createUser`)
- Repositories : `verbNoun` (ex: `findUserById`)

## 🎯 Patterns et conventions

### 1. Server Actions vs Route Handlers

**Server Actions** - Pour les mutations internes (formulaires)

```typescript
// src/server/actions/users.ts
"use server";

export async function createUserAction(input: CreateUserInput) {
  try {
    const validated = createUserSchema.parse(input);
    const user = await requireAuth();

    const newUser = await createUser(validated);

    revalidatePath("/users");
    return success(newUser);
  } catch (error) {
    return handleServerActionError(error);
  }
}
```

**Route Handlers** - Pour les API publiques, webhooks, uploads

```typescript
// src/app/api/users/route.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createUserSchema.parse(body);

    const user = await createUser(validated);

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 2. Separation of Concerns

**Service Layer** - Logique métier

```typescript
// src/server/services/userService.ts
export async function createUser(data: CreateUserData) {
  // Validation métier
  if (await userRepository.existsByEmail(data.email)) {
    throw new ConflictError("Email already exists");
  }

  // Hash password
  const hashedPassword = await hash(data.password, 12);

  // Créer l'utilisateur
  return userRepository.create({
    ...data,
    password: hashedPassword,
  });
}
```

**Repository Layer** - Accès aux données

```typescript
// src/server/repositories/userRepository.ts
export const userRepository = {
  async create(data: CreateUserData) {
    return prisma.user.create({ data });
  },

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  async existsByEmail(email: string) {
    const count = await prisma.user.count({ where: { email } });
    return count > 0;
  },
};
```

### 3. Validation avec Zod

Toutes les entrées doivent être validées :

```typescript
// src/lib/validators/user.ts
export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
```

Utilisation :

```typescript
const validated = createUserSchema.parse(input); // Throws si invalide
// OU
const result = createUserSchema.safeParse(input); // Retourne { success, data, error }
```

## ⚠️ Gestion des erreurs

### Types d'erreurs

**Erreurs opérationnelles (attendues)**

- Validation
- Not found
- Unauthorized
- Conflict
- Business logic errors

**Erreurs techniques (inattendues)**

- Database errors
- External service errors
- Bugs

### Pattern de gestion

```typescript
// Définir une erreur métier
class InsufficientStockError extends AppError {
  constructor(productName: string, available: number) {
    super({
      code: ErrorCode.INSUFFICIENT_STOCK,
      message: `Stock insuffisant pour ${productName}`,
      statusCode: 400,
      metadata: { productName, available },
    });
  }
}

// Utiliser dans un service
export async function createOrder(items: OrderItem[]) {
  for (const item of items) {
    const product = await productRepository.findById(item.productId);

    if (product.stock < item.quantity) {
      throw new InsufficientStockError(product.name, product.stock);
    }
  }

  // Créer la commande...
}

// Handler dans Server Action
export async function createOrderAction(input: CreateOrderInput) {
  try {
    const order = await createOrder(input.items);
    return success(order);
  } catch (error) {
    return handleServerActionError(error); // Convertit en format standard
  }
}
```

### Monitoring avec Sentry

Les erreurs non-opérationnelles sont automatiquement envoyées à Sentry :

```typescript
export function handleServerActionError(error: unknown) {
  // Log pour monitoring
  console.error("Server Action Error:", error);

  if (error instanceof AppError) {
    // Erreurs opérationnelles : ne pas envoyer à Sentry
    if (error.isOperational) {
      return {
        success: false,
        error: error.toJSON(),
      };
    }
  }

  // Erreurs techniques : Sentry les capturera via l'intégration Next.js
  return {
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: "Une erreur inattendue s'est produite",
    },
  };
}
```

## 🔐 Authentification et autorisation

### NextAuth v5 + RBAC

**Configuration**

```typescript
// src/lib/auth/config.ts
export const { auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [Credentials, Google, GitHub],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session: ({ session, token }) => {
      session.user.role = token.role;
      return session;
    },
  },
});
```

**Helpers d'autorisation**

```typescript
// Require authentication
const user = await requireAuth();

// Require specific role
const admin = await requireAdmin();
const moderator = await requireRole(UserRole.MODERATOR);

// Check ownership
await requireOwnership(resourceUserId);

// Flexible permission check
if (await can("delete", "post")) {
  // Allow action
}
```

**Protection de routes (Middleware)**

```typescript
// src/middleware.ts
export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Protéger /dashboard
  if (pathname.startsWith("/dashboard") && !req.auth) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  // Protéger /admin
  if (pathname.startsWith("/admin") && req.auth?.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }
});
```

## 📊 Data fetching

### Server Components (par défaut)

```typescript
// app/users/page.tsx
export default async function UsersPage() {
  const users = await prisma.user.findMany();

  return <UserList users={users} />;
}
```

### Client Components (avec React Query)

```typescript
"use client";

export function UserList() {
  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      return res.json();
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return <div>{/* Render users */}</div>;
}
```

### Quand utiliser quoi ?

**Server Components (par défaut)**

- Contenu initial
- SEO important
- Pas de state client
- Pas d'interactivité

**Client Components + React Query**

- Données temps réel
- Polling/refresh automatique
- Optimistic updates
- Interactions complexes

## 🗄️ Base de données

### Patterns Prisma

**1. Singleton Pattern**

```typescript
// src/lib/db/prisma.ts
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ["query", "error", "warn"] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

**2. Snapshot Pattern** (pour l'historique)

```typescript
// Mauvais : pointer vers Product directement
model OrderItem {
  productId String
  product   Product @relation(...)
}

// Bon : snapshot des données au moment de la commande
model OrderItem {
  productId    String
  productName  String  // Snapshot
  productPrice Int     // Snapshot au moment de l'achat
  quantity     Int

  product Product @relation(...) // Relation pour les infos actuelles
}
```

**3. Transactions**

```typescript
export async function transferFunds(
  fromId: string,
  toId: string,
  amount: number
) {
  return prisma.$transaction(async (tx) => {
    // Débit
    await tx.account.update({
      where: { id: fromId },
      data: { balance: { decrement: amount } },
    });

    // Crédit
    await tx.account.update({
      where: { id: toId },
      data: { balance: { increment: amount } },
    });

    // Log de transaction
    await tx.transaction.create({
      data: { fromId, toId, amount },
    });
  });
}
```

**4. Pagination**

```typescript
export async function findManyPaginated(page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.item.count(),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

## 🛡️ Sécurité

### Checklist de sécurité

**✅ Variables d'environnement**

- Validation avec Zod (@t3-oss/env-nextjs)
- Jamais commit .env
- NEXT*PUBLIC*\* seulement pour ce qui est vraiment public

**✅ Authentication/Authorization**

- Sessions server-side (JWT avec NextAuth)
- RBAC sur toutes les routes sensibles
- Vérifier ownership des ressources

**✅ Input Validation**

- Zod sur tous les inputs (body, query, params)
- Ne jamais faire confiance au client
- Sanitize si nécessaire

**✅ SQL Injection**

- Prisma protège automatiquement
- Éviter raw queries si possible

**✅ XSS**

- React échappe automatiquement
- Attention aux dangerouslySetInnerHTML
- CSP headers dans next.config.ts

**✅ CSRF**

- NextAuth gère automatiquement
- Vérifier origin pour les webhooks

**✅ Rate Limiting**

- Upstash Redis pour rate limiting
- Sur login, signup, API publiques

**✅ Headers de sécurité**

- Configurés dans next.config.ts
- HSTS, X-Frame-Options, CSP, etc.

## ⚡ Performance

### Optimisations

**1. Images**

```typescript
import Image from "next/image";

<Image
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  priority // Pour LCP
/>
```

**2. Fonts**

```typescript
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });
```

**3. Database**

- Index sur les colonnes fréquemment recherchées
- Select seulement les champs nécessaires
- Utiliser findFirst au lieu de findMany + [0]

**4. Caching**

```typescript
// Revalidate toutes les 60 secondes
export const revalidate = 60;

// Ou par requête
const data = await fetch("...", { next: { revalidate: 60 } });
```

**5. Lazy Loading**

```typescript
const DynamicComponent = dynamic(() => import("./Component"), {
  loading: () => <Skeleton />,
  ssr: false, // Si pas nécessaire côté serveur
});
```

## 🧪 Testing

### Types de tests

**Unit Tests** - Fonctions pures, utilitaires

```typescript
// src/lib/utils/format.test.ts
import { formatPrice } from "./format";

describe("formatPrice", () => {
  it("should format cents to USD", () => {
    expect(formatPrice(1999)).toBe("$19.99");
  });
});
```

**Integration Tests** - Server Actions, API routes

```typescript
// src/server/actions/users.test.ts
import { createUserAction } from "./users";

describe("createUserAction", () => {
  it("should create a user", async () => {
    const result = await createUserAction({
      email: "test@example.com",
      password: "password123",
      name: "Test User",
    });

    expect(result.success).toBe(true);
    expect(result.data?.email).toBe("test@example.com");
  });

  it("should fail with invalid email", async () => {
    const result = await createUserAction({
      email: "invalid",
      password: "password123",
      name: "Test",
    });

    expect(result.success).toBe(false);
  });
});
```

**Component Tests** - UI Components

```typescript
// src/components/ui/button.test.tsx
import { render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
  it("should render children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("should show loading state", () => {
    render(<Button isLoading>Submit</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
```

### Couverture recommandée

Testez en priorité :

- ✅ Validation Zod (critique)
- ✅ Business logic (services)
- ✅ Auth/permissions
- ✅ Idempotence (webhooks)
- ✅ Transactions critiques

Pas besoin de tester :

- ❌ Types TypeScript (le compilateur le fait)
- ❌ Prisma queries (testées par Prisma)
- ❌ UI basique (boutons, inputs simples)

## 📚 Ressources

- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [NextAuth v5](https://authjs.dev)
- [React Query](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Zod](https://zod.dev)

---

Cette architecture est un point de départ. Adaptez-la selon vos besoins ! 🚀
