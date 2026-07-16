import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, Text, useWindowDimensions, View } from 'react-native'
import { useFocusEffect, useLocalSearchParams } from 'expo-router'
import YoutubePlayer, { PLAYER_STATES } from 'react-native-youtube-iframe'
import { Screen } from '@/components/Screen'
import { PageTitle } from '@/components/PageTitle'
import { radius, useAppTheme } from '@/constants/design'
import { supabase } from '@/lib/supabase'

type Track = { id: string; rank: number; youtube_id: string; title: string; artist: string }

export default function PraiseScreen() {
  const colors = useAppTheme()
  const { width } = useWindowDimensions()
  const { track: requestedTrackId } = useLocalSearchParams<{ track?: string }>()
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)
  const [playing, setPlaying] = useState(false)
  const [playerError, setPlayerError] = useState<string | null>(null)
  const playerWidth = Math.max(200, width - 36)
  const playerHeight = Math.max(200, Math.round(playerWidth * 9 / 16))

  useEffect(() => {
    supabase
      .from('top100_tracks')
      .select('id, rank, youtube_id, title, artist')
      .eq('is_active', true)
      .order('rank')
      .limit(100)
      .then(({ data, error }) => {
        if (error) setPlayerError('찬양 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
        setTracks(data ?? [])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!requestedTrackId || !tracks.length) return

    const requestedTrack = tracks.find(
      (track) => track.youtube_id === requestedTrackId
    )

    if (requestedTrack) {
      const frame = requestAnimationFrame(() => {
        setPlayerError(null)
        setSelectedTrack(requestedTrack)
        setPlaying(true)
      })

      return () => cancelAnimationFrame(frame)
    }
  }, [requestedTrackId, tracks])

  useFocusEffect(
    useCallback(() => () => {
      setPlaying(false)
    }, [])
  )

  const playTrack = useCallback((track: Track) => {
    setPlayerError(null)
    setSelectedTrack(track)
    setPlaying(true)
  }, [])

  const playRandomNext = useCallback(() => {
    if (!tracks.length) return

    const candidates = selectedTrack
      ? tracks.filter((track) => track.id !== selectedTrack.id)
      : tracks
    const nextTrack = candidates[Math.floor(Math.random() * candidates.length)] ?? tracks[0]

    if (nextTrack) playTrack(nextTrack)
  }, [playTrack, selectedTrack, tracks])

  const handlePlayerState = useCallback((state: PLAYER_STATES) => {
    if (state === PLAYER_STATES.ENDED) {
      playRandomNext()
      return
    }

    if (state === PLAYER_STATES.PLAYING) setPlaying(true)
    if (state === PLAYER_STATES.PAUSED) setPlaying(false)
  }, [playRandomNext])

  const selectedRank = useMemo(
    () => tracks.findIndex((track) => track.id === selectedTrack?.id) + 1,
    [selectedTrack?.id, tracks]
  )

  return (
    <Screen>
      <PageTitle
        eyebrow="매주 새롭게 만나는 찬양"
        title="🎧 언블 TOP 100"
        description="목록을 누르면 앱 안의 YouTube 플레이어에서 재생됩니다. 한 곡이 끝나면 다음 곡을 무작위로 이어갑니다."
      />

      {selectedTrack ? (
        <View
          style={{
            backgroundColor: '#000000',
            borderRadius: radius.medium,
            marginBottom: 18,
            overflow: 'hidden',
          }}
        >
          <YoutubePlayer
            height={playerHeight}
            initialPlayerParams={{ controls: true, rel: false }}
            onChangeState={handlePlayerState}
            onError={() => {
              setPlaying(false)
              setPlayerError('이 영상은 앱 안에서 재생할 수 없습니다. YouTube에서 열어주세요.')
            }}
            play={playing}
            videoId={selectedTrack.youtube_id}
            webViewProps={{
              allowsInlineMediaPlayback: true,
              mediaPlaybackRequiresUserAction: false,
            }}
            width={playerWidth}
          />
          <View style={{ backgroundColor: colors.surfaceStrong, gap: 4, padding: 14 }}>
            <Text numberOfLines={1} style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>
              {selectedRank || selectedTrack.rank}위 · {selectedTrack.title}
            </Text>
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'space-between' }}>
              <Text numberOfLines={1} style={{ color: colors.textSecondary, flex: 1, fontSize: 12 }}>
                {selectedTrack.artist} · YouTube 제공
              </Text>
              <Pressable
                accessibilityLabel="YouTube 앱에서 열기"
                onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${selectedTrack.youtube_id}`)}
              >
                <Text style={{ color: colors.brand, fontSize: 12, fontWeight: '700' }}>YouTube에서 열기</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      {playerError ? (
        <Pressable
          onPress={() => selectedTrack && Linking.openURL(`https://www.youtube.com/watch?v=${selectedTrack.youtube_id}`)}
          style={{ backgroundColor: colors.surfaceStrong, borderRadius: radius.small, marginBottom: 14, padding: 14 }}
        >
          <Text style={{ color: colors.text, fontSize: 13, lineHeight: 19 }}>{playerError}</Text>
        </Pressable>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.brand} />
      ) : (
        <View style={{ gap: 8 }}>
          {tracks.map((track) => {
            const isSelected = selectedTrack?.id === track.id

            return (
              <Pressable
                accessibilityLabel={`${track.rank}위 ${track.title} 재생`}
                key={track.id}
                onPress={() => playTrack(track)}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  backgroundColor: pressed || isSelected ? colors.surfaceMuted : colors.surface,
                  borderColor: isSelected ? colors.brand : 'transparent',
                  borderRadius: radius.medium,
                  borderWidth: 1,
                  flexDirection: 'row',
                  gap: 12,
                  padding: 14,
                })}
              >
                <Text style={{ color: colors.brand, fontSize: 16, fontWeight: '800', width: 28 }}>{track.rank}</Text>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>{track.title}</Text>
                  <Text numberOfLines={1} style={{ color: colors.textSecondary, fontSize: 12, marginTop: 3 }}>{track.artist}</Text>
                </View>
                <Text style={{ color: colors.brand, fontSize: 12, fontWeight: '800' }}>
                  {isSelected && playing ? '재생 중' : '▶'}
                </Text>
              </Pressable>
            )
          })}
          {!tracks.length ? (
            <Text style={{ color: colors.textSecondary, padding: 30, textAlign: 'center' }}>
              등록된 찬양이 없습니다.
            </Text>
          ) : null}
        </View>
      )}
    </Screen>
  )
}
