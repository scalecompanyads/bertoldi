'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, LayoutDashboard, LogOut, Bell, Briefcase, Search, SquareKanban, Inbox, UserCog, Upload, CalendarDays, History, Scale, ClipboardList, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BertoldiLogo } from '@/components/shared/bertoldi-logo'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const NAV = [
  { href: '/admin', label: 'Painel', icon: LayoutDashboard, exact: true },
  { href: '/admin/intimacoes', label: 'Intimações', icon: Inbox, exact: false },
  { href: '/admin/recepcao', label: 'Recepção', icon: ClipboardList, exact: false },
  { href: '/admin/processos', label: 'Processos', icon: Briefcase, exact: false },
  { href: '/admin/peticoes', label: 'Petições', icon: FileText, exact: false },
  { href: '/admin/clientes', label: 'Clientes', icon: Users, exact: false },
  { href: '/admin/comunicados', label: 'Comunicados', icon: Bell, exact: false },
  { href: '/admin/tarefas', label: 'Minhas tarefas', icon: SquareKanban, exact: false },
  { href: '/admin/audiencias', label: 'Audiências', icon: CalendarDays, exact: false },
  { href: '/admin/consulta', label: 'Consulta CNJ', icon: Search, exact: false },
  { href: '/admin/calendarios', label: 'Calendários', icon: Scale, exact: false },
  { href: '/admin/equipe', label: 'Equipe', icon: UserCog, exact: false },
  { href: '/admin/importar', label: 'Importar', icon: Upload, exact: false },
  { href: '/admin/auditoria', label: 'Auditoria', icon: History, exact: false },
]

export function AdminSidebar({ badges = {} }: { badges?: Record<string, boolean> }) {
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
    router.push('/')
  }

  return (
    <aside className="flex h-full w-52 shrink-0 flex-col border-r bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        <BertoldiLogo href="/admin" size="sm" />
      </div>

      {/* Busca global */}
      <form onSubmit={buscar} className="p-2 pb-0">
        <div className="relative">
          <label htmlFor="busca-global" className="sr-only">Buscar clientes ou processos</label>
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            id="busca-global"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar..."
            className="w-full rounded-lg border bg-background pl-8 pr-2 py-1.5 text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
      </form>

      {/* Nav */}
      <nav aria-label="Navegação administrativa" className="flex flex-col gap-0.5 p-2 flex-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          const notificar = badges[href]
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <span className="relative shrink-0">
                <Icon className="h-4 w-4" />
                {notificar && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute -right-1 -top-1 size-2 rounded-full bg-red-500',
                      active ? 'ring-2 ring-primary' : 'ring-2 ring-card'
                    )}
                  />
                )}
              </span>
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
