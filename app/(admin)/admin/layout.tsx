import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/shared/admin-sidebar'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { TarefasAlerta } from '@/components/admin/tarefas-alerta'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('papel, nome')
    .eq('id', user.id)
    .single()

  if (!usuario || usuario.papel === 'cliente') redirect('/cliente')

  return (
    <div className="flex h-svh overflow-hidden">
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Ir para o conteúdo
      </a>
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-end border-b px-4 shrink-0 gap-3">
          <span className="text-sm text-muted-foreground">
            Olá, <span className="font-medium text-foreground">{usuario.nome}</span>
          </span>
          <ThemeToggle />
        </header>
        <main id="conteudo-principal" className="flex-1 overflow-y-auto p-6 space-y-4">
          <TarefasAlerta />
          {children}
        </main>
      </div>
    </div>
  )
}
