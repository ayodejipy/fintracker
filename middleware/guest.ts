export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated, refreshUser } = useAuth()
  const route = useRoute()

  // Wait for auth state to be checked
  await refreshUser()

  // If authenticated and trying to access guest-only routes (login/register)
  if (isAuthenticated.value) {
    // Redirect to the originally intended page if it exists
    const redirectTo = route.query.redirect as string || to.query.redirect as string || '/dashboard'
    return navigateTo(redirectTo)
  }
})
