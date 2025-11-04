/**
 * Optional Spark module declarations
 * These modules may not be available in all environments
 */

declare module '@github/spark/spark' {
  const spark: unknown;
  export default spark;
}

declare module '@github/spark/spark-vite-plugin' {
  import type { PluginOption } from 'vite';
  const plugin: () => PluginOption;
  export default plugin;
}

declare module '@github/spark/vitePhosphorIconProxyPlugin' {
  import type { PluginOption } from 'vite';
  const plugin: () => PluginOption;
  export default plugin;
}

