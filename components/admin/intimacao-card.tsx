'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  Landmark,
  ListTodo,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { marcarIntimacao, criarTarefaDeIntimacao } from '@/lib/actions/intimacoes'
import { vencimentoPrazoDJEN } from '@/lib/prazos'
import { diasExcluidosEntre, expandirDiasNaoUteis } from '@/lib/prazos/calendario'
import type { PrazoContexto } from '@/lib/types'
import type { Intimacao } from '@/lib/types'

// data_disponibilizacao é date pura (aaaa-mm-dd) — formatar sem new Date()
// para não deslocar um dia por fuso horário
function formatarData(iso: string): string {
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

function dataParaInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function IntimacaoCard({ intimacao: i }: { intimacao: Intimacao }) {
  const [expandido, setExpandido] = useState(false)
  const [loading, setLoading] = useState<'lida' | 'tarefa' | null>(null)
  const [dialogPrazo, setDialogPrazo] = useState(false)
  const [diasUteis, setDiasUteis] = useState('15')
  const [vencimento, setVencimento] = useState('')
  const [vencimentoEditado, setVencimentoEditado] = useState(false)

  const naoLida = i.status === 'nao_lida'
  const textoLongo = (i.texto?.length ?? 0) > 280
  const calendario = i.processo?.calendario ?? null
  const versao = calendario?.versao_ativa ?? null
  const diasCalendario = useMemo(() => versao?.dias ?? [], [versao?.dias])
  const diasNaoUteis = useMemo(() => expandirDiasNaoUteis(diasCalendario), [diasCalendario])

  // Sugestão pela sistemática do CPC: publicada no 1º dia útil após a
  // disponibilização; prazo começa no dia útil seguinte; só dias úteis contam
  const sugestao = useMemo(() => {
    const dias = parseInt(diasUteis, 10)
    if (!Number.isFinite(dias) || dias < 1) return null
    return vencimentoPrazoDJEN(i.data_disponibilizacao, dias, diasNaoUteis)
  }, [diasUteis, i.data_disponibilizacao, diasNaoUteis])

  function abrirDialogPrazo() {
    setDiasUteis('15')
    setVencimento(dataParaInput(vencimentoPrazoDJEN(i.data_disponibilizacao, 15, diasNaoUteis)))
    setVencimentoEditado(false)
    setDialogPrazo(true)
  }

  function mudarDias(v: string) {
    setDiasUteis(v)
    if (!vencimentoEditado) {
      const dias = parseInt(v, 10)
      if (Number.isFinite(dias) && dias >= 1) {
        setVencimento(dataParaInput(vencimentoPrazoDJEN(i.data_disponibilizacao, dias, diasNaoUteis)))
      }
    }
  }

  async function marcarLida() {
    setLoading('lida')
    const res = await marcarIntimacao(i.id, 'lida')
    if (res.error) toast.error(res.error)
    setLoading(null)
  }

  async function criarTarefa(comPrazo: boolean) {
    setLoading('tarefa')
    // Prazo processual vence no fim do expediente — grava 23:59 do dia (hora local)
    const prazoISO = comPrazo && vencimento
      ? new Date(`${vencimento}T23:59:00`).toISOString()
      : null
    const contexto: PrazoContexto | null = comPrazo ? {
      calendario_id: calendario?.id ?? null,
      versao_id: versao?.id ?? null,
      versao: versao?.versao ?? null,
      calendario_nome: calendario?.nome ?? 'Feriados nacionais',
      fonte_url: versao?.fonte_url ?? null,
      dias_uteis: parseInt(diasUteis, 10),
      vencimento_sugerido: sugestao ? dataParaInput(sugestao) : null,
      ajuste_manual: vencimentoEditado,
    } : null
    const res = await criarTarefaDeIntimacao(i.id, prazoISO, contexto)
    if (res.error) {
      toast.error(res.error)
    } else {
      setDialogPrazo(false)
      toast.success(prazoISO
        ? 'Tarefa criada no seu kanban com o prazo definido.'
        : 'Tarefa criada no seu kanban, sem prazo.')
    }
    setLoading(null)
  }

  return (
    <div className={`rounded-lg border p-4 space-y-2 ${naoLida ? 'border-primary/40 bg-primary/5' : ''}`}>
      {/* Cabeçalho: badges + data */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {naoLida && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
              Nova
            </span>
          )}
          {i.status === 'tratada' && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-400">
              Tratada
            </span>
          )}
          {i.sigla_tribunal && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground border rounded-full px-2 py-0.5">
              <Landmark className="h-3 w-3" />
              {i.sigla_tribunal}
            </span>
          )}
          {i.tipo_comunicacao && (
            <span className="text-xs text-muted-foreground border rounded-full px-2 py-0.5">
              {i.tipo_comunicacao}
            </span>
          )}
        </div>
        <time className="text-xs text-muted-foreground shrink-0">
          {formatarData(i.data_disponibilizacao)}
        </time>
      </div>

      {/* Processo + classe */}
      <div className="space-y-0.5">
        <p className="text-sm font-semibold">
          {i.nome_classe || 'Comunicação'}
          {i.numero_cnj && <span className="font-mono font-normal text-xs text-muted-foreground"> · {i.numero_cnj}</span>}
        </p>
        <p className="text-xs text-muted-foreground">
          {i.nome_orgao}
          {i.advogado?.nome && <> · Intimado: {i.advogado.nome}</>}
        </p>
        {i.processo ? (
          <Link
            href={`/admin/clientes/${i.processo.cliente_id}/processos/${i.processo.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <User className="h-3 w-3" />
            {i.processo.clientes?.nome ?? 'Ver processo'} — {i.processo.tipo_servico}
          </Link>
        ) : (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Processo não cadastrado no sistema
          </p>
        )}
      </div>

      {/* Texto da publicação */}
      {i.texto && (
        <div className="space-y-1">
          <p className={`text-sm leading-relaxed text-muted-foreground ${!expandido && textoLongo ? 'line-clamp-3' : ''}`}>
            {i.texto}
          </p>
          {textoLongo && (
            <button
              onClick={() => setExpandido(v => !v)}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {expandido ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expandido ? 'Recolher' : 'Ler íntegra'}
            </button>
          )}
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center gap-3 pt-1 flex-wrap">
        {naoLida && (
          <button
            onClick={marcarLida}
            disabled={loading !== null}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <Eye className="h-3.5 w-3.5" />
            {loading === 'lida' ? 'Marcando...' : 'Marcar como lida'}
          </button>
        )}
        {i.status !== 'tratada' && (
          <button
            onClick={abrirDialogPrazo}
            disabled={loading !== null}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
          >
            <ListTodo className="h-3.5 w-3.5" />
            Criar tarefa
          </button>
        )}
        {i.link && (
          <a
            href={i.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver no portal
          </a>
        )}
      </div>

      {/* Diálogo: prazo sugerido em dias úteis, confirmado pelo advogado */}
      <Dialog open={dialogPrazo} onOpenChange={setDialogPrazo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar tarefa com prazo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Disponibilizada no DJEN em <strong>{formatarData(i.data_disponibilizacao)}</strong>.
              A sugestão segue o CPC: publicação no 1º dia útil seguinte, início no dia útil
              posterior, contando só dias úteis.
            </p>
            {versao ? (
              <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">
                  Calendário: {calendario?.nome} · versão {versao.versao}
                </p>
                <p>{versao.fonte_descricao}</p>
                <a
                  href={versao.fonte_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" /> Abrir fonte oficial
                </a>
              </div>
            ) : (
              <p className="rounded-lg border border-amber-300/50 bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                Este processo não possui calendário local publicado. A sugestão considera
                somente fins de semana e feriados nacionais.
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={`dias-${i.id}`}>Prazo (dias úteis)</Label>
                <Input
                  id={`dias-${i.id}`}
                  inputMode="numeric"
                  value={diasUteis}
                  onChange={(e) => mudarDias(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`venc-${i.id}`}>Vencimento</Label>
                <Input
                  id={`venc-${i.id}`}
                  type="date"
                  value={vencimento}
                  onChange={(e) => { setVencimento(e.target.value); setVencimentoEditado(true) }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {vencimentoEditado
                ? 'Data ajustada manualmente.'
                : sugestao
                  ? `Sugestão calculada: ${sugestao.toLocaleDateString('pt-BR')}. `
                  : ''}
              {versao
                ? 'O calendário local foi aplicado, mas suspensões novas podem não estar cadastradas.'
                : 'A contagem não considera feriados estaduais/municipais nem recesso forense.'}
              {' '}Confirme a data antes de salvar.
            </p>
            {sugestao && diasExcluidosEntre(diasCalendario, new Date(`${i.data_disponibilizacao}T12:00:00`), sugestao).length > 0 && (
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Ocorrências locais no período:</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {diasExcluidosEntre(diasCalendario, new Date(`${i.data_disponibilizacao}T12:00:00`), sugestao).map(dia => (
                    <li key={dia.id}>{dia.data_inicio}{dia.data_fim !== dia.data_inicio ? ` a ${dia.data_fim}` : ''} — {dia.descricao}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={loading !== null}
                onClick={() => criarTarefa(false)}
              >
                Criar sem prazo
              </Button>
              <Button
                type="button"
                disabled={loading !== null || !vencimento}
                onClick={() => criarTarefa(true)}
              >
                {loading === 'tarefa' ? 'Criando...' : 'Criar com este prazo'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
