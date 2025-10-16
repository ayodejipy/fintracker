<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
})
</script>

<template>
  <SavingsProjection />
</template>
