import { fixupPluginRules } from '@eslint/eslintrc';
import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/node_modules/**',
      '**/.turbo/**',
      '**/*.config.js',
      '**/*.config.ts',
      '**/coverage/**',
      '**/test-results/**',
      '**/playwright-report/**',
      '**/storybook-static/**',
      '**/docs/**',
      '**/logs/**',
      '**/android/**',
      '**/ios/**',
      'backend/**',
    ],
  },
  { linterOptions: { reportUnusedDisableDirectives: 'error' } },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        project: [
          './tsconfig.base.json',
          './apps/*/tsconfig.json',
          './packages/*/tsconfig.json',
        ],
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      react: fixupPluginRules(react),
      'react-hooks': fixupPluginRules(reactHooks),
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      import: fixupPluginRules(importPlugin),
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // Strict TypeScript rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/restrict-template-expressions': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/no-confusing-void-expression': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-redundant-type-constituents': 'error',
      '@typescript-eslint/no-unnecessary-type-arguments': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-dynamic-delete': 'error',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      '@typescript-eslint/prefer-regexp-exec': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/prefer-readonly-parameter-types': 'error',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/return-await': 'error',
      '@typescript-eslint/no-meaningless-void-operator': 'error',
      '@typescript-eslint/no-type-alias': 'off', // Allow type aliases
      '@typescript-eslint/explicit-function-return-type': 'off', // Inferred is fine
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],

      // React rules
      'react/jsx-uses-react': 'off', // Not needed in React 17+
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],

      // Accessibility
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/no-redundant-roles': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',

      // Import rules
      'import/no-unresolved': 'error',
      'import/named': 'error',
      'import/default': 'error',
      'import/namespace': 'error',
      'import/no-absolute-path': 'error',
      'import/no-dynamic-require': 'error',
      'import/no-self-import': 'error',
      'import/no-cycle': 'error',
      'import/no-unused-modules': 'error',
      'import/no-deprecated': 'warn',

      // General rules
      'no-console': 'error',
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unused-labels': 'error',
      'no-useless-call': 'error',
      'no-useless-concat': 'error',
      'no-useless-escape': 'error',
      'no-useless-return': 'error',
      'no-void': 'error',
      'no-with': 'error',
      'prefer-promise-reject-errors': 'error',
      'require-await': 'off', // Handled by TS
      'no-return-await': 'off', // Handled by TS

      // Disable conflicting rules
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': 'error',
      'no-unused-vars': 'off',

      // Motion-specific rules
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.object.name="Math"][callee.property.name="random"]',
          message: 'Use @petspark/shared RNG or seeded RNG instead of Math.random() for deterministic effects',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'framer-motion',
              message: 'Use @petspark/motion instead of framer-motion in shared code. framer-motion is only allowed in web-only DOM routes.',
            },
          ],
          patterns: [
            {
              group: ['framer-motion'],
              message: 'Use @petspark/motion instead of framer-motion in shared code.',
            },
          ],
        },
      ],
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './apps/web/src/components/chat/window',
              from: './apps/web/src/components/chat/presentational',
            },
            {
              target: './apps/web/src/components/chat/presentational',
              from: './apps/web/src/components/chat/window',
              except: ['../presentational/**'],
            },
            {
              target: './packages/**',
              from: './apps/**',
              message: 'Packages must not import apps',
            },
          ],
        },
      ],
    },
  },
  // Motion-specific overrides
  {
    files: ['packages/motion/**/*.{ts,tsx}', 'apps/**/effects/**/*.{ts,tsx}', 'apps/**/components/**/*.{ts,tsx}'],
    rules: {
      // Enforce useReducedMotion usage in animation hooks
      // Note: This is a best-effort rule - we can't perfectly detect all animation hooks
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'framer-motion',
              message: 'Use @petspark/motion hooks instead. framer-motion is only allowed in web-only DOM routes requiring SVG/canvas tricks.',
            },
          ],
        },
      ],
    },
  },
  // Web-only DOM routes exception (allow framer-motion for SVG/canvas)
  {
    files: ['apps/web/src/components/**/*.{ts,tsx}', 'apps/web/src/effects/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': 'off', // Allow framer-motion in web-only routes
      '@typescript-eslint/no-restricted-imports': 'off',
    },
  },
  // TypeScript-specific overrides
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  // Mobile-specific overrides
  {
    files: ['apps/mobile/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.reactNative,
      },
    },
    rules: {
      'no-console': 'error',
    },
  },
  // Test files
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/tests/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      'no-console': 'off',
    },
  },
  // Config files
  {
    files: ['**/*.config.{js,ts}', '**/vite.config.ts', '**/vitest.config.ts'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'no-console': 'off',
    },
  },
);
