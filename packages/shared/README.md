# @pet3/shared

Shared TypeScript utilities and types for the Pet3 monorepo.

## Purpose

This package contains pure TypeScript business logic, utilities, and types that can be safely shared between web and native applications. It has no platform-specific dependencies.

## Installation

This package is part of the monorepo workspace and is automatically available to other workspace packages.

## Usage

```typescript
import { getAppEnvironment, generateCorrelationId } from '@pet3/shared';

const env = getAppEnvironment();
console.log(`Running in ${env.env} mode`);

const correlationId = generateCorrelationId();
console.log(`Request ID: ${correlationId}`);
```

## Building

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

## Development

```bash
npm run typecheck
```

Run TypeScript type checking without emitting files.

## Adding New Utilities

1. Add your utility function or type to `src/index.ts` or a new file in `src/`
2. Export it from `src/index.ts`
3. Run `npm run build` to compile
4. Import and use in web or native apps

## Guidelines

- Keep utilities platform-agnostic (no React Native or DOM-specific code)
- Write pure functions when possible
- Include JSDoc comments for public APIs
- Avoid external dependencies unless absolutely necessary
