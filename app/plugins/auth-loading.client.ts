export default defineNuxtPlugin(async () => {
  const nuxtApp = useNuxtApp()
  const supabase = useSupabaseClient()

  // Add a global state for auth loading
  nuxtApp.hook('app:created', async () => {
    // Check if user has an active session BEFORE making API call
    const { data: { session }, error } = await supabase.auth.getSession()

    // Only fetch user data from API if session exists
    if (session?.access_token && !error) {
      const { refreshUser } = useAuth()
      await refreshUser()
    }
  })
})
