import { prisma } from '~/utils/database'
import { NotificationService } from '~/utils/notifications'

/**
 * Notification scheduler service for automated notification creation
 */
export class NotificationScheduler {
  /**
   * Check and create budget alerts for all users
   */
  static async checkBudgetAlerts(): Promise<void> {
    try {
      console.log('Checking budget alerts...')

      // Get all users with notification preferences
      const users = await prisma.user.findMany({
        include: {
          notificationPreferences: true,
          budgets: {
            where: {
              month: new Date().toISOString().slice(0, 7), // Current month
            },
          },
        },
      })

      for (const user of users) {
        const preferences = user.notificationPreferences

        // Skip if user has disabled budget alerts
        if (!preferences?.budgetAlerts) { continue }

        for (const budget of user.budgets) {
          const utilizationPercentage = Number(budget.monthlyLimit) > 0
            ? (Number(budget.currentSpent) / Number(budget.monthlyLimit)) * 100
            : 0

          const threshold = preferences?.budgetThreshold || 80

          // Check if we should create an alert
          if (utilizationPercentage >= threshold) {
            // Check if we already sent an alert for this budget recently
            const existingAlert = await prisma.notification.findFirst({
              where: {
                userId: user.id,
                type: 'budget_alert',
                budgetId: budget.id,
                createdAt: {
                  gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                },
              },
            })

            if (!existingAlert) {
              const notificationData = NotificationService.createBudgetAlert(
                budget as any,
                utilizationPercentage,
                threshold,
              )

              await prisma.notification.create({
                data: {
                  userId: user.id,
                  ...notificationData,
                },
              })

              console.log(`Created budget alert for user ${user.id}, budget ${budget.category}`)
            }
          }
        }
      }
    }
    catch (error) {
      console.error('Error checking budget alerts:', error)
    }
  }

