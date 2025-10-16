<script setup lang="ts">
import { computed, ref } from 'vue'
import NotificationDropdown from '~/components/notifications/NotificationDropdown.vue'
import { useAuth } from '~/composables/useAuth'

// Define emits for mobile menu toggle
const emit = defineEmits<{
  toggleMobileMenu: []
}>()

const { user, logout } = useAuth()
const searchQuery = ref('')

// User dropdown menu items
const userMenuItems = computed(() => {
  const userData = user.value?.user
  return [
    [
      {
        label: userData?.name || 'Eleanor',
        avatar: {
          alt: userData?.name || 'User',
        },
        type: 'label',
      },
    ],
    [
      {
        label: 'Profile',
        icon: 'i-heroicons-user',
        to: '/profile',
      },
      {
        label: 'Settings',
        icon: 'i-heroicons-cog-6-tooth',
        to: '/settings',
        kbds: [','],
      },
    ],
    [
      {
        label: 'Support',
        icon: 'i-heroicons-question-mark-circle',
        to: '/support',
      },
      {
        label: 'Documentation',
        icon: 'i-heroicons-document-text',
        to: '/docs',
      },
    ],
    [
      {
        label: 'Logout',
        icon: 'i-heroicons-arrow-right-on-rectangle',
        click: () => logout(),
      },
    ],
  ]
})
</script>

<template>
  <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 transition-colors">
    <div class="flex items-center justify-between">
      <!-- Left Side - Mobile Menu + Search -->
      <div class="flex items-center gap-4 flex-1">
        <!-- Mobile Menu Button -->
        <button
          class="md:hidden p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded-lg transition-colors"
          @click="emit('toggleMobileMenu')"
        >
          <UIcon name="i-heroicons-bars-3" class="h-6 w-6" />
        </button>

        <!-- Search Bar -->
        <div class="flex-1 max-w-lg">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UIcon name="i-heroicons-magnifying-glass" class="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              v-model="searchQuery" type="text" placeholder="Search anything here..."
              class="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
            >
          </div>
        </div>
      </div>

      <!-- Right Side Actions -->
      <div class="flex items-center gap-2 sm:gap-4 relative">
        <!-- Notifications -->
        <NotificationDropdown />

        <!-- Messages -->
        <button
          class="relative p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded-lg transition-colors"
        >
          <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="h-6 w-6" />
          <!-- Message indicator -->
          <span class="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400" />
        </button>

        <!-- User Profile -->
        <UDropdownMenu :items="userMenuItems">
          <UButton color="neutral" variant="ghost" class="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <UAvatar :alt="user?.user?.name || 'User'" size="sm" class="w-8 h-8">
              <template #fallback>
                <span class="text-sm font-semibold">
                  {{ (user?.user?.name || 'Eleanor').charAt(0) }}
                </span>
              </template>
            </UAvatar>
            <span class="hidden sm:block font-medium text-sm text-gray-700 dark:text-gray-300">
              {{ user?.user?.name || 'Eleanor' }}
            </span>
            <UIcon name="i-heroicons-chevron-down" class="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </UButton>
        </UDropdownMenu>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* Component-specific styles can be added here */
</style>
