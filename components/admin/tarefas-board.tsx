'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { Plus, Clock, Trash2, Pencil, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { criarTarefa, atualizarTarefa, moverTarefa, excluirTarefa } from '@/lib/actions/tarefas'
import { diasUteisRestantes } from '@/lib/prazos'
import { STATUS_TAREFA_LABEL } from '@/lib/types'
import type { Tarefa, StatusTarefa, Processo, Cliente } from '@/lib/types'

const COLUNAS: StatusTarefa[] = ['a_fazer', 'em_andamento', 'aguardando', 'concluido']

const COLUNA_COR: Record<StatusTarefa, string> = {
  a_fazer: 'border-t-slate-400',
  em_andamento: 'border-t-blue-500',
  aguardando: 'border-t-yellow-500',
  concluido: 'border-t-green-500',
}

type ProcessoOpcao = Pick<Processo, 'id' | 'numero_cnj' | 'tipo_servico'> & {
  clientes?: Pick<Cliente, 'id' | 'nome'>
}

// Classificação do prazo para cor e texto do card — alerta escalonado por
// dias úteis restantes: verde > 5, amarelo 2–5, vermelho < 2 (ou vencido)
function infoPrazo(prazo: string | null, concluida: boolean) {
  if (!prazo) return null
  const data = new Date(prazo)
  const texto = data.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
  if (concluida) return { texto, classe: 'text-muted-foreground' }

  if (data.getTime() < Date.now()) {
    return { texto: `${texto} · vencido`, classe: 'text-red-600 dark:text-red-400 font-semibold' }
  }

  const restantes = diasUteisRestantes(data)
  const rotulo = restantes === 0
    ? 'vence hoje'
    : restantes === 1
      ? 'resta 1 dia útil'
      : `restam ${restantes} dias úteis`

  if (restantes < 2) {
    return { texto: `${texto} · ${rotulo}`, classe: 'text-red-600 dark:text-red-400 font-semibold' }
  }
  if (restantes <= 5) {
    return { texto: `${texto} · ${rotulo}`, classe: 'text-amber-600 dark:text-amber-400 font-medium' }
  }
  return { texto: `${texto} · ${rotulo}`, classe: 'text-emerald-600 dark:text-emerald-400' }
}

// datetime-local usa hora local sem timezone; converter para ISO UTC antes de enviar
function prazoParaISO(local: string): string {
  return local ? new Date(local).toISOString() : ''
}

function isoParaDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function TarefasBoard({ tarefas, processos }: { tarefas: Tarefa[]; processos: ProcessoOpcao[] }) {
  const router = useRouter()
  const [itens, setItens] = useState(tarefas)
  const [tarefasBase, setTarefasBase] = useState(tarefas)
  if (tarefas !== tarefasBase) {
    setTarefasBase(tarefas)
    setItens(tarefas)
  }
  const [dialogAberto, setDialogAberto] = useState(false)
  const [editando, setEditando] = useState<Tarefa | null>(null)
  const [statusNova, setStatusNova] = useState<StatusTarefa>('a_fazer')
  const [processoSel, setProcessoSel] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [arrastando, setArrastando] = useState<string | null>(null)
  const [colunaAlvo, setColunaAlvo] = useState<StatusTarefa | null>(null)

  const opcoesProcesso = useMemo(
    () => [
      { value: '', label: 'Nenhum' },
      ...processos.map((p) => ({
        value: p.id,
        label: `${p.clientes?.nome ? `${p.clientes.nome} — ` : ''}${p.numero_cnj ?? p.tipo_servico}`,
        keywords: [p.clientes?.nome, p.numero_cnj, p.tipo_servico].filter(Boolean).join(' '),
      })),
    ],
    [processos]
  )

  function abrirNova(status: StatusTarefa) {
    setEditando(null)
    setStatusNova(status)
    setProcessoSel('')
    setDialogAberto(true)
  }

  function abrirEdicao(t: Tarefa) {
    setEditando(t)
    setStatusNova(t.status)
    setProcessoSel(t.processo_id ?? '')
    setDialogAberto(true)
  }

  async function moverPorTeclado(tarefa: Tarefa, destino: StatusTarefa) {
    if (tarefa.status === destino) return
    const ordem = Math.max(0, ...itens.filter((t) => t.status === destino).map((t) => t.ordem + 1))
    setItens((prev) => prev.map((t) => (t.id === tarefa.id ? { ...t, status: destino, ordem } : t)))
    const result = await moverTarefa(tarefa.id, destino, ordem)
    if (result.error) {
      toast.error(result.error)
      router.refresh()
    }
  }

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSalvando(true)
    const fd = new FormData(e.currentTarget)
    fd.set('processo_id', processoSel)
    fd.set('prazo', prazoParaISO(fd.get('prazo') as string))
    if (!editando) fd.set('status', statusNova)
    else fd.set('status', statusNova)

    const result = editando ? await atualizarTarefa(editando.id, fd) : await criarTarefa(fd)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(editando ? 'Tarefa atualizada.' : 'Tarefa criada.')
      setDialogAberto(false)
      router.refresh()
    }
    setSalvando(false)
  }

  async function excluir(t: Tarefa) {
    setItens((prev) => prev.filter((x) => x.id !== t.id))
    const result = await excluirTarefa(t.id)
    if (result.error) {
      toast.error(result.error)
      router.refresh()
    }
  }

  async function soltar(status: StatusTarefa) {
    setColunaAlvo(null)
    if (!arrastando) return
    const tarefa = itens.find((t) => t.id === arrastando)
    setArrastando(null)
    if (!tarefa || tarefa.status === status) return

    // Vai para o fim da coluna de destino
    const ordem = Math.max(0, ...itens.filter((t) => t.status === status).map((t) => t.ordem + 1))
    setItens((prev) => prev.map((t) => (t.id === tarefa.id ? { ...t, status, ordem } : t)))

    const result = await moverTarefa(tarefa.id, status, ordem)
    if (result.error) {
      toast.error(result.error)
      router.refresh()
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUNAS.map((status) => {
          const daColuna = itens
            .filter((t) => t.status === status)
            .sort((a, b) => a.ordem - b.ordem)
          return (
            <div
              key={status}
              onDragOver={(e) => { e.preventDefault(); setColunaAlvo(status) }}
              onDragLeave={() => setColunaAlvo((c) => (c === status ? null : c))}
              onDrop={() => soltar(status)}
              className={`border border-t-4 bg-card/50 transition-colors ${COLUNA_COR[status]} ${
                colunaAlvo === status && arrastando ? 'bg-accent' : ''
              }`}
            >
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <h2 className="text-sm font-semibold">
                  {STATUS_TAREFA_LABEL[status]}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">{daColuna.length}</span>
                </h2>
                <button
                  onClick={() => abrirNova(status)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`Nova tarefa em ${STATUS_TAREFA_LABEL[status]}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-col gap-2 p-3 pt-1 min-h-24">
                {daColuna.map((t) => {
                  const prazo = infoPrazo(t.prazo, t.status === 'concluido')
                  const idxColuna = COLUNAS.indexOf(status)
                  const colunaAnterior = idxColuna > 0 ? COLUNAS[idxColuna - 1] : null
                  const colunaSeguinte = idxColuna < COLUNAS.length - 1 ? COLUNAS[idxColuna + 1] : null
                  return (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={() => setArrastando(t.id)}
                      onDragEnd={() => { setArrastando(null); setColunaAlvo(null) }}
                      className={`group border bg-card p-3 space-y-2 cursor-grab active:cursor-grabbing shadow-sm ${
                        arrastando === t.id ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium leading-snug ${t.status === 'concluido' ? 'line-through text-muted-foreground' : ''}`}>
                          {t.titulo}
                        </p>
                        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                          {colunaAnterior && (
                            <button
                              type="button"
                              onClick={() => moverPorTeclado(t, colunaAnterior)}
                              className="text-muted-foreground hover:text-foreground"
                              aria-label={`Mover para ${STATUS_TAREFA_LABEL[colunaAnterior]}`}
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {colunaSeguinte && (
                            <button
                              type="button"
                              onClick={() => moverPorTeclado(t, colunaSeguinte)}
                              className="text-muted-foreground hover:text-foreground"
                              aria-label={`Mover para ${STATUS_TAREFA_LABEL[colunaSeguinte]}`}
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button onClick={() => abrirEdicao(t)} className="text-muted-foreground hover:text-foreground" aria-label="Editar">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => excluir(t)} className="text-muted-foreground hover:text-destructive" aria-label="Excluir">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      {t.descricao && (
                        <p className="text-xs text-muted-foreground line-clamp-3">{t.descricao}</p>
                      )}
                      {prazo && (
                        <p className={`flex items-center gap-1 text-xs ${prazo.classe}`}>
                          <Clock className="h-3 w-3 shrink-0" />
                          {prazo.texto}
                        </p>
                      )}
                      {t.prazo_contexto && (
                        <p className="text-[11px] text-muted-foreground">
                          {t.prazo_contexto.calendario_nome}
                          {t.prazo_contexto.versao ? ` v${t.prazo_contexto.versao}` : ''}
                          {t.prazo_contexto.ajuste_manual ? ' · data ajustada manualmente' : ' · sugestão confirmada'}
                        </p>
                      )}
                      {t.processo && (
                        <Link
                          href={`/admin/clientes/${t.processo.cliente_id}/processos/${t.processo.id}`}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Briefcase className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {t.processo.clientes?.nome ?? t.processo.tipo_servico}
                            {t.processo.numero_cnj && <span className="font-mono"> · {t.processo.numero_cnj}</span>}
                          </span>
                        </Link>
                      )}
                    </div>
                  )
                })}
                {daColuna.length === 0 && (
                  <p className="text-xs text-muted-foreground/60 text-center py-4">
                    Arraste tarefas para cá
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar tarefa' : `Nova tarefa — ${STATUS_TAREFA_LABEL[statusNova]}`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={salvar} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="titulo">Título *</Label>
              <Input id="titulo" name="titulo" required defaultValue={editando?.titulo} placeholder="Ex: Protocolar contestação" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" name="descricao" rows={3} defaultValue={editando?.descricao ?? ''} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prazo">Prazo</Label>
              <Input id="prazo" name="prazo" type="datetime-local" defaultValue={isoParaDatetimeLocal(editando?.prazo ?? null)} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={statusNova} onValueChange={(v) => setStatusNova((v ?? 'a_fazer') as StatusTarefa)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COLUNAS.map(status => (
                    <SelectItem key={status} value={status}>{STATUS_TAREFA_LABEL[status]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Alternativa acessível ao arrastar: altere a coluna por este campo.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Processo vinculado</Label>
              <SearchableSelect
                value={processoSel}
                onValueChange={setProcessoSel}
                options={opcoesProcesso}
                placeholder="Nenhum"
                searchPlaceholder="Buscar por cliente, CNJ ou matéria..."
                emptyMessage="Nenhum processo encontrado."
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setDialogAberto(false)}>Cancelar</Button>
              <Button type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
