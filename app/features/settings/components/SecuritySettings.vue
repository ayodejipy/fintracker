<script setup lang="ts">
import type { SecuritySettingsInput } from '../schemas'
import { securitySettingsSchema } from '../schemas'

interface Props {
  loading?: boolean
  twoFactorEnabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  twoFactorEnabled: false,
})

const emit = defineEmits<{
  changePassword: [data: SecuritySettingsInput]
  toggle2FA: [enabled: boolean]
}>()

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

function toggle2FA() {
  emit('toggle2FA', !props.twoFactorEnabled)
}
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
          Manage your password and security preferences
        </p>
      </div>
    </div>

    <div class="space-y-8">
      <!-- Change Password -->
      <div>
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

      <!-- Two-Factor Authentication -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-8">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-md font-medium text-gray-900 dark:text-white">
              Two-Factor Authentication
            </h4>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Add an extra layer of security to your account
            </p>
          </div>
          <UToggle
            :model-value="twoFactorEnabled"
            size="lg"
            @update:model-value="toggle2FA"
          />
        </div>

        <div v-if="twoFactorEnabled" class="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div class="flex items-center">
            <UIcon name="i-heroicons-shield-check" class="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
            <span class="text-sm text-green-800 dark:text-green-200">
              Two-factor authentication is enabled
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
