import 'server-only'

import type { User } from '@supabase/supabase-js'
import { isAdminEmail } from '@/lib/adminIdentity'
import { bootstrapAdminRoleDecision, storedAdminRoleDecision } from '@/lib/adminRolePolicy'
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

  const userDecision = storedAdminRoleDecision(roleByUser, Boolean(roleByUserError))
  // A revoked role must not be reactivated by the rollout email bootstrap.
  if (userDecision !== null) return userDecision

  const { data: roleByEmail, error: roleByEmailError } = await supabaseAdmin
    .from('admin_roles')
    .select('user_id, is_active')
    .ilike('email', user.email)
    .maybeSingle<AdminRoleRow>()

  const emailDecision = storedAdminRoleDecision(roleByEmail, Boolean(roleByEmailError))
  if (emailDecision !== null) return emailDecision

  // ADMIN_EMAILS is a rollout bootstrap only. The first successful request
  // materializes the role in the server-authoritative table.
  const bootstrapEmail = isAdminEmail(user.email)
  if (!bootstrapEmail) return false

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

  return bootstrapAdminRoleDecision(bootstrapEmail, Boolean(bootstrapError))
}
