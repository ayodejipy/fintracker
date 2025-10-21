/**
 * Script to reset a user's data (delete all records while keeping the user account)
 * Usage: npx tsx scripts/reset-user-data.ts <user-email>
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetUserData(email: string) {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.error(`❌ User with email "${email}" not found`)
      process.exit(1)
    }

    console.log(`\n🔍 Found user: ${user.name} (${user.email})`)
    console.log(`User ID: ${user.id}`)
    console.log('\n⚠️  This will delete ALL data for this user!')
    console.log('   - Transactions')
    console.log('   - Budgets')
    console.log('   - Loans')
    console.log('   - Savings Goals')
    console.log('   - Recurring Expenses')
    console.log('   - Notifications')
    console.log('   - Notification Preferences')
    console.log('   - Custom Categories')
    console.log('\n⏳ Starting deletion in 3 seconds...\n')

    await new Promise(resolve => setTimeout(resolve, 3000))

    // Delete all data in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const categories = await tx.category.deleteMany({ where: { userId: user.id } })
      const notifications = await tx.notification.deleteMany({ where: { userId: user.id } })
      const notificationPrefs = await tx.notificationPreferences.deleteMany({ where: { userId: user.id } })
      const transactions = await tx.transaction.deleteMany({ where: { userId: user.id } })
      const recurringExpenses = await tx.recurringExpense.deleteMany({ where: { userId: user.id } })
      const budgets = await tx.budget.deleteMany({ where: { userId: user.id } })
      const loans = await tx.loan.deleteMany({ where: { userId: user.id } })
      const savingsGoals = await tx.savingsGoal.deleteMany({ where: { userId: user.id } })

      return {
        categories: categories.count,
        notifications: notifications.count,
        notificationPrefs: notificationPrefs.count,
        transactions: transactions.count,
        recurringExpenses: recurringExpenses.count,
        budgets: budgets.count,
        loans: loans.count,
        savingsGoals: savingsGoals.count,
      }
    })

    console.log('\n✅ Successfully deleted all user data!\n')
    console.log('📊 Deletion Summary:')
    console.log(`   - Transactions: ${result.transactions}`)
    console.log(`   - Budgets: ${result.budgets}`)
    console.log(`   - Loans: ${result.loans}`)
    console.log(`   - Savings Goals: ${result.savingsGoals}`)
    console.log(`   - Recurring Expenses: ${result.recurringExpenses}`)
    console.log(`   - Notifications: ${result.notifications}`)
    console.log(`   - Notification Preferences: ${result.notificationPrefs}`)
    console.log(`   - Custom Categories: ${result.categories}`)
    console.log(`\n✅ User account preserved: ${user.email}\n`)
  }
  catch (error) {
    console.error('\n❌ Error resetting user data:', error)
    process.exit(1)
  }
  finally {
    await prisma.$disconnect()
  }
}

// Get email from command line arguments
const email = process.argv[2]

if (!email) {
  console.error('❌ Please provide a user email')
  console.log('\nUsage: npx tsx scripts/reset-user-data.ts <user-email>')
  console.log('Example: npx tsx scripts/reset-user-data.ts user@example.com')
  process.exit(1)
}

resetUserData(email)
