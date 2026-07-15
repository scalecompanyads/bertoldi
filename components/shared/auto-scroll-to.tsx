'use client'

import { useEffect } from 'react'

export function AutoScrollTo({ targetId, delay = 300 }: { targetId: string; delay?: number }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      const el = document.getElementById(targetId)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, delay)
    return () => clearTimeout(timer)
  }, [targetId, delay])

  return null
}
