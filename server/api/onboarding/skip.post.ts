import { getUserSession } from '~/server/utils/auth'
import { prisma } from '~/utils/database'

const ONBOARDING_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
}

export default defineEventHandler(async (event) => {
  try {
    // Authenticate user
    const session = await getUserSession(event)
    if (!session || !session.user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }

    const userId = session.user.id

    // Mark onboarding as completed without changing income/currency
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingStatus: ONBOARDING_STATUS.COMPLETED,
        onboardingCompletedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        monthlyIncome: true,
        currency: true,
        oauthProvider: true,
        onboardingStatus: true,
        onboardingCompletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    console.log(`[/api/onboarding/skip] User ${userId} skipped onboarding`)

    return {
      success: true,
      message: 'Onboarding skipped',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        monthlyIncome: Number(updatedUser.monthlyIncome),
        currency: updatedUser.currency,
        oauthProvider: updatedUser.oauthProvider,
        onboardingStatus: updatedUser.onboardingStatus,
        onboardingCompletedAt: updatedUser.onboardingCompletedAt,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    }
  }
  catch (error) {
    if (error instanceof Error && error.message?.includes('Unauthorized')) {
      throw error
    }

    console.error('[/api/onboarding/skip] Error:', error instanceof Error ? error.message : String(error))
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to skip onboarding',
    })
  }
})
