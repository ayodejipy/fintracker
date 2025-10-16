<script setup lang="ts">
import { useNotificationsPage } from '~/composables/useNotificationsPage'
import NotificationsFilters from '~/features/notifications/NotificationsFilters.vue'
import NotificationsHeader from '~/features/notifications/NotificationsHeader.vue'
import NotificationsList from '~/features/notifications/NotificationsList.vue'
import NotificationsStats from '~/features/notifications/NotificationsStats.vue'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
})

const {
  notifications,
  unreadCount,
  loading,
  notificationsByType,
  selectedType,
  showUnreadOnly,
  handleMarkAsRead,
  handleMarkAllAsRead,
  handleRefresh,
} = useNotificationsPage()
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <NotificationsHeader
      :unread-count="unreadCount" :loading="loading" @mark-all-as-read="handleMarkAllAsRead"
      @refresh="handleRefresh"
    />

    <!-- Filters -->
    <NotificationsFilters v-model:selected-type="selectedType" v-model:show-unread-only="showUnreadOnly" />

    <!-- Notifications List -->
    <NotificationsList
      :notifications="notifications" :loading="loading" :selected-type="selectedType"
      :show-unread-only="showUnreadOnly" @mark-as-read="handleMarkAsRead"
    />

    <!-- Quick Stats -->
    <NotificationsStats :notifications-by-type="notificationsByType" />
  </div>
</template>
