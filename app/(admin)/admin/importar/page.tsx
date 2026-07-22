import { createAdminClient } from '@/lib/supabase/admin'
import { ImportacaoForm } from '@/components/admin/importacao-form'
import { ProcessarFilaBtn } from '@/components/admin/processar-fila-btn'

// A fila muda a cada execução do cron — sempre renderiza fresco
export const dynamic = 'force-dynamic'

export default async function ImportarPage() {
  // Acesso de equipe já garantido pelo layout do /admin
  const admin = createAdminClient()

  const contar = async (status: string) => {
    const { count } = await admin
      .from('fila_capa')
      .select('id', { count: 'exact', head: true })
      .eq('status', status)
    return count ?? 0
  }
  const [pendentes, concluidos, comErro] = await Promise.all([
    contar('pendente'), contar('concluido'), contar('erro'),
  ])

  const { data: errosFila } = comErro > 0
    ? await admin
        .from('fila_capa')
        .select('erro, processos:processo_id(numero_cnj)')
        .eq('status', 'erro')
        .order('processado_em', { ascending: false })
        .limit(10)
    : { data: null }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold">Importação em massa</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Suba a planilha com os processos do escritório — clientes e processos são criados na hora,
          e a capa (assunto, vara, data de ajuizamento) é preenchida automaticamente pelo tribunal em segundo plano.
        </p>
      </div>

      <ImportacaoForm />

      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-semibold">Preenchimento das capas</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pendentes > 0
                ? `${pendentes} ${pendentes === 1 ? 'processo aguardando' : 'processos aguardando'} consulta ao tribunal — o robô processa de hora em hora.`
                : 'Nenhum processo aguardando consulta.'}
              {concluidos > 0 && ` ${concluidos} já ${concluidos === 1 ? 'preenchido' : 'preenchidos'}.`}
            </p>
          </div>
          {pendentes > 0 && <ProcessarFilaBtn />}
        </div>

        {errosFila && errosFila.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-red-600 dark:text-red-400">
              {comErro} {comErro === 1 ? 'processo não pôde ser consultado' : 'processos não puderam ser consultados'} (preencha a capa manualmente):
            </p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {errosFila.map((e, i) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const numero = ((e as any).processos?.numero_cnj as string) ?? '—'
                return <li key={i} className="font-mono">{numero} <span className="font-sans">— {e.erro}</span></li>
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
