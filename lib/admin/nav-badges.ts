import { createClient } from '@/lib/supabase/server'

/** Indica itens do menu admin que precisam de bolinha de notificação. */
export async function getAdminNavBadges(userId: string): Promise<Record<string, boolean>> {
  const supabase = await createClient()
  const agora = new Date().toISOString()

  const [{ count: intimacoesNaoLidas }, { count: tarefasVencidas }] = await Promise.all([
    supabase
      .from('intimacoes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'nao_lida'),
    supabase
      .from('tarefas')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', userId)
      .neq('status', 'concluido')
      .not('prazo', 'is', null)
      .lt('prazo', agora),
  ])

  const badges: Record<string, boolean> = {}
  const temIntimacoes = (intimacoesNaoLidas ?? 0) > 0
  const temTarefasVencidas = (tarefasVencidas ?? 0) > 0

  if (temIntimacoes) {
    badges['/admin/intimacoes'] = true
  }
  if (temTarefasVencidas) {
    badges['/admin/tarefas'] = true
  }
  if (temIntimacoes || temTarefasVencidas) {
    badges['/admin'] = true
  }

  return badges
}
