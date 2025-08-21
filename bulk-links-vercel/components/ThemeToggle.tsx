'use client'

import { useTheme } from './ThemeProvider'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'system') {
      setTheme('light')
    } else if (theme === 'light') {
      setTheme('dark')
    } else {
      setTheme('system')
    }
  }

  const getIcon = () => {
    if (theme === 'system') {
      return '🌓' // System (auto)
    } else if (theme === 'light') {
      return '☀️' // Light mode
    } else {
      return '🌙' // Dark mode
    }
  }

  const getLabel = () => {
    if (theme === 'system') {
      return `Auto (${resolvedTheme})`
    } else if (theme === 'light') {
      return 'Light'
    } else {
      return 'Dark'
    }
  }

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[color:var(--card)] border border-[color:var(--border)] hover:bg-[color:var(--hover)] transition-colors text-sm"
      title={`Current: ${getLabel()}. Click to cycle through themes.`}
    >
      <span className="text-lg">{getIcon()}</span>
      <span className="hidden sm:inline">{getLabel()}</span>
    </button>
  )
}
