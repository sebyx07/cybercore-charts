import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Ember ships its `@ember/*` modules inside ember-source; apps get the mapping from their
    // build, the Ember adapter tests get it here.
    alias: [{ find: /^@ember\/(.+)$/, replacement: 'ember-source/@ember/$1/index.js' }],
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      reporter: ['text', 'json-summary', 'html'],
    },
  },
});
