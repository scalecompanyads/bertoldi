import { LoginForm } from './login-form'
import { BertoldiLogo } from '@/components/shared/bertoldi-logo'

export const metadata = { title: 'Entrar — Bertoldi Advocacia' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>
}) {
  const { erro } = await searchParams

  return (
    <main className="flex min-h-svh flex-col items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <BertoldiLogo size="lg" priority />
          <h1 className="text-lg font-semibold tracking-tight">Entrar</h1>
          <p className="text-sm text-muted-foreground text-center">
            Clientes entram com CPF · equipe com e-mail
          </p>
        </div>
        {erro === 'supabase' && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
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
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            Sua conta existe no login, mas não há perfil vinculado na equipe. Peça a um administrador
            para convidar seu e-mail ou confira se as migrations do Supabase foram aplicadas.
          </div>
        )}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
