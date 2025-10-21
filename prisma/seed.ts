import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

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
    }
  }

  console.log(`✅ Seeded ${allCategories.length} default categories (${expenseCategories.length} expense, ${incomeCategories.length} income, ${feeCategories.length} fee)`)
}

async function main() {
  console.log('🌱 Starting database seed...')

  // Seed default system categories
  await seedDefaultCategories()

  // Test Users with different financial profiles
  const testUsers = [
    {
      email: 'adebayo@example.com',
      name: 'Adebayo Ogundimu',
      monthlyIncome: 800000, // ₦800k - Senior Software Engineer
      profile: 'tech-professional',
    },
    {
      email: 'fatima@example.com',
      name: 'Fatima Abdullahi',
      monthlyIncome: 450000, // ₦450k - Marketing Manager
      profile: 'mid-level-professional',
    },
    {
      email: 'chidi@example.com',
      name: 'Chidi Okwu',
      monthlyIncome: 250000, // ₦250k - Junior Analyst
      profile: 'entry-level',
    },
    {
      email: 'amina@example.com',
      name: 'Amina Hassan',
      monthlyIncome: 1200000, // ₦1.2M - Business Owner
      profile: 'entrepreneur',
    },
    {
      email: 'test@example.com',
      name: 'Demo User',
      monthlyIncome: 500000, // ₦500k - General test user
      profile: 'demo',
    },
  ]

  const users = []
  const hashedPassword = await hashPassword('password123')

  for (const userData of testUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        monthlyIncome: userData.monthlyIncome,
        currency: 'NGN',
      },
    })
    users.push({ ...user, profile: userData.profile })
    console.log(`👤 Created user: ${user.name} (${userData.profile})`)
  }

  // Create realistic transactions for each user
  for (const user of users) {
    const transactions = generateTransactionsForProfile(user)

    for (const transaction of transactions) {
      await prisma.transaction.create({
        data: {
          ...transaction,
          userId: user.id,
        },
      })
    }
    console.log(`💰 Created ${transactions.length} transactions for ${user.name}`)
  }

  // Create loans for specific users
  for (const user of users) {
    const loans = generateLoansForProfile(user)

    for (const loanData of loans) {
      const loan = await prisma.loan.create({
        data: {
          ...loanData,
          userId: user.id,
        },
      })
      console.log(`🏦 Created loan "${loan.name}" for ${user.name}`)
    }
  }

  // Create budgets for each user
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format

  for (const user of users) {
    const budgets = generateBudgetsForProfile(user, currentMonth)

    for (const budget of budgets) {
      await prisma.budget.upsert({
        where: {
          userId_category_month: {
            userId: user.id,
            category: budget.category,
            month: budget.month,
          },
        },
        update: {
          monthlyLimit: budget.monthlyLimit,
          currentSpent: budget.currentSpent,
        },
        create: {
          ...budget,
          userId: user.id,
        },
      })
    }
    console.log(`📊 Created/Updated ${budgets.length} budgets for ${user.name}`)
  }

  // Create savings goals for each user
  for (const user of users) {
    const savingsGoals = generateSavingsGoalsForProfile(user)

    for (const goal of savingsGoals) {
      await prisma.savingsGoal.create({
        data: {
          ...goal,
          userId: user.id,
        },
      })
    }
    console.log(`🎯 Created ${savingsGoals.length} savings goals for ${user.name}`)
  }

  console.log('✅ Database seed completed successfully!')
  console.log('\n📋 Test User Credentials:')
  console.log('Email: adebayo@example.com | Password: password123 | Profile: Tech Professional')
  console.log('Email: fatima@example.com  | Password: password123 | Profile: Marketing Manager')
  console.log('Email: chidi@example.com   | Password: password123 | Profile: Junior Analyst')
  console.log('Email: amina@example.com   | Password: password123 | Profile: Business Owner')
  console.log('Email: test@example.com    | Password: password123 | Profile: Demo User')
}

