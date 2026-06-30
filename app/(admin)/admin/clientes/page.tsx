import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Cliente } from '@/lib/types'

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function ClientesPage({ searchParams }: Props) {
  const { q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('clientes')
    .select('*')
    .order('nome')

  if (q) {
    query = query.or(`nome.ilike.%${q}%,cpf_cnpj.ilike.%${q}%`)
  }

  const { data: clientes } = await query.returns<Cliente[]>()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clientes</h1>
        <Link href="/admin/clientes/novo" className={buttonVariants({ size: 'sm' })}>
          <Plus className="h-4 w-4 mr-1" />
          Novo cliente
        </Link>
      </div>

      <form className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome ou CPF/CNPJ..."
          className="pl-9"
        />
      </form>

      {clientes && clientes.length > 0 ? (
        <div className="rounded-lg border divide-y">
          {clientes.map((c) => (
            <Link
              key={c.id}
              href={`/admin/clientes/${c.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-accent transition-colors"
            >
              <div>
                <p className="font-medium text-sm">{c.nome}</p>
                {c.cpf_cnpj && (
                  <p className="text-xs text-muted-foreground mt-0.5">{c.cpf_cnpj}</p>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {c.email && <span>{c.email}</span>}
                {c.telefone && <span>{c.telefone}</span>}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {q ? `Nenhum cliente encontrado para "${q}"` : 'Nenhum cliente cadastrado ainda.'}
          </p>
          {!q && (
            <Link href="/admin/clientes/novo" className={buttonVariants({ variant: 'link' }) + ' mt-2'}>
              Cadastrar primeiro cliente
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
