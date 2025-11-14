<script setup lang="ts">
import type { SecuritySettingsInput } from '../schemas'
import { securitySettingsSchema } from '../schemas'

interface Props {
  loading?: boolean
  user?: {
    oauthProvider?: string | null
  }
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  changePassword: [data: SecuritySettingsInput]
}>()

// Determine if user is OAuth or email/password
const isOAuthUser = computed(() => !!props.user?.oauthProvider)
const authMethod = computed(() => {
  if (props.user?.oauthProvider) {
    return props.user.oauthProvider.charAt(0).toUpperCase() + props.user.oauthProvider.slice(1)
  }
  return 'Email/Password'
})

const { handleSubmit, errors, formData, resetForm } = useFormValidation({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}, securitySettingsSchema)

const showPasswords = ref({
  current: false,
  new: false,
  confirm: false,
})

async function onSubmit(event: Event) {
  event.preventDefault()
  await handleSubmit(async (data) => {
    emit('changePassword', data)
    resetForm()
  })
}

// OAuth security link based on provider
const oauthSecurityLink = computed(() => {
  const provider = props.user?.oauthProvider?.toLowerCase()
  const links: Record<string, string> = {
    'google': 'https://myaccount.google.com/security',
    'github': 'https://github.com/settings/security',
    'facebook': 'https://www.facebook.com/settings?tab=security',
    'twitter': 'https://twitter.com/settings/security',
  }
  return links[provider || ''] || 'https://myaccount.google.com/security'
})
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors">
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
        <UIcon name="i-heroicons-shield-check" class="w-5 h-5 text-white" />
      </div>
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Security Settings
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ isOAuthUser ? `Manage your ${authMethod} security` : 'Manage your password and security' }}
        </p>
      </div>
    </div>

    <div class="space-y-8">
      <!-- OAuth User - Info Card -->
      <div v-if="isOAuthUser" class="space-y-4">
        <UAlert
          color="primary"
          variant="subtle"
          icon="i-heroicons-information-circle"
        >
          <template #title>
            OAuth Authentication
          </template>
          <template #description>
            You're securely signed in with {{ authMethod }}. Your authentication and password security are managed by {{ authMethod }}.
          </template>
        </UAlert>

        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <UIcon name="i-heroicons-shield-check" class="w-5 h-5 text-white" />
            </div>
            <div class="flex-1">
              <p class="font-medium text-gray-900 dark:text-white mb-1">
                Security Managed by {{ authMethod }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                To update your password, enable two-factor authentication, or manage other security settings, please visit your {{ authMethod }} account.
              </p>
              <UButton
                :to="oauthSecurityLink"
                target="_blank"
                color="primary"
                variant="outline"
                size="sm"
                icon="i-heroicons-arrow-top-right-on-square"
                trailing
              >
                Open {{ authMethod }} Security Settings
              </UButton>
            </div>
          </div>
        </div>

        <!-- Security Tips for OAuth Users -->
        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div class="flex items-start">
            <UIcon name="i-heroicons-light-bulb" class="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Security Recommendations
              </p>
              <ul class="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>Enable two-factor authentication on your {{ authMethod }} account</li>
                <li>Use a strong, unique password for your {{ authMethod }} account</li>
                <li>Review your {{ authMethod }} account's recent activity regularly</li>
                <li>Keep your {{ authMethod }} recovery options up to date</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Email/Password User - Change Password Form -->
      <div v-else>
        <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">
          Change Password
        </h4>

        <form class="space-y-6" @submit="onSubmit">
          <!-- Current Password -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Current Password <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="formData.currentPassword"
              :type="showPasswords.current ? 'text' : 'password'"
              placeholder="Enter your current password"
              icon="i-heroicons-lock-closed"
              size="xl"
              :ui="{ base: 'text-base' }"
            >
              <template #trailing>
                <UButton
                  variant="ghost"
                  size="xs"
                  :icon="showPasswords.current ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                  @click="showPasswords.current = !showPasswords.current"
                />
              </template>
            </UInput>
            <p v-if="errors.currentPassword" class="text-xs text-red-600 dark:text-red-400">
              {{ errors.currentPassword }}
            </p>
            <p v-else class="text-xs text-gray-500 dark:text-gray-400">
              Enter your existing password to confirm your identity
            </p>
          </div>

          <!-- New Password -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              New Password <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="formData.newPassword"
              :type="showPasswords.new ? 'text' : 'password'"
              placeholder="Enter your new password"
              icon="i-heroicons-lock-closed"
              size="xl"
              :ui="{ base: 'text-base' }"
            >
              <template #trailing>
                <UButton
                  variant="ghost"
                  size="xs"
                  :icon="showPasswords.new ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                  @click="showPasswords.new = !showPasswords.new"
                />
              </template>
            </UInput>
            <p v-if="errors.newPassword" class="text-xs text-red-600 dark:text-red-400">
              {{ errors.newPassword }}
            </p>
            <p v-else class="text-xs text-gray-500 dark:text-gray-400">
              Must be at least 8 characters long
            </p>
          </div>

          <!-- Confirm Password -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm New Password <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="formData.confirmPassword"
              :type="showPasswords.confirm ? 'text' : 'password'"
              placeholder="Confirm your new password"
              icon="i-heroicons-lock-closed"
              size="xl"
              :ui="{ base: 'text-base' }"
            >
              <template #trailing>
                <UButton
                  variant="ghost"
                  size="xs"
                  :icon="showPasswords.confirm ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                  @click="showPasswords.confirm = !showPasswords.confirm"
                />
              </template>
            </UInput>
            <p v-if="errors.confirmPassword" class="text-xs text-red-600 dark:text-red-400">
              {{ errors.confirmPassword }}
            </p>
            <p v-else class="text-xs text-gray-500 dark:text-gray-400">
              Re-enter your new password to confirm
            </p>
          </div>

          <div class="flex justify-end pt-2">
            <UButton
              type="submit"
              :loading="loading"
              :disabled="loading"
              size="lg"
              class="px-8"
            >
              Update Password
            </UButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
