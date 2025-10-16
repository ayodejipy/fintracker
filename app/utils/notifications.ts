import type {
  Budget,
  CreateNotificationInput,
  Loan,
  NotificationPriority,
  NotificationType,
  SavingsGoal,
} from '~/types'

export interface NotificationTemplate {
  type: NotificationType
  title: string
  message: string
  priority: NotificationPriority
}

/**
 * Notification service for creating and managing financial notifications
 */
export class NotificationService {
  /**
   * Create a budget alert notification
   */
  static createBudgetAlert(
    budget: Budget,
    utilizationPercentage: number,
    threshold: number = 80,
  ): CreateNotificationInput {
    const isOverBudget = utilizationPercentage > 100
    const isNearLimit = utilizationPercentage >= threshold && utilizationPercentage <= 100

    let priority: NotificationPriority = 'medium'
    let title = ''
    let message = ''

    if (isOverBudget) {
      priority = 'high'
      title = `Budget Exceeded: ${budget.category}`
      message = `You've exceeded your ${budget.category} budget by ${(utilizationPercentage - 100).toFixed(1)}%. Current spending: ₦${Number(budget.currentSpent).toLocaleString()}`
    }
    else if (isNearLimit) {
      priority = 'medium'
      title = `Budget Alert: ${budget.category}`
      message = `You've used ${utilizationPercentage.toFixed(1)}% of your ${budget.category} budget. ₦${(Number(budget.monthlyLimit) - Number(budget.currentSpent)).toLocaleString()} remaining.`
    }

    return {
      type: 'budget_alert',
      title,
      message,
      priority,
      budgetId: budget.id,
    }
  }

  /**
   * Create a payment reminder notification
   */
  static createPaymentReminder(
    loan: Loan,
    daysUntilDue: number,
  ): CreateNotificationInput {
    const priority: NotificationPriority = daysUntilDue <= 1 ? 'high' : 'medium'
    const dueText = daysUntilDue === 0
      ? 'today'
      : daysUntilDue === 1
        ? 'tomorrow'
        : `in ${daysUntilDue} days`

    return {
      type: 'payment_reminder',
      title: `Payment Due: ${loan.name}`,
      message: `Your ${loan.name} payment of ₦${Number(loan.monthlyPayment).toLocaleString()} is due ${dueText}.`,
      priority,
      loanId: loan.id,
    }
  }

  /**
   * Create a savings reminder notification
   */
  static createSavingsReminder(
    goal: SavingsGoal,
    missedContributions: number = 0,
  ): CreateNotificationInput {
    const priority: NotificationPriority = missedContributions > 1 ? 'high' : 'medium'

    let message = `Don't forget to contribute ₦${Number(goal.monthlyContribution).toLocaleString()} to your "${goal.name}" savings goal.`

    if (missedContributions > 0) {
      message += ` You've missed ${missedContributions} contribution${missedContributions > 1 ? 's' : ''} this month.`
    }

    return {
      type: 'savings_reminder',
      title: `Savings Reminder: ${goal.name}`,
      message,
      priority,
      savingsGoalId: goal.id,
    }
  }

  /**
   * Create a goal achievement notification
   */
  static createGoalAchievement(goal: SavingsGoal): CreateNotificationInput {
    return {
      type: 'goal_achieved',
      title: `🎉 Goal Achieved: ${goal.name}`,
      message: `Congratulations! You've successfully saved ₦${Number(goal.targetAmount).toLocaleString()} for your "${goal.name}" goal.`,
      priority: 'high',
      savingsGoalId: goal.id,
    }
  }

  /**
   * Create a goal milestone notification
   */
  static createGoalMilestone(
    goal: SavingsGoal,
    milestonePercentage: number,
  ): CreateNotificationInput {
    return {
      type: 'goal_milestone',
      title: `Milestone Reached: ${goal.name}`,
      message: `Great progress! You've reached ${milestonePercentage}% of your "${goal.name}" savings goal. Keep it up!`,
      priority: 'low',
      savingsGoalId: goal.id,
    }
  }

  /**
   * Create an overspending warning notification
   */
  static createOverspendingWarning(
    totalSpent: number,
    monthlyIncome: number,
    month: string,
  ): CreateNotificationInput {
    const spendingPercentage = (totalSpent / monthlyIncome) * 100

    return {
      type: 'overspending_warning',
      title: 'Overspending Alert',
      message: `You've spent ${spendingPercentage.toFixed(1)}% of your monthly income (₦${totalSpent.toLocaleString()}) in ${month}. Consider reviewing your expenses.`,
      priority: 'high',
    }
  }

  /**
   * Get notification icon based on type
   */
  static getNotificationIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      budget_alert: 'i-heroicons-exclamation-triangle',
      payment_reminder: 'i-heroicons-clock',
      savings_reminder: 'i-heroicons-banknotes',
      goal_achieved: 'i-heroicons-trophy',
      overspending_warning: 'i-heroicons-exclamation-circle',
      goal_milestone: 'i-heroicons-star',
    }

    return icons[type] || 'i-heroicons-bell'
  }

  /**
   * Get notification color based on priority
   */
  static getNotificationColor(priority: NotificationPriority): string {
    const colors: Record<NotificationPriority, string> = {
      low: 'blue',
      medium: 'yellow',
      high: 'red',
    }

    return colors[priority]
  }

  /**
   * Check if notification should be sent based on user preferences
   */
  static shouldSendNotification(
    type: NotificationType,
    preferences: any,
  ): boolean {
    const typeMapping: Record<NotificationType, keyof any> = {
      budget_alert: 'budgetAlerts',
      payment_reminder: 'paymentReminders',
      savings_reminder: 'savingsReminders',
      goal_achieved: 'goalAchievements',
      overspending_warning: 'budgetAlerts',
      goal_milestone: 'goalAchievements',
    }

    const preferenceKey = typeMapping[type]
    return preferences[preferenceKey] !== false
  }

  /**
   * Format notification for display
   */
  static formatNotificationTime(createdAt: Date): string {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) { return 'Just now' }
    if (diffInMinutes < 60) { return `${diffInMinutes}m ago` }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) { return `${diffInHours}h ago` }

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) { return `${diffInDays}d ago` }

    return createdAt.toLocaleDateString()
  }
}
