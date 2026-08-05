'use client'

import { useEffect } from 'react'

/** Se o Supabase cair na home com tokens no hash, repassa para /auth/callback. */
export function HashSessionBootstrap() {
  useEffect(() => {
    const hash = window.location.hash
    if (!hash.includes('access_token')) return

    const params = new URLSearchParams(window.location.search)
    const next = params.get('next') ?? '/auth/definir-senha'
    const destino = `/auth/callback?next=${encodeURIComponent(next)}${hash}`
    window.location.replace(destino)
  }, [])

  return null
}
