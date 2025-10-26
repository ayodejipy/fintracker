import type { RegisterInput } from '../schemas/register'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import {
  incomeSchema,
  passwordSchema,
  personalInfoSchema,

} from '../schemas/register'

export function useMultiStepRegister() {
  const { register } = useSupabaseAuth()
  const showEmailConfirmation = ref(false)

  // Step management
  const currentStep = ref(1)
  const totalSteps = 3
  const isLoading = ref(false)
  const generalError = ref('')

  // Form data that persists across steps
  const formData = ref<Partial<RegisterInput>>({
    name: '',
    email: '',
    monthlyIncome: 0,
    password: '',
    confirmPassword: '',
  })

  // Current schema based on step
  const currentSchema = computed(() => {
    switch (currentStep.value) {
      case 1: return personalInfoSchema
      case 2: return incomeSchema
      case 3: return passwordSchema
      default: return personalInfoSchema
    }
  })

  // Form setup with dynamic schema
  const { handleSubmit, errors, defineField, meta: _meta, resetForm } = useForm({
    validationSchema: toTypedSchema(currentSchema.value),
    initialValues: formData.value,
  })

  // Define fields for each step
  const [name, nameAttrs] = defineField('name')
  const [email, emailAttrs] = defineField('email')
  const [monthlyIncome, monthlyIncomeAttrs] = defineField('monthlyIncome')
  const [password, passwordAttrs] = defineField('password')
  const [confirmPassword, confirmPasswordAttrs] = defineField('confirmPassword')

  // Income ranges for Nigerian context
  const incomeRanges = [
    { value: 50000, label: '₦50,000 - ₦100,000', description: 'Entry level' },
    { value: 150000, label: '₦100,000 - ₦200,000', description: 'Junior professional' },
    { value: 300000, label: '₦200,000 - ₦400,000', description: 'Mid-level professional' },
    { value: 600000, label: '₦400,000 - ₦800,000', description: 'Senior professional' },
    { value: 1200000, label: '₦800,000 - ₦1,500,000', description: 'Management level' },
    { value: 2000000, label: '₦1,500,000+', description: 'Executive level' },
  ]

  // Step validation
  const isStepValid = computed(() => {
    switch (currentStep.value) {
      case 1:
        return !!name.value && !!email.value && !errors.value.name && !errors.value.email
      case 2:
        return !!monthlyIncome.value && monthlyIncome.value > 0
      case 3:
        return !!password.value && !!confirmPassword.value && !errors.value.password && !errors.value.confirmPassword
      default:
        return false
    }
  })

  // Step info
  const stepInfo = computed(() => {
    switch (currentStep.value) {
      case 1:
        return {
          title: 'Let\'s get started',
          description: 'Tell us a bit about yourself',
        }
      case 2:
        return {
          title: 'What\'s your income range?',
          description: 'This helps us provide better financial insights',
        }
      case 3:
        return {
          title: 'Secure your account',
          description: 'Create a strong password to protect your data',
        }
      default:
        return { title: '', description: '' }
    }
  })

  // Button text based on step
  const buttonText = computed(() => {
    return currentStep.value === totalSteps ? 'Create Account' : 'Continue'
  })

  const saveCurrentStepData = () => {
    formData.value = {
      name: name.value || formData.value.name,
      email: email.value || formData.value.email,
      monthlyIncome: monthlyIncome.value || formData.value.monthlyIncome,
      password: password.value || formData.value.password,
      confirmPassword: confirmPassword.value || formData.value.confirmPassword,
    }
  }

  // Navigation functions
  const nextStep = () => {
    if (currentStep.value < totalSteps && isStepValid.value) {
      // Save current step data
      saveCurrentStepData()
      currentStep.value++
      generalError.value = ''

      // Reset form with new schema and preserved data
      nextTick(() => {
        resetForm({
          values: formData.value,
        })
      })
    }
  }

  const prevStep = () => {
    if (currentStep.value > 1) {
      // Save current step data before going back
      saveCurrentStepData()
      currentStep.value--
      generalError.value = ''

      // Reset form with preserved data
      nextTick(() => {
        resetForm({
          values: formData.value,
        })
      })
    }
  }

  // Final submission
  const submitForm = handleSubmit(async () => {
    if (currentStep.value === totalSteps) {
      try {
        isLoading.value = true
        generalError.value = ''

        // Prepare final data
        const finalData = {
          name: formData.value.name!,
          email: formData.value.email!,
          monthlyIncome: Number(formData.value.monthlyIncome!),
          password: password.value!,
        }

        const response = await register(finalData)

        if (response.success) {
          showEmailConfirmation.value = true
          // Parent component will handle showing confirmation message
        }
        else {
          generalError.value = response.message || 'Registration failed. Please try again.'

          // If email already exists, go back to step 1
          if (response.message?.toLowerCase().includes('already') || response.message?.toLowerCase().includes('exists')) {
            currentStep.value = 1
          }
        }
      }
      catch (error: unknown) {
        console.error('Registration error:', error)
        generalError.value = 'An error occurred during registration. Please try again.'
      }
      finally {
        isLoading.value = false
      }
    }
    else {
      // Save current step data before moving to next step
      saveCurrentStepData()
      nextStep()
    }
  })

  const clearError = () => {
    generalError.value = ''
  }

  const resetFormData = () => {
    currentStep.value = 1
    formData.value = {
      name: '',
      email: '',
      monthlyIncome: 0,
      password: '',
      confirmPassword: '',
    }
    resetForm()
    clearError()
  }

  return {
    // Step management
    currentStep: readonly(currentStep),
    totalSteps,
    stepInfo,
    buttonText,

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

    // Form data
    formData: readonly(formData),
    incomeRanges,

    // Form state
    errors,
    isLoading: readonly(isLoading),
    generalError: readonly(generalError),
    isStepValid,
    showEmailConfirmation: readonly(showEmailConfirmation),

    // Actions
    nextStep,
    prevStep,
    submitForm,
    clearError,
    resetFormData,
  }
}
