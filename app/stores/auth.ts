import type { AuthResponse, AuthUser, LoginCredentials } from '@/types'
import { defineStore } from 'pinia'

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  }),

  getters: {
    currentUser: (state): AuthUser | null => state.user,
    isLoggedIn: (state): boolean => state.isAuthenticated,
  },

  actions: {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
      this.isLoading = true
      try {
        // TODO: Implement actual authentication logic
        // This is a placeholder for the authentication implementation
        const mockUser: AuthUser = {
          id: '1',
          email: credentials.email,
          name: 'Demo User',
          monthlyIncome: 500000,
          currency: 'NGN',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        this.user = mockUser
        this.isAuthenticated = true

        return { success: true, user: mockUser }
      }
      catch (error) {
        console.error('Login failed:', error)
        return {
          success: false,
          user: {} as AuthUser,
          message: 'Login failed',
        }
      }
      finally {
        this.isLoading = false
      }
    },

    async logout(): Promise<void> {
      this.user = null
      this.isAuthenticated = false
      await navigateTo('/login')
    },

    async checkAuth(): Promise<boolean> {
      // TODO: Implement session validation
      // This is a placeholder for session validation
      return this.isAuthenticated
    },

    setUser(user: AuthUser): void {
      this.user = user
      this.isAuthenticated = true
    },

    clearUser(): void {
      this.user = null
      this.isAuthenticated = false
    },
  },
})
