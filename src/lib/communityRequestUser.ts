import 'server-only'

import type { User } from '@supabase/supabase-js'
import { getRequestUser } from '@/lib/requestUser'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function getCommunityRequestUser(request: Request): Promise<User | null> {
  const user = await getRequestUser(request)
  if (!user?.email || user.app_metadata?.provider !== 'google') return null

  const [{ data: allowedUser }, { data: profile }] = await Promise.all([
    supabaseAdmin
      .from('allowed_users')
      .select('status, agreed_at')
      .ilike('email', user.email)
      .maybeSingle<{ status: 'active' | 'blocked'; agreed_at: string | null }>(),
    supabaseAdmin
      .from('user_profiles')
      .select('completed_at, reference_age')
      .eq('user_id', user.id)
      .maybeSingle<{ completed_at: string | null; reference_age: number | null }>(),
  ])

  if (
    allowedUser?.status !== 'active' ||
    !allowedUser.agreed_at ||
    !profile?.completed_at ||
    profile.reference_age === null ||
    profile.reference_age < 20 ||
    profile.reference_age > 59
  ) {
    return null
  }

  return user
}
