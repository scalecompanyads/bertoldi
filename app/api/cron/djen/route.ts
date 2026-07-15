import { NextResponse } from 'next/server'
import { sincronizarIntimacoes } from '@/lib/actions/intimacoes'

// Vários advogados × várias páginas da API — precisa de folga
export const maxDuration = 300

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    // 5 dias retroativos: cobre fim de semana e eventuais falhas de execução
    const resultado = await sincronizarIntimacoes(5)
    return NextResponse.json(resultado, { status: resultado.error ? 500 : 200 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
