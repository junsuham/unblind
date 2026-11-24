import type { Metadata } from 'next'
import { getCommunityRequestUser } from '@/lib/communityRequestUser'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import MissionRoom from './MissionRoom'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: '미션보드 · 랜덤 미션 | UNBLIND', robots: { index: false, follow: false } }

export default async function MissionRoomPage({ params }: PageProps<'/recreation/mission/[id]'>) {
  const { id } = await params
  // The shared helper reads the current server cookie when no bearer token is set.
  // Keep the organizer UI aligned with the API's approval check.
  const user = await getCommunityRequestUser(new Request('http://localhost/recreation/mission'))
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
