'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DefinirSenhaForm } from './definir-senha-form'
import { BertoldiLogo } from '@/components/shared/bertoldi-logo'

export function DefinirSenhaGate() {
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    async function verificar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setPronto(true)
        return
      }

      // Aguarda cookies propagarem após redirect do callback
      await new Promise((r) => setTimeout(r, 400))
      const { data: { user: retry } } = await supabase.auth.getUser()
      if (retry) {
        setPronto(true)
        return
      }

      window.location.replace(
        `/?erro=${encodeURIComponent('Link inválido ou expirado. Solicite um novo e-mail de redefinição.')}`
      )
    }

    void verificar()
  }, [])

  return (
    <main className="flex min-h-svh flex-col items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <BertoldiLogo size="lg" />
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold tracking-tight">Defina sua senha</h1>
            <p className="text-sm text-muted-foreground">
              {pronto
                ? 'Escolha uma senha segura para acessar a plataforma'
                : 'Validando link de redefinição...'}
            </p>
          </div>
        </div>
        {pronto && (
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <DefinirSenhaForm />
          </div>
        )}
      </div>
    </main>
  )
}
