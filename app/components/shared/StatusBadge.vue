<template>
  <UBadge :color="badgeColor" variant="subtle" :size="size">
    <slot>{{ displayText }}</slot>
  </UBadge>
</template>

<script setup lang="ts">
/**
 * Reusable status badge component
 * Used for confidence levels, transaction flags, and general status indicators
 */

export interface StatusBadgeProps {
  /** Predefined status types */
  status?: 'high' | 'medium' | 'low' | 'manual'
  /** Generic variant for non-status badges */
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  /** Badge size */
  size?: 'xs' | 'sm' | 'md'
  /** Custom label (overrides default status text) */
  label?: string
}

const props = withDefaults(defineProps<StatusBadgeProps>(), {
  size: 'xs',
})

// Determine badge color based on status or variant
const badgeColor = computed(() => {
  // Status-based colors
  if (props.status) {
    const statusColors = {
      high: 'green',
      medium: 'yellow',
      low: 'yellow',
      manual: 'red',
    }
    return statusColors[props.status]
  }

  // Variant-based colors
  if (props.variant) {
    const variantColors = {
      success: 'green',
      warning: 'yellow',
      error: 'red',
      info: 'blue',
      neutral: 'gray',
    }
    return variantColors[props.variant]
  }

  return 'gray'
})

// Display text (capitalized status or custom label)
const displayText = computed(() => {
  if (props.label) {
    return props.label
  }

  if (props.status) {
    return props.status.charAt(0).toUpperCase() + props.status.slice(1)
  }

  return ''
})
</script>
