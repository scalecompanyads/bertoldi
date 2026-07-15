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
