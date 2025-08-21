'use client'

import { ReactNode } from 'react'
import { Footer } from './Footer'
import { ThemeToggle } from './ThemeToggle'

interface ProtectedLayoutProps {
  children: ReactNode
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--bg)]">
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
      <ThemeToggle />
    </div>
  )
}
