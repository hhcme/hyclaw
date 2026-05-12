import { create } from 'zustand'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  resolved: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(resolved: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initial: Theme = (localStorage.getItem('theme') as Theme) || 'dark'
  const resolved = initial === 'system' ? getSystemTheme() : initial
  applyTheme(resolved)

  // Listen for system theme changes
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (get().theme === 'system') {
        const newResolved = getSystemTheme()
        applyTheme(newResolved)
        set({ resolved: newResolved })
      }
    })
  }

  return {
    theme: initial,
    resolved,
    setTheme: (theme: Theme) => {
      localStorage.setItem('theme', theme)
      const resolved = theme === 'system' ? getSystemTheme() : theme
      applyTheme(resolved)
      set({ theme, resolved })
    }
  }
})
