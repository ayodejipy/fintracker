/**
 * Auth Interceptor Plugin
 * Automatically attaches Supabase auth tokens to all API requests
 */
export default defineNuxtPlugin((nuxtApp) => {
  const supabase = useSupabaseClient()

  // Get the original $fetch function
  const $fetch = nuxtApp.$fetch

  // Create a wrapper that adds auth headers
  nuxtApp.$fetch = (async (request: any, opts: any = {}) => {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      const tokenPreview = session?.access_token
        ? `${session.access_token.substring(0, 20)}...`
        : 'none'
      console.warn('🔐 Auth interceptor: Session check -', {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        tokenPreview,
      })

      // Add authorization header if session exists
      if (session?.access_token) {
        const headers = opts.headers || {}
        // Only add if not already set (to allow overrides)
        if (!headers.Authorization && !headers.authorization) {
          headers.Authorization = `Bearer ${session.access_token}`
          console.warn('🔐 Auth interceptor: Added Authorization header for request:', request)
        }
        opts.headers = headers
      }
      else {
        console.warn('⚠️ Auth interceptor: No session found, request will be unauthenticated:', request)
      }
    }
    catch (error) {
      // Silently fail - if we can't get session, continue without auth
      console.error('❌ Auth interceptor error:', error)
    }

    // Call the original $fetch with modified options
    return $fetch(request, opts)
  }) as any
})
