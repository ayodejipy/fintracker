import type {
  CurrencyPreferencesInput,
  NotificationPreferencesInput,
  ProfileSettingsInput,
  SecuritySettingsInput,
  ThemePreferencesInput,
} from '~/features/settings/schemas/settings'

export function useSettings() {
  const selectedTab = ref(0) // Default to Profile tab
  const { user, refreshUser } = useAuth()

  const tabs = [
    {
      key: 'profile',
      label: 'Profile',
      icon: 'i-heroicons-user',
      description: 'Personal information',
    },
    {
      key: 'security',
      label: 'Security',
      icon: 'i-heroicons-shield-check',
      description: 'Change password',
    },
    {
      key: 'theme',
      label: 'Appearance',
      icon: 'i-heroicons-paint-brush',
      description: 'Theme & display',
    },
    {
      key: 'notifications',
      label: 'Notifications',
      icon: 'i-heroicons-bell',
      description: 'Email & push alerts',
    },
    {
      key: 'currency',
      label: 'Currency',
      icon: 'i-heroicons-currency-dollar',
      description: 'Regional settings',
    },
    {
      key: 'data',
      label: 'Data',
      icon: 'i-heroicons-archive-box',
      description: 'Export & backup',
    },
  ]

  // Settings state
  const loading = ref(false)
  const toast = useToast()

  // Load preferences from localStorage with defaults
  const notificationPreferences = ref<NotificationPreferencesInput>({
    email: {
      budgetAlerts: true,
      goalReminders: true,
      weeklyReports: false,
      monthlyReports: true,
      securityAlerts: true,
    },
    push: {
      budgetAlerts: false,
      goalReminders: false,
      weeklyReports: false,
      monthlyReports: false,
      securityAlerts: true,
    },
  })

  const themePreferences = ref<ThemePreferencesInput>({
    theme: 'system',
    compactMode: false,
    reducedMotion: false,
  })

  const currencyPreferences = ref<CurrencyPreferencesInput>({
    currency: 'NGN',
    locale: 'en-NG',
  })

  const twoFactorEnabled = ref(false)

  // Load saved preferences on mount
  function loadSavedPreferences() {
    try {
      // Load theme preferences
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
      const savedCompactMode = localStorage.getItem('compactMode') === 'true'
      const savedReducedMotion = localStorage.getItem('reducedMotion') === 'true'

      if (savedTheme) {
        themePreferences.value.theme = savedTheme
      }
      themePreferences.value.compactMode = savedCompactMode
      themePreferences.value.reducedMotion = savedReducedMotion

      // Load notification preferences
      const savedNotifications = localStorage.getItem('notificationPreferences')
      if (savedNotifications) {
        notificationPreferences.value = JSON.parse(savedNotifications)
      }

      // Load currency preferences
      const savedCurrency = localStorage.getItem('currencyPreferences')
      if (savedCurrency) {
        currencyPreferences.value = JSON.parse(savedCurrency)
      }

      // Load 2FA status
      const saved2FA = localStorage.getItem('twoFactorEnabled') === 'true'
      twoFactorEnabled.value = saved2FA
    }
    catch (error) {
      console.error('Error loading saved preferences:', error)
    }
  }

  // Actions
  async function saveProfile(data: ProfileSettingsInput) {
    loading.value = true
    try {
      const response = await $fetch('/api/user/profile', {
        method: 'PUT',
        body: data,
      })

      // Refresh user data
      await refreshUser()

      toast.add({
        title: 'Success',
        description: 'Profile updated successfully',
        color: 'green',
        icon: 'i-heroicons-check-circle',
      })

      return response
    }
    catch (error: any) {
      console.error('Profile update error:', error)
      toast.add({
        title: 'Error',
        description: error.data?.message || 'Failed to update profile',
        color: 'red',
        icon: 'i-heroicons-x-circle',
      })
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function changePassword(data: SecuritySettingsInput) {
    loading.value = true
    try {
      await $fetch('/api/user/password', {
        method: 'PUT',
        body: data,
      })

      toast.add({
        title: 'Success',
        description: 'Password updated successfully',
        color: 'green',
        icon: 'i-heroicons-check-circle',
      })
    }
    catch (error: any) {
      console.error('Password update error:', error)
      toast.add({
        title: 'Error',
        description: error.data?.message || 'Failed to update password',
        color: 'red',
        icon: 'i-heroicons-x-circle',
      })
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function toggle2FA(enabled: boolean) {
    loading.value = true
    try {
      await $fetch('/api/user/2fa', {
        method: 'PUT',
        body: { enabled },
      })

      twoFactorEnabled.value = enabled
      localStorage.setItem('twoFactorEnabled', enabled.toString())

      toast.add({
        title: 'Success',
        description: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'}`,
        color: 'green',
        icon: 'i-heroicons-shield-check',
      })
    }
    catch (error: any) {
      console.error('2FA update error:', error)
      toast.add({
        title: 'Error',
        description: error.data?.message || 'Failed to update two-factor authentication',
        color: 'red',
        icon: 'i-heroicons-x-circle',
      })
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function saveNotificationPreferences(preferences: NotificationPreferencesInput) {
    loading.value = true
    try {
      await $fetch('/api/user/notifications', {
        method: 'PUT',
        body: preferences,
      })

      notificationPreferences.value = preferences
      localStorage.setItem('notificationPreferences', JSON.stringify(preferences))

      toast.add({
        title: 'Success',
        description: 'Notification preferences updated',
        color: 'green',
        icon: 'i-heroicons-bell',
      })
    }
    catch (error: any) {
      console.error('Notification preferences update error:', error)
      toast.add({
        title: 'Error',
        description: error.data?.message || 'Failed to update notification preferences',
        color: 'red',
        icon: 'i-heroicons-x-circle',
      })
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function saveThemePreferences(preferences: ThemePreferencesInput) {
    loading.value = true
    try {
      await $fetch('/api/user/theme', {
        method: 'PUT',
        body: preferences,
      })

      themePreferences.value = preferences

      // Apply theme immediately and save to localStorage
      localStorage.setItem('theme', preferences.theme)
      localStorage.setItem('compactMode', preferences.compactMode.toString())
      localStorage.setItem('reducedMotion', preferences.reducedMotion.toString())

      toast.add({
        title: 'Success',
        description: 'Theme preferences updated',
        color: 'green',
        icon: 'i-heroicons-paint-brush',
      })
    }
    catch (error: any) {
      console.error('Theme preferences update error:', error)
      toast.add({
        title: 'Error',
        description: error.data?.message || 'Failed to update theme preferences',
        color: 'red',
        icon: 'i-heroicons-x-circle',
      })
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function saveCurrencyPreferences(preferences: CurrencyPreferencesInput) {
    loading.value = true
    try {
      await $fetch('/api/user/currency', {
        method: 'PUT',
        body: preferences,
      })

      currencyPreferences.value = preferences
      localStorage.setItem('currencyPreferences', JSON.stringify(preferences))

      // Refresh user data to update currency in the app
      await refreshUser()

      toast.add({
        title: 'Success',
        description: 'Currency preferences updated',
        color: 'green',
        icon: 'i-heroicons-currency-dollar',
      })
    }
    catch (error: any) {
      console.error('Currency preferences update error:', error)
      toast.add({
        title: 'Error',
        description: error.data?.message || 'Failed to update currency preferences',
        color: 'red',
        icon: 'i-heroicons-x-circle',
      })
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function deleteAccount() {
    loading.value = true
    try {
      await $fetch('/api/user/delete', {
        method: 'DELETE',
      })

      // Clear all local storage
      localStorage.clear()

      toast.add({
        title: 'Account Deleted',
        description: 'Your account has been permanently deleted',
        color: 'green',
        icon: 'i-heroicons-trash',
      })

      // Redirect to home page
      await navigateTo('/')
    }
    catch (error: any) {
      console.error('Account deletion error:', error)
      toast.add({
        title: 'Error',
        description: error.data?.message || 'Failed to delete account',
        color: 'red',
        icon: 'i-heroicons-x-circle',
      })
      throw error
    }
    finally {
      loading.value = false
    }
  }

  // Export data functionality
  async function exportData(format: 'json' | 'csv' = 'json') {
    loading.value = true
    try {
      // For JSON export, fetch all data and convert
      if (format === 'json') {
        const [transactions, budgets, loans, savingsGoals] = await Promise.all([
          $fetch('/api/transactions'),
          $fetch('/api/budgets'),
          $fetch('/api/loans'),
          $fetch('/api/savings-goals'),
        ])

        const data = {
          exportDate: new Date().toISOString(),
          transactions,
          budgets,
          loans,
          savingsGoals,
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        })

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `financial-data-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
      else {
        // For CSV, use the export endpoint
        const response = await $fetch('/api/export/all', {
          method: 'GET',
          query: { format: 'csv' },
        })

        const blob = new Blob([response as string], {
          type: 'text/csv',
        })

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `financial-data-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }

      toast.add({
        title: 'Export Complete',
        description: `Data exported as ${format.toUpperCase()}`,
        color: 'green',
        icon: 'i-heroicons-arrow-down-tray',
      })
    }
    catch (error: any) {
      console.error('Data export error:', error)
      toast.add({
        title: 'Export Failed',
        description: error.data?.message || 'Failed to export data',
        color: 'red',
        icon: 'i-heroicons-x-circle',
      })
      throw error
    }
    finally {
      loading.value = false
    }
  }

  // Initialize preferences on mount
  onMounted(() => {
    loadSavedPreferences()
  })

  return {
    // State
    selectedTab,
    tabs,
    loading,
    notificationPreferences,
    themePreferences,
    currencyPreferences,
    twoFactorEnabled,
    user: readonly(user),

    // Actions
    saveProfile,
    changePassword,
    toggle2FA,
    saveNotificationPreferences,
    saveThemePreferences,
    saveCurrencyPreferences,
    deleteAccount,
    exportData,
    loadSavedPreferences,
  }
}
