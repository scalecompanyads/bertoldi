import { createClient } from '@/lib/supabase/server'
import { TarefasBoard } from '@/components/admin/tarefas-board'
import type { Tarefa } from '@/lib/types'

export const metadata = { title: 'Minhas tarefas' }

export default async function TarefasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: tarefas }, { data: processos }] = await Promise.all([
    supabase
      .from('tarefas')
      .select('*, processo:processo_id(id, cliente_id, numero_cnj, tipo_servico, clientes(id, nome))')
      .eq('usuario_id', user!.id)
      .order('ordem', { ascending: true }),
    supabase
      .from('processos')
      .select('id, numero_cnj, tipo_servico, clientes(id, nome)')
      .order('criado_em', { ascending: false }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Minhas tarefas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Quadro pessoal — só você vê essas tarefas.
        </p>
      </div>
      <TarefasBoard
        tarefas={(tarefas ?? []) as unknown as Tarefa[]}
        processos={(processos ?? []) as never}
      />
    </div>
  )
}
