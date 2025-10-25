<script setup lang="ts">
import type { NotificationType } from '~/schemas/notifications'
import type { Notification } from '~/types'
import NotificationItem from '~/components/notifications/NotificationItem.vue'
import { NOTIFICATION_TYPE_OPTIONS } from '~/schemas/notifications'

interface Props {
  notifications: Notification[]
  loading: boolean
  selectedType: NotificationType | 'all'
  showUnreadOnly: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  markAsRead: [notification: Notification]
}>()

const filteredNotifications = computed(() => {
  let filtered = props.notifications

  if (props.showUnreadOnly) {
    filtered = filtered.filter(n => !n.isRead)
  }

  if (props.selectedType !== 'all') {
    filtered = filtered.filter(n => n.type === props.selectedType)
  }

  return filtered
})

const selectedTypeLabel = computed(() => {
  if (props.selectedType === 'all') { return 'All Notifications' }
  return NOTIFICATION_TYPE_OPTIONS.find(t => t.value === props.selectedType)?.label || 'Notifications'
})

function handleMarkAsRead(notification: Notification) {
  emit('markAsRead', notification)
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ selectedTypeLabel }}
        </h3>
        <span class="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {{ filteredNotifications.length }} notification{{ filteredNotifications.length !== 1 ? 's' : '' }}
        </span>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="flex items-center gap-3 text-gray-500 dark:text-gray-400">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-blue-500" />
        <span>Loading notifications...</span>
      </div>
    </div>

    <!-- Notifications -->
    <div v-else-if="filteredNotifications.length > 0" class="divide-y divide-gray-100">
      <NotificationItem
        v-for="notification in filteredNotifications"
        :key="notification.id"
        :notification="notification"
        @read="handleMarkAsRead"
      />
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-16">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <UIcon name="i-heroicons-bell-slash" class="w-8 h-8 text-gray-400" />
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        No notifications
      </h3>
      <p class="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
        {{
          showUnreadOnly ? 'No unread notifications at the moment.'
          : 'You are all caught up! Check back later for updates.'
        }}
      </p>
    </div>
  </div>
</template>
