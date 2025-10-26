import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Generate category value from name
 */
function generateCategoryValue(name: string): string {
  return name
    .replace(/[&,/\s]+/g, '_')
    .replace(/[()]/g, '')
    .toLowerCase()
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

async function seedDefaultCategories() {
  console.log('📁 Seeding default categories...')

  // Default Expense Categories (Nigerian context)
  const expenseCategories = [
    {
      name: 'Food & Groceries',
      value: 'food_groceries',
      type: 'expense',
      icon: '🍽️',
      color: '#10B981',
      description: 'Food, groceries, restaurants, and dining',
      sortOrder: 1,
    },
    {
      name: 'Transportation',
      type: 'expense',
      icon: '🚗',
      color: '#3B82F6',
      description: 'Fuel, public transport, ride-hailing, vehicle maintenance',
      sortOrder: 2,
    },
    {
      name: 'Housing',
      type: 'expense',
      icon: '🏠',
      color: '#8B5CF6',
      description: 'Rent, mortgage, home maintenance, repairs',
      sortOrder: 3,
    },
    {
      name: 'Utilities',
      type: 'expense',
      icon: '⚡',
      color: '#F59E0B',
      description: 'Electricity, water, gas, waste disposal',
      sortOrder: 4,
    },
    {
      name: 'Communication',
      type: 'expense',
      icon: '📱',
      color: '#EC4899',
      description: 'Phone bills, data, airtime, internet',
      sortOrder: 5,
    },
    {
      name: 'Healthcare',
      type: 'expense',
      icon: '🏥',
      color: '#EF4444',
      description: 'Medical expenses, medications, insurance',
      sortOrder: 6,
    },
    {
      name: 'Education',
      type: 'expense',
      icon: '📚',
      color: '#6366F1',
      description: 'School fees, courses, books, learning materials',
      sortOrder: 7,
    },
    {
      name: 'Entertainment',
      type: 'expense',
      icon: '🎬',
      color: '#F97316',
      description: 'Movies, games, hobbies, streaming services',
      sortOrder: 8,
    },
    {
      name: 'Shopping',
      type: 'expense',
      icon: '🛍️',
      color: '#EC4899',
      description: 'Clothing, electronics, personal items',
      sortOrder: 9,
    },
    {
      name: 'Family Support',
      type: 'expense',
      icon: '👨‍👩‍👧‍👦',
      color: '#10B981',
      description: 'Support for family members, dependents',
      sortOrder: 10,
    },
    {
      name: 'Religious/Spiritual',
      type: 'expense',
      icon: '🙏',
      color: '#8B5CF6',
      description: 'Tithe, offerings, religious activities',
      sortOrder: 11,
    },
    {
      name: 'Business',
      type: 'expense',
      icon: '💼',
      color: '#3B82F6',
      description: 'Business expenses, investments, equipment',
      sortOrder: 12,
    },
    {
      name: 'Savings & Investment',
      type: 'expense',
      icon: '💰',
      color: '#10B981',
      description: 'Savings, investments, financial planning',
      sortOrder: 13,
    },
    {
      name: 'Debt Payments',
      type: 'expense',
      icon: '💳',
      color: '#EF4444',
      description: 'Loan repayments, credit card payments',
      sortOrder: 14,
    },
    {
      name: 'Miscellaneous',
      type: 'expense',
      icon: '📦',
      color: '#6B7280',
      description: 'Other expenses not categorized elsewhere',
      sortOrder: 15,
    },
  ]

  // Default Income Categories
  const incomeCategories = [
    {
      name: 'Salary',
      value: 'salary',
      type: 'income',
      icon: '💼',
      color: '#10B981',
      description: 'Monthly salary and wages',
      sortOrder: 1,
    },
    {
      name: 'Freelance',
      value: 'freelance',
      type: 'income',
      icon: '💻',
      color: '#3B82F6',
      description: 'Freelance work and consulting',
      sortOrder: 2,
    },
    {
      name: 'Business Income',
      value: 'business_income',
      type: 'income',
      icon: '🏢',
      color: '#8B5CF6',
      description: 'Business revenue and profits',
      sortOrder: 3,
    },
    {
      name: 'Investment Returns',
      value: 'investment_returns',
      type: 'income',
      icon: '📈',
      color: '#F59E0B',
      description: 'Dividends, interest, capital gains',
      sortOrder: 4,
    },
    {
      name: 'Rental Income',
      value: 'rental_income',
      type: 'income',
      icon: '🏠',
      color: '#EC4899',
      description: 'Property rental income',
      sortOrder: 5,
    },
    {
      name: 'Gift/Bonus',
      value: 'gift_bonus',
      type: 'income',
      icon: '🎁',
      color: '#F97316',
      description: 'Gifts, bonuses, awards',
      sortOrder: 6,
    },
    {
      name: 'Other Income',
      value: 'other_income',
      type: 'income',
      icon: '💰',
      color: '#6366F1',
      description: 'Other sources of income',
      sortOrder: 7,
    },
  ]

  // Default Fee Categories (for fee transparency)
  const feeCategories = [
    {
      name: 'VAT',
      value: 'vat',
      type: 'fee',
      icon: '📊',
      color: '#EF4444',
      description: 'Value Added Tax (typically 7.5% in Nigeria)',
      sortOrder: 1,
    },
    {
      name: 'Service Fee',
      value: 'service_fee',
      type: 'fee',
      icon: '🔧',
      color: '#F59E0B',
      description: 'Restaurant and hotel service charges',
      sortOrder: 2,
    },
    {
      name: 'Commission',
      value: 'commission',
      type: 'fee',
      icon: '💼',
      color: '#3B82F6',
      description: 'Bank and payment processor commissions',
      sortOrder: 3,
    },
    {
      name: 'Stamp Duty',
      value: 'stamp_duty',
      type: 'fee',
      icon: '📜',
      color: '#8B5CF6',
      description: 'Nigerian stamp duty on transfers (₦50 for >₦10,000)',
      sortOrder: 4,
    },
    {
      name: 'Transfer Fee',
      value: 'transfer_fee',
      type: 'fee',
      icon: '💸',
      color: '#EC4899',
      description: 'Inter-bank transfer fees',
      sortOrder: 5,
    },
    {
      name: 'Processing Fee',
      value: 'processing_fee',
      type: 'fee',
      icon: '⚙️',
      color: '#6366F1',
      description: 'Payment processing charges',
      sortOrder: 6,
    },
    {
      name: 'Other Fees',
      value: 'other_fees',
      type: 'fee',
      icon: '📋',
      color: '#6B7280',
      description: 'Miscellaneous fees and charges',
      sortOrder: 7,
    },
  ]

  const allCategories = [...expenseCategories, ...incomeCategories, ...feeCategories]

  // Create or update all categories
  for (const category of allCategories) {
    // Generate value if not provided
    const value = (category as any).value || generateCategoryValue(category.name)

    // Check if category exists
    const existing = await prisma.category.findFirst({
      where: {
        userId: null,
        name: category.name,
        type: category.type,
      },
    })

    if (existing) {
      // Update existing category
      await prisma.category.update({
        where: { id: existing.id },
        data: {
          value,
          icon: category.icon,
          color: category.color,
          description: category.description,
          sortOrder: category.sortOrder,
        },
      })
      console.log(`  ↻ Updated: ${category.name}`)
    }
    else {
      // Create new category
      await prisma.category.create({
        data: {
          userId: null, // System-wide default
          name: category.name,
          value,
          type: category.type,
          icon: category.icon,
          color: category.color,
          description: category.description,
          sortOrder: category.sortOrder,
          isSystem: true,
          isActive: true,
        },
      })
      console.log(`  ✓ Created: ${category.name}`)
    }
  }

  console.log(`\n✅ Seeded ${allCategories.length} default categories:`)
  console.log(`   - ${expenseCategories.length} expense categories`)
  console.log(`   - ${incomeCategories.length} income categories`)
  console.log(`   - ${feeCategories.length} fee categories`)
}

async function main() {
  console.log('🌱 Seeding categories...\n')
  await seedDefaultCategories()
  console.log('\n✅ Category seed completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
