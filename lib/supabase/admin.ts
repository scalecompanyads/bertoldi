import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl } from '@/lib/supabase/env'

// Bypasses RLS — use only in Server Actions and API routes, never expose to client
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada.')
  }

  return createClient(getSupabaseUrl(), serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
