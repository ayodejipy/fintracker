<script setup lang="ts">
// Guard: redirect if already completed onboarding
const { user } = useAuth()
const router = useRouter()

// Only check on client side
if (process.client) {
  const onboardingStatus = user.value?.user?.onboardingStatus
  if (onboardingStatus === 'COMPLETED') {
    router.push('/dashboard')
  }
}

definePageMeta({
  layout: 'auth',
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
    <div class="w-full max-w-2xl">
      <!-- Logo/Header -->
      <div class="text-center mb-12">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-4">
          <Icon name="heroicons:currency-dollar" class="w-6 h-6 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          PersonalFinance
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Complete your profile
        </p>
      </div>

      <!-- Main Content -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <div class="flex justify-center">
          <IncomeCollectionForm />
        </div>
      </div>

      <!-- Footer Info -->
      <div class="mt-8 text-center">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          You can always update this information in your settings later
        </p>
      </div>
    </div>
  </div>
</template>
