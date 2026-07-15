'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Briefcase, User, LogOut, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV = [
  { href: '/cliente', label: 'Processos', icon: Briefcase, exact: true },
  { href: '/cliente/comunicados', label: 'Avisos', icon: Bell, exact: false },
  { href: '/cliente/perfil', label: 'Perfil', icon: User, exact: false },
]

export function ClienteNav() {
  const pathname = usePathname()
  const router = useRouter()

  async function sair() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-around px-4">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors text-xs',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          )
        })}
        <button
          onClick={sair}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </nav>
  )
}
