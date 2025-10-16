<script setup lang="ts">
interface Props {
  unreadCount: number
  loading?: boolean
}

const _props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  markAllAsRead: []
  refresh: []
}>()

function handleMarkAllAsRead() {
  emit('markAllAsRead')
}

function handleRefresh() {
  emit('refresh')
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
          <UIcon name="i-heroicons-bell" class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Notifications
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Stay updated with your financial activities
            <span
              v-if="unreadCount > 0"
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2"
            >
              {{ unreadCount }} unread
            </span>
          </p>
        </div>
      </div>

      <div class="flex items-center space-x-3">
        <UButton
          v-if="unreadCount > 0"
          variant="outline"
          size="sm"
          class="border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:bg-gray-700/50"
          @click="handleMarkAllAsRead"
        >
          <UIcon name="i-heroicons-check-circle" class="w-4 h-4 mr-2" />
          Mark all as read
        </UButton>

        <UButton
          variant="outline"
          size="sm"
          :loading="loading"
          class="border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:bg-gray-700/50"
          @click="handleRefresh"
        >
          <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-2" />
          Refresh
        </UButton>
      </div>
    </div>
  </div>
</template>
