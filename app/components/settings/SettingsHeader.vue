<script setup lang="ts">
interface Props {
  title?: string
  description?: string
}

const _props = withDefaults(defineProps<Props>(), {
  title: 'Settings',
  description: 'Manage your currency preferences and localization settings',
})
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div class="flex items-center gap-4">
      <div
        class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
      >
        <UIcon name="i-heroicons-cog-6-tooth" class="w-6 h-6 text-white" />
      </div>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          {{ title }}
        </h1>
        <p class="text-gray-600 mt-1">
          {{ description }}
        </p>
      </div>
    </div>
  </div>
</template>
