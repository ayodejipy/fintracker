<script setup lang="ts">
import type { CreateCustomCategoryInput } from '~/types'
import { useCustomCategories } from '~/composables/useCustomCategories'

interface Props {
  type: 'income' | 'expense'
}

interface Emits {
  close: []
  saved: [categoryName: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Composables
const { createCategory } = useCustomCategories()
const toast = useToast()

// Form state
const state = ref<CreateCustomCategoryInput>({
  name: '',
  type: props.type,
  icon: '',
  color: '#3B82F6',
  description: '',
})

const isSubmitting = ref(false)
const error = ref('')

// Color presets
const colorPresets = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Orange', value: '#F97316' },
]

function validateForm(): boolean {
  error.value = ''

  if (!state.value.name.trim()) {
    error.value = 'Category name is required'
    return false
  }

  if (state.value.name.trim().length < 2) {
    error.value = 'Category name must be at least 2 characters'
    return false
  }

  if (state.value.name.trim().length > 50) {
    error.value = 'Category name is too long (max 50 characters)'
    return false
  }

  return true
}

async function handleSubmit() {
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true
  error.value = ''

  try {
    const result = await createCategory({
      name: state.value.name.trim(),
      type: state.value.type,
      icon: state.value.icon || undefined,
      color: state.value.color || undefined,
      description: state.value.description?.trim() || undefined,
    })

    if (result.success && result.category) {
      toast.add({
        title: 'Success',
        description: `Category "${result.category.name}" created successfully`,
        color: 'success',
      })

      // Emit the category value (not name) since transactions use the value field
      emit('saved', result.category.value)
      emit('close')
    }
    else {
      error.value = result.error || 'Failed to create category'
    }
  }
  catch (err: any) {
    error.value = err.message || 'Failed to create category'
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UModal :open="true" @close="$emit('close')">
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="size-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm"
        >
          <UIcon name="i-heroicons-plus" class="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Add Custom Category
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Create a new {{ type }} category
          </p>
        </div>
      </div>
    </template>

    <template #body>
      <UForm :state="state" class="space-y-5" @submit="handleSubmit">
        <!-- Error message -->
        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          :title="error"
          :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'error', variant: 'link' }"
          @close="error = ''"
        />

        <!-- Category Name -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Category Name <span class="text-red-500">*</span>
          </label>
          <UInput
            v-model="state.name"
            placeholder="e.g., Entertainment, Medical, Subscriptions"
            size="lg"
            icon="i-heroicons-tag"
            maxlength="50"
          />
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Choose a descriptive name for your category
          </p>
        </div>

        <!-- Icon Selection -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Icon (Optional)
          </label>
          <CategoryIconPicker v-model="state.icon" />
        </div>

        <!-- Color Selection -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Color
          </label>
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="preset in colorPresets"
              :key="preset.value"
              type="button"
              :title="preset.name"
              class="w-10 h-10 rounded-lg border-2 transition-all hover:scale-110"
              :class="{
                'border-gray-900 dark:border-white ring-2 ring-offset-2 ring-gray-900 dark:ring-white': state.color === preset.value,
                'border-gray-300 dark:border-gray-600': state.color !== preset.value,
              }"
              :style="{ backgroundColor: preset.value }"
              @click="state.color = preset.value"
            />
          </div>
        </div>

        <!-- Description -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description (Optional)
          </label>
          <UTextarea
            v-model="state.description"
            placeholder="Add notes about this category..."
            :rows="2"
            size="lg"
            maxlength="255"
          />
        </div>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          color="neutral"
          variant="ghost"
          @click="$emit('close')"
        >
          Cancel
        </UButton>
        <UButton
          color="primary"
          :loading="isSubmitting"
          :disabled="!state.name.trim()"
          @click="handleSubmit"
        >
          {{ isSubmitting ? 'Creating...' : 'Create Category' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
