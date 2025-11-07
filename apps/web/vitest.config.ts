import { fileURLToPath } from 'node:url';
import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = __dirname;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(projectRoot, './src'),
      'react-native': 'react-native-web',
      'react-native-reanimated': path.resolve(projectRoot, './src/lib/reanimated-web-polyfill.ts'),
    },
    conditions: ['import', 'module', 'browser', 'default'],
    extensions: ['.web.js', '.web.jsx', '.web.ts', '.web.tsx', '.jsx', '.js', '.tsx', '.ts', '.json'],
    dedupe: ['react', 'react-dom'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'src/**/__tests__/**/*.{ts,tsx}'],                                                                               
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
        '.github/',
        'design-system/',
        '**/__tests__/**',
        '**/*.stories.tsx',
      ],
      thresholds: {
        lines: 95,
        branches: 95,
        functions: 95,
        statements: 95,
      },
    },
    reporters: ['default', 'html'],
    watch: false,
  },
});
