<script setup lang="ts">
import type { ThemePreferencesInput } from '../schemas'
import { THEME_OPTIONS } from '../schemas'

interface Props {
  preferences: ThemePreferencesInput
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  save: [preferences: ThemePreferencesInput]
}>()

const localPreferences = ref<ThemePreferencesInput>({ ...props.preferences })

watch(() => props.preferences, (newPrefs) => {
  localPreferences.value = { ...newPrefs }
}, { deep: true })

function savePreferences() {
  emit('save', localPreferences.value)
}

function updateTheme(theme: 'light' | 'dark' | 'system') {
  localPreferences.value.theme = theme
  savePreferences()
}

function toggleCompactMode() {
  localPreferences.value.compactMode = !localPreferences.value.compactMode
  savePreferences()
}

function toggleReducedMotion() {
  localPreferences.value.reducedMotion = !localPreferences.value.reducedMotion
  savePreferences()
}

// Apply theme immediately for preview
const colorMode = useColorMode()
watch(() => localPreferences.value.theme, (newTheme) => {
  if (newTheme !== 'system') {
    colorMode.preference = newTheme
  }
  else {
    colorMode.preference = 'system'
  }
}, { immediate: true })
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors">
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
        <UIcon name="i-heroicons-swatch" class="w-5 h-5 text-white" />
      </div>
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Theme & Appearance
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Customize the look and feel of your dashboard
        </p>
      </div>
    </div>

    <div class="space-y-8">
      <!-- Theme Selection -->
      <div>
        <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">
          Color Theme
        </h4>
        <div class="grid grid-cols-3 gap-4">
          <button
            v-for="option in THEME_OPTIONS"
            :key="option.value"
            type="button"
            class="flex flex-col items-center p-6 border-2 rounded-xl transition-all duration-200 hover:scale-105" :class="[
              localPreferences.theme === option.value
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-700/50',
            ]"
            @click="updateTheme(option.value)"
          >
            <UIcon :name="option.icon" class="w-8 h-8 mb-3 text-gray-600 dark:text-gray-300" />
            <span class="text-sm font-medium text-gray-900 dark:text-white">{{ option.label }}</span>
            <div v-if="localPreferences.theme === option.value" class="mt-2">
              <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-blue-500" />
            </div>
          </button>
        </div>
      </div>

      <!-- Display Options -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-8">
        <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">
          Display Options
        </h4>

        <div class="space-y-6">
          <!-- Compact Mode -->
          <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <label class="text-sm font-medium text-gray-900 dark:text-white">
                Compact Mode
              </label>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Use smaller spacing and components for a denser layout
              </p>
            </div>
            <UToggle
              :model-value="localPreferences.compactMode"
              size="lg"
              @update:model-value="toggleCompactMode"
            />
          </div>

          <!-- Reduced Motion -->
          <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <label class="text-sm font-medium text-gray-900 dark:text-white">
                Reduced Motion
              </label>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Minimize animations and transitions for better accessibility
              </p>
            </div>
            <UToggle
              :model-value="localPreferences.reducedMotion"
              size="lg"
              @update:model-value="toggleReducedMotion"
            />
          </div>
        </div>
      </div>

      <!-- Theme Preview -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-8">
        <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">
          Preview
        </h4>
        <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-white" />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  Sample Card
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  This is how cards will look
                </p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-lg font-bold text-gray-900 dark:text-white">
                ₦45,000
              </p>
              <p class="text-xs text-green-600 dark:text-green-400">
                +12.5%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
