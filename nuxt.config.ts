import { fileURLToPath } from 'node:url'
// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/icon',
  ],

  // Nuxt UI Configuration
  ui: {},

  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: false, // Temporarily disabled due to alias resolution issues
  },

  // Nitro configuration for server-side aliases
  nitro: {
    alias: {
      '~/app': fileURLToPath(new URL('./app', import.meta.url)),
    },
    externals: {
      inline: ['@google/genai'],
    },
  },

  // CSS configuration
  css: ['~/assets/css/main.css'],

  // Pinia configuration
  pinia: {
    storesDirs: ['./app/stores/**'],
  },

  // Vite configuration
  vite: {
    plugins: [tailwindcss()],
  },

  // Runtime configuration
  runtimeConfig: {
    // Private keys (only available on server-side)
    authSecret: process.env.NUXT_AUTH_SECRET,
    openaiApiKey: process.env.OPENAI_API_KEY,
    // Public keys (exposed to client-side)
    public: {
      appName: 'Personal Finance Dashboard',
    },
  },

  // Path aliases
  alias: {
    '@': fileURLToPath(new URL('./app', import.meta.url)),
    '~': fileURLToPath(new URL('./app', import.meta.url)),
    '@/components': fileURLToPath(new URL('./app/components', import.meta.url)),
    '@/features': fileURLToPath(new URL('./app/features', import.meta.url)),
    '@/stores': fileURLToPath(new URL('./app/stores', import.meta.url)),
    '@/composables': fileURLToPath(new URL('./app/composables', import.meta.url)),
    '@/utils': fileURLToPath(new URL('./app/utils', import.meta.url)),
    '@/types': fileURLToPath(new URL('./app/types', import.meta.url)),
  },

  // Auto-import configuration
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
    {
      path: '~/features',
      pathPrefix: false,
      extensions: ['.vue'],
      pattern: '**/components/**',
    },
  ],

  // Build configuration
  build: {
    transpile: ['chart.js'],
  },
})
