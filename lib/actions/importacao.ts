'use server'

// Importação em massa: cria clientes e processos a partir de linhas de CSV
// e enfileira a busca da capa no Datajud (processada pelo cron /api/cron/importacao,
// porque a API pública é lenta demais para rodar dentro do request).

import { createAdminClient } from '@/lib/supabase/admin'
import { assertEquipe } from '@/lib/actions/assert-equipe'
import { identificarTribunal, formatarNumeroCNJ, validarFormatoCNJ } from '@/lib/cnj-parser'
import { isValidCpf, normalizeCpfDigits } from '@/lib/cpf'
import { erroCpfDuplicado } from '@/lib/cliente-cpf'
import { processarFilaCapa } from '@/lib/importacao/fila'
import { revalidatePath } from 'next/cache'

export interface LinhaImportacao {
  numero_cnj: string
  cpf_cnpj: string
  nome: string
  tipo_servico: string
}

export interface ResultadoLinha {
  linha: number
  numero_cnj: string
  status: 'criado' | 'duplicado' | 'erro'
  mensagem?: string
  clienteNovo?: boolean
}

export interface ResultadoImportacao {
  ok?: true
  error?: string
  resultados?: ResultadoLinha[]
  criados?: number
  duplicados?: number
  erros?: number
  clientesNovos?: number
}

function validarDocumento(digits: string): string | null {
  if (digits.length === 11) {
    return isValidCpf(digits) ? null : 'CPF inválido (dígito verificador não confere)'
  }
  if (digits.length === 14) return null // CNPJ: aceita pelo tamanho
  return 'CPF/CNPJ deve ter 11 ou 14 dígitos'
}

export async function importarLote(linhas: LinhaImportacao[]): Promise<ResultadoImportacao> {
  const auth = await assertEquipe()
  if ('error' in auth) return { error: auth.error }
  if (!linhas.length) return { error: 'Nenhuma linha para importar.' }
  if (linhas.length > 500) return { error: 'Máximo de 500 linhas por lote. Divida a planilha.' }

  const admin = createAdminClient()
  const hoje = new Date().toISOString().slice(0, 10)

  // Processos já cadastrados — evita duplicar na re-importação
  const numeros = linhas
    .map(l => formatarNumeroCNJ(l.numero_cnj.trim()))
    .filter(n => validarFormatoCNJ(n))
  const { data: existentes } = await admin
    .from('processos')
    .select('numero_cnj')
    .in('numero_cnj', numeros)
  const jaCadastrados = new Set((existentes ?? []).map(p => p.numero_cnj))

  // Clientes existentes, indexados pelos dígitos do CPF/CNPJ
  const { data: clientes } = await admin
    .from('clientes')
    .select('id, cpf_cnpj')
    .not('cpf_cnpj', 'is', null)
  const clientePorDoc = new Map<string, string>()
  for (const c of clientes ?? []) {
    const digits = normalizeCpfDigits(c.cpf_cnpj ?? '')
    if (digits) clientePorDoc.set(digits, c.id)
  }

  const resultados: ResultadoLinha[] = []
  let clientesNovos = 0

  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i]
    const numeroCnj = formatarNumeroCNJ(l.numero_cnj.trim())
    const linha = i + 1

    if (!validarFormatoCNJ(numeroCnj)) {
      resultados.push({ linha, numero_cnj: l.numero_cnj, status: 'erro', mensagem: 'Número CNJ em formato inválido' })
      continue
    }
    if (jaCadastrados.has(numeroCnj)) {
      resultados.push({ linha, numero_cnj: numeroCnj, status: 'duplicado', mensagem: 'Processo já cadastrado no sistema' })
      continue
    }
    if (!l.tipo_servico?.trim()) {
      resultados.push({ linha, numero_cnj: numeroCnj, status: 'erro', mensagem: 'Tipo de serviço vazio' })
      continue
    }

    const doc = normalizeCpfDigits(l.cpf_cnpj ?? '')
    const erroDoc = validarDocumento(doc)
    if (erroDoc) {
      resultados.push({ linha, numero_cnj: numeroCnj, status: 'erro', mensagem: erroDoc })
      continue
    }

    // Cliente: reaproveita pelo CPF/CNPJ ou cria (aí o nome é obrigatório)
    let clienteId = clientePorDoc.get(doc)
    let clienteNovo = false
    if (!clienteId) {
      if (!l.nome?.trim()) {
        resultados.push({ linha, numero_cnj: numeroCnj, status: 'erro', mensagem: 'Cliente não cadastrado e sem nome na planilha' })
        continue
      }
      const { data: novo, error: errCliente } = await admin
        .from('clientes')
        .insert({ nome: l.nome.trim(), cpf_cnpj: doc, atualizado_por: auth.userId })
        .select('id')
        .single()
      if (errCliente || !novo) {
        const msg = errCliente?.message ?? 'Erro desconhecido'
        resultados.push({
          linha,
          numero_cnj: numeroCnj,
          status: 'erro',
          mensagem: erroCpfDuplicado(msg) ?? `Erro ao criar cliente: ${msg}`,
        })
        continue
      }
      clienteId = novo.id as string
      clientePorDoc.set(doc, clienteId)
      clienteNovo = true
      clientesNovos++
    }

    const tribunal = identificarTribunal(numeroCnj)?.tribunal?.id ?? null

    const { data: processo, error: errProcesso } = await admin
      .from('processos')
      .insert({
        cliente_id: clienteId,
        numero_cnj: numeroCnj,
        tribunal,
        tipo_servico: l.tipo_servico.trim(),
        status_interno: 'em_andamento',
        data_contratacao: hoje,
        atualizado_por: auth.userId,
      })
      .select('id')
      .single()

    if (errProcesso || !processo) {
      resultados.push({ linha, numero_cnj: numeroCnj, status: 'erro', mensagem: `Erro ao criar processo: ${errProcesso?.message}` })
      continue
    }

    jaCadastrados.add(numeroCnj)

    // Enfileira a busca da capa — falha aqui não invalida a importação
    const { error: errFila } = await admin.from('fila_capa').insert({ processo_id: processo.id })
    if (errFila) console.error(`[importacao] Erro ao enfileirar capa do processo ${processo.id}:`, errFila)

    resultados.push({ linha, numero_cnj: numeroCnj, status: 'criado', clienteNovo })
  }

  revalidatePath('/admin/processos')
  revalidatePath('/admin/clientes')
  revalidatePath('/admin/importar')

  return {
    ok: true,
    resultados,
    criados: resultados.filter(r => r.status === 'criado').length,
    duplicados: resultados.filter(r => r.status === 'duplicado').length,
    erros: resultados.filter(r => r.status === 'erro').length,
    clientesNovos,
  }
}

// Botão "Processar fila agora" — a lógica vive em lib/importacao/fila.ts,
// compartilhada com o cron. Server actions são endpoints públicos, então
// aqui a checagem de equipe é obrigatória.
export async function processarFilaCapaAction() {
  const auth = await assertEquipe()
  if ('error' in auth) return { error: auth.error }
  // Orçamento curto: roda dentro do request da tela, não do cron
  return processarFilaCapa(50_000)
}
