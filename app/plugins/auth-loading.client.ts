export default defineNuxtPlugin(() => {
  const nuxtApp = useNuxtApp()

  // Add a global state for auth loading
  nuxtApp.hook('app:created', () => {
    // Prevent rendering until auth state is checked
    const { refreshUser } = useAuth()
    refreshUser()
  })
})
