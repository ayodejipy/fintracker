<template>
  <div :class="cardClasses">
    <p :class="labelClasses">
      {{ label }}
    </p>
    <p :class="valueClasses">
      <slot>{{ value }}</slot>
    </p>
  </div>
</template>

<script setup lang="ts">
/**
 * Reusable summary/stat card component
 * Displays a label and value with optional color variant
 */

export interface SummaryCardProps {
  /** Card label/title */
  label: string
  /** Card value (number or string) */
  value?: number | string
  /** Visual variant affecting colors */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
}

const props = withDefaults(defineProps<SummaryCardProps>(), {
  variant: 'default',
})

// Card background classes based on variant
const cardClasses = computed(() => {
  const base = 'rounded-lg shadow p-6'

  const variants = {
    default: `${base} bg-white dark:bg-gray-800`,
    success: `${base} bg-green-50 dark:bg-green-900/20`,
    warning: `${base} bg-yellow-50 dark:bg-yellow-900/20`,
    error: `${base} bg-red-50 dark:bg-red-900/20`,
    info: `${base} bg-blue-50 dark:bg-blue-900/20`,
  }

  return variants[props.variant]
})

// Label text classes based on variant
const labelClasses = computed(() => {
  const variants = {
    default: 'text-sm text-gray-500 dark:text-gray-400',
    success: 'text-sm text-green-700 dark:text-green-400',
    warning: 'text-sm text-yellow-700 dark:text-yellow-400',
    error: 'text-sm text-red-700 dark:text-red-400',
    info: 'text-sm text-blue-700 dark:text-blue-400',
  }

  return variants[props.variant]
})

// Value text classes based on variant
const valueClasses = computed(() => {
  const base = 'text-3xl font-bold mt-2'

  const variants = {
    default: `${base} text-gray-900 dark:text-gray-100`,
    success: `${base} text-green-600 dark:text-green-500`,
    warning: `${base} text-yellow-600 dark:text-yellow-500`,
    error: `${base} text-red-600 dark:text-red-500`,
    info: `${base} text-blue-600 dark:text-blue-500`,
  }

  return variants[props.variant]
})
</script>
