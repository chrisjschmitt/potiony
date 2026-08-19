import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // The store persists to localStorage, so tests need a browser-like environment.
    environment: 'jsdom',
    environmentOptions: { jsdom: { url: 'http://localhost/' } },
    include: ['src/**/*.test.ts'],
  },
})
