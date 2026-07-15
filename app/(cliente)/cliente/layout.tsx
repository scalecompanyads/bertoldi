import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClienteNav } from '@/components/cliente/cliente-nav'

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('papel, nome')
    .eq('id', user.id)
    .single()

  // Equipe não deve cair na área do cliente
  if (usuario && usuario.papel !== 'cliente') redirect('/admin')

  const { data: cliente } = await supabase
    .from('clientes')
    .select('id, nome')
    .eq('usuario_id', user.id)
    .single()

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold tracking-tight">Bertoldi Advocacia</span>
          </div>
          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
            Olá, <span className="font-medium text-foreground">{cliente?.nome ?? usuario?.nome ?? ''}</span>
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24">
        {children}
      </main>

      <ClienteNav />
    </div>
  )
}
