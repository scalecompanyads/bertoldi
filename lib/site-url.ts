/** URL base do app (Vercel / local). Usada em links de convite e recuperação de senha. */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'http://localhost:3000'
}

export function getAuthCallbackUrl(next: string): string {
  return `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`
}

/** Link de convite/recuperação no domínio do app (evita URL longa do Supabase no e-mail). */
export function buildAuthTokenLink(
  tokenHash: string,
  type: 'recovery' | 'invite' | 'signup',
  next = '/auth/definir-senha'
): string {
  const params = new URLSearchParams({
    token_hash: tokenHash,
    type,
    next,
  })
  return `${getSiteUrl()}/auth/callback?${params.toString()}`
}
