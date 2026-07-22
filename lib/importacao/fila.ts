// Processamento da fila de capas (importação em massa).
// Módulo comum — NÃO é server action: o cron chama direto com CRON_SECRET,
// e a action processarFilaCapaAction expõe para a equipe com checagem de papel.

import { createAdminClient } from '@/lib/supabase/admin'
import { identificarTribunal } from '@/lib/cnj-parser'
import { analisarProcesso } from '@/lib/scrapers'
import { revalidatePath } from 'next/cache'

const MAX_TENTATIVAS = 3

// Processa a fila dentro de um orçamento de tempo — a API do Datajud
// leva 30s+ em índices grandes, então cada item só começa se houver folga.
export async function processarFilaCapa(budgetMs = 240_000) {
  const admin = createAdminClient()
  const inicio = Date.now()

  const { data: pendentes } = await admin
    .from('fila_capa')
    .select('id, tentativas, processos:processo_id(id, cliente_id, numero_cnj, tribunal)')
    .eq('status', 'pendente')
    .order('criado_em')
    .limit(50)

  let processados = 0
  let falhas = 0

  for (const item of pendentes ?? []) {
    if (Date.now() - inicio > budgetMs - 60_000) break

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = (item as any).processos as { id: string; cliente_id: string; numero_cnj: string | null; tribunal: string | null } | null
    const agora = new Date().toISOString()

    async function marcarErro(msg: string, definitivo = false) {
      const esgotou = definitivo || item.tentativas + 1 >= MAX_TENTATIVAS
      await admin.from('fila_capa').update({
        tentativas: item.tentativas + 1,
        status: esgotou ? 'erro' : 'pendente',
        erro: msg,
        processado_em: agora,
      }).eq('id', item.id)
    }

    if (!p?.numero_cnj) {
      await marcarErro('Processo sem número CNJ', true)
      falhas++
      continue
    }

    const tribunalId = p.tribunal ?? identificarTribunal(p.numero_cnj)?.tribunal?.id
    if (!tribunalId) {
      await marcarErro('Tribunal não identificado pelo número CNJ', true)
      falhas++
      continue
    }

    const r = await analisarProcesso(p.numero_cnj, tribunalId)

    if (!r.encontrado) {
      await marcarErro(r.erro ?? 'Processo não encontrado na consulta automática')
      falhas++
      continue
    }

    if (r.capa) {
      // Datajud registra a data como dd/mm/aaaa; o banco espera date ISO
      const m = r.capa.dataAjuizamento?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
      await admin.from('processos').update({
        assunto: r.capa.assuntos?.length ? r.capa.assuntos.join(', ') : undefined,
        vara_orgao: r.capa.orgaoJulgador ?? undefined,
        data_ajuizamento: m ? `${m[3]}-${m[2]}-${m[1]}` : undefined,
        atualizado_em: agora,
      }).eq('id', p.id)
    }

    // Baseline de movimentação: o cron diário do Datajud passa a detectar novidades a partir daqui
    await admin.from('verificacoes_datajud').insert({
      processo_id: p.id,
      origem: 'automatica',
      houve_movimentacao: false,
      ultimo_andamento: r.ultimoAndamento ?? null,
      raw_response: { fonte: r.fonte, movimentos: r.movimentos ?? [], capa: r.capa ?? null },
    })

    await admin.from('fila_capa').update({
      status: 'concluido',
      erro: null,
      processado_em: agora,
      tentativas: item.tentativas + 1,
    }).eq('id', item.id)

    revalidatePath(`/admin/clientes/${p.cliente_id}/processos/${p.id}`)
    processados++
  }

  const { count: restantes } = await admin
    .from('fila_capa')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pendente')

  revalidatePath('/admin/importar')
  return { processados, falhas, restantes: restantes ?? 0 }
}
