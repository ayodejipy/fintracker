import { cacheKeys, serverCache } from './cache'
import { prisma as db } from './database'

// Database query optimization utilities
export class DatabaseOptimizer {
  // Optimized transaction queries with proper indexing
  static async getTransactionsOptimized(userId: string, filters: {
    type?: 'income' | 'expense'
    category?: string
    startDate?: Date
    endDate?: Date
    minAmount?: number
    maxAmount?: number
    limit?: number
    offset?: number
  } = {}) {
    const {
      type,
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      limit = 50,
      offset = 0,
    } = filters

    // Build optimized where clause
    const where: any = { userId }

    if (type) { where.type = type }
    if (category) { where.category = category }
    if (startDate || endDate) {
      where.date = {}
      if (startDate) { where.date.gte = startDate }
      if (endDate) { where.date.lte = endDate }
    }
    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {}
      if (minAmount !== undefined) { where.amount.gte = minAmount }
      if (maxAmount !== undefined) { where.amount.lte = maxAmount }
    }

    // Use cursor-based pagination for better performance
    const transactions = await db.transaction.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      skip: offset,
      select: {
        id: true,
        amount: true,
        category: true,
        description: true,
        date: true,
        type: true,
        createdAt: true,
      },
    })

    return transactions
  }

  // Optimized dashboard data aggregation
  static async getDashboardDataOptimized(userId: string, period: 'current' | 'monthly' = 'current') {
    const key = cacheKeys.userDashboard(userId)

    // Check cache first
    const cached = serverCache.get(key)
    if (cached) { return cached }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Use raw SQL for better performance on aggregations
    const [incomeResult, expenseResult, budgetResult] = await Promise.all([
      // Total income for the month
      db.$queryRaw`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM "Transaction"
        WHERE "userId" = ${userId}
        AND type = 'income'
        AND date >= ${startOfMonth}
        AND date <= ${endOfMonth}
      `,

      // Total expenses for the month
      db.$queryRaw`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM "Transaction"
        WHERE "userId" = ${userId}
        AND type = 'expense'
        AND date >= ${startOfMonth}
        AND date <= ${endOfMonth}
      `,

      // Budget summary
      db.budget.aggregate({
        where: {
          userId,
          month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        },
        _sum: {
          monthlyLimit: true,
          currentSpent: true,
        },
        _count: true,
      }),
    ])

    const totalIncome = Number((incomeResult as any)[0]?.total || 0)
    const totalExpenses = Number((expenseResult as any)[0]?.total || 0)
    const netIncome = totalIncome - totalExpenses

    const dashboardData = {
      totalIncome,
      totalExpenses,
      netIncome,
      totalBudgets: budgetResult._count,
      totalBudgetLimit: Number(budgetResult._sum.monthlyLimit || 0),
      totalBudgetSpent: Number(budgetResult._sum.currentSpent || 0),
      period,
      lastUpdated: new Date(),
    }

    // Cache for 5 minutes
    serverCache.set(key, dashboardData)
    return dashboardData
  }

  // Optimized budget analysis with aggregations
  static async getBudgetAnalysisOptimized(userId: string, month?: string) {
    const targetMonth = month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    const key = cacheKeys.userBudgets(userId)

    const cached = serverCache.get(key)
    if (cached) { return cached }

    // Single query to get budget analysis
    const budgets = await db.budget.findMany({
      where: {
        userId,
        month: targetMonth,
      },
      select: {
        id: true,
        category: true,
        monthlyLimit: true,
        currentSpent: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    const analysis = {
      totalBudgets: budgets.length,
      totalLimit: budgets.reduce((sum, b) => sum + Number(b.monthlyLimit), 0),
      totalSpent: budgets.reduce((sum, b) => sum + Number(b.currentSpent), 0),
      categories: budgets.map(budget => ({
        ...budget,
        utilizationPercentage: Number(budget.currentSpent) / Number(budget.monthlyLimit) * 100,
        remainingAmount: Number(budget.monthlyLimit) - Number(budget.currentSpent),
        isOverBudget: Number(budget.currentSpent) > Number(budget.monthlyLimit),
      })),
      month: targetMonth,
      lastUpdated: new Date(),
    }

    serverCache.set(key, analysis)
    return analysis
  }

  // Batch operations for better performance
  static async batchUpdateBudgets(userId: string, updates: Array<{ id: string, currentSpent: number }>) {
    // Use transaction for consistency
    await db.$transaction(async (tx) => {
      const updatePromises = updates.map(update =>
        tx.budget.update({
          where: { id: update.id, userId },
          data: { currentSpent: update.currentSpent, updatedAt: new Date() },
        }),
      )

      await Promise.all(updatePromises)
    })

    // Invalidate related caches
    serverCache.clear()
  }

  // Optimized loan calculations with caching
  static async getLoanProjectionsOptimized(userId: string) {
    const key = cacheKeys.userLoans(userId)

    const cached = serverCache.get(key)
    if (cached) { return cached }

    const loans = await db.loan.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        initialAmount: true,
        currentBalance: true,
        monthlyPayment: true,
        interestRate: true,
        startDate: true,
      },
    })

    const projections = loans.map((loan) => {
      const monthlyRate = Number(loan.interestRate) / 100 / 12
      const balance = Number(loan.currentBalance)
      const payment = Number(loan.monthlyPayment)

      if (monthlyRate === 0) {
        return {
          ...loan,
          monthsToPayoff: Math.ceil(balance / payment),
          totalInterest: 0,
          payoffDate: new Date(Date.now() + (Math.ceil(balance / payment) * 30 * 24 * 60 * 60 * 1000)),
        }
      }

      const monthsToPayoff = Math.ceil(
        -Math.log(1 - (balance * monthlyRate) / payment) / Math.log(1 + monthlyRate),
      )

      const totalInterest = (payment * monthsToPayoff) - balance
      const payoffDate = new Date(Date.now() + (monthsToPayoff * 30 * 24 * 60 * 60 * 1000))

      return {
        ...loan,
        monthsToPayoff,
        totalInterest,
        payoffDate,
      }
    })

    serverCache.set(key, projections) // Cache for default duration
    return projections
  }
}

