import { vi } from 'vitest'

// Mock Nuxt composables
vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $router: {
      push: vi.fn(),
      replace: vi.fn(),
    },
  }),
  navigateTo: vi.fn(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useRoute: () => ({
    params: {},
    query: {},
    path: '/',
  }),
}))

// Mock Pinia
vi.mock('pinia', () => ({
  defineStore: vi.fn(),
  createPinia: vi.fn(),
  setActivePinia: vi.fn(),
}))

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
