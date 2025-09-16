# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Turborepo monorepo for a StarCraft II match tracking application that displays real-time match records. The project has the following structure:

- **Frontend app** (`apps/frontend`): Next.js app running on default port 3000
- **Backend app** (`apps/backend`): Next.js app configured to run on port 4000
- **UI Package** (`packages/ui`): Shared React component library
- **Config Packages**: ESLint and TypeScript configurations shared across the monorepo

## Essential Commands

### Development
```bash
# Run all apps in development mode
pnpm dev

# Run specific app
pnpm dev --filter=frontend
pnpm dev --filter=backend

# The backend runs on port 4000 (configured in apps/backend/package.json)
# The frontend runs on port 3000 (default Next.js port)
```

### Building
```bash
# Build all apps and packages
pnpm build

# Build specific app
pnpm build --filter=frontend
pnpm build --filter=backend
```

### Linting and Type Checking
```bash
# Run linting for all packages
pnpm lint

# Format code
pnpm format

# Type check all packages
pnpm check-types
```

## Architecture

### Monorepo Structure
- **Turborepo** manages the monorepo with task orchestration and caching
- **pnpm workspaces** for package management (v9.0.0)
- **Next.js 15.5.3** with Turbopack for both frontend and backend apps
- **TypeScript** throughout the entire codebase
- **Tailwind CSS v4** for styling

### Backend Technology Stack
- **Database ORM**: Drizzle ORM for type-safe database operations
- **GraphQL API**: Pothos GraphQL for schema-first API development
- **Authentication**: Battle.net OAuth 2.0 with cookie-based sessions
- **Database Schema**: Located in `apps/backend/lib/db/schema.ts`

### Key Configuration Files
- `turbo.json`: Defines build pipeline and task dependencies
- `pnpm-workspace.yaml`: Defines workspace packages
- Root `package.json`: Contains monorepo-wide scripts that delegate to Turbo

### Package Dependencies
- Apps import from internal packages using workspace protocol
- `@repo/ui`: Shared component library
- `@repo/eslint-config`: Shared ESLint configuration
- `@repo/typescript-config`: Shared TypeScript configurations

### Port Configuration
- Frontend: Port 3000 (default)
- Backend: Port 4000 (explicitly configured in `apps/backend/package.json`)

## Development Workflow

1. Install dependencies: `pnpm install` (automatically handled by pnpm)
2. Run development servers: `pnpm dev`
3. Make changes - Turbopack provides fast refresh
4. Before committing: Run `pnpm lint` and `pnpm check-types`
5. Build for production: `pnpm build`

## Important Notes

- Both apps use Next.js App Router (located in `app/` directory)
- Turbopack is enabled for both development and production builds
- The UI package exports components directly from `src/*.tsx`
- Type checking is separate from the build process (use `pnpm check-types`)

## Backend Development Guidelines

### Database Management
- Use **Drizzle ORM** for all database operations
- Define schemas in `apps/backend/lib/db/schema.ts`
- Use Drizzle's type-safe query builders instead of raw SQL
- Follow Drizzle's migration patterns for schema changes

### API Development
- Use **Pothos GraphQL** for building the GraphQL API
- Define resolvers with strong TypeScript typing
- Leverage Pothos plugins for authentication, validation, and error handling
- GraphQL schema should be co-located with resolvers for better maintainability

### Authentication
- Battle.net OAuth is already implemented in `/api/auth/` routes
- User sessions are managed via HTTP-only cookies
- Use the existing auth system for protecting GraphQL resolvers
- User data is available through the session context