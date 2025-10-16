<script setup lang="ts">
import type { NotificationPreferencesInput } from '~/features/settings/schemas/settings'

interface Props {
  preferences: NotificationPreferencesInput
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  save: [preferences: NotificationPreferencesInput]
}>()

const localPreferences = ref<NotificationPreferencesInput>({ ...props.preferences })

watch(() => props.preferences, (newPrefs) => {
  localPreferences.value = { ...newPrefs }
}, { deep: true })

function savePreferences() {
  emit('save', localPreferences.value)
}

function updateEmailPreference(key: keyof NotificationPreferencesInput['email'], value: boolean) {
  localPreferences.value.email[key] = value
  savePreferences()
}

function updatePushPreference(key: keyof NotificationPreferencesInput['push'], value: boolean) {
  localPreferences.value.push[key] = value
  savePreferences()
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors">
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
        <UIcon name="i-heroicons-bell" class="w-5 h-5 text-white" />
      </div>
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Notification Preferences
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Choose how you want to be notified about important events
        </p>
      </div>
    </div>

    <div class="space-y-8">
      <!-- Email Notifications -->
      <div class="space-y-6">
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-envelope" class="w-5 h-5 text-gray-400" />
          <h4 class="text-md font-medium text-gray-900 dark:text-white">
            Email Notifications
          </h4>
        </div>

        <div class="space-y-4">
          <!-- Budget Alerts -->
          <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-white" />
              </div>
              <div>
                <label class="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                  Budget Alerts
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Get notified when you're close to or exceed your budget limits
                </p>
              </div>
            </div>
            <UToggle
              :model-value="localPreferences.email.budgetAlerts"
              size="lg"
              @update:model-value="(value) => updateEmailPreference('budgetAlerts', value)"
            />
          </div>

          <!-- Goal Reminders -->
          <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <UIcon name="i-heroicons-flag" class="w-5 h-5 text-white" />
              </div>
              <div>
                <label class="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                  Goal Reminders
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Reminders to contribute to your savings goals
                </p>
              </div>
            </div>
            <UToggle
              :model-value="localPreferences.email.goalReminders"
              size="lg"
              @update:model-value="(value) => updateEmailPreference('goalReminders', value)"
            />
          </div>

          <!-- Weekly Reports -->
          <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-white" />
              </div>
              <div>
                <label class="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                  Weekly Reports
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Weekly summary of your spending and progress
                </p>
              </div>
            </div>
            <UToggle
              :model-value="localPreferences.email.weeklyReports"
              size="lg"
              @update:model-value="(value) => updateEmailPreference('weeklyReports', value)"
            />
          </div>

          <!-- Monthly Reports -->
          <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <UIcon name="i-heroicons-document-chart-bar" class="w-5 h-5 text-white" />
              </div>
              <div>
                <label class="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                  Monthly Reports
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Comprehensive monthly financial summary
                </p>
              </div>
            </div>
            <UToggle
              :model-value="localPreferences.email.monthlyReports"
              size="lg"
              @update:model-value="(value) => updateEmailPreference('monthlyReports', value)"
            />
          </div>

          <!-- Security Alerts -->
          <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <UIcon name="i-heroicons-shield-exclamation" class="w-5 h-5 text-white" />
              </div>
              <div>
                <label class="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                  Security Alerts
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Important security notifications and login alerts
                </p>
              </div>
            </div>
            <UToggle
              :model-value="localPreferences.email.securityAlerts"
              size="lg"
              @update:model-value="(value) => updateEmailPreference('securityAlerts', value)"
            />
          </div>
        </div>
      </div>

      <!-- Push Notifications -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-8 space-y-6">
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-device-phone-mobile" class="w-5 h-5 text-gray-400" />
          <h4 class="text-md font-medium text-gray-900 dark:text-white">
            Push Notifications
          </h4>
        </div>

        <div class="space-y-4">
          <!-- Budget Alerts -->
          <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-white" />
              </div>
              <div>
                <label class="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                  Budget Alerts
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Instant notifications for budget limits
                </p>
              </div>
            </div>
            <UToggle
              :model-value="localPreferences.push.budgetAlerts"
              size="lg"
              @update:model-value="(value) => updatePushPreference('budgetAlerts', value)"
            />
          </div>

          <!-- Goal Reminders -->
          <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <UIcon name="i-heroicons-flag" class="w-5 h-5 text-white" />
              </div>
              <div>
                <label class="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                  Goal Reminders
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Push reminders for savings contributions
                </p>
              </div>
            </div>
            <UToggle
              :model-value="localPreferences.push.goalReminders"
              size="lg"
              @update:model-value="(value) => updatePushPreference('goalReminders', value)"
            />
          </div>

          <!-- Weekly Reports -->
          <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-white" />
              </div>
              <div>
                <label class="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                  Weekly Reports
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Weekly summary notifications
                </p>
              </div>
            </div>
            <UToggle
              :model-value="localPreferences.push.weeklyReports"
              size="lg"
              @update:model-value="(value) => updatePushPreference('weeklyReports', value)"
            />
          </div>

          <!-- Monthly Reports -->
          <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <UIcon name="i-heroicons-document-chart-bar" class="w-5 h-5 text-white" />
              </div>
              <div>
                <label class="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                  Monthly Reports
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Monthly summary notifications
                </p>
              </div>
            </div>
            <UToggle
              :model-value="localPreferences.push.monthlyReports"
              size="lg"
              @update:model-value="(value) => updatePushPreference('monthlyReports', value)"
            />
          </div>

          <!-- Security Alerts -->
          <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <UIcon name="i-heroicons-shield-exclamation" class="w-5 h-5 text-white" />
              </div>
              <div>
                <label class="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                  Security Alerts
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Critical security push notifications
                </p>
              </div>
            </div>
            <UToggle
              :model-value="localPreferences.push.securityAlerts"
              size="lg"
              @update:model-value="(value) => updatePushPreference('securityAlerts', value)"
            />
          </div>
        </div>
      </div>

      <!-- Notification Schedule -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-8">
        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div class="flex items-start">
            <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                Notification Timing
              </p>
              <p class="text-sm text-blue-700 dark:text-blue-300">
                Weekly reports are sent on Sundays at 9 AM. Monthly reports are sent on the 1st of each month at 9 AM.
                All times are in your local timezone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
