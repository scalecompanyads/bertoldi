'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BertoldiLogo } from '@/components/shared/bertoldi-logo'

function destinoSeguro(next: string | null) {
  if (next && next.startsWith('/') && !next.startsWith('//')) return next
  return '/auth/definir-senha'
}

export function AuthCallbackHandler({
  code,
  tokenHash,
  type,
  next,
  error,
}: {
  code: string | null
  tokenHash: string | null
  type: string | null
  next: string | null
  error: string | null
}) {
  const [mensagem, setMensagem] = useState('Validando link...')

  useEffect(() => {
    const destino = destinoSeguro(next)

    if (error) {
      window.location.replace(`/?erro=${encodeURIComponent(error)}`)
      return
    }

    const supabase = createClient()

    async function concluir() {
      try {
        if (tokenHash && type) {
          setMensagem('Confirmando token...')
          const { error: otpError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as 'recovery' | 'invite' | 'signup' | 'email',
          })
          if (otpError) throw otpError
          window.location.replace(destino)
          return
        }

        if (code) {
          setMensagem('Estabelecendo sessão...')
          const { error: codeError } = await supabase.auth.exchangeCodeForSession(code)
          if (codeError) throw codeError
          window.location.replace(destino)
          return
        }

        // Fluxo legado: tokens no hash (#access_token=...) — só o browser enxerga
        if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
          setMensagem('Processando autenticação...')
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session && (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY')) {
              subscription.unsubscribe()
              window.location.replace(destino)
            }
          })
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            subscription.unsubscribe()
            window.location.replace(destino)
          }
          return
        }

        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          window.location.replace(destino)
          return
        }

        throw new Error('Link inválido ou expirado.')
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Link inválido ou expirado.'
        window.location.replace(`/?erro=${encodeURIComponent(msg)}`)
      }
    }

    void concluir()
  }, [code, tokenHash, type, next, error])

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 bg-muted/30">
      <BertoldiLogo size="lg" />
      <p className="text-sm text-muted-foreground">{mensagem}</p>
    </main>
  )
}
