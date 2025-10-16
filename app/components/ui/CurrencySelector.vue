<script setup lang="ts">
import type { CurrencyCode } from '~/utils/currency'

interface Props {
  modelValue?: CurrencyCode
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'outline' | 'ghost' | 'solid'
}

interface Emits {
  (e: 'update:modelValue', value: CurrencyCode): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 'NGN',
  disabled: false,
  size: 'md',
  variant: 'outline',
})

const emit = defineEmits<Emits>()

const { supportedCurrencies, setCurrency } = useCurrency()

const selectedCurrency = computed({
  get: () => props.modelValue,
  set: (value: CurrencyCode) => {
    emit('update:modelValue', value)
    setCurrency(value)
  },
})

const currencyOptions = computed(() =>
  supportedCurrencies.value.map(currency => ({
    label: `${currency.flag} ${currency.code} - ${currency.name}`,
    value: currency.code,
    icon: currency.flag,
    primary: currency.primary,
  })),
)
</script>

<template>
  <USelectMenu
    v-model="selectedCurrency"
    :options="currencyOptions"
    :disabled="disabled"
    :size="size"
    :variant="variant"
    value-attribute="value"
    option-attribute="label"
    placeholder="Select currency"
    searchable
    searchable-placeholder="Search currencies..."
    class="min-w-[200px]"
  >
    <template #label>
      <div class="flex items-center gap-2">
        <span class="text-lg">{{ supportedCurrencies.find(c => c.code === selectedCurrency)?.flag }}</span>
        <span class="font-medium">{{ selectedCurrency }}</span>
        <span class="text-gray-500 text-sm hidden sm:inline">
          {{ supportedCurrencies.find(c => c.code === selectedCurrency)?.name }}
        </span>
      </div>
    </template>

    <template #option="{ option }">
      <div class="flex items-center gap-3 w-full">
        <span class="text-lg">{{ option.icon }}</span>
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ option.value }}</span>
            <UBadge
              v-if="option.primary"
              variant="soft"
              color="green"
              size="xs"
            >
              Primary
            </UBadge>
          </div>
          <div class="text-sm text-gray-500">
            {{ supportedCurrencies.find(c => c.code === option.value)?.name }}
          </div>
        </div>
      </div>
    </template>
  </USelectMenu>
</template>
