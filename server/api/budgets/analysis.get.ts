import type { ExpenseCategory } from '~/types'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Query parameters validation schema
const AnalysisQuerySchema = z.object({
  month: z.string().optional(),
})

interface BudgetAnalysis {
  month: string
  totalBudget: number
  totalSpent: number
  totalRemaining: number
  utilizationRate: number
  categoryAnalysis: Array<{
    category: ExpenseCategory
    budgeted: number
    spent: number
    remaining: number
    utilizationRate: number
    status: 'under_budget' | 'near_limit' | 'over_budget'
  }>
  alerts: Array<{
    type: 'warning' | 'danger'
    category: ExpenseCategory
    message: string
    amount: number
  }>
  recommendations: Array<{
    type: 'savings' | 'reallocation' | 'adjustment'
    message: string
    category?: ExpenseCategory
    suggestedAmount?: number
  }>
}

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

    // Parse and validate query parameters
    const query = await getQuery(event)
    const validatedQuery = AnalysisQuerySchema.parse(query)

    const month = validatedQuery.month || new Date().toISOString().slice(0, 7)
    const userId = (session.user as any).id

    // Get all budgets for the month
    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        month,
      },
    })

    if (budgets.length === 0) {
      return {
        success: true,
        data: {
          month,
          totalBudget: 0,
          totalSpent: 0,
          totalRemaining: 0,
          utilizationRate: 0,
          categoryAnalysis: [],
          alerts: [],
          recommendations: [{
            type: 'adjustment',
            message: 'No budgets set for this month. Consider creating budgets to track your spending.',
          }],
        } as BudgetAnalysis,
      }
    }

    // Calculate totals
    const totalBudget = budgets.reduce((sum, b) => sum + Number(b.monthlyLimit), 0)
    const totalSpent = budgets.reduce((sum, b) => sum + Number(b.currentSpent), 0)
    const totalRemaining = totalBudget - totalSpent
    const utilizationRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

    // Analyze each category
    const categoryAnalysis = budgets.map((budget) => {
      const budgeted = Number(budget.monthlyLimit)
      const spent = Number(budget.currentSpent)
      const remaining = budgeted - spent
      const categoryUtilization = budgeted > 0 ? (spent / budgeted) * 100 : 0

      let status: 'under_budget' | 'near_limit' | 'over_budget'
      if (spent > budgeted) {
        status = 'over_budget'
      }
      else if (categoryUtilization >= 80) {
        status = 'near_limit'
      }
      else {
        status = 'under_budget'
      }

      return {
        category: budget.category as ExpenseCategory,
        budgeted,
        spent,
        remaining,
        utilizationRate: categoryUtilization,
        status,
      }
    })

    // Generate alerts
    const alerts: BudgetAnalysis['alerts'] = []
    categoryAnalysis.forEach((analysis) => {
      if (analysis.status === 'over_budget') {
        alerts.push({
          type: 'danger',
          category: analysis.category,
          message: `You've exceeded your ${analysis.category} budget by ₦${Math.abs(analysis.remaining).toLocaleString()}`,
          amount: Math.abs(analysis.remaining),
        })
      }
      else if (analysis.status === 'near_limit') {
        alerts.push({
          type: 'warning',
          category: analysis.category,
          message: `You're approaching your ${analysis.category} budget limit (${analysis.utilizationRate.toFixed(1)}% used)`,
          amount: analysis.remaining,
        })
      }
    })

    // Generate recommendations
    const recommendations: BudgetAnalysis['recommendations'] = []

    // Find categories with significant under-spending
    const underSpentCategories = categoryAnalysis.filter(a => a.utilizationRate < 50 && a.budgeted > 10000)
    if (underSpentCategories.length > 0) {
      const totalUnderSpent = underSpentCategories.reduce((sum, cat) => sum + cat.remaining, 0)
      recommendations.push({
        type: 'reallocation',
        message: `You have ₦${totalUnderSpent.toLocaleString()} unspent across ${underSpentCategories.length} categories. Consider reallocating to savings or other priorities.`,
      })
    }

    // Suggest savings if overall utilization is low
    if (utilizationRate < 70 && totalRemaining > 20000) {
      recommendations.push({
        type: 'savings',
        message: `Great job staying under budget! Consider moving ₦${totalRemaining.toLocaleString()} to your savings goals.`,
        suggestedAmount: totalRemaining,
      })
    }

    // Suggest budget adjustments for consistently over-budget categories
    const overBudgetCategories = categoryAnalysis.filter(a => a.status === 'over_budget')
    if (overBudgetCategories.length > 0) {
      overBudgetCategories.forEach((category) => {
        recommendations.push({
          type: 'adjustment',
          message: `Consider increasing your ${category.category} budget by ₦${Math.abs(category.remaining).toLocaleString()} based on your spending pattern.`,
          category: category.category,
          suggestedAmount: Math.abs(category.remaining),
        })
      })
    }

    const analysis: BudgetAnalysis = {
      month,
      totalBudget,
      totalSpent,
      totalRemaining,
      utilizationRate,
      categoryAnalysis,
      alerts,
      recommendations,
    }

    return {
      success: true,
      data: analysis,
    }
  }
  catch (error: any) {
    console.error('Error analyzing budgets:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to analyze budgets',
    })
  }
})
