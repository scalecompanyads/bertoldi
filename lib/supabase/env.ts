/** URL e chave pública do Supabase — usadas no browser, middleware e Server Components. */
export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL não configurada. Defina na Vercel (Settings → Environment Variables).'
    )
  }
  return url
}

/** Aceita anon (eyJ…) ou publishable (sb_publishable_…). */
export function getSupabaseAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()

  if (!key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY não configurada (ou use NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).'
    )
  }
  return key
}

export function supabaseConfigurado(): boolean {
  try {
    getSupabaseUrl()
    getSupabaseAnonKey()
    return true
  } catch {
    return false
  }
}
