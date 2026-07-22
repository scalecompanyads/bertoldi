import { ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CalendariosAdmin } from '@/components/admin/calendarios-admin'
import type { CalendarioForense } from '@/lib/types'

export default async function CalendariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: usuario } = user
    ? await supabase.from('usuarios').select('papel').eq('id', user.id).single()
    : { data: null }

  if (usuario?.papel !== 'admin') {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-2 py-16 text-center">
        <ShieldAlert className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm font-medium">Acesso restrito</p>
        <p className="text-sm text-muted-foreground">
          Apenas administradores podem publicar calendários forenses.
        </p>
      </div>
    )
  }

  const { data: calendarios } = await supabase
    .from('calendarios_forenses')
    .select(`
      *,
      versao_ativa:calendario_forense_versoes!calendarios_versao_ativa_fk(
        *, dias:calendario_forense_dias(*)
      ),
      versoes:calendario_forense_versoes!calendario_id(
        *, dias:calendario_forense_dias(*)
      )
    `)
    .order('nome')

  const lista = (calendarios ?? []) as unknown as CalendarioForense[]
  for (const calendario of lista) {
    calendario.versoes = (calendario.versoes ?? []).sort((a, b) => b.versao - a.versao)
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Calendários forenses</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Feriados locais, suspensões e recessos com versão e fonte oficial.
        </p>
      </div>
      <CalendariosAdmin calendarios={lista} />
    </div>
  )
}
