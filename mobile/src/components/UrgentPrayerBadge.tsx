import { Text, View } from 'react-native'
import { Emoji3D } from '@/components/Emoji3D'
import { useAppTheme } from '@/constants/design'

export function UrgentPrayerBadge({ compact = false }: { compact?: boolean }) {
  const colors = useAppTheme()

  return (
    <View
      accessibilityLabel="긴급 중보기도 요청"
      style={{
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,59,48,0.12)',
        borderColor: 'rgba(255,59,48,0.28)',
        borderRadius: 999,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 4,
        paddingHorizontal: compact ? 7 : 9,
        paddingVertical: compact ? 2 : 4,
      }}
    >
      <Emoji3D name="siren" size={compact ? 16 : 20} />
      <Text style={{ color: colors.danger, fontSize: compact ? 10 : 12, fontWeight: '800' }}>
        긴급 중보
      </Text>
    </View>
  )
}
