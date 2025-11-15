export default defineNuxtRouteMiddleware(async (to) => {
  const supabase = useSupabaseClient()
  const { isAuthenticated, refreshUser } = useAuth()
  const route = useRoute()

  // Check Supabase session directly (no API call needed)
  const { data: { session }, error } = await supabase.auth.getSession()

  // Only refresh user data if there's an active session
  if (session?.access_token && !error) {
    await refreshUser()
  }

  // If authenticated and trying to access guest-only routes (login/register)
  if (isAuthenticated.value) {
    // Redirect to the originally intended page if it exists
    const redirectTo = route.query.redirect as string || to.query.redirect as string || '/dashboard'
    return navigateTo(redirectTo)
  }
})
