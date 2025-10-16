/**
 * Financial calculation utilities for the personal finance dashboard
 * Includes loan calculations, savings projections, and budget analysis
 */

// Loan calculation interfaces
export interface LoanDetails {
  principal: number
  interestRate: number // Annual interest rate as percentage (e.g., 5.5 for 5.5%)
  monthlyPayment: number
  startDate: Date
}

export interface LoanCalculationResult {
  remainingBalance: number
  totalInterestPaid: number
  monthsRemaining: number
  payoffDate: Date
  monthlyBreakdown: MonthlyPaymentBreakdown[]
}

export interface MonthlyPaymentBreakdown {
  month: number
  date: Date
  payment: number
  principal: number
  interest: number
  remainingBalance: number
}

// Savings calculation interfaces
export interface SavingsGoalDetails {
  targetAmount: number
  currentAmount: number
  monthlyContribution: number
  targetDate: Date
  interestRate?: number // Optional annual interest rate for compound growth
}

export interface SavingsProjectionResult {
  monthsToGoal: number
  projectedCompletionDate: Date
  totalContributions: number
  interestEarned: number
  isAchievable: boolean
  requiredMonthlyContribution: number
  monthlyProjections: MonthlySavingsProjection[]
}

export interface MonthlySavingsProjection {
  month: number
  date: Date
  contribution: number
  interestEarned: number
  totalAmount: number
}

// Budget analysis interfaces
export interface BudgetAnalysis {
  totalBudget: number
  totalSpent: number
  remainingBudget: number
  utilizationPercentage: number
  categoryBreakdown: CategoryBudgetAnalysis[]
  isOverBudget: boolean
  projectedMonthlySpending: number
}

export interface CategoryBudgetAnalysis {
  category: string
  budgeted: number
  spent: number
  remaining: number
  utilizationPercentage: number
  isOverBudget: boolean
}

/**
 * Calculate loan payment details and remaining balance
 */
export function calculateLoanDetails(loan: LoanDetails, currentDate: Date = new Date()): LoanCalculationResult {
  const monthlyInterestRate = loan.interestRate / 100 / 12
  const startDate = new Date(loan.startDate)
  const monthsElapsed = Math.max(0, Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)))

  let remainingBalance = loan.principal
  let totalInterestPaid = 0
  const monthlyBreakdown: MonthlyPaymentBreakdown[] = []

  // Calculate payments up to current date
  for (let month = 1; month <= monthsElapsed; month++) {
    const interestPayment = remainingBalance * monthlyInterestRate
    const principalPayment = Math.min(loan.monthlyPayment - interestPayment, remainingBalance)

    remainingBalance -= principalPayment
    totalInterestPaid += interestPayment

    const paymentDate = new Date(startDate)
    paymentDate.setMonth(paymentDate.getMonth() + month - 1)

    monthlyBreakdown.push({
      month,
      date: paymentDate,
      payment: loan.monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      remainingBalance,
    })

    if (remainingBalance <= 0) { break }
  }

  // Calculate remaining months to payoff
  let tempBalance = remainingBalance
  let monthsRemaining = 0

  while (tempBalance > 0 && monthsRemaining < 600) { // Max 50 years
    const interestPayment = tempBalance * monthlyInterestRate
    const principalPayment = Math.min(loan.monthlyPayment - interestPayment, tempBalance)

    if (principalPayment <= 0) {
      // Payment doesn't cover interest, loan will never be paid off
      monthsRemaining = Infinity
      break
    }

    tempBalance -= principalPayment
    monthsRemaining++
  }

  const payoffDate = new Date(currentDate)
  if (monthsRemaining !== Infinity) {
    payoffDate.setMonth(payoffDate.getMonth() + monthsRemaining)
  }

  return {
    remainingBalance: Math.max(0, remainingBalance),
    totalInterestPaid,
    monthsRemaining,
    payoffDate,
    monthlyBreakdown,
  }
}

/**
 * Calculate minimum monthly payment for a loan
 */
export function calculateMinimumPayment(principal: number, interestRate: number, termInMonths: number): number {
  const monthlyInterestRate = interestRate / 100 / 12

  if (monthlyInterestRate === 0) {
    return principal / termInMonths
  }

  const payment = principal * (monthlyInterestRate * (1 + monthlyInterestRate) ** termInMonths)
    / ((1 + monthlyInterestRate) ** termInMonths - 1)

  return Math.round(payment * 100) / 100
}

/**
 * Calculate savings goal projections
 */
