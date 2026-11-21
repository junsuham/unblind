import type { Metadata } from 'next'
import { createServerSupabase } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import MissionRoom from './MissionRoom'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: '랜덤 미션 모임 | UNBLIND', robots: { index: false, follow: false } }

export default async function MissionRoomPage({ params }: PageProps<'/recreation/mission/[id]'>) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  let isHost = false
  if (user) {
    const { data } = await supabaseAdmin
      .from('recreation_mission_rooms')
      .select('host_user_id')
      .eq('id', id)
      .maybeSingle()
    isHost = data?.host_user_id === user.id
  }
  return <MissionRoom roomId={id} isHost={isHost} />
}
