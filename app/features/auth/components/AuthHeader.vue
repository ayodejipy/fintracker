<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
}

defineProps<Props>()
</script>

<template>
  <div class="text-center">
    <div class="flex justify-center items-center mb-6">
      <Icon name="heroicons:banknotes" class="h-12 w-12 text-blue-600 mr-3" />
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Personal Finance Dashboard
      </h1>
    </div>
    <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
      {{ title }}
    </h2>
    <p v-if="subtitle" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
      {{ subtitle }}
    </p>
  </div>
</template>
