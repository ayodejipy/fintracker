import type { LoginInput } from '../schemas/login'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { useAuth } from '~/composables/useAuth'
import { loginSchema } from '../schemas/login'

export function useLoginForm() {
  const { login } = useAuth()
  const isLoading = ref(false)
  const generalError = ref('')

  const { handleSubmit, errors, defineField, meta, resetForm } = useForm({
    validationSchema: toTypedSchema(loginSchema),
    initialValues: {
      email: '',
      password: '',
    },
  })

  // Define form fields with proper typing
  const [email, emailAttrs] = defineField('email', {
    validateOnModelUpdate: false,
  })
  const [password, passwordAttrs] = defineField('password', {
    validateOnModelUpdate: false,
  })

  const isFormValid = computed(() => {
    return meta.value.valid && !!email.value && !!password.value
  })

  const submitForm = handleSubmit(async (values: LoginInput) => {
    try {
      isLoading.value = true
      generalError.value = ''

      await login(values)
      await navigateTo('/dashboard')
    }
    catch (error: unknown) {
      console.error('Login error:', error)

      const apiError = error as { data?: { code?: string } }
      if (apiError.data?.code === 'INVALID_CREDENTIALS') {
        generalError.value = 'Invalid email or password. Please try again.'
      }
      else {
        generalError.value = 'An error occurred during login. Please try again.'
      }
    }
    finally {
      isLoading.value = false
    }
  })

  const clearError = () => {
    generalError.value = ''
  }

  const resetFormData = () => {
    resetForm()
    clearError()
  }

  return {
    // Form fields
    email,
    emailAttrs,
    password,
    passwordAttrs,

    // Form state
    errors,
    isLoading: readonly(isLoading),
    generalError: readonly(generalError),
    isFormValid,

    // Actions
    submitForm,
    clearError,
    resetFormData,
  }
}
