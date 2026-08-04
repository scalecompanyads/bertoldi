import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseAnonKey, getSupabaseUrl, supabaseConfigurado } from '@/lib/supabase/env'

export async function updateSession(request: NextRequest) {
  if (!supabaseConfigurado()) {
    console.error('[proxy] Variáveis Supabase ausentes (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY)')
    const login = new URL('/login', request.url)
    login.searchParams.set('erro', 'supabase')
    return NextResponse.redirect(login)
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser().catch((err) => {
    console.error('[proxy] Falha ao validar sessão Supabase:', err)
    return { data: { user: null } }
  })

  const { pathname } = request.nextUrl

  // Rota /admin — só equipe (admin, advogado, secretaria)
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Rota /cliente — só clientes autenticados
  if (pathname.startsWith('/cliente')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return supabaseResponse
}
