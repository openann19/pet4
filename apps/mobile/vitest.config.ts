import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

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
    target: 'esnext',
    jsx: 'automatic',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    environmentOptions: { jsdom: { url: 'http://localhost/' } },
  setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/__tests__/**/*.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['src/**/__tests__/**/index.ts', 'src/**/index.ts', '**/node_modules/**', '**/.expo/**'],
    deps: {
      optimizer: {
        web: {
          include: ['@petspark/shared'],
        },
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95
      },
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/node_modules/**',
        '**/.expo/**',
        '**/__tests__/**'
      ]
    }
  }
})

