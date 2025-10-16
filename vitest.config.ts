import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        '**/.nuxt/**',
        '**/prisma/migrations/**',
      ],
      include: [
        'app/**/*.{ts,js,vue}',
        'server/**/*.{ts,js}',
        'utils/**/*.{ts,js}',
      ],
      thresholds: {
        global: {
          branches: 70, // Lowered for initial implementation
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, '.'),
      '@': resolve(__dirname, '.'),
      '~~': resolve(__dirname, '.'),
      '@@': resolve(__dirname, '.'),
      '#app': resolve(__dirname, '.nuxt'),
      '#imports': resolve(__dirname, '.nuxt/imports'),
    },
  },
})