  /**
   * Check and create payment reminders for all users
   */
  static async checkPaymentReminders(): Promise<void> {
    try {
      console.log('Checking payment reminders...')

      // Get all users with active loans and notification preferences
      const users = await prisma.user.findMany({
        include: {
          notificationPreferences: true,
          loans: {
            where: {
              currentBalance: {
                gt: 0,
              },
            },
          },
        },
      })

      for (const user of users) {
        const preferences = user.notificationPreferences

        // Skip if user has disabled payment reminders
        if (!preferences?.paymentReminders) { continue }

        const reminderDays = preferences?.reminderDaysBefore || 3

        for (const loan of user.loans) {
          // Calculate next payment date (assuming monthly payments on the same day as start date)
          const startDate = new Date(loan.startDate)
          const today = new Date()
          const nextPaymentDate = new Date(today.getFullYear(), today.getMonth(), startDate.getDate())

          // If the payment date has passed this month, set it for next month
          if (nextPaymentDate < today) {
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1)
          }

          const daysUntilPayment = Math.ceil((nextPaymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

          // Check if we should send a reminder
          if (daysUntilPayment <= reminderDays && daysUntilPayment >= 0) {
            // Check if we already sent a reminder for this payment
            const existingReminder = await prisma.notification.findFirst({
              where: {
                userId: user.id,
                type: 'payment_reminder',
                loanId: loan.id,
                createdAt: {
                  gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                },
              },
            })

            if (!existingReminder) {
              const notificationData = NotificationService.createPaymentReminder(
                loan as any,
                daysUntilPayment,
              )

              await prisma.notification.create({
                data: {
                  userId: user.id,
                  ...notificationData,
                },
              })

              console.log(`Created payment reminder for user ${user.id}, loan ${loan.name}`)
            }
          }
        }
      }
    }
    catch (error) {
      console.error('Error checking payment reminders:', error)
    }
  }

  /**
   * Check and create savings reminders for all users
   */
  static async checkSavingsReminders(): Promise<void> {
    try {
      console.log('Checking savings reminders...')

      // Get all users with active savings goals
      const users = await prisma.user.findMany({
        include: {
          notificationPreferences: true,
          savingsGoals: true,
        },
      })

      for (const user of users) {
        const preferences = user.notificationPreferences

        // Skip if user has disabled savings reminders
        if (!preferences?.savingsReminders) { continue }

        for (const goal of user.savingsGoals) {
          // Check if user has made a contribution this month
          const currentMonth = new Date().toISOString().slice(0, 7)
          const contributionThisMonth = await prisma.transaction.findFirst({
            where: {
              userId: user.id,
              type: 'expense',
              category: 'savings',
              date: {
                gte: new Date(`${currentMonth}-01`),
                lt: new Date(new Date(`${currentMonth}-01`).getFullYear(), new Date(`${currentMonth}-01`).getMonth() + 1, 1),
              },
            },
          })

          // If no contribution this month, send reminder
          if (!contributionThisMonth) {
            // Check if we already sent a reminder this month
            const existingReminder = await prisma.notification.findFirst({
              where: {
                userId: user.id,
                type: 'savings_reminder',
                savingsGoalId: goal.id,
                createdAt: {
                  gte: new Date(`${currentMonth}-01`),
                },
              },
            })

            if (!existingReminder) {
              const notificationData = NotificationService.createSavingsReminder(goal as any)

              await prisma.notification.create({
                data: {
                  userId: user.id,
                  ...notificationData,
                },
              })

              console.log(`Created savings reminder for user ${user.id}, goal ${goal.name}`)
            }
          }
        }
      }
    }
    catch (error) {
      console.error('Error checking savings reminders:', error)
    }
  }

  /**
   * Check and create goal achievement notifications
   */
  static async checkGoalAchievements(): Promise<void> {
    try {
      console.log('Checking goal achievements...')

      // Get all users with savings goals that have reached their target
      const users = await prisma.user.findMany({
        include: {
          notificationPreferences: true,
          savingsGoals: {
            where: {
              currentAmount: {
                gte: prisma.savingsGoal.fields.targetAmount,
              },
            },
          },
        },
      })

      for (const user of users) {
        const preferences = user.notificationPreferences

        // Skip if user has disabled goal achievement notifications
        if (!preferences?.goalAchievements) { continue }

        for (const goal of user.savingsGoals) {
          // Check if we already sent an achievement notification
          const existingNotification = await prisma.notification.findFirst({
            where: {
              userId: user.id,
              type: 'goal_achieved',
              savingsGoalId: goal.id,
            },
          })

          if (!existingNotification) {
            const notificationData = NotificationService.createGoalAchievement(goal as any)

            await prisma.notification.create({
              data: {
                userId: user.id,
                ...notificationData,
              },
            })

            console.log(`Created goal achievement notification for user ${user.id}, goal ${goal.name}`)
          }
        }
      }
    }
    catch (error) {
      console.error('Error checking goal achievements:', error)
    }
  }

  /**
   * Check and create milestone notifications
   */
  static async checkGoalMilestones(): Promise<void> {
    try {
      console.log('Checking goal milestones...')

      const users = await prisma.user.findMany({
        include: {
          notificationPreferences: true,
          savingsGoals: true,
        },
      })

      const milestones = [25, 50, 75] // Percentage milestones

      for (const user of users) {
        const preferences = user.notificationPreferences

        if (!preferences?.goalAchievements) { continue }

        for (const goal of user.savingsGoals) {
          const progress = Number(goal.targetAmount) > 0
            ? (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100
            : 0

          for (const milestone of milestones) {
            if (progress >= milestone) {
              // Check if we already sent this milestone notification
              const existingNotification = await prisma.notification.findFirst({
                where: {
                  userId: user.id,
                  type: 'goal_milestone',
                  savingsGoalId: goal.id,
                  message: {
                    contains: `${milestone}%`,
                  },
                },
              })

              if (!existingNotification) {
                const notificationData = NotificationService.createGoalMilestone(goal as any, milestone)

                await prisma.notification.create({
                  data: {
                    userId: user.id,
                    ...notificationData,
                  },
                })

                console.log(`Created ${milestone}% milestone notification for user ${user.id}, goal ${goal.name}`)
              }
            }
          }
        }
      }
    }
    catch (error) {
      console.error('Error checking goal milestones:', error)
    }
  }

  /**
   * Run all notification checks
   */
  static async runAllChecks(): Promise<void> {
    console.log('Running all notification checks...')

    await Promise.all([
      this.checkBudgetAlerts(),
      this.checkPaymentReminders(),
      this.checkSavingsReminders(),
      this.checkGoalAchievements(),
      this.checkGoalMilestones(),
    ])

    console.log('All notification checks completed')
  }
}
