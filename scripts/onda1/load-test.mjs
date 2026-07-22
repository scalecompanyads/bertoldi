import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import pg from 'pg'

const { Client } = pg
const url = process.env.DATABASE_URL_TEST
const quantidade = Number(process.env.LOAD_TEST_PROCESSOS ?? 5000)

if (!url) throw new Error('Defina DATABASE_URL_TEST para um banco isolado.')
if (process.env.LOAD_TEST_CONFIRM !== 'ISOLATED_DATABASE') {
  throw new Error('Defina LOAD_TEST_CONFIRM=ISOLATED_DATABASE para confirmar que o banco é descartável.')
}
if (!Number.isInteger(quantidade) || quantidade < 3000 || quantidade > 5000) {
  throw new Error('LOAD_TEST_PROCESSOS deve estar entre 3000 e 5000.')
}

const client = new Client({ connectionString: url, statement_timeout: 30_000 })
const runId = randomUUID()
const prefixo = `__onda1_${runId}_`
const clientes = Math.ceil(quantidade / 10)
const metricas = {}

function percentile(valores, percentil) {
  const ordenados = [...valores].sort((a, b) => a - b)
  return ordenados[Math.min(ordenados.length - 1, Math.ceil(percentil * ordenados.length) - 1)]
}

async function medir(nome, sql, params = [], repeticoes = 20) {
  const tempos = []
  for (let i = 0; i < repeticoes; i++) {
    const inicio = performance.now()
    await client.query(sql, params)
    tempos.push(performance.now() - inicio)
  }
  metricas[nome] = {
    p50_ms: Number(percentile(tempos, 0.5).toFixed(2)),
    p95_ms: Number(percentile(tempos, 0.95).toFixed(2)),
    max_ms: Number(Math.max(...tempos).toFixed(2)),
  }
}

try {
  await client.connect()

  const projetoAtual = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (projetoAtual) {
    const refAtual = new URL(projetoAtual).hostname.split('.')[0]
    if (new URL(url).hostname.includes(refAtual)) {
      throw new Error('DATABASE_URL_TEST aponta para o projeto Supabase atual; execução recusada.')
    }
  }

  await client.query('begin')
  const idsClientes = await client.query(
    `insert into public.clientes (nome, cpf_cnpj, email)
     select $1 || gs, 'T' || substr(md5($2 || gs::text), 1, 13), $1 || gs || '@example.invalid'
     from generate_series(1, $3) gs
     returning id`,
    [prefixo, runId, clientes]
  )

  const valores = []
  for (let i = 0; i < quantidade; i++) {
    const clienteId = idsClientes.rows[i % clientes].id
    const sequencial = String(i + 1).padStart(7, '0')
    const cnj = `${sequencial}-00.2026.8.26.0001`
    valores.push([clienteId, cnj, `Teste de carga ${i % 20}`, i % 4 === 0 ? 'em_andamento' : 'triagem'])
  }

  for (let offset = 0; offset < valores.length; offset += 500) {
    const lote = valores.slice(offset, offset + 500)
    const params = []
    const placeholders = lote.map((linha, indice) => {
      params.push(...linha)
      const base = indice * 4
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, current_date)`
    })
    await client.query(
      `insert into public.processos
       (cliente_id, numero_cnj, tipo_servico, status_interno, data_contratacao)
       values ${placeholders.join(',')}`,
      params
    )
  }
  await client.query('commit')

  await client.query('analyze public.clientes')
  await client.query('analyze public.processos')

  await medir(
    'listagem_processos_25',
    `select p.id, p.numero_cnj, c.nome
     from public.processos p join public.clientes c on c.id = p.cliente_id
     order by p.criado_em desc limit 25`
  )
  await medir(
    'busca_cnj',
    'select id from public.processos where numero_cnj = $1 limit 1',
    ['0002500-00.2026.8.26.0001']
  )
  await medir(
    'busca_nome_parcial',
    'select id from public.clientes where nome ilike $1 order by nome limit 25',
    [`%${prefixo.slice(0, 18)}%`]
  )
  await medir(
    'dashboard_counts',
    `select
       (select count(*) from public.clientes where arquivado = false),
       (select count(*) from public.processos),
       (select count(*) from public.processos where status_interno = 'em_andamento')`
  )

  const planos = {}
  for (const [nome, sql] of Object.entries({
    processos: 'select * from public.processos order by criado_em desc limit 25',
    clientes: `select * from public.clientes where nome ilike '%${prefixo.slice(0, 18)}%' limit 25`,
  })) {
    const resultado = await client.query(`explain (analyze, buffers, format json) ${sql}`)
    planos[nome] = resultado.rows[0]['QUERY PLAN']
  }

  const limites = {
    listagem_processos_25: 200,
    busca_cnj: 500,
    busca_nome_parcial: 800,
    dashboard_counts: 1000,
  }
  const aprovado = Object.entries(limites).every(([nome, limite]) => metricas[nome].p95_ms <= limite)
  const relatorio = {
    executado_em: new Date().toISOString(),
    processos: quantidade,
    clientes,
    metricas,
    limites_p95_ms: limites,
    aprovado,
    planos,
  }

  await mkdir(path.join(process.cwd(), 'docs', 'relatorios'), { recursive: true })
  const arquivo = path.join(process.cwd(), 'docs', 'relatorios', `onda1-carga-${new Date().toISOString().slice(0, 10)}.json`)
  await writeFile(arquivo, `${JSON.stringify(relatorio, null, 2)}\n`)
  console.log(JSON.stringify({ arquivo, aprovado, metricas }, null, 2))
  if (!aprovado) process.exitCode = 1
} finally {
  try {
    await client.query('rollback')
    await client.query('delete from public.clientes where nome like $1', [`${prefixo}%`])
  } finally {
    await client.end().catch(() => undefined)
  }
}
