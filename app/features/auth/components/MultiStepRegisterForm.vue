<script setup lang="ts">
import FormButton from '~/components/ui/FormButton.vue'
import FormInput from '~/components/ui/FormInput.vue'
import { useMultiStepRegister } from '../composables/useMultiStepRegister'

interface MultiStepRegisterFormEmits {
  (e: 'success', email: string, needsConfirmation: boolean): void
  (e: 'stepChange', step: number): void
}

const emit = defineEmits<MultiStepRegisterFormEmits>()

const {
  // Step management
  currentStep,
  totalSteps: _totalSteps,
  stepInfo,
  buttonText,

  // Form fields
  name,
  nameAttrs,
  email,
  emailAttrs,
  monthlyIncome,
  monthlyIncomeAttrs: _monthlyIncomeAttrs,
  password,
  passwordAttrs,
  confirmPassword,
  confirmPasswordAttrs,

  // Form data
  formData,
  incomeRanges,

  // Form state
  errors,
  isLoading,
  generalError,
  isStepValid,
  showEmailConfirmation,

  // Actions
  prevStep,
  nextStep,
  submitForm,
} = useMultiStepRegister()

// Watch for step changes to emit to parent
watch(currentStep, (newStep) => {
  emit('stepChange', newStep)
}, { immediate: true })

// Watch for successful registration with email confirmation
watch(showEmailConfirmation, (needsConfirmation) => {
  if (needsConfirmation) {
    emit('success', formData.value.email!, true)
  }
})

async function onSubmit() {
  await submitForm()
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="onSubmit">
    <!-- Step Header -->
    <div class="text-center mb-8">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {{ stepInfo.title }}
      </h2>
      <p class="text-gray-600 dark:text-gray-400">
        {{ stepInfo.description }}
      </p>
    </div>

    <!-- Step 1: Name & Email -->
    <div v-if="currentStep === 1" class="space-y-4">
      <FormInput
        v-model="name" v-bind="nameAttrs" label="Full Name" type="text" placeholder="Enter your full name"
        required :error="errors.name"
      />

      <FormInput
        v-model="email" v-bind="emailAttrs" label="Email Address" type="email"
        placeholder="Enter your email address" required :error="errors.email"
      />
    </div>

    <!-- Step 2: Income Range -->
    <div v-if="currentStep === 2" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          Select your monthly income range
        </label>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
          This helps us provide better financial insights
        </p>
        <div class="grid gap-3">
          <label
            v-for="range in incomeRanges" :key="range.value"
            class="relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-all duration-200 hover:shadow-sm"
            :class="monthlyIncome === range.value
              ? 'border-green-500 bg-green-50 ring-2 ring-green-500 ring-opacity-20 dark:bg-green-900/20 dark:border-green-400'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'"
          >
            <input v-model="monthlyIncome" :value="range.value" type="radio" name="income-range" class="sr-only">
            <div class="flex flex-1 items-center">
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ range.label }}
                  </p>
                  <div
                    class="h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors duration-200"
                    :class="monthlyIncome === range.value
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300 dark:border-gray-600'"
                  >
                    <div v-if="monthlyIncome === range.value" class="h-2 w-2 rounded-full bg-white" />
                  </div>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {{ range.description }}
                </p>
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>

    <!-- Step 3: Password -->
    <div v-if="currentStep === 3" class="space-y-4">
      <FormInput
        v-model="password" v-bind="passwordAttrs" label="Password" type="password"
        placeholder="Create a strong password" required :error="errors.password" hint="Must be at least 6 characters"
      />

      <FormInput
        v-model="confirmPassword" v-bind="confirmPasswordAttrs" label="Confirm Password" type="password"
        placeholder="Confirm your password" required :error="errors.confirmPassword"
      />

      <!-- Account Summary -->
      <div class="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mt-6">
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Account Summary
        </h4>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-gray-400">Name:</span>
            <span class="font-medium text-gray-900 dark:text-white">{{ formData.name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-gray-400">Email:</span>
            <span class="font-medium text-gray-900 dark:text-white">{{ formData.email }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-gray-400">Income Range:</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ incomeRanges.find(r => r.value === formData.monthlyIncome)?.label }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div
      v-if="generalError"
      class="rounded-lg bg-red-50 border border-red-200 p-4 dark:bg-red-900/20 dark:border-red-800"
    >
      <div class="flex">
        <Icon name="heroicons:exclamation-triangle" class="h-5 w-5 text-red-400 flex-shrink-0" />
        <div class="ml-3">
          <p class="text-sm text-red-800 dark:text-red-200">
            {{ generalError }}
          </p>
        </div>
      </div>
    </div>

    <!-- Navigation Buttons -->
    <div class="flex items-center justify-between pt-4">
      <button
        v-if="currentStep > 1" type="button"
        class="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        @click="prevStep"
      >
        <Icon name="heroicons:arrow-left" class="h-4 w-4 mr-2" />
        Back
      </button>

      <div>
        <UButton
          v-if="currentStep < _totalSteps" type="button" variant="soft" size="lg" class="" :label="buttonText"
          trailing-icon="i-tabler-arrow-narrow-right-dashed" :disabled="!isStepValid" @click="nextStep"
        />

        <FormButton
          v-else type="submit" variant="primary" size="lg" :loading="isLoading" :disabled="!isStepValid"
          :text="buttonText" class="min-w-[120px]"
        />
      </div>
    </div>
  </form>
</template>
