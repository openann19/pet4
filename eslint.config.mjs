// eslint.config.mjs
import { defineConfig, globalIgnores } from 'eslint/config';
import { createRequire } from 'node:module';
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';
import reactNative from 'eslint-plugin-react-native';

const require = createRequire(import.meta.url);
const overrideConfigs = require('./eslint.overrides.cjs');

export default defineConfig([
  // 0) Global ignores (fast)
  globalIgnores([
    '**/node_modules/**',
    '**/.next/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/.expo/**',
    '**/ios/**',
    '**/android/**',
    '**/*.min.*',
    '**/*.d.ts'
  ]),

  // 1) Base JS (only for .js)
  js.configs.recommended,

  // 2) TypeScript — strict, typed (apps & packages)
  {
    files: ['apps/**/*.{ts,tsx}', 'packages/**/*.{ts,tsx}'],
    ...tseslint.configs.strictTypeChecked,
    languageOptions: {
      ...tseslint.configs.strictTypeChecked.languageOptions,
      parserOptions: {
        ...tseslint.configs.strictTypeChecked.languageOptions.parserOptions,
        projectService: {
          allowDefaultProject: [
            '*.config.{js,ts,mjs,cjs}',
            'eslint.config.*',
            'vite.config.*',
            'vitest.config.*',
            'babel.config.*',
            'scripts/**/*'
          ]
        },
        tsconfigRootDir: import.meta.dirname
      },
      globals: { ...globals.browser, ...globals.node }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: false }],
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: false,
          allowNullableBoolean: false,
          allowNullableString: false,
          allowNullableNumber: false
        }
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'react-hooks/immutability': 'off'
    }
  },

  // 3) React for JSX/TSX (packages + apps)
  {
    files: ['**/*.{jsx,tsx}'],
    ...react.configs.flat.recommended,
    ...react.configs.flat['jsx-runtime'],
    settings: { react: { version: 'detect' } }
  },
  // React Hooks (flat-config safe wiring)
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/immutability': 'off'
    }
  },

  // 4) Next.js — Core Web Vitals (scoped to apps/*)
  {
    files: ['apps/**/*.{js,jsx,ts,tsx}'],
    ...nextPlugin.configs['core-web-vitals'],
    settings: {
      next: { rootDir: ['apps/*/'] }
    }
  },

  // 5) React Native specific rules for mobile app
  {
    files: ['apps/mobile/**/*.{js,jsx,ts,tsx}'],
    plugins: { 'react-native': reactNative },
    rules: {
      'react-native/no-unused-styles': 'error',
      'react-native/split-platform-components': 'warn',
      'react-native/no-inline-styles': 'warn',
      'react-native/no-color-literals': 'warn'
    }
  },

  // 6) Tests — loosen a bit where it helps productivity
  {
    files: ['**/*.{test,spec}.{js,jsx,ts,tsx}', '**/__tests__/**/*'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-console': 'off'
    }
  },
  ...overrideConfigs
]);
