<script setup lang="ts">
import DashboardSidebar from '~/components/layout/DashboardSidebar.vue'
import DashboardTopHeader from '~/components/layout/DashboardTopHeader.vue'
import { useSidebar } from '~/composables/useSidebar'

// Sidebar functionality
const { toggleSidebar, isCollapsed } = useSidebar()

// Calculate margin based on sidebar state
const mainMargin = computed(() => {
  return isCollapsed.value ? 'ml-20' : 'ml-72'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <!-- Fixed Sidebar -->
    <DashboardSidebar />

    <!-- Main Content with margin to account for fixed sidebar -->
    <div class="flex flex-col min-h-screen transition-all duration-300" :class="mainMargin">
      <!-- Top Header -->
      <DashboardTopHeader @toggle-mobile-menu="toggleSidebar" />

      <!-- Page Content -->
      <main class="flex-1 p-6 bg-gray-50 dark:bg-gray-900 transition-colors overflow-y-auto">
        <slot />
      </main>
    </div>

    <!-- Modal Provider for global modal management -->
    <ModalProvider />
  </div>
</template>
