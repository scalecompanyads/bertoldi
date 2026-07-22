// Cálculo de prazos em dias úteis (item 1.3 do MELHORIAS.md).
// Módulo puro (sem dependência de servidor) — usado no cliente para sugerir a
// data ao criar tarefa de intimação e no servidor para colorir alertas.
//
// Feriados: tabela local dos nacionais (fixos + móveis calculados pela Páscoa).
// NÃO cobre feriados estaduais/municipais nem recesso forense — por isso a
// data sugerida é sempre confirmada pelo advogado antes de salvar.

// Páscoa pelo algoritmo de Meeus/Jones/Butcher (calendário gregoriano)
function pascoa(ano: number): Date {
  const a = ano % 19
  const b = Math.floor(ano / 100)
  const c = ano % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31) // 3 = março, 4 = abril
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(ano, mes - 1, dia)
}

function chave(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const cacheFeriados = new Map<number, Set<string>>()

// Feriados nacionais do ano (fixos + móveis)
export function feriadosNacionais(ano: number): Set<string> {
  const memo = cacheFeriados.get(ano)
  if (memo) return memo

  const fixos = [
    `${ano}-01-01`, // Confraternização Universal
    `${ano}-04-21`, // Tiradentes
    `${ano}-05-01`, // Dia do Trabalho
    `${ano}-09-07`, // Independência
    `${ano}-10-12`, // Nossa Senhora Aparecida
    `${ano}-11-02`, // Finados
    `${ano}-11-15`, // Proclamação da República
    `${ano}-11-20`, // Consciência Negra (nacional desde 2024)
    `${ano}-12-25`, // Natal
  ]

  const p = pascoa(ano)
  const mover = (dias: number) => {
    const d = new Date(p)
    d.setDate(d.getDate() + dias)
    return chave(d)
  }
  const moveis = [
    mover(-48), // Segunda de Carnaval
    mover(-47), // Terça de Carnaval
    mover(-2),  // Sexta-feira Santa
    mover(60),  // Corpus Christi
  ]

  const set = new Set([...fixos, ...moveis])
  cacheFeriados.set(ano, set)
  return set
}

export function isDiaUtil(d: Date): boolean {
  const dow = d.getDay()
  if (dow === 0 || dow === 6) return false
  return !feriadosNacionais(d.getFullYear()).has(chave(d))
}

// Próximo dia útil estritamente depois de `d`
export function proximoDiaUtil(d: Date): Date {
  const r = new Date(d)
  do {
    r.setDate(r.getDate() + 1)
  } while (!isDiaUtil(r))
  return r
}

// Avança `dias` dias úteis a partir de `d` (exclusivo — o próprio `d` não conta)
export function adicionarDiasUteis(d: Date, dias: number): Date {
  let r = new Date(d)
  for (let i = 0; i < dias; i++) r = proximoDiaUtil(r)
  return r
}

// Dias úteis restantes até `prazo` (0 = vence hoje; negativo = vencido).
// Conta os dias úteis estritamente depois de hoje até a data do prazo.
export function diasUteisRestantes(prazo: Date, hoje = new Date()): number {
  const ini = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  const fim = new Date(prazo.getFullYear(), prazo.getMonth(), prazo.getDate())
  if (fim.getTime() < ini.getTime()) return -1
  let count = 0
  const cursor = new Date(ini)
  while (cursor.getTime() < fim.getTime()) {
    cursor.setDate(cursor.getDate() + 1)
    if (isDiaUtil(cursor)) count++
  }
  return count
}

// Vencimento de um prazo processual contado da disponibilização no DJEN,
// na sistemática do CPC (arts. 224 e 231 c/c Lei 11.419/2006, art. 4º §§ 3º-4º):
//   - disponibilizado no dia D → considera-se publicado no 1º dia útil seguinte;
//   - o prazo começa no 1º dia útil seguinte à publicação;
//   - contam-se só os dias úteis, incluindo o dia do vencimento.
// `disponibilizacao` em formato aaaa-mm-dd (date pura, sem hora).
export function vencimentoPrazoDJEN(disponibilizacao: string, diasUteis: number): Date {
  const [a, m, d] = disponibilizacao.split('-').map(Number)
  const disp = new Date(a, m - 1, d)
  const publicacao = proximoDiaUtil(disp)
  const inicio = proximoDiaUtil(publicacao)
  // O dia do início é o 1º dia do prazo
  return diasUteis <= 1 ? inicio : adicionarDiasUteis(inicio, diasUteis - 1)
}
