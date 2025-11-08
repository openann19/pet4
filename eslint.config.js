import js from '@eslint/js'
import importPlugin from 'eslint-plugin-import'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tseslint from 'typescript-eslint'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,
  {
    files: ['apps/**/src/**/*.{ts,tsx}', 'packages/**/src/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/node_modules/**'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        project: [
          './tsconfig.base.json',
          './apps/web/tsconfig.json',
          './apps/mobile/tsconfig.json',
          './packages/*/tsconfig.json',
        ],
        tsconfigRootDir: __dirname,
        createDefaultProgram: false,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: [
            './tsconfig.base.json',
            './apps/web/tsconfig.json',
            './apps/mobile/tsconfig.json',
            './apps/native/tsconfig.json',
            './packages/*/tsconfig.json',
          ],
        },
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
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        {
          assertionStyle: 'as',
          objectLiteralTypeAssertions: 'never',
        },
      ],
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
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
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      '@typescript-eslint/prefer-regexp-exec': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/prefer-readonly-parameter-types': 'off', // Too strict for React props
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/return-await': 'error',
      '@typescript-eslint/no-meaningless-void-operator': 'error',
      '@typescript-eslint/no-type-alias': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],

      // React rules
      'react/jsx-uses-react': 'off',
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
      'import/no-unused-modules': 'off', // Too slow for large codebases
      'import/no-deprecated': 'warn',

      // Prevent unsafe type assertions
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSAsExpression[typeAnnotation.type="TSAnyKeyword"]',
          message:
            'Use proper types instead of "as any". If you need a type assertion, use type guards.',
        },
        {
          selector: 'CallExpression[callee.object.name="Math"][callee.property.name="random"]',
          message:
            'Use @petspark/shared RNG or seeded RNG instead of Math.random() for deterministic effects',
        },
      ],

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
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  // Web-only DOM routes exception (allow framer-motion for SVG/canvas)
  {
    files: ['apps/web/src/components/**/*.{ts,tsx}', 'apps/web/src/effects/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-restricted-imports': 'off',
    },
  },
  // Mobile-specific overrides (non-type-aware to avoid React Native parsing issues)
  {
    files: ['apps/mobile/src/**/*.{ts,tsx}', 'apps/native/src/**/*.{ts,tsx}'],
    ignores: ['apps/mobile/node_modules/**', 'apps/native/node_modules/**'],
    languageOptions: {
      globals: {
        ...globals.reactNative,
      },
      parserOptions: {
        // Don't use type-aware rules for mobile to avoid React Native node_modules issues
        project: false,
      },
    },
    rules: {
      'no-console': 'error',
      // Disable type-aware rules for mobile
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
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
  // Config files - disable type-aware rules
  {
    files: ['**/*.config.{js,ts}', '**/vite.config.ts', '**/vitest.config.ts'],
    languageOptions: {
      parserOptions: {
        project: false,
      },
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
    },
  }
)
