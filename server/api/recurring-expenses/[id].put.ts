import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { getUserSession } from '../../utils/auth'

const prisma = new PrismaClient()

// Validation schema
const updateRecurringExpenseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  category: z.enum([
    'loan_repayment',
    'home_allowance', 
    'rent',
    'transport',
    'food',
    'data_airtime',
    'miscellaneous',
    'savings'
  ]).optional(),
  frequency: z.enum(['weekly', 'monthly', 'yearly']).optional(),
  nextDueDate: z.string().datetime().optional(),
  description: z.string().optional(),
  reminderDays: z.number().min(0).max(30).optional(),
  autoCreateTransaction: z.boolean().optional(),
  isActive: z.boolean().optional(),
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

    // Get recurring expense ID from route params
    const expenseId = getRouterParam(event, 'id')
    if (!expenseId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Recurring expense ID is required',
      })
    }

    // Check if recurring expense exists and belongs to user
    const existingExpense = await prisma.recurringExpense.findFirst({
      where: {
        id: expenseId,
        userId: user.id,
      },
    })

    if (!existingExpense) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Recurring expense not found',
      })
    }

    // Parse and validate request body
    const body = await readBody(event)
    const validatedData = updateRecurringExpenseSchema.parse(body)

    // Prepare update data
    const updateData: any = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.amount !== undefined) updateData.amount = validatedData.amount
    if (validatedData.category !== undefined) updateData.category = validatedData.category
    if (validatedData.frequency !== undefined) updateData.frequency = validatedData.frequency
    if (validatedData.nextDueDate !== undefined) updateData.nextDueDate = new Date(validatedData.nextDueDate)
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.reminderDays !== undefined) updateData.reminderDays = validatedData.reminderDays
    if (validatedData.autoCreateTransaction !== undefined) updateData.autoCreateTransaction = validatedData.autoCreateTransaction
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive

    // Update recurring expense
    const updatedExpense = await prisma.recurringExpense.update({
      where: { id: expenseId },
      data: updateData,
    })

    return {
      success: true,
      data: {
        ...updatedExpense,
        amount: Number(updatedExpense.amount),
      },
      message: 'Recurring expense updated successfully',
    }
  }
  catch (error: any) {
    console.error('Error updating recurring expense:', error)

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
      statusMessage: 'Failed to update recurring expense',
    })
  }
})