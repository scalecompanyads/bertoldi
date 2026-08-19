import { createClient } from '@/lib/supabase/server'
import { RecepcaoForm } from '@/components/admin/recepcao-form'
import { SaidaBtn } from '@/components/admin/saida-btn'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, Clock } from 'lucide-react'

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function duracao(chegada: string, saida: string | null): string {
  const fim = saida ? new Date(saida) : new Date()
  const mins = Math.floor((fim.getTime() - new Date(chegada).getTime()) / 60000)
  if (mins < 60) return `${mins}min`
  return `${Math.floor(mins / 60)}h${mins % 60 > 0 ? ` ${mins % 60}min` : ''}`
}

export default async function RecepcaoPage() {
  const supabase = await createClient()

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const hojeFim = new Date()
  hojeFim.setHours(23, 59, 59, 999)

  const seteDiasAtras = new Date()
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)

  const [{ data: recepcoes }, { data: clientes }, { data: equipe }] = await Promise.all([
    supabase
      .from('recepcoes')
      .select('*, responsavel:usuarios(id, nome)')
      .gte('chegada', seteDiasAtras.toISOString())
      .order('chegada', { ascending: false }),
    supabase
      .from('clientes')
      .select('id, nome, cpf_cnpj')
      .eq('arquivado', false)
      .order('nome'),
    supabase
      .from('usuarios')
      .select('id, nome')
      .in('papel', ['admin', 'advogado', 'secretaria'])
      .order('nome'),
  ])

  const hoje_str = hoje.toISOString()
  const hoje_fim_str = hojeFim.toISOString()

  const recepcaoHoje = (recepcoes ?? []).filter(r =>
    r.chegada >= hoje_str && r.chegada <= hoje_fim_str
  )
  const abertos = recepcaoHoje.filter(r => !r.saida)
  const encerrados = recepcaoHoje.filter(r => r.saida)
  const anteriores = (recepcoes ?? []).filter(r => r.chegada < hoje_str)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recepção</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
        </div>
        <RecepcaoForm
          clientes={(clientes ?? []).map(c => ({ id: c.id, nome: c.nome }))}
          equipe={(equipe ?? []).map(u => ({ id: u.id, nome: u.nome }))}
        />
      </div>

      {/* Em atendimento */}
      {abertos.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            Em atendimento ({abertos.length})
          </h2>
          <div className="rounded-2xl border bg-card divide-y divide-border/60 overflow-hidden shadow-sm">
            {abertos.map(r => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3.5 gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{r.cliente_nome}</p>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-full border-amber-500/50 text-amber-500">
                      Em atendimento
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground/70 flex-wrap">
                    <span>Entrada: {formatHora(r.chegada)}</span>
                    <span>Há {duracao(r.chegada, null)}</span>
                    {r.responsavel?.nome && <span>Com: {r.responsavel.nome}</span>}
                  </div>
                  {r.assunto && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">{r.assunto}</p>
                  )}
                </div>
                <SaidaBtn id={r.id} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Atendimentos do dia */}
      {encerrados.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Hoje — concluídos ({encerrados.length})
          </h2>
          <div className="rounded-2xl border bg-card divide-y divide-border/60 overflow-hidden shadow-sm">
            {encerrados.map(r => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3 gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{r.cliente_nome}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground/70 flex-wrap">
                    <span>{formatHora(r.chegada)} → {formatHora(r.saida!)}</span>
                    <span>{duracao(r.chegada, r.saida)}</span>
                    {r.responsavel?.nome && <span>Com: {r.responsavel.nome}</span>}
                  </div>
                  {r.assunto && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">{r.assunto}</p>
                  )}
                  {r.providencia && (
                    <p className="text-xs text-muted-foreground/60 mt-0.5 truncate max-w-md italic">{r.providencia}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {recepcaoHoje.length === 0 && (
        <div className="rounded-2xl border bg-card py-16 text-center">
          <ClipboardList className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum atendimento registrado hoje.</p>
        </div>
      )}

      {/* Histórico recente */}
      {anteriores.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Últimos 7 dias
          </h2>
          <div className="rounded-2xl border bg-card divide-y divide-border/60 overflow-hidden shadow-sm">
            {anteriores.map(r => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3 gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{r.cliente_nome}</p>
                    <span className="text-xs text-muted-foreground">{formatData(r.chegada)}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground/70 flex-wrap">
                    <span>{formatHora(r.chegada)}{r.saida ? ` → ${formatHora(r.saida)}` : ' (sem saída)'}</span>
                    {r.responsavel?.nome && <span>Com: {r.responsavel.nome}</span>}
                  </div>
                  {r.assunto && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">{r.assunto}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
