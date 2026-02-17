# Base Next.js Template

A professional, production-ready Next.js starter template with TypeScript, Tailwind CSS, Prisma, NextAuth, and comprehensive best practices.

## 🚀 Features

### Core Stack

- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with Server Components
- **TypeScript** - Strict type checking enabled
- **Tailwind CSS** - Utility-first CSS framework
- **Ant Design** - Enterprise-level UI components

### Authentication & Security

- **NextAuth v5** - Complete authentication system
- **RBAC** - Role-based access control
- **Middleware** - Route protection
- **Password hashing** - bcrypt for secure passwords
- **OAuth support** - Google, GitHub (configurable)

### Database & ORM

- **Prisma** - Type-safe ORM
- **PostgreSQL** - Production database
- **Migrations** - Version-controlled schema changes
- **Seed data** - Sample data for development

### Data Fetching & State

- **React Query** - Server state management
- **Server Actions** - Type-safe mutations
- **Zod** - Runtime validation

### Error Handling

- **Standardized errors** - Business vs technical errors
- **Sentry integration** - Error tracking and monitoring
- **Type-safe responses** - Consistent API responses

### Developer Experience

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Commitlint** - Conventional commits
- **Husky** - Git hooks
- **Vitest** - Unit testing
- **TypeScript strict mode** - Maximum type safety

### Production Ready

- **Vercel deployment** - Optimized for Vercel
- **Environment validation** - Type-safe env vars with Zod
- **Logging** - Structured logging
- **File uploads** - S3/R2 support
- **Cron jobs** - Scheduled tasks

## 📦 Tech Stack

| Category         | Technologies             |
| ---------------- | ------------------------ |
| Framework        | Next.js 15, React 19     |
| Language         | TypeScript 5.7+          |
| Styling          | Tailwind CSS, Ant Design |
| Database         | PostgreSQL, Prisma       |
| Authentication   | NextAuth v5              |
| State Management | React Query              |
| Validation       | Zod                      |
| Testing          | Vitest, Testing Library  |
| Monitoring       | Sentry                   |
| Deployment       | Vercel                   |

## 🎯 When to Use This Template

Use this template as a base for your new Next.js projects when you want:

1. **Production-ready setup** - Everything configured and ready to deploy
2. **Best practices** - Industry-standard patterns and conventions
3. **Type safety** - Strict TypeScript throughout
4. **Authentication** - User management out of the box
5. **Database integration** - Prisma with migrations and seeding
6. **Professional architecture** - Organized folder structure

## 📖 Documentation

- [Setup Guide](./docs/SETUP.md) - How to use this template for new projects
- [Architecture](./docs/ARCHITECTURE.md) - System design and patterns
- [Contributing](./docs/CONTRIBUTING.md) - Contribution guidelines

## 🚦 Quick Start

See [SETUP.md](./docs/SETUP.md) for detailed instructions on using this template for a new project.

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL database (local or remote)
- Git

### Basic Setup

1. **Clone this template** for your new project
2. **Install dependencies**: `npm install`
3. **Set up environment**: Copy `.env.example` to `.env.local` and fill in values
4. **Initialize database**: `npm run db:push`
5. **Seed data**: `npm run db:seed`
6. **Start dev server**: `npm run dev`

## 📁 Project Structure

```
├── prisma/              # Database schema and migrations
├── public/              # Static files
├── src/
│   ├── app/            # Next.js App Router pages
│   │   ├── api/        # API routes
│   │   └── ...         # App pages
│   ├── components/     # React components
│   │   ├── ui/         # Base UI components
│   │   ├── forms/      # Form components
│   │   └── layout/     # Layout components
│   ├── lib/            # Shared libraries
│   │   ├── auth/       # Authentication logic
│   │   ├── db/         # Database client
│   │   ├── errors/     # Error handling
│   │   ├── utils/      # Utilities
│   │   └── validators/ # Zod schemas
│   ├── server/         # Server-side code
│   │   ├── actions/    # Server Actions
│   │   ├── api/        # API logic
│   │   ├── repositories/ # Data access
│   │   └── services/   # Business logic
│   ├── styles/         # Global styles
│   ├── test/           # Test utilities
│   └── types/          # TypeScript types
├── docs/               # Documentation
└── ...config files
```

## 🛠 Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema to database
npm run db:migrate      # Create migration
npm run db:seed         # Seed database
npm run db:studio       # Open Prisma Studio

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint errors
npm run format          # Format with Prettier
npm run type-check      # Check TypeScript types

# Testing
npm run test            # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
```

## 🔐 Environment Variables

See `.env.example` for all required and optional environment variables.

Key variables:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Auth secret (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Your app URL
- `NEXT_PUBLIC_APP_URL` - Public app URL

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

The project is optimized for Vercel with automatic preview deployments.

### Other Platforms

This template can be deployed to any platform that supports Next.js:

- Railway
- Render
- AWS (Amplify, ECS, etc.)
- Google Cloud Platform
- Azure

## 📚 Learn More

### Next.js Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Learn](https://nextjs.org/learn)

### This Template

- Read the [Architecture Guide](./docs/ARCHITECTURE.md) to understand the design decisions
- Check [Setup Guide](./docs/SETUP.md) for detailed usage instructions

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./docs/CONTRIBUTING.md) first.

## 📄 License

MIT License - feel free to use this template for your projects.

## ⭐ Support

If you find this template helpful, please give it a star!

---

**Happy coding!** 🚀
