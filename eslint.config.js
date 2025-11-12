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
      '**/MEDIA_EDITOR_EXAMPLES.tsx',
      'MEDIA_EDITOR_EXAMPLES.tsx',
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
      'apps/web/android-design-tokens-rn/**',
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
