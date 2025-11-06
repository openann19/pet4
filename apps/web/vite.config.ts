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
      if (importer && importer.includes('packages/shared/src')) {
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
    resolveWorkspacePackagePlugin(),
    react({}),
    transformJSXInJSPlugin(),
    handleJSXImportAnalysisPlugin(),
    tailwindcss(),
    nodePolyfills({
      include: [
        'util',
        'assert',
        'process',
        'stream',
        'events',
        'buffer',
        'crypto',
      ],
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
      'process.env': {},
      'process.version': JSON.stringify(''),
      'process.platform': JSON.stringify('browser'),
      'process.browser': true,
      'process.nextTick': ((fn: () => void) => setTimeout(fn, 0)) as typeof process.nextTick,
    },
    resolve: {
      alias: {
        '@': path.resolve(projectRoot, './src'),
        'react-native-reanimated': path.resolve(projectRoot, './src/lib/reanimated-web-polyfill.ts'),
      },
      conditions: ['import', 'module', 'browser', 'default'],
      extensions: ['.web.js', '.web.jsx', '.web.ts', '.web.tsx', '.jsx', '.js', '.tsx', '.ts', '.json'],                                                        
      dedupe: ['react', 'react-dom'],
    },
    esbuild: {
      include: [
        /node_modules\/react-native-reanimated\/.*\.js$/,
        /packages\/shared\/src\/.*\.ts$/
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
      exclude: ['react-native', 'react-native-reanimated'],
      include: ['@petspark/shared'],
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
          '.ts': 'ts',
        },
        resolveExtensions: ['.web.js', '.web.ts', '.web.tsx', '.js', '.jsx', '.json', '.ts', '.tsx'],
        define: {
          'process.env.NODE_ENV': '"development"',
        },
      },
      entries: [],
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
        include: [/node_modules/],
      },
      rollupOptions: {
        external: (id: string) => {
          // Externalize optional tensorflow dependencies
          return id === '@tensorflow/tfjs' || 
                 id === '@tensorflow/tfjs-core' || 
                 id === '@tensorflow/tfjs-converter' ||
                 id.startsWith('@tensorflow/tfjs/') ||
                 id.startsWith('@tensorflow/tfjs-core/') ||
                 id.startsWith('@tensorflow/tfjs-converter/');
        },
      },
    },
  };
});