export function calculateSavingsProjection(savings: SavingsGoalDetails): SavingsProjectionResult {
  const monthlyInterestRate = (savings.interestRate || 0) / 100 / 12
  const targetDate = new Date(savings.targetDate)
  const currentDate = new Date()
  const maxMonthsToTarget = Math.ceil((targetDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44))

  let currentAmount = savings.currentAmount
  let totalContributions = 0
  let totalInterestEarned = 0
  const monthlyProjections: MonthlySavingsProjection[] = []

  let monthsToGoal = 0
  let projectedCompletionDate = new Date(currentDate)

  // Calculate month by month until goal is reached or max time exceeded
  for (let month = 1; month <= Math.max(maxMonthsToTarget, 600); month++) {
    const interestEarned = currentAmount * monthlyInterestRate
    currentAmount += savings.monthlyContribution + interestEarned
    totalContributions += savings.monthlyContribution
    totalInterestEarned += interestEarned

    const projectionDate = new Date(currentDate)
    projectionDate.setMonth(projectionDate.getMonth() + month)

    monthlyProjections.push({
      month,
      date: projectionDate,
      contribution: savings.monthlyContribution,
      interestEarned,
      totalAmount: currentAmount,
    })

    if (currentAmount >= savings.targetAmount && monthsToGoal === 0) {
      monthsToGoal = month
      projectedCompletionDate = new Date(projectionDate)
    }

    // Stop if we've reached the goal or gone too far
    if (monthsToGoal > 0 && month > monthsToGoal + 12) { break }
  }

  // Calculate required monthly contribution to meet target date
  const remainingAmount = Math.max(0, savings.targetAmount - savings.currentAmount)
  const requiredMonthlyContribution = maxMonthsToTarget > 0
    ? calculateRequiredSavingsContribution(remainingAmount, maxMonthsToTarget, savings.interestRate || 0)
    : remainingAmount // If no time available, return the full remaining amount

  const isAchievable = monthsToGoal > 0 && monthsToGoal <= maxMonthsToTarget && maxMonthsToTarget > 0

  return {
    monthsToGoal: monthsToGoal || Infinity,
    projectedCompletionDate,
    totalContributions,
    interestEarned: totalInterestEarned,
    isAchievable,
    requiredMonthlyContribution,
    monthlyProjections: monthlyProjections.slice(0, Math.min(monthsToGoal || 60, 60)),
  }
}

/**
 * Calculate required monthly contribution to reach savings goal by target date
 */
export function calculateRequiredSavingsContribution(
  remainingAmount: number,
  monthsAvailable: number,
  interestRate: number = 0,
): number {
  if (monthsAvailable <= 0) { return Infinity }

  const monthlyInterestRate = interestRate / 100 / 12

  if (monthlyInterestRate === 0) {
    return remainingAmount / monthsAvailable
  }

  // Future value of annuity formula solved for payment
  const contribution = remainingAmount
    / ((((1 + monthlyInterestRate) ** monthsAvailable - 1) / monthlyInterestRate))

  return Math.round(contribution * 100) / 100
}

/**
 * Analyze budget performance
 */
export function analyzeBudget(
  budgets: Array<{ category: string, limit: number }>,
  expenses: Array<{ category: string, amount: number, date: Date }>,
  analysisMonth: string, // YYYY-MM format
): BudgetAnalysis {
  const [year, month] = analysisMonth.split('-').map(Number)

  // Filter expenses for the analysis month
  const monthlyExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date)
    return expenseDate.getFullYear() === year && expenseDate.getMonth() === month - 1
  })

  const categoryBreakdown: CategoryBudgetAnalysis[] = budgets.map((budget) => {
    const categoryExpenses = monthlyExpenses
      .filter(expense => expense.category === budget.category)
      .reduce((sum, expense) => sum + expense.amount, 0)

    const remaining = budget.limit - categoryExpenses
    const utilizationPercentage = budget.limit > 0 ? (categoryExpenses / budget.limit) * 100 : 0

    return {
      category: budget.category,
      budgeted: budget.limit,
      spent: categoryExpenses,
      remaining,
      utilizationPercentage,
      isOverBudget: categoryExpenses > budget.limit,
    }
  })

  const totalBudget = budgets.reduce((sum, budget) => sum + budget.limit, 0)
  const totalSpent = categoryBreakdown.reduce((sum, category) => sum + category.spent, 0)
  const remainingBudget = totalBudget - totalSpent
  const utilizationPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  // Project monthly spending based on current pace
  const currentDate = new Date()
  const daysInMonth = new Date(year, month, 0).getDate()
  const daysPassed = currentDate.getFullYear() === year && currentDate.getMonth() === month - 1
    ? currentDate.getDate()
    : daysInMonth

  const projectedMonthlySpending = daysPassed > 0 ? (totalSpent / daysPassed) * daysInMonth : totalSpent

  return {
    totalBudget,
    totalSpent,
    remainingBudget,
    utilizationPercentage,
    categoryBreakdown,
    isOverBudget: totalSpent > totalBudget,
    projectedMonthlySpending,
  }
}

