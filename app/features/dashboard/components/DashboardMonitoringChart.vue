<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { formatCurrency, formatCurrencyCompact } from '~/utils/currency'

// Props interface
interface Props {
  monthlyTrends?: readonly {
    readonly month: string
    readonly income: number
    readonly expenses: number
    readonly netIncome: number
  }[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  monthlyTrends: () => [],
  loading: false,
})

const selectedPeriod = ref('Monthly')
const periods = ['Daily', 'Weekly', 'Monthly', 'Yearly']

// Chart data transformation for ApexCharts
const chartData = computed(() => {
  if (props.monthlyTrends && props.monthlyTrends.length > 0) {
    return props.monthlyTrends.map(trend => ({
      month: new Date(`${trend.month}-01`).toLocaleDateString('en', { month: 'short' }),
      earning: trend.income,
      expenses: trend.expenses,
      netIncome: trend.netIncome,
    }))
  }

  // Fallback mock data
  return [
    { month: 'Jan', earning: 30000, expenses: 25000, netIncome: 5000 },
    { month: 'Feb', earning: 35000, expenses: 28000, netIncome: 7000 },
    { month: 'Mar', earning: 40000, expenses: 30000, netIncome: 10000 },
    { month: 'Apr', earning: 38000, expenses: 32000, netIncome: 6000 },
    { month: 'May', earning: 45000, expenses: 35000, netIncome: 10000 },
    { month: 'Jun', earning: 50000, expenses: 38000, netIncome: 12000 },
  ]
})

// ApexCharts configuration
const chartOptions = computed(() => ({
  chart: {
    type: 'line',
    height: 280,
    toolbar: {
      show: false,
    },
    zoom: {
      enabled: false,
    },
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 800,
      animateGradually: {
        enabled: true,
        delay: 150,
      },
      dynamicAnimation: {
        enabled: true,
        speed: 350,
      },
    },
  },
  colors: ['#3B82F6', '#D1D5DB'],
  dataLabels: {
    enabled: false,
  },
  stroke: {
    curve: 'smooth',
    width: 3,
    lineCap: 'round',
  },
  grid: {
    borderColor: '#F3F4F6',
    strokeDashArray: 0,
    xaxis: {
      lines: {
        show: false,
      },
    },
    yaxis: {
      lines: {
        show: true,
      },
    },
    padding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  },
  xaxis: {
    categories: chartData.value.map(d => d.month),
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
    labels: {
      style: {
        colors: '#6B7280',
        fontSize: '12px',
        fontWeight: 500,
      },
    },
  },
  yaxis: {
    labels: {
      style: {
        colors: '#6B7280',
        fontSize: '12px',
        fontWeight: 500,
      },
      formatter: (value: number) => {
        return formatCurrencyCompact(value)
      },
    },
  },
  tooltip: {
    enabled: true,
    shared: true,
    intersect: false,
    theme: 'light',
    style: {
      fontSize: '12px',
    },
    y: {
      formatter: (value: number) => formatCurrency(value),
    },
  },
  legend: {
    show: false,
  },
  markers: {
    size: 6,
    colors: ['#3B82F6', '#D1D5DB'],
    strokeColors: '#ffffff',
    strokeWidth: 2,
    hover: {
      size: 8,
    },
  },
  responsive: [
    {
      breakpoint: 768,
      options: {
        chart: {
          height: 240,
        },
        markers: {
          size: 4,
        },
      },
    },
  ],
}))

// Chart series data
const chartSeries = computed(() => [
  {
    name: 'Earning',
    data: chartData.value.map(d => d.earning),
  },
  {
    name: 'Expenses',
    data: chartData.value.map(d => d.expenses),
  },
])

// Watch for data changes and update chart
watch([chartData, selectedPeriod], () => {
  // Chart will automatically update due to reactive data
}, { deep: true })
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Monitoring Overview
      </h3>
      <div class="flex items-center gap-4">
        <!-- Legend -->
        <div class="flex items-center gap-4 text-sm">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 bg-blue-500 rounded-full" />
            <span class="text-gray-600 dark:text-gray-400 dark:text-gray-500">Earning</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 bg-gray-300 rounded-full" />
            <span class="text-gray-600 dark:text-gray-400 dark:text-gray-500">Expenses</span>
          </div>
        </div>

        <!-- Period Selector -->
        <USelectMenu
          v-model="selectedPeriod"
          :options="periods"
          class="w-32"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="relative h-72 mb-4 animate-pulse">
      <div class="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <div class="flex items-center gap-2 text-gray-400 dark:text-gray-500">
          <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
          <span>Loading chart...</span>
        </div>
      </div>
    </div>

    <!-- ApexChart Container -->
    <div v-else class="relative">
      <ClientOnly>
        <apexchart
          type="line"
          height="280"
          :options="chartOptions"
          :series="chartSeries"
        />
        <template #fallback>
          <div class="h-72 bg-gray-100 dark:bg-gray-700/50 rounded-lg flex items-center justify-center">
            <div class="text-gray-500 dark:text-gray-400 dark:text-gray-500">
              Loading chart...
            </div>
          </div>
        </template>
      </ClientOnly>
    </div>

    <!-- Summary Stats -->
    <div class="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
      <div class="text-center">
        <div class="text-2xl font-bold text-blue-600">
          {{ formatCurrencyCompact(chartData[chartData.length - 1]?.earning || 0) }}
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
          Latest Earning
        </div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-gray-600 dark:text-gray-400 dark:text-gray-500">
          {{ formatCurrencyCompact(chartData[chartData.length - 1]?.expenses || 0) }}
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
          Latest Expenses
        </div>
      </div>
      <div class="text-center">
        <div
          class="text-2xl font-bold"
          :class="[
            (chartData[chartData.length - 1]?.netIncome || 0) >= 0
              ? 'text-green-600'
              : 'text-red-600',
          ]"
        >
          {{ formatCurrencyCompact(chartData[chartData.length - 1]?.netIncome || 0) }}
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
          Net Income
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Component-specific styles can be added here */
</style>
