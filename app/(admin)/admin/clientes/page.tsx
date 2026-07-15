import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import type { Cliente } from '@/lib/types'

interface Props {
  searchParams: Promise<{ q?: string; status?: string; ver?: string; pagina?: string }>
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

export default async function ClientesPage({ searchParams }: Props) {
  const { q, status, ver, pagina } = await searchParams
  const mostrarArquivados = ver === 'arquivados'
  const paginaAtual = Math.max(1, parseInt(pagina ?? '1', 10) || 1)
  const supabase = await createClient()

  let query = supabase
    .from('clientes')
    .select(status ? '*, processos!inner(status_interno)' : '*', { count: 'exact' })
    .eq('arquivado', mostrarArquivados)
    .order('nome')
    .range((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA - 1)

  if (q) {
    query = query.or(`nome.ilike.%${q}%,cpf_cnpj.ilike.%${q}%`)
  }

  if (status) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = (query as any).eq('processos.status_interno', status)
  }

  const { data: clientes, error: queryError, count: totalClientes } = await query.returns<Cliente[]>()
  const totalPaginas = Math.max(1, Math.ceil((totalClientes ?? 0) / POR_PAGINA))

  function buildHref(params: Record<string, string>) {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (status) sp.set('status', status)
    if (mostrarArquivados) sp.set('ver', 'arquivados')
    Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, v); else sp.delete(k) })
    const s = sp.toString()
    return `/admin/clientes${s ? `?${s}` : ''}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">
          {mostrarArquivados ? 'Clientes arquivados' : 'Clientes'}
        </h1>
        {!mostrarArquivados && (
          <Link href="/admin/clientes/novo" className={buttonVariants({ size: 'sm' })}>
            <Plus className="h-4 w-4 mr-1" />
            Novo cliente
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={buildHref({ ver: '' })}
          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
            !mostrarArquivados
              ? 'bg-primary text-primary-foreground border-primary'
              : 'text-muted-foreground hover:text-foreground hover:border-foreground/40'
          }`}
        >
          Ativos
        </Link>
        <Link
          href="/admin/clientes?ver=arquivados"
          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
            mostrarArquivados
              ? 'bg-primary text-primary-foreground border-primary'
              : 'text-muted-foreground hover:text-foreground hover:border-foreground/40'
          }`}
        >
          Arquivados
        </Link>
      </div>

      {/* Busca + filtro de status */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome ou CPF/CNPJ..."
            className="pl-9"
          />
          {status && <input type="hidden" name="status" value={status} />}
          {mostrarArquivados && <input type="hidden" name="ver" value="arquivados" />}
        </form>

        {!mostrarArquivados && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_OPTIONS.map(({ value, label }) => {
              const active = (status ?? '') === value
              return (
                <Link
                  key={value}
                  href={buildHref({ status: value })}
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
        )}
      </div>

      {queryError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Erro ao carregar clientes: {queryError.message}
        </div>
      )}

      {!queryError && (
        clientes && clientes.length > 0 ? (
        <div className="rounded-lg border divide-y">
          {clientes.map((c) => (
            <Link
              key={c.id}
              href={`/admin/clientes/${c.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-accent transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{c.nome}</p>
                  {c.arquivado && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Arquivado
                    </Badge>
                  )}
                </div>
                {c.cpf_cnpj && (
                  <p className="text-xs text-muted-foreground mt-0.5">{c.cpf_cnpj}</p>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {c.email && <span className="hidden sm:block">{c.email}</span>}
                {c.telefone && <span>{c.telefone}</span>}
              </div>
            </Link>
          ))}
        </div>
        ) : (
        <div className="rounded-lg border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {q || status
              ? 'Nenhum cliente encontrado com esses filtros.'
              : mostrarArquivados
                ? 'Nenhum cliente arquivado.'
                : 'Nenhum cliente cadastrado ainda.'}
          </p>
          {!q && !status && !mostrarArquivados && (
            <Link href="/admin/clientes/novo" className={buttonVariants({ variant: 'link' }) + ' mt-2'}>
              Cadastrar primeiro cliente
            </Link>
          )}
        </div>
        )
      )}

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-xs text-muted-foreground">
            {totalClientes} clientes · página {paginaAtual} de {totalPaginas}
          </span>
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
