<script setup lang="ts">
const { refreshUser, isAuthenticated } = useAuth()
const route = useRoute()

// Track if we're checking auth
const isCheckingAuth = ref(true)

onMounted(async () => {
  // Ensure auth is fully loaded before showing content
  if (isAuthenticated) {
    await refreshUser()
  }
  // Small delay to ensure middleware has run
  await nextTick()
  isCheckingAuth.value = false
})

// Show loader only on protected routes during initial auth check
const showLoader = computed(() => {
  const isProtectedRoute = !route.path.startsWith('/auth')
  // Show loader while checking auth on protected routes
  return isCheckingAuth.value && isProtectedRoute
})
</script>

<template>
  <!-- Loading overlay to prevent flash -->
  <div
    v-if="showLoader"
    class="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center"
  >
    <div class="flex flex-col items-center gap-4">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      <p class="text-gray-600 dark:text-gray-400">
        Loading...
      </p>
    </div>
  </div>

  <!-- Main app content -->
  <NuxtLayout>
    <UApp>
      <NuxtRouteAnnouncer />
      <NuxtPage />
    </UApp>
  </NuxtLayout>
</template>
