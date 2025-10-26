export default defineNuxtRouteMiddleware(async (to, _from) => {
  const user = useSupabaseUser()

  // Check if user is authenticated
  if (!user.value) {
    // Store the intended destination
    return navigateTo({
      path: '/auth/login',
      query: { redirect: to.fullPath },
    })
  }

  // Optional: Check if email is verified for routes that require it
  if (to.meta.requiresEmailVerification && !user.value.email_confirmed_at) {
    return navigateTo('/auth/verify-email')
  }
})
