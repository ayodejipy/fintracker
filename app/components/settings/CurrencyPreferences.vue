<script setup lang="ts">
import type { CurrencyPreferencesInput } from '~/schemas/settings'
import { currencyPreferencesSchema, SUPPORTED_CURRENCIES } from '~/schemas/settings'

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

const { handleSubmit, errors, values } = useFormValidation(currencyPreferencesSchema, {
  currency: props.preferences.currency,
  locale: props.preferences.locale,
})

watch(() => props.preferences, (newPrefs) => {
  values.currency = newPrefs.currency
  values.locale = newPrefs.locale
}, { deep: true })

const onSubmit = handleSubmit((data) => {
  emit('save', data)
})

const selectedCurrency = computed(() => {
  return SUPPORTED_CURRENCIES.find(c => c.code === values.currency)
})
</script>

<template>
  <div class="bg-white rounded-lg border border-gray-200 p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">
      Currency & Localization
    </h3>

    <form class="space-y-6" @submit="onSubmit">
      <!-- Currency Selection -->
      <UFormGroup label="Currency" :error="errors.currency">
        <USelectMenu
          v-model="values.currency"
          :options="SUPPORTED_CURRENCIES"
          value-attribute="code"
          option-attribute="name"
          placeholder="Select currency"
        >
          <template #label>
            <div v-if="selectedCurrency" class="flex items-center">
              <span class="font-mono mr-2">{{ selectedCurrency.symbol }}</span>
              <span>{{ selectedCurrency.name }} ({{ selectedCurrency.code }})</span>
            </div>
            <span v-else>Select currency</span>
          </template>

          <template #option="{ option }">
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center">
                <span class="font-mono mr-2 text-gray-600">{{ option.symbol }}</span>
                <span>{{ option.name }}</span>
              </div>
              <span class="text-sm text-gray-500">{{ option.code }}</span>
            </div>
          </template>
        </USelectMenu>
      </UFormGroup>

      <!-- Locale (Optional) -->
      <UFormGroup label="Locale (Optional)" :error="errors.locale">
        <UInput
          v-model="values.locale"
          placeholder="e.g., en-NG, en-US"
          icon="i-heroicons-globe-alt"
        />
        <template #help>
          <p class="text-sm text-gray-500">
            Locale affects number and date formatting. Leave empty to use browser default.
          </p>
        </template>
      </UFormGroup>

      <!-- Preview -->
      <div v-if="selectedCurrency" class="p-4 bg-gray-50 rounded-lg">
        <h4 class="text-sm font-medium text-gray-900 mb-2">
          Preview
        </h4>
        <div class="space-y-1 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">Currency Symbol:</span>
            <span class="font-mono">{{ selectedCurrency.symbol }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Sample Amount:</span>
            <span class="font-mono">{{ selectedCurrency.symbol }}1,234.56</span>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end">
        <UButton
          type="submit"
          :loading="loading"
          :disabled="loading"
        >
          Save Currency Settings
        </UButton>
      </div>
    </form>
  </div>
</template>
