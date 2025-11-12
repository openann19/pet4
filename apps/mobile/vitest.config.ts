import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = __dirname

export default defineConfig({
  resolve: {
    alias: {
      '@mobile': path.resolve(projectRoot, './src'),
      '@pet/domain': path.resolve(projectRoot, '../web/src/core/domain'),
      '@petspark/shared': path.resolve(projectRoot, '../../packages/shared/src'),
    },
    conditions: ['import', 'module', 'default'],
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  plugins: [
    react(),
    // Plugin to intercept reduced-motion imports and replace with mock
    // This prevents esbuild from trying to transform the real file which has incompatible syntax
    // The real file uses dynamic imports and typeof checks that esbuild cannot transform in test environment
    {
      name: 'mock-reduced-motion',
      enforce: 'pre', // Run before other plugins to intercept early
      resolveId(source: string, importer?: string) {
        // Don't intercept the mock file itself or any test files
        if (
          source.includes('test/mocks') ||
          source.includes('mock') ||
          source.includes('__tests__') ||
          source.includes('.test.') ||
          source.includes('.spec.')
        ) {
          return null
        }

        const mockPath = path.resolve(projectRoot, './src/test/mocks/reduced-motion.ts')

        // Match various import patterns for reduced-motion files
        const reducedMotionPatterns = [
          /reduced-motion\.ts$/,
          /reduced-motion$/,
          /use-reduced-motion-sv\.ts$/,
          /use-reduced-motion-sv$/,
          /effects\/chat\/core\/reduced-motion/,
          /effects\/core\/use-reduced-motion-sv/,
        ]

        // Check if source matches any reduced-motion pattern
        const matches = reducedMotionPatterns.some(pattern => pattern.test(source))

        if (matches) {
          return mockPath
        }

        return null
      },
    },
  ],
  server: {
    fs: {
      allow: [
        projectRoot,
        path.resolve(projectRoot, '../../packages/shared/src'),
        path.resolve(projectRoot, '../web/src'),
      ],
    },
  },
  esbuild: {
    target: 'es2020',
    jsx: 'automatic',
    format: 'esm',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    environmentOptions: { jsdom: { url: 'http://localhost/' } },
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/__tests__/**/*.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      'src/**/__tests__/**/index.ts',
      'src/**/index.ts',
      '**/node_modules/**',
      '**/.expo/**',
    ],
    server: {
      deps: {
        inline: ['@testing-library/react-native'],
      },
    },
    deps: {
      optimizer: {
        web: {
          include: ['@petspark/shared'],
        },
      },
      moduleDirectories: ['node_modules'],
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95,
      },
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/node_modules/**',
        '**/.expo/**',
        '**/__tests__/**',
      ],
    },
  },
})
