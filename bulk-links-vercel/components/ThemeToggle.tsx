'use client'

import { useTheme } from './ThemeProvider'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const buttons = [
    {
      value: 'system' as const,
      icon: '🌓',
      label: 'Auto',
      title: `Auto (follows system: ${resolvedTheme})`
    },
    {
      value: 'light' as const,
      icon: '☀️',
      label: 'Light',
      title: 'Light mode'
    },
    {
      value: 'dark' as const,
      icon: '🌙',
      label: 'Dark',
      title: 'Dark mode'
    }
  ]

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex gap-1 p-1 bg-[color:var(--card)] border border-[color:var(--border)] rounded-xl shadow-lg backdrop-blur-sm">
        {buttons.map((button) => (
          <button
            key={button.value}
            onClick={() => setTheme(button.value)}
            className={`
              flex flex-col items-center gap-1 px-4 py-3 rounded-lg transition-all duration-200 text-xs font-medium
              ${theme === button.value 
                ? 'bg-blue-600 text-white shadow-md scale-105' 
                : 'hover:bg-[color:var(--hover)] text-[color:var(--muted)] hover:text-[color:var(--foreground)]'
              }
            `}
            title={button.title}
          >
            <span className="text-base">{button.icon}</span>
            <span>{button.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
