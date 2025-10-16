import process from 'node:process'

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip middleware on server
  if (process.server) {
    return
  }

  const authRoutes = ['/auth/login', '/auth/register']
  if (authRoutes.includes(to.path)) {
    return
  }

  const { isAuthenticated, refreshUser } = useAuth()

  // Wait for auth state to be checked
  await refreshUser()

  // If not authenticated and trying to access a protected route
  if (!isAuthenticated.value) {
    // Store the intended destination
    return navigateTo({
      path: '/auth/login',
      query: { redirect: to.fullPath },
    })
  }
})
