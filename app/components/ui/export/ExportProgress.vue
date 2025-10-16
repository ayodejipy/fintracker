<script setup lang="ts">
interface Props {
  isExporting: boolean
  progress: number
}

const props = withDefaults(defineProps<Props>(), {
  isExporting: false,
  progress: 0,
})

const progressPercentage = computed(() => Math.round(props.progress))
</script>

<template>
  <div v-if="isExporting" class="space-y-3">
    <div class="flex items-center gap-2">
      <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin text-blue-500" />
      <span class="text-sm font-medium">Exporting your data...</span>
    </div>
    <UProgress :value="progress" class="w-full" />
    <p class="text-xs text-gray-500 text-center">
      {{ progressPercentage }}% complete
    </p>
  </div>
</template>
