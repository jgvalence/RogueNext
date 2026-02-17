# Setup Guide

Ce guide explique comment utiliser cette base Next.js pour démarrer un nouveau projet.

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Démarrage d'un nouveau projet](#démarrage-dun-nouveau-projet)
3. [Configuration de l'environnement](#configuration-de-lenvironnement)
4. [Configuration de la base de données](#configuration-de-la-base-de-données)
5. [Configuration de l'authentification](#configuration-de-lauthentification)
6. [Déploiement](#déploiement)
7. [Checklist de démarrage](#checklist-de-démarrage)

## 🔧 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** 18.0.0 ou supérieur
- **npm** 9.0.0 ou supérieur
- **Git**
- **PostgreSQL** (local ou distant comme Neon, Supabase, etc.)
- Un compte **Vercel** (pour le déploiement)

### Outils recommandés

- **VS Code** avec les extensions :
  - ESLint
  - Prettier
  - Prisma
  - Tailwind CSS IntelliSense
- **Postman** ou **Insomnia** (pour tester les API)
- **TablePlus** ou **Prisma Studio** (pour visualiser la DB)

## 🚀 Démarrage d'un nouveau projet

### 1. Cloner/Copier le template

```bash
# Option 1: Cloner depuis GitHub (si vous avez créé un repo)
git clone https://github.com/votre-username/base-nextjs.git mon-nouveau-projet
cd mon-nouveau-projet

# Option 2: Copier les fichiers manuellement
cp -r /path/to/baseNextJs /path/to/mon-nouveau-projet
cd mon-nouveau-projet
```

### 2. Réinitialiser Git

```bash
# Supprimer l'historique Git existant
rm -rf .git

# Initialiser un nouveau repo Git
git init
git add .
git commit -m "feat: initial commit from base-nextjs template"
```

### 3. Personnaliser le projet

Modifiez les fichiers suivants :

**package.json**

```json
{
  "name": "mon-nouveau-projet",
  "description": "Description de mon projet",
  "version": "0.1.0"
}
```

**README.md**

- Remplacez le contenu avec la description de votre projet

**src/app/layout.tsx**

- Mettez à jour les métadonnées (titre, description)

**tailwind.config.ts**

- Personnalisez les couleurs et thèmes si nécessaire

### 4. Installer les dépendances

```bash
npm install
```

## ⚙️ Configuration de l'environnement

### 1. Créer le fichier .env.local

```bash
cp .env.example .env.local
```

### 2. Configurer les variables d'environnement

Éditez `.env.local` et remplissez les valeurs :

#### Variables essentielles (minimum)

```env
# Base
NODE_ENV=development
NEXT_PUBLIC_APP_NAME="Mon Projet"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mon_projet?schema=public"

# Auth
NEXTAUTH_SECRET="générer-avec-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

#### Variables optionnelles

```env
# OAuth (si vous utilisez Google/GitHub)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Sentry (monitoring)
NEXT_PUBLIC_SENTRY_DSN=""
SENTRY_AUTH_TOKEN=""

# File uploads (S3/R2)
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""
S3_BUCKET_NAME=""
S3_ENDPOINT=""

# Stripe (paiements)
STRIPE_SECRET_KEY=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
```

### 3. Générer NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Copiez la sortie dans `NEXTAUTH_SECRET` dans `.env.local`

## 🗄️ Configuration de la base de données

### Option 1: PostgreSQL local (développement)

#### Installation PostgreSQL

**macOS (Homebrew)**

```bash
brew install postgresql@16
brew services start postgresql@16
```

**Ubuntu/Debian**

```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Créer la base de données

```bash
# Se connecter à PostgreSQL
psql postgres

# Créer un utilisateur et une base
CREATE USER mon_user WITH PASSWORD 'mon_password';
CREATE DATABASE mon_projet;
GRANT ALL PRIVILEGES ON DATABASE mon_projet TO mon_user;
\q
```

#### Mettre à jour DATABASE_URL

```env
DATABASE_URL="postgresql://mon_user:mon_password@localhost:5432/mon_projet?schema=public"
```

### Option 2: PostgreSQL distant (production)

**Recommandations :**

1. **Neon** (https://neon.tech) - Serverless PostgreSQL
2. **Supabase** (https://supabase.com) - PostgreSQL + autres services
3. **Railway** (https://railway.app) - Plateforme tout-en-un

#### Configuration avec Neon (exemple)

1. Créez un compte sur neon.tech
2. Créez un nouveau projet
3. Copiez la connection string
4. Ajoutez dans `.env.local` :

```env
DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
DIRECT_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

### Appliquer le schéma Prisma

```bash
# Générer le client Prisma
npm run db:generate

# Pousser le schéma vers la DB (développement)
npm run db:push

# OU créer une migration (production)
npm run db:migrate

# Seed des données de test
npm run db:seed
```

### Vérifier la connexion

```bash
# Ouvrir Prisma Studio
npm run db:studio
```

Prisma Studio s'ouvrira sur http://localhost:5555

## 🔐 Configuration de l'authentification

### Configuration de base (Email/Password)

Par défaut, NextAuth est configuré avec :

- Email/Password (Credentials provider)
- Sessions JWT
- RBAC (rôles USER, ADMIN, MODERATOR)

Les utilisateurs de test créés par le seed :

```
Email: admin@example.com
Password: admin123
Role: ADMIN

Email: user@example.com
Password: user123
Role: USER
```

### Ajouter Google OAuth (optionnel)

1. Allez sur [Google Cloud Console](https://console.cloud.google.com)
2. Créez un nouveau projet
3. Activez Google+ API
4. Créez des identifiants OAuth 2.0
5. Ajoutez les URIs autorisés :
   - `http://localhost:3000` (dev)
   - `https://votre-domaine.com` (prod)
6. Ajoutez les URIs de redirection :
   - `http://localhost:3000/api/auth/callback/google`
   - `https://votre-domaine.com/api/auth/callback/google`
7. Copiez Client ID et Client Secret dans `.env.local`

### Ajouter GitHub OAuth (optionnel)

1. Allez sur GitHub Settings > Developer settings > OAuth Apps
2. Créez une nouvelle OAuth App
3. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copiez Client ID et Client Secret dans `.env.local`

### Personnaliser les pages d'authentification

Créez vos propres pages :

```bash
# Créer la page de connexion
mkdir -p src/app/auth/signin
```

Éditez `src/lib/auth/config.ts` pour pointer vers vos pages :

```typescript
pages: {
  signIn: "/auth/signin",
  signUp: "/auth/signup",
  error: "/auth/error",
}
```

## 🚢 Déploiement

### Déploiement sur Vercel

#### 1. Préparation

```bash
# Installer Vercel CLI (optionnel)
npm i -g vercel

# Tester le build localement
npm run build
npm run start
```

#### 2. Déploiement via GitHub

1. Poussez votre code sur GitHub :

```bash
git remote add origin https://github.com/votre-username/mon-projet.git
git push -u origin main
```

2. Allez sur [Vercel](https://vercel.com)
3. Cliquez sur "Import Project"
4. Sélectionnez votre repo GitHub
5. Configurez les variables d'environnement (copier depuis `.env.local`)
6. Cliquez sur "Deploy"

#### 3. Configuration des variables d'environnement

Dans Vercel Dashboard > Settings > Environment Variables, ajoutez :

**Production**

- `DATABASE_URL` - Connection string de prod (Neon, Supabase, etc.)
- `NEXTAUTH_SECRET` - Générer un nouveau secret pour la prod
- `NEXTAUTH_URL` - URL de production (ex: https://mon-projet.vercel.app)
- Toutes les autres variables nécessaires

**Important:** Utilisez des valeurs différentes pour dev, preview, et production !

#### 4. Migrations de base de données

```bash
# Depuis votre machine locale, exécuter les migrations en prod
DATABASE_URL="votre-db-prod-url" npm run db:migrate:deploy
```

### Déploiement sur d'autres plateformes

Le projet peut être déployé sur :

- **Railway** - Configuration automatique
- **Render** - Avec Dockerfile
- **AWS Amplify** - Via la console AWS
- **Netlify** - Avec adaptateur Next.js

## ✅ Checklist de démarrage

Utilisez cette checklist à chaque fois que vous démarrez un nouveau projet :

### Configuration initiale

- [ ] Cloner/copier le template
- [ ] Réinitialiser Git (`rm -rf .git && git init`)
- [ ] Personnaliser `package.json` (name, description)
- [ ] Installer les dépendances (`npm install`)
- [ ] Copier `.env.example` vers `.env.local`
- [ ] Configurer les variables d'environnement

### Base de données

- [ ] Créer la base de données (locale ou distante)
- [ ] Configurer `DATABASE_URL` dans `.env.local`
- [ ] Générer le client Prisma (`npm run db:generate`)
- [ ] Appliquer le schéma (`npm run db:push` ou `db:migrate`)
- [ ] Seed des données (`npm run db:seed`)
- [ ] Vérifier avec Prisma Studio (`npm run db:studio`)

### Authentification

- [ ] Générer `NEXTAUTH_SECRET` (`openssl rand -base64 32`)
- [ ] Configurer OAuth providers (optionnel)
- [ ] Tester la connexion avec les utilisateurs de test
- [ ] Personnaliser les pages d'auth (optionnel)

### Développement

- [ ] Lancer le serveur de dev (`npm run dev`)
- [ ] Vérifier que tout fonctionne sur http://localhost:3000
- [ ] Personnaliser la page d'accueil
- [ ] Mettre à jour le README.md

### Personnalisation

- [ ] Modifier les couleurs dans `tailwind.config.ts`
- [ ] Personnaliser les métadonnées dans `app/layout.tsx`
- [ ] Adapter le schéma Prisma selon vos besoins
- [ ] Supprimer les modèles e-commerce si non nécessaires

### Code quality

- [ ] Vérifier ESLint (`npm run lint`)
- [ ] Formatter le code (`npm run format`)
- [ ] Vérifier TypeScript (`npm run type-check`)
- [ ] Configurer Husky (`npm run prepare`)

### Déploiement

- [ ] Tester le build (`npm run build`)
- [ ] Pousser sur GitHub
- [ ] Connecter à Vercel
- [ ] Configurer les variables d'env de production
- [ ] Appliquer les migrations de production
- [ ] Vérifier le déploiement

### Monitoring (optionnel)

- [ ] Créer un projet Sentry
- [ ] Configurer `NEXT_PUBLIC_SENTRY_DSN`
- [ ] Tester les erreurs dans Sentry

### Après le premier déploiement

- [ ] Configurer un domaine personnalisé (optionnel)
- [ ] Activer SSL/HTTPS
- [ ] Configurer les redirections
- [ ] Tester en production
- [ ] Partager avec l'équipe !

## 🔄 Mettre à jour depuis le template

Si le template de base est mis à jour et que vous voulez récupérer les changements :

```bash
# Ajouter le template comme remote
git remote add template https://github.com/votre-username/base-nextjs.git

# Fetch les changements
git fetch template

# Merger les changements (attention aux conflits !)
git merge template/main --allow-unrelated-histories
```

## 🆘 Problèmes courants

### Erreur: Cannot find module '@prisma/client'

```bash
npm run db:generate
```

### Erreur: Invalid `prisma.xxx.findMany()` invocation

La base de données n'est pas synchronisée avec le schéma :

```bash
npm run db:push
```

### Erreur: NEXTAUTH_SECRET is not set

Générez et ajoutez dans `.env.local` :

```bash
openssl rand -base64 32
```

### Le port 3000 est déjà utilisé

```bash
# Tuer le processus sur le port 3000
lsof -ti:3000 | xargs kill -9

# Ou utiliser un autre port
PORT=3001 npm run dev
```

## 📚 Ressources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth Documentation](https://authjs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Query Documentation](https://tanstack.com/query)

## 🤝 Support

Si vous rencontrez des problèmes :

1. Consultez la [documentation](./ARCHITECTURE.md)
2. Vérifiez les issues GitHub
3. Créez une issue si nécessaire

---

Bon développement ! 🚀
