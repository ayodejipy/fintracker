<script setup lang="ts">
import UserMenu from '@/components/layout/UserMenu.vue'
</script>

<template>
  <header class="bg-white dark:bg-gray-800 shadow">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center py-6">
        <div class="flex items-center">
          <Icon name="heroicons:banknotes" class="h-8 w-8 text-blue-600 mr-3" />
          <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
            Personal Finance Dashboard
          </h1>
        </div>

        <div class="flex items-center space-x-4">
          <UserMenu />
        </div>
      </div>
    </div>
  </header>
</template>
