import type { CurrencyCode } from '~/utils/currency'
import { computed, ref } from 'vue'
import {
  amountToWords,

  formatCurrency,
  formatCurrencyCompact,
  formatNigerianDate,
  formatNigerianDateShort,
  formatNigerianNumber,
  formatNigerianTime,
  getCurrencyDetails,
  getNigerianExpenseCategories,
  getSupportedCurrencies,
  parseCurrency,
} from '~/utils/currency'

export function useCurrency() {
  // Default to NGN but can be changed by user preference
  const currentCurrency = ref<CurrencyCode>('NGN')

  // Get user's preferred currency from auth store or localStorage
  const { user } = useAuth()
  if (user.value?.user?.currency) {
    currentCurrency.value = user.value.user.currency as CurrencyCode
  }

  // Computed properties
  const currencyDetails = computed(() => getCurrencyDetails(currentCurrency.value))
  const supportedCurrencies = computed(() => getSupportedCurrencies())
  const expenseCategories = computed(() => getNigerianExpenseCategories())

  // Currency formatting functions
  const format = (amount: number, currency?: CurrencyCode) => {
    return formatCurrency(amount, currency || currentCurrency.value)
  }

  const formatCompact = (amount: number, currency?: CurrencyCode) => {
    return formatCurrencyCompact(amount, currency || currentCurrency.value)
  }

  const parse = (currencyString: string) => {
    return parseCurrency(currencyString)
  }

  const formatNumber = (num: number) => {
    return formatNigerianNumber(num)
  }

  const toWords = (amount: number, currency?: CurrencyCode) => {
    return amountToWords(amount, currency || currentCurrency.value)
  }

  // Date formatting functions
  const formatDate = (date: Date | string) => {
    return formatNigerianDate(date)
  }

  const formatDateShort = (date: Date | string) => {
    return formatNigerianDateShort(date)
  }

  const formatTime = (date: Date | string) => {
    return formatNigerianTime(date)
  }

  // Currency management functions
  const setCurrency = async (currency: CurrencyCode) => {
    currentCurrency.value = currency

    // Update user preference in database if user is logged in
    if (user.value?.user) {
      try {
        await $fetch('/api/user/currency', {
          method: 'PUT',
          body: { currency },
        })
      }
      catch (error) {
        console.error('Failed to update currency preference:', error)
      }
    }
  }

  const getCurrencySymbol = (currency?: CurrencyCode) => {
    const details = getCurrencyDetails(currency || currentCurrency.value)
    return details.symbol
  }

  const getCurrencyName = (currency?: CurrencyCode) => {
    const details = getCurrencyDetails(currency || currentCurrency.value)
    return details.name
  }

  const getCurrencyFlag = (currency?: CurrencyCode) => {
    const details = getCurrencyDetails(currency || currentCurrency.value)
    return details.flag
  }

  // Validation functions
  const isValidAmount = (amount: number): boolean => {
    return !Number.isNaN(amount) && amount >= 0 && Number.isFinite(amount)
  }

  const validateCurrencyInput = (input: string): { isValid: boolean, amount?: number, error?: string } => {
    if (!input.trim()) {
      return { isValid: false, error: 'Amount is required' }
    }

    const amount = parse(input)

    if (!isValidAmount(amount)) {
      return { isValid: false, error: 'Please enter a valid amount' }
    }

    if (amount > 999999999999) {
      return { isValid: false, error: 'Amount is too large' }
    }

    return { isValid: true, amount }
  }

  // Utility functions for financial calculations
  const calculatePercentage = (amount: number, total: number): number => {
    if (total === 0) { return 0 }
    return Math.round((amount / total) * 100)
  }

  const calculateGrowth = (current: number, previous: number): { percentage: number, isPositive: boolean } => {
    if (previous === 0 && current === 0) { return { percentage: 0, isPositive: true } }
    if (previous === 0) { return { percentage: 0, isPositive: current >= 0 } }

    const growth = ((current - previous) / previous) * 100
    return {
      percentage: Math.abs(Math.round(growth)),
      isPositive: growth >= 0,
    }
  }

  // Enhanced growth calculation with context awareness
  const calculateContextualGrowth = (
    current: number,
    previous: number,
    context: 'positive' | 'negative' = 'positive',
  ): {
    percentage: number
    isPositive: boolean
    isGood: boolean
    showIndicator: boolean
  } => {
    // Handle zero cases
    if (previous === 0 && current === 0) {
      return { percentage: 0, isPositive: true, isGood: true, showIndicator: false }
    }

    if (previous === 0) {
      const isPositive = current >= 0
      const isGood = context === 'positive' ? current >= 0 : current <= 0
      return {
        percentage: 0,
        isPositive,
        isGood,
        showIndicator: current !== 0,
      }
    }

    const growth = ((current - previous) / previous) * 100
    const isPositive = growth >= 0

    // For positive context (income, savings, net worth): increase = good, decrease = bad
    // For negative context (debt, expenses): decrease = good, increase = bad
    const isGood = context === 'positive' ? isPositive : !isPositive

    return {
      percentage: Math.abs(Math.round(growth)),
      isPositive,
      isGood,
      showIndicator: Math.abs(growth) >= 0.1, // Only show if change is meaningful
    }
  }

  return {
    // State
    currentCurrency: readonly(currentCurrency),
    currencyDetails,
    supportedCurrencies,
    expenseCategories,

    // Formatting functions
    format,
    formatCompact,
    formatNumber,
    formatDate,
    formatDateShort,
    formatTime,
    parse,
    toWords,

    // Currency management
    setCurrency,
    getCurrencySymbol,
    getCurrencyName,
    getCurrencyFlag,

    // Validation
    isValidAmount,
    validateCurrencyInput,

    // Utilities
    calculatePercentage,
    calculateGrowth,
    calculateContextualGrowth,
  }
}
