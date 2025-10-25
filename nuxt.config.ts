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
    '@nuxtjs/supabase',
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
    preset: 'vercel',
    alias: {
      '~/app': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },

  supabase: {
    redirectOptions: {
      login: '/auth/login',
      callback: '/confirm',
      include: undefined,
      exclude: [],
      saveRedirectToCookie: false,
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
    geminiApiKey: process.env.GEMINI_API_KEY,
    // Public keys (exposed to client-side)
    public: {
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'Personal Finance Dashboard',
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
  },

  app: {
    head: {
      title: 'FinSight - Personal Finance Dashboard',
      meta: [

        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
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
