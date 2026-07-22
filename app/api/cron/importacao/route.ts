import { NextResponse } from 'next/server'
import { processarFilaCapa } from '@/lib/importacao/fila'

// Cada consulta ao Datajud pode levar 30s+ — precisa do teto
export const maxDuration = 300

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const resultado = await processarFilaCapa(240_000)
    return NextResponse.json(resultado)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
