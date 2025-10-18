<script setup lang="ts">
interface Props {
  modelValue: string | number | undefined
  label?: string
  type?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  hint?: string
  icon?: string
  trailingIcon?: string
}

interface Emits {
  (e: 'update:modelValue', value: string | number | undefined): void
  (e: 'blur'): void
  (e: 'focus'): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  disabled: false,
})

const emit = defineEmits<Emits>()

const modelValue = computed({
  get: () => props.modelValue ?? '',
  set: value => emit('update:modelValue', value),
})

// Password visibility toggle
const showPassword = ref(false)
const isPasswordField = computed(() => props.type === 'password')

const inputType = computed(() => {
  if (isPasswordField.value && showPassword.value) {
    return 'text'
  }
  return props.type
})

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value
}

const computedIcon = computed(() => {
  if (props.type === 'email') {
    return 'i-heroicons-envelope'
  }
  if (props.type === 'password') {
    return 'i-heroicons-lock-closed'
  }
  return props.icon
})

const inputColor = computed(() => {
  return props.error ? 'error' : 'primary'
})
</script>

<template>
  <div class="space-y-2">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>

    <!-- Input with Nuxt UI -->
    <UInput
      v-model="modelValue"
      :type="inputType"
      :placeholder="placeholder"
      :disabled="disabled"
      :icon="computedIcon"
      size="lg"
      :color="inputColor"
      variant="outline"
      :ui="{
        base: [error
          ? 'ring-red-300 dark:ring-red-600 focus-within:ring-2 focus-within:ring-red-500 dark:focus-within:ring-red-400'
          : 'ring-gray-300 dark:ring-gray-600 hover:ring-gray-400 dark:hover:ring-gray-500 focus-within:ring-2 focus-within:ring-green-500 dark:focus-within:ring-green-400', 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-1 ring-inset transition-all duration-200 rounded-lg placeholder-gray-400 dark:placeholder-gray-500 text-base px-4 py-3'],
      }"
      class="w-full"
      @blur="emit('blur')"
      @focus="emit('focus')"
    >
      <!-- Password Toggle Button using trailing slot -->
      <template v-if="isPasswordField" #trailing>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors focus:outline-none"
          tabindex="-1"
          @click="togglePasswordVisibility"
        >
          <UIcon
            :name="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
            class="w-5 h-5"
          />
        </button>
      </template>
    </UInput>

    <!-- Error Message -->
    <div v-if="error" class="flex items-center gap-2 mt-2">
      <Icon name="heroicons:exclamation-circle" class="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
      <p class="text-sm text-red-600 dark:text-red-400">
        {{ error }}
      </p>
    </div>

    <!-- Hint -->
    <p v-if="hint && !error" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
      {{ hint }}
    </p>
  </div>
</template>
