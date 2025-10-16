<script setup lang="ts">
const { modals, close } = useModal()

// Handle escape key to close modal
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && modals.value.length > 0) {
    const lastModal = modals.value[modals.value.length - 1]
    close(lastModal?.id)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <TransitionGroup name="modal-fade">
      <component
        :is="modal.component"
        v-for="modal in modals"
        :key="modal.id"
        v-bind="modal.props"
        @close="close(modal.id)"
        @confirm="(data: any) => {
          modal.onConfirm?.(data)
          close(modal.id)
        }"
      />
    </TransitionGroup>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
