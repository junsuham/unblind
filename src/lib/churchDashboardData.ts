import 'server-only'

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { ChurchDashboardScope } from '@/lib/churchDashboardScope'
import {
  projectChurchDashboardSnapshot,
  type ChurchDashboardSnapshot,
  type ChurchDashboardSnapshotRow,
} from '@/lib/churchDashboardProjection'

export async function readChurchDashboardSnapshot(scope: ChurchDashboardScope): Promise<{
  snapshot: ChurchDashboardSnapshot | null
  error: boolean
}> {
  const { data, error } = await supabaseAdmin
    .from('church_dashboard_snapshots')
    .select('church_place_id, church_name, department, generated_at, member_count, attendance_count, prayer_contributor_count, prayer_minutes, care_pending_count, upcoming_event_count, attendance_weeks')
    .eq('church_place_id', scope.churchPlaceId)
    .eq('department', scope.department ?? '')
    .maybeSingle<ChurchDashboardSnapshotRow>()

  if (error) {
    console.error('church_dashboard_snapshot_read_failed', error.code)
    return { snapshot: null, error: true }
  }

  return {
    snapshot: data ? { ...projectChurchDashboardSnapshot(data), churchName: scope.churchName } : null,
    error: false,
  }
}
