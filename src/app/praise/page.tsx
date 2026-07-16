import { requireBetaUser } from '@/lib/betaAuth'
import PraiseRecommendations from './PraiseRecommendations'
import { AppShell, BottomTabBar, PageHeader } from '@/app/components/ui/AppShell'

export const dynamic = 'force-dynamic'

export default async function PraisePage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string }>
}) {
  const { supabase } = await requireBetaUser()
  const { track } = await searchParams
  const { data: tracks } = await supabase
    .from('top100_tracks')
    .select('youtube_id, title, artist')
    .eq('is_active', true)
    .order('rank', { ascending: true })
    .limit(100)

  return (
    <AppShell bottomBar={<BottomTabBar active="praise" />}>
      <PageHeader
        eyebrow="매주 새롭게 만나는 찬양"
        title="🎧 언블 TOP 100"
        description="청년의 일상과 예배에 함께할 찬양 100곡을 골랐어요. 재생 버튼을 누르면 이 화면에서 바로 들을 수 있습니다."
      />

      <PraiseRecommendations
        initialSongs={(tracks ?? []).map((track) => ({ id: track.youtube_id, title: track.title, artist: track.artist }))}
        initialTrackId={track}
      />
    </AppShell>
  )
}
