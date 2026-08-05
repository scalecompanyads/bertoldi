import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Search, Info } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProcessoCard } from '@/components/shared/processo-card'
import type { Processo } from '@/lib/types'

interface Props {
  searchParams: Promise<{ q?: string; status?: string; resp?: string; pagina?: string }>
}

const POR_PAGINA = 25

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'triagem', label: 'Triagem' },
  { value: 'em_analise', label: 'Em análise' },
  { value: 'distribuido', label: 'Distribuído' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluido', label: 'Concluído' },
]

export default async function ProcessosPage({ searchParams }: Props) {
  const { q, status, resp, pagina } = await searchParams
  const paginaAtual = Math.max(1, parseInt(pagina ?? '1', 10) || 1)
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('processos')
    .select('*, clientes(id, nome), responsavel:responsavel_id(id, nome)', { count: 'exact' })
    .order('criado_em', { ascending: false })
    .range((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA - 1)

  if (q) {
    // busca por número CNJ (com ou sem pontuação) ou tipo/matéria
    const somenteDigitos = q.replace(/\D/g, '')
    if (somenteDigitos.length >= 7) {
      const formatado = somenteDigitos.length === 20
        ? `${somenteDigitos.slice(0, 7)}-${somenteDigitos.slice(7, 9)}.${somenteDigitos.slice(9, 13)}.${somenteDigitos.slice(13, 14)}.${somenteDigitos.slice(14, 16)}.${somenteDigitos.slice(16, 20)}`
        : somenteDigitos
      query = query.or(`numero_cnj.ilike.%${formatado}%,numero_cnj.ilike.%${somenteDigitos}%`)
    } else {
      const termo = q.trim()
      query = query.or(
        [
          `tipo_servico.ilike.%${termo}%`,
          `tribunal.ilike.%${termo}%`,
          `numero_cnj.ilike.%${termo}%`,
          `parte_autora.ilike.%${termo}%`,
          `parte_re.ilike.%${termo}%`,
          `outras_partes.ilike.%${termo}%`,
        ].join(',')
      )
    }
  }

  if (status) query = query.eq('status_interno', status)
  if (resp === 'meus' && user) query = query.eq('responsavel_id', user.id)

  const { data: processos, error: queryError, count: total } = await query
  const lista = (processos ?? []) as unknown as Processo[]
  const totalPaginas = Math.max(1, Math.ceil((total ?? 0) / POR_PAGINA))

  // Última verificação no tribunal de cada processo listado
  const ultimaVerificacao = new Map<string, string>()
  if (lista.length > 0) {
    const { data: verificacoes } = await supabase
      .from('verificacoes_datajud')
      .select('processo_id, verificado_em')
      .in('processo_id', lista.map((p) => p.id))
      .order('verificado_em', { ascending: false })

    for (const v of verificacoes ?? []) {
      if (!ultimaVerificacao.has(v.processo_id)) {
        ultimaVerificacao.set(v.processo_id, v.verificado_em)
      }
    }
  }

  function buildHref(params: Record<string, string>) {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (status) sp.set('status', status)
    if (resp) sp.set('resp', resp)
    Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, v); else sp.delete(k) })
    const s = sp.toString()
    return `/admin/processos${s ? `?${s}` : ''}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Processos</h1>
        <span className="text-sm text-muted-foreground tabular-nums">{total ?? 0} no total</span>
      </div>

      <p className="flex gap-3 rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70" aria-hidden="true" />
        <span>
          Para adicionar novos processos, acesse{' '}
          <Link href="/admin/clientes" className="font-medium text-foreground underline underline-offset-2 hover:text-primary transition-colors">
            Clientes
          </Link>
          {' '}e adicione o processo ao cliente.
        </span>
      </p>

      {/* Busca + filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form className="relative flex-1 max-w-sm" action="/admin/processos">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Nº do processo, partes, matéria ou tribunal..."
            className="pl-9"
          />
          {status && <input type="hidden" name="status" value={status} />}
          {resp && <input type="hidden" name="resp" value={resp} />}
        </form>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Link
            href={buildHref({ resp: resp === 'meus' ? '' : 'meus', pagina: '' })}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
              resp === 'meus'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'text-muted-foreground hover:text-foreground hover:border-foreground/40'
            }`}
          >
            Meus processos
          </Link>
          {STATUS_OPTIONS.map(({ value, label }) => {
            const active = (status ?? '') === value
            return (
              <Link
                key={value}
                href={buildHref({ status: value, pagina: '' })}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'text-muted-foreground hover:text-foreground hover:border-foreground/40'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>
      </div>

      {queryError && (
        <div role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Erro ao carregar processos: {queryError.message}.{' '}
          <a href="" className="font-medium underline">Tentar novamente</a>
        </div>
      )}

      {!queryError && (
        lista.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start">
            {lista.map((p) => (
              <ProcessoCard
                key={p.id}
                processo={p}
                href={`/admin/clientes/${p.cliente_id}/processos/${p.id}`}
                clienteNome={p.clientes?.nome}
                ultimaVerificacao={ultimaVerificacao.get(p.id)}
                compacto
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {q || status || resp ? 'Nenhum processo encontrado com esses filtros.' : 'Nenhum processo cadastrado ainda.'}
            </p>
          </div>
        )
      )}

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-xs text-muted-foreground">página {paginaAtual} de {totalPaginas}</span>
          <div className="flex gap-2">
            {paginaAtual > 1 && (
              <Link href={buildHref({ pagina: String(paginaAtual - 1) })} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Anterior
              </Link>
            )}
            {paginaAtual < totalPaginas && (
              <Link href={buildHref({ pagina: String(paginaAtual + 1) })} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Próxima
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
