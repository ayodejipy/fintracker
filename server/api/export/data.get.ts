import { z } from 'zod'
import { prisma as db } from '../../../app/utils/database'
import { asyncHandler, requireAuth } from '../../utils/error-handler'

const exportQuerySchema = z.object({
  format: z.enum(['json', 'csv']).default('json'),
  type: z.enum(['transactions', 'budgets', 'loans', 'savings-goals', 'all']).default('all'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export default defineEventHandler(
  asyncHandler(async (event) => {
    const user = await requireAuth(event)
    const query = await getValidatedQuery(event, exportQuerySchema.parse)

    try {
      const data: any = {}

      // Build date filter if provided
      const dateFilter: any = {}
      if (query.startDate) { dateFilter.gte = new Date(query.startDate) }
      if (query.endDate) { dateFilter.lte = new Date(query.endDate) }

      // Fetch requested data
      if (query.type === 'transactions' || query.type === 'all') {
        data.transactions = await db.transaction.findMany({
          where: {
            userId: user.id,
            ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
          },
          orderBy: { date: 'desc' },
          select: {
            id: true,
            amount: true,
            category: true,
            description: true,
            type: true,
            date: true,
            createdAt: true,
          },
        })
      }

      if (query.type === 'budgets' || query.type === 'all') {
        data.budgets = await db.budget.findMany({
          where: { userId: user.id },
          orderBy: [{ month: 'desc' }, { category: 'asc' }],
          select: {
            id: true,
            category: true,
            month: true,
            monthlyLimit: true,
            currentSpent: true,
            createdAt: true,
            updatedAt: true,
          },
        })
      }

      if (query.type === 'loans' || query.type === 'all') {
        data.loans = await db.loan.findMany({
          where: { userId: user.id },
          orderBy: { startDate: 'desc' },
          select: {
            id: true,
            name: true,
            initialAmount: true,
            currentBalance: true,
            monthlyPayment: true,
            interestRate: true,
            startDate: true,
            createdAt: true,
          },
        })
      }

      if (query.type === 'savings-goals' || query.type === 'all') {
        data.savingsGoals = await db.savingsGoal.findMany({
          where: { userId: user.id },
          orderBy: { targetDate: 'asc' },
          select: {
            id: true,
            name: true,
            targetAmount: true,
            currentAmount: true,
            monthlyContribution: true,
            targetDate: true,
            createdAt: true,
          },
        })
      }

      // Convert Decimal fields to numbers for JSON serialization
      const convertDecimals = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(convertDecimals)
        }
        else if (obj && typeof obj === 'object') {
          const converted: any = {}
          for (const [key, value] of Object.entries(obj)) {
            if (value && typeof value === 'object' && 'toNumber' in value) {
              converted[key] = Number(value)
            }
            else if (value instanceof Date) {
              converted[key] = value.toISOString()
            }
            else {
              converted[key] = convertDecimals(value)
            }
          }
          return converted
        }
        return obj
      }

      const convertedData = convertDecimals(data)

      // Add metadata
      const exportData = {
        exportDate: new Date().toISOString(),
        userId: user.id,
        format: query.format,
        type: query.type,
        filters: {
          startDate: query.startDate,
          endDate: query.endDate,
        },
        data: convertedData,
        summary: {
          totalTransactions: convertedData.transactions?.length || 0,
          totalBudgets: convertedData.budgets?.length || 0,
          totalLoans: convertedData.loans?.length || 0,
          totalSavingsGoals: convertedData.savingsGoals?.length || 0,
        },
      }

      // Set appropriate headers for download
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `financial-data-${query.type}-${timestamp}.${query.format}`

      setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)

      if (query.format === 'csv') {
        setHeader(event, 'Content-Type', 'text/csv')
        return convertToCSV(convertedData, query.type)
      }
      else {
        setHeader(event, 'Content-Type', 'application/json')
        return exportData
      }
    }
    catch (error) {
      console.error('Export error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to export data',
      })
    }
  }),
)

// Helper function to convert data to CSV format
function convertToCSV(data: any, type: string): string {
  if (type === 'transactions' && data.transactions) {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount']
    const rows = data.transactions.map((t: any) => [
      new Date(t.date).toLocaleDateString(),
      t.description || '',
      t.category || '',
      t.type || '',
      t.amount?.toString() || '0',
    ])
    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n')
  }

  if (type === 'budgets' && data.budgets) {
    const headers = ['Month', 'Category', 'Monthly Limit', 'Current Spent', 'Remaining']
    const rows = data.budgets.map((b: any) => {
      const remaining = Number(b.monthlyLimit) - Number(b.currentSpent)
      return [
        b.month || '',
        b.category || '',
        b.monthlyLimit?.toString() || '0',
        b.currentSpent?.toString() || '0',
        remaining.toString(),
      ]
    })
    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n')
  }

  if (type === 'loans' && data.loans) {
    const headers = ['Name', 'Initial Amount', 'Current Balance', 'Monthly Payment', 'Interest Rate', 'Start Date']
    const rows = data.loans.map((l: any) => [
      l.name || '',
      l.initialAmount?.toString() || '0',
      l.currentBalance?.toString() || '0',
      l.monthlyPayment?.toString() || '0',
      l.interestRate?.toString() || '0',
      l.startDate ? new Date(l.startDate).toLocaleDateString() : '',
    ])
    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n')
  }

  if (type === 'savings-goals' && data.savingsGoals) {
    const headers = ['Name', 'Target Amount', 'Current Amount', 'Monthly Contribution', 'Target Date', 'Progress %']
    const rows = data.savingsGoals.map((g: any) => {
      const progress = (Number(g.currentAmount) / Number(g.targetAmount)) * 100
      return [
        g.name || '',
        g.targetAmount?.toString() || '0',
        g.currentAmount?.toString() || '0',
        g.monthlyContribution?.toString() || '0',
        g.targetDate ? new Date(g.targetDate).toLocaleDateString() : '',
        progress.toFixed(2),
      ]
    })
    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n')
  }

  // For 'all' type, create a summary CSV
  const summaryRows = []
  if (data.transactions) { summaryRows.push(['Transactions', data.transactions.length.toString()]) }
  if (data.budgets) { summaryRows.push(['Budgets', data.budgets.length.toString()]) }
  if (data.loans) { summaryRows.push(['Loans', data.loans.length.toString()]) }
  if (data.savingsGoals) { summaryRows.push(['Savings Goals', data.savingsGoals.length.toString()]) }

  return [['Data Type', 'Count'], ...summaryRows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')
}
