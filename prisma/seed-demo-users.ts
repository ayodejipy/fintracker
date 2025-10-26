import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

// Supabase Admin Client (requires service role key)
const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration!')
  console.error('Please ensure the following environment variables are set:')
  console.error('  - NUXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nGet your service role key from:')
  console.error('  https://app.supabase.com/project/[your-project-id]/settings/api')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * Demo users for local development and testing
 */
const demoUsers = [
  {
    email: 'demo@example.com',
    password: 'Demo123!@#',
    name: 'Demo User',
    profile: {
      monthlyIncome: 500000, // ₦500,000
      currency: 'NGN',
    },
  },
  {
    email: 'john.doe@example.com',
    password: 'John123!@#',
    name: 'John Doe',
    profile: {
      monthlyIncome: 750000, // ₦750,000
      currency: 'NGN',
    },
  },
  {
    email: 'jane.smith@example.com',
    password: 'Jane123!@#',
    name: 'Jane Smith',
    profile: {
      monthlyIncome: 1200000, // ₦1,200,000
      currency: 'NGN',
    },
  },
]

/**
 * Create demo user in Supabase Auth and application database
 */
async function createDemoUser(userData: typeof demoUsers[0]) {
  try {
    // Check if user already exists in Supabase
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === userData.email)

    let supabaseUserId: string

    if (existingUser) {
      console.log(`  ↻ User exists in Supabase: ${userData.email}`)
      supabaseUserId = existingUser.id

      // Update password if needed
      await supabaseAdmin.auth.admin.updateUserById(supabaseUserId, {
        password: userData.password,
        email_confirm: true,
      })
      console.log(`  ↻ Updated password for: ${userData.email}`)
    }
    else {
      // Create user in Supabase Auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Auto-confirm email for demo users
        user_metadata: {
          name: userData.name,
        },
      })

      if (authError) {
        throw new Error(`Supabase auth error: ${authError.message}`)
      }

      if (!authUser.user) {
        throw new Error('Failed to create user in Supabase')
      }

      supabaseUserId = authUser.user.id
      console.log(`  ✓ Created in Supabase: ${userData.email}`)
    }

    // Check if user exists in application database
    const existingDbUser = await prisma.user.findUnique({
      where: { id: supabaseUserId },
    })

    if (existingDbUser) {
      // Update existing user
      await prisma.user.update({
        where: { id: supabaseUserId },
        data: {
          email: userData.email,
          name: userData.name,
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      })
      console.log(`  ↻ Updated in database: ${userData.email}`)
    }
    else {
      // Create user in application database
      await prisma.user.create({
        data: {
          id: supabaseUserId,
          email: userData.email,
          name: userData.name,
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      })
      console.log(`  ✓ Created in database: ${userData.email}`)
    }

    return supabaseUserId
  }
  catch (error) {
    console.error(`  ❌ Failed to create ${userData.email}:`, error)
    throw error
  }
}

/**
 * Seed sample transactions for a user
 */
async function seedUserTransactions(userId: string, userName: string) {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // Get system categories
  const categories = await prisma.category.findMany({
    where: { userId: null, isSystem: true },
  })

  const expenseCategories = categories.filter(c => c.type === 'expense')
  const incomeCategories = categories.filter(c => c.type === 'income')

  if (expenseCategories.length === 0 || incomeCategories.length === 0) {
    console.log(`  ⚠️  No system categories found. Please run seed-categories.ts first.`)
    return
  }

  // Create sample transactions for the last 3 months
  const transactions = []

  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const transactionMonth = currentMonth - monthOffset
    const transactionYear = currentYear - (transactionMonth < 0 ? 1 : 0)
    const normalizedMonth = transactionMonth < 0 ? 12 + transactionMonth : transactionMonth

    // Income transactions (2-3 per month)
    const salaryCategory = incomeCategories.find(c => c.name === 'Salary')
    if (salaryCategory) {
      transactions.push({
        userId,
        description: `Salary - ${userName}`,
        amount: monthOffset === 0 ? 500000 : 500000 - (monthOffset * 10000),
        type: 'income' as const,
        categoryId: salaryCategory.id,
        date: new Date(transactionYear, normalizedMonth, 1),
        source: 'manual',
      })
    }

    // Expense transactions (10-15 per month)
    const monthlyExpenses = [
      { category: 'Food & Groceries', amount: 80000, day: 5 },
      { category: 'Transportation', amount: 25000, day: 7 },
      { category: 'Utilities', amount: 35000, day: 10 },
      { category: 'Communication', amount: 15000, day: 12 },
      { category: 'Housing', amount: 200000, day: 1 },
      { category: 'Entertainment', amount: 20000, day: 15 },
      { category: 'Shopping', amount: 45000, day: 18 },
      { category: 'Food & Groceries', amount: 50000, day: 20 },
      { category: 'Healthcare', amount: 30000, day: 22 },
      { category: 'Transportation', amount: 20000, day: 25 },
    ]

    for (const expense of monthlyExpenses) {
      const category = expenseCategories.find(c => c.name === expense.category)
      if (category) {
        transactions.push({
          userId,
          description: `${expense.category} expense`,
          amount: expense.amount,
          type: 'expense' as const,
          categoryId: category.id,
          date: new Date(transactionYear, normalizedMonth, expense.day),
          source: 'manual',
        })
      }
    }
  }

  // Create transactions in database
  for (const transaction of transactions) {
    await prisma.transaction.create({ data: transaction })
  }

  console.log(`  ✓ Created ${transactions.length} sample transactions for ${userName}`)
}

