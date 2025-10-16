/**
 * Composable for financial calculations
 * Provides reactive access to financial calculation utilities
 */

import type { Ref } from 'vue'
import type { BudgetAnalysis, LoanCalculationResult, LoanDetails, SavingsGoalDetails, SavingsProjectionResult } from '../utils/financial-calculations'
import { computed } from 'vue'
import { formatNaira } from '../utils/currency'
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

} from '../utils/financial-calculations'

export function useFinancialCalculations() {
  // Loan calculations
  const calculateLoan = (loan: LoanDetails, currentDate?: Date): LoanCalculationResult => {
    return calculateLoanDetails(loan, currentDate)
  }

  const getMinimumPayment = (principal: number, interestRate: number, termInMonths: number): number => {
    return calculateMinimumPayment(principal, interestRate, termInMonths)
  }

  // Savings calculations
  const projectSavings = (savings: SavingsGoalDetails): SavingsProjectionResult => {
    return calculateSavingsProjection(savings)
  }

  const getRequiredContribution = (
    remainingAmount: number,
    monthsAvailable: number,
    interestRate: number = 0,
  ): number => {
    return calculateRequiredSavingsContribution(remainingAmount, monthsAvailable, interestRate)
  }

  // Budget analysis
  const analyzeBudgetPerformance = (
    budgets: Array<{ category: string, limit: number }>,
    expenses: Array<{ category: string, amount: number, date: Date }>,
    analysisMonth: string,
  ): BudgetAnalysis => {
    return analyzeBudget(budgets, expenses, analysisMonth)
  }

  // Utility calculations
  const getCompoundInterest = (
    principal: number,
    rate: number,
    time: number,
    compoundingFrequency: number = 12,
  ): number => {
    return calculateCompoundInterest(principal, rate, time, compoundingFrequency)
  }

  const getDebtToIncomeRatio = (monthlyDebtPayments: number, monthlyIncome: number): number => {
    return calculateDebtToIncomeRatio(monthlyDebtPayments, monthlyIncome)
  }

  const getEmergencyFundTarget = (monthlyExpenses: number, months: number = 6): number => {
    return calculateEmergencyFundTarget(monthlyExpenses, months)
  }

  const formatCurrency = (amount: number): string => {
    return formatNaira(amount)
  }

  const getPercentageChange = (oldValue: number, newValue: number): number => {
    return calculatePercentageChange(oldValue, newValue)
  }

  // Reactive calculations for common scenarios
  const calculateMonthlyBudgetHealth = (
    totalIncome: Ref<number>,
    totalExpenses: Ref<number>,
    totalSavings: Ref<number>,
  ) => {
    return computed(() => {
      const income = totalIncome.value
      const expenses = totalExpenses.value
      const savings = totalSavings.value

      const savingsRate = income > 0 ? (savings / income) * 100 : 0
      const expenseRatio = income > 0 ? (expenses / income) * 100 : 0
      const remainingIncome = income - expenses - savings

      return {
        savingsRate: Math.round(savingsRate * 100) / 100,
        expenseRatio: Math.round(expenseRatio * 100) / 100,
        remainingIncome,
        isHealthy: savingsRate >= 20 && expenseRatio <= 70, // 50/30/20 rule variation
        recommendations: {
          increaseSavings: savingsRate < 20,
          reduceExpenses: expenseRatio > 70,
          emergencyFund: getEmergencyFundTarget(expenses),
        },
      }
    })
  }

  const calculateLoanAffordability = (
    monthlyIncome: Ref<number>,
    existingDebtPayments: Ref<number>,
    proposedLoanPayment: Ref<number>,
  ) => {
    return computed(() => {
      const income = monthlyIncome.value
      const existingDebt = existingDebtPayments.value
      const proposedPayment = proposedLoanPayment.value

      const totalDebtPayments = existingDebt + proposedPayment
      const debtToIncomeRatio = getDebtToIncomeRatio(totalDebtPayments, income)

      return {
        debtToIncomeRatio,
        isAffordable: debtToIncomeRatio <= 36, // Standard DTI ratio
        maxAffordablePayment: Math.max(0, (income * 0.36) - existingDebt),
        riskLevel: debtToIncomeRatio <= 20
          ? 'low'
          : debtToIncomeRatio <= 36 ? 'moderate' : 'high',
      }
    })
  }

  const calculateSavingsGoalProgress = (
    currentAmount: Ref<number>,
    targetAmount: Ref<number>,
    monthlyContribution: Ref<number>,
    targetDate: Ref<Date>,
  ) => {
    return computed(() => {
      const current = currentAmount.value
      const target = targetAmount.value
      const contribution = monthlyContribution.value
      const deadline = targetDate.value

      const progressPercentage = target > 0 ? (current / target) * 100 : 0
      const remainingAmount = Math.max(0, target - current)

      const monthsToDeadline = Math.ceil(
        (deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30.44),
      )

      const requiredContribution = monthsToDeadline > 0
        ? getRequiredContribution(remainingAmount, monthsToDeadline)
        : 0

      const projectedCompletion = contribution > 0
        ? Math.ceil(remainingAmount / contribution)
        : Infinity

      return {
        progressPercentage: Math.round(progressPercentage * 100) / 100,
        remainingAmount,
        monthsToDeadline,
        requiredMonthlyContribution: requiredContribution,
        currentContributionSufficient: contribution >= requiredContribution,
        projectedCompletionMonths: projectedCompletion,
        onTrack: projectedCompletion <= monthsToDeadline,
      }
    })
  }

  return {
    // Direct calculation functions
    calculateLoan,
    getMinimumPayment,
    projectSavings,
    getRequiredContribution,
    analyzeBudgetPerformance,
    getCompoundInterest,
    getDebtToIncomeRatio,
    getEmergencyFundTarget,
    formatCurrency,
    getPercentageChange,

    // Reactive calculations
    calculateMonthlyBudgetHealth,
    calculateLoanAffordability,
    calculateSavingsGoalProgress,
  }
}
