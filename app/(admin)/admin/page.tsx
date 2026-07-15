import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Briefcase, CheckCircle2, Bell, ArrowRight, Activity, Clock } from 'lucide-react'
import { STATUS_PROCESSO_LABEL } from '@/lib/types'
import type { Cliente, Processo } from '@/lib/types'

const STATUS_COR: Record<string, string> = {
  triagem: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  em_analise: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  distribuido: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  em_andamento: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  concluido: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
}

type ProcessoRef = Pick<Processo, 'id' | 'tipo_servico' | 'cliente_id' | 'status_interno'> & {
  clientes: Pick<Cliente, 'id' | 'nome'> | null
}

type Movimentacao = {
  id: string
  processo_id: string
  verificado_em: string
  ultimo_andamento: string | null
  processos: ProcessoRef | null
}

type ProcessoParado = Pick<Processo, 'id' | 'tipo_servico' | 'cliente_id' | 'status_interno' | 'criado_em'> & {
  atualizado_em: string | null
  clientes: Pick<Cliente, 'id' | 'nome'> | null
}

function diasAtras(iso: string): string {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (dias === 0) return 'hoje'
  if (dias === 1) return 'há 1 dia'
  return `há ${dias} dias`
}

export default async function AdminPage() {
  const supabase = await createClient()

  const [
    { count: totalClientes },
    { count: totalAtivos },
    { count: totalConcluidos },
    { count: comunicadosNaoLidos },
    { data: movimentacoes },
    { data: parados },
  ] = await Promise.all([
    supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('arquivado', false),
    supabase.from('processos').select('*', { count: 'exact', head: true }).in('status_interno', ['em_analise', 'distribuido', 'em_andamento']),
    supabase.from('processos').select('*', { count: 'exact', head: true }).eq('status_interno', 'concluido'),
    supabase.from('comunicados').select('*', { count: 'exact', head: true }).eq('lido', false),
    supabase
      .from('verificacoes_datajud')
      .select('id, processo_id, verificado_em, ultimo_andamento, processos(id, tipo_servico, cliente_id, status_interno, clientes(id, nome))')
      .eq('houve_movimentacao', true)
      .order('verificado_em', { ascending: false })
      .limit(40),
    supabase
      .from('processos')
      .select('id, tipo_servico, cliente_id, status_interno, criado_em, atualizado_em, clientes(id, nome)')
      .in('status_interno', ['distribuido', 'em_andamento'])
      .order('atualizado_em', { ascending: true, nullsFirst: true })
      .limit(5),
  ])

  // Uma verificação nova é gravada a cada consulta ao tribunal, então o mesmo
  // processo pode ter várias linhas — mostramos só a mais recente de cada um.
  const vistos = new Set<string>()
  const movs = ((movimentacoes ?? []) as unknown as Movimentacao[])
    .filter((m) => {
      if (vistos.has(m.processo_id)) return false
      vistos.add(m.processo_id)
      return true
    })
    .slice(0, 8)
  const paradosList = (parados ?? []) as unknown as ProcessoParado[]

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Visão geral</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/admin/clientes" className="rounded-lg border p-4 hover:bg-accent transition-colors flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Users className="h-4 w-4 text-muted-foreground" />
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold">{totalClientes ?? 0}</p>
          <p className="text-xs text-muted-foreground">Clientes</p>
        </Link>

        <Link href="/admin/processos" className="rounded-lg border p-4 hover:bg-accent transition-colors flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold">{totalAtivos ?? 0}</p>
          <p className="text-xs text-muted-foreground">Processos ativos</p>
        </Link>

        <div className="rounded-lg border p-4 flex flex-col gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <p className="text-2xl font-bold">{totalConcluidos ?? 0}</p>
          <p className="text-xs text-muted-foreground">Concluídos</p>
        </div>

        <Link href="/admin/comunicados" className="rounded-lg border p-4 hover:bg-accent transition-colors flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold">{comunicadosNaoLidos ?? 0}</p>
          <p className="text-xs text-muted-foreground">Avisos não lidos</p>
        </Link>
      </div>

      {/* Novas movimentações — o que exige atenção hoje */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Novas movimentações</h2>
        </div>
        <div className="rounded-lg border divide-y">
          {movs.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">Nenhuma movimentação nova nos tribunais.</p>
          ) : (
            movs.map((m) => (
              <Link
                key={m.id}
                href={m.processos ? `/admin/clientes/${m.processos.cliente_id}/processos/${m.processo_id}` : '#'}
                className="flex items-start gap-3 px-4 py-3 hover:bg-accent transition-colors"
              >
                <div className="mt-1.5 h-2 w-2 rounded-full bg-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {m.processos?.tipo_servico ?? 'Processo'}
                    <span className="text-muted-foreground font-normal"> · {m.processos?.clientes?.nome}</span>
                  </p>
                  {m.ultimo_andamento && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{m.ultimo_andamento}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0 mt-0.5">{diasAtras(m.verificado_em)}</span>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Processos parados há mais tempo */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Sem atualização há mais tempo</h2>
        </div>
        <div className="rounded-lg border divide-y">
          {paradosList.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">Nenhum processo em andamento.</p>
          ) : (
            paradosList.map((p) => (
              <Link
                key={p.id}
                href={`/admin/clientes/${p.cliente_id}/processos/${p.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.tipo_servico}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{p.clientes?.nome}</p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_COR[p.status_interno] ?? ''}`}>
                    {STATUS_PROCESSO_LABEL[p.status_interno as keyof typeof STATUS_PROCESSO_LABEL]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    atualizado {diasAtras(p.atualizado_em ?? p.criado_em)}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
