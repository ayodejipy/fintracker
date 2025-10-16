<script setup lang="ts">
import { useSidebar } from '~/composables/useSidebar'

const route = useRoute()
const { logout } = useAuth()
const { isCollapsed, isMobile, toggleSidebar, setMobile } = useSidebar()

interface MenuItem {
  name: string
  icon: string
  path: string
  active: boolean
  badge?: string | number
  hasSubmenu?: boolean
}

const menuItems = computed((): MenuItem[] => [
  {
    name: 'Dashboard',
    icon: 'i-heroicons-squares-2x2',
    path: '/dashboard',
    active: route.path === '/dashboard',
  },
  {
    name: 'Transactions',
    icon: 'i-heroicons-clipboard-document-list',
    path: '/transactions',
    active: route.path.startsWith('/transactions'),
  },
  {
    name: 'Budgets',
    icon: 'i-heroicons-calculator',
    path: '/budgets',
    active: route.path.startsWith('/budgets'),
  },
  {
    name: 'Savings',
    icon: 'i-heroicons-banknotes',
    path: '/savings',
    active: route.path.startsWith('/savings'),
  },
  {
    name: 'Loans',
    icon: 'i-heroicons-chart-bar',
    path: '/loans',
    active: route.path.startsWith('/loans'),
  },
  {
    name: 'Recurring Expenses',
    icon: 'i-heroicons-arrow-path',
    path: '/recurring-expenses',
    active: route.path.startsWith('/recurring-expenses'),
  },
  {
    name: 'Notifications',
    icon: 'i-heroicons-bell',
    path: '/notifications',
    active: route.path === '/notifications',
  },
  {
    name: 'Settings',
    icon: 'i-heroicons-cog-6-tooth',
    path: '/settings',
    active: route.path === '/settings',
  },
  {
    name: 'Performance',
    icon: 'i-heroicons-chart-pie',
    path: '/performance',
    active: route.path === '/performance',
  },
])

// Check for mobile screen size
function checkMobile() {
  const mobile = window.innerWidth < 768
  setMobile(mobile)
}

// Logout handler
async function handleLogout() {
  try {
    await logout()
  }
  catch (error) {
    console.error('Logout failed:', error)
  }
}

