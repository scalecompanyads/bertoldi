'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { setSessionFromAuthHash } from '@/lib/supabase/auth-hash'
import { BertoldiLogo } from '@/components/shared/bertoldi-logo'

function destinoSeguro(next: string | null) {
  if (next && next.startsWith('/') && !next.startsWith('//')) return next
  return '/auth/definir-senha'
}

function falhar(msg: string) {
  window.location.replace(`/?erro=${encodeURIComponent(msg)}`)
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
      falhar(error)
      return
    }

    const supabase = createClient()
    let cancelado = false

    const timeout = window.setTimeout(() => {
      if (!cancelado) {
        falhar('O link demorou demais para validar. Solicite um novo e-mail de redefinição.')
      }
    }, 15000)

    async function concluir() {
      try {
        if (tokenHash && type) {
          setMensagem('Confirmando token...')
          const { error: otpError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as 'recovery' | 'invite' | 'signup' | 'email',
          })
          if (otpError) throw otpError
          if (!cancelado) window.location.replace(destino)
          return
        }

        if (code) {
          setMensagem('Estabelecendo sessão...')
          const { error: codeError } = await supabase.auth.exchangeCodeForSession(code)
          if (codeError) throw codeError
          if (!cancelado) window.location.replace(destino)
          return
        }

        if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
          setMensagem('Processando autenticação...')
          const resultado = await setSessionFromAuthHash(supabase)
          if (resultado.ok) {
            if (!cancelado) window.location.replace(destino)
            return
          }
          if (resultado.reason === 'error') throw resultado.error
        }

        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          if (!cancelado) window.location.replace(destino)
          return
        }

        throw new Error('Link inválido ou expirado.')
      } catch (err) {
        if (cancelado) return
        const msg = err instanceof Error ? err.message : 'Link inválido ou expirado.'
        falhar(msg)
      }
    }

    void concluir()

    return () => {
      cancelado = true
      window.clearTimeout(timeout)
    }
  }, [code, tokenHash, type, next, error])

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 bg-muted/30">
      <BertoldiLogo size="lg" />
      <p className="text-sm text-muted-foreground">{mensagem}</p>
    </main>
  )
}
