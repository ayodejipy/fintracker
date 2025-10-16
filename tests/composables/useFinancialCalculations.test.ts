import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useFinancialCalculations } from '../../app/composables/useFinancialCalculations'

describe('useFinancialCalculations', () => {
  const {
    calculateLoan,
    getMinimumPayment,
    projectSavings,
    formatCurrency,
    calculateMonthlyBudgetHealth,
    calculateLoanAffordability,
    calculateSavingsGoalProgress,
  } = useFinancialCalculations()

  describe('direct calculations', () => {
    it('should calculate loan details', () => {
      const loan = {
        principal: 1000000,
        interestRate: 12,
        monthlyPayment: 50000,
        startDate: new Date('2024-01-01'),
      }

      const result = calculateLoan(loan, new Date('2024-06-01'))

      expect(result.remainingBalance).toBeLessThan(loan.principal)
      expect(result.totalInterestPaid).toBeGreaterThan(0)
    })

    it('should calculate minimum payment', () => {
      const payment = getMinimumPayment(1000000, 12, 24)

      expect(payment).toBeGreaterThan(40000)
      expect(payment).toBeLessThan(60000)
    })

    it('should project savings', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 2)

      const savings = {
        targetAmount: 1000000,
        currentAmount: 100000,
        monthlyContribution: 50000,
        targetDate: futureDate,
        interestRate: 6,
      }

      const result = projectSavings(savings)

      expect(result.monthsToGoal).toBeGreaterThan(0)
      expect(result.isAchievable).toBe(true)
    })

    it('should format currency', () => {
      expect(formatCurrency(1000000)).toBe('₦1,000,000')
      expect(formatCurrency(50000)).toBe('₦50,000')
    })
  })

  describe('reactive calculations', () => {
    it('should calculate monthly budget health', () => {
      const totalIncome = ref(500000)
      const totalExpenses = ref(300000)
      const totalSavings = ref(100000)

      const health = calculateMonthlyBudgetHealth(totalIncome, totalExpenses, totalSavings)

      expect(health.value.savingsRate).toBe(20) // 100k/500k = 20%
      expect(health.value.expenseRatio).toBe(60) // 300k/500k = 60%
      expect(health.value.remainingIncome).toBe(100000) // 500k - 300k - 100k
      expect(health.value.isHealthy).toBe(true) // 20% savings, 60% expenses

      // Test reactivity
      totalExpenses.value = 400000
      expect(health.value.expenseRatio).toBe(80) // 400k/500k = 80%
      expect(health.value.isHealthy).toBe(false) // Over 70% expenses
    })

    it('should calculate loan affordability', () => {
      const monthlyIncome = ref(500000)
      const existingDebtPayments = ref(50000)
      const proposedLoanPayment = ref(100000)

      const affordability = calculateLoanAffordability(monthlyIncome, existingDebtPayments, proposedLoanPayment)

      expect(affordability.value.debtToIncomeRatio).toBe(30) // (50k + 100k) / 500k = 30%
      expect(affordability.value.isAffordable).toBe(true) // 30% <= 36%
      expect(affordability.value.riskLevel).toBe('moderate')
      expect(affordability.value.maxAffordablePayment).toBe(130000) // (500k * 0.36) - 50k

      // Test with higher proposed payment
      proposedLoanPayment.value = 150000
      expect(affordability.value.debtToIncomeRatio).toBe(40) // (50k + 150k) / 500k = 40%
      expect(affordability.value.isAffordable).toBe(false) // 40% > 36%
      expect(affordability.value.riskLevel).toBe('high')
    })

    it('should calculate savings goal progress', () => {
      const currentAmount = ref(200000)
      const targetAmount = ref(1000000)
      const monthlyContribution = ref(50000)
      const targetDate = ref(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) // 1 year from now

      const progress = calculateSavingsGoalProgress(currentAmount, targetAmount, monthlyContribution, targetDate)

      expect(progress.value.progressPercentage).toBe(20) // 200k/1000k = 20%
      expect(progress.value.remainingAmount).toBe(800000) // 1000k - 200k
      expect(progress.value.monthsToDeadline).toBeGreaterThan(10)
      expect(progress.value.monthsToDeadline).toBeLessThan(15)
      expect(progress.value.projectedCompletionMonths).toBe(16) // 800k / 50k

      // Test reactivity
      currentAmount.value = 500000
      expect(progress.value.progressPercentage).toBe(50) // 500k/1000k = 50%
      expect(progress.value.remainingAmount).toBe(500000) // 1000k - 500k
      expect(progress.value.projectedCompletionMonths).toBe(10) // 500k / 50k
    })
  })

  describe('edge cases', () => {
    it('should handle zero income in budget health', () => {
      const totalIncome = ref(0)
      const totalExpenses = ref(100000)
      const totalSavings = ref(0)

      const health = calculateMonthlyBudgetHealth(totalIncome, totalExpenses, totalSavings)

      expect(health.value.savingsRate).toBe(0)
      expect(health.value.expenseRatio).toBe(0)
      expect(health.value.isHealthy).toBe(false)
    })

    it('should handle zero target amount in savings progress', () => {
      const currentAmount = ref(100000)
      const targetAmount = ref(0)
      const monthlyContribution = ref(10000)
      const targetDate = ref(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000))

      const progress = calculateSavingsGoalProgress(currentAmount, targetAmount, monthlyContribution, targetDate)

      expect(progress.value.progressPercentage).toBe(0)
      expect(progress.value.remainingAmount).toBe(0)
    })

    it('should handle past target date', () => {
      const currentAmount = ref(100000)
      const targetAmount = ref(1000000)
      const monthlyContribution = ref(50000)
      const targetDate = ref(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) // 1 year ago

      const progress = calculateSavingsGoalProgress(currentAmount, targetAmount, monthlyContribution, targetDate)

      expect(progress.value.monthsToDeadline).toBeLessThanOrEqual(0)
      expect(progress.value.onTrack).toBe(false)
    })
  })
})
