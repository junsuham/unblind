import { Text, View } from 'react-native'
import { useAppTheme } from '@/constants/design'

export function PageTitle({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  const colors = useAppTheme()

  return (
    <View style={{ marginBottom: 20 }}>
      {eyebrow ? <Text style={{ color: colors.brand, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>{eyebrow}</Text> : null}
      <Text style={{ color: colors.text, fontSize: 27, fontWeight: '800', letterSpacing: -0.5 }}>{title}</Text>
      {description ? <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 8 }}>{description}</Text> : null}
    </View>
  )
}
