/**
 * Onboarding Middleware
 * Ensures users complete onboarding before accessing the dashboard
 * Runs on protected routes to redirect incomplete onboarding to /onboarding page
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // Only protect dashboard and its sub-routes
  if (!to.path.startsWith('/dashboard')) {
    return
  }

  // Skip on server side - we can only check user state on client
  if (process.server) {
    return
  }

  try {
    console.warn(`[Onboarding Middleware] Checking onboarding status for route: ${to.path}`)
    const { user, refreshUser } = useAuth()

    // If user data not yet loaded, wait a bit and check again
    if (!user.value?.user) {
      console.warn('[Onboarding Middleware] User data not loaded, refreshing...')
      // Try to refresh user data
      await refreshUser()
      console.warn('[Onboarding Middleware] User data after refresh:', {
        hasUser: !!user.value?.user,
        onboardingStatus: user.value?.user?.onboardingStatus,
      })
    }
    else {
      console.warn('[Onboarding Middleware] User data already loaded:', {
        onboardingStatus: user.value.user.onboardingStatus,
      })
    }

    // Now check onboarding status
    if (user.value?.user && user.value?.user.oauthProvider != null) {
      const onboardingStatus = user.value.user.onboardingStatus as string
      console.warn(`[Onboarding Middleware] User onboarding status: ${onboardingStatus}`)

      if (onboardingStatus !== 'COMPLETED') {
        console.warn(`🔐 [Onboarding Middleware] User needs onboarding (status: ${onboardingStatus}), redirecting to /onboarding`)
        return navigateTo('/onboarding')
      }

      console.warn('[Onboarding Middleware] ✅ User onboarding is COMPLETED, allowing dashboard access')
    }
    else {
      console.warn('[Onboarding Middleware] ⚠️ User object is null/undefined after refresh')
      return navigateTo('/auth/login')
    }
  }
  catch (error) {
    console.error('[Onboarding Middleware] Error:', error)
    // On error, let the user proceed - they'll see the form if needed
  }
})
