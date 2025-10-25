import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { getUserSession } from '../../utils/auth'

const prisma = new PrismaClient()

// Validation schema
const createRecurringExpenseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  amount: z.number().positive('Amount must be positive'),
  category: z.enum([
    'loan_repayment',
    'home_allowance',
    'rent',
    'transport',
    'food',
    'data_airtime',
    'miscellaneous',
    'savings',
  ]),
  frequency: z.enum(['weekly', 'monthly', 'yearly']),
  nextDueDate: z.string().datetime(),
  description: z.string().optional(),
  reminderDays: z.number().min(0).max(30).default(3),
  autoCreateTransaction: z.boolean().default(false),
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

    const user = session.user as any

    // Parse and validate request body
    const body = await readBody(event)
    const validatedData = createRecurringExpenseSchema.parse(body)

    // Create recurring expense
    const recurringExpense = await prisma.recurringExpense.create({
      data: {
        userId: user.id,
        name: validatedData.name,
        amount: validatedData.amount,
        category: validatedData.category,
        frequency: validatedData.frequency,
        nextDueDate: new Date(validatedData.nextDueDate),
        description: validatedData.description,
        reminderDays: validatedData.reminderDays,
        autoCreateTransaction: validatedData.autoCreateTransaction,
      },
    })

    return {
      success: true,
      data: {
        ...recurringExpense,
        amount: Number(recurringExpense.amount),
      },
      message: 'Recurring expense created successfully',
    }
  }
  catch (error: any) {
    console.error('Error creating recurring expense:', error)

    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: error.errors,
      })
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create recurring expense',
    })
  }
})
