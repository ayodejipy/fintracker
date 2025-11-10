import type { User } from '@supabase/supabase-js'

export interface RegisterInput {
  email: string
  password: string
  name: string
  monthlyIncome?: number
  currency?: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  user?: User
  message?: string
  needsEmailConfirmation?: boolean
}

/**
 * Supabase Authentication Composable
 * Handles user authentication with email verification
 */
export function useSupabaseAuth() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const router = useRouter()

  /**
   * Register a new user
   * Sends email confirmation automatically
   */
  const register = async (userData: RegisterInput): Promise<AuthResponse> => {
    try {
      // 1. Create auth user in Supabase
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
          },
          emailRedirectTo: `${window.location.origin}/confirm`,
        },
      })

      if (error) {
        throw error
      }

      if (!data.user) {
        throw new Error('Failed to create user')
      }

      // 2. Create user profile in database
      try {
        await $fetch('/api/users/profile', {
          method: 'POST',
          body: {
            id: data.user.id,
            email: userData.email,
            name: userData.name,
            monthlyIncome: userData.monthlyIncome || 0,
            currency: userData.currency || 'NGN',
          },
        })
      }
      catch (profileError) {
        console.error('Failed to create user profile:', profileError)
        // Note: User exists in Supabase Auth but not in our DB
        // They can still login but need profile created
      }

      return {
        success: true,
        user: data.user,
        message: 'Registration successful! Please check your email to verify your account.',
        needsEmailConfirmation: true,
      }
    }
    catch (error: any) {
      console.error('Registration error:', error)
      return {
        success: false,
        message: error.message || 'Registration failed. Please try again.',
      }
    }
  }

  /**
   * Login with email and password
   */
  const login = async (credentials: LoginInput): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        throw error
      }

      if (!data.user) {
        throw new Error('Login failed')
      }

      // Check if email is confirmed
      if (!data.user.email_confirmed_at) {
        return {
          success: false,
          message: 'Please verify your email before logging in. Check your inbox for the confirmation link.',
          needsEmailConfirmation: true,
        }
      }

      return {
        success: true,
        user: data.user,
        message: 'Login successful!',
      }
    }
    catch (error: any) {
      console.error('Login error:', error)
      return {
        success: false,
        message: error.message || 'Invalid email or password.',
      }
    }
  }

  /**
   * Logout user
   */
  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut()
      await router.push('/auth/login')
    }
    catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  /**
   * Resend confirmation email
   */
  const resendConfirmationEmail = async (email: string): Promise<AuthResponse> => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })

      if (error) {
        throw error
      }

      return {
        success: true,
        message: 'Confirmation email sent! Please check your inbox.',
      }
    }
    catch (error: any) {
      console.error('Resend confirmation error:', error)
      return {
        success: false,
        message: error.message || 'Failed to resend confirmation email.',
      }
    }
  }

  /**
   * Request password reset
   */
  const resetPassword = async (email: string): Promise<AuthResponse> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        throw error
      }

      return {
        success: true,
        message: 'Password reset email sent! Please check your inbox.',
      }
    }
    catch (error: any) {
      console.error('Password reset error:', error)
      return {
        success: false,
        message: error.message || 'Failed to send password reset email.',
      }
    }
  }

  /**
   * Update password (for logged-in users or password reset flow)
   */
  const updatePassword = async (newPassword: string): Promise<AuthResponse> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        throw error
      }

      return {
        success: true,
        message: 'Password updated successfully!',
      }
    }
    catch (error: any) {
      console.error('Update password error:', error)
      return {
        success: false,
        message: error.message || 'Failed to update password.',
      }
    }
  }

  /**
   * Sign in with Google OAuth
   */
  const signInWithGoogle = async (): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }

      // OAuth redirect happens automatically
      return {
        success: true,
        message: 'Redirecting to Google...',
      }
    }
    catch (error: any) {
      console.error('Google sign-in error:', error)
      return {
        success: false,
        message: error.message || 'Failed to sign in with Google. Please try again.',
      }
    }
  }

  const isAuthenticated = computed(() => !!user.value)
  const isEmailVerified = computed(() => !!user.value?.email_confirmed_at)

  return {
    // State
    user,
    isAuthenticated,
    isEmailVerified,

    // Methods
    register,
    login,
    logout,
    resendConfirmationEmail,
    resetPassword,
    updatePassword,
    signInWithGoogle,
  }
}
