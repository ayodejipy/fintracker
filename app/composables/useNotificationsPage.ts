import type { NotificationType } from '~/schemas/notifications'

export function useNotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    notificationsByType,
  } = useNotifications()

  // Filters
  const selectedType = ref<NotificationType | 'all'>('all')
  const showUnreadOnly = ref(false)

  // Pagination
  const currentPage = ref(1)
  const itemsPerPage = 20

  // Load notifications with current filters
  async function loadNotifications() {
    const options: any = {
      page: currentPage.value,
      limit: itemsPerPage,
      unreadOnly: showUnreadOnly.value,
    }

    if (selectedType.value !== 'all') {
      options.type = selectedType.value
    }

    await fetchNotifications(options)
  }

  // Watch for filter changes
  watch([selectedType, showUnreadOnly, currentPage], () => {
    loadNotifications()
  })

  // Handle mark as read with error handling
  async function handleMarkAsRead(notification: any) {
    try {
      await markAsRead(notification.id)
    }
    catch (error) {
      console.error('Failed to mark notification as read:', error)
      const toast = useToast()
      toast.add({
        title: 'Error',
        description: 'Failed to mark notification as read',
        color: 'red',
      })
    }
  }

  // Handle mark all as read with success/error handling
  async function handleMarkAllAsRead() {
    try {
      await markAllAsRead()
      const toast = useToast()
      toast.add({
        title: 'Success',
        description: 'All notifications marked as read',
        color: 'green',
      })
    }
    catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      const toast = useToast()
      toast.add({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        color: 'red',
      })
    }
  }

  // Handle refresh
  function handleRefresh() {
    loadNotifications()
  }

  // Initialize on mount
  onMounted(async () => {
    try {
      await loadNotifications()
    }
    catch (error) {
      console.error('Error loading notifications:', error)
    }
  })

  return {
    // State
    notifications,
    unreadCount,
    loading,
    notificationsByType,
    selectedType,
    showUnreadOnly,
    currentPage,

    // Actions
    loadNotifications,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleRefresh,
  }
}
