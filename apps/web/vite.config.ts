import { fileURLToPath } from 'node:url';
import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import type { PluginOption } from 'vite';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = process.env.PROJECT_ROOT ?? __dirname;

const loadOptionalPlugin = async (specifier: string): Promise<PluginOption | null> => {
  try {
    const module = (await import(specifier)) as { default?: () => PluginOption };
    return typeof module.default === 'function' ? module.default() : null;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ERR_MODULE_NOT_FOUND') {
      console.warn(`Failed to load optional plugin: ${specifier}`, error);
    }
    return null;
  }
};

export default defineConfig(async () => {
  const plugins: PluginOption[] = [react(), tailwindcss()];

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
    resolve: {
      alias: {
        '@': path.resolve(projectRoot, './src'),
        'react-native-reanimated': path.resolve(projectRoot, './src/lib/reanimated-web-polyfill.ts'),
      },
    },
    server: {
      hmr: {
        overlay: true,
      },
      watch: {
        ignored: ['**/node_modules/**', '**/.git/**'],
      },
    },
    optimizeDeps: {
      exclude: ['react-native-reanimated'],
      esbuildOptions: {
        resolveExtensions: ['.web.js', '.web.ts', '.web.tsx', '.js', '.jsx', '.json', '.ts', '.tsx'],
      },
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
