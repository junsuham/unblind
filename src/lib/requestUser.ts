import type { User } from '@supabase/supabase-js'
import { createServerSupabase } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function getRequestUser(request: Request): Promise<User | null> {
  const authorization = request.headers.get('authorization')

  if (authorization?.startsWith('Bearer ')) {
    const accessToken = authorization.slice('Bearer '.length).trim()

    if (!accessToken) return null

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(accessToken)

    return error ? null : user
  }

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}
