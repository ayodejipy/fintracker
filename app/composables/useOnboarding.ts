import type { UserSession } from '@/types'

export const OnboardingStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const

export type OnboardingStatusType = typeof OnboardingStatus[keyof typeof OnboardingStatus]

interface OnboardingResponse {
  success: boolean
  message: string
  user?: UserSession
}

/**
 * Composable for managing user onboarding flow
 * Handles income collection and onboarding status tracking
 */
export function useOnboarding() {
  const { user: authUser } = useAuth()
  const router = useRouter()

  // Check if user needs onboarding
  const needsOnboarding = computed(() => {
    if (!authUser.value?.user) return false
    // User needs onboarding if status is NOT_STARTED or IN_PROGRESS
    const status = authUser.value.user.onboardingStatus as OnboardingStatusType
    return status !== OnboardingStatus.COMPLETED
  })

  // Check if user needs income collection specifically
  const needsIncomeCollection = computed(() => {
    if (!authUser.value?.user) return false
    // Needs income if either:
    // 1. monthlyIncome is 0 (not set)
    // 2. onboardingStatus is not COMPLETED
    const monthlyIncome = Number(authUser.value.user.monthlyIncome) || 0
    const status = authUser.value.user.onboardingStatus as OnboardingStatusType
    return monthlyIncome === 0 && status !== OnboardingStatus.COMPLETED
  })

  /**
   * Complete income onboarding step
   */
  const completeIncomeStep = async (monthlyIncome: number, currency: string): Promise<OnboardingResponse> => {
    try {
      const response = await $fetch<OnboardingResponse>('/api/onboarding/income', {
        method: 'POST',
        body: {
          monthlyIncome,
          currency,
        },
      })

      // Update local user state
      if (response.user && authUser.value?.user) {
        authUser.value.user.monthlyIncome = response.user.monthlyIncome
        authUser.value.user.currency = response.user.currency
        authUser.value.user.onboardingStatus = response.user.onboardingStatus
        authUser.value.user.onboardingCompletedAt = response.user.onboardingCompletedAt
      }

      return response
    }
    catch (error) {
      console.error('Error completing income step:', error)
      throw error
    }
  }

  /**
   * Skip onboarding (marks as completed even without income)
   * Useful for users who want to set up income later
   */
  const skipOnboarding = async (): Promise<OnboardingResponse> => {
    try {
      const response = await $fetch<OnboardingResponse>('/api/onboarding/skip', {
        method: 'POST',
      })

      // Update local user state
      if (response.user && authUser.value?.user) {
        authUser.value.user.onboardingStatus = response.user.onboardingStatus
        authUser.value.user.onboardingCompletedAt = response.user.onboardingCompletedAt
      }

      return response
    }
    catch (error) {
      console.error('Error skipping onboarding:', error)
      throw error
    }
  }

  /**
   * Redirect to onboarding page if needed
   */
  const redirectIfNeeded = async () => {
    // Only redirect on client side and if not already on onboarding page
    if (process.server) return

    if (needsOnboarding.value && !router.currentRoute.value.path.startsWith('/onboarding')) {
      await router.push('/onboarding')
    }
  }

  return {
    needsOnboarding,
    needsIncomeCollection,
    completeIncomeStep,
    skipOnboarding,
    redirectIfNeeded,
  }
}
