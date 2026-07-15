'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, LayoutDashboard, LogOut, Scale, Bell, Briefcase, Search, SquareKanban } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const NAV = [
  { href: '/admin', label: 'Painel', icon: LayoutDashboard, exact: true },
  { href: '/admin/processos', label: 'Processos', icon: Briefcase, exact: false },
  { href: '/admin/clientes', label: 'Clientes', icon: Users, exact: false },
  { href: '/admin/comunicados', label: 'Comunicados', icon: Bell, exact: false },
  { href: '/admin/tarefas', label: 'Minhas tarefas', icon: SquareKanban, exact: false },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [busca, setBusca] = useState('')

  function buscar(e: React.FormEvent) {
    e.preventDefault()
    const q = busca.trim()
    if (!q) return
    // Nome de pessoa vai para clientes; número/matéria vai para processos
    const somenteDigitos = q.replace(/\D/g, '')
    const destino = somenteDigitos.length >= 7 || /processo|ação|acao/i.test(q)
      ? `/admin/processos?q=${encodeURIComponent(q)}`
      : `/admin/clientes?q=${encodeURIComponent(q)}`
    router.push(destino)
    setBusca('')
  }

  async function sair() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="flex h-full w-52 shrink-0 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
          <Scale className="h-4 w-4" aria-hidden />
        </div>
        <span className="text-sm font-semibold leading-tight">Bertoldi Advocacia</span>
      </div>

      {/* Busca global */}
      <form onSubmit={buscar} className="p-2 pb-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar..."
            className="w-full rounded-lg border bg-background pl-8 pr-2 py-1.5 text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
      </form>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 p-2 flex-1">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t p-2">
        <button
          onClick={sair}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  )
}
