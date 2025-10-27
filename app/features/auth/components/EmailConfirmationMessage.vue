<script setup lang="ts">
interface Props {
  email: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  resend: []
}>()

const { resendConfirmationEmail } = useSupabaseAuth()
const isResending = ref(false)
const resendSuccess = ref(false)
const resendError = ref('')
const cooldownSeconds = ref(0)

// Cooldown timer
let cooldownInterval: NodeJS.Timeout | null = null

function startCooldown() {
  cooldownSeconds.value = 60 // 60 seconds cooldown
  if (cooldownInterval) {
    clearInterval(cooldownInterval)
  }
  cooldownInterval = setInterval(() => {
    cooldownSeconds.value--
    if (cooldownSeconds.value <= 0) {
      if (cooldownInterval) {
        clearInterval(cooldownInterval)
      }
    }
  }, 1000)
}

async function handleResend() {
  if (cooldownSeconds.value > 0)
    return

  isResending.value = true
  resendError.value = ''
  resendSuccess.value = false

  const response = await resendConfirmationEmail(props.email)

  if (response.success) {
    resendSuccess.value = true
    startCooldown()
  }
  else {
    resendError.value = response.message || 'Failed to resend email'
  }

  isResending.value = false

  // Clear success message after 5 seconds
  if (resendSuccess.value) {
    setTimeout(() => {
      resendSuccess.value = false
    }, 5000)
  }
}

// Cleanup interval on unmount
onUnmounted(() => {
  if (cooldownInterval) {
    clearInterval(cooldownInterval)
  }
})
</script>

<template>
  <div class="bg-white dark:bg-gray-800 py-8 px-8 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700">
    <div class="text-center">
      <!-- Icon -->
      <div class="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6">
        <Icon name="heroicons:envelope" class="w-10 h-10 text-green-600 dark:text-green-400" />
      </div>

      <!-- Title -->
      <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">
        Check Your Email!
      </h3>

      <!-- Description -->
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        We've sent a confirmation link to <strong class="text-gray-900 dark:text-white">{{ email }}</strong>
      </p>

      <!-- Info Box -->
      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <p class="text-sm text-blue-800 dark:text-blue-200">
          Please check your email and click the confirmation link to activate your account.
        </p>
      </div>

      <!-- Success Message -->
      <div
        v-if="resendSuccess"
        class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4"
      >
        <p class="text-sm text-green-800 dark:text-green-200">
          ✓ Confirmation email sent successfully!
        </p>
      </div>

      <!-- Error Message -->
      <div
        v-if="resendError"
        class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4"
      >
        <p class="text-sm text-red-800 dark:text-red-200">
          {{ resendError }}
        </p>
      </div>

      <!-- Actions -->
      <div class="flex flex-col gap-3">
        <UButton
          to="/auth/login"
          color="primary"
          size="lg"
          icon="i-heroicons-arrow-right"
          trailing
        >
          Go to Login
        </UButton>

        <!-- Resend Email Section -->
        <div class="text-sm text-gray-600 dark:text-gray-400">
          Didn't receive the email? Check your spam folder or
          <button
            class="text-blue-600 hover:text-blue-500 underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
            :disabled="isResending || cooldownSeconds > 0"
            @click="handleResend"
          >
            <span v-if="isResending">Sending...</span>
            <span v-else-if="cooldownSeconds > 0">Resend in {{ cooldownSeconds }}s</span>
            <span v-else>resend confirmation</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
