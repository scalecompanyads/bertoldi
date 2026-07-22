import { NextResponse } from 'next/server'
import { enviarAlertasPrazo, enviarLembretesAudiencia } from '@/lib/prazos/alertas'

export const maxDuration = 60

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const prazos = await enviarAlertasPrazo()
    const audiencias = await enviarLembretesAudiencia()
    return NextResponse.json({ prazos, audiencias })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
