<script setup lang="ts">
import FormButton from '~/components/ui/FormButton.vue'
import FormInput from '~/components/ui/FormInput.vue'
import { useRegisterForm } from '../composables/useRegisterForm'

interface RegisterFormEmits {
  (e: 'success'): void
}

const emit = defineEmits<RegisterFormEmits>()

const {
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
  isLoading,
  generalError,
  isFormValid,

  // Actions
  submitForm,
} = useRegisterForm()

async function onSubmit() {
  await submitForm()
  emit('success')
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="onSubmit">
    <div>
      <FormInput
        v-model="name"
        v-bind="nameAttrs"
        label="Full Name"
        type="text"
        placeholder="Enter your full name"
        required
        :error="errors.name"
      />
    </div>

    <div>
      <FormInput
        v-model="email"
        v-bind="emailAttrs"
        label="Email Address"
        type="email"
        placeholder="Enter your email"
        required
        :error="errors.email"
      />
    </div>

    <div>
      <FormInput
        v-model="monthlyIncome"
        v-bind="monthlyIncomeAttrs"
        label="Monthly Income (₦)"
        type="number"
        placeholder="Enter your monthly income"
        required
        :error="errors.monthlyIncome"
        hint="This helps us provide better financial insights"
      />
    </div>

    <div>
      <FormInput
        v-model="password"
        v-bind="passwordAttrs"
        label="Password"
        type="password"
        placeholder="Create a password"
        required
        :error="errors.password"
        hint="Must be at least 6 characters"
      />
    </div>

    <div>
      <FormInput
        v-model="confirmPassword"
        v-bind="confirmPasswordAttrs"
        label="Confirm Password"
        type="password"
        placeholder="Confirm your password"
        required
        :error="errors.confirmPassword"
      />
    </div>

    <div v-if="generalError" class="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
      <div class="flex">
        <Icon name="heroicons:exclamation-triangle" class="h-5 w-5 text-red-400" />
        <div class="ml-3">
          <p class="text-sm text-red-800 dark:text-red-200">
            {{ generalError }}
          </p>
        </div>
      </div>
    </div>

    <FormButton
      type="submit"
      variant="primary"
      size="lg"
      :loading="isLoading"
      :disabled="!isFormValid"
      full-width
      text="Continue"
    />
  </form>
</template>
