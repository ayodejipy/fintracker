<script setup lang="ts">
import type { Notification } from '~/types'
import { useNotifications } from '~/composables/useNotifications'

interface Props {
  notification: Notification
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
})

const emit = defineEmits<Emits>()

interface Emits {
  read: [notification: Notification]
  click: [notification: Notification]
}

const { getNotificationIcon, getNotificationColor, formatNotificationTime } = useNotifications()

async function handleMarkAsRead() {
  if (!props.notification.isRead) {
    emit('read', props.notification)
  }
}

function handleClick() {
  emit('click', props.notification)
  if (!props.notification.isRead) {
    handleMarkAsRead()
  }
}

const priorityClasses = computed(() => {
  const color = getNotificationColor(props.notification.priority)
  return {
    'border-l-blue-500 bg-blue-50': color === 'blue',
    'border-l-yellow-500 bg-yellow-50': color === 'yellow',
    'border-l-red-500 bg-red-50': color === 'red',
    'opacity-60': props.notification.isRead,
  }
})

const iconClasses = computed(() => {
  const color = getNotificationColor(props.notification.priority)
  return {
    'text-blue-600': color === 'blue',
    'text-yellow-600': color === 'yellow',
    'text-red-600': color === 'red',
  }
})
</script>

<template>
  <div
    class="border-l-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
    :class="priorityClasses"
    @click="handleClick"
  >
    <div class="flex items-start space-x-3">
      <!-- Icon -->
      <div class="flex-shrink-0">
        <UIcon
          :name="getNotificationIcon(notification.type)"
          class="w-5 h-5"
          :class="iconClasses"
        />
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h4 class="text-sm font-medium text-gray-900" :class="{ 'font-bold': !notification.isRead }">
              {{ notification.title }}
            </h4>
            <p class="text-sm text-gray-600 mt-1">
              {{ notification.message }}
            </p>
          </div>

          <!-- Unread indicator -->
          <div v-if="!notification.isRead" class="flex-shrink-0 ml-2">
            <div class="w-2 h-2 bg-blue-600 rounded-full" />
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between mt-3">
          <span class="text-xs text-gray-500">
            {{ formatNotificationTime(notification.createdAt) }}
          </span>

          <!-- Actions -->
          <div v-if="showActions" class="flex items-center space-x-2">
            <UButton
              v-if="!notification.isRead"
              variant="ghost"
              size="xs"
              @click.stop="handleMarkAsRead"
            >
              Mark as read
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
