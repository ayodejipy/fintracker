import { PrismaClient } from '@prisma/client'
import { serverSupabaseUser } from '#supabase/server'
import { getUserSession } from '../../utils/auth'

const prisma = new PrismaClient()

const ONBOARDING_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
}

export default defineEventHandler(async (event) => {
  try {
    // Authenticate user - support both Supabase and JWT
    let userId: string | null = null

    // Try Supabase first (OAuth flow)
    try {
      const supabaseUser = await serverSupabaseUser(event)
      if (supabaseUser) {
        userId = (supabaseUser as any)?.sub || (supabaseUser as any)?.id
        if (userId) {
          console.warn('✅ Skip onboarding: Authenticated via Supabase token')
        }
      }
    }
    catch (error) {
      console.warn('⚠️ Skip onboarding: Supabase auth failed, trying JWT...')
    }

    // Fallback to JWT session
    if (!userId) {
      const session = await getUserSession(event)
      userId = session?.user?.id || null
      if (userId) {
        console.warn('✅ Skip onboarding: Authenticated via JWT')
      }
    }

    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }

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
