<script setup lang="ts">
interface Props {
  title: string
  description?: string
  icon?: string
  actionLabel?: string
  showAction?: boolean
}

const _props = withDefaults(defineProps<Props>(), {
  description: '',
  icon: 'i-heroicons-document-text',
  actionLabel: 'Get Started',
  showAction: false,
})

const emit = defineEmits<{
  action: []
}>()

function handleAction() {
  emit('action')
}
</script>

<template>
  <div class="text-center py-16">
    <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <UIcon :name="icon" class="w-8 h-8 text-gray-400" />
    </div>
    <h3 class="text-lg font-semibold text-gray-900 mb-2">
      {{ title }}
    </h3>
    <p v-if="description" class="text-gray-500 mb-4">
      {{ description }}
    </p>
    <UButton
      v-if="showAction"
      variant="outline"
      class="border-gray-300 text-gray-700 hover:bg-gray-50"
      @click="handleAction"
    >
      {{ actionLabel }}
    </UButton>
  </div>
</template>