/**
 * Calculate compound interest
 */
export function calculateCompoundInterest(
  principal: number,
  rate: number,
  time: number,
  compoundingFrequency: number = 12,
): number {
  const amount = principal * (1 + (rate / 100) / compoundingFrequency) ** (compoundingFrequency * time)
  return Math.round((amount - principal) * 100) / 100
}

/**
 * Calculate debt-to-income ratio
 */
export function calculateDebtToIncomeRatio(monthlyDebtPayments: number, monthlyIncome: number): number {
  if (monthlyIncome <= 0) { return 0 }
  return Math.round((monthlyDebtPayments / monthlyIncome) * 100 * 100) / 100
}

/**
 * Calculate emergency fund recommendation (3-6 months of expenses)
 */
export function calculateEmergencyFundTarget(monthlyExpenses: number, months: number = 6): number {
  return monthlyExpenses * months
}

/**
 * Format currency in Nigerian Naira (compact version for calculations)
 */
export function formatNairaCompact(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) { return newValue > 0 ? 100 : 0 }
  return Math.round(((newValue - oldValue) / oldValue) * 100 * 100) / 100
}

/**
 * Calculate loan projection for API endpoints
 */
export interface LoanProjectionInput {
  principal: number
  monthlyPayment: number
  annualInterestRate: number
  startDate: Date
}

export interface LoanProjectionResult {
  totalInterest: number
  totalPayments: number
  monthsToPayoff: number
  payoffDate: Date | null
}

export function calculateLoanProjection(input: LoanProjectionInput): LoanProjectionResult {
  const { principal, monthlyPayment, annualInterestRate, startDate } = input
  const monthlyInterestRate = annualInterestRate / 12

  if (monthlyPayment <= 0 || principal <= 0) {
    return {
      totalInterest: 0,
      totalPayments: 0,
      monthsToPayoff: 0,
      payoffDate: null,
    }
  }

  let remainingBalance = principal
  let totalInterest = 0
  let monthsToPayoff = 0

  // Calculate until loan is paid off or max iterations reached
  while (remainingBalance > 0.01 && monthsToPayoff < 600) { // Max 50 years
    const interestPayment = remainingBalance * monthlyInterestRate
    const principalPayment = Math.min(monthlyPayment - interestPayment, remainingBalance)

    // If payment doesn't cover interest, loan will never be paid off
    if (principalPayment <= 0) {
      return {
        totalInterest: 0,
        totalPayments: 0,
        monthsToPayoff: Infinity,
        payoffDate: null,
      }
    }

    remainingBalance -= principalPayment
    totalInterest += interestPayment
    monthsToPayoff++
  }

  const payoffDate = new Date(startDate)
  payoffDate.setMonth(payoffDate.getMonth() + monthsToPayoff)

  return {
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPayments: Math.round((monthsToPayoff * monthlyPayment) * 100) / 100,
    monthsToPayoff,
    payoffDate,
  }
}

/**
 * Calculate amortization schedule
 */
export interface AmortizationScheduleInput {
  principal: number
  monthlyPayment: number
  annualInterestRate: number
  startDate: Date
  maxMonths?: number
}

export interface AmortizationScheduleItem {
  month: number
  date: Date
  payment: number
  principal: number
  interest: number
  balance: number
}

export function calculateAmortizationSchedule(input: AmortizationScheduleInput): AmortizationScheduleItem[] {
  const { principal, monthlyPayment, annualInterestRate, startDate, maxMonths = 12 } = input
  const monthlyInterestRate = annualInterestRate / 12

  const schedule: AmortizationScheduleItem[] = []
  let remainingBalance = principal

  for (let month = 1; month <= maxMonths && remainingBalance > 0.01; month++) {
    const interestPayment = remainingBalance * monthlyInterestRate
    const principalPayment = Math.min(monthlyPayment - interestPayment, remainingBalance)

    // If payment doesn't cover interest, stop
    if (principalPayment <= 0) { break }

    remainingBalance -= principalPayment

    const paymentDate = new Date(startDate)
    paymentDate.setMonth(paymentDate.getMonth() + month - 1)

    schedule.push({
      month,
      date: paymentDate,
      payment: Math.min(monthlyPayment, interestPayment + principalPayment),
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interestPayment * 100) / 100,
      balance: Math.round(Math.max(0, remainingBalance) * 100) / 100,
    })
  }

  return schedule
}
