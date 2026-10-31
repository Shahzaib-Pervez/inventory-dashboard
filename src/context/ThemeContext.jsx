/* oxlint-disable react/only-export-components -- context, provider and hook intentionally share this file */
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react'
import useLocalStorage from '../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../utils/inventory'

/**
 * ThemeContext exposes the current colour scheme and a toggle function to
 * every component in the tree - no prop-drilling required.
 * Class components can read it through `static contextType = ThemeContext`.
 */
export const ThemeContext = createContext({
  theme: 'dark',
  toggleTheme: () => {},
})

function getPreferredTheme() {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
    return 'light'
  }
  return 'dark'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useLocalStorage(STORAGE_KEYS.theme, getPreferredTheme)

  // Reflect the theme on <html> so CSS custom properties can switch palettes.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0b0d17' : '#f4f5fb')
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [setTheme])

  // Memoised so consumers only re-render when the theme actually changes.
  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/** Convenience hook wrapping useContext(ThemeContext). */
export function useTheme() {
  return useContext(ThemeContext)
}
