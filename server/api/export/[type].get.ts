import { z } from 'zod'
import { serverCache } from '~/utils/cache'
import { CSVExporter, PDFExporter } from '~/utils/export'
import { prisma as db } from '../../../app/utils/database'
import {
  asyncHandler,
  requireAuth,
  validateQuery,
} from '../../utils/error-handler'

const exportQuerySchema = z.object({
  format: z.enum(['csv', 'pdf']).default('csv'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  category: z.string().optional(),
})

export default defineEventHandler(asyncHandler(async (event) => {
  const user = await requireAuth(event)
  const type = getRouterParam(event, 'type')
  const query = validateQuery(exportQuerySchema, event)

  if (!['transactions', 'budgets', 'loans', 'savings', 'all'].includes(type || '')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid export type',
    })
  }

  // Check cache first
  const cacheKey = `export:${user.id}:${type}:${JSON.stringify(query)}`
  const cached = serverCache.get(cacheKey)
  if (cached) {
    setHeader(event, 'Content-Type', query.format === 'csv' ? 'text/csv' : 'text/html')
    return cached
  }

  let result: string

  try {
    switch (type) {
      case 'transactions':
        result = await exportTransactions(user.id, query)
        break
      case 'budgets':
        result = await exportBudgets(user.id, query)
        break
      case 'loans':
        result = await exportLoans(user.id, query)
        break
      case 'savings':
        result = await exportSavingsGoals(user.id, query)
        break
      case 'all':
        result = await exportAllData(user.id, query)
        break
      default:
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid export type',
        })
    }

    // Cache the result for 10 minutes
    serverCache.set(cacheKey, result, 10 * 60 * 1000)

    // Set appropriate content type
    setHeader(event, 'Content-Type', query.format === 'csv' ? 'text/csv' : 'text/html')

    return result
  }
  catch (error) {
    console.error('Export error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Export failed',
    })
  }
}))

async function exportTransactions(userId: string, query: any): Promise<string> {
  const whereClause: any = { userId }

  // Add date filters
  if (query.startDate || query.endDate) {
    whereClause.date = {}
    if (query.startDate) {
      whereClause.date.gte = new Date(query.startDate)
    }
    if (query.endDate) {
      whereClause.date.lte = new Date(query.endDate)
    }
  }

  // Add category filter
  if (query.category) {
    whereClause.category = query.category
  }

  const transactions = await db.transaction.findMany({
    where: whereClause,
    orderBy: { date: 'desc' },
    take: 10000, // Limit to prevent memory issues
  })

  if (query.format === 'pdf') {
    const period = query.startDate && query.endDate
      ? `${query.startDate} to ${query.endDate}`
      : 'All Time'
    return PDFExporter.generateTransactionReport(transactions as any, period)
  }

  return CSVExporter.exportTransactions(transactions as any)
}

async function exportBudgets(userId: string, query: any): Promise<string> {
  const whereClause: any = { userId }

  // Add month filter if specified
  if (query.startDate) {
    const startMonth = new Date(query.startDate).toISOString().slice(0, 7) // YYYY-MM
    whereClause.month = { gte: startMonth }
  }

  const budgets = await db.budget.findMany({
    where: whereClause,
    orderBy: [{ month: 'desc' }, { category: 'asc' }],
  })

  if (query.format === 'pdf') {
    const period = query.startDate
      ? `From ${query.startDate}`
      : 'All Time'
    return PDFExporter.generateBudgetReport(budgets as any, period)
  }

  return CSVExporter.exportBudgets(budgets as any)
}

