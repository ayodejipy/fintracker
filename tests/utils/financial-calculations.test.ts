import type { LoanDetails, SavingsGoalDetails } from '../../app/utils/financial-calculations'
import { describe, expect, it } from 'vitest'
import { formatNaira } from '../../app/utils/currency'
import {
  analyzeBudget,
  calculateCompoundInterest,
  calculateDebtToIncomeRatio,
  calculateEmergencyFundTarget,
  calculateLoanDetails,
  calculateMinimumPayment,
  calculatePercentageChange,
  calculateRequiredSavingsContribution,
  calculateSavingsProjection,

} from '../../app/utils/financial-calculations'

describe('financial Calculations', () => {
  describe('loan Calculations', () => {
    it('should calculate loan details correctly', () => {
      const loan: LoanDetails = {
        principal: 1000000, // ₦1M
        interestRate: 12, // 12% annual
        monthlyPayment: 50000, // ₦50k monthly
        startDate: new Date('2024-01-01'),
      }

      const currentDate = new Date('2024-06-01') // 5 months later
      const result = calculateLoanDetails(loan, currentDate)

      expect(result.remainingBalance).toBeLessThan(loan.principal)
      expect(result.totalInterestPaid).toBeGreaterThan(0)
      expect(result.monthsRemaining).toBeGreaterThan(0)
      expect(result.monthlyBreakdown.length).toBeGreaterThan(0) // Should have some payments

      // Check that payments are being calculated
      const firstPayment = result.monthlyBreakdown[0]
      expect(firstPayment.payment).toBe(50000)
      expect(firstPayment.interest).toBeGreaterThan(0)
      expect(firstPayment.principal).toBeGreaterThan(0)
    })

    it('should handle loan with zero interest rate', () => {
      const loan: LoanDetails = {
        principal: 600000,
        interestRate: 0,
        monthlyPayment: 50000,
        startDate: new Date('2024-01-01'),
      }

      const result = calculateLoanDetails(loan, new Date('2024-02-01'))

      expect(result.monthlyBreakdown[0].interest).toBe(0)
      expect(result.monthlyBreakdown[0].principal).toBe(50000)
      expect(result.monthsRemaining).toBe(11) // 600k / 50k = 12 months, 1 already passed
    })

    it('should calculate minimum payment correctly', () => {
      const payment = calculateMinimumPayment(1000000, 12, 24) // ₦1M, 12%, 24 months

      expect(payment).toBeGreaterThan(40000)
      expect(payment).toBeLessThan(60000)
      expect(typeof payment).toBe('number')
    })

    it('should handle minimum payment with zero interest', () => {
      const payment = calculateMinimumPayment(600000, 0, 12)

      expect(payment).toBe(50000) // 600k / 12 months
    })
  })

  describe('savings Calculations', () => {
    it('should calculate savings projection correctly', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 3) // 3 years from now

      const savings: SavingsGoalDetails = {
        targetAmount: 1000000, // ₦1M target
        currentAmount: 100000, // ₦100k current
        monthlyContribution: 50000, // ₦50k monthly
        targetDate: futureDate,
        interestRate: 6, // 6% annual
      }

      const result = calculateSavingsProjection(savings)

      expect(result.monthsToGoal).toBeGreaterThan(0)
      expect(result.monthsToGoal).toBeLessThan(30) // Should reach goal in reasonable time
      expect(result.totalContributions).toBeGreaterThan(0)
      expect(result.interestEarned).toBeGreaterThan(0)
      expect(result.isAchievable).toBe(true)
      expect(result.monthlyProjections.length).toBeGreaterThan(0)
    })

    it('should handle savings goal without interest', () => {
      const savings: SavingsGoalDetails = {
        targetAmount: 500000,
        currentAmount: 100000,
        monthlyContribution: 40000,
        targetDate: new Date('2025-12-31'),
      }

      const result = calculateSavingsProjection(savings)

      expect(result.interestEarned).toBe(0)
      expect(result.monthsToGoal).toBe(10) // (500k - 100k) / 40k = 10 months
    })

    it('should calculate required monthly contribution', () => {
      const required = calculateRequiredSavingsContribution(400000, 12, 6) // ₦400k in 12 months at 6%

      expect(required).toBeGreaterThan(30000)
      expect(required).toBeLessThan(40000)
    })

    it('should handle required contribution with zero interest', () => {
      const required = calculateRequiredSavingsContribution(600000, 12, 0)

      expect(required).toBe(50000) // 600k / 12 months
    })
  })

  describe('budget Analysis', () => {
    it('should analyze budget correctly', () => {
      const budgets = [
        { category: 'food', limit: 100000 },
        { category: 'transport', limit: 50000 },
        { category: 'rent', limit: 200000 },
      ]

      const expenses = [
        { category: 'food', amount: 80000, date: new Date('2024-06-15') },
        { category: 'transport', amount: 60000, date: new Date('2024-06-10') }, // Over budget
        { category: 'rent', amount: 200000, date: new Date('2024-06-01') },
      ]

      const analysis = analyzeBudget(budgets, expenses, '2024-06')

      expect(analysis.totalBudget).toBe(350000)
      expect(analysis.totalSpent).toBe(340000)
      expect(analysis.remainingBudget).toBe(10000)
      expect(analysis.utilizationPercentage).toBeCloseTo(97.14, 1)
      expect(analysis.isOverBudget).toBe(false)

      // Check category breakdown
      const transportCategory = analysis.categoryBreakdown.find(c => c.category === 'transport')
      expect(transportCategory?.isOverBudget).toBe(true)
      expect(transportCategory?.utilizationPercentage).toBe(120)
    })

    it('should handle empty expenses', () => {
      const budgets = [{ category: 'food', limit: 100000 }]
      const expenses: Array<{ category: string, amount: number, date: Date }> = []

      const analysis = analyzeBudget(budgets, expenses, '2024-06')

      expect(analysis.totalSpent).toBe(0)
      expect(analysis.remainingBudget).toBe(100000)
      expect(analysis.utilizationPercentage).toBe(0)
      expect(analysis.isOverBudget).toBe(false)
    })
  })

  describe('utility Functions', () => {
    it('should calculate compound interest correctly', () => {
      const interest = calculateCompoundInterest(100000, 6, 2) // ₦100k at 6% for 2 years

      expect(interest).toBeGreaterThan(12000) // Should be more than simple interest
      expect(interest).toBeLessThan(13000)
    })

    it('should calculate debt-to-income ratio', () => {
      const ratio = calculateDebtToIncomeRatio(150000, 500000) // ₦150k debt, ₦500k income

      expect(ratio).toBe(30) // 30%
    })

    it('should handle zero income for debt-to-income ratio', () => {
      const ratio = calculateDebtToIncomeRatio(150000, 0)

      expect(ratio).toBe(0)
    })

    it('should calculate emergency fund target', () => {
      const target = calculateEmergencyFundTarget(200000, 6) // ₦200k monthly expenses, 6 months

      expect(target).toBe(1200000) // ₦1.2M
    })

    it('should format Naira currency correctly', () => {
      expect(formatNaira(1000000)).toBe('₦1,000,000')
      expect(formatNaira(50000)).toBe('₦50,000')
      expect(formatNaira(0)).toBe('₦0')
    })

    it('should calculate percentage change correctly', () => {
      expect(calculatePercentageChange(100, 150)).toBe(50) // 50% increase
      expect(calculatePercentageChange(200, 150)).toBe(-25) // 25% decrease
      expect(calculatePercentageChange(0, 100)).toBe(100) // From zero
      expect(calculatePercentageChange(100, 0)).toBe(-100) // To zero
    })
  })

  describe('edge Cases', () => {
    it('should handle very small loan payments', () => {
      const loan: LoanDetails = {
        principal: 1000000,
        interestRate: 15,
        monthlyPayment: 5000, // Very small payment
        startDate: new Date('2024-01-01'),
      }

      const result = calculateLoanDetails(loan, new Date('2024-02-01'))

      // Payment might not even cover interest
      expect(result.monthsRemaining).toBeGreaterThan(100)
    })

    it('should handle unrealistic savings goals', () => {
      const savings: SavingsGoalDetails = {
        targetAmount: 10000000, // ₦10M target
        currentAmount: 0,
        monthlyContribution: 10000, // Only ₦10k monthly
        targetDate: new Date('2025-01-01'), // 1 year
      }

      const result = calculateSavingsProjection(savings)

      expect(result.isAchievable).toBe(false)
      expect(result.requiredMonthlyContribution).toBeGreaterThan(0)
    })

    it('should handle negative values gracefully', () => {
      expect(() => calculateMinimumPayment(-100000, 12, 24)).not.toThrow()
      expect(() => calculateCompoundInterest(-50000, 6, 2)).not.toThrow()
    })
  })
})
