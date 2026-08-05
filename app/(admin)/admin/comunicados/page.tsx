import { createClient } from '@/lib/supabase/server'
import { Briefcase, Globe, Scale, User, Users } from 'lucide-react'
import { ComunicadoForm } from '@/components/admin/comunicado-form'
import { MarcarComunicadoEquipeLidoBtn } from '@/components/admin/marcar-comunicado-equipe-lido-btn'
import { RemoverComunicadoBtn } from '@/components/admin/remover-comunicado-btn'
import type { Comunicado, ComunicadoDestinatarioUsuario, Cliente, PublicoComunicado } from '@/lib/types'

const PUBLICO_BADGE: Record<
  PublicoComunicado,
  { label: string; icon: typeof Globe }
> = {
  todos: { label: 'Todos', icon: Users },
  advogados: { label: 'Advogados', icon: Scale },
  clientes: { label: 'Clientes', icon: User },
}

export default async function ComunicadosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: comunicados }, { data: clientes }, { data: eu }] = await Promise.all([
    supabase
      .from('comunicados')
      .select(`
        *,
        cliente:cliente_id(id, nome),
        destinatarios:comunicado_destinatarios(cliente_id, lido_em, email_enviado_em),
        destinatarios_usuario:comunicado_destinatarios_usuario(usuario_id, lido_em, email_enviado_em)
      `)
      .order('enviado_em', { ascending: false }),
    supabase.from('clientes').select('id, nome, cpf_cnpj').eq('arquivado', false).order('nome'),
    user
      ? supabase.from('usuarios').select('papel').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
  ])

  const isAdmin = eu?.papel === 'admin'

  const [{ data: meusAvisos }] = user
    ? await Promise.all([
        supabase
          .from('comunicado_destinatarios_usuario')
          .select('lido_em, comunicado:comunicado_id(*)')
          .eq('usuario_id', user.id)
          .order('criado_em', { ascending: false }),
      ])
    : [{ data: null }]

  const lista = (comunicados ?? []) as (
    Comunicado & {
      publico: PublicoComunicado
      cliente: Pick<Cliente, 'id' | 'nome'> | null
      destinatarios: { cliente_id: string; lido_em: string | null; email_enviado_em: string | null }[]
      destinatarios_usuario: { usuario_id: string; lido_em: string | null; email_enviado_em: string | null }[]
    }
  )[]

  const avisosEquipe = ((meusAvisos ?? []) as unknown as (Pick<ComunicadoDestinatarioUsuario, 'lido_em'> & {
    comunicado: Comunicado | null
  })[])
    .filter((item): item is Pick<ComunicadoDestinatarioUsuario, 'lido_em'> & { comunicado: Comunicado } =>
      Boolean(item.comunicado)
    )

  const naoLidosClientes = lista.reduce(
    (total, c) => total + c.destinatarios.filter((d) => !d.lido_em).length,
    0
  )
  const naoLidosEquipe = avisosEquipe.filter((a) => !a.lido_em).length

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold">Comunicados</h1>
        {(naoLidosClientes > 0 || naoLidosEquipe > 0) && (
          <p className="text-sm text-muted-foreground mt-1">
            {naoLidosClientes > 0 && (
              <>
                {naoLidosClientes} aviso{naoLidosClientes === 1 ? '' : 's'} de cliente não lido
                {naoLidosClientes === 1 ? '' : 's'}
              </>
            )}
            {naoLidosClientes > 0 && naoLidosEquipe > 0 && ' · '}
            {naoLidosEquipe > 0 && (
              <>
                {naoLidosEquipe} seu aviso interno{naoLidosEquipe === 1 ? '' : 's'} não lido
                {naoLidosEquipe === 1 ? '' : 's'}
              </>
            )}
          </p>
        )}
      </div>

      {avisosEquipe.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            Seus avisos internos
          </h2>
          <div className="space-y-2">
            {avisosEquipe.map(({ comunicado: c, lido_em }) => (
              <div
                key={c.id}
                className={`rounded-lg border p-4 space-y-2 ${!lido_em ? 'border-primary/40 bg-primary/5' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{c.titulo}</p>
                  {!lido_em && <MarcarComunicadoEquipeLidoBtn comunicadoId={c.id} />}
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{c.mensagem}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(c.enviado_em).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <ComunicadoForm
        clientes={(clientes ?? []) as Pick<Cliente, 'id' | 'nome'>[]}
        isAdmin={isAdmin}
      />

      {lista.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Histórico enviado</h2>
          {lista.map((c) => {
            const publico = c.publico ?? 'clientes'
            const badge = PUBLICO_BADGE[publico]
            const BadgeIcon = badge.icon
            const totalDest = c.destinatarios.length + c.destinatarios_usuario.length
            const naoLidos =
              c.destinatarios.filter((d) => !d.lido_em).length +
              c.destinatarios_usuario.filter((d) => !d.lido_em).length
            const emailsEnviados =
              c.destinatarios.filter((d) => !!d.email_enviado_em).length +
              c.destinatarios_usuario.filter((d) => !!d.email_enviado_em).length

            return (
              <div
                key={c.id}
                className={`rounded-lg border p-4 space-y-1.5 ${naoLidos > 0 ? 'border-primary/40 bg-primary/5' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <BadgeIcon className="h-3 w-3" />
                      {badge.label}
                    </span>
                    {publico === 'clientes' && c.cliente && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <User className="h-3 w-3" />
                        {c.cliente.nome}
                      </span>
                    )}
                    {publico === 'clientes' && !c.cliente && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        Todos os clientes
                      </span>
                    )}
                    {naoLidos > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">
                        {naoLidos} de {totalDest} não lido{naoLidos === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                  <RemoverComunicadoBtn comunicadoId={c.id} />
                </div>
                <p className="text-sm font-semibold">{c.titulo}</p>
                <p className="text-sm text-muted-foreground">{c.mensagem}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(c.enviado_em).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {' · '}
                  {totalDest} destinatário{totalDest === 1 ? '' : 's'}
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
