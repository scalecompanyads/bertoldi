import { LoginForm } from './login-form'
import { Scale } from 'lucide-react'

export const metadata = { title: 'Entrar — Bertoldi Advocacia' }

export default function LoginPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Scale className="h-6 w-6" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold tracking-tight">Bertoldi Advocacia</h1>
            <p className="text-sm text-muted-foreground">Acesse sua conta para continuar</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
