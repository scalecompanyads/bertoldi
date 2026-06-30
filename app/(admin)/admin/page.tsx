import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Briefcase, ArrowRight } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()

  const [{ count: totalClientes }, { count: totalProcessos }] = await Promise.all([
    supabase.from('clientes').select('*', { count: 'exact', head: true }),
    supabase.from('processos').select('*', { count: 'exact', head: true }),
  ])

  const cards = [
    { label: 'Clientes', value: totalClientes ?? 0, icon: Users, href: '/admin/clientes' },
    { label: 'Processos', value: totalProcessos ?? 0, icon: Briefcase, href: '/admin/clientes' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Visão geral</h1>
      <div className="grid grid-cols-2 gap-4 max-w-md">
        {cards.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-lg border p-4 hover:bg-accent transition-colors flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
