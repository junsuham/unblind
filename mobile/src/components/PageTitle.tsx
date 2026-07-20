import { Text, View } from 'react-native'
import { useAppTheme } from '@/constants/design'
import { Emoji3D, type Emoji3DName } from '@/components/Emoji3D'

export function PageTitle({ eyebrow, title, description, icon }: { eyebrow?: string; title: string; description?: string; icon?: Emoji3DName }) {
  const colors = useAppTheme()

  return (
    <View style={{ marginBottom: 20 }}>
      {eyebrow ? <Text style={{ color: colors.brand, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>{eyebrow}</Text> : null}
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
        {icon ? <Emoji3D name={icon} size={28} /> : null}
        <Text style={{ color: colors.text, fontSize: 27, fontWeight: '800', letterSpacing: -0.5 }}>{title}</Text>
      </View>
      {description ? <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 8 }}>{description}</Text> : null}
    </View>
  )
}
