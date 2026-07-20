import { requireBetaUser } from '@/lib/betaAuth'
import PraiseRecommendations from './PraiseRecommendations'
import { AppShell, BottomTabBar, PageHeader } from '@/app/components/ui/AppShell'
import { Emoji3D } from '@/app/components/ui/Emoji3D'

export const dynamic = 'force-dynamic'

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
    .limit(100)

  return (
    <AppShell bottomBar={<BottomTabBar active="praise" />}>
      <PageHeader
        title={<span className="inline-flex items-center gap-2"><Emoji3D name="musicDisc" size={32} />오・찬・추</span>}
      />

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
