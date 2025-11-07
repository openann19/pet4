import { fixupPluginRules } from '@eslint/compat';
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
      // Kill "unsafe" at source - production-grade strictness
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',

      // Practical strictness
      '@typescript-eslint/no-unnecessary-condition': ['error', { allowConstantLoopConditions: true }],
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // Tighten gradually
      '@typescript-eslint/no-explicit-any': ['warn', { fixToUnknown: true }],
      '@typescript-eslint/strict-boolean-expressions': 'off', // Enable later once truthiness cleanups land
      '@typescript-eslint/no-confusing-void-expression': ['warn', { ignoreArrowShorthand: true, ignoreVoidOperator: true }],
      '@typescript-eslint/restrict-template-expressions': ['warn', {
        allowNumber: true,
        allowBoolean: true,
        allowNullish: true
      }],

      // De-duplicate with TS compiler
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }],

      // Helpful but not critical
      '@typescript-eslint/no-redundant-type-constituents': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
      '@typescript-eslint/prefer-includes': 'warn',
      '@typescript-eslint/prefer-string-starts-ends-with': 'warn',

      // Allow reasonable patterns
      '@typescript-eslint/no-unnecessary-type-arguments': 'off',
      '@typescript-eslint/no-dynamic-delete': 'off',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',
      '@typescript-eslint/prefer-regexp-exec': 'off',
      '@typescript-eslint/prefer-readonly': 'off',
      '@typescript-eslint/prefer-readonly-parameter-types': 'off',
      '@typescript-eslint/promise-function-async': 'off',
      '@typescript-eslint/return-await': 'off',
      '@typescript-eslint/no-meaningless-void-operator': 'off',
      '@typescript-eslint/no-type-alias': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',

      // React rules
      'react/jsx-uses-react': 'off', // Not needed in React 17+
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],

      // Accessibility
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-has-content': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/heading-has-content': 'warn',
      'jsx-a11y/img-redundant-alt': 'warn',
      'jsx-a11y/no-redundant-roles': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',

      // Import rules (relaxed - these can be slow and TypeScript handles most)
      'import/no-unresolved': 'off',
      'import/named': 'off',
      'import/default': 'off',
      'import/namespace': 'off',
      'import/no-absolute-path': 'warn',
      'import/no-dynamic-require': 'off',
      'import/no-self-import': 'warn',
      'import/no-cycle': 'warn',
      'import/no-unused-modules': 'off',
      'import/no-deprecated': 'warn',

      // General rules
      'no-console': 'warn',
      'no-debugger': 'warn',
      'no-alert': 'warn',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-sequences': 'warn',
      'no-throw-literal': 'warn',
      'no-unmodified-loop-condition': 'warn',
      'no-unused-labels': 'warn',
      'no-useless-call': 'warn',
      'no-useless-concat': 'warn',
      'no-useless-escape': 'warn',
      'no-useless-return': 'warn',
      'no-void': 'off',
      'no-with': 'error',
      'prefer-promise-reject-errors': 'warn',
      'require-await': 'off',
      'no-return-await': 'off',

      // Disable conflicting rules
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': 'error',

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
  // Tests and scripts: loosen "unsafe" to reduce churn
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/tests/**/*.{ts,tsx}', 'scripts/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'off',
    },
  },
  // Config files
  {
    files: ['**/*.config.{js,ts}', '**/vite.config.ts', '**/vitest.config.ts'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      'no-console': 'off',
    },
  },
);
