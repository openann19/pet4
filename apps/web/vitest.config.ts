import { fileURLToPath } from 'node:url';
import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = __dirname;

// Plugin to handle react-native imports in motion package
// Uses virtual module approach similar to vite.config.ts
const reactNativeTransformPlugin = () => {
  return {
    name: 'react-native-transform',
    enforce: 'pre' as const,
    resolveId(id: string, importer?: string) {
      // Handle the virtual module ID created by transform hook
      if (id === '\0react-native-web-workspace') {
        return '\0react-native-web-workspace';
      }
      // Handle react-native imports from workspace packages
      // Check for any motion package reference in the importer path
      if (id === 'react-native') {
        if (
          importer &&
          (importer.includes('packages/') ||
            importer.includes('/motion/') ||
            importer.includes('packages/motion'))
        ) {
          // Return a virtual module ID that we'll handle in load()
          return '\0react-native-web-workspace';
        }
        // Also handle if importer is from motion package (check absolute paths)
        if (importer && (importer.includes('motion/src') || importer.includes('motion\\src'))) {
          return '\0react-native-web-workspace';
        }
      }
      return null;
    },
    load(id: string) {
      // Provide stubbed react-native-web content for workspace packages
      if (id === '\0react-native-web-workspace') {
        return `
          export const Platform = {
            OS: 'web',
            select: function(obj) { return obj.web !== undefined ? obj.web : obj.default; },
          };
          export const View = 'div';
          export const Text = 'span';
          export const ScrollView = 'div';
          export const StyleSheet = {
            create: function(styles) { return styles; },
            flatten: function(style) { return style; },
            hairlineWidth: 1,
            absoluteFillObject: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
          };
          export const TouchableOpacity = 'button';
          export const TouchableHighlight = 'button';
          export const TouchableWithoutFeedback = 'div';
          export const Pressable = 'button';
          export const Image = 'img';
          export const ActivityIndicator = 'div';
          export const Alert = {
            alert: function() {},
            prompt: function() {},
          };
          export const AccessibilityInfo = {
            isReduceMotionEnabled: function() { return Promise.resolve(false); },
            addEventListener: function() { return { remove: function() {} }; },
          };
          export default {
            Platform,
            View,
            Text,
            ScrollView,
            StyleSheet,
            TouchableOpacity,
            TouchableHighlight,
            TouchableWithoutFeedback,
            Pressable,
            Image,
            ActivityIndicator,
            Alert,
            AccessibilityInfo,
          };
        `;
      }
      return null;
    },
    transform(code: string, id: string) {
      // Transform react-native imports in motion package BEFORE Vite's import analysis
      if (id.includes('packages/motion')) {
        let transformed = code;

        // Replace static imports: from "react-native" -> use virtual module
        if (code.includes('from "react-native"') || code.includes("from 'react-native'")) {
          transformed = transformed.replace(
            /from\s+["']react-native["']/g,
            'from "\0react-native-web-workspace"'
          );
        }

        // Transform dynamic imports
        if (code.includes('import(reactNativeModule)')) {
          transformed = transformed.replace(
            /import\(reactNativeModule\)/g,
            'Promise.resolve({ default: { Platform: { OS: "web" }, AccessibilityInfo: { isReduceMotionEnabled: () => Promise.resolve(false), addEventListener: () => ({ remove: () => {} }) } }, AccessibilityInfo: { isReduceMotionEnabled: () => Promise.resolve(false), addEventListener: () => ({ remove: () => {} }) } })'
          );
        }

        if (code.includes("import('react-native')") || code.includes('import("react-native")')) {
          transformed = transformed.replace(
            /import\(['"]react-native['"]\)/g,
            'Promise.resolve({ AccessibilityInfo: { isReduceMotionEnabled: () => Promise.resolve(false), addEventListener: () => ({ remove: () => {} }) } })'
          );
        }

        if (transformed !== code) {
          return { code: transformed, map: null };
        }
      }
      return null;
    },
  };
};

export default defineConfig({
  plugins: [reactNativeTransformPlugin(), react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(projectRoot, './src') },
      { find: /^react-native$/, replacement: 'react-native-web' },
      {
        find: 'react-native-reanimated',
        replacement: path.resolve(projectRoot, './src/lib/reanimated-web-polyfill.ts'),
      },
      {
        find: '@petspark/shared',
        replacement: path.resolve(projectRoot, '../../packages/shared/src'),
      },
      {
        find: '@petspark/motion',
        replacement: path.resolve(projectRoot, '../../packages/motion/src'),
      },
      {
        find: '@petspark/config',
        replacement: path.resolve(projectRoot, '../../packages/config/src'),
      },
      {
        find: '@petspark/chat-core',
        replacement: path.resolve(projectRoot, '../../packages/chat-core/src'),
      },
      { find: '@petspark/core', replacement: path.resolve(projectRoot, '../../packages/core/src') },
      // Mock framer-motion completely to avoid React context issues
      { find: 'framer-motion', replacement: path.resolve(projectRoot, './src/test/mocks/framer-motion.ts') },
    ],
    // Preserve symlinks to help resolve packages correctly
    preserveSymlinks: false,
    conditions: ['import', 'module', 'browser', 'default'],
    extensions: [
      '.web.js',
      '.web.jsx',
      '.web.ts',
      '.web.tsx',
      '.jsx',
      '.js',
      '.tsx',
      '.ts',
      '.json',
    ],
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react-native-web', '@petspark/motion', '@petspark/shared'],
    exclude: ['react-native'],
    esbuildOptions: {
      resolveExtensions: [
        '.web.js',
        '.web.jsx',
        '.web.ts',
        '.web.tsx',
        '.jsx',
        '.js',
        '.tsx',
        '.ts',
        '.json',
      ],
    },
  },
  ssr: {
    noExternal: ['@petspark/motion', '@petspark/shared'],
    resolve: {
      conditions: ['import', 'module', 'browser', 'default'],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'src/**/__tests__/**/*.{ts,tsx}'],
    testTimeout: 10000,
    hookTimeout: 10000,
    server: {
      deps: {
        inline: ['@petspark/motion', 'react-native-reanimated'],
      },
    },
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
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
    reporters: ['default', 'html'],
    watch: false,
  },
  // Global mocks to prevent timing issues
  define: {
    'vitest/globals': true,
  },
});
