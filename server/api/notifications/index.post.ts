import { z } from 'zod'
import { prisma } from '~/utils/database'
import { getUserSession } from '../../utils/auth'

// Validation schema
const createNotificationSchema = z.object({
  type: z.enum(['budget_alert', 'payment_reminder', 'savings_reminder', 'goal_achieved', 'overspending_warning', 'goal_milestone']),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  scheduledAt: z.string().datetime().optional(),
  budgetId: z.string().optional(),
  loanId: z.string().optional(),
  savingsGoalId: z.string().optional(),
  transactionId: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  try {
    // Get user from session
    const session = await getUserSession(event)
    if (!session?.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }

    const user = session.user
    const body = await readBody(event)

    // Validate input
    const validatedData = createNotificationSchema.parse(body)

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        type: validatedData.type,
        title: validatedData.title,
        message: validatedData.message,
        priority: validatedData.priority,
        scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null,
        budgetId: validatedData.budgetId,
        loanId: validatedData.loanId,
        savingsGoalId: validatedData.savingsGoalId,
        transactionId: validatedData.transactionId,
      },
    })

    return {
      success: true,
      data: notification,
      message: 'Notification created successfully',
    }
  }
  catch (error: any) {
    console.error('Create notification error:', error)

    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: { errors: error.errors },
      })
    }

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to create notification',
    })
  }
})