// Lifecycle hooks
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<template>
  <!-- Mobile Overlay -->
  <div
    v-if="isMobile && !isCollapsed"
    class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
    @click="toggleSidebar"
  />

  <!-- Sidebar -->
  <div
    class="bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col h-screen fixed left-0 top-0 transition-all duration-300 ease-in-out z-50 overflow-hidden shadow-xl dark:shadow-2xl"
    :class="{
      'w-72': !isCollapsed,
      'w-20': isCollapsed && !isMobile,
      'w-0 -translate-x-full': isCollapsed && isMobile,
    }"
  >
  
  <!-- Logo Section -->
  <div class="min-w-0 border-b border-gray-100 dark:border-gray-800 relative bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900" :class="isCollapsed ? 'p-5' : 'p-6'">
      <!-- Collapse Toggle Button - Fixed over sidebar -->
      <button
        class="fixed top-6 -right-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 size-9 rounded-full p-1.5 shadow-lg hover:shadow-xl hover:scale-110 transition-all hidden md:flex items-center justify-center z-[60]"
        :class="isCollapsed ? 'left-[60px]' : 'left-[270px]'"
        @click="toggleSidebar"
      >
        <UIcon
          :name="isCollapsed ? 'i-heroicons-chevron-right' : 'i-heroicons-chevron-left'"
          class="w-4 h-4 text-gray-700 dark:text-gray-300"
        />
      </button>

      <div class="flex items-center" :class="isCollapsed ? 'justify-center' : 'gap-3'">
        <div class="w-11 h-11 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-blue-100 dark:ring-blue-900/30">
          <UIcon name="i-heroicons-currency-dollar" class="w-6 h-6 text-white" />
        </div>
        <div v-if="!isCollapsed" class="transition-opacity duration-200">
          <h2 class="font-bold text-gray-900 dark:text-white text-lg tracking-tight">
            FinanceTracker
          </h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Personal Finance
          </p>
        </div>
      </div>
    </div>

    <!-- Menu Section -->
    <div class="flex-1 py-6 overflow-y-auto px-3">
      <div v-if="!isCollapsed" class="px-2 mb-3">
        <p class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Navigation
        </p>
      </div>

      <nav class="space-y-1">
        <div v-for="item in menuItems" :key="item.name" class="relative">
          <NuxtLink
            :to="item.path"
            class="w-full flex items-center text-sm font-semibold rounded-2xl transition-all duration-200 group relative overflow-hidden"
            :class="{
              'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-900/40 scale-[1.02]': item.active,
              'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 hover:scale-[1.01]': !item.active,
              'px-4 py-3.5 gap-3': !isCollapsed,
              'px-4 py-3.5 justify-center': isCollapsed,
            }"
            @click="isMobile && toggleSidebar()"
          >
            <!-- Active indicator -->
            <div
              v-if="item.active && !isCollapsed"
              class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"
            />

            <UIcon
              :name="item.icon"
              class="w-5 h-5 flex-shrink-0 transition-transform duration-200"
              :class="{
                'text-white': item.active,
                'group-hover:scale-110': !item.active,
              }"
            />

            <span
              v-if="!isCollapsed"
              class="flex-1 text-left transition-opacity duration-200"
            >
              {{ item.name }}
            </span>

            <!-- Badge -->
            <span
              v-if="item.badge && !isCollapsed"
              class="bg-red-500 text-white text-xs rounded-full px-2.5 py-0.5 min-w-[22px] text-center font-bold shadow-sm"
            >
              {{ item.badge }}
            </span>

            <!-- Tooltip for collapsed state -->
            <div
              v-if="isCollapsed"
              class="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl"
            >
              {{ item.name }}
              <div class="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1.5 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
            </div>
          </NuxtLink>
        </div>
      </nav>
    </div>

    <!-- Bottom Section -->
    <div class="border-t border-gray-100 dark:border-gray-800 p-3">
      <!-- Log out -->
      <button
        class="w-full flex items-center text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all duration-200 group relative hover:scale-[1.01]"
        :class="{
          'px-4 py-3.5 gap-3': !isCollapsed,
          'px-4 py-3.5 justify-center': isCollapsed,
        }"
        @click="handleLogout"
      >
        <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
        <span v-if="!isCollapsed" class="transition-opacity duration-200">Log out</span>

        <!-- Tooltip for collapsed state -->
        <div
          v-if="isCollapsed"
          class="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl"
        >
          Log out
          <div class="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1.5 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
        </div>
      </button>

      <!-- Quick Stats Section -->
      <div
        v-if="!isCollapsed"
        class="mt-3 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl p-4 text-white shadow-xl shadow-blue-500/20 dark:shadow-blue-900/30 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
      >
        <div class="flex items-center gap-2 mb-2">
          <div class="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm ring-2 ring-white/30">
            <UIcon name="i-heroicons-chart-bar-square" class="w-4 h-4" />
          </div>
          <span class="font-bold text-sm">Quick Stats</span>
        </div>
        <p class="text-xs text-white/90 mb-3 leading-relaxed">
          Track your financial progress and stay on top of your goals
        </p>
        <NuxtLink
          to="/dashboard"
          class="w-full bg-white/20 hover:bg-white/30 text-white text-sm font-semibold py-2.5 px-3 rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/30 flex items-center justify-center"
        >
          View Dashboard
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Smooth transitions with custom easing */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Custom scrollbar styling */
.overflow-y-auto::-webkit-scrollbar {
  width: 5px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
  margin: 8px 0;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.2);
  border-radius: 10px;
  transition: background 0.2s;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.4);
}

/* Dark mode scrollbar */
.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.3);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(75, 85, 99, 0.5);
}

/* Backdrop blur fallback */
@supports not (backdrop-filter: blur(4px)) {
  .backdrop-blur-sm {
    background-color: rgba(255, 255, 255, 0.3);
  }
}

/* Smooth scale animations */
@keyframes scaleIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
