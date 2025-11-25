// Flat config, fast-by-default. Type-aware rules are scoped to specific globs.
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import react from 'eslint-plugin-react'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import sonarjs from 'eslint-plugin-sonarjs'
import globals from 'globals'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname)

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
      '**/MEDIA_EDITOR_EXAMPLES.tsx',
      'MEDIA_EDITOR_EXAMPLES.tsx',
      'apps/backend/**', // Backend uses different tsconfig, exclude from type-aware linting
      'packages/core/**', // Exclude core from linting to avoid tsconfig conflicts
      '**/test/**', // Test files use different tsconfig setup
      '**/__tests__/**',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      '**/setup.ts', // Test setup files
      '**/setup.tsx',
      '**/dialog.stories.tsx', // Non-existent file causing parsing errors
      '**/kyc-native.ts', // Non-existent file causing parsing errors
    ],
  },

  // JS/TS base, no type info (fast path for most files, including tests)
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    ignores: [
      '**/test/**',
      '**/__tests__/**',
      '**/*.test.{ts,tsx,js,jsx}',
      '**/*.spec.{ts,tsx,js,jsx}',
      '**/setup.ts',
      '**/setup.tsx',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        tsconfigRootDir: rootDir,
      },
    },
    plugins: {
      react: react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      sonarjs: sonarjs,
    },
    rules: {
      // Reasonable safety without killing dev speed
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      // Disable max-lines to avoid blocking large feature modules; keep other rules strict
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'sonarjs/no-duplicate-string': 'warn',
      // Block legacy imports and enforce architecture
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native-reanimated',
              message: 'Use @petspark/motion façade instead of direct Reanimated imports',
            },
          ],
        },
      ],
      // Ban dangerouslySetInnerHTML and eslint-disable comments
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="dangerouslySetInnerHTML"]',
          message: 'Sanitize via safe renderer; avoid raw HTML.',
        },
        {
          selector: 'Program > Comment[value=/eslint-disable/]',
          message: 'ESLint disable comments are banned. Fix the underlying issue instead.',
        },
      ],
    },
    settings: { react: { version: 'detect' } },
  },

  // Web app: enforce motion façade and design system
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    ignores: [
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      '**/e2e/**',
      '**/test/**',
      '**/__tests__/**',
      'apps/web/src/theme/**', // Allow raw colors in theme files
      'apps/web/src/tokens/**', // Allow raw colors in token files
      'apps/web/design-system/**', // Allow raw colors in design system
    ],
    rules: {
      // Block direct framer-motion in web (use @petspark/motion façade)
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'framer-motion',
              message: 'Use @petspark/motion façade instead of direct framer-motion imports in apps/web',
            },
            {
              name: 'react-native-reanimated',
              message: 'Reanimated is not allowed in apps/web; use @petspark/motion',
            },
          ],
        },
      ],
      // Block raw hex colors in JSX className strings
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="dangerouslySetInnerHTML"]',
          message: 'Sanitize via safe renderer; avoid raw HTML.',
        },
        {
          selector: 'Program > Comment[value=/eslint-disable/]',
          message: 'ESLint disable comments are banned. Fix the underlying issue instead.',
        },
        {
          selector: 'JSXAttribute[name.name="className"] Literal[value=/#[0-9a-fA-F]{3,8}/]',
          message: 'Use design system tokens instead of raw hex colors in className',
        },
        {
          selector: 'JSXAttribute[name.name="style"] Property[key.name="color"][value.value=/#[0-9a-fA-F]{3,8}/]',
          message: 'Use design system tokens instead of raw hex colors in style objects',
        },
        {
          selector: 'JSXAttribute[name.name="style"] Property[key.name="backgroundColor"][value.value=/#[0-9a-fA-F]{3,8}/]',
          message: 'Use design system tokens instead of raw hex colors in style objects',
        },
      ],
    },
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
      '**/setup.ts',
      '**/setup.tsx',
      'apps/web/android-design-tokens-rn/**',
      'packages/core/**', // Exclude core from type-aware to avoid tsconfig conflicts
      'packages/motion/src/**/*.native.tsx', // Excluded from motion tsconfig
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true, // <— key perf improvement in typescript-eslint v7
        tsconfigRootDir: rootDir, // Explicit root for multi-project setup
      },
    },
    rules: {
      // Turn on the stricter rules where type info exists
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
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
      '**/setup.ts',
      '**/setup.tsx',
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        tsconfigRootDir: rootDir,
        project: false, // Disable type-aware linting for tests
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      'no-console': 'off', // Allow console in tests for mocking/assertions
      'max-lines': 'off', // Allow longer test files
      'max-lines-per-function': 'off', // Allow longer test functions
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
      'no-restricted-imports': 'off', // Allow direct react-native-reanimated for mobile native apps
    },
  },

  // Motion package: allow direct react-native-reanimated imports (façade implementation)
  {
    files: ['packages/motion/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': 'off', // Allow direct imports for façade implementation
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
