import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { fixupPluginRules } from '@eslint/eslintrc';
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
import tseslint from 'typescript-eslint';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const tsFiles = ['**/*.{ts,tsx}'];

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/kyc-native.ts',
    ],
  },
  { linterOptions: { reportUnusedDisableDirectives: 'error' } },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: ['**/*.{js,cjs,mjs,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        project: ['tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      import: fixupPluginRules(importPlugin),
      promise: fixupPluginRules(promise),
      react: fixupPluginRules(react),
      'react-hooks': fixupPluginRules(reactHooks),
      'react-refresh': reactRefresh,
      security: fixupPluginRules(security),
      sonarjs: fixupPluginRules(sonarjs),
      unicorn: fixupPluginRules(unicorn),
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
      'no-console': ['error', { allow: ['error', 'warn'] }],
      'no-debugger': 'error',
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
      'unicorn/prefer-optional-catch-binding': 'error',
      'sonarjs/no-duplicate-string': ['error', { threshold: 5 }],
      'promise/catch-or-return': 'error',
      'security/detect-object-injection': 'off',
      'import/no-unresolved': 'error',
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
          message: '❌ PRODUCTION BLOCKER: window.spark usage detected. Migrate to real API endpoints.',
        },
        {
          selector: 'MemberExpression[property.name="kv"]',
          message: '❌ PRODUCTION BLOCKER: .kv usage detected. Use real database/API storage instead.',
        },
        {
          selector:
            'CallExpression[callee.type="MemberExpression"][callee.property.name="get"][callee.object.property.name="kv"]',
          message: '❌ PRODUCTION BLOCKER: spark.kv.get() calls are banned. Use APIClient.get() instead.',
        },
        {
          selector:
            'CallExpression[callee.type="MemberExpression"][callee.property.name="set"][callee.object.property.name="kv"]',
          message: '❌ PRODUCTION BLOCKER: spark.kv.set() calls are banned. Use APIClient.post/put() instead.',
        },
        {
          selector:
            'CallExpression[callee.type="MemberExpression"][callee.property.name="delete"][callee.object.property.name="kv"]',
          message: '❌ PRODUCTION BLOCKER: spark.kv.delete() calls are banned. Use APIClient.delete() instead.',
        },
      ],
    },
  },
  {
    files: tsFiles,
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
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
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
    },
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
);
