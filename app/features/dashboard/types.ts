export interface FinancialOverview {
  totalIncome: number
  totalExpenses: number
  savings: number
  savingsRate: number
}

export interface DashboardData {
  overview: FinancialOverview
  monthlyTrend: MonthlyTrend[]
  categoryBreakdown: CategoryBreakdown[]
}

export interface MonthlyTrend {
  month: string
  income: number
  expenses: number
  savings: number
}

export interface CategoryBreakdown {
  category: string
  amount: number
  percentage: number
}
