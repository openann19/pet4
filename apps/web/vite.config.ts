import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import type { PluginOption, UserConfig } from 'vite';
import { securityHeadersPlugin } from './vite-plugin-security-headers';

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
          Tap: () => ({
            onUpdate: () => {},
            onEnd: () => {},
          }),
          Pan: () => ({
            onUpdate: () => {},
            onEnd: () => {},
          }),
        };
        export const GestureDetector = ({ children, gesture }) => children;
        export default {
          Gesture,
          GestureDetector,
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

// Plugin to stub expo-file-system for web (not available in web environment)
const stubExpoFileSystemPlugin = (): PluginOption => ({
  name: 'stub-expo-file-system',
  enforce: 'pre',
  resolveId(id) {
    // Stub expo-file-system for web builds
    if (id === 'expo-file-system' || id.includes('expo-file-system')) {
      return '\0expo-file-system-stub';
    }
    return null;
  },
  load(id) {
    // Return a stub module for expo-file-system
    if (id === '\0expo-file-system-stub') {
      return `
        // Stub for expo-file-system (web environment uses File API)
        export const documentDirectory = null;
        export const cacheDirectory = null;
        export const bundleDirectory = null;
        export const temporaryDirectory = null;

        export const FileSystem = {
          documentDirectory: null,
          cacheDirectory: null,
          bundleDirectory: null,
          temporaryDirectory: null,
        };

        export async function getInfoAsync(fileUri, options) {
          // Stub: file operations not available in web environment
          return {
            exists: false,
            isDirectory: false,
            uri: fileUri,
          };
        }

        export async function readAsStringAsync(fileUri, options) {
          // Stub: file operations not available in web environment
          return '';
        }

        export async function writeAsStringAsync(fileUri, contents, options) {
          // Stub: file operations not available in web environment
          return Promise.resolve();
        }

        export async function deleteAsync(fileUri, options) {
          // Stub: file operations not available in web environment
          return Promise.resolve();
        }

        export async function moveAsync(options) {
          // Stub: file operations not available in web environment
          return Promise.resolve();
        }

        export async function copyAsync(options) {
          // Stub: file operations not available in web environment
          return Promise.resolve();
        }

        export async function makeDirectoryAsync(fileUri, options) {
          // Stub: file operations not available in web environment
          return Promise.resolve();
        }

        export async function readDirectoryAsync(fileUri) {
          // Stub: file operations not available in web environment
          return [];
        }

        export async function downloadAsync(uri, fileUri, options) {
          // Stub: file operations not available in web environment
          return {
            uri: fileUri,
            status: 200,
            headers: {},
            mimeType: null,
          };
        }

        export async function uploadAsync(url, fileUri, options) {
          // Stub: file operations not available in web environment
          return {
            body: '',
            status: 200,
            headers: {},
          };
        }

        // Default export with all functions attached for compatibility
        const defaultExport = {
          documentDirectory: null,
          cacheDirectory: null,
          bundleDirectory: null,
          temporaryDirectory: null,
          FileSystem: {
            documentDirectory: null,
            cacheDirectory: null,
            bundleDirectory: null,
            temporaryDirectory: null,
          },
          getInfoAsync,
          readAsStringAsync,
          writeAsStringAsync,
          deleteAsync,
          moveAsync,
          copyAsync,
          makeDirectoryAsync,
          readDirectoryAsync,
          downloadAsync,
          uploadAsync,
        };

        export default defaultExport;
      `;
    }
    return null;
  },
});

// Plugin to stub @shopify/react-native-skia for web (not available in web environment)
const stubReactNativeSkiaPlugin = (): PluginOption => ({
  name: 'stub-react-native-skia',
  enforce: 'pre',
  resolveId(id) {
    // Stub @shopify/react-native-skia for web builds
    if (id === '@shopify/react-native-skia' || id.includes('@shopify/react-native-skia')) {
      return '\0react-native-skia-stub';
    }
    return null;
  },
  load(id) {
    // Return a stub module for @shopify/react-native-skia
    if (id === '\0react-native-skia-stub') {
      return `
        // Stub for @shopify/react-native-skia (web environment uses Canvas API)
        export const Skia = {
          // Stub Skia API
        };

        export const Canvas = () => null;
        export const Group = () => null;
        export const Rect = () => null;
        export const Circle = () => null;
        export const Path = () => null;
        export const Image = () => null;
        export const Text = () => null;
        export const LinearGradient = () => null;
        export const RadialGradient = () => null;
        export const Blur = () => null;
        export const ColorMatrix = () => null;
        export const ImageShader = () => null;
        export const useImage = () => ({ width: 0, height: 0 });
        export const useFont = () => null;
        export const useValue = () => ({ value: 0 });
        export const useComputedValue = () => ({ value: 0 });
        export const useSharedValueEffect = () => {};
        export const useCanvasRef = () => ({ current: null });
        export const useTouchHandler = () => {};
        export const vec = () => ({ x: 0, y: 0 });
        export const rrect = () => ({ rect: { x: 0, y: 0, width: 0, height: 0 }, rx: 0, ry: 0 });
        export const BlendMode = {};
        export const PaintStyle = {};
        export const StrokeCap = {};
        export const StrokeJoin = {};

        export default {
          Skia,
          Canvas,
          Group,
          Rect,
          Circle,
          Path,
          Image,
          Text,
          LinearGradient,
          RadialGradient,
          Blur,
          ColorMatrix,
          ImageShader,
          useImage,
          useFont,
          useValue,
          useComputedValue,
          useSharedValueEffect,
          useCanvasRef,
          useTouchHandler,
          vec,
          rrect,
          BlendMode,
          PaintStyle,
          StrokeCap,
          StrokeJoin,
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
        return path.resolve(sharedPackagePath, `${String(subPath ?? '')}.ts`);
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
            const withTs = `${String(resolved ?? '')}.ts`;
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

interface VitestConfig extends UserConfig {
  // Vitest config field is not part of Vite's UserConfig
  test?: Record<string, unknown>;
}

export default defineConfig(async (): Promise<VitestConfig> => {
  const plugins: PluginOption[] = [
    stubGestureHandlerPlugin(),
    stubExpoHapticsPlugin(),
    stubExpoFileSystemPlugin(),
    stubReactNativeSkiaPlugin(),
    resolveReactNativePlugin(),
    resolveWorkspacePackagePlugin(),
    react({}),
    handleJSXImportAnalysisPlugin(),
    tailwindcss(),
    securityHeadersPlugin(),
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
      __DEV__: process.env.NODE_ENV !== 'production',
      'process.version': JSON.stringify(''),
      'process.platform': JSON.stringify('browser'),
      'process.browser': 'true',
      'process.nextTick': 'setTimeout',
    },
    resolve: {
      alias: {
        '@': path.resolve(projectRoot, './src'),
        'react-native': 'react-native-web',
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
      include: [/src\/.*\.[jt]sx?$/, /packages\/shared\/src\/.*\.ts$/],
      loader: 'tsx',
      jsx: 'automatic',
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
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
      exclude: ['react-native', 'react-native-gesture-handler', 'nsfwjs'],
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
          // Node polyfills that should be externalized
          if (id.includes('vite-plugin-node-polyfills/shims')) {
            return true;
          }
          return false;
        },
        output: {
          // Ensure proper format
          format: 'es',
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
              // UI libraries - split Radix into its own chunk
              if (id.includes('@radix-ui')) {
                return 'ui-vendor';
              }
              // Icons - separate chunk for icon libraries
              if (id.includes('@phosphor-icons') || id.includes('lucide-react')) {
                return 'icons-vendor';
              }
              // Query library
              if (id.includes('@tanstack/react-query')) {
                return 'query-vendor';
              }
              // Animation libraries - split Framer Motion
              if (id.includes('framer-motion')) {
                return 'animation-vendor';
              }
              // Form libraries
              if (id.includes('react-hook-form') || id.includes('@hookform')) {
                return 'form-vendor';
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
              // Map libraries - separate chunk for lazy loading
              if (id.includes('maplibre') || id.includes('mapbox')) {
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
              // Crypto/Security libraries
              if (id.includes('crypto') || id.includes('argon2') || id.includes('bcrypt')) {
                return 'crypto-vendor';
              }
              // Media/Video libraries
              if (id.includes('hls.js') || id.includes('video') || id.includes('media')) {
                return 'media-vendor';
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
            return undefined;
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      css: true,
    },
  };
});
