export default defineNuxtPlugin(() => {
  // Initialize theme on app start
  function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
    const savedCompactMode = localStorage.getItem('compactMode') === 'true'
    const savedReducedMotion = localStorage.getItem('reducedMotion') === 'true'

    const theme = savedTheme || 'system'

    applyTheme(theme)

    if (savedCompactMode) {
      document.documentElement.classList.add('compact')
    }

    if (savedReducedMotion) {
      document.documentElement.classList.add('reduce-motion')
    }
  }

  function applyTheme(theme: 'light' | 'dark' | 'system') {
    const html = document.documentElement

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      html.classList.toggle('dark', systemTheme === 'dark')
    }
    else {
      html.classList.toggle('dark', theme === 'dark')
    }
  }

  // Listen for system theme changes
  function setupSystemThemeListener() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    mediaQuery.addEventListener('change', (_e) => {
      const currentTheme = localStorage.getItem('theme')
      if (currentTheme === 'system' || !currentTheme) {
        applyTheme('system')
      }
    })
  }

  // Initialize on mount
  onMounted(() => {
    initializeTheme()
    setupSystemThemeListener()
  })

  // Provide global theme utilities
  return {
    provide: {
      theme: {
        apply: applyTheme,
        initialize: initializeTheme,
      },
    },
  }
})
