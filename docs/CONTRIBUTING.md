# Contributing Guide

Merci de vouloir contribuer à ce projet ! Ce guide vous aidera à comprendre comment contribuer efficacement.

## 🎯 Types de contributions

Nous acceptons plusieurs types de contributions :

- 🐛 **Bug fixes** - Corrections de bugs
- ✨ **Features** - Nouvelles fonctionnalités
- 📝 **Documentation** - Améliorations de la documentation
- ♻️ **Refactoring** - Améliorations du code
- ✅ **Tests** - Ajout ou amélioration de tests
- 🎨 **Design** - Améliorations UI/UX

## 🚀 Pour commencer

### 1. Fork et clone

```bash
# Fork le projet sur GitHub, puis :
git clone https://github.com/votre-username/base-nextjs.git
cd base-nextjs
```

### 2. Installation

```bash
npm install
```

### 3. Configuration

```bash
cp .env.example .env.local
# Configurez les variables d'environnement
```

### 4. Créer une branche

```bash
git checkout -b feat/ma-nouvelle-fonctionnalite
# ou
git checkout -b fix/correction-du-bug
```

## 📝 Conventions de code

### Commits

Nous utilisons [Conventional Commits](https://www.conventionalcommits.org/).

Format :

```
type(scope): description

[body optionnel]

[footer optionnel]
```

Types :

- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatage, pas de changement de code
- `refactor`: Refactoring
- `test`: Ajout de tests
- `chore`: Maintenance, config, etc.

Exemples :

```bash
git commit -m "feat: add user profile page"
git commit -m "fix: resolve login redirect issue"
git commit -m "docs: update setup guide"
```

### Code Style

- **TypeScript strict** - Pas de `any`, sauf justifié
- **Functional** - Préférer les fonctions pures
- **Nommage**
  - Variables/fonctions : `camelCase`
  - Composants : `PascalCase`
  - Constantes : `UPPER_SNAKE_CASE`
  - Fichiers : Suivre la convention du dossier

### Formatage

Le projet utilise Prettier et ESLint :

```bash
# Formatter le code
npm run format

# Vérifier les erreurs ESLint
npm run lint

# Fixer automatiquement
npm run lint:fix
```

Husky exécutera automatiquement ces checks avant chaque commit.

## 🧪 Tests

### Écrire des tests

Tous les changements devraient inclure des tests appropriés :

```bash
# Créer un fichier de test
touch src/lib/utils/myFunction.test.ts
```

Exemple :

```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "./myFunction";

describe("myFunction", () => {
  it("should do something", () => {
    const result = myFunction("input");
    expect(result).toBe("expected");
  });
});
```

### Exécuter les tests

```bash
# Tous les tests
npm test

# En mode watch
npm run test:watch

# Avec coverage
npm run test:coverage
```

## 📋 Checklist avant PR

Avant de soumettre votre Pull Request, vérifiez que :

- [ ] Le code compile sans erreurs (`npm run build`)
- [ ] Tous les tests passent (`npm test`)
- [ ] ESLint ne retourne aucune erreur (`npm run lint`)
- [ ] Le code est formatté (`npm run format`)
- [ ] Les types TypeScript sont corrects (`npm run type-check`)
- [ ] La documentation est à jour si nécessaire
- [ ] Les commits suivent les conventions
- [ ] Les changements sont testés localement

## 🔀 Process de Pull Request

### 1. Créer la PR

1. Poussez votre branche sur GitHub
2. Créez une Pull Request vers `main`
3. Remplissez le template de PR (si disponible)

### 2. Description de la PR

Incluez :

- **Quoi** : Qu'est-ce qui change ?
- **Pourquoi** : Pourquoi ce changement est nécessaire ?
- **Comment** : Comment le changement est implémenté ?
- **Screenshots** : Si UI, ajoutez des captures d'écran
- **Breaking changes** : Si applicable

Exemple :

```markdown
## Description

Ajoute une page de profil utilisateur avec possibilité de modifier les informations.

## Motivation

Les utilisateurs doivent pouvoir modifier leur profil après inscription.

## Changements

- Nouvelle page `/profile`
- Composant `ProfileForm`
- Server Action `updateProfileAction`
- Tests pour le formulaire

## Screenshots

[Capture d'écran]

## Checklist

- [x] Tests ajoutés
- [x] Documentation mise à jour
- [x] Pas de breaking changes
```

### 3. Review

- Répondez aux commentaires de review
- Faites les changements demandés
- Pushez les nouvelles modifications

### 4. Merge

Une fois approuvée, votre PR sera mergée par un mainteneur.

## 🏗️ Architecture

### Où ajouter quoi ?

**Nouvelle page**

```
src/app/ma-page/page.tsx
```

**Nouveau composant UI**

```
src/components/ui/MonComposant.tsx
```

**Nouvelle Server Action**

```
src/server/actions/maResource.ts
```

**Nouveau service**

```
src/server/services/monService.ts
```

**Nouveau repository**

```
src/server/repositories/monRepository.ts
```

**Nouveaux types**

```
src/types/monType.ts
```

**Nouvelles utilités**

```
src/lib/utils/maUtilite.ts
```

Consultez [ARCHITECTURE.md](./ARCHITECTURE.md) pour plus de détails.

## 🐛 Rapporter un bug

Utilisez le template d'issue GitHub :

1. **Titre clair** : Résumez le bug en une ligne
2. **Description** : Décrivez le problème en détail
3. **Steps to reproduce** : Comment reproduire le bug
4. **Expected behavior** : Comportement attendu
5. **Actual behavior** : Ce qui se passe réellement
6. **Environment** : OS, navigateur, version Node, etc.
7. **Screenshots** : Si applicable

Exemple :

```markdown
## Bug: Login redirect ne fonctionne pas

### Description

Après connexion, l'utilisateur n'est pas redirigé vers la page d'origine.

### Steps to reproduce

1. Naviguer vers `/dashboard` (non connecté)
2. Être redirigé vers `/auth/signin`
3. Se connecter
4. Rester sur la page de login au lieu d'être redirigé

### Expected

L'utilisateur devrait être redirigé vers `/dashboard`.

### Actual

L'utilisateur reste sur `/auth/signin`.

### Environment

- OS: macOS 14
- Browser: Chrome 120
- Node: 18.17.0
```

## 💡 Proposer une fonctionnalité

Avant de coder une nouvelle fonctionnalité :

1. **Vérifiez** qu'elle n'existe pas déjà
2. **Créez une issue** pour discussion
3. **Attendez** l'approbation avant de commencer
4. **Suivez** l'architecture existante

Template d'issue :

```markdown
## Feature: Nom de la fonctionnalité

### Description

Description claire de la fonctionnalité.

### Motivation

Pourquoi cette fonctionnalité est utile ?

### Proposition d'implémentation

Comment vous proposez de l'implémenter.

### Alternatives considérées

Autres approches possibles.
```

## 🤝 Code de conduite

- Soyez respectueux et inclusif
- Acceptez les critiques constructives
- Concentrez-vous sur ce qui est mieux pour le projet
- Montrez de l'empathie envers les autres contributeurs

## 📚 Ressources utiles

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev)
- [Prisma Docs](https://www.prisma.io/docs)
- [Conventional Commits](https://www.conventionalcommits.org/)

## ❓ Questions ?

- Consultez la [documentation](./ARCHITECTURE.md)
- Ouvrez une [discussion GitHub](https://github.com/votre-username/base-nextjs/discussions)
- Créez une [issue](https://github.com/votre-username/base-nextjs/issues)

## 🎉 Remerciements

Merci pour votre contribution ! Chaque PR, issue, et suggestion aide à améliorer ce projet.

---

Happy coding! 🚀
