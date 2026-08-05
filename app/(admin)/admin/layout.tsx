import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/shared/admin-sidebar'
import { AdminMobileNav } from '@/components/admin/admin-mobile-nav'
import { AdminHeaderUser } from '@/components/admin/admin-header-user'
import { TarefasAlerta } from '@/components/admin/tarefas-alerta'
import { getAdminNavBadges } from '@/lib/admin/nav-badges'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: usuario, error: usuarioError } = await supabase
    .from('usuarios')
    .select('papel, nome')
    .eq('id', user.id)
    .single()

  if (usuarioError || !usuario) redirect('/?erro=perfil')
  if (usuario.papel === 'cliente') redirect('/cliente')

  const badges = await getAdminNavBadges(user.id)

  return (
    <div className="flex h-svh overflow-hidden">
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Ir para o conteúdo
      </a>
      <div className="hidden md:contents">
        <AdminSidebar badges={badges} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center border-b px-4 shrink-0 gap-3">
          <AdminMobileNav badges={badges} />
          <div className="flex-1" />
          <AdminHeaderUser
            userId={user.id}
            nome={usuario.nome}
          />
        </header>
        <main id="conteudo-principal" className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <TarefasAlerta />
          {children}
        </main>
      </div>
    </div>
  )
}
