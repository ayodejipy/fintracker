<script setup lang="ts">
import { useSidebar } from '~/composables/useSidebar'

const route = useRoute()
const { isCollapsed, isMobile, toggleSidebar, setMobile } = useSidebar()

interface MenuItem {
  name: string
  icon: string
  path: string
  active: boolean
  badge?: string | number
  shortcut?: string
}

// All navigation items in a flat, Linear-style structure
const navigationItems = computed((): MenuItem[] => [
  {
    name: 'Home',
    icon: 'i-heroicons-home',
    path: '/dashboard',
    active: route.path === '/dashboard',
  },
  {
    name: 'Transactions',
    icon: 'i-heroicons-rectangle-stack',
    path: '/transactions',
    active: route.path.startsWith('/transactions'),
  },
  {
    name: 'Income',
    icon: 'i-heroicons-arrow-trending-up',
    path: '/income',
    active: route.path === '/income',
  },
  {
    name: 'Expenses',
    icon: 'i-heroicons-arrow-trending-down',
    path: '/expenses',
    active: route.path === '/expenses',
  },
  {
    name: 'Budgets',
    icon: 'i-heroicons-calculator',
    path: '/budgets',
    active: route.path.startsWith('/budgets'),
  },
  {
    name: 'Goals',
    icon: 'i-heroicons-trophy',
    path: '/savings',
    active: route.path.startsWith('/savings'),
  },
  {
    name: 'Recurring',
    icon: 'i-heroicons-arrow-path',
    path: '/recurring-expenses',
    active: route.path.startsWith('/recurring-expenses'),
  },
])

const bottomItems = computed((): MenuItem[] => [
  {
    name: 'Settings',
    icon: 'i-heroicons-cog-6-tooth',
    path: '/settings',
    active: route.path === '/settings',
  },
])

// Check for mobile screen size
function checkMobile() {
  const mobile = window.innerWidth < 768
  setMobile(mobile)
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
  <div class="px-4 py-5 border-b border-gray-200/50 dark:border-gray-800/50">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <UIcon name="i-heroicons-currency-dollar" class="w-5 h-5 text-white" />
          </div>
          <div v-if="!isCollapsed">
            <h2 class="font-semibold text-sm text-gray-900 dark:text-white">
              Finance
            </h2>
          </div>
        </div>

        <!-- Collapse Toggle Button - Always visible on desktop -->
        <button
          class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors hidden md:flex group"
          @click="toggleSidebar"
        >
          <UIcon
            :name="isCollapsed ? 'i-heroicons-chevron-right' : 'i-heroicons-chevron-left'"
            class="w-4 h-4"
          />
          <!-- Tooltip for collapsed state -->
          <div
            v-if="isCollapsed"
            class="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-50 shadow-lg"
          >
            Expand sidebar
          </div>
        </button>
      </div>
    </div>

    <!-- Menu Section -->
    <div class="flex-1 py-3 overflow-y-auto px-3">
      <!-- Import Statement Card -->
      <NuxtLink
        v-if="!isCollapsed"
        to="/import-statement"
        class="group relative block mb-3 p-4 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl overflow-hidden"
        @click="isMobile && toggleSidebar()"
      >
        <!-- Background pattern -->
        <div class="absolute inset-0 opacity-10">
          <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]" />
        </div>

        <div class="relative flex items-center gap-3">
          <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm group-hover:bg-white/30 transition-all duration-200 group-hover:rotate-6">
            <UIcon name="i-heroicons-arrow-up-tray" class="w-5 h-5" />
          </div>
          <div class="flex-1">
            <div class="font-semibold text-sm">Import Statement</div>
            <div class="text-xs text-white/80">Upload bank statements</div>
          </div>
          <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
        </div>
      </NuxtLink>

      <!-- Collapsed Import Button -->
      <NuxtLink
        v-else
        to="/import-statement"
        class="group relative flex items-center justify-center mb-3 p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 hover:scale-110 hover:shadow-xl"
        @click="isMobile && toggleSidebar()"
      >
        <UIcon name="i-heroicons-arrow-up-tray" class="w-5 h-5" />

        <!-- Tooltip for collapsed state -->
        <div class="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 -translate-x-1 transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-gray-700">
          <div class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 rotate-45 bg-gray-900 dark:bg-gray-800 border-l border-b border-gray-700" />
          Import Statement
        </div>
      </NuxtLink>

      <nav class="space-y-0.5">
        <!-- Navigation Items -->
        <NuxtLink
          v-for="item in navigationItems"
          :key="item.name"
          :to="item.path"
          class="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-out"
          :class="{
            'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]': item.active,
            'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-800 dark:hover:to-gray-800/50 hover:text-gray-900 dark:hover:text-white hover:scale-[1.01] hover:shadow-sm': !item.active,
            'justify-center': isCollapsed,
          }"
          @click="isMobile && toggleSidebar()"
        >
          <!-- Active indicator - animated glow -->
          <div
            v-if="item.active"
            class="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 opacity-20 blur-xl"
          />

          <!-- Icon with animated background -->
          <div
            class="relative flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200"
            :class="{
              'bg-white/20': item.active,
              'bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700': !item.active,
            }"
          >
            <UIcon
              :name="item.icon"
              class="w-4 h-4 flex-shrink-0 transition-all duration-200"
              :class="{
                'text-white': item.active,
                'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white group-hover:scale-110': !item.active
              }"
            />
          </div>

          <span v-if="!isCollapsed" class="flex-1 relative z-10">
            {{ item.name }}
          </span>

          <!-- Tooltip for collapsed state -->
          <div
            v-if="isCollapsed"
            class="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 -translate-x-1 transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-gray-700 dark:border-gray-700"
          >
            <div class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 rotate-45 bg-gray-900 dark:bg-gray-800 border-l border-b border-gray-700 dark:border-gray-700" />
            {{ item.name }}
          </div>
        </NuxtLink>
      </nav>
    </div>

    <!-- Bottom Section -->
    <div class="border-t border-gray-200/50 dark:border-gray-800/50 p-3 space-y-0.5">
      <!-- Settings -->
      <NuxtLink
        v-for="item in bottomItems"
        :key="item.name"
        :to="item.path"
        class="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-out"
        :class="{
          'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]': item.active,
          'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-800 dark:hover:to-gray-800/50 hover:text-gray-900 dark:hover:text-white hover:scale-[1.01] hover:shadow-sm': !item.active,
          'justify-center': isCollapsed,
        }"
        @click="isMobile && toggleSidebar()"
      >
        <!-- Active indicator - animated glow -->
        <div
          v-if="item.active"
          class="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 opacity-20 blur-xl"
        />

        <!-- Icon with animated background -->
        <div
          class="relative flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200"
          :class="{
            'bg-white/20': item.active,
            'bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700': !item.active,
          }"
        >
          <UIcon
            :name="item.icon"
            class="w-4 h-4 flex-shrink-0 transition-all duration-200"
            :class="{
              'text-white': item.active,
              'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white group-hover:scale-110': !item.active
            }"
          />
        </div>

        <span v-if="!isCollapsed" class="flex-1 relative z-10">
          {{ item.name }}
        </span>

        <!-- Tooltip for collapsed state -->
        <div
          v-if="isCollapsed"
          class="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 -translate-x-1 transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-gray-700 dark:border-gray-700"
        >
          <div class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 rotate-45 bg-gray-900 dark:bg-gray-800 border-l border-b border-gray-700 dark:border-gray-700" />
          {{ item.name }}
        </div>
      </NuxtLink>

    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar - Linear style */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Smooth transitions */
a, button {
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
