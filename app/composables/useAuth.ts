import type { AuthResponse, UserSession } from '@/types'
import type { LoginInput, RegisterInput } from '@/utils/auth'

export function useAuth() {
  const { data: user, refresh: refreshUser } = useFetch<UserSession | null>('/api/auth/me', {
    default: () => null,
    server: false,
  })

  const login = async (credentials: LoginInput): Promise<AuthResponse> => {
    const response = await $fetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: credentials,
    })

    await refreshUser()
    return response
  }

  const register = async (userData: RegisterInput): Promise<AuthResponse> => {
    try {
      const response = await $fetch<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: userData,
      })

      // Only refresh user data after successful registration
      if (response) {
        await refreshUser()
      }

      return response
    }
    catch (error) {
      // Don't refresh user data on error to avoid auth state changes
      throw error
    }
  }

  const logout = async (): Promise<void> => {
    await $fetch('/api/auth/logout', {
      method: 'POST',
    })

    await refreshUser()
    await navigateTo('/auth/login')
  }

  const isAuthenticated = computed(() => !!user.value?.user)

  return {
    user: readonly(user),
    login,
    register,
    logout,
    isAuthenticated,
    refreshUser,
  }
}
