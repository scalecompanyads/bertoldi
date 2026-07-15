// As fontes de verificação (Datajud, eSAJ) formatam o mesmo andamento de
// jeitos diferentes ("12/05/2026 — Conclusos" vs "Conclusos - 12/05/2026"),
// o que gerava falso houve_movimentacao ao alternar de fonte. Comparamos
// ignorando datas, pontuação de separação e caixa.
export function normalizarAndamento(texto: string | null | undefined): string {
  if (!texto) return ''
  return texto
    .replace(/\d{2}\/\d{2}\/\d{4}/g, '')
    .replace(/[—–\-·|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function mesmoAndamento(a: string | null | undefined, b: string | null | undefined): boolean {
  return normalizarAndamento(a) === normalizarAndamento(b)
}
