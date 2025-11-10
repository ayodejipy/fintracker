<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const router = useRouter()
const supabase = useSupabaseClient()

const isProcessing = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    // Wait a brief moment for Supabase to process the callback
    await new Promise(resolve => setTimeout(resolve, 500))

    // Check if the session was established
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      throw sessionError
    }

    if (session) {
      // User successfully authenticated with Google
      // Redirect to dashboard
      await router.push('/dashboard')
    }
    else {
      error.value = 'Authentication failed. Please try again.'
      // Redirect back to login after showing error
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    }
  }
  catch (err: unknown) {
    console.error('OAuth callback error:', err)
    const errorMessage = err instanceof Error ? err.message : 'An error occurred during sign-in'
    error.value = errorMessage
    // Redirect back to login after showing error
    setTimeout(() => {
      router.push('/auth/login')
    }, 3000)
  }
  finally {
    isProcessing.value = false
  }
})
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen gap-4">
    <div v-if="isProcessing" class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
      <p class="text-gray-600 dark:text-gray-400">Completing sign-in...</p>
    </div>

    <div v-else-if="error" class="text-center text-red-600 dark:text-red-400">
      <div class="mb-4">
        <Icon name="heroicons:exclamation-circle" class="w-12 h-12 mx-auto text-red-500" />
      </div>
      <p class="mb-2 font-medium">{{ error }}</p>
      <p class="text-sm text-gray-500 dark:text-gray-400">Redirecting to login...</p>
    </div>

    <div v-else class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
      <p class="text-gray-600 dark:text-gray-400">Setting up your account...</p>
    </div>
  </div>
</template>
