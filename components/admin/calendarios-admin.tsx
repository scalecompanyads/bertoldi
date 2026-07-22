'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarDays, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  adicionarDiaCalendario,
  criarCalendario,
  criarNovaVersaoCalendario,
  publicarVersaoCalendario,
  removerDiaCalendario,
} from '@/lib/actions/calendarios'
import type { CalendarioForense, CalendarioForenseVersao } from '@/lib/types'

const TIPOS = [
  ['feriado_estadual', 'Feriado estadual'],
  ['feriado_municipal', 'Feriado municipal'],
  ['recesso', 'Recesso forense'],
  ['suspensao', 'Suspensão'],
  ['ponto_facultativo', 'Ponto facultativo'],
] as const

export function CalendariosAdmin({ calendarios }: { calendarios: CalendarioForense[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function executar(acao: () => Promise<{ error?: string; ok?: boolean }>, sucesso: string) {
    setLoading(true)
    const resultado = await acao()
    if (resultado.error) toast.error(resultado.error)
    else {
      toast.success(sucesso)
      router.refresh()
    }
    setLoading(false)
  }

  async function novoCalendario(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    await executar(() => criarCalendario(new FormData(form)), 'Calendário criado em rascunho.')
    form.reset()
  }

  async function novoDia(e: React.FormEvent<HTMLFormElement>, versaoId: string) {
    e.preventDefault()
    const form = e.currentTarget
    await executar(() => adicionarDiaCalendario(versaoId, new FormData(form)), 'Dia não útil adicionado.')
    form.reset()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={novoCalendario} className="space-y-4 rounded-lg border bg-muted/20 p-4">
        <div>
          <h2 className="text-sm font-semibold">Novo calendário</h2>
          <p className="text-xs text-muted-foreground">
            Cadastre somente dados conferidos em fonte oficial. Nenhum feriado local é presumido.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Nome" name="nome" placeholder="TJSP — São Paulo Capital" required />
          <div className="space-y-1.5">
            <Label htmlFor="escopo">Escopo</Label>
            <select id="escopo" name="escopo" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="comarca">Comarca</option>
              <option value="municipal">Municipal</option>
              <option value="tribunal">Tribunal</option>
              <option value="estadual">Estadual</option>
            </select>
          </div>
          <Campo label="UF" name="uf" placeholder="SP" maxLength={2} required />
          <Campo label="Comarca / município" name="comarca" placeholder="São Paulo" />
          <Campo label="Tribunal" name="tribunal" placeholder="TJSP" />
          <Campo label="Descrição da fonte" name="fonte_descricao" placeholder="Calendário oficial TJSP 2026" required />
          <Campo label="URL oficial" name="fonte_url" type="url" placeholder="https://..." required />
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Vigência inicial" name="vigencia_inicio" type="date" required />
            <Campo label="Vigência final" name="vigencia_fim" type="date" required />
          </div>
        </div>
        <Button type="submit" size="sm" disabled={loading}>
          <Plus className="h-4 w-4" /> Criar rascunho
        </Button>
      </form>

      {calendarios.length === 0 ? (
        <div className="rounded-lg border py-12 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">Nenhum calendário cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {calendarios.map(calendario => (
            <article key={calendario.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{calendario.nome}</h2>
                  <p className="text-xs text-muted-foreground">
                    {calendario.uf} · {calendario.escopo}
                    {calendario.comarca && ` · ${calendario.comarca}`}
                    {calendario.tribunal && ` · ${calendario.tribunal}`}
                  </p>
                </div>
                {calendario.versao_ativa && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    v{calendario.versao_ativa.versao} publicada
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-3">
                {(calendario.versoes ?? []).map(versao => (
                  <VersaoCard
                    key={versao.id}
                    calendario={calendario}
                    versao={versao}
                    loading={loading}
                    executar={executar}
                    novoDia={novoDia}
                  />
                ))}
              </div>

              {calendario.versao_ativa && !(calendario.versoes ?? []).some(v => v.status === 'rascunho') && (
                <Button
                  className="mt-4"
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={loading}
                  onClick={() => executar(
                    () => criarNovaVersaoCalendario(calendario.id),
                    'Nova versão criada a partir da versão publicada.'
                  )}
                >
                  Criar nova versão
                </Button>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function VersaoCard({
  calendario,
  versao,
  loading,
  executar,
  novoDia,
}: {
  calendario: CalendarioForense
  versao: CalendarioForenseVersao
  loading: boolean
  executar: (acao: () => Promise<{ error?: string; ok?: boolean }>, sucesso: string) => Promise<void>
  novoDia: (e: React.FormEvent<HTMLFormElement>, versaoId: string) => Promise<void>
}) {
  const rascunho = versao.status === 'rascunho'
  return (
    <details className="rounded-md border bg-card p-3" open={rascunho}>
      <summary className="cursor-pointer text-sm font-medium">
        Versão {versao.versao} · {versao.status} · {versao.vigencia_inicio} a {versao.vigencia_fim}
      </summary>
      <div className="mt-3 space-y-3">
        <a
          href={versao.fonte_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" /> {versao.fonte_descricao}
        </a>

        <div className="space-y-1">
          {(versao.dias ?? []).map(dia => (
            <div key={dia.id} className="flex items-center justify-between gap-2 rounded border px-2 py-1.5 text-xs">
              <span>
                {dia.data_inicio}{dia.data_fim !== dia.data_inicio && ` a ${dia.data_fim}`} · {dia.descricao}
              </span>
              {rascunho && (
                <button
                  type="button"
                  aria-label={`Remover ${dia.descricao}`}
                  disabled={loading}
                  onClick={() => executar(() => removerDiaCalendario(dia.id), 'Dia removido.')}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {rascunho && (
          <>
            <form onSubmit={(e) => novoDia(e, versao.id)} className="grid gap-2 rounded border border-dashed p-3 sm:grid-cols-2">
              <Campo label="Início" name="data_inicio" type="date" required />
              <Campo label="Fim" name="data_fim" type="date" />
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <select name="tipo" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                  {TIPOS.map(([valor, label]) => <option key={valor} value={valor}>{label}</option>)}
                </select>
              </div>
              <Campo label="Descrição" name="descricao" placeholder="Recesso forense" required />
              <Button type="submit" size="sm" variant="outline" disabled={loading}>Adicionar</Button>
            </form>
            <Button
              type="button"
              size="sm"
              disabled={loading || !(versao.dias?.length)}
              onClick={() => executar(
                () => publicarVersaoCalendario(calendario.id, versao.id),
                'Versão publicada. Processos vinculados já usarão este calendário.'
              )}
            >
              Publicar versão
            </Button>
          </>
        )}
      </div>
    </details>
  )
}

function Campo(props: React.ComponentProps<typeof Input> & { label: string }) {
  const { label, name, ...inputProps } = props
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...inputProps} />
    </div>
  )
}