async function exportLoans(userId: string, query: any): Promise<string> {
  const loans = await db.loan.findMany({
    where: { userId },
    orderBy: { startDate: 'desc' },
  })

  if (query.format === 'pdf') {
    // For PDF, we could create a detailed loan report
    const content = `
      <div class="summary-card">
        <h3>Loan Portfolio Summary</h3>
        <p><strong>Total Loans:</strong> ${loans.length}</p>
        <p><strong>Total Outstanding:</strong> ${loans.reduce((sum, l) => sum + Number(l.currentBalance), 0).toLocaleString()}</p>
        <p><strong>Total Monthly Payments:</strong> ${loans.reduce((sum, l) => sum + Number(l.monthlyPayment), 0).toLocaleString()}</p>
      </div>

      <h3>Loan Details</h3>
      <table>
        <thead>
          <tr>
            <th>Loan Name</th>
            <th>Initial Amount</th>
            <th>Current Balance</th>
            <th>Monthly Payment</th>
            <th>Interest Rate</th>
            <th>Start Date</th>
          </tr>
        </thead>
        <tbody>
          ${loans.map(loan => `
            <tr>
              <td>${loan.name}</td>
              <td>${Number(loan.initialAmount).toLocaleString()}</td>
              <td>${Number(loan.currentBalance).toLocaleString()}</td>
              <td>${Number(loan.monthlyPayment).toLocaleString()}</td>
              <td>${Number(loan.interestRate)}%</td>
              <td>${new Date(loan.startDate).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
    return PDFExporter.generateHTMLReport('Loan Portfolio Report', content)
  }

  return CSVExporter.exportLoans(loans as any)
}

async function exportSavingsGoals(userId: string, query: any): Promise<string> {
  const savingsGoals = await db.savingsGoal.findMany({
    where: { userId },
    orderBy: { targetDate: 'asc' },
  })

  if (query.format === 'pdf') {
    const totalTarget = savingsGoals.reduce((sum, g) => sum + Number(g.targetAmount), 0)
    const totalCurrent = savingsGoals.reduce((sum, g) => sum + Number(g.currentAmount), 0)
    const overallProgress = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0

    const content = `
      <div class="summary-card">
        <h3>Savings Goals Summary</h3>
        <p><strong>Total Goals:</strong> ${savingsGoals.length}</p>
        <p><strong>Total Target:</strong> ${totalTarget.toLocaleString()}</p>
        <p><strong>Total Saved:</strong> ${totalCurrent.toLocaleString()}</p>
        <p><strong>Overall Progress:</strong> ${overallProgress}%</p>
      </div>

      <h3>Goals Details</h3>
      <table>
        <thead>
          <tr>
            <th>Goal Name</th>
            <th>Target Amount</th>
            <th>Current Amount</th>
            <th>Monthly Contribution</th>
            <th>Target Date</th>
            <th>Progress</th>
          </tr>
        </thead>
        <tbody>
          ${savingsGoals.map((goal) => {
            const progress = Number(goal.targetAmount) > 0
              ? Math.round((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100)
              : 0

            return `
              <tr>
                <td>${goal.name}</td>
                <td>${Number(goal.targetAmount).toLocaleString()}</td>
                <td>${Number(goal.currentAmount).toLocaleString()}</td>
                <td>${Number(goal.monthlyContribution).toLocaleString()}</td>
                <td>${new Date(goal.targetDate).toLocaleDateString()}</td>
                <td>${progress}%</td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>
    `
    return PDFExporter.generateHTMLReport('Savings Goals Report', content)
  }

  return CSVExporter.exportSavingsGoals(savingsGoals as any)
}

async function exportAllData(userId: string, query: any): Promise<string> {
  // Get all user data
  const [transactions, budgets, loans, savingsGoals] = await Promise.all([
    db.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 5000, // Limit for performance
    }),
    db.budget.findMany({
      where: { userId },
      orderBy: [{ month: 'desc' }, { category: 'asc' }],
    }),
    db.loan.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
    }),
    db.savingsGoal.findMany({
      where: { userId },
      orderBy: { targetDate: 'asc' },
    }),
  ])

  if (query.format === 'pdf') {
    const period = query.startDate && query.endDate
      ? `${query.startDate} to ${query.endDate}`
      : 'All Time'

    return PDFExporter.generateFinancialOverview({
      transactions: transactions as any,
      budgets: budgets as any,
      loans: loans as any,
      savingsGoals: savingsGoals as any,
      period,
    })
  }

  // For CSV, combine all data sections
  const sections = [
    '=== FINANCIAL SUMMARY ===',
    CSVExporter.exportFinancialSummary({
      totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0),
      totalExpenses: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0),
      netIncome: transactions.reduce((sum, t) => sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0),
      budgetUtilization: budgets.length > 0
        ? Math.round((budgets.reduce((sum, b) => sum + Number(b.currentSpent), 0) / budgets.reduce((sum, b) => sum + Number(b.monthlyLimit), 0)) * 100)
        : 0,
      totalLoans: loans.reduce((sum, l) => sum + Number(l.currentBalance), 0),
      totalSavings: savingsGoals.reduce((sum, g) => sum + Number(g.currentAmount), 0),
      period: query.startDate && query.endDate ? `${query.startDate} to ${query.endDate}` : 'All Time',
    }),
    '',
    '=== TRANSACTIONS ===',
    CSVExporter.exportTransactions(transactions as any),
    '',
    '=== BUDGETS ===',
    CSVExporter.exportBudgets(budgets as any),
    '',
    '=== LOANS ===',
    CSVExporter.exportLoans(loans as any),
    '',
    '=== SAVINGS GOALS ===',
    CSVExporter.exportSavingsGoals(savingsGoals as any),
  ]

  return sections.join('\n')
}
