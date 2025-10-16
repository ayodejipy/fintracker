<script setup lang="ts">
interface Props {
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: string
  text?: string
  fullWidth?: boolean
}

interface Emits {
  (e: 'click'): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'button',
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  fullWidth: false,
})

const emit = defineEmits<Emits>()

// Map our variants to Nuxt UI variants
const uiVariant = computed(() => {
  switch (props.variant) {
    case 'primary': return 'solid'
    case 'secondary': return 'outline'
    case 'danger': return 'solid'
    case 'ghost': return 'ghost'
    default: return 'solid'
  }
})

// Map our colors to Nuxt UI colors
const uiColor = computed(() => {
  switch (props.variant) {
    case 'primary': return 'primary'
    case 'secondary': return 'secondary'
    case 'danger': return 'error'
    case 'ghost': return 'secondary'
    default: return 'primary'
  }
})

const buttonClass = computed(() => {
  return props.fullWidth ? 'w-full' : ''
})
</script>

<template>
  <UButton
    :type="type"
    :variant="uiVariant"
    :color="uiColor"
    :size="size"
    :disabled="disabled"
    :loading="loading"
    :icon="icon"
    :ui="{
      base: 'focus:outline-none focus-visible:outline-0 disabled:cursor-not-allowed disabled:opacity-75 flex-shrink-0 font-semibold rounded-lg gap-x-2 shadow-sm transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]',
    }"
    :class="[
      buttonClass,
      // Primary button styling
      variant === 'primary' ? [
        'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
        'dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600',
        'text-white font-semibold shadow-lg hover:shadow-xl',
        'focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20',
        'disabled:from-gray-400 disabled:to-gray-500 disabled:hover:from-gray-400 disabled:hover:to-gray-500',
        size === 'sm' ? 'text-xs px-3 py-2' : size === 'lg' ? 'text-base px-6 py-3' : 'text-sm px-4 py-2.5',
      ] : [],
      // Secondary button styling
      variant === 'secondary' ? [
        'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600',
        'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700',
        'focus:ring-4 focus:ring-gray-500/20',
        size === 'sm' ? 'text-xs px-3 py-2' : size === 'lg' ? 'text-base px-6 py-3' : 'text-sm px-4 py-2.5',
      ] : [],
      // Danger button styling
      variant === 'danger' ? [
        'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800',
        'dark:from-red-500 dark:to-red-600 dark:hover:from-red-600 dark:hover:to-red-700',
        'text-white font-semibold shadow-lg hover:shadow-xl',
        'focus:ring-4 focus:ring-red-500/20 dark:focus:ring-red-400/20',
        size === 'sm' ? 'text-xs px-3 py-2' : size === 'lg' ? 'text-base px-6 py-3' : 'text-sm px-4 py-2.5',
      ] : [],
      // Ghost button styling
      variant === 'ghost' ? [
        'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
        'text-gray-700 dark:text-gray-200',
        'focus:ring-4 focus:ring-gray-500/20',
        size === 'sm' ? 'text-xs px-3 py-2' : size === 'lg' ? 'text-base px-6 py-3' : 'text-sm px-4 py-2.5',
      ] : [],
    ]"
    @click="emit('click')"
  >
    <slot>{{ text }}</slot>
  </UButton>
</template>
