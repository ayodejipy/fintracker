// Supported currencies with their details
export const SUPPORTED_CURRENCIES = {
  NGN: {
    code: 'NGN',
    name: 'Nigerian Naira',
    symbol: '₦',
    locale: 'en-NG',
    flag: '🇳🇬',
    primary: true,
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    locale: 'en-US',
    flag: '🇺🇸',
    primary: false,
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    locale: 'en-EU',
    flag: '🇪🇺',
    primary: false,
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    locale: 'en-GB',
    flag: '🇬🇧',
    primary: false,
  },
} as const

export type CurrencyCode = keyof typeof SUPPORTED_CURRENCIES

/**
 * Get currency details by code
 */
export function getCurrencyDetails(code: CurrencyCode) {
  return SUPPORTED_CURRENCIES[code]
}

/**
 * Get all supported currencies as array
 */
export function getSupportedCurrencies() {
  return Object.values(SUPPORTED_CURRENCIES)
}

/**
 * Format amount in specified currency
 */
export function formatCurrency(amount: number, currency: CurrencyCode = 'NGN'): string {
  const currencyDetails = getCurrencyDetails(currency)
  return new Intl.NumberFormat(currencyDetails.locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format amount as compact currency (e.g., ₦1.2K, $1.5M)
 */
export function formatCurrencyCompact(amount: number, currency: CurrencyCode = 'NGN'): string {
  const currencyDetails = getCurrencyDetails(currency)
  return new Intl.NumberFormat(currencyDetails.locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount)
}

/**
 * Format amount in Nigerian Naira (legacy function for backward compatibility)
 */
export function formatNaira(amount: number): string {
  return formatCurrency(amount, 'NGN')
}

/**
 * Format amount as compact Nigerian Naira (legacy function for backward compatibility)
 */
export function formatNairaCompactCurrency(amount: number): string {
  return formatCurrencyCompact(amount, 'NGN')
}

/**
 * Parse currency string to number (removes currency symbols and formatting)
 */
export function parseCurrency(currencyString: string): number {
  // Remove all currency symbols, commas, and spaces
  const cleanString = currencyString.replace(/[₦$€£,\s]/g, '')
  return Number.parseFloat(cleanString)
}

/**
 * Parse Nigerian Naira string to number (legacy function for backward compatibility)
 */
export function parseNaira(nairaString: string): number {
  return parseCurrency(nairaString)
}

/**
 * Validate if amount is a valid monetary value
 */
export function isValidAmount(amount: number): boolean {
  return !Number.isNaN(amount) && amount >= 0 && Number.isFinite(amount)
}

/**
 * Nigerian-specific date formatting
 */
export function formatNigerianDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(dateObj)
}

/**
 * Format date in short Nigerian format
 */
export function formatNigerianDateShort(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj)
}

/**
 * Format time in Nigerian format (12-hour with AM/PM)
 */
export function formatNigerianTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(dateObj)
}

/**
 * Get Nigerian business hours context
 */
export function getNigerianBusinessHours() {
  return {
    weekdays: { start: '8:00 AM', end: '5:00 PM' },
    saturday: { start: '9:00 AM', end: '2:00 PM' },
    sunday: 'Closed',
    timezone: 'WAT (West Africa Time)',
    bankingHours: { start: '8:00 AM', end: '4:00 PM' },
  }
}

/**
 * Nigerian number formatting (with comma separators)
 */
export function formatNigerianNumber(num: number): string {
  return new Intl.NumberFormat('en-NG').format(num)
}

/**
 * Convert amount to words (Nigerian context)
 */
export function amountToWords(amount: number, currency: CurrencyCode = 'NGN'): string {
  const currencyDetails = getCurrencyDetails(currency)

  // Simple implementation for common amounts
  if (amount === 0) { return `Zero ${currencyDetails.name}` }

  const units = ['', 'Thousand', 'Million', 'Billion', 'Trillion']
  let unitIndex = 0
  let workingAmount = amount

  while (workingAmount >= 1000 && unitIndex < units.length - 1) {
    workingAmount /= 1000
    unitIndex++
  }

  const roundedAmount = Math.round(workingAmount * 100) / 100
  return `${roundedAmount} ${units[unitIndex]} ${currencyDetails.name}`
}

/**
 * Nigerian-specific expense categories with local context
 */
export const NIGERIAN_EXPENSE_CATEGORIES_DETAILED = {
  // Essential Categories
  food: {
    name: 'Food & Groceries',
    icon: '🍽️',
    subcategories: ['Groceries', 'Restaurants', 'Street Food', 'Market Shopping'],
  },
  transportation: {
    name: 'Transportation',
    icon: '🚗',
    subcategories: ['Fuel', 'Bus/Keke', 'Uber/Bolt', 'Car Maintenance', 'Flight'],
  },
  housing: {
    name: 'Housing',
    icon: '🏠',
    subcategories: ['Rent', 'Utilities (NEPA)', 'Generator Fuel', 'Water', 'Internet'],
  },
  healthcare: {
    name: 'Healthcare',
    icon: '🏥',
    subcategories: ['Hospital Bills', 'Medications', 'Health Insurance', 'Dental'],
  },

  // Nigerian-Specific Categories
  utilities: {
    name: 'Utilities',
    icon: '⚡',
    subcategories: ['Electricity (NEPA)', 'Generator', 'Water', 'Waste Management'],
  },
  communication: {
    name: 'Communication',
    icon: '📱',
    subcategories: ['Airtime', 'Data', 'Cable TV (DSTV/GOtv)', 'Internet'],
  },
  education: {
    name: 'Education',
    icon: '📚',
    subcategories: ['School Fees', 'Books', 'Uniforms', 'Extra Lessons'],
  },
  family: {
    name: 'Family Support',
    icon: '👨‍👩‍👧‍👦',
    subcategories: ['Parents Support', 'Siblings', 'Extended Family', 'Village Contributions'],
  },

  // Lifestyle Categories
  entertainment: {
    name: 'Entertainment',
    icon: '🎬',
    subcategories: ['Movies', 'Concerts', 'Clubs', 'Sports Events'],
  },
  shopping: {
    name: 'Shopping',
    icon: '🛍️',
    subcategories: ['Clothing', 'Electronics', 'Personal Items', 'Gifts'],
  },
  religious: {
    name: 'Religious/Spiritual',
    icon: '🙏',
    subcategories: ['Tithe/Zakat', 'Offerings', 'Religious Events', 'Pilgrimage'],
  },
  business: {
    name: 'Business',
    icon: '💼',
    subcategories: ['Business Expenses', 'Equipment', 'Marketing', 'Registration'],
  },

  // Financial Categories
  savings: {
    name: 'Savings & Investment',
    icon: '💰',
    subcategories: ['Bank Savings', 'Fixed Deposit', 'Stocks', 'Crypto', 'Cooperative'],
  },
  debt: {
    name: 'Debt Payments',
    icon: '💳',
    subcategories: ['Loan Repayment', 'Credit Card', 'Personal Loans', 'Mortgage'],
  },

  // Miscellaneous
  miscellaneous: {
    name: 'Others',
    icon: '📦',
    subcategories: ['Unexpected Expenses', 'Gifts', 'Donations', 'Emergency'],
  },
} as const

/**
 * Get Nigerian expense categories as array
 */
export function getNigerianExpenseCategories() {
  return Object.entries(NIGERIAN_EXPENSE_CATEGORIES_DETAILED).map(([key, value]) => ({
    id: key,
    ...value,
  }))
}
