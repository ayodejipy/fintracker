<script setup lang="ts">
interface Props {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  showSpinner?: boolean
}

const _props = withDefaults(defineProps<Props>(), {
  message: 'Loading...',
  size: 'md',
  showSpinner: true,
})

const sizeClasses = {
  sm: 'py-8',
  md: 'py-12',
  lg: 'py-16',
}

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}
</script>

<template>
  <div class="flex justify-center items-center" :class="sizeClasses[size]">
    <div class="flex items-center gap-3 text-gray-500">
      <UIcon
        v-if="showSpinner"
        name="i-heroicons-arrow-path"
        class="animate-spin text-blue-500" :class="[iconSizes[size]]"
      />
      <span class="text-sm font-medium">{{ message }}</span>
    </div>
  </div>
</template>
