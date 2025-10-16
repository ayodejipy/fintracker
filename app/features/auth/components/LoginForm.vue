<script setup lang="ts">
import FormButton from '~/components/ui/FormButton.vue'
import FormInput from '~/components/ui/FormInput.vue'
import { useLoginForm } from '../composables/useLoginForm'

interface LoginFormEmits {
  (e: 'success'): void
}

const emit = defineEmits<LoginFormEmits>()

const {
  // Form fields
  email,
  emailAttrs,
  password,
  passwordAttrs,

  // Form state
  errors,
  isLoading,
  generalError,
  isFormValid,

  // Actions
  submitForm,
} = useLoginForm()

async function onSubmit() {
  await submitForm()
  emit('success')
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="onSubmit">
    <div>
      <FormInput
        v-model="email"
        v-bind="emailAttrs"
        label="Email Address"
        type="email"
        placeholder="Enter your email"
        required
        :error="errors.email"
      />
    </div>

    <div>
      <FormInput
        v-model="password"
        v-bind="passwordAttrs"
        label="Password"
        type="password"
        placeholder="Enter your password"
        required
        :error="errors.password"
      />
    </div>

    <!-- Remember me and Forgot password -->
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <UCheckbox
          id="remember-me"
          name="remember-me"
          class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
        />
        <label for="remember-me" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
          Remember me
        </label>
      </div>

      <div class="text-sm">
        <NuxtLink
          to="/auth/forgot-password"
          class="font-medium text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300 transition-colors"
        >
          Forgot your password?
        </NuxtLink>
      </div>
    </div>

    <div v-if="generalError" class="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
      <div class="flex">
        <Icon name="heroicons:exclamation-triangle" class="h-5 w-5 text-red-400" />
        <div class="ml-3">
          <p class="text-sm text-red-800 dark:text-red-200">
            {{ generalError }}
          </p>
        </div>
      </div>
    </div>

    <FormButton
      type="submit" variant="primary" size="md" :loading="isLoading" :disabled="!isFormValid" full-width
      text="Sign In"
    />
  </form>
</template>
