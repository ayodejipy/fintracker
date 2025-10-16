<script setup lang="ts">
import type { UserSession } from '@/types'
import { useAuth } from '#imports'

const { user, logout } = useAuth()

const menuItems = computed(() => [
  [{
    label: (user.value as UserSession)?.user?.email || '',
    slot: 'account',
    disabled: true,
  }],
  [{
    label: 'Profile Settings',
    icon: 'i-heroicons-user-circle',
    click: () => navigateTo('/profile'),
  }, {
    label: 'Sign out',
    icon: 'i-heroicons-arrow-right-on-rectangle',
    click: logout,
  }],
])
</script>

<template>
  <div class="relative">
    <UDropdown :items="menuItems" :popper="{ placement: 'bottom-end' }">
      <UButton
        color="neutral" :label="(user as UserSession)?.user?.name || 'User'" trailing-icon="i-heroicons-chevron-down-20-solid"
        class="flex items-center space-x-2"
      />
    </UDropdown>
  </div>
</template>
