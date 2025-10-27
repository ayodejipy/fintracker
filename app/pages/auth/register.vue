<script setup lang="ts">
import MultiStepRegisterForm from '~/features/auth/components/MultiStepRegisterForm.vue'
import OnboardingSteps from '~/features/auth/components/OnboardingSteps.vue'
import EmailConfirmationMessage from '~/features/auth/components/EmailConfirmationMessage.vue'

definePageMeta({
  layout: 'auth',
})

useHead({
  title: 'Register - Personal Finance Tracker',
})

const user = useSupabaseUser()

// Track current step for sidebar updates
const currentStep = ref(1)
const showEmailConfirmation = ref(false)
const registeredEmail = ref('')

// Redirect authenticated users with confirmed email to dashboard
watchEffect(() => {
  if (user.value?.email_confirmed_at) {
    navigateTo('/dashboard')
  }
})

function onRegisterSuccess(email: string, needsConfirmation: boolean) {
  if (needsConfirmation) {
    showEmailConfirmation.value = true
    registeredEmail.value = email
  }
  else {
    // Auto-login successful, redirect to dashboard
    navigateTo('/dashboard')
  }
}

function handleStepChange(step: number) {
  currentStep.value = step
}
</script>

<template>
  <div class="flex min-h-screen w-full">
    <!-- Left Column - Onboarding Steps -->
    <div class="hidden lg:flex lg:w-2/6 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div class="flex flex-col justify-between px-6 py-12 w-full">
        <!-- Logo -->
        <div class="flex items-center mb-12">
          <Icon name="heroicons:banknotes" class="h-8 w-8 text-blue-600 mr-3" />
          <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
            Personal Finance Dashboard
          </h1>
        </div>

        <!-- Onboarding Steps Component -->
        <div class="flex-1">
          <OnboardingSteps :current-step="currentStep" />
        </div>

        <!-- Bottom Navigation -->
        <div class="flex justify-between items-center pt-8">
          <NuxtLink
            to="/"
            class="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <Icon name="heroicons:arrow-left" class="h-4 w-4 mr-2" />
            Back to home
          </NuxtLink>
          <NuxtLink
            to="/auth/login"
            class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            Sign in
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Right Column - Registration Form -->
    <div class="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 xl:px-12 bg-gray-50 dark:bg-gray-900">
      <div class="mx-auto w-full max-w-lg">
        <!-- Mobile Logo -->
        <div class="lg:hidden text-center mb-8">
          <div class="flex justify-center items-center mb-4">
            <Icon name="heroicons:banknotes" class="h-10 w-10 text-blue-600 mr-3" />
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">
              Personal Finance Dashboard
            </h1>
          </div>
        </div>

        <!-- Form Header -->
        <div class="text-center mb-8">
          <div class="flex justify-center mb-4">
            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
              <Icon name="heroicons:user-plus" class="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Create a free account
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            Provide your email and choose a password
          </p>
        </div>

        <!-- Email Confirmation Message Component -->
        <EmailConfirmationMessage
          v-if="showEmailConfirmation"
          :email="registeredEmail"
        />

        <!-- Multi-Step Registration Form -->
        <div v-else class="bg-white dark:bg-gray-800 py-8 px-8 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700">
          <MultiStepRegisterForm @success="onRegisterSuccess" @step-change="handleStepChange" />
        </div>

        <!-- Progress Indicator -->
        <div class="mt-8 flex justify-center">
          <div class="flex space-x-2">
            <div
              v-for="step in 3"
              :key="step"
              class="w-2 h-2 rounded-full transition-colors duration-200"
              :class="currentStep >= step ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'"
            />
          </div>
        </div>

        <!-- Footer -->
        <p class="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          By creating an account, you agree to our
          <a href="#" class="text-blue-600 hover:text-blue-500 underline">Terms of Service</a>
          and
          <a href="#" class="text-blue-600 hover:text-blue-500 underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  </div>
</template>
