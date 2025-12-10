import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

// Singleton instance to avoid multiple clients warning
let supabaseInstance: SupabaseClient | null = null

export function createClient() {
  // If client already exists, reuse it instead of creating a new one
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Create new client only once
  supabaseInstance = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return supabaseInstance
}
