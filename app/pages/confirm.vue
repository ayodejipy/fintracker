<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const supabase = useSupabaseClient()
const route = useRoute()
const router = useRouter()

const status = ref<'loading' | 'success' | 'error' | 'already-confirmed'>('loading')
const message = ref('')
const countdown = ref(3)

onMounted(async () => {
  try {
    // Get the token hash and type from URL
    const tokenHash = route.query.token_hash as string
    const type = route.query.type as string

    if (!tokenHash || type !== 'email') {
      status.value = 'error'
      message.value = 'Invalid confirmation link. Please try again or request a new confirmation email.'
      return
    }

    // Verify the OTP token
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'email',
    })

    if (error) {
      // Check if already confirmed
      if (error.message.includes('already confirmed') || error.message.includes('already verified')) {
        status.value = 'already-confirmed'
        message.value = 'Your email is already confirmed. Redirecting to login...'
      }
      else {
        throw error
      }
    }
    else if (data?.user) {
      status.value = 'success'
      message.value = 'Email confirmed successfully! Redirecting to dashboard...'

      // Update user profile in database
      try {
        await $fetch('/api/users/verify-email', {
          method: 'POST',
          body: { userId: data.user.id },
        })
      }
      catch (dbError) {
        console.error('Failed to update email verification status:', dbError)
        // Continue anyway - user is confirmed in Supabase
      }
    }

    // Start countdown and redirect
    const interval = setInterval(() => {
      countdown.value--
      if (countdown.value === 0) {
        clearInterval(interval)
        router.push('/dashboard')
      }
    }, 1000)
  }
  catch (error: any) {
    console.error('Email confirmation error:', error)
    status.value = 'error'
    message.value = error.message || 'Failed to confirm email. Please try again or contact support.'
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <!-- Loading State -->
    <UCard v-if="status === 'loading'" class="max-w-md w-full">
      <div class="text-center p-8">
        <UIcon name="i-heroicons-arrow-path" class="w-16 h-16 mx-auto animate-spin text-primary-500" />
        <h2 class="text-2xl font-bold mt-6 text-gray-900 dark:text-gray-100">
          Confirming Your Email
        </h2>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Please wait while we verify your email address...
        </p>
      </div>
    </UCard>

    <!-- Success State -->
    <UCard v-else-if="status === 'success'" class="max-w-md w-full">
      <div class="text-center p-8">
        <div class="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
          <UIcon name="i-heroicons-check-circle" class="w-12 h-12 text-green-600 dark:text-green-400" />
        </div>
        <h2 class="text-2xl font-bold mt-6 text-gray-900 dark:text-gray-100">
          Email Confirmed!
        </h2>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          {{ message }}
        </p>
        <div class="mt-6">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <UIcon name="i-heroicons-clock" class="w-5 h-5 text-gray-500" />
            <span class="text-sm text-gray-700 dark:text-gray-300">
              Redirecting in {{ countdown }} second{{ countdown !== 1 ? 's' : '' }}
            </span>
          </div>
        </div>
        <UButton
          to="/dashboard"
          color="primary"
          size="lg"
          class="mt-6"
          icon="i-heroicons-arrow-right"
          trailing
        >
          Go to Dashboard Now
        </UButton>
      </div>
    </UCard>

    <!-- Already Confirmed State -->
    <UCard v-else-if="status === 'already-confirmed'" class="max-w-md w-full">
      <div class="text-center p-8">
        <div class="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
          <UIcon name="i-heroicons-information-circle" class="w-12 h-12 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 class="text-2xl font-bold mt-6 text-gray-900 dark:text-gray-100">
          Already Confirmed
        </h2>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          {{ message }}
        </p>
        <div class="mt-6">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <UIcon name="i-heroicons-clock" class="w-5 h-5 text-gray-500" />
            <span class="text-sm text-gray-700 dark:text-gray-300">
              Redirecting in {{ countdown }} second{{ countdown !== 1 ? 's' : '' }}
            </span>
          </div>
        </div>
        <UButton
          to="/auth/login"
          color="primary"
          size="lg"
          class="mt-6"
          icon="i-heroicons-arrow-right"
          trailing
        >
          Go to Login
        </UButton>
      </div>
    </UCard>

    <!-- Error State -->
    <UCard v-else class="max-w-md w-full">
      <div class="text-center p-8">
        <div class="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
          <UIcon name="i-heroicons-x-circle" class="w-12 h-12 text-red-600 dark:text-red-400" />
        </div>
        <h2 class="text-2xl font-bold mt-6 text-gray-900 dark:text-gray-100">
          Confirmation Failed
        </h2>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          {{ message }}
        </p>
        <div class="mt-6 flex flex-col gap-3">
          <UButton
            to="/auth/login"
            color="primary"
            size="lg"
            variant="solid"
          >
            Go to Login
          </UButton>
          <UButton
            to="/auth/register"
            color="gray"
            size="lg"
            variant="ghost"
          >
            Register Again
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>
