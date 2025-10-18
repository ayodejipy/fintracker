import type { BulkImportRequest, BulkImportResponse } from '../../../app/types'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Bulk import reviewed transactions
 * POST /api/statements/import
 */
export default defineEventHandler(async (event) => {
  try {
    // Get user session
    const session = await getUserSession(event)
    const userId = session?.user.id

    if (!userId) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized',
      })
    }

    // Read request body
    const body = await readBody<BulkImportRequest>(event)

    if (!body.transactions || body.transactions.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No transactions provided',
      })
    }

    if (!body.importSource) {
      throw createError({
        statusCode: 400,
        message: 'Import source is required',
      })
    }

    // Validate max transactions (safety limit)
    if (body.transactions.length > 1000) {
      throw createError({
        statusCode: 400,
        message: 'Maximum 1000 transactions can be imported at once',
      })
    }

    const errors: Array<{ index: number, message: string }> = []
    let imported = 0

    // Process each transaction
    for (let i = 0; i < body.transactions.length; i++) {
      const transaction = body.transactions[i]

      try {
        // Validate required fields
        if (!transaction.date || !transaction.amount || !transaction.category) {
          errors.push({
            index: i,
            message: 'Missing required fields (date, amount, or category)',
          })
          continue
        }

        // Parse date
        const date = new Date(transaction.date)
        if (Number.isNaN(date.getTime())) {
          errors.push({
            index: i,
            message: 'Invalid date format',
          })
          continue
        }

        // Validate amount
        if (transaction.amount <= 0) {
          errors.push({
            index: i,
            message: 'Amount must be greater than 0',
          })
          continue
        }

        // Convert type (debit/credit → expense/income)
        const type = transaction.type === 'expense' ? 'expense' : 'income'

        // Create transaction in database
        await prisma.transaction.create({
          data: {
            userId,
            amount: transaction.amount,
            category: transaction.category,
            description: transaction.description || 'Imported transaction',
            date,
            type,
            isImported: true,
            importSource: body.importSource,
            originalDesc: transaction.description,
            confidence: 'high', // User has reviewed and confirmed
            needsReview: false,
            reviewedAt: new Date(),
            userNote: transaction.userNote,
            // Fee fields
            vat: transaction.vat,
            serviceFee: transaction.serviceFee,
            commission: transaction.commission,
            stampDuty: transaction.stampDuty,
            transferFee: transaction.transferFee,
            processingFee: transaction.processingFee,
            otherFees: transaction.otherFees,
            feeNote: transaction.feeNote,
            total: transaction.total,
          },
        })

        imported++
      }
      catch (error: any) {
        console.error(`Error importing transaction ${i}:`, error)
        errors.push({
          index: i,
          message: error.message || 'Unknown error',
        })
      }
    }

    // Sync budgets after successful import
    if (imported > 0 && userId) {
      try {
        // Get unique months from imported transactions
        const uniqueMonths = new Set(
          body.transactions.map(t => new Date(t.date).toISOString().slice(0, 7)),
        )

        // Sync budgets for each affected month
        for (const month of uniqueMonths) {
          const startDate = new Date(`${month}-01`)
          const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)

          // Get all budgets for this month
          const budgets = await prisma.budget.findMany({
            where: {
              userId,
              month,
            },
          })

          // Update each budget's current spent amount
          for (const budget of budgets) {
            const spentAmount = await prisma.transaction.aggregate({
              where: {
                userId,
                category: budget.category,
                type: 'expense',
                date: {
                  gte: startDate,
                  lte: endDate,
                },
              },
              _sum: {
                amount: true,
              },
            })

            const currentSpent = Number(spentAmount._sum.amount || 0)

            await prisma.budget.update({
              where: { id: budget.id },
              data: { currentSpent },
            })
          }
        }

        console.log(`Synced budgets for ${uniqueMonths.size} month(s) after import`)
      }
      catch (syncError) {
        // Log but don't fail the import if budget sync fails
        console.error('Failed to sync budgets after import:', syncError)
      }
    }

    // Create notification for successful import
    if (imported > 0 && userId) {
      try {
        const notificationTitle = imported === 1
          ? '📥 Transaction Imported'
          : `📥 ${imported} Transactions Imported`

        const notificationMessage = imported === 1
          ? `Successfully imported 1 transaction from ${body.importSource}`
          : `Successfully imported ${imported} transactions from ${body.importSource}${errors.length > 0 ? ` (${errors.length} failed)` : ''}`

        await prisma.notification.create({
          data: {
            userId,
            type: 'goal_milestone',
            title: notificationTitle,
            message: notificationMessage,
            priority: 'low',
          },
        })
      }
      catch (notificationError) {
        // Log but don't fail the import if notification creation fails
        console.error('Failed to create import notification:', notificationError)
      }
    }

    const response: BulkImportResponse = {
      success: errors.length === 0,
      imported,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    }

    return response
  }
  catch (error: any) {
    // Handle known errors
    if (error.statusCode) {
      throw error
    }

    // Handle unexpected errors
    console.error('Unexpected error in bulk import:', error)
    throw createError({
      statusCode: 500,
      message: 'An unexpected error occurred while importing transactions',
    })
  }
})
