<script setup lang="ts">
import { ref } from 'vue'
import { useNotifications } from '~/composables/useNotifications'
import NotificationItem from './NotificationItem.vue'

const {
  notifications,
  unreadCount,
  loading,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
} = useNotifications()

const isOpen = ref(false)
const maxDisplayNotifications = 10 // Show more in modal
const lastFetchTime = ref(0)
const FETCH_COOLDOWN = 5000 // 5 seconds cooldown between fetches

// Fetch notifications on mount
onMounted(() => {
  fetchNotifications({ limit: maxDisplayNotifications }).catch(error => {
    console.error('Failed to fetch notifications on mount:', error)
  })
})

// Open modal function
function openModal() {
  isOpen.value = true

  // Only fetch if we haven't fetched recently (prevent spam)
  const now = Date.now()
  if (now - lastFetchTime.value > FETCH_COOLDOWN) {
    lastFetchTime.value = now
    fetchNotifications({ limit: maxDisplayNotifications }).catch(error => {
      console.error('Failed to fetch notifications:', error)
      // Don't rethrow to prevent error handler loops
    })
  }
}

async function handleMarkAsRead(notification: { id: string }) {
  try {
    await markAsRead(notification.id)
  }
  catch (error) {
    console.error('Failed to mark notification as read:', error)
  }
}

async function handleMarkAllAsRead() {
  try {
    await markAllAsRead()
  }
  catch (error) {
    console.error('Failed to mark all notifications as read:', error)
  }
}

function handleViewAll() {
  isOpen.value = false
  navigateTo('/notifications')
}

const displayNotifications = computed(() => {
  if (!notifications.value || !Array.isArray(notifications.value)) {
    return []
  }
  return notifications.value.slice(0, maxDisplayNotifications)
})
</script>

<template>
  <UPopover v-model:open="isOpen" :content="{ side: 'bottom', align: 'end' }">
    <button
      class="relative p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-colors"
      :class="{ 'text-gray-600': isOpen }"
      @click="openModal"
    >
      <UIcon name="i-heroicons-bell" class="w-6 h-6" />

      <!-- Unread count badge -->
      <span
        v-if="unreadCount > 0"
        class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <template #content>
      <div class="w-[400px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-bell" class="w-5 h-5 text-white" />
              <h3 class="text-base font-semibold text-white">
                Notifications
              </h3>
            </div>
            <span v-if="unreadCount > 0" class="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
              {{ unreadCount }} new
            </span>
          </div>
        </div>

        <!-- Actions Bar -->
        <div v-if="unreadCount > 0" class="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <UButton
            variant="ghost"
            size="xs"
            class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            @click="handleMarkAllAsRead"
          >
            <UIcon name="i-heroicons-check-circle" class="w-4 h-4 mr-1" />
            Mark all as read
          </UButton>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-12 px-4">
          <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-blue-500 mb-3" />
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Loading notifications...
          </p>
        </div>

        <!-- Notifications list -->
        <div v-else-if="displayNotifications && displayNotifications.length > 0" class="max-h-[400px] overflow-y-auto">
          <NotificationItem
            v-for="notification in displayNotifications"
            :key="notification.id"
            :notification="notification"
            :show-actions="false"
            class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
            @read="handleMarkAsRead"
          />
        </div>

        <!-- Empty state -->
        <div v-else class="flex flex-col items-center justify-center py-12 px-4">
          <div class="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
            <UIcon name="i-heroicons-bell-slash" class="w-7 h-7 text-gray-400 dark:text-gray-500" />
          </div>
          <h4 class="text-base font-medium text-gray-900 dark:text-white mb-1">
            All caught up!
          </h4>
          <p class="text-sm text-gray-500 dark:text-gray-400 text-center max-w-[280px]">
            No new notifications right now. We'll let you know when something happens.
          </p>
        </div>

        <!-- Footer -->
        <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
          <UButton
            variant="ghost"
            size="sm"
            class="w-full justify-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            @click="handleViewAll"
          >
            View all notifications
            <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 ml-1" />
          </UButton>
        </div>
      </div>
    </template>
  </UPopover>
</template>
