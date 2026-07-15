import { useLocalSearchParams } from 'expo-router'
import { Screen } from '@/components/Screen'
import { BoardFeed } from '@/components/BoardFeed'
import { boardInfo } from '@/constants/content'

export default function BoardDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  if (!slug || !(slug in boardInfo)) return null

  return (
    <Screen>
      <BoardFeed slug={slug as keyof typeof boardInfo} showBack />
    </Screen>
  )
}
