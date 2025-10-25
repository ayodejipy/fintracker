import type {
  ApiResponse,
  CreateNotificationInput,
  Notification,
  NotificationPreferences,
  NotificationType,
} from '~/types'
import { computed, readonly, ref } from 'vue'

export function useNotifications() {
  const notifications = ref<Notification[]>([])
  const preferences = ref<NotificationPreferences | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const unreadCount = ref(0)

  // Computed properties
  const unreadNotifications = computed(() =>
    notifications.value.filter(n => !n.isRead),
  )

  const highPriorityNotifications = computed(() =>
    notifications.value.filter(n => n.priority === 'high' && !n.isRead),
  )

  const notificationsByType = computed(() => {
    const grouped: Record<NotificationType, Notification[]> = {
      budget_alert: [],
      payment_reminder: [],
      savings_reminder: [],
      goal_achieved: [],
      overspending_warning: [],
      goal_milestone: [],
    }

    notifications.value.forEach((notification) => {
      if (grouped[notification.type]) {
        grouped[notification.type].push(notification)
      }
    })

    return grouped
  })

  // Actions
  const fetchNotifications = async (options: {
    page?: number
    limit?: number
    unreadOnly?: boolean
    type?: NotificationType
  } = {}) => {
    try {
      loading.value = true
      error.value = null

      const query: Record<string, string> = {}
      if (options.page) { query.page = options.page.toString() }
      if (options.limit) { query.limit = options.limit.toString() }
      if (options.unreadOnly) { query.unreadOnly = 'true' }
      if (options.type) { query.type = options.type }

      const response = await $fetch<ApiResponse<{
        data: Notification[]
        unreadCount: number
        pagination: any
      }>>('/api/notifications', { query })

      if (response.success && response.data) {
        notifications.value = response.data.data
        unreadCount.value = response.data.unreadCount
      }
      else {
        error.value = response.message || 'Failed to fetch notifications'
      }
    }
    catch (err: any) {
      console.error('Error fetching notifications:', err)
      error.value = err.data?.message || 'Failed to fetch notifications'
    }
    finally {
      loading.value = false
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await $fetch<ApiResponse<Notification>>(
        `/api/notifications/${notificationId}/read`,
        { method: 'POST' },
      )

      if (response.success) {
        // Update local state
        const notification = notifications.value.find(n => n.id === notificationId)
        if (notification) {
          notification.isRead = true
          notification.readAt = new Date()
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        }
      }
    }
    catch (err: any) {
      console.error('Error marking notification as read:', err)
      throw new Error(err.data?.message || 'Failed to mark notification as read')
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await $fetch<ApiResponse<{ updatedCount: number }>>(
        '/api/notifications/mark-all-read',
        { method: 'POST' },
      )

      if (response.success) {
        // Update local state
        notifications.value.forEach((notification) => {
          if (!notification.isRead) {
            notification.isRead = true
            notification.readAt = new Date()
          }
        })
        unreadCount.value = 0
      }
    }
    catch (err: any) {
      console.error('Error marking all notifications as read:', err)
      throw new Error(err.data?.message || 'Failed to mark all notifications as read')
    }
  }

  const createNotification = async (data: CreateNotificationInput) => {
    try {
      const response = await $fetch<ApiResponse<Notification>>(
        '/api/notifications',
        {
          method: 'POST',
          body: data,
        },
      )

      if (response.success && response.data) {
        // Add to local state
        notifications.value.unshift(response.data)
        if (!response.data.isRead) {
          unreadCount.value += 1
        }
        return response.data
      }
      else {
        throw new Error(response.message || 'Failed to create notification')
      }
    }
    catch (err: any) {
      console.error('Error creating notification:', err)
      throw new Error(err.data?.message || 'Failed to create notification')
    }
  }

  const fetchPreferences = async () => {
    try {
      const response = await $fetch<ApiResponse<NotificationPreferences>>(
        '/api/notifications/preferences',
      )

      if (response.success && response.data) {
        preferences.value = response.data
      }
      else {
        error.value = response.message || 'Failed to fetch preferences'
      }
    }
    catch (err: any) {
      console.error('Error fetching notification preferences:', err)
      error.value = err.data?.message || 'Failed to fetch preferences'
    }
  }

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    try {
      const response = await $fetch<ApiResponse<NotificationPreferences>>(
        '/api/notifications/preferences',
        {
          method: 'PUT',
          body: updates,
        },
      )

      if (response.success && response.data) {
        preferences.value = response.data
        return response.data
      }
      else {
        throw new Error(response.message || 'Failed to update preferences')
      }
    }
    catch (err: any) {
      console.error('Error updating notification preferences:', err)
      throw new Error(err.data?.message || 'Failed to update preferences')
    }
  }

  // Prevent spam calls to notification check
  let lastCheckTime = 0
  const CHECK_COOLDOWN = 30000 // 30 seconds

  const triggerNotificationCheck = async () => {
    const now = Date.now()
    if (now - lastCheckTime < CHECK_COOLDOWN) {
      console.warn('Notification check called too frequently, skipping')
      return
    }

    try {
      lastCheckTime = now
      await $fetch('/api/notifications/check', { method: 'POST' })
      // Refresh notifications after check
      await fetchNotifications()
    }
    catch (err: unknown) {
      console.error('Error triggering notification check:', err)
      throw new Error(err.data?.message || 'Failed to trigger notification check')
    }
  }

  // Utility functions
  const getNotificationIcon = (type: NotificationType): string => {
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

  const getNotificationColor = (priority: string): string => {
    const colors: Record<string, string> = {
      low: 'blue',
      medium: 'yellow',
      high: 'red',
    }
    return colors[priority] || 'gray'
  }

  const formatNotificationTime = (createdAt: Date | string): string => {
    const date = new Date(createdAt)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) { return 'Just now' }
    if (diffInMinutes < 60) { return `${diffInMinutes}m ago` }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) { return `${diffInHours}h ago` }

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) { return `${diffInDays}d ago` }

    return date.toLocaleDateString()
  }

  return {
    // State
    notifications: readonly(notifications),
    preferences: readonly(preferences),
    loading: readonly(loading),
    error: readonly(error),
    unreadCount: readonly(unreadCount),

    // Computed
    unreadNotifications,
    highPriorityNotifications,
    notificationsByType,

    // Actions
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
    fetchPreferences,
    updatePreferences,
    triggerNotificationCheck,

    // Utilities
    getNotificationIcon,
    getNotificationColor,
    formatNotificationTime,
  }
}
