import { createClient } from '@/lib/supabase/server'
import { Globe, User } from 'lucide-react'
import { ComunicadoForm } from '@/components/admin/comunicado-form'
import { RemoverComunicadoBtn } from '@/components/admin/remover-comunicado-btn'
import type { Comunicado, Cliente } from '@/lib/types'

export default async function ComunicadosPage() {
  const supabase = await createClient()

  const [{ data: comunicados }, { data: clientes }] = await Promise.all([
    supabase
      .from('comunicados')
      .select('*, cliente:cliente_id(id, nome), destinatarios:comunicado_destinatarios(cliente_id, lido_em, email_enviado_em)')
      .order('enviado_em', { ascending: false }),
    supabase.from('clientes').select('id, nome').eq('arquivado', false).order('nome'),
  ])

  const lista = (comunicados ?? []) as (
    Comunicado & {
      cliente: Pick<Cliente, 'id' | 'nome'> | null
      destinatarios: { cliente_id: string; lido_em: string | null; email_enviado_em: string | null }[]
    }
  )[]
  const naoLidos = lista.reduce(
    (total, comunicado) => total + comunicado.destinatarios.filter(destinatario => !destinatario.lido_em).length,
    0
  )

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold">Comunicados</h1>
        {naoLidos > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            {naoLidos} {naoLidos === 1 ? 'aviso não lido' : 'avisos não lidos'}
          </p>
        )}
      </div>

      <ComunicadoForm clientes={(clientes ?? []) as Pick<Cliente, 'id' | 'nome'>[]} />

      {lista.length > 0 ? (
        <div className="space-y-2">
          {lista.map((c) => {
            const destinatariosNaoLidos = c.destinatarios.filter(destinatario => !destinatario.lido_em).length
            const emailsEnviados = c.destinatarios.filter(destinatario => !!destinatario.email_enviado_em).length
            return (
            <div
              key={c.id}
              className={`rounded-lg border p-4 space-y-1.5 ${destinatariosNaoLidos > 0 ? 'border-primary/40 bg-primary/5' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {c.cliente ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <User className="h-3 w-3" />
                      {c.cliente.nome}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      Global
                    </span>
                  )}
                  {destinatariosNaoLidos > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">
                      {destinatariosNaoLidos} de {c.destinatarios.length} não lido{destinatariosNaoLidos === 1 ? '' : 's'}
                    </span>
                  )}
                </div>
                <RemoverComunicadoBtn comunicadoId={c.id} />
              </div>
              <p className="text-sm font-semibold">{c.titulo}</p>
              <p className="text-sm text-muted-foreground">{c.mensagem}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(c.enviado_em).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
                {' · '}{c.destinatarios.length} destinatário{c.destinatarios.length === 1 ? '' : 's'}
                {emailsEnviados > 0 && ` · ${emailsEnviados} por e-mail`}
              </p>
            </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-8 text-center">Nenhum comunicado enviado ainda.</p>
      )}
    </div>
  )
}
