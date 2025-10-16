<script setup lang="ts">
const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// Popular icon options organized by category
const iconOptions = [
  // Finance & Money
  { icon: '💰', label: 'Money Bag', category: 'Finance' },
  { icon: '💵', label: 'Dollar', category: 'Finance' },
  { icon: '💳', label: 'Credit Card', category: 'Finance' },
  { icon: '💸', label: 'Money with Wings', category: 'Finance' },
  { icon: '🏦', label: 'Bank', category: 'Finance' },
  { icon: '💼', label: 'Briefcase', category: 'Finance' },
  { icon: '📊', label: 'Chart', category: 'Finance' },

  // Food & Dining
  { icon: '🍕', label: 'Pizza', category: 'Food' },
  { icon: '🍔', label: 'Burger', category: 'Food' },
  { icon: '🍜', label: 'Noodles', category: 'Food' },
  { icon: '☕', label: 'Coffee', category: 'Food' },
  { icon: '🍱', label: 'Bento', category: 'Food' },
  { icon: '🥗', label: 'Salad', category: 'Food' },
  { icon: '🛒', label: 'Shopping Cart', category: 'Food' },

  // Transport
  { icon: '🚗', label: 'Car', category: 'Transport' },
  { icon: '🚕', label: 'Taxi', category: 'Transport' },
  { icon: '🚌', label: 'Bus', category: 'Transport' },
  { icon: '✈️', label: 'Airplane', category: 'Transport' },
  { icon: '⛽', label: 'Fuel', category: 'Transport' },
  { icon: '🚴', label: 'Bicycle', category: 'Transport' },

  // Home & Utilities
  { icon: '🏠', label: 'House', category: 'Home' },
  { icon: '🔌', label: 'Electricity', category: 'Home' },
  { icon: '💡', label: 'Light Bulb', category: 'Home' },
  { icon: '🚰', label: 'Water', category: 'Home' },
  { icon: '🔥', label: 'Fire', category: 'Home' },
  { icon: '🛋️', label: 'Furniture', category: 'Home' },

  // Entertainment
  { icon: '🎮', label: 'Gaming', category: 'Entertainment' },
  { icon: '🎬', label: 'Movies', category: 'Entertainment' },
  { icon: '🎵', label: 'Music', category: 'Entertainment' },
  { icon: '📺', label: 'TV', category: 'Entertainment' },
  { icon: '🎨', label: 'Art', category: 'Entertainment' },
  { icon: '🎪', label: 'Event', category: 'Entertainment' },

  // Health & Fitness
  { icon: '🏥', label: 'Hospital', category: 'Health' },
  { icon: '💊', label: 'Medicine', category: 'Health' },
  { icon: '🏋️', label: 'Gym', category: 'Health' },
  { icon: '🧘', label: 'Yoga', category: 'Health' },
  { icon: '🩺', label: 'Stethoscope', category: 'Health' },

  // Shopping
  { icon: '👕', label: 'Clothing', category: 'Shopping' },
  { icon: '👟', label: 'Shoes', category: 'Shopping' },
  { icon: '🛍️', label: 'Shopping Bags', category: 'Shopping' },
  { icon: '💄', label: 'Cosmetics', category: 'Shopping' },
  { icon: '📱', label: 'Phone', category: 'Shopping' },

  // Education
  { icon: '📚', label: 'Books', category: 'Education' },
  { icon: '🎓', label: 'Graduation', category: 'Education' },
  { icon: '✏️', label: 'Pencil', category: 'Education' },
  { icon: '💻', label: 'Laptop', category: 'Education' },

  // Other
  { icon: '🎁', label: 'Gift', category: 'Other' },
  { icon: '🐾', label: 'Pet', category: 'Other' },
  { icon: '🌱', label: 'Plant', category: 'Other' },
  { icon: '📦', label: 'Package', category: 'Other' },
  { icon: '🔧', label: 'Tools', category: 'Other' },
  { icon: '❓', label: 'Question', category: 'Other' },
]

const selectedIcon = computed({
  get: () => props.modelValue || '',
  set: (value: string) => emit('update:modelValue', value),
})

const searchQuery = ref('')
const selectedCategory = ref<string>('All')

// Get unique categories
const categories = computed(() => {
  const cats = new Set(iconOptions.map(opt => opt.category))
  return ['All', ...Array.from(cats)]
})

// Filter icons based on search and category
const filteredIcons = computed(() => {
  let filtered = iconOptions

  if (selectedCategory.value !== 'All') {
    filtered = filtered.filter(opt => opt.category === selectedCategory.value)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(opt =>
      opt.label.toLowerCase().includes(query) || opt.category.toLowerCase().includes(query),
    )
  }

  return filtered
})

function selectIcon(icon: string) {
  selectedIcon.value = icon
}
</script>

<template>
  <div class="space-y-4">
    <!-- Search and Filter -->
    <div class="flex gap-3">
      <UInput
        v-model="searchQuery"
        placeholder="Search icons..."
        icon="i-heroicons-magnifying-glass"
        class="flex-1"
      />
      <USelect
        v-model="selectedCategory"
        :options="categories.map(c => ({ label: c, value: c }))"
        class="w-40"
      />
    </div>

    <!-- Icon Grid -->
    <div class="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
      <button
        v-for="option in filteredIcons"
        :key="option.icon"
        type="button"
        :title="option.label"
        class="flex items-center justify-center w-10 h-10 text-2xl rounded-lg transition-all hover:scale-110 hover:bg-gray-100 dark:hover:bg-gray-700"
        :class="{
          'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500': selectedIcon === option.icon,
          'bg-gray-50 dark:bg-gray-800': selectedIcon !== option.icon,
        }"
        @click="selectIcon(option.icon)"
      >
        {{ option.icon }}
      </button>
    </div>

    <!-- Selected Icon Preview -->
    <div v-if="selectedIcon" class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <span class="text-3xl">{{ selectedIcon }}</span>
      <div class="flex-1">
        <p class="text-sm font-medium text-gray-900 dark:text-white">Selected Icon</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ iconOptions.find(o => o.icon === selectedIcon)?.label }}
        </p>
      </div>
      <UButton
        color="neutral"
        variant="ghost"
        size="xs"
        icon="i-heroicons-x-mark"
        @click="selectedIcon = ''"
      >
        Clear
      </UButton>
    </div>
  </div>
</template>
