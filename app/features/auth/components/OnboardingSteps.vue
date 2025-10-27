<script setup lang="ts">
interface Step {
  number: number
  title: string
  description: string
  icon: string
  activeIcon?: string
}

interface Props {
  currentStep: number
  steps?: Step[]
}

const props = withDefaults(defineProps<Props>(), {
  steps: () => [
    {
      number: 1,
      title: 'Your details',
      description: 'Provide your name and email',
      icon: 'heroicons:user',
    },
    {
      number: 2,
      title: 'Income range',
      description: 'Select your monthly income',
      icon: 'heroicons:currency-dollar',
    },
    {
      number: 3,
      title: 'Secure your account',
      description: 'Create a strong password',
      icon: 'heroicons:lock-closed',
    },
  ],
})
</script>

<template>
  <div class="relative">
    <!-- Continuous connecting line background (connects all steps except the last one) -->
    <div
      v-if="steps.length > 1"
      class="absolute left-5 top-10 w-0.5 bg-gray-300 dark:bg-gray-600"
      :style="{ height: `${(steps.length - 1) * 120}px` }"
    />

    <!-- Steps -->
    <div
      v-for="(step, index) in steps"
      :key="step.number"
      class="relative flex items-start"
      :class="{ 'mb-12': index < steps.length - 1 }"
    >
      <div class="relative flex-shrink-0 mr-4 z-10">
        <!-- Step Circle -->
        <div
          class="w-10 h-10 rounded-md flex items-center justify-center transition-all duration-200"
          :class="currentStep >= step.number ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600'"
        >
          <!-- Checkmark for completed steps -->
          <Icon
            v-if="currentStep > step.number"
            name="heroicons:check"
            class="h-5 w-5 text-white"
          />
          <!-- Icon for current/upcoming steps -->
          <Icon
            v-else
            :name="step.icon"
            class="h-5 w-5"
            :class="currentStep >= step.number ? 'text-white' : 'text-gray-500 dark:text-gray-400'"
          />
        </div>

        <!-- Active line segment (only show if not the last step and step is completed) -->
        <div
          v-if="index < steps.length - 1 && currentStep > step.number"
          class="absolute left-1/2 top-10 w-0.5 h-12 -translate-x-1/2 bg-green-600 transition-all duration-200"
        />
      </div>

      <!-- Step Content -->
      <div class="pt-2">
        <h3
          class="text-sm font-semibold"
          :class="currentStep >= step.number ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'"
        >
          {{ step.title }}
        </h3>
        <p
          class="text-sm mt-1"
          :class="currentStep >= step.number ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'"
        >
          {{ step.description }}
        </p>
      </div>
    </div>
  </div>
</template>
