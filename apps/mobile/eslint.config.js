import js from '@eslint/js'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactNative from 'eslint-plugin-react-native'
import unicorn from 'eslint-plugin-unicorn'
import tseslint from 'typescript-eslint'
import ultraChatfx from './tools/ultra-chatfx/eslint-plugin-ultra-chatfx.js'

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.expo/**',
      '**/coverage/**',
      '**/*.config.js',
      '**/*.config.mjs',
      '**/*.config.cjs',
      '**/.eslintrc.cjs',
      '**/.lintstagedrc.js',
      '**/index.js',
      '**/__tests__/**',
      'android/**',
      'ios/**',
      'metro.config.cjs',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-native': reactNative,
      unicorn,
      'ultra-chatfx': ultraChatfx,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        __DEV__: 'readonly',
        console: 'off',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
      '@typescript-eslint/no-unused-expressions': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // React
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React Native - Disabled due to ESLint 9 compatibility issues
      // 'react-native/no-unused-styles': 'warn',
      // 'react-native/split-platform-components': 'warn',
      // 'react-native/no-inline-styles': 'warn',
      // 'react-native/no-color-literals': 'warn',

      // General
      'no-console': 'error',
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',

      // Unicorn
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/filename-case': [
        'error',
        {
          case: 'kebabCase',
          ignore: ['^[A-Z]'],
        },
      ],
      'unicorn/no-array-callback-reference': 'error',
      'unicorn/no-array-method-this-argument': 'error',
      'unicorn/no-array-push-push': 'error',
      'unicorn/no-useless-undefined': 'error',
      'unicorn/prefer-array-some': 'error',
      'unicorn/prefer-includes': 'error',
      'unicorn/prefer-string-starts-ends-with': 'error',

      // Code quality
      'no-param-reassign': ['error', { props: true }],
      'no-return-await': 'error',
      'require-await': 'error',
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',

      // Ultra Chat FX Rules
      'ultra-chatfx/no-react-native-animated': 'error',
      'ultra-chatfx/require-reduced-motion-guard': [
        'error',
        {
          globs: [
            'src/**/effects/**/*.{ts,tsx}',
            'src/**/chat/**/*.{ts,tsx}',
            'src/**/features/chat/**/*.{ts,tsx}',
          ],
        },
      ],
      'ultra-chatfx/require-skia-in-effects': [
        'error',
        {
          globs: ['src/**/effects/**/*.{ts,tsx}'],
        },
      ],
      'ultra-chatfx/ban-math-random-in-effects': [
        'error',
        {
          globs: ['src/**/effects/**/*.{ts,tsx}', 'src/**/features/chat/**/*.{ts,tsx}'],
        },
      ],
    },
  },
  {
    files: ['**/*.{js,jsx,mjs}'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'error',
    },
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    rules: {
      'no-console': 'off',
    },
  }
)
