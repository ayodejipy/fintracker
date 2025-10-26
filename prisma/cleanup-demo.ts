import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

// Supabase Admin Client (requires service role key)
const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration!')
  console.error('Please ensure SUPABASE_SERVICE_ROLE_KEY is set in .env')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * Demo user emails to clean up
 */
const DEMO_EMAILS = [
  'demo@example.com',
  'john.doe@example.com',
  'jane.smith@example.com',
]

/**
 * Clean up demo users from both database and Supabase Auth
 */
async function cleanupDemoUsers() {
  console.log('🧹 Starting demo users cleanup...\n')

  // Get demo users from database
  const demoUsers = await prisma.user.findMany({
    where: {
      email: {
        in: DEMO_EMAILS,
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      _count: {
        select: {
          transactions: true,
          loans: true,
          budgets: true,
          savingsGoals: true,
          notifications: true,
          recurringExpenses: true,
          categories: true,
        },
      },
    },
  })

  if (demoUsers.length === 0) {
    console.log('✅ No demo users found. Database is clean!')
    return
  }

  console.log(`Found ${demoUsers.length} demo user(s):\n`)

  // Display what will be deleted
  for (const user of demoUsers) {
    console.log(`📧 ${user.email} (${user.name})`)
    console.log(`   - ${user._count.transactions} transactions`)
    console.log(`   - ${user._count.loans} loans`)
    console.log(`   - ${user._count.budgets} budgets`)
    console.log(`   - ${user._count.savingsGoals} savings goals`)
    console.log(`   - ${user._count.notifications} notifications`)
    console.log(`   - ${user._count.recurringExpenses} recurring expenses`)
    console.log(`   - ${user._count.categories} custom categories`)
  }

  console.log('\n⚠️  This will DELETE all the data listed above!')
  console.log('⚠️  Continuing in 3 seconds... Press Ctrl+C to cancel\n')

  // Wait 3 seconds to allow cancellation
  await new Promise(resolve => setTimeout(resolve, 3000))

  // Delete from database (cascade will handle related records)
  let deletedCount = 0
  for (const user of demoUsers) {
    try {
      console.log(`\n🗑️  Deleting ${user.email} from database...`)

      await prisma.user.delete({
        where: { id: user.id },
      })

      console.log(`   ✅ Deleted from database`)
      deletedCount++

      // Delete from Supabase Auth
      try {
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

        if (authError) {
          console.log(`   ⚠️  Could not delete from Supabase Auth: ${authError.message}`)
          console.log(`   💡 Please delete manually from: Authentication > Users`)
        }
        else {
          console.log(`   ✅ Deleted from Supabase Auth`)
        }
      }
      catch (authError) {
        console.log(`   ⚠️  Error deleting from Supabase Auth:`, authError)
        console.log(`   💡 Please delete manually from dashboard`)
      }
    }
    catch (error) {
      console.error(`   ❌ Failed to delete ${user.email}:`, error)
    }
  }

  console.log(`\n✅ Cleanup completed! Deleted ${deletedCount}/${demoUsers.length} user(s)`)
}

/**
 * Verify cleanup - check if any demo users remain
 */
async function verifyCleanup() {
  console.log('\n🔍 Verifying cleanup...\n')

  const remainingUsers = await prisma.user.findMany({
    where: {
      email: {
        in: DEMO_EMAILS,
      },
    },
  })

  if (remainingUsers.length === 0) {
    console.log('✅ No demo users found in database')
  }
  else {
    console.log(`⚠️  ${remainingUsers.length} demo user(s) still in database:`)
    remainingUsers.forEach(u => console.log(`   - ${u.email}`))
  }

  // Check Supabase Auth
  try {
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const remainingAuthUsers = authUsers?.users?.filter(u =>
      DEMO_EMAILS.includes(u.email || ''),
    )

    if (remainingAuthUsers && remainingAuthUsers.length > 0) {
      console.log(`\n⚠️  ${remainingAuthUsers.length} demo user(s) still in Supabase Auth:`)
      remainingAuthUsers.forEach(u => console.log(`   - ${u.email}`))
      console.log('\nTo delete them:')
      console.log('1. Go to: https://app.supabase.com/project/xrtrzfweiajgcokqpixg/auth/users')
      console.log('2. Search for the email and delete manually')
    }
    else {
      console.log('✅ No demo users found in Supabase Auth')
    }
  }
  catch (error) {
    console.log('\n⚠️  Could not verify Supabase Auth users')
  }
}

/**
 * Display current database stats
 */
async function showStats() {
  console.log('\n📊 Current database statistics:\n')

  const stats = [
    { name: 'Users', count: await prisma.user.count() },
    { name: 'Transactions', count: await prisma.transaction.count() },
    { name: 'Loans', count: await prisma.loan.count() },
    { name: 'Budgets', count: await prisma.budget.count() },
    { name: 'Savings Goals', count: await prisma.savingsGoal.count() },
    { name: 'Notifications', count: await prisma.notification.count() },
    { name: 'Recurring Expenses', count: await prisma.recurringExpense.count() },
    {
      name: 'Custom Categories',
      count: await prisma.category.count({ where: { userId: { not: null } } }),
    },
    {
      name: 'System Categories',
      count: await prisma.category.count({ where: { userId: null } }),
    },
  ]

  stats.forEach((stat) => {
    console.log(`   ${stat.name.padEnd(20)}: ${stat.count}`)
  })
}

/**
 * Main function
 */
async function main() {
  console.log('🧹 Demo Data Cleanup Tool\n')
  console.log('This tool will remove demo users and all their associated data.\n')

  // Show current stats
  await showStats()

  // Clean up demo users
  await cleanupDemoUsers()

  // Verify cleanup
  await verifyCleanup()

  // Show final stats
  await showStats()

  console.log('\n✨ All done!\n')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Cleanup failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
