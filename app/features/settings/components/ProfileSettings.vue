<script setup lang="ts">
import type { ProfileSettingsInput } from '../schemas'
import type { AuthUser } from '~/types'

interface Props {
  user: AuthUser
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  save: [data: ProfileSettingsInput]
}>()

// Form state
const formData = ref<ProfileSettingsInput>({
  name: props.user.name,
  email: props.user.email,
  avatar: '', // AuthUser doesn't have avatar field
})

const errors = ref<Record<string, string>>({})
const avatarInput = ref<HTMLInputElement>()
const isDragOver = ref(false)

function handleAvatarChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    processAvatarFile(file)
  }
}

function processAvatarFile(file: File) {
  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Image size must be less than 5MB',
      color: 'error',
    })
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    formData.value.avatar = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

function selectAvatar() {
  avatarInput.value?.click()
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = false

  const files = event.dataTransfer?.files
  if (files && files[0]) {
    processAvatarFile(files[0])
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = true
}

function handleDragLeave() {
  isDragOver.value = false
}

async function onSubmit() {
  errors.value = {}

  // Basic validation
  if (!formData.value.name.trim()) {
    errors.value.name = 'Name is required'
    return
  }

  if (!formData.value.email.trim()) {
    errors.value.email = 'Email is required'
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/u
  if (!emailRegex.test(formData.value.email)) {
    errors.value.email = 'Please enter a valid email address'
    return
  }

  emit('save', formData.value)
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors">
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
        <UIcon name="i-heroicons-user" class="w-5 h-5 text-white" />
      </div>
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Profile Information
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Update your personal information and profile picture
        </p>
      </div>
    </div>

    <form class="space-y-6" @submit.prevent="onSubmit">
      <!-- Avatar Upload -->
      <div class="space-y-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Profile Picture
        </label>

        <div class="flex items-start gap-6">
          <!-- Current Avatar -->
          <div class="relative group">
            <div class="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600">
              <img
                v-if="formData.avatar"
                :src="formData.avatar"
                alt="Profile avatar"
                class="w-full h-full object-cover"
              >
              <div
                v-else
                class="w-full h-full flex items-center justify-center"
              >
                <UIcon name="i-heroicons-user" class="w-8 h-8 text-gray-400" />
              </div>
            </div>

            <!-- Edit Overlay -->
            <button
              type="button"
              class="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              @click="selectAvatar"
            >
              <UIcon name="i-heroicons-camera" class="w-5 h-5 text-white" />
            </button>
          </div>

          <!-- Upload Area -->
          <div class="flex-1">
            <div
              class="border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer"
              :class="[
                isDragOver
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
              ]"
              @click="selectAvatar"
              @drop="handleDrop"
              @dragover="handleDragOver"
              @dragleave="handleDragLeave"
            >
              <UIcon name="i-heroicons-cloud-arrow-up" class="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span class="font-medium text-blue-600 dark:text-blue-400">Click to upload</span>
                or drag and drop
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-500">
                PNG, JPG up to 5MB
              </p>
            </div>
          </div>
        </div>

        <input
          ref="avatarInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleAvatarChange"
        >
      </div>

      <!-- Name -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Full Name <span class="text-red-500">*</span>
        </label>
        <UInput
          v-model="formData.name"
          placeholder="Enter your full name"
          icon="i-heroicons-user"
          size="xl"
          class="transition-colors"
          :ui="{ base: 'text-base' }"
          @input="() => delete errors.name"
        />
        <p v-if="errors.name" class="text-xs text-red-600 dark:text-red-400">
          {{ errors.name }}
        </p>
        <p v-else class="text-xs text-gray-500 dark:text-gray-400">
          Your full name as it appears on official documents
        </p>
      </div>

      <!-- Email -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email Address <span class="text-red-500">*</span>
        </label>
        <UInput
          v-model="formData.email"
          type="email"
          placeholder="Enter your email address"
          icon="i-heroicons-envelope"
          size="xl"
          class="transition-colors"
          :ui="{ base: 'text-base' }"
          @input="() => delete errors.email"
        />
        <p v-if="errors.email" class="text-xs text-red-600 dark:text-red-400">
          {{ errors.email }}
        </p>
        <p v-else class="text-xs text-gray-500 dark:text-gray-400">
          We'll use this email for important account notifications
        </p>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <UButton
          type="submit"
          :loading="loading"
          :disabled="loading"
          size="lg"
          class="px-8"
        >
          <UIcon name="i-heroicons-check" class="w-4 h-4 mr-2" />
          Save Changes
        </UButton>
      </div>
    </form>
  </div>
</template>
