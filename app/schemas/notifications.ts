import { z } from 'zod'

// Notification type enum
export const notificationTypeSchema = z.enum([
  'budget_alert',
  'payment_reminder',
  'savings_reminder',
  'goal_achieved',
  'overspending_warning',
  'goal_milestone',
])

// Notification filter schema
export const notificationFilterSchema = z.object({
  type: z.union([notificationTypeSchema, z.literal('all')]).default('all'),
  unreadOnly: z.boolean().default(false),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

// Type exports
export type NotificationType = z.infer<typeof notificationTypeSchema>
export type NotificationFilter = z.infer<typeof notificationFilterSchema>

// Notification type options for UI
export const NOTIFICATION_TYPE_OPTIONS = [
  { value: 'all', label: 'All Notifications' },
  { value: 'budget_alert', label: 'Budget Alerts' },
  { value: 'payment_reminder', label: 'Payment Reminders' },
  { value: 'savings_reminder', label: 'Savings Reminders' },
  { value: 'goal_achieved', label: 'Goal Achievements' },
  { value: 'overspending_warning', label: 'Overspending Warnings' },
  { value: 'goal_milestone', label: 'Goal Milestones' },
] as const

// Notification stats configuration
export const NOTIFICATION_STATS = [
  {
    key: 'budget_alert',
    title: 'Budget Alerts',
    icon: 'i-heroicons-exclamation-triangle',
    gradient: 'from-red-500 to-red-600',
  },
  {
    key: 'payment_reminder',
    title: 'Payment Reminders',
    icon: 'i-heroicons-clock',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    key: 'achievements',
    title: 'Achievements',
    icon: 'i-heroicons-trophy',
    gradient: 'from-green-500 to-green-600',
    types: ['goal_achieved', 'goal_milestone'],
  },
] as const
