<script setup lang="ts">
interface Props {
  title?: string
  message: string
  showRetry?: boolean
  retryLabel?: string
}

const _props = withDefaults(defineProps<Props>(), {
  title: 'Something went wrong',
  showRetry: true,
  retryLabel: 'Try Again',
})

const emit = defineEmits<{
  retry: []
}>()

function handleRetry() {
  emit('retry')
}
</script>

<template>
  <div class="text-center py-16">
    <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-red-500" />
    </div>
    <h3 class="text-lg font-semibold text-gray-900 mb-2">
      {{ title }}
    </h3>
    <p class="text-gray-500 mb-4">
      {{ message }}
    </p>
    <UButton
      v-if="showRetry"
      variant="outline"
      color="red"
      @click="handleRetry"
    >
      {{ retryLabel }}
    </UButton>
  </div>
</template>
