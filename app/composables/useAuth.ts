import type { UserSession } from '@/types'

/**
 * Composable for Supabase-based authentication
 * Handles fetching user session from /api/auth/me
 * The auth interceptor automatically adds Supabase tokens to all requests
 */
export function useAuth() {
  const supabase = useSupabaseClient()

  // Fetch user session from backend (uses Supabase auth)
  // Auth interceptor plugin automatically adds Authorization header with Supabase token
  const { data: user, refresh: refreshUser } = useFetch<UserSession | null>('/api/auth/me', {
    default: () => null,
    server: false,
    immediate: false, // Don't auto-fetch on component mount
  })

  /**
   * Logout user from Supabase
   * This clears the Supabase session and redirects to login
   */
  const logout = async (): Promise<void> => {
    try {
      // Sign out from Supabase (clears all tokens)
      await supabase.auth.signOut()

      // Clear cached user data
      user.value = null

      // Redirect to login
      await navigateTo('/auth/login')
    }
    catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  // Computed property to check if user is authenticated
  const isAuthenticated = computed(() => !!user.value?.user)

  return {
    user: readonly(user),
    isAuthenticated,
    refreshUser,
    logout,
  }
}
