export default defineNuxtRouteMiddleware(async (to, _from) => {
  const { isAuthenticated, refreshUser } = useAuth()

  // Wait for auth state to be checked
  await refreshUser()

  if (!isAuthenticated.value) {
    // Store the intended destination
    return navigateTo({
      path: '/auth/login',
      query: { redirect: to.fullPath },
    })
  }
})
