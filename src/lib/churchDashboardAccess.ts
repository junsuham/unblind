import 'server-only'

import type { User } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { isChurchDashboardTarget, matchesChurchDashboardScope, type ChurchDashboardScope } from '@/lib/churchDashboardScope'

type AccessRow = ChurchDashboardScope & { is_active: boolean; verified_department: boolean }

type ProfileRow = {
  completed_at: string | null
  reference_age: number | null
  church_name: string | null
  church_place_id: string | null
  church_department: string | null
  church_info_consent_at: string | null
}

type AllowedRow = {
  status: string
  agreed_at: string | null
}

/** A server-authoritative role check. App administrators get no implicit access. */
export async function getChurchDashboardAccess(user: User | null | undefined): Promise<ChurchDashboardScope | null> {
  if (!user?.email || user.app_metadata?.provider !== 'google') return null

  const [accessResult, profileResult, allowedResult] = await Promise.all([
    supabaseAdmin
      .from('church_dashboard_access')
      .select('church_place_id, church_name, department, verified_department, is_active')
      .eq('user_id', user.id)
      .maybeSingle<{ church_place_id: string; church_name: string; department: string | null; verified_department: boolean; is_active: boolean }>(),
    supabaseAdmin
      .from('user_profiles')
      .select('completed_at, reference_age, church_name, church_place_id, church_department, church_info_consent_at')
      .eq('user_id', user.id)
      .maybeSingle<ProfileRow>(),
    supabaseAdmin
      .from('allowed_users')
      .select('status, agreed_at')
      .eq('email', user.email.trim().toLowerCase())
      .maybeSingle<AllowedRow>(),
  ])

  if (accessResult.error || profileResult.error || allowedResult.error) return null

  const role = accessResult.data
  const profile = profileResult.data
  const allowed = allowedResult.data
  if (!role?.is_active || !profile?.completed_at || !profile.church_info_consent_at ||
      !profile.reference_age || profile.reference_age < 20 || profile.reference_age > 59 ||
      allowed?.status !== 'active' || !allowed.agreed_at) return null

  const scope: AccessRow = {
    churchPlaceId: role.church_place_id,
    churchName: role.church_name,
    department: role.department,
    verified_department: role.verified_department,
    is_active: role.is_active,
  }

  if (!isChurchDashboardTarget(scope) || !matchesChurchDashboardScope(scope, {
    churchPlaceId: profile.church_place_id,
    department: profile.church_department,
  }, scope.verified_department)) return null

  return { churchPlaceId: scope.churchPlaceId, churchName: scope.churchName, department: scope.department }
}
