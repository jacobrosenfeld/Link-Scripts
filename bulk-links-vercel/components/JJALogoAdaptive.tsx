'use client'

import { useTheme } from './ThemeProvider'
import { JJALogo } from './JJALogo'
import { JJALogoWhite } from './JJALogoWhite'

interface JJALogoAdaptiveProps {
  className?: string
}

export function JJALogoAdaptive({ className = "h-8 w-auto" }: JJALogoAdaptiveProps) {
  const { resolvedTheme } = useTheme()

  // Use white logo for dark backgrounds, dark logo for light backgrounds
  if (resolvedTheme === 'dark') {
    return <JJALogoWhite className={className} />
  } else {
    return <JJALogo className={className} />
  }
}
