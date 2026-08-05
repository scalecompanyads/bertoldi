import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DefinirSenhaForm } from './definir-senha-form'
import { BertoldiLogo } from '@/components/shared/bertoldi-logo'

export const metadata = { title: 'Definir senha — Bertoldi Advocacia' }

export default async function DefinirSenhaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  return (
    <main className="flex min-h-svh flex-col items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <BertoldiLogo size="lg" />
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold tracking-tight">Defina sua senha</h1>
            <p className="text-sm text-muted-foreground">
              Escolha uma senha segura para acessar a plataforma
            </p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <DefinirSenhaForm />
        </div>
      </div>
    </main>
  )
}
