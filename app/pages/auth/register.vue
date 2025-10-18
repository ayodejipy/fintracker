<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import MultiStepRegisterForm from '~/features/auth/components/MultiStepRegisterForm.vue'

definePageMeta({
  layout: 'auth',
})

useHead({
  title: 'Register - Personal Finance Tracker',
})

const { isAuthenticated } = useAuth()

// Track current step for sidebar updates
const currentStep = ref(1)
// Start as true to prevent redirect during registration flow
const isInRegistrationFlow = ref(true)

// Redirect authenticated users to dashboard
// Only redirect if they're not in the registration flow
watch(isAuthenticated, (authenticated) => {
  // Only redirect if:
  // 1. User is authenticated
  // 2. They are NOT currently in the registration flow
  if (authenticated && !isInRegistrationFlow.value) {
    navigateTo('/dashboard')
  }
}, { immediate: true })

function onRegisterSuccess() {
  // Registration complete, allow redirect
  isInRegistrationFlow.value = false
  navigateTo('/dashboard')
}

function handleStepChange(step: number) {
  currentStep.value = step
  // Keep the registration flow flag as true while in the process
  // This prevents unwanted redirects during multi-step registration
}

// Initialize step tracking
onMounted(() => {
  currentStep.value = 1
})
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

        <!-- Onboarding Steps -->
        <div class="flex-1">
          <div class="relative">
            <!-- Continuous connecting line background (connects all steps until step 3) -->
            <div class="absolute left-5 top-10 w-0.5 h-48 bg-gray-300 dark:bg-gray-600" />

            <!-- Step 1 - Your Details -->
            <div class="relative flex items-start mb-12">
              <div class="relative flex-shrink-0 mr-4 z-10">
                <div
                  class="w-10 h-10 rounded-md flex items-center justify-center transition-all duration-200"
                  :class="currentStep >= 1 ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600'"
                >
                  <Icon
                    v-if="currentStep > 1"
                    name="heroicons:check"
                    class="h-5 w-5 text-white"
                  />
                  <Icon
                    v-else
                    name="heroicons:user"
                    class="h-5 w-5"
                    :class="currentStep >= 1 ? 'text-white' : 'text-gray-500 dark:text-gray-400'"
                  />
                </div>
                <!-- Active line segment -->
                <div
                  v-if="currentStep > 1"
                  class="absolute left-1/2 top-10 w-0.5 h-12 -translate-x-1/2 bg-green-600 transition-all duration-200"
                />
              </div>
              <div class="pt-2">
                <h3
                  class="text-sm font-semibold"
                  :class="currentStep >= 1 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'"
                >
                  Your details
                </h3>
                <p
                  class="text-sm mt-1"
                  :class="currentStep >= 1 ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'"
                >
                  Provide your name and email
                </p>
              </div>
            </div>

            <!-- Step 2 - Income Range -->
            <div class="relative flex items-start mb-12">
              <div class="relative flex-shrink-0 mr-4 z-10">
                <div
                  class="w-10 h-10 rounded-md flex items-center justify-center transition-all duration-200"
                  :class="currentStep >= 2 ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600'"
                >
                  <Icon
                    v-if="currentStep > 2"
                    name="heroicons:check"
                    class="h-5 w-5 text-white"
                  />
                  <Icon
                    v-else
                    name="heroicons:currency-dollar"
                    class="h-5 w-5"
                    :class="currentStep >= 2 ? 'text-white' : 'text-gray-500 dark:text-gray-400'"
                  />
                </div>
                <!-- Active line segment -->
                <div
                  v-if="currentStep > 2"
                  class="absolute left-1/2 top-10 w-0.5 h-12 -translate-x-1/2 bg-green-600 transition-all duration-200"
                />
              </div>
              <div class="pt-2">
                <h3
                  class="text-sm font-semibold"
                  :class="currentStep >= 2 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'"
                >
                  Income range
                </h3>
                <p
                  class="text-sm mt-1"
                  :class="currentStep >= 2 ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'"
                >
                  Select your monthly income
                </p>
              </div>
            </div>

            <!-- Step 3 - Password & Create Account (no connecting line) -->
            <div class="relative flex items-start">
              <div class="relative flex-shrink-0 mr-4 z-10">
                <div
                  class="w-10 h-10 rounded-md flex items-center justify-center transition-all duration-200"
                  :class="currentStep >= 3 ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600'"
                >
                  <Icon
                    v-if="currentStep > 3"
                    name="heroicons:check"
                    class="h-5 w-5 text-white"
                  />
                  <Icon
                    v-else
                    name="heroicons:lock-closed"
                    class="h-5 w-5"
                    :class="currentStep >= 3 ? 'text-white' : 'text-gray-500 dark:text-gray-400'"
                  />
                </div>
                <!-- No connecting line for the last step -->
              </div>
              <div class="pt-2">
                <h3
                  class="text-sm font-semibold"
                  :class="currentStep >= 3 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'"
                >
                  Secure your account
                </h3>
                <p
                  class="text-sm mt-1"
                  :class="currentStep >= 3 ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'"
                >
                  Create a strong password
                </p>
              </div>
            </div>
          </div>
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

        <!-- Multi-Step Registration Form -->
        <div class="bg-white dark:bg-gray-800 py-8 px-8 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700">
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
