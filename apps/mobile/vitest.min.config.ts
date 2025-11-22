import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.{ts,tsx}', 'src/__tests__/**/*.{ts,tsx}'],
    setupFiles: [],
    deps: { optimizer: { web: { include: [] } } },
  },
})
