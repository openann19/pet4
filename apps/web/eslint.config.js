import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import promise from 'eslint-plugin-promise';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import security from 'eslint-plugin-security';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const tsFiles = ['**/*.{ts,tsx}'];

const typeCheckedIgnorePatterns = [
  '**/*.config.{js,cjs,mjs,ts,cts,mts}',
  '**/eslint.config.{js,cjs,mjs,ts,cts,mts}',
  '**/tailwind.config.*',
  '**/postcss.config.*',
  '**/stylelint.config.*',
  '**/vite.config.*',
  '**/vitest.config.*',
  '**/test/**',
  '**/tests/**',
  '**/__tests__/**',
  '**/*.test.{ts,tsx}',
  '**/*.spec.{ts,tsx}',
];

const tsTypeCheckedConfigs = tseslint.configs.recommendedTypeChecked.map((config) => ({
  ...config,
  files: tsFiles,
  ignores: [...(config.ignores ?? []), ...typeCheckedIgnorePatterns],
}));

const tsStylisticConfigs = tseslint.configs.stylisticTypeChecked.map((config) => ({
  ...config,
  files: tsFiles,
  ignores: [...(config.ignores ?? []), ...typeCheckedIgnorePatterns],
}));

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/html/**',
      '**/kyc-native.ts',
      '**/stylelint.config.*',
      '**/tailwind.config.*',
      '**/postcss.config.*',
      '**/vite.config.*',
      '**/e2e/**',
      '**/android-design-tokens-rn/**',
      '**/scripts/**',
      '**/public/**',
      '**/playwright.config.ts',
      // Prevent ESLint from trying to type-check config files themselves
      '**/*eslint.config.{js,cjs,mjs,ts}',
      '**/*.config.{js,cjs,mjs}',
      // Temporarily ignore problematic test files that cause parser crashes
      '**/src/lib/monitoring/performance-monitor.test.ts',
      '**/src/lib/nsfw/loader.test.ts',
      '**/src/lib/offline-swipe-queue.test.ts',
      '**/src/lib/platform-haptics.test.ts',
      '**/src/lib/rate-limit/quota-service.test.ts',
      '**/src/lib/rate-limit/token-bucket.test.ts',
      '**/src/lib/utils.test.ts',
      '**/src/lib/middleware/__tests__/rate-limit-app-router.test.ts',
      '**/src/lib/monitoring/__tests__/performance-monitor.test.ts',
      '**/src/lib/monitoring/__tests__/runtime-validation.test.ts',
    ],
  },
  { linterOptions: { reportUnusedDisableDirectives: 'error' } },
  js.configs.recommended,
  ...tsTypeCheckedConfigs,
  ...tsStylisticConfigs,
  {
    files: ['**/*.{js,cjs,mjs}'],
    ignores: typeCheckedIgnorePatterns,
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        project: null, // Don't use TypeScript parser for JS files
        tsconfigRootDir: undefined,
      },
    },
    plugins: {
      import: importPlugin,
      promise: promise,
      react: react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      security: security,
      sonarjs: sonarjs,
      unicorn: unicorn,
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        alias: {
          map: [['@', path.resolve(__dirname, './src')]],
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
      'no-console': 'error', // No console.* allowed in production code
      'no-debugger': 'error',
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
      'unicorn/prefer-optional-catch-binding': 'error',
      'sonarjs/no-duplicate-string': ['error', { threshold: 5 }],
      'promise/catch-or-return': 'error',
      'security/detect-object-injection': 'off',
      'import/no-unresolved': ['error', { ignore: ['^@/', '^@tailwindcss/', '^vitest/'] }],
      'import/named': 'error',
      'import/default': 'error',
      'import/namespace': 'error',
      'import/no-absolute-path': 'error',
      'import/no-self-import': 'error',
      'import/no-cycle': 'error',
      'import/no-unused-modules': 'error',
      'import/no-deprecated': 'warn',
      'no-restricted-globals': [
        'error',
        {
          name: 'spark',
          message:
            '❌ PRODUCTION BLOCKER: spark.kv mocks are banned in production. Use real API endpoints instead.',
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'window',
          property: 'spark',
          message:
            '❌ PRODUCTION BLOCKER: window.spark.kv mocks are banned. Use APIClient with real endpoints instead.',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'MemberExpression[object.name="window"][property.name="spark"]',
          message:
            '❌ PRODUCTION BLOCKER: window.spark usage detected. Migrate to real API endpoints.',
        },
        {
          selector: 'MemberExpression[property.name="kv"]',
          message:
            '❌ PRODUCTION BLOCKER: .kv usage detected. Use real database/API storage instead.',
        },
        {
          selector:
            'CallExpression[callee.type="MemberExpression"][callee.property.name="get"][callee.object.property.name="kv"]',
          message:
            '❌ PRODUCTION BLOCKER: spark.kv.get() calls are banned. Use APIClient.get() instead.',
        },
        {
          selector:
            'CallExpression[callee.type="MemberExpression"][callee.property.name="set"][callee.object.property.name="kv"]',
          message:
            '❌ PRODUCTION BLOCKER: spark.kv.set() calls are banned. Use APIClient.post/put() instead.',
        },
        {
          selector:
            'CallExpression[callee.type="MemberExpression"][callee.property.name="delete"][callee.object.property.name="kv"]',
          message:
            '❌ PRODUCTION BLOCKER: spark.kv.delete() calls are banned. Use APIClient.delete() instead.',
        },
        {
          selector: 'JSXAttribute[name.name="dangerouslySetInnerHTML"]',
          message: 'Avoid raw HTML; sanitize + safe render.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'framer-motion',
              message:
                'Use @petspark/motion (Reanimated) instead. Framer Motion only allowed in apps/web/**/web-only/**',
            },
          ],
          patterns: [
            {
              group: ['framer-motion'],
              message:
                'Use @petspark/motion (Reanimated) instead. Framer Motion only allowed in apps/web/**/web-only/**',
            },
          ],
        },
      ],
      // Disable type-aware rules for JS files (they don't have type information)
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
    },
  },
  {
    files: tsFiles,
    ignores: typeCheckedIgnorePatterns,
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['tsconfig.json'],
        },
        node: true,
      },
    },
    rules: {
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: true } }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/only-throw-error': 'off', // Temporarily disabled due to false positives with catch block variable renaming
      '@typescript-eslint/no-array-delete': 'off', // Disable problematic rule that causes parser crashes
      'max-lines': ['warn', { max: 800, skipComments: true, skipBlankLines: true }],
      'max-lines-per-function': ['warn', { max: 250 }],
    },
  },
  {
    files: ['src/core/**/*.{ts,tsx}', 'src/api/**/*.{ts,tsx}', 'design-system/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Property[value.type="Identifier"][value.name="undefined"]',
          message:
            'Optional props must be omitted. If you truly need undefined, declare `T | undefined` explicitly.',
        },
      ],
    },
  },
  {
    files: ['**/*.mjs', 'scripts/**/*.{js,cjs,mjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
      sourceType: 'module',
    },
    parser: undefined, // Use default JS parser, not TypeScript
    parserOptions: {
      project: null, // Disable TypeScript project parsing
      tsconfigRootDir: undefined, // Don't use TypeScript config
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
    },
  },
  // Test files configuration - disable all type-checking to prevent parser crashes
  {
    files: [
      'src/test/**/*.{ts,tsx,js,jsx}',
      'tests/**/*.{ts,tsx,js,jsx}',
      '**/*.test.{ts,tsx,js,jsx}',
      '**/*.spec.{ts,tsx,js,jsx}',
      'src/**/__tests__/**/*.{ts,tsx,js,jsx}',
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        vi: 'readonly',
        vitest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
      // Use TypeScript parser for test files but disable type-checking
      parser: tseslint.parser,
      parserOptions: {
        project: null,
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      // Disable all TypeScript and complex rules for test files
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-console': 'off',
      'import/no-unresolved': 'off',
      'import/no-cycle': 'off',
      'sonarjs/no-duplicate-string': 'off',
      // Disable all type-aware TypeScript rules
      '@typescript-eslint/no-base-to-string': 'off',
      '@typescript-eslint/no-array-delete': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
  {
    files: ['tailwind-plugin-linear-gradient.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: globals.node,
      parserOptions: {
        project: null,
        tsconfigRootDir: undefined,
      },
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'import/no-cycle': 'off',
      'import/no-self-import': 'off',
      'import/no-unresolved': 'off',
    },
  },
  {
    files: ['vitest.config.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      parser: tseslint.parser,
      globals: globals.node,
      parserOptions: {
        project: null,
        tsconfigRootDir: undefined,
      },
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'import/no-unresolved': 'off',
    },
  },
  {
    files: ['tests/accessibility.spec.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: null,
        tsconfigRootDir: undefined,
      },
    },
    rules: {
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
    },
  },
  {
    files: ['lighthouserc.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: globals.node,
      parserOptions: {
        project: null,
        tsconfigRootDir: undefined,
      },
    },
    rules: {
      'no-undef': 'off',
      'import/no-cycle': 'off',
      'import/no-unresolved': 'off',
    },
  },
  {
    files: ['src/api/__tests__/**/*.test.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: null,
        tsconfigRootDir: undefined,
      },
    },
    rules: {
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
    },
  },
  {
    files: [
      'src/lib/rate-limit/quota-service.test.ts',
      'src/lib/rate-limit/token-bucket.test.ts',
      'src/lib/utils.test.ts',
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: null,
        tsconfigRootDir: undefined,
      },
    },
    rules: {
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
    },
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
);
