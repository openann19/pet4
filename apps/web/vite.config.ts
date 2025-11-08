import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import type { PluginOption, UserConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = process.env['PROJECT_ROOT'] ?? __dirname;

const loadOptionalPlugin = async (specifier: string): Promise<PluginOption | null> => {
  try {
    const module = (await import(specifier)) as { default?: () => PluginOption };
    return typeof module.default === 'function' ? module.default() : null;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    // Optional plugins: only handle module not found errors gracefully
    // Other errors propagate to fail the build
    if (err.code === 'ERR_MODULE_NOT_FOUND') {
      return null;
    }
    // Re-throw unexpected errors to fail fast
    throw error;
  }
};

// Plugin to transform JSX in .js files before import analysis
const transformJSXInJSPlugin = (): PluginOption => ({
  name: 'transform-jsx-in-js',
  enforce: 'pre',
  shouldTransformCachedModule({ id }) {
    // Ensure react-native-reanimated .js files are always transformed
    return id.includes('react-native-reanimated') && id.endsWith('.js');
  },
  transform(code, id) {
    // Transform JSX in .js files from react-native-reanimated BEFORE import analysis
    if (
      id.includes('react-native-reanimated') &&
      id.endsWith('.js') &&
      code.includes('<') &&
      code.includes('>')
    ) {
      // Return null to let React plugin handle it, but ensure it runs before import analysis
      return null;
    }
    return null;
  },
});

// Plugin to stub react-native-gesture-handler for web (not available in web environment)
const stubGestureHandlerPlugin = (): PluginOption => ({
  name: 'stub-react-native-gesture-handler',
  enforce: 'pre',
  resolveId(id) {
    // Stub react-native-gesture-handler for web builds
    if (id === 'react-native-gesture-handler' || id.includes('react-native-gesture-handler')) {
      return '\0react-native-gesture-handler-stub';
    }
    return null;
  },
  load(id) {
    // Return a stub module for react-native-gesture-handler
    if (id === '\0react-native-gesture-handler-stub') {
      return `
        // Stub for react-native-gesture-handler (not available in web environment)
        export const Gesture = {
          Pan: () => ({
            onUpdate: () => {},
            onEnd: () => {},
          }),
        };
        export default {
          Gesture,
        };
      `;
    }
    return null;
  },
});

// Plugin to stub expo-haptics for web (not available in web environment)
const stubExpoHapticsPlugin = (): PluginOption => ({
  name: 'stub-expo-haptics',
  enforce: 'pre',
  resolveId(id) {
    // Stub expo-haptics for web builds
    if (id === 'expo-haptics' || id.includes('expo-haptics')) {
      return '\0expo-haptics-stub';
    }
    return null;
  },
  load(id) {
    // Return a stub module for expo-haptics
    if (id === '\0expo-haptics-stub') {
      return `
        // Stub for expo-haptics (not available in web environment)
        export const ImpactFeedbackStyle = {
          Light: 0,
          Medium: 1,
          Heavy: 2,
        };
        
        export const NotificationFeedbackType = {
          Success: 0,
          Warning: 1,
          Error: 2,
        };
        
        export async function impactAsync(style = 1) {
          // No-op in web environment
          return Promise.resolve();
        }
        
        export async function notificationAsync(type = 0) {
          // No-op in web environment
          return Promise.resolve();
        }
        
        export async function selectionAsync() {
          // No-op in web environment
          return Promise.resolve();
        }
        
        export default {
          ImpactFeedbackStyle,
          NotificationFeedbackType,
          impactAsync,
          notificationAsync,
          selectionAsync,
        };
      `;
    }
    return null;
  },
});

// Plugin to handle JSX in .js files during import analysis
const handleJSXImportAnalysisPlugin = (): PluginOption => ({
  name: 'handle-jsx-import-analysis',
  enforce: 'pre',
  resolveId(id) {
    // Skip problematic react-native files
    if (id.includes('/node_modules/react-native/') && !id.includes('react-native-reanimated')) {
      return { id, external: true };
    }
    return null;
  },
  load(id) {
    // During import analysis, return empty for react-native files only
    if (id.includes('/node_modules/react-native/') && !id.includes('react-native-reanimated')) {
      return 'export default {};';
    }
    return null;
  },
});

// Plugin to resolve react-native imports from workspace packages to react-native-web
const resolveReactNativePlugin = (): PluginOption => {
  return {
    name: 'resolve-react-native-workspace',
    enforce: 'pre',
    resolveId(id, importer) {
      // Handle react-native imports from workspace packages
      // During build, the path might be different - check for both packages/ and motion/
      if (
        id === 'react-native' &&
        importer &&
        (importer.includes('packages/') || importer.includes('/motion/'))
      ) {
        // Return a virtual module ID that we'll handle in load()
        return '\0react-native-web-workspace';
      }
      // Also handle if somehow it's already transformed to react-native-web
      if (
        id === 'react-native-web' &&
        importer &&
        (importer.includes('packages/') || importer.includes('/motion/'))
      ) {
        return '\0react-native-web-workspace';
      }
      return null;
    },
    load(id) {
      // Provide stubbed react-native-web content for workspace packages
      if (id === '\0react-native-web-workspace') {
        // Complete stub for react-native exports - pure JS, no TypeScript syntax
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
          export default {};
        `;
      }
      return null;
    },
  };
};

// Plugin to resolve @petspark/shared workspace package
const resolveWorkspacePackagePlugin = (): PluginOption => {
  const sharedPackagePath = path.resolve(projectRoot, '../../packages/shared/src');

  return {
    name: 'resolve-workspace-package',
    enforce: 'pre',
    resolveId(id, importer) {
      // Resolve @petspark/shared to its index.ts
      if (id === '@petspark/shared') {
        return path.resolve(sharedPackagePath, 'index.ts');
      }
      // Resolve sub-imports like @petspark/shared/rng
      if (id.startsWith('@petspark/shared/')) {
        const subPath = id.replace('@petspark/shared/', '');
        return path.resolve(sharedPackagePath, `${subPath}.ts`);
      }
      // Handle relative imports from within the shared package
      // When importer is from shared package, resolve relative imports to .ts files
      if (importer?.includes('packages/shared/src')) {
        if (id.startsWith('./') || id.startsWith('../')) {
          const importerDir = path.dirname(importer);
          const resolved = path.resolve(importerDir, id);

          // If it ends with .js, try resolving to .ts (TypeScript ES module pattern)
          if (id.endsWith('.js')) {
            const withTs = resolved.replace(/\.js$/, '.ts');
            if (existsSync(withTs)) {
              return withTs;
            }
          }

          // If no extension, try .ts first
          if (!path.extname(resolved)) {
            const withTs = `${resolved}.ts`;
            if (existsSync(withTs)) {
              return withTs;
            }
            // If .ts doesn't exist, try index.ts in the directory
            const indexTs = path.join(resolved, 'index.ts');
            if (existsSync(indexTs)) {
              return indexTs;
            }
          }

          // Fallback to original resolution
          return resolved;
        }
      }
      return null;
    },
  };
};

export default defineConfig(async (): Promise<UserConfig> => {
  const plugins: PluginOption[] = [
    stubGestureHandlerPlugin(),
    stubExpoHapticsPlugin(),
    resolveReactNativePlugin(),
    resolveWorkspacePackagePlugin(),
    react({}),
    transformJSXInJSPlugin(),
    handleJSXImportAnalysisPlugin(),
    tailwindcss(),
    nodePolyfills({
      include: ['util', 'assert', 'process', 'stream', 'events', 'buffer', 'crypto'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ];

  const optionalPlugins = await Promise.all([
    loadOptionalPlugin('@github/spark/vitePhosphorIconProxyPlugin'),
    loadOptionalPlugin('@github/spark/spark-vite-plugin'),
  ]);

  for (const plugin of optionalPlugins) {
    if (plugin) {
      plugins.push(plugin);
    }
  }

  return {
    plugins,
    define: {
      'process.version': JSON.stringify(''),
      'process.platform': JSON.stringify('browser'),
      'process.browser': 'true',
      'process.nextTick': 'setTimeout',
    },
    resolve: {
      alias: {
        '@': path.resolve(projectRoot, './src'),
        'react-native': 'react-native-web',
        'react-native-reanimated': path.resolve(
          projectRoot,
          './src/lib/reanimated-web-polyfill.ts'
        ),
      },
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
    esbuild: {
      include: [
        /src\/.*\.[jt]sx?$/,
        /node_modules\/react-native-reanimated\/.*\.js$/,
        /packages\/shared\/src\/.*\.ts$/,
      ],
      loader: 'tsx',
      jsx: 'automatic',
    },
    server: {
      hmr: {
        overlay: true,
      },
      watch: {
        ignored: ['**/node_modules/react-native/**', '**/.git/**'],
      },
      fs: {
        allow: ['..'],
        strict: false,
      },
    },
    optimizeDeps: {
      exclude: [
        'react-native',
        'react-native-reanimated',
        'react-native-gesture-handler',
        'nsfwjs',
      ],
      include: ['react-native-web', 'react', 'react-dom', '@petspark/shared'],
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
          '.ts': 'ts',
        },
        resolveExtensions: [
          '.web.js',
          '.web.ts',
          '.web.tsx',
          '.js',
          '.jsx',
          '.json',
          '.ts',
          '.tsx',
        ],
        define: {
          'process.env.NODE_ENV': '"development"',
        },
        // esbuild automatically transforms CommonJS to ESM
        target: 'esnext',
      },
      entries: [],
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
        include: [/node_modules/],
        // Transform CommonJS require/exports to ESM
        strictRequires: true,
        defaultIsModuleExports: true,
      },
      chunkSizeWarningLimit: 500,
      reportCompressedSize: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
        },
        format: {
          comments: false,
        },
      },
      rollupOptions: {
        external: (id) => {
          // NSFWJS is loaded from CDN at runtime, not bundled
          // Sentry is optional and dynamically imported
          if (id.includes('@sentry/react')) {
            return true;
          }
          // simple-peer for WebRTC (optional dependency)
          if (id.includes('simple-peer')) {
            return true;
          }
          return false;
        },
        output: {
          // Ensure proper format
          format: 'es',
          chunkSizeWarningLimit: 500,
          manualChunks: (id): string | undefined => {
            // Split large libraries into separate chunks
            if (id.includes('node_modules')) {
              // React core - combine react and react-dom
              if (
                id.includes('react') &&
                !id.includes('react-dom') &&
                !id.includes('react-router')
              ) {
                return 'react-vendor';
              }
              if (id.includes('react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('react-router')) {
                return 'react-vendor';
              }
              // Reanimated vendor - separate chunk for animation library
              if (id.includes('react-native-reanimated')) {
                return 'reanimated-vendor';
              }
              // UI libraries
              if (id.includes('@radix-ui')) {
                return 'ui-vendor';
              }
              // Icons
              if (id.includes('@phosphor-icons') || id.includes('lucide-react')) {
                return 'icons-vendor';
              }
              // Query library
              if (id.includes('@tanstack/react-query')) {
                return 'query-vendor';
              }
              // Utils - combine common utilities
              if (
                id.includes('clsx') ||
                id.includes('tailwind-merge') ||
                id.includes('class-variance-authority') ||
                id.includes('zod') ||
                id.includes('date-fns')
              ) {
                return 'utils-vendor';
              }
              // Map library - separate chunk for lazy loading
              if (id.includes('maplibre-gl') || id.includes('leaflet')) {
                return 'map-vendor';
              }
              // ML/TensorFlow - separate chunk for lazy loading
              if (id.includes('@tensorflow/tfjs') || id.includes('@tensorflow-models')) {
                return 'ml-vendor';
              }
              // Three.js - separate chunk for 3D features
              if (id.includes('three')) {
                return 'three-vendor';
              }
              // Other vendor code
              return 'vendor';
            }
            // Split app code by feature
            if (id.includes('/components/views/')) {
              const viewMatchRegex = /\/components\/views\/([^/]+)/;
              const viewMatch = viewMatchRegex.exec(id);
              const viewName = viewMatch?.[1];
              if (viewName) {
                return `view-${viewName}`;
              }
            }
            if (id.includes('/components/chat/')) {
              return 'feature-chat';
            }
            if (id.includes('/components/stories/')) {
              return 'feature-stories';
            }
            if (id.includes('/components/community/')) {
              return 'feature-community';
            }
            if (id.includes('/components/adoption/')) {
              return 'feature-adoption';
            }
            if (id.includes('/components/admin/')) {
              return 'feature-admin';
            }
            return undefined;
          },
        },
      },
    },
  };
});
