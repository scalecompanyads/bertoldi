import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error_description') ?? searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?erro=${encodeURIComponent(error)}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      return NextResponse.redirect(
        `${origin}/login?erro=${encodeURIComponent('Link inválido ou expirado.')}`
      )
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
