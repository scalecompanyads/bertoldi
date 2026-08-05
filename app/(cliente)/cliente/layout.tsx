import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClienteNav } from '@/components/cliente/cliente-nav'
import { BertoldiLogo } from '@/components/shared/bertoldi-logo'

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

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

  const { count: comunicadosNaoLidos } = cliente
    ? await supabase
        .from('comunicado_destinatarios')
        .select('*', { count: 'exact', head: true })
        .eq('cliente_id', cliente.id)
        .is('lido_em', null)
    : { count: 0 }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Ir para o conteúdo
      </a>
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <BertoldiLogo href="/cliente" size="sm" />
          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
            Olá, <span className="font-medium text-foreground">{cliente?.nome ?? usuario?.nome ?? ''}</span>
          </span>
        </div>
      </header>

      <main id="conteudo-principal" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24">
        {children}
      </main>

      <ClienteNav comunicadosNaoLidos={comunicadosNaoLidos ?? 0} />
    </div>
  )
}
