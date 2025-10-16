<script setup lang="ts">
import type { CurrencyPreferencesInput } from '~/features/settings/schemas/settings'
import { CURRENCY_OPTIONS, LOCALE_OPTIONS } from '~/features/settings/schemas/settings'

interface Props {
  preferences: CurrencyPreferencesInput
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  save: [preferences: CurrencyPreferencesInput]
}>()

const localPreferences = ref<CurrencyPreferencesInput>({ ...props.preferences })

watch(() => props.preferences, (newPrefs) => {
  localPreferences.value = { ...newPrefs }
}, { deep: true })

function savePreferences() {
  emit('save', localPreferences.value)
}

function updateCurrency(currency: string) {
  localPreferences.value.currency = currency

  // Auto-update locale based on currency if it makes sense
  const currencyToLocale: Record<string, string> = {
    USD: 'en-US',
    EUR: 'en-GB',
    GBP: 'en-GB',
    NGN: 'en-NG',
    CAD: 'en-CA',
    AUD: 'en-AU',
    JPY: 'ja-JP',
    CNY: 'zh-CN',
    INR: 'en-IN',
  }

  if (currencyToLocale[currency]) {
    localPreferences.value.locale = currencyToLocale[currency]
  }

  savePreferences()
}

function updateLocale(locale: string) {
  localPreferences.value.locale = locale
  savePreferences()
}

// Sample amounts for preview
const sampleAmounts = [1234.56, 0.99, 1000000, 0.01]

function formatSampleAmount(amount: number) {
  try {
    return new Intl.NumberFormat(localPreferences.value.locale, {
      style: 'currency',
      currency: localPreferences.value.currency,
    }).format(amount)
  }
  catch {
    return `${localPreferences.value.currency} ${amount}`
  }
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors">
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
        <UIcon name="i-heroicons-currency-dollar" class="w-5 h-5 text-white" />
      </div>
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Currency & Regional Settings
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Set your preferred currency and number formatting
        </p>
      </div>
    </div>

    <div class="space-y-8">
      <!-- Currency Selection -->
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-banknotes" class="w-5 h-5 text-gray-400" />
          <h4 class="text-md font-medium text-gray-900 dark:text-white">
            Primary Currency
          </h4>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            v-for="option in CURRENCY_OPTIONS"
            :key="option.value"
            type="button"
            class="group relative flex items-center p-4 border-2 rounded-xl transition-all duration-200 hover:scale-105" :class="[
              localPreferences.currency === option.value
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-lg'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700/50',
            ]"
            @click="updateCurrency(option.value)"
          >
            <div class="flex items-center gap-3 flex-1">
              <div class="text-2xl">
                {{ option.flag }}
              </div>
              <div class="text-left">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ option.label }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ option.value }}
                </div>
              </div>
            </div>

            <!-- Selected Indicator -->
            <div
              v-if="localPreferences.currency === option.value"
              class="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center"
            >
              <UIcon name="i-heroicons-check" class="w-4 h-4 text-white" />
            </div>
          </button>
        </div>
      </div>

      <!-- Locale Selection -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-8 space-y-4">
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-globe-alt" class="w-5 h-5 text-gray-400" />
          <h4 class="text-md font-medium text-gray-900 dark:text-white">
            Number Format
          </h4>
        </div>

        <UFormGroup label="Locale" description="This affects how numbers and dates are formatted">
          <USelectMenu
            v-model="localPreferences.locale"
            :options="LOCALE_OPTIONS"
            option-attribute="label"
            value-attribute="value"
            size="lg"
            @update:model-value="updateLocale"
          >
            <template #label>
              <div class="flex items-center gap-2">
                <span>{{ LOCALE_OPTIONS.find(l => l.value === localPreferences.locale)?.label }}</span>
              </div>
            </template>

            <template #option="{ option }">
              <div class="flex items-center gap-2">
                <span>{{ option.label }}</span>
                <span class="text-xs text-gray-500">{{ option.value }}</span>
              </div>
            </template>
          </USelectMenu>
        </UFormGroup>
      </div>

      <!-- Preview -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-8 space-y-4">
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-eye" class="w-5 h-5 text-gray-400" />
          <h4 class="text-md font-medium text-gray-900 dark:text-white">
            Preview
          </h4>
        </div>

        <div class="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Here's how amounts will be displayed with your current settings:
          </p>

          <div class="grid grid-cols-2 gap-4">
            <div
              v-for="amount in sampleAmounts"
              :key="amount"
              class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ amount }}
              </span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ formatSampleAmount(amount) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Regional Information -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-8">
        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div class="flex items-start">
            <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                Currency Settings
              </p>
              <p class="text-sm text-blue-700 dark:text-blue-300">
                Your currency preference affects how all monetary values are displayed throughout the app.
                This setting will be applied to your dashboard, transactions, budgets, and reports.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Exchange Rate Notice -->
      <div class="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
        <div class="flex items-start">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-amber-600 dark:text-amber-400 mr-3 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
              Multi-Currency Support
            </p>
            <p class="text-sm text-amber-700 dark:text-amber-300">
              Currently, the app stores all amounts in your selected currency.
              Multi-currency support with automatic conversion is planned for a future update.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
