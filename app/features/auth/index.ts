export { default as AuthFooter } from './components/AuthFooter.vue'
// Auth feature exports
export { default as AuthHeader } from './components/AuthHeader.vue'
export { default as LoginForm } from './components/LoginForm.vue'
export { default as RegisterForm } from './components/RegisterForm.vue'

export { useAuth } from '@/composables/useAuth'
// Re-export auth utilities
export * from '@/utils/auth'
