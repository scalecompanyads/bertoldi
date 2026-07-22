import type { CalendarioForenseDia } from '@/lib/types'

function dataLocal(iso: string): Date {
  const [ano, mes, dia] = iso.split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}

function chave(data: Date): string {
  const pad = (valor: number) => String(valor).padStart(2, '0')
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`
}

export function expandirDiasNaoUteis(dias: Pick<CalendarioForenseDia, 'data_inicio' | 'data_fim'>[]): Set<string> {
  const resultado = new Set<string>()
  for (const item of dias) {
    const cursor = dataLocal(item.data_inicio)
    const fim = dataLocal(item.data_fim)
    while (cursor.getTime() <= fim.getTime()) {
      resultado.add(chave(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
  }
  return resultado
}

export function diasExcluidosEntre(
  dias: CalendarioForenseDia[],
  inicio: Date,
  fim: Date
): CalendarioForenseDia[] {
  const inicioMs = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate()).getTime()
  const fimMs = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate()).getTime()
  return dias.filter(item => {
    const itemInicio = dataLocal(item.data_inicio).getTime()
    const itemFim = dataLocal(item.data_fim).getTime()
    return itemFim >= inicioMs && itemInicio <= fimMs
  })
}
