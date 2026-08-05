/** Parâmetros de autenticação no fragmento (#) da URL — invisíveis ao servidor. */
export function parseAuthHash(): URLSearchParams | null {
  if (typeof window === 'undefined') return null
  const raw = window.location.hash.replace(/^#/, '')
  if (!raw || !raw.includes('access_token')) return null
  return new URLSearchParams(raw)
}

export async function setSessionFromAuthHash(
  supabase: ReturnType<typeof import('@/lib/supabase/client').createClient>
) {
  const hash = parseAuthHash()
  if (!hash) return { ok: false as const, reason: 'no-hash' as const }

  const access_token = hash.get('access_token')
  const refresh_token = hash.get('refresh_token')
  if (!access_token) return { ok: false as const, reason: 'no-token' as const }

  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token: refresh_token ?? '',
  })

  if (error) return { ok: false as const, reason: 'error' as const, error }
  return { ok: true as const }
}
