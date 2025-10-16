import { type Component, type Raw, defineAsyncComponent, markRaw, readonly, ref } from 'vue'

interface ModalConfig {
  component: Raw<Component>
  props?: Record<string, any>
  onClose?: () => void
  onConfirm?: (data?: any) => void
}

interface ModalInstance extends ModalConfig {
  id: string
}

const modals = ref<ModalInstance[]>([])
let modalIdCounter = 0

export function useModal() {
  /**
   * Open a modal with a component and props
   */
  function open(config: ModalConfig): string {
    const id = `modal-${++modalIdCounter}`

    const modal: ModalInstance = {
      id,
      component: markRaw(config.component),
      props: config.props || {},
      onClose: config.onClose,
      onConfirm: config.onConfirm,
    }

    modals.value.push(modal)
    return id
  }

  /**
   * Close a specific modal by ID
   */
  function close(id: string) {
    const index = modals.value.findIndex(m => m.id === id)
    if (index !== -1) {
      const modal = modals.value[index]
      if (modal) {
        modal.onClose?.()
      }
      modals.value.splice(index, 1)
    }
  }

  /**
   * Close the most recent modal
   */
  function closeLast() {
    const modal = modals.value[modals.value.length - 1]
    if (modal) {
      close(modal.id)
    }
  }

  /**
   * Close all modals
   */
  function closeAll() {
    modals.value.forEach(modal => modal.onClose?.())
    modals.value = []
  }

  /**
   * Confirm a modal (useful for confirmation dialogs)
   */
  function confirm(id: string, data?: any) {
    const modal = modals.value.find(m => m.id === id)
    if (modal) {
      modal.onConfirm?.(data)
      close(id)
    }
  }

  return {
    modals: readonly(modals),
    open,
    close,
    closeLast,
    closeAll,
    confirm,
  }
}

/**
 * Helper function to open a confirmation dialog
 */
export async function openConfirmation(config: {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  icon?: string
}): Promise<boolean> {
  return new Promise((resolve) => {
    const { open } = useModal()

    // Lazy load the ConfirmationModal component
    const ConfirmationModal = defineAsyncComponent(() =>
      import('~/components/ui/ConfirmationModal.vue')
    )

    open({
      component: ConfirmationModal,
      props: {
        title: config.title || 'Confirm Action',
        message: config.message || 'Are you sure?',
        confirmText: config.confirmText || 'Confirm',
        cancelText: config.cancelText || 'Cancel',
        type: config.type || 'danger',
        icon: config.icon || 'i-heroicons-exclamation-triangle',
      },
      onConfirm: () => resolve(true),
      onClose: () => resolve(false),
    })
  })
}

/**
 * Helper to open any custom modal
 */
export function openModal<T = any>(
  component: Component,
  props?: Record<string, any>,
): Promise<T | null> {
  return new Promise((resolve) => {
    const { open } = useModal()

    open({
      component: markRaw(component),
      props,
      onConfirm: (data) => resolve(data),
      onClose: () => resolve(null),
    })
  })
}
