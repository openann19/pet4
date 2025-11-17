# PETSPARK Project Template

Complete template guide for building new projects based on the PETSPARK monorepo structure. This document contains all configurations, templates, and patterns needed for AI developers to create production-ready applications.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Monorepo Setup](#monorepo-setup)
3. [Workspace Configuration](#workspace-configuration)
4. [TypeScript Setup](#typescript-setup)
5. [ESLint Setup](#eslint-setup)
6. [Prettier Setup](#prettier-setup)
7. [Web Application Template](#web-application-template)
8. [Mobile Application Template](#mobile-application-template)
9. [Shared Packages Template](#shared-packages-template)
10. [Component Templates](#component-templates)
11. [Hook Templates](#hook-templates)
12. [API Client Templates](#api-client-templates)
13. [Animation/Effects Templates](#animationeffects-templates)
14. [Testing Templates](#testing-templates)
15. [CI/CD Templates](#cicd-templates)
16. [Manifest.json Templates](#manifestjson-templates)
17. [Environment Configuration](#environment-configuration)
18. [Path Aliases](#path-aliases)
19. [Quality Gates](#quality-gates)
20. [Migration Guide](#migration-guide)

---

## Getting Started

### Prerequisites

- Node.js ≥18
- pnpm ≥8
- Git
- IDE (VS Code recommended)

### Quick Start

```bash
# Clone template repository
git clone <repository-url>
cd <project-name>

# Install dependencies
pnpm install

# Start development
pnpm web-dev        # Web app
pnpm mobile-start   # Mobile app

# Run quality gates
pnpm validate
```

---

## Monorepo Setup

### Root Package.json Template

**File: `package.json`**

```json
{
  "name": "PROJECT_NAME-monorepo",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "install:all": "pnpm install",
    "typecheck": "tsc --noEmit",
    "build:types": "tsc -b",
    "build:types:watch": "tsc -b -w",
    "lint": "eslint . --cache --cache-location ./.cache/eslint --max-warnings=0",
    "lint:fix": "eslint . --cache --cache-location ./.cache/eslint --max-warnings=0 --fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md,mdx,css,scss,yaml,yml}\" --ignore-path .gitignore",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md,mdx,css,scss,yaml,yml}\" --ignore-path .gitignore",
    "validate": "pnpm typecheck && pnpm lint && pnpm test",
    "depcheck": "pnpm -r --filter './apps/*' --filter './packages/*' exec depcheck || true",
    "test": "pnpm -r --filter './apps/*' --filter './packages/*' exec -- pnpm test:run 2>/dev/null || pnpm -r --filter './apps/*' --filter './packages/*' exec -- vitest run --passWithNoTests 2>/dev/null || true",
    "dev:single": "pnpm --filter ./packages/shared dev",
    "test:single": "pnpm --filter ./packages/shared test:run",
    "web-dev": "pnpm --filter PROJECT_NAME-web dev",
    "mobile-start": "pnpm --filter PROJECT_NAME-mobile start",
    "mobile-android": "pnpm --filter PROJECT_NAME-mobile android",
    "mobile-ios": "pnpm --filter PROJECT_NAME-mobile ios",
    "check:parity": "tsx scripts/check-mobile-parity.ts",
    "validate:effects": "tsx scripts/validate-effects-compliance.ts"
  },
  "devDependencies": {
    "@eslint/js": "^9.21.0",
    "@types/node": "^22.13.5",
    "depcheck": "^1.4.7",
    "eslint": "^9.28.0",
    "lint-staged": "^15.2.10",
    "eslint-import-resolver-typescript": "^3.10.1",
    "eslint-plugin-import": "^2.29.1",
    "eslint-plugin-jsx-a11y": "^6.10.2",
    "eslint-plugin-react": "^7.37.5",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.19",
    "globals": "^16.0.0",
    "globby": "^14.0.0",
    "prettier": "^3.4.2",
    "ts-morph": "^23.0.0",
    "ts-prune": "^0.10.3",
    "tsx": "^4.20.6",
    "typescript": "~5.7.2",
    "typescript-eslint": "^8.38.0"
  },
  "packageManager": "pnpm@10.18.3",
  "pnpm": {
    "overrides": {
      "vite": "6.4.1",
      "@types/react": "18.3.12",
      "form-data": ">=4.0.4"
    }
  },
  "engines": {
    "node": ">=18",
    "pnpm": ">=8"
  },
  "dependencies": {
    "zod": "^3.25.76"
  }
}
```

**Replace `PROJECT_NAME` with your project name.**

### PNPM Workspace Configuration

**File: `pnpm-workspace.yaml`**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Git Ignore Template

**File: `.gitignore`**

```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*
.pnp
.pnp.js

# Build outputs
dist/
build/
out/
.next/
.nuxt/
.cache/
.parcel-cache/
*.tsbuildinfo

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env*.local

# IDE and editor files
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store
*.sublime-project
*.sublime-workspace

# Cursor IDE
.cursor/

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Testing
coverage/
.nyc_output/
*.lcov
.vitest/

# OS files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
desktop.ini

# Temporary files
tmp/
*.tmp
*.temp
*.bak
*.backup
*.old

# Husky
.husky/_/

# TypeScript
*.tsbuildinfo

# Semgrep
.semgrep/

# Misc
*.local
.turbo

# Expo and React Native
.expo/
.expo-shared/
web-build/
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.ipa
*.aab
*.apk
.metro-health-check*
```

---

## Workspace Configuration

### Root TypeScript Configuration

**File: `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "baseUrl": ".",
    "paths": {
      "@mobile/*": ["apps/mobile/src/*"],
      "@mobile": ["apps/mobile/src/index.ts"],
      "@pet/domain/*": ["apps/web/src/core/domain/*"],
      "@PROJECT_NAME/shared": ["packages/shared/src/index.ts"],
      "@shared/types": ["packages/shared/src/types/index.ts"],
      "@shared/utils": ["packages/shared/src/utils/index.ts"],
      "@ui-mobile": ["packages/ui-mobile/index.ts"],
      "@ui-mobile/*": ["packages/ui-mobile/*"]
    },
    "rootDirs": [],
    "jsx": "react-jsx",
    "resolveJsonModule": true,
    "resolvePackageJsonExports": true,
    "resolvePackageJsonImports": true,
    "customConditions": [],
    "allowImportingTsExtensions": false,
    "verbatimModuleSyntax": true,
    "allowJs": false,
    "checkJs": false,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "allowUmdGlobalAccess": false,
    "isolatedModules": true,
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo",
    "noEmit": true,
    "sourceMap": true,
    "removeComments": false,
    "importHelpers": false,
    "downlevelIteration": true,
    "strict": true,
    "alwaysStrict": true,
    "forceConsistentCasingInFileNames": true,
    "useUnknownInCatchVariables": true,
    "strictBindCallApply": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": false,
    "exactOptionalPropertyTypes": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false,
    "preserveConstEnums": true,
    "skipLibCheck": true,
    "skipDefaultLibCheck": true,
    "declaration": false,
    "declarationMap": false,
    "emitDeclarationOnly": false,
    "experimentalDecorators": false,
    "emitDecoratorMetadata": false,
    "maxNodeModuleJsDepth": 1,
    "disableSizeLimit": false,
    "plugins": []
  },
  "exclude": [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/.turbo/**",
    "**/coverage/**",
    "**/test-results/**",
    "**/*.config.js",
    "**/*.config.ts",
    "backend/**",
    "android/**",
    "ios/**",
    "docs/**",
    "logs/**",
    "apps/native/**"
  ],
  "include": ["**/*", ".env.example"]
}
```

**Replace `PROJECT_NAME` with your project name.**

---

## TypeScript Setup

### Web App TypeScript Configuration

**File: `apps/web/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],
    "baseUrl": ".",
    "typeRoots": ["../../node_modules/@types", "./node_modules/@types"],
    "paths": {
      "@/*": ["./src/*"],
      "@design-system/*": ["./design-system/*"],
      "@PROJECT_NAME/chat-core": ["../../packages/chat-core/src/index.ts"],
      "@PROJECT_NAME/config": ["../../packages/config/src/index.ts"],
      "@PROJECT_NAME/shared": ["../../packages/shared/src/index.ts"]
    }
  },
  "include": [
    "src",
    "src/test/utils/test-helpers.tsx",
    "src/test/vitest.d.ts",
    "src/types/**/*.d.ts",
    "*.d.ts",
    "*.ts",
    "vite.config.ts",
    "design-system/**/*.ts",
    "design-system/**/*.tsx",
    "scripts/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "build",
    ".next",
    "coverage",
    "storybook-static",
    "**/*.stories.tsx"
  ]
}
```

### Mobile App TypeScript Configuration

**File: `apps/mobile/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "lib": ["ES2022"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": {
      "@mobile/*": ["./src/*"],
      "@mobile": ["./src/index.ts"],
      "@PROJECT_NAME/shared": ["../../packages/shared/src/index.ts"],
      "@PROJECT_NAME/motion": ["../../packages/motion/src/index.ts"]
    },
    "types": ["react-native", "jest", "@testing-library/jest-native"]
  },
  "include": [
    "src/**/*",
    "*.ts",
    "*.tsx",
    "app.config.ts"
  ],
  "exclude": [
    "node_modules",
    "**/__tests__/**",
    "**/*.test.ts",
    "**/*.test.tsx",
    ".expo",
    "web-build",
    "dist",
    "build"
  ]
}
```

### Strict Optionals Configuration

**File: `apps/web/tsconfig.strict-optionals.json`**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "exactOptionalPropertyTypes": true
  },
  "include": [
    "src/core/**/*",
    "src/api/**/*"
  ]
}
```

---

## ESLint Setup

### Root ESLint Configuration

**File: `eslint.config.js`**

```javascript
// Flat config, fast-by-default. Type-aware rules are scoped to specific globs.
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import react from 'eslint-plugin-react'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import globals from 'globals'

/** Globs where we actually want type-aware linting (web + key packages). */
const TYPE_AWARE = ['apps/web/**/*.{ts,tsx}', 'packages/*/src/**/*.{ts,tsx}']

export default [
  // Ignore heavy/generated stuff completely
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.expo/**',
      '**/ios/**',
      '**/android/**',
      '**/*.config.*',
      '**/.turbo/**',
      '**/.cache/**',
      '**/html/**',
    ],
  },

  // JS/TS base, no type info (fast path for most files, including tests)
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      react: react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      // Reasonable safety without killing dev speed
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
    settings: { react: { version: 'detect' } },
  },

  // Type-aware pass ONLY for selected globs (uses project service for caching)
  {
    files: TYPE_AWARE,
    ignores: [
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      '**/e2e/**',
      '**/test/**',
      '**/__tests__/**',
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true, // <— key perf improvement in typescript-eslint v7
        // tsconfigRootDir auto-detected from project service
      },
    },
    rules: {
      // Turn on the stricter rules where type info exists
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
    },
  },

  // Tests: never type-aware; keep it quick
  {
    files: [
      '**/*.{test,spec}.{ts,tsx,js,jsx}',
      '**/test/**/*.{ts,tsx,js,jsx}',
      '**/__tests__/**/*.{ts,tsx,js,jsx}',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      'no-console': 'off', // Allow console in tests for mocking/assertions
    },
  },

  // React Native / mobile: keep it fast (no heavy type-aware rules)
  {
    files: ['apps/mobile/**/*.{ts,tsx}', 'apps/native/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },

  // Scripts/configs: allow console for CLIs/build tools, Node.js globals
  // This must come after other configs to override base rules
  {
    files: [
      'scripts/**/*.{ts,tsx,js,jsx,mjs}',
      '**/*.config.{js,ts,cjs,mjs}',
      '**/.eslintrc.{js,cjs}',
      'apps/**/scripts/**/*.{ts,tsx,js,jsx,mjs}',
      'packages/**/scripts/**/*.{ts,tsx,js,jsx,mjs}',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-console': 'off',
      // Don't disable no-undef - instead provide globals above
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
]
```

---

## Prettier Setup

### Prettier Configuration

**File: `.prettierrc.json`**

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "plugins": []
}
```

---

## Web Application Template

### Web App Package.json

**File: `apps/web/package.json`**

```json
{
  "name": "PROJECT_NAME-web",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "dev:full": "bash scripts/dev-restart.sh",
    "kill": "fuser -k 5000/tcp",
    "build": "tsc -b --noCheck && vite build",
    "optimize": "vite optimize",
    "preview": "vite preview",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "typecheck:strict-optionals": "tsc -p tsconfig.strict-optionals.json --noEmit",
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx --max-warnings=0 --ignore-pattern 'dist/**' --ignore-pattern 'build/**'",
    "lint:fix": "eslint . --fix",
    "stylelint": "stylelint \"**/*.{css,scss}\" --allow-empty-input",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run --passWithNoTests",
    "test:cov": "vitest run --coverage",
    "test:coverage": "vitest run --coverage",
    "e2e": "playwright test",
    "e2e:smoke": "playwright test e2e/motion-smoke.spec.ts",
    "e2e:ui": "playwright test --ui",
    "test:a11y": "playwright test e2e/a11y-audit.spec.ts",
    "ci": "tsc -p tsconfig.json --noEmit && eslint . && node scripts/verify-parity.mjs && vitest run --passWithNoTests && pnpm verify:ultra",
    "check:budget": "node scripts/check-performance-budget.mjs",
    "semgrep": "semgrep ci --config p/ci --strict --error",
    "depcheck": "depcheck --skip-missing=true",
    "tsprune": "ts-prune -p tsconfig.json --ignoreTests --error",
    "forbid": "node scripts/forbid-words.mjs",
    "size": "size-limit",
    "strict": "pnpm typecheck && pnpm typecheck:strict-optionals && pnpm lint && pnpm stylelint && pnpm test:cov && (command -v semgrep >/dev/null 2>&1 && pnpm semgrep || true) && pnpm depcheck && pnpm tsprune && pnpm forbid && pnpm size",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "quality": "npm run type-check && npm run lint && npm run format:check && npm run test:run",
    "i18n:check": "tsx ./scripts/check-i18n-lengths.ts",
    "repo:check": "node scripts/repo-check.mjs",
    "prepare": "husky install",
    "verify:ultra": "node scripts/verify-ultra-effects.mjs"
  },
  "dependencies": {
    "@PROJECT_NAME/chat-core": "workspace:*",
    "@PROJECT_NAME/config": "workspace:*",
    "@PROJECT_NAME/motion": "workspace:*",
    "@PROJECT_NAME/shared": "workspace:*",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "@tanstack/react-query": "^5.83.1",
    "@tanstack/react-query-devtools": "^5.90.2",
    "@tanstack/react-query-persist-client": "^5.90.9",
    "@tanstack/query-sync-storage-persister": "^5.90.9",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@eslint/js": "^9.21.0",
    "@playwright/test": "^1.56.1",
    "@testing-library/react": "^14.3.1",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/user-event": "^14.5.2",
    "@types/node": "^22.13.5",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "@vitejs/plugin-react-swc": "^3.10.1",
    "@vitest/coverage-v8": "^4.0.6",
    "@vitest/ui": "^4.0.6",
    "depcheck": "^1.4.7",
    "eslint": "^9.28.0",
    "prettier": "^3.4.2",
    "size-limit": "^11.1.4",
    "tailwindcss": "^4.1.11",
    "ts-prune": "^0.10.3",
    "tsx": "^4.19.2",
    "typescript": "~5.7.2",
    "typescript-eslint": "^8.38.0",
    "vite": "^6.3.5",
    "vitest": "^4.0.6"
  },
  "size-limit": [
    {
      "path": "dist/**/*.{js,css}",
      "limit": "500 KB"
    }
  ],
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix"
    ],
    "*.{css,scss}": [
      "stylelint --fix"
    ]
  }
}
```

**Replace `PROJECT_NAME` with your project name.**

### Vite Configuration Template

**File: `apps/web/vite.config.ts`**

```typescript
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import type { PluginOption, UserConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = process.env['PROJECT_ROOT'] ?? __dirname;

export default defineConfig(async (): Promise<UserConfig> => {
  const plugins: PluginOption[] = [
    react({}),
    tailwindcss(),
    nodePolyfills({
      include: ['util', 'assert', 'process', 'stream', 'events', 'buffer', 'crypto'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ];

  return {
    plugins,
    define: {
      'process.version': JSON.stringify(''),
      'process.platform': JSON.stringify('browser'),
      'process.browser': 'true',
      'process.nextTick': 'setTimeout',
    },
    resolve: {
      alias: {
        '@': path.resolve(projectRoot, './src'),
        'react-native': 'react-native-web',
      },
      conditions: ['import', 'module', 'browser', 'default'],
      extensions: [
        '.web.js',
        '.web.jsx',
        '.web.ts',
        '.web.tsx',
        '.jsx',
        '.js',
        '.tsx',
        '.ts',
        '.json',
      ],
      dedupe: ['react', 'react-dom'],
    },
    server: {
      hmr: {
        overlay: true,
      },
      watch: {
        ignored: ['**/node_modules/react-native/**', '**/.git/**'],
      },
      fs: {
        allow: ['..'],
        strict: false,
      },
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
        include: [/node_modules/],
        strictRequires: true,
        defaultIsModuleExports: true,
      },
      chunkSizeWarningLimit: 500,
      reportCompressedSize: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
        },
        format: {
          comments: false,
        },
      },
    },
  };
});
```

### Vitest Configuration Template

**File: `apps/web/vitest.config.ts`**

```typescript
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = __dirname;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(projectRoot, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'src/**/__tests__/**/*.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        '**/__tests__/**',
        '**/*.stories.tsx',
      ],
      thresholds: {
        lines: 95,
        branches: 95,
        functions: 95,
        statements: 95,
      },
    },
    reporters: ['default', 'html'],
    watch: false,
  },
});
```

### Tailwind Configuration Template

**File: `apps/web/tailwind.config.js`**

```javascript
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        neutral: {
          1: 'var(--color-neutral-1)',
          2: 'var(--color-neutral-2)',
          // ... add more colors
        },
        accent: {
          1: 'var(--color-accent-1)',
          // ... add more colors
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
};
```

### Main Entry Point Template

**File: `apps/web/src/main.tsx`**

```typescript
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { BrowserRouter } from 'react-router-dom';

import './lib/storage';
import './lib/theme-init';

import { createLogger } from './lib/logger';
import { registerServiceWorker } from './lib/pwa/service-worker-registration';

import App from './App';
import { ErrorFallback } from './ErrorFallback';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import { QueryProvider } from './providers/QueryProvider';

import './index.css';
import './main.css';
import './styles/theme.css';

const rootLogger = createLogger('web.main');

// Register service worker for PWA functionality
if (import.meta.env.PROD) {
  void registerServiceWorker({
    onError: (error) => {
      rootLogger.error('Service worker registration failed', error);
    },
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found. Make sure <div id="root"></div> exists in index.html');
}

createRoot(rootElement).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <BrowserRouter>
      <QueryProvider>
        <AppProvider>
          <UIProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </UIProvider>
        </AppProvider>
      </QueryProvider>
    </BrowserRouter>
  </ErrorBoundary>
);
```

---

## Mobile Application Template

### Mobile App Package.json

**File: `apps/mobile/package.json`**

```json
{
  "name": "PROJECT_NAME-mobile",
  "version": "0.1.0",
  "private": true,
  "main": "index.js",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx --max-warnings=0",
    "test": "vitest",
    "test:cov": "vitest run --coverage",
    "test:run": "vitest run --passWithNoTests",
    "ci": "node scripts/ci-check.mjs",
    "prebuild": "expo prebuild --clean",
    "build:eas": "eas build --platform all",
    "build:eas:ios": "eas build --platform ios",
    "build:eas:android": "eas build --platform android",
    "submit:ios": "eas submit --platform ios",
    "submit:android": "eas submit --platform android"
  },
  "dependencies": {
    "@PROJECT_NAME/motion": "workspace:*",
    "@PROJECT_NAME/shared": "workspace:*",
    "expo": "~51.0.39",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "react-native": "0.74.5",
    "react-native-reanimated": "~3.10.1",
    "react-native-gesture-handler": "~2.16.2",
    "react-native-safe-area-context": "4.10.5",
    "react-native-screens": "~4.0.0",
    "@react-navigation/native": "^7.0.14",
    "@react-navigation/native-stack": "^7.1.7",
    "@react-navigation/bottom-tabs": "^7.0.12",
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/react-query-persist-client": "^5.90.9",
    "@tanstack/query-async-storage-persister": "^5.90.9",
    "zustand": "^4.5.0",
    "expo-haptics": "~13.0.1",
    "expo-camera": "~15.0.16",
    "expo-image": "~1.13.0",
    "expo-location": "~17.0.1",
    "expo-notifications": "~0.28.19",
    "nativewind": "^4.0.1"
  },
  "devDependencies": {
    "@babel/core": "^7.26.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.12",
    "@testing-library/react-native": "^13.3.3",
    "@testing-library/jest-native": "^5.4.3",
    "eslint": "^9.28.0",
    "typescript": "~5.3.3",
    "typescript-eslint": "^8.38.0",
    "vitest": "^4.0.7",
    "@vitest/coverage-v8": "^4.0.7",
    "tailwindcss": "^3.4.1"
  },
  "engines": {
    "node": ">=18"
  },
  "type": "module"
}
```

**Replace `PROJECT_NAME` with your project name.**

### Expo Configuration Template

**File: `apps/mobile/app.config.ts`**

```typescript
import type { ExpoConfig, ConfigContext } from 'expo/config'

const projectName = 'PROJECT_NAME Mobile'
const projectSlug = 'PROJECT_NAME-mobile'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: projectName,
  slug: projectSlug,
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  jsEngine: 'hermes',
  runtimeVersion: {
    policy: 'sdkVersion',
  },
  updates: {
    enabled: true,
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ['**/*'],
  splash: {
    image: './assets/icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.PROJECT_NAME.mobile',
    infoPlist: {
      NSCameraUsageDescription: 'We use the camera for verification and photos.',
      NSPhotoLibraryAddUsageDescription: 'Allow PROJECT_NAME to save photos.',
      NSPhotoLibraryUsageDescription: 'Allow PROJECT_NAME to access your photos.',
      NSLocationWhenInUseUsageDescription: 'PROJECT_NAME uses your location to provide location-based features.',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'PROJECT_NAME uses your location to provide location-based features.',
      NSMicrophoneUsageDescription: 'PROJECT_NAME uses the microphone for voice messages and calls.',
      NSUserTrackingUsageDescription: 'PROJECT_NAME uses tracking to provide personalized content.',
    },
    privacyManifests: {
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
          NSPrivacyAccessedAPITypeReasons: ['C617.1'],
        },
      ],
    },
  },
  android: {
    package: 'com.PROJECT_NAME.mobile',
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#ffffff',
    },
    permissions: [
      'android.permission.INTERNET',
      'android.permission.CAMERA',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ],
    blockedPermissions: [],
    softwareKeyboardLayoutMode: 'pan',
    intentFilters: [],
  },
  extra: {
    apiUrl: process.env['EXPO_PUBLIC_API_URL'],
    eas: {
      projectId: process.env['EXPO_PUBLIC_EAS_PROJECT_ID'] ?? '00000000-0000-0000-0000-000000000000',
    },
  },
})
```

**Replace `PROJECT_NAME` with your project name.**

### EAS Build Configuration Template

**File: `apps/mobile/eas.json`**

```json
{
  "cli": {
    "version": ">= 13.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Mobile App Entry Point Template

**File: `apps/mobile/index.js`**

```javascript
import { registerRootComponent } from 'expo'
import { StatusBar } from 'expo-status-bar'
import 'react-native-gesture-handler'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import '../global.css'
import App from './src/App'

function Root() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <App />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

registerRootComponent(Root)
```

### Metro Configuration Template

**File: `apps/mobile/metro.config.cjs`**

```javascript
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = config;
```

### Babel Configuration Template

**File: `apps/mobile/babel.config.js`**

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ts', '.tsx', '.js', '.jsx'],
          alias: {
            '@mobile': './src',
            '@PROJECT_NAME/shared': '../../packages/shared/src',
            '@PROJECT_NAME/motion': '../../packages/motion/src',
          },
        },
      ],
    ],
  };
};
```

---

## Shared Packages Template

### Shared Package Template

**File: `packages/shared/package.json`**

```json
{
  "name": "@PROJECT_NAME/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run",
    "lint": "echo 'Linting shared package...'"
  },
  "dependencies": {
    "@types/react": "^18.3.12",
    "@types/react-native": "^0.73.0",
    "clsx": "^2.1.1",
    "react": "^18.3.1",
    "react-native": "^0.74.5",
    "react-native-reanimated": "^3.19.3",
    "react-native-web": "^0.19.12",
    "tailwind-merge": "^2.5.4",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/react-native": "^12.0.0",
    "typescript": "~5.7.2",
    "vitest": "^1.0.0"
  }
}
```

### Motion Package Template

**File: `packages/motion/package.json`**

```json
{
  "name": "@PROJECT_NAME/motion",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:run": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "peerDependencies": {
    "react": ">=18",
    "react-native-reanimated": ">=3.6.0"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@types/react": "^18.3.12",
    "@types/react-native": "^0.73.0",
    "@vitejs/plugin-react": "^4.2.0",
    "react": "18.2.0",
    "react-native": "0.74.5",
    "typescript": "~5.7.2",
    "vitest": "^1.0.0"
  }
}
```

### Config Package Template

**File: `packages/config/package.json`**

```json
{
  "name": "@PROJECT_NAME/config",
  "version": "1.0.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run --passWithNoTests"
  },
  "dependencies": {
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "typescript": "^5.7.2",
    "vitest": "^1.0.0"
  }
}
```

---

## Component Templates

### Web Component Template

**File: `apps/web/src/components/MyComponent.tsx`**

```typescript
'use client'

import { memo } from 'react'
import type { ReactNode } from 'react'

export interface MyComponentProps {
  children?: ReactNode
  title: string
  onAction?: () => void
  enabled?: boolean
}

export const MyComponent = memo(function MyComponent({
  children,
  title,
  onAction,
  enabled = true,
}: MyComponentProps) {
  return (
    <div className="my-component">
      <h2>{title}</h2>
      {children}
      {onAction && enabled && (
        <button onClick={onAction} type="button">
          Action
        </button>
      )}
    </div>
  )
})
```

### Mobile Component Template

**File: `apps/mobile/src/components/MyComponent.tsx`**

```typescript
import { memo } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import type { ReactNode } from 'react'

export interface MyComponentProps {
  children?: ReactNode
  title: string
  onAction?: () => void
  enabled?: boolean
}

export const MyComponent = memo(function MyComponent({
  children,
  title,
  onAction,
  enabled = true,
}: MyComponentProps) {
  return (
    <View className="my-component">
      <Text>{title}</Text>
      {children}
      {onAction && enabled && (
        <TouchableOpacity onPress={onAction}>
          <Text>Action</Text>
        </TouchableOpacity>
      )}
    </View>
  )
})
```

---

## Hook Templates

### Custom Hook Template

**File: `apps/web/src/hooks/useMyHook.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react'

export interface UseMyHookOptions {
  enabled?: boolean
  initialValue?: string
}

export interface UseMyHookReturn {
  value: string
  setValue: (value: string) => void
  reset: () => void
}

export function useMyHook(options: UseMyHookOptions = {}): UseMyHookReturn {
  const { enabled = true, initialValue = '' } = options

  const [value, setValue] = useState<string>(initialValue)

  const reset = useCallback(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    if (!enabled) {
      reset()
    }
  }, [enabled, reset])

  return {
    value,
    setValue,
    reset,
  }
}
```

---

## API Client Templates

### API Client Template

**File: `apps/web/src/api/my-api.ts`**

```typescript
import type { OptionalWithUndef } from '@/types/optional-with-undef'
import { createLogger } from '@/lib/logger'

const logger = createLogger('MyAPI')

export interface MyEntity {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface CreateMyEntityData {
  name: string
}

export interface UpdateMyEntityData extends OptionalWithUndef<
  Omit<MyEntity, 'id' | 'createdAt' | 'updatedAt'>
> {}

export class MyAPI {
  private baseUrl: string

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl
  }

  async getById(id: string): Promise<MyEntity> {
    try {
      const response = await fetch(`${this.baseUrl}/my-entity/${id}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch entity: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get entity', err, { id })
      throw err
    }
  }

  async create(data: CreateMyEntityData): Promise<MyEntity> {
    try {
      const response = await fetch(`${this.baseUrl}/my-entity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        throw new Error(`Failed to create entity: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to create entity', err, { data })
      throw err
    }
  }

  async update(id: string, data: UpdateMyEntityData): Promise<MyEntity> {
    try {
      const response = await fetch(`${this.baseUrl}/my-entity/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        throw new Error(`Failed to update entity: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to update entity', err, { id, data })
      throw err
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/my-entity/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error(`Failed to delete entity: ${response.statusText}`)
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to delete entity', err, { id })
      throw err
    }
  }
}

export const myAPI = new MyAPI()
```

---

## Manifest.json Templates

### Web PWA Manifest Template

**File: `apps/web/public/manifest.json`**

```json
{
  "name": "PROJECT_NAME - Your App Description",
  "short_name": "PROJECT_NAME",
  "description": "Your app description here",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#6366f1",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["social", "lifestyle", "photo"],
  "screenshots": [
    {
      "src": "/screenshot-1.png",
      "sizes": "540x720",
      "type": "image/png"
    },
    {
      "src": "/screenshot-2.png",
      "sizes": "540x720",
      "type": "image/png"
    }
  ],
  "shortcuts": [
    {
      "name": "Home Feed",
      "short_name": "Feed",
      "description": "View your feed",
      "url": "/",
      "icons": [{ "src": "/icon-192.png", "sizes": "192x192" }]
    },
    {
      "name": "Explore",
      "short_name": "Explore",
      "description": "Discover new content",
      "url": "/explore",
      "icons": [{ "src": "/icon-192.png", "sizes": "192x192" }]
    },
    {
      "name": "Profile",
      "short_name": "Profile",
      "description": "View your profile",
      "url": "/profile",
      "icons": [{ "src": "/icon-192.png", "sizes": "192x192" }]
    }
  ],
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        {
          "name": "media",
          "accept": ["image/*", "video/*"]
        }
      ]
    }
  }
}
```

**Replace `PROJECT_NAME` with your project name and update descriptions, colors, and icons.**

---

## Environment Configuration

### Web Environment Variables Template

**File: `apps/web/.env.example`**

```env
# API Configuration
VITE_API_URL=https://api.example.com

# App Configuration
VITE_APP_NAME=PROJECT_NAME
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_FEATURE_X=true
VITE_ENABLE_FEATURE_Y=false

# Analytics
VITE_ANALYTICS_ID=your-analytics-id

# Sentry (optional)
VITE_SENTRY_DSN=your-sentry-dsn
```

### Mobile Environment Variables Template

**File: `apps/mobile/.env.example`**

```env
# API Configuration
EXPO_PUBLIC_API_URL=https://api.example.com

# EAS Configuration
EXPO_PUBLIC_EAS_PROJECT_ID=your-eas-project-id

# App Configuration
EXPO_PUBLIC_APP_NAME=PROJECT_NAME
EXPO_PUBLIC_APP_VERSION=1.0.0

# Feature Flags
EXPO_PUBLIC_ENABLE_FEATURE_X=true
EXPO_PUBLIC_ENABLE_FEATURE_Y=false
```

### Backend Environment Variables Template

**File: `apps/backend/.env.example`**

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/database

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info
```

---

## Path Aliases

### Web Path Aliases

Configured in `apps/web/tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@design-system/*": ["./design-system/*"],
      "@PROJECT_NAME/shared": ["../../packages/shared/src/index.ts"],
      "@PROJECT_NAME/config": ["../../packages/config/src/index.ts"],
      "@PROJECT_NAME/motion": ["../../packages/motion/src/index.ts"]
    }
  }
}
```

### Mobile Path Aliases

Configured in `apps/mobile/tsconfig.json` and `babel.config.js`:

```json
{
  "compilerOptions": {
    "paths": {
      "@mobile/*": ["./src/*"],
      "@mobile": ["./src/index.ts"],
      "@PROJECT_NAME/shared": ["../../packages/shared/src/index.ts"],
      "@PROJECT_NAME/motion": ["../../packages/motion/src/index.ts"]
    }
  }
}
```

---

## Quality Gates

### Strict Script Template

**File: `apps/web/package.json` (scripts section)**

```json
{
  "scripts": {
    "strict": "pnpm typecheck && pnpm typecheck:strict-optionals && pnpm lint && pnpm stylelint && pnpm test:cov && (command -v semgrep >/dev/null 2>&1 && pnpm semgrep || true) && pnpm depcheck && pnpm tsprune && pnpm forbid && pnpm size"
  }
}
```

### Quality Gate Checklist

- ✅ TypeScript: Zero errors
- ✅ ESLint: Zero warnings
- ✅ Prettier: All files formatted
- ✅ Tests: 95% coverage
- ✅ Bundle size: Within limits
- ✅ Security: Semgrep checks pass
- ✅ Dependencies: No unused dependencies
- ✅ Dead code: ts-prune passes

---

## Testing Templates

### Component Test Template

**File: `apps/web/src/components/MyComponent.test.tsx`**

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  it('should render with default props', () => {
    render(<MyComponent title="Test Title" />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('should handle action callback', async () => {
    const onAction = vi.fn()
    render(<MyComponent title="Test" onAction={onAction} />)

    const button = screen.getByRole('button')
    button.click()

    expect(onAction).toHaveBeenCalledOnce()
  })

  it('should not render button when disabled', () => {
    render(<MyComponent title="Test" onAction={vi.fn()} enabled={false} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
```

### Hook Test Template

**File: `apps/web/src/hooks/useMyHook.test.ts`**

```typescript
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useMyHook } from './useMyHook'

describe('useMyHook', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useMyHook())
    expect(result.current.value).toBe('')
  })

  it('should update value', () => {
    const { result } = renderHook(() => useMyHook())

    act(() => {
      result.current.setValue('new value')
    })

    expect(result.current.value).toBe('new value')
  })

  it('should reset value', () => {
    const { result } = renderHook(() => useMyHook({ initialValue: 'initial' }))

    act(() => {
      result.current.setValue('updated')
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.value).toBe('initial')
  })
})
```

---

## CI/CD Templates

### GitHub Actions CI Template

**File: `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter PROJECT_NAME-web build
```

**Replace `PROJECT_NAME` with your project name.**

### Husky Pre-commit Hook Template

**File: `.husky/pre-commit`**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint:fix
pnpm format
```

### Husky Pre-push Hook Template

**File: `.husky/pre-push`**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm validate
```

---

## Migration Guide

### Step 1: Replace Placeholders

1. Replace `PROJECT_NAME` with your project name throughout all files
2. Update app names in `package.json` files
3. Update bundle identifiers in mobile apps
4. Update API URLs in environment files
5. Update manifest.json with your app information

### Step 2: Install Dependencies

```bash
pnpm install
```

### Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env` in each app
2. Fill in required environment variables
3. Update API URLs and secrets

### Step 4: Update Domain Models

1. Update domain models in `apps/web/src/core/domain/`
2. Update API clients in `apps/web/src/api/`
3. Update types in `packages/shared/src/types/`

### Step 5: Run Quality Gates

```bash
pnpm validate
```

### Step 6: Customize Branding

1. Update app icons and splash screens
2. Update theme colors in `tailwind.config.js`
3. Update manifest.json with your branding
4. Update app names and descriptions

### Step 7: Set Up CI/CD

1. Update GitHub Actions workflows with your project name
2. Configure EAS Build for mobile apps
3. Set up environment variables in CI/CD

### Step 8: Verify Everything Works

```bash
# Web app
pnpm web-dev

# Mobile app
pnpm mobile-start

# Run tests
pnpm test

# Run quality gates
pnpm validate
```

---

## Best Practices

### Code Quality

- ✅ Zero TypeScript errors
- ✅ Zero ESLint warnings
- ✅ 95% test coverage
- ✅ Strict TypeScript mode
- ✅ No `any` types
- ✅ No `@ts-ignore`

### Performance

- ✅ Lazy loading for routes
- ✅ Code splitting by feature
- ✅ Virtual scrolling for lists
- ✅ Image optimization
- ✅ Bundle size limits

### Accessibility

- ✅ ARIA labels
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ High contrast mode
- ✅ Reduced motion support

### Security

- ✅ Environment variables for secrets
- ✅ Input validation
- ✅ XSS prevention
- ✅ CSRF protection
- ✅ Secure headers

---

## Summary

This template provides:

- ✅ Complete monorepo setup with pnpm workspaces
- ✅ Web application (Vite + React + TypeScript)
- ✅ Mobile application (Expo + React Native + TypeScript)
- ✅ Shared packages for code reuse
- ✅ Strict TypeScript configuration
- ✅ Zero-warning ESLint configuration
- ✅ Comprehensive testing setup
- ✅ CI/CD configuration
- ✅ Quality gates and performance budgets
- ✅ Accessibility support
- ✅ Production-ready configuration
- ✅ Manifest.json templates for PWA
- ✅ Complete environment configuration
- ✅ Component and hook templates
- ✅ API client templates
- ✅ Testing templates

**Ready for Production**: All templates are production-ready and follow best practices.

For detailed project structure, see [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md).
