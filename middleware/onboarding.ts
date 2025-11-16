/**
 * Onboarding Middleware
 * Ensures users complete onboarding before accessing the dashboard
 * Runs on protected routes to redirect incomplete onboarding to /onboarding page
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only protect dashboard and its sub-routes
  if (!to.path.startsWith('/dashboard')) {
    return
  }

  // Skip on server side - we can only check user state on client
  if (process.server) {
    return
  }

  try {
    const { user } = useAuth()

    // If user data not yet loaded, wait a bit and check again
    if (!user.value?.user) {
      // Try to refresh user data
      const { refreshUser } = useAuth()
      await refreshUser()
    }

    // Now check onboarding status
    if (user.value?.user) {
      const onboardingStatus = user.value.user.onboardingStatus as string
      if (onboardingStatus !== 'COMPLETED') {
        console.warn('🔐 Onboarding middleware: User needs onboarding, redirecting to /onboarding')
        return navigateTo('/onboarding')
      }
    }
  }
  catch (error) {
    console.error('Onboarding middleware error:', error)
    // On error, let the user proceed - they'll see the form if needed
  }
})
