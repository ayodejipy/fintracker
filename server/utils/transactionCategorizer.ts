import type { ExpenseCategory, ParsedTransaction } from '../../app/types'

/**
 * Rules-based transaction categorization
 * Categorizes transactions based on description keywords
 */

interface CategoryRule {
  category: ExpenseCategory
  keywords: string[]
}

// Nigerian-specific categorization rules
const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'transport',
    keywords: [
      'uber', 'bolt', 'taxi', 'cab', 'okada', 'keke', 'danfo', 'bus',
      'fuel', 'petrol', 'diesel', 'filling station', 'conoil', 'total',
      'mobil', 'oando', 'rain oil', 'forte oil',
    ],
  },
  {
    category: 'food',
    keywords: [
      'shoprite', 'spar', 'market', 'jendol', 'food', 'restaurant',
      'chicken republic', 'kfc', 'dominos', 'pizza', 'coldstone',
      'sweet sensation', 'tantalizers', 'mr biggs', 'bukka', 'eatery',
      'bakery', 'cafe', 'grocery', 'supermarket', 'provision',
    ],
  },
  {
    category: 'data_airtime',
    keywords: [
      'mtn', 'glo', 'airtel', '9mobile', 'etisalat', 'airtime', 'data',
      'recharge', 'topup', 'top-up', 'subscription', 'bundle',
    ],
  },
  {
    category: 'miscellaneous',
    keywords: [
      'netflix', 'spotify', 'dstv', 'gotv', 'startimes', 'showmax',
      'cinema', 'movie', 'filmhouse', 'genesis', 'silverbird',
      'jumia', 'konga', 'amazon', 'aliexpress', 'shopping',
      'pharmacy', 'medplus', 'health plus', 'hospital', 'clinic',
      'gym', 'fitness', 'spa', 'salon', 'barbing', 'barber',
    ],
  },
  {
    category: 'rent',
    keywords: [
      'rent', 'landlord', 'lease', 'accommodation', 'housing',
      'apartment', 'flat', 'tenancy',
    ],
  },
  {
    category: 'home_allowance',
    keywords: [
      'phcn', 'ekedc', 'ikedc', 'electric', 'electricity', 'nepa',
      'water', 'waste', 'sanitation', 'lawma', 'home', 'household',
      'furniture', 'appliance', 'generator', 'gen',
    ],
  },
  {
    category: 'loan_repayment',
    keywords: [
      'loan', 'repayment', 'credit', 'debt', 'mortgage', 'interest',
      'installment', 'instalment', 'borrow', 'payback', 'carbon',
      'fairmoney', 'branch', 'palmcredit', 'renmoney',
    ],
  },
  {
    category: 'savings',
    keywords: [
      'savings', 'save', 'investment', 'invest', 'fixed deposit',
      'fd', 'mutual fund', 'treasury', 'cowrywise', 'piggyvest',
      'risevest',
    ],
  },
  {
    category: 'vat',
    keywords: [
      'vat', 'tax', 'commission', 'charge', 'fee', 'service charge',
    ],
  },
]

/**
 * Categorize a single transaction
 */
export function categorizeTransaction(transaction: ParsedTransaction): ParsedTransaction {
  const description = transaction.description?.toLowerCase().trim() || ''

  // Skip if already has category
  if (transaction.category) {
    return transaction
  }

  // Skip if empty description
  if (!description) {
    return transaction
  }

  // Check against rules
  for (const rule of CATEGORY_RULES) {
    for (const keyword of rule.keywords) {
      if (description.includes(keyword)) {
        return {
          ...transaction,
          category: rule.category,
        }
      }
    }
  }

  // No match found - return without category
  return transaction
}

/**
 * Categorize multiple transactions
 */
export function categorizeTransactions(transactions: ParsedTransaction[]): ParsedTransaction[] {
  return transactions.map(t => categorizeTransaction(t))
}

/**
 * Get category suggestions for a description
 * Returns multiple possible categories ranked by confidence
 */
export function getCategorySuggestions(description: string): Array<{ category: ExpenseCategory, confidence: number }> {
  const desc = description.toLowerCase().trim()
  const suggestions: Array<{ category: ExpenseCategory, confidence: number, matches: number }> = []

  if (!desc) {
    return []
  }

  // Count matches for each category
  for (const rule of CATEGORY_RULES) {
    let matches = 0
    for (const keyword of rule.keywords) {
      if (desc.includes(keyword)) {
        matches++
      }
    }

    if (matches > 0) {
      const confidence = Math.min(matches * 0.3, 1.0) // Cap at 1.0
      suggestions.push({
        category: rule.category,
        confidence,
        matches,
      })
    }
  }

  // Sort by matches (descending) and return top 3
  return suggestions
    .sort((a, b) => b.matches - a.matches)
    .slice(0, 3)
    .map(({ category, confidence }) => ({ category, confidence }))
}

/**
 * Add custom categorization rule
 * This allows users to teach the system new patterns
 */
export function addCustomRule(keyword: string, category: ExpenseCategory) {
  const rule = CATEGORY_RULES.find(r => r.category === category)
  if (rule && !rule.keywords.includes(keyword.toLowerCase())) {
    rule.keywords.push(keyword.toLowerCase())
  }
}

/**
 * Get all keywords for a category
 */
export function getCategoryKeywords(category: ExpenseCategory): string[] {
  const rule = CATEGORY_RULES.find(r => r.category === category)
  return rule ? rule.keywords : []
}

/**
 * Validate if a category exists
 */
export function isValidCategory(category: string): category is ExpenseCategory {
  const validCategories: ExpenseCategory[] = [
    'loan_repayment',
    'home_allowance',
    'rent',
    'transport',
    'food',
    'data_airtime',
    'miscellaneous',
    'savings',
  ]

  return validCategories.includes(category as ExpenseCategory)
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: ExpenseCategory): string {
  const displayNames: Record<ExpenseCategory, string> = {
    loan_repayment: 'Loan Repayment',
    home_allowance: 'Home & Utilities',
    rent: 'Rent',
    transport: 'Transport',
    food: 'Food & Dining',
    data_airtime: 'Data & Airtime',
    miscellaneous: 'Miscellaneous',
    savings: 'Savings',
    vat: 'VAT',
  }

  return displayNames[category] || category
}

/**
 * Analyze categorization coverage
 */
export function analyzeCategorizationCoverage(transactions: ParsedTransaction[]) {
  const total = transactions.length
  const categorized = transactions.filter(t => t.category).length
  const uncategorized = total - categorized

  const categoryBreakdown: Record<string, number> = {}

  transactions.forEach((t) => {
    if (t.category) {
      categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + 1
    }
  })

  return {
    total,
    categorized,
    uncategorized,
    coveragePercentage: total > 0 ? (categorized / total) * 100 : 0,
    categoryBreakdown,
  }
}
