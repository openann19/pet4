import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import type { PluginOption } from "vite";
import { defineConfig } from "vite";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig(async () => {
  // Conditionally import Spark plugins if available
  const plugins: PluginOption[] = [
    react(),
    tailwindcss(),
  ];

  try {
     
    const iconModule = await import("@github/spark/vitePhosphorIconProxyPlugin") as { default?: () => PluginOption };
    if (iconModule?.default && typeof iconModule.default === 'function') {
      plugins.push(iconModule.default());
    }
  } catch {
    // Icon proxy plugin not available, continue without it
  }

  try {
     
    const sparkModule = await import("@github/spark/spark-vite-plugin") as { default?: () => PluginOption };
    if (sparkModule?.default && typeof sparkModule.default === 'function') {
      plugins.push(sparkModule.default());
    }
  } catch {
    // Spark plugin not available, continue without it
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': resolve(projectRoot, 'src')
      }
    },
    server: {
      hmr: {
        overlay: true
      },
      watch: {
        // Ignore duplicate files and node_modules
        ignored: ['**/node_modules/**', '**/.git/**']
      }
    },
    optimizeDeps: {
      // Prevent pre-bundling issues that can cause restarts
      exclude: []
    }
  };
});
