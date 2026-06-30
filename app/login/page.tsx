import { LoginForm } from './login-form'

export const metadata = { title: 'Entrar — Bertoldi Advocacia' }

export default function LoginPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Bertoldi Advocacia</h1>
          <p className="text-sm text-muted-foreground">Entre com sua conta para continuar</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
