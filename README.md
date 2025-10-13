# ReplayLens

A StarCraft II replay analysis and match tracking application built with modern web technologies.

## What's inside?

This Turborepo monorepo includes the following packages/apps:

### Apps and Packages

- `frontend`: a [Next.js](https://nextjs.org/) app for the user-facing interface (port 2000)
- `backend`: a [Next.js](https://nextjs.org/) app providing GraphQL API and authentication (port 2001)
- `@repo/ui`: a React component library shared across applications
- `@repo/sc2-utils`: utilities for StarCraft II replay processing
- `@repo/types`: shared TypeScript type definitions
- `@repo/eslint-config`: shared ESLint configurations
- `@repo/typescript-config`: shared TypeScript configurations

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

## Tech Stack

- **Framework**: Next.js 15.5.3 with App Router and Turbopack
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL with Drizzle ORM
- **API**: GraphQL with Pothos
- **Authentication**: Battle.net OAuth 2.0
- **Monorepo**: Turborepo with pnpm workspaces
- **Replay Parsing**: sc2ts library

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm 9.0.0 (automatically installed via packageManager field)

### Installation

```bash
pnpm install
```

### Development

Run all apps in development mode:

```bash
pnpm dev
```

Run specific app:

```bash
pnpm dev --filter=frontend  # Runs on port 2000
pnpm dev --filter=backend   # Runs on port 2001
```

### Build

Build all apps and packages:

```bash
pnpm build
```

Build specific app:

```bash
pnpm build --filter=frontend
pnpm build --filter=backend
```

### Other Commands

```bash
pnpm lint          # Lint all packages
pnpm format        # Format code with Prettier
pnpm check-types   # Type check all packages
```

## Project Structure

```
.
├── apps
│   ├── frontend/          # Next.js frontend app
│   └── backend/           # Next.js backend app with GraphQL API
├── packages
│   ├── ui/                # Shared React components
│   ├── sc2-utils/         # StarCraft II utilities
│   ├── types/             # Shared TypeScript types
│   ├── eslint-config/     # Shared ESLint config
│   └── typescript-config/ # Shared TypeScript config
├── turbo.json             # Turborepo configuration
└── pnpm-workspace.yaml    # pnpm workspace configuration
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Turborepo Documentation](https://turborepo.com/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Pothos GraphQL](https://pothos-graphql.dev/)
