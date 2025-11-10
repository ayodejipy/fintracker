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

const { signInWithGoogle } = useSupabaseAuth()

const isGoogleLoading = ref(false)

async function handleGoogleSignIn() {
  try {
    isGoogleLoading.value = true
    const response = await signInWithGoogle()
    if (!response.success) {
      generalError.value = response.message || 'Failed to sign in with Google'
    }
    // If successful, Supabase will redirect automatically
  }
  catch (error: unknown) {
    console.error('Google sign-in error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred during Google sign-in'
    generalError.value = errorMessage
  }
  finally {
    isGoogleLoading.value = false
  }
}

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
        <div class="ml-1.5">
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

    <!-- Divider -->
    <div class="relative">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
      </div>
      <div class="relative flex justify-center text-sm">
        <span class="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
          Or continue with
        </span>
      </div>
    </div>

    <!-- Google Sign-In Button -->
    <button
      type="button"
      :disabled="isGoogleLoading"
      @click="handleGoogleSignIn"
      class="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Icon name="flat-color-icons:google" class="w-5 h-5" />
      <span class="text-sm font-medium text-gray-700 dark:text-gray-200">
        {{ isGoogleLoading ? 'Signing in...' : 'Sign in with Google' }}
      </span>
    </button>
  </form>
</template>
