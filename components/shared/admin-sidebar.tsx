'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, LogOut, Scale } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const NAV = [
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
]

function SidebarIcon({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg transition-colors', className)}>
      {children}
    </span>
  )
}

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function sair() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="flex h-full w-14 flex-col items-center border-r bg-card py-4 gap-2">
      <Link
        href="/admin"
        className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"
        aria-label="Início"
      >
        <Scale className="h-5 w-5" aria-hidden />
      </Link>

      {NAV.map(({ href, label, icon: Icon }) => (
        <Tooltip key={href}>
          <TooltipTrigger render={
            <Link
              href={href}
              aria-label={label}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                pathname.startsWith(href)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
            </Link>
          } />
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      ))}

      <div className="mt-auto">
        <Tooltip>
          <TooltipTrigger
            onClick={sair}
            aria-label="Sair"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
          </TooltipTrigger>
          <TooltipContent side="right">Sair</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  )
}
