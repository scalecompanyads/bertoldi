import { LoginForm } from './login-form'
import { BertoldiLogo } from '@/components/shared/bertoldi-logo'

export const metadata = { title: 'Entrar — Bertoldi Advocacia' }

export default function LoginPage() {
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
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
