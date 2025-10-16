<script setup lang="ts">
import type { CurrencyCode } from '~/utils/currency'

interface Props {
  amount: number
  currency?: CurrencyCode
  compact?: boolean
  showSymbol?: boolean
  showCode?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: 'default' | 'success' | 'warning' | 'error' | 'muted'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
  showSymbol: true,
  showCode: false,
  size: 'md',
  color: 'default',
  weight: 'normal',
})

const { format, formatCompact, getCurrencySymbol, getCurrencyName } = useCurrency()

const formattedAmount = computed(() => {
  if (props.compact) {
    return formatCompact(props.amount, props.currency)
  }
  return format(props.amount, props.currency)
})

const displayAmount = computed(() => {
  if (props.showSymbol && props.showCode) {
    return formattedAmount.value
  }
  else if (props.showSymbol && !props.showCode) {
    return formattedAmount.value
  }
  else if (!props.showSymbol && props.showCode) {
    const symbol = getCurrencySymbol(props.currency)
    return formattedAmount.value.replace(symbol, props.currency || 'NGN')
  }
  else {
    // Neither symbol nor code
    const symbol = getCurrencySymbol(props.currency)
    return formattedAmount.value.replace(symbol, '').trim()
  }
})

const sizeClasses = computed(() => {
  const sizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }
  return sizes[props.size]
})

const colorClasses = computed(() => {
  const colors = {
    default: 'text-gray-900 dark:text-gray-100',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400',
    muted: 'text-gray-500 dark:text-gray-400',
  }
  return colors[props.color]
})

const weightClasses = computed(() => {
  const weights = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  }
  return weights[props.weight]
})

const isNegative = computed(() => props.amount < 0)
const isPositive = computed(() => props.amount > 0)
const isZero = computed(() => props.amount === 0)
</script>

<template>
  <span
    class="tabular-nums" :class="[
      sizeClasses,
      colorClasses,
      weightClasses,
      {
        'text-red-600 dark:text-red-400': isNegative && color === 'default',
        'text-green-600 dark:text-green-400': isPositive && color === 'default' && amount > 1000,
        'text-gray-500 dark:text-gray-400': isZero && color === 'default',
      },
    ]"
    :title="getCurrencyName(currency)"
  >
    {{ displayAmount }}
  </span>
</template>