// Helper functions to generate realistic data based on user profiles
function generateTransactionsForProfile(user: any) {
  const baseTransactions = [
    // Income - Using proper income category values
    {
      amount: user.monthlyIncome,
      category: 'salary', // ✅ Using income category value
      description: 'Monthly Salary',
      date: new Date('2024-01-01'),
      type: 'income',
    },
  ]

  // Expenses based on income level - Using proper expense category values
  const _expenseRatio = user.monthlyIncome / 1000000 // Scale expenses to income

  const expenses = [
    {
      amount: Math.floor(user.monthlyIncome * 0.25), // 25% for rent
      category: 'housing', // ✅ Using expense category value
      description: 'Monthly Rent',
      date: new Date('2024-01-02'),
      type: 'expense',
    },
    {
      amount: Math.floor(user.monthlyIncome * 0.08), // 8% for transport
      category: 'transportation', // ✅ Using expense category value
      description: 'Fuel and Transportation',
      date: new Date('2024-01-03'),
      type: 'expense',
    },
    {
      amount: Math.floor(user.monthlyIncome * 0.12), // 12% for food
      category: 'food_groceries', // ✅ Using expense category value
      description: 'Groceries and Food',
      date: new Date('2024-01-04'),
      type: 'expense',
    },
    {
      amount: Math.floor(user.monthlyIncome * 0.04), // 4% for data/airtime
      category: 'communication', // ✅ Using expense category value
      description: 'Internet and Phone Bills',
      date: new Date('2024-01-05'),
      type: 'expense',
    },
    {
      amount: Math.floor(user.monthlyIncome * 0.15), // 15% for savings
      category: 'savings_investment', // ✅ Using expense category value
      description: 'Monthly Savings',
      date: new Date('2024-01-06'),
      type: 'expense',
    },
  ]

  // Add profile-specific transactions
  if (user.profile === 'tech-professional') {
    expenses.push({
      amount: 50000,
      category: 'shopping', // ✅ Using expense category value
      description: 'Tech Equipment',
      date: new Date('2024-01-10'),
      type: 'expense',
    })

    // Add freelance income for tech professionals
    baseTransactions.push({
      amount: 150000,
      category: 'freelance', // ✅ Using income category value
      description: 'Freelance Project Payment',
      date: new Date('2024-01-15'),
      type: 'income',
    })
  }
  else if (user.profile === 'entrepreneur') {
    expenses.push({
      amount: 200000,
      category: 'business', // ✅ Using expense category value
      description: 'Business Investment',
      date: new Date('2024-01-15'),
      type: 'expense',
    })

    // Add business income for entrepreneurs
    baseTransactions.push({
      amount: 500000,
      category: 'business_income', // ✅ Using income category value
      description: 'Business Revenue',
      date: new Date('2024-01-20'),
      type: 'income',
    })
  }

  return [...baseTransactions, ...expenses]
}

function generateLoansForProfile(user: any) {
  const loans = []

  if (user.profile === 'tech-professional' || user.profile === 'entrepreneur') {
    loans.push({
      name: 'Car Loan',
      initialAmount: 3000000,
      currentBalance: 2200000,
      monthlyPayment: 120000,
      interestRate: 0.15,
      startDate: new Date('2023-06-01'),
      projectedPayoffDate: new Date('2025-12-01'),
    })
  }

  if (user.profile === 'entrepreneur') {
    loans.push({
      name: 'Business Loan',
      initialAmount: 5000000,
      currentBalance: 3800000,
      monthlyPayment: 200000,
      interestRate: 0.18,
      startDate: new Date('2023-01-01'),
      projectedPayoffDate: new Date('2026-01-01'),
    })
  }

  if (user.profile === 'mid-level-professional') {
    loans.push({
      name: 'Personal Loan',
      initialAmount: 800000,
      currentBalance: 450000,
      monthlyPayment: 45000,
      interestRate: 0.20,
      startDate: new Date('2023-08-01'),
      projectedPayoffDate: new Date('2025-02-01'),
    })
  }

  return loans
}

function generateBudgetsForProfile(user: any, month: string) {
  const income = user.monthlyIncome

  return [
    {
      category: 'housing', // ✅ Updated to use correct category value
      monthlyLimit: Math.floor(income * 0.25),
      currentSpent: Math.floor(income * 0.25),
      month,
    },
    {
      category: 'transportation', // ✅ Updated to use correct category value
      monthlyLimit: Math.floor(income * 0.10),
      currentSpent: Math.floor(income * 0.08),
      month,
    },
    {
      category: 'food_groceries', // ✅ Updated to use correct category value
      monthlyLimit: Math.floor(income * 0.15),
      currentSpent: Math.floor(income * 0.12),
      month,
    },
    {
      category: 'communication', // ✅ Updated to use correct category value
      monthlyLimit: Math.floor(income * 0.05),
      currentSpent: Math.floor(income * 0.04),
      month,
    },
    {
      category: 'miscellaneous', // ✅ This one is correct
      monthlyLimit: Math.floor(income * 0.10),
      currentSpent: Math.floor(income * 0.06),
      month,
    },
  ]
}

function generateSavingsGoalsForProfile(user: any) {
  const goals = [
    {
      name: 'Emergency Fund',
      targetAmount: user.monthlyIncome * 6, // 6 months of income
      currentAmount: Math.floor(user.monthlyIncome * 2), // 2 months saved
      targetDate: new Date('2024-12-31'),
      monthlyContribution: Math.floor(user.monthlyIncome * 0.10),
    },
  ]

  if (user.profile === 'tech-professional') {
    goals.push({
      name: 'Tech Conference Fund',
      targetAmount: 800000,
      currentAmount: 200000,
      targetDate: new Date('2024-08-01'),
      monthlyContribution: 50000,
    })
  }
  else if (user.profile === 'entrepreneur') {
    goals.push({
      name: 'Business Expansion',
      targetAmount: 10000000,
      currentAmount: 2000000,
      targetDate: new Date('2025-06-01'),
      monthlyContribution: 300000,
    })
  }
  else if (user.profile === 'mid-level-professional') {
    goals.push({
      name: 'Vacation Fund',
      targetAmount: 500000,
      currentAmount: 150000,
      targetDate: new Date('2024-07-01'),
      monthlyContribution: 30000,
    })
  }

  return goals
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
