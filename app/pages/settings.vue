<script setup lang="ts">
import ProfileSettings from '~/features/settings/components/ProfileSettings.vue'
import SecuritySettings from '~/features/settings/components/SecuritySettings.vue'
import ThemePreferences from '~/features/settings/components/ThemeSettings.vue'
import NotificationPreferences from '~/features/settings/components/NotificationPreferences.vue'
import CurrencySettings from '~/features/settings/components/CurrencySettings.vue'
import DataSettings from '~/features/settings/components/DataSettings.vue'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
})

useHead({
  title: 'Settings - Personal Finance Tracker',
})

// Import from the new features structure
const {
  selectedTab,
  tabs,
  loading,
  user,
  notificationPreferences,
  themePreferences,
  currencyPreferences,
  twoFactorEnabled,
  saveProfile,
  changePassword,
  toggle2FA,
  saveNotificationPreferences,
  saveThemePreferences,
  saveCurrencyPreferences,
  exportData,
  deleteAccount,
} = useSettings()
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
                Settings
              </h1>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Manage your account preferences and configuration
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Sidebar Navigation -->
        <div class="lg:w-64 flex-shrink-0">
          <nav class="space-y-2">
            <button
              v-for="(tab, index) in tabs"
              :key="tab.key"
              class="w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all duration-200"
              :class="[
                selectedTab === index
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200',
              ]"
              @click="selectedTab = index"
            >
              <UIcon :name="tab.icon" class="w-5 h-5" />
              <div class="flex-1">
                <div class="font-medium">
                  {{ tab.label }}
                </div>
                <div class="text-xs opacity-75">
                  {{ tab.description }}
                </div>
              </div>
            </button>
          </nav>
        </div>

        <!-- Main Content -->
        <div class="flex-1 min-w-0">
          <!-- Profile Settings -->
          <div v-if="selectedTab === 0" class="space-y-6">
            <ProfileSettings
              v-if="user?.user"
              :user="user.user"
              :loading="loading"
              @save="saveProfile"
            />
          </div>

          <!-- Security Settings -->
          <div v-else-if="selectedTab === 1" class="space-y-6">
            <SecuritySettings
              :loading="loading"
              :two-factor-enabled="twoFactorEnabled"
              @change-password="changePassword"
              @toggle2-f-a="toggle2FA"
            />
          </div>

          <!-- Theme Settings -->
          <div v-else-if="selectedTab === 2" class="space-y-6">
            <ThemePreferences
              :preferences="themePreferences"
              :loading="loading"
              @save="saveThemePreferences"
            />
          </div>

          <!-- Notification Settings -->
          <div v-else-if="selectedTab === 3" class="space-y-6">
            <NotificationPreferences
              :preferences="notificationPreferences"
              :loading="loading"
              @save="saveNotificationPreferences"
            />
          </div>

          <!-- Currency Settings -->
          <div v-else-if="selectedTab === 4" class="space-y-6">
            <CurrencySettings
              :preferences="currencyPreferences"
              :loading="loading"
              @save="saveCurrencyPreferences"
            />
          </div>

          <!-- Data Settings -->
          <div v-else-if="selectedTab === 5" class="space-y-6">
            <DataSettings
              :loading="loading"
              @export-data="exportData"
              @delete-account="deleteAccount"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
