/**
 * Category Mapper
 *
 * Maps keywords to database categories dynamically.
 * This ensures LLM and rules-based categorization uses actual DB categories.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Keyword mapping for each category
 * These map common transaction descriptions to category names
 */
export const CATEGORY_KEYWORD_MAP: Record<string, string[]> = {
  // Food & Groceries
  'Food & Groceries': [
    'shoprite', 'spar', 'market', 'jendol', 'food', 'restaurant',
    'chicken republic', 'kfc', 'dominos', 'pizza', 'coldstone',
    'sweet sensation', 'tantalizers', 'mr biggs', 'bukka', 'eatery',
    'bakery', 'cafe', 'grocery', 'supermarket', 'provision', 'meal',
  ],

  // Transportation
  'Transportation': [
    'uber', 'bolt', 'taxi', 'cab', 'okada', 'keke', 'danfo', 'bus',
    'fuel', 'petrol', 'diesel', 'filling station', 'conoil', 'total',
    'mobil', 'oando', 'rain oil', 'forte oil', 'transport', 'ride',
  ],

  // Housing
  'Housing': [
    'rent', 'landlord', 'lease', 'accommodation', 'housing',
    'apartment', 'flat', 'tenancy', 'mortgage',
  ],

  // Utilities
  'Utilities': [
    'phcn', 'ekedc', 'ikedc', 'electric', 'electricity', 'nepa',
    'water', 'waste', 'sanitation', 'lawma', 'utility', 'power',
  ],

  // Communication
  'Communication': [
    'mtn', 'glo', 'airtel', '9mobile', 'etisalat', 'airtime', 'data',
    'recharge', 'topup', 'top-up', 'subscription', 'bundle', 'internet',
    'wifi', 'broadband',
  ],

  // Healthcare
  'Healthcare': [
    'pharmacy', 'medplus', 'health plus', 'hospital', 'clinic',
    'doctor', 'medical', 'medicine', 'drug', 'health', 'vaccine',
  ],

  // Education
  'Education': [
    'school', 'tuition', 'course', 'book', 'textbook', 'lesson',
    'tutorial', 'exam', 'certification', 'learning', 'training',
  ],

  // Entertainment
  'Entertainment': [
    'netflix', 'spotify', 'dstv', 'gotv', 'startimes', 'showmax',
    'cinema', 'movie', 'filmhouse', 'genesis', 'silverbird',
    'game', 'gaming', 'concert', 'event',
  ],

  // Shopping
  'Shopping': [
    'jumia', 'konga', 'amazon', 'aliexpress', 'shopping',
    'clothing', 'fashion', 'electronics', 'gadget', 'store',
  ],

  // Family Support
  'Family Support': [
    'family', 'parent', 'mother', 'father', 'sibling', 'support',
    'allowance', 'contribution', 'upkeep',
  ],

  // Religious/Spiritual
  'Religious/Spiritual': [
    'church', 'mosque', 'tithe', 'offering', 'donation', 'religious',
    'spiritual', 'pastor', 'imam', 'charity',
  ],

  // Business
  'Business': [
    'business', 'supplier', 'vendor', 'equipment', 'inventory',
    'office', 'commercial', 'professional',
  ],

  // Savings & Investment
  'Savings & Investment': [
    'savings', 'save', 'investment', 'invest', 'fixed deposit',
    'fd', 'mutual fund', 'treasury', 'cowrywise', 'piggyvest',
    'risevest', 'stock', 'bond',
  ],

  // Debt Payments
  'Debt Payments': [
    'loan', 'repayment', 'credit', 'debt', 'interest',
    'installment', 'instalment', 'borrow', 'payback', 'carbon',
    'fairmoney', 'branch', 'palmcredit', 'renmoney',
  ],

  // Miscellaneous
  'Miscellaneous': [
    'miscellaneous', 'misc', 'other', 'general', 'various',
  ],

  // Income categories
  'Salary': [
    'salary', 'wage', 'payroll', 'monthly pay', 'income',
  ],

  'Freelance': [
    'freelance', 'consulting', 'contract', 'gig', 'project',
  ],

  'Business Income': [
    'business revenue', 'sales', 'profit', 'business income',
  ],

  'Investment Returns': [
    'dividend', 'interest', 'return', 'capital gain', 'yield',
  ],

  'Rental Income': [
    'rental', 'property income', 'tenant',
  ],

  'Gift/Bonus': [
    'gift', 'bonus', 'award', 'prize', 'windfall',
  ],

  'Other Income': [
    'refund', 'cashback', 'rebate',
  ],

  // Fee categories
  'VAT': [
    'vat', 'value added tax', 'tax',
  ],

  'Service Fee': [
    'service charge', 'service fee', 'gratuity',
  ],

  'Commission': [
    'commission', 'processing charge',
  ],

  'Stamp Duty': [
    'stamp duty', 'levy', 'electronic money transfer levy',
  ],

  'Transfer Fee': [
    'transfer fee', 'transfer charge',
  ],

  'Processing Fee': [
    'processing fee', 'handling fee',
  ],

  'Other Fees': [
    'sms charge', 'sms alert', 'maintenance fee', 'card fee',
  ],
}

/**
 * Get all categories from database
 */
export async function getAllCategories() {
  return await prisma.category.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      sortOrder: 'asc',
    },
  })
}

/**
 * Get categories as a formatted list for LLM prompt
 */
export async function getCategoriesForLLMPrompt(): Promise<string> {
  const categories = await getAllCategories()

  const grouped = {
    expense: categories.filter(c => c.type === 'expense'),
    income: categories.filter(c => c.type === 'income'),
    fee: categories.filter(c => c.type === 'fee'),
  }

  const lines: string[] = []

  lines.push('**EXPENSE CATEGORIES (use for debits/money out):**')
  grouped.expense.forEach((cat) => {
    lines.push(`- "${cat.name}": ${cat.description || 'General expense category'}`)
  })

  lines.push('\n**INCOME CATEGORIES (use for credits/money in):**')
  grouped.income.forEach((cat) => {
    lines.push(`- "${cat.name}": ${cat.description || 'General income category'}`)
  })

  lines.push('\n**FEE CATEGORIES (use for bank charges/fees):**')
  grouped.fee.forEach((cat) => {
    lines.push(`- "${cat.name}": ${cat.description || 'Fee category'}`)
  })

  return lines.join('\n')
}

/**
 * Match a description to a category using keywords
 */
export async function matchDescriptionToCategory(
  description: string,
  transactionType: 'expense' | 'income' | 'fee',
): Promise<string | null> {
  const desc = description.toLowerCase().trim()

  if (!desc) {
    return null
  }

  // Get all active categories of the right type
  const categories = await prisma.category.findMany({
    where: {
      type: transactionType,
      isActive: true,
    },
  })

  // Try to match keywords
  for (const [categoryName, keywords] of Object.entries(CATEGORY_KEYWORD_MAP)) {
    // Check if this category exists in DB
    const category = categories.find(c => c.name === categoryName)
    if (!category) {
      continue
    }

    // Check if any keyword matches
    for (const keyword of keywords) {
      if (desc.includes(keyword)) {
        return category.name
      }
    }
  }

  // No match found
  return null
}

/**
 * Get default category names as array (for validation)
 */
export async function getValidCategoryNames(): Promise<string[]> {
  const categories = await getAllCategories()
  return categories.map(c => c.name)
}
