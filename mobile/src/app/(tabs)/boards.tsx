import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Screen } from '@/components/Screen'
import { PageTitle } from '@/components/PageTitle'
import { boardInfo } from '@/constants/content'
import { radius, useAppTheme } from '@/constants/design'

export default function BoardsScreen() {
  const colors = useAppTheme()
  return (
    <Screen>
      <PageTitle eyebrow="서로의 마음을 지키는 공간" title="게시판" description="필요한 공간을 골라 익명으로 이야기를 나눠보세요." />
      <View style={{ gap: 12 }}>
        {Object.entries(boardInfo).map(([slug, board]) => (
          <Pressable key={slug} onPress={() => router.push(`/board/${slug}`)} style={({ pressed }) => ({ borderRadius: radius.large, backgroundColor: pressed ? colors.surfaceMuted : colors.surface, padding: 18 })}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>{board.title}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 6 }}>{board.description}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  )
}
