import { useEffect, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native'
import { Screen } from '@/components/Screen'
import { PageTitle } from '@/components/PageTitle'
import { colors, radius } from '@/constants/design'
import { supabase } from '@/lib/supabase'

type Track = { id: string; rank: number; youtube_id: string; title: string; artist: string }

export default function PraiseScreen() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { supabase.from('top100_tracks').select('id, rank, youtube_id, title, artist').eq('is_active', true).order('rank').limit(100).then(({ data }) => { setTracks(data ?? []); setLoading(false) }) }, [])
  return (
    <Screen>
      <PageTitle eyebrow="매주 새롭게 만나는 찬양" title="🎧 언블 TOP 100" description="재생 버튼을 누르면 YouTube 앱 또는 브라우저에서 바로 들을 수 있습니다." />
      {loading ? <ActivityIndicator color={colors.brand} /> : <View style={{ gap: 8 }}>{tracks.map((track) => <Pressable key={track.id} onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${track.youtube_id}`)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.medium, backgroundColor: pressed ? colors.surfaceMuted : colors.surface, padding: 14 })}><Text style={{ width: 28, color: colors.brand, fontSize: 16, fontWeight: '800' }}>{track.rank}</Text><View style={{ flex: 1 }}><Text numberOfLines={1} style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>{track.title}</Text><Text numberOfLines={1} style={{ color: colors.textSecondary, fontSize: 12, marginTop: 3 }}>{track.artist}</Text></View><Text style={{ color: colors.brand, fontSize: 18 }}>▶</Text></Pressable>)}{!tracks.length ? <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: 30 }}>관리자 페이지에서 기본 100곡을 불러와주세요.</Text> : null}</View>}
    </Screen>
  )
}
