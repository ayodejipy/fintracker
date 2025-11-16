import { Decimal } from '@prisma/client/runtime/library'
import { serverSupabaseUser } from '#supabase/server'
import { getUserSession } from '../../utils/auth'
import { prisma } from '../../../app/utils/database'

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
          console.warn('✅ Onboarding: Authenticated via Supabase token')
        }
      }
    }
    catch (error) {
      console.warn('⚠️ Onboarding: Supabase auth failed, trying JWT...')
    }

    // Fallback to JWT session
    if (!userId) {
      const session = await getUserSession(event)
      userId = session?.user?.id || null
      if (userId) {
        console.warn('✅ Onboarding: Authenticated via JWT')
      }
    }

    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }

    // Parse and validate input
    const body = await readBody(event)
    const { monthlyIncome, currency } = body

    if (!monthlyIncome || typeof monthlyIncome !== 'number' || monthlyIncome < 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid monthlyIncome',
      })
    }

    if (!currency || typeof currency !== 'string' || currency.length !== 3) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid currency code',
      })
    }

    // Update user with income data and mark onboarding as completed
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        monthlyIncome: new Decimal(monthlyIncome),
        currency,
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

    console.log(`[/api/onboarding/income] User ${userId} completed income onboarding`)

    return {
      success: true,
      message: 'Onboarding completed successfully',
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

    console.error('[/api/onboarding/income] Error:', error instanceof Error ? error.message : String(error))
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to complete onboarding',
    })
  }
})
