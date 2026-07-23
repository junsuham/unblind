import type { Metadata } from 'next'
import { requireBetaUser } from '@/lib/betaAuth'
import PraiseRecommendations from './PraiseRecommendations'
import { AppShell, BottomTabBar } from '@/app/components/ui/AppShell'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: '오・찬・추 | 언블라인드',
  description: '상황에 맞는 찬양을 찾고 매주 갱신되는 TOP50을 재생합니다.',
}

export default async function PraisePage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string; title?: string; artist?: string }>
}) {
  const { supabase } = await requireBetaUser()
  const { track, title, artist } = await searchParams
  const playableTrackId =
    typeof track === 'string' && /^[A-Za-z0-9_-]{6,20}$/.test(track)
      ? track
      : undefined
  const { data: tracks } = await supabase
    .from('top100_tracks')
    .select('youtube_id, title, artist')
    .eq('is_active', true)
    .order('rank', { ascending: true })
    .limit(50)

  return (
    <AppShell topTitle="오・찬・추" bottomBar={<BottomTabBar active="home" />}>
      <PraiseRecommendations
        initialSongs={(tracks ?? []).map((track) => ({ id: track.youtube_id, title: track.title, artist: track.artist }))}
        initialTrackId={playableTrackId}
        initialMentionSong={
          playableTrackId && typeof title === 'string'
            ? {
                id: playableTrackId,
                title: title.slice(0, 160),
                artist: (typeof artist === 'string' ? artist : 'YouTube').slice(0, 100),
              }
            : undefined
        }
      />
    </AppShell>
  )
}
