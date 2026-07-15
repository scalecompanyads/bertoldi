import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { ProcessoForm } from '@/components/admin/processo-form'
import type { Cliente, Usuario } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function NovoProcessoPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: cliente }, { data: advogados }] = await Promise.all([
    supabase.from('clientes').select('id, nome').eq('id', id).single(),
    supabase.from('usuarios').select('id, nome').in('papel', ['admin', 'advogado']).order('nome'),
  ])

  if (!cliente) notFound()

  return (
    <div className="max-w-2xl space-y-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/admin/clientes" className="hover:text-foreground">Clientes</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/admin/clientes/${id}`} className="hover:text-foreground">{(cliente as Cliente).nome}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Novo processo</span>
      </nav>
      <h1 className="text-xl font-semibold">Novo processo</h1>
      <ProcessoForm clienteId={id} advogados={(advogados ?? []) as Pick<Usuario, 'id' | 'nome'>[]} />
    </div>
  )
}
