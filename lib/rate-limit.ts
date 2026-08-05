/** Rate limit em memória (por instância). Complementa os limites nativos do Supabase Auth. */

const buckets = new Map<string, number[]>()

export function consumirRateLimit(
  chave: string,
  maximo: number,
  janelaMs: number
): boolean {
  const agora = Date.now()
  const hits = (buckets.get(chave) ?? []).filter((t) => agora - t < janelaMs)
  if (hits.length >= maximo) return false
  hits.push(agora)
  buckets.set(chave, hits)
  return true
}
