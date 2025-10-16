import type { RegisterInput } from '../schemas/register'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { useAuth } from '~/composables/useAuth'
import { registerSchema } from '../schemas/register'

export function useRegisterForm() {
  const { register } = useAuth()
  const isLoading = ref(false)
  const generalError = ref('')

  const { handleSubmit, errors, defineField, meta, resetForm } = useForm({
    validationSchema: toTypedSchema(registerSchema),
    initialValues: {
      name: '',
      email: '',
      monthlyIncome: 0,
      password: '',
      confirmPassword: '',
    },
  })

  // Define form fields with proper typing
  const [name, nameAttrs] = defineField('name')
  const [email, emailAttrs] = defineField('email')
  const [monthlyIncome, monthlyIncomeAttrs] = defineField('monthlyIncome')
  const [password, passwordAttrs] = defineField('password')
  const [confirmPassword, confirmPasswordAttrs] = defineField('confirmPassword')

  const isFormValid = computed(() => {
    return meta.value.valid
      && !!name.value
      && !!email.value
      && !!monthlyIncome.value
      && !!password.value
      && !!confirmPassword.value
  })

  const submitForm = handleSubmit(async (values: RegisterInput) => {
    try {
      isLoading.value = true
      generalError.value = ''

      await register(values)
      await navigateTo('/dashboard')
    }
    catch (error: unknown) {
      console.error('Registration error:', error)

      const apiError = error as { data?: { code?: string } }
      if (apiError.data?.code === 'USER_EXISTS') {
        generalError.value = 'An account with this email already exists.'
      }
      else {
        generalError.value = 'An error occurred during registration. Please try again.'
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
    name,
    nameAttrs,
    email,
    emailAttrs,
    monthlyIncome,
    monthlyIncomeAttrs,
    password,
    passwordAttrs,
    confirmPassword,
    confirmPasswordAttrs,

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
