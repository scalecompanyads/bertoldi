import { createClient } from '@/lib/supabase/server'
import { Bell } from 'lucide-react'
import { MarcarLidoBtn } from '@/components/cliente/marcar-lido-btn'
import type { Comunicado, ComunicadoDestinatario } from '@/lib/types'

export default async function ClienteComunicadosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: cliente } = await supabase
    .from('clientes')
    .select('id')
    .eq('usuario_id', user!.id)
    .single()

  if (!cliente) {
    return (
      <div className="py-16 text-center space-y-2">
        <Bell className="h-10 w-10 mx-auto text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Nenhum aviso disponível.</p>
      </div>
    )
  }

  const { data: destinatarios } = await supabase
    .from('comunicado_destinatarios')
    .select('lido_em, comunicado:comunicado_id(*)')
    .eq('cliente_id', cliente.id)

  const lista = ((destinatarios ?? []) as unknown as (
    Pick<ComunicadoDestinatario, 'lido_em'> & { comunicado: Comunicado | null }
  )[])
    .filter((item): item is Pick<ComunicadoDestinatario, 'lido_em'> & { comunicado: Comunicado } => !!item.comunicado)
    .sort((a, b) => b.comunicado.enviado_em.localeCompare(a.comunicado.enviado_em))
  const naoLidos = lista.filter(item => !item.lido_em).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Avisos</h1>
        {naoLidos > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">
            {naoLidos} novo{naoLidos > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {lista.length > 0 ? (
        <div className="space-y-3">
          {lista.map(({ comunicado: c, lido_em }) => (
            <div
              key={c.id}
              className={`rounded-xl border bg-card p-4 space-y-2 ${!lido_em ? 'border-primary/40 bg-primary/5' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm">{c.titulo}</p>
                {!lido_em && <MarcarLidoBtn comunicadoId={c.id} />}
              </div>
              <p className="text-sm text-muted-foreground">{c.mensagem}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(c.enviado_em).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center space-y-2">
          <Bell className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Nenhum aviso por enquanto.</p>
        </div>
      )}
    </div>
  )
}
