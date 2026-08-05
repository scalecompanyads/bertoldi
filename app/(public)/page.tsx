import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginForm } from '@/app/login/login-form'
import { BertoldiLogo } from '@/components/shared/bertoldi-logo'
import { BeamsBackground } from '@/components/ui/beams-background'

export const metadata = { title: 'Entrar — Bertoldi Advocacia' }

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('papel')
      .eq('id', user.id)
      .single()

    if (usuario?.papel === 'cliente') redirect('/cliente')
    if (usuario && usuario.papel !== 'cliente') redirect('/admin')
  }

  const { erro } = await searchParams

  return (
    <BeamsBackground intensity="medium">
      <main className="flex w-full flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center gap-3">
            <BertoldiLogo size="lg" priority />
            <h1 className="text-lg font-semibold tracking-tight text-white">Entrar</h1>
            <p className="text-sm text-white/50 text-center">
              Clientes entram com CPF · equipe com e-mail
            </p>
          </div>
          {erro === 'supabase' && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              Supabase não configurado na Vercel. Defina{' '}
              <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> e{' '}
              <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> (ou{' '}
              <code className="text-xs">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>) em
              Environment Variables e faça redeploy.
            </div>
          )}
          {erro === 'perfil' && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              Sua conta existe no login, mas não há perfil vinculado na equipe. Peça a um administrador
              para convidar seu e-mail ou confira se as migrations do Supabase foram aplicadas.
            </div>
          )}
          <div className="dark rounded-xl border border-white/10 bg-neutral-900/80 p-6 shadow-xl backdrop-blur-sm space-y-4">
            <LoginForm />
          </div>
        </div>
      </main>
    </BeamsBackground>
  )
}
