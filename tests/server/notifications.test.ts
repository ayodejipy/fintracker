import { PrismaClient } from '@prisma/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { NotificationService } from '~/utils/notifications'

const prisma = new PrismaClient()

describe('notification System', () => {
  let testUserId: string
  let testBudget: any
  let testLoan: any
  let testSavingsGoal: any

  beforeEach(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test-notifications@example.com',
        name: 'Test User',
        password: 'hashedpassword',
        monthlyIncome: 500000,
        currency: 'NGN',
      },
    })
    testUserId = user.id

    // Create test budget
    testBudget = await prisma.budget.create({
      data: {
        userId: testUserId,
        category: 'food',
        monthlyLimit: 100000,
        currentSpent: 85000,
        month: new Date().toISOString().slice(0, 7),
      },
    })

    // Create test loan
    testLoan = await prisma.loan.create({
      data: {
        userId: testUserId,
        name: 'Test Loan',
        initialAmount: 1000000,
        currentBalance: 500000,
        monthlyPayment: 50000,
        interestRate: 0.15,
        startDate: new Date('2024-01-01'),
        projectedPayoffDate: new Date('2025-01-01'),
      },
    })

    // Create test savings goal
    testSavingsGoal = await prisma.savingsGoal.create({
      data: {
        userId: testUserId,
        name: 'Test Goal',
        targetAmount: 1000000,
        currentAmount: 250000,
        targetDate: new Date('2024-12-31'),
        monthlyContribution: 50000,
      },
    })
  })

  afterEach(async () => {
    // Clean up test data
    await prisma.notification.deleteMany({ where: { userId: testUserId } })
    await prisma.savingsGoal.deleteMany({ where: { userId: testUserId } })
    await prisma.loan.deleteMany({ where: { userId: testUserId } })
    await prisma.budget.deleteMany({ where: { userId: testUserId } })
    await prisma.notificationPreferences.deleteMany({ where: { userId: testUserId } })
    await prisma.user.delete({ where: { id: testUserId } })
  })

  describe('notificationService', () => {
    it('should create budget alert for overspending', () => {
      const notification = NotificationService.createBudgetAlert(testBudget, 120, 80)

      expect(notification.type).toBe('budget_alert')
      expect(notification.priority).toBe('high')
      expect(notification.title).toContain('Budget Exceeded')
      expect(notification.message).toContain('exceeded')
      expect(notification.budgetId).toBe(testBudget.id)
    })

    it('should create budget alert for near limit', () => {
      const notification = NotificationService.createBudgetAlert(testBudget, 85, 80)

      expect(notification.type).toBe('budget_alert')
      expect(notification.priority).toBe('medium')
      expect(notification.title).toContain('Budget Alert')
      expect(notification.message).toContain('85.0%')
    })

    it('should create payment reminder', () => {
      const notification = NotificationService.createPaymentReminder(testLoan, 2)

      expect(notification.type).toBe('payment_reminder')
      expect(notification.priority).toBe('medium')
      expect(notification.title).toContain('Payment Due')
      expect(notification.message).toContain('in 2 days')
      expect(notification.loanId).toBe(testLoan.id)
    })

    it('should create high priority payment reminder for due today', () => {
      const notification = NotificationService.createPaymentReminder(testLoan, 0)

      expect(notification.priority).toBe('high')
      expect(notification.message).toContain('today')
    })

    it('should create savings reminder', () => {
      const notification = NotificationService.createSavingsReminder(testSavingsGoal)

      expect(notification.type).toBe('savings_reminder')
      expect(notification.title).toContain('Savings Reminder')
      expect(notification.message).toContain('₦50,000')
      expect(notification.savingsGoalId).toBe(testSavingsGoal.id)
    })

    it('should create goal achievement notification', () => {
      const notification = NotificationService.createGoalAchievement(testSavingsGoal)

      expect(notification.type).toBe('goal_achieved')
      expect(notification.priority).toBe('high')
      expect(notification.title).toContain('Goal Achieved')
      expect(notification.message).toContain('Congratulations')
    })

    it('should create goal milestone notification', () => {
      const notification = NotificationService.createGoalMilestone(testSavingsGoal, 50)

      expect(notification.type).toBe('goal_milestone')
      expect(notification.priority).toBe('low')
      expect(notification.title).toContain('Milestone Reached')
      expect(notification.message).toContain('50%')
    })

    it('should create overspending warning', () => {
      const notification = NotificationService.createOverspendingWarning(600000, 500000, 'January 2024')

      expect(notification.type).toBe('overspending_warning')
      expect(notification.priority).toBe('high')
      expect(notification.title).toContain('Overspending Alert')
      expect(notification.message).toContain('120.0%')
    })

    it('should get correct notification icon', () => {
      expect(NotificationService.getNotificationIcon('budget_alert')).toBe('i-heroicons-exclamation-triangle')
      expect(NotificationService.getNotificationIcon('goal_achieved')).toBe('i-heroicons-trophy')
    })

    it('should get correct notification color', () => {
      expect(NotificationService.getNotificationColor('high')).toBe('red')
      expect(NotificationService.getNotificationColor('medium')).toBe('yellow')
      expect(NotificationService.getNotificationColor('low')).toBe('blue')
    })

    it('should check notification preferences correctly', () => {
      const preferences = {
        budgetAlerts: true,
        paymentReminders: false,
        savingsReminders: true,
        goalAchievements: true,
      }

      expect(NotificationService.shouldSendNotification('budget_alert', preferences)).toBe(true)
      expect(NotificationService.shouldSendNotification('payment_reminder', preferences)).toBe(false)
      expect(NotificationService.shouldSendNotification('savings_reminder', preferences)).toBe(true)
    })

    it('should format notification time correctly', () => {
      const now = new Date()
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

      expect(NotificationService.formatNotificationTime(fiveMinutesAgo)).toBe('5m ago')
      expect(NotificationService.formatNotificationTime(twoHoursAgo)).toBe('2h ago')
      expect(NotificationService.formatNotificationTime(threeDaysAgo)).toBe('3d ago')
    })
  })

  describe('notification API', () => {
    it('should create notification preferences with defaults', async () => {
      const preferences = await prisma.notificationPreferences.create({
        data: {
          userId: testUserId,
        },
      })

      expect(preferences.budgetAlerts).toBe(true)
      expect(preferences.paymentReminders).toBe(true)
      expect(preferences.savingsReminders).toBe(true)
      expect(preferences.goalAchievements).toBe(true)
      expect(preferences.budgetThreshold).toBe(80)
      expect(preferences.reminderDaysBefore).toBe(3)
    })

    it('should create notification successfully', async () => {
      const notificationData = {
        userId: testUserId,
        type: 'budget_alert',
        title: 'Test Notification',
        message: 'This is a test notification',
        priority: 'medium',
        budgetId: testBudget.id,
      }

      const notification = await prisma.notification.create({
        data: notificationData,
      })

      expect(notification.type).toBe('budget_alert')
      expect(notification.title).toBe('Test Notification')
      expect(notification.isRead).toBe(false)
      expect(notification.budgetId).toBe(testBudget.id)
    })

    it('should mark notification as read', async () => {
      const notification = await prisma.notification.create({
        data: {
          userId: testUserId,
          type: 'budget_alert',
          title: 'Test Notification',
          message: 'This is a test notification',
          priority: 'medium',
        },
      })

      const updatedNotification = await prisma.notification.update({
        where: { id: notification.id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

      expect(updatedNotification.isRead).toBe(true)
      expect(updatedNotification.readAt).toBeDefined()
    })

    it('should get notifications with pagination', async () => {
      // Create multiple notifications
      for (let i = 0; i < 5; i++) {
        await prisma.notification.create({
          data: {
            userId: testUserId,
            type: 'budget_alert',
            title: `Test Notification ${i}`,
            message: `This is test notification ${i}`,
            priority: 'medium',
          },
        })
      }

      const notifications = await prisma.notification.findMany({
        where: { userId: testUserId },
        orderBy: { createdAt: 'desc' },
        take: 3,
      })

      expect(notifications).toHaveLength(3)
      expect(notifications[0].title).toMatch(/Test Notification \d/)
    })

    it('should count unread notifications', async () => {
      // Create notifications with different read status
      await prisma.notification.create({
        data: {
          userId: testUserId,
          type: 'budget_alert',
          title: 'Unread Notification',
          message: 'This is unread',
          priority: 'medium',
          isRead: false,
        },
      })

      await prisma.notification.create({
        data: {
          userId: testUserId,
          type: 'budget_alert',
          title: 'Read Notification',
          message: 'This is read',
          priority: 'medium',
          isRead: true,
          readAt: new Date(),
        },
      })

      const unreadCount = await prisma.notification.count({
        where: {
          userId: testUserId,
          isRead: false,
        },
      })

      expect(unreadCount).toBe(1)
    })
  })
})
