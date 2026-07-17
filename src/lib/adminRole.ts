import 'server-only'

import type { User } from '@supabase/supabase-js'
import { isAdminEmail } from '@/lib/adminIdentity'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type AdminRoleRow = {
  user_id: string
  is_active: boolean
}

export async function isAdminUser(user: User | null | undefined) {
  if (!user?.email) return false

  const { data: roleByUser, error: roleByUserError } = await supabaseAdmin
    .from('admin_roles')
    .select('user_id, is_active')
    .eq('user_id', user.id)
    .maybeSingle<AdminRoleRow>()

  if (!roleByUserError && roleByUser?.is_active) return true

  const { data: roleByEmail, error: roleByEmailError } = await supabaseAdmin
    .from('admin_roles')
    .select('user_id, is_active')
    .ilike('email', user.email)
    .maybeSingle<AdminRoleRow>()

  if (!roleByEmailError && roleByEmail?.is_active) return true

  // ADMIN_EMAILS is a rollout bootstrap only. The first successful request
  // materializes the role in the server-authoritative table.
  if (!isAdminEmail(user.email)) return false

  const { error: bootstrapError } = await supabaseAdmin.from('admin_roles').upsert({
    user_id: user.id,
    email: user.email.trim().toLowerCase(),
    role: 'owner',
    is_active: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  if (bootstrapError) {
    console.warn('admin_role_bootstrap_failed', bootstrapError.message)
  }

  return true
}
