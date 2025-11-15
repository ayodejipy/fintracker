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

// Quick Actions menu items
const quickActionItems = computed(() => [
  [
    {
      label: 'Analysis',
      type: 'label',
    },
  ],
  [
    {
      label: 'Income Analysis',
      icon: 'i-heroicons-arrow-trending-up',
      iconClass: 'text-green-500',
      to: '/income',
      description: 'View income breakdown',
    },
    {
      label: 'Expense Analysis',
      icon: 'i-heroicons-arrow-trending-down',
      iconClass: 'text-red-500',
      to: '/expenses',
      description: 'Analyze spending patterns',
    },
  ],
  [
    {
      label: 'Quick Actions',
      type: 'label',
    },
  ],
  [
    {
      label: 'Import Statement',
      icon: 'i-heroicons-arrow-up-tray',
      iconClass: 'text-blue-500',
      to: '/import-statement',
      description: 'Upload bank statement',
    },
    {
      label: 'Add Transaction',
      icon: 'i-heroicons-plus-circle',
      iconClass: 'text-purple-500',
      to: '/transactions?action=new',
      description: 'Record new transaction',
    },
    {
      label: 'Create Budget',
      icon: 'i-heroicons-calculator',
      iconClass: 'text-orange-500',
      to: '/budgets?action=new',
      description: 'Set up a new budget',
    },
  ],
])

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
        label: 'Settings',
        icon: 'i-heroicons-cog-6-tooth',
        to: '/settings',
      },
    ],
    [
      {
        label: 'Logout',
        icon: 'i-heroicons-arrow-right-on-rectangle',
        onSelect: () => logout(),
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
      <div class="flex items-center gap-2 sm:gap-3 relative">
        <!-- Quick Actions -->
        <UDropdownMenu :items="quickActionItems">
          <UButton
            color="primary"
            variant="soft"
            size="sm"
            class="hidden sm:flex items-center gap-2 px-3 py-2"
          >
            <UIcon name="i-heroicons-bolt" class="w-4 h-4" />
            <span class="font-medium text-sm">Quick Actions</span>
            <UIcon name="i-heroicons-chevron-down" class="w-3 h-3" />
          </UButton>
          <!-- Mobile version - icon only -->
          <UButton
            color="primary"
            variant="soft"
            size="sm"
            class="sm:hidden p-2"
          >
            <UIcon name="i-heroicons-bolt" class="w-5 h-5" />
          </UButton>
        </UDropdownMenu>

        <!-- Divider -->
        <div class="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

        <!-- Notifications -->
        <NotificationDropdown />

        <!-- Divider -->
        <div class="h-6 w-px bg-gray-200 dark:bg-gray-700" />

        <!-- User Profile -->
        <UDropdownMenu :items="userMenuItems">
          <UButton color="neutral" variant="ghost" class="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <UAvatar :alt="user?.user?.name || 'User'" size="sm" class="w-8 h-8">
              <template #fallback>
                <span class="text-sm font-semibold">
                  {{ (user?.user?.name || 'Eleanor').charAt(0) }}
                </span>
              </template>
            </UAvatar>
            <span class="hidden md:block font-medium text-sm text-gray-700 dark:text-gray-300">
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
