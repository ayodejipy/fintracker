import { readonly, ref } from 'vue'

const isCollapsed = ref(false)
const isMobile = ref(false)

export function useSidebar() {
  const toggleSidebar = () => {
    isCollapsed.value = !isCollapsed.value
  }

  const closeSidebar = () => {
    isCollapsed.value = true
  }

  const openSidebar = () => {
    isCollapsed.value = false
  }

  const setMobile = (mobile: boolean) => {
    isMobile.value = mobile
    // Auto-collapse on mobile
    if (mobile) {
      isCollapsed.value = true
    }
  }

  return {
    isCollapsed: readonly(isCollapsed),
    isMobile: readonly(isMobile),
    toggleSidebar,
    closeSidebar,
    openSidebar,
    setMobile,
  }
}
