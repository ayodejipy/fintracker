import type { ExpenseCategory } from '../transactions/types'

export interface Budget {
  id: string
  userId: string
  category: ExpenseCategory
  monthlyLimit: number
  currentSpent: number
  month: string // YYYY-MM format
  createdAt: Date
  updatedAt: Date
}

export interface CreateBudgetInput {
  category: ExpenseCategory
  monthlyLimit: number
  savingsTarget: number
}

export interface BudgetAnalysis {
  totalBudget: number
  spent: number
  remaining: number
  categoryBreakdown: CategorySpending[]
}

export interface CategorySpending {
  category: ExpenseCategory
  budgeted: number
  spent: number
  remaining: number
  percentage: number
}

export interface SavingsGoal {
  id: string
  userId: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: Date
  monthlyContribution: number
  createdAt: Date
  updatedAt: Date
}
