import Link from 'next/link'
import { AlarmClock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

// Banner exibido em todas as páginas do painel quando o usuário tem
// tarefas não concluídas vencendo nas próximas 2 horas (ou já vencidas).
export async function TarefasAlerta() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const em2h = new Date(Date.now() + 2 * 3_600_000).toISOString()
  const { data: urgentes } = await supabase
    .from('tarefas')
    .select('id, titulo, prazo')
    .eq('usuario_id', user.id)
    .neq('status', 'concluido')
    .not('prazo', 'is', null)
    .lte('prazo', em2h)
    .order('prazo', { ascending: true })
    .limit(5)

  if (!urgentes || urgentes.length === 0) return null

  const vencidas = urgentes.filter((t) => new Date(t.prazo!).getTime() < Date.now())
  const proximas = urgentes.length - vencidas.length

  const partes: string[] = []
  if (vencidas.length > 0) partes.push(`${vencidas.length} com prazo vencido`)
  if (proximas > 0) partes.push(`${proximas} vencendo nas próximas 2h`)

  return (
    <Link
      href="/admin/tarefas"
      className="flex items-center gap-2.5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-700 dark:text-red-300 hover:bg-red-500/20 transition-colors"
    >
      <AlarmClock className="h-4 w-4 shrink-0 animate-pulse" />
      <span>
        <strong>Atenção aos prazos:</strong> {partes.join(' e ')} —{' '}
        <span className="underline underline-offset-2">ver tarefas</span>
      </span>
    </Link>
  )
}
