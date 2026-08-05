import { AuthCallbackHandler } from './auth-callback-handler'

export const metadata = { title: 'Autenticando — Bertoldi Advocacia' }

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{
    code?: string
    token_hash?: string
    type?: string
    next?: string
    error?: string
    error_description?: string
  }>
}) {
  const params = await searchParams

  return (
    <AuthCallbackHandler
      code={params.code ?? null}
      tokenHash={params.token_hash ?? null}
      type={params.type ?? null}
      next={params.next ?? null}
      error={params.error_description ?? params.error ?? null}
    />
  )
}