/**
 * Seed sample budget for a user
 */
async function seedUserBudget(userId: string, userName: string) {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // Get expense categories
  const categories = await prisma.category.findMany({
    where: { userId: null, type: 'expense', isSystem: true },
  })

  if (categories.length === 0) {
    console.log(`  ⚠️  No expense categories found for budget.`)
    return
  }

  // Create budget for current month
  const budget = await prisma.budget.create({
    data: {
      userId,
      name: `${userName}'s Monthly Budget`,
      month: currentMonth + 1,
      year: currentYear,
      totalBudget: 450000, // ₦450,000
      isActive: true,
    },
  })

  // Create budget items for key categories
  const budgetItems = [
    { category: 'Housing', amount: 200000 },
    { category: 'Food & Groceries', amount: 100000 },
    { category: 'Transportation', amount: 40000 },
    { category: 'Utilities', amount: 35000 },
    { category: 'Communication', amount: 15000 },
    { category: 'Entertainment', amount: 20000 },
    { category: 'Healthcare', amount: 20000 },
    { category: 'Shopping', amount: 20000 },
  ]

  for (const item of budgetItems) {
    const category = categories.find(c => c.name === item.category)
    if (category) {
      await prisma.budgetItem.create({
        data: {
          budgetId: budget.id,
          categoryId: category.id,
          amount: item.amount,
          spent: 0,
        },
      })
    }
  }

  console.log(`  ✓ Created budget with ${budgetItems.length} items for ${userName}`)
}

/**
 * Seed sample savings goal for a user
 */
async function seedUserSavingsGoal(userId: string, userName: string) {
  const now = new Date()
  const targetDate = new Date(now)
  targetDate.setMonth(targetDate.getMonth() + 6) // 6 months from now

  await prisma.savingsGoal.create({
    data: {
      userId,
      name: 'Emergency Fund',
      targetAmount: 1000000, // ₦1,000,000
      currentAmount: 250000, // ₦250,000 already saved
      targetDate,
      description: 'Building an emergency fund for unexpected expenses',
      isActive: true,
    },
  })

  console.log(`  ✓ Created savings goal for ${userName}`)
}

/**
 * Main seeding function
 */
async function main() {
  console.log('🌱 Seeding demo users and data...\n')

  for (const userData of demoUsers) {
    console.log(`\n👤 Processing: ${userData.email}`)

    try {
      // Create user
      const userId = await createDemoUser(userData)

      // Seed related data
      await seedUserTransactions(userId, userData.name)
      await seedUserBudget(userId, userData.name)
      await seedUserSavingsGoal(userId, userData.name)

      console.log(`✅ Completed seeding for: ${userData.email}`)
    }
    catch (error) {
      console.error(`❌ Failed to seed user ${userData.email}:`, error)
      // Continue with next user
    }
  }

  console.log('\n✅ Demo users seed completed!')
  console.log('\nDemo user credentials:')
  demoUsers.forEach((user) => {
    console.log(`  📧 ${user.email}`)
    console.log(`  🔑 ${user.password}\n`)
  })
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
