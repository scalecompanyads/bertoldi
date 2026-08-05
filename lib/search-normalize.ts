/** Normaliza texto para busca (minúsculas, sem acentos). */
export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

export function matchesSearch(query: string, ...fields: (string | null | undefined)[]): boolean {
  const q = normalizeSearch(query.trim())
  if (!q) return true
  return fields.some((f) => f && normalizeSearch(f).includes(q))
}
