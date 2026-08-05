import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ShieldAlert } from 'lucide-react'
import { MembroEquipeCard } from '@/components/admin/membro-equipe-card'
import { ConvidarMembroForm } from '@/components/admin/convidar-membro-form'
import type { Usuario } from '@/lib/types'

export default async function EquipePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: eu } = await supabase
    .from('usuarios')
    .select('papel')
    .eq('id', user.id)
    .single()

  if (eu?.papel !== 'admin') {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center max-w-md mx-auto">
        <ShieldAlert className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm font-medium">Acesso restrito</p>
        <p className="text-sm text-muted-foreground">
          Apenas administradores podem gerenciar a equipe. Fale com o responsável pelo escritório.
        </p>
      </div>
    )
  }

  // Admin client: a RLS de usuarios só permite leitura própria + admin,
  // mas a listagem completa via service role simplifica e o acesso já foi validado acima
  const admin = createAdminClient()
  const { data: membros } = await admin
    .from('usuarios')
    .select('id, nome, email, papel, oab_numero, oab_uf, criado_em')
    .neq('papel', 'cliente')
    .order('nome')

  const lista = (membros ?? []) as Usuario[]
  const semOab = lista.filter(m => m.papel !== 'secretaria' && !m.oab_numero).length

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold">Equipe</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Membros do escritório, papéis de acesso e OAB para o monitor de intimações
        </p>
        {semOab > 0 && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
            {semOab} {semOab === 1 ? 'advogado sem OAB cadastrada' : 'advogados sem OAB cadastrada'} — as
            intimações deles não estão sendo monitoradas.
          </p>
        )}
      </div>

      <ConvidarMembroForm />

      <div className="space-y-2">
        {lista.map(m => (
          <MembroEquipeCard key={m.id} membro={m} usuarioAtualId={user.id} />
        ))}
      </div>
    </div>
  )
}
