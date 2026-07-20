import { ActivityIndicator, View } from 'react-native'
import { useAppTheme } from '@/constants/design'

export function AppBootstrapScreen() {
  const colors = useAppTheme()

  return (
    <View
      accessibilityLabel="앱 준비 중"
      style={{
        alignItems: 'center',
        backgroundColor: colors.tabSurface,
        flex: 1,
        justifyContent: 'center',
      }}
    >
      <ActivityIndicator color={colors.brand} />
    </View>
  )
}
