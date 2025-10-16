<script setup lang="ts">
import type { Notification } from '~/types'
import { useNotifications } from '~/composables/useNotifications'

interface Props {
  notification: Notification
  autoClose?: boolean
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoClose: true,
  duration: 5000,
})

const emit = defineEmits<Emits>()

interface Emits {
  close: []
  action: [notification: Notification]
}

const { getNotificationIcon, getNotificationColor } = useNotifications()

const visible = ref(true)

// Auto close timer
if (props.autoClose) {
  setTimeout(() => {
    visible.value = false
    emit('close')
  }, props.duration)
}

function handleClose() {
  visible.value = false
  emit('close')
}

function handleAction() {
  emit('action', props.notification)
  handleClose()
}

const toastClasses = computed(() => {
  const color = getNotificationColor(props.notification.priority)
  return {
    'border-l-blue-500': color === 'blue',
    'border-l-yellow-500': color === 'yellow',
    'border-l-red-500': color === 'red',
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
  <Transition
    enter-active-class="transform ease-out duration-300 transition"
    enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
    enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
    leave-active-class="transition ease-in duration-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="visible"
      class="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 border-l-4"
      :class="toastClasses"
    >
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <UIcon
              :name="getNotificationIcon(notification.type)"
              class="w-5 h-5"
              :class="iconClasses"
            />
          </div>
          <div class="ml-3 w-0 flex-1 pt-0.5">
            <p class="text-sm font-medium text-gray-900">
              {{ notification.title }}
            </p>
            <p class="mt-1 text-sm text-gray-500">
              {{ notification.message }}
            </p>
            <div v-if="notification.type === 'budget_alert' || notification.type === 'payment_reminder'" class="mt-3 flex space-x-7">
              <button
                type="button"
                class="bg-white rounded-md text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                @click="handleAction"
              >
                View Details
              </button>
            </div>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <button
              class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              @click="handleClose"
            >
              <span class="sr-only">Close</span>
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
