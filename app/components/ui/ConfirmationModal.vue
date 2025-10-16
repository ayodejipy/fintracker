<script setup lang="ts">
interface Props {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  icon?: string
}

interface Emits {
  confirm: []
  close: []
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed?',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  type: 'danger',
  icon: 'i-heroicons-exclamation-triangle',
})

const emit = defineEmits<Emits>()

// Type-based styling
const typeStyles = computed(() => {
  const styles = {
    danger: {
      iconBg: 'bg-red-100 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
      buttonColor: 'red',
    },
    warning: {
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/20',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      buttonColor: 'yellow',
    },
    info: {
      iconBg: 'bg-blue-100 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      buttonColor: 'blue',
    },
  }
  return styles[props.type]
})
</script>

<template>
  <UModal
    :open="true" :close="true" :dismissible="true" :ui="{
      footer: 'justify-end',
    }" @close="$emit('close')"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-12 h-12 rounded-full flex items-center justify-center"
          :class="typeStyles.iconBg"
        >
          <UIcon :name="icon" class="w-6 h-6" :class="typeStyles.iconColor" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ title }}
        </h3>
      </div>
    </template>

    <template #body>
      <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {{ message }}
      </p>
    </template>

    <template #footer>
      <div class="flex items-center justify-end gap-3">
        <UButton
          variant="ghost"
          size="lg"
          @click="$emit('close')"
        >
          {{ cancelText }}
        </UButton>
        <UButton
          :color="typeStyles.buttonColor as any"
          size="lg"
          @click="$emit('confirm')"
        >
          {{ confirmText }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
