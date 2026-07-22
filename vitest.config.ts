import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Sadece kendi unit testlerimiz — Playwright *.spec.ts dosyalarına dokunma.
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