// Query builder for complex financial queries
export class FinancialQueryBuilder {
  private userId: string
  private baseQuery: any = {}
  private aggregations: any[] = []
  private groupBy: string[] = []
  private orderBy: any[] = []
  private limitValue?: number
  private offsetValue?: number

  constructor(userId: string) {
    this.userId = userId
    this.baseQuery.userId = userId
  }

  filterByDateRange(startDate: Date, endDate: Date) {
    this.baseQuery.date = {
      gte: startDate,
      lte: endDate,
    }
    return this
  }

  filterByType(type: 'income' | 'expense') {
    this.baseQuery.type = type
    return this
  }

  filterByCategory(category: string) {
    this.baseQuery.category = category
    return this
  }

  filterByAmountRange(min?: number, max?: number) {
    if (min !== undefined || max !== undefined) {
      this.baseQuery.amount = {}
      if (min !== undefined) { this.baseQuery.amount.gte = min }
      if (max !== undefined) { this.baseQuery.amount.lte = max }
    }
    return this
  }

  addAggregation(field: string, operation: 'sum' | 'avg' | 'count' | 'min' | 'max') {
    this.aggregations.push({ field, operation })
    return this
  }

  groupByField(field: string) {
    this.groupBy.push(field)
    return this
  }

  orderByField(field: string, direction: 'asc' | 'desc' = 'desc') {
    this.orderBy.push({ [field]: direction })
    return this
  }

  limit(count: number) {
    this.limitValue = count
    return this
  }

  offset(count: number) {
    this.offsetValue = count
    return this
  }

  async execute() {
    const query: any = {
      where: this.baseQuery,
    }

    if (this.aggregations.length > 0) {
      // Build aggregation query
      const aggregateQuery: any = {}

      for (const agg of this.aggregations) {
        if (!aggregateQuery[`_${agg.operation}`]) {
          aggregateQuery[`_${agg.operation}`] = {}
        }
        aggregateQuery[`_${agg.operation}`][agg.field] = true
      }

      query._count = true
      Object.assign(query, aggregateQuery)

      return await db.transaction.aggregate(query)
    }
    else {
      // Build regular query
      if (this.orderBy.length > 0) { query.orderBy = this.orderBy }
      if (this.limitValue) { query.take = this.limitValue }
      if (this.offsetValue) { query.skip = this.offsetValue }

      return await db.transaction.findMany(query)
    }
  }
}

// Database health monitoring
export class DatabaseHealthMonitor {
  static async getHealthMetrics() {
    try {
      const [connectionInfo, tableStats, cacheHitRatio] = await Promise.all([
        db.$queryRaw`
          SELECT 
            count(*) as total_connections,
            count(*) FILTER (WHERE state = 'active') as active_connections,
            count(*) FILTER (WHERE state = 'idle') as idle_connections
          FROM pg_stat_activity
        `,

        db.$queryRaw`
          SELECT 
            schemaname,
            tablename,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes,
            n_live_tup as live_tuples,
            n_dead_tup as dead_tuples
          FROM pg_stat_user_tables
          ORDER BY n_live_tup DESC
        `,

        db.$queryRaw`
          SELECT 
            sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio
          FROM pg_statio_user_tables
        `,
      ])

      return {
        connections: connectionInfo,
        tables: tableStats,
        cacheHitRatio: Number((cacheHitRatio as any)[0]?.cache_hit_ratio || 0),
        timestamp: new Date(),
      }
    }
    catch (error) {
      console.error('Failed to get database health metrics:', error)
      return null
    }
  }

  static async getRecommendations() {
    const health = await this.getHealthMetrics()
    if (!health) { return [] }

    const recommendations = []

    if (health.cacheHitRatio < 95) {
      recommendations.push({
        type: 'performance',
        severity: 'medium',
        message: `Cache hit ratio is ${health.cacheHitRatio.toFixed(1)}%. Consider increasing shared_buffers.`,
        action: 'Optimize database configuration',
      })
    }

    return recommendations
  }
}
