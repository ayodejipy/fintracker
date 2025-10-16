import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../app/utils/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

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
      await prisma.budget.create({
        data: {
          ...budget,
          userId: user.id,
        },
      })
    }
    console.log(`📊 Created ${budgets.length} budgets for ${user.name}`)
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
    // Income
    {
      amount: user.monthlyIncome,
      category: 'miscellaneous',
      description: 'Monthly Salary',
      date: new Date('2024-01-01'),
      type: 'income',
    },
  ]

  // Expenses based on income level
  const _expenseRatio = user.monthlyIncome / 1000000 // Scale expenses to income

  const expenses = [
    {
      amount: Math.floor(user.monthlyIncome * 0.25), // 25% for rent
      category: 'rent',
      description: 'Monthly Rent',
      date: new Date('2024-01-02'),
      type: 'expense',
    },
    {
      amount: Math.floor(user.monthlyIncome * 0.08), // 8% for transport
      category: 'transport',
      description: 'Fuel and Transportation',
      date: new Date('2024-01-03'),
      type: 'expense',
    },
    {
      amount: Math.floor(user.monthlyIncome * 0.12), // 12% for food
      category: 'food',
      description: 'Groceries and Food',
      date: new Date('2024-01-04'),
      type: 'expense',
    },
    {
      amount: Math.floor(user.monthlyIncome * 0.04), // 4% for data/airtime
      category: 'data_airtime',
      description: 'Internet and Phone Bills',
      date: new Date('2024-01-05'),
      type: 'expense',
    },
    {
      amount: Math.floor(user.monthlyIncome * 0.15), // 15% for savings
      category: 'savings',
      description: 'Monthly Savings',
      date: new Date('2024-01-06'),
      type: 'expense',
    },
  ]

  // Add profile-specific transactions
  if (user.profile === 'tech-professional') {
    expenses.push({
      amount: 50000,
      category: 'miscellaneous',
      description: 'Tech Equipment',
      date: new Date('2024-01-10'),
      type: 'expense',
    })
  }
  else if (user.profile === 'entrepreneur') {
    expenses.push({
      amount: 200000,
      category: 'miscellaneous',
      description: 'Business Investment',
      date: new Date('2024-01-15'),
      type: 'expense',
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
      category: 'rent',
      monthlyLimit: Math.floor(income * 0.25),
      currentSpent: Math.floor(income * 0.25),
      month,
    },
    {
      category: 'transport',
      monthlyLimit: Math.floor(income * 0.10),
      currentSpent: Math.floor(income * 0.08),
      month,
    },
    {
      category: 'food',
      monthlyLimit: Math.floor(income * 0.15),
      currentSpent: Math.floor(income * 0.12),
      month,
    },
    {
      category: 'data_airtime',
      monthlyLimit: Math.floor(income * 0.05),
      currentSpent: Math.floor(income * 0.04),
      month,
    },
    {
      category: 'miscellaneous',
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
