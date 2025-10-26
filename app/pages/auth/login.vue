<script setup lang="ts">
import LoginForm from '~/features/auth/components/LoginForm.vue'

definePageMeta({
  layout: 'auth',
})

useHead({
  title: 'Login - Personal Finance Tracker',
})

const user = useSupabaseUser()
const route = useRoute()

// Redirect authenticated users with confirmed email to dashboard
watchEffect(() => {
  if (user.value?.email_confirmed_at) {
    const redirect = route.query.redirect as string
    navigateTo(redirect || '/dashboard')
  }
})

function onLoginSuccess() {
  const redirect = route.query.redirect as string
  navigateTo(redirect || '/dashboard')
}
</script>

<template>
  <div class="flex min-h-screen w-full">
    <!-- Left Column - Branding & Benefits -->
    <div class="hidden lg:flex lg:w-2/6 bg-gradient-to-br from-green-600 to-emerald-600 dark:from-gray-800 dark:to-gray-900 rounded-lg relative overflow-hidden">
      <!-- Background Pattern -->
      <div class="absolute inset-0 bg-black/10 dark:bg-black/20">
        <div class="absolute inset-0" style="background-image: radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)" />
      </div>

      <div class="relative z-10 flex flex-col justify-center px-12 py-12 text-white">
        <div class="max-w-md">
          <!-- Logo -->
          <div class="flex items-center mb-8">
            <Icon name="heroicons:banknotes" class="h-12 w-12 text-white mr-4" />
            <h1 class="text-2xl font-bold">
              Personal Finance Dashboard
            </h1>
          </div>

          <!-- Headline -->
          <h2 class="text-4xl font-bold mb-6 leading-tight">
            Welcome Back!
          </h2>

          <p class="text-xl text-green-100 dark:text-gray-300 mb-8 leading-relaxed">
            Continue managing your finances and achieving your financial goals with our comprehensive dashboard.
          </p>

          <!-- Benefits -->
          <div class="space-y-4">
            <div class="flex items-center">
              <div class="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-4">
                <Icon name="heroicons:chart-bar" class="h-5 w-5 text-white" />
              </div>
              <span class="text-green-100 dark:text-gray-300">View your financial overview</span>
            </div>

            <div class="flex items-center">
              <div class="flex-shrink-0 w-8 h-8 bg-white/20 dark:bg-white/10 rounded-full flex items-center justify-center mr-4">
                <Icon name="heroicons:credit-card" class="h-5 w-5 text-white" />
              </div>
              <span class="text-green-100 dark:text-gray-300">Track your recent transactions</span>
            </div>

            <div class="flex items-center">
              <div class="flex-shrink-0 w-8 h-8 bg-white/20 dark:bg-white/10 rounded-full flex items-center justify-center mr-4">
                <Icon name="heroicons:trophy" class="h-5 w-5 text-white" />
              </div>
              <span class="text-green-100 dark:text-gray-300">Monitor your savings progress</span>
            </div>

            <div class="flex items-center">
              <div class="flex-shrink-0 w-8 h-8 bg-white/20 dark:bg-white/10 rounded-full flex items-center justify-center mr-4">
                <Icon name="heroicons:bell" class="h-5 w-5 text-white" />
              </div>
              <span class="text-green-100 dark:text-gray-300">Get budget alerts and insights</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Column - Login Form -->
    <div class="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 xl:px-12">
      <div class="mx-auto w-full max-w-md">
        <!-- Mobile Logo -->
        <div class="lg:hidden text-center mb-8">
          <div class="flex justify-center items-center mb-4">
            <Icon name="heroicons:banknotes" class="h-10 w-10 text-green-600 mr-3" />
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">
              Personal Finance Dashboard
            </h1>
          </div>
        </div>

        <!-- Form Header -->
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Sign in to your account
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            Welcome back! Please enter your details.
          </p>
        </div>

        <!-- Login Form -->
        <div class="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700">
          <LoginForm @success="onLoginSuccess" />

          <!-- Divider -->
          <div class="mt-8">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Don't have an account?
                </span>
              </div>
            </div>

            <!-- Create Account Link -->
            <div class="mt-6">
              <NuxtLink
                to="/auth/register"
                class="w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                Create a new account
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <p class="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Secure login protected by industry-standard encryption
        </p>
      </div>
    </div>
  </div>
</template>
